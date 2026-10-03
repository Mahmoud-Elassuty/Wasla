import { getPageItems } from "../../utils/pagination";
import "../../styles/pagination.css";
import { useT } from "../../i18n/useT";

// "Showing 13–24 of 106 products"
export function ResultsSummary({ start, end, total, noun = "products", className = "" }) {
  const { t } = useT();
  if (total === 0) return null;
  const label = t(`unit.${noun}`, { count: total });
  return (
    <span className={className} aria-live="polite">
      {t("Showing {start}–{end} of {total} {label}", { start, end, total, label })}
    </span>
  );
}

// Presentational only: the current page lives in the URL (see hooks/usePagination).
export default function Pagination({ page, totalPages, onPageChange }) {
  const { t } = useT();
  if (totalPages <= 1) return null;

  const items = getPageItems(page, totalPages);

  return (
    <nav className="wasla-pagination mt-4 mb-2" aria-label={t("Pagination")}>
      <ul className="pagination mb-0">
        <li className={`page-item${page === 1 ? " disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label={t("Previous page")}
          >
            <i className="bi bi-chevron-left" aria-hidden="true" />
            <span className="pagination-label">{t("Previous")}</span>
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
            aria-label={t("Next page")}
          >
            <span className="pagination-label">{t("Next")}</span>
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
        </li>
      </ul>
      <p className="visually-hidden" role="status">
        {t("Page {page} of {total}", { page, total: totalPages })}
      </p>
    </nav>
  );
}
