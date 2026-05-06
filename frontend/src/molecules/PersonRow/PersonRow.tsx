import { useTranslation } from 'react-i18next';
import styles from './PersonRow.module.css';

export interface PersonRowProps {
  name: string;
  phoneNumber: string;
  blocked?: boolean;
  /** ISO-8601 timestamp of the previous check-in. Currently informational. */
  lastCheckInAt?: string | null;
}

/**
 * Compact display of a resolved person. The blocked badge surfaces the
 * 7-day dedup state so volunteers can see at a glance which rows need
 * an override.
 */
export function PersonRow({
  name,
  phoneNumber,
  blocked = false,
  lastCheckInAt = null,
}: PersonRowProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.wrapper}>
      <div className={styles.text}>
        <span className={styles.name}>{name}</span>
        <span className={styles.phone}>{phoneNumber}</span>
        {lastCheckInAt !== null ? (
          <time className="visually-hidden" dateTime={lastCheckInAt}>
            {lastCheckInAt}
          </time>
        ) : null}
      </div>
      {blocked ? (
        <span className={styles.badge}>
          {t('molecules.personRow.blockedBadge')}
        </span>
      ) : null}
    </div>
  );
}

export default PersonRow;
