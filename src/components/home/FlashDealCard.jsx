import { useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice, getSalePrice } from "../../utils/format";
import { getStockState } from "../../utils/inventory";

// Image paths that failed once; shared so the looped copies do not retry the same broken file.
const failedImages = new Set();

// Lightweight, presentational deal card for the moving carousel.
// No cart/wishlist controls and no store access, so repeating it in the loop is cheap and safe.
// `decorative` copies (the looped duplicates) are hidden from assistive tech and skipped by the Tab key.
export default function FlashDealCard({ product, backTo, decorative = false }) {
  const imageSrc = product.thumbnail || (Array.isArray(product.images) ? product.images[0] : "") || "";
  const [imageFailed, setImageFailed] = useState(() => !imageSrc || failedImages.has(imageSrc));

  const discount = Math.round(product.discountPercentage || 0);
  const stockState = getStockState(product.stock, product.active !== false);

  return (
    <article className="flash-deal-card">
      <div className="flash-deal-media">
        {imageFailed ? (
          <span className="flash-deal-media-fallback" aria-hidden="true"><i className="bi bi-image" /></span>
        ) : (
          <img
            src={imageSrc}
            alt=""
            width="240"
            height="180"
            draggable="false"
            decoding="async"
            onError={() => { failedImages.add(imageSrc); setImageFailed(true); }}
          />
        )}
        {discount >= 1 && <span className="flash-deal-badge">-{discount}%</span>}
      </div>

      <div className="flash-deal-body">
        <div className="flash-deal-meta">
          <span className="flash-deal-brand">{product.brand || "Wasla"}</span>
          <span className={`flash-deal-stock is-${stockState.level}`}>{stockState.label}</span>
        </div>

        <h3 className="flash-deal-title">
          <Link
            to={`/products/${product.id}`}
            state={{ backTo }}
            className="flash-deal-link"
            tabIndex={decorative ? -1 : undefined}
          >
            {product.title}
          </Link>
        </h3>

        <div className="flash-deal-prices">
          <span className="flash-deal-price font-display">{formatPrice(getSalePrice(product))}</span>
          {discount >= 1 && <span className="price-old small">{formatPrice(product.price)}</span>}
        </div>

        <span className="flash-deal-cta" aria-hidden="true">
          View Deal<i className="bi bi-arrow-right ms-2" />
        </span>
      </div>
    </article>
  );
}
