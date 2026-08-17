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

The structure is created progressively - each project folder appears on the day its work starts.

```text
.
├── CLAUDE.md                     # authoritative specification and day-by-day progress tracker
├── README.md
├── .gitignore
├── docs/
│   ├── day-01-onboarding.md      # Day 01 - workflow, scopes, MERN objective, tooling
│   ├── day-02-mern-notes.md      # Day 02
│   ├── project-01-requirements.md
│   ├── project-02-requirements.md
│   ├── api-reference.md
│   └── manual-test-checklist.md
├── project-01-agency-site/       # Days 03-05 - React + Vite
└── project-02-mern-commerce/     # Days 06-15
    ├── server/                   # Express + MongoDB REST API
    └── client/                   # React storefront and admin area
```

---

## Setup

Each project has its own `package.json` and its own `README.md` with the full command list.

**Project 1 - agency website** (complete):

```bash
cd project-01-agency-site
npm install
npm run dev      # development server
npm run build    # production build
npm run lint     # oxlint
```

**Project 2 - MERN commerce** is created on Day 06 and will document its own install, environment, seed, run, test and build commands.

Prerequisites for the whole repository:

- Node.js LTS and npm
- Git
- MongoDB running locally (or a documented connection string), with MongoDB Compass for inspection
- Postman or an equivalent HTTP client for manual API testing

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
| [`project-02-mern-commerce/README.md`](project-02-mern-commerce/README.md) | Project 2 overview, current status and model verification command |

Further documents (API reference, manual test checklist) are added on their scheduled days.

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
