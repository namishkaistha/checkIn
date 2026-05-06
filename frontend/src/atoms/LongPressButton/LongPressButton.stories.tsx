import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { LongPressButton } from './LongPressButton';

const meta: Meta<typeof LongPressButton> = {
  title: 'Atoms/LongPressButton',
  component: LongPressButton,
};
export default meta;
type Story = StoryObj<typeof LongPressButton>;

function Demo({
  variant,
  disabled,
}: {
  variant: 'primary' | 'success';
  disabled?: boolean;
}) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <LongPressButton
        variant={variant}
        disabled={disabled}
        onLongPress={() => setCount((c) => c + 1)}
      >
        {variant === 'success' ? 'Approve guest' : 'Confirm check-in'}
      </LongPressButton>
      <p style={{ marginTop: 'var(--space-3)' }}>Triggered: {count}</p>
    </div>
  );
}

export const Primary: Story = {
  render: () => <Demo variant="primary" />,
};

export const Success: Story = {
  render: () => <Demo variant="success" />,
};

export const Disabled: Story = {
  render: () => <Demo variant="primary" disabled />,
};
