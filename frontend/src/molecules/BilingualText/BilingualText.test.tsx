import { describe, it, expect, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import i18n from '../../i18n';
import { BilingualText } from './BilingualText';

describe('BilingualText', () => {
  afterEach(async () => {
    // Ensure language defaults back to English between tests.
    if (i18n.language !== 'en') await i18n.changeLanguage('en');
  });

  it('renders the EN and ES strings for the given key with proper lang attrs', () => {
    const { container } = render(<BilingualText tKey="pages.landing.title" />);
    const en = container.querySelector('[lang="en"]');
    const es = container.querySelector('[lang="es"]');
    expect(en?.textContent).toBe('Welcome to C&W Market Foundation');
    expect(es?.textContent).toBe('Bienvenido a C&W Market Foundation');
  });

  it('renders both languages regardless of the current UI language', async () => {
    const { container, rerender } = render(
      <BilingualText tKey="pages.landing.title" />,
    );
    await i18n.changeLanguage('es');
    rerender(<BilingualText tKey="pages.landing.title" />);
    const en = container.querySelector('[lang="en"]');
    const es = container.querySelector('[lang="es"]');
    expect(en?.textContent).toBe('Welcome to C&W Market Foundation');
    expect(es?.textContent).toBe('Bienvenido a C&W Market Foundation');
  });

  it('supports i18n interpolation values', () => {
    const { container } = render(
      <BilingualText
        tKey="stories.bilingualText.interpolatedGreeting"
        values={{ name: 'Sam' }}
      />,
    );
    const en = container.querySelector('[lang="en"]');
    const es = container.querySelector('[lang="es"]');
    expect(en?.textContent).toBe('Hello, Sam');
    expect(es?.textContent).toBe('Hola, Sam');
  });

  it('renders the wrapping element specified by `as`', () => {
    const { container } = render(
      <BilingualText tKey="pages.landing.title" as="h1" />,
    );
    expect(container.firstElementChild?.tagName).toBe('H1');
  });

  it('applies the align-center class', () => {
    const { container } = render(
      <BilingualText tKey="pages.landing.title" align="center" />,
    );
    expect(container.firstElementChild?.className).toMatch(/alignCenter/);
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <BilingualText tKey="pages.landing.title" as="h1" variant="display" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
