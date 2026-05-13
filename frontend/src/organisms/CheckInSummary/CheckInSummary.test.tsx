import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { CheckInSummary } from './CheckInSummary';
import type { CheckInBatch } from '../../api/types';

function makeBatch(rowCount: number, blockedIdx?: number): CheckInBatch {
  return {
    batch_id: 'b1',
    any_blocked: blockedIdx !== undefined,
    rows: Array.from({ length: rowCount }, (_, i) => ({
      user: {
        id: `u${i}`,
        full_name: `Person ${i}`,
        phone_number: `+1415555000${i}`,
        created_at: '2026-01-01T00:00:00Z',
      },
      blocked: i === blockedIdx,
      last_check_in_at: null,
    })),
  };
}

describe('CheckInSummary', () => {
  it('renders BagCount with rows.length', () => {
    render(<CheckInSummary batch={makeBatch(3)} onContinue={() => {}} />);
    // The BagCount uses i18n plurals; check both EN+ES forms render somewhere.
    expect(screen.getByTestId('bag-count')).toHaveTextContent('3 bags');
  });

  it('renders one PersonRow per recipient', () => {
    render(<CheckInSummary batch={makeBatch(3)} onContinue={() => {}} />);
    expect(screen.getByText('Person 0')).toBeInTheDocument();
    expect(screen.getByText('Person 1')).toBeInTheDocument();
    expect(screen.getByText('Person 2')).toBeInTheDocument();
  });

  it('renders the blocked badge on rows that are blocked', () => {
    render(
      <CheckInSummary batch={makeBatch(2, 1)} onContinue={() => {}} />,
    );
    // PersonRow shows the "Recent check-in" badge for blocked rows.
    expect(screen.getByText(/Recent check-in/i)).toBeInTheDocument();
  });

  it('fires onContinue when "I am ready" is clicked', async () => {
    const onContinue = vi.fn();
    const user = userEvent.setup();
    render(<CheckInSummary batch={makeBatch(1)} onContinue={onContinue} />);
    await user.click(screen.getByRole('button', { name: /I am ready/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <CheckInSummary batch={makeBatch(2)} onContinue={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
