import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchSellerOrders, fetchSellerProducts, updateOrderStatus } from "../../store/reducers/sellerSlice";
import OrderStatus from "../../components/orders/OrderStatus";
import { formatPrice } from "../../utils/format";
import { NEXT_STATUS_OPTIONS, PAYMENT_METHOD_LABELS, formatOrderDate, orderNumber } from "../../utils/checkout";
import { useT } from "../../i18n/useT";

const BackLink = () => {
  const { t, te } = useT();
  return (
  <Link to="/seller/orders" className="btn btn-outline-secondary">
    <i className="bi bi-arrow-left me-1" aria-hidden="true" />
    {t("Back to orders")}
  </Link>
  );
};

const label = (s) => s[0].toUpperCase() + s.slice(1);

function OrderView({ order, updating }) {
  const { t, te } = useT();
  const dispatch = useDispatch();
  const { customer = {}, shippingAddress: ship = {}, sellerItems = [] } = order;
  const payment = PAYMENT_METHOD_LABELS[order.paymentMethod] ?? { label: order.paymentMethod ?? "-", ar: null };
  const nextOptions = NEXT_STATUS_OPTIONS[order.status] ?? [];
  const otherVendorsTotal = order.total - order.sellerSubtotal;

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="eyebrow mb-1">{t("Order details")}</p>
          <h1 className="h3 mb-2">{t("order.titleWithNumber", { number: "#" + orderNumber(order.id) })}</h1>
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
              {t("Your items")} <span className="text-secondary fw-normal">({sellerItems.length})</span>
            </h2>
            {otherVendorsTotal > 0 && (
              <p className="small text-secondary">
                {t("This order also includes items from other vendors — only your own are shown here.")}
              </p>
            )}
            <ul className="list-unstyled mb-0">
              {sellerItems.map((item, i) => (
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
                <h2 className="h5 mb-3">{t("Customer")}</h2>
                <p className="fw-semibold mb-1">{customer.name ?? "-"}</p>
                <p className="mb-1 text-break">{customer.email ?? "-"}</p>
                <p className="mb-0" dir="ltr">{customer.phone ?? "-"}</p>
              </section>
            </div>
            <div className="col-md-6">
              <section className="bg-white border rounded-4 p-4 h-100">
                <h2 className="h5 mb-3">{t("Shipping address")}</h2>
                <p className="mb-1">{ship.address ?? "-"}</p>
                <p className="mb-0">
                  {[ship.city, ship.governorate].filter(Boolean).join(", ")}
                  {ship.postalCode ? ` ${ship.postalCode}` : ""}
                </p>
              </section>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <aside className="checkout-summary bg-white border rounded-4 p-4" aria-label={t("Order summary")}>
            <h2 className="h5 mb-3">{t("Totals")}</h2>
            <dl className="d-grid gap-2 mb-0">
              <div className="d-flex justify-content-between fs-5 fw-semibold">
                <dt className="fw-semibold">{t("Your total")}</dt>
                <dd className="mb-0 font-display">{formatPrice(order.sellerSubtotal)}</dd>
              </div>
              {otherVendorsTotal > 0 && (
                <div className="d-flex justify-content-between text-secondary small">
                  <dt className="fw-normal">{t("Full order total (all vendors)")}</dt>
                  <dd className="mb-0">{formatPrice(order.total)}</dd>
                </div>
              )}
            </dl>

            <div className="border-top mt-3 pt-3">
              <p className="small text-secondary mb-1">{t("Payment method")}</p>
              <p className="fw-semibold mb-0">{payment.label}</p>
            </div>

            <div className="border-top mt-3 pt-3">
              <p className="small text-secondary mb-2">{t("Update status")}</p>
              {nextOptions.length === 0 ? (
                <p className="small text-secondary mb-0">{t("This order is in a final state.")}</p>
              ) : (
                <select
                  className="form-select"
                  aria-label={t("Update order status")}
                  value=""
                  disabled={updating}
                  onChange={(e) => dispatch(updateOrderStatus({ id: order.id, status: e.target.value }))}
                >
                  <option value="" disabled>
                    {updating ? "Updating..." : "Choose a status"}
                  </option>
                  {nextOptions.map((s) => (
                    <option key={s} value={s}>{t("Mark {status}", { status: te("order", s) })}</option>
                  ))}
                </select>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function SellerOrderDetails() {
  const { t, te } = useT();
  const { id } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { products, productsStatus, orders, ordersStatus, ordersError, updatingOrderIds } = useSelector(
    (s) => s.seller
  );

  useEffect(() => {
    if (user?.id === undefined) return;
    const request = dispatch(fetchSellerProducts(user.id));
    return () => request.abort();
  }, [dispatch, user?.id]);

  const sellerProductIds = useMemo(() => products.map((p) => p.id), [products]);

  useEffect(() => {
    if (productsStatus !== "succeeded" || sellerProductIds.length === 0) return;
    const request = dispatch(fetchSellerOrders(sellerProductIds));
    return () => request.abort();
  }, [dispatch, productsStatus, sellerProductIds]);

  const order = orders.find((o) => String(o.id) === id);
  const updating = updatingOrderIds.includes(Number(id));

  if (order) return <OrderView order={order} updating={updating} />;

  const settled = productsStatus === "succeeded" || productsStatus === "failed" || ordersStatus === "failed";
  if (settled && ordersStatus !== "loading") {
    return (
      <div className="container py-5 text-center">
        <h1 className="h4">{t("We couldn't find this order")}</h1>
        <p className="text-secondary">
          {ordersError || "It may not exist, or it doesn't include any of your products."}
        </p>
        <BackLink />
      </div>
    );
  }

  return (
    <div className="container py-5 text-center" role="status">
      <div className="spinner-border text-primary" />
      <span className="visually-hidden">{t("Loading order...")}</span>
    </div>
  );
}
