import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../atoms/Button/Button';
import { Card } from '../../atoms/Card/Card';
import { BilingualText } from '../../molecules/BilingualText/BilingualText';
import { PrimaryActionBar } from '../../molecules/PrimaryActionBar/PrimaryActionBar';
import { WizardStepHeader } from '../../molecules/WizardStepHeader/WizardStepHeader';
import { useCheckInSession } from '../../state/CheckInSessionContext';
import { PageLayout } from '../../templates/PageLayout/PageLayout';
import styles from './CheckInHouseholdPage.module.css';

/**
 * Wizard step 2/4 — household members.
 *
 * M6d ships this as a placeholder. The route guard already bounces users
 * back to the phone step if they reach this page without a primary user
 * in session; the `?dev=1` query string is a temporary escape hatch so
 * the page can be opened in isolation while M6e is still being wired up.
 */
export function CheckInHouseholdPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { primaryUser } = useCheckInSession();

  // M6e: remove dev escape — guard is real when phone page wires setPrimary
  const devEscape = searchParams.get('dev') === '1';

  if (!devEscape && primaryUser === null) {
    return <Navigate to="/check-in/phone" replace />;
  }

  const handleContinue = () => {
    // M6e: replace PLACEHOLDER with batch id from createBatch
    navigate('/check-in/summary/PLACEHOLDER');
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

export default CheckInHouseholdPage;
