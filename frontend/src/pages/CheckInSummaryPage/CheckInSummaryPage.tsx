import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../atoms/Button/Button';
import { Card } from '../../atoms/Card/Card';
import { BilingualText } from '../../molecules/BilingualText/BilingualText';
import { PrimaryActionBar } from '../../molecules/PrimaryActionBar/PrimaryActionBar';
import { WizardStepHeader } from '../../molecules/WizardStepHeader/WizardStepHeader';
import { PageLayout } from '../../templates/PageLayout/PageLayout';
import styles from './CheckInSummaryPage.module.css';

/**
 * Wizard step 3/4 — order summary.
 *
 * M6d ships this as a placeholder. While `:batchId` is the literal string
 * `PLACEHOLDER` (or missing), no batch load is attempted — the page just
 * shows the placeholder body so the route is reachable from the household
 * step.
 */
export function CheckInSummaryPage() {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  const isPlaceholder = !batchId || batchId === 'PLACEHOLDER';

  const handleReady = () => {
    navigate(`/check-in/approve/${batchId ?? 'PLACEHOLDER'}`);
  };

  return (
    <PageLayout showBack={true}>
      <div className={styles.wrapper}>
        <WizardStepHeader
          current={3}
          total={4}
          titleKey="wizard.shared.title.summary"
        />
        {isPlaceholder ? (
          // M6e: load batch via getBatch and render CheckInSummary organism
          <Card tone="default" padding="lg">
            <BilingualText
              tKey="wizard.shared.placeholderBody"
              variant="body-md"
            />
          </Card>
        ) : (
          // M6e: load batch via getBatch and render CheckInSummary organism
          <Card tone="default" padding="lg">
            <BilingualText
              tKey="wizard.shared.placeholderBody"
              variant="body-md"
            />
          </Card>
        )}
        <PrimaryActionBar>
          <Button fullWidth onClick={handleReady} subLabel="Estoy listo">
            I am ready
          </Button>
        </PrimaryActionBar>
      </div>
    </PageLayout>
  );
}

export default CheckInSummaryPage;
