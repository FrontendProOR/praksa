import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Container from "../../components/Container.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { fetchAdminProducts } from "../../api/admin.js";
import { deleteProduct } from "../../api/products.js";
import { formatPrice } from "../../utils/format.js";
import "../../styles/admin.css";

/**
 * Product management.
 *
 * Reads the admin listing, which unlike the storefront includes inactive
 * products. Deleting asks for confirmation first and names the product; the
 * list is refetched from the server afterwards rather than patched locally, so
 * what is shown is what the database holds.
 */
function AdminProductsPage() {
  const { data, error, isLoading, reload } = useApiResource(
    ({ signal }) => fetchAdminProducts({ limit: 48 }, { signal }),
    [],
  );

  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // The form redirects here with what it saved. Location state survives a
  // reload, so it is captured once for this visit and then dropped from the
  // history entry - otherwise a refresh would keep announcing an old save.
  const location = useLocation();
  const navigate = useNavigate();
  const [savedNotice] = useState(() => {
    const saved = location.state?.savedProduct;
    if (!saved) return null;
    return location.state.mode === "edit"
      ? `Proizvod "${saved}" je izmijenjen.`
      : `Proizvod "${saved}" je kreiran.`;
  });
  const [deleteNotice, setDeleteNotice] = useState(null);
  const notice = deleteNotice ?? savedNotice;

  useEffect(() => {
    if (location.state?.savedProduct) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const products = data?.products ?? [];

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteProduct(pendingDelete.id);
      setDeleteNotice(`Proizvod "${pendingDelete.name}" je obrisan.`);
      setPendingDelete(null);
      reload();
    } catch (requestError) {
      setDeleteError(requestError.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="section" aria-labelledby="proizvodi-naslov">
      <Container>
        <div className="admin__intro">
          <p className="eyebrow">Administracija</p>
          <h1 id="proizvodi-naslov">Proizvodi</h1>
          <p className="lead">
            Svi proizvodi iz baze, uključujući one koji nisu aktivni na prodavnici.
          </p>
          <Link className="btn btn--primary" to="/admin/products/new">
            Novi proizvod
          </Link>
        </div>

        {notice ? (
          <p className="admin__notice" role="status">
            {notice}
          </p>
        ) : null}

        {isLoading ? <LoadingState label="Učitavanje proizvoda..." /> : null}

        {error ? (
          <ErrorState title="Proizvodi nisu učitani" message={error.message} onRetry={reload} />
        ) : null}

        {!isLoading && !error ? (
          products.length === 0 ? (
            <EmptyState
              title="Nema proizvoda"
              message="Dodajte prvi proizvod u katalog."
              action={
                <Link className="btn btn--primary" to="/admin/products/new">
                  Novi proizvod
                </Link>
              }
            />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <caption className="visually-hidden">
                  Proizvodi u katalogu sa cijenom, stanjem i statusom
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Naziv</th>
                    <th scope="col">Šifra</th>
                    <th scope="col">Kategorija</th>
                    <th scope="col">Cijena</th>
                    <th scope="col">Stanje</th>
                    <th scope="col">Status</th>
                    <th scope="col">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <th scope="row" className="admin-table__name">
                        {product.name}
                      </th>
                      <td>{product.sku}</td>
                      <td>{product.category?.name ?? "-"}</td>
                      <td>{formatPrice(product.price)}</td>
                      <td className={product.stock === 0 ? "admin-table__zero" : undefined}>
                        {product.stock}
                      </td>
                      <td>
                        <span className={`state-pill state-pill--${product.active ? "on" : "off"}`}>
                          {product.active ? "Aktivan" : "Neaktivan"}
                        </span>
                        {product.featured ? (
                          <span className="state-pill state-pill--featured">Izdvojen</span>
                        ) : null}
                      </td>
                      <td className="admin-table__actions">
                        <Link className="btn btn--secondary btn--sm" to={`/admin/products/${product.id}/edit`}>
                          Izmijeni
                          <span className="visually-hidden"> proizvod {product.name}</span>
                        </Link>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => {
                            setDeleteError(null);
                            setPendingDelete(product);
                          }}
                        >
                          Obriši
                          <span className="visually-hidden"> proizvod {product.name}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        <ConfirmDialog
          open={Boolean(pendingDelete)}
          title="Brisanje proizvoda"
          message={
            pendingDelete
              ? `Proizvod "${pendingDelete.name}" (${pendingDelete.sku}) biće trajno obrisan. Postojeće narudžbe zadržavaju svoje podatke.`
              : ""
          }
          isBusy={isDeleting}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => {
            if (!isDeleting) {
              setPendingDelete(null);
              setDeleteError(null);
            }
          }}
        />
      </Container>
    </section>
  );
}

export default AdminProductsPage;
