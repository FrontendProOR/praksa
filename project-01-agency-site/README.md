# SMWEB agency website (Project 1)

A responsive one-page presentation website for the software agency SMWEB (Zvornik), built with React and Vite as the introductory project of the 2026 internship.

**This project is frontend only.** There is no backend, no database and no API. The contact form validates input in the browser and shows a demo confirmation; nothing is sent anywhere and nothing is stored.

---

## Technology

| Area | Choice |
|---|---|
| Language | JavaScript (ES Modules) |
| UI | React 19 |
| Build tool | Vite 8 |
| Styling | Plain CSS3: design tokens + base layer + one stylesheet per component |
| Linting | oxlint |

No CSS framework, no UI kit, no icon package, no router - the site is a single page with in-page anchors. Runtime dependencies are `react` and `react-dom` only.

## Prerequisites

- Node.js 20.19+ or 22.12+ (developed and verified on Node 24.14.1)
- npm (verified on npm 11.11.0)

## Getting started

```bash
cd project-01-agency-site
npm install
npm run dev
```

Vite prints the local address (`http://localhost:5173/` by default). Open it in a browser.

> On this machine Vite binds to IPv6 `localhost`. If a tool cannot reach `127.0.0.1`, use `localhost` instead, or start the server with `npm run dev -- --host 127.0.0.1`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the development server with hot module replacement |
| `npm run build` | Produces the production build in `dist/` |
| `npm run preview` | Serves the built `dist/` output locally |
| `npm run lint` | Runs oxlint over the source |

## Project structure

```text
project-01-agency-site/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── App.jsx                 # page shell: skip link, header, sections, footer
    ├── main.jsx                # entry point, imports the global stylesheets
    ├── components/             # Header, Hero, Services, SelectedWork, Process,
    │                           # Technology, About, Contact, ContactForm,
    │                           # SectionHeading, Footer
    ├── data/
    │   └── site.js             # all site copy and content as structured data
    └── styles/
        ├── tokens.css          # design tokens (colour, type, spacing, radii, motion)
        ├── base.css            # reset, element defaults, utilities, buttons, cards
        └── *.css               # one stylesheet per component
```

## Content

Every string shown on the site lives in [`src/data/site.js`](src/data/site.js) - navigation labels, section copy, company figures and form messages. Components contain no hardcoded marketing text.

Company information (founded 2021, 30+ projects, three teams, 8-10 collaborators, Zvornik, outsourcing and international clients) is limited to what the company supplied during onboarding, and the About section states that source explicitly. The site contains no client names, revenue figures or testimonials.

## Contact form

Client-side only. Fields: name, email, project type, message.

| Field | Rules |
|---|---|
| Ime i prezime | required, trimmed, 2-80 characters |
| Email adresa | required, trimmed, `something@domain.tld`, max 120 characters |
| Tip projekta | required, must be one of the offered options |
| Poruka | required, trimmed, 20-1000 characters |

Behaviour:

- validation runs on blur, on submit, and again as an invalid field is corrected;
- an invalid submit is blocked, marks the fields with `aria-invalid`, shows a message linked by `aria-describedby`, keeps everything already typed, and moves focus to the first field that needs attention;
- a valid submit disables the button, shows a short simulated delay, and replaces the form with a confirmation stating plainly that the message was **not** sent or stored;
- the confirmation receives focus and is a live region; "Pošalji novu poruku" returns to an empty form.

## Accessibility

- one `h1`, logical heading order, `header`/`main`/`footer` landmarks and labelled navigations;
- skip link to the main content;
- every form control has a real `<label>`; errors are text, never colour alone;
- focus is always visible; the whole page and form are operable by keyboard;
- decorative graphics are `aria-hidden`;
- `prefers-reduced-motion` disables transitions and smooth scrolling.

## Responsive behaviour

Mobile `<= 640px`, tablet `641-1024px`, desktop `>= 1025px`. Verified at 320, 375, 768, 1024 and 1440px with no horizontal overflow.

## Out of scope

No backend, database, API, authentication, routing library, CMS, analytics or real form submission. Those belong to Project 2 (`project-02-mern-commerce`).

## Related documents

- [`../docs/project-01-requirements.md`](../docs/project-01-requirements.md) - requirements and per-day implementation status
- [`../docs/project-01-qa-notes.md`](../docs/project-01-qa-notes.md) - final manual QA pass
