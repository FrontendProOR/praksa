import { useEffect, useRef, useState } from "react";
import { COMPANY, NAV_LINKS } from "../data/site.js";
import "../styles/header.css";

const MOBILE_NAV_ID = "glavna-navigacija";
const DESKTOP_QUERY = "(min-width: 1025px)";

/**
 * Sticky site header: wordmark, desktop navigation and a disclosure-pattern
 * mobile menu. The menu is a single <nav> that CSS reveals inline on desktop
 * and as a panel on smaller screens, so there is one navigation in the DOM.
 */
function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const toggleRef = useRef(null);
  const headerRef = useRef(null);

  // Solid background and shadow once the page is scrolled away from the top.
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Escape closes the menu and returns focus to the button that opened it.
  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setIsMenuOpen(false);
      toggleRef.current?.focus();
    };

    const handlePointerDown = (event) => {
      if (headerRef.current?.contains(event.target)) return;
      setIsMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMenuOpen]);

  // The toggle button does not exist on desktop, so drop the open state when
  // the viewport grows past the breakpoint.
  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const handleChange = (event) => {
      if (event.matches) setIsMenuOpen(false);
    };

    desktop.addEventListener("change", handleChange);
    return () => desktop.removeEventListener("change", handleChange);
  }, []);

  return (
    <header
      ref={headerRef}
      className="site-header"
      data-scrolled={isScrolled ? "true" : "false"}
    >
      <div className="container site-header__inner">
        <a className="wordmark" href="#pocetna">
          {COMPANY.name}
          <span className="wordmark__accent" aria-hidden="true">
            {COMPANY.wordmarkAccent}
          </span>
          <span className="visually-hidden">
            - {COMPANY.tagline}, {COMPANY.city}
          </span>
        </a>

        <button
          ref={toggleRef}
          type="button"
          className="nav-toggle"
          aria-expanded={isMenuOpen}
          aria-controls={MOBILE_NAV_ID}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="nav-toggle__label">
            {isMenuOpen ? "Zatvori meni" : "Meni"}
          </span>
          <span className="nav-toggle__icon" aria-hidden="true">
            <span className="nav-toggle__bar" />
            <span className="nav-toggle__bar" />
            <span className="nav-toggle__bar" />
          </span>
        </button>

        <nav
          id={MOBILE_NAV_ID}
          className="site-nav"
          data-open={isMenuOpen ? "true" : "false"}
          aria-label="Glavna navigacija"
        >
          <ul className="site-nav__list">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  className="site-nav__link"
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
