# Project 1 - SMWEB agency website: requirements

- **Project folder:** `project-01-agency-site/`
- **Internship days:** 03 (12.08.2026.), 04 (13.08.2026.), 05 (14.08.2026.)
- **Source of truth:** Section 4 of `CLAUDE.md`. This document restates those requirements in implementable form; it does not add scope.

---

## 1. Purpose

A small React project that demonstrates professional frontend structure, responsive design and client-ready presentation. It is the introductory project before the full MERN application and deliberately has **no backend, no database and no authentication**.

## 2. Product concept

A polished corporate/agency landing website for a small software agency. The content may reference the company context supplied during onboarding and nothing beyond it.

Supplied context that may be used:

- web/software development;
- approximately three active teams;
- approximately 8-10 collaborators/employees;
- more than 30 delivered/active projects;
- outsourcing and international clients;
- work on web and mobile applications;
- representative portfolio categories: trucking/transport assistant, specialized e-commerce solution, Next.js/API integration project;
- founded 2021.

**Forbidden content:** invented client names, revenue figures, customer testimonials, confidential details, and placeholder text such as lorem ipsum.

## 3. Technology

| Area | Choice |
|---|---|
| Language | JavaScript (ES Modules) |
| UI library | React 19 |
| Build tool | Vite 8 |
| Styling | Plain CSS3, organized as design tokens + base layer + one stylesheet per component |
| Package manager | npm |
| Linting | oxlint (from the official Vite scaffold) |

No backend, no router library (the site is a single page with in-page anchors), no UI framework, no CSS framework and no external font or image service. `react-icons` is permitted by the specification but is not used - the few decorative marks are drawn with CSS.

## 4. Required sections

| # | Section | Requirements | Day |
|---|---|---|---|
| 1 | Header / navigation | company wordmark, links Home / Services / Work / Process / About / Contact, mobile menu, sticky behaviour (preferred) | 03 |
| 2 | Hero | concise agency positioning, primary CTA "Razgovarajmo o projektu", secondary CTA "Pogledaj projekte", visual composition built from CSS/layout rather than an external image | 03 |
| 3 | Services | web applications, backend/API development, mobile applications, maintenance/integrations | 04 |
| 4 | Selected work | trucking company assistant, specialized e-commerce solution, Next.js/API integration project - short neutral descriptions, no confidential metrics | 04 |
| 5 | Process | discovery, planning, development, testing, delivery/iteration | 04 |
| 6 | Technology overview | React, Node.js, Express/NestJS as company capability, MongoDB/PostgreSQL, optionally Git/Docker/AWS as capability. Project 1 itself stays React-only | 04 |
| 7 | About / metrics | founded 2021, 30+ projects, 3 active teams, 8-10 team members - phrased as supplied company information, not as independently computed statistics | 04 |
| 8 | Contact form | name, email, project type, message; required-field validation; email-format validation; demo success state with no real backend call | 05 |
| 9 | Footer | short company description, navigation links, contact email if supplied, dynamic copyright year | 04 |

Navigation labels are rendered in Serbian (Latin script), matching the CTA wording fixed by the specification: Početna, Usluge, Projekti, Proces, O nama, Kontakt.

## 5. Responsive behaviour

| Range | Rule |
|---|---|
| Mobile `<= 640px` | single column, menu collapsed behind a button |
| Tablet `641px - 1024px` | single column content, menu still collapsed |
| Desktop `>= 1025px` | two-column hero, navigation inline in the header |

- No horizontal page scroll at 320px viewport width.
- Navigation must stay usable on touch devices (minimum ~44px touch targets).
- Cards must reflow rather than becoming unreadably narrow.
- Verified widths: 320, 375, 768, 1024, 1440px.

## 6. Accessibility and quality bar

- exactly one `h1` per page and a logical heading hierarchy with no skipped levels;
- every form input has an associated `<label>`, and errors are announced next to the field (Day 05);
- focus indicators are always visible and are never removed;
- link and button purpose is understandable from the text alone;
- sufficient text/background contrast;
- decorative graphics are marked `aria-hidden` so they produce no screen-reader noise;
- landmarks: `header`, `nav` (labelled), `main`, `footer`;
- a skip link to the main content;
- `prefers-reduced-motion` is respected.

## 7. Out of scope

No backend, database, API calls, authentication, routing library, CMS, analytics, cookie banner, animation library, or real form submission. The contact form's success state is a local demo state only.

## 8. Implementation status

### Day 03 - delivered

- Vite + React scaffold with the default demo content removed;
- design tokens (`src/styles/tokens.css`): colour, typography scale, spacing scale, container width, radii, shadows, motion, breakpoint documentation;
- base layer (`src/styles/base.css`): reset, element defaults, focus ring, skip link, container/section utilities, button variants, `prefers-reduced-motion` handling;
- semantic page shell (`src/App.jsx`): skip link, `header`, `main`;
- `Header` component: wordmark, desktop navigation, sticky behaviour with a scrolled state, and a disclosure-pattern mobile menu (`aria-expanded` + `aria-controls`, Escape closes and restores focus, outside click closes, menu state cleared when the viewport reaches desktop);
- `Hero` component: eyebrow, `h1` positioning statement, lead paragraph, both required CTAs, and a decorative CSS-only composition;
- site content as structured data (`src/data/site.js`): company facts, navigation links, hero copy.

### Day 04 - planned

Sections 3-7 and 9 from the table above, the shared `SectionHeading` component (its duplication first appears with those sections), and the full responsive pass over section content.

### Day 05 - planned

Contact form with validation and demo success state, keyboard-only QA pass, console-warning cleanup, project README and final manual QA notes.

### Known state between days

The header navigation links to `#usluge`, `#projekti`, `#proces`, `#o-nama` and `#kontakt` are already present because the specification fixes the header's link list. Their target sections are added on Days 04 and 05; until then only `#pocetna` resolves. Day 04 explicitly requires that all navigation links reach their intended sections.
