# Day 01 - Onboarding, company workflow and project plan

- **Date:** 10.08.2026.
- **Company:** SMWEB, Zvornik
- **Internship period:** 10.08.2026. - 28.08.2026. (15 working days)
- **Goal of the day:** understand the working context, the development workflow and the tooling, and write down a concrete implementation roadmap. No application code is written on Day 01.

---

## 1. Purpose of the internship

The internship covers the practical development of a modern web application using the **MERN** stack (MongoDB, Express.js, React, Node.js). The work is organized as two projects of increasing complexity:

1. a smaller frontend-only React project, used to establish component structure, responsive design and delivery quality;
2. a complete MERN application (REST API + database + React client + authentication + testing), which demonstrates the full development cycle.

The intended outcome is not only working code, but a repository another developer can clone, configure and run from the documentation alone.

---

## 2. Company context (as supplied during onboarding)

The following information was supplied by the company and is used as project context. Nothing beyond this list is assumed or invented.

- Software/web development company based in Zvornik.
- Founded in 2021.
- Approximately three active teams.
- Approximately 8-10 collaborators/employees.
- More than 30 delivered/active projects.
- Works with outsourcing and international clients.
- Delivers both web and mobile applications.
- Representative project categories: a trucking/transport assistant, a specialized e-commerce solution, and a Next.js/API integration project.

Client names, contract values, revenue figures and testimonials were **not** supplied and must not appear anywhere in the projects.

---

## 3. Software development lifecycle reviewed on Day 01

The workflow reviewed during onboarding follows six phases. Each phase has a defined input and a defined exit condition, which is why the internship plan is organized the same way.

### 3.1 Requirements

- Collect what the product must do and for whom (roles, use cases, constraints).
- Separate **must have** from **nice to have**, and write down explicit non-goals.
- Exit condition: a written requirements document that can be reviewed, not an idea discussed verbally.

### 3.2 Planning

- Translate requirements into an architecture: folder structure, data model, API contract, UI routes.
- Break the work into day-sized units with acceptance criteria.
- Exit condition: it is clear what will be built, in which order, and how each unit will be verified.

### 3.3 Implementation

- Write code against the agreed contract; do not change the data model or API silently.
- Keep the change set small and reviewable; commit at logical checkpoints.
- Exit condition: the feature runs locally and matches the documented contract.

### 3.4 Testing

- Manual functional testing of user flows (browser + API client).
- Automated tests for critical business and security paths (authentication, authorization, order totals, ownership rules).
- Exit condition: the critical paths pass and failures are fixed rather than silenced.

### 3.5 Review

- Code review against conventions and requirements: naming, structure, error handling, validation, security.
- Mentor feedback is treated as a work item, not as an optional suggestion.
- Exit condition: findings are either fixed or explicitly recorded as a known limitation.

### 3.6 Delivery / iteration

- Reproducible setup: `README.md`, `.env.example`, install/run/seed/test/build commands verified from a clean state.
- Demo path rehearsed end to end.
- Exit condition: someone else can run and demonstrate the project without help.

### 3.7 Mapping to the 15 internship days

| Phase | Days |
|---|---|
| Requirements | 01, 03 (Project 1), 06 (Project 2) |
| Planning | 01, 02, 06 |
| Implementation | 03-05 (Project 1), 07-13 (Project 2) |
| Testing | 05, 14 |
| Review | 05, 14 |
| Delivery | 05, 15 |

---

## 4. Project scopes (high level)

### 4.1 Project 1 - SMWEB agency website (Days 03-05)

- Frontend only: React + Vite + CSS3, no backend and no database.
- One responsive marketing page with sections: header/navigation, hero, services, selected work, process, technology overview, about/metrics, contact form, footer.
- Content comes from the supplied company context; portfolio entries are described neutrally by category.
- Contact form performs client-side validation (required fields, valid email) and shows a demo success state; it does not send data anywhere.
- Quality bar: usable at 320px without horizontal scrolling, one `h1` per page, labelled inputs, visible focus states, no leftover Vite starter content and no placeholder text.

### 4.2 Project 2 - MERN Commerce (Days 06-15)

A scoped but complete e-commerce application.

- **Database (MongoDB + Mongoose):** `User`, `Category`, `Product`, `Order` models with validation, unique indexes and order line snapshots.
- **Backend (Node.js + Express):** REST API under `/api` with a consistent success/error envelope, centralized error handling, request validation, security headers and rate limiting.
- **Authentication:** JWT issued on login and stored in an `HttpOnly` cookie; `authenticate` and `authorize('admin')` middleware; passwords hashed with bcryptjs and never returned by the API.
- **Frontend (React + Vite + React Router + Axios):** storefront (home, catalog with search/filter/sort/pagination, product details), cart, checkout, order history, account pages, and a protected admin area for products, categories and orders.
- **Cart:** client-side React context persisted to `localStorage`; there is no cart collection in MongoDB.
- **Order totals:** the client sends only product IDs and quantities; the server re-reads the products and recomputes unit prices, line totals, subtotal, shipping and total.
- **Explicit non-goals:** real card payments, real shipping integrations, image upload services, coupons, multi-vendor, multi-currency, localization framework, social login, Docker.

---

## 5. Fixed technical objective - the MERN stack

The internship confirmation fixes the stack. It is not substituted during the 15 days.

| Letter | Technology | Role in the projects |
|---|---|---|
| **M** | MongoDB | Document database. Collections of JSON-like documents (users, categories, products, orders) accessed through the Mongoose ODM, which adds schemas, validation and indexes. |
| **E** | Express.js | HTTP layer on top of Node.js. Defines routes and middleware, parses requests, applies authentication/authorization and returns JSON responses. |
| **R** | React | Client user interface built from functional components with hooks; React Router for routing and React Context for authentication and cart state. |
| **N** | Node.js | JavaScript runtime executing the server code, plus the npm ecosystem and tooling used by both projects. |

Request flow for Project 2:

```text
React component
  -> centralized Axios client (withCredentials: true)
  -> Express route
  -> validation middleware
  -> authenticate / authorize middleware
  -> controller
  -> service
  -> Mongoose model
  -> MongoDB
```

The response travels back along the same path and is rendered with explicit loading, empty and error states.

Supporting libraries (`dotenv`, `cors`, `cookie-parser`, `jsonwebtoken`, `bcryptjs`, `helmet`, `express-rate-limit`, `express-validator`, `axios`, `react-router-dom`) are allowed, but the core architecture stays MongoDB + Express + React + Node.js. TypeScript, Next.js, NestJS, Redux, GraphQL, Prisma, SQL databases, Firebase/Supabase and Docker are out of scope.

---

## 6. Tools and workflow

| Tool | Use during the internship |
|---|---|
| **VS Code** | Main editor: integrated terminal, file navigation, extensions for linting/formatting, split view for API and client code. |
| **Git** | Version control. One repository, work on `main`, one logical commit per internship day using the messages defined in `CLAUDE.md`. History is never rewritten and commit dates are never faked. |
| **npm** | Dependency management and scripts (`npm install`, `npm run dev`, `npm test`, `npm run build`). Each project keeps its own `package.json`; the lock file is committed. |
| **MongoDB Compass** | Visual inspection of the local database: confirming documents match the Mongoose schemas, checking indexes, verifying seeded data and created orders. |
| **Postman** | Manual REST API testing: request collections per endpoint group, cookie-based session testing for the JWT flow, and reproducing authorization cases (401/403/404/409). |
| **Browser dev tools** | Console for React errors, Network tab for API requests/responses and cookies, Application tab for `localStorage` cart state, responsive mode for the 320/375/768/1024/1440px checks. |

### Working rules agreed on Day 01

- Work on exactly one internship day at a time; do not pre-implement later days.
- A checklist item is marked done only after the described verification actually passes.
- Real errors are fixed at the source; tests are not weakened, skipped or deleted to make output green.
- Anything left unfinished is written down as a known limitation instead of being hidden.

---

## 7. Repository and secrets policy

Planned layout (created progressively, day by day):

```text
.
├── CLAUDE.md                     # authoritative specification and progress tracker
├── README.md                     # internship purpose, scope, structure, setup
├── .gitignore
├── docs/                         # onboarding notes, requirements, API reference, test checklist
├── project-01-agency-site/       # Day 03-05, React + Vite
└── project-02-mern-commerce/     # Day 06-15, server/ (Express + MongoDB) and client/ (React)
```

Secrets policy:

- `.env` files are ignored by Git; only `.env.example` files with placeholder values are committed.
- The JWT secret and the MongoDB connection string are supplied through the environment; the server must fail to start with a clear message when required configuration is missing.
- Passwords are stored only as bcrypt hashes, never in plaintext, and password hashes are never returned by the API.
- Plaintext passwords and JWT secrets are never written to logs.

State on Day 01: the repository contains documentation, the licence and the ignore rules only. There are no dependencies, credentials, connection strings or tokens in the repository.

---

## 8. Result of Day 01

Done today:

- repository documentation structure created (`README.md`, `docs/`, `.gitignore`);
- development lifecycle, project scopes, MERN objective and tooling documented;
- working rules and secrets policy agreed and written down.

Deliberately **not** done today (belongs to later days):

- no React scaffolding (Day 03), no Express server (Day 07), no Mongoose models (Day 06), no dependencies installed.

Next: Day 02 - prepare and verify the local development environment (Node.js, npm, Git, MongoDB, Postman) and write the MERN learning notes in `docs/day-02-mern-notes.md`.
