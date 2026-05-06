import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLongPress } from './useLongPress';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('useLongPress', () => {
  it('progress advances toward 1 while holding', () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, durationMs: 1000 }),
    );

    act(() => {
      result.current.handlers.onPointerDown({ button: 0 } as never);
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.progress).toBeGreaterThan(0);
    expect(result.current.progress).toBeLessThan(1);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('does not double-fire on key auto-repeat', () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, durationMs: 500 }),
    );

    act(() => {
      result.current.handlers.onKeyDown({
        key: ' ',
        preventDefault: () => {},
      } as never);
    });
    // Simulate key auto-repeat firing again before completion.
    act(() => {
      result.current.handlers.onKeyDown({
        key: ' ',
        preventDefault: () => {},
      } as never);
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});
