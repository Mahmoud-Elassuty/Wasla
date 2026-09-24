import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteCoupon,
  fetchAdminCoupons,
  resetCouponsStatus,
  toggleCouponActive,
} from "../../store/reducers/adminSlice";
import { formatPrice } from "../../utils/format";
import { formatOrderDate } from "../../utils/checkout";

const discountLabel = (c) => (c.type === "percentage" ? `${c.discount}%` : formatPrice(c.discount));
const isExpired = (c) => c.validUntil && new Date(c.validUntil) < new Date(new Date().toDateString());

export default function AdminCoupons() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { coupons, couponsStatus, couponsError, deletingCouponIds, togglingCouponIds } = useSelector(
    (s) => s.admin
  );
  const [confirmingId, setConfirmingId] = useState(null);
  const notice = location.state?.notice;

  useEffect(() => {
    const request = dispatch(fetchAdminCoupons());
    return () => {
      request.abort();
      dispatch(resetCouponsStatus());
    };
  }, [dispatch]);

  const hasCoupons = coupons.length > 0;
  const loading = !hasCoupons && (couponsStatus === "idle" || couponsStatus === "loading");
  const failed = !hasCoupons && couponsStatus === "failed";

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="eyebrow mb-1">Coupons management</p>
          <h1 className="h3 mb-1">إدارة الكوبونات</h1>
          {hasCoupons && <p className="small text-secondary mb-0">{coupons.length} coupons</p>}
        </div>
        <Link to="/admin/coupons/new" className="btn btn-accent">
          <i className="bi bi-plus-lg me-1" aria-hidden="true" />
          Add coupon
        </Link>
      </div>

      {notice && (
        <div className="alert alert-success d-flex justify-content-between align-items-center gap-3" role="status">
          <span>{notice}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss"
            onClick={() => navigate(`${location.pathname}`, { replace: true, state: null })}
          />
        </div>
      )}

      {failed ? (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{couponsError || "We couldn't load the coupons."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchAdminCoupons())}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="admin-card p-4 placeholder-glow" aria-busy="true" aria-label="Loading coupons">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className="placeholder d-block col-12 mb-3" style={{ height: 32 }} />
          ))}
        </div>
      ) : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="table admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min. total</th>
                  <th>Valid until</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const deleting = deletingCouponIds.includes(c.id);
                  const toggling = togglingCouponIds.includes(c.id);
                  const expired = isExpired(c);
                  return (
                    <tr key={c.id}>
                      <td className="fw-semibold text-nowrap">{c.code}</td>
                      <td className="text-nowrap">
                        {discountLabel(c)}
                        {c.type === "percentage" && c.maxDiscount && (
                          <span className="small text-secondary"> (up to {formatPrice(c.maxDiscount)})</span>
                        )}
                      </td>
                      <td>{c.minTotal ? formatPrice(c.minTotal) : "—"}</td>
                      <td className="text-nowrap">
                        {c.validUntil ? formatOrderDate(c.validUntil) : "No expiry"}
                        {expired && <span className="badge rounded-pill stock-low ms-2">Expired</span>}
                      </td>
                      <td className="text-nowrap">
                        {c.usedCount ?? 0}
                        {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`badge rounded-pill border-0 ${c.active ? "stock-ok" : "stock-low"}`}
                          disabled={toggling}
                          onClick={() => dispatch(toggleCouponActive(c))}
                        >
                          {toggling ? "Saving..." : c.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="text-nowrap">
                        {confirmingId === c.id ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <span className="small">Delete?</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              disabled={deleting}
                              onClick={() => {
                                dispatch(deleteCoupon(c.id));
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
                            <Link to={`/admin/coupons/${c.id}/edit`} className="btn btn-sm btn-outline-secondary" aria-label={`Edit ${c.code}`}>
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              disabled={deleting}
                              aria-label={`Delete ${c.code}`}
                              onClick={() => setConfirmingId(c.id)}
                            >
                              {deleting ? "Deleting..." : "Delete"}
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-secondary py-5">
                      No coupons yet.
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
