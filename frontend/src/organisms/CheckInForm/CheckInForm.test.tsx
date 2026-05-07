import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckInForm } from './CheckInForm';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const RESOLVED_USER = {
  id: 'u1',
  full_name: 'Jane Doe',
  phone_number: '+14155552671',
  created_at: '2026-01-01T00:00:00Z',
};

describe('CheckInForm', () => {
  it('disables submit until the recipient phone resolves to a known user', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, RESOLVED_USER));
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <CheckInForm onSubmit={onSubmit} onRegisterRequest={() => {}} />,
    );

    const submitBtn = screen.getByRole('button', { name: 'Continue' });
    expect(submitBtn).toHaveAttribute('aria-disabled', 'true');

    await user.type(
      screen.getByLabelText('Your phone number'),
      '4155552671',
    );

    await waitFor(() => {
      expect(submitBtn).not.toHaveAttribute('aria-disabled');
    });
  });

  it('submits with E.164 phones and drops empty additional rows', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, RESOLVED_USER));
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <CheckInForm onSubmit={onSubmit} onRegisterRequest={() => {}} />,
    );

    await user.type(
      screen.getByLabelText('Your phone number'),
      '4155552671',
    );
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Continue' }),
      ).not.toHaveAttribute('aria-disabled');
    });

    await user.click(
      screen.getByRole('button', { name: 'Add another person' }),
    );
    // Leave the new row blank — should be dropped from the submission.

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith('+14155552671', []);
  });

  it('lets the volunteer remove an additional row', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, RESOLVED_USER));
    const user = userEvent.setup();
    render(
      <CheckInForm onSubmit={async () => {}} onRegisterRequest={() => {}} />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Add another person' }),
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: /Remove person 2/ }));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('shows an ErrorBanner when onSubmit throws', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, RESOLVED_USER));
    const onSubmit = vi.fn().mockRejectedValue(new Error('Network down'));
    const user = userEvent.setup();
    render(
      <CheckInForm onSubmit={onSubmit} onRegisterRequest={() => {}} />,
    );

    await user.type(
      screen.getByLabelText('Your phone number'),
      '4155552671',
    );
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Continue' }),
      ).not.toHaveAttribute('aria-disabled');
    });
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    });
  });

  it('calls onRegisterRequest with the E.164 phone of an unknown number', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { detail: 'nope' }));
    const onRegisterRequest = vi.fn();
    const user = userEvent.setup();
    render(
      <CheckInForm
        onSubmit={async () => {}}
        onRegisterRequest={onRegisterRequest}
      />,
    );

    await user.type(
      screen.getByLabelText('Your phone number'),
      '2125551234',
    );

    const link = await screen.findByRole('button', {
      name: 'Register this person now',
    });
    await user.click(link);

    expect(onRegisterRequest).toHaveBeenCalledWith('+12125551234');
  });
});
