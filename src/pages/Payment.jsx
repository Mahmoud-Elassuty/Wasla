import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "../store/reducers/cartSlice";
import { createOrder, resetCreateStatus } from "../store/reducers/ordersSlice";
import { sendOrderConfirmation } from "../store/reducers/emailSlice";
import { redeemCoupon } from "../store/reducers/couponsSlice";
import { linkPaymentToOrder, processPayment, resetPayment } from "../store/reducers/paymentSlice";
import PaymentMethod from "../components/checkout/PaymentMethod";
import OrderSummary from "../components/checkout/OrderSummary";
import CreditCardForm from "../components/payment/CreditCardForm";
import PaypalButton from "../components/payment/PaypalButton";
import WalletButton from "../components/payment/WalletButton";
import { formatPrice } from "../utils/format";
import { getOrderTotals, orderNumber } from "../utils/checkout";
import { showError, showSuccess } from "../utils/notifications";
import "../styles/payment.css";

function OrderPlaced({ order }) {
  const paidOnline = order.paymentMethod !== "cod";
  return (
    <div className="container py-5 text-center">
      <i className="bi bi-check-circle-fill fs-1 text-success" aria-hidden="true" />
      <h1 className="h3 mt-3">Order placed</h1>
      <p className="mb-1">
        Your order number is <strong>#{orderNumber(order.id)}</strong>.
      </p>
      <p className="text-secondary">
        {paidOnline ? (
          <>Payment of {formatPrice(order.total)} was received. </>
        ) : (
          <>Please have {formatPrice(order.total)} ready in cash. </>
        )}
        We'll call {order.customer.phone} to confirm delivery to {order.shippingAddress.city},{" "}
        {order.shippingAddress.governorate}.
      </p>
      <div className="d-flex flex-wrap justify-content-center gap-2">
        <Link to={`/orders/${order.id}`} className="btn btn-accent px-4">View order</Link>
        <Link to="/products" className="btn btn-outline-secondary px-4">Continue shopping</Link>
      </div>
    </div>
  );
}

export default function Payment() {
  const dispatch = useDispatch();
  const location = useLocation();
  const shipping = location.state?.shipping;

  const user = useSelector((s) => s.auth.user);
  const cart = useSelector((s) => s.cart);
  const { coupon, discount: couponDiscount } = useSelector((s) => s.coupons);
  const { createStatus: orderStatus, createError: orderError } = useSelector((s) => s.orders);
  const { status: paymentStatus, error: paymentError } = useSelector((s) => s.payment);

  const [method, setMethod] = useState("cod");
  const [placedOrder, setPlacedOrder] = useState(null);

  const appliedCoupon = coupon ? { code: coupon.code, discount: couponDiscount } : null;
  const { total } = getOrderTotals(cart, appliedCoupon);
  const creatingOrder = orderStatus === "loading";
  const processingPayment = paymentStatus === "loading";
  const busy = creatingOrder || processingPayment;

  useEffect(() => {
    dispatch(resetCreateStatus()); // drop a stale error from a previous visit
  }, [dispatch]);

  // Clear any leftover payment error/status whenever the person switches methods.
  useEffect(() => {
    dispatch(resetPayment());
  }, [method, dispatch]);

  const submitOrder = async ({ paymentMethod, transactionId, paymentStatus: payStatus }) => {
    const order = {
      userId: user.id,
      customer: {
        name: shipping.fullName,
        email: shipping.email.toLowerCase(),
        phone: shipping.phone.replace(/[\s-]/g, ""),
      },
      shippingAddress: {
        address: shipping.address,
        city: shipping.city,
        governorate: shipping.governorate,
        postalCode: shipping.postalCode,
        notes: shipping.notes,
      },
      items: cart.items.map((i) => ({
        productId: i.id,
        title: i.title,
        thumbnail: i.thumbnail,
        price: i.price,
        listPrice: i.listPrice,
        quantity: i.quantity,
      })),
      paymentMethod,
      paymentStatus: payStatus,
      ...(transactionId ? { transactionId } : {}),
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
      // Fire-and-forget: the confirmation screen shouldn't wait through the mock email delay.
      dispatch(sendOrderConfirmation(created))
        .unwrap()
        .then(() => dispatch(showSuccess(`Confirmation email sent to ${created.customer.email}.`)))
        .catch(() => {}); // the order itself already succeeded; a failed mock email isn't fatal
      return created;
    } catch (err) {
      dispatch(showError(typeof err === "string" ? err : "Couldn't place your order. Please try again."));
      return null;
    }
  };

  const handleCod = () => {
    if (!user || busy) return;
    submitOrder({ paymentMethod: "cod", paymentStatus: "pending" });
  };

  // Shared by card/PayPal/wallet: run the mock gateway, then place the order and link the two.
  const handleGatewayPayment = async (methodKey) => {
    if (!user || busy) return;
    try {
      const transaction = await dispatch(processPayment({ method: methodKey, amount: total })).unwrap();
      const created = await submitOrder({
        paymentMethod: methodKey,
        transactionId: transaction.transactionId,
        paymentStatus: "paid",
      });
      if (created) dispatch(linkPaymentToOrder({ paymentId: transaction.id, orderId: created.id }));
    } catch {
      // the decline reason is already in the store and shown next to the active method
    }
  };

  if (placedOrder) return <OrderPlaced order={placedOrder} />;

  if (!shipping) return <Navigate to="/checkout" replace />;

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
      <h1 className="h3 mb-1">Payment Method</h1>
      <p className="text-secondary small mb-4">Step 2 of 2 — Payment</p>

      <div className="row g-4">
        <div className="col-lg-7">
          <section className="bg-white border rounded-4 p-4 mb-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h2 className="h6 mb-0">Shipping to</h2>
              <Link to="/checkout" className="small">Edit</Link>
            </div>
            <p className="small text-secondary mb-0">
              {shipping.fullName} &middot; {shipping.phone}
              <br />
              {shipping.address}, {shipping.city}, {shipping.governorate}
              {shipping.postalCode ? ` ${shipping.postalCode}` : ""}
            </p>
          </section>

          <section className="bg-white border rounded-4 p-4 mb-4">
            <h2 className="h5 mb-3">Payment method</h2>
            <PaymentMethod value={method} onChange={busy ? () => {} : setMethod} />
          </section>

          <section className="bg-white border rounded-4 p-4">
            {method === "cod" && (
              <>
                <p className="text-secondary small mb-3">
                  Pay {formatPrice(total)} in cash when your order arrives.
                </p>
                {orderError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {orderError}
                  </div>
                )}
                <button type="button" className="btn btn-accent btn-lg w-100" disabled={busy} onClick={handleCod}>
                  {creatingOrder ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                      Placing order...
                    </>
                  ) : (
                    `Place order — ${formatPrice(total)}`
                  )}
                </button>
              </>
            )}

            {method === "credit_card" && (
              <CreditCardForm
                amount={total}
                processing={busy}
                error={paymentError || orderError}
                onSubmit={() => handleGatewayPayment("credit_card")}
              />
            )}

            {method === "paypal" && (
              <PaypalButton
                amount={total}
                processing={busy}
                error={paymentError || orderError}
                onConfirm={() => handleGatewayPayment("paypal")}
              />
            )}

            {method === "wallet" && (
              <WalletButton
                amount={total}
                processing={busy}
                error={paymentError || orderError}
                onConfirm={() => handleGatewayPayment("wallet")}
              />
            )}
          </section>
        </div>

        <div className="col-lg-5">
          <OrderSummary paymentMethod={method} />
        </div>
      </div>
    </div>
  );
}
