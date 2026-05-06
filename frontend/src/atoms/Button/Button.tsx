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
  'aria-label': ariaLabel,
}: ButtonProps) {
  const classes = [styles.button, VARIANT_CLASS[variant]];
  if (fullWidth) classes.push(styles.fullWidth ?? '');

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
      {children}
    </button>
  );
}

export default Button;
