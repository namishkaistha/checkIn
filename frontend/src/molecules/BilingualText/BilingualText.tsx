import type { JSX, ReactElement } from 'react';
import { createElement } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './BilingualText.module.css';

export type BilingualVariant =
  | 'display'
  | 'headline-lg'
  | 'headline-md'
  | 'body-lg'
  | 'body-md'
  | 'label';

export type BilingualAlign = 'start' | 'center';

export interface BilingualTextProps {
  /** i18n key resolved against both `en` and `es` resources. */
  tKey: string;
  /** Interpolation values forwarded to `i18n.t`. */
  values?: Record<string, string | number>;
  /** Typographic variant for the primary (current-language) span. */
  variant?: BilingualVariant;
  /** Wrapping element. Default `'span'`. Pass `'h1'`/`'h2'`/`'p'` for headings/body. */
  as?: keyof JSX.IntrinsicElements;
  /** Additional className appended after BilingualText's own classes. */
  className?: string;
  /** `start` (default) for body copy, `center` for hero headings. */
  align?: BilingualAlign;
}

const VARIANT_CLASS: Record<BilingualVariant, string> = {
  display: styles.variantDisplay ?? '',
  'headline-lg': styles.variantHeadlineLg ?? '',
  'headline-md': styles.variantHeadlineMd ?? '',
  'body-lg': styles.variantBodyLg ?? '',
  'body-md': styles.variantBodyMd ?? '',
  label: styles.variantLabel ?? '',
};

const ALIGN_CLASS: Record<BilingualAlign, string> = {
  start: styles.alignStart ?? '',
  center: styles.alignCenter ?? '',
};

/**
 * Renders the same i18n key in BOTH English and Spanish simultaneously,
 * with proper `lang` attributes on each segment. The active UI language
 * does NOT change which languages render — both always render. The
 * `LanguageToggle` controls which segment receives the dominant
 * typography via a body-level class (`lang-en-primary` /
 * `lang-es-primary`); BilingualText's CSS responds to those classes.
 *
 * The component intentionally does no caching of resolved strings — i18n
 * lookups are cheap and React's render is the source of truth, so any
 * future namespace/resource hot-swap will reflect immediately.
 */
export function BilingualText({
  tKey,
  values,
  variant = 'body-md',
  as = 'span',
  className,
  align = 'start',
}: BilingualTextProps): ReactElement {
  const { i18n } = useTranslation();

  // i18n.t accepts a `lng` option override; we request both resources
  // regardless of the current UI language.
  const enText = i18n.t(tKey, { ...(values ?? {}), lng: 'en' });
  const esText = i18n.t(tKey, { ...(values ?? {}), lng: 'es' });

  const classes = [
    styles.wrapper,
    VARIANT_CLASS[variant],
    ALIGN_CLASS[align],
  ];
  if (className) classes.push(className);

  return createElement(
    as,
    { className: classes.filter(Boolean).join(' ') },
    createElement('span', { lang: 'en', className: styles.en }, enText),
    createElement('span', { lang: 'es', className: styles.es }, esText),
  );
}

export default BilingualText;
