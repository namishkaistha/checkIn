import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Label } from './Label';

describe('Label', () => {
  it('renders text linked to its input', () => {
    render(
      <>
        <Label htmlFor="phone">Phone</Label>
        <input id="phone" />
      </>,
    );
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
  });

  it('marks required visually and for screen readers', () => {
    render(<Label htmlFor="phone" required>Phone</Label>);
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    // SR-only "required" span exists (English default from i18n).
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <>
        <Label htmlFor="phone" required>Phone</Label>
        <input id="phone" />
      </>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
