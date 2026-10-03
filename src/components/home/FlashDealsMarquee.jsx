import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { getSalePrice } from "../../utils/format";
import { getStockState } from "../../utils/inventory";
import ProductCard from "../products/ProductCard";
import "../../styles/flash-deals-marquee.css";
import { useT } from "../../i18n/useT";

const MAX_DEALS = 30;

const isPositiveNumber = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;

function getCardsPerPage() {
  if (typeof window === "undefined") return 4;
  if (window.innerWidth < 768) return 2;
  if (window.innerWidth < 1024) return 2;
  return 4;
}

function useCardsPerPage() {
  const [cardsPerPage, setCardsPerPage] = useState(getCardsPerPage);

  useEffect(() => {
    const updateCardsPerPage = () => setCardsPerPage(getCardsPerPage());
    window.addEventListener("resize", updateCardsPerPage);
    return () => window.removeEventListener("resize", updateCardsPerPage);
  }, []);

  return cardsPerPage;
}

// Real, currently purchasable discounted products only; read-only derivation from catalog data.
// Sort: highest discount, then rating (desc), then title A-Z.
function buildFlashDeals(products) {
  if (!Array.isArray(products)) return [];
  return products
    .filter((product) =>
      product
      && isPositiveNumber(product.price)
      && isPositiveNumber(product.discountPercentage)
      && product.discountPercentage < 100
      && getSalePrice(product) > 0
      && getStockState(product.stock, product.active !== false).purchasable
    )
    .sort((a, b) =>
      b.discountPercentage - a.discountPercentage
      || (Number(b.rating) || 0) - (Number(a.rating) || 0)
      || String(a.title ?? "").localeCompare(String(b.title ?? ""), undefined, { sensitivity: "base" })
    )
    .slice(0, MAX_DEALS);
}

export default function FlashDealsMarquee({ products }) {
  const { t } = useT();
  const prefersReducedMotion = useReducedMotion();
  const deals = useMemo(() => buildFlashDeals(products), [products]);
  const cardsPerPage = useCardsPerPage();
  const [activePage, setActivePage] = useState(0);
  const viewportRef = useRef(null);
  const pages = useMemo(() => {
    const pageCount = Math.ceil(deals.length / cardsPerPage);
    return Array.from({ length: pageCount }, (_, index) =>
      deals.slice(index * cardsPerPage, (index + 1) * cardsPerPage)
    );
  }, [deals, cardsPerPage]);
  const pageCount = pages.length;
  const currentPage = pageCount > 0 ? activePage % pageCount : 0;
  const currentDeals = pages[currentPage] ?? [];

  useEffect(() => {
    if (activePage >= pageCount) setActivePage(0);
  }, [activePage, pageCount]);

  useEffect(() => {
    if (pageCount <= 1) return undefined;
    const timerId = window.setInterval(() => {
      if (viewportRef.current?.contains(document.activeElement)) return;
      setActivePage((page) => (page + 1) % pageCount);
    }, 4000);
    return () => window.clearInterval(timerId);
  }, [pageCount]);

  if (deals.length === 0) {
    return <div className="home-empty-state">{t("There are no discounted products right now. Browse the full catalog instead.")}</div>;
  }

  const initial = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 8, rotateX: -1.5 };
  const exit = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -6, rotateX: 1.5 };

  return (
    <div className="flash-deals-carousel" role="region" aria-roledescription="carousel" aria-label={t("Flash deals")}>
      <div className="flash-deals-viewport" aria-live="off">
        <div ref={viewportRef} className="flash-deals-page-stage">
          <AnimatePresence initial={false}>
            <motion.ul
              key={`${cardsPerPage}:${currentDeals.map((product) => product.id).join(":")}`}
              className="flash-deals-page"
              aria-label={t("Flash Deals page {page} of {total}", { page: currentPage + 1, total: pageCount })}
              initial={initial}
              animate={{ opacity: 1, y: 0, ...(prefersReducedMotion ? {} : { rotateX: 0 }) }}
              exit={exit}
              transition={{ duration: prefersReducedMotion ? 0.16 : 0.45, ease: "easeInOut" }}
              style={{ "--flash-deal-columns": cardsPerPage, transformOrigin: "center center" }}
            >
              {currentDeals.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} homeDeal imageFallback />
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>
      </div>
      {pageCount > 1 && (
        <div className="flash-deals-pagination" role="group" aria-label={t("Flash Deals pages")}>
          {pages.map((page, index) => (
            <button
              key={page[0].id}
              type="button"
              className={`flash-deals-dot${index === currentPage ? " is-active" : ""}`}
              aria-label={t("Go to Flash Deals page {page}", { page: index + 1 })}
              aria-current={index === currentPage ? "page" : undefined}
              onClick={() => setActivePage(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
