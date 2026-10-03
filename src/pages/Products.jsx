import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, fetchProducts } from "../store/reducers/productsSlice";
import ProductList from "../components/products/ProductList";
import ProductCard from "../components/products/ProductCard";
import ProductSearch from "../components/common/ProductSearch";
import SearchFilters from "../components/search/SearchFilters";
import MobileFiltersToggle from "../components/common/MobileFiltersToggle";
import { getSalePrice, titleCase } from "../utils/format";
import { matchesProductQuery } from "../utils/productSearch";
import Pagination, { ResultsSummary } from "../components/common/Pagination";
import usePagination from "../hooks/usePagination";
import "../styles/search.css";
import "../styles/customer-experience.css";

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
  const user = useSelector((s) => s.auth.user);
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [isMobileDrawer, setIsMobileDrawer] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches
  );
  const filterToggleRef = useRef(null);

  useEffect(() => {
    const syncViewport = () => setIsMobileDrawer(window.matchMedia("(max-width: 767.98px)").matches);
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (!filtersOpen || !isMobileDrawer) return undefined;
    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => document.getElementById("filters-panel-close")?.focus());
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      filterToggleRef.current?.focus();
    };
  }, [filtersOpen, isMobileDrawer]);

  // Filters live in the URL, so they survive refresh, back/forward and the navbar search.
  // `category` stays a plain (comma-joinable) param name for backward compatibility with
  // existing single-category links, e.g. ProductDetails' "Category: X" link.
  const search = (params.get("search") ?? "").trim();
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
        next.delete("page"); // any filter / sort / search change goes back to page 1
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
  const closeFilters = () => setFiltersOpen(false);
  const applyFiltersAndClose = () => {
    closeFilters();
  };

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

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      const price = getSalePrice(p);
      return (
        (!q || matchesProductQuery(p, q)) &&
        (selectedCategories.length === 0 || selectedCategories.includes(p.category)) &&
        (selectedBrands.length === 0 || selectedBrands.includes(p.brand)) &&
        (!ratingMin || p.rating >= Number(ratingMin)) &&
        (!inStockOnly || p.stock > 0) &&
        price >= priceMin &&
        price <= priceMax
      );
    });
  }, [items, search, selectedCategories, selectedBrands, ratingMin, inStockOnly, priceMin, priceMax]);

  const { suggestedProducts, otherProducts, orderedProducts } = useMemo(() => {
    const hasInterests = user?.role === "customer"
      && Array.isArray(user.interests)
      && user.interests.length > 0;
    const interests = new Set(hasInterests ? user.interests : []);
    const { compare } = SORTS[sort];
    const sortGroup = (group) => compare ? [...group].sort(compare) : group;
    const matchingProducts = hasInterests
      ? filteredProducts.filter((product) => interests.has(product.category))
      : [];

    if (matchingProducts.length === 0) {
      const sortedProducts = sortGroup(filteredProducts);
      return { suggestedProducts: [], otherProducts: sortedProducts, orderedProducts: sortedProducts };
    }

    const seen = new Set();
    const suggested = [];
    const other = [];

    for (const product of filteredProducts) {
      const id = String(product.id);
      if (hasInterests && seen.has(id)) continue;
      if (hasInterests) seen.add(id);
      if (hasInterests && interests.has(product.category)) suggested.push(product);
      else other.push(product);
    }

    const sortedSuggested = sortGroup(suggested);
    const sortedOther = sortGroup(other);

    return {
      suggestedProducts: sortedSuggested,
      otherProducts: sortedOther,
      orderedProducts: [...sortedSuggested, ...sortedOther],
    };
  }, [filteredProducts, sort, user]);

  const suggestedProductIds = useMemo(
    () => new Set(suggestedProducts.map((product) => String(product.id))),
    [suggestedProducts]
  );

  // Pagination runs after filters, per-group sorting and recommendation ordering.
  const { items: pageItems, page, totalPages, total, start, end, goToPage, resultsRef } = usePagination(orderedProducts, {
    loaded: status === "succeeded",
  });
  const pageSuggestedProducts = pageItems.filter((product) => suggestedProductIds.has(String(product.id)));
  const pageOtherProducts = pageItems.filter((product) => !suggestedProductIds.has(String(product.id)));

  const heading = search
    ? `Search results for “${search}”`
    : selectedCategories.length === 1
      ? categoryOptions.find((c) => c.slug === selectedCategories[0])?.name ?? titleCase(selectedCategories[0])
      : "All products";

  return (
    <div className="container py-4">
      <div className="mb-3">
        <h1 className="h3 mb-1">{heading}</h1>
        {items.length > 0 && (
          <p className="text-secondary small mb-0">
            {total === 0
              ? search
                ? `0 products found for “${search}”`
                : "0 products match your filters"
              : <ResultsSummary start={start} end={end} total={total} />}
            {search && total > 0 && ` found for “${search}”`}
            {search && (
              <button type="button" className="btn btn-link btn-sm p-0 ms-2 align-baseline" onClick={() => setParam({ search: "" })}>
                Clear search
              </button>
            )}
            {hasActiveFilters && (
              <button type="button" className="btn btn-link btn-sm p-0 ms-2 align-baseline" onClick={resetFilters}>
                {search ? "Clear all filters" : "Clear filters"}
              </button>
            )}
          </p>
        )}
      </div>

      <div className="mb-4">
        <ProductSearch variant="products-page" />
      </div>

<div className="products-sort-control">
  <label className="products-sort-label">Sort by</label>

  <div className="products-sort-dropdown">
    <button
      type="button"
      className="products-sort-trigger"
      aria-expanded={sortOpen}
      aria-haspopup="listbox"
      onClick={() => setSortOpen((open) => !open)}
    >
      <span>{SORTS[sort].label}</span>
      <i className={`bi bi-chevron-${sortOpen ? "up" : "down"}`} aria-hidden="true" />
    </button>

    {sortOpen && (
      <div className="products-sort-menu" role="listbox">
        {Object.entries(SORTS).map(([key, { label }]) => (
          <button
            key={key}
            type="button"
            className={`products-sort-option${sort === key ? " active" : ""}`}
            role="option"
            aria-selected={sort === key}
            onClick={() => {
              setParam({ sort: key });
              setSortOpen(false);
            }}
          >
            <span>{label}</span>
            {sort === key && (
              <i className="bi bi-check2" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
    )}
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
            filtersOpen={filtersOpen}
            isMobileDrawer={isMobileDrawer}
            onClose={closeFilters}
            onApplyAndClose={applyFiltersAndClose}
          />
        </div>

        <div className="col-lg-9">
          <div className="pagination-results-anchor" ref={resultsRef}>
            {suggestedProducts.length === 0 ? (
              <ProductList
                products={pageItems}
                searchQuery={search}
                status={status}
                error={error}
                hasItems={items.length > 0}
                onRetry={() => dispatch(fetchProducts())}
                onReset={search ? () => setParam({ search: "" }) : resetFilters}
              />
            ) : (
              <>
                {pageSuggestedProducts.length > 0 && (
                  <section className="products-catalog-group mb-4" aria-labelledby="suggested-products-title">
                    <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
                      <div>
                        <h2 id="suggested-products-title" className="h5 font-display mb-1">Suggested for You</h2>
                        <p className="small text-secondary mb-0">Based on your interests</p>
                      </div>
                      <Link to="/profile?section=interests" className="small fw-semibold text-decoration-none">
                        Manage Interests
                      </Link>
                    </div>
                    <ProductList
                      products={pageSuggestedProducts}
                      searchQuery={search}
                      status={status}
                      error={error}
                      hasItems={items.length > 0}
                      onRetry={() => dispatch(fetchProducts())}
                      onReset={search ? () => setParam({ search: "" }) : resetFilters}
                    />
                  </section>
                )}
                {pageOtherProducts.length > 0 && (
                  <section className="products-catalog-group">
                    {suggestedProducts.length > 0 && <h2 className="h5 font-display mb-3">All Products</h2>}
                    <ProductList
                      products={pageOtherProducts}
                      searchQuery={search}
                      status={status}
                      error={error}
                      hasItems={items.length > 0}
                      onRetry={() => dispatch(fetchProducts())}
                      onReset={search ? () => setParam({ search: "" }) : resetFilters}
                    />
                  </section>
                )}
                {pageItems.length === 0 && (
                  <ProductList
                    products={pageItems}
                    searchQuery={search}
                    status={status}
                    error={error}
                    hasItems={items.length > 0}
                    onRetry={() => dispatch(fetchProducts())}
                    onReset={search ? () => setParam({ search: "" }) : resetFilters}
                  />
                )}
              </>
            )}
            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
          </div>
        </div>
      </div>
    </div>
  );
}
