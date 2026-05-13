import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { PrimaryPhoneEntry } from './PrimaryPhoneEntry';

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

describe('PrimaryPhoneEntry', () => {
  it('disables Continue until a real user resolves', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, RESOLVED_USER));
    const onContinue = vi.fn();
    const user = userEvent.setup();
    render(
      <PrimaryPhoneEntry
        onContinue={onContinue}
        onRegisterRequest={() => {}}
      />,
    );

    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    expect(continueBtn).toHaveAttribute('aria-disabled', 'true');

    await user.type(
      screen.getByLabelText(/Your phone number/i),
      '4155552671',
    );

    await waitFor(() => {
      expect(continueBtn).not.toHaveAttribute('aria-disabled');
    });
  });

  it('fires onContinue with the resolved user when clicked', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, RESOLVED_USER));
    const onContinue = vi.fn();
    const user = userEvent.setup();
    render(
      <PrimaryPhoneEntry
        onContinue={onContinue}
        onRegisterRequest={() => {}}
      />,
    );

    await user.type(
      screen.getByLabelText(/Your phone number/i),
      '4155552671',
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Continue/i }),
      ).not.toHaveAttribute('aria-disabled');
    });

    await user.click(screen.getByRole('button', { name: /Continue/i }));
    expect(onContinue).toHaveBeenCalledWith(RESOLVED_USER);
  });

  it('shows the Register link for an unregistered phone and forwards onRegisterRequest', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { detail: 'nope' }));
    const onRegisterRequest = vi.fn();
    const user = userEvent.setup();
    render(
      <PrimaryPhoneEntry
        onContinue={() => {}}
        onRegisterRequest={onRegisterRequest}
      />,
    );

    await user.type(
      screen.getByLabelText(/Your phone number/i),
      '2125551234',
    );

    // The standalone "Register this person" Button (separate from the
    // inline PhoneNumberInput register link).
    const registerBtn = await screen.findByRole('button', {
      name: 'Register this person',
    });
    await user.click(registerBtn);

    expect(onRegisterRequest).toHaveBeenCalledWith('+12125551234');
  });

  it('keeps Continue disabled for an unregistered phone', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { detail: 'nope' }));
    const onContinue = vi.fn();
    const user = userEvent.setup();
    render(
      <PrimaryPhoneEntry
        onContinue={onContinue}
        onRegisterRequest={() => {}}
      />,
    );

    await user.type(
      screen.getByLabelText(/Your phone number/i),
      '2125551234',
    );

    // Wait for the lookup to settle by waiting for the inline status.
    await screen.findAllByText(/Not registered yet/i);

    expect(
      screen.getByRole('button', { name: /Continue/i }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('has no a11y violations', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, RESOLVED_USER));
    const { container } = render(
      <PrimaryPhoneEntry
        onContinue={() => {}}
        onRegisterRequest={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
