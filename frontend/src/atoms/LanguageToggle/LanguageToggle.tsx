import { useTranslation } from 'react-i18next';
import styles from './LanguageToggle.module.css';

export type Language = 'en' | 'es';

export interface LanguageToggleProps {
  value: Language;
  onChange: (lang: Language) => void;
}

/**
 * Bilingual pill toggle: a single rounded button labeled
 * "English / Español". Pressing it flips the active language.
 *
 * Controlled atom: parents own the language state and are responsible for
 * calling `i18n.changeLanguage(value)` when it changes. Keeping the atom
 * pure makes it trivially testable and free of i18n side-effects.
 *
 * The currently-active half of the label is rendered with the "active"
 * style; the other half is dimmed. `aria-pressed` reflects whether ES is
 * the active language (toggle "on" = Spanish).
 */
export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  const { t } = useTranslation();
  const next: Language = value === 'en' ? 'es' : 'en';

  return (
    <button
      type="button"
      className={styles.pill}
      aria-pressed={value === 'es'}
      aria-label={t('atoms.languageToggle.pillLabel')}
      onClick={() => onChange(next)}
    >
      <span
        className={value === 'en' ? styles.active : styles.inactive}
        lang="en"
      >
        {t('atoms.languageToggle.english')}
      </span>
      <span aria-hidden="true" className={styles.divider}>
        /
      </span>
      <span
        className={value === 'es' ? styles.active : styles.inactive}
        lang="es"
      >
        {t('atoms.languageToggle.spanish')}
      </span>
    </button>
  );
}

export default LanguageToggle;
