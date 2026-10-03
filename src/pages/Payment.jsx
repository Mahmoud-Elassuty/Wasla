import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearCart, validateCartInventory } from "../store/reducers/cartSlice";
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
import { useT } from "../i18n/useT";

function OrderPlaced({ order, inventoryFailures = [] }) {
  const { t } = useT();
  const paidOnline = order.paymentMethod !== "cod";
  const isGuest = order.isGuest === true;
  return (
    <div className="container py-5 text-center">
      <i className="bi bi-check-circle-fill fs-1 text-success" aria-hidden="true" />
      <h1 className="h3 mt-3">{t("Order placed")}</h1>
      <p className="mb-1">
        {t("Your order number is")} <strong dir="ltr"><bdi>#{orderNumber(order.id)}</bdi></strong>.
      </p>
      <p className="text-secondary">
        {paidOnline ? (
          <>{t("Payment of {amount} was received.", { amount: formatPrice(order.total) })} </>
        ) : (
          <>{t("Please have {amount} ready in cash.", { amount: formatPrice(order.total) })} </>
        )}
        {t("We'll call {phone} to confirm delivery to {place}.", { phone: order.customer.phone, place: `${order.shippingAddress.city}, ${t(`gov.${order.shippingAddress.governorate}`) === `gov.${order.shippingAddress.governorate}` ? order.shippingAddress.governorate : t(`gov.${order.shippingAddress.governorate}`)}` })}
      </p>
      {inventoryFailures.length > 0 && (
        <div className="alert alert-warning text-start mx-auto" role="alert" style={{ maxWidth: 620 }}>
          <p className="fw-semibold mb-1">{t("The order was placed, but some stock updates failed.")}</p>
          <ul className="mb-0">
            {inventoryFailures.map((failure) => <li key={failure}>{t(failure)}</li>)}
          </ul>
          <p className="small mb-0 mt-2">{t("Do not retry this order. Contact support to reconcile inventory.")}</p>
        </div>
      )}
      {isGuest && (
        <p className="text-secondary small">
          {t("A confirmation is being sent to {email}. Keep your order number for reference.", { email: order.customer.email })}
        </p>
      )}
      <div className="d-flex flex-wrap justify-content-center gap-2">
        {/* Order history is for signed-in customers only, so guests don't get this link. */}
        {!isGuest && <Link to={`/orders/${order.id}`} className="btn btn-accent px-4">{t("View order")}</Link>}
        <Link to="/products" className={`btn px-4 ${isGuest ? "btn-accent" : "btn-outline-secondary"}`}>
          {t("Continue shopping")}
        </Link>
      </div>
    </div>
  );
}

export default function Payment() {
  const { t } = useT();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const shipping = location.state?.shipping;

  const user = useSelector((s) => s.auth.user);
  const cart = useSelector((s) => s.cart);
  const { coupon, discount: couponDiscount } = useSelector((s) => s.coupons);
  const { createStatus: orderStatus, createError: orderError } = useSelector((s) => s.orders);
  const { status: paymentStatus, error: paymentError } = useSelector((s) => s.payment);

  const [method, setMethod] = useState("cod");
  const [placedOrder, setPlacedOrder] = useState(null);
  const [inventoryFailures, setInventoryFailures] = useState([]);
  // Redux status only flips on the next render, so a fast double click could otherwise slip through.
  const submittingRef = useRef(false);
  const completedOrderIdRef = useRef(null);
  const isGuest = !user;

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
    if (completedOrderIdRef.current !== null) return null;
    const order = {
      // Guest orders have no account: userId stays null and the contact details live on the order.
      userId: isGuest ? null : user.id,
      ...(isGuest ? { isGuest: true } : {}),
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
      const placement = await dispatch(createOrder(order)).unwrap();
      const created = placement.order;
      completedOrderIdRef.current = created.id;
      setInventoryFailures(placement.inventoryFailures);
      // Show the confirmation first, so emptying the cart doesn't flash the "empty cart" screen.
      flushSync(() => setPlacedOrder(created));
      dispatch(clearCart());
      if (appliedCoupon) dispatch(redeemCoupon());
      if (placement.inventoryFailures.length === 0) {
        dispatch(showSuccess(t("Order #{number} placed.", { number: orderNumber(created.id) })));
      } else {
        dispatch(showError(t("Order #{number} was placed, but some stock updates failed. Do not retry this order.", { number: orderNumber(created.id) })));
      }
      // Fire-and-forget: the confirmation screen shouldn't wait through the mock email delay.
      dispatch(sendOrderConfirmation(created))
        .unwrap()
        .then(() => dispatch(showSuccess(t("Confirmation email sent to {email}.", { email: created.customer.email }))))
        .catch(() => {}); // the order itself already succeeded; a failed mock email isn't fatal
      return created;
    } catch (err) {
      const message = typeof err === "string" ? err : t("Couldn't place your order. Please try again.");
      dispatch(showError(message));
      if (
        message.includes("Return to your cart") ||
        message.includes("Stock for") ||
        message.includes("Current stock could not be checked")
      ) navigate("/cart");
      return null;
    }
  };

  const checkInventory = async () => {
    try {
      const result = await dispatch(validateCartInventory()).unwrap();
      if (result.issues.length === 0) return true;
      dispatch(showError(result.issues.join(" ")));
    } catch (error) {
      dispatch(showError(typeof error === "string" ? error : t("Current stock could not be checked.")));
    }
    navigate("/cart");
    return false;
  };

  const handleCod = async () => {
    if (busy || submittingRef.current) return;
    submittingRef.current = true;
    try {
      if (!(await checkInventory())) return;
      await submitOrder({ paymentMethod: "cod", paymentStatus: "pending" });
    } finally {
      submittingRef.current = false;
    }
  };

  // Shared by card/PayPal/wallet: run the mock gateway, then place the order and link the two.
  const handleGatewayPayment = async (methodKey) => {
    if (busy || submittingRef.current) return;
    submittingRef.current = true;
    try {
      if (!(await checkInventory())) return;
      const transaction = await dispatch(processPayment({ method: methodKey, amount: total })).unwrap();
      const created = await submitOrder({
        paymentMethod: methodKey,
        transactionId: transaction.transactionId,
        paymentStatus: "paid",
      });
      if (created) dispatch(linkPaymentToOrder({ paymentId: transaction.id, orderId: created.id }));
    } catch {
      // the decline reason is already in the store and shown next to the active method
    } finally {
      submittingRef.current = false;
    }
  };

  if (placedOrder) return <OrderPlaced order={placedOrder} inventoryFailures={inventoryFailures} />;

  if (!shipping) return <Navigate to="/checkout" replace />;

  if (cart.items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-bag fs-1 text-secondary" aria-hidden="true" />
        <h1 className="h4 mt-3">{t("Your cart is empty")}</h1>
        <p className="text-secondary">{t("Add something to your cart before checking out.")}</p>
        <Link to="/products" className="btn btn-accent px-4">{t("Continue shopping")}</Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h3 mb-1">{t("Payment Method")}</h1>
      <p className="text-secondary small mb-4">{t("Step 2 of 2 — Payment")}</p>
      {orderError && (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{orderError}</span>
          <Link to="/cart" className="btn btn-sm btn-outline-danger">{t("Review cart")}</Link>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-7">
          <section className="bg-white border rounded-4 p-3 p-sm-4 mb-4">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
              <h2 className="h6 mb-0">{t("Shipping to")}</h2>
              <Link
                to="/checkout"
                state={isGuest ? { guest: true, shipping } : undefined}
                className="small"
              >
                {t("Edit")}
              </Link>
            </div>
            <p className="small text-secondary text-break mb-0">
              {shipping.fullName} &middot; {shipping.phone}
              <br />
              {shipping.address}, {shipping.city}, {shipping.governorate}
              {shipping.postalCode ? ` ${shipping.postalCode}` : ""}
            </p>
          </section>

          <section className="bg-white border rounded-4 p-3 p-sm-4 mb-4">
            <h2 className="h5 mb-3">{t("Payment method")}</h2>
            <PaymentMethod value={method} onChange={busy ? () => {} : setMethod} />
          </section>

          <section className="bg-white border rounded-4 p-4">
            {method === "cod" && (
              <>
                <p className="text-secondary small mb-3">
                  {t("Pay {amount} in cash when your order arrives.", { amount: formatPrice(total) })}
                </p>
                <button type="button" className="btn btn-accent btn-lg w-100" disabled={busy} onClick={handleCod}>
                  {creatingOrder ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                      {t("Placing order...")}
                    </>
                  ) : (
                    t("Place order — {price}", { price: formatPrice(total) })
                  )}
                </button>
              </>
            )}

            {method === "credit_card" && (
              <CreditCardForm
                amount={total}
                processing={busy}
                error={paymentError}
                onSubmit={() => handleGatewayPayment("credit_card")}
              />
            )}

            {method === "paypal" && (
              <PaypalButton
                amount={total}
                processing={busy}
                error={paymentError}
                onConfirm={() => handleGatewayPayment("paypal")}
              />
            )}

            {method === "wallet" && (
              <WalletButton
                amount={total}
                processing={busy}
                error={paymentError}
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
