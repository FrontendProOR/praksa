/**
 * Site content as structured data.
 *
 * Components read their text from here instead of hardcoding repeated strings,
 * so navigation labels, anchors and company facts are defined exactly once.
 * All company information below is limited to what was supplied during
 * onboarding - no client names, revenue figures or testimonials.
 */

export const COMPANY = {
  name: "SMWEB",
  wordmarkAccent: ".",
  city: "Zvornik",
  /** Genitive form, used inside sentences ("iz Zvornika"). */
  cityGenitive: "Zvornika",
  foundedYear: 2021,
  tagline: "Razvoj web i mobilnih aplikacija",
};

/**
 * Primary navigation. `href` values are the in-page section anchors; the
 * sections themselves are added section by section as the site grows.
 */
export const NAV_LINKS = [
  { id: "pocetna", label: "Početna", href: "#pocetna" },
  { id: "usluge", label: "Usluge", href: "#usluge" },
  { id: "projekti", label: "Projekti", href: "#projekti" },
  { id: "proces", label: "Proces", href: "#proces" },
  { id: "o-nama", label: "O nama", href: "#o-nama" },
  { id: "kontakt", label: "Kontakt", href: "#kontakt" },
];

export const HERO = {
  eyebrow: `Razvojni tim iz ${COMPANY.cityGenitive}`,
  title: "Web i mobilne aplikacije koje rješavaju stvarne poslovne potrebe",
  lead:
    "SMWEB je razvojni tim koji radi sa domaćim i inostranim klijentima. " +
    "Gradimo web aplikacije, backend servise i mobilna rješenja - od prve " +
    "analize zahtjeva do isporuke, održavanja i daljeg razvoja.",
  primaryCta: { label: "Razgovarajmo o projektu", href: "#kontakt" },
  secondaryCta: { label: "Pogledaj projekte", href: "#projekti" },
};
