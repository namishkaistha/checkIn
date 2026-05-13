import { createRef } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Card } from './Card';

describe('Card', () => {
  it('renders children inside a div by default', () => {
    render(<Card>hello</Card>);
    const node = screen.getByText('hello');
    expect(node.tagName).toBe('DIV');
  });

  it('respects the `as` prop', () => {
    render(<Card as="section">section content</Card>);
    expect(screen.getByText('section content').tagName).toBe('SECTION');
  });

  it('applies tone classes', () => {
    const tones = ['default', 'info', 'warning', 'success', 'error'] as const;
    for (const tone of tones) {
      const { container, unmount } = render(<Card tone={tone}>x</Card>);
      const className = container.firstElementChild?.className ?? '';
      // Match e.g. "toneInfo" (CSS Modules suffix-hashed)
      const tonePart = `tone${tone.charAt(0).toUpperCase()}${tone.slice(1)}`;
      expect(className).toMatch(new RegExp(tonePart));
      unmount();
    }
  });

  it('applies padding classes', () => {
    const paddings = ['sm', 'md', 'lg'] as const;
    for (const padding of paddings) {
      const { container, unmount } = render(<Card padding={padding}>x</Card>);
      const className = container.firstElementChild?.className ?? '';
      const part = `padding${padding.charAt(0).toUpperCase()}${padding.slice(1)}`;
      expect(className).toMatch(new RegExp(part));
      unmount();
    }
  });

  it('appends a custom className', () => {
    const { container } = render(<Card className="custom">x</Card>);
    expect(container.firstElementChild?.className).toMatch(/custom/);
  });

  it('forwards a ref to the rendered element', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Card as="section" ref={ref}>
        x
      </Card>,
    );
    expect(ref.current?.tagName).toBe('SECTION');
  });

  it('has no a11y violations in the default tone', async () => {
    const { container } = render(<Card>Just some body content here</Card>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
