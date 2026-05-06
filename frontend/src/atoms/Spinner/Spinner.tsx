import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Spinner.module.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  label?: string;
  size?: SpinnerSize;
}

const SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: styles.sm ?? '',
  md: styles.md ?? '',
  lg: styles.lg ?? '',
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

export function Spinner({ label, size = 'md' }: SpinnerProps) {
  const { t } = useTranslation();
  const reduced = usePrefersReducedMotion();
  const text = label ?? t('atoms.spinner.loading');

  return (
    <span className={styles.wrapper} role="status" aria-live="polite">
      {reduced ? (
        <span className={styles.dots} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      ) : (
        <span
          className={`${styles.spinner} ${SIZE_CLASS[size]}`}
          aria-hidden="true"
        />
      )}
      <span className="visually-hidden">{text}</span>
    </span>
  );
}

export default Spinner;
