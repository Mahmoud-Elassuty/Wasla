import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "../store/reducers/cartSlice";
import { createOrder, resetCreateStatus } from "../store/reducers/ordersSlice";
import { redeemCoupon } from "../store/reducers/couponsSlice";
import ShippingForm from "../components/checkout/ShippingForm";
import PaymentMethod from "../components/checkout/PaymentMethod";
import OrderSummary from "../components/checkout/OrderSummary";
import { formatPrice } from "../utils/format";
import { getOrderTotals, orderNumber } from "../utils/checkout";
import { showError, showSuccess } from "../utils/notifications";

function OrderPlaced({ order }) {
  return (
    <div className="container py-5 text-center">
      <i className="bi bi-check-circle-fill fs-1 text-success" aria-hidden="true" />
      <h1 className="h3 mt-3">Order placed</h1>
      <p className="mb-1">
        Your order number is <strong>#{orderNumber(order.id)}</strong>.
      </p>
      <p className="text-secondary">
        Please have {formatPrice(order.total)} ready in cash. We'll call {order.customer.phone} to
        confirm delivery to {order.shippingAddress.city}, {order.shippingAddress.governorate}.
      </p>
      <div className="d-flex flex-wrap justify-content-center gap-2">
        <Link to={`/orders/${order.id}`} className="btn btn-accent px-4">View order</Link>
        <Link to="/products" className="btn btn-outline-secondary px-4">Continue shopping</Link>
      </div>
    </div>
  );
}

export default function Checkout() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const cart = useSelector((s) => s.cart);
  const { coupon, discount: couponDiscount } = useSelector((s) => s.coupons);
  const { createStatus: status, createError: error } = useSelector((s) => s.orders);
  const [payment, setPayment] = useState("cod");
  const [placedOrder, setPlacedOrder] = useState(null);

  const loading = status === "loading";
  const appliedCoupon = coupon ? { code: coupon.code, discount: couponDiscount } : null;
  const { total } = getOrderTotals(cart, appliedCoupon);

  useEffect(() => {
    dispatch(resetCreateStatus()); // drop an old error from a previous visit
  }, [dispatch]);

  const handlePlaceOrder = async (values) => {
    if (!user || loading || cart.items.length === 0) return;

    const order = {
      userId: user.id,
      customer: {
        name: values.fullName,
        email: values.email.toLowerCase(),
        phone: values.phone.replace(/[\s-]/g, ""),
      },
      shippingAddress: {
        address: values.address,
        city: values.city,
        governorate: values.governorate,
        postalCode: values.postalCode,
        notes: values.notes,
      },
      items: cart.items.map((i) => ({
        productId: i.id,
        title: i.title,
        thumbnail: i.thumbnail,
        price: i.price,
        listPrice: i.listPrice,
        quantity: i.quantity,
      })),
      paymentMethod: payment,
      currency: "USD",
      ...getOrderTotals(cart, appliedCoupon),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      const created = await dispatch(createOrder(order)).unwrap();
      // Show the confirmation first, so emptying the cart doesn't flash the "empty cart" screen.
      flushSync(() => setPlacedOrder(created));
      dispatch(clearCart());
      if (appliedCoupon) dispatch(redeemCoupon());
      dispatch(showSuccess(`Order #${orderNumber(created.id)} placed.`));
    } catch (err) {
      // the error message is also shown next to the button via the store
      dispatch(showError(typeof err === "string" ? err : "Couldn't place your order. Please try again."));
    }
  };

  if (placedOrder) return <OrderPlaced order={placedOrder} />;

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
      <h1 className="h3 mb-4">Checkout</h1>

      <div className="row g-4">
        <div className="col-lg-7">
          <section className="bg-white border rounded-4 p-4 mb-4">
            <h2 className="h5 mb-3">Shipping details</h2>
            <ShippingForm
              initialValues={{ fullName: user?.name ?? "", email: user?.email ?? "" }}
              onSubmit={handlePlaceOrder}
              disabled={loading}
            />
          </section>

          <section className="bg-white border rounded-4 p-4">
            <h2 className="h5 mb-3">Payment method</h2>
            <PaymentMethod value={payment} onChange={setPayment} />
          </section>
        </div>

        <div className="col-lg-5">
          <OrderSummary>
            {error && (
              <div className="alert alert-danger py-2 mt-4 mb-0" role="alert">
                {error}
              </div>
            )}
            <button
              type="submit"
              form="shipping-form"
              className="btn btn-accent btn-lg w-100 mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Placing order...
                </>
              ) : (
                `Place order — ${formatPrice(total)}`
              )}
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
