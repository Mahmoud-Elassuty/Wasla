import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminOrders, resetOrdersStatus, updateOrderStatus } from "../../store/reducers/adminSlice";
import OrderStatus from "../../components/orders/OrderStatus";
import { formatPrice } from "../../utils/format";
import { ORDER_STATUSES, formatOrderDate, orderNumber } from "../../utils/checkout";

const FILTERS = ["all", ...ORDER_STATUSES];
const label = (s) => s[0].toUpperCase() + s.slice(1);

export default function AdminOrders() {
  const dispatch = useDispatch();
  const { orders, ordersStatus, ordersError, updatingOrderIds } = useSelector((s) => s.admin);
  const [params, setParams] = useSearchParams();

  // Filters live in the URL, so the dashboard can link straight to "pending orders".
  const status = FILTERS.includes(params.get("status")) ? params.get("status") : "all";
  const search = params.get("search") ?? "";

  useEffect(() => {
    const request = dispatch(fetchAdminOrders());
    return () => {
      request.abort();
      dispatch(resetOrdersStatus());
    };
  }, [dispatch]);

  const setParam = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== "all") next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );

  const counts = useMemo(() => {
    const c = { all: orders.length };
    ORDER_STATUSES.forEach((s) => (c[s] = orders.filter((o) => o.status === s).length));
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^#/, "");
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!q) return true;
      return (
        orderNumber(o.id).toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.customer?.email?.toLowerCase().includes(q)
      );
    });
  }, [orders, status, search]);

  const hasOrders = orders.length > 0;
  const loading = !hasOrders && (ordersStatus === "idle" || ordersStatus === "loading");
  const failed = !hasOrders && ordersStatus === "failed";

  return (
    <>
      <div className="mb-4">
        <p className="eyebrow mb-1">Orders management</p>
        <h1 className="h3 mb-1">إدارة الطلبات</h1>
        {hasOrders && (
          <p className="small text-secondary mb-0">
            Showing {visible.length} of {orders.length} orders
          </p>
        )}
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-6 col-lg-4">
          <div className="search-box">
            <input
              type="search"
              className="form-control"
              placeholder="Search by order # or customer"
              aria-label="Search orders"
              value={search}
              onChange={(e) => setParam("search", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Filter by status">
        {FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip${status === s ? " active" : ""}`}
            aria-pressed={status === s}
            onClick={() => setParam("status", s)}
          >
            {label(s)} <span className="opacity-75 ms-1">{counts[s]}</span>
          </button>
        ))}
      </div>

      {failed ? (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{ordersError || "We couldn't load the orders."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchAdminOrders())}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="admin-card p-4 placeholder-glow" aria-busy="true" aria-label="Loading orders">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="placeholder d-block col-12 mb-3" style={{ height: 24 }} />
          ))}
        </div>
      ) : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="table admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-end">Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => {
                  const updating = updatingOrderIds.includes(order.id);
                  const known = ORDER_STATUSES.includes(order.status);
                  return (
                    <tr key={order.id}>
                      <td className="fw-semibold">#{orderNumber(order.id)}</td>
                      <td>
                        <div>{order.customer?.name ?? "-"}</div>
                        <div className="small text-secondary">{order.customer?.email}</div>
                      </td>
                      <td className="text-nowrap">{formatOrderDate(order.createdAt)}</td>
                      <td><OrderStatus status={order.status} /></td>
                      <td className="text-end fw-semibold">{formatPrice(order.total)}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          style={{ minWidth: 140 }}
                          aria-label={`Update status of order ${orderNumber(order.id)}`}
                          value={order.status}
                          disabled={updating}
                          onChange={(e) => dispatch(updateOrderStatus({ id: order.id, status: e.target.value }))}
                        >
                          {!known && <option value={order.status}>{order.status ?? "Unknown"}</option>}
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{label(s)}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-secondary py-5">
                      {hasOrders ? "No orders match your filters." : "No orders yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
