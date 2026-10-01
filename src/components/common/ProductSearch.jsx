import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { fetchProducts } from "../../store/reducers/productsSlice";
import { formatPrice, getSalePrice, titleCase } from "../../utils/format";
import { normalizeProductQuery, searchProducts } from "../../utils/productSearch";
import "../../styles/product-search.css";

const SUGGESTION_LIMIT = 5;

export default function ProductSearch({ variant = "navbar" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, status } = useSelector((state) => state.products);
  const idPrefix = variant === "products-page" ? "products-product-search" : "navbar-product-search";
  const listId = `${idPrefix}-listbox`;
  const query = searchParams.get("search") ?? "";
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const fetchPending = useRef(false);

  useEffect(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, [location.pathname]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(normalizeProductQuery(query)), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const closeOnOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  const ensureProductsLoaded = () => {
    if ((status !== "idle" && status !== "failed") || fetchPending.current) return;
    fetchPending.current = true;
    dispatch(fetchProducts()).finally(() => {
      fetchPending.current = false;
    });
  };

  const suggestions = useMemo(
    () => searchProducts(items, debouncedQuery).slice(0, SUGGESTION_LIMIT),
    [items, debouncedQuery]
  );
  const queryReady = debouncedQuery !== "" && debouncedQuery === normalizeProductQuery(query);
  const showSuggestions = open && queryReady && status === "succeeded" && suggestions.length > 0;

  const clearUrlSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("search");
    next.delete("q");
    next.delete("page");
    navigate(
      { pathname: location.pathname, search: next.toString() ? `?${next}` : "" },
      { replace: true }
    );
  };

  const handleClear = () => {
    setOpen(false);
    setActiveIndex(-1);
    if (searchParams.has("search")) clearUrlSearch();
  };

  const chooseSuggestion = (product) => {
    setOpen(false);
    setActiveIndex(-1);
    navigate(`/products/${product.id}`, {
      state: { backTo: `${location.pathname}${location.search}` },
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (showSuggestions && activeIndex >= 0) {
      chooseSuggestion(suggestions[activeIndex]);
      return;
    }

    const trimmedQuery = query.trim();
    setOpen(false);
    if (!trimmedQuery) {
      if (location.pathname === "/products" && searchParams.has("search")) clearUrlSearch();
      return;
    }

    const next = new URLSearchParams(location.pathname === "/products" ? searchParams : "");
    next.delete("q");
    next.delete("page");
    next.set("search", trimmedQuery);
    navigate(
      { pathname: "/products", search: `?${next}` },
      { replace: location.pathname === "/products" },
    );
  };

  const handleChange = (event) => {
    const nextQuery = event.target.value;
    setActiveIndex(-1);
    setOpen(true);
    if (!normalizeProductQuery(nextQuery)) {
      if (searchParams.has("search")) clearUrlSearch();
      return;
    }

    ensureProductsLoaded();
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    next.delete("page");
    next.set("search", nextQuery);
    setSearchParams(next, { replace: true });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    } else if (event.key === "ArrowDown" && showSuggestions) {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp" && showSuggestions) {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <form ref={rootRef} className={`product-search product-search-${variant} input-group search-box`} onSubmit={handleSubmit} role="search">
      <input
        type="search"
        className="form-control"
        placeholder={variant === "products-page" ? "Search products, brands, and categories..." : "Search products, brands, essentials..."}
        aria-label={variant === "products-page" ? "Search the product catalog" : "Search products"}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-controls={showSuggestions ? listId : undefined}
        aria-activedescendant={showSuggestions && activeIndex >= 0 ? `${idPrefix}-suggestion-${suggestions[activeIndex].id}` : undefined}
        value={query}
        onChange={handleChange}
        onFocus={() => {
          setOpen(true);
          ensureProductsLoaded();
        }}
        onKeyDown={handleKeyDown}
      />
      <button className="btn btn-accent px-3" type="submit" aria-label="Search">
        <i className="bi bi-search" aria-hidden="true" />
      </button>
      {variant === "products-page" && query.trim() && (
        <button className="btn btn-outline-secondary" type="button" aria-label="Clear search" onClick={handleClear}>
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      )}

      {showSuggestions && (
        <ul id={listId} className="product-search-menu list-unstyled m-0" role="listbox" aria-label="Product suggestions">
          {suggestions.map((product, index) => {
            const subtitle = [product.brand, product.category ? titleCase(product.category) : ""]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={product.id} role="presentation">
                <button
                  id={`${idPrefix}-suggestion-${product.id}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  className="product-search-option"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => chooseSuggestion(product)}
                >
                  {product.thumbnail ? (
                    <img className="product-search-image" src={product.thumbnail} alt="" />
                  ) : (
                    <span className="product-search-image product-search-image-empty" aria-hidden="true">
                      <i className="bi bi-image" />
                    </span>
                  )}
                  <span className="product-search-copy">
                    <span className="product-search-title">{product.title}</span>
                    {subtitle && <span className="product-search-subtitle">{subtitle}</span>}
                  </span>
                  <span className="product-search-price">{formatPrice(getSalePrice(product))}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}