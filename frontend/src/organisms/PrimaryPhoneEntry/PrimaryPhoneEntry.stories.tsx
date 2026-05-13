import type { Meta, StoryObj } from '@storybook/react';
import { PrimaryPhoneEntry } from './PrimaryPhoneEntry';

const meta: Meta<typeof PrimaryPhoneEntry> = {
  title: 'Organisms/PrimaryPhoneEntry',
  component: PrimaryPhoneEntry,
  args: {
    onContinue: () => {},
    onRegisterRequest: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof PrimaryPhoneEntry>;

export const Default: Story = {};

export const WithResolvedUser: Story = {
  // The storybook story exists for visual review — the volunteer would
  // type a registered phone to reach this state. We rely on the dev API
  // proxy for an authentic resolve; no extra args needed.
};

export const WithUnregisteredPhone: Story = {
  // Same — typing a phone not in the DB drives the "Register" link state.
};
