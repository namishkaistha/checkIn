import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ApiError,
  ApproveBlockedError,
  approveBatch,
  getBatch,
} from '../../api';
import type { CheckInBatch, CheckInBatchApproved } from '../../api/types';
// CheckInBatchApproved is used only inside isApproved's type guard.
import { Button } from '../../atoms/Button/Button';
import { Spinner } from '../../atoms/Spinner/Spinner';
import { ErrorBanner } from '../../molecules/ErrorBanner/ErrorBanner';
import { ApprovalCard } from '../../organisms/ApprovalCard/ApprovalCard';
import { PageLayout } from '../../templates/PageLayout/PageLayout';

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

export function ConfirmationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    if (!id) {
      setState({ kind: 'notFound' });
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    void (async () => {
      try {
        const batch = await getBatch(id, { signal: controller.signal });
        if (cancelled) return;
        if (isApproved(batch)) {
          // Already approved — bounce to the approved view rather than
          // letting the volunteer try to approve a second time.
          navigate(`/approved/${id}`, { replace: true });
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
  }, [id, navigate]);

  const handleApprove = async (override: boolean) => {
    if (!id) return;
    try {
      await approveBatch(id, { override });
      navigate(`/approved/${id}`);
    } catch (err) {
      if (err instanceof ApproveBlockedError) {
        // Server flipped a row to blocked between fetch and approve. Surface
        // the new rows so the volunteer can decide again.
        setState({
          kind: 'pending',
          batch: {
            batch_id: id,
            rows: err.rows,
            any_blocked: true,
          },
        });
        // Re-throw so the ApprovalCard's banner catches the message.
        throw err;
      }
      throw err;
    }
  };

  if (state.kind === 'loading') {
    return (
      <PageLayout title={t('pages.confirmation.heading')}>
        <Spinner size="lg" label={t('common.loading')} />
      </PageLayout>
    );
  }

  if (state.kind === 'notFound') {
    return (
      <PageLayout title={t('pages.confirmation.heading')}>
        <ErrorBanner message={t('common.error')} />
        <Button onClick={() => navigate('/')} fullWidth>
          {t('common.goHome')}
        </Button>
      </PageLayout>
    );
  }

  if (state.kind === 'error') {
    return (
      <PageLayout title={t('pages.confirmation.heading')}>
        <ErrorBanner message={state.message} />
        <Button onClick={() => navigate('/')} fullWidth>
          {t('common.goHome')}
        </Button>
      </PageLayout>
    );
  }

  // pending
  return (
    <PageLayout title={t('pages.confirmation.heading')}>
      <ApprovalCard
        rows={state.batch.rows}
        anyBlocked={state.batch.any_blocked}
        onApprove={handleApprove}
      />
    </PageLayout>
  );
}

export default ConfirmationPage;
