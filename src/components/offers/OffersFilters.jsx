const DISCOUNT_TIERS = [
  { value: "", label: "All" },
  { value: "20", label: "20%+" },
  { value: "40", label: "40%+" },
  { value: "60", label: "60%+" },
];

export const SORTS = {
  "discount-desc": { label: "Biggest discount" },
  "price-asc": { label: "Price: low to high" },
  "price-desc": { label: "Price: high to low" },
  "rating-desc": { label: "Top rated" },
};

import { getCategoryDisplayName } from "../../utils/categoryDisplay";
import { useT } from "../../i18n/useT";

export default function OffersFilters({
  minDiscount,
  onDiscountChange,
  category,
  onCategoryChange,
  categoryOptions,
  sort,
  onSortChange,
  hasActiveFilters,
  onReset,
}) {
  const { t } = useT();
  return (
    <aside id="filters-panel" className="offers-filters collapse d-lg-block bg-white border rounded-4 p-3 p-lg-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h6 mb-0">{t("Filters")}</h2>
        {hasActiveFilters && (
          <button type="button" className="btn btn-link btn-sm p-0" onClick={onReset}>
            {t("Clear all")}
          </button>
        )}
      </div>

      <div className="mb-4">
        <span className="form-label small fw-semibold d-block mb-2">{t("Discount")}</span>
        <div className="d-flex flex-wrap gap-2" role="group" aria-label={t("Filter by discount")}>
          {DISCOUNT_TIERS.map(({ value, label }) => (
            <button
              key={value || "all"}
              type="button"
              className={`chip${minDiscount === value ? " active" : ""}`}
              aria-pressed={minDiscount === value}
              onClick={() => onDiscountChange(value)}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="offers-category" className="form-label small fw-semibold">
          {t("Category")}
        </label>
        <select
          id="offers-category"
          className="form-select"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">{t("All categories")}</option>
          {categoryOptions.map(({ slug, name }) => (
            <option key={slug} value={slug}>
              {getCategoryDisplayName(slug)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="offers-sort" className="form-label small fw-semibold">
          {t("Sort by")}
        </label>
        <select
          id="offers-sort"
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
    </aside>
  );
}
