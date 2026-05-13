import { useNavigate } from 'react-router-dom';
import { Button } from '../../atoms/Button/Button';
import { Card } from '../../atoms/Card/Card';
import { BilingualText } from '../../molecules/BilingualText/BilingualText';
import { PrimaryActionBar } from '../../molecules/PrimaryActionBar/PrimaryActionBar';
import { WizardStepHeader } from '../../molecules/WizardStepHeader/WizardStepHeader';
import { PageLayout } from '../../templates/PageLayout/PageLayout';
import styles from './CheckInPhonePage.module.css';

/**
 * Wizard step 1/4 — phone entry.
 *
 * M6d ships this as a placeholder so route plumbing + the session context
 * can land independently. The Continue button advances to the household
 * page without resolving a real user.
 */
// M6e: replace placeholder with PrimaryPhoneEntry organism that calls setPrimary
export function CheckInPhonePage() {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/check-in/household');
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
        <Card tone="default" padding="lg">
          <BilingualText tKey="wizard.shared.placeholderBody" variant="body-md" />
        </Card>
        <PrimaryActionBar>
          <Button fullWidth onClick={handleContinue} subLabel="Continuar">
            Continue
          </Button>
        </PrimaryActionBar>
      </div>
    </PageLayout>
  );
}

export default CheckInPhonePage;
