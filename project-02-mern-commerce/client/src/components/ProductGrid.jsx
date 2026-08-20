import ProductCard from "./ProductCard.jsx";
import "../styles/product-grid.css";

/**
 * Responsive grid of product cards.
 *
 * Rendered as a list so assistive technology announces how many products are
 * in it. Empty results are handled by the calling page, which knows whether
 * "nothing found" means an empty catalogue or an empty filter.
 */
function ProductGrid({ products, label = "Proizvodi" }) {
  return (
    <ul className="product-grid" aria-label={label}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

export default ProductGrid;
