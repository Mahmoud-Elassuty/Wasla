import { useT } from "../../i18n/useT";
export default function MobileFiltersToggle({ active = false, expanded = false, buttonRef, onClick, className = "" }) {
  const { t } = useT();
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`btn btn-outline-secondary d-lg-none d-flex align-items-center justify-content-center gap-2 ${className}`}
      aria-expanded={expanded}
      aria-controls="filters-panel"
      onClick={onClick}
    >
      <i className="bi bi-sliders" aria-hidden="true" />
      {t("Filters")}
      {active && <span className="badge rounded-pill bg-accent">{t("Active")}</span>}
    </button>
  );
}
