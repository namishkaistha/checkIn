import { useTranslation } from 'react-i18next';
import { Button } from '../../atoms/Button/Button';
import { BagCount } from '../../molecules/BagCount/BagCount';
import { BilingualText } from '../../molecules/BilingualText/BilingualText';
import { NoticeCard } from '../../molecules/NoticeCard/NoticeCard';
import { PersonRow } from '../../molecules/PersonRow/PersonRow';
import { PrimaryActionBar } from '../../molecules/PrimaryActionBar/PrimaryActionBar';
import type { CheckInBatch } from '../../api/types';
import styles from './CheckInSummary.module.css';

export interface CheckInSummaryProps {
  /** The loaded (pending) check-in batch. */
  batch: CheckInBatch;
  /** Called when the volunteer is ready to hand the device over to staff. */
  onContinue: () => void;
}

/**
 * Wizard step 3 organism: read-only summary of a pending check-in batch.
 * Shows a giant bag count for the headline number, one row per recipient
 * (no Remove — blocked handling lives on the Approve page), and an
 * info-toned notice telling the volunteer to hand the phone over.
 *
 * The organism is intentionally context-free: the parent page handles
 * batch loading and passes the already-loaded batch via props. This
 * keeps the surface easy to test in isolation and easy to render in
 * Storybook without a fetch mock.
 */
export function CheckInSummary({ batch, onContinue }: CheckInSummaryProps) {
  const { t } = useTranslation();
  return (
    <section className={styles.wrapper} aria-labelledby="check-in-summary-bag">
      <div id="check-in-summary-bag">
        <BagCount count={batch.rows.length} />
      </div>

      <BilingualText
        as="h2"
        variant="headline-md"
        tKey="organisms.checkInSummary.recipientsHeading"
        className={styles.sectionHeading}
      />

      <ul className={styles.list}>
        {batch.rows.map((row) => (
          <li key={row.user.id}>
            <PersonRow
              name={row.user.full_name}
              phoneNumber={row.user.phone_number}
              blocked={row.blocked}
              lastCheckInAt={row.last_check_in_at}
            />
          </li>
        ))}
      </ul>

      <NoticeCard
        bodyKey="organisms.checkInSummary.handToVolunteer"
        iconName="info"
      />

      <PrimaryActionBar>
        <Button
          fullWidth
          onClick={onContinue}
          subLabel={t('organisms.checkInSummary.readySubLabel')}
        >
          {t('organisms.checkInSummary.readyLabel')}
        </Button>
      </PrimaryActionBar>
    </section>
  );
}

export default CheckInSummary;
