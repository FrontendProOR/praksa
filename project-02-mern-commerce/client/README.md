# SMWEB Lab - storefront client

React + Vite single-page application for the MERN Commerce project. It reads the catalogue from the Express API; nothing on the page is hardcoded product data.

> **Status (Day 12):** storefront with catalogue controls, account flows, and the full purchase flow - cart, checkout, order history and order details. The admin management screens are added on Day 13.

## Prerequisites

- Node.js 20.19+ or 22.12+
- The API running on `http://localhost:5000` with MongoDB available

## Setup

```bash
cd project-02-mern-commerce/client
cp .env.example .env
npm install
npm run dev
```

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the REST API, e.g. `http://localhost:5000/api` |

`VITE_*` variables are compiled into the browser bundle and are therefore public. Never put a secret in one - no database credentials, JWT secret or admin password belongs here.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | development server with hot module replacement |
| `npm run build` | production build into `dist/` |
| `npm run preview` | serve the built output (use port 5173 so it matches the API's `CLIENT_ORIGIN`) |
| `npm run lint` | oxlint |

## Structure

```text
src/
├── api/          centralised Axios client and the endpoint modules
├── components/   Header, Footer, ProductCard, ProductGrid, SearchBar,
│                 FilterPanel, Pagination, FormField, state views, ...
├── context/      AuthProvider + useAuth, CartProvider + useCart
├── hooks/        useApiResource - loading/error/data with request cancellation
│                 useCatalogParams - catalogue state read from and written to the URL
├── layouts/      StoreLayout - skip link, header, <main>, footer
├── pages/        Home, Catalog, ProductDetails, Login, Register, Cart,
│                 Checkout, Orders, OrderDetails, Account,
│                 Admin (placeholder), NotFound
├── routes/       AppRoutes, ProtectedRoute, AdminRoute
├── styles/       design tokens, base layer, one stylesheet per component
└── utils/        format.js, catalogQuery.js (parse/sanitise/serialise catalogue state)
```

## API layer

All HTTP goes through `src/api/client.js`. It is configured with `withCredentials: true` because the session JWT is delivered in an HttpOnly cookie - the token is never read by JavaScript and never stored in `localStorage` or `sessionStorage`.

A response interceptor converts both API error envelopes and transport failures into a single `ApiRequestError` carrying `message`, `code`, `status` and `details`, so components never depend on Axios internals.

## Authentication

The session lives in an HttpOnly cookie issued by the API. The client never reads, stores or renders the token - there is nothing in `localStorage` or `sessionStorage`, and `document.cookie` cannot see it. Every request carries it automatically because the shared Axios instance uses `withCredentials: true`.

On startup `AuthProvider` calls `/auth/me` to find out whether the cookie belongs to anyone. Until that answer arrives the route guards render a short "checking" state rather than redirecting, so refreshing a protected page keeps you on it.

`ProtectedRoute` sends a guest to `/login` and remembers where they were going; `AdminRoute` additionally requires the `admin` role and tells a signed-in non-admin plainly that the page is not for them. **Both are conveniences.** The API authorises every request on its own - hiding a link or a route protects nothing.

Registration always creates a `user`: the form has no role control, and the API ignores a role sent in the body.

## Cart

The cart lives in the browser and is persisted to `localStorage` under `smweb-lab-cart-v1`. A guest can fill one without an account; checkout is what requires signing in.

The stored price and stock are **display copies**. Editing them in dev tools changes what this page shows and nothing else: checkout sends only product ids and quantities, and the server re-reads price, availability and stock from the database before it prices the order. Stored data is also read back defensively - corrupted JSON, junk entries and impossible quantities are repaired or discarded rather than trusted.

Nothing sensitive is kept there: no token, no session, no personal data.

## Catalogue URL state

The catalogue keeps its state in the address bar, so a link such as

```text
/products?q=staklo&category=laboratorijsko-posude&sort=price_asc&page=2
```

reproduces exactly the same result set for anyone who opens it. Refresh and the browser Back/Forward buttons restore previous states, and defaults (`sort=newest`, page 1, empty search) are left out so the tidy URL is just `/products`.

Unsupported values are repaired rather than rejected: an unknown `sort` falls back to `newest` and an invalid `page` to 1, matching the API's own behaviour. Changing a filter resets to page 1; changing the page keeps the filters.

## Local data

If the catalogue is empty, load the development fixtures from the server package:

```bash
cd ../server
npm run seed:dev-catalogue
```
