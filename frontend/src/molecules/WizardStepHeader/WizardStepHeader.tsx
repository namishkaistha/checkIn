import { StepIndicator } from '../../atoms/StepIndicator/StepIndicator';
import { BilingualText } from '../BilingualText/BilingualText';
import styles from './WizardStepHeader.module.css';

export interface WizardStepHeaderProps {
  /** 1-indexed current step. */
  current: number;
  /** Total number of wizard steps. */
  total: number;
  /** i18n key for the page title (rendered as a centered display heading). */
  titleKey: string;
  /** Optional i18n key for a subtitle paragraph rendered below the title. */
  subtitleKey?: string;
}

/**
 * Header block at the top of every wizard page. Combines the `StepIndicator`
 * pill chip with a bilingual display-level heading and an optional bilingual
 * subtitle paragraph. The whole block is centered and stacks vertically.
 */
export function WizardStepHeader({
  current,
  total,
  titleKey,
  subtitleKey,
}: WizardStepHeaderProps) {
  return (
    <header className={styles.header}>
      <StepIndicator current={current} total={total} />
      <BilingualText
        tKey={titleKey}
        variant="display"
        as="h1"
        align="center"
      />
      {subtitleKey ? (
        <BilingualText
          tKey={subtitleKey}
          variant="body-lg"
          as="p"
          align="center"
        />
      ) : null}
    </header>
  );
}

export default WizardStepHeader;
