import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { LanguageToggle } from './LanguageToggle';

describe('LanguageToggle', () => {
  it('renders both languages inside a single bilingual pill', () => {
    render(<LanguageToggle value="en" onChange={() => {}} />);
    // One toggle button only — the bilingual pill.
    expect(screen.getAllByRole('button')).toHaveLength(1);
    // Both halves of the label are visible.
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
  });

  it('reflects current value via aria-pressed (es = pressed)', () => {
    const { rerender } = render(
      <LanguageToggle value="en" onChange={() => {}} />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');

    rerender(<LanguageToggle value="es" onChange={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles to the other language when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <LanguageToggle value="en" onChange={onChange} />,
    );

    await user.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('es');

    rerender(<LanguageToggle value="es" onChange={onChange} />);
    await user.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith('en');
  });

  it('tags each half with the right lang attribute', () => {
    render(<LanguageToggle value="en" onChange={() => {}} />);
    expect(screen.getByText('English')).toHaveAttribute('lang', 'en');
    expect(screen.getByText('Español')).toHaveAttribute('lang', 'es');
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <LanguageToggle value="en" onChange={() => {}} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
