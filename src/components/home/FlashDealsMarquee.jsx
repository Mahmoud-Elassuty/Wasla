import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { getSalePrice } from "../../utils/format";
import { getStockState } from "../../utils/inventory";
import FlashDealCard from "./FlashDealCard";
import "../../styles/flash-deals-marquee.css";

const MAX_DEALS = 30;
const MIN_CARDS_PER_GROUP = 8; // one group must be wider than the widest viewport so the loop never shows a gap

const isPositiveNumber = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;

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
  const prefersReducedMotion = useReducedMotion();
  const location = useLocation();
  const backTo = `${location.pathname}${location.search}`;
  const deals = useMemo(() => buildFlashDeals(products), [products]);

  // Filler copies (only when there are few deals) are purely visual and never exposed to assistive tech.
  const fillerCount = deals.length === 0 ? 0 : Math.max(0, MIN_CARDS_PER_GROUP - deals.length);
  const duration = Math.min(75, Math.max(60, (deals.length + fillerCount) * 2.5)); // seconds per full loop

  const progress = useMotionValue(0); // 0 -> -50 (%) across two identical groups = exactly one group width
  const x = useTransform(progress, (value) => `${value}%`);
  const controlsRef = useRef(null);
  const viewportRef = useRef(null);
  const hoverRef = useRef(false);
  const focusRef = useRef(false);

  const hasDeals = deals.length > 0;
  useEffect(() => {
    if (prefersReducedMotion || !hasDeals) return undefined;
    progress.set(0);
    const controls = animate(progress, -50, { duration, ease: "linear", repeat: Infinity, repeatType: "loop" });
    controlsRef.current = controls;
    return () => { controls.stop(); controlsRef.current = null; };
  }, [prefersReducedMotion, hasDeals, duration, progress]);

  const syncPlayback = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (hoverRef.current || focusRef.current) controls.pause();
    else controls.play();
  };

  if (!hasDeals) {
    return <div className="home-empty-state">There are no discounted products right now. Browse the full catalog instead.</div>;
  }

  if (prefersReducedMotion) {
    return (
      <div className="flash-deals-static" role="region" aria-label="Flash deals">
        <ul className="flash-deals-group list-unstyled mb-0">
          {deals.map((product) => (
            <li key={product.id}><FlashDealCard product={product} backTo={backTo} /></li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className="flash-deals-viewport"
      role="region"
      aria-label="Flash deals"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") { hoverRef.current = true; syncPlayback(); } }}
      onPointerLeave={(event) => { if (event.pointerType === "mouse") { hoverRef.current = false; syncPlayback(); } }}
      onFocus={() => { focusRef.current = true; syncPlayback(); }}
      onBlur={(event) => {
        if (viewportRef.current?.contains(event.relatedTarget)) return;
        focusRef.current = false;
        if (viewportRef.current) viewportRef.current.scrollLeft = 0; // undo the browser's focus auto-scroll before resuming
        syncPlayback();
      }}
    >
      <motion.div className="flash-deals-track" style={{ x }}>
        {/* Group 1: every real deal once (accessible), plus decorative fillers when the catalog has few deals. */}
        <ul className="flash-deals-group list-unstyled mb-0">
          {deals.map((product) => (
            <li key={product.id}><FlashDealCard product={product} backTo={backTo} /></li>
          ))}
          {Array.from({ length: fillerCount }, (_, index) => {
            const product = deals[index % deals.length];
            return <li key={`filler-${index}`} aria-hidden="true"><FlashDealCard product={product} backTo={backTo} decorative /></li>;
          })}
        </ul>
        {/* Group 2: identical visual copy for the seamless loop; hidden from assistive tech and the Tab order. */}
        <ul className="flash-deals-group list-unstyled mb-0" aria-hidden="true">
          {deals.map((product) => (
            <li key={product.id}><FlashDealCard product={product} backTo={backTo} decorative /></li>
          ))}
          {Array.from({ length: fillerCount }, (_, index) => {
            const product = deals[index % deals.length];
            return <li key={`filler-${index}`}><FlashDealCard product={product} backTo={backTo} decorative /></li>;
          })}
        </ul>
      </motion.div>
    </div>
  );
}
