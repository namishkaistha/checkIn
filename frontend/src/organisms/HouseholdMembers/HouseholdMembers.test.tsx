import { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { HouseholdMembers } from './HouseholdMembers';
import {
  CheckInSessionProvider,
  useCheckInSession,
} from '../../state/CheckInSessionContext';
import type { User } from '../../api/types';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const PRIMARY: User = {
  id: 'p1',
  full_name: 'Primary Person',
  phone_number: '+14155550000',
  created_at: '2026-01-01T00:00:00Z',
};

const OTHER: User = {
  id: 'o1',
  full_name: 'Other Person',
  phone_number: '+14155551111',
  created_at: '2026-01-01T00:00:00Z',
};

/**
 * Wrapper that primes the session with a primary user (and optional
 * additional users) before rendering the organism. Mirrors the pattern
 * used by `CheckInHouseholdPage.test.tsx`.
 */
function PrimeAndRender({
  primary = PRIMARY,
  additional = [],
  children,
}: {
  primary?: User | null;
  additional?: User[];
  children: React.ReactNode;
}) {
  const { primaryUser, setPrimary, addAdditional } = useCheckInSession();
  useEffect(() => {
    if (primary !== null && primaryUser === null) {
      setPrimary(primary);
      for (const u of additional) addAdditional(u);
    }
  }, [primary, additional, primaryUser, setPrimary, addAdditional]);
  if (primary !== null && primaryUser === null) return null;
  return <>{children}</>;
}

function renderOrganism({
  primary = PRIMARY,
  additional = [],
  onContinue = async () => {},
  onRegisterRequest = () => {},
}: {
  primary?: User | null;
  additional?: User[];
  onContinue?: () => Promise<void>;
  onRegisterRequest?: (phone: string) => void;
} = {}) {
  return render(
    <CheckInSessionProvider>
      <PrimeAndRender primary={primary} additional={additional}>
        <HouseholdMembers
          onContinue={onContinue}
          onRegisterRequest={onRegisterRequest}
        />
      </PrimeAndRender>
    </CheckInSessionProvider>,
  );
}

describe('HouseholdMembers', () => {
  it('renders the primary user without a Remove button', () => {
    renderOrganism();
    expect(screen.getByText('Primary Person')).toBeInTheDocument();
    // Remove buttons only render for additional rows.
    expect(
      screen.queryByRole('button', { name: /Remove Primary Person/i }),
    ).not.toBeInTheDocument();
  });

  it('adds a new household member via the inline phone input', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, OTHER));
    const user = userEvent.setup();
    renderOrganism();

    await user.click(
      screen.getByRole('button', { name: /Add another person/i }),
    );
    await user.type(
      screen.getByLabelText(/Phone number/i),
      '4155551111',
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Add to list/i }),
      ).not.toHaveAttribute('aria-disabled');
    });

    await user.click(screen.getByRole('button', { name: /Add to list/i }));

    expect(screen.getByText('Other Person')).toBeInTheDocument();
  });

  it('lets the volunteer remove an additional household member', async () => {
    const user = userEvent.setup();
    renderOrganism({ additional: [OTHER] });

    expect(screen.getByText('Other Person')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /Remove Other Person/i }),
    );
    expect(screen.queryByText('Other Person')).not.toBeInTheDocument();
  });

  it('rejects adding the primary user a second time with a clear error', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, PRIMARY));
    const user = userEvent.setup();
    renderOrganism();

    await user.click(
      screen.getByRole('button', { name: /Add another person/i }),
    );
    await user.type(
      screen.getByLabelText(/Phone number/i),
      '4155550000',
    );

    await waitFor(() => {
      // The resolved user is the primary, so the inline name shows.
      expect(screen.getByText('Primary Person')).toBeInTheDocument();
    });

    // Confirm button stays disabled when the resolved user matches primary.
    expect(
      screen.getByRole('button', { name: /Add to list/i }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('calls onContinue and shows a loading state while the promise is in flight', async () => {
    let resolveContinue: () => void = () => {};
    const continuePromise = new Promise<void>((resolve) => {
      resolveContinue = resolve;
    });
    const onContinue = vi.fn().mockReturnValue(continuePromise);
    const user = userEvent.setup();
    renderOrganism({ onContinue });

    await user.click(screen.getByRole('button', { name: /Continue to Items/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);

    // While in flight, the button is disabled.
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Continuar a los artículos/i }),
      ).toHaveAttribute('aria-disabled', 'true');
    });

    resolveContinue();
  });

  it('fires onRegisterRequest from the standalone register link', async () => {
    const onRegisterRequest = vi.fn();
    const user = userEvent.setup();
    renderOrganism({ onRegisterRequest });

    await user.click(
      screen.getByRole('button', { name: /Register a new person/i }),
    );
    expect(onRegisterRequest).toHaveBeenCalledWith('');
  });

  it('has no a11y violations', async () => {
    const { container } = renderOrganism({ additional: [OTHER] });
    expect(await axe(container)).toHaveNoViolations();
  });
});
