# SMWEB Lab - storefront client

React + Vite single-page application for the MERN Commerce project. It reads the catalogue from the Express API; nothing on the page is hardcoded product data.

> **Status (Day 10):** storefront with a full catalogue interaction layer - search, category and featured filters, sorting, pagination and URL-backed state. Authentication screens, cart, checkout and the admin area are added on their scheduled days.

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
│                 FilterPanel, Pagination, state views, ...
├── hooks/        useApiResource - loading/error/data with request cancellation
│                 useCatalogParams - catalogue state read from and written to the URL
├── layouts/      StoreLayout - skip link, header, <main>, footer
├── pages/        HomePage, CatalogPage, ProductDetailsPage, NotFoundPage
├── routes/       AppRoutes
├── styles/       design tokens, base layer, one stylesheet per component
└── utils/        format.js, catalogQuery.js (parse/sanitise/serialise catalogue state)
```

## API layer

All HTTP goes through `src/api/client.js`. It is configured with `withCredentials: true` because the session JWT is delivered in an HttpOnly cookie - the token is never read by JavaScript and never stored in `localStorage` or `sessionStorage`.

A response interceptor converts both API error envelopes and transport failures into a single `ApiRequestError` carrying `message`, `code`, `status` and `details`, so components never depend on Axios internals.

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
