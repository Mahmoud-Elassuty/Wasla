import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearSelectedProduct, fetchProductById } from "../store/reducers/productsSlice";
import { addToCart, selectItemQuantity } from "../store/reducers/cartSlice";
import { fetchReviews } from "../store/reducers/reviewsSlice";
import { formatPrice, getSalePrice, titleCase } from "../utils/format";
import useWishlist from "../hooks/useWishlist";
import AverageRating from "../components/reviews/AverageRating";
import ReviewForm from "../components/reviews/ReviewForm";
import ReviewsList from "../components/reviews/ReviewsList";
import "../styles/reviews.css";

function ProductView({ product, backTo }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false); // keeps the "View cart" message visible
  const [justAdded, setJustAdded] = useState(false); // 1.5 s button feedback
  const [showReviewForm, setShowReviewForm] = useState(false);
  const inCart = useSelector(selectItemQuantity(product.id));
  const { wished, pending: wishPending, toggle: toggleWish } = useWishlist(product.id);
  const user = useSelector((s) => s.auth.user);
  const {
    items: reviews,
    status: reviewsStatus,
    averageRating,
  } = useSelector((s) => s.reviews);

  const gallery = product.images?.length ? product.images : [product.thumbnail];
  const sale = getSalePrice(product);
  const discount = Math.round(product.discountPercentage || 0);
  const inStock = product.stock > 0;
  const remaining = Math.max(0, product.stock - inCart); // what can still be added
  const atLimit = inStock && remaining === 0;
  const qtyToAdd = Math.min(qty, Math.max(1, remaining));
  const stock = !inStock
    ? { cls: "stock-out", label: "Out of stock" }
    : product.stock <= 10
      ? { cls: "stock-low", label: `Only ${product.stock} left` }
      : { cls: "stock-ok", label: "In stock" };

  const info = [
    { icon: "bi-truck", text: product.shippingInformation },
    { icon: "bi-shield-check", text: product.warrantyInformation },
    { icon: "bi-arrow-repeat", text: product.returnPolicy },
  ].filter((i) => i.text);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 1500);
    return () => clearTimeout(timer);
  }, [justAdded]);

  useEffect(() => {
    const request = dispatch(fetchReviews(product.id));
    return () => request.abort();
  }, [dispatch, product.id]);

  const distribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      dist[r.rating] = (dist[r.rating] || 0) + 1;
    });
    return dist;
  }, [reviews]);

  const changeQty = (n) => {
    setQty(Math.min(Math.max(1, n || 1), Math.max(1, remaining)));
    setAdded(false);
  };

  const handleAdd = () => {
    dispatch(
      addToCart({
        id: product.id,
        title: product.title,
        price: sale,
        listPrice: product.price,
        thumbnail: product.thumbnail,
        stock: product.stock,
        quantity: qtyToAdd,
      })
    );
    setAdded(true);
    setJustAdded(true);
    setQty(1); // next add starts from 1 again
  };

  return (
    <div className="container py-4">
      <nav aria-label="Breadcrumb">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
          <li className="breadcrumb-item">
            <Link to={`/products?category=${encodeURIComponent(product.category)}`}>
              {titleCase(product.category)}
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">{product.title}</li>
        </ol>
      </nav>

      <div className="row g-4 g-lg-5">
        <div className="col-lg-6">
          <div className="thumb ratio ratio-1x1 border rounded-4 overflow-hidden">
            <img src={gallery[active]} alt={product.title} className="object-fit-contain p-4" />
          </div>
          {gallery.length > 1 && (
            <div className="d-flex flex-wrap gap-2 mt-3">
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={`thumb-btn${i === active ? " active" : ""}`}
                  onClick={() => setActive(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-pressed={i === active}
                >
                  <img src={src} alt="" className="w-100 h-100 object-fit-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-lg-6">
          {product.brand && <p className="text-secondary small mb-1">{product.brand}</p>}
          <h1 className="h2 mb-2">{product.title}</h1>

          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <span className="rating-badge">
              <i className="bi bi-star-fill" aria-hidden="true" />{" "}
              {Number(reviews.length > 0 ? averageRating : product.rating).toFixed(1)}
            </span>
            {reviews.length > 0 && (
              <span className="small text-secondary">
                ({reviews.length} review{reviews.length === 1 ? "" : "s"})
              </span>
            )}
            <span className={`stock-badge ${stock.cls}`}>{stock.label}</span>
          </div>

          <div className="d-flex flex-wrap align-items-baseline gap-2 mb-3">
            <span className="font-display fs-1 fw-bold">{formatPrice(sale)}</span>
            {discount >= 1 && (
              <>
                <span className="price-old fs-5">{formatPrice(product.price)}</span>
                <span className="badge rounded-pill stock-ok">
                  Save {formatPrice(product.price - sale)} ({discount}% off)
                </span>
              </>
            )}
          </div>

          <p className="text-secondary">{product.description}</p>

          {inStock && !atLimit && (
            <div className="d-flex align-items-center gap-3 my-4">
              <span className="small fw-semibold">Quantity</span>
              <div className="input-group" style={{ width: 140 }}>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => changeQty(qtyToAdd - 1)}
                  disabled={qtyToAdd <= 1}
                  aria-label="Decrease quantity"
                >
                  <i className="bi bi-dash" />
                </button>
                <input
                  type="number"
                  className="form-control text-center qty-input"
                  min={1}
                  max={remaining}
                  value={qtyToAdd}
                  onChange={(e) => changeQty(parseInt(e.target.value, 10))}
                  aria-label="Quantity"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => changeQty(qtyToAdd + 1)}
                  disabled={qtyToAdd >= remaining}
                  aria-label="Increase quantity"
                >
                  <i className="bi bi-plus" />
                </button>
              </div>
            </div>
          )}

          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn ${justAdded ? "btn-success" : "btn-accent"} btn-lg flex-grow-1`}
              onClick={handleAdd}
              disabled={!inStock || justAdded || atLimit}
            >
              {!inStock
                ? "Out of stock"
                : justAdded
                  ? "Added to cart"
                  : atLimit
                    ? "Max in cart"
                    : `Add to cart — ${formatPrice(sale * qtyToAdd)}`}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-lg"
              onClick={toggleWish}
              disabled={wishPending}
              aria-pressed={wished}
            >
              <i className={`bi ${wished ? "bi-heart-fill text-danger" : "bi-heart"} me-2`} aria-hidden="true" />
              {wished ? "Remove from wishlist" : "Add to wishlist"}
            </button>
            <Link to={backTo} className="btn btn-outline-secondary btn-lg">
              Back to products
            </Link>
          </div>

          {inCart > 0 && !added && (
            <p className="small text-secondary mt-2 mb-0">
              {inCart} already in your cart. <Link to="/cart">View cart</Link>
            </p>
          )}

          {added && (
            <div className="alert alert-success py-2 mt-3 mb-0" role="status">
              Added to your cart. <Link to="/cart" className="fw-semibold">View cart</Link>
            </div>
          )}

          {info.length > 0 && (
            <ul className="list-unstyled d-grid gap-2 small text-secondary mt-4 mb-0">
              {info.map(({ icon, text }) => (
                <li key={icon}>
                  <i className={`bi ${icon} text-wasla me-2`} aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <hr className="my-5" />

      <section id="reviews">
        <h2 className="h4 mb-4">Ratings &amp; Reviews</h2>

        <div className="row g-4 align-items-start mb-4">
          <div className="col-lg-8">
            <AverageRating average={averageRating} count={reviews.length} distribution={distribution} />
          </div>
          <div className="col-lg-4 text-lg-end">
            {user ? (
              <button type="button" className="btn btn-wasla" onClick={() => setShowReviewForm((s) => !s)}>
                {showReviewForm ? "Cancel" : "Write a review"}
              </button>
            ) : (
              <Link to="/login" state={{ from: location }} className="btn btn-outline-secondary">
                Log in to write a review
              </Link>
            )}
          </div>
        </div>

        {showReviewForm && user && (
          <div className="border rounded-4 p-3 p-lg-4 mb-4 bg-white">
            <ReviewForm productId={product.id} onSubmitted={() => setShowReviewForm(false)} />
          </div>
        )}

        {reviewsStatus === "loading" && reviews.length === 0 ? (
          <p className="text-secondary">Loading reviews…</p>
        ) : (
          <ReviewsList reviews={reviews} />
        )}
      </section>
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const { selectedProduct, detailsStatus, detailsError } = useSelector((s) => s.products);
  const backTo = location.state?.backTo ?? "/products";

  useEffect(() => {
    const request = dispatch(fetchProductById(id));
    return () => {
      request.abort(); // ignore a slow response for a product we already left
      dispatch(clearSelectedProduct());
    };
  }, [dispatch, id]);

  if (selectedProduct && String(selectedProduct.id) === id) {
    return <ProductView key={selectedProduct.id} product={selectedProduct} backTo={backTo} />;
  }

  if (detailsStatus === "failed") {
    return (
      <div className="container py-5 text-center">
        <h1 className="h4">We couldn't load this product</h1>
        <p className="text-secondary">{detailsError}</p>
        <Link to={backTo} className="btn btn-wasla">Back to products</Link>
      </div>
    );
  }

  return (
    <div className="container py-5 text-center" role="status">
      <div className="spinner-border text-primary" />
      <span className="visually-hidden">Loading product...</span>
    </div>
  );
}
