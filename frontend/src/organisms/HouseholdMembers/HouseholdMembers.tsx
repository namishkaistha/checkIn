import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../atoms/Button/Button';
import { Spinner } from '../../atoms/Spinner/Spinner';
import { BilingualText } from '../../molecules/BilingualText/BilingualText';
import { ErrorBanner } from '../../molecules/ErrorBanner/ErrorBanner';
import { PersonRow } from '../../molecules/PersonRow/PersonRow';
import { PhoneNumberInput } from '../../molecules/PhoneNumberInput/PhoneNumberInput';
import { PrimaryActionBar } from '../../molecules/PrimaryActionBar/PrimaryActionBar';
import { useCheckInSession } from '../../state/CheckInSessionContext';
import type { User } from '../../api/types';
import styles from './HouseholdMembers.module.css';

export interface HouseholdMembersProps {
  /**
   * Called when the volunteer is done editing the household and wants to
   * advance. The page-level wrapper handles the actual `createBatch` call
   * and awaits this promise so the organism can show a loading state.
   */
  onContinue: () => Promise<void>;
  /**
   * Called when the volunteer wants to register a new person from the
   * household step. Receives an optional E.164 phone if one was just
   * being typed; empty string when triggered from the standalone link.
   */
  onRegisterRequest: (phone: string) => void;
}

/**
 * Wizard step 2 organism: lists the primary recipient (read-only) and
 * any already-added additional household members, with an inline
 * "Add another person" affordance that resolves a phone number to a
 * `User` and appends it to the session. The organism reads/writes
 * `CheckInSessionContext` directly so the page wrapper stays a thin
 * navigation shell.
 *
 * De-duplication is enforced at two levels: the context itself dedupes
 * by `User.id`, and this component proactively rejects adding the same
 * user as the primary recipient (with a clear in-component error) so
 * the volunteer sees a useful message instead of a silent no-op.
 */
export function HouseholdMembers({
  onContinue,
  onRegisterRequest,
}: HouseholdMembersProps) {
  const { t } = useTranslation();
  const idPrefix = useId();
  const inputId = `${idPrefix}-add-phone`;
  const {
    primaryUser,
    additionalUsers,
    addAdditional,
    removeAdditional,
  } = useCheckInSession();

  // Inline add-panel state. The panel is collapsed by default and toggled
  // open by the "Add another person" button. Each successful add closes
  // the panel; the volunteer can re-open it to add the next person.
  const [adding, setAdding] = useState(false);
  const [raw, setRaw] = useState('');
  const [e164, setE164] = useState<string | null>(null);
  const [resolved, setResolved] = useState<User | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [continueError, setContinueError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  if (primaryUser === null) {
    // Defensive: the page already redirects in this case, but if the
    // organism is mounted standalone (e.g. Storybook misuse) we render
    // nothing rather than throw — pages own routing.
    return null;
  }

  const resetAddPanel = () => {
    setRaw('');
    setE164(null);
    setResolved(null);
    setAddError(null);
  };

  const handleOpenAdd = () => {
    resetAddPanel();
    setAdding(true);
  };

  const handleCancelAdd = () => {
    resetAddPanel();
    setAdding(false);
  };

  const handleConfirmAdd = () => {
    if (resolved === null) return;
    if (resolved.id === primaryUser.id) {
      setAddError(t('organisms.householdMembers.duplicatePrimary'));
      return;
    }
    addAdditional(resolved);
    resetAddPanel();
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    removeAdditional(id);
  };

  const handleContinue = async () => {
    if (submittingRef.current) return;
    setContinueError(null);
    setSubmitting(true);
    submittingRef.current = true;
    try {
      await onContinue();
    } catch (err) {
      setContinueError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const canConfirmAdd = resolved !== null && resolved.id !== primaryUser.id;

  return (
    <div className={styles.wrapper}>
      {continueError !== null ? <ErrorBanner message={continueError} /> : null}

      <BilingualText
        as="h2"
        variant="headline-md"
        tKey="organisms.householdMembers.primaryHeading"
        className={styles.sectionHeading}
      />
      <PersonRow
        name={primaryUser.full_name}
        phoneNumber={primaryUser.phone_number}
      />

      {additionalUsers.length > 0 ? (
        <>
          <BilingualText
            as="h2"
            variant="headline-md"
            tKey="organisms.householdMembers.additionalHeading"
            className={styles.sectionHeading}
          />
          <ul className={styles.list}>
            {additionalUsers.map((u) => (
              <li key={u.id} className={styles.listItem}>
                <PersonRow name={u.full_name} phoneNumber={u.phone_number} />
                <div className={styles.removeRow}>
                  <Button
                    variant="secondary"
                    onClick={() => handleRemove(u.id)}
                    aria-label={t('organisms.householdMembers.removeSrLabel', {
                      name: u.full_name,
                    })}
                  >
                    {t('organisms.householdMembers.removeLabel')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {adding ? (
        <div className={styles.addPanel}>
          {addError !== null ? <ErrorBanner message={addError} /> : null}
          <PhoneNumberInput
            id={inputId}
            label={t('organisms.householdMembers.addPlaceholder')}
            value={raw}
            onChange={(next, parsed) => {
              setRaw(next);
              setE164(parsed);
              setResolved(null);
              setAddError(null);
            }}
            onResolve={(user) => setResolved(user)}
            onRegisterLink={() => {
              if (e164 !== null) onRegisterRequest(e164);
            }}
          />
          <div className={styles.addActions}>
            <Button variant="secondary" onClick={handleCancelAdd}>
              {t('organisms.householdMembers.addCancelLabel')}
            </Button>
            <Button onClick={handleConfirmAdd} disabled={!canConfirmAdd}>
              {t('organisms.householdMembers.addConfirmLabel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          onClick={handleOpenAdd}
          subLabel={t('organisms.householdMembers.addAnotherSubLabel')}
        >
          {t('organisms.householdMembers.addAnotherLabel')}
        </Button>
      )}

      <div className={styles.registerRow}>
        <Button variant="secondary" onClick={() => onRegisterRequest('')}>
          {t('organisms.householdMembers.registerLink')}
        </Button>
      </div>

      <PrimaryActionBar>
        <Button
          fullWidth
          onClick={() => void handleContinue()}
          disabled={submitting}
          subLabel={t('organisms.householdMembers.continueSubLabel')}
        >
          {submitting ? (
            <Spinner size="sm" label={t('atoms.spinner.loading')} />
          ) : (
            t('organisms.householdMembers.continueLabel')
          )}
        </Button>
      </PrimaryActionBar>
    </div>
  );
}

export default HouseholdMembers;
