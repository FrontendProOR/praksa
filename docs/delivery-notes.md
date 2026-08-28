# Delivery notes - SMWEB internship 2026

A short handover for a mentor or reviewer: what was built, how it is put
together, how it is secured, what is tested, what it cannot do, and the exact
order to demonstrate it in.

The full setup instructions are in the [root README](../README.md); this
document is the guided tour that goes with them.

---

## 1. What was delivered

Two projects, built over 15 working days.

**Project 1 - `project-01-agency-site`.** A responsive, frontend-only
presentation website for a software agency: header and mobile navigation, hero,
services, selected work, process, technology overview, about/metrics, a
validated contact form and a footer. React + Vite, no backend.

**Project 2 - `project-02-mern-commerce`.** A scoped but complete e-commerce
application on the full MERN stack: catalogue with search, category filter,
sorting and pagination; registration and sign-in; a cart that survives a
refresh; checkout that creates a real order; order history; and a protected
admin area for products, categories and orders.

---

## 2. Architecture

```text
React 19 + Vite  ──HTTP + HttpOnly cookie──▶  Express 5  ──Mongoose──▶  MongoDB
   (client)                                    (server)                 (local)
```

**Server** is layered, and each layer has one job:

| Layer | Responsibility |
|---|---|
| `routes/` | path → middleware → controller bindings only |
| `middleware/` | authentication, authorisation, validation chains, error handling, rate limits |
| `controllers/` | read the request, call a service, shape the response - no business rules |
| `services/` | the business rules; no knowledge of `req`/`res`, so they are directly testable |
| `models/` | Mongoose schemas: a second validation layer, plus the unique indexes |

`app.js` is deliberately separate from `server.js`: the Express app can be built
and tested without opening a port or connecting to a database.

**Client** keeps pages apart from reusable components, routes every HTTP call
through one Axios instance, and holds exactly two pieces of global state -
`AuthProvider` (session) and `CartProvider` (cart).

**Data model.** `User`, `Category`, `Product`, `Order`. There is no cart
collection: the cart is browser state, and the server revalidates everything at
checkout. Order line items store `name`, `sku` and `unitPrice` **snapshots**, so
an order still reads correctly after the product is renamed, repriced or
deleted.

---

## 3. Security model

The rule the whole design follows: **the browser is never trusted.**

- **Sessions.** The JWT is delivered in an `HttpOnly` cookie
  (`SameSite=Lax`, `Path=/`, 60-minute expiry, `Secure` in production only). It
  never appears in a response body, JavaScript cannot read it, and nothing is
  kept in `localStorage` or `sessionStorage`.
- **Passwords.** bcrypt hashes only, work factor 12. There is no `password`
  field in MongoDB, and `passwordHash` never appears in any API response.
- **Roles.** The token carries a role, but it is not trusted on its own -
  `authenticate` loads the user record from MongoDB on every request, so the
  database is the authority. A role claimed in a request body, header, query
  parameter or browser state has no effect.
- **Admin.** Every `/api/admin/*` route is guarded router-wide with
  `authenticate` + `authorize("admin")`, so a new route cannot forget it. The
  React `AdminRoute` guard is convenience only. There is no endpoint that grants
  the admin role; it is set only by a seed script run against the database.
- **Money.** The client sends only product ids and quantities. The server
  re-reads each product and recomputes unit price, line total, subtotal,
  shipping and total. Prices, totals and statuses sent by a client are ignored.
- **Stock.** Taken with a conditional atomic update that matches only while
  enough remains, with a compensating rollback if a later step fails, so two
  buyers racing for the last unit cannot both succeed and stock never goes
  negative.
- **Ownership.** A user can read only their own orders; an admin can read any.
- **Transport and abuse.** Helmet security headers, CORS pinned to the single
  configured origin with credentials, 1000 requests per 15 minutes across the
  API and 10 failed sign-ins per 15 minutes.
- **Errors.** One central handler. In production a 5xx becomes a generic
  message; stack traces and MongoDB internals never reach a client.
- **Secrets.** Only `.env.example` files are committed. The server refuses to
  start with a missing, short or placeholder `JWT_SECRET`.

---

## 4. Tests

| Suite | Command | Covers |
|---|---|---|
| Backend | `cd server && npm test` | registration/sign-in/session, admin authorization, catalogue pagination, product and category CRUD, server-side order pricing, ownership, status transitions, error envelopes |
| Frontend | `cd client && npm test` | login validation and duplicate-submit prevention, cart behaviour and storage recovery, route guards, API loading/empty/error states |
| Lint | `npm run lint` | client and Project 1 |
| Build | `npm run build` | client and Project 1 |

The backend suite runs against its own database, `smweb_mern_commerce_test`,
and clears it before and after each run, so it never touches demo data.

[`manual-test-checklist.md`](manual-test-checklist.md) is the repeatable manual
pass: startup, an API checklist, storefront, authentication, cart, checkout,
orders, admin, negative and security scenarios, responsive widths,
accessibility and cleanup. Its boxes are left unticked on purpose - it is a
procedure to execute, not a record of one run.

[`api-reference.md`](api-reference.md) documents all 22 endpoints, and was
audited in both directions: every implemented route is documented, and every
documented route exists.

---

## 5. Demonstration order

Start MongoDB, then the API, then the client (see the
[root README](../README.md)). Run `npm run seed:demo` first for a known state.

**Public**

1. Open `http://localhost:5173` - home, with featured products from the API.
2. Go to the catalogue: 15 active products, 12 on the first page.
3. Search `staklo` - the list narrows to 5.
4. Filter by *Mjerni instrumenti* - 5 products.
5. Sort by price ascending, then descending.
6. Go to page 2 - the remaining 3 products.
7. Note the address bar: the state is in the URL, so the link is shareable and
   Back/Forward work.
8. Open a product.

**As a customer**

9. Register a new account, or sign in as `kupac@smweb.local` / `DemoKupac123`.
10. Add a product to the cart and change the quantity.
11. Refresh the page - the cart survives; it lives in `localStorage`.
12. Check out. The confirmation shows the **server-computed** total: subtotal +
    6.90 KM shipping, free from 100 KM.
13. Open the order history, then the order.

**Worth showing:** before checking out, edit the stored cart in dev tools to
`"price": 0.01`. The created order still carries the real price - the server
re-reads it from the database.

**As an administrator**

14. Sign in as `admin@smweb.local` / `DemoAdmin123`.
15. Open `/admin` - every figure is counted in MongoDB, and "demo revenue" is
    labelled as demo money.
16. Create a product; it appears on the storefront.
17. Edit its price; the storefront reflects it.
18. Delete it - the confirmation names the product; Escape cancels.
19. Try to delete a category that has products: refused with 409 and an
    explanation, and nothing is deleted.
20. Open admin orders and move the customer's order to *U obradi*; the customer
    sees the new status.

**Negative, if there is time**

21. As a normal user, open `/admin` - refused, not a login form.
22. In the console, `fetch('/api/admin/stats', {credentials:'include'})` - 403.
    Adding a `role: admin` header or body field changes nothing.
23. Open another user's order URL - refused, with no data leaked.
24. `document.cookie` in the console - the session token is not there; it is
    `HttpOnly`.
25. Stop the API and reload - a readable error state with a retry, not a blank
    page.

**Optional:** open MongoDB Compass to show the documents and indexes, and
Postman for a couple of raw requests from
[`api-reference.md`](api-reference.md).

---

## 6. Known limitations

Stated plainly; none of these is a defect.

- **No real payments.** `card_demo` is a simulated choice - no card details are
  requested, stored or charged.
- **No multi-document transactions.** The local MongoDB is a standalone server,
  which does not support them. Stock uses the conditional-update and
  compensation strategy described above: safe against overselling, but not a
  true transaction.
- **MongoDB must be started manually** when installed from the Community ZIP
  rather than as a Windows service.
- **Category management has no active/inactive switch.** The category listing
  endpoint is the public one and returns active categories only, so deactivating
  a category from the admin screen would remove it from the list needed to
  restore it.
- **Project 1's contact form is a demo.** It validates and confirms; it sends
  and stores nothing, because Project 1 has no backend.
- **No image uploads.** Product images are URLs or paths.
- **Single language.** The interface is in Bosnian/Serbian with no localisation
  framework. API messages are English by contract; the messages a user actually
  sees are translated in the client.
- **Not deployed.** Everything runs locally - no hosting, CI or production
  environment.

## 7. Possible next steps

Out of scope for the internship, and listed only to show the direction:
a replica set so checkout can use a real transaction, a payment provider behind
the existing `paymentStatus` field, image upload, order cancellation by the
customer, email notifications, and deployment with CI.
