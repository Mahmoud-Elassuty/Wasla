import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, fetchProducts } from "../store/reducers/productsSlice";
import { getSalePrice, titleCase } from "../utils/format";
import OffersHeader from "../components/offers/OffersHeader";
import OffersFilters, { SORTS } from "../components/offers/OffersFilters";
import ProductList from "../components/products/ProductList";

const SORT_COMPARE = {
  "discount-desc": (a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0),
  "price-asc": (a, b) => getSalePrice(a) - getSalePrice(b),
  "price-desc": (a, b) => getSalePrice(b) - getSalePrice(a),
  "rating-desc": (a, b) => b.rating - a.rating,
};

export default function Offers() {
  const dispatch = useDispatch();
  const { items, categories, status, error } = useSelector((s) => s.products);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Filters live in the URL, so they survive refresh, back/forward and shared links.
  const minDiscount = ["20", "40", "60"].includes(params.get("minDiscount")) ? params.get("minDiscount") : "";
  const category = params.get("category") ?? "";
  const sort = SORTS[params.get("sort")] ? params.get("sort") : "discount-desc";

  const loading = status === "loading" || status === "idle";

  // Everything actually on sale, regardless of other filters — this is what "X products on sale" counts.
  const onOffer = useMemo(() => items.filter((p) => (p.discountPercentage || 0) > 0), [items]);

  const categoryOptions = useMemo(
    () =>
      categories.length
        ? categories
        : [...new Set(onOffer.map((p) => p.category))].map((slug) => ({ slug, name: titleCase(slug) })),
    [categories, onOffer]
  );

  const setParam = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );

  const hasActiveFilters = Boolean(minDiscount || category || sort !== "discount-desc");
  const resetFilters = () => setParams({}, { replace: true });

  const visible = useMemo(() => {
    const threshold = minDiscount ? Number(minDiscount) : 0;
    const list = onOffer.filter(
      (p) => (!category || p.category === category) && (p.discountPercentage || 0) >= threshold
    );
    const compare = SORT_COMPARE[sort];
    return compare ? [...list].sort(compare) : list;
  }, [onOffer, category, minDiscount, sort]);

  return (
    <div className="container py-4">
      <OffersHeader count={onOffer.length} loading={loading} />

      <div className="row g-4">
        <div className="col-lg-3">
          <OffersFilters
            minDiscount={minDiscount}
            onDiscountChange={(v) => setParam("minDiscount", v)}
            category={category}
            onCategoryChange={(v) => setParam("category", v)}
            categoryOptions={categoryOptions}
            sort={sort}
            onSortChange={(v) => setParam("sort", v)}
            hasActiveFilters={hasActiveFilters}
            onReset={resetFilters}
          />
        </div>

        <div className="col-lg-9">
          {visible.length !== onOffer.length && onOffer.length > 0 && (
            <p className="text-secondary small mb-3">
              Showing {visible.length} of {onOffer.length} offers
              <button
                type="button"
                className="btn btn-link btn-sm p-0 ms-2 align-baseline"
                onClick={resetFilters}
              >
                Clear filters
              </button>
            </p>
          )}
          <ProductList
            products={visible}
            status={status}
            error={error}
            hasItems={onOffer.length > 0}
            onRetry={() => dispatch(fetchProducts())}
            onReset={resetFilters}
          />
        </div>
      </div>
    </div>
  );
}
