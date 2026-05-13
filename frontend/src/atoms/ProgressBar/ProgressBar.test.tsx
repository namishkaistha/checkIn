import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('exposes the progressbar role with the expected aria values', () => {
    render(<ProgressBar current={2} total={4} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '4');
    expect(bar).toHaveAttribute('aria-valuenow', '2');
  });

  it('updates aria-valuenow when current changes', () => {
    const { rerender } = render(<ProgressBar current={1} total={4} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '1',
    );
    rerender(<ProgressBar current={3} total={4} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '3',
    );
  });

  it('uses the default aria-label when none provided', () => {
    render(<ProgressBar current={1} total={4} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-label',
      'Wizard progress',
    );
  });

  it('honors a custom label', () => {
    render(<ProgressBar current={1} total={4} label="Step progress" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-label',
      'Step progress',
    );
  });

  it('sets the fill width based on the current/total ratio', () => {
    render(<ProgressBar current={2} total={4} />);
    const track = screen.getByRole('progressbar');
    const fill = track.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('50%');
  });

  it('clamps the fill width to 100% when current exceeds total', () => {
    render(<ProgressBar current={10} total={4} />);
    const track = screen.getByRole('progressbar');
    const fill = track.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('has no a11y violations', async () => {
    const { container } = render(<ProgressBar current={2} total={4} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
