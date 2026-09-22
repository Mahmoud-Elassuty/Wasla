import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchWishlist, resetStatus } from "../store/reducers/wishlistSlice";
import { fetchProducts } from "../store/reducers/productsSlice";
import ProductList from "../components/products/ProductList";

export default function Wishlist() {
  const dispatch = useDispatch();
  const userId = useSelector((s) => s.auth.user?.id);
  const wishlist = useSelector((s) => s.wishlist);
  const products = useSelector((s) => s.products);

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
    body = <ProductList products={saved} status="succeeded" hasItems onRetry={load} />;
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <p className="eyebrow mb-1">My wishlist</p>
        <h1 className="h3 mb-1">قائمة المفضلة</h1>
        {saved.length > 0 && (
          <p className="small text-secondary mb-0">
            {saved.length} {saved.length === 1 ? "item" : "items"}
          </p>
        )}
      </div>
      {body}
    </div>
  );
}
