import { Link } from "react-router-dom";
import useCategoryCards from "../../hooks/useCategoryCards";
import { getCategoryDisplayName } from "../../utils/categoryDisplay";
import { CategoryImage, countLabel } from "./CategoryImageCard";
import "../../styles/categories.css";
import { useT } from "../../i18n/useT";

// Compact Categories menu for the public Navbar. Real categories only, plus a
// final "View All Categories" action that opens the /categories page.
export default function CategoriesDropdown() {
  const { t } = useT();
  const { cards, loading } = useCategoryCards();

  return (
    <div className="dropdown categories-dropdown">
      <button
        type="button"
        className="categories-toggle"
        data-bs-toggle="dropdown"
        data-bs-auto-close="true"
        aria-expanded="false"
        aria-haspopup="true"
      >
        <i className="bi bi-grid-3x3-gap" aria-hidden="true" />
        <span>{t("Categories")}</span>
        <i className="bi bi-chevron-down categories-toggle-chevron" aria-hidden="true" />
      </button>

      <div className="dropdown-menu dropdown-menu-end categories-menu">
        <div className="categories-menu-scroll">
        {loading ? (
          <p className="small text-secondary text-center mb-0 py-3" role="status">{t("Loading categories…")}</p>
        ) : cards.length === 0 ? (
          <p className="small text-secondary text-center mb-0 py-3">{t("Categories will appear here soon.")}</p>
        ) : (
          <ul className="categories-menu-grid">
            {cards.map((card) => (
              <li key={card.slug}>
                <Link to={`/category/${encodeURIComponent(card.slug)}`} className="categories-menu-item">
                  <span className="categories-menu-thumb">
                    <CategoryImage src={card.image} slug={card.slug} />
                  </span>
                  <span className="categories-menu-copy">
                    <span className="categories-menu-name">{getCategoryDisplayName(card.slug)}</span>
                    {typeof card.count === "number" && <small>{countLabel(card.count)}</small>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        </div>
        <div className="categories-menu-footer">
          <Link to="/categories" className="btn btn-wasla w-100">
            {t("View All Categories")}<i className="bi bi-arrow-right ms-2" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
