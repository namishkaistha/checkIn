import type { Meta, StoryObj } from '@storybook/react';
import { StepIndicator } from './StepIndicator';

const meta: Meta<typeof StepIndicator> = {
  title: 'Atoms/StepIndicator',
  component: StepIndicator,
};

export default meta;
type Story = StoryObj<typeof StepIndicator>;

export const Step1of4: Story = { args: { current: 1, total: 4 } };
export const Step3of4: Story = { args: { current: 3, total: 4 } };
export const Step10of10: Story = { args: { current: 10, total: 10 } };
