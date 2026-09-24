import { useEffect, useMemo, useState } from "react";
import {
  deleteReview,
  fetchAdminReviews,
  resetReviewsStatus,
  updateReviewStatus,
} from "../../store/reducers/adminSlice";
import { fetchProducts } from "../../store/reducers/productsSlice";
import { useDispatch, useSelector } from "react-redux";
import RatingStars from "../../components/reviews/RatingStars";

export default function AdminReviews() {
  const dispatch = useDispatch();
  const { reviews, reviewsStatus, reviewsError, deletingReviewIds, updatingReviewIds } = useSelector(
    (s) => s.admin
  );
  const products = useSelector((s) => s.products.items);
  const [rating, setRating] = useState("");
  const [productId, setProductId] = useState("");
  const [verified, setVerified] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    const request = dispatch(fetchAdminReviews());
    return () => {
      request.abort();
      dispatch(resetReviewsStatus());
    };
  }, [dispatch]);

  useEffect(() => {
    if (products.length === 0) dispatch(fetchProducts());
  }, [dispatch, products.length]);

  const productTitle = (id) => products.find((p) => p.id === id)?.title ?? `Product #${id}`;

  const productOptions = useMemo(
    () => [...new Set(reviews.map((r) => r.productId))].map((id) => ({ id, title: productTitle(id) })),
    [reviews, products]
  );

  const visible = useMemo(
    () =>
      reviews.filter(
        (r) =>
          (!rating || r.rating === Number(rating)) &&
          (!productId || r.productId === Number(productId)) &&
          (!verified || (verified === "verified" ? r.verified : !r.verified))
      ),
    [reviews, rating, productId, verified]
  );

  const hasReviews = reviews.length > 0;
  const loading = !hasReviews && (reviewsStatus === "idle" || reviewsStatus === "loading");
  const failed = !hasReviews && reviewsStatus === "failed";

  return (
    <>
      <div className="mb-4">
        <p className="eyebrow mb-1">Reviews management</p>
        <h1 className="h3 mb-1">إدارة التقييمات</h1>
        {hasReviews && (
          <p className="small text-secondary mb-0">
            Showing {visible.length} of {reviews.length} reviews
          </p>
        )}
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-4 col-lg-3">
          <select
            className="form-select"
            aria-label="Filter by rating"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          >
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4 col-lg-3">
          <select
            className="form-select"
            aria-label="Filter by product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">All products</option>
            {productOptions.map(({ id, title }) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4 col-lg-3">
          <select
            className="form-select"
            aria-label="Filter by verified status"
            value={verified}
            onChange={(e) => setVerified(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {failed ? (
        <div
          className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2"
          role="alert"
        >
          <span>{reviewsError || "We couldn't load the reviews."}</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => dispatch(fetchAdminReviews())}
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="admin-card p-4 placeholder-glow" aria-busy="true" aria-label="Loading reviews">
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
                  <th>Product</th>
                  <th>User</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const deleting = deletingReviewIds.includes(r.id);
                  const updating = updatingReviewIds.includes(r.id);
                  return (
                    <tr key={r.id}>
                      <td>{productTitle(r.productId)}</td>
                      <td>{r.userName}</td>
                      <td><RatingStars value={r.rating} size="0.85rem" /></td>
                      <td style={{ maxWidth: 280 }}>
                        <div className="fw-semibold text-truncate">{r.title}</div>
                        <div className="small text-secondary text-truncate">{r.comment}</div>
                      </td>
                      <td className="text-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          type="button"
                          className={`badge rounded-pill border-0 ${r.verified ? "stock-ok" : "stock-low"}`}
                          disabled={updating}
                          onClick={() => dispatch(updateReviewStatus({ id: r.id, verified: !r.verified }))}
                        >
                          {updating ? "Saving..." : r.verified ? "Verified" : "Unverified"}
                        </button>
                      </td>
                      <td className="text-nowrap">
                        {confirmingId === r.id ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <span className="small">Delete?</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              disabled={deleting}
                              onClick={() => {
                                dispatch(deleteReview(r.id));
                                setConfirmingId(null);
                              }}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => setConfirmingId(null)}
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={deleting}
                            aria-label={`Delete review by ${r.userName}`}
                            onClick={() => setConfirmingId(r.id)}
                          >
                            {deleting ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-secondary py-5">
                      {hasReviews ? "No reviews match your filters." : "No reviews yet."}
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
