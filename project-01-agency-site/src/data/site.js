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

export const SERVICES = {
  eyebrow: "Usluge",
  title: "Šta radimo",
  description:
    "Pokrivamo cijeli razvojni ciklus - od korisničkog interfejsa i serverske " +
    "logike do održavanja rješenja koja su već u upotrebi.",
  items: [
    {
      id: "web",
      title: "Web aplikacije",
      description:
        "Razvoj web aplikacija u React-u: korisnički interfejs, rad sa " +
        "podacima iz API-ja i struktura koda koju tim može dugoročno održavati.",
    },
    {
      id: "backend",
      title: "Backend i API razvoj",
      description:
        "Projektovanje REST API-ja, modelovanje podataka, autentifikacija i " +
        "poslovna logika na serverskoj strani.",
    },
    {
      id: "mobile",
      title: "Mobilne aplikacije",
      description:
        "Razvoj mobilnih aplikacija i njihovo povezivanje sa postojećim web " +
        "servisima i bazama podataka.",
    },
    {
      id: "maintenance",
      title: "Održavanje i integracije",
      description:
        "Nadogradnja postojećih rješenja, integracija eksternih servisa i " +
        "tehnička podrška nakon isporuke.",
    },
  ],
};

/**
 * Portfolio entries are described by category only. The company did not
 * supply client names or project metrics, so none are stated here.
 */
export const PROJECTS = {
  eyebrow: "Projekti",
  title: "Odabrani projekti",
  description:
    "Primjeri tipova rješenja na kojima radimo. Projekti su opisani po " +
    "kategoriji, bez podataka o klijentima.",
  items: [
    {
      id: "transport",
      category: "Transport i logistika",
      title: "Asistent za transportnu kompaniju",
      description:
        "Interna aplikacija koja objedinjuje praćenje vozila, naloga i " +
        "prateće dokumentacije u svakodnevnom radu transportne firme.",
      tags: ["Web aplikacija", "Interni alat", "Izvještaji"],
    },
    {
      id: "ecommerce",
      category: "E-trgovina",
      title: "Specijalizovano e-commerce rješenje",
      description:
        "Prodavnica prilagođena specifičnom asortimanu: katalog proizvoda, " +
        "filtriranje, korpa i administracija narudžbi.",
      tags: ["Katalog", "Korpa", "Administracija"],
    },
    {
      id: "integracije",
      category: "Integracije",
      title: "Next.js projekat sa API integracijama",
      description:
        "Web platforma izgrađena u Next.js-u koja podatke povlači iz više " +
        "eksternih servisa kroz zajednički API sloj.",
      tags: ["Next.js", "API", "Integracije"],
    },
  ],
};

export const PROCESS = {
  eyebrow: "Proces",
  title: "Kako radimo",
  description:
    "Isti redoslijed koraka na svakom projektu, bez obzira na veličinu. " +
    "Svaki korak ima jasan rezultat prije nego što pređemo na sljedeći.",
  steps: [
    {
      id: "discovery",
      title: "Analiza zahtjeva",
      description:
        "Razgovor o poslovnom problemu, korisnicima i ograničenjima. " +
        "Rezultat je pisana lista zahtjeva i lista onoga što nije u obimu.",
    },
    {
      id: "planning",
      title: "Planiranje",
      description:
        "Definisanje arhitekture, tehnologija, modela podataka i redoslijeda " +
        "isporuke po fazama.",
    },
    {
      id: "development",
      title: "Razvoj",
      description:
        "Implementacija u kratkim ciklusima, uz pregled koda i redovne demo " +
        "verzije na kojima se vidi napredak.",
    },
    {
      id: "testing",
      title: "Testiranje",
      description:
        "Funkcionalno testiranje, provjera ivičnih slučajeva i ispravke " +
        "grešaka prije isporuke.",
    },
    {
      id: "delivery",
      title: "Isporuka i iteracija",
      description:
        "Puštanje u rad, primopredaja dokumentacije i dalji razvoj na osnovu " +
        "povratnih informacija.",
    },
  ],
};

export const TECHNOLOGY = {
  eyebrow: "Tehnologije",
  title: "Tehnologije koje koristimo",
  description:
    "Izbor tehnologije zavisi od potreba projekta. Ovo su alati sa kojima " +
    "tim redovno radi.",
  groups: [
    { id: "frontend", label: "Frontend", items: ["React", "JavaScript", "HTML5", "CSS3"] },
    { id: "backend", label: "Backend", items: ["Node.js", "Express", "NestJS"] },
    { id: "baze", label: "Baze podataka", items: ["MongoDB", "PostgreSQL"] },
    { id: "alati", label: "Alati i infrastruktura", items: ["Git", "Docker", "AWS"] },
  ],
  note: "Ovaj sajt je izrađen u React-u, bez serverskog dijela.",
};

/**
 * Metrics are company-supplied figures, presented as such - they are not
 * calculated or verified independently.
 */
export const ABOUT = {
  eyebrow: "O nama",
  title: "Tim koji radi na dugoročnim rješenjima",
  paragraphs: [
    "SMWEB je razvojna firma osnovana 2021. godine u Zvorniku. Radimo u tri " +
      "aktivna tima na web i mobilnim aplikacijama, za klijente iz zemlje i " +
      "inostranstva, uključujući outsourcing saradnju.",
    "Projekte vodimo od analize zahtjeva do isporuke i održavanja, uz jasnu " +
      "komunikaciju o obimu, rokovima i tehničkim odlukama.",
  ],
  metrics: [
    { id: "osnovano", value: "2021.", label: "Godina osnivanja" },
    { id: "projekti", value: "30+", label: "Realizovanih i aktivnih projekata" },
    { id: "timovi", value: "3", label: "Aktivna tima" },
    { id: "saradnici", value: "8-10", label: "Saradnika u timovima" },
  ],
  metricsNote: "Navedeni podaci su informacije dobijene od kompanije.",
};

export const CONTACT = {
  eyebrow: "Kontakt",
  title: "Razgovarajmo o vašem projektu",
  description:
    "Opišite ukratko šta gradite i u kojoj ste fazi. Na osnovu toga " +
    "predlažemo obim posla, tehnologije i redoslijed isporuke.",
  checklistTitle: "Šta je korisno navesti",
  checklist: [
    "Kratak opis problema koji rješavate",
    "Fazu projekta: ideja, postojeće rješenje ili nadogradnja",
    "Okvirni rok i prioritete",
    "Način na koji vas možemo kontaktirati",
  ],
  location: {
    title: "Gdje se nalazimo",
    value: `${COMPANY.city}, Bosna i Hercegovina`,
    note: "Radimo sa klijentima iz zemlje i inostranstva.",
  },
};

export const FOOTER = {
  description:
    "SMWEB je razvojni tim iz Zvornika. Gradimo web i mobilne aplikacije, " +
    "backend servise i integracije za domaće i inostrane klijente.",
  navTitle: "Navigacija",
  demoNote:
    "Demo sajt izrađen u okviru stručne prakse. Sadržaj je informativan.",
};
