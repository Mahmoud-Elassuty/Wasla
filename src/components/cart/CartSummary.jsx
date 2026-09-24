import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { formatPrice } from "../../utils/format";
import { removeCoupon } from "../../store/reducers/couponsSlice";
import CouponInput from "./CouponInput";

export default function CartSummary() {
  const dispatch = useDispatch();
  const { subtotal, discount, total: cartTotal, itemCount } = useSelector((s) => s.cart);
  const { coupon, discount: couponDiscount } = useSelector((s) => s.coupons);
  const total = Math.max(0, cartTotal - couponDiscount);

  return (
    <aside className="cart-summary bg-white border rounded-4 p-4" aria-label="Order summary">
      <h2 className="h5 mb-3">Order summary</h2>

      <dl className="d-grid gap-2 mb-0">
        <div className="d-flex justify-content-between">
          <dt className="fw-normal text-secondary">
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </dt>
          <dd className="mb-0">{formatPrice(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="d-flex justify-content-between text-success">
            <dt className="fw-normal">Discount</dt>
            <dd className="mb-0">-{formatPrice(discount)}</dd>
          </div>
        )}
      </dl>

      <div className="my-3 pt-1">
        <CouponInput cartTotal={cartTotal} />
      </div>

      <dl className="d-grid gap-2 mb-0">
        {coupon && (
          <div className="d-flex justify-content-between text-success">
            <dt className="fw-normal">
              Coupon ({coupon.code})
              <button
                type="button"
                className="btn btn-link btn-sm p-0 ms-2 align-baseline text-decoration-none"
                onClick={() => dispatch(removeCoupon())}
              >
                Remove
              </button>
            </dt>
            <dd className="mb-0">-{formatPrice(couponDiscount)}</dd>
          </div>
        )}
        <div className="d-flex justify-content-between border-top pt-3 mt-1 fs-5 fw-semibold">
          <dt className="fw-semibold">Total</dt>
          <dd className="mb-0 font-display">{formatPrice(total)}</dd>
        </div>
      </dl>

      <Link to="/checkout" className="btn btn-accent btn-lg w-100 mt-4">
        Checkout
      </Link>
      <Link to="/products" className="btn btn-outline-secondary w-100 mt-2">
        Continue shopping
      </Link>
    </aside>
  );
}

