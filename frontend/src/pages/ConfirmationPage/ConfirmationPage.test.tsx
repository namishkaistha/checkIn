import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConfirmationPage } from './ConfirmationPage';

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

const PENDING_BATCH = {
  batch_id: 'batch-xyz',
  rows: [
    {
      user: {
        id: 'u1',
        full_name: 'Jane Doe',
        phone_number: '+14155552671',
        created_at: '2026-01-01T00:00:00Z',
      },
      blocked: false,
      last_check_in_at: null,
    },
  ],
  any_blocked: false,
};

function renderAt(id = 'batch-xyz') {
  return render(
    <MemoryRouter initialEntries={[`/confirm/${id}`]}>
      <Routes>
        <Route path="/confirm/:id" element={<ConfirmationPage />} />
        <Route
          path="/approved/:id"
          element={<div data-testid="approved-page">APPROVED</div>}
        />
        <Route path="/" element={<div data-testid="home">HOME</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ConfirmationPage', () => {
  it('fetches the batch on mount and renders ApprovalCard', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, PENDING_BATCH));
    renderAt('batch-xyz');

    await waitFor(() => {
      expect(screen.getByTestId('bag-count')).toHaveTextContent('1 bag');
    });
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders an error + go-home button on 404', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(404, { detail: 'Batch not found' }),
    );
    renderAt('does-not-exist');

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Go home' }),
      ).toBeInTheDocument();
    });
  });

  it('approves the batch and navigates to /approved/:id', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (
        url.endsWith('/check-ins/batch-xyz/approve') &&
        init?.method === 'POST'
      ) {
        return Promise.resolve(
          jsonResponse(200, {
            ...PENDING_BATCH,
            approved_at: '2026-05-04T12:00:00Z',
          }),
        );
      }
      if (url.endsWith('/check-ins/batch-xyz')) {
        return Promise.resolve(jsonResponse(200, PENDING_BATCH));
      }
      return Promise.resolve(jsonResponse(404, { detail: 'unknown' }));
    });

    renderAt('batch-xyz');

    await waitFor(() => {
      expect(screen.getByTestId('bag-count')).toBeInTheDocument();
    });

    // Hold the button for the full long-press duration with real timers.
    const btn = screen.getByRole('button', {
      name: /Volunteer: hold to approve/,
    });
    fireEvent.pointerDown(btn, { button: 0 });
    await new Promise((r) => setTimeout(r, 1700));
    fireEvent.pointerUp(btn);

    await waitFor(() => {
      expect(screen.getByTestId('approved-page')).toBeInTheDocument();
    });
  });
});
