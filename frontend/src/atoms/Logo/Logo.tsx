import { useTranslation } from 'react-i18next';
import logoPng from '../../assets/c-w-logo.png';
import styles from './Logo.module.css';

export type LogoSize = 'sm' | 'md' | 'lg';

export interface LogoProps {
  /** Visual height: 32px (sm), 48px (md), 64px (lg). */
  size?: LogoSize;
}

const SIZE_CLASS: Record<LogoSize, string> = {
  sm: styles.sm ?? '',
  md: styles.md ?? '',
  lg: styles.lg ?? '',
};

/**
 * C&W Market Foundation logo. Renders the brand mark as an `<img>` with
 * localized alt text. Use `size="md"` (48px) in headers; `lg` is reserved
 * for hero/landing contexts.
 */
export function Logo({ size = 'md' }: LogoProps) {
  const { t } = useTranslation();
  return (
    <img
      className={`${styles.logo} ${SIZE_CLASS[size]}`}
      src={logoPng}
      alt={t('atoms.logo.alt')}
    />
  );
}

export default Logo;
