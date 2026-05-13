import { describe, it, expect } from 'vitest';
import { useEffect } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { CheckInHouseholdPage } from './CheckInHouseholdPage';
import {
  CheckInSessionProvider,
  useCheckInSession,
} from '../../state/CheckInSessionContext';
import type { User } from '../../api/types';

const PRIMARY: User = {
  id: 'p1',
  full_name: 'Primary Person',
  phone_number: '+14155550000',
  created_at: '2026-01-01T00:00:00Z',
};

function PathProbe() {
  const location = useLocation();
  return <div data-testid="path">{location.pathname}</div>;
}

/**
 * Helper that primes the wizard context with a primary user before
 * rendering children. We do it in an effect so the state update happens
 * within React's flow and the consumer re-renders with the populated
 * value.
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
            <Route
              path="/check-in/summary/:batchId"
              element={
                <>
                  <div data-testid="summary">SUMMARY</div>
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

  it('skips the redirect when ?dev=1 is present, even without a primary user', () => {
    renderWithSession('/check-in/household?dev=1', false);
    expect(screen.queryByTestId('phone')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Step 2 of 4');
  });

  it('renders with primary user in session and shows step 2 header', () => {
    renderWithSession('/check-in/household', true);
    expect(screen.getByRole('status')).toHaveTextContent('Step 2 of 4');
    expect(screen.getByRole('status')).toHaveTextContent('Paso 2 de 4');
  });

  it('navigates to /check-in/summary/PLACEHOLDER on Continue', async () => {
    const user = userEvent.setup();
    renderWithSession('/check-in/household', true);
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    expect(screen.getByTestId('summary')).toBeInTheDocument();
    expect(screen.getByTestId('path')).toHaveTextContent(
      '/check-in/summary/PLACEHOLDER',
    );
  });

  it('has no a11y violations with a primary user', async () => {
    const { container } = renderWithSession('/check-in/household', true);
    expect(await axe(container)).toHaveNoViolations();
  });
});
