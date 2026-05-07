import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../atoms/Button/Button';
import { BagCount } from '../../molecules/BagCount/BagCount';
import styles from './ApprovedCard.module.css';

export interface ApprovedCardProps {
  count: number;
  /** Called when the volunteer dismisses, OR when the auto-timer fires. */
  onReset: () => void;
}

const AUTO_RESET_SECONDS = 30;

export function ApprovedCard({ count, onReset }: ApprovedCardProps) {
  const { t } = useTranslation();
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RESET_SECONDS);
  // Stash the onReset in a ref so the interval callback always sees the
  // latest function without forcing an effect re-subscribe per render.
  const onResetRef = useRef(onReset);
  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(tick);
          // Fire the reset on the next tick so we don't call setState on the
          // parent during this component's render commit cycle.
          queueMicrotask(() => onResetRef.current());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(tick);
    };
  }, []);

  return (
    <section className={styles.card} aria-labelledby="approved-heading">
      <div
        className={styles.checkmark}
        role="img"
        aria-label={t('pages.approved.checkmarkLabel')}
      >
        {/* SVG check mark — purely decorative once the aria-label is read. */}
        <svg
          viewBox="0 0 64 64"
          width="64"
          height="64"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="32" cy="32" r="30" fill="var(--color-success)" />
          <path
            d="M18 33 L28 43 L46 23"
            stroke="var(--color-success-fg)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      <h1 id="approved-heading" className={styles.heading}>
        {t('pages.approved.heading')}
      </h1>
      <BagCount count={count} />
      <p className={styles.timer} aria-live="off">
        {t('pages.approved.autoReset', { seconds: secondsLeft })}
      </p>
      <Button onClick={onReset} fullWidth>
        {t('pages.approved.done')}
      </Button>
    </section>
  );
}

export default ApprovedCard;
