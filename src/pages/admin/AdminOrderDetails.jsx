import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminUsers,
  updateOrderStatus,
} from "../../store/reducers/adminSlice";
import OrderStatus from "../../components/orders/OrderStatus";
import { formatPrice } from "../../utils/format";
import { ORDER_STATUSES, PAYMENT_METHOD_LABELS, formatOrderDate, orderNumber } from "../../utils/checkout";
import { showError, showSuccess } from "../../utils/notifications";
import { useT } from "../../i18n/useT";

const BackLink = () => {
  const { t, te } = useT();
  return (
  <Link to="/admin/orders" className="btn btn-outline-secondary">
    <i className="bi bi-arrow-left me-1" aria-hidden="true" />
    {t("Back to orders")}
  </Link>
  );
};

const label = (s) => s[0].toUpperCase() + s.slice(1);

// "paid" -> green, "pending" -> orange, "failed" -> red, anything else falls back to the
// neutral/orange tone rather than guessing. Reuses the same generic pill classes already used
// for Active/Inactive and discount badges elsewhere, rather than inventing new CSS.
const PAYMENT_STATUS_TONE = { paid: "stock-ok", success: "stock-ok", pending: "stock-low", failed: "stock-out" };

function OrderView({ order, sellerOf, updating }) {
  const { t, te } = useT();
  const dispatch = useDispatch();
  const { customer = {}, shippingAddress: ship = {}, items = [] } = order;
  const payment = PAYMENT_METHOD_LABELS[order.paymentMethod] ?? { label: order.paymentMethod ?? "-", ar: null };
  const paymentStatusTone = PAYMENT_STATUS_TONE[order.paymentStatus] ?? "stock-low";
  const known = ORDER_STATUSES.includes(order.status);

  const handleStatusChange = async (status) => {
    try {
      await dispatch(updateOrderStatus({ id: order.id, status })).unwrap();
      dispatch(showSuccess(t("Order #{number} marked {status}.", { number: orderNumber(order.id), status: te("order", status) })));
    } catch (err) {
      dispatch(showError(typeof err === "string" ? err : "Couldn't update the order status."));
    }
  };

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
            <h2 className="h5 mb-3">
              {t("Items")} <span className="text-secondary fw-normal">({items.length})</span>
            </h2>
            <ul className="list-unstyled mb-0">
              {items.map((item, i) => (
                <li key={`${item.productId}-${i}`} className="cart-item d-flex gap-3 py-3">
                  <Link to={`/products/${item?.productId ?? ""}`} className="cart-thumb flex-shrink-0">
                    {item?.thumbnail ? (
                      <img src={item.thumbnail} alt="" />
                    ) : (
                      <span className="d-flex h-100 align-items-center justify-content-center text-secondary" aria-label={t("Product image unavailable")}>
                        <i className="bi bi-image" aria-hidden="true" />
                      </span>
                    )}
                  </Link>
                  <div className="flex-grow-1 min-w-0">
                    <Link to={`/products/${item?.productId ?? ""}`} className="fw-semibold text-body text-decoration-none">
                      {item?.title ?? "Product unavailable"}
                    </Link>
                    <div className="small text-secondary">
                      {formatPrice(item?.price ?? 0)} × {item?.quantity ?? 0}
                    </div>
                    <div className="small text-secondary">
                      Sold by: {sellerOf(item?.productId)}
                    </div>
                  </div>
                  <span className="font-display fw-semibold flex-shrink-0">
                    {formatPrice((item?.price ?? 0) * (item?.quantity ?? 0))}
                  </span>
                </li>
              ))}
              {items.length === 0 && (
                <li className="text-center text-secondary py-4">{t("This order has no items on record.")}</li>
              )}
            </ul>
          </section>

          <div className="row g-4">
            <div className="col-md-6">
              <section className="bg-white border rounded-4 p-4 h-100">
                <h2 className="h5 mb-3">
                  {t("Customer")}
                  {order.isGuest && <span className="badge rounded-pill stock-low ms-2 fs-6">{t("Guest")}</span>}
                </h2>
                <p className="fw-semibold mb-1">{customer.name ?? "-"}</p>
                <p className="mb-1 text-break">{customer.email ?? "-"}</p>
                <p className="mb-0" dir="ltr">{customer.phone ?? "-"}</p>
              </section>
            </div>
            <div className="col-md-6">
              <section className="bg-white border rounded-4 p-4 h-100">
                <h2 className="h5 mb-3">{t("Shipping address")}</h2>
                <p className="fw-semibold mb-1">{ship.recipientName ?? ship.fullName ?? ship.name ?? customer.name ?? "-"}</p>
                <p className="mb-1" dir="ltr">{ship.phone ?? customer.phone ?? "-"}</p>
                <p className="mb-1">{ship.address ?? "-"}</p>
                <p className="mb-1">
                  {[ship.city, ship.governorate].filter(Boolean).join(", ") || "-"}
                  {ship.postalCode ? ` ${ship.postalCode}` : ""}
                </p>
                {ship.notes && <p className="small text-secondary mb-0">Note: {ship.notes}</p>}
              </section>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <aside className="checkout-summary bg-white border rounded-4 p-4" aria-label={t("Order summary")}>
            <h2 className="h5 mb-3">{t("Totals")}</h2>
            <dl className="d-grid gap-2 mb-0">
              <div className="d-flex justify-content-between">
                <dt className="fw-normal text-secondary">{t("Subtotal")}</dt>
                <dd className="mb-0">{formatPrice(order.subtotal ?? 0)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="d-flex justify-content-between text-success">
                  <dt className="fw-normal">{t("Product discount")}</dt>
                  <dd className="mb-0">−{formatPrice(order.discount)}</dd>
                </div>
              )}
              {order.couponCode && (
                <div className="d-flex justify-content-between text-success">
                  <dt className="fw-normal">Coupon ({order.couponCode})</dt>
                  <dd className="mb-0">−{formatPrice(order.couponDiscount ?? 0)}</dd>
                </div>
              )}
              <div className="d-flex justify-content-between">
                <dt className="fw-normal text-secondary">{t("Shipping")}</dt>
                <dd className="mb-0">{formatPrice(order.shipping ?? 0)}</dd>
              </div>
              <div className="d-flex justify-content-between fs-5 fw-semibold border-top pt-2 mt-1">
                <dt className="fw-semibold">{t("Total")}</dt>
                <dd className="mb-0 font-display">{formatPrice(order.total ?? 0)}</dd>
              </div>
            </dl>

            <div className="border-top mt-3 pt-3">
              <p className="small text-secondary mb-1">{t("Payment method")}</p>
              <p className="fw-semibold mb-2">{payment.label}</p>
              {order.paymentStatus && (
                <span className={`badge rounded-pill ${paymentStatusTone}`}>{label(order.paymentStatus)}</span>
              )}
              {order.transactionId && (
                <p className="small text-secondary mt-2 mb-0 text-break">Txn: {order.transactionId}</p>
              )}
            </div>

            <div className="border-top mt-3 pt-3">
              <label htmlFor="admin-order-status" className="small text-secondary mb-2 d-block">
                {t("Update status")}
              </label>
              <select
                id="admin-order-status"
                className="form-select"
                value={order.status}
                disabled={updating}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                {!known && <option value={order.status}>{order.status ?? "Unknown"}</option>}
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{label(s)}</option>
                ))}
              </select>
              {updating && <p className="small text-secondary mt-2 mb-0">{t("Updating...")}</p>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrderDetails() {
  const { t, te } = useT();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { orders, ordersStatus, ordersError, products, users, updatingOrderIds } = useSelector((s) => s.admin);

  useEffect(() => {
    const a = dispatch(fetchAdminOrders());
    const b = dispatch(fetchAdminProducts());
    const c = dispatch(fetchAdminUsers());
    return () => {
      a.abort();
      b.abort();
      c.abort();
    };
  }, [dispatch]);

  // Resolves an item's seller/store name from the already-loaded products + users lists — falls
  // back gracefully (never crashes) if either hasn't loaded yet or the product/seller is gone.
  const sellerOf = useMemo(() => {
    const productById = new Map(products.map((p) => [p.id, p]));
    const userById = new Map(users.map((u) => [u.id, u]));
    return (productId) => {
      const product = productById.get(productId);
      if (!product?.sellerId) return "-";
      const seller = userById.get(product.sellerId);
      return seller?.storeName || seller?.name || "-";
    };
  }, [products, users]);

  const order = orders.find((o) => String(o.id) === id);
  const updating = order ? updatingOrderIds.includes(order.id) : false;

  if (order) return <OrderView order={order} sellerOf={sellerOf} updating={updating} />;

  const retry = () => {
    dispatch(fetchAdminOrders());
    dispatch(fetchAdminProducts());
    dispatch(fetchAdminUsers());
  };

  if (ordersStatus === "failed") {
    return (
      <div className="container py-5 text-center">
        <h1 className="h4">{t("We couldn't load this order")}</h1>
        <p className="text-secondary">{ordersError || "Something went wrong."}</p>
        <div className="d-flex justify-content-center gap-2">
          <button type="button" className="btn btn-outline-danger" onClick={retry}>{t("Try again")}</button>
          <BackLink />
        </div>
      </div>
    );
  }

  if (ordersStatus === "succeeded") {
    return (
      <div className="container py-5 text-center">
        <h1 className="h4">{t("We couldn't find this order")}</h1>
        <p className="text-secondary">{t("It may have been deleted, or the link is incorrect.")}</p>
        <BackLink />
      </div>
    );
  }

  // Still loading — products/users loading state doesn't block showing the order itself once it
  // arrives; "Sold by" just falls back to "-" until they're ready (see sellerOf above).
  return (
    <div className="container py-5 text-center" role="status">
      <div className="spinner-border text-primary" />
      <span className="visually-hidden">{t("Loading order...")}</span>
    </div>
  );
}
