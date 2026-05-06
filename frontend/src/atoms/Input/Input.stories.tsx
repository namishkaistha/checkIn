import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
};

export default meta;
type Story = StoryObj<typeof Input>;

function ControlledInput(args: Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'>) {
  const [value, setValue] = useState('');
  return <Input {...args} value={value} onChange={(v) => setValue(v)} />;
}

export const Text: Story = {
  render: (args) => <ControlledInput {...args} />,
  args: {
    id: 'name',
    label: 'Full name',
    placeholder: 'Jane Doe',
  },
};

export const Phone: Story = {
  render: (args) => <ControlledInput {...args} />,
  args: {
    id: 'phone',
    label: 'Phone number',
    type: 'tel',
    placeholder: '(555) 123-4567',
    required: true,
  },
};

export const WithError: Story = {
  render: (args) => <ControlledInput {...args} />,
  args: {
    id: 'phone',
    label: 'Phone number',
    type: 'tel',
    error: 'Enter a 10-digit US phone number',
  },
};

export const Disabled: Story = {
  render: (args) => <ControlledInput {...args} />,
  args: { id: 'name', label: 'Full name', disabled: true },
};
