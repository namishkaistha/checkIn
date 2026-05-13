import type { Meta, StoryObj } from '@storybook/react';
import { ApprovalCard } from './ApprovalCard';

const meta: Meta<typeof ApprovalCard> = {
  title: 'Organisms/ApprovalCard',
  component: ApprovalCard,
};

export default meta;
type Story = StoryObj<typeof ApprovalCard>;

const baseRow = {
  user: {
    id: 'u1',
    full_name: 'Jane Doe',
    phone_number: '+14155552671',
  },
  blocked: false,
  last_check_in_at: null,
};

export const Single: Story = {
  args: {
    rows: [baseRow],
    anyBlocked: false,
    onApprove: async () => {},
  },
};

export const MultipleClean: Story = {
  args: {
    rows: [
      baseRow,
      {
        user: {
          id: 'u2',
          full_name: 'John Smith',
          phone_number: '+12125551234',
        },
        blocked: false,
        last_check_in_at: null,
      },
    ],
    anyBlocked: false,
    onApprove: async () => {},
  },
};

export const Blocked: Story = {
  args: {
    rows: [
      {
        ...baseRow,
        blocked: true,
        last_check_in_at: '2026-04-29T14:00:00Z',
      },
    ],
    anyBlocked: true,
    onApprove: async () => {},
  },
};
