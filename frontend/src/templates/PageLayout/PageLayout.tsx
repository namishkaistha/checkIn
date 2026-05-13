import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  LanguageToggle,
  type Language,
} from '../../atoms/LanguageToggle/LanguageToggle';
import { Logo } from '../../atoms/Logo/Logo';
import styles from './PageLayout.module.css';

export interface PageLayoutProps {
  children: ReactNode;
  /** Optional page heading rendered inside <main>. */
  title?: string;
  /** When true, renders a Back button in the header (used on wizard pages 2+). */
  showBack?: boolean;
}

/**
 * Site shell for every page. Owns the header (logo + brand + optional Back
 * button + LanguageToggle) and renders children inside the <main> landmark.
 * Only one <main> on the page so this template MUST NOT be nested.
 */
export function PageLayout({
  children,
  title,
  showBack = false,
}: PageLayoutProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  // i18next stores the current language as a string — narrow it to our
  // controlled type. Anything else falls back to English so the toggle has a
  // valid checked state instead of erroring.
  const current: Language =
    i18n.resolvedLanguage === 'es' || i18n.language === 'es' ? 'es' : 'en';

  const handleLanguageChange = (lang: Language) => {
    void i18n.changeLanguage(lang);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            {showBack ? (
              <button
                type="button"
                className={styles.backButton}
                onClick={handleBack}
                aria-label={t('app.backLabel')}
              >
                <svg
                  className={styles.backIcon}
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M15 6l-6 6 6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}
            <Logo size="md" />
            <p className={styles.brand}>{t('app.title')}</p>
          </div>
          <LanguageToggle value={current} onChange={handleLanguageChange} />
        </div>
      </header>
      <main className={styles.main} id="main">
        <div className={styles.mainInner}>
          {title !== undefined ? (
            <h1 className={styles.pageTitle}>{title}</h1>
          ) : null}
          {children}
        </div>
      </main>
      {/*
        Build-version footer is no longer shown in the chrome. We keep a
        hidden element so a future test or debug overlay can still read it.
      */}
      <footer hidden className={styles.footer}>
        <small>v{__APP_VERSION__}</small>
      </footer>
    </div>
  );
}

export default PageLayout;
