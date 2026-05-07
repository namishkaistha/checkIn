import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../atoms/Button/Button';
import { PageLayout } from '../../templates/PageLayout/PageLayout';
import styles from './LandingPage.module.css';

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <PageLayout title={t('pages.landing.heading')}>
      <div className={styles.actions}>
        <Button fullWidth onClick={() => navigate('/check-in')}>
          {t('pages.landing.checkInButton')}
        </Button>
        <Button
          fullWidth
          variant="secondary"
          onClick={() => navigate('/register')}
        >
          {t('pages.landing.registerButton')}
        </Button>
      </div>
    </PageLayout>
  );
}

export default LandingPage;
