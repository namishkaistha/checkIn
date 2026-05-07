import type { Meta, StoryObj } from '@storybook/react';
import { ApprovedCard } from './ApprovedCard';

const meta: Meta<typeof ApprovedCard> = {
  title: 'Organisms/ApprovedCard',
  component: ApprovedCard,
};

export default meta;
type Story = StoryObj<typeof ApprovedCard>;

export const SingleBag: Story = {
  args: { count: 1, onReset: () => {} },
};

export const SeveralBags: Story = {
  args: { count: 4, onReset: () => {} },
};
