import { useEffect, useState } from "react";
import { formatPrice } from "../../utils/format";

export const RATING_TIERS = ["4", "3", "2", "1"];

// Price range is edited locally (draft) and only pushed up when the user hits "Apply", so
// dragging the slider doesn't re-filter/re-render on every pixel of movement. Same pattern as
// CategoryFilters' price slider.
export default function SearchFilters({
  categoryOptions,
  selectedCategories,
  onToggleCategory,
  brandOptions,
  selectedBrands,
  onToggleBrand,
  ratingMin,
  onRatingChange,
  inStockOnly,
  onInStockChange,
  bounds,
  priceValue,
  onApplyPrice,
  hasActiveFilters,
  onClearAll,
}) {
  const [draftMin, setDraftMin] = useState(priceValue.min);
  const [draftMax, setDraftMax] = useState(priceValue.max);

  useEffect(() => {
    setDraftMin(priceValue.min);
    setDraftMax(priceValue.max);
  }, [priceValue.min, priceValue.max]);

  const dirty = draftMin !== priceValue.min || draftMax !== priceValue.max;

  const handleMinChange = (e) => setDraftMin(Math.min(Number(e.target.value), draftMax));
  const handleMaxChange = (e) => setDraftMax(Math.max(Number(e.target.value), draftMin));

  const rangeSpan = Math.max(bounds.max - bounds.min, 1);
  const leftPct = ((draftMin - bounds.min) / rangeSpan) * 100;
  const rightPct = ((draftMax - bounds.min) / rangeSpan) * 100;

  return (
    <aside className="filters-sidebar bg-white border rounded-4 p-3 p-lg-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h6 mb-0">Filters</h2>
        {hasActiveFilters && (
          <button type="button" className="btn btn-link btn-sm p-0" onClick={onClearAll}>
            Clear all
          </button>
        )}
      </div>

      {categoryOptions.length > 0 && (
        <div className="mb-4">
          <span className="form-label small fw-semibold d-block mb-2">Category</span>
          <div className="d-flex flex-column gap-1">
            {categoryOptions.map(({ slug, name }) => (
              <div className="form-check" key={slug}>
                <input
                  id={`cat-${slug}`}
                  type="checkbox"
                  className="form-check-input"
                  checked={selectedCategories.includes(slug)}
                  onChange={() => onToggleCategory(slug)}
                />
                <label htmlFor={`cat-${slug}`} className="form-check-label small">
                  {name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="form-label small fw-semibold mb-0">Price range</span>
          <span className="small text-secondary">
            {formatPrice(draftMin)} &ndash; {formatPrice(draftMax)}
          </span>
        </div>
        <div className="price-slider position-relative">
          <div className="price-slider-track" aria-hidden="true">
            <div className="price-slider-fill" style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }} />
          </div>
          <input
            type="range"
            className="price-slider-input"
            min={bounds.min}
            max={bounds.max}
            step="0.01"
            value={draftMin}
            aria-label="Minimum price"
            onChange={handleMinChange}
          />
          <input
            type="range"
            className="price-slider-input"
            min={bounds.min}
            max={bounds.max}
            step="0.01"
            value={draftMax}
            aria-label="Maximum price"
            onChange={handleMaxChange}
          />
        </div>
        <button
          type="button"
          className="btn btn-wasla w-100 mt-3"
          disabled={!dirty}
          onClick={() => onApplyPrice(draftMin, draftMax)}
        >
          Apply filters
        </button>
      </div>

      <div className="mb-4">
        <span className="form-label small fw-semibold d-block mb-2">Rating</span>
        <div className="d-flex flex-wrap gap-2" role="group" aria-label="Filter by rating">
          <button
            type="button"
            className={`chip${ratingMin ? "" : " active"}`}
            aria-pressed={!ratingMin}
            onClick={() => onRatingChange("")}
          >
            All
          </button>
          {RATING_TIERS.map((tier) => (
            <button
              key={tier}
              type="button"
              className={`chip${ratingMin === tier ? " active" : ""}`}
              aria-pressed={ratingMin === tier}
              onClick={() => onRatingChange(tier)}
            >
              <i className="bi bi-star-fill text-accent me-1" aria-hidden="true" />
              {tier}+
            </button>
          ))}
        </div>
      </div>

      {brandOptions.length > 0 && (
        <div className="mb-4">
          <span className="form-label small fw-semibold d-block mb-2">Brand</span>
          <div className="d-flex flex-column gap-1 brand-list">
            {brandOptions.map((brand) => (
              <div className="form-check" key={brand}>
                <input
                  id={`brand-${brand}`}
                  type="checkbox"
                  className="form-check-input"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => onToggleBrand(brand)}
                />
                <label htmlFor={`brand-${brand}`} className="form-check-label small">
                  {brand}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="form-check form-switch">
        <input
          id="in-stock-only"
          type="checkbox"
          className="form-check-input"
          role="switch"
          checked={inStockOnly}
          onChange={(e) => onInStockChange(e.target.checked)}
        />
        <label htmlFor="in-stock-only" className="form-check-label small fw-semibold">
          In stock only
        </label>
      </div>
    </aside>
  );
}
