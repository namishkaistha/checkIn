// CheckInSessionRoute: parent route element that mounts the wizard provider
// around every nested `/check-in/*` route. Navigating away unmounts the
// provider and discards wizard session state — the intended behavior per
// the redesign plan (no persistence).
import { Outlet } from 'react-router-dom';
import { CheckInSessionProvider } from './CheckInSessionContext';

export function CheckInSessionRoute() {
  return (
    <CheckInSessionProvider>
      <Outlet />
    </CheckInSessionProvider>
  );
}

export default CheckInSessionRoute;
