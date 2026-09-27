import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import ShippingForm from "../components/checkout/ShippingForm";
import OrderSummary from "../components/checkout/OrderSummary";
import { formatPrice } from "../utils/format";
import { getOrderTotals } from "../utils/checkout";

// Step 1 of 2: shipping details only. Payment method, card/PayPal/wallet processing, and the
// order itself are all handled on the /payment step, which reads `shipping` back out of
// navigation state — see Payment.jsx.
export default function Checkout() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const cart = useSelector((s) => s.cart);
  const { coupon, discount: couponDiscount } = useSelector((s) => s.coupons);

  const appliedCoupon = coupon ? { code: coupon.code, discount: couponDiscount } : null;
  const { total } = getOrderTotals(cart, appliedCoupon);

  const handleContinue = (values) => {
    navigate("/payment", { state: { shipping: values } });
  };

  if (cart.items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-bag fs-1 text-secondary" aria-hidden="true" />
        <h1 className="h4 mt-3">Your cart is empty</h1>
        <p className="text-secondary">Add something to your cart before checking out.</p>
        <Link to="/products" className="btn btn-accent px-4">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h3 mb-1">Checkout</h1>
      <p className="text-secondary small mb-4">Step 1 of 2 — Shipping details</p>

      <div className="row g-4">
        <div className="col-lg-7">
          <section className="bg-white border rounded-4 p-4">
            <h2 className="h5 mb-3">Shipping details</h2>
            <ShippingForm
              initialValues={{ fullName: user?.name ?? "", email: user?.email ?? "" }}
              onSubmit={handleContinue}
            />
          </section>
        </div>

        <div className="col-lg-5">
          <OrderSummary>
            <button type="submit" form="shipping-form" className="btn btn-accent btn-lg w-100 mt-4">
              Continue to payment — {formatPrice(total)}
            </button>
            <Link to="/cart" className="btn btn-outline-secondary w-100 mt-2">
              Back to cart
            </Link>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
