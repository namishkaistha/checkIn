import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { CheckInSummaryPage } from './CheckInSummaryPage';

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
  batch_id: 'abc-123',
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

const APPROVED_BATCH = {
  batch_id: 'abc-123',
  rows: PENDING_BATCH.rows,
  approved_at: '2026-05-13T15:00:00Z',
};

function PathProbe() {
  const location = useLocation();
  return <div data-testid="path">{location.pathname}</div>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/check-in/summary/:batchId"
          element={<CheckInSummaryPage />}
        />
        <Route
          path="/check-in/approve/:batchId"
          element={
            <>
              <div data-testid="approve">APPROVE</div>
              <PathProbe />
            </>
          }
        />
        <Route
          path="/approved/:batchId"
          element={
            <>
              <div data-testid="approved">APPROVED</div>
              <PathProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CheckInSummaryPage', () => {
  it('renders the step header while loading', () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    renderAt('/check-in/summary/abc-123');
    // Multiple role="status" nodes exist during loading (StepIndicator +
    // Spinner). Match against the step chip explicitly.
    const statuses = screen.getAllByRole('status');
    const step = statuses.find((el) => /Step 3 of 4/.test(el.textContent ?? ''));
    expect(step).toBeDefined();
    expect(step?.textContent).toMatch(/Paso 3 de 4/);
  });

  it('renders the summary organism after a successful getBatch', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, PENDING_BATCH));
    renderAt('/check-in/summary/abc-123');
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    expect(screen.getByTestId('bag-count')).toHaveTextContent('1 bag');
  });

  it('navigates to /check-in/approve/:batchId on "I am ready"', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, PENDING_BATCH));
    const user = userEvent.setup();
    renderAt('/check-in/summary/abc-123');
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /I am ready/i }));
    expect(screen.getByTestId('approve')).toBeInTheDocument();
    expect(screen.getByTestId('path')).toHaveTextContent(
      '/check-in/approve/abc-123',
    );
  });

  it('redirects to /approved/:batchId when the loaded batch is already approved', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, APPROVED_BATCH));
    renderAt('/check-in/summary/abc-123');
    await waitFor(() => {
      expect(screen.getByTestId('approved')).toBeInTheDocument();
    });
    expect(screen.getByTestId('path')).toHaveTextContent('/approved/abc-123');
  });

  it('renders an ErrorBanner on a non-404 server error', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, { detail: 'kapow' }));
    renderAt('/check-in/summary/abc-123');
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
  });

  it('has no a11y violations once the batch loads', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, PENDING_BATCH));
    const { container } = renderAt('/check-in/summary/abc-123');
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
