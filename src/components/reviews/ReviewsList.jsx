import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteReview, updateReview } from "../../store/reducers/reviewsSlice";
import RatingStars from "./RatingStars";

const SORTS = {
  newest: { label: "Newest", compare: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  "rating-desc": { label: "Highest rating", compare: (a, b) => b.rating - a.rating },
  "rating-asc": { label: "Lowest rating", compare: (a, b) => a.rating - b.rating },
};

export default function ReviewsList({ reviews }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { deletingIds, updatingIds } = useSelector((s) => s.reviews);
  const [sort, setSort] = useState("newest");
  const [confirmingId, setConfirmingId] = useState(null);

  const sorted = useMemo(() => [...reviews].sort(SORTS[sort].compare), [reviews, sort]);

  const markHelpful = (review) =>
    dispatch(updateReview({ id: review.id, data: { ...review, helpful: (review.helpful || 0) + 1 } }));

  if (reviews.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="h6 mb-1">No reviews yet</p>
        <p className="text-secondary small mb-0">Be the first to share what you think.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="small text-secondary mb-0">
          {reviews.length} review{reviews.length === 1 ? "" : "s"}
        </p>
        <select
          className="form-select form-select-sm w-auto"
          aria-label="Sort reviews"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {Object.entries(SORTS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <ul className="list-unstyled d-grid gap-3 mb-0">
        {sorted.map((review) => {
          const updating = updatingIds.includes(review.id);
          const deleting = deletingIds.includes(review.id);
          const isOwn = user && review.userId === user.id;

          return (
            <li key={review.id} className="review-item border rounded-4 p-3 bg-white">
              <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                <div>
                  <RatingStars value={review.rating} size="0.9rem" />
                  <h3 className="h6 mt-1 mb-0">{review.title}</h3>
                </div>
                {review.verified && (
                  <span className="badge rounded-pill stock-ok flex-shrink-0">Verified purchase</span>
                )}
              </div>

              <p className="text-secondary mb-2">{review.comment}</p>

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <p className="small text-secondary mb-0">
                  {review.userName} &middot; {new Date(review.createdAt).toLocaleDateString()}
                </p>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={updating}
                    onClick={() => markHelpful(review)}
                  >
                    <i className="bi bi-hand-thumbs-up me-1" aria-hidden="true" />
                    Helpful ({review.helpful || 0})
                  </button>

                  {isOwn &&
                    (confirmingId === review.id ? (
                      <span className="d-inline-flex align-items-center gap-2">
                        <span className="small">Delete?</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          disabled={deleting}
                          onClick={() => {
                            dispatch(deleteReview(review.id));
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
                        onClick={() => setConfirmingId(review.id)}
                      >
                        {deleting ? "Deleting..." : "Delete"}
                      </button>
                    ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
