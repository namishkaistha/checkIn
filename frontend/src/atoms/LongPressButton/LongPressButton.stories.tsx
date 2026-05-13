import type { Meta, StoryObj } from '@storybook/react';
import { useState, type CSSProperties } from 'react';
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

/**
 * A static visual showing the button mid-hold. We overwrite the
 * `--progress` CSS variable on the rendered element via inline style so
 * the fill bar sits at ~50% without needing to drive the hook in
 * Storybook. Useful for chromatic snapshots / a11y reviews of the
 * partially-filled state.
 */
export const Halfway: Story = {
  render: () => (
    <div
      style={
        {
          ['--progress' as string]: '0.5',
          width: '320px',
        } as CSSProperties
      }
    >
      <LongPressButton onLongPress={() => {}}>Confirm check-in</LongPressButton>
    </div>
  ),
};
