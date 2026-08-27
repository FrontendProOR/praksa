import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import ProtectedRoute from "../routes/ProtectedRoute.jsx";
import AdminRoute from "../routes/AdminRoute.jsx";
import { AuthContext } from "../context/auth-context.js";

/**
 * Section 12: a protected-route behaviour test.
 *
 * These guards are a convenience, not a security boundary - the API authorises
 * every request on its own - but they still have to behave: never decide
 * anything before the startup `/auth/me` has settled, remember where the user
 * was going, and tell a signed-in non-admin plainly rather than bouncing them
 * to a login form they have already completed.
 */
function renderAt(path, auth, { admin = false } = {}) {
  const value = {
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    authReady: true,
    bootstrapError: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    ...auth,
  };

  const Guard = admin ? AdminRoute : ProtectedRoute;

  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Guard />}>
            <Route path="/account" element={<h1>Moj nalog</h1>} />
            <Route path="/checkout" element={<h1>Plaćanje</h1>} />
            <Route path="/admin" element={<h1>Pregled</h1>} />
          </Route>
          <Route path="/login" element={<h1>Prijava</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("ProtectedRoute", () => {
  test("a guest is sent to the login page", () => {
    renderAt("/account", { isAuthenticated: false });

    expect(screen.getByRole("heading", { name: "Prijava" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Moj nalog" })).not.toBeInTheDocument();
  });

  test("a signed-in user reaches the page", () => {
    renderAt("/account", { isAuthenticated: true, user: { id: "1", role: "user" } });

    expect(screen.getByRole("heading", { name: "Moj nalog" })).toBeInTheDocument();
  });

  test("nothing is decided while the session is still being checked", () => {
    renderAt("/account", { isAuthenticated: false, authReady: false });

    // Neither the page nor a redirect: a waiting state, so a refresh does not
    // bounce a signed-in user to the login form.
    expect(screen.queryByRole("heading", { name: "Prijava" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Moj nalog" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/provjera/i);
  });

  test("checkout is protected the same way", () => {
    renderAt("/checkout", { isAuthenticated: false });
    expect(screen.getByRole("heading", { name: "Prijava" })).toBeInTheDocument();
  });
});

describe("AdminRoute", () => {
  test("a guest is sent to the login page", () => {
    renderAt("/admin", { isAuthenticated: false }, { admin: true });

    expect(screen.getByRole("heading", { name: "Prijava" })).toBeInTheDocument();
  });

  test("a signed-in non-admin is refused, not redirected to login", () => {
    renderAt(
      "/admin",
      { isAuthenticated: true, isAdmin: false, user: { id: "1", role: "user" } },
      { admin: true },
    );

    expect(screen.queryByRole("heading", { name: "Pregled" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Prijava" })).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/nije dozvoljen/i);
  });

  test("an admin reaches the admin page", () => {
    renderAt(
      "/admin",
      { isAuthenticated: true, isAdmin: true, user: { id: "1", role: "admin" } },
      { admin: true },
    );

    expect(screen.getByRole("heading", { name: "Pregled" })).toBeInTheDocument();
  });

  test("the admin gate also waits for the session check", () => {
    renderAt("/admin", { isAuthenticated: true, isAdmin: true, authReady: false }, { admin: true });

    expect(screen.queryByRole("heading", { name: "Pregled" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/provjera/i);
  });

  test("a role claimed only in the browser does not open the admin area", () => {
    // `isAdmin` is derived from the user record the server returned for the
    // session cookie. A user object that merely says "admin" is not enough.
    renderAt(
      "/admin",
      { isAuthenticated: true, isAdmin: false, user: { id: "1", role: "admin" } },
      { admin: true },
    );

    expect(screen.queryByRole("heading", { name: "Pregled" })).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
