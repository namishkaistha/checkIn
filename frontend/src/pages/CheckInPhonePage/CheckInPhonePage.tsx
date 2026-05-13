import { useNavigate } from 'react-router-dom';
import { WizardStepHeader } from '../../molecules/WizardStepHeader/WizardStepHeader';
import { PrimaryPhoneEntry } from '../../organisms/PrimaryPhoneEntry/PrimaryPhoneEntry';
import { useCheckInSession } from '../../state/CheckInSessionContext';
import { PageLayout } from '../../templates/PageLayout/PageLayout';
import type { User } from '../../api/types';
import styles from './CheckInPhonePage.module.css';

/**
 * Wizard step 1/4 — phone entry. Wires `PrimaryPhoneEntry` to the
 * session context and to wizard navigation. On a successful resolve,
 * stores the user as the primary recipient and advances to the
 * household step; an unregistered phone short-circuits to the
 * registration page with the typed phone pre-filled.
 */
export function CheckInPhonePage() {
  const navigate = useNavigate();
  const { setPrimary } = useCheckInSession();

  const handleContinue = (user: User) => {
    setPrimary(user);
    navigate('/check-in/household');
  };

  const handleRegisterRequest = (phone: string) => {
    navigate(`/register?phone=${encodeURIComponent(phone)}`);
  };

  return (
    <PageLayout showBack={false}>
      <div className={styles.wrapper}>
        <WizardStepHeader
          current={1}
          total={4}
          titleKey="wizard.shared.title.phone"
          subtitleKey="wizard.shared.subtitle.phone"
        />
        <PrimaryPhoneEntry
          onContinue={handleContinue}
          onRegisterRequest={handleRegisterRequest}
        />
      </div>
    </PageLayout>
  );
}

export default CheckInPhonePage;
