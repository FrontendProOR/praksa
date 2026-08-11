# Day 02 - MERN learning notes and development environment

- **Date:** 11.08.2026.
- **Goal of the day:** prepare and verify a reproducible local development environment, and write down the concepts needed to implement both projects. No project code is written on Day 02.

---

## 1. Verified development environment

All versions below were read from the machine used for the internship on Day 02.

| Tool | Version / state | How it was verified |
|---|---|---|
| Node.js | **v24.14.1** | `node -v` |
| npm | **11.11.0** | `npm -v` |
| npm registry | `https://registry.npmjs.org/` | `npm config get registry` |
| Git | **2.55.0.windows.5** | `git --version`, `git status -sb` |
| VS Code | **1.135.0** (with `code` CLI on PATH) | `code --version` |
| Postman (desktop) | **12.7.5** | installed under `%LOCALAPPDATA%\Postman` |
| MongoDB Compass | installed | present under `%LOCALAPPDATA%\MongoDBCompass` |
| curl | **8.21.0** | `curl --version` |
| PowerShell HTTP client | `Invoke-RestMethod` / `Invoke-WebRequest` available | cmdlet lookup |
| MongoDB server | **not installed** - see section 8 | `mongod`/`mongosh` not on PATH, no MongoDB service, nothing listening on 27017 |
| OS | Windows 11 Pro | - |

Package versions currently published for the approved stack (what `npm install <package>` resolves to today, recorded so later days are not surprised by a major bump):

| Package | Version | Package | Version |
|---|---|---|---|
| express | 5.2.1 | react | 19.2.8 |
| mongoose | 9.9.4 | react-dom | 19.2.8 |
| dotenv | 17.4.2 | react-router-dom | 7.18.3 |
| cors | 2.8.6 | axios | 1.20.0 |
| cookie-parser | 1.4.7 | vite | 8.2.2 |
| jsonwebtoken | 9.0.3 | nodemon | 3.1.14 |
| bcryptjs | 3.0.3 | supertest | 7.2.2 |
| helmet | 8.3.0 | vitest | 4.1.11 |
| express-rate-limit | 8.7.0 | express-validator | 7.3.2 |

No packages were installed into the repository on Day 02. The smoke test in section 9 ran in a temporary folder outside the repository.

---

## 2. Node.js runtime and the role of npm

### Node.js

- Node.js executes JavaScript outside the browser on the V8 engine. It gives server code access to the file system, network sockets, processes and environment variables - things browser JavaScript cannot touch.
- It is single-threaded with an event loop and non-blocking I/O: while a database query is in flight the thread serves other requests. This is why every database and HTTP call in the projects is `async`/`await` rather than blocking.
- Module systems: **CommonJS** (`require`) and **ES Modules** (`import`). Both internship projects use ES Modules, enabled by `"type": "module"` in `package.json`. Consequence: `__dirname` and `require` do not exist; use `import.meta.url` when a path is genuinely needed.
- Useful built-ins for this project: `process.env` (configuration), `process.exit` (fail fast on missing config), the global `fetch`, and the built-in test runner (`node --test`) as one of the two allowed test options.

### npm

- Installs dependencies from the registry into `node_modules` and records them in `package.json`.
- `dependencies` are needed at runtime (express, mongoose, jsonwebtoken); `devDependencies` are needed only while developing or testing (nodemon, supertest, vitest).
- `package-lock.json` pins the exact resolved versions and is committed, so another machine installs the same tree.
- Semver ranges: `^5.2.1` accepts 5.x minor/patch updates but not 6.0.0; `~5.2.1` accepts patches only.
- `scripts` are the project entry points, run with `npm run <name>` (`dev`, `start`, `test`, `build`). `npx` runs a package binary without installing it globally.
- Commands used during the internship: `npm install`, `npm install <pkg>`, `npm install -D <pkg>`, `npm run dev`, `npm test`, `npm run build`, `npm ls --depth=0`.

---

## 3. Express.js concepts

### Application

`const app = express()` creates the application object: a request handler plus a stack of middleware and routes. Per the code rules, `app.js` builds and exports the app while `server.js` opens the port, so tests can drive the app with supertest without binding a socket.

### Route

A route pairs an HTTP method with a path and one or more handlers:

```js
app.get('/api/products/:slug', getProductBySlug);
```

`:slug` is a route parameter available as `req.params.slug`.

### Router

`express.Router()` is a mountable mini-application used to group related routes in their own file:

```js
// routes/product.routes.js
const router = express.Router();
router.get('/', listProducts);
export default router;

// app.js
app.use('/api/products', productRoutes);
```

This is how the project keeps `/api/auth`, `/api/products`, `/api/categories`, `/api/orders` and `/api/admin/*` separated.

### Middleware

A function `(req, res, next)` that runs before the handler. It can read/modify the request, end the response, or call `next()` to continue. Order matters - middleware runs top to bottom.

Categories used in Project 2:

- built-in parsers: `express.json()`, `cookieParser()`;
- security: `helmet()`, `cors({ origin, credentials: true })`, `express-rate-limit`;
- validation: `express-validator` chains plus a result handler that turns failures into `VALIDATION_ERROR`;
- authentication: `authenticate` reads the `access_token` cookie, verifies the JWT and attaches the user;
- authorization: `authorize('admin')` rejects anyone without the required role;
- terminal handlers: `notFound` (unknown route) and `errorHandler`, which takes four arguments `(err, req, res, next)` and is registered last.

### Controller

The function that handles one endpoint: read validated input from `req`, call a service, send a response. Controllers stay thin; business rules (order total recalculation, stock checks, category-in-use conflicts) belong in `services/`.

### Request and response

- `req.params` (route parameters), `req.query` (`?q=`, `?page=`), `req.body` (parsed JSON), `req.cookies` (needs cookie-parser), `req.headers`.
- `res.status(code)`, `res.json(payload)`, `res.cookie(name, value, options)`, `res.clearCookie(name)`.
- Every response in Project 2 uses the fixed envelope: `{ success: true, data, meta }` or `{ success: false, error: { code, message, details } }`.

### Status codes used by this API

| Code | Meaning | Where it appears |
|---|---|---|
| 200 OK | successful read/update | product list, `/auth/me`, order status update |
| 201 Created | resource created | register, create product/category/order |
| 400 Bad Request | malformed or invalid input | `VALIDATION_ERROR` |
| 401 Unauthorized | missing/invalid session | `/auth/me` without cookie, bad login credentials |
| 403 Forbidden | authenticated but not allowed | normal user calling an admin route, reading another user's order |
| 404 Not Found | unknown route or missing resource | unknown slug, `notFound` middleware |
| 409 Conflict | state conflict | duplicate email, deleting a category still in use |
| 422 / 400 | domain rule violation | out-of-stock checkout (`OUT_OF_STOCK`) |
| 429 Too Many Requests | rate limit hit | repeated login attempts |
| 500 Internal Server Error | unexpected failure | centralized `errorHandler`, no stack trace in the body |

**Express 5 note (verified in the smoke test):** a rejected promise thrown inside an `async` handler is forwarded to the error middleware automatically. Express 4 required a wrapper. A small `asyncHandler` utility therefore remains optional rather than mandatory in Day 07.

---

## 4. REST basics and CRUD mapping

REST models the API as **resources** addressed by URL, manipulated with HTTP methods, exchanging JSON, and stateless between requests (this project's session state travels in a cookie, not in server memory).

| Operation | HTTP method | Example from this project | Typical success |
|---|---|---|---|
| Create | `POST` | `POST /api/products`, `POST /api/orders` | 201 |
| Read (collection) | `GET` | `GET /api/products?q=&page=` | 200 |
| Read (single) | `GET` | `GET /api/products/:slug` | 200 |
| Update (full) | `PUT` | `PUT /api/products/:id` | 200 |
| Update (partial) | `PATCH` | `PATCH /api/admin/orders/:id/status` | 200 |
| Delete | `DELETE` | `DELETE /api/categories/:id` | 200 |

Conventions followed:

- resource paths are plural nouns (`/api/products`), except action-style auth endpoints (`/api/auth/login`);
- `GET` never changes state and is safe to repeat; `PUT`/`DELETE` are idempotent;
- filtering, sorting and pagination are query parameters, not separate endpoints;
- collection responses carry `meta` with `page`, `limit`, `totalItems`, `totalPages`;
- the client is never trusted for authorization or pricing - both are decided on the server.

---

## 5. MongoDB: documents and collections

- A **document** is a BSON record that looks like JSON (`{ name: "...", price: 49.9, tags: ["a","b"] }`). BSON adds types JSON lacks: `ObjectId`, `Date`, `Decimal128`, binary.
- A **collection** holds documents and is the rough equivalent of a table, but MongoDB does not force a fixed structure at database level - schema discipline comes from the application, which is exactly the job of Mongoose here.
- Every document has a unique `_id`, by default an `ObjectId` (12 bytes, includes a creation timestamp).
- A **database** groups collections. This project uses `smweb_mern_commerce` with collections `users`, `categories`, `products`, `orders` (Mongoose pluralizes model names).
- **Relationships** are modelled two ways:
  - *reference* - store another document's `_id` (`Product.category` -> `Category`, `Order.user` -> `User`) and join at read time with `populate()`;
  - *embedding* - store the related data inside the parent document (`Order.items`, `Order.shippingAddress`).
  Order items are embedded **snapshots** on purpose: name, SKU and unit price are copied at purchase time so a later product edit or deletion cannot rewrite order history.
- **Indexes** make lookups fast and enforce uniqueness. This project indexes `User.email`, `Category.slug`, `Product.slug`, `Product.sku` (all unique) plus `Product.category` and `Order.user` for filtering. Without an index, MongoDB scans the whole collection.
- Query basics: `find(filter)`, `findOne`, operators `$regex` (case-insensitive search), `$in`, `$gte`/`$lte`, `$or`; `sort`, `skip`, `limit` implement pagination; `countDocuments` supplies `totalItems`; aggregation (`$group`) will produce the admin statistics.
- **Transactions** require a replica set. A single standalone `mongod` cannot run them, which matters for order creation (stock decrement + order insert) - see section 8.

---

## 6. Mongoose: schema and model

- A **Schema** declares the shape of a document: field types, `required`, `unique`, `min`/`max`, `enum`, `default`, `trim`, `lowercase`, and `timestamps: true` for automatic `createdAt`/`updatedAt`.
- A **Model** is the constructor compiled from a schema (`mongoose.model('Product', productSchema)`), and it is the query interface: `create`, `find`, `findById`, `findOneAndUpdate`, `deleteOne`.
- Why it is used here:
  - **validation as a second layer** behind express-validator, so invalid data cannot reach MongoDB even through a service call;
  - **index declarations** live next to the field definitions;
  - **casting** turns a string id from a URL into an `ObjectId`, and reports a clean error when it is not a valid id;
  - **middleware/hooks** (`pre('save')`) and instance/static methods keep model logic in one place;
  - **serialization control** - a `toJSON` transform removes `passwordHash` and `__v`, which is how the API guarantees a hash is never returned.
- Practical notes: `populate('category')` replaces a stored `ObjectId` with the referenced document; `.lean()` returns plain objects (faster for read-only lists); a `ValidationError` from Mongoose must be translated into the project's `VALIDATION_ERROR` envelope by the central error handler, and duplicate-key error `E11000` into `CONFLICT`.
- Connection: `mongoose.connect(process.env.MONGODB_URI)` in `config/db.js`; the server must fail loudly if the URI is missing rather than starting half-configured.

---

## 7. React: components, props, state, forms

- A **component** is a function returning JSX; it renders UI from its inputs. Components are `PascalCase`, one responsibility each, pages kept separate from reusable components.
- **Props** are read-only inputs passed from parent to child (`<ProductCard product={product} />`). Data flows down; children communicate upward by calling callbacks received as props.
- **State** is data a component owns and can change: `const [value, setValue] = useState(initial)`. Changing state re-renders the component. State must be treated as immutable - build a new array/object instead of mutating.
- **Hooks used in this project**:
  - `useState` - form values, loading and error flags;
  - `useEffect` - fetch data when the component mounts or a dependency (page, filter, slug) changes; return a cleanup function to abort a stale request;
  - `useContext` - read `AuthContext` and `CartContext` without prop drilling;
  - `useMemo`/`useCallback` - avoid recreating values that would otherwise re-trigger effects and cause duplicate requests.
- **Lists** are rendered with `map` and need a stable `key` (the product id, never the array index).
- **Conditional rendering** produces the three mandatory UI states: loading, error, empty - plus the normal data state.
- **Forms** are controlled: the input's `value` comes from state and `onChange` writes it back, so validation can run before submit. Rules for both projects: every input has a real `<label htmlFor>`, errors are shown next to the field and associated with `aria-describedby`, the submit button is disabled while a request is pending to prevent duplicate submissions, and `alert()` is never the primary feedback channel.
- **Context** holds cross-cutting state: `AuthContext` (current user, login/logout, session restored from `/auth/me`) and `CartContext` (items, quantity changes, `localStorage` persistence).
- **Vite** serves the client in development with hot module replacement and builds the production bundle; environment values are read from `import.meta.env.VITE_*`.

---

## 8. MongoDB availability and the exact URI approach

**Current state: no MongoDB server is installed on this machine.** `mongod` and `mongosh` are not on PATH, no `MongoDB*` Windows service exists, `C:\Program Files\MongoDB` is absent and nothing is listening on port 27017. MongoDB Compass (the GUI client) *is* installed, but a client without a server cannot connect.

This does not block Day 02, but it **must be resolved before Day 07**, when the Express server first connects to the database.

### Chosen approach: local MongoDB Community Server

The project stays on a local database, matching `.env.example` in the specification. No cloud dependency is introduced.

```env
MONGODB_URI=mongodb://127.0.0.1:27017/smweb_mern_commerce
```

- `mongodb://` - connection protocol;
- `127.0.0.1:27017` - local server on the default MongoDB port;
- `smweb_mern_commerce` - database name; MongoDB creates it on first write, so no manual setup step is required;
- the value lives only in `server/.env` (git-ignored); `server/.env.example` carries the same line as a documented default.

Tests will use a separate database name (for example `smweb_mern_commerce_test`) so that running the suite never destroys demo data.

### Installation steps to run before Day 07

```powershell
winget install MongoDB.Server        # installs mongod and registers the MongoDB Windows service
```

Verification afterwards:

```powershell
Get-Service MongoDB                                   # expect Status = Running
Test-NetConnection 127.0.0.1 -Port 27017              # expect TcpTestSucceeded = True
```

Then open Compass and connect to `mongodb://127.0.0.1:27017`.

### Consequence for Day 12 (order creation)

A default single-server install is a **standalone** deployment, and MongoDB transactions require a replica set. Order creation therefore either runs as a documented non-transactional sequence (validate everything first, insert the order, then decrement stock, with the limitation written down honestly), or the local server is started as a single-node replica set to enable sessions. This decision belongs to Day 12; it is recorded here so it is not discovered late.

---

## 9. Environment verification log

Every command below was executed on Day 02. The Express smoke test ran in a temporary folder outside the repository - no dependency, lock file or source file from it entered the project.

| Check | Command | Result |
|---|---|---|
| Node runtime | `node -v` | `v24.14.1` |
| npm | `npm -v` | `11.11.0` |
| Git works in this repository | `git status -sb` | `## main...origin/main`, clean tree |
| Git history readable | `git log --oneline` | Day 01 commit present |
| npm can install from the registry | `npm install express` | 68 packages added in ~4 s, `express@5.2.1` |
| Express serves requests | `node smoke.mjs` | 7/7 assertions passed, exit code 0 |
| Manual API test - GET | `curl -i http://127.0.0.1:5099/api/health` | `HTTP/1.1 200 OK`, JSON body |
| Manual API test - POST JSON | `curl -X POST .../api/echo -H 'Content-Type: application/json' -d '{...}'` | `HTTP 201`, body echoed back |
| Manual API test - PowerShell | `Invoke-RestMethod`, `Invoke-WebRequest -WebSession` | 200 with parsed JSON; session object holds a cookie jar for the later JWT flow |
| MongoDB server | PATH, services, port 27017 | **not installed** - see section 8 |

The smoke test asserted exactly what later days depend on:

1. `GET /api/health` returns 200 with `{ success: true, data: { status: "ok" } }`;
2. an unknown route falls through to a `notFound` handler returning 404 with `error.code = "NOT_FOUND"`;
3. an `async` handler that throws reaches the central error middleware and returns 500 with `error.code = "INTERNAL_ERROR"` - confirming Express 5 forwards rejected promises without a wrapper.

---

## 10. Manual API testing workflow (Postman)

Postman 12.7.5 is installed and is the primary manual testing tool; `curl` and `Invoke-RestMethod` cover the same ground from a terminal and were both verified today.

Planned collection layout, mirroring the API contract:

```text
SMWEB MERN Commerce
├── Health        GET  {{baseUrl}}/health
├── Auth          POST {{baseUrl}}/auth/register
│                 POST {{baseUrl}}/auth/login
│                 GET  {{baseUrl}}/auth/me
│                 POST {{baseUrl}}/auth/logout
├── Categories    GET / POST / PUT / DELETE
├── Products      GET (with q, category, sort, page, limit) / POST / PUT / DELETE
├── Orders        POST {{baseUrl}}/orders, GET /orders/mine, GET /orders/:id
└── Admin         GET /admin/products, GET /admin/orders,
                  PATCH /admin/orders/:id/status, GET /admin/stats
```

Working rules:

- one Postman environment holds `baseUrl = http://localhost:5000/api`, so no URL is hardcoded in requests;
- the JWT arrives in an **HttpOnly** cookie, so no token is copied into an `Authorization` header - Postman's cookie jar keeps the session automatically after `POST /auth/login`, and `POST /auth/logout` must clear it;
- authorization checks are exercised with three cookie states: no session (expect 401), normal user (expect 403 on admin routes), admin (expect 200);
- negative cases are part of the collection, not an afterthought: duplicate registration (409), bad credentials (401), invalid product payload (400), unknown slug (404), category still in use (409), insufficient stock (`OUT_OF_STOCK`);
- results feed `docs/manual-test-checklist.md`, which is written on Day 14.

Browser dev tools complement Postman: **Network** for request/response and the `Set-Cookie` header, **Application** for the cookie flags and the `localStorage` cart, **Console** for React warnings, and device toolbar for the 320/375/768/1024/1440px responsive checks.

---

## 11. Blockers and next step

| Item | State |
|---|---|
| Node.js, npm, Git, VS Code, Postman, Compass, curl | verified working |
| Express request/response cycle on this machine | verified by smoke test |
| MongoDB server | **open** - not installed; exact URI and installation steps documented in section 8, to be resolved before Day 07 |
| Repository cleanliness | no dependencies, secrets or project code added on Day 02 |

Next: Day 03 - write `docs/project-01-requirements.md`, scaffold `project-01-agency-site` with Vite + React, and implement the page shell, header and hero.
