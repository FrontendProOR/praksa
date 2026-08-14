# Project 1 - final manual QA notes

- **Date:** 14.08.2026. (Day 05)
- **Build under test:** `project-01-agency-site` after the contact form was added
- **Environment:** Windows 11, Node 24.14.1, npm 11.11.0, Microsoft Edge 152, Vite 8.2.2 dev server and production build
- **Widths tested:** 320, 375, 768, 1024, 1440px
- **Result:** all checks below passed. Three defects were found during the pass and fixed; they are listed in section 7.

---

## 1. Build and tooling

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | pass, no findings |
| Production build | `npm run build` | pass, 22.27 kB CSS / 212.86 kB JS (4.70 / 66.29 kB gzip) |
| Development server | `npm run dev` | pass, page renders |
| Clean install from a fresh copy | `npm ci` -> `npm run lint` -> `npm run build` -> `npm run dev` | pass; the copy contained no `node_modules` or `dist`, and the full form suite passed against it |

## 2. Sections

| Section | Checked | Result |
|---|---|---|
| Header | wordmark, six links, sticky behaviour, scrolled state, mobile menu open/close | pass |
| Hero | `h1`, lead, both CTAs, decorative composition hidden from assistive tech | pass |
| Services | four service cards, grid 1 / 2 / 4 columns | pass |
| Selected work | three portfolio categories, tags, no client names or metrics | pass |
| Process | five steps as an ordered list, vertical then horizontal connector | pass |
| Technology | four capability groups, note that this site is React-only | pass |
| About / metrics | four supplied figures with their source stated | pass |
| Contact | heading, checklist, location panel, form | pass |
| Footer | company summary, six links, dynamic year, demo note | pass |

## 3. Navigation

- all six header links resolve to a real section;
- all six footer links resolve;
- both hero CTAs resolve (`#kontakt`, `#projekti`);
- clicking a link scrolls the target clear of the sticky header (measured: section top 92px against a 77px header);
- no unresolved anchors, no broken assets, no failed requests.

## 4. Contact form

| Case | Expected | Result |
|---|---|---|
| Empty submit | blocked, all four fields flagged, focus on first invalid field | pass |
| Malformed email (`marko@invalid`) | blocked, only the email field flagged | pass |
| Values after a failed submit | everything typed is preserved | pass |
| Correcting a flagged field | error clears as soon as the value becomes valid | pass |
| Name 1 character | rejected (minimum 2) | pass |
| Name 3 characters | accepted | pass |
| Name over 80 characters | capped by `maxlength` at 80 | pass |
| Whitespace-only name | rejected (input is trimmed) | pass |
| Message under 20 characters | rejected | pass |
| Message over 20 characters | accepted | pass |
| Valid submit | button disabled, `aria-busy`, then confirmation | pass |
| Second click during submit | ignored, no duplicate submission | pass |
| Confirmation text | states plainly that nothing was sent or stored | pass |
| "Pošalji novu poruku" | returns an empty form, focus on the first field | pass |
| Network traffic during the whole flow | no xhr/fetch/websocket request at any point | pass |

## 5. Accessibility

- exactly one `h1`; heading order `h1 h2 h3...` with no skipped level;
- every section is named by its heading through `aria-labelledby`;
- `header`, `main` and `footer` landmarks present; both navigations labelled;
- skip link present and its target exists;
- all four form controls have a real `<label>`; errors are text plus a marker, never colour alone;
- `aria-invalid` is set only on fields in error, and `aria-describedby` links help text and error text (verified that every referenced id resolves);
- the confirmation is `role="status"` and receives focus;
- keyboard-only completion of the whole form succeeds: Tab reaches every control, the select is changed with arrow keys, Enter submits, and every stop shows a focus ring;
- on mobile the menu is opened from the keyboard and the collapsed menu is `display:none`, so it is not a hidden tab stop;
- decorative graphics (hero composition, project previews, service numbers, process markers, success tick) are `aria-hidden`.

## 6. Responsive, motion and console

- no horizontal overflow at any tested width, with and without the form;
- all form controls stay inside the viewport and are at least 44px tall (measured 49-52px, textarea 154px);
- cards reflow rather than clipping; no card has clipped content at any width;
- `prefers-reduced-motion: reduce` disables transitions (`1e-05s`) and smooth scrolling (`scroll-behavior: auto`);
- browser console: no errors and no warnings during the full happy path and the error paths;
- no lorem ipsum or leftover placeholder copy anywhere on the page.

## 7. Defects found and fixed during QA

1. **Contact panel stretched to the full row height**, leaving a large empty box (a `height: 100%` on the shared card primitive that grid items do not need). Removed; equal-height card grids still line up, and the standalone panel now sizes to its content.
2. **Metric cards packed their content to the bottom** of the box because the column is reversed. Fixed with `justify-content: flex-end`, which is the visual top in a reversed column.
3. **The message field's error appeared below the character counter.** Reordered with CSS so the error sits directly under its control while the counter stays last; the counter is decorative and the error association is unaffected.

Additionally, the Hero section was given an `aria-labelledby` so that all seven sections are named consistently.

## 8. Known limitations

- The contact form is a frontend demo: submissions are not transmitted, stored or queued anywhere. This is stated in the UI, in the project README and here.
- No contact email address is shown, because none was supplied by the company.
- The site is a single page; there is no routing and no additional pages.
- Automated verification was carried out with a headless browser driving the real pages; there is no unit test suite in this project, which is intentional for the three-day scope.
