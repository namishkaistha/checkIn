import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBanner } from './ErrorBanner';

const meta: Meta<typeof ErrorBanner> = {
  title: 'Molecules/ErrorBanner',
  component: ErrorBanner,
};

export default meta;
type Story = StoryObj<typeof ErrorBanner>;

export const Static: Story = {
  args: { message: 'We could not reach the server. Try again.' },
};

export const Dismissable: Story = {
  args: {
    message: 'Phone number is invalid.',
    onDismiss: () => {
      // Story-only stub; in app, parent clears the error state.
    },
  },
};

export const LongMessage: Story = {
  args: {
    message:
      'One or more recipients have already checked in within the last 7 days. Tap "Approve anyway" if you have verified the situation with a coordinator.',
    onDismiss: () => {
      // Story-only stub.
    },
  },
};
