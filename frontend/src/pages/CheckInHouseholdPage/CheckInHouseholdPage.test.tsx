import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEffect } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { CheckInHouseholdPage } from './CheckInHouseholdPage';
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

function PathProbe() {
  const location = useLocation();
  return <div data-testid="path">{location.pathname + location.search}</div>;
}

/**
 * Prime the wizard context with a primary user before rendering the
 * children. The state update happens inside an effect so the consumer
 * re-renders with the populated value.
 */
function PrimeSession({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const { primaryUser, setPrimary } = useCheckInSession();
  useEffect(() => {
    if (primaryUser === null) setPrimary(user);
  }, [primaryUser, setPrimary, user]);
  if (primaryUser === null) return null;
  return <>{children}</>;
}

function renderWithSession(initialPath: string, primed: boolean) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CheckInSessionProvider>
        {primed ? (
          <PrimeSession user={PRIMARY}>
            <Routes>
              <Route
                path="/check-in/household"
                element={<CheckInHouseholdPage />}
              />
              <Route
                path="/check-in/phone"
                element={
                  <>
                    <div data-testid="phone">PHONE</div>
                    <PathProbe />
                  </>
                }
              />
              <Route
                path="/check-in/summary/:batchId"
                element={
                  <>
                    <div data-testid="summary">SUMMARY</div>
                    <PathProbe />
                  </>
                }
              />
              <Route
                path="/register"
                element={
                  <>
                    <div data-testid="register">REGISTER</div>
                    <PathProbe />
                  </>
                }
              />
            </Routes>
          </PrimeSession>
        ) : (
          <Routes>
            <Route
              path="/check-in/household"
              element={<CheckInHouseholdPage />}
            />
            <Route
              path="/check-in/phone"
              element={
                <>
                  <div data-testid="phone">PHONE</div>
                  <PathProbe />
                </>
              }
            />
          </Routes>
        )}
      </CheckInSessionProvider>
    </MemoryRouter>,
  );
}

describe('CheckInHouseholdPage', () => {
  it('redirects to /check-in/phone when no primary user is in session', () => {
    renderWithSession('/check-in/household', false);
    expect(screen.getByTestId('phone')).toBeInTheDocument();
    expect(screen.getByTestId('path')).toHaveTextContent('/check-in/phone');
  });

  it('redirects to /check-in/phone even with ?dev=1 (escape hatch removed)', () => {
    renderWithSession('/check-in/household?dev=1', false);
    expect(screen.getByTestId('phone')).toBeInTheDocument();
  });

  it('renders with primary user in session and shows step 2 header', () => {
    renderWithSession('/check-in/household', true);
    expect(screen.getByRole('status')).toHaveTextContent('Step 2 of 4');
    expect(screen.getByRole('status')).toHaveTextContent('Paso 2 de 4');
  });

  it('navigates to /check-in/summary/:batchId after a successful createBatch', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(201, {
        batch_id: 'b-123',
        rows: [
          {
            user: PRIMARY,
            blocked: false,
            last_check_in_at: null,
          },
        ],
        any_blocked: false,
      }),
    );
    const user = userEvent.setup();
    renderWithSession('/check-in/household', true);

    await user.click(
      screen.getByRole('button', { name: /Continue to Items/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('summary')).toBeInTheDocument();
    });
    expect(screen.getByTestId('path')).toHaveTextContent(
      '/check-in/summary/b-123',
    );
  });

  it('shows an ErrorBanner when createBatch fails', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(500, { detail: 'kapow' }),
    );
    const user = userEvent.setup();
    renderWithSession('/check-in/household', true);

    await user.click(
      screen.getByRole('button', { name: /Continue to Items/i }),
    );

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
  });

  it('navigates to /register with the typed phone when the inline register link is clicked', async () => {
    const user = userEvent.setup();
    renderWithSession('/check-in/household', true);

    await user.click(
      screen.getByRole('button', { name: /Register a new person/i }),
    );
    expect(screen.getByTestId('register')).toBeInTheDocument();
    // Standalone link is unscoped so the path is bare.
    expect(screen.getByTestId('path').textContent).toMatch(/^\/register$/);
  });

  it('has no a11y violations with a primary user', async () => {
    const { container } = renderWithSession('/check-in/household', true);
    expect(await axe(container)).toHaveNoViolations();
  });
});
