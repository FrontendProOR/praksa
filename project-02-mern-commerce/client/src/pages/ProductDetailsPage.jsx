import { Link, useParams } from "react-router-dom";
import Container from "../components/Container.jsx";
import Price from "../components/Price.jsx";
import ProductImage from "../components/ProductImage.jsx";
import { ErrorState, LoadingState } from "../components/StateViews.jsx";
import { useApiResource } from "../hooks/useApiResource.js";
import { fetchProductBySlug } from "../api/products.js";
import { describeStock } from "../utils/format.js";
import "../styles/product-details.css";

/**
 * Product details, loaded by the slug in the route.
 *
 * Only public product fields are shown. There is no add-to-cart control: the
 * cart is a later piece of work, and a disabled or fake button would promise
 * something the application cannot do yet.
 */
function ProductDetailsPage() {
  const { slug } = useParams();
  const { data: product, error, isLoading, reload } = useApiResource(
    ({ signal }) => fetchProductBySlug(slug, { signal }),
    [slug],
  );

  if (isLoading) {
    return (
      <section className="section">
        <Container>
          <LoadingState label="Učitavanje proizvoda..." />
        </Container>
      </section>
    );
  }

  if (error) {
    const notFound = error.isNotFound;
    return (
      <section className="section">
        <Container>
          <ErrorState
            title={notFound ? "Proizvod nije pronađen" : "Proizvod nije učitan"}
            message={
              notFound
                ? "Traženi proizvod ne postoji ili više nije u ponudi."
                : error.message
            }
            onRetry={notFound ? undefined : reload}
          />
          <p className="product-details__back">
            <Link className="btn btn--secondary" to="/products">
              Nazad na katalog
            </Link>
          </p>
        </Container>
      </section>
    );
  }

  const stock = describeStock(product.stock);

  return (
    <section className="section" aria-labelledby="proizvod-naslov">
      <Container>
        <nav className="breadcrumbs" aria-label="Putanja">
          <ol>
            <li>
              <Link to="/">Početna</Link>
            </li>
            <li>
              <Link to="/products">Katalog</Link>
            </li>
            <li aria-current="page">{product.name}</li>
          </ol>
        </nav>

        <div className="product-details">
          <div className="product-details__media">
            <ProductImage src={product.imageUrl} alt={product.name} ratio="1 / 1" />
          </div>

          <div className="product-details__info">
            {product.category?.name ? (
              <p className="product-details__category">{product.category.name}</p>
            ) : null}

            <h1 id="proizvod-naslov">{product.name}</h1>
            <p className="lead product-details__summary">{product.shortDescription}</p>

            <Price
              value={product.price}
              compareAtValue={product.compareAtPrice}
              size="lg"
            />

            <p className={`stock-badge stock-badge--${stock.tone} product-details__stock`}>
              {stock.label}
            </p>

            <dl className="product-details__facts">
              <div>
                <dt>Šifra artikla</dt>
                <dd>{product.sku}</dd>
              </div>
              {product.category?.name ? (
                <div>
                  <dt>Kategorija</dt>
                  <dd>{product.category.name}</dd>
                </div>
              ) : null}
            </dl>

            {product.tags?.length ? (
              <ul className="product-details__tags" aria-label="Oznake">
                {product.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <section className="product-details__description" aria-labelledby="opis-naslov">
          <h2 id="opis-naslov">Opis proizvoda</h2>
          <p>{product.description}</p>
        </section>

        <p className="product-details__back">
          <Link className="btn btn--secondary" to="/products">
            Nazad na katalog
          </Link>
        </p>
      </Container>
    </section>
  );
}

export default ProductDetailsPage;
