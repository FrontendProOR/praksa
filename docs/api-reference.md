# API reference - SMWEB MERN Commerce

REST API for Project 2, built with Node.js, Express.js, Mongoose and MongoDB.

Every endpoint below was read out of the route files in
`project-02-mern-commerce/server/src/routes/` and verified against a running
server on Day 14. Nothing here is planned or aspirational: if it is documented,
it exists; if an endpoint is not listed, it does not exist.

- **Base path:** `/api`
- **Development base URL:** `http://localhost:5000/api`
- **Content type:** `application/json` (request bodies are limited to 100 KB)
- **Authentication:** JWT in an `HttpOnly` cookie named `access_token`

---

## 1. Conventions

### Success envelope

```json
{
  "success": true,
  "data": { },
  "meta": { }
}
```

`meta` is present only where it is meaningful - currently the two paginated
product listings.

### Failure envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "price", "message": "Price must be a number of 0 or more" }]
  }
}
```

`details` is always an array; it is empty when there is nothing field-specific
to report.

### Error codes

| Code | HTTP | Raised when |
|---|---|---|
| `VALIDATION_ERROR` | 400 | a body, query or path parameter fails validation; also a malformed ObjectId, and a cart line that is no longer purchasable |
| `UNAUTHORIZED` | 401 | no session cookie, or a forged, tampered, expired or orphaned token |
| `FORBIDDEN` | 403 | authenticated but the role is not permitted; also used for rate limiting (see below) |
| `NOT_FOUND` | 404 | the resource, or the API route itself, does not exist |
| `CONFLICT` | 409 | duplicate unique value, or a category still used by active products |
| `OUT_OF_STOCK` | 409 | the requested quantity exceeds current stock |
| `INTERNAL_ERROR` | 500 | anything unexpected |

Stack traces, Mongoose internals and driver messages are never sent to a
client. In production a 5xx is reduced to a generic message; the original error
is logged on the server only.

### Rate limiting

| Scope | Window | Limit | Notes |
|---|---|---|---|
| All of `/api` | 15 min | 1000 requests | |
| `POST /api/auth/login` | 15 min | 10 requests | successful logins are not counted |

Exhausting either returns **HTTP 429** with `error.code: "FORBIDDEN"` - the
contract in `CLAUDE.md` fixes the set of error codes and has none for rate
limiting, so the closest permitted code is used. Both limiters are disabled
under `NODE_ENV=test`.

### CORS

The API allows exactly one origin, `CLIENT_ORIGIN` (default
`http://localhost:5173`), with `credentials: true`. A wildcard origin is not
possible, because the browser must be allowed to send the session cookie.

---

## 2. Health

### `GET /api/health`

Public. Confirms the process is running and reports the database connection.

```json
{
  "success": true,
  "data": { "status": "ok", "uptimeSeconds": 42, "database": "connected" }
}
```

No configuration value, URI or secret is included.

---

## 3. Authentication

The token is delivered only as a cookie. It is never in a response body, so
browser JavaScript cannot read it and there is nothing to put in `localStorage`.

**Cookie:** `access_token`

| Attribute | Value |
|---|---|
| `HttpOnly` | always |
| `SameSite` | `Lax` |
| `Path` | `/` |
| `Max-Age` | from `JWT_EXPIRES_IN`, default 60 minutes |
| `Secure` | production only |

**JWT payload:** `{ "sub": "<user id>", "role": "user" }` - nothing more. The
role in the token is not trusted on its own: `authenticate` loads the user
record from MongoDB on every request, so the database is the authority.

### `POST /api/auth/register`

Public. Creates an account **and opens the session immediately** (the option
`CLAUDE.md` marks as preferred).

Request:

```json
{ "name": "Test User", "email": "user@example.com", "password": "StrongPass123" }
```

| Field | Rules |
|---|---|
| `name` | required, trimmed, 2-80 characters |
| `email` | required, valid, normalised to lower case, unique |
| `password` | required, min 8 characters, at least one letter and one digit |

**201** returns the safe user and sets the cookie:

```json
{ "success": true, "data": { "user": { "id": "…", "name": "Test User", "email": "user@example.com", "role": "user", "createdAt": "…" } } }
```

- A `role` sent in the body is ignored. Registration always produces `user`;
  there is no endpoint that grants `admin`.
- **409 `CONFLICT`** - the email is already registered.
- **400 `VALIDATION_ERROR`** - any field fails its rules.

### `POST /api/auth/login`

Public, rate limited (10 per 15 minutes, successful attempts not counted).

Request: `{ "email": "...", "password": "..." }`

**200** returns the same safe user shape and sets the cookie.

**401 `UNAUTHORIZED`** for both a wrong password and an unknown address, with an
identical message, so the response cannot be used to discover which addresses
are registered.

### `POST /api/auth/logout`

Clears the `access_token` cookie. Idempotent: calling it without a session is
still **200**.

### `GET /api/auth/me`

Requires a session. Returns only safe fields - `id`, `name`, `email`, `role`,
`createdAt`. Never the password hash.

**401 `UNAUTHORIZED`** when the cookie is missing, forged, tampered with,
expired, or belongs to a user who has since been deleted.

---

## 4. Categories

### `GET /api/categories`

Public. Active categories, sorted by name.

```json
{ "success": true, "data": { "categories": [ { "id": "…", "name": "Reagensi", "slug": "reagensi", "description": "…", "active": true } ] } }
```

### `GET /api/categories/:slug`

Public. **404 `NOT_FOUND`** if no category has that slug.

### `POST /api/categories` — admin

| Field | Rules |
|---|---|
| `name` | required, trimmed, max 120, unique |
| `slug` | optional; generated from the name when omitted |
| `description` | optional, max 500 |
| `active` | optional boolean, default `true` |

**201** with the created category. **409 `CONFLICT`** on a duplicate name or slug.

### `PUT /api/categories/:id` — admin

Full update, same fields as create. **404** if the id does not exist, **400** if
it is not a valid ObjectId.

### `DELETE /api/categories/:id` — admin

**409 `CONFLICT`** while **active products still reference the category**. The
response says how many, and the products are never cascade-deleted or silently
reassigned - an admin has to move them first.

---

## 5. Products

### `GET /api/products`

Public. Active products only.

| Parameter | Values | Default |
|---|---|---|
| `q` | free text; case-insensitive across `name`, `shortDescription` and `tags` | — |
| `category` | category **slug** | — |
| `sort` | `newest`, `price_asc`, `price_desc`, `name_asc`, `name_desc` | `newest` |
| `page` | positive integer | `1` |
| `limit` | 1-48 | `12` |
| `featured` | `true` / `false` | — |

Out-of-range and unparsable values are **repaired, not rejected**: an unknown
`sort` falls back to `newest`, `page` is clamped to at least 1, and `limit` is
clamped into 1-48. An unknown `category` slug is not an error - it simply
matches nothing and returns an empty page. A hand-edited URL therefore cannot
break or crash the catalogue.

```json
{
  "success": true,
  "data": { "products": [ … ] },
  "meta": { "page": 1, "limit": 12, "totalItems": 35, "totalPages": 3 }
}
```

### `GET /api/products/:slug`

Public, by slug, active products only. **404 `NOT_FOUND`** otherwise.

### `POST /api/products` — admin

| Field | Rules |
|---|---|
| `name` | required, trimmed, max 160 |
| `slug` | optional; generated from the name |
| `sku` | required, max 60, stored upper case, unique |
| `shortDescription` | required, max 300 |
| `description` | required, max 5000 |
| `category` | required, valid category ObjectId |
| `price` | required, number ≥ 0 |
| `compareAtPrice` | optional, number ≥ 0, **must be ≥ `price`** |
| `stock` | optional integer ≥ 0, default 0 |
| `imageUrl` | required, non-empty string (URL or path) |
| `featured` | optional boolean, default `false` |
| `active` | optional boolean, default `true` |
| `tags` | optional array of strings |

**201** with the created product. **409 `CONFLICT`** on a duplicate SKU or slug,
with `details` naming the field that collided.

### `PUT /api/products/:id` — admin

Full replacement; requires the same fields as create.

### `DELETE /api/products/:id` — admin

Hard delete, **200** on success. Orders that reference the product keep working:
their line items store name, SKU and unit price snapshots taken at purchase
time.

### `GET /api/admin/products` — admin

Same query parameters and `meta` as the public listing, but **includes inactive
products**. This is the only endpoint that exposes them.

---

## 6. Orders

### `POST /api/orders`

Requires a session.

```json
{
  "items": [{ "product": "<product id>", "quantity": 2 }],
  "shippingAddress": {
    "fullName": "…", "phone": "…", "street": "…",
    "city": "…", "postalCode": "…", "country": "…"
  },
  "paymentMethod": "cash_on_delivery"
}
```

- `items` - non-empty; each entry needs a valid product id and an integer
  quantity of 1-999.
- `shippingAddress` - all six fields required.
- `paymentMethod` - `cash_on_delivery` or `card_demo`.

**Only product ids and quantities are accepted for the line items.** Prices,
totals, statuses and the owning user are derived by the server. A body that
also carries `unitPrice`, `lineTotal`, `subtotal`, `total`, `paymentStatus`,
`orderStatus`, `name`, `sku` or `user` is accepted, and every one of those
values is ignored.

The server:

1. loads each product and rejects missing or inactive ones;
2. rejects quantities the current stock cannot cover;
3. prices the order from the stored `price`;
4. computes `shippingCost` (**flat 6.90 KM, free from 100 KM subtotal**) and `total`;
5. takes stock with a conditional atomic update that only matches while enough
   remains, and compensates if any step fails.

**201** returns the stored order, with `orderStatus: "pending"` and
`paymentStatus: "pending"` (`card_demo` may be marked `paid_demo` by the demo
flow; no card details are ever requested or stored).

Failures: **400 `VALIDATION_ERROR`** (bad body, or an inactive product - the
`details` name which item), **404 `NOT_FOUND`** (a product no longer exists),
**409 `OUT_OF_STOCK`** (insufficient stock; nothing is written and no stock
moves), **401 `UNAUTHORIZED`** (no session).

### `GET /api/orders/mine`

Requires a session. The caller's own orders, newest first.

### `GET /api/orders/:id`

Requires a session. A normal user may read **only their own** order; an admin
may read any. Another user's order is refused without leaking its contents.
**400** for a malformed id.

---

## 7. Administration

Every route under `/api/admin` runs `authenticate` then `authorize("admin")` on
the whole router, so authorisation cannot be omitted from a new route by
mistake. **401** without a session, **403** as a normal user.

The role is taken from the user record loaded for the session cookie. A role
claimed in a request body, header, query parameter, or in the browser's own
state has no effect.

### `GET /api/admin/stats`

```json
{
  "success": true,
  "data": { "stats": {
    "products":   { "total": 16, "active": 15, "inactive": 1, "outOfStock": 1 },
    "categories": { "total": 3 },
    "users":      { "total": 2 },
    "orders":     { "total": 3, "byStatus": { "pending": 2, "processing": 0, "shipped": 0, "delivered": 1, "cancelled": 0 }, "pending": 2 },
    "demoRevenue": 99.2
  } }
}
```

`demoRevenue` is the sum of the totals of orders that are **not cancelled**. It
is demo money: nothing has been charged, and cash-on-delivery orders count
before any payment. The UI labels it as such.

### `GET /api/admin/orders`

Every customer's orders, newest first, each with the customer's `name` and
`email` only. Optional `?status=` filter, restricted to the order-status enum.

### `PATCH /api/admin/orders/:id/status`

Request: `{ "orderStatus": "processing" }`

Allowed transitions:

| From | To |
|---|---|
| `pending` | `processing`, `shipped`, `cancelled` |
| `processing` | `shipped`, `delivered`, `cancelled` |
| `shipped` | `delivered`, `cancelled` |
| `delivered` | *(final)* |
| `cancelled` | *(final)* |

Anything outside the map is **400 `VALIDATION_ERROR`**, including
`delivered → pending`. Only `orderStatus` is written: items, totals, payment
status and the owner are not editable here, and extra fields in the body are
ignored.

---

## 8. Endpoints that do not exist

Listed because their absence is deliberate:

- There is **no** `POST/PUT/DELETE /api/admin/products` or
  `/api/admin/categories`. Creating, editing and deleting reuse the
  admin-protected `/api/products` and `/api/categories` routes; a second CRUD
  surface would be two contracts to keep in step. Requesting one returns **404**.
- There is **no** cart endpoint and no cart collection. The cart is client-side
  state in `localStorage`, and the server revalidates everything at checkout.
- There is **no** endpoint that grants the `admin` role. Admin accounts are
  created with `npm run seed:admin`, which reads its values from the
  environment.
- There is no upload, payment-provider, or social-login endpoint. These are
  out of scope for the internship and documented as future improvements.

Any unknown path under `/api` returns the standard 404 envelope:

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "…", "details": [] } }
```
