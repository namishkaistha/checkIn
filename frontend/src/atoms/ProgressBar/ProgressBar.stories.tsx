import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Atoms/ProgressBar',
  component: ProgressBar,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Quarter: Story = { args: { current: 1, total: 4 } };
export const Half: Story = { args: { current: 2, total: 4 } };
export const Full: Story = { args: { current: 4, total: 4 } };
export const WithCustomLabel: Story = {
  args: { current: 2, total: 4, label: 'Step 2 of 4 progress' },
};
