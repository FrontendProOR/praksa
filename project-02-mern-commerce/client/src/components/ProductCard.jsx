import { Link } from "react-router-dom";
import Price from "./Price.jsx";
import ProductImage from "./ProductImage.jsx";
import AddToCartButton from "./AddToCartButton.jsx";
import { describeStock } from "../utils/format.js";
import "../styles/product-card.css";

/**
 * Catalogue card for one product.
 *
 * The link covers the image and the text, and the actions sit beside it rather
 * than inside it: a button nested in a link is invalid markup and awkward for
 * both keyboard and screen-reader users.
 *
 * The heading carries the link, so its accessible name is the product name
 * rather than a generic "read more".
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
        </span>
      </Link>

      <div className="product-card__footer">
        <Price value={product.price} compareAtValue={product.compareAtPrice} />
        <span className={`stock-badge stock-badge--${stock.tone}`}>{stock.label}</span>
        <AddToCartButton product={product} className="product-card__action" />
      </div>
    </article>
  );
}

export default ProductCard;
