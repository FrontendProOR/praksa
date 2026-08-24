import Container from "../components/Container.jsx";
import { useAuth } from "../context/auth-context.js";
import "../styles/account.css";

/**
 * Admin landing page.
 *
 * Deliberately minimal: it exists so the admin route guard has something real
 * to protect and so guest / user / admin behaviour can be verified. The
 * management screens - products, categories and orders - are a later piece of
 * work, and nothing here pretends to offer them yet.
 */
function AdminPage() {
  const { user } = useAuth();

  return (
    <section className="section" aria-labelledby="admin-naslov">
      <Container className="account">
        <div className="account__intro">
          <p className="eyebrow">Administracija</p>
          <h1 id="admin-naslov">Administratorski pristup</h1>
          <p className="lead">
            Prijavljeni ste kao administrator ({user.email}). Ekrani za upravljanje
            proizvodima, kategorijama i narudžbama biće dodani u narednom koraku.
          </p>
        </div>
      </Container>
    </section>
  );
}

export default AdminPage;
