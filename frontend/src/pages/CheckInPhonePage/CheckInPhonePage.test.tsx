import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { CheckInPhonePage } from './CheckInPhonePage';

function PathProbe() {
  const location = useLocation();
  return <div data-testid="path">{location.pathname}</div>;
}

function renderAt(path = '/check-in/phone') {
  return render(
    <MemoryRouter initialEntries={[path]}>
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
      </Routes>
    </MemoryRouter>,
  );
}

describe('CheckInPhonePage', () => {
  it('renders without crashing and shows the step header text', () => {
    renderAt();
    // StepIndicator renders both languages in a single role=status node.
    expect(screen.getByRole('status')).toHaveTextContent('Step 1 of 4');
    expect(screen.getByRole('status')).toHaveTextContent('Paso 1 de 4');
  });

  it('renders a Continue button with a Spanish sub-label', () => {
    renderAt();
    expect(
      screen.getByRole('button', { name: /Continue/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Continuar')).toBeInTheDocument();
  });

  it('navigates to /check-in/household when Continue is clicked', async () => {
    const user = userEvent.setup();
    renderAt();
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    expect(screen.getByTestId('household')).toBeInTheDocument();
    expect(screen.getByTestId('path')).toHaveTextContent('/check-in/household');
  });

  it('has no a11y violations', async () => {
    const { container } = renderAt();
    expect(await axe(container)).toHaveNoViolations();
  });
});
