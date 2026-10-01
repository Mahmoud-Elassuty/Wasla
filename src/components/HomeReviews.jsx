import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import RatingStars from "./reviews/RatingStars";
import { fetchHomepageReviews } from "../store/reducers/homeReviewsSlice";

const newestFirst = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
const isHomepageFeatured = (review) => Boolean(review.verified) && review.homepageFeatured !== false;

function orderReviews(items) {
  const baseline = [...items].filter((review) => isHomepageFeatured(review) && review.comment?.trim()).sort(newestFirst);
  const baselinePositions = new Map(baseline.map((review, index) => [String(review.id), index]));
  return baseline.sort((a, b) => {
    const aOrder = Number.isInteger(a.homepageOrder) ? a.homepageOrder : baselinePositions.get(String(a.id));
    const bOrder = Number.isInteger(b.homepageOrder) ? b.homepageOrder : baselinePositions.get(String(b.id));
    return aOrder - bOrder || newestFirst(a, b);
  });
}

const initials = (name) => (name || "Wasla shopper").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

function ReviewCard({ review, product }) {
  const date = review.createdAt && !Number.isNaN(new Date(review.createdAt).getTime())
    ? new Date(review.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : null;

  return (
    <article className="home-review-card h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-start gap-2">
        <RatingStars value={Number(review.rating) || 0} size="0.85rem" />
        <i className="bi bi-quote home-review-quote" aria-hidden="true" />
      </div>
      <h3 className="h6 fw-bold mt-3 mb-2">{review.title || "A shopper review"}</h3>
      <p className="home-review-comment mb-4">{review.comment}</p>
      <div className="home-review-footer d-flex align-items-center gap-2 mt-auto">
        <span className="home-review-avatar" aria-hidden="true">{initials(review.userName)}</span>
        <span className="min-w-0 flex-grow-1">
          <strong className="d-block text-truncate small">{review.userName || "Wasla shopper"}</strong>
          <span className="d-flex align-items-center gap-1 small text-secondary">
            {review.verified && <><i className="bi bi-patch-check-fill text-success" aria-hidden="true" /> Verified buyer</>}
            {date && <><span aria-hidden="true">·</span>{date}</>}
          </span>
        </span>
      </div>
      <div className="home-review-product small text-secondary mt-3 pt-2 border-top">
        Product: {product ? <Link to={`/products/${product.id}`} className="text-decoration-none">{product.title}</Link> : "Product no longer available"}
      </div>
    </article>
  );
}

export default function HomeReviews() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.homeReviews);
  const products = useSelector((state) => state.products.items);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => { dispatch(fetchHomepageReviews()); }, [dispatch]);

  const featuredReviews = useMemo(() => orderReviews(items), [items]);
  const reviewCount = featuredReviews.length;
  const visibleCount = Math.min(reviewCount, 3);
  const visibleReviews = useMemo(
    () => Array.from({ length: visibleCount }, (_, index) => featuredReviews[(activeIndex + index) % reviewCount]),
    [featuredReviews, activeIndex, reviewCount, visibleCount]
  );

  useEffect(() => {
    setActiveIndex((current) => reviewCount ? current % reviewCount : 0);
  }, [reviewCount]);

  useEffect(() => {
    if (reviewCount < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % reviewCount), 6500);
    return () => window.clearInterval(timer);
  }, [reviewCount]);

  if (status === "idle" || status === "loading") {
    return (
      <section className="container home-section home-reviews-section" aria-busy="true" aria-label="Loading customer reviews">
        <div className="text-center mb-4"><p className="eyebrow mb-1">Shopper feedback</p><h2 className="h3 font-display">Real Stories from Verified Shoppers</h2></div>
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">{[0, 1, 2].map((item) => <div className="col" key={item}><div className="home-review-card placeholder-glow"><span className="placeholder col-4 mb-3" /><span className="placeholder col-8 mb-2" /><span className="placeholder col-12 mb-2" /><span className="placeholder col-10" /></div></div>)}</div>
      </section>
    );
  }

  if (status === "failed") {
    return <section className="container home-section home-reviews-section"><div className="alert alert-light border d-flex flex-wrap justify-content-between align-items-center gap-3"><span>{error || "Customer reviews are temporarily unavailable."}</span><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => dispatch(fetchHomepageReviews())}>Try again</button></div></section>;
  }

  if (reviewCount === 0) return null;

  const step = (direction) => setActiveIndex((current) => (current + direction + reviewCount) % reviewCount);

  return (
    <section className="container home-section home-reviews-section" aria-label="Customer reviews">
      <div className="home-reviews-heading d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div><p className="eyebrow mb-1">Shopper feedback</p><h2 className="h3 font-display mb-1">Real Stories from Verified Shoppers</h2><p className="text-secondary mb-0">Reviews from Wasla products, shared by verified buyers.</p></div>
        {reviewCount > 1 && <div className="d-flex align-items-center gap-2"><span className="small text-secondary me-1">{activeIndex + 1} / {reviewCount}</span><button type="button" className="home-review-nav" onClick={() => step(-1)} aria-label="Previous reviews"><i className="bi bi-arrow-left" aria-hidden="true" /></button><button type="button" className="home-review-nav" onClick={() => step(1)} aria-label="Next reviews"><i className="bi bi-arrow-right" aria-hidden="true" /></button></div>}
      </div>
      <div key={activeIndex} className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 home-review-slide" aria-live="off">
        {visibleReviews.map((review) => <div className="col" key={`${activeIndex}-${review.id}`}><ReviewCard review={review} product={products.find((item) => String(item.id) === String(review.productId))} /></div>)}
      </div>
      {reviewCount > 1 && <div className="home-review-progress mt-3" aria-hidden="true"><span style={{ width: `${((activeIndex + 1) / reviewCount) * 100}%` }} /></div>}
    </section>
  );
}