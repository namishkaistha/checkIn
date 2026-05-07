import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import type { Decorator } from '@storybook/react';
import { CheckInForm } from './CheckInForm';

const meta: Meta<typeof CheckInForm> = {
  title: 'Organisms/CheckInForm',
  component: CheckInForm,
};

export default meta;
type Story = StoryObj<typeof CheckInForm>;

interface FetchMock {
  status: number;
  body: unknown;
  delayMs?: number;
}

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

export const ResolvesUser: Story = {
  decorators: [withFetchMock],
  parameters: {
    fetchMock: {
      status: 200,
      body: {
        id: 'u1',
        full_name: 'Jane Doe',
        phone_number: '+14155552671',
        created_at: '2026-01-01T00:00:00Z',
      },
    },
  },
  args: {
    onSubmit: async () => {},
    onRegisterRequest: () => {},
  },
};

export const UserNotFound: Story = {
  decorators: [withFetchMock],
  parameters: {
    fetchMock: { status: 404, body: { detail: 'User not found' } },
  },
  args: {
    onSubmit: async () => {},
    onRegisterRequest: () => {},
  },
};
