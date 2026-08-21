import { useCallback } from "react";
import Container from "../components/Container.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import SearchBar from "../components/SearchBar.jsx";
import FilterPanel from "../components/FilterPanel.jsx";
import Pagination from "../components/Pagination.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";
import { useApiResource } from "../hooks/useApiResource.js";
import { useCatalogParams } from "../hooks/useCatalogParams.js";
import { fetchProducts } from "../api/products.js";
import { fetchCategories } from "../api/categories.js";
import { hasActiveFilters, toApiParams } from "../utils/catalogQuery.js";
import "../styles/catalog.css";

/**
 * Catalogue page.
 *
 * The controls do not filter an already-loaded array: every change rewrites
 * the URL, and the URL drives one request to the API. That keeps the visible
 * list, the pagination metadata and the address bar in agreement, and makes
 * refresh, Back/Forward and shared links work for free.
 */
function CatalogPage() {
  const { params, setFilters, setPage, reset } = useCatalogParams();

  // The serialised query is the fetch dependency: the effect re-runs when the
  // query genuinely changes, not on every render.
  const apiParams = toApiParams(params);
  const queryKey = new URLSearchParams(
    Object.entries(apiParams).map(([key, value]) => [key, String(value)]),
  ).toString();

  const catalogue = useApiResource(
    ({ signal }) => fetchProducts(apiParams, { signal }),
    [queryKey],
  );
  const categories = useApiResource(({ signal }) => fetchCategories({ signal }), []);

  const meta = catalogue.data?.meta;
  const products = catalogue.data?.products ?? [];
  const filtersActive = hasActiveFilters(params);

  const handlePageChange = useCallback(
    (page) => {
      setPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setPage],
  );

  const activeCategory = categories.data?.find(
    (category) => category.slug === params.category,
  );

  return (
    <section className="section" aria-labelledby="katalog-naslov">
      <Container>
        <div className="catalog__intro">
          <p className="eyebrow">Katalog</p>
          <h1 id="katalog-naslov">Proizvodi</h1>
          <p className="lead">
            Pretražite ponudu, filtrirajte po kategoriji i sortirajte rezultate.
            Prikazani su samo aktivni proizvodi.
          </p>
        </div>

        <div className="catalog__controls">
          <SearchBar value={params.q} onSearch={(q) => setFilters({ q })} />
          <FilterPanel
            params={params}
            categories={categories.data ?? []}
            categoriesLoading={categories.isLoading}
            categoriesError={categories.error}
            onChange={setFilters}
            onReset={reset}
            canReset={filtersActive || params.sort !== "newest" || params.page > 1}
          />
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
              title={filtersActive ? "Nema rezultata" : "Katalog je prazan"}
              message={
                filtersActive
                  ? "Nijedan proizvod ne odgovara zadatim kriterijumima. Promijenite pretragu ili poništite filtere."
                  : "Trenutno nema dostupnih proizvoda. Pokušajte ponovo kasnije."
              }
              action={
                filtersActive ? (
                  <button type="button" className="btn btn--secondary" onClick={reset}>
                    Poništi filtere
                  </button>
                ) : null
              }
            />
          ) : (
            <>
              <p className="catalog__count" role="status">
                {meta?.totalItems === 1
                  ? "1 proizvod"
                  : `${meta?.totalItems ?? products.length} proizvoda`}
                {params.q ? ` za pojam "${params.q}"` : ""}
                {activeCategory ? ` u kategoriji ${activeCategory.name}` : ""}
                {params.featured ? ", samo izdvojeni" : ""}
                {meta && meta.totalPages > 1
                  ? ` - stranica ${meta.page} od ${meta.totalPages}`
                  : ""}
              </p>

              <ProductGrid products={products} label="Katalog proizvoda" />

              {meta ? <Pagination meta={meta} onPageChange={handlePageChange} /> : null}
            </>
          )
        ) : null}
      </Container>
    </section>
  );
}

export default CatalogPage;
