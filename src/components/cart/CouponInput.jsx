import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applyCoupon } from "../../store/reducers/couponsSlice";

// Parent (CartSummary) owns the "Remove" action — this component only handles entering
// and applying a code, plus showing why one failed.
export default function CouponInput({ cartTotal }) {
  const dispatch = useDispatch();
  const { coupon, status, error } = useSelector((s) => s.coupons);
  const [code, setCode] = useState("");
  const applying = status === "loading";

  if (coupon) {
    return (
      <p className="coupon-applied small text-success mb-0">
        <i className="bi bi-check-circle-fill me-1" aria-hidden="true" />
        Coupon <strong>{coupon.code}</strong> applied
      </p>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim() || applying) return;
    dispatch(applyCoupon({ code, cartTotal }));
  };

  return (
    <form className="coupon-input" onSubmit={handleSubmit}>
      <label htmlFor="coupon-code" className="form-label small fw-semibold">
        Have a coupon?
      </label>
      <div className="input-group">
        <input
          id="coupon-code"
          type="text"
          className={`form-control text-uppercase${error ? " is-invalid" : ""}`}
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={applying}
          aria-describedby={error ? "coupon-error" : undefined}
        />
        <button type="submit" className="btn btn-outline-secondary" disabled={applying || !code.trim()}>
          {applying ? "Applying..." : "Apply"}
        </button>
      </div>
      {error && (
        <p id="coupon-error" className="text-danger small mt-1 mb-0">
          {error}
        </p>
      )}
    </form>
  );
}
