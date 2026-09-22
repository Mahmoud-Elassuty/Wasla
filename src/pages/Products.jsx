import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, fetchProducts } from "../store/reducers/productsSlice";
import ProductList from "../components/products/ProductList";
import { getSalePrice, titleCase } from "../utils/format";

const SORTS = {
  featured: { label: "Featured", compare: null },
  "price-asc": { label: "Price: low to high", compare: (a, b) => getSalePrice(a) - getSalePrice(b) },
  "price-desc": { label: "Price: high to low", compare: (a, b) => getSalePrice(b) - getSalePrice(a) },
  "rating-desc": { label: "Top rated", compare: (a, b) => b.rating - a.rating },
  "name-asc": { label: "Name: A to Z", compare: (a, b) => a.title.localeCompare(b.title) },
};

export default function Products() {
  const dispatch = useDispatch();
  const { items, categories, status, error } = useSelector((s) => s.products);
  const [params, setParams] = useSearchParams();

  // Filters live in the URL, so they survive refresh, back/forward and the navbar search.
  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const sort = SORTS[params.get("sort")] ? params.get("sort") : "featured";

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const setParam = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== "featured") next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );

  const resetFilters = () => setParams({}, { replace: true });

  const categoryOptions = useMemo(
    () =>
      categories.length
        ? categories
        : [...new Set(items.map((p) => p.category))].map((slug) => ({ slug, name: titleCase(slug) })),
    [categories, items]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = items.filter(
      (p) =>
        (!category || p.category === category) &&
        (!q || p.title.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
    );
    const { compare } = SORTS[sort];
    return compare ? [...list].sort(compare) : list;
  }, [items, search, category, sort]);

  const heading = category
    ? categoryOptions.find((c) => c.slug === category)?.name ?? titleCase(category)
    : "All products";

  return (
    <div className="container py-4">
      <div className="mb-3">
        <h1 className="h3 mb-1">{heading}</h1>
        {items.length > 0 && (
          <p className="text-secondary small mb-0">
            Showing {visible.length} of {items.length} products
            {(search || category) && (
              <button type="button" className="btn btn-link btn-sm p-0 ms-2 align-baseline" onClick={resetFilters}>
                Clear filters
              </button>
            )}
          </p>
        )}
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md">
          <div className="search-box">
            <input
              type="search"
              className="form-control"
              placeholder="Search by name or brand"
              aria-label="Search products"
              value={search}
              onChange={(e) => setParam("search", e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-auto">
          <select
            className="form-select"
            aria-label="Sort products"
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
          >
            {Object.entries(SORTS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {categoryOptions.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter by category">
          <button
            type="button"
            className={`chip${category ? "" : " active"}`}
            aria-pressed={!category}
            onClick={() => setParam("category", "")}
          >
            All
          </button>
          {categoryOptions.map(({ slug, name }) => (
            <button
              key={slug}
              type="button"
              className={`chip${category === slug ? " active" : ""}`}
              aria-pressed={category === slug}
              onClick={() => setParam("category", slug)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <ProductList
        products={visible}
        status={status}
        error={error}
        hasItems={items.length > 0}
        onRetry={() => dispatch(fetchProducts())}
        onReset={resetFilters}
      />
    </div>
  );
}
