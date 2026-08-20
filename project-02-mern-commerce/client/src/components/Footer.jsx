import { Link } from "react-router-dom";
import Container from "./Container.jsx";
import "../styles/footer.css";

/** Storefront footer: short description, public links and a demo notice. */
function Footer() {
  return (
    <footer className="site-footer">
      <Container className="site-footer__inner">
        <div className="site-footer__brand">
          <p className="site-footer__wordmark">
            SMWEB<span aria-hidden="true">Lab</span>
          </p>
          <p className="site-footer__description">
            Demo prodavnica laboratorijske opreme, izrađena u okviru stručne prakse.
            Podaci o proizvodima su izmišljeni i služe za prikaz aplikacije.
          </p>
        </div>

        <nav className="site-footer__nav" aria-label="Navigacija u podnožju">
          <h2 className="site-footer__nav-title">Navigacija</h2>
          <ul>
            <li>
              <Link className="site-footer__link" to="/">
                Početna
              </Link>
            </li>
            <li>
              <Link className="site-footer__link" to="/products">
                Katalog
              </Link>
            </li>
          </ul>
        </nav>
      </Container>

      <Container className="site-footer__bottom">
        <p>&copy; {new Date().getFullYear()} SMWEB. Demo aplikacija.</p>
      </Container>
    </footer>
  );
}

export default Footer;
