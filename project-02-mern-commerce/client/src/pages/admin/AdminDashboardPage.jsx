import { Link } from "react-router-dom";
import Container from "../../components/Container.jsx";
import { ErrorState, LoadingState } from "../../components/StateViews.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { fetchAdminStats } from "../../api/admin.js";
import { formatPrice } from "../../utils/format.js";
import "../../styles/admin.css";

/**
 * Dashboard summary.
 *
 * Every figure comes from `/api/admin/stats`, which counts documents in
 * MongoDB. Nothing here is a placeholder number.
 */
const STATUS_LABELS = {
  pending: "Na čekanju",
  processing: "U obradi",
  shipped: "Poslano",
  delivered: "Isporučeno",
  cancelled: "Otkazano",
};

function AdminDashboardPage() {
  const { data: stats, error, isLoading, reload } = useApiResource(
    ({ signal }) => fetchAdminStats({ signal }),
    [],
  );

  return (
    <section className="section" aria-labelledby="pregled-naslov">
      <Container>
        <div className="admin__intro">
          <p className="eyebrow">Administracija</p>
          <h1 id="pregled-naslov">Pregled</h1>
          <p className="lead">Trenutno stanje kataloga i narudžbi u bazi.</p>
        </div>

        {isLoading ? <LoadingState label="Učitavanje statistike..." /> : null}

        {error ? (
          <ErrorState title="Statistika nije učitana" message={error.message} onRetry={reload} />
        ) : null}

        {!isLoading && !error ? (
          <>
            <ul className="stat-grid">
              <li className="stat-card panel">
                <p className="stat-card__label">Proizvoda ukupno</p>
                <p className="stat-card__value">{stats.products.total}</p>
                <p className="stat-card__note">
                  {stats.products.active} aktivnih, {stats.products.inactive} neaktivnih
                </p>
              </li>
              <li className="stat-card panel">
                <p className="stat-card__label">Nema na stanju</p>
                <p className="stat-card__value">{stats.products.outOfStock}</p>
                <p className="stat-card__note">proizvoda sa nultim stanjem</p>
              </li>
              <li className="stat-card panel">
                <p className="stat-card__label">Kategorija</p>
                <p className="stat-card__value">{stats.categories.total}</p>
                <p className="stat-card__note">u katalogu</p>
              </li>
              <li className="stat-card panel">
                <p className="stat-card__label">Registrovanih naloga</p>
                <p className="stat-card__value">{stats.users.total}</p>
                <p className="stat-card__note">korisnika i administratora</p>
              </li>
              <li className="stat-card panel">
                <p className="stat-card__label">Narudžbi ukupno</p>
                <p className="stat-card__value">{stats.orders.total}</p>
                <p className="stat-card__note">{stats.orders.pending} na čekanju</p>
              </li>
              <li className="stat-card panel">
                <p className="stat-card__label">Demo promet</p>
                <p className="stat-card__value">{formatPrice(stats.demoRevenue)}</p>
                <p className="stat-card__note">
                  zbir neotkazanih narudžbi; demo podatak, ne stvarna naplata
                </p>
              </li>
            </ul>

            <section className="admin__block panel" aria-labelledby="statusi-naslov">
              <h2 id="statusi-naslov" className="admin__block-title">
                Narudžbe po statusu
              </h2>
              <dl className="status-breakdown">
                {Object.entries(stats.orders.byStatus).map(([status, count]) => (
                  <div key={status}>
                    <dt>{STATUS_LABELS[status] ?? status}</dt>
                    <dd>{count}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <div className="admin__shortcuts">
              <Link className="btn btn--primary" to="/admin/products/new">
                Novi proizvod
              </Link>
              <Link className="btn btn--secondary" to="/admin/orders">
                Narudžbe
              </Link>
              <Link className="btn btn--secondary" to="/admin/categories">
                Kategorije
              </Link>
            </div>
          </>
        ) : null}
      </Container>
    </section>
  );
}

export default AdminDashboardPage;
