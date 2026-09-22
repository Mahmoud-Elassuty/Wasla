import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearCurrentOrder, fetchOrderById } from "../store/reducers/ordersSlice";
import OrderStatus from "../components/orders/OrderStatus";
import { formatPrice } from "../utils/format";
import { PAYMENT_METHOD_LABELS, formatOrderDate, orderItemCount, orderNumber } from "../utils/checkout";

const BackLink = () => (
  <Link to="/orders" className="btn btn-outline-secondary">
    <i className="bi bi-arrow-left me-1" aria-hidden="true" />
    Back to orders
  </Link>
);

function OrderView({ order }) {
  const { customer = {}, shippingAddress: ship = {}, items = [] } = order;
  const payment = PAYMENT_METHOD_LABELS[order.paymentMethod] ?? { label: order.paymentMethod ?? "-", ar: null };
  const count = orderItemCount(order);

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="eyebrow mb-1">Order details</p>
          <h1 className="h3 mb-2">
            تفاصيل الطلب <bdi>#{orderNumber(order.id)}</bdi>
          </h1>
          <div className="d-flex flex-wrap align-items-center gap-2 small text-secondary">
            <span>Placed on {formatOrderDate(order.createdAt, true)}</span>
            <OrderStatus status={order.status} />
          </div>
        </div>
        <BackLink />
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <section className="bg-white border rounded-4 px-3 px-md-4 pt-3 pb-1 mb-4">
            <h2 className="h5 mb-1">
              Items <span className="text-secondary fw-normal">({count})</span>
            </h2>
            <ul className="list-unstyled mb-0">
              {items.map((item, i) => (
                <li key={`${item.productId}-${i}`} className="cart-item d-flex gap-3 py-3">
                  <Link to={`/products/${item.productId}`} className="cart-thumb flex-shrink-0">
                    <img src={item.thumbnail} alt="" />
                  </Link>
                  <div className="flex-grow-1 min-w-0">
                    <Link to={`/products/${item.productId}`} className="fw-semibold text-body text-decoration-none">
                      {item.title}
                    </Link>
                    <div className="small text-secondary">
                      {formatPrice(item.price)} × {item.quantity}
                      {item.listPrice > item.price && (
                        <span className="price-old ms-2">{formatPrice(item.listPrice)}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-display fw-semibold flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="row g-4">
            <div className="col-md-6">
              <section className="bg-white border rounded-4 p-4 h-100">
                <h2 className="h5 mb-3">Customer</h2>
                <p className="fw-semibold mb-1">{customer.name ?? "-"}</p>
                <p className="mb-1 text-break">{customer.email ?? "-"}</p>
                <p className="mb-0" dir="ltr">{customer.phone ?? "-"}</p>
              </section>
            </div>
            <div className="col-md-6">
              <section className="bg-white border rounded-4 p-4 h-100">
                <h2 className="h5 mb-3">Shipping address</h2>
                <p className="mb-1">{ship.address ?? "-"}</p>
                <p className="mb-1">
                  {[ship.city, ship.governorate].filter(Boolean).join(", ")}
                  {ship.postalCode ? ` ${ship.postalCode}` : ""}
                </p>
                {ship.notes && (
                  <p className="small text-secondary mb-0">
                    <span className="fw-semibold">Notes:</span> {ship.notes}
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <aside className="checkout-summary bg-white border rounded-4 p-4" aria-label="Order summary">
            <h2 className="h5 mb-3">Order summary</h2>
            <dl className="d-grid gap-2 mb-0">
              <div className="d-flex justify-content-between">
                <dt className="fw-normal text-secondary">Subtotal</dt>
                <dd className="mb-0">{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="d-flex justify-content-between text-success">
                  <dt className="fw-normal">Discount</dt>
                  <dd className="mb-0">-{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="d-flex justify-content-between">
                <dt className="fw-normal text-secondary">Shipping</dt>
                <dd className="mb-0">{formatPrice(order.shipping)}</dd>
              </div>
              <div className="d-flex justify-content-between border-top pt-3 mt-1 fs-5 fw-semibold">
                <dt className="fw-semibold">Total</dt>
                <dd className="mb-0 font-display">{formatPrice(order.total)}</dd>
              </div>
            </dl>

            <div className="border-top mt-3 pt-3">
              <p className="small text-secondary mb-1">Payment method</p>
              <p className="fw-semibold mb-0">
                {payment.label}
                {payment.ar && (
                  <span className="text-secondary fw-normal ms-2" lang="ar" dir="rtl">
                    {payment.ar}
                  </span>
                )}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const userId = useSelector((s) => s.auth.user?.id);
  const { currentOrder, detailsStatus, detailsError } = useSelector((s) => s.orders);

  useEffect(() => {
    const request = dispatch(fetchOrderById(id));
    return () => {
      request.abort();
      dispatch(clearCurrentOrder());
    };
  }, [dispatch, id]);

  const order = currentOrder && String(currentOrder.id) === id ? currentOrder : null;

  // Only the owner may see an order. Someone else's order looks exactly like a missing one.
  // (JSON Server can't enforce this: a real backend must check ownership itself.)
  if (order && String(order.userId) === String(userId)) return <OrderView order={order} />;

  if (order || detailsStatus === "failed") {
    return (
      <div className="container py-5 text-center">
        <h1 className="h4">We couldn't find this order</h1>
        <p className="text-secondary">{order ? "Order not found." : detailsError}</p>
        <BackLink />
      </div>
    );
  }

  return (
    <div className="container py-5 text-center" role="status">
      <div className="spinner-border text-primary" />
      <span className="visually-hidden">Loading order...</span>
    </div>
  );
}
