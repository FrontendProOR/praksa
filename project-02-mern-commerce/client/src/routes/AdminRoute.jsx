import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context.js";
import Container from "../components/Container.jsx";
import { ErrorState, LoadingState } from "../components/StateViews.jsx";

/**
 * Gate for admin-only routes.
 *
 * A guest is sent to the login page; a signed-in user without the admin role
 * is told plainly that the area is not for them rather than being bounced to
 * a login form they have already completed.
 *
 * The role comes from the user record the server returned for the session
 * cookie - never from anything the browser can edit. Hiding the area here is
 * only about not showing a dead end: every admin endpoint is authorised again
 * on the server.
 */
function AdminRoute() {
  const { isAuthenticated, isAdmin, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return (
      <section className="section">
        <Container>
          <LoadingState label="Provjera ovlaštenja..." />
        </Container>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <section className="section">
        <Container>
          <ErrorState
            headingLevel={1}
            title="Pristup nije dozvoljen"
            message="Ova stranica je dostupna samo administratorima."
          />
        </Container>
      </section>
    );
  }

  return <Outlet />;
}

export default AdminRoute;
