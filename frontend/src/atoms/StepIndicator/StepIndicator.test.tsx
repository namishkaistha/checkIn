import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { StepIndicator } from './StepIndicator';

describe('StepIndicator', () => {
  it('renders the current/total values', () => {
    render(<StepIndicator current={2} total={4} />);
    // role="status" is rendered as a live region
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Step 2 of 4');
    expect(region).toHaveTextContent('Paso 2 de 4');
  });

  it('renders both English and Spanish segments with correct lang attrs', () => {
    const { container } = render(<StepIndicator current={1} total={3} />);
    const en = container.querySelector('[lang="en"]');
    const es = container.querySelector('[lang="es"]');
    expect(en?.textContent).toBe('Step 1 of 3');
    expect(es?.textContent).toBe('Paso 1 de 3');
  });

  it('updates content when props change', () => {
    const { rerender } = render(<StepIndicator current={1} total={4} />);
    expect(screen.getByRole('status')).toHaveTextContent('Step 1 of 4');
    rerender(<StepIndicator current={4} total={4} />);
    expect(screen.getByRole('status')).toHaveTextContent('Step 4 of 4');
  });

  it('has no a11y violations', async () => {
    const { container } = render(<StepIndicator current={2} total={4} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
