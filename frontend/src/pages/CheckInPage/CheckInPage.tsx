import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ApiError, createBatch, createUser } from '../../api';
import { CheckInForm } from '../../organisms/CheckInForm/CheckInForm';
import { RegistrationForm } from '../../organisms/RegistrationForm/RegistrationForm';
import { ErrorBanner } from '../../molecules/ErrorBanner/ErrorBanner';
import { PageLayout } from '../../templates/PageLayout/PageLayout';
import styles from './CheckInPage.module.css';

interface ModalState {
  isOpen: boolean;
  phone: string;
}

export function CheckInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [modal, setModal] = useState<ModalState>({ isOpen: false, phone: '' });
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  // Re-key the CheckInForm after a successful mid-flow registration so the
  // newly-registered phone gets re-looked-up. Without this, the cached
  // "notFound" state lingers and submit stays disabled.
  const [formKey, setFormKey] = useState(0);

  // Open / close the native <dialog>. We use showModal() for native a11y
  // (focus trap, ESC-to-close, inert page), and listen for the dialog's own
  // "close" event so user-initiated closes (ESC) sync our React state.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (modal.isOpen && !dlg.open) {
      dlg.showModal();
    } else if (!modal.isOpen && dlg.open) {
      dlg.close();
    }
  }, [modal.isOpen]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onClose = () => setModal((prev) => ({ ...prev, isOpen: false }));
    dlg.addEventListener('close', onClose);
    return () => dlg.removeEventListener('close', onClose);
  }, []);

  const handleSubmit = async (recipient: string, alsoFor: string[]) => {
    setError(null);
    try {
      const batch = await createBatch({
        pickedUpByPhone: recipient,
        alsoForPhones: alsoFor,
      });
      navigate(`/confirm/${batch.batch_id}`);
    } catch (err) {
      // Backend returns 404 when one of the supplied phones isn't registered.
      // Surface a translated message so the volunteer knows which one.
      if (err instanceof ApiError && err.status === 404) {
        const detail = err.detail;
        const phone =
          typeof detail === 'object' && detail !== null && 'phone_number' in detail
            ? String((detail as { phone_number: unknown }).phone_number)
            : '';
        setError(
          t('pages.checkIn.errorUserNotRegistered', { phone }),
        );
        return;
      }
      // Re-throw so CheckInForm renders its own banner with the message.
      throw err;
    }
  };

  const handleRegisterRequest = (phone: string) => {
    setModal({ isOpen: true, phone });
  };

  const handleModalSubmit = async (fullName: string, phoneE164: string) => {
    await createUser({ fullName, phoneNumber: phoneE164 });
    setModal({ isOpen: false, phone: '' });
    setFormKey((k) => k + 1);
  };

  const handleModalCancel = () => {
    setModal({ isOpen: false, phone: '' });
  };

  // Backstop ESC handler — most browsers handle this natively on <dialog>,
  // but we keep this for environments where the dialog polyfill isn't
  // available (jsdom).
  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleModalCancel();
    }
  };

  return (
    <PageLayout title={t('pages.checkIn.heading')}>
      {error !== null ? (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}
      <CheckInForm
        key={formKey}
        onSubmit={handleSubmit}
        onRegisterRequest={handleRegisterRequest}
      />

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="register-modal-heading"
        onKeyDown={handleDialogKeyDown}
      >
        {modal.isOpen ? (
          <div className={styles.dialogInner}>
            <h2 id="register-modal-heading" className={styles.dialogHeading}>
              {t('pages.checkIn.modalHeading')}
            </h2>
            <RegistrationForm
              initialPhone={modal.phone}
              onSubmit={handleModalSubmit}
              onCancel={handleModalCancel}
            />
          </div>
        ) : null}
      </dialog>
    </PageLayout>
  );
}

export default CheckInPage;
