import { useEffect, useState } from "react";
import "../../styles/scroll-to-top.css";

// Floating "back to top" button. Hidden until the page is scrolled `threshold` px.
// Render it once (MainLayout) — it is fixed-position, so it works on every public page.
export default function ScrollToTop({ threshold = 300 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY >= threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  const handleClick = () => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      className={`scroll-top-btn${visible ? " is-visible" : ""}`}
      aria-label="Scroll to top"
      title="Scroll to top"
      onClick={handleClick}
    >
      <i className="bi bi-arrow-up" aria-hidden="true" />
    </button>
  );
}
