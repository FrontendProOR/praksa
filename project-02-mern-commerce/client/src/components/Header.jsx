import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Container from "./Container.jsx";
import "../styles/header.css";

/**
 * Storefront header: wordmark and the public navigation.
 *
 * Only the routes that exist today are linked. Account, cart and admin entries
 * are added on the days that implement those areas, so the header never links
 * to a page that is not there.
 *
 * The mobile menu is a disclosure: one <nav> in the DOM, revealed inline on
 * desktop and as a panel below the header on smaller screens.
 */
const NAV_LINKS = [
  { to: "/", label: "Početna", end: true },
  { to: "/products", label: "Katalog" },
];

const MOBILE_NAV_ID = "glavna-navigacija";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleRef = useRef(null);

  // Closed by the click that navigates, rather than by watching the location:
  // the panel only contains links, so the click is the event that should
  // close it.
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setIsMenuOpen(false);
      toggleRef.current?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  return (
    <header className="site-header">
      <Container className="site-header__inner">
        <Link className="wordmark" to="/" onClick={closeMenu}>
          SMWEB<span className="wordmark__accent" aria-hidden="true">Lab</span>
          <span className="visually-hidden"> Lab - prodavnica laboratorijske opreme</span>
        </Link>

        <button
          ref={toggleRef}
          type="button"
          className="nav-toggle"
          aria-expanded={isMenuOpen}
          aria-controls={MOBILE_NAV_ID}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? "Zatvori" : "Meni"}
          <span className="nav-toggle__icon" aria-hidden="true">
            <span />
            <span />
            <span />
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
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `site-nav__link${isActive ? " site-nav__link--active" : ""}`
                  }
                  onClick={closeMenu}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}

export default Header;
