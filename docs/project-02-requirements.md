# Project 2 - MERN Commerce: requirements and architecture

- **Project folder:** `project-02-mern-commerce/`
- **Internship days:** 06 (17.08.2026.) through 15 (28.08.2026.)
- **Source of truth:** Sections 5-11 and 13 of `CLAUDE.md`. This document restates those requirements in implementable form. It adds no scope.
- **Status:** REST API, JWT authentication and the React storefront foundation are implemented (Days 06-09). Catalogue controls, cart, checkout, orders and the admin area are still to come.

---

## 1. Purpose

A complete but deliberately scoped e-commerce application that demonstrates the full MERN development cycle required by the internship confirmation: MongoDB data modelling, a Node.js + Express REST API, CRUD, a React interface, frontend/API integration, JWT authentication and end-to-end functional testing.

Product data is fictional demo data. The store may use a laboratory/specialist-products theme, but it must contain no medical efficacy claims and no real payment processing.

## 2. Roles and use cases

| Role | Can do |
|---|---|
| **Guest** | browse the catalogue; search, filter and sort products; open product details; add, update and remove items in the local cart; register; log in |
| **User** (authenticated) | everything a guest can do, plus: view account information; check out; create an order; view own order history; view details of an own order; log out |
| **Admin** | everything a user can do, plus: create/update/delete products; create/update/delete categories; list all orders; update order status; view dashboard statistics |

Authorization is decided on the server for every one of these actions. Frontend route guards exist only to improve the experience; they are never the security boundary.

## 3. Non-goals

No real card payment, no real shipping-provider integration, no upload service (image fields hold URLs or paths), no multi-vendor marketplace, no coupons, no advanced inventory reservations, no multi-currency, no localisation framework, no social login.

Also explicitly outside the stack: TypeScript, Next.js, NestJS, Redux, GraphQL, Prisma, SQL databases, Supabase, Firebase, Docker, Stripe, PayPal, Redis, message queues, microservices, wishlists, reviews and product variants.

These may be listed as future improvements, but must not be implemented during the 15-day scope.

## 4. Architecture

### 4.1 Separation

```text
project-02-mern-commerce/
├── server/          Express + MongoDB REST API (its own package.json)
└── client/          React + Vite single-page application (its own package.json)
```

The two are separate applications that communicate only over HTTP on `/api`. There is no shared build, no workspace tooling and no monorepo framework.

### 4.2 Backend layers and their responsibilities

| Layer | Folder | Responsibility | Must not |
|---|---|---|---|
| Entry point | `src/server.js` | read configuration, connect to MongoDB, open the port | contain routing or business rules |
| Application | `src/app.js` | build and export the Express app (parsers, security, routers, error handling) so tests can drive it without a port | open a socket |
| Configuration | `src/config/` | environment loading and the Mongoose connection | contain request handling |
| Routes | `src/routes/` | map method + path to middleware and one controller function | contain business logic or database queries |
| Middleware | `src/middleware/` | authentication, authorization, validation-result handling, rate limiting, `notFound`, `errorHandler` | contain domain rules |
| Controllers | `src/controllers/` | read validated input from the request, call a service, shape the HTTP response | query the database directly or compute prices |
| Services | `src/services/` | the business rules: catalogue queries, category-in-use checks, order pricing and stock changes | know about `req`/`res` |
| Models | `src/models/` | Mongoose schemas, field validation, indexes, serialisation | contain HTTP concerns |
| Utilities | `src/utils/` | small pure helpers (slugify, API error class, async wrapper) | hold state |
| Seeds | `src/seeds/` | deterministic demo data (Day 15) | run automatically on startup |

Business logic never lives in a route file. Controllers stay thin.

### 4.3 Mongoose as the ODM

MongoDB itself does not enforce a document shape. Mongoose supplies the schema, the type casting (including turning a URL string into an `ObjectId`), the second validation layer behind `express-validator`, the index declarations, the hooks and the serialisation rules that keep `passwordHash` out of responses.

### 4.4 Where authority lives

| Concern | Authority | Rule |
|---|---|---|
| Product price | `Product.price` in MongoDB | every order line is priced by re-reading the product; a price sent by the browser is ignored |
| Inventory | `Product.stock` in MongoDB | stock is checked and decremented server-side; it may never go negative |
| Authorization | `authenticate` + `authorize('admin')` on the server | a frontend guard is a convenience only |
| Order totals | order service on the server | subtotal, shipping and total are recomputed, never accepted from the client |
| Input validity | `express-validator` at the API boundary, Mongoose schema as the second layer | a request that passes neither layer cannot reach the database |

### 4.5 Validation ownership

1. **`express-validator`** at the route boundary: presence, type, length, format, enum membership and pagination bounds. Failures become `VALIDATION_ERROR` (HTTP 400) with per-field `details`.
2. **Mongoose schema validation**: the same constraints expressed on the model, so a service call that bypasses the HTTP layer still cannot write an invalid document.
3. **Service rules**: things a schema cannot express - "this category still has products", "this product does not have enough stock", "this order belongs to another user".

---

## 5. MongoDB data model

Four collections: `users`, `categories`, `products`, `orders`. There is deliberately **no cart collection** (section 7).

### 5.1 User - `server/src/models/User.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | String | yes | trimmed, 2-80 characters |
| `email` | String | yes | unique index, lowercased, trimmed, must look like an email |
| `passwordHash` | String | yes | bcrypt hash; `select: false`, so it is never loaded unless explicitly requested |
| `role` | String | no | enum `user` \| `admin`, default `user` |
| `createdAt` / `updatedAt` | Date | automatic | `timestamps: true` |

Rules implemented in the model:

- there is **no `password` path**, so a plaintext password cannot be persisted through the model;
- `toJSON` removes `passwordHash`, `_id` and `__v` and exposes `id`;
- `User.fromRegistration(payload)` copies only `name`, `email` and `passwordHash` and forces `role: "user"`, so a request body containing `role: "admin"` cannot escalate;
- admin accounts come from the seed script or a manual database change, never from public registration;
- the login flow must load the hash explicitly with `.select("+passwordHash")`.

### 5.2 Category - `server/src/models/Category.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | String | yes | unique, trimmed |
| `slug` | String | yes | unique, indexed, lowercased |
| `description` | String | no | max 500 characters |
| `active` | Boolean | no | default `true` |
| `createdAt` / `updatedAt` | Date | automatic | `timestamps: true` |

Rules:

- the slug is normalised in a `pre('validate')` hook via `utils/slugify.js`, deriving it from `name` when it is not supplied, so it is never trusted raw from the client;
- deleting a category that active products still reference must fail with **HTTP 409 `CONFLICT`** unless those products are reassigned first. That check needs the Product collection, so it belongs to the category service (Day 07), not the schema.

### 5.3 Product - `server/src/models/Product.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | String | yes | trimmed, max 160 |
| `slug` | String | yes | unique, indexed, lowercased |
| `sku` | String | yes | unique, indexed, uppercased |
| `shortDescription` | String | yes | max 300 |
| `description` | String | yes | max 5000 |
| `category` | ObjectId -> `Category` | yes | indexed |
| `price` | Number | yes | min 0 |
| `compareAtPrice` | Number | no | min 0, and must be `>= price` when present |
| `stock` | Number | yes | integer, min 0, default 0 |
| `imageUrl` | String | yes | URL or path; no upload service |
| `featured` | Boolean | no | default `false` |
| `active` | Boolean | no | default `true` |
| `tags` | [String] | no | default `[]` |
| `createdAt` / `updatedAt` | Date | automatic | `timestamps: true` |

Rules:

- the public listing and the public detail route return only `active: true` products; the admin listing may include inactive ones;
- stock must never become negative - enforced by the schema minimum and by the order service checking before it decrements;
- `compareAtPrice` is the struck-through previous price, so it is only meaningful at or above `price`.

### 5.4 Order - `server/src/models/Order.js`

Order item (embedded, `_id: false`):

| Field | Type | Required | Constraints |
|---|---|---|---|
| `product` | ObjectId -> `Product` | yes | reference kept for reporting |
| `name` | String | yes | **snapshot** taken at purchase time |
| `sku` | String | yes | **snapshot** |
| `quantity` | Number | yes | integer, >= 1 |
| `unitPrice` | Number | yes | >= 0, **snapshot**, computed by the server |
| `lineTotal` | Number | yes | >= 0, computed by the server |

Shipping address (embedded, `_id: false`): `fullName`, `phone`, `street`, `city`, `postalCode`, `country` - all required strings.

Order:

| Field | Type | Required | Constraints |
|---|---|---|---|
| `user` | ObjectId -> `User` | yes | indexed |
| `items` | [OrderItem] | yes | must contain at least one item |
| `shippingAddress` | ShippingAddress | yes | - |
| `subtotal` | Number | yes | >= 0, server-computed |
| `shippingCost` | Number | yes | >= 0, server-computed |
| `total` | Number | yes | >= 0, server-computed |
| `paymentMethod` | String | yes | enum `cash_on_delivery` \| `card_demo` |
| `paymentStatus` | String | yes | enum `pending` \| `paid_demo` \| `failed`, default `pending` |
| `orderStatus` | String | yes | enum `pending` \| `processing` \| `shipped` \| `delivered` \| `cancelled`, default `pending` |
| `createdAt` / `updatedAt` | Date | automatic | `timestamps: true` |

### 5.5 Relationships

```text
User  1 ────< Order            Order.user      -> ObjectId ref User   (reference)
Category 1 ─< Product          Product.category-> ObjectId ref Category (reference)
Order 1 ────< OrderItem        embedded array of snapshots
OrderItem ──> Product          OrderItem.product -> ObjectId ref Product (reference, for reporting only)
Order 1 ────  ShippingAddress  embedded single object
```

### 5.6 Referencing vs embedding - rationale

**Referenced** where the related document has its own lifecycle and is queried on its own:

- `Product.category` - categories are managed independently, are listed on their own endpoint and are used as a filter. Duplicating category data into every product would mean rewriting every product to rename a category.
- `Order.user` - accounts change independently of orders, and orders must be queryable by owner.

**Embedded** where the data is only ever read as part of its parent and must not change afterwards:

- `Order.items` - always read with the order, and must reflect the moment of purchase.
- `Order.shippingAddress` - belongs to that one order; a later change to the customer's address must not rewrite past orders.

### 5.7 Why order items store snapshots

`name`, `sku` and `unitPrice` are copied into the order item at creation time. Without the copy, an order would show today's product data instead of what was actually bought:

- a price change would silently rewrite the value of every past order;
- renaming a product would rewrite order history;
- deleting a product would leave orders unreadable - the specification permits hard deletes, so this case is real.

The `product` reference is kept alongside the snapshot for reporting, but nothing about displaying a past order depends on the product still existing.

### 5.8 Indexes

| Collection | Index | Purpose |
|---|---|---|
| `users` | `email` unique | login lookup; blocks duplicate registration (surfaces as `CONFLICT`) |
| `categories` | `name` unique | prevents duplicate category names |
| `categories` | `slug` unique | public lookup by slug; keeps slugs unambiguous |
| `products` | `slug` unique | `GET /api/products/:slug` |
| `products` | `sku` unique | business identifier, prevents duplicates |
| `products` | `category` | catalogue filtering by category |
| `orders` | `user` | `GET /api/orders/mine` and ownership checks |

Search (`q`) is a case-insensitive MongoDB query across `name`, `shortDescription` and `tags` using `$or` with `$regex`. No text index and no separate search engine: a regex query keeps the implementation simple, works on partial words and stays consistent with the small demo catalogue. This is a deliberate trade-off - it does not scale to a large catalogue, which is recorded as a known limitation rather than solved.

---

## 6. REST API surface (planned - implemented from Day 07)

Base path `/api`. No endpoint outside this list may be invented.

### 6.1 Response envelope

Success:

```json
{ "success": true, "data": {}, "meta": {} }
```

Failure:

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Human readable message", "details": [] } }
```

Allowed error codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `OUT_OF_STOCK`, `INTERNAL_ERROR`. Stack traces are never exposed in production responses.

### 6.2 Status code conventions

| Code | Used for |
|---|---|
| 200 | successful read or update |
| 201 | resource created (register, product, category, order) |
| 400 | `VALIDATION_ERROR` |
| 401 | `UNAUTHORIZED` - missing/invalid session, bad credentials |
| 403 | `FORBIDDEN` - authenticated but not permitted |
| 404 | `NOT_FOUND` - unknown route or missing resource |
| 409 | `CONFLICT` - duplicate email, category still in use |
| 429 | rate limit exceeded - reported with the `FORBIDDEN` code, because the contract fixes the code list and contains none for rate limiting |
| 500 | `INTERNAL_ERROR` |

`OUT_OF_STOCK` is a domain rejection at checkout and is returned with a 4xx status.

### 6.3 Endpoints

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | public | process is alive; exposes no secrets |
| POST | `/api/auth/register` | public | create a `user` account and start a session |
| POST | `/api/auth/login` | public, rate limited | start a session |
| POST | `/api/auth/logout` | public | clear the auth cookie |
| GET | `/api/auth/me` | authenticated | id, name, email, role, createdAt |
| GET | `/api/categories` | public | list categories |
| GET | `/api/categories/:slug` | public | one category |
| POST | `/api/categories` | admin | create |
| PUT | `/api/categories/:id` | admin | update |
| DELETE | `/api/categories/:id` | admin | delete; 409 while products reference it |
| GET | `/api/products` | public | active products, filtered/sorted/paginated |
| GET | `/api/products/:slug` | public | one active product |
| POST | `/api/products` | admin | create |
| PUT | `/api/products/:id` | admin | update |
| DELETE | `/api/products/:id` | admin | delete (hard delete is acceptable) |
| GET | `/api/admin/products` | admin | all products, including inactive |
| POST | `/api/orders` | authenticated | create an order from ids + quantities (implemented) |
| GET | `/api/orders/mine` | authenticated | own order history (implemented) |
| GET | `/api/orders/:id` | authenticated | own order; an admin may read any (implemented) |
| GET | `/api/admin/orders` | admin | all orders |
| PATCH | `/api/admin/orders/:id/status` | admin | change `orderStatus` |
| GET | `/api/admin/stats` | admin | totals, active products, orders by status, demo revenue excluding cancelled |

Every `/api/admin/*` endpoint requires an authenticated admin.

### 6.4 Catalogue query conventions

`GET /api/products` accepts:

```text
q=<search text>
category=<category slug>
sort=newest|price_asc|price_desc|name_asc|name_desc
page=<positive integer>          default 1
limit=<1..48>                    default 12
featured=true|false
```

Defaults: `page=1`, `limit=12`, `sort=newest`. Out-of-range or unparsable `page`/`limit` values are clamped to the documented bounds rather than rejected, so a hand-edited URL cannot break the catalogue; an unsupported `sort` value falls back to `newest`. The chosen behaviour is documented again on Day 10 when it is implemented.

Every collection response carries:

```json
{ "page": 1, "limit": 12, "totalItems": 35, "totalPages": 3 }
```

### 6.5 Authentication and authorization (implemented on Day 08)

- Password hashing with `bcryptjs` at work factor 12; policy is at least 8 characters containing a letter and a number. Only `passwordHash` is stored - the schema has no `password` path.
- A JWT signed with `JWT_SECRET`, payload kept minimal: `{ "sub": "<user id>", "role": "<role>" }` plus `iat`/`exp`. No email, name or any other user data goes into the token.
- The token travels in an **HttpOnly** cookie named `access_token`, `sameSite=lax`, `path=/`, `secure` only in production, `maxAge` 60 minutes. It is never returned in a response body, so there is nothing for the client to put in `localStorage`.
- `authenticate` reads the cookie, verifies the signature and expiry, then loads the account. **The database is the authority on the role**, not the token: a role change or a deleted account takes effect on the next request even for an already-issued token.
- `authorize(...roles)` runs after `authenticate` and returns 403 when the stored role is not permitted. Roles supplied in a body, header or query string are ignored.
- Rate limiting: the base API limiter plus a stricter login limiter (10 failed attempts per 15 minutes, successful logins not counted).
- Invalid credentials return one generic 401 - identical for an unknown email and a wrong password - so the endpoint cannot be used to discover registered addresses. A duplicate registration returns 409.
- Startup fails with a clear message and exit code 1 when `MONGODB_URI` or `JWT_SECRET` is missing, when the secret is shorter than 32 characters, or when it is still the `.env.example` placeholder.

#### Development admin

There is no route that can grant the admin role. One admin is created by a documented script that takes its values from the environment and prints no password:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeMe123' npm run seed:admin
```

It refuses to run without both variables, rejects a password that fails the policy, and refuses to run under `NODE_ENV=production` unless `ALLOW_PRODUCTION_ADMIN_SEED` is set deliberately. Credentials live only in the local environment and are never committed.

---

## 7. Cart and checkout

### 7.1 Why the cart is client-side

The cart lives in a React `CartContext` and is persisted to `localStorage`. There is no cart collection in MongoDB, on purpose:

- a guest can fill a cart without an account, which is the behaviour a real store needs;
- no server state has to be created, expired or garbage-collected for visitors who never buy;
- it keeps the 15-day scope on the parts the internship is meant to demonstrate;
- nothing is lost, because the cart is not trusted anyway - see below.

Cart item shape: `productId`, `slug`, `name`, `imageUrl`, `price`, `stock`, `quantity`. Quantity can never drop below 1, and the UI should not offer more than the known stock. Restoring from `localStorage` must tolerate missing, malformed or outdated entries.

### 7.2 The cart is not authoritative

`price` and `stock` in the cart are **display copies**. They may be stale or edited in the browser's dev tools. The server re-reads both at checkout, so a tampered cart changes what the user sees locally and nothing else.

### 7.3 Server-side order total calculation

`POST /api/orders` accepts only product ids and quantities plus the shipping address and payment method. The order service then:

1. loads every referenced product from MongoDB;
2. rejects the order if any product is missing or inactive (`NOT_FOUND` / `VALIDATION_ERROR`);
3. rejects it if any requested quantity exceeds current stock (`OUT_OF_STOCK`);
4. computes `unitPrice` from `Product.price`, `lineTotal = unitPrice * quantity`, `subtotal` as the sum of the line totals, then `shippingCost` and `total`;
5. writes the item snapshots;
6. decrements stock only after all validation has passed.

No price or total from the request body is ever read. Duplicate lines for the same product are merged first, so the same item cannot be validated twice and slip past the stock check.

**Shipping rule.** A flat fee of 6.90 KM, waived once the subtotal reaches 100 KM. The constants live in `order.service.js`; the client never sends or influences the figure.

**Payment status.** `cash_on_delivery` leaves `paymentStatus: "pending"`; `card_demo` records `paid_demo` after the simulated flow. No card details are requested or stored, and no payment is processed.

### 7.4 Non-transactional order creation (standalone MongoDB)

The local deployment is standalone, so multi-document transactions are unavailable. Rather than pretending otherwise, order creation runs this documented sequence:

1. load every referenced product; reject missing or inactive ones;
2. reject quantities the current stock cannot cover, so the ordinary case fails with a clear message before anything is written;
3. price the order from the database values;
4. take the stock one product at a time with a **conditional** update that matches only while enough remains - `{ _id, active: true, stock: { $gte: quantity } }` with `$inc: { stock: -quantity }`. This, not step 2, is what prevents overselling: step 2 alone would race;
5. if any decrement fails, put back everything already taken and reject the order;
6. only then write the order; if that write fails, put the stock back too.

The compensation in steps 5 and 6 is best effort - without transactions there is no rollback - and a failure to restore is logged loudly. Verified under concurrency: two buyers racing for the last unit produce exactly one order, one `OUT_OF_STOCK`, and stock that stops at zero.

`card_demo` never asks for or stores card details. It is a demo choice that may set `paymentStatus` to `paid_demo` after a simulated flow.

---

## 8. Frontend (storefront foundation implemented on Day 09)

### 8.1 What exists today

```text
client/src/
├── api/          client.js (single Axios instance)  products.js  categories.js
├── components/   Header  Footer  Container  Button  ProductCard  ProductGrid
│                 ProductImage  Price  StateViews (loading/error/empty)
├── hooks/        useApiResource.js
├── layouts/      StoreLayout.jsx
├── pages/        HomePage  CatalogPage  ProductDetailsPage  NotFoundPage
├── routes/       AppRoutes.jsx
├── styles/       tokens.css  base.css  + one stylesheet per component
└── utils/        format.js
```

Routes: `/` (home), `/products`, `/products/:slug`, `/login`, `/register`, `/cart`, then `/checkout`, `/orders`, `/orders/:id` and `/account` behind `ProtectedRoute`, `/admin` behind `AdminRoute`, and `*` (404). The cart itself is public - a guest can fill one - but checkout requires a session.

**Cart state.** `context/CartProvider.jsx` holds the cart and persists it to `localStorage` under `smweb-lab-cart-v1`. Stored entries are read defensively: unparseable JSON, non-array values, duplicate ids and junk quantities are discarded or repaired rather than trusted, so a corrupted value cannot stop the application from starting. The stored `price` and `stock` are display copies only; checkout sends nothing but product ids and quantities.

**Authentication state.** `context/AuthProvider.jsx` holds the session; `context/auth-context.js` exposes the `useAuth` hook. The browser never holds the JWT - it stays in the HttpOnly cookie, and the provider keeps only the safe user object (`id`, `name`, `email`, `role`, `createdAt`). On mount it asks `/auth/me` who the cookie belongs to; a 401 there is the normal answer for a guest and resolves to `user: null`, while a transport failure is recorded separately so "not signed in" and "server unreachable" are never confused. Guards render nothing until that bootstrap settles, so a refresh never bounces a signed-in user to the login page and no authenticated UI flashes for a guest.

A 401 from any non-auth endpoint clears the client session through an Axios interceptor, so an expired cookie cannot leave a signed-in header behind.

Every request goes through the single Axios instance, configured from `VITE_API_BASE_URL` with `withCredentials: true` so the HttpOnly session cookie works when the auth screens arrive. A response interceptor turns both API error envelopes and transport failures into one `ApiRequestError`, so pages never depend on Axios internals or on an undocumented response shape.

The catalogue controls - search, category filter, featured toggle, sort and pagination - are driven entirely by the URL. `utils/catalogQuery.js` is the single place that parses, sanitises and serialises that state, and `hooks/useCatalogParams.js` reads and writes it through `useSearchParams`. There is no second copy of the state in React, which is what makes refresh, Back/Forward and shared links work without a synchronising effect.

| Parameter | Values | Omitted when |
|---|---|---|
| `q` | free text, trimmed | empty |
| `category` | a real category slug from the API | not filtered |
| `sort` | `newest`, `price_asc`, `price_desc`, `name_asc`, `name_desc` | `newest` |
| `featured` | `true` | not filtered |
| `page` | positive integer | page 1 |

Sanitising mirrors the API exactly: an unsupported `sort` falls back to `newest` and an invalid `page` falls back to 1, so a hand-edited URL cannot break the page. Changing any filter resets to page 1; changing only the page keeps every other control. Search is submitted explicitly rather than on each keystroke, so typing produces neither a request per character nor a history entry per character.

Product images are URLs or paths - there is no upload service - so `ProductImage` falls back to a drawn placeholder tile when an image does not resolve.

### 8.2 Full planned information architecture

Public routes: `/`, `/products`, `/products/:slug`, `/login`, `/register`, `/cart`, `*` (404).
Authenticated routes: `/checkout`, `/orders`, `/orders/:id` (own order or admin), `/account`.
Admin routes: `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`, `/admin/categories`, `/admin/orders`.

Shared components: `Header`, `Footer`, `Container`, `Button`, `FormField`, `LoadingState`, `ErrorState`, `EmptyState`, `ProductCard`, `ProductGrid`, `Pagination`, `SearchBar`, `FilterPanel`, `Price`, `ProtectedRoute`, `AdminRoute`, `StatusBadge`, and a confirmation dialog for destructive admin actions.

All HTTP goes through one Axios instance configured from `VITE_API_BASE_URL` with `withCredentials: true`, because the session cookie is HttpOnly. No component builds its own base URL.

UX bar: responsive header, consistent spacing and typography, explicit loading/empty/error states, useful API error messages, submit buttons disabled while a request is pending, confirmation before destructive admin actions, clear order status badges, a visually distinct admin area, a 404 page, no horizontal overflow at 320px and keyboard-usable forms.

Day 13 adds the admin management screens.

---

## 9. Environment and MongoDB connection

### 9.1 Server `.env.example`

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smweb_mern_commerce
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
JWT_EXPIRES_IN=60m
```

### 9.2 Client `.env.example`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Real `.env` files are git-ignored and never committed. `JWT_SECRET` must be a long random value supplied only through the environment, and neither passwords nor secrets are ever logged.

### 9.3 Connection approach for Day 07

`src/config/db.js` will call `mongoose.connect(process.env.MONGODB_URI)` once during startup in `server.js`, before the port is opened, and will fail loudly if the variable is missing or the connection is refused. `app.js` stays connection-free so the Express app can be tested without a database.

Automated tests will point `MONGODB_URI` at a separate database name (for example `smweb_mern_commerce_test`) so a test run can never destroy demo data.

### 9.4 MongoDB server: resolved on Day 07

The Day 06 gap (no MongoDB server on the machine) was closed on Day 07 **without administrator rights**, by using the MongoDB Community ZIP archive instead of the service installer:

- **Version:** MongoDB Community Server 8.3.8 (`mongodb-windows-x86_64-8.3.8.zip`)
- **Location:** `%LOCALAPPDATA%\mongodb-local\mongodb-win32-x86_64-windows-8.3.8`
- **Data directory:** `%LOCALAPPDATA%\mongodb-local\data`

Start it before running the API:

```powershell
& "$env:LOCALAPPDATA\mongodb-local\mongodb-win32-x86_64-windows-8.3.8\bin\mongod.exe" `
    --dbpath "$env:LOCALAPPDATA\mongodb-local\data" --bind_ip 127.0.0.1 --port 27017
```

The `winget install MongoDB.Server` route (verified package id `MongoDB.Server`) installs the same server as a Windows service that starts automatically, but it needs elevation. Either route serves the same `MONGODB_URI`; the ZIP was chosen because it required no elevation. The database is local in both cases - no cloud database is substituted, and it is not swapped for PostgreSQL, Supabase or Firebase.

Verified on Day 07: the server accepts connections on `127.0.0.1:27017`, the API connects at startup, and `smweb_mern_commerce` holds the `products` and `categories` collections with the expected indexes.

Either way this is a **standalone** deployment, so multi-document transactions are unavailable. That is the reason Day 12 plans a documented non-transactional order sequence; running the server as a single-node replica set instead would enable transactions and is the alternative to decide by Day 12.

---

## 10. Admin route protection

Day 07 shipped these six mutation routes behind a temporary `adminLock` that rejected everything, because authentication did not exist yet. **Day 08 removed that file** and replaced it with the real chain `authenticate` -> `authorize('admin')` on the same routes:

```text
POST   /api/products      PUT /api/products/:id      DELETE /api/products/:id
POST   /api/categories    PUT /api/categories/:id    DELETE /api/categories/:id
```

| Caller | Result |
|---|---|
| no cookie | 401 `UNAUTHORIZED` |
| valid session, role `user` | 403 `FORBIDDEN` |
| valid session, role `admin` | the operation runs |

There was never a bypass: no header, query parameter or environment flag opened the Day 07 lock, and nothing like `?admin=true` exists now.

`GET /api/admin/products` (the admin listing that includes inactive products) is **not** implemented yet: CLAUDE.md assigns it to Day 13.

## 11. Current state after Day 06

Day 06 created the four Mongoose models, `utils/slugify.js` and both `.env.example` files, and verified them with 77 assertions covering every field, constraint, default, enum, index flag and serialisation rule - including that no plaintext password path exists, that a registration payload cannot set `role: "admin"`, that `toJSON` strips `passwordHash`, and that an order item snapshot does not change when the source product changes.

## 12. Current state after Day 12

```text
project-02-mern-commerce/server/src/
├── app.js                     Express app (no listen, no DB - testable)
├── server.js                  config -> DB connect -> listen, graceful shutdown
├── config/       env.js  db.js
├── routes/       index.js  auth.routes.js  category.routes.js  product.routes.js
├── controllers/  health  auth  category  product
├── services/     auth.service.js  category.service.js  product.service.js
├── middleware/   auth (authenticate, authorize)  validate  notFound  errorHandler
│                 rateLimiters  auth.validation  category.validation  product.validation
├── models/       User  Category  Product  Order  index.js
├── seeds/        create-admin.js
└── utils/        ApiError  respond  slugify  password  jwt  cookies
```

Implemented and verified on Day 07: `GET /api/health`; public category list and get-by-slug; public product listing with search, category filter, sorting, pagination and `featured`; public product get-by-slug; create/update/delete for both resources; the category-in-use delete conflict; and the validation, not-found and central error middleware.

Added and verified on Day 08: the four `/api/auth/*` endpoints, bcrypt password hashing, JWT in an HttpOnly cookie, `authenticate` and `authorize('admin')` protecting all six mutation routes, the login rate limiter, fail-fast secret validation and the development admin script.

Added and verified on Day 09: the React storefront foundation - Vite client, React Router, the centralised Axios layer, the shared layout, home, catalogue, product details and 404 pages, all reading real data from MongoDB through the API.

Added and verified on Day 10: the catalogue interaction layer - `SearchBar`, `FilterPanel` (category, featured, sort), `Pagination`, and URL-backed catalogue state. Every control re-queries the API; nothing filters an already-loaded array.

Added and verified on Day 11: frontend authentication - `AuthProvider` with `/auth/me` bootstrap, login and registration pages, logout, the account page, `ProtectedRoute` and `AdminRoute`, and an auth-aware header. The admin route currently guards a placeholder page so the guard itself is verifiable; the management screens are Day 13.

Added and verified on Day 12: the purchase flow - `CartProvider` with localStorage persistence, add-to-cart on the catalogue and details pages, the cart page, the protected checkout, the three order endpoints, order history and order details. Server-side pricing, stock handling under concurrency, ownership and snapshot history were all verified against the running API.

Two development-only scripts support local work and are documented as such:

| Script | Purpose |
|---|---|
| `npm run seed:admin` | creates or promotes one admin account from environment variables |
| `npm run seed:dev-catalogue` | loads fictional categories and products so the storefront has real data to render |

Neither is the deliverable seed: Day 15 implements the full deterministic seed from Section 14.

Not yet created, by design: the demo data seed (Day 15), `GET /api/admin/products`, `/api/admin/orders`, `/api/admin/stats` (Day 13), the order endpoints (Day 12) and the whole client application (Day 09 onwards).
