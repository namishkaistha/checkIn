import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { HouseholdMembers } from './HouseholdMembers';
import {
  CheckInSessionProvider,
  useCheckInSession,
} from '../../state/CheckInSessionContext';
import type { User } from '../../api/types';

const PRIMARY: User = {
  id: 'p1',
  full_name: 'Maria García',
  phone_number: '+14155550000',
  created_at: '2026-01-01T00:00:00Z',
};

const OTHER: User = {
  id: 'o1',
  full_name: 'Luis García',
  phone_number: '+14155551111',
  created_at: '2026-01-01T00:00:00Z',
};

const SECOND_OTHER: User = {
  id: 'o2',
  full_name: 'Elena García',
  phone_number: '+14155552222',
  created_at: '2026-01-01T00:00:00Z',
};

function Prime({
  primary,
  additional,
  children,
}: {
  primary: User;
  additional: User[];
  children: React.ReactNode;
}) {
  const { primaryUser, setPrimary, addAdditional } = useCheckInSession();
  useEffect(() => {
    if (primaryUser === null) {
      setPrimary(primary);
      for (const u of additional) addAdditional(u);
    }
  }, [primary, additional, primaryUser, setPrimary, addAdditional]);
  if (primaryUser === null) return null;
  return <>{children}</>;
}

const meta: Meta<typeof HouseholdMembers> = {
  title: 'Organisms/HouseholdMembers',
  component: HouseholdMembers,
  args: {
    onContinue: async () => {},
    onRegisterRequest: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof HouseholdMembers>;

export const OnlyPrimary: Story = {
  render: (args) => (
    <CheckInSessionProvider>
      <Prime primary={PRIMARY} additional={[]}>
        <HouseholdMembers {...args} />
      </Prime>
    </CheckInSessionProvider>
  ),
};

export const WithTwoAdditionals: Story = {
  render: (args) => (
    <CheckInSessionProvider>
      <Prime primary={PRIMARY} additional={[OTHER, SECOND_OTHER]}>
        <HouseholdMembers {...args} />
      </Prime>
    </CheckInSessionProvider>
  ),
};

export const WithDuplicateError: Story = {
  // The duplicate-primary error appears after the volunteer tries to add
  // the primary's own number; demonstrated in the test suite.
  render: (args) => (
    <CheckInSessionProvider>
      <Prime primary={PRIMARY} additional={[]}>
        <HouseholdMembers {...args} />
      </Prime>
    </CheckInSessionProvider>
  ),
};

export const WithLoadingContinue: Story = {
  args: {
    // Returns a never-resolving promise so the in-flight spinner state is
    // visible in storybook.
    onContinue: () => new Promise<void>(() => {}),
  },
  render: (args) => (
    <CheckInSessionProvider>
      <Prime primary={PRIMARY} additional={[OTHER]}>
        <HouseholdMembers {...args} />
      </Prime>
    </CheckInSessionProvider>
  ),
};
