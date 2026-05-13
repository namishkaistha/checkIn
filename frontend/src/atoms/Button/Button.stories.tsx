import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  args: {
    children: 'Continue',
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Cancel' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: 'Delete' },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, children: 'Submitting…' },
};

export const FullWidth: Story = {
  args: { variant: 'primary', fullWidth: true, children: 'Sign in' },
  parameters: { layout: 'padded' },
};

export const WithSubLabel: Story = {
  args: {
    variant: 'primary',
    fullWidth: true,
    children: 'Continue',
    subLabel: 'Continuar',
  },
  parameters: { layout: 'padded' },
};
