import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, selectItemQuantity } from "../../store/reducers/cartSlice";
import { formatPrice, getSalePrice, titleCase } from "../../utils/format";
import { showError, showSuccess } from "../../utils/notifications";
import { getStockState, safeStock } from "../../utils/inventory";
import useWishlist from "../../hooks/useWishlist";
import "../../styles/wishlist.css";

export default function ProductCard({ product, imageFallback = false, homeDeal = false }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const [added, setAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const user = useSelector((s) => s.auth.user);
  const inCart = useSelector(selectItemQuantity(product.id));
  const { wished, pending: wishPending, toggle: toggleWish } = useWishlist(product.id);

  const sale = getSalePrice(product);
  const discount = Math.round(product.discountPercentage || 0);
  const stockState = getStockState(product.stock, product.active !== false);
  const stockCount = safeStock(product.stock);
  const soldOut = !stockState.purchasable;
  const atLimit = !soldOut && inCart >= stockCount;

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1500);
    return () => clearTimeout(timer);
  }, [added]);

  const handleAdd = () => {
    if (!stockState.purchasable) {
      dispatch(showError(`"${product.title}" is ${stockState.label.toLowerCase()}.`));
      return;
    }
    if (inCart >= stockCount) {
      dispatch(showError(`Only ${stockCount} of "${product.title}" are available.`));
      return;
    }
    dispatch(
      addToCart({
        id: product.id,
        title: product.title,
        price: sale,
        listPrice: product.price,
        thumbnail: product.thumbnail,
        stock: stockCount,
        active: product.active !== false,
      })
    );
    setAdded(true);
    dispatch(showSuccess(`Added "${product.title}" to cart.`));
  };

  const handleToggleWish = async () => {
    if (!user) {
      toggleWish();
      return;
    }
    const willRemove = wished; // current (pre-toggle) state, captured before the toggle fires
    const action = await toggleWish();
    if (action?.meta.requestStatus !== "fulfilled") return;
    dispatch(
      willRemove
        ? showSuccess(`Removed "${product.title}" from wishlist.`)
        : showSuccess(`Added "${product.title}" to wishlist.`)
    );
  };

  return (
    <article className={`product-card position-relative bg-white border rounded-4 h-100 d-flex flex-column overflow-hidden${homeDeal ? " home-deal-product-card" : ""}`}>
      <div className="thumb ratio ratio-1x1">
        {imageFallback && imageFailed ? (
          <div className="home-product-image-fallback d-flex align-items-center justify-content-center" role="img" aria-label={product.title}>
            <i className="bi bi-image" aria-hidden="true" />
          </div>
        ) : (
          <img src={product.thumbnail} alt={product.title} loading="lazy" className="object-fit-contain p-2 p-sm-3" onError={imageFallback ? () => setImageFailed(true) : undefined} />
        )}
      </div>
      {discount >= 1 && (
        <span className="badge rounded-pill bg-accent position-absolute top-0 start-0 m-2">-{discount}%{homeDeal ? " OFF" : ""}</span>
      )}
      {homeDeal && <span className="home-deal-stock position-absolute start-0">{stockState.label}</span>}
      <button
        type="button"
        className={`wishlist-btn${wished ? " active" : ""}`}
        onClick={handleToggleWish}
        disabled={wishPending}
        aria-pressed={wished}
        aria-label={wished ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
      >
        <i className={`bi ${wished ? "bi-heart-fill" : "bi-heart"}`} aria-hidden="true" />
      </button>

      <div className="product-card-body p-2 p-sm-3 d-flex flex-column flex-grow-1">
        <div className="d-flex justify-content-between align-items-center gap-2 mb-1 small text-secondary">
          {homeDeal ? (
            <span className="home-deal-rating">
              <i className="bi bi-star-fill" aria-hidden="true" /> {Number(product.rating || 0).toFixed(1)}
              {Array.isArray(product.reviews) && product.reviews.length > 0 && <span className="text-secondary ms-1">({product.reviews.length} reviews)</span>}
            </span>
          ) : (
            <>
              <span className="text-truncate">{titleCase(product.category)}</span>
              <span className="rating-badge flex-shrink-0"><i className="bi bi-star-fill" aria-hidden="true" /> {Number(product.rating).toFixed(1)}</span>
            </>
          )}
        </div>
        {!homeDeal && (
          <span className={`small fw-semibold mb-1 ${stockState.level === "in" ? "text-success" : stockState.level === "low" ? "text-warning-emphasis" : "text-danger"}`}>
            {stockState.label}
          </span>
        )}

        <h3 className="product-card-title h6 line-clamp-2 mb-2">
          <Link
            to={`/products/${product.id}`}
            state={{ backTo: `${location.pathname}${location.search}` }}
            className="stretched-link text-decoration-none text-body"
          >
            {product.title}
          </Link>
        </h3>
        {homeDeal && <p className="home-deal-brand small text-secondary text-truncate mb-1">{product.brand || titleCase(product.category)}</p>}

        <div className={`mt-auto pt-2 d-flex gap-2 ${homeDeal ? "align-items-center justify-content-between" : "align-items-baseline"}`}>
          <div className="d-flex flex-wrap align-items-baseline column-gap-2">
            <span className="product-price font-display fw-semibold">{formatPrice(sale)}</span>
            {discount >= 1 && <span className="price-old small">{formatPrice(product.price)}</span>}
          </div>
          {homeDeal && (
            <button type="button" className="btn btn-accent home-deal-cart-btn position-relative z-2" onClick={handleAdd} disabled={soldOut || added || atLimit}
              aria-label={soldOut ? `${product.title} is out of stock` : added ? `${product.title} added to cart` : atLimit ? `${product.title} cart limit reached` : `Add ${product.title} to cart`}>
              <i className={`bi ${added ? "bi-check2" : "bi-cart-plus"}`} aria-hidden="true" />
            </button>
          )}
        </div>

        {!homeDeal && (
          <button type="button" className="btn btn-accent w-100 mt-2 mt-sm-3 position-relative z-2" onClick={handleAdd} disabled={soldOut || added || atLimit}>
            {!stockState.purchasable
              ? stockState.label
              : added
                ? "Added to cart"
                : atLimit
                  ? "Max in cart"
                  : "Add to cart"}
          </button>
        )}
      </div>
    </article>
  );
}