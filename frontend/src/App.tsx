import { Link, Route, Routes, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * M3 router shell. Each route renders a placeholder; M4 will replace these
 * with real page components built from molecules + organisms.
 */

function PageStub({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  const params = useParams();
  return (
    <main style={{ padding: 'var(--space-5)' }}>
      <h1>{t(titleKey)}</h1>
      {params.id !== undefined ? (
        <p>
          <strong>id:</strong> {params.id}
        </p>
      ) : null}
      <p>
        <Link to="/">{t('app.home')}</Link>
      </p>
    </main>
  );
}

function LandingPage() {
  const { t } = useTranslation();
  return (
    <main style={{ padding: 'var(--space-5)' }}>
      <h1>{t('app.title')}</h1>
      <p>{t('pages.landing')}</p>
      <nav>
        <ul>
          <li>
            <Link to="/check-in">{t('pages.checkIn')}</Link>
          </li>
          <li>
            <Link to="/register">{t('pages.register')}</Link>
          </li>
          <li>
            <Link to="/confirm/example">{t('pages.confirmation')}</Link>
          </li>
          <li>
            <Link to="/approved/example">{t('pages.approved')}</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/check-in" element={<PageStub titleKey="pages.checkIn" />} />
      <Route path="/register" element={<PageStub titleKey="pages.register" />} />
      <Route
        path="/confirm/:id"
        element={<PageStub titleKey="pages.confirmation" />}
      />
      <Route
        path="/approved/:id"
        element={<PageStub titleKey="pages.approved" />}
      />
    </Routes>
  );
}
