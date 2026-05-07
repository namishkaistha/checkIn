import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle, type Language } from '../../atoms/LanguageToggle/LanguageToggle';
import styles from './PageLayout.module.css';

export interface PageLayoutProps {
  children: ReactNode;
  /** Optional page heading rendered inside <main>. */
  title?: string;
}

/**
 * Site shell for every page. Owns the header (app title + language toggle)
 * and the footer (build version), and renders children inside the <main>
 * landmark. Only one <main> on the page so this template MUST NOT be nested.
 */
export function PageLayout({ children, title }: PageLayoutProps) {
  const { t, i18n } = useTranslation();
  // i18next stores the current language as a string — narrow it to our
  // controlled type. Anything else falls back to English so the toggle has a
  // valid checked state instead of erroring.
  const current: Language =
    i18n.resolvedLanguage === 'es' || i18n.language === 'es' ? 'es' : 'en';

  const handleLanguageChange = (lang: Language) => {
    void i18n.changeLanguage(lang);
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <p className={styles.brand}>{t('app.title')}</p>
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
      <footer className={styles.footer}>
        <small>v{__APP_VERSION__}</small>
      </footer>
    </div>
  );
}

export default PageLayout;
