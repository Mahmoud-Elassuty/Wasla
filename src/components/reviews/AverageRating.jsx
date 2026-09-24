import RatingStars from "./RatingStars";

// distribution: { 5: n, 4: n, 3: n, 2: n, 1: n }
export default function AverageRating({ average, count, distribution }) {
  if (count === 0) {
    return <p className="text-secondary mb-0">No ratings yet — be the first to review this product.</p>;
  }

  return (
    <div className="average-rating d-flex flex-wrap gap-4 align-items-center">
      <div className="text-center flex-shrink-0">
        <div className="display-5 fw-bold font-display mb-1">{average.toFixed(1)}</div>
        <RatingStars value={average} size="1.1rem" />
        <p className="small text-secondary mt-1 mb-0">
          {count} review{count === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex-grow-1" style={{ minWidth: 220 }}>
        {[5, 4, 3, 2, 1].map((star) => {
          const n = distribution[star] || 0;
          const pct = count ? Math.round((n / count) * 100) : 0;
          return (
            <div key={star} className="d-flex align-items-center gap-2 mb-1">
              <span className="small text-nowrap" style={{ width: 42 }}>
                {star} <i className="bi bi-star-fill text-warning" aria-hidden="true" />
              </span>
              <div className="rating-bar flex-grow-1">
                <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="small text-secondary text-end" style={{ width: 28 }}>
                {n}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
