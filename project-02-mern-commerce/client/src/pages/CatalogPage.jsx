import Container from "../components/Container.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";
import { useApiResource } from "../hooks/useApiResource.js";
import { fetchProducts } from "../api/products.js";
import "../styles/catalog.css";

/**
 * Catalogue page.
 *
 * Uses the API's default listing behaviour (page 1, 12 per page, newest
 * first). Search, category filtering, sorting and pagination controls are the
 * next piece of work; the API already supports those parameters, and this page
 * will pass them once the controls exist.
 */
function CatalogPage() {
  const catalogue = useApiResource(({ signal }) => fetchProducts({}, { signal }), []);

  const meta = catalogue.data?.meta;
  const products = catalogue.data?.products ?? [];

  return (
    <section className="section" aria-labelledby="katalog-naslov">
      <Container>
        <div className="catalog__intro">
          <p className="eyebrow">Katalog</p>
          <h1 id="katalog-naslov">Proizvodi</h1>
          <p className="lead">
            Cijeli asortiman učitan iz baze. Prikazani su samo aktivni proizvodi.
          </p>
        </div>

        {catalogue.isLoading ? (
          <LoadingState label="Učitavanje proizvoda..." skeletonCount={6} />
        ) : null}

        {catalogue.error ? (
          <ErrorState
            title="Katalog nije učitan"
            message={catalogue.error.message}
            onRetry={catalogue.reload}
          />
        ) : null}

        {!catalogue.isLoading && !catalogue.error ? (
          products.length === 0 ? (
            <EmptyState
              title="Katalog je prazan"
              message="Trenutno nema dostupnih proizvoda. Pokušajte ponovo kasnije."
            />
          ) : (
            <>
              <p className="catalog__count">
                Prikazano {products.length} od {meta?.totalItems ?? products.length} proizvoda
              </p>
              <ProductGrid products={products} label="Katalog proizvoda" />
            </>
          )
        ) : null}
      </Container>
    </section>
  );
}

export default CatalogPage;
