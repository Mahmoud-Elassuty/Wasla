import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchWishlist, resetStatus } from "../store/reducers/wishlistSlice";
import { fetchProducts } from "../store/reducers/productsSlice";
import ProductList from "../components/products/ProductList";
import { matchesProductQuery, normalizeProductQuery } from "../utils/productSearch";
import "../styles/wishlist.css";
import ProfileReturnLink from "../components/common/ProfileReturnLink";

export default function Wishlist() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const userId = useSelector((s) => s.auth.user?.id);
  const wishlist = useSelector((s) => s.wishlist);
  const products = useSelector((s) => s.products);
  const [query, setQuery] = useState("");

  const load = () => {
    dispatch(fetchWishlist(userId));
    dispatch(fetchProducts());
  };

  useEffect(() => {
    if (userId === undefined) return;
    const request = dispatch(fetchWishlist(userId));
    dispatch(fetchProducts()); // wishlist entries only hold ids, the products come from here
    return () => {
      request.abort();
      dispatch(resetStatus());
    };
  }, [dispatch, userId]);

  // Newest first. Entries whose product no longer exists are skipped.
  const saved = useMemo(() => {
    const byId = new Map(products.items.map((p) => [p.id, p]));
    return [...wishlist.items].reverse().map((w) => byId.get(w.productId)).filter(Boolean);
  }, [wishlist.items, products.items]);

  // Local-only search over the products already saved (title, brand, category, tags).
  const filtered = useMemo(() => {
    if (!normalizeProductQuery(query)) return saved;
    return saved.filter((product) => matchesProductQuery(product, query));
  }, [saved, query]);
  const searching = query.trim() !== "";

  const failed =
    (wishlist.status === "failed" && wishlist.items.length === 0) ||
    (products.status === "failed" && products.items.length === 0);
  const wishlistKnown = wishlist.items.length > 0 || wishlist.status === "succeeded";
  const productsKnown = products.items.length > 0 || products.status === "succeeded";

  let body;
  if (failed) {
    body = (
      <ProductList
        products={[]}
        status="failed"
        error={wishlist.error ?? products.error}
        hasItems={false}
        onRetry={load}
      />
    );
  } else if (!wishlistKnown || !productsKnown) {
    body = <ProductList products={[]} status="loading" hasItems={false} />;
  } else if (saved.length === 0) {
    body = (
      <div className="text-center py-5">
        <i className="bi bi-heart fs-1 text-secondary" aria-hidden="true" />
        <p className="h5 mt-3 mb-1">Your wishlist is empty</p>
        <p className="text-secondary">Tap the heart on any product to save it here.</p>
        <Link to="/products" className="btn btn-accent px-4">Browse products</Link>
      </div>
    );
  } else {
    body = (
      <>
        <form
          className="wishlist-search input-group search-box mb-3"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <span className="input-group-text bg-white" aria-hidden="true">
            <i className="bi bi-search" />
          </span>
          <input
            type="search"
            className="form-control"
            placeholder="Search your favorites..."
            aria-label="Search your favorites"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setQuery("");
            }}
          />
          {query && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          )}
        </form>
        {filtered.length === 0 ? (
          <div className="text-center py-5" role="status">
            <i className="bi bi-search fs-1 text-secondary" aria-hidden="true" />
            <p className="h5 mt-3 mb-1">No favorites found</p>
            <p className="text-secondary">Nothing in your wishlist matches &ldquo;{query.trim()}&rdquo;.</p>
            <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setQuery("")}>
              Clear search
            </button>
          </div>
        ) : (
          <ProductList products={filtered} status="succeeded" hasItems onRetry={load} />
        )}
      </>
    );
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <p className="eyebrow mb-1">My wishlist</p>
            <h1 className="h3 mb-1">قائمة المفضلة</h1>
          </div>
          {searchParams.get("from") === "profile" && <ProfileReturnLink />}
        </div>
        {saved.length > 0 && (
          <p className="small text-secondary mb-0">
            {searching ? `${filtered.length} of ${saved.length}` : saved.length}{" "}
            {saved.length === 1 ? "item" : "items"}
          </p>
        )}
      </div>
      {body}
    </div>
  );
}
