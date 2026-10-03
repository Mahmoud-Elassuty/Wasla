import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { buildBrandList, getBrandLogo } from "../../utils/brandDisplay";
import "../../styles/brand-marquee.css";
import { useT } from "../../i18n/useT";

const MAX_BRANDS = 12;
const MIN_ITEMS_PER_GROUP = 12; // keeps one group wider than the viewport so the loop never shows a gap

// Logo paths that failed to load once; shared so repeated pills do not retry (and re-log) the same broken file.
const failedLogos = new Set();

function BrandPill({ name }) {
  const logo = getBrandLogo(name);
  const [logoFailed, setLogoFailed] = useState(() => !logo || failedLogos.has(logo));
  const showLogo = Boolean(logo) && !logoFailed;

  return (
    <span className="brand-marquee-pill">
      {showLogo ? (
        <span className="brand-marquee-logo">
          <img
            src={logo}
            alt={name}
            width="16"
            height="16"
            draggable="false"
            onError={() => { failedLogos.add(logo); setLogoFailed(true); }}
          />
        </span>
      ) : (
        <i className="bi bi-patch-check" aria-hidden="true" />
      )}
      {/* With a logo, the img alt carries the name for assistive tech, so the visible text is not announced twice. */}
      <span aria-hidden={showLogo ? "true" : undefined}>{name}</span>
    </span>
  );
}

// `products` = current catalog items; `loading` reserves the strip's height so Home does not jump.
export default function BrandMarquee({ products, loading = false }) {
  const { t } = useT();
  const prefersReducedMotion = useReducedMotion();
  const brands = useMemo(() => buildBrandList(products, MAX_BRANDS), [products]);

  // One visual group = the brand list repeated until it is long enough; the track holds two identical groups.
  const group = useMemo(() => {
    if (brands.length === 0) return [];
    const repeat = Math.max(1, Math.ceil(MIN_ITEMS_PER_GROUP / brands.length));
    return Array.from({ length: repeat }, () => brands).flat();
  }, [brands]);

  if (brands.length === 0) {
    return loading ? <section className="brand-marquee brand-marquee-loading" aria-hidden="true" /> : null;
  }

  const duration = Math.min(35, Math.max(20, group.length * 2.4));

  return (
    <section className="brand-marquee" aria-labelledby="brand-marquee-title">
      <div className="container">
        <div className="brand-marquee-inner">
          <h2 id="brand-marquee-title" className="brand-marquee-label">{t("Popular Brands")}</h2>

          {prefersReducedMotion ? (
            <ul className="brand-marquee-static list-unstyled mb-0">
              {brands.map((name) => <li key={name}><BrandPill name={name} /></li>)}
            </ul>
          ) : (
            <div className="brand-marquee-viewport">
              {/* Screen readers get the list once; the moving copies below are decorative. */}
              <ul className="visually-hidden">
                {brands.map((name) => <li key={name}>{name}</li>)}
              </ul>
              <motion.div
                className="brand-marquee-track"
                aria-hidden="true"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration, ease: "linear", repeat: Infinity, repeatType: "loop" }}
              >
                {[0, 1].map((copy) => (
                  <div className="brand-marquee-group" key={copy}>
                    {group.map((name, index) => <BrandPill key={`${name}-${index}`} name={name} />)}
                  </div>
                ))}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
