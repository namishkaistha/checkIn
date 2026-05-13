import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError, getBatch } from '../../api';
import type { CheckInBatch, CheckInBatchApproved } from '../../api/types';
import { Button } from '../../atoms/Button/Button';
import { Spinner } from '../../atoms/Spinner/Spinner';
import { ErrorBanner } from '../../molecules/ErrorBanner/ErrorBanner';
import { WizardStepHeader } from '../../molecules/WizardStepHeader/WizardStepHeader';
import { CheckInSummary } from '../../organisms/CheckInSummary/CheckInSummary';
import { PageLayout } from '../../templates/PageLayout/PageLayout';
import styles from './CheckInSummaryPage.module.css';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'pending'; batch: CheckInBatch }
  | { kind: 'notFound' }
  | { kind: 'error'; message: string };

function isApproved(
  b: CheckInBatch | CheckInBatchApproved,
): b is CheckInBatchApproved {
  return 'approved_at' in b;
}

/**
 * Wizard step 3/4 — pending batch summary. Loads the batch by id from
 * the URL, mirrors the loading/error/redirect-if-approved pattern of
 * `CheckInApprovePage`, then hands a real `CheckInBatch` to the
 * `CheckInSummary` organism. The "I am ready" button advances to the
 * approve step.
 */
export function CheckInSummaryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    if (!batchId) {
      setState({ kind: 'notFound' });
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    void (async () => {
      try {
        const batch = await getBatch(batchId, { signal: controller.signal });
        if (cancelled) return;
        if (isApproved(batch)) {
          // Already approved — skip both summary and approve steps.
          navigate(`/approved/${batchId}`, { replace: true });
          return;
        }
        setState({ kind: 'pending', batch });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof ApiError && err.status === 404) {
          setState({ kind: 'notFound' });
          return;
        }
        setState({
          kind: 'error',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [batchId, navigate]);

  const header = (
    <WizardStepHeader
      current={3}
      total={4}
      titleKey="wizard.shared.title.summary"
    />
  );

  if (state.kind === 'loading') {
    return (
      <PageLayout showBack={true}>
        <div className={styles.wrapper}>
          {header}
          <Spinner size="lg" label={t('common.loading')} />
        </div>
      </PageLayout>
    );
  }

  if (state.kind === 'notFound' || state.kind === 'error') {
    const message =
      state.kind === 'error' ? state.message : t('common.error');
    return (
      <PageLayout showBack={true}>
        <div className={styles.wrapper}>
          {header}
          <ErrorBanner message={message} />
          <Button onClick={() => navigate('/check-in/phone')} fullWidth>
            {t('common.goHome')}
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showBack={true}>
      <div className={styles.wrapper}>
        {header}
        <CheckInSummary
          batch={state.batch}
          onContinue={() => navigate(`/check-in/approve/${batchId}`)}
        />
      </div>
    </PageLayout>
  );
}

export default CheckInSummaryPage;
