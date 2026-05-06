import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import i18n from '../../i18n';
import { ErrorBanner } from './ErrorBanner';

describe('ErrorBanner', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('exposes itself as role=alert', () => {
    render(<ErrorBanner message="Something went wrong" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('does not render a dismiss button when onDismiss is omitted', () => {
    render(<ErrorBanner message="Permanent error" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('fires onDismiss when the dismiss button is clicked', async () => {
    const handle = vi.fn();
    const user = userEvent.setup();
    render(<ErrorBanner message="Try again" onDismiss={handle} />);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(handle).toHaveBeenCalledTimes(1);
  });

  it('uses Spanish dismiss label when language is es', async () => {
    await i18n.changeLanguage('es');
    render(<ErrorBanner message="Algo falló" onDismiss={() => {}} />);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <ErrorBanner message="Could not save" onDismiss={() => {}} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
