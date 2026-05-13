import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ApprovedCard } from './ApprovedCard';

describe('ApprovedCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the bilingual heading, body, and next-steps card', () => {
    render(<ApprovedCard count={3} onReset={() => {}} />);
    // The display heading renders both EN and ES segments via BilingualText.
    expect(
      screen.getByRole('heading', { level: 1, name: /Check-in Complete!/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('¡Registro completado!')).toBeInTheDocument();
    // Plural body resolves to "3 bags".
    expect(
      screen.getByText('You are all set for 3 bags today'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Estás listo para 3 bolsas hoy'),
    ).toBeInTheDocument();
    // Next-steps Card content.
    expect(
      screen.getByRole('heading', { level: 2, name: /Next steps/ }),
    ).toBeInTheDocument();
  });

  it('renders the singular body when count is 1', () => {
    render(<ApprovedCard count={1} onReset={() => {}} />);
    expect(
      screen.getByText('You are all set for 1 bag today'),
    ).toBeInTheDocument();
    expect(screen.getByText('Estás listo para 1 bolsa hoy')).toBeInTheDocument();
  });

  it('calls onReset when the Done button is clicked', async () => {
    vi.useRealTimers();
    const onReset = vi.fn();
    const user = userEvent.setup();
    render(<ApprovedCard count={1} onReset={onReset} />);
    // Button has subLabel "Listo" so accessible name combines both lines.
    await user.click(screen.getByRole('button', { name: /Done/ }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('has no a11y violations', async () => {
    vi.useRealTimers();
    const { container } = render(
      <ApprovedCard count={2} onReset={() => {}} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
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
