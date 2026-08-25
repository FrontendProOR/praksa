# SMWEB MERN Commerce (Project 2)

A scoped e-commerce application built on the MERN stack: **MongoDB, Express.js, React and Node.js**. It is the main project of the 2026 internship and demonstrates data modelling, a REST API with CRUD, JWT authentication in an HttpOnly cookie, a React storefront and admin area, and end-to-end functional testing.

> **Status: full purchase flow (Day 12).** Catalogue, authentication, cart, checkout and order history all work end to end against MongoDB.
> The admin management screens are added on Day 13, and the final setup/seed/test documentation on Day 15.

---

## Structure

```text
project-02-mern-commerce/
├── server/          Express + MongoDB REST API
│   ├── .env.example
│   └── src/
│       ├── models/  User, Category, Product, Order
│       └── utils/   slugify
└── client/          React + Vite storefront
    ├── .env.example
    └── src/         api, components, hooks, layouts, pages, routes, styles, utils
```

## Requirements and architecture

The full specification - roles, use cases, data model, relationships, indexes, REST API surface, response envelope, cart and order rules, and environment configuration - is in [`../docs/project-02-requirements.md`](../docs/project-02-requirements.md).

## Configuration

Copy the example files and fill in local values; real `.env` files are git-ignored.

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

The server expects a local MongoDB at `mongodb://127.0.0.1:27017/smweb_mern_commerce`. A MongoDB server must be installed before Day 07 - see section 9.4 of the requirements document.

## Running the API

Start MongoDB first (see the requirements document, section 9.4), then:

```bash
cd server
npm install
npm start        # node src/server.js
npm run dev      # same, with nodemon reload
```

The server refuses to start - with a clear message and exit code 1 - when `MONGODB_URI` is missing or MongoDB cannot be reached.

```bash
curl http://localhost:5000/api/health
curl "http://localhost:5000/api/products?page=1&limit=12&sort=newest"
```

## Endpoints available today

| Method | Path | Access |
|---|---|---|
| GET | `/api/health` | public |
| POST | `/api/auth/register` | public - always creates a `user`, starts the session |
| POST | `/api/auth/login` | public, rate limited |
| POST | `/api/auth/logout` | public, idempotent |
| GET | `/api/auth/me` | authenticated |
| GET | `/api/categories` | public |
| GET | `/api/categories/:slug` | public |
| GET | `/api/products` | public - supports `q`, `category`, `sort`, `page`, `limit`, `featured` |
| GET | `/api/products/:slug` | public - active products only |
| POST/PUT/DELETE | `/api/products`, `/api/categories` | **admin only** - 401 without a session, 403 as a normal user |
| POST | `/api/orders` | authenticated - server prices the order and takes stock |
| GET | `/api/orders/mine` | authenticated - own orders only |
| GET | `/api/orders/:id` | authenticated - own order, or any order for an admin |

## Authentication

The JWT is delivered in an **HttpOnly** cookie named `access_token` (`SameSite=Lax`, `Path=/`, 60-minute expiry, `Secure` only in production). It is never returned in a response body, so browser JavaScript cannot read it and there is nothing to keep in `localStorage`. Client requests must therefore send credentials (`withCredentials: true` in Axios).

Passwords are hashed with bcrypt and only the hash is stored; `passwordHash` never appears in any API response.

### Creating a development admin

Registration always produces a `user` - there is no endpoint that grants the admin role. Create one locally:

```bash
cd server
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeMe123' npm run seed:admin
```

Choose your own values; they are read from the environment, never printed, and never committed.

## Running the storefront

With the API running, in a second terminal:

```bash
cd client
npm install
npm run dev      # http://localhost:5173
```

The client reads `VITE_API_BASE_URL` from `client/.env`. Its port must match the API's `CLIENT_ORIGIN`, because CORS only allows the configured origin - starting the client on another port is correctly rejected by the API.

Pages available today: home, catalogue, product details, login, registration, cart, checkout, order history, order details, account and a 404 page. See [`client/README.md`](client/README.md).

## Development data

```bash
cd server
npm run seed:dev-catalogue   # fictional categories and products for local work
npm run check:models         # registers all four models; no database connection needed
```

`seed:dev-catalogue` clears and reloads only the catalogue collections, so it is safe to re-run. It is a development fixture, not the deliverable seed - Day 15 implements that.

## Key rules

- The cart lives in the browser (`localStorage` key `smweb-lab-cart-v1`); there is no cart collection, and nothing sensitive is stored there.
- The client sends only product ids and quantities when ordering. The server re-reads the products and recomputes every price and total.
- Order items store name, SKU and unit price snapshots, so order history survives product changes and deletions.
- Shipping is a flat 6.90 KM, free from 100 KM upwards; the figure is computed on the server.
- Stock is taken with a conditional atomic update, so two buyers racing for the last unit cannot both succeed and stock never goes negative. MongoDB here is standalone, so there are no transactions - the sequence compensates instead, and that limitation is documented rather than hidden.
- Passwords are stored only as bcrypt hashes and are never returned by the API.
- Registration always creates the `user` role; admin accounts come from the seed script.
