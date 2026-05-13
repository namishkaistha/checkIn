import { Navigate, Route, Routes, useParams } from 'react-router-dom';
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
