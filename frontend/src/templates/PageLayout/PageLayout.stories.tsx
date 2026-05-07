import type { Meta, StoryObj } from '@storybook/react';
import { PageLayout } from './PageLayout';

const meta: Meta<typeof PageLayout> = {
  title: 'Templates/PageLayout',
  component: PageLayout,
};

export default meta;
type Story = StoryObj<typeof PageLayout>;

export const WithTitle: Story = {
  args: {
    title: 'Check in',
    children: (
      <p>Page content goes here. Layout supplies header and footer.</p>
    ),
  },
};

export const NoTitle: Story = {
  args: {
    children: <p>Pages may render their own heading inside children.</p>,
  },
};
