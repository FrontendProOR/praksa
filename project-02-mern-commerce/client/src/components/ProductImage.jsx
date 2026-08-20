import { useState } from "react";
import "../styles/product-image.css";

/**
 * Product image with an intentional fallback.
 *
 * The data model stores `imageUrl` as a URL or path - there is no upload
 * service in this project - so an image may legitimately not resolve yet. When
 * that happens (or when no URL is stored at all) a drawn placeholder carrying
 * the product's initials is shown instead of a broken-image icon.
 *
 * The placeholder is decorative: the product name is already the heading next
 * to it, so it is hidden from assistive technology and the <img> alt stays
 * empty when the real image is absent.
 */
function initialsOf(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function ProductImage({ src, alt, ratio = "4 / 3" }) {
  const [failed, setFailed] = useState(!src);
  const [renderedSrc, setRenderedSrc] = useState(src);

  // A different product may have a working URL, so the failure flag is reset
  // when the source changes. Adjusting state during render (rather than in an
  // effect) avoids rendering the previous product's fallback for one frame.
  if (src !== renderedSrc) {
    setRenderedSrc(src);
    setFailed(!src);
  }

  if (failed) {
    return (
      <div className="product-image product-image--placeholder" style={{ aspectRatio: ratio }}>
        <span className="product-image__initials" aria-hidden="true">
          {initialsOf(alt) || "?"}
        </span>
        <span className="visually-hidden">Slika proizvoda nije dostupna</span>
      </div>
    );
  }

  return (
    <img
      className="product-image"
      style={{ aspectRatio: ratio }}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default ProductImage;
