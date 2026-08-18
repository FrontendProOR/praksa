# SMWEB MERN Commerce (Project 2)

A scoped e-commerce application built on the MERN stack: **MongoDB, Express.js, React and Node.js**. It is the main project of the 2026 internship and demonstrates data modelling, a REST API with CRUD, JWT authentication in an HttpOnly cookie, a React storefront and admin area, and end-to-end functional testing.

> **Status: Express API foundation with product and category CRUD (Day 07).**
> Authentication (Day 08), orders (Day 12), the admin endpoints (Day 13) and the React client (Day 09 onwards) are not implemented yet. Full setup, seed, test and build instructions are added on Day 15.
>
> The six admin mutation routes are implemented but **deliberately closed** until Day 08 adds JWT authentication - they return 401 `UNAUTHORIZED`.

---

## Structure

```text
project-02-mern-commerce/
├── server/          Express + MongoDB REST API
│   ├── .env.example
│   └── src/
│       ├── models/  User, Category, Product, Order
│       └── utils/   slugify
└── client/          React + Vite application (created on Day 09)
    └── .env.example
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
| GET | `/api/categories` | public |
| GET | `/api/categories/:slug` | public |
| GET | `/api/products` | public - supports `q`, `category`, `sort`, `page`, `limit`, `featured` |
| GET | `/api/products/:slug` | public - active products only |
| POST/PUT/DELETE | `/api/products`, `/api/categories` | closed until Day 08 (401) |

## Verifying the models

```bash
cd server
npm run check:models    # registers all four models; no database connection needed
```

## Key rules

- The cart lives in the browser (`localStorage`); there is no cart collection.
- The client sends only product ids and quantities when ordering. The server re-reads the products and recomputes every price and total.
- Order items store name, SKU and unit price snapshots, so order history survives product changes and deletions.
- Passwords are stored only as bcrypt hashes and are never returned by the API.
- Registration always creates the `user` role; admin accounts come from the seed script.
