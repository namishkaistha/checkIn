import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckInPage } from './CheckInPage';

// jsdom doesn't implement HTMLDialogElement methods. Polyfill the bits we
// rely on so the dialog interactions work under test.
beforeEach(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '');
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
});

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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/check-in']}>
      <Routes>
        <Route path="/check-in" element={<CheckInPage />} />
        <Route
          path="/confirm/:id"
          element={<div data-testid="confirm-page">CONFIRM</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

const RESOLVED_USER = {
  id: 'u1',
  full_name: 'Jane Doe',
  phone_number: '+14155552671',
  created_at: '2026-01-01T00:00:00Z',
};

describe('CheckInPage', () => {
  it('submits the form and navigates to /confirm/:id on success', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/users/lookup')) {
        return Promise.resolve(jsonResponse(200, RESOLVED_USER));
      }
      if (url.endsWith('/check-ins') && init?.method === 'POST') {
        return Promise.resolve(
          jsonResponse(200, {
            batch_id: 'batch-xyz',
            rows: [{ user: RESOLVED_USER, blocked: false, last_check_in_at: null }],
            any_blocked: false,
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { detail: 'unknown' }));
    });

    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText('Your phone number'),
      '4155552671',
    );
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Continue' }),
      ).not.toHaveAttribute('aria-disabled');
    });

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-page')).toBeInTheDocument();
    });
  });

  it('opens the registration modal when an unknown phone is registered mid-flow', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/users/lookup')) {
        return Promise.resolve(jsonResponse(404, { detail: 'nope' }));
      }
      return Promise.resolve(jsonResponse(404, { detail: 'unknown' }));
    });

    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText('Your phone number'),
      '2125551234',
    );
    const link = await screen.findByRole('button', {
      name: 'Register this person now',
    });
    await user.click(link);

    expect(
      await screen.findByRole('heading', { name: 'Register a new person' }),
    ).toBeInTheDocument();
  });
});
