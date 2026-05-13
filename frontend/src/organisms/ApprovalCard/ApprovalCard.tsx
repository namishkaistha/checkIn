import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../atoms/Card/Card';
import { LongPressButton } from '../../atoms/LongPressButton/LongPressButton';
import { BagCount } from '../../molecules/BagCount/BagCount';
import { BilingualText } from '../../molecules/BilingualText/BilingualText';
import { ErrorBanner } from '../../molecules/ErrorBanner/ErrorBanner';
import { PersonRow } from '../../molecules/PersonRow/PersonRow';
import styles from './ApprovalCard.module.css';

export interface ConfirmationRow {
  user: { id: string; full_name: string; phone_number: string };
  blocked: boolean;
  last_check_in_at?: string | null;
}

export interface ApprovalCardProps {
  rows: ConfirmationRow[];
  anyBlocked: boolean;
  /**
   * Called when the volunteer completes the long-press. We always pass an
   * `override` flag so the parent can hand it straight to `approveBatch`.
   * - normal flow: override=false
   * - blocked flow: override=true (the UI explicitly opts in)
   */
  onApprove: (override: boolean) => Promise<void>;
}

export function ApprovalCard({
  rows,
  anyBlocked,
  onApprove,
}: ApprovalCardProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleApprove = async (override: boolean) => {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      await onApprove(override);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <section className={styles.card} aria-labelledby="confirmation-bag-count">
      {error !== null ? <ErrorBanner message={error} /> : null}

      <div id="confirmation-bag-count">
        <BagCount count={rows.length} />
      </div>

      <ul className={styles.list}>
        {rows.map((row) => (
          <li key={row.user.id} className={styles.listItem}>
            <PersonRow
              name={row.user.full_name}
              phoneNumber={row.user.phone_number}
              blocked={row.blocked}
              lastCheckInAt={row.last_check_in_at ?? null}
            />
          </li>
        ))}
      </ul>

      {anyBlocked ? (
        <Card
          as="section"
          tone="warning"
          padding="lg"
          className={styles.blockedBlock}
        >
          <div role="region" aria-live="polite">
            <BilingualText
              as="h2"
              variant="headline-md"
              tKey="pages.confirmation.blockedHeading"
              className={styles.blockedHeading}
            />
            <BilingualText
              as="p"
              variant="body-md"
              tKey="pages.confirmation.blockedExplanation"
              className={styles.blockedExplanation}
            />
          </div>
          <LongPressButton
            variant="success"
            onLongPress={() => void handleApprove(true)}
            disabled={pending}
          >
            {t('pages.confirmation.approveAnyway')}
          </LongPressButton>
        </Card>
      ) : (
        <LongPressButton
          variant="primary"
          onLongPress={() => void handleApprove(false)}
          disabled={pending}
        >
          {t('pages.confirmation.holdToApprove')}
        </LongPressButton>
      )}
    </section>
  );
}

export default ApprovalCard;
