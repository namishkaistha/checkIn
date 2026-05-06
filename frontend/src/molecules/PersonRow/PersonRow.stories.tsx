import type { Meta, StoryObj } from '@storybook/react';
import { PersonRow } from './PersonRow';

const meta: Meta<typeof PersonRow> = {
  title: 'Molecules/PersonRow',
  component: PersonRow,
};

export default meta;
type Story = StoryObj<typeof PersonRow>;

export const Default: Story = {
  args: { name: 'Jane Doe', phoneNumber: '(555) 123-4567' },
};

export const Blocked: Story = {
  args: {
    name: 'Jane Doe',
    phoneNumber: '(555) 123-4567',
    blocked: true,
    lastCheckInAt: '2026-04-29T14:00:00Z',
  },
};

export const LongName: Story = {
  args: {
    name: 'Maximilian Bartholomew Featherstone-Wellingthorpe III',
    phoneNumber: '(555) 987-6543',
  },
};
