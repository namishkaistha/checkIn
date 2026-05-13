import type { Meta, StoryObj } from '@storybook/react';
import { NoticeCard } from './NoticeCard';

const meta: Meta<typeof NoticeCard> = {
  title: 'Molecules/NoticeCard',
  component: NoticeCard,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof NoticeCard>;

export const Info: Story = {
  args: { bodyKey: 'wizard.shared.subtitle.phone', iconName: 'info' },
};

export const Help: Story = {
  args: { bodyKey: 'wizard.shared.subtitle.household', iconName: 'help' },
};

export const Warning: Story = {
  args: { bodyKey: 'wizard.shared.subtitle.approve', iconName: 'warning' },
};

export const WithHeading: Story = {
  args: {
    bodyKey: 'wizard.shared.subtitle.phone',
    headingKey: 'pages.landing.title',
    iconName: 'info',
  },
};
