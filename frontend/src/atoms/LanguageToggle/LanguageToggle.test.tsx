import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { LanguageToggle } from './LanguageToggle';

describe('LanguageToggle', () => {
  it('reflects current value via aria-pressed', () => {
    render(<LanguageToggle value="en" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('calls onChange with the inactive language when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LanguageToggle value="en" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Español' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('es');
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <LanguageToggle value="en" onChange={() => {}} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
