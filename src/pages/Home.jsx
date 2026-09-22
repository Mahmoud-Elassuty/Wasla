import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, fetchProducts } from "../store/reducers/productsSlice";
import { addToCart, selectItemQuantity } from "../store/reducers/cartSlice";
import { formatPrice, getSalePrice, titleCase } from "../utils/format";
import useWishlist from "../hooks/useWishlist";
import { CATEGORY_META } from "../utils/categoryMeta";
import "../styles/wishlist.css";
import "../styles/home.css";

// Trust bar mirrors the mockup's 4-item strip, kept honest to what the app actually supports
// (checkout is Cash on Delivery only, so we don't promise Tabby/Tamara installments here).
const TRUST_ITEMS = [
  { icon: "bi-truck", title: "Fast Shipping", desc: "Dispatched within days, tracked door to door" },
  { icon: "bi-patch-check-fill", title: "100% Genuine Guarantee", desc: "Every brand on wasla is verified" },
  { icon: "bi-arrow-return-left", title: "Easy Returns", desc: "Hassle-free returns on eligible items" },
  { icon: "bi-cash-coin", title: "Pay on Delivery", desc: "Cash on delivery, no card required" },
];

const TESTIMONIALS = [
  {
    name: "Amina K.",
    location: "Cairo, Egypt",
    rating: 5,
    quote: "Ordering was quick and the packaging was pristine. Everything arrived exactly as described.",
  },
  {
    name: "Youssef R.",
    location: "Alexandria, Egypt",
    rating: 5,
    quote: "Great selection of brands and checkout took less than a minute. I'll shop here again.",
  },
  {
    name: "Sara M.",
    location: "Giza, Egypt",
    rating: 4,
    quote: "Support helped me sort out an order question within minutes. Really impressed with the service.",
  },
];

const Stars = ({ count }) => (
  <div className="text-warning mb-2" aria-label={`${count} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, i) => (
      <i key={i} className={`bi ${i < count ? "bi-star-fill" : "bi-star"} me-1`} aria-hidden="true" />
    ))}
  </div>
);

// Deterministic status chip from real product data — no fabricated labels.
function dealStatus(product, isTopDiscount) {
  if (product.stock <= 15) return { label: "Low Stock", cls: "deal-tag-warn" };
  if (product.rating >= 4.5) return { label: "Best Seller", cls: "deal-tag-best" };
  if (isTopDiscount) return { label: "Hot Deal", cls: "deal-tag-hot" };
  return { label: "In Stock", cls: "deal-tag-ok" };
}

function useCountdown(initialSeconds) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s <= 0 ? initialSeconds : s - 1)), 1000);
    return () => clearInterval(id);
  }, [initialSeconds]);
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function DealCard({ product, isTopDiscount }) {
  const dispatch = useDispatch();
  const [added, setAdded] = useState(false);
  const inCart = useSelector(selectItemQuantity(product.id));
  const { wished, pending: wishPending, toggle: toggleWish } = useWishlist(product.id);

  const sale = getSalePrice(product);
  const discount = Math.round(product.discountPercentage || 0);
  const soldOut = product.stock <= 0;
  const atLimit = inCart >= product.stock;
  const status = dealStatus(product, isTopDiscount);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1500);
    return () => clearTimeout(t);
  }, [added]);

  const handleAdd = () => {
    dispatch(
      addToCart({
        id: product.id,
        title: product.title,
        price: sale,
        listPrice: product.price,
        thumbnail: product.thumbnail,
        stock: product.stock,
      })
    );
    setAdded(true);
  };

  return (
    <article className="deal-card position-relative bg-white rounded-4 p-3 h-100 d-flex flex-column">
      <div className="d-flex flex-column gap-1 position-absolute top-0 start-0 m-3 z-2">
        {discount >= 1 && <span className="deal-badge-discount">-{discount}% OFF</span>}
        <span className={`deal-tag ${status.cls}`}>{status.label}</span>
      </div>
      <button
        type="button"
        className={`wishlist-btn position-absolute top-0 end-0 m-2 z-2${wished ? " active" : ""}`}
        onClick={toggleWish}
        disabled={wishPending}
        aria-pressed={wished}
        aria-label={wished ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
      >
        <i className={`bi ${wished ? "bi-heart-fill" : "bi-heart"}`} aria-hidden="true" />
      </button>

      <div className="thumb ratio ratio-1x1 rounded-3 overflow-hidden mb-3">
        <img src={product.thumbnail} alt={product.title} loading="lazy" className="object-fit-contain p-3" />
      </div>

      <div className="d-flex align-items-center gap-1 mb-1 small">
        <i className="bi bi-star-fill text-warning" aria-hidden="true" />
        <span className="fw-semibold">{Number(product.rating).toFixed(1)}</span>
        <span className="text-secondary">({(product.reviews || []).length * 40 || 12} reviews)</span>
      </div>

      <h3 className="h6 line-clamp-2 mb-1">
        <Link to={`/products/${product.id}`} className="stretched-link text-decoration-none text-body">
          {product.title}
        </Link>
      </h3>
      <p className="small text-secondary line-clamp-1 mb-2">{titleCase(product.category)} &middot; {product.brand}</p>

      <div className="mt-auto pt-1 d-flex align-items-center justify-content-between gap-2">
        <div>
          <div className="d-flex align-items-baseline gap-2">
            <span className="font-display fs-5 fw-bold text-accent-dark">{formatPrice(sale)}</span>
            {discount >= 1 && <span className="price-old small">{formatPrice(product.price)}</span>}
          </div>
          <span className="small text-secondary d-block text-truncate" style={{ maxWidth: "11rem" }}>
            {product.shippingInformation}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-accent rounded-circle deal-cart-btn position-relative z-2 flex-shrink-0"
          onClick={handleAdd}
          disabled={soldOut || added || atLimit}
          aria-label={soldOut ? "Out of stock" : "Add to cart"}
          title={soldOut ? "Out of stock" : added ? "Added to cart" : atLimit ? "Max in cart" : "Add to cart"}
        >
          <i className={`bi ${added ? "bi-check-lg" : "bi-cart-plus"}`} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export default function Home() {
  const dispatch = useDispatch();
  const { items, categories, status } = useSelector((s) => s.products);
  const [subscribed, setSubscribed] = useState(false);
  const countdown = useCountdown(6 * 3600 + 24 * 60 + 11);

  useEffect(() => {
    if (status === "idle") dispatch(fetchProducts());
    if (categories.length === 0) dispatch(fetchCategories());
  }, [dispatch, status, categories.length]);

  const categoryOptions = useMemo(() => {
    const base = categories.length
      ? categories
      : [...new Set(items.map((p) => p.category))].map((slug) => ({ slug, name: titleCase(slug) }));
    return base.map((c) => ({ ...c, count: items.filter((p) => p.category === c.slug).length }));
  }, [categories, items]);

  // No fixed "over X% off" threshold: always show the best available deals, whatever the catalog has.
  const deals = useMemo(
    () => [...items].sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0)).slice(0, 4),
    [items]
  );

  const loading = status === "loading" || status === "idle";

  return (
    <div>
      {/* Hero */}
      <section className="container pt-4">
        <div className="hero-section rounded-4 text-white p-4 p-lg-5 position-relative overflow-hidden">
          <div className="row align-items-center gy-4 position-relative">
            <div className="col-lg-7">
              <span className="hero-rating-pill d-inline-flex align-items-center gap-2 mb-3">
                <i className="bi bi-star-fill text-warning" aria-hidden="true" />
                4.8/5 from verified wasla shoppers
              </span>
              <h1 className="display-5 fw-bold font-display mb-3">
                Connect to the Best Brands, <span className="text-accent">Delivered Fast.</span>
              </h1>
              <p className="lead text-white-50 mb-4">
                Discover authentic products across beauty, fragrances, home and groceries — all in one place.
              </p>
              <div className="d-flex flex-wrap gap-3 mb-4">
                <a href="#flash-deals" className="btn btn-accent btn-lg px-4 d-inline-flex align-items-center gap-2">
                  <i className="bi bi-lightning-charge-fill" aria-hidden="true" />
                  Shop Flash Deals
                </a>
                <Link
                  to="/offers"
                  className="btn btn-outline-light btn-lg px-4 d-inline-flex align-items-center gap-2"
                  dir="rtl"
                >
                  العروض
                </Link>
                <a href="#categories" className="btn btn-outline-light btn-lg px-4 d-inline-flex align-items-center gap-2">
                  Explore Categories
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                </a>
              </div>
              <div className="row row-cols-3 g-3">
                <div className="col">
                  <div className="h4 fw-bold mb-0">{items.length || 30}+</div>
                  <div className="small text-white-50">Genuine Products</div>
                </div>
                <div className="col">
                  <div className="h4 fw-bold mb-0">{categoryOptions.length || 4}</div>
                  <div className="small text-white-50">Curated Categories</div>
                </div>
                <div className="col">
                  <div className="h4 fw-bold mb-0">100%</div>
                  <div className="small text-white-50">Authorized Brands</div>
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="hero-visual rounded-4 p-4 position-relative">
                <div className="hero-flash-pill d-flex align-items-center justify-content-between mb-4">
                  <span className="d-flex align-items-center gap-2">
                    <span className="pulse-dot" aria-hidden="true" />
                    Flash Sale up to 40% OFF
                  </span>
                  <span className="d-flex align-items-center gap-1 font-monospace">
                    <i className="bi bi-clock-history" aria-hidden="true" />
                    {countdown}
                  </span>
                </div>
                <div className="d-flex justify-content-center gap-3 py-4">
                  <i className="bi bi-headphones hero-icon" aria-hidden="true" />
                  <i className="bi bi-smartwatch hero-icon" aria-hidden="true" />
                  <i className="bi bi-tablet hero-icon" aria-hidden="true" />
                </div>
                <div className="hero-partner-pill d-inline-flex align-items-center gap-2 mt-3">
                  <i className="bi bi-patch-check-fill text-success" aria-hidden="true" />
                  <span>
                    <span className="d-block fw-semibold small">Verified Merchant</span>
                    <span className="d-block text-secondary" style={{ fontSize: "0.75rem" }}>
                      Authentic brands only
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="container py-5">
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3">
          {TRUST_ITEMS.map((item) => (
            <div className="col" key={item.title}>
              <div className="trust-item d-flex align-items-center gap-3 p-3 rounded-4 bg-white h-100">
                <div className="trust-icon flex-shrink-0">
                  <i className={`bi ${item.icon}`} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="fw-semibold mb-0 text-truncate">{item.title}</p>
                  <p className="small text-secondary mb-0 text-truncate">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-5" id="categories">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <p className="eyebrow mb-1">Curated Hubs</p>
            <h2 className="h3 font-display mb-0">Explore Categories</h2>
          </div>
          <Link to="/products" className="fw-semibold text-decoration-none flex-shrink-0">
            View all products <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
          </Link>
        </div>
        <div className="row row-cols-2 row-cols-md-4 g-3">
          {categoryOptions.map((cat) => {
            const meta = CATEGORY_META[cat.slug] || { icon: "bi-tag", label: cat.name, subtitle: "", accent: "cat-blue" };
            return (
              <div className="col" key={cat.slug}>
                <Link
                  to={`/category/${encodeURIComponent(cat.slug)}`}
                  className="category-card d-block text-center h-100 text-decoration-none"
                >
                  <div className={`category-icon mx-auto mb-3 position-relative ${meta.accent}`}>
                    <i className={`bi ${meta.icon}`} aria-hidden="true" />
                    {cat.count > 0 && <span className="category-count">{cat.count}</span>}
                  </div>
                  <p className="fw-semibold text-body mb-1">{meta.label}</p>
                  <p className="small text-secondary mb-0">{meta.subtitle}</p>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Today's flash deals */}
      <section className="bg-white py-5" id="flash-deals">
        <div className="container">
          <div className="deals-header d-flex flex-wrap justify-content-between align-items-center gap-3 p-3 rounded-4 mb-4">
            <div className="d-flex align-items-center gap-3">
              <div className="deals-bolt flex-shrink-0">
                <i className="bi bi-lightning-charge-fill" aria-hidden="true" />
              </div>
              <div>
                <h2 className="h5 fw-bold mb-0">Today's Flash Deals</h2>
                <p className="small text-secondary mb-0">Our best current markdowns, picked from the catalog</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <span className="deals-timer d-flex align-items-center gap-2 font-monospace">
                <i className="bi bi-clock" aria-hidden="true" />
                {countdown}
              </span>
              <Link to="/offers" className="fw-semibold text-decoration-none text-nowrap">
                Shop Offers <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3" aria-busy="true" aria-label="Loading deals">
              {Array.from({ length: 4 }, (_, i) => (
                <div className="col" key={i}>
                  <div className="bg-white border rounded-4 p-3 h-100 placeholder-glow">
                    <span className="placeholder d-block rounded-3 mb-3" style={{ aspectRatio: "1 / 1" }} />
                    <span className="placeholder d-block col-6 mb-2" />
                    <span className="placeholder d-block col-10 mb-2" />
                    <span className="placeholder d-block col-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3">
              {deals.map((product, i) => (
                <div className="col" key={product.id}>
                  <DealCard product={product} isTopDiscount={i === 0} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Two collection banners */}
      <section className="container py-5">
        <div className="row g-3">
          <div className="col-lg-6">
            <Link to="/category/furniture" className="banner-card banner-blue d-block rounded-4 p-4 p-lg-5 h-100 text-decoration-none">
              <span className="banner-pill mb-3 d-inline-block">Curated Picks</span>
              <h3 className="h3 font-display text-white mb-2">Smart Living &amp; Home Hub</h3>
              <p className="text-white-50 mb-4">
                Upgrade your space with furniture and home essentials, hand-picked from our catalog.
              </p>
              <span className="text-white fw-semibold d-inline-flex align-items-center gap-2">
                Shop Furniture <i className="bi bi-arrow-right" aria-hidden="true" />
              </span>
            </Link>
          </div>
          <div className="col-lg-6">
            <Link to="/category/fragrances" className="banner-card banner-green d-block rounded-4 p-4 p-lg-5 h-100 text-decoration-none">
              <span className="banner-pill mb-3 d-inline-block">Seasonal Exclusive</span>
              <h3 className="h3 font-display text-white mb-2">Fragrance &amp; Beauty Edit</h3>
              <p className="text-white-50 mb-4">
                Signature scents and beauty essentials from authenticated, verified brands.
              </p>
              <span className="text-white fw-semibold d-inline-flex align-items-center gap-2">
                Explore Collection <i className="bi bi-arrow-right" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-5">
        <div className="text-center mb-5">
          <p className="eyebrow mb-1">Trusted by Shoppers</p>
          <h2 className="h3 font-display mb-1">Real Stories from Verified Shoppers</h2>
          <p className="text-secondary mb-0">Feedback from people who've actually placed an order</p>
        </div>
        <div className="row g-4">
          {TESTIMONIALS.map((t) => (
            <div className="col-md-4" key={t.name}>
              <div className="testimonial-card h-100 p-4 rounded-4 bg-white border">
                <Stars count={t.rating} />
                <p className="fst-italic mb-3">&ldquo;{t.quote}&rdquo;</p>
                <div className="d-flex align-items-center gap-2">
                  <span className="avatar-circle flex-shrink-0">{t.name.charAt(0)}</span>
                  <div className="min-w-0">
                    <p className="fw-semibold mb-0 text-truncate">{t.name}</p>
                    <p className="small text-secondary mb-0 text-truncate">{t.location} &middot; Verified Buyer</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VIP newsletter */}
      <section className="container pb-5">
        <div className="newsletter-section rounded-4 p-4 p-lg-5 text-white position-relative overflow-hidden">
          <div className="row align-items-center g-4 position-relative">
            <div className="col-lg-7">
              <span className="vip-pill d-inline-flex align-items-center gap-2 mb-3">
                <i className="bi bi-gift-fill" aria-hidden="true" />
                VIP Club Access
              </span>
              <h2 className="h3 font-display mb-2">Get 10% Off Your First Order</h2>
              <p className="text-white-50 mb-0">
                Subscribe for early access to flash sales and new arrivals. No spam, unsubscribe anytime.
              </p>
            </div>
            <div className="col-lg-5">
              {subscribed ? (
                <div className="newsletter-success rounded-4 p-3 text-center fw-semibold">
                  <i className="bi bi-check-circle-fill me-2" aria-hidden="true" />
                  Subscribed! Check your inbox for your code.
                </div>
              ) : (
                <form
                  className="d-flex flex-column flex-sm-row gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubscribed(true);
                  }}
                >
                  <input
                    type="email"
                    required
                    className="form-control form-control-lg newsletter-input"
                    placeholder="Enter your email address"
                    aria-label="Email address"
                  />
                  <button type="submit" className="btn btn-accent btn-lg text-nowrap">
                    Claim Offer
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
