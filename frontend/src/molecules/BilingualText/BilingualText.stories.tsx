import type { Meta, StoryObj } from '@storybook/react';
import { BilingualText } from './BilingualText';

const meta: Meta<typeof BilingualText> = {
  title: 'Molecules/BilingualText',
  component: BilingualText,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof BilingualText>;

export const Display: Story = {
  args: { tKey: 'pages.landing.title', variant: 'display', as: 'h1' },
};

export const HeadlineLg: Story = {
  args: {
    tKey: 'wizard.shared.title.phone',
    variant: 'headline-lg',
    as: 'h2',
  },
};

export const BodyMd: Story = {
  args: { tKey: 'wizard.shared.subtitle.phone', variant: 'body-md', as: 'p' },
};

export const Centered: Story = {
  args: {
    tKey: 'pages.landing.title',
    variant: 'display',
    as: 'h1',
    align: 'center',
  },
};

export const WithInterpolation: Story = {
  args: {
    tKey: 'stories.bilingualText.interpolatedGreeting',
    values: { name: 'Alex' },
    variant: 'headline-md',
    as: 'p',
  },
};
