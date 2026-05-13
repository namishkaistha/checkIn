import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { PrimaryActionBar } from './PrimaryActionBar';
import { Button } from '../../atoms/Button/Button';

describe('PrimaryActionBar', () => {
  it('renders its children', () => {
    render(
      <PrimaryActionBar>
        <Button>Continue</Button>
      </PrimaryActionBar>,
    );
    expect(
      screen.getByRole('button', { name: /continue/i }),
    ).toBeInTheDocument();
  });

  it('appends a custom className', () => {
    const { container } = render(
      <PrimaryActionBar className="custom-bar">
        <Button>Continue</Button>
      </PrimaryActionBar>,
    );
    expect(container.firstElementChild?.className).toMatch(/custom-bar/);
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <PrimaryActionBar>
        <Button>Continue</Button>
      </PrimaryActionBar>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
