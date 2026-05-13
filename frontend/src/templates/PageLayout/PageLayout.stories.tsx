import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { PageLayout } from './PageLayout';

const meta: Meta<typeof PageLayout> = {
  title: 'Templates/PageLayout',
  component: PageLayout,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
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

export const WithBackButton: Story = {
  args: {
    title: 'Step 2 of 4',
    showBack: true,
    children: (
      <p>Wizard pages 2+ render a Back button in the header.</p>
    ),
  },
};
