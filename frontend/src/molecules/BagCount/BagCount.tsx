import { useTranslation } from 'react-i18next';
import styles from './BagCount.module.css';

export interface BagCountProps {
  count: number;
}

/**
 * Big-print bag count display. Uses i18next plural rules (`label_one` /
 * `label_other`) so the EN/ES forms stay in sync without per-locale code.
 */
export function BagCount({ count }: BagCountProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.wrapper} data-testid="bag-count">
      <span className={styles.value}>
        {t('molecules.bagCount.label', { count })}
      </span>
    </div>
  );
}

export default BagCount;
