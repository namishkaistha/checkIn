import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';
import { Spinner } from '../../atoms/Spinner/Spinner';
import { ErrorBanner } from '../../molecules/ErrorBanner/ErrorBanner';
import { PhoneNumberInput } from '../../molecules/PhoneNumberInput/PhoneNumberInput';
import styles from './RegistrationForm.module.css';

export interface RegistrationFormProps {
  /** Pre-filled phone (already in E.164) when triggered mid check-in. */
  initialPhone?: string;
  /**
   * Called with the trimmed full name and the parsed E.164 phone. The parent
   * owns the API call; throwing surfaces an inline ErrorBanner.
   */
  onSubmit: (fullName: string, phoneE164: string) => Promise<void>;
  /** Optional cancel button — only rendered when provided (modal context). */
  onCancel?: () => void;
}

export function RegistrationForm({
  initialPhone,
  onSubmit,
  onCancel,
}: RegistrationFormProps) {
  const { t } = useTranslation();
  const idPrefix = useId();
  const nameId = `${idPrefix}-name`;
  const phoneId = `${idPrefix}-phone`;

  const [fullName, setFullName] = useState('');
  const [phoneRaw, setPhoneRaw] = useState(initialPhone ?? '');
  // Track E.164 parse explicitly so we don't have to re-parse on every render.
  // PhoneNumberInput already runs `toE164` and hands us the result.
  const [phoneE164, setPhoneE164] = useState<string | null>(
    initialPhone ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const trimmedName = fullName.trim();
  const canSubmit =
    trimmedName.length > 0 && phoneE164 !== null && !submitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    if (!canSubmit) return;
    if (phoneE164 === null) return; // belt + suspenders for TS narrowing

    setError(null);
    setSubmitting(true);
    submittingRef.current = true;
    try {
      await onSubmit(trimmedName, phoneE164);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error !== null ? <ErrorBanner message={error} /> : null}

      <Input
        id={nameId}
        label={t('pages.register.fullNameLabel')}
        value={fullName}
        onChange={(value) => setFullName(value)}
        autoComplete="name"
        required
      />

      <PhoneNumberInput
        id={phoneId}
        label={t('pages.register.phoneLabel')}
        value={phoneRaw}
        onChange={(raw, e164) => {
          setPhoneRaw(raw);
          setPhoneE164(e164);
        }}
        autoLookup={false}
      />

      <div className={styles.actions}>
        {onCancel !== undefined ? (
          <Button variant="secondary" onClick={onCancel}>
            {t('pages.register.cancel')}
          </Button>
        ) : null}
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? (
            <Spinner size="sm" label={t('atoms.spinner.loading')} />
          ) : (
            t('pages.register.submit')
          )}
        </Button>
      </div>
    </form>
  );
}

export default RegistrationForm;
