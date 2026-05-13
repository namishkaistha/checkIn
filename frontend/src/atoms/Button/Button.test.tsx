import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('fires onClick when activated', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Save
      </Button>,
    );

    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('exposes an accessible name', () => {
    render(<Button aria-label="Close dialog">×</Button>);
    expect(
      screen.getByRole('button', { name: 'Close dialog' }),
    ).toBeInTheDocument();
  });

  it('renders a bilingual sub-label below the main label when subLabel is set', () => {
    render(<Button subLabel="Continuar">Continue</Button>);
    const btn = screen.getByRole('button', { name: /Continue/i });
    expect(btn).toHaveTextContent('Continue');
    expect(btn).toHaveTextContent('Continuar');
    // The Spanish sub-label must be tagged lang="es" so AT can switch voices.
    const sub = screen.getByText('Continuar');
    expect(sub).toHaveAttribute('lang', 'es');
  });

  it('has no a11y violations', async () => {
    const { container } = render(<Button>Hello</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no a11y violations when bilingual', async () => {
    const { container } = render(
      <Button subLabel="Continuar">Continue</Button>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
