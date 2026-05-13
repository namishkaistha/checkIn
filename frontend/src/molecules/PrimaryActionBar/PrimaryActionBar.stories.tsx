import type { Meta, StoryObj } from '@storybook/react';
import { PrimaryActionBar } from './PrimaryActionBar';
import { Button } from '../../atoms/Button/Button';

const meta: Meta<typeof PrimaryActionBar> = {
  title: 'Molecules/PrimaryActionBar',
  component: PrimaryActionBar,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof PrimaryActionBar>;

export const WithPrimaryButton: Story = {
  render: () => (
    <PrimaryActionBar>
      <Button variant="primary" subLabel="Continuar">
        Continue
      </Button>
    </PrimaryActionBar>
  ),
};

export const WithDisabledButton: Story = {
  render: () => (
    <PrimaryActionBar>
      <Button variant="primary" disabled subLabel="Continuar">
        Continue
      </Button>
    </PrimaryActionBar>
  ),
};
