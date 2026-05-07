import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterPage } from './RegisterPage';

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
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<div data-testid="home">HOME</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  it('shows a success banner and navigates home after a successful create', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(201, {
        id: 'u1',
        full_name: 'Jane Doe',
        phone_number: '+14155552671',
        created_at: '2026-01-01T00:00:00Z',
      }),
    );

    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderPage();
    await user.type(screen.getByLabelText(/Full name/), 'Jane Doe');
    await user.type(screen.getByLabelText(/Phone number/), '4155552671');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(
        screen.getByText('Registered. Returning home…'),
      ).toBeInTheDocument();
    });

    vi.advanceTimersByTime(1100);

    await waitFor(() => {
      expect(screen.getByTestId('home')).toBeInTheDocument();
    });
    vi.useRealTimers();
  });

  it('shows a duplicate-phone error on 409', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, { detail: 'phone exists' }),
    );

    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/Full name/), 'Jane Doe');
    await user.type(screen.getByLabelText(/Phone number/), '4155552671');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Phone already registered',
      );
    });
  });
});
