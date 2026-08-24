import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context.js";
import Container from "../components/Container.jsx";
import { LoadingState } from "../components/StateViews.jsx";

/**
 * Gate for routes that need a signed-in user.
 *
 * Nothing is decided until the startup `/auth/me` has settled: redirecting
 * before that would bounce a signed-in user to the login page on every refresh.
 *
 * The attempted location is passed along so the login page can return the user
 * where they were going.
 *
 * This is a convenience for the user, not a security boundary - the API
 * authorises every request on its own.
 */
function ProtectedRoute() {
  const { isAuthenticated, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return (
      <section className="section">
        <Container>
          <LoadingState label="Provjera prijave..." />
        </Container>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
