import { useState } from "react";

// Static by default (`value` only). Pass `onChange` to make it a clickable 1-5 star input.
export default function RatingStars({ value = 0, onChange, size = "1rem", showValue = false, count }) {
  const interactive = typeof onChange === "function";
  const [hover, setHover] = useState(0);
  const display = interactive ? hover || value : value;

  const iconFor = (i) => {
    if (display >= i) return "bi-star-fill";
    if (display >= i - 0.5) return "bi-star-half";
    return "bi-star";
  };

  return (
    <span className="d-inline-flex align-items-center gap-2">
      <span
        className={interactive ? "d-inline-flex" : "rating-stars-static d-inline-flex"}
        role={interactive ? "radiogroup" : undefined}
        aria-label={interactive ? "Rating out of 5" : `Rated ${display} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((i) =>
          interactive ? (
            <button
              key={i}
              type="button"
              className="rating-star-btn"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange(i)}
              aria-label={`Rate ${i} out of 5`}
              aria-pressed={value === i}
            >
              <i className={`bi ${iconFor(i)}`} style={{ fontSize: size }} />
            </button>
          ) : (
            <i key={i} className={`bi ${iconFor(i)}`} style={{ fontSize: size }} aria-hidden="true" />
          )
        )}
      </span>
      {showValue && <span className="small fw-semibold">{Number(value).toFixed(1)}/5</span>}
      {typeof count === "number" && (
        <span className="small text-secondary">
          ({count} review{count === 1 ? "" : "s"})
        </span>
      )}
    </span>
  );
}
