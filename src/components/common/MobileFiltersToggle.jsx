export default function MobileFiltersToggle({ active = false, expanded = false, buttonRef, onClick, className = "" }) {
  return (
    <button
      ref={buttonRef}
      type="button"
    className={`btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2 ${className}`}
      aria-expanded={expanded}
      aria-controls="filters-panel"
      onClick={onClick}
    >
      <i className="bi bi-sliders" aria-hidden="true" />
      Filters
      {active && <span className="badge rounded-pill bg-accent">Active</span>}
    </button>
  );
}
