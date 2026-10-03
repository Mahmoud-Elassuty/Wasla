import { useEffect, useState } from "react";
import { formatPrice } from "../../utils/format";
import { useT } from "../../i18n/useT";

export const SORTS = {
  featured: { label: "Featured", compare: null },
  "price-asc": { label: "Price: low to high" },
  "price-desc": { label: "Price: high to low" },
  "rating-desc": { label: "Top rated" },
  "name-asc": { label: "Name: A to Z" },
};

// Price range is edited locally (draft) and only pushed up to the URL when the user hits
// "Apply", so dragging the slider doesn't re-filter/re-render on every pixel of movement.
export default function CategoryFilters({
  sort,
  onSortChange,
  bounds, // { min, max } across all products in this category
  value, // { min, max } currently applied
  onApplyPrice,
  onReset,
  hasActiveFilters,
}) {
  const { t } = useT();
  const [draftMin, setDraftMin] = useState(value.min);
  const [draftMax, setDraftMax] = useState(value.max);

  // Keep the draft in sync if the applied range changes from outside (e.g. "Clear filters").
  useEffect(() => {
    setDraftMin(value.min);
    setDraftMax(value.max);
  }, [value.min, value.max]);

  const dirty = draftMin !== value.min || draftMax !== value.max;

  const handleMinChange = (e) => {
    const next = Math.min(Number(e.target.value), draftMax);
    setDraftMin(next);
  };
  const handleMaxChange = (e) => {
    const next = Math.max(Number(e.target.value), draftMin);
    setDraftMax(next);
  };

  const rangeSpan = Math.max(bounds.max - bounds.min, 1);
  const leftPct = ((draftMin - bounds.min) / rangeSpan) * 100;
  const rightPct = ((draftMax - bounds.min) / rangeSpan) * 100;

  return (
    <aside id="filters-panel" className="category-filters collapse d-lg-block bg-white border rounded-4 p-3 p-lg-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h6 mb-0">{t("Filters")}</h2>
        {hasActiveFilters && (
          <button type="button" className="btn btn-link btn-sm p-0" onClick={onReset}>
            {t("Clear all")}
          </button>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="category-sort" className="form-label small fw-semibold">
          {t("Sort by")}
        </label>
        <select
          id="category-sort"
          className="form-select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
        >
          {Object.entries(SORTS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {t(label)}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="form-label small fw-semibold mb-0">{t("Price range")}</span>
          <span className="small text-secondary">
            <bdi dir="ltr">{formatPrice(draftMin)} &ndash; {formatPrice(draftMax)}</bdi>
          </span>
        </div>

        <div className="price-slider position-relative" dir="ltr">
          <div className="price-slider-track" aria-hidden="true">
            <div
              className="price-slider-fill"
              style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
            />
          </div>
          <input
            type="range"
            className="price-slider-input"
            min={bounds.min}
            max={bounds.max}
            step="0.01"
            value={draftMin}
            aria-label={t("Minimum price")}
            onChange={handleMinChange}
          />
          <input
            type="range"
            className="price-slider-input"
            min={bounds.min}
            max={bounds.max}
            step="0.01"
            value={draftMax}
            aria-label={t("Maximum price")}
            onChange={handleMaxChange}
          />
        </div>

        <button
          type="button"
          className="btn btn-wasla w-100 mt-3"
          disabled={!dirty}
          onClick={() => onApplyPrice(draftMin, draftMax)}
        >
          {t("Apply filters")}
        </button>
      </div>
    </aside>
  );
}
