import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js';
import { Input } from '../../atoms/Input/Input';
import { Spinner } from '../../atoms/Spinner/Spinner';
import { lookupUser } from '../../api/users';
import type { User } from '../../api/types';
import styles from './PhoneNumberInput.module.css';

export interface PhoneNumberInputProps {
  id: string;
  label: string;
  value: string;
  /** Fires with the raw user-typed string and the E.164 form (or null when invalid). */
  onChange: (raw: string, e164: string | null) => void;
  /** Fires when an auto-lookup completes (or aborts to null on 404). */
  onResolve?: (user: User | null) => void;
  /**
   * If provided, an inline "Register this person now" link is rendered when
   * the lookup returns null. Click handling is delegated to the parent.
   */
  onRegisterLink?: () => void;
  /** Fires when the lookup fails (network down, 5xx, etc.). 404 is not an error. */
  onError?: (err: unknown) => void;
  /** Default: true. Set false on the registration form (no lookup needed). */
  autoLookup?: boolean;
  error?: string;
}

const LOOKUP_DEBOUNCE_MS = 300;
const REGION = 'US';

/**
 * Compute E.164 form for the raw input, returning null if it doesn't parse
 * as a valid US number. We default to the `US` region so 10-digit local
 * inputs are accepted, matching the backend's normalization.
 */
function toE164(raw: string): string | null {
  const parsed = parsePhoneNumberFromString(raw, REGION);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.format('E.164');
}

/**
 * Format-as-you-type using libphonenumber's `AsYouType`. Pure function so
 * tests can verify formatting without a controlled-component wrapper.
 */
export function formatAsYouType(raw: string): string {
  return new AsYouType(REGION).input(raw);
}

type LookupState =
  | { kind: 'idle' }
  | { kind: 'looking' }
  | { kind: 'resolved'; user: User }
  | { kind: 'notFound' };

export function PhoneNumberInput({
  id,
  label,
  value,
  onChange,
  onResolve,
  onRegisterLink,
  onError,
  autoLookup = true,
  error,
}: PhoneNumberInputProps) {
  const { t } = useTranslation();
  const [lookupState, setLookupState] = useState<LookupState>({ kind: 'idle' });

  // Track an in-flight controller so we can abort on input change / unmount
  // — this is what keeps "state update on unmounted component" warnings out
  // of the test runner.
  const controllerRef = useRef<AbortController | null>(null);
  // Track latest e164 so the closure inside setTimeout always reads the
  // current target — avoids stale-closure firings when typing fast.
  const latestE164Ref = useRef<string | null>(null);

  // Keep onResolve current without forcing the lookup effect to re-run on
  // every parent render that hands us a fresh callback identity.
  const onResolveRef = useRef(onResolve);
  useEffect(() => {
    onResolveRef.current = onResolve;
  }, [onResolve]);

  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const e164 = toE164(value);
  latestE164Ref.current = e164;

  useEffect(() => {
    if (!autoLookup) {
      setLookupState({ kind: 'idle' });
      return;
    }
    // Cancel any in-flight request when the input changes.
    controllerRef.current?.abort();
    controllerRef.current = null;

    if (e164 === null) {
      setLookupState({ kind: 'idle' });
      return;
    }

    setLookupState({ kind: 'looking' });
    const controller = new AbortController();
    controllerRef.current = controller;

    const timer = window.setTimeout(() => {
      // If the user kept typing, e164 may have moved on — only lookup the
      // value that's still current.
      if (latestE164Ref.current !== e164) return;

      void lookupUser(e164, { signal: controller.signal })
        .then((user) => {
          if (controller.signal.aborted) return;
          if (user === null) {
            setLookupState({ kind: 'notFound' });
          } else {
            setLookupState({ kind: 'resolved', user });
          }
          onResolveRef.current?.(user);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setLookupState({ kind: 'idle' });
          if (onErrorRef.current) {
            onErrorRef.current(err);
          } else {
            // Don't fail silently when nobody's listening — at least log it.
            console.error('PhoneNumberInput lookup failed:', err);
          }
        });
    }, LOOKUP_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [e164, autoLookup]);

  // Final unmount guard: abort any in-flight request even if the effect
  // cleanup above already ran.
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const handleChange = (next: string) => {
    const formatted = formatAsYouType(next);
    onChange(formatted, toE164(formatted));
  };

  const inputProps: React.ComponentProps<typeof Input> = {
    id,
    label,
    value,
    onChange: handleChange,
    type: 'tel',
    autoComplete: 'tel',
  };
  if (error !== undefined) inputProps.error = error;

  return (
    <div className={styles.wrapper}>
      <Input {...inputProps} />
      <div className={styles.status} aria-live="polite">
        {lookupState.kind === 'looking' ? (
          <span className={styles.looking}>
            <Spinner size="sm" label={t('molecules.phoneNumberInput.looking')} />
          </span>
        ) : null}

        {lookupState.kind === 'resolved' ? (
          <span className={styles.resolved}>{lookupState.user.full_name}</span>
        ) : null}

        {lookupState.kind === 'notFound' ? (
          <span className={styles.notFound}>
            {t('molecules.phoneNumberInput.notRegistered')}
            {onRegisterLink !== undefined ? (
              <>
                {' '}
                <button
                  type="button"
                  className={styles.registerLink}
                  onClick={onRegisterLink}
                >
                  {t('molecules.phoneNumberInput.registerLink')}
                </button>
              </>
            ) : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default PhoneNumberInput;
