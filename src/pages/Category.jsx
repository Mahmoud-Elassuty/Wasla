import { useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, fetchProducts } from "../store/reducers/productsSlice";
import { getCategoryMeta } from "../utils/categoryMeta";
import { getSalePrice } from "../utils/format";
import CategoryHeader from "../components/category/CategoryHeader";
import CategoryFilters, { SORTS } from "../components/category/CategoryFilters";
import ProductList from "../components/products/ProductList";
import "../styles/category.css";

const SORT_COMPARE = {
  "price-asc": (a, b) => getSalePrice(a) - getSalePrice(b),
  "price-desc": (a, b) => getSalePrice(b) - getSalePrice(a),
  "rating-desc": (a, b) => b.rating - a.rating,
  "name-asc": (a, b) => a.title.localeCompare(b.title),
};

export default function Category() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { items, categories, status, error } = useSelector((s) => s.products);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Filters live in the URL, so they survive refresh, back/forward and shared links.
  const search = params.get("search") ?? "";
  const sort = SORTS[params.get("sort")] ? params.get("sort") : "featured";

  const meta = getCategoryMeta(slug);
  const loading = status === "loading" || status === "idle";

  const categoryItems = useMemo(() => items.filter((p) => p.category === slug), [items, slug]);

  const bounds = useMemo(() => {
    if (categoryItems.length === 0) return { min: 0, max: 100 };
    const prices = categoryItems.map(getSalePrice);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [categoryItems]);

  const priceMin = params.has("priceMin") ? Number(params.get("priceMin")) : bounds.min;
  const priceMax = params.has("priceMax") ? Number(params.get("priceMax")) : bounds.max;

  const setParam = (updates) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, val]) => {
          if (val === "" || val === null || val === undefined || val === "featured") next.delete(key);
          else next.set(key, val);
        });
        return next;
      },
      { replace: true }
    );

  const hasActiveFilters =
    Boolean(search) || sort !== "featured" || priceMin !== bounds.min || priceMax !== bounds.max;

  const resetFilters = () => setParams({}, { replace: true });

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = categoryItems.filter((p) => {
      const price = getSalePrice(p);
      const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
      const matchesPrice = price >= priceMin && price <= priceMax;
      return matchesSearch && matchesPrice;
    });
    const compare = SORT_COMPARE[sort];
    return compare ? [...list].sort(compare) : list;
  }, [categoryItems, search, priceMin, priceMax, sort]);

  // Category page: 404 only once categories have actually loaded and this slug isn't one of them
  // (avoids flashing "not found" while the very first fetch is still in flight).
  const knownSlugs = categories.length ? categories.map((c) => c.slug) : [...new Set(items.map((p) => p.category))];
  const categoryKnown = knownSlugs.includes(slug);
  const notFound = !loading && status !== "failed" && !categoryKnown;

  if (notFound) {
    return (
      <div className="container py-5 text-center">
        <p className="h5 mb-1">This category doesn't exist</p>
        <p className="text-secondary mb-4">It may have been renamed or removed.</p>
        <Link to="/products" className="btn btn-wasla">
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <CategoryHeader meta={meta} count={visible.length} loading={loading} />

      <div className="row g-4">
        <div className="col-lg-3">
          <CategoryFilters
            search={search}
            onSearchChange={(v) => setParam({ search: v })}
            sort={sort}
            onSortChange={(v) => setParam({ sort: v })}
            bounds={bounds}
            value={{ min: priceMin, max: priceMax }}
            onApplyPrice={(min, max) => setParam({ priceMin: min, priceMax: max })}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        <div className="col-lg-9">
          {visible.length !== categoryItems.length && categoryItems.length > 0 && (
            <p className="text-secondary small mb-3">
              Showing {visible.length} of {categoryItems.length} products
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
            hasItems={categoryItems.length > 0}
            onRetry={() => dispatch(fetchProducts())}
            onReset={resetFilters}
          />
        </div>
      </div>
    </div>
  );
}
