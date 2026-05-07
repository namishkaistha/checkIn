import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConfirmationCard } from './ConfirmationCard';

const cleanRow = {
  user: { id: 'u1', full_name: 'Jane Doe', phone_number: '+14155552671' },
  blocked: false,
  last_check_in_at: null,
};

const blockedRow = {
  user: { id: 'u2', full_name: 'John Smith', phone_number: '+12125551234' },
  blocked: true,
  last_check_in_at: '2026-04-29T14:00:00Z',
};

describe('ConfirmationCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders BagCount with rows.length and one PersonRow per row', () => {
    render(
      <ConfirmationCard
        rows={[cleanRow, blockedRow]}
        anyBlocked={true}
        onApprove={async () => {}}
      />,
    );
    expect(screen.getByTestId('bag-count')).toHaveTextContent('2 bags');
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('shows the blocked block when anyBlocked is true', () => {
    render(
      <ConfirmationCard
        rows={[blockedRow]}
        anyBlocked={true}
        onApprove={async () => {}}
      />,
    );
    expect(
      screen.getByText('One or more people checked in recently'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Approve anyway/ }),
    ).toBeInTheDocument();
  });

  it('shows the standard hold-to-approve button when no rows are blocked', () => {
    render(
      <ConfirmationCard
        rows={[cleanRow]}
        anyBlocked={false}
        onApprove={async () => {}}
      />,
    );
    expect(
      screen.getByRole('button', { name: /Volunteer: hold to approve/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('One or more people checked in recently'),
    ).not.toBeInTheDocument();
  });

  it('calls onApprove(false) on a successful long-press in the clean flow', async () => {
    const onApprove = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfirmationCard
        rows={[cleanRow]}
        anyBlocked={false}
        onApprove={onApprove}
      />,
    );

    const btn = screen.getByRole('button', {
      name: /Volunteer: hold to approve/,
    });
    fireEvent.pointerDown(btn, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    await vi.waitFor(() => {
      expect(onApprove).toHaveBeenCalledWith(false);
    });
  });

  it('calls onApprove(true) when the blocked variant is held', async () => {
    const onApprove = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfirmationCard
        rows={[blockedRow]}
        anyBlocked={true}
        onApprove={onApprove}
      />,
    );

    const btn = screen.getByRole('button', { name: /Approve anyway/ });
    fireEvent.pointerDown(btn, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    await vi.waitFor(() => {
      expect(onApprove).toHaveBeenCalledWith(true);
    });
  });

  it('renders an ErrorBanner when onApprove rejects', async () => {
    vi.useRealTimers();
    const onApprove = vi.fn().mockRejectedValue(new Error('Server fault'));
    render(
      <ConfirmationCard
        rows={[cleanRow]}
        anyBlocked={false}
        onApprove={onApprove}
      />,
    );

    const btn = screen.getByRole('button', {
      name: /Volunteer: hold to approve/,
    });
    fireEvent.pointerDown(btn, { button: 0 });
    // Use a real timeout long enough for the long-press default duration.
    await new Promise((r) => setTimeout(r, 1700));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Server fault');
    });
  });
});
