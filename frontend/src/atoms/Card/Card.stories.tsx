import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Atoms/Card',
  component: Card,
  parameters: { layout: 'padded' },
  args: {
    children: 'Card body — a sturdy 2px-bordered container.',
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = { args: { tone: 'default', padding: 'md' } };
export const Info: Story = { args: { tone: 'info', padding: 'md' } };
export const Warning: Story = { args: { tone: 'warning', padding: 'md' } };
export const Success: Story = { args: { tone: 'success', padding: 'md' } };
export const Error: Story = { args: { tone: 'error', padding: 'md' } };

export const PaddingSm: Story = { args: { tone: 'default', padding: 'sm' } };
export const PaddingMd: Story = { args: { tone: 'default', padding: 'md' } };
export const PaddingLg: Story = { args: { tone: 'default', padding: 'lg' } };
