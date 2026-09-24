import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, fetchProducts } from "../store/reducers/productsSlice";
import ProductList from "../components/products/ProductList";
import SearchFilters from "../components/search/SearchFilters";
import { getSalePrice, titleCase } from "../utils/format";
import "../styles/search.css";

const SORTS = {
  featured: { label: "Featured", compare: null },
  "price-asc": { label: "Price: low to high", compare: (a, b) => getSalePrice(a) - getSalePrice(b) },
  "price-desc": { label: "Price: high to low", compare: (a, b) => getSalePrice(b) - getSalePrice(a) },
  "rating-desc": { label: "Top rated", compare: (a, b) => b.rating - a.rating },
  "name-asc": { label: "Name: A to Z", compare: (a, b) => a.title.localeCompare(b.title) },
};

const parseList = (raw) => (raw ? raw.split(",").filter(Boolean) : []);

export default function Products() {
  const dispatch = useDispatch();
  const { items, categories, status, error } = useSelector((s) => s.products);
  const [params, setParams] = useSearchParams();

  // Filters live in the URL, so they survive refresh, back/forward and the navbar search.
  // `category` stays a plain (comma-joinable) param name for backward compatibility with
  // existing single-category links, e.g. ProductDetails' "Category: X" link.
  const search = params.get("search") ?? "";
  const selectedCategories = parseList(params.get("category"));
  const selectedBrands = parseList(params.get("brand"));
  const ratingMin = ["4", "3", "2", "1"].includes(params.get("rating")) ? params.get("rating") : "";
  const inStockOnly = params.get("inStock") === "1";
  const sort = SORTS[params.get("sort")] ? params.get("sort") : "featured";

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const setParam = (updates) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, val]) => {
          if (val === "" || val === null || val === undefined || val === false || val === "featured") {
            next.delete(key);
          } else {
            next.set(key, val === true ? "1" : val);
          }
        });
        return next;
      },
      { replace: true }
    );

  const toggleCategory = (slug) =>
    setParam({
      category: selectedCategories.includes(slug)
        ? selectedCategories.filter((c) => c !== slug).join(",")
        : [...selectedCategories, slug].join(","),
    });
  const toggleBrand = (brand) =>
    setParam({
      brand: selectedBrands.includes(brand)
        ? selectedBrands.filter((b) => b !== brand).join(",")
        : [...selectedBrands, brand].join(","),
    });

  const resetFilters = () => setParams({}, { replace: true });

  const categoryOptions = useMemo(
    () =>
      categories.length
        ? categories
        : [...new Set(items.map((p) => p.category))].map((slug) => ({ slug, name: titleCase(slug) })),
    [categories, items]
  );

  const brandOptions = useMemo(() => [...new Set(items.map((p) => p.brand).filter(Boolean))].sort(), [items]);

  const bounds = useMemo(() => {
    if (items.length === 0) return { min: 0, max: 100 };
    const prices = items.map(getSalePrice);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [items]);

  const priceMin = params.has("priceMin") ? Number(params.get("priceMin")) : bounds.min;
  const priceMax = params.has("priceMax") ? Number(params.get("priceMax")) : bounds.max;

  const hasActiveFilters =
    Boolean(search) ||
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    Boolean(ratingMin) ||
    inStockOnly ||
    sort !== "featured" ||
    priceMin !== bounds.min ||
    priceMax !== bounds.max;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = items.filter((p) => {
      const price = getSalePrice(p);
      return (
        (!q || p.title.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q)) &&
        (selectedCategories.length === 0 || selectedCategories.includes(p.category)) &&
        (selectedBrands.length === 0 || selectedBrands.includes(p.brand)) &&
        (!ratingMin || p.rating >= Number(ratingMin)) &&
        (!inStockOnly || p.stock > 0) &&
        price >= priceMin &&
        price <= priceMax
      );
    });
    const { compare } = SORTS[sort];
    return compare ? [...list].sort(compare) : list;
  }, [items, search, selectedCategories, selectedBrands, ratingMin, inStockOnly, priceMin, priceMax, sort]);

  const heading =
    selectedCategories.length === 1
      ? categoryOptions.find((c) => c.slug === selectedCategories[0])?.name ?? titleCase(selectedCategories[0])
      : "All products";

  return (
    <div className="container py-4">
      <div className="mb-3">
        <h1 className="h3 mb-1">{heading}</h1>
        {items.length > 0 && (
          <p className="text-secondary small mb-0">
            Showing {visible.length} of {items.length} products
            {hasActiveFilters && (
              <button type="button" className="btn btn-link btn-sm p-0 ms-2 align-baseline" onClick={resetFilters}>
                Clear filters
              </button>
            )}
          </p>
        )}
      </div>

      <div className="row g-2 mb-4">
        <div className="col-md">
          <div className="search-box">
            <input
              type="search"
              className="form-control"
              placeholder="Search by name or brand"
              aria-label="Search products"
              value={search}
              onChange={(e) => setParam({ search: e.target.value })}
            />
          </div>
        </div>
        <div className="col-md-auto">
          <select
            className="form-select"
            aria-label="Sort products"
            value={sort}
            onChange={(e) => setParam({ sort: e.target.value })}
          >
            {Object.entries(SORTS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-3">
          <SearchFilters
            categoryOptions={categoryOptions}
            selectedCategories={selectedCategories}
            onToggleCategory={toggleCategory}
            brandOptions={brandOptions}
            selectedBrands={selectedBrands}
            onToggleBrand={toggleBrand}
            ratingMin={ratingMin}
            onRatingChange={(v) => setParam({ rating: v })}
            inStockOnly={inStockOnly}
            onInStockChange={(v) => setParam({ inStock: v })}
            bounds={bounds}
            priceValue={{ min: priceMin, max: priceMax }}
            onApplyPrice={(min, max) => setParam({ priceMin: min, priceMax: max })}
            hasActiveFilters={hasActiveFilters}
            onClearAll={resetFilters}
          />
        </div>

        <div className="col-lg-9">
          <ProductList
            products={visible}
            status={status}
            error={error}
            hasItems={items.length > 0}
            onRetry={() => dispatch(fetchProducts())}
            onReset={resetFilters}
          />
        </div>
      </div>
    </div>
  );
}
