import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Input } from './Input';

describe('Input', () => {
  it('renders with an associated label', () => {
    render(<Input id="name" label="Full name" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
  });

  it('fires onChange with the new value when typing', async () => {
    const user = userEvent.setup();
    const handle = vi.fn();
    render(<Input id="name" label="Full name" value="" onChange={handle} />);

    await user.type(screen.getByLabelText('Full name'), 'A');
    expect(handle).toHaveBeenCalledTimes(1);
    expect(handle.mock.calls[0]?.[0]).toBe('A');
  });

  it('sets inputMode=tel for tel inputs', () => {
    render(
      <Input id="phone" type="tel" label="Phone" value="" onChange={() => {}} />,
    );
    expect(screen.getByLabelText('Phone')).toHaveAttribute('inputmode', 'tel');
  });

  it('exposes errors via aria-invalid + aria-describedby', () => {
    render(
      <Input
        id="phone"
        type="tel"
        label="Phone"
        value=""
        onChange={() => {}}
        error="Enter a valid number"
      />,
    );
    const input = screen.getByLabelText('Phone');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'phone-error');
    const errorEl = screen.getByText('Enter a valid number');
    expect(errorEl).toHaveAttribute('id', 'phone-error');
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const handle = vi.fn();
    render(
      <Input id="name" label="Full name" value="" onChange={handle} disabled />,
    );
    await user.type(screen.getByLabelText('Full name'), 'A');
    expect(handle).not.toHaveBeenCalled();
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <Input id="name" label="Full name" value="" onChange={() => {}} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
