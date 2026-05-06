import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Label.module.css';

export interface LabelProps {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}

export function Label({ htmlFor, children, required = false }: LabelProps) {
  const { t } = useTranslation();
  return (
    <label htmlFor={htmlFor} className={styles.label}>
      {children}
      {required ? (
        <>
          <span aria-hidden="true" className={styles.requiredMark}>
            *
          </span>
          <span className="visually-hidden">
            {' '}
            {t('atoms.label.requiredSr')}
          </span>
        </>
      ) : null}
    </label>
  );
}

export default Label;
