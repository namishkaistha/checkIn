import { useTranslation } from 'react-i18next';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  /** 1-indexed current step. */
  current: number;
  /** Total step count (`aria-valuemax`). */
  total: number;
  /**
   * Optional override for the `aria-label`. Defaults to the localized
   * "Wizard progress" string.
   */
  label?: string;
}

/**
 * Accessible horizontal progress track. The visible fill is purely
 * decorative — `role="progressbar"` + `aria-valuenow` is what screen
 * readers announce. The fill width is computed from `current/total` and
 * clamped to [0, 100] %, so out-of-range props don't break the layout.
 */
export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const { t } = useTranslation();
  const safeTotal = total > 0 ? total : 1;
  const ratio = Math.max(0, Math.min(1, current / safeTotal));
  const percent = ratio * 100;
  const ariaLabel = label ?? t('atoms.progressBar.defaultLabel');

  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={safeTotal}
      aria-valuenow={current}
      aria-label={ariaLabel}
      className={styles.track}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );
}

export default ProgressBar;
