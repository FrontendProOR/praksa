import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Container from "./Container.jsx";
import { useAuth } from "../context/auth-context.js";
import { useCart } from "../context/cart-context.js";
import "../styles/header.css";

/**
 * Storefront header: wordmark, public navigation and the account area.
 *
 * The account area reflects the session the server confirmed: guests see
 * sign-in links, a signed-in user sees their account and a sign-out button,
 * and an admin additionally sees the admin link. Nothing is shown until the
 * startup `/auth/me` has settled, so an authenticated header never flashes for
 * a guest (or the other way round).
 *
 * The admin link is a convenience only. Hiding it is not what protects the
 * admin area - the API authorises every admin request itself.
 *
 * The mobile menu is a disclosure: one <nav> in the DOM, shown inline on
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
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, authReady, user, logout } = useAuth();
  const { itemCount } = useCart();

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

  const handleLogout = async () => {
    closeMenu();
    // Leave the current page first. Clearing the session while still on a
    // protected route would let that route's guard redirect to the login page,
    // racing this navigation and landing the user somewhere unpredictable.
    navigate("/", { replace: true });
    await logout();
  };

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

            {authReady && isAdmin ? (
              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `site-nav__link${isActive ? " site-nav__link--active" : ""}`
                  }
                  onClick={closeMenu}
                >
                  Administracija
                </NavLink>
              </li>
            ) : null}
          </ul>

          <div className="site-nav__account">
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `site-nav__link site-nav__cart${isActive ? " site-nav__link--active" : ""}`
              }
              onClick={closeMenu}
            >
              Korpa
              {itemCount > 0 ? (
                <span className="site-nav__badge">
                  {itemCount}
                  <span className="visually-hidden"> artikala u korpi</span>
                </span>
              ) : (
                <span className="visually-hidden"> (prazna)</span>
              )}
            </NavLink>
          </div>

          {/* Rendered only once the session is known, to avoid a flash. */}
          {authReady ? (
            <div className="site-nav__account">
              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/orders"
                    className={({ isActive }) =>
                      `site-nav__link${isActive ? " site-nav__link--active" : ""}`
                    }
                    onClick={closeMenu}
                  >
                    Narudžbe
                  </NavLink>
                  <NavLink
                    to="/account"
                    className={({ isActive }) =>
                      `site-nav__link${isActive ? " site-nav__link--active" : ""}`
                    }
                    onClick={closeMenu}
                  >
                    Moj nalog
                    <span className="visually-hidden"> ({user.email})</span>
                  </NavLink>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={handleLogout}>
                    Odjava
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      `site-nav__link${isActive ? " site-nav__link--active" : ""}`
                    }
                    onClick={closeMenu}
                  >
                    Prijava
                  </NavLink>
                  <Link className="btn btn--primary btn--sm" to="/register" onClick={closeMenu}>
                    Registracija
                  </Link>
                </>
              )}
            </div>
          ) : null}
        </nav>
      </Container>
    </header>
  );
}

export default Header;
