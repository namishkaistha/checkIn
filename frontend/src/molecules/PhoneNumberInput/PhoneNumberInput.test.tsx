import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import {
  render,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { PhoneNumberInput } from './PhoneNumberInput';
import type { User } from '../../api/types';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = vi.fn();

function Harness(props: {
  initial?: string;
  autoLookup?: boolean;
  onResolve?: (user: User | null) => void;
  onRegisterLink?: () => void;
  onError?: (err: unknown) => void;
}) {
  const [value, setValue] = useState(props.initial ?? '');

  const passProps: React.ComponentProps<typeof PhoneNumberInput> = {
    id: 'phone',
    label: 'Phone number',
    value,
    onChange: (raw: string) => setValue(raw),
  };
  if (props.autoLookup !== undefined) passProps.autoLookup = props.autoLookup;
  if (props.onResolve !== undefined) passProps.onResolve = props.onResolve;
  if (props.onRegisterLink !== undefined)
    passProps.onRegisterLink = props.onRegisterLink;
  if (props.onError !== undefined) passProps.onError = props.onError;

  return <PhoneNumberInput {...passProps} />;
}

describe('PhoneNumberInput', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('formats the value as the user types', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(jsonResponse(404, { detail: 'nope' }));
    render(<Harness />);
    const input = screen.getByLabelText('Phone number');
    await user.type(input, '4155552671');
    expect(input).toHaveValue('(415) 555-2671');
  });

  it('triggers a debounced lookup on a valid number and shows the resolved name', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        id: 'u1',
        full_name: 'Jane Doe',
        phone_number: '+14155552671',
        created_at: '2026-01-01T00:00:00Z',
      }),
    );
    const user = userEvent.setup();
    const handle = vi.fn();
    render(<Harness onResolve={handle} />);
    await user.type(screen.getByLabelText('Phone number'), '4155552671');

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/users/lookup?phone=%2B14155552671');
    expect(handle).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: 'Jane Doe' }),
    );
  });

  it('shows "not registered" when lookup returns 404', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(404, { detail: 'User not found' }),
    );
    const user = userEvent.setup();
    const onResolve = vi.fn();
    render(<Harness onResolve={onResolve} />);
    await user.type(screen.getByLabelText('Phone number'), '2125551234');

    await waitFor(() => {
      expect(screen.getByText('Not registered yet')).toBeInTheDocument();
    });
    expect(onResolve).toHaveBeenCalledWith(null);
  });

  it('renders a register link when onRegisterLink is provided', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(404, { detail: 'User not found' }),
    );
    const user = userEvent.setup();
    const onRegisterLink = vi.fn();
    render(<Harness onRegisterLink={onRegisterLink} />);
    await user.type(screen.getByLabelText('Phone number'), '2125551234');

    const link = await screen.findByRole('button', {
      name: 'Register this person now',
    });
    await user.click(link);
    expect(onRegisterLink).toHaveBeenCalledTimes(1);
  });

  it('does not call fetch while the parsed number is incomplete', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText('Phone number'), '555');
    // Allow debounce timer to flush.
    await new Promise((r) => setTimeout(r, 400));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips the lookup entirely when autoLookup=false', async () => {
    const user = userEvent.setup();
    render(<Harness autoLookup={false} />);
    await user.type(screen.getByLabelText('Phone number'), '4155552671');
    await new Promise((r) => setTimeout(r, 400));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText('Looking up…')).not.toBeInTheDocument();
  });

  it('aborts the lookup and produces no warnings on unmount', async () => {
    // Hold the promise open so the component unmounts while it's pending.
    let abortReason: unknown = null;
    fetchMock.mockImplementationOnce((_url: string, init: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          abortReason = init.signal?.reason;
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<Harness />);
    await user.type(screen.getByLabelText('Phone number'), '4155552671');

    // Wait until the debounce fires fetch (controller is in flight).
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    await act(async () => {
      unmount();
      // Let the rejection propagate so any pending state updates would warn.
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(abortReason).not.toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('surfaces non-404 lookup errors via onError', async () => {
    const networkError = new TypeError('Failed to fetch');
    fetchMock.mockRejectedValueOnce(networkError);
    const onError = vi.fn();
    const user = userEvent.setup();
    render(<Harness onError={onError} />);
    await user.type(screen.getByLabelText('Phone number'), '4155552671');

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });
    expect(onError).toHaveBeenCalledWith(networkError);
    expect(screen.queryByText('Looking up…')).not.toBeInTheDocument();
  });

  it('logs lookup errors to console.error when no onError handler is provided', async () => {
    const networkError = new TypeError('Failed to fetch');
    fetchMock.mockRejectedValueOnce(networkError);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText('Phone number'), '4155552671');

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });
    consoleError.mockRestore();
  });

  it('has no a11y violations', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { detail: 'nope' }));
    const { container } = render(<Harness />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
