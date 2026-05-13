import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { WizardStepHeader } from './WizardStepHeader';

describe('WizardStepHeader', () => {
  it('renders the step indicator and bilingual title when no subtitle', () => {
    const { container } = render(
      <WizardStepHeader
        current={1}
        total={4}
        titleKey="wizard.shared.title.phone"
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Step 1 of 4');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    // Subtitle should NOT render
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders the optional subtitle when provided', () => {
    const { container } = render(
      <WizardStepHeader
        current={2}
        total={4}
        titleKey="wizard.shared.title.household"
        subtitleKey="wizard.shared.subtitle.household"
      />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    const p = container.querySelector('p');
    expect(p).not.toBeNull();
    // Both languages should appear in the subtitle paragraph
    expect(p?.textContent).toContain('Add anyone else');
    expect(p?.textContent).toContain('Agrega a cualquier');
  });

  it('renders the correct step indicator values', () => {
    render(
      <WizardStepHeader
        current={3}
        total={4}
        titleKey="wizard.shared.title.summary"
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Step 3 of 4');
    expect(screen.getByRole('status')).toHaveTextContent('Paso 3 de 4');
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <WizardStepHeader
        current={4}
        total={4}
        titleKey="wizard.shared.title.approve"
        subtitleKey="wizard.shared.subtitle.approve"
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
