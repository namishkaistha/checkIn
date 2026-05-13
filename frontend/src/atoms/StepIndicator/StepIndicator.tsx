import { useTranslation } from 'react-i18next';
import styles from './StepIndicator.module.css';

export interface StepIndicatorProps {
  /** 1-indexed current wizard step. */
  current: number;
  /** Total number of wizard steps. */
  total: number;
}

/**
 * Bilingual "Step {current} of {total} / Paso {current} de {total}" pill
 * chip used at the top of every wizard page. Renders both languages
 * inline regardless of current UI language — the chip is announced once
 * as a `role="status"` region and the two segments are tagged with
 * `lang` attributes so screen readers switch voice for each.
 *
 * The atom is intentionally dependency-free (no `BilingualText`): it sits
 * very close to the bottom of the dependency tree and is used by
 * `WizardStepHeader`, which itself composes `BilingualText`.
 */
export function StepIndicator({ current, total }: StepIndicatorProps) {
  const { i18n } = useTranslation();
  const en = i18n.t('atoms.stepIndicator.format', {
    current,
    total,
    lng: 'en',
  });
  const es = i18n.t('atoms.stepIndicator.format', {
    current,
    total,
    lng: 'es',
  });

  return (
    <span role="status" className={styles.chip}>
      <span lang="en">{en}</span>
      <span aria-hidden="true" className={styles.divider}>
        {' / '}
      </span>
      <span lang="es">{es}</span>
    </span>
  );
}

export default StepIndicator;
