import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteProduct,
  fetchSellerProducts,
  resetProductsStatus,
  updateProduct,
} from "../../store/reducers/sellerSlice";
import { formatPrice, titleCase } from "../../utils/format";

const stockBadge = (stock) =>
  stock <= 0
    ? { cls: "stock-out", text: "Out of stock" }
    : stock <= 10
      ? { cls: "stock-low", text: `${stock} left` }
      : { cls: "stock-ok", text: String(stock) };

export default function SellerProducts() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useSelector((s) => s.auth.user?.id);
  const { products, productsStatus, productsError, deletingProductIds } = useSelector((s) => s.seller);
  const [params, setParams] = useSearchParams();
  const [confirmingId, setConfirmingId] = useState(null);

  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const activeFilter = params.get("status") ?? ""; // "" | "active" | "inactive"
  const notice = location.state?.notice;

  useEffect(() => {
    if (userId === undefined) return;
    const request = dispatch(fetchSellerProducts(userId));
    return () => {
      request.abort();
      dispatch(resetProductsStatus());
    };
  }, [dispatch, userId]);

  const setParam = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!category || p.category === category) &&
        (!activeFilter || (activeFilter === "active" ? p.active !== false : p.active === false)) &&
        (!q || p.title.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
    );
  }, [products, search, category, activeFilter]);

  const hasProducts = products.length > 0;
  const loading = !hasProducts && (productsStatus === "idle" || productsStatus === "loading");
  const failed = !hasProducts && productsStatus === "failed";

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="eyebrow mb-1">My products</p>
          <h1 className="h3 mb-1">منتجاتي</h1>
          {hasProducts && (
            <p className="small text-secondary mb-0">
              Showing {visible.length} of {products.length} products
            </p>
          )}
        </div>
        <Link to="/seller/products/new" className="btn btn-accent">
          <i className="bi bi-plus-lg me-1" aria-hidden="true" />
          Add product
        </Link>
      </div>

      {notice && (
        <div className="alert alert-success d-flex justify-content-between align-items-center gap-3" role="status">
          <span>{notice}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss"
            onClick={() => navigate(`${location.pathname}${location.search}`, { replace: true, state: null })}
          />
        </div>
      )}

      <div className="row g-2 mb-3">
        <div className="col-md-5 col-lg-4">
          <div className="search-box">
            <input
              type="search"
              className="form-control"
              placeholder="Search by name or brand"
              aria-label="Search products"
              value={search}
              onChange={(e) => setParam("search", e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3 col-lg-3">
          <select className="form-select" aria-label="Filter by category" value={category} onChange={(e) => setParam("category", e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{titleCase(c)}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3 col-lg-3">
          <select className="form-select" aria-label="Filter by status" value={activeFilter} onChange={(e) => setParam("status", e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {failed ? (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{productsError || "We couldn't load your products."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchSellerProducts(userId))}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="admin-card p-4 placeholder-glow" aria-busy="true" aria-label="Loading products">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="placeholder d-block col-12 mb-3" style={{ height: 32 }} />
          ))}
        </div>
      ) : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="table admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th className="text-end">Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const stock = stockBadge(p.stock);
                  const deleting = deletingProductIds.includes(p.id);
                  const active = p.active !== false;
                  const discount = Math.round(p.discountPercentage || 0);
                  return (
                    <tr key={p.id}>
                      <td><img src={p.thumbnail} alt="" className="admin-thumb" /></td>
                      <td>
                        <div className="fw-semibold">{p.title}</div>
                        {p.brand && <div className="small text-secondary">{p.brand}</div>}
                      </td>
                      <td>{titleCase(p.category)}</td>
                      <td className="text-end text-nowrap">
                        {formatPrice(p.price)}
                        {discount >= 1 && <span className="badge rounded-pill stock-ok ms-2">-{discount}%</span>}
                      </td>
                      <td><span className={`stock-badge ${stock.cls}`}>{stock.text}</span></td>
                      <td>
                        <button
                          type="button"
                          className={`badge rounded-pill border-0 ${active ? "stock-ok" : "stock-low"}`}
                          onClick={() => dispatch(updateProduct({ id: p.id, data: { ...p, active: !active } }))}
                        >
                          {active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="text-nowrap">
                        {confirmingId === p.id ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <span className="small">Delete?</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              disabled={deleting}
                              onClick={() => {
                                dispatch(deleteProduct(p.id));
                                setConfirmingId(null);
                              }}
                            >
                              Yes
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmingId(null)}>
                              No
                            </button>
                          </span>
                        ) : (
                          <span className="d-inline-flex gap-2">
                            <Link to={`/seller/products/${p.id}/edit`} className="btn btn-sm btn-outline-secondary" aria-label={`Edit ${p.title}`}>
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              disabled={deleting}
                              aria-label={`Delete ${p.title}`}
                              onClick={() => setConfirmingId(p.id)}
                            >
                              {deleting ? "Deleting..." : "Delete"}
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-secondary py-5">
                      {hasProducts ? "No products match your filters." : "You haven't added any products yet."}
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
