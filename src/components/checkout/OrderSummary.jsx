import { useSelector } from "react-redux";
import { formatPrice } from "../../utils/format";
import { SHIPPING_FEE_EGP, getOrderTotals } from "../../utils/checkout";

// `children` is rendered under the totals (used for the action buttons).
export default function OrderSummary({ children }) {
  const cart = useSelector((s) => s.cart);
  const { coupon, discount: couponDiscount } = useSelector((s) => s.coupons);
  const appliedCoupon = coupon ? { code: coupon.code, discount: couponDiscount } : null;
  const { subtotal, discount, shipping, couponCode, total } = getOrderTotals(cart, appliedCoupon);

  return (
    <aside className="checkout-summary bg-white border rounded-4 p-4" aria-label="Order summary">
      <h2 className="h5 mb-3">Order summary</h2>

      <ul className="list-unstyled mb-3">
        {cart.items.map((item) => (
          <li key={item.id} className="cart-item d-flex align-items-center gap-2 py-2">
            <span className="cart-thumb sm flex-shrink-0">
              <img src={item.thumbnail} alt="" />
            </span>
            <div className="flex-grow-1 min-w-0">
              <div className="small fw-semibold text-truncate">{item.title}</div>
              <div className="small text-secondary">
                {item.quantity} × {formatPrice(item.price)}
              </div>
            </div>
            <span className="small fw-semibold flex-shrink-0">
              {formatPrice(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="d-grid gap-2 mb-0 border-top pt-3">
        <div className="d-flex justify-content-between">
          <dt className="fw-normal text-secondary">Subtotal</dt>
          <dd className="mb-0">{formatPrice(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="d-flex justify-content-between text-success">
            <dt className="fw-normal">Discount</dt>
            <dd className="mb-0">-{formatPrice(discount)}</dd>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className="d-flex justify-content-between text-success">
            <dt className="fw-normal">Coupon ({couponCode})</dt>
            <dd className="mb-0">-{formatPrice(couponDiscount)}</dd>
          </div>
        )}
        <div className="d-flex justify-content-between">
          <dt className="fw-normal text-secondary">Shipping</dt>
          <dd className="mb-0">
            {formatPrice(shipping)} <span className="small text-secondary">({SHIPPING_FEE_EGP} EGP)</span>
          </dd>
        </div>
        <div className="d-flex justify-content-between border-top pt-3 mt-1 fs-5 fw-semibold">
          <dt className="fw-semibold">Total</dt>
          <dd className="mb-0 font-display">{formatPrice(total)}</dd>
        </div>
      </dl>

      {children}
    </aside>
  );
}
