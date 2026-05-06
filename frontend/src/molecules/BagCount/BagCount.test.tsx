import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import i18n from '../../i18n';
import { BagCount } from './BagCount';

describe('BagCount', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders singular for 1 (EN)', () => {
    render(<BagCount count={1} />);
    expect(screen.getByText('1 bag')).toBeInTheDocument();
  });

  it.each([
    { count: 0, expected: '0 bags' },
    { count: 2, expected: '2 bags' },
    { count: 5, expected: '5 bags' },
  ])('renders plural for $count (EN)', ({ count, expected }) => {
    render(<BagCount count={count} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('renders Spanish singular and plural', async () => {
    await i18n.changeLanguage('es');
    const { rerender } = render(<BagCount count={1} />);
    expect(screen.getByText('1 bolsa')).toBeInTheDocument();
    rerender(<BagCount count={3} />);
    expect(screen.getByText('3 bolsas')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<BagCount count={2} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
