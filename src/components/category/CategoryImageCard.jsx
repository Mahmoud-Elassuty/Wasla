import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_META } from "../../utils/categoryMeta";
import { getCategoryDisplayName } from "../../utils/categoryDisplay";
import { translate } from "../../i18n";
import "../../styles/categories.css";
import { useT } from "../../i18n/useT";

// Category picture with a graceful fallback (a tinted tile with the category icon)
// when there is no product image or the image fails to load.
export function CategoryImage({ src, slug }) {
  const [failed, setFailed] = useState(!src);
  useEffect(() => setFailed(!src), [src]);

  if (failed) {
    return (
      <span className="category-img-fallback" aria-hidden="true">
        <i className={`bi ${CATEGORY_META[slug]?.icon || "bi-grid"}`} />
      </span>
    );
  }
  return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

export const countLabel = (count) => (typeof count === "number" ? translate("count.products", { count }) : "");

export default function CategoryImageCard({ category, compact = false }) {
  const { t } = useT();
  const { slug, count, image } = category;
  const displayName = getCategoryDisplayName(slug);
  const label = countLabel(count);

  return (
    <Link
      to={`/category/${encodeURIComponent(slug)}`}
      className={`category-image-card${compact ? " is-compact" : ""}`}
      aria-label={label ? `${displayName}, ${label}` : displayName}
    >
      <span className="category-image-card-media">
        <CategoryImage src={image} slug={slug} />
      </span>
      <span className="category-image-card-body">
        <span className="category-image-card-copy">
          <strong>{displayName}</strong>
          {label && <small>{label}</small>}
        </span>
        <i className="bi bi-arrow-up-right category-image-card-arrow" aria-hidden="true" />
      </span>
    </Link>
  );
}

export function CategoryCardSkeletons({ count = 8, compact = false }) {
  const { t } = useT();
  return (
    <div
      className={`row row-cols-2 ${compact ? "row-cols-lg-5" : "row-cols-md-3 row-cols-xl-4"} g-2 g-sm-3`}
      aria-busy="true"
      aria-label={t("Loading categories…")}
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="col" key={index}>
          <div className="category-image-card placeholder-glow" aria-hidden="true">
            <span className="category-image-card-media placeholder" />
            <span className="category-image-card-body">
              <span className="placeholder col-7" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
