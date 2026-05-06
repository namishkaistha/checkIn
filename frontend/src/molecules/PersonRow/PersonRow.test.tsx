import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import i18n from '../../i18n';
import { PersonRow } from './PersonRow';

describe('PersonRow', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders name and phone', () => {
    render(<PersonRow name="Jane Doe" phoneNumber="(555) 123-4567" />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
  });

  it('does not show the blocked badge when not blocked', () => {
    render(<PersonRow name="Jane Doe" phoneNumber="(555) 123-4567" />);
    expect(screen.queryByText('Recent check-in')).not.toBeInTheDocument();
  });

  it('shows the blocked badge in EN when blocked', () => {
    render(
      <PersonRow name="Jane Doe" phoneNumber="(555) 123-4567" blocked />,
    );
    expect(screen.getByText('Recent check-in')).toBeInTheDocument();
  });

  it('shows the blocked badge in ES when blocked', async () => {
    await i18n.changeLanguage('es');
    render(
      <PersonRow name="Jane Doe" phoneNumber="(555) 123-4567" blocked />,
    );
    expect(screen.getByText('Registro reciente')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <PersonRow
        name="Jane Doe"
        phoneNumber="(555) 123-4567"
        blocked
        lastCheckInAt="2026-04-29T14:00:00Z"
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
