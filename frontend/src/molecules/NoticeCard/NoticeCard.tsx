import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../atoms/Card/Card';
import { BilingualText } from '../BilingualText/BilingualText';
import styles from './NoticeCard.module.css';

export type NoticeIconName = 'info' | 'help' | 'warning';

export interface NoticeCardProps {
  /** i18n key for the notice body copy. */
  bodyKey: string;
  /** Optional i18n key for a small heading rendered above the body. */
  headingKey?: string;
  /** Which inline SVG icon to render. Default `'info'`. */
  iconName?: NoticeIconName;
}

/**
 * The dashed-border "Notice: …" info card used throughout the wizard to
 * surface short, glance-able context (e.g. "We use your phone number to
 * find your record"). Wraps `Card tone="info"` with an icon column and a
 * bilingual body. Icons are inline SVG (no external dependency) and pick
 * their accessible label from i18n so screen readers announce them.
 */
export function NoticeCard({
  bodyKey,
  headingKey,
  iconName = 'info',
}: NoticeCardProps) {
  const { t } = useTranslation();
  const iconLabel = t(`molecules.noticeCard.iconLabel.${iconName}`);

  return (
    <Card tone="info" padding="md">
      <div className={styles.row}>
        <div className={styles.iconCol}>{renderIcon(iconName, iconLabel)}</div>
        <div className={styles.body}>
          {headingKey ? (
            <BilingualText tKey={headingKey} variant="label" />
          ) : null}
          <BilingualText tKey={bodyKey} variant="body-md" />
        </div>
      </div>
    </Card>
  );
}

function renderIcon(name: NoticeIconName, label: string): JSX.Element {
  // 24x24, stroked with currentColor (overridden to on-surface-variant
  // via CSS). aria-label makes the icon discoverable to AT; the SVG is
  // role="img" because the icons carry semantic meaning here.
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    role: 'img' as const,
    'aria-label': label,
    className: styles.icon,
  };
  switch (name) {
    case 'help':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 1-1 1.7v.5" />
          <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...common}>
          <path d="M12 3 2 20h20Z" />
          <path d="M12 10v4" />
          <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 11v5" />
          <circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

export default NoticeCard;
