import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearActionError,
  deleteReview,
  fetchAdminReviews,
  resetReviewsStatus,
  updateReviewHomepage,
  updateReviewStatus,
} from "../../store/reducers/adminSlice";
import { fetchProducts } from "../../store/reducers/productsSlice";
import RatingStars from "../../components/reviews/RatingStars";
import { useT } from "../../i18n/useT";

const isHomepageFeatured = (review) => Boolean(review.verified) && review.homepageFeatured !== false;
const newestFirst = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

function sortHomepageReviews(reviews) {
  const baseline = [...reviews].filter(isHomepageFeatured).sort(newestFirst);
  const baselinePositions = new Map(baseline.map((review, index) => [String(review.id), index]));
  return baseline.sort((a, b) => {
    const aOrder = Number.isFinite(Number(a.homepageOrder)) ? Number(a.homepageOrder) : baselinePositions.get(String(a.id));
    const bOrder = Number.isFinite(Number(b.homepageOrder)) ? Number(b.homepageOrder) : baselinePositions.get(String(b.id));
    return aOrder - bOrder || newestFirst(a, b);
  });
}

export default function AdminReviews() {
  const { t } = useT();
  const dispatch = useDispatch();
  const { reviews, reviewsStatus, reviewsError, deletingReviewIds, updatingReviewIds, actionError } = useSelector((s) => s.admin);
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

  const productTitle = (id) => products.find((product) => String(product.id) === String(id))?.title ?? `Product #${id}`;
  const productOptions = useMemo(
    () => [...new Set(reviews.map((review) => review.productId))].map((id) => ({ id, title: productTitle(id) })),
    [reviews, products]
  );
  const homeReviews = useMemo(() => sortHomepageReviews(reviews), [reviews]);
  const homePosition = useMemo(() => new Map(homeReviews.map((review, index) => [String(review.id), index])), [homeReviews]);
  const visible = useMemo(
    () => reviews.filter((review) =>
      (!rating || Number(review.rating) === Number(rating)) &&
      (!productId || String(review.productId) === productId) &&
      (!verified || (verified === "verified" ? review.verified : !review.verified))
    ).sort((a, b) => {
      const aPosition = homePosition.get(String(a.id));
      const bPosition = homePosition.get(String(b.id));
      if (aPosition !== undefined && bPosition !== undefined) return aPosition - bPosition;
      if (aPosition !== undefined) return -1;
      if (bPosition !== undefined) return 1;
      return newestFirst(a, b);
    }),
    [reviews, rating, productId, verified, homePosition]
  );
  const hasReviews = reviews.length > 0;
  const loading = !hasReviews && (reviewsStatus === "idle" || reviewsStatus === "loading");
  const failed = !hasReviews && reviewsStatus === "failed";

  const toggleHomepageReview = (review) => {
    if (!review.verified || updatingReviewIds.length > 0) return;
    const featured = isHomepageFeatured(review);
    const currentOrder = homeReviews.map((item, index) => Number.isFinite(Number(item.homepageOrder)) ? Number(item.homepageOrder) : index);
    const nextOrder = currentOrder.length ? Math.max(...currentOrder) + 1 : 0;
    dispatch(updateReviewHomepage({
      id: review.id,
      data: { homepageFeatured: !featured, ...(!featured ? { homepageOrder: nextOrder } : {}) },
    }));
  };

  const moveHomepageReview = (review, direction) => {
    if (updatingReviewIds.length > 0) return;
    const current = homePosition.get(String(review.id));
    const next = current + direction;
    if (current === undefined || next < 0 || next >= homeReviews.length) return;
    const reordered = [...homeReviews];
    [reordered[current], reordered[next]] = [reordered[next], reordered[current]];
    const changed = [reordered[current], reordered[next]];
    changed.forEach((item) => {
      const order = reordered.findIndex((candidate) => String(candidate.id) === String(item.id));
      dispatch(updateReviewHomepage({ id: item.id, data: { homepageOrder: order } }));
    });
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <p className="eyebrow mb-1">{t("Reviews management")}</p>
          <h1 className="h3 mb-1">إدارة التقييمات</h1>
          {hasReviews && <p className="small text-secondary mb-0">{homeReviews.length} review{homeReviews.length === 1 ? "" : "s"} shown on the homepage · use the arrows to change their order</p>}
        </div>
      </div>

      {actionError && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center gap-2" role="alert">
          <span>{actionError}</span><button type="button" className="btn-close" aria-label={t("Dismiss")} onClick={() => dispatch(clearActionError())} />
        </div>
      )}

      <div className="row g-2 mb-3">
        <div className="col-md-4 col-lg-3"><select className="form-select" aria-label={t("Filter by rating")} value={rating} onChange={(event) => setRating(event.target.value)}><option value="">{t("All ratings")}</option>{[5, 4, 3, 2, 1].map((number) => <option key={number} value={number}>{number} star{number === 1 ? "" : "s"}</option>)}</select></div>
        <div className="col-md-4 col-lg-3"><select className="form-select" aria-label={t("Filter by product")} value={productId} onChange={(event) => setProductId(event.target.value)}><option value="">{t("All products")}</option>{productOptions.map(({ id, title }) => <option key={id} value={id}>{title}</option>)}</select></div>
        <div className="col-md-4 col-lg-3"><select className="form-select" aria-label={t("Filter by verified status")} value={verified} onChange={(event) => setVerified(event.target.value)}><option value="">{t("All statuses")}</option><option value="verified">{t("Verified")}</option><option value="unverified">{t("Unverified")}</option></select></div>
      </div>

      {failed ? (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert"><span>{reviewsError || "We couldn't load the reviews."}</span><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchAdminReviews())}>{t("Try again")}</button></div>
      ) : loading ? (
        <div className="admin-card p-4 placeholder-glow" aria-busy="true" aria-label={t("Loading reviews")}>{Array.from({ length: 6 }, (_, index) => <span key={index} className="placeholder d-block col-12 mb-3" style={{ height: 32 }} />)}</div>
      ) : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="table admin-table align-middle mb-0">
              <thead><tr><th>{t("Product")}</th><th>{t("User")}</th><th>{t("Rating")}</th><th>{t("Review")}</th><th>{t("Date")}</th><th>{t("Status")}</th><th>{t("Homepage")}</th><th>{t("Actions")}</th></tr></thead>
              <tbody>
                {visible.map((review) => {
                  const deleting = deletingReviewIds.includes(review.id);
                  const updating = updatingReviewIds.includes(review.id);
                  const featured = isHomepageFeatured(review);
                  const position = homePosition.get(String(review.id));
                  return (
                    <tr key={review.id}>
                      <td>{productTitle(review.productId)}</td>
                      <td>{review.userName || "Wasla customer"}</td>
                      <td><RatingStars value={review.rating} size="0.85rem" /></td>
                      <td style={{ maxWidth: 280 }}><div className="fw-semibold text-truncate">{review.title || t("Customer review")}</div><div className="small text-secondary text-truncate">{review.comment}</div></td>
                      <td className="text-nowrap">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "—"}</td>
                      <td><button type="button" className={`badge rounded-pill border-0 ${review.verified ? "stock-ok" : "stock-low"}`} disabled={updating} onClick={() => dispatch(updateReviewStatus({ id: review.id, verified: !review.verified }))}>{updating ? "Saving…" : review.verified ? "Verified" : "Unverified"}</button></td>
                      <td className="text-nowrap">
                        <div className="d-flex align-items-center gap-1">
                          <button type="button" className={`btn btn-sm ${featured ? "btn-success" : "btn-outline-secondary"}`} disabled={!review.verified || updatingReviewIds.length > 0} onClick={() => toggleHomepageReview(review)} title={!review.verified ? "Verify this review before featuring it" : undefined}>
                            {updating ? t("Saving...") : featured ? t("Shown") : t("Show")}
                          </button>
                          {featured && <span className="d-inline-flex gap-1 ms-1"><button type="button" className="btn btn-sm btn-outline-secondary" aria-label={`Move review by ${review.userName || "Wasla customer"} up`} disabled={position === 0 || updatingReviewIds.length > 0} onClick={() => moveHomepageReview(review, -1)}><i className="bi bi-arrow-up" aria-hidden="true" /></button><button type="button" className="btn btn-sm btn-outline-secondary" aria-label={`Move review by ${review.userName || "Wasla customer"} down`} disabled={position === homeReviews.length - 1 || updatingReviewIds.length > 0} onClick={() => moveHomepageReview(review, 1)}><i className="bi bi-arrow-down" aria-hidden="true" /></button></span>}
                        </div>
                      </td>
                      <td className="text-nowrap">
                        {confirmingId === review.id ? <span className="d-inline-flex align-items-center gap-2"><span className="small">{t("Delete?")}</span><button type="button" className="btn btn-sm btn-danger" disabled={deleting} onClick={() => { dispatch(deleteReview(review.id)); setConfirmingId(null); }}>{t("Yes")}</button><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmingId(null)}>{t("No")}</button></span> : <button type="button" className="btn btn-sm btn-outline-danger" disabled={deleting} aria-label={`Delete review by ${review.userName}`} onClick={() => setConfirmingId(review.id)}>{deleting ? "Deleting…" : "Delete"}</button>}
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && <tr><td colSpan={8} className="text-center text-secondary py-5">{hasReviews ? "No reviews match your filters." : "No reviews yet."}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}