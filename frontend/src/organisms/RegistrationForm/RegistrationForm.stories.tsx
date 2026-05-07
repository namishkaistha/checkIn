import type { Meta, StoryObj } from '@storybook/react';
import { RegistrationForm } from './RegistrationForm';

const meta: Meta<typeof RegistrationForm> = {
  title: 'Organisms/RegistrationForm',
  component: RegistrationForm,
};

export default meta;
type Story = StoryObj<typeof RegistrationForm>;

export const Empty: Story = {
  args: {
    onSubmit: async () => {},
  },
};

export const PrefilledPhoneInModal: Story = {
  args: {
    initialPhone: '+14155552671',
    onSubmit: async () => {},
    onCancel: () => {},
  },
};
