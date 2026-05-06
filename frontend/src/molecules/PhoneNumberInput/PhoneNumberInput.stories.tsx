import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import type { Decorator } from '@storybook/react';
import { PhoneNumberInput } from './PhoneNumberInput';

const meta: Meta<typeof PhoneNumberInput> = {
  title: 'Molecules/PhoneNumberInput',
  component: PhoneNumberInput,
};

export default meta;
type Story = StoryObj<typeof PhoneNumberInput>;

interface FetchMock {
  status: number;
  body: unknown;
  delayMs?: number;
}

/**
 * Decorator that swaps `global.fetch` for a deterministic stub keyed off the
 * `parameters.fetchMock` story config. Story decorators run once per render
 * so we restore the original on cleanup.
 */
const withFetchMock: Decorator = (Story, context) => {
  const mock = context.parameters['fetchMock'] as FetchMock | undefined;
  useEffect(() => {
    if (mock === undefined) return;
    const original = window.fetch;
    window.fetch = ((..._args: Parameters<typeof fetch>) =>
      new Promise<Response>((resolve) => {
        const send = () =>
          resolve(
            new Response(JSON.stringify(mock.body), {
              status: mock.status,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        if (mock.delayMs && mock.delayMs > 0) {
          window.setTimeout(send, mock.delayMs);
        } else {
          send();
        }
      })) as typeof fetch;
    return () => {
      window.fetch = original;
    };
  }, [mock]);
  return <Story />;
};

function Controlled(args: React.ComponentProps<typeof PhoneNumberInput>) {
  const [value, setValue] = useState(args.value);
  return (
    <PhoneNumberInput
      {...args}
      value={value}
      onChange={(raw) => setValue(raw)}
    />
  );
}

export const ResolvesUser: Story = {
  decorators: [withFetchMock],
  parameters: {
    fetchMock: {
      status: 200,
      delayMs: 200,
      body: {
        id: 'u1',
        full_name: 'Jane Doe',
        phone_number: '+14155552671',
        created_at: '2026-01-01T00:00:00Z',
      },
    },
  },
  render: (args) => <Controlled {...args} />,
  args: {
    id: 'phone',
    label: 'Phone number',
    value: '4155552671',
    onChange: () => {},
  },
};

export const NotRegistered: Story = {
  decorators: [withFetchMock],
  parameters: {
    fetchMock: {
      status: 404,
      delayMs: 200,
      body: { detail: 'User not found' },
    },
  },
  render: (args) => <Controlled {...args} />,
  args: {
    id: 'phone',
    label: 'Phone number',
    value: '2125551234',
    onChange: () => {},
    onRegisterLink: () => {},
  },
};

export const NoAutoLookup: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    id: 'phone',
    label: 'Phone number',
    value: '',
    onChange: () => {},
    autoLookup: false,
  },
};

export const WithError: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    id: 'phone',
    label: 'Phone number',
    value: '123',
    onChange: () => {},
    autoLookup: false,
    error: 'Enter a 10-digit US phone number',
  },
};
