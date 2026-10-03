import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders, resetListStatus, selectOrdersByUserId } from "../store/reducers/ordersSlice";
import OrderCard from "../components/orders/OrderCard";
import ProfileReturnLink from "../components/common/ProfileReturnLink";
import { useSearchParams } from "react-router-dom";
import { useT } from "../i18n/useT";

const Skeleton = () => (
  <div className="bg-white border rounded-4 p-4 placeholder-glow" aria-hidden="true">
    <span className="placeholder d-block col-3 mb-2" />
    <span className="placeholder d-block col-5 mb-4" />
    <span className="placeholder d-block col-2 rounded-3 mb-4" style={{ height: 44 }} />
    <span className="placeholder d-block col-12" />
  </div>
);

export default function Orders() {
  const { t } = useT();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const userId = useSelector((s) => s.auth.user?.id);
  const orders = useSelector((s) => selectOrdersByUserId(s, userId));
  const { status, error } = useSelector((s) => s.orders);

  useEffect(() => {
    if (userId === undefined) return;
    const request = dispatch(fetchOrders(userId));
    return () => {
      request.abort(); // ignore a response that arrives after leaving the page
      dispatch(resetListStatus());
    };
  }, [dispatch, userId]);

  const hasOrders = orders.length > 0;

  let body;
  if (!hasOrders && status === "failed") {
    body = (
      <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
        <span>{error ? t(error) : t("We couldn't load your orders.")}</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchOrders(userId))}>
          {t("Try again")}
        </button>
      </div>
    );
  } else if (!hasOrders && (status === "idle" || status === "loading")) {
    body = (
      <div className="d-grid gap-3" aria-busy="true" aria-label={t("Loading orders")}>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    );
  } else if (!hasOrders) {
    body = (
      <div className="text-center py-5">
        <i className="bi bi-receipt fs-1 text-secondary" aria-hidden="true" />
        <p className="h5 mt-3 mb-1">{t("No orders yet")}</p>
        <p className="text-secondary">{t("When you place an order, it will show up here.")}</p>
        <Link to="/products" className="btn btn-accent px-4">{t("Start shopping")}</Link>
      </div>
    );
  } else {
    body = (
      <div className="d-grid gap-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <p className="eyebrow mb-1">{t("My account")}</p>
            <h1 className="h3 mb-1">{t("My orders")}</h1>
          </div>
          {searchParams.get("from") === "profile" && <ProfileReturnLink />}
        </div>
        {hasOrders && (
          <p className="small text-secondary mb-0">
            {t("count.orders", { count: orders.length })}
          </p>
        )}
      </div>
      {body}
    </div>
  );
}
