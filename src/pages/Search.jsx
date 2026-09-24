import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, fetchProducts } from "../store/reducers/productsSlice";
import { getSalePrice, titleCase } from "../utils/format";
import SearchBar from "../components/search/SearchBar";
import SearchFilters from "../components/search/SearchFilters";
import ProductList from "../components/products/ProductList";
import "../styles/search.css";

const SORTS = {
  relevance: "Relevance",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "rating-desc": "Top rated",
  newest: "Newest",
};

// How well a product matches the query: title match ranks highest, then brand, then category.
// Products have no creation date in this schema, so "newest" (below) uses id as a stand-in —
// higher ids were added to the catalog more recently.
function relevance(p, q) {
  const title = p.title.toLowerCase();
  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.includes(q)) return 60;
  if (p.brand?.toLowerCase().includes(q)) return 40;
  if (p.category?.toLowerCase().includes(q)) return 20;
  if (p.description?.toLowerCase().includes(q)) return 10;
  return 0;
}

const parseList = (raw) => (raw ? raw.split(",").filter(Boolean) : []);

export default function Search() {
  const dispatch = useDispatch();
  const { items, categories, status, error } = useSelector((s) => s.products);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Filters live in the URL, so they survive refresh, back/forward and shared links.
  const query = params.get("q") ?? "";
  const selectedCategories = parseList(params.get("category"));
  const selectedBrands = parseList(params.get("brand"));
  const ratingMin = ["4", "3", "2", "1"].includes(params.get("rating")) ? params.get("rating") : "";
  const inStockOnly = params.get("inStock") === "1";
  const sort = SORTS[params.get("sort")] ? params.get("sort") : "relevance";
  const loading = status === "loading" || status === "idle";

  const setParam = (updates) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, val]) => {
          if (val === "" || val === null || val === undefined || val === false) next.delete(key);
          else next.set(key, val === true ? "1" : val);
        });
        return next;
      },
      { replace: true }
    );

  const handleSearch = (q) => setParam({ q });
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

  const resetFilters = () => setParam({ category: "", brand: "", rating: "", inStock: "", priceMin: "", priceMax: "" });

  // The query-matched set — facets (categories/brands/price bounds) are derived from this, so
  // they only ever show options that actually exist within the current search.
  const matched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items
      .map((p) => ({ p, score: relevance(p, q) }))
      .filter(({ score }) => score > 0)
      .map(({ p }) => p);
  }, [items, query]);

  const categoryOptions = useMemo(() => {
    const slugs = [...new Set(matched.map((p) => p.category))];
    const bySlug = new Map(categories.map((c) => [c.slug, c.name]));
    return slugs.map((slug) => ({ slug, name: bySlug.get(slug) ?? titleCase(slug) }));
  }, [matched, categories]);

  const brandOptions = useMemo(
    () => [...new Set(matched.map((p) => p.brand).filter(Boolean))].sort(),
    [matched]
  );

  const bounds = useMemo(() => {
    if (matched.length === 0) return { min: 0, max: 100 };
    const prices = matched.map(getSalePrice);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [matched]);

  const priceMin = params.has("priceMin") ? Number(params.get("priceMin")) : bounds.min;
  const priceMax = params.has("priceMax") ? Number(params.get("priceMax")) : bounds.max;

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    Boolean(ratingMin) ||
    inStockOnly ||
    priceMin !== bounds.min ||
    priceMax !== bounds.max;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = matched.filter((p) => {
      const price = getSalePrice(p);
      return (
        (selectedCategories.length === 0 || selectedCategories.includes(p.category)) &&
        (selectedBrands.length === 0 || selectedBrands.includes(p.brand)) &&
        (!ratingMin || p.rating >= Number(ratingMin)) &&
        (!inStockOnly || p.stock > 0) &&
        price >= priceMin &&
        price <= priceMax
      );
    });

    if (sort === "price-asc") list = [...list].sort((a, b) => getSalePrice(a) - getSalePrice(b));
    else if (sort === "price-desc") list = [...list].sort((a, b) => getSalePrice(b) - getSalePrice(a));
    else if (sort === "rating-desc") list = [...list].sort((a, b) => b.rating - a.rating);
    else if (sort === "newest") list = [...list].sort((a, b) => b.id - a.id);
    else list = [...list].sort((a, b) => relevance(b, q) - relevance(a, q));

    return list;
  }, [matched, query, selectedCategories, selectedBrands, ratingMin, inStockOnly, priceMin, priceMax, sort]);

  const suggestionTitles = useMemo(() => items.map((p) => p.title), [items]);

  return (
    <div className="container py-4">
      <div className="search-hero p-4 p-lg-5 mb-4 text-center">
        <h1 className="h4 mb-3">
          {query ? (
            <>Search results for &ldquo;{query}&rdquo;</>
          ) : (
            "Search wasla"
          )}
        </h1>
        <SearchBar initialValue={query} onSearch={handleSearch} suggestions={suggestionTitles} />
      </div>

      {!query ? (
        <div className="text-center py-5">
          <i className="bi bi-search fs-1 text-secondary" aria-hidden="true" />
          <p className="h5 mt-3 mb-1">Start typing to search</p>
          <p className="text-secondary">Search by product name, brand or category.</p>
        </div>
      ) : (
        <>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <p className="text-secondary small mb-0">
              {loading ? "Searching…" : `${visible.length} result${visible.length === 1 ? "" : "s"} for "${query}"`}
              {!loading && hasActiveFilters && (
                <button type="button" className="btn btn-link btn-sm p-0 ms-2 align-baseline" onClick={resetFilters}>
                  Clear filters
                </button>
              )}
            </p>
            <select
              className="form-select form-select-sm w-auto"
              aria-label="Sort results"
              value={sort}
              onChange={(e) => setParam({ sort: e.target.value === "relevance" ? "" : e.target.value })}
            >
              {Object.entries(SORTS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
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
              {!loading && status !== "failed" && matched.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-emoji-frown fs-1 text-secondary" aria-hidden="true" />
                  <p className="h5 mt-3 mb-1">No results found</p>
                  <p className="text-secondary">
                    We couldn't find anything for &ldquo;{query}&rdquo;. Try a different spelling or a more general term.
                  </p>
                  <Link to="/products" className="btn btn-outline-secondary px-4">Browse all products</Link>
                </div>
              ) : (
                <ProductList
                  products={visible}
                  status={status}
                  error={error}
                  hasItems={matched.length > 0}
                  onRetry={() => dispatch(fetchProducts())}
                  onReset={resetFilters}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
