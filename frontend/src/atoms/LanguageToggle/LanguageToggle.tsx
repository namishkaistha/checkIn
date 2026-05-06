import { useTranslation } from 'react-i18next';
import styles from './LanguageToggle.module.css';

export type Language = 'en' | 'es';

export interface LanguageToggleProps {
  value: Language;
  onChange: (lang: Language) => void;
}

/**
 * Controlled atom: parents own the language state and are responsible for
 * calling `i18n.changeLanguage(value)` when it changes. Keeping the atom
 * pure makes it trivially testable and free of i18n side-effects.
 */
export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.group} role="group" aria-label={t('atoms.languageToggle.groupLabel')}>
      <button
        type="button"
        className={styles.option}
        aria-pressed={value === 'en'}
        onClick={() => onChange('en')}
      >
        {t('atoms.languageToggle.english')}
      </button>
      <button
        type="button"
        className={styles.option}
        aria-pressed={value === 'es'}
        onClick={() => onChange('es')}
      >
        {t('atoms.languageToggle.spanish')}
      </button>
    </div>
  );
}

export default LanguageToggle;
