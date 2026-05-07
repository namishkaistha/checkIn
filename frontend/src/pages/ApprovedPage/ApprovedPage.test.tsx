import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApprovedPage } from './ApprovedPage';

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

const APPROVED_BATCH = {
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
  approved_at: '2026-05-04T12:00:00Z',
};

function renderPage(id = 'batch-xyz') {
  return render(
    <MemoryRouter initialEntries={[`/approved/${id}`]}>
      <Routes>
        <Route path="/approved/:id" element={<ApprovedPage />} />
        <Route path="/" element={<div data-testid="home">HOME</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ApprovedPage', () => {
  it('renders the ApprovedCard with the count from the loaded batch', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, APPROVED_BATCH));
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Checked in' }),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId('bag-count')).toHaveTextContent('1 bag');
  });

  it('navigates home when Done is pressed', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, APPROVED_BATCH));
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Done' }),
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByTestId('home')).toBeInTheDocument();
  });
});
