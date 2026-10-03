import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearCurrentOrder, fetchOrderById } from "../store/reducers/ordersSlice";
import OrderStatus from "../components/orders/OrderStatus";
import { formatPrice } from "../utils/format";
import { tGov } from "../i18n";
import { formatOrderDate, orderItemCount, orderNumber } from "../utils/checkout";
import ProfileReturnLink from "../components/common/ProfileReturnLink";
import { useT } from "../i18n/useT";

const BackLink = ({ fromProfile = false }) => {
  const { t } = useT();
  return fromProfile ? (
    <ProfileReturnLink />
  ) : (
    <Link to="/orders" className="btn btn-outline-secondary">
      <i className="bi bi-arrow-left me-1" aria-hidden="true" />
      {t("Back to orders")}
    </Link>
  );
};

function OrderView({ order, fromProfile }) {
  const { t, te } = useT();
  const { customer = {}, shippingAddress: ship = {}, items = [] } = order;
    const count = orderItemCount(order);

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="eyebrow mb-1">{t("My orders")}</p>
          <h1 className="h3 mb-2">
            {t("Order details")} <bdi dir="ltr">#{orderNumber(order.id)}</bdi>
          </h1>
          <div className="d-flex flex-wrap align-items-center gap-2 small text-secondary">
            <span>{t("Placed on {date}", { date: formatOrderDate(order.createdAt, true) })}</span>
            <OrderStatus status={order.status} />
          </div>
        </div>
        <BackLink fromProfile={fromProfile} />
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <section className="bg-white border rounded-4 px-3 px-md-4 pt-3 pb-1 mb-4">
            <h2 className="h5 mb-1">
              {t("Items")} <span className="text-secondary fw-normal">({count})</span>
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
              <section className="bg-white border rounded-4 p-3 p-sm-4 h-100">
                <h2 className="h5 mb-3">{t("Customer")}</h2>
                <p className="fw-semibold mb-1">{customer.name ?? "-"}</p>
                <p className="mb-1 text-break"><bdi>{customer.email ?? "-"}</bdi></p>
                <p className="mb-0" dir="ltr">{customer.phone ?? "-"}</p>
              </section>
            </div>
            <div className="col-md-6">
              <section className="bg-white border rounded-4 p-3 p-sm-4 h-100">
                <h2 className="h5 mb-3">{t("Shipping address")}</h2>
                <p className="mb-1">{ship.address ?? "-"}</p>
                <p className="mb-1">
                  {[ship.city, ship.governorate && tGov(ship.governorate)].filter(Boolean).join(t(", "))}
                  {ship.postalCode ? ` ${ship.postalCode}` : ""}
                </p>
                {ship.notes && (
                  <p className="small text-secondary mb-0">
                    <span className="fw-semibold">{t("Notes:")}</span> {ship.notes}
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <aside className="checkout-summary bg-white border rounded-4 p-3 p-sm-4" aria-label={t("Order summary")}>
            <h2 className="h5 mb-3">{t("Order summary")}</h2>
            <dl className="d-grid gap-2 mb-0">
              <div className="d-flex justify-content-between">
                <dt className="fw-normal text-secondary">{t("Subtotal")}</dt>
                <dd className="mb-0">{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="d-flex justify-content-between text-success">
                  <dt className="fw-normal">{t("Discount")}</dt>
                  <dd className="mb-0">-{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="d-flex justify-content-between">
                <dt className="fw-normal text-secondary">{t("Shipping")}</dt>
                <dd className="mb-0">{formatPrice(order.shipping)}</dd>
              </div>
              <div className="d-flex justify-content-between border-top pt-3 mt-1 fs-5 fw-semibold">
                <dt className="fw-semibold">{t("Total")}</dt>
                <dd className="mb-0 font-display">{formatPrice(order.total)}</dd>
              </div>
            </dl>

            <div className="border-top mt-3 pt-3">
              <p className="small text-secondary mb-1">{t("Payment method")}</p>
              <p className="fw-semibold mb-0">
                {order.paymentMethod ? te("pay", order.paymentMethod) : "-"}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetails() {
  const { t, te } = useT();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
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
  const fromProfile = searchParams.get("from") === "profile";

  // Only the owner may see an order. Someone else's order looks exactly like a missing one.
  // (JSON Server can't enforce this: a real backend must check ownership itself.)
  if (order && String(order.userId) === String(userId)) return <OrderView order={order} fromProfile={fromProfile} />;

  if (order || detailsStatus === "failed") {
    return (
      <div className="container py-5 text-center">
        <h1 className="h4">{t("We couldn't find this order")}</h1>
        <p className="text-secondary">{order ? t("Order not found.") : t(detailsError)}</p>
        <BackLink fromProfile={fromProfile} />
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
