import { describe, it, expect, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import i18n from '../../i18n';
import { PageLayout } from './PageLayout';

afterEach(async () => {
  // Each test must leave i18n in English so unrelated tests aren't poisoned.
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

describe('PageLayout', () => {
  it('renders the brand, the optional title, and the children', () => {
    render(
      <PageLayout title="Check in">
        <p>Hello world</p>
      </PageLayout>,
    );
    expect(screen.getByText('Pantry Check-In')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Check in' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('exposes a single <main> landmark', () => {
    render(
      <PageLayout>
        <p>x</p>
      </PageLayout>,
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('changes the i18n language when the toggle is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PageLayout>
        <p>x</p>
      </PageLayout>,
    );
    expect(i18n.language).toBe('en');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Español' }));
    });
    expect(i18n.language).toBe('es');
    expect(screen.getByText('Registro de Despensa')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <PageLayout title="Check in">
        <p>Hello</p>
      </PageLayout>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
