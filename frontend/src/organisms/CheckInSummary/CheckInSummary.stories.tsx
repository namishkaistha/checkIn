import type { Meta, StoryObj } from '@storybook/react';
import { CheckInSummary } from './CheckInSummary';
import type { CheckInBatch } from '../../api/types';

const meta: Meta<typeof CheckInSummary> = {
  title: 'Organisms/CheckInSummary',
  component: CheckInSummary,
  args: {
    onContinue: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof CheckInSummary>;

function makeBatch(rowCount: number, blockedIdx?: number): CheckInBatch {
  return {
    batch_id: 'b1',
    any_blocked: blockedIdx !== undefined,
    rows: Array.from({ length: rowCount }, (_, i) => ({
      user: {
        id: `u${i}`,
        full_name: `Person ${i + 1}`,
        phone_number: `+1415555000${i}`,
        created_at: '2026-01-01T00:00:00Z',
      },
      blocked: i === blockedIdx,
      last_check_in_at:
        i === blockedIdx ? '2026-04-29T14:00:00Z' : null,
    })),
  };
}

export const OneRecipient: Story = {
  args: { batch: makeBatch(1) },
};

export const ThreeRecipients: Story = {
  args: { batch: makeBatch(3) },
};

export const OneBlockedRecipient: Story = {
  args: { batch: makeBatch(2, 1) },
};
