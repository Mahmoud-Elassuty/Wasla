// Phone/tablet button that opens the filter panel (the panel itself carries id="filters-panel"
// plus Bootstrap's `collapse d-lg-block`, so it is always visible on desktop). Pure Bootstrap
// collapse: no state, no viewport checks, and it does not touch any filter logic.
export default function MobileFiltersToggle({ active = false }) {
  return (
    <button
      type="button"
      className="btn btn-outline-secondary w-100 d-lg-none d-flex align-items-center justify-content-center gap-2 mb-3"
      data-bs-toggle="collapse"
      data-bs-target="#filters-panel"
      aria-expanded="false"
      aria-controls="filters-panel"
    >
      <i className="bi bi-sliders" aria-hidden="true" />
      Filters
      {active && <span className="badge rounded-pill bg-accent">Active</span>}
    </button>
  );
}
