import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { removeFromCart, updateQuantity } from "../../store/reducers/cartSlice";
import { formatPrice } from "../../utils/format";
import { showInfo } from "../../utils/notifications";

const MAX_QTY = 99;

export default function CartItem({ item }) {
  const dispatch = useDispatch();
  const max = item.stock ?? MAX_QTY;

  // The input keeps its own text while typing, and commits on blur/Enter.
  // Otherwise clearing the field to type a new number would instantly reset it.
  const [draft, setDraft] = useState(String(item.quantity));
  const [prevQty, setPrevQty] = useState(item.quantity);
  if (item.quantity !== prevQty) {
    setPrevQty(item.quantity);
    setDraft(String(item.quantity));
  }

  const setQty = (quantity) => dispatch(updateQuantity({ id: item.id, quantity }));

  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isNaN(n)) {
      setDraft(String(item.quantity));
      return;
    }
    const next = Math.min(Math.max(1, n), max);
    setDraft(String(next));
    setQty(next);
  };

  const handleRemove = () => {
    dispatch(removeFromCart(item.id));
    dispatch(showInfo(`Removed "${item.title}" from cart.`));
  };

  const hasDiscount = item.listPrice > item.price;

  return (
    <li className="cart-item d-flex gap-3 py-3">
      <Link to={`/products/${item.id}`} className="cart-thumb flex-shrink-0">
        <img src={item.thumbnail} alt="" />
      </Link>

      <div className="flex-grow-1 min-w-0">
        <div className="d-flex justify-content-between gap-3">
          <Link to={`/products/${item.id}`} className="fw-semibold text-body text-decoration-none">
            {item.title}
          </Link>
          <span className="font-display fw-semibold flex-shrink-0">
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>

        <div className="small text-secondary">
          {formatPrice(item.price)} each
          {hasDiscount && <span className="price-old ms-2">{formatPrice(item.listPrice)}</span>}
        </div>

        <div className="d-flex flex-wrap align-items-center gap-3 mt-2">
          <div className="input-group input-group-sm" style={{ width: 120 }}>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setQty(item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label={`Decrease quantity of ${item.title}`}
            >
              <i className="bi bi-dash" />
            </button>
            <input
              type="number"
              className="form-control text-center qty-input"
              min={1}
              max={max}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              aria-label={`Quantity of ${item.title}`}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setQty(item.quantity + 1)}
              disabled={item.quantity >= max}
              aria-label={`Increase quantity of ${item.title}`}
            >
              <i className="bi bi-plus" />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-link btn-sm text-danger p-0 text-decoration-none"
            onClick={handleRemove}
            aria-label={`Remove ${item.title} from cart`}
          >
            <i className="bi bi-trash me-1" aria-hidden="true" />
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
