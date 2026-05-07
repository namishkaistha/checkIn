import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ApiError, createUser } from '../../api';
import { ErrorBanner } from '../../molecules/ErrorBanner/ErrorBanner';
import { RegistrationForm } from '../../organisms/RegistrationForm/RegistrationForm';
import { PageLayout } from '../../templates/PageLayout/PageLayout';
import styles from './RegisterPage.module.css';

const RETURN_DELAY_MS = 1000;

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (fullName: string, phoneE164: string) => {
    setError(null);
    try {
      await createUser({ fullName, phoneNumber: phoneE164 });
      setSuccess(true);
      timerRef.current = window.setTimeout(() => {
        navigate('/');
      }, RETURN_DELAY_MS);
    } catch (err) {
      // 409 = duplicate phone. Surface a translated message rather than the
      // raw "Request failed with status 409".
      if (err instanceof ApiError && err.status === 409) {
        // Throw a typed error so RegistrationForm renders its own ErrorBanner
        // with a localized message.
        throw new Error(t('pages.register.errorDuplicate'));
      }
      throw err;
    }
  };

  return (
    <PageLayout title={t('pages.register.heading')}>
      {success ? (
        <p className={styles.success} role="status" aria-live="polite">
          {t('pages.register.success')}
        </p>
      ) : null}
      {error !== null ? <ErrorBanner message={error} /> : null}
      <RegistrationForm onSubmit={handleSubmit} />
    </PageLayout>
  );
}

export default RegisterPage;
