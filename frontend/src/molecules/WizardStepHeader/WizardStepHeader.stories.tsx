import type { Meta, StoryObj } from '@storybook/react';
import { WizardStepHeader } from './WizardStepHeader';

const meta: Meta<typeof WizardStepHeader> = {
  title: 'Molecules/WizardStepHeader',
  component: WizardStepHeader,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof WizardStepHeader>;

export const Step1NoSubtitle: Story = {
  args: {
    current: 1,
    total: 4,
    titleKey: 'wizard.shared.title.phone',
  },
};

export const Step2WithSubtitle: Story = {
  args: {
    current: 2,
    total: 4,
    titleKey: 'wizard.shared.title.household',
    subtitleKey: 'wizard.shared.subtitle.household',
  },
};

export const Step4WithSubtitle: Story = {
  args: {
    current: 4,
    total: 4,
    titleKey: 'wizard.shared.title.approve',
    subtitleKey: 'wizard.shared.subtitle.approve',
  },
};
