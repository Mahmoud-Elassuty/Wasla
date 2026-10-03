import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearCart, validateCartInventory } from "../store/reducers/cartSlice";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import { useT } from "../i18n/useT";

export default function Cart() {
  const { t } = useT();
  const dispatch = useDispatch();
  const { items, itemCount, inventoryStatus, inventoryError, inventoryIssues } = useSelector((s) => s.cart);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (items.length > 0) dispatch(validateCartInventory());
  }, [dispatch, items.length]);

  if (items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-bag fs-1 text-secondary" aria-hidden="true" />
        <h1 className="h4 mt-3">{t("Your cart is empty")}</h1>
        <p className="text-secondary">{t("Browse the catalog and add what you like.")}</p>
        <Link to="/products" className="btn btn-accent px-4">{t("Continue shopping")}</Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <div>
          <h1 className="h3 mb-1">{t("Your cart")}</h1>
          <p className="text-secondary small mb-0">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>

        {confirming ? (
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="small">{t("Remove all items?")}</span>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => dispatch(clearCart())}>
              {t("Yes, clear")}
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirming(false)}>
              {t("Cancel")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-link btn-sm text-danger text-decoration-none"
            onClick={() => setConfirming(true)}
          >
            {t("Clear cart")}
          </button>
        )}
      </div>

      {inventoryStatus === "loading" && (
        <p className="small text-secondary" role="status">{t("Checking current product availability...")}</p>
      )}
      {inventoryStatus === "failed" && (
        <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{inventoryError ? t(inventoryError) : t("Current stock could not be checked. Checkout will remain unavailable until stock can be confirmed.")}</span>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => dispatch(validateCartInventory())}>
            {t("Retry stock check")}
          </button>
        </div>
      )}
      {inventoryStatus === "invalid" && (
        <div className="alert alert-warning" role="alert">
          <p className="fw-semibold mb-1">{t("Some cart quantities need attention.")}</p>
          <ul className="mb-0">
            {inventoryIssues.map((issue) => <li key={issue}>{t(issue)}</li>)}
          </ul>
        </div>
      )}

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
