# SMWEB - Stručna praksa 2026

Repository of a 15-working-day professional internship at **SMWEB, Zvornik**, covering the practical development of a modern web application with the **MERN** stack: **MongoDB, Express.js, React, Node.js**.

- **Internship period:** 10.08.2026. - 28.08.2026.
- **Working days:** 15
- **Company:** SMWEB, Zvornik
- **Specification and progress tracker:** [`CLAUDE.md`](CLAUDE.md)

---

## Purpose

The internship demonstrates a complete development cycle rather than isolated exercises: requirements, planning, implementation, testing, review and delivery. The work is split into two projects of increasing complexity, and the repository is expected to be reproducible - another developer should be able to clone it, configure it from the documented environment variables and run it without additional explanation.

---

## Projects

### 1. `project-01-agency-site` - React agency website (Days 03-05)

A responsive, frontend-only presentation website for a small software agency.

- Stack: React, Vite, JavaScript ES Modules, CSS3.
- Sections: header/navigation, hero, services, selected work, process, technology overview, about/metrics, contact form, footer.
- Contact form with required-field and email-format validation and a demo success state (no backend).
- Responsive from 320px upwards, accessible headings, labels and focus states.

### 2. `project-02-mern-commerce` - MERN commerce application (Days 06-15)

A scoped but complete e-commerce application built on the full MERN stack.

- **MongoDB + Mongoose:** `User`, `Category`, `Product` and `Order` models with validation, unique indexes and order line snapshots.
- **Express + Node.js:** REST API under `/api` with a consistent response envelope, request validation, centralized error handling, security headers and rate limiting.
- **Authentication:** JWT delivered in an `HttpOnly` cookie, bcrypt password hashing, role-based authorization (`user` / `admin`) enforced on the server.
- **React client:** storefront with catalog search, filtering, sorting and pagination; cart persisted in `localStorage`; checkout and order history; protected admin area for products, categories and orders.
- **Server-side totals:** the client submits only product IDs and quantities; prices and totals are recomputed from the database on every order.

Out of scope by design: real card payments, shipping provider integrations, upload services, coupons, multi-vendor, multi-currency, localization frameworks, social login and Docker.

---

## Technology stack

| Layer | Technologies |
|---|---|
| Database | MongoDB, Mongoose |
| Backend | Node.js (LTS), Express.js, JWT, bcryptjs, express-validator, helmet, express-rate-limit, cors, cookie-parser, dotenv |
| Frontend | React, Vite, React Router, Axios, CSS3, React Context |
| Tooling | VS Code, Git, npm, MongoDB Compass, Postman, browser dev tools |

The stack is fixed by the internship confirmation. TypeScript, Next.js, NestJS, Redux, GraphQL, SQL databases and Docker are not used.

---

## Repository structure

Final structure:

```text
.
├── CLAUDE.md                     # authoritative specification and day-by-day progress tracker
├── README.md
├── .gitignore
├── LICENSE
├── docs/
│   ├── day-01-onboarding.md      # workflow, scopes, MERN objective, tooling
│   ├── day-02-mern-notes.md      # environment versions and MERN concept notes
│   ├── project-01-requirements.md
│   ├── project-01-qa-notes.md
│   ├── project-02-requirements.md
│   ├── api-reference.md          # complete REST API reference
│   ├── delivery-notes.md         # handover: architecture, security, demo order
│   └── manual-test-checklist.md  # repeatable manual verification procedure
├── project-01-agency-site/       # Days 03-05 - React + Vite, frontend only
└── project-02-mern-commerce/     # Days 06-15
    ├── server/                   # Express + MongoDB REST API
    │   ├── src/                  # config, models, routes, controllers,
    │   │                         # services, middleware, utils, seeds
    │   └── tests/                # backend flows (Node test runner + supertest)
    └── client/                   # React storefront and admin area
        └── src/                  # api, components, context, hooks, layouts,
                                  # pages, routes, styles, tests, utils
```

---

## Prerequisites

- **Node.js 20.19+** (developed and verified on Node 24) and npm
- **Git**
- **MongoDB** running locally on `mongodb://127.0.0.1:27017`
- Optional: MongoDB Compass to inspect the data, Postman for manual API calls

MongoDB must be running before the API starts. If it was installed from the
Community ZIP rather than as a Windows service, it does not start on its own -
start it by hand, for example:

```bash
"%LOCALAPPDATA%\mongodb-local\bin\mongod.exe" --dbpath "%LOCALAPPDATA%\mongodb-local\data" --bind_ip 127.0.0.1 --port 27017
```

---

## Quick start

Each project has its own `package.json` and `README.md`; this is the short path
from a fresh clone to a running demo.

### Project 1 - agency website

```bash
cd project-01-agency-site
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build
```

No backend, no environment file, no database.

### Project 2 - MERN commerce

**1. Configure.** Real `.env` files are git-ignored; copy the examples and fill
in local values.

```bash
cd project-02-mern-commerce
cp server/.env.example server/.env
cp client/.env.example client/.env
```

`server/.env` needs a real `JWT_SECRET` of **at least 32 characters** - the
server refuses to start with the placeholder, a short value, or none at all.
Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

| Variable | Where | Purpose |
|---|---|---|
| `NODE_ENV` | server | `development`, `production` or `test` |
| `PORT` | server | API port, default `5000` |
| `MONGODB_URI` | server | connection string, default local database |
| `JWT_SECRET` | server | signing key, min 32 characters, **never committed** |
| `JWT_EXPIRES_IN` | server | session lifetime, default `60m` |
| `CLIENT_ORIGIN` | server | the single origin CORS allows, default `http://localhost:5173` |
| `VITE_API_BASE_URL` | client | API base URL; `VITE_*` values are public, so never put a secret here |

**2. Install and seed.**

```bash
cd server && npm install
npm run seed:demo          # 3 categories, 16 products, 2 demo accounts
```

**3. Run** (two terminals).

```bash
cd server && npm start     # http://localhost:5000/api
cd client && npm install && npm run dev   # http://localhost:5173
```

Check `http://localhost:5000/api/health` - it should report
`{"status":"ok","database":"connected"}`.

The client port must match the API's `CLIENT_ORIGIN`; CORS allows that one
origin only.

**4. Sign in.** `npm run seed:demo` creates two local demo accounts:

| Role | Email | Password |
|---|---|---|
| admin | `admin@smweb.local` | `DemoAdmin123` |
| user | `kupac@smweb.local` | `DemoKupac123` |

These are **local development credentials for a demo database and nothing
else.** Override them with `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` /
`DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` on any shared machine. There is no API
route that grants the `admin` role - public registration always produces a
`user`, and the role is set only by a seed script run against the database. To
create or reset an admin with your own credentials:

```bash
cd server
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='YourStrongPass123' npm run seed:admin
```

Neither script prints a password.

### Tests and builds

```bash
cd project-01-agency-site      && npm run lint && npm run build
cd project-02-mern-commerce/server && npm test          # critical backend flows
cd project-02-mern-commerce/client && npm test && npm run lint && npm run build
```

The backend suite uses its own database, `smweb_mern_commerce_test`, and clears
it before and after each run, so it never touches demo data.

---

## Known limitations

Honest scope boundaries, not defects:

- **No real payments.** `card_demo` is a simulated choice; no card details are
  ever requested, stored or charged, and cash-on-delivery is the other option.
- **No multi-document transactions.** The local MongoDB is a standalone server,
  which does not support them. Stock is taken with a conditional atomic update
  that only matches while enough remains, and a compensating rollback if a later
  step fails - safe against overselling, but not a true transaction.
- **MongoDB must be started manually** when installed from the Community ZIP
  rather than as a Windows service.
- **Category management has no active/inactive switch.** The category listing
  endpoint is the public one and returns active categories only, so deactivating
  a category from the admin screen would remove it from the list needed to
  restore it.
- **Project 1's contact form is a demo.** It validates input and shows a success
  state; it sends and stores nothing, by design - Project 1 has no backend.
- **No image uploads.** Product images are URLs or paths; there is no upload
  service.
- **Single language.** The interface is in Bosnian/Serbian with no localisation
  framework, and API error messages are in English.
- **Not deployed.** Everything runs locally; there is no hosting, CI or
  production environment.

---

## Documentation

| Document | Content |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Full specification: stack, data model, REST API contract, security rules, day-by-day plan and progress checkboxes |
| [`docs/day-01-onboarding.md`](docs/day-01-onboarding.md) | Onboarding notes: development lifecycle, project scopes, MERN objective, tools and working rules |
| [`docs/day-02-mern-notes.md`](docs/day-02-mern-notes.md) | Verified development environment (tool versions), MERN learning notes (Node/npm, Express, REST, MongoDB, Mongoose, React), MongoDB URI approach and manual API testing workflow |
| [`docs/project-01-requirements.md`](docs/project-01-requirements.md) | Agency website requirements: sections, responsive rules, accessibility bar, out-of-scope list and per-day implementation status |
| [`docs/project-01-qa-notes.md`](docs/project-01-qa-notes.md) | Final manual QA pass for Project 1: build, sections, navigation, form cases, accessibility, responsive results and known limitations |
| [`project-01-agency-site/README.md`](project-01-agency-site/README.md) | Project 1 setup: prerequisites, install and run commands, structure, contact form rules |
| [`docs/project-02-requirements.md`](docs/project-02-requirements.md) | MERN Commerce requirements and architecture: roles, layers, MongoDB data model, relationships, indexes, REST API surface, cart and order rules, environment configuration |
| [`project-02-mern-commerce/README.md`](project-02-mern-commerce/README.md) | Project 2 in full: purpose, stack, architecture, configuration, endpoint overview, authentication, demo data and accounts, tests, builds and known limitations |
| [`project-02-mern-commerce/client/README.md`](project-02-mern-commerce/client/README.md) | Storefront client: scripts, structure, API layer, authentication, admin area, cart and catalogue URL state |
| [`docs/api-reference.md`](docs/api-reference.md) | Complete REST API reference: conventions, error codes, rate limits, every endpoint with its authorization, parameters, responses and errors - plus the endpoints that deliberately do not exist |
| [`docs/delivery-notes.md`](docs/delivery-notes.md) | Handover summary: architecture, security model, test suites, the step-by-step demonstration order and known limitations |
| [`docs/manual-test-checklist.md`](docs/manual-test-checklist.md) | Repeatable manual verification procedure: environment startup, API checklist, storefront, authentication, cart, checkout, orders, admin, responsive, accessibility, error handling and cleanup |

---

## Internship checkpoints

| Day | Date | Main scope |
|---|---|---|
| 01 | 10.08.2026. | Onboarding, development workflow and project plan |
| 02 | 11.08.2026. | MERN development environment and learning notes |
| 03 | 12.08.2026. | Agency site: planning, React scaffold, base layout |
| 04 | 13.08.2026. | Agency site: sections and responsive design |
| 05 | 14.08.2026. | Agency site: contact form, QA and review fixes |
| 06 | 17.08.2026. | Commerce: requirements, architecture, MongoDB data model |
| 07 | 18.08.2026. | Express server, MongoDB connection, product/category CRUD |
| 08 | 19.08.2026. | JWT authentication and role authorization |
| 09 | 20.08.2026. | React storefront foundation and API integration |
| 10 | 21.08.2026. | Search, filters, sorting and pagination |
| 11 | 24.08.2026. | React authentication, account state, protected routes |
| 12 | 25.08.2026. | Cart, checkout and user order history |
| 13 | 26.08.2026. | Admin dashboard and management UI |
| 14 | 27.08.2026. | Functional testing, security verification, bug fixing |
| 15 | 28.08.2026. | Final documentation, seed data and delivery verification |

Current progress is tracked with the checkboxes in [`CLAUDE.md`](CLAUDE.md), which is the single source of truth.

---

## Secrets policy

- Real `.env` files are never committed; only `.env.example` files with placeholder values.
- JWT secrets and database connection strings are supplied through the environment.
- Passwords are stored only as bcrypt hashes and are never returned by the API.

---

## Licence

See [`LICENSE`](LICENSE).
