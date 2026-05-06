import { useTranslation } from 'react-i18next';
import styles from './ErrorBanner.module.css';

export interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

/**
 * Inline error message that's announced to screen readers via role="alert".
 * Pair with `aria-live="assertive"` (implicit on role=alert) for transient
 * failures that need immediate attention.
 */
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.wrapper} role="alert">
      <span className={styles.message}>{message}</span>
      {onDismiss !== undefined ? (
        <button
          type="button"
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label={t('molecules.errorBanner.dismiss')}
        >
          {/* Visible glyph; aria-label provides the accessible name. */}
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </div>
  );
}

export default ErrorBanner;
