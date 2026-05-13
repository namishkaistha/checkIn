import type { ReactNode, MouseEvent } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  variant?: ButtonVariant;
  type?: 'button' | 'submit';
  disabled?: boolean;
  fullWidth?: boolean;
  /**
   * Optional second-line label (typically the Spanish translation of the
   * main label). Rendered below the main label in the bilingual label
   * type style. The span is marked `lang="es"` so screen readers switch
   * voices appropriately.
   */
  subLabel?: string;
  /** Optional aria-label for icon-only buttons. */
  'aria-label'?: string;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.primary ?? '',
  secondary: styles.secondary ?? '',
  danger: styles.danger ?? '',
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
  fullWidth = false,
  subLabel,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const classes = [styles.button, VARIANT_CLASS[variant]];
  if (fullWidth) classes.push(styles.fullWidth ?? '');
  if (subLabel) classes.push(styles.bilingual ?? '');

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      type={type}
      className={classes.filter(Boolean).join(' ')}
      onClick={handleClick}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      // Prefer aria-disabled so the element stays focusable for AT discovery.
      // Native disabled would skip focus + screen reader announcement.
    >
      {subLabel ? (
        <>
          <span className={styles.mainLabel}>{children}</span>
          <span className={styles.subLabel} lang="es">
            {subLabel}
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
