import type { ReactNode } from 'react';
import styles from './PrimaryActionBar.module.css';

export interface PrimaryActionBarProps {
  /** The primary CTA — typically a single `Button` atom. */
  children: ReactNode;
  /** Optional className appended after the wrapper class. */
  className?: string;
}

/**
 * Sticky bottom-of-page container for the wizard's single primary CTA.
 * Uses `position: sticky` (not fixed) so the bar stays inside the
 * document flow and doesn't overlap content on tall screens. Renders a
 * 2px top border and a surface background so the action is visually
 * separated from the scrollable area above. Any single child is
 * stretched to 100% width via descendant selector — this means dropping a
 * `<Button>` in works without needing `fullWidth` on the caller.
 */
export function PrimaryActionBar({ children, className }: PrimaryActionBarProps) {
  const classes = [styles.bar];
  if (className) classes.push(className);
  return <div className={classes.join(' ')}>{children}</div>;
}

export default PrimaryActionBar;
