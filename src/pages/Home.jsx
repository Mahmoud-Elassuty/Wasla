import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, MotionConfig } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, fetchProducts } from "../store/reducers/productsSlice";
import { fetchBanners } from "../store/reducers/bannersSlice";
import { CATEGORY_META } from "../utils/categoryMeta";
import { titleCase } from "../utils/format";
import { buildCategoryCards } from "../utils/categoryDisplay";
import CategoryImageCard, { CategoryCardSkeletons } from "../components/category/CategoryImageCard";
import HomeReviews from "../components/HomeReviews";
import BrandMarquee from "../components/home/BrandMarquee";
import FlashDealsMarquee from "../components/home/FlashDealsMarquee";
import "../styles/home.css";
import "../styles/categories.css";

const TRUST_ITEMS = [
  { icon: "bi-grid", title: "A catalog to explore", desc: "Browse the categories available on Wasla." },
  { icon: "bi-tags", title: "Current product offers", desc: "See listed discounts and prices." },
  { icon: "bi-heart", title: "Save your favorites", desc: "Keep products together in your wishlist." },
  { icon: "bi-receipt", title: "Keep up with orders", desc: "Review order details in your account." },
];

// Motion presets (Home page only). Keep them short and subtle.
const EASE = [0.22, 1, 0.36, 1];
const REVEAL_VIEWPORT = { once: true, amount: 0.2 };

const heroTextGroup = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const heroTextItem = { hidden: { opacity: 0, x: -36 }, show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } } };
const heroArtVariants = {
  hidden: { opacity: 0, x: 48, scale: 0.98 },
  show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.6, ease: EASE, delay: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (index = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE, delay: Math.min(index, 5) * 0.06 } }),
};
// Spread onto a motion element to fade it up once when it scrolls into view.
const reveal = (index = 0) => ({ variants: fadeUp, custom: index, initial: "hidden", whileInView: "show", viewport: REVEAL_VIEWPORT });

function HeroImage({ banner }) {
  const [failed, setFailed] = useState(!banner.image);
  useEffect(() => setFailed(!banner.image), [banner.image]);

  return failed ? (
    <div className="home-hero-art-fallback d-flex align-items-center justify-content-center" role="img" aria-label={banner.title}>
      <div className="home-hero-art-icons" aria-hidden="true">
        <i className="bi bi-bag-heart" />
        <i className="bi bi-stars" />
        <i className="bi bi-box-seam" />
      </div>
    </div>
  ) : (
    <img className="home-hero-art-image" src={banner.image} alt={banner.title || "Wasla featured products"} onError={() => setFailed(true)} />
  );
}

function HomeHero({ banner, productCount, categoryCount }) {
  const title = banner?.title || "Connect to the Best Brands, Delivered Fast.";
  const subtitle = banner?.subtitle || "Discover products across beauty, fragrances, home and everyday essentials.";
  const buttonText = banner?.buttonText || "Shop Flash Deals";
  const buttonLink = banner?.buttonLink || "/offers";

  return (
    <section className="container home-section-top">
      <div className="home-hero rounded-4 overflow-hidden">
        <div className="row align-items-stretch g-0">
          <div className="col-lg-7">
            <motion.div className="home-hero-copy h-100 p-4 p-md-5 d-flex flex-column justify-content-center" variants={heroTextGroup} initial="hidden" animate="show">
              <motion.span className="home-hero-eyebrow align-self-start mb-3" variants={heroTextItem}>
                <i className="bi bi-stars me-2" aria-hidden="true" />Discover Wasla
              </motion.span>
              <motion.h1 className="home-hero-title font-display fw-bold mb-3" variants={heroTextItem}>{title}</motion.h1>
              <motion.p className="home-hero-subtitle mb-4" variants={heroTextItem}>{subtitle}</motion.p>
              <motion.div className="d-flex flex-wrap gap-2" variants={heroTextItem}>
                <Link to={buttonLink} className="btn btn-accent btn-lg px-4">
                  {buttonText}<i className="bi bi-arrow-right ms-2" aria-hidden="true" />
                </Link>
                <a href="#categories" className="btn btn-outline-light btn-lg px-4">
                  Explore categories
                </a>
              </motion.div>
              {(productCount > 0 || categoryCount > 0) && (
                <div className="home-hero-stats d-flex flex-wrap gap-4 mt-4 pt-3">
                  {productCount > 0 && <div><strong>{productCount}</strong><span> products in the catalog</span></div>}
                  {categoryCount > 0 && <div><strong>{categoryCount}</strong><span> categories to explore</span></div>}
                </div>
              )}
            </motion.div>
          </div>
          <div className="col-lg-5 d-flex">
            <motion.div className="home-hero-art position-relative" variants={heroArtVariants} initial="hidden" animate="show">
              {banner ? <HeroImage key={banner.id} banner={banner} /> : (
                <div className="home-hero-art-fallback d-flex align-items-center justify-content-center" aria-hidden="true">
                  <div className="home-hero-art-icons"><i className="bi bi-headphones" /><i className="bi bi-watch" /><i className="bi bi-bag-heart" /></div>
                </div>
              )}
              {banner && (
                <div className="home-hero-art-toolbar" aria-hidden="true">
                  <span><i className="bi bi-stars" /> Wasla spotlight</span>
                  <i className="bi bi-lightning-charge-fill" />
                </div>
              )}
              <span className="home-hero-art-caption">
                {banner ? <><i className="bi bi-patch-check-fill" aria-hidden="true" /><span><strong>Featured on Wasla</strong><small>{buttonText}</small></span></> : "Find something you’ll love"}
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, subtitle, link, linkText }) {
  return (
    <motion.div className="home-section-heading d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4" {...reveal()}>
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="h3 font-display mb-1">{title}</h2>
        {subtitle && <p className="text-secondary mb-0">{subtitle}</p>}
      </div>
      {link && <Link to={link} className="home-section-link fw-semibold text-decoration-none">{linkText || "View all"}<i className="bi bi-arrow-right ms-2" aria-hidden="true" /></Link>}
    </motion.div>
  );
}

function ProductSkeletons() {
  return (
    <div className="row row-cols-2 row-cols-lg-4 g-2 g-sm-3" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="col" key={index}>
          <div className="bg-white border rounded-4 p-3 h-100 placeholder-glow">
            <span className="placeholder d-block rounded-3 mb-3" style={{ aspectRatio: "1 / 1" }} />
            <span className="placeholder d-block col-6 mb-2" /><span className="placeholder d-block col-10 mb-2" /><span className="placeholder d-block col-5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CollectionCard({ category, count, variant }) {
  const meta = CATEGORY_META[category.slug] || { icon: "bi-tag", label: category.name || titleCase(category.slug) };
  const isHome = category.slug === "furniture";
  const isGroceries = category.slug === "groceries";
  return (
    <Link to={`/category/${encodeURIComponent(category.slug)}`} className={`home-collection-card home-collection-${variant} d-flex flex-column justify-content-between text-decoration-none`}>
      <div>
        <span className="home-collection-pill">{meta.label}</span>
        <h2 className="font-display fw-bold mt-3 mb-2">{isHome ? "Make room for better living" : isGroceries ? "Everyday essentials, all in one place" : `Explore ${meta.label}`}</h2>
        <p className="mb-3">{isHome ? "Explore furniture and home products from the Wasla catalog." : isGroceries ? "Browse groceries and daily needs in the current catalog." : `${count} products available in this category.`}</p>
      </div>
      <span className="home-collection-link">Explore {count} products <i className="bi bi-arrow-right ms-1" aria-hidden="true" /></span>
      <i className={`bi ${meta.icon} home-collection-watermark`} aria-hidden="true" />
    </Link>
  );
}

export default function Home() {
  const dispatch = useDispatch();
  const { items, categories, status, error } = useSelector((state) => state.products);
  const { items: banners } = useSelector((state) => state.banners);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (status === "idle") dispatch(fetchProducts());
    if (categories.length === 0) dispatch(fetchCategories());
  }, [dispatch, status, categories.length]);

  useEffect(() => { dispatch(fetchBanners()); }, [dispatch]);

  // Every real category (collection + categories used by products), each with its count and a product image.
  const categoryOptions = useMemo(() => buildCategoryCards(categories, items), [categories, items]);

  const activeBanner = useMemo(
    () => [...banners].filter((banner) => banner.status === "active").sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))[0] ?? null,
    [banners]
  );
  const collectionCategories = useMemo(() => {
    const featuredSlugs = ["furniture", "groceries"];
    const featured = featuredSlugs.map((slug) => categoryOptions.find((category) => category.slug === slug)).filter(Boolean);
    return featured.length >= 2 ? featured : categoryOptions.slice(0, 2);
  }, [categoryOptions]);
  const loading = status === "idle" || status === "loading";

  return (
    <MotionConfig reducedMotion="user">
    <div className="home-page">
      <HomeHero banner={activeBanner} productCount={status === "succeeded" ? items.length : 0} categoryCount={categoryOptions.length} />

      <BrandMarquee products={items} loading={loading} />

      <section className="container home-benefits-section">
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3">
          {TRUST_ITEMS.map((item) => (
            <div className="col" key={item.title}>
              <div className="home-benefit h-100 d-flex align-items-center gap-3 p-3">
                <span className="home-benefit-icon flex-shrink-0"><i className={`bi ${item.icon}`} aria-hidden="true" /></span>
                <span className="min-w-0"><strong className="d-block">{item.title}</strong><span className="small text-secondary">{item.desc}</span></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container home-section" id="categories">
        <SectionHeading eyebrow="Curated hubs" title="Explore Categories / الفئات المميزة" subtitle="Choose a category to find products that suit you." link="/products" linkText="View all products" />
        {categoryOptions.length > 0 ? (
          <>
            <div className="row row-cols-2 row-cols-lg-5 g-2 g-sm-3">
              {categoryOptions.map((category, index) => (
                <motion.div className="col" key={category.slug} {...reveal(index)}>
                  <CategoryImageCard category={items.length > 0 ? category : { ...category, count: null }} compact />
                </motion.div>
              ))}
            </div>
            <div className="home-categories-more">
              <Link to="/categories" className="btn btn-outline-secondary btn-lg px-4">
                Show More Categories<i className="bi bi-arrow-right ms-2" aria-hidden="true" />
              </Link>
            </div>
          </>
        ) : loading ? <CategoryCardSkeletons count={10} compact /> : <div className="home-empty-state">Categories will appear here when the catalog is available.</div>}
      </section>

      <section className="home-products-section home-section">
        <div className="container">
          <motion.div className="home-deals-heading d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3" {...reveal()}>
            <div className="d-flex align-items-center gap-3">
              <span className="home-deals-icon"><i className="bi bi-lightning-charge-fill" aria-hidden="true" /></span>
              <div><h2 className="h4 font-display mb-1">Today’s Super Flash Deals</h2><p className="small text-secondary mb-0">Discounted products available in the current catalog.</p></div>
            </div>
            <Link to="/offers" className="home-section-link fw-semibold text-decoration-none">View All Offers<i className="bi bi-arrow-right ms-2" aria-hidden="true" /></Link>
          </motion.div>
          {loading ? <ProductSkeletons /> : status === "failed" && items.length === 0 ? (
            <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-3" role="alert"><span>{error || "We couldn't load the product catalog."}</span><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchProducts())}>Try again</button></div>
          ) : (
            <motion.div {...reveal()}><FlashDealsMarquee products={items} /></motion.div>
          )}
        </div>
      </section>

      {collectionCategories.length > 0 && (
        <section className="container home-section home-collections-section">
          <div className="row row-cols-1 row-cols-lg-2 g-3">
            {collectionCategories.map((category, index) => (
              <motion.div className="col" key={category.slug} {...reveal(index)}><CollectionCard category={category} count={category.count} variant={index === 0 ? "blue" : "green"} /></motion.div>
            ))}
          </div>
        </section>
      )}

      <HomeReviews />

      <section className="container home-section home-newsletter-wrap">
        <motion.div className="home-newsletter rounded-4 p-4 p-lg-5 text-white" {...reveal()}>
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <span className="home-newsletter-pill d-inline-flex align-items-center gap-2 mb-3"><i className="bi bi-envelope-heart" aria-hidden="true" />Stay connected</span>
              <h2 className="h3 font-display mb-2">Keep up with Wasla</h2>
              <p className="text-white-50 mb-0">Browse the latest catalog additions and current offers from one place.</p>
            </div>
            <div className="col-lg-5">
              {subscribed ? (
                <div className="home-newsletter-success rounded-4 p-3 text-center fw-semibold" role="status"><i className="bi bi-check-circle-fill me-2" aria-hidden="true" />Thanks for your interest. Check the offers page for current discounts.<Link to="/offers" className="d-block mt-2 text-white">View offers</Link></div>
              ) : (
                <form className="d-flex flex-column flex-sm-row gap-2" onSubmit={(event) => { event.preventDefault(); setSubscribed(true); }}>
                  <input type="email" required className="form-control form-control-lg home-newsletter-input" placeholder="Enter your email address" aria-label="Email address" />
                  <button type="submit" className="btn btn-accent btn-lg text-nowrap">Join</button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
    </MotionConfig>
  );
}