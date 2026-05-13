import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { CheckInSummaryPage } from './CheckInSummaryPage';

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
      </Routes>
    </MemoryRouter>,
  );
}

describe('CheckInSummaryPage', () => {
  it('renders without crashing and shows step 3 of 4', () => {
    renderAt('/check-in/summary/PLACEHOLDER');
    expect(screen.getByRole('status')).toHaveTextContent('Step 3 of 4');
    expect(screen.getByRole('status')).toHaveTextContent('Paso 3 de 4');
  });

  it('renders the placeholder body for the PLACEHOLDER batchId', () => {
    renderAt('/check-in/summary/PLACEHOLDER');
    // Sanity: at least one element references the placeholder copy in English.
    expect(
      screen.getAllByText(/Coming in the next milestone/i).length,
    ).toBeGreaterThan(0);
  });

  it('navigates to /check-in/approve/:batchId on "I am ready"', async () => {
    const user = userEvent.setup();
    renderAt('/check-in/summary/abc-123');
    await user.click(screen.getByRole('button', { name: /I am ready/i }));
    expect(screen.getByTestId('approve')).toBeInTheDocument();
    expect(screen.getByTestId('path')).toHaveTextContent(
      '/check-in/approve/abc-123',
    );
  });

  it('has no a11y violations', async () => {
    const { container } = renderAt('/check-in/summary/PLACEHOLDER');
    expect(await axe(container)).toHaveNoViolations();
  });
});
