import axios from "axios";

/**
 * The single Axios instance for the whole application.
 *
 * No component builds its own base URL or calls axios directly - every request
 * goes through the modules in `src/api/`.
 *
 * `withCredentials` is on from the start: the session JWT lives in an HttpOnly
 * cookie, so the browser has to be allowed to send it. Nothing here reads or
 * stores a token; JavaScript cannot see it, and it is never put in
 * localStorage or sessionStorage.
 */

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

/** Error codes the API is allowed to return, per the API contract. */
export const API_ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  INTERNAL_ERROR: "INTERNAL_ERROR",
});

/** Normalised error the UI can rely on, whatever went wrong underneath. */
export class ApiRequestError extends Error {
  constructor({ message, code, status, details }) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
    this.details = details ?? [];
  }

  get isNotFound() {
    return this.code === API_ERROR_CODES.NOT_FOUND || this.status === 404;
  }

  /** True when the request never reached the API (server down, DNS, timeout). */
  get isNetworkError() {
    return this.status === 0;
  }
}

/**
 * Turns anything Axios throws into an ApiRequestError.
 *
 * The API always answers with `{ success:false, error:{ code, message, details } }`,
 * so that shape is preferred; a server that is unreachable or replies with
 * something unexpected still produces a readable message.
 */
function normaliseError(error) {
  const payload = error.response?.data;

  if (payload && payload.success === false && payload.error) {
    return new ApiRequestError({
      message: payload.error.message || "Zahtjev nije uspio.",
      code: payload.error.code,
      status: error.response.status,
      details: payload.error.details,
    });
  }

  if (error.response) {
    return new ApiRequestError({
      message: `Neočekivan odgovor servera (HTTP ${error.response.status}).`,
      code: API_ERROR_CODES.INTERNAL_ERROR,
      status: error.response.status,
    });
  }

  return new ApiRequestError({
    message:
      "Server trenutno nije dostupan. Provjerite da li je API pokrenut i pokušajte ponovo.",
    code: API_ERROR_CODES.INTERNAL_ERROR,
    status: 0,
  });
}

/**
 * Called when the API rejects a request as unauthenticated, so the app can
 * drop a session that expired or was invalidated on the server.
 *
 * The auth endpoints are excluded: a failed login or a bootstrap `/me` for a
 * guest are normal outcomes, not an expiring session, and reacting to them
 * here would fight with the auth flow.
 */
let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/me", "/auth/logout"];

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = normaliseError(error);
    const url = error.config?.url ?? "";
    const isAuthCall = AUTH_PATHS.some((path) => url.startsWith(path));

    if (apiError.status === 401 && !isAuthCall) onUnauthorized?.();

    return Promise.reject(apiError);
  },
);

/**
 * Unwraps the success envelope.
 *
 * @param {import("axios").AxiosResponse} response
 * @returns {{ data: object, meta: object|undefined }}
 */
export function unwrap(response) {
  const body = response.data;

  if (!body || body.success !== true) {
    throw new ApiRequestError({
      message: "Neočekivan format odgovora servera.",
      code: API_ERROR_CODES.INTERNAL_ERROR,
      status: response.status,
    });
  }

  return { data: body.data, meta: body.meta };
}
