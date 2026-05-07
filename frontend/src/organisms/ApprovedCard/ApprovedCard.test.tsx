import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApprovedCard } from './ApprovedCard';

describe('ApprovedCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the heading and BagCount', () => {
    render(<ApprovedCard count={3} onReset={() => {}} />);
    expect(
      screen.getByRole('heading', { name: 'Checked in' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('bag-count')).toHaveTextContent('3 bags');
  });

  it('calls onReset when the Done button is clicked', async () => {
    vi.useRealTimers();
    const onReset = vi.fn();
    const user = userEvent.setup();
    render(<ApprovedCard count={1} onReset={onReset} />);
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('auto-fires onReset after the auto-timer elapses', async () => {
    const onReset = vi.fn();
    render(<ApprovedCard count={1} onReset={onReset} />);

    await act(async () => {
      vi.advanceTimersByTime(30_000);
      // Flush the queued microtask (onReset is scheduled via queueMicrotask
      // to avoid setState-during-render on the parent).
      await Promise.resolve();
    });
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('counts down the visible timer', () => {
    render(<ApprovedCard count={1} onReset={() => {}} />);
    expect(screen.getByText(/30/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByText(/25/)).toBeInTheDocument();
  });

  it('clears the interval on unmount so onReset is not fired post-unmount', () => {
    const onReset = vi.fn();
    const { unmount } = render(
      <ApprovedCard count={1} onReset={onReset} />,
    );
    unmount();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(onReset).not.toHaveBeenCalled();
  });
});
