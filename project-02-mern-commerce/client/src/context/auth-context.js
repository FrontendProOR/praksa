import { createContext, useContext } from "react";

/**
 * The auth context object and its hook.
 *
 * Kept apart from the provider component so each module exports one kind of
 * thing, which is also what React Fast Refresh expects.
 */
export const AuthContext = createContext(null);

/**
 * Reads the authentication state.
 *
 * @returns {{
 *   user: object|null,
 *   isAuthenticated: boolean,
 *   isAdmin: boolean,
 *   authReady: boolean,
 *   bootstrapError: Error|null,
 *   login: (credentials: object) => Promise<object>,
 *   register: (payload: object) => Promise<object>,
 *   logout: () => Promise<void>,
 *   refreshUser: () => Promise<object|null>,
 * }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
