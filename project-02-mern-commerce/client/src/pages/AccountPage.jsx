import { Link, useNavigate } from "react-router-dom";
import Container from "../components/Container.jsx";
import { useAuth } from "../context/auth-context.js";
import "../styles/account.css";

/**
 * Account overview.
 *
 * Shows only the safe fields the API returns for the session: name, email,
 * role and the date the account was created. There is nothing here about
 * passwords, hashes or the token - the client never sees any of them.
 *
 * Editing a profile is not part of this project's scope.
 */
function AccountPage() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // Navigate away before clearing the session, so this protected route's own
  // guard does not redirect to the login page at the same time.
  const handleLogout = async () => {
    navigate("/", { replace: true });
    await logout();
  };

  const createdAt = user?.createdAt
    ? new Intl.DateTimeFormat("bs-BA", { dateStyle: "long" }).format(new Date(user.createdAt))
    : "-";

  return (
    <section className="section" aria-labelledby="nalog-naslov">
      <Container className="account">
        <div className="account__intro">
          <p className="eyebrow">Nalog</p>
          <h1 id="nalog-naslov">Moj nalog</h1>
          <p className="lead">Podaci vašeg naloga, onako kako ih čuva server.</p>
        </div>

        <dl className="account__details panel">
          <div>
            <dt>Ime i prezime</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>Email adresa</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Uloga</dt>
            <dd>
              <span className={`role-badge role-badge--${user.role}`}>
                {isAdmin ? "Administrator" : "Korisnik"}
              </span>
            </dd>
          </div>
          <div>
            <dt>Nalog otvoren</dt>
            <dd>{createdAt}</dd>
          </div>
        </dl>

        <div className="account__actions">
          <button type="button" className="btn btn--secondary" onClick={handleLogout}>
            Odjavi se
          </button>
          <Link className="btn btn--ghost" to="/products">
            Nastavi kupovinu
          </Link>
        </div>
      </Container>
    </section>
  );
}

export default AccountPage;
