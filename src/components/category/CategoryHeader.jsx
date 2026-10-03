import { Link } from "react-router-dom";
import { useT } from "../../i18n/useT";

// Pure presentational header: breadcrumb + name/description/count.
// Kept separate from Category.jsx so it's easy to reuse or restyle on its own.
export default function CategoryHeader({ meta, count, loading }) {
  const { t } = useT();
  return (
    <div className="category-header mb-4">
      <nav aria-label={t("breadcrumb")}>
        <ol className="breadcrumb mb-3 small">
          <li className="breadcrumb-item">
            <Link to="/" className="text-decoration-none">{t("Home")}</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/products" className="text-decoration-none">{t("Products")}</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {meta.label}
          </li>
        </ol>
      </nav>

      <div className="d-flex align-items-start gap-3">
        <div className={`category-header-icon flex-shrink-0 ${meta.accent}`} aria-hidden="true">
          <i className={`bi ${meta.icon}`} />
        </div>
        <div className="min-w-0">
          <h1 className="h3 font-display mb-1">{meta.label}</h1>
          <p className="text-secondary mb-1">{meta.description}</p>
          <p className="small text-secondary mb-0">
            {loading ? t("Loading products…") : t("count.products", { count })}
          </p>
        </div>
      </div>
    </div>
  );
}
