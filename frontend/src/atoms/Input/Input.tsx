import type { ChangeEvent } from 'react';
import { Label } from '../Label/Label';
import styles from './Input.module.css';

export type InputType = 'tel' | 'text' | 'email';

export interface InputProps {
  id: string;
  value: string;
  onChange: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  label: string;
  type?: InputType;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  autoComplete?: string;
}

export function Input({
  id,
  value,
  onChange,
  label,
  type = 'text',
  placeholder,
  disabled = false,
  error,
  required = false,
  autoComplete,
}: InputProps) {
  const errorId = `${id}-error`;
  const hasError = Boolean(error);

  return (
    <div className={styles.wrapper}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <input
        id={id}
        className={styles.input}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        aria-required={required || undefined}
        inputMode={type === 'tel' ? 'tel' : undefined}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value, e)}
      />
      {hasError ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default Input;
