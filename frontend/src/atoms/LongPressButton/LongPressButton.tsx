import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLongPress } from '../../hooks/useLongPress';
import styles from './LongPressButton.module.css';

export type LongPressVariant = 'primary' | 'success';

export interface LongPressButtonProps {
  onLongPress: () => void;
  children: ReactNode;
  durationMs?: number;
  /** Optional accessible label override. Defaults to children text. */
  label?: string;
  disabled?: boolean;
  variant?: LongPressVariant;
}

const VARIANT_CLASS: Record<LongPressVariant, string> = {
  primary: styles.primary ?? '',
  success: styles.success ?? '',
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function LongPressButton({
  onLongPress,
  children,
  durationMs = 1500,
  label,
  disabled = false,
  variant = 'primary',
}: LongPressButtonProps) {
  const { t } = useTranslation();
  const reactId = useId();
  const hintId = `lpb-hint-${reactId}`;
  const reduced = usePrefersReducedMotion();

  const { handlers, progress, isHolding, isDone } = useLongPress({
    onLongPress,
    durationMs,
    disabled,
  });

  const classes = [styles.button, VARIANT_CLASS[variant]].filter(Boolean);

  const hintText = t('atoms.longPress.hint');
  const holdingText = t('atoms.longPress.holding');
  const visibleHint = reduced && isHolding ? holdingText : hintText;

  const style: CSSProperties = {
    ['--progress' as string]: String(progress),
    ['--duration-ms' as string]: `${durationMs}ms`,
  };

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onPointerDown={handlers.onPointerDown}
      onPointerUp={handlers.onPointerUp}
      onPointerLeave={handlers.onPointerLeave}
      onPointerCancel={handlers.onPointerCancel}
      onKeyDown={handlers.onKeyDown}
      onKeyUp={handlers.onKeyUp}
      aria-pressed={isHolding}
      aria-disabled={disabled || undefined}
      aria-describedby={hintId}
      aria-label={label}
      style={style}
    >
      <span
        className={`${styles.progress} ${isDone ? styles.done : ''}`}
        aria-hidden="true"
      />
      <span className={styles.label}>{children}</span>
      <span className={styles.hint} id={hintId}>
        {visibleHint}
      </span>
    </button>
  );
}

export default LongPressButton;
