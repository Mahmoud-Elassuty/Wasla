import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminOrders,
  fetchAdminProducts,
  resetOrdersStatus,
  resetProductsStatus,
} from "../../store/reducers/adminSlice";
import OrderStatus from "../../components/orders/OrderStatus";
import { formatPrice } from "../../utils/format";
import { formatOrderDate, orderNumber } from "../../utils/checkout";

const RECENT_LIMIT = 8;
const LOW_STOCK_LIMIT = 10; // "low" means this many units or fewer

function StatCard({ label, value, icon, tone, loading }) {
  return (
    <div className="stat-card">
      <div className="d-flex justify-content-between align-items-start gap-2">
        <div>
          <p className="small text-secondary mb-1">{label}</p>
          {loading ? (
            <span className="placeholder-glow d-block" aria-hidden="true">
              <span className="placeholder col-8 fs-3" />
            </span>
          ) : (
            <p className="font-display fs-2 fw-bold mb-0">{value}</p>
          )}
        </div>
        <span className={`stat-icon ${tone}`}>
          <i className={`bi ${icon}`} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const userName = useSelector((s) => s.auth.user?.name);
  const { orders, ordersStatus, ordersError, products, productsStatus, productsError } = useSelector((s) => s.admin);

  const load = () => {
    dispatch(fetchAdminOrders());
    dispatch(fetchAdminProducts());
  };

  useEffect(() => {
    const a = dispatch(fetchAdminOrders());
    const b = dispatch(fetchAdminProducts());
    return () => {
      a.abort();
      b.abort();
      dispatch(resetOrdersStatus());
      dispatch(resetProductsStatus());
    };
  }, [dispatch]);

  const stats = useMemo(() => {
    const revenue = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      totalOrders: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      revenue: Math.round(revenue * 100) / 100,
      totalProducts: products.length,
    };
  }, [orders, products]);

  const recent = useMemo(
    () => [...orders].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, RECENT_LIMIT),
    [orders]
  );
  const lowStock = useMemo(
    () => products.filter((p) => p.stock <= LOW_STOCK_LIMIT).sort((a, b) => a.stock - b.stock).slice(0, 5),
    [products]
  );

  const ordersLoading = orders.length === 0 && (ordersStatus === "idle" || ordersStatus === "loading");
  const productsLoading = products.length === 0 && (productsStatus === "idle" || productsStatus === "loading");
  const failed =
    (ordersStatus === "failed" && orders.length === 0) || (productsStatus === "failed" && products.length === 0);

  return (
    <>
      <div className="mb-4">
        <p className="eyebrow mb-1">Dashboard</p>
        <h1 className="h3 mb-1">Welcome back{userName ? `, ${userName}` : ""}</h1>
        <p className="text-secondary mb-0">Here's what's happening in your store.</p>
      </div>

      {failed && (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{ordersError || productsError || "We couldn't load the dashboard."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={load}>Try again</button>
        </div>
      )}

      <div className="row g-3 mb-2">
        <div className="col-sm-6 col-xl-3">
          <StatCard label="Total orders" value={stats.totalOrders} icon="bi-receipt" tone="stat-blue" loading={ordersLoading} />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard label="Pending orders" value={stats.pending} icon="bi-hourglass-split" tone="stat-orange" loading={ordersLoading} />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard label="Total revenue" value={formatPrice(stats.revenue)} icon="bi-cash-stack" tone="stat-green" loading={ordersLoading} />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard label="Total products" value={stats.totalProducts} icon="bi-box-seam" tone="stat-purple" loading={productsLoading} />
        </div>
      </div>
      <p className="small text-secondary mb-4">Revenue doesn't include cancelled orders.</p>

      <div className="row g-4">
        <div className="col-xl-8">
          <section className="admin-card">
            <div className="d-flex justify-content-between align-items-center p-3 p-md-4 pb-3">
              <h2 className="h5 mb-0">Recent orders</h2>
              <Link to="/admin/orders" className="small fw-semibold">View all orders</Link>
            </div>
            <div className="table-responsive">
              <table className="table admin-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((order) => (
                    <tr key={order.id}>
                      <td className="fw-semibold">
                        <Link to={`/admin/orders?search=${orderNumber(order.id)}`} className="text-decoration-none">
                          #{orderNumber(order.id)}
                        </Link>
                      </td>
                      <td>{order.customer?.name ?? "-"}</td>
                      <td className="text-nowrap">{formatOrderDate(order.createdAt)}</td>
                      <td><OrderStatus status={order.status} /></td>
                      <td className="text-end fw-semibold">{formatPrice(order.total)}</td>
                    </tr>
                  ))}
                  {recent.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-secondary py-4">
                        {ordersLoading ? "Loading orders..." : "No orders yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="col-xl-4">
          <section className="admin-card p-3 p-md-4 mb-4">
            <h2 className="h5 mb-3">Quick actions</h2>
            <div className="d-grid gap-2">
              <Link to="/admin/products/new" className="btn btn-accent">
                <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                Add product
              </Link>
              <Link to="/admin/orders?status=pending" className="btn btn-outline-secondary">
                Review pending orders{stats.pending > 0 ? ` (${stats.pending})` : ""}
              </Link>
              <Link to="/admin/products" className="btn btn-outline-secondary">Manage products</Link>
            </div>
          </section>

          <section className="admin-card p-3 p-md-4">
            <h2 className="h5 mb-3">Low stock</h2>
            {lowStock.length === 0 ? (
              <p className="small text-secondary mb-0">
                {productsLoading ? "Loading products..." : `No product is at ${LOW_STOCK_LIMIT} units or fewer.`}
              </p>
            ) : (
              <ul className="list-unstyled d-grid gap-3 mb-0">
                {lowStock.map((p) => (
                  <li key={p.id} className="d-flex align-items-center gap-2">
                    <img src={p.thumbnail} alt="" className="admin-thumb" />
                    <div className="flex-grow-1 min-w-0">
                      <div className="small fw-semibold text-truncate">{p.title}</div>
                      <span className={`stock-badge ${p.stock === 0 ? "stock-out" : "stock-low"}`}>
                        {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                      </span>
                    </div>
                    <Link to={`/admin/products/${p.id}/edit`} className="btn btn-sm btn-outline-secondary">Restock</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
