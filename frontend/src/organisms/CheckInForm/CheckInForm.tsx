import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../atoms/Button/Button';
import { Spinner } from '../../atoms/Spinner/Spinner';
import { ErrorBanner } from '../../molecules/ErrorBanner/ErrorBanner';
import { PhoneNumberInput } from '../../molecules/PhoneNumberInput/PhoneNumberInput';
import type { User } from '../../api/types';
import styles from './CheckInForm.module.css';

export interface CheckInFormProps {
  /**
   * Called when the volunteer submits the form. Receives the recipient's
   * E.164 phone plus the (already filtered) E.164 phones of every additional
   * person. The parent owns the API call and can throw to surface an error.
   */
  onSubmit: (
    pickedUpByPhone: string,
    alsoForPhones: string[],
  ) => Promise<void>;
  /** Open the mid-flow registration modal for an unknown phone. */
  onRegisterRequest: (phone: string) => void;
}

interface Row {
  /** Local id used as React key — survives reorder/remove. */
  uid: string;
  raw: string;
  e164: string | null;
  /**
   * Lookup state for this row. The recipient (index 0) and additional rows
   * both auto-lookup; we capture the result so we can require either
   * "resolved" or "empty" before enabling submit.
   */
  resolved: User | null;
  notFound: boolean;
}

function makeRow(): Row {
  return {
    uid: `row-${Math.random().toString(36).slice(2)}-${Date.now()}`,
    raw: '',
    e164: null,
    resolved: null,
    notFound: false,
  };
}

/**
 * The submit button enables once:
 *   - the recipient row parses to a valid E.164 AND was resolved (i.e. user
 *     exists in the system); and
 *   - every additional row is either fully resolved OR empty (empty rows
 *     are dropped at submit time).
 *
 * "Resolved" here intentionally means *exists* — we don't want a volunteer
 * to submit a batch with an unregistered phone and rely on the backend's
 * 404 to surface it. They should hit the inline "register now" link first.
 */
function canSubmit(rows: Row[]): boolean {
  const recipient = rows[0];
  if (!recipient) return false;
  if (recipient.e164 === null || recipient.resolved === null) return false;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const isEmpty = row.raw.trim() === '';
    if (isEmpty) continue;
    if (row.e164 === null || row.resolved === null) return false;
  }
  return true;
}

export function CheckInForm({ onSubmit, onRegisterRequest }: CheckInFormProps) {
  const { t } = useTranslation();
  const idPrefix = useId();
  const [rows, setRows] = useState<Row[]>(() => [makeRow()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const updateRow = (uid: string, patch: Partial<Row>) => {
    setRows((prev) =>
      prev.map((r) => (r.uid === uid ? { ...r, ...patch } : r)),
    );
  };

  const addRow = () => setRows((prev) => [...prev, makeRow()]);
  const removeRow = (uid: string) =>
    setRows((prev) => prev.filter((r) => r.uid !== uid));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    if (!canSubmit(rows)) return;

    const recipient = rows[0];
    if (!recipient || recipient.e164 === null) return;

    const others: string[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      if (r.raw.trim() === '') continue;
      if (r.e164 === null) continue;
      others.push(r.e164);
    }

    setError(null);
    setSubmitting(true);
    submittingRef.current = true;
    try {
      await onSubmit(recipient.e164, others);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const submitDisabled = !canSubmit(rows) || submitting;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error !== null ? <ErrorBanner message={error} /> : null}

      <ol className={styles.rows}>
        {rows.map((row, idx) => {
          const isRecipient = idx === 0;
          const inputId = `${idPrefix}-phone-${row.uid}`;
          const label = isRecipient
            ? t('pages.checkIn.recipientLabel')
            : t('pages.checkIn.additionalLabel', { n: idx + 1 });
          return (
            <li key={row.uid} className={styles.row}>
              <PhoneNumberInput
                id={inputId}
                label={label}
                value={row.raw}
                onChange={(raw, e164) =>
                  updateRow(row.uid, {
                    raw,
                    e164,
                    // Reset resolved/notFound whenever the input changes;
                    // PhoneNumberInput will re-lookup and call onResolve.
                    resolved: null,
                    notFound: false,
                  })
                }
                onResolve={(user) =>
                  updateRow(row.uid, {
                    resolved: user,
                    notFound: user === null,
                  })
                }
                onRegisterLink={() => {
                  if (row.e164 !== null) onRegisterRequest(row.e164);
                }}
              />
              {!isRecipient ? (
                <Button
                  variant="secondary"
                  onClick={() => removeRow(row.uid)}
                  aria-label={t('pages.checkIn.removeWithIndex', { n: idx + 1 })}
                >
                  {t('pages.checkIn.remove')}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={addRow}>
          {t('pages.checkIn.addAnother')}
        </Button>
        <Button type="submit" disabled={submitDisabled}>
          {submitting ? (
            <Spinner size="sm" label={t('atoms.spinner.loading')} />
          ) : (
            t('pages.checkIn.submit')
          )}
        </Button>
      </div>
    </form>
  );
}

export default CheckInForm;
