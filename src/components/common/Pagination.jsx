import { getPageItems } from "../../utils/pagination";
import "../../styles/pagination.css";

// "Showing 13–24 of 106 products"
export function ResultsSummary({ start, end, total, noun = "products", className = "" }) {
  if (total === 0) return null;
  const label = total === 1 ? noun.replace(/s$/, "") : noun;
  return (
    <span className={className} aria-live="polite">
      Showing {start}–{end} of {total} {label}
    </span>
  );
}

// Presentational only: the current page lives in the URL (see hooks/usePagination).
export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const items = getPageItems(page, totalPages);

  return (
    <nav className="wasla-pagination mt-4 mb-2" aria-label="Pagination">
      <ul className="pagination mb-0">
        <li className={`page-item${page === 1 ? " disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <i className="bi bi-chevron-left" aria-hidden="true" />
            <span className="pagination-label">Previous</span>
          </button>
        </li>

        {items.map((item) =>
          typeof item === "string" ? (
            <li key={item} className="page-item disabled pagination-ellipsis" aria-hidden="true">
              <span className="page-link">…</span>
            </li>
          ) : (
            <li
              key={item}
              className={`page-item${item === page ? " active" : ""}${
                item !== page && item !== 1 && item !== totalPages ? " pagination-optional" : ""
              }`}
            >
              <button
                type="button"
                className="page-link"
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
              >
                {item}
              </button>
            </li>
          )
        )}

        <li className={`page-item${page === totalPages ? " disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            <span className="pagination-label">Next</span>
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
        </li>
      </ul>
      <p className="visually-hidden" role="status">
        Page {page} of {totalPages}
      </p>
    </nav>
  );
}
