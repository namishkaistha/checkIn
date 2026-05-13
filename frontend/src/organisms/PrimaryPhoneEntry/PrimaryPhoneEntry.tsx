import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../atoms/Button/Button';
import { ErrorBanner } from '../../molecules/ErrorBanner/ErrorBanner';
import { NoticeCard } from '../../molecules/NoticeCard/NoticeCard';
import { PhoneNumberInput } from '../../molecules/PhoneNumberInput/PhoneNumberInput';
import { PrimaryActionBar } from '../../molecules/PrimaryActionBar/PrimaryActionBar';
import type { User } from '../../api/types';
import styles from './PrimaryPhoneEntry.module.css';

export interface PrimaryPhoneEntryProps {
  /**
   * Called when the volunteer confirms they want to advance with the
   * resolved primary user. Only fires when a real `User` is in hand.
   */
  onContinue: (user: User) => void;
  /**
   * Called when the volunteer wants to register an unknown phone right now.
   * Receives the parsed E.164 phone so the registration form can pre-fill.
   */
  onRegisterRequest: (phone: string) => void;
}

/**
 * Wizard step 1 organism: collect the primary recipient's phone, resolve
 * it against the user lookup endpoint, and gate the Continue button on a
 * real `User`. Splits the original `CheckInForm` recipient-row behavior
 * into a single-purpose surface — additional household members are
 * handled separately by `HouseholdMembers`.
 */
export function PrimaryPhoneEntry({
  onContinue,
  onRegisterRequest,
}: PrimaryPhoneEntryProps) {
  const { t } = useTranslation();
  const idPrefix = useId();
  const inputId = `${idPrefix}-primary-phone`;

  const [raw, setRaw] = useState('');
  const [e164, setE164] = useState<string | null>(null);
  const [resolved, setResolved] = useState<User | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = resolved !== null;

  const handleContinue = () => {
    if (resolved === null) return;
    onContinue(resolved);
  };

  const handleRegister = () => {
    if (e164 === null) return;
    onRegisterRequest(e164);
  };

  return (
    <div className={styles.wrapper}>
      {error !== null ? <ErrorBanner message={error} /> : null}

      <PhoneNumberInput
        id={inputId}
        label={t('organisms.primaryPhoneEntry.phoneLabel')}
        value={raw}
        onChange={(next, parsed) => {
          setRaw(next);
          setE164(parsed);
          // Any input change invalidates the previous resolution; the
          // PhoneNumberInput will fire onResolve again once a new lookup
          // settles.
          setResolved(null);
          setNotFound(false);
        }}
        onResolve={(user) => {
          setResolved(user);
          setNotFound(user === null);
        }}
        onError={(err) => {
          setError(err instanceof Error ? err.message : String(err));
        }}
        onRegisterLink={handleRegister}
      />

      <NoticeCard bodyKey="organisms.primaryPhoneEntry.notice" iconName="info" />

      {notFound && e164 !== null ? (
        <div className={styles.registerRow}>
          <Button variant="secondary" onClick={handleRegister}>
            {t('organisms.primaryPhoneEntry.registerLink')}
          </Button>
        </div>
      ) : null}

      <PrimaryActionBar>
        <Button
          fullWidth
          disabled={!canContinue}
          onClick={handleContinue}
          subLabel={t('organisms.primaryPhoneEntry.continueSubLabel')}
        >
          {t('organisms.primaryPhoneEntry.continueLabel')}
        </Button>
      </PrimaryActionBar>
    </div>
  );
}

export default PrimaryPhoneEntry;
