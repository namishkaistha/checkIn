import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../atoms/Button/Button';
import { Card } from '../../atoms/Card/Card';
import { BilingualText } from '../../molecules/BilingualText/BilingualText';
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
    <section
      className={styles.card}
      aria-label={t('organisms.approvedCard.title')}
    >
      <div
        className={styles.iconWrap}
        role="img"
        aria-label={t('pages.approved.checkmarkLabel')}
      >
        {/* Large round green-tinted icon container holding a check mark.
            The wrapper provides the tinted disc; the SVG is purely
            decorative once the aria-label is read. */}
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          width="56"
          height="56"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M5 12.5 L10 17.5 L19 7.5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      <BilingualText
        as="h1"
        variant="display"
        align="center"
        tKey="organisms.approvedCard.title"
        className={styles.heading}
      />

      <BilingualText
        as="p"
        variant="body-lg"
        align="center"
        tKey="organisms.approvedCard.body"
        values={{ count }}
        className={styles.body}
      />

      <Card as="section" tone="info" padding="lg" className={styles.nextSteps}>
        <BilingualText
          as="h2"
          variant="headline-md"
          tKey="organisms.approvedCard.nextStepsTitle"
          className={styles.nextStepsTitle}
        />
        <BilingualText
          as="p"
          variant="body-md"
          tKey="organisms.approvedCard.nextStepsBody"
        />
      </Card>

      <p
        className={styles.timer}
        aria-live="off"
        data-testid="approved-auto-reset"
      >
        {t('pages.approved.autoReset', { seconds: secondsLeft })}
      </p>

      <Button
        onClick={onReset}
        fullWidth
        subLabel={t('pages.approved.done', { lng: 'es' })}
      >
        {t('pages.approved.done', { lng: 'en' })}
      </Button>
    </section>
  );
}

export default ApprovedCard;
