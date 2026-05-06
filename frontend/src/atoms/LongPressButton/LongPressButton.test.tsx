import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { LongPressButton } from './LongPressButton';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function getButton() {
  return screen.getByRole('button');
}

describe('LongPressButton', () => {
  it('fires onLongPress exactly once when held for the full duration', () => {
    const onLongPress = vi.fn();
    render(
      <LongPressButton onLongPress={onLongPress} durationMs={1500}>
        Confirm
      </LongPressButton>,
    );

    const btn = getButton();
    fireEvent.pointerDown(btn, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire when released before duration completes', () => {
    const onLongPress = vi.fn();
    render(
      <LongPressButton onLongPress={onLongPress} durationMs={1500}>
        Confirm
      </LongPressButton>,
    );

    const btn = getButton();
    fireEvent.pointerDown(btn, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(btn);
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('supports a re-press after early release', () => {
    const onLongPress = vi.fn();
    render(
      <LongPressButton onLongPress={onLongPress} durationMs={1000}>
        Confirm
      </LongPressButton>,
    );

    const btn = getButton();
    fireEvent.pointerDown(btn, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.pointerUp(btn);
    expect(onLongPress).not.toHaveBeenCalled();

    fireEvent.pointerDown(btn, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('keyboard hold (Space) for the duration triggers onLongPress', () => {
    const onLongPress = vi.fn();
    render(
      <LongPressButton onLongPress={onLongPress} durationMs={1500}>
        Confirm
      </LongPressButton>,
    );

    const btn = getButton();
    btn.focus();
    fireEvent.keyDown(btn, { key: ' ' });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', () => {
    const onLongPress = vi.fn();
    render(
      <LongPressButton onLongPress={onLongPress} durationMs={500} disabled>
        Confirm
      </LongPressButton>,
    );
    const btn = getButton();
    expect(btn).toHaveAttribute('aria-disabled', 'true');

    fireEvent.pointerDown(btn, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.keyDown(btn, { key: 'Enter' });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('reflects holding state via aria-pressed', () => {
    render(
      <LongPressButton onLongPress={() => {}} durationMs={1000}>
        Confirm
      </LongPressButton>,
    );
    const btn = getButton();
    expect(btn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.pointerDown(btn, { button: 0 });
    expect(btn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.pointerUp(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('has no a11y violations', async () => {
    vi.useRealTimers(); // axe needs real timers internally
    const { container } = render(
      <LongPressButton onLongPress={() => {}}>Confirm</LongPressButton>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
