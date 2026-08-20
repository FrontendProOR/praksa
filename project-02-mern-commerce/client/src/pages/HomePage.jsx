import { Link } from "react-router-dom";
import Container from "../components/Container.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";
import { useApiResource } from "../hooks/useApiResource.js";
import { fetchProducts } from "../api/products.js";
import { fetchCategories } from "../api/categories.js";
import "../styles/home.css";

/**
 * Home page: store introduction, the categories that actually exist in the
 * database, and the featured products the API returns.
 *
 * Both blocks are real API reads - nothing on this page is a hardcoded
 * product or category list.
 */
function HomePage() {
  const featured = useApiResource(
    ({ signal }) => fetchProducts({ featured: true, limit: 3 }, { signal }),
    [],
  );
  const categories = useApiResource(({ signal }) => fetchCategories({ signal }), []);

  return (
    <>
      <section className="hero" aria-labelledby="hero-naslov">
        <Container className="hero__inner">
          <div className="hero__content">
            <p className="eyebrow">Laboratorijska oprema</p>
            <h1 id="hero-naslov" className="hero__title">
              Oprema i potrošni materijal za svakodnevni rad u laboratoriji
            </h1>
            <p className="lead hero__lead">
              Demo prodavnica izrađena na MERN stacku. Katalog, detalji proizvoda i
              stanje zaliha učitavaju se iz MongoDB baze preko Express API-ja.
            </p>
            <div className="hero__actions">
              <Link className="btn btn--primary" to="/products">
                Pogledaj katalog
              </Link>
            </div>
          </div>

          <div className="hero__panel" aria-hidden="true">
            <span className="hero__panel-bar" />
            <span className="hero__panel-bar hero__panel-bar--short" />
            <span className="hero__panel-grid">
              <span />
              <span />
              <span />
              <span />
            </span>
          </div>
        </Container>
      </section>

      <section className="section" aria-labelledby="kategorije-naslov">
        <Container>
          <div className="section-heading">
            <h2 id="kategorije-naslov">Kategorije</h2>
            <p className="section-heading__text">
              Podjela kataloga na grupe proizvoda.
            </p>
          </div>

          {categories.isLoading ? <LoadingState label="Učitavanje kategorija..." /> : null}

          {categories.error ? (
            <ErrorState
              title="Kategorije nisu učitane"
              message={categories.error.message}
              onRetry={categories.reload}
            />
          ) : null}

          {!categories.isLoading && !categories.error ? (
            categories.data.length === 0 ? (
              <EmptyState
                title="Još nema kategorija"
                message="Kategorije će se pojaviti čim budu dodane u bazu."
              />
            ) : (
              /*
                Informational cards for now. They are not links yet because
                filtering the catalogue by category is part of the catalogue
                controls work, and a link to an unfiltered catalogue would
                promise something the page does not do.
              */
              <ul className="category-list">
                {categories.data.map((category) => (
                  <li key={category.id} className="category-card">
                    <span className="category-card__name">{category.name}</span>
                    {category.description ? (
                      <span className="category-card__description">
                        {category.description}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </Container>
      </section>

      <section className="section section--alt" aria-labelledby="izdvojeno-naslov">
        <Container>
          <div className="section-heading">
            <h2 id="izdvojeno-naslov">Izdvojeno iz ponude</h2>
            <p className="section-heading__text">
              Proizvodi označeni kao izdvojeni u administraciji.
            </p>
          </div>

          {featured.isLoading ? (
            <LoadingState label="Učitavanje izdvojenih proizvoda..." skeletonCount={3} />
          ) : null}

          {featured.error ? (
            <ErrorState
              title="Proizvodi nisu učitani"
              message={featured.error.message}
              onRetry={featured.reload}
            />
          ) : null}

          {!featured.isLoading && !featured.error ? (
            featured.data.products.length === 0 ? (
              <EmptyState
                title="Nema izdvojenih proizvoda"
                message="Trenutno nijedan proizvod nije označen kao izdvojen."
                action={
                  <Link className="btn btn--secondary" to="/products">
                    Otvori katalog
                  </Link>
                }
              />
            ) : (
              <>
                <ProductGrid products={featured.data.products} label="Izdvojeni proizvodi" />
                <p className="section-more">
                  <Link className="btn btn--secondary" to="/products">
                    Prikaži sve proizvode
                  </Link>
                </p>
              </>
            )
          ) : null}
        </Container>
      </section>
    </>
  );
}

export default HomePage;
