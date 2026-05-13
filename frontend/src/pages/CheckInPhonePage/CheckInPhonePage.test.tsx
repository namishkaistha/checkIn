import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { CheckInPhonePage } from './CheckInPhonePage';
import { CheckInSessionProvider } from '../../state/CheckInSessionContext';

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

const RESOLVED_USER = {
  id: 'u1',
  full_name: 'Jane Doe',
  phone_number: '+14155552671',
  created_at: '2026-01-01T00:00:00Z',
};

function PathProbe() {
  const location = useLocation();
  return <div data-testid="path">{location.pathname + location.search}</div>;
}

function renderAt(path = '/check-in/phone') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CheckInSessionProvider>
        <Routes>
          <Route path="/check-in/phone" element={<CheckInPhonePage />} />
          <Route
            path="/check-in/household"
            element={
              <>
                <div data-testid="household">HOUSEHOLD</div>
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
      </CheckInSessionProvider>
    </MemoryRouter>,
  );
}

describe('CheckInPhonePage', () => {
  it('renders without crashing and shows the step header text', () => {
    fetchMock.mockResolvedValue(jsonResponse(200, RESOLVED_USER));
    renderAt();
    expect(screen.getByRole('status')).toHaveTextContent('Step 1 of 4');
    expect(screen.getByRole('status')).toHaveTextContent('Paso 1 de 4');
  });

  it('disables Continue until the phone resolves to a user', () => {
    fetchMock.mockResolvedValue(jsonResponse(200, RESOLVED_USER));
    renderAt();
    expect(
      screen.getByRole('button', { name: /Continue/i }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('navigates to /check-in/household after resolving and clicking Continue', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, RESOLVED_USER));
    const user = userEvent.setup();
    renderAt();

    await user.type(
      screen.getByLabelText(/Your phone number/i),
      '4155552671',
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Continue/i }),
      ).not.toHaveAttribute('aria-disabled');
    });

    await user.click(screen.getByRole('button', { name: /Continue/i }));
    expect(screen.getByTestId('household')).toBeInTheDocument();
    expect(screen.getByTestId('path')).toHaveTextContent('/check-in/household');
  });

  it('navigates to /register with the phone query param when unregistered', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { detail: 'nope' }));
    const user = userEvent.setup();
    renderAt();

    await user.type(
      screen.getByLabelText(/Your phone number/i),
      '2125551234',
    );

    const registerBtn = await screen.findByRole('button', {
      name: 'Register this person',
    });
    await user.click(registerBtn);

    expect(screen.getByTestId('register')).toBeInTheDocument();
    expect(screen.getByTestId('path')).toHaveTextContent(
      '/register?phone=%2B12125551234',
    );
  });

  it('has no a11y violations', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, RESOLVED_USER));
    const { container } = renderAt();
    expect(await axe(container)).toHaveNoViolations();
  });
});
