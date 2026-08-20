import { Link } from "react-router-dom";
import Price from "./Price.jsx";
import ProductImage from "./ProductImage.jsx";
import { describeStock } from "../utils/format.js";
import "../styles/product-card.css";

/**
 * Catalogue card for one product.
 *
 * The whole card is a link to the product details route. The heading carries
 * the link so the accessible name is the product name rather than a generic
 * "read more", and the stock state is a labelled badge rather than colour only.
 */
function ProductCard({ product }) {
  const stock = describeStock(product.stock);

  return (
    <article className="product-card">
      <Link className="product-card__link" to={`/products/${product.slug}`}>
        <span className="product-card__media">
          <ProductImage src={product.imageUrl} alt={product.name} />
        </span>

        <span className="product-card__body">
          {product.category?.name ? (
            <span className="product-card__category">{product.category.name}</span>
          ) : null}

          <h3 className="product-card__title">{product.name}</h3>
          <span className="product-card__summary">{product.shortDescription}</span>

          <span className="product-card__footer">
            <Price value={product.price} compareAtValue={product.compareAtPrice} />
            <span className={`stock-badge stock-badge--${stock.tone}`}>{stock.label}</span>
          </span>
        </span>
      </Link>
    </article>
  );
}

export default ProductCard;
