import { forwardRef, type ReactNode, type Ref } from 'react';
import styles from './Card.module.css';

export type CardAs = 'div' | 'section' | 'article';
export type CardPadding = 'sm' | 'md' | 'lg';
export type CardTone = 'default' | 'info' | 'warning' | 'success' | 'error';

export interface CardProps {
  /** HTML element used as the wrapper. Default `'div'`. */
  as?: CardAs;
  /** Inner padding scale. sm=12px, md=16px (default), lg=24px. */
  padding?: CardPadding;
  /**
   * Visual tone — drives border + background + foreground colors.
   * `'warning'` uses the tertiary (deep red) palette, since v2 deprecated
   * `--color-warning`; tertiary visually reads as "caution".
   */
  tone?: CardTone;
  children: ReactNode;
  /** Optional className for composition (appended after Card's own). */
  className?: string;
}

const PADDING_CLASS: Record<CardPadding, string> = {
  sm: styles.paddingSm ?? '',
  md: styles.paddingMd ?? '',
  lg: styles.paddingLg ?? '',
};

const TONE_CLASS: Record<CardTone, string> = {
  default: styles.toneDefault ?? '',
  info: styles.toneInfo ?? '',
  warning: styles.toneWarning ?? '',
  success: styles.toneSuccess ?? '',
  error: styles.toneError ?? '',
};

/**
 * Generic 2px-bordered, 16px-radius container used by molecules and
 * organisms to render the EA "sturdy" surface. The `tone` prop tints
 * border + background; `padding` scales the inner spacing. Refs are
 * forwarded so organisms (e.g. modal focus management) can attach.
 */
export const Card = forwardRef(function Card(
  {
    as = 'div',
    padding = 'md',
    tone = 'default',
    children,
    className,
  }: CardProps,
  ref: Ref<HTMLElement>,
) {
  const classes = [styles.card, PADDING_CLASS[padding], TONE_CLASS[tone]];
  if (className) classes.push(className);
  const Tag = as;
  // We treat the ref as HTMLElement so consumers can use any of the
  // supported `as` element types without ref-type gymnastics.
  return (
    <Tag
      ref={ref as Ref<HTMLDivElement> & Ref<HTMLElement>}
      className={classes.filter(Boolean).join(' ')}
    >
      {children}
    </Tag>
  );
});

export default Card;
