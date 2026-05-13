import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Logo } from './Logo';

describe('Logo', () => {
  it('renders an image with the brand alt text', () => {
    render(<Logo />);
    const img = screen.getByRole('img', { name: /c&w market foundation/i });
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('src');
  });

  it('accepts size variants', () => {
    const { rerender, container } = render(<Logo size="sm" />);
    expect(container.querySelector('img')?.className).toMatch(/sm/);
    rerender(<Logo size="md" />);
    expect(container.querySelector('img')?.className).toMatch(/md/);
    rerender(<Logo size="lg" />);
    expect(container.querySelector('img')?.className).toMatch(/lg/);
  });

  it('has no a11y violations', async () => {
    const { container } = render(<Logo />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
