import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, selectItemQuantity } from "../../store/reducers/cartSlice";
import { formatPrice, getSalePrice, titleCase } from "../../utils/format";
import { showInfo, showSuccess } from "../../utils/notifications";
import useWishlist from "../../hooks/useWishlist";
import "../../styles/wishlist.css";

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const [added, setAdded] = useState(false);
  const user = useSelector((s) => s.auth.user);
  const inCart = useSelector(selectItemQuantity(product.id));
  const { wished, pending: wishPending, toggle: toggleWish } = useWishlist(product.id);

  const sale = getSalePrice(product);
  const discount = Math.round(product.discountPercentage || 0);
  const soldOut = product.stock <= 0;
  const atLimit = inCart >= product.stock; // everything in stock is already in the cart

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1500);
    return () => clearTimeout(timer);
  }, [added]);

  const handleAdd = () => {
    dispatch(
      addToCart({
        id: product.id,
        title: product.title,
        price: sale,
        listPrice: product.price,
        thumbnail: product.thumbnail,
        stock: product.stock,
      })
    );
    setAdded(true);
    dispatch(showSuccess(`Added "${product.title}" to cart.`));
  };

  const handleToggleWish = () => {
    const willRemove = wished; // current (pre-toggle) state, captured before the toggle fires
    toggleWish();
    if (!user) return; // guest gets redirected to login instead — no toast
    dispatch(
      willRemove
        ? showInfo(`Removed "${product.title}" from wishlist.`)
        : showSuccess(`Added "${product.title}" to wishlist.`)
    );
  };

  return (
    <article className="product-card position-relative bg-white border rounded-4 h-100 d-flex flex-column overflow-hidden">
      <div className="thumb ratio ratio-1x1">
        <img src={product.thumbnail} alt={product.title} loading="lazy" className="object-fit-contain p-3" />
      </div>
      {discount >= 1 && (
        <span className="badge rounded-pill bg-accent position-absolute top-0 start-0 m-2">-{discount}%</span>
      )}
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

      <div className="p-3 d-flex flex-column flex-grow-1">
        <div className="d-flex justify-content-between align-items-center gap-2 mb-1 small text-secondary">
          <span className="text-truncate">{titleCase(product.category)}</span>
          <span className="rating-badge flex-shrink-0">
            <i className="bi bi-star-fill" aria-hidden="true" /> {Number(product.rating).toFixed(1)}
          </span>
        </div>

        <h3 className="h6 line-clamp-2 mb-2">
          <Link
            to={`/products/${product.id}`}
            state={{ backTo: `${location.pathname}${location.search}` }}
            className="stretched-link text-decoration-none text-body"
          >
            {product.title}
          </Link>
        </h3>

        <div className="mt-auto pt-2 d-flex align-items-baseline gap-2">
          <span className="font-display fs-5 fw-semibold">{formatPrice(sale)}</span>
          {discount >= 1 && <span className="price-old small">{formatPrice(product.price)}</span>}
        </div>

        <button
          type="button"
          className="btn btn-accent w-100 mt-3 position-relative z-2"
          onClick={handleAdd}
          disabled={soldOut || added || atLimit}
        >
          {soldOut ? "Out of stock" : added ? "Added to cart" : atLimit ? "Max in cart" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
