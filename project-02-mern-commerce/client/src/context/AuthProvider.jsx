import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context.js";
import * as authApi from "../api/auth.js";
import { setUnauthorizedHandler } from "../api/client.js";

/**
 * Authentication state for the whole application.
 *
 * The browser never holds the JWT: it lives in an HttpOnly cookie that only
 * the server can read or clear. What this provider keeps is the safe user
 * object returned by `/auth/me` - name, email, role, created date - and
 * nothing else. There is no token in state, in localStorage, or anywhere else
 * JavaScript can reach.
 *
 * On startup the session is established by asking the API who the cookie
 * belongs to. A 401 there is the normal answer for a guest, not an error; a
 * transport failure is reported separately so "not logged in" and "the server
 * is unreachable" are never confused.
 */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" until the first /auth/me settles, so guards never redirect early.
  const [status, setStatus] = useState("loading");
  const [bootstrapError, setBootstrapError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    authApi
      .fetchCurrentUser({ signal: controller.signal })
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) return;
        setUser(null);
        // 401 simply means "no session"; anything else is worth surfacing.
        if (error?.status !== 401) setBootstrapError(error);
      })
      .finally(() => {
        if (active) setStatus("ready");
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  // A session that expires or is invalidated server-side drops the client
  // state on the next rejected request, so the UI cannot keep showing a
  // signed-in header for a session that no longer exists.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (credentials) => {
    const signedIn = await authApi.login(credentials);
    setUser(signedIn);
    return signedIn;
  }, []);

  const register = useCallback(async (payload) => {
    // The API starts the session on successful registration.
    const created = await authApi.registerAccount(payload);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // The cookie is cleared server-side; drop the local state either way so
      // the UI cannot be left showing a session the user asked to end.
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.fetchCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      authReady: status === "ready",
      bootstrapError,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, status, bootstrapError, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
