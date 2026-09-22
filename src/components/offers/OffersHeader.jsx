// Pure presentational header for the Offers page — mirrors CategoryHeader's shape
// (title + supporting line + live count) so the two "browse" pages feel consistent.
export default function OffersHeader({ count, loading }) {
  return (
    <div className="offers-header mb-4 text-center text-md-start">
      <div className="d-flex flex-wrap align-items-baseline gap-2 justify-content-center justify-content-md-start">
        <h1 className="h3 font-display mb-0">Special Offers</h1>
        <span className="fs-5 fw-semibold text-accent" dir="rtl">عروض خاصة</span>
      </div>
      <p className="text-secondary mb-1">Save big on top products</p>
      <p className="small text-secondary mb-0">
        {loading ? "Loading offers…" : `${count} product${count === 1 ? "" : "s"} on sale`}
      </p>
    </div>
  );
}
