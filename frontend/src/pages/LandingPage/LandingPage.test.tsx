import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { LandingPage } from './LandingPage';

function renderAt(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/check-in"
          element={<div data-testid="check-in">CHECKIN</div>}
        />
        <Route
          path="/register"
          element={<div data-testid="register">REGISTER</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LandingPage', () => {
  it('renders the heading and both navigation buttons', () => {
    renderAt('/');
    expect(
      screen.getByRole('heading', { name: 'Pantry Check-In' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Check In' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Register a new person' }),
    ).toBeInTheDocument();
  });

  it('navigates to /check-in', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('button', { name: 'Check In' }));
    expect(screen.getByTestId('check-in')).toBeInTheDocument();
  });

  it('navigates to /register', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(
      screen.getByRole('button', { name: 'Register a new person' }),
    );
    expect(screen.getByTestId('register')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = renderAt('/');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
