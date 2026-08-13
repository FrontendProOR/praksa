import { COMPANY, FOOTER, NAV_LINKS } from "../data/site.js";
import "../styles/footer.css";

/** Site footer: company summary, navigation and dynamic copyright year. */
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <p className="site-footer__wordmark">
            {COMPANY.name}
            <span className="wordmark__accent" aria-hidden="true">
              {COMPANY.wordmarkAccent}
            </span>
          </p>
          <p className="site-footer__description">{FOOTER.description}</p>
        </div>

        <nav className="site-footer__nav" aria-label="Navigacija u podnožju">
          <h2 className="site-footer__nav-title">{FOOTER.navTitle}</h2>
          <ul className="site-footer__nav-list">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a className="site-footer__link" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="container site-footer__bottom">
        <p className="site-footer__copyright">
          &copy; {currentYear} {COMPANY.name}, {COMPANY.city}. Sva prava
          zadržana.
        </p>
        <p className="site-footer__note">{FOOTER.demoNote}</p>
      </div>
    </footer>
  );
}

export default Footer;
