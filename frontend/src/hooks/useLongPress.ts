import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

export interface UseLongPressOptions {
  onLongPress: () => void;
  durationMs?: number;
  disabled?: boolean;
}

export interface UseLongPressHandlers {
  onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  onPointerLeave: (e: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  onKeyUp: (e: KeyboardEvent<HTMLElement>) => void;
}

export interface UseLongPressResult {
  handlers: UseLongPressHandlers;
  /** 0 to 1 progress while held; 0 when idle. */
  progress: number;
  isHolding: boolean;
  /** Briefly true after a successful trigger (~200ms). */
  isDone: boolean;
}

const PROGRESS_TICK_MS = 16; // ~60fps
const DONE_FLASH_MS = 200;
const DEFAULT_DURATION_MS = 1500;

/**
 * Pointer + keyboard long-press hook. Calls `onLongPress` exactly once when
 * the user has held activation for `durationMs`. Cancels on early release.
 */
export function useLongPress({
  onLongPress,
  durationMs = DEFAULT_DURATION_MS,
  disabled = false,
}: UseLongPressOptions): UseLongPressResult {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const startedAtRef = useRef<number | null>(null);
  const triggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyHeldRef = useRef(false);

  // Keep latest callback in a ref so timers don't capture a stale closure.
  const callbackRef = useRef(onLongPress);
  useEffect(() => {
    callbackRef.current = onLongPress;
  }, [onLongPress]);

  const clearTimers = useCallback(() => {
    if (triggerTimerRef.current !== null) {
      clearTimeout(triggerTimerRef.current);
      triggerTimerRef.current = null;
    }
    if (tickTimerRef.current !== null) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    startedAtRef.current = null;
    setIsHolding(false);
    setProgress(0);
  }, [clearTimers]);

  const start = useCallback(() => {
    if (disabled) return;
    if (startedAtRef.current !== null) return; // already pressing

    startedAtRef.current = Date.now();
    setIsHolding(true);
    setProgress(0);
    setIsDone(false);

    triggerTimerRef.current = setTimeout(() => {
      clearTimers();
      startedAtRef.current = null;
      setIsHolding(false);
      setProgress(1);
      setIsDone(true);
      callbackRef.current();

      doneTimerRef.current = setTimeout(() => {
        setIsDone(false);
        setProgress(0);
      }, DONE_FLASH_MS);
    }, durationMs);

    tickTimerRef.current = setInterval(() => {
      const startedAt = startedAtRef.current;
      if (startedAt === null) return;
      const elapsed = Date.now() - startedAt;
      const next = Math.min(1, elapsed / durationMs);
      setProgress(next);
    }, PROGRESS_TICK_MS);
  }, [disabled, durationMs, clearTimers]);

  const cancel = useCallback(() => {
    if (startedAtRef.current === null) return;
    reset();
  }, [reset]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      clearTimers();
      if (doneTimerRef.current !== null) {
        clearTimeout(doneTimerRef.current);
        doneTimerRef.current = null;
      }
    };
  }, [clearTimers]);

  // If `disabled` flips on mid-press, cancel.
  useEffect(() => {
    if (disabled) reset();
  }, [disabled, reset]);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (disabled) return;
      // Only main pointer (left mouse, single touch).
      if (e.button !== undefined && e.button !== 0) return;
      start();
    },
    [disabled, start],
  );

  const onPointerUp = useCallback(() => cancel(), [cancel]);
  const onPointerLeave = useCallback(() => cancel(), [cancel]);
  const onPointerCancel = useCallback(() => cancel(), [cancel]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (disabled) return;
      if (e.key !== ' ' && e.key !== 'Enter') return;
      // Browsers auto-repeat keydown; only the first one starts the timer.
      if (keyHeldRef.current) {
        e.preventDefault();
        return;
      }
      keyHeldRef.current = true;
      e.preventDefault();
      start();
    },
    [disabled, start],
  );

  const onKeyUp = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      keyHeldRef.current = false;
      cancel();
    },
    [cancel],
  );

  return {
    handlers: {
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerCancel,
      onKeyDown,
      onKeyUp,
    },
    progress,
    isHolding,
    isDone,
  };
}

export default useLongPress;
