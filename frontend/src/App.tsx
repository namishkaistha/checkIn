import { useEffect } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { API_BASE_URL } from './api/client';
import { LandingPage } from './pages/LandingPage/LandingPage';
import { RegisterPage } from './pages/RegisterPage/RegisterPage';
import { CheckInPhonePage } from './pages/CheckInPhonePage/CheckInPhonePage';
import { CheckInHouseholdPage } from './pages/CheckInHouseholdPage/CheckInHouseholdPage';
import { CheckInSummaryPage } from './pages/CheckInSummaryPage/CheckInSummaryPage';
import { CheckInApprovePage } from './pages/CheckInApprovePage/CheckInApprovePage';
import { ApprovedPage } from './pages/ApprovedPage/ApprovedPage';
import { CheckInSessionRoute } from './state/CheckInSessionRoute';

/**
 * Redirect from the legacy `/confirm/:id` route to the new wizard's
 * approve step. Kept for one milestone so old links / bookmarks survive
 * the rename; M6f or later can drop it.
 */
function LegacyConfirmRedirect() {
  const { id } = useParams<{ id: string }>();
  // If somehow the id is missing, send the user back to the wizard start.
  if (!id) return <Navigate to="/check-in/phone" replace />;
  return <Navigate to={`/check-in/approve/${id}`} replace />;
}

/**
 * Top-level router. M6d restructured the check-in flow into a 4-step
 * wizard under `/check-in/*`. The `CheckInSessionRoute` parent element
 * mounts `CheckInSessionProvider` around the wizard pages so their
 * shared state lives exactly as long as the volunteer is in the wizard.
 */
export default function App() {
  // Warm-up ping. Vercel Python cold-start (~1-2s) + Neon scale-to-zero
  // cold-start (~0.3-1s) hit the first real request after idle time and
  // add up to a 2-3s wait for whichever page action fires it. Landing on
  // the app doesn't need the API, so a fire-and-forget health hit on
  // mount lets the containers wake up while the volunteer reads the
  // landing screen — by the time they type a phone number the round-trip
  // is a normal ~200ms.
  useEffect(() => {
    fetch(`${API_BASE_URL.replace(/\/$/, '')}/health`, {
      method: 'GET',
      cache: 'no-store',
    }).catch(() => {
      /* best-effort; a failed warm-up doesn't break anything */
    });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<CheckInSessionRoute />}>
        <Route
          path="/check-in"
          element={<Navigate to="/check-in/phone" replace />}
        />
        <Route path="/check-in/phone" element={<CheckInPhonePage />} />
        <Route
          path="/check-in/household"
          element={<CheckInHouseholdPage />}
        />
        <Route
          path="/check-in/summary/:batchId"
          element={<CheckInSummaryPage />}
        />
        <Route
          path="/check-in/approve/:batchId"
          element={<CheckInApprovePage />}
        />
      </Route>
      <Route path="/confirm/:id" element={<LegacyConfirmRedirect />} />
      <Route path="/approved/:id" element={<ApprovedPage />} />
    </Routes>
  );
}
