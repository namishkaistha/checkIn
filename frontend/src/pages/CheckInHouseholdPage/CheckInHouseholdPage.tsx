import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { createBatch } from '../../api/checkIns';
import { ErrorBanner } from '../../molecules/ErrorBanner/ErrorBanner';
import { WizardStepHeader } from '../../molecules/WizardStepHeader/WizardStepHeader';
import { HouseholdMembers } from '../../organisms/HouseholdMembers/HouseholdMembers';
import { useCheckInSession } from '../../state/CheckInSessionContext';
import { PageLayout } from '../../templates/PageLayout/PageLayout';
import styles from './CheckInHouseholdPage.module.css';

/**
 * Wizard step 2/4 — household members. Guards on the session: without a
 * primary user, redirect to the phone step. On continue, calls
 * `POST /check-ins` with the primary + additional phones, then navigates
 * to the summary step with the returned `batch_id`. Errors surface as an
 * inline `ErrorBanner` above the organism — the volunteer can retry
 * without losing the household list.
 */
export function CheckInHouseholdPage() {
  const navigate = useNavigate();
  const { primaryUser, additionalUsers } = useCheckInSession();
  const [error, setError] = useState<string | null>(null);

  if (primaryUser === null) {
    return <Navigate to="/check-in/phone" replace />;
  }

  const handleContinue = async () => {
    setError(null);
    try {
      const batch = await createBatch({
        pickedUpByPhone: primaryUser.phone_number,
        alsoForPhones: additionalUsers.map((u) => u.phone_number),
      });
      navigate(`/check-in/summary/${batch.batch_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      // Re-throw so HouseholdMembers can drop its in-flight loading state.
      throw err;
    }
  };

  const handleRegisterRequest = (phone: string) => {
    const query = phone === '' ? '' : `?phone=${encodeURIComponent(phone)}`;
    navigate(`/register${query}`);
  };

  return (
    <PageLayout showBack={true}>
      <div className={styles.wrapper}>
        <WizardStepHeader
          current={2}
          total={4}
          titleKey="wizard.shared.title.household"
          subtitleKey="wizard.shared.subtitle.household"
        />
        {error !== null ? <ErrorBanner message={error} /> : null}
        <HouseholdMembers
          onContinue={handleContinue}
          onRegisterRequest={handleRegisterRequest}
        />
      </div>
    </PageLayout>
  );
}

export default CheckInHouseholdPage;
