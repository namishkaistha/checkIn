import type { Meta, StoryObj } from '@storybook/react';
import { BagCount } from './BagCount';

const meta: Meta<typeof BagCount> = {
  title: 'Molecules/BagCount',
  component: BagCount,
};

export default meta;
type Story = StoryObj<typeof BagCount>;

export const Zero: Story = { args: { count: 0 } };
export const One: Story = { args: { count: 1 } };
export const Several: Story = { args: { count: 5 } };
