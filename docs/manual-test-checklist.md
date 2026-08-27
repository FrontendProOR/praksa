# Manual test checklist - SMWEB MERN Commerce

A repeatable checklist for verifying Project 2 by hand, in a browser and in
Postman (or `curl`).

> **How to use this document.** The boxes are deliberately left **unchecked**.
> This is a reusable procedure, not a record of any one test run - tick the
> boxes in your own copy as you execute it. Where a step has an exact expected
> result, it is stated, so a reviewer does not have to guess what "works" means.
>
> The automated suites cover the same ground and can be run in seconds
> (`npm test` in `server/` and in `client/`). This checklist exists for the
> parts a person should see with their own eyes, and for a mentor review.

**Estimated time:** about 30 minutes for the full pass.

---

## 0. Environment startup

- [ ] MongoDB is running and reachable on `mongodb://127.0.0.1:27017`.
- [ ] `server/.env` exists (copied from `.env.example`) with a real `JWT_SECRET` of at least 32 characters.
- [ ] `client/.env` exists with `VITE_API_BASE_URL=http://localhost:5000/api`.
- [ ] `cd server && npm install` completes without errors.
- [ ] `cd client && npm install` completes without errors.
- [ ] `cd server && npm start` prints `MongoDB connected` and `API listening on http://localhost:5000/api`.
- [ ] `cd client && npm run dev` serves on `http://localhost:5173` (the port must match the API's `CLIENT_ORIGIN`).
- [ ] `GET http://localhost:5000/api/health` → **200**, `database: "connected"`.
- [ ] There is a catalogue to test with. If not: `cd server && npm run seed:dev-catalogue`.
- [ ] There is an admin account. If not: `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run seed:admin`.

### Negative startup checks

- [ ] Stop the API, then load the storefront: pages show a readable "server unavailable" message with a retry, not a blank screen or a crash.
- [ ] Temporarily remove `JWT_SECRET` from `.env` and run `npm start`: the server refuses to start with a clear message and exit code 1. **Restore `.env` afterwards.**

---

## 1. API checklist (Postman / curl)

The set required by Section 12 of `CLAUDE.md`.

| # | Request | Expected |
|---|---|---|
| 1.1 | `GET /api/health` | 200, `status: "ok"`, no secrets in the body |
| 1.2 | `POST /api/auth/register` with a new email | 201, `role: "user"`, `Set-Cookie: access_token` |
| 1.3 | Repeat 1.2 with the same email | 409 `CONFLICT` |
| 1.4 | `POST /api/auth/register` with `"role": "admin"` | 201 but `role: "user"` |
| 1.5 | `POST /api/auth/register` with password `"short"` | 400 `VALIDATION_ERROR` naming `password` |
| 1.6 | `POST /api/auth/login`, correct credentials | 200 + cookie |
| 1.7 | `POST /api/auth/login`, wrong password | 401, generic message |
| 1.8 | `POST /api/auth/login`, unknown email | 401, **identical** message to 1.7 |
| 1.9 | `GET /api/auth/me` with no cookie | 401 `UNAUTHORIZED` |
| 1.10 | `GET /api/auth/me` with cookie | 200; body has only id, name, email, role, createdAt |
| 1.11 | `GET /api/auth/me` with `access_token=garbage` | 401 |
| 1.12 | `GET /api/admin/stats` as a normal user | 403 `FORBIDDEN` |
| 1.13 | `GET /api/admin/stats` with no cookie | 401 `UNAUTHORIZED` |
| 1.14 | `POST /api/products` as a normal user | 403 `FORBIDDEN` |
| 1.15 | `POST /api/products` as admin, valid body | 201; SKU upper-cased, slug generated |
| 1.16 | `POST /api/products` as admin, duplicate SKU | 409 `CONFLICT`, `details` names `sku` |
| 1.17 | `POST /api/products` as admin, `price: -5`, `stock: 2.5`, empty name | 400 with one detail per bad field |
| 1.18 | `PUT /api/products/:id` as admin | 200, values updated |
| 1.19 | `DELETE /api/products/:id` as admin | 200 |
| 1.20 | `GET /api/products?q=…&category=…&sort=price_asc&page=1&limit=5` | 200; `meta` matches the returned items |
| 1.21 | `GET /api/products?sort=nonsense&page=-4&limit=999` | 200; falls back to `newest`, page 1, limit clamped to 48 |
| 1.22 | `GET /api/products/does-not-exist` | 404 `NOT_FOUND` |
| 1.23 | `DELETE /api/categories/:id` for a category with active products | 409 `CONFLICT` stating how many |
| 1.24 | `POST /api/orders` with no cookie | 401 |
| 1.25 | `POST /api/orders` with valid items | 201; totals computed by the server |
| 1.26 | `POST /api/orders` sending `"unitPrice": 0.01, "total": 0.01` | 201 but stored totals are the **real** ones |
| 1.27 | `POST /api/orders` with `quantity` above stock | 409 `OUT_OF_STOCK`; stock unchanged afterwards |
| 1.28 | `POST /api/orders` with `"items": []` | 400 |
| 1.29 | `GET /api/orders/mine` | 200; only the caller's orders |
| 1.30 | `GET /api/orders/:id` for **another user's** order | 403 or 404; no order data in the body |
| 1.31 | `GET /api/orders/:id` as admin | 200 for any order |
| 1.32 | `GET /api/admin/orders` as admin | 200; no `passwordHash` anywhere |
| 1.33 | `PATCH /api/admin/orders/:id/status` `pending → processing` | 200 |
| 1.34 | `PATCH …/status` `delivered → pending` | 400 `VALIDATION_ERROR` |
| 1.35 | `PATCH …/status` with `"orderStatus": "teleported"` | 400 |
| 1.36 | `POST /api/admin/products` as admin | 404 — no duplicate admin CRUD surface exists |
| 1.37 | `GET /api/ne-postoji` | 404 with the standard error envelope |
| 1.38 | `POST /api/auth/login` with malformed JSON | 4xx, no `SyntaxError` or stack trace in the body |
| 1.39 | `POST /api/auth/logout` | 200; `Set-Cookie` empties `access_token` |

---

## 2. Public storefront

- [ ] `/` renders: hero, featured products, no console errors.
- [ ] The header navigation works and marks the current page.
- [ ] `/products` lists products from the API (not a hardcoded array — confirm in the Network tab).
- [ ] Product cards show name, price and an image or a graceful fallback.
- [ ] A product with a broken image path shows a placeholder, not a broken-image icon.

### Catalogue controls

- [ ] Typing in the search box narrows the results.
- [ ] Selecting a category filters the list.
- [ ] Sorting by price ascending, then descending, reorders correctly.
- [ ] Pagination moves between pages and the count matches what is displayed.
- [ ] The address bar reflects the state, e.g. `/products?q=staklo&sort=price_asc&page=2`.
- [ ] Copying that URL into a new tab reproduces the same result set.
- [ ] Browser **Back** and **Forward** restore previous filter states.
- [ ] Changing a filter resets to page 1; changing the page keeps the filters.
- [ ] A search with no matches shows a "no results" state, not an error.
- [ ] Editing the URL to `?sort=nonsense&page=-4` does not break the page.

### Product details and 404

- [ ] Clicking a card opens `/products/<slug>` with full details.
- [ ] Refreshing that URL directly still works.
- [ ] `/products/ne-postoji` shows a "not found" state, not a crash.
- [ ] `/nasumicna-putanja` shows the 404 page with a way back.

---

## 3. Authentication

- [ ] `/register` rejects an empty form; each field shows a message.
- [ ] An invalid email format is rejected before any request is sent.
- [ ] A password under 8 characters, or with no digit, is rejected with an explanation.
- [ ] Registering with a fresh email succeeds and signs the user in.
- [ ] Registering with an existing email shows the conflict message from the API.
- [ ] `/login` with wrong credentials shows a generic failure and keeps the typed email.
- [ ] The submit button is disabled while the request is in flight.
- [ ] Clicking submit three times quickly sends only **one** request (Network tab).
- [ ] After signing in, the header shows the account and logout controls.
- [ ] **Refresh the page while signed in — the session survives** (via `/auth/me`).
- [ ] `/account` shows name, email, role and member-since.
- [ ] Logout returns to the home page and the header reverts to the guest state.
- [ ] After logout, `/account` redirects to `/login`.

### Route protection

- [ ] As a guest, `/checkout`, `/orders` and `/account` all redirect to `/login`.
- [ ] After signing in from that redirect, you land on the page you originally wanted.
- [ ] As a normal user, `/admin` shows "access not permitted" — **not** a login form and **not** the dashboard.
- [ ] As a normal user, `/admin/products` and `/admin/orders` are refused the same way.
- [ ] As an admin, `/admin` opens the dashboard.

### Session security (browser dev tools)

- [ ] **Application → Local Storage**: only `smweb-lab-cart-v1`. No token, no session, no password.
- [ ] **Application → Session Storage**: empty.
- [ ] **Console**: `document.cookie` does **not** reveal `access_token` (it is `HttpOnly`).
- [ ] **Application → Cookies**: `access_token` shows `HttpOnly ✓`, `SameSite=Lax`, and a finite expiry.
- [ ] Deleting the `access_token` cookie and refreshing returns the app to the guest state cleanly.

---

## 4. Cart

- [ ] Adding from a product card puts one line in the cart; the header count updates.
- [ ] Adding the **same** product again raises the quantity instead of adding a second line.
- [ ] A sold-out product cannot be added (the control is disabled and says so).
- [ ] `/cart` lists the lines with a subtotal.
- [ ] Changing a quantity updates the subtotal.
- [ ] Typing `0` or `-5` as a quantity repairs it to 1 rather than accepting it.
- [ ] The quantity cannot be raised above the known stock.
- [ ] Removing a line works; clearing empties the cart.
- [ ] **Refresh the page — the cart survives.**
- [ ] In dev tools, set `localStorage['smweb-lab-cart-v1'] = '{not json'` and refresh: the app still loads with an empty cart.
- [ ] The cart page states that the server computes the final amount.

---

## 5. Checkout and orders

- [ ] With items in the cart, `/checkout` as a guest redirects to `/login`.
- [ ] Signed in, the checkout form requires all six address fields.
- [ ] Both payment methods can be selected; **no card number is ever requested**.
- [ ] Submitting a valid checkout creates the order and shows a confirmation.
- [ ] The cart is emptied after a successful order.
- [ ] Refreshing the confirmation page does **not** create a second order and does not repeat the notice.
- [ ] `/orders` lists the new order with its status badges.
- [ ] Opening the order shows the line items, address, and server-computed totals.
- [ ] The order total equals subtotal + shipping (flat 6.90 KM, free from 100 KM).

### Server price authority (the important one)

- [ ] In dev tools, edit the stored cart to `"price": 0.01` and check out.
- [ ] The created order shows the **real** price and total, not 0.01.
- [ ] In Postman, `POST /api/orders` with `"total": 0.01` and `"orderStatus": "delivered"` — the stored order has the real total and status `pending`.

### Ownership

- [ ] Register a second user, sign in, and open `/orders` — the first user's orders are **not** listed.
- [ ] Paste the first user's order URL — it is refused, and no order data is visible.
- [ ] Sign back in as the first user — the order is visible again.

### Stock

- [ ] Note a product's stock, order some, and confirm stock decreased by exactly that quantity.
- [ ] Try to order more than the remaining stock — it fails clearly and stock does **not** change.

---

## 6. Admin area

Sign in as the admin account.

- [ ] The admin area is visually distinct from the storefront.
- [ ] The dashboard figures match the database (cross-check in MongoDB Compass).
- [ ] "Demo revenue" is labelled as demo, not presented as real takings.
- [ ] The orders-by-status breakdown adds up to the total order count.

### Products

- [ ] The product table includes **inactive** products (the storefront does not).
- [ ] "New product" with an empty form shows field errors and sends no request.
- [ ] A compare-at price below the price is rejected with an explanation.
- [ ] A valid product is created; the table refreshes without a browser reload.
- [ ] Creating a second product with the same SKU shows a conflict on the SKU field.
- [ ] Editing a product pre-fills the form with the stored values.
- [ ] Saving an edit updates the table.
- [ ] Deactivating a product removes it from `/products` but keeps it in the admin table.
- [ ] Delete asks for confirmation and **names the product**.
- [ ] **Escape** cancels the dialog and deletes nothing.
- [ ] Confirming deletes the product and refreshes the table.

### Categories

- [ ] A category can be created; the slug is generated on the server.
- [ ] A duplicate name is reported on the name field.
- [ ] Editing pre-fills the form and saves.
- [ ] Deleting a category **that has active products** is refused with an understandable message, and the category remains.
- [ ] Deleting an unused category succeeds.

### Orders

- [ ] All customers' orders are listed with the customer's name and email.
- [ ] The status filter narrows the list.
- [ ] The status control offers only the legal next statuses.
- [ ] Changing a status updates the row without a browser reload.
- [ ] A `delivered` order offers no further transitions.
- [ ] Changing a status does not alter the order's items or totals.

---

## 7. Responsive checks

Repeat at **320, 375, 768, 1024 and 1440 px** (dev tools device toolbar).

Pages: Home, Catalogue, Product details, Login, Register, Account, Cart,
Checkout, Orders, Order details, Admin dashboard, Admin products, Admin product
form, Admin categories, Admin orders, 404.

For each:

- [ ] **No horizontal page scrolling** at any width.
- [ ] No clipped or overlapping text.
- [ ] No control pushed off-screen or cut off.
- [ ] Wide tables scroll **inside their own container**, not by moving the page.
- [ ] Cards reflow rather than becoming unreadably narrow.
- [ ] The confirmation dialog fits inside the viewport at 320 px.
- [ ] The mobile menu opens, closes, and is usable by touch.
- [ ] Pagination fits and stays usable on a narrow screen.
- [ ] Tap targets are comfortably large.

---

## 8. Accessibility checks

- [ ] Every page has exactly **one** `h1`.
- [ ] Heading levels descend without skipping.
- [ ] The page uses `header`, `nav`, `main` and `footer`.
- [ ] Every form field has a visible, associated label.
- [ ] A validation error is linked to its field (`aria-describedby`) and the field is `aria-invalid`.
- [ ] Errors are conveyed by **words**, never colour alone.
- [ ] Focus is always visible while tabbing.
- [ ] The current navigation item is marked with `aria-current`, not just colour.
- [ ] Loading states are announced (`role="status"`), errors as `role="alert"`.
- [ ] Decorative icons are `aria-hidden` and do not clutter screen-reader output.
- [ ] Buttons that repeat per row (Edit/Delete) have names that say **which** item.

### Keyboard only — put the mouse away

- [ ] The skip link appears on the first Tab and jumps to the main content.
- [ ] The mobile menu can be opened, navigated and closed from the keyboard.
- [ ] Search, category filter and sort are all reachable and operable.
- [ ] Login and registration can be completed and submitted with Enter.
- [ ] Cart quantities can be changed and a line removed.
- [ ] Checkout can be completed end to end.
- [ ] The admin product form can be filled and submitted.
- [ ] A category can be created and deleted.
- [ ] An order status can be changed.
- [ ] In the confirmation dialog: focus starts on **Cancel**, Tab reaches **Delete**, Escape closes it, and focus returns to the control that opened it.

---

## 9. Error handling

Force each failure and confirm the app degrades rather than breaking.

- [ ] **API stopped** → readable message plus a retry; the page does not crash.
- [ ] **MongoDB stopped** → the API reports the failure; the client shows a useful state.
- [ ] Invalid login → message shown, typed email preserved.
- [ ] Duplicate registration → conflict explained on the right field.
- [ ] Duplicate SKU / category name → conflict shown on the field.
- [ ] Category in use → 409 explained, nothing deleted.
- [ ] Invalid product form → per-field messages, no request sent.
- [ ] Missing product / order → "not found" state with a way back.
- [ ] Insufficient stock at checkout → clear failure, **cart preserved**.
- [ ] Invalid order id → controlled error, no stack trace.
- [ ] 401 / 403 from any admin API → handled, never a blank page.
- [ ] No response body anywhere contains a stack trace or MongoDB internals.

---

## 10. Cleanup and reset

After testing, leave the database in its documented development state.

- [ ] Delete the test users created during the pass.
- [ ] Delete their orders, and restore the stock those orders consumed.
- [ ] Delete any products or categories created during the pass.
- [ ] Confirm the admin account still works.
- [ ] Optionally reload a clean catalogue: `cd server && npm run seed:dev-catalogue` (it clears and reloads only the catalogue collections, so it is safe to re-run).
- [ ] Confirm no `.env` file, secret or test artefact has been staged for commit: `git status`.

---

## 11. Automated equivalents

| Area | Command | Location |
|---|---|---|
| Critical backend flows | `npm test` | `project-02-mern-commerce/server` |
| Frontend forms, cart, guards, states | `npm test` | `project-02-mern-commerce/client` |
| Lint | `npm run lint` | `client` (and `project-01-agency-site`) |
| Production build | `npm run build` | `client` (and `project-01-agency-site`) |

The backend suite uses its own database (`smweb_mern_commerce_test`) and clears
it before and after each run, so it never touches development data.
