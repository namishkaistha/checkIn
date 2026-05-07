import { Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage/LandingPage';
import { CheckInPage } from './pages/CheckInPage/CheckInPage';
import { RegisterPage } from './pages/RegisterPage/RegisterPage';
import { ConfirmationPage } from './pages/ConfirmationPage/ConfirmationPage';
import { ApprovedPage } from './pages/ApprovedPage/ApprovedPage';

/**
 * Top-level router. M4 wave B replaces the M3 placeholders with the real
 * page components composed from atoms / molecules / organisms.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/check-in" element={<CheckInPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/confirm/:id" element={<ConfirmationPage />} />
      <Route path="/approved/:id" element={<ApprovedPage />} />
    </Routes>
  );
}
