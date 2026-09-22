import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "../store/reducers/cartSlice";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";

export default function Cart() {
  const dispatch = useDispatch();
  const { items, itemCount } = useSelector((s) => s.cart);
  const [confirming, setConfirming] = useState(false);

  if (items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-bag fs-1 text-secondary" aria-hidden="true" />
        <h1 className="h4 mt-3">Your cart is empty</h1>
        <p className="text-secondary">Browse the catalog and add what you like.</p>
        <Link to="/products" className="btn btn-accent px-4">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-end mb-3">
        <div>
          <h1 className="h3 mb-1">Your cart</h1>
          <p className="text-secondary small mb-0">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>

        {confirming ? (
          <div className="d-flex align-items-center gap-2">
            <span className="small">Remove all items?</span>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => dispatch(clearCart())}>
              Yes, clear
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-link btn-sm text-danger text-decoration-none"
            onClick={() => setConfirming(true)}
          >
            Clear cart
          </button>
        )}
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <ul className="list-unstyled bg-white border rounded-4 px-3 mb-0">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </ul>
        </div>
        <div className="col-lg-4">
          <CartSummary />
        </div>
      </div>
    </div>
  );
}
