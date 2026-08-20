import { Link } from "react-router-dom";
import Container from "../components/Container.jsx";
import "../styles/not-found.css";

/** 404 page for any URL that matches no route. */
function NotFoundPage() {
  return (
    <section className="section" aria-labelledby="nema-stranice">
      <Container className="not-found">
        <p className="eyebrow">Greška 404</p>
        <h1 id="nema-stranice">Stranica nije pronađena</h1>
        <p className="lead">
          Adresa koju ste otvorili ne postoji. Provjerite link ili se vratite na
          početnu stranicu.
        </p>
        <div className="not-found__actions">
          <Link className="btn btn--primary" to="/">
            Početna
          </Link>
          <Link className="btn btn--secondary" to="/products">
            Katalog
          </Link>
        </div>
      </Container>
    </section>
  );
}

export default NotFoundPage;
