import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { NoticeCard } from './NoticeCard';

describe('NoticeCard', () => {
  it('renders the body text in both languages', () => {
    const { container } = render(
      <NoticeCard bodyKey="wizard.shared.subtitle.phone" />,
    );
    expect(container.textContent).toContain(
      'We use your phone number to find your record.',
    );
    expect(container.textContent).toContain(
      'Usamos tu número de teléfono para encontrar tu registro.',
    );
  });

  it('renders the optional heading when provided', () => {
    const { container } = render(
      <NoticeCard
        bodyKey="wizard.shared.subtitle.phone"
        headingKey="pages.landing.title"
      />,
    );
    expect(container.textContent).toContain('Welcome to C&W Market Foundation');
    expect(container.textContent).toContain(
      'Bienvenido a C&W Market Foundation',
    );
  });

  it('renders the default info icon with the Information aria-label', () => {
    render(<NoticeCard bodyKey="wizard.shared.subtitle.phone" />);
    expect(
      screen.getByRole('img', { name: 'Information' }),
    ).toBeInTheDocument();
  });

  it('renders the help icon when iconName="help"', () => {
    render(
      <NoticeCard
        bodyKey="wizard.shared.subtitle.phone"
        iconName="help"
      />,
    );
    expect(screen.getByRole('img', { name: 'Help' })).toBeInTheDocument();
  });

  it('renders the warning icon when iconName="warning"', () => {
    render(
      <NoticeCard
        bodyKey="wizard.shared.subtitle.phone"
        iconName="warning"
      />,
    );
    expect(screen.getByRole('img', { name: 'Warning' })).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <NoticeCard
        bodyKey="wizard.shared.subtitle.phone"
        headingKey="pages.landing.title"
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
