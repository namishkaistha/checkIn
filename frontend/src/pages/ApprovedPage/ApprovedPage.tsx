import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError, getBatch } from '../../api';
import type { CheckInBatch, CheckInBatchApproved } from '../../api/types';
import { Button } from '../../atoms/Button/Button';
import { Spinner } from '../../atoms/Spinner/Spinner';
import { ErrorBanner } from '../../molecules/ErrorBanner/ErrorBanner';
import { ApprovedCard } from '../../organisms/ApprovedCard/ApprovedCard';
import { PageLayout } from '../../templates/PageLayout/PageLayout';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; batch: CheckInBatch | CheckInBatchApproved }
  | { kind: 'notFound' }
  | { kind: 'error'; message: string };

export function ApprovedPage() {
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
        setState({ kind: 'ready', batch });
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
  }, [id]);

  if (state.kind === 'loading') {
    return (
      <PageLayout>
        <Spinner size="lg" label={t('common.loading')} />
      </PageLayout>
    );
  }

  if (state.kind === 'notFound') {
    return (
      <PageLayout>
        <ErrorBanner message={t('common.error')} />
        <Button onClick={() => navigate('/')} fullWidth>
          {t('common.goHome')}
        </Button>
      </PageLayout>
    );
  }

  if (state.kind === 'error') {
    return (
      <PageLayout>
        <ErrorBanner message={state.message} />
        <Button onClick={() => navigate('/')} fullWidth>
          {t('common.goHome')}
        </Button>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <ApprovedCard
        count={state.batch.rows.length}
        onReset={() => navigate('/')}
      />
    </PageLayout>
  );
}

export default ApprovedPage;
