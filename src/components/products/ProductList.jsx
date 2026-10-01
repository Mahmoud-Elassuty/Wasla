import ProductCard from "./ProductCard";

const GRID = "row row-cols-2 row-cols-lg-3 row-cols-xl-4 g-2 g-sm-3";

const Skeleton = () => (
  <div className="bg-white border rounded-4 p-3 h-100 placeholder-glow" aria-hidden="true">
    <span className="placeholder d-block rounded-3 mb-3" style={{ aspectRatio: "1 / 1" }} />
    <span className="placeholder d-block col-4 mb-2" />
    <span className="placeholder d-block col-10 mb-2" />
    <span className="placeholder d-block col-6 mb-3" />
    <span className="placeholder d-block rounded-3" style={{ height: 38 }} />
  </div>
);

// products = filtered list to show; hasItems = whether anything was loaded at all
export default function ProductList({ products, status, error, hasItems, onRetry, onReset, searchQuery = "" }) {
  if (!hasItems && status === "failed") {
    return (
      <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
        <span>{error || "We couldn't load the products."}</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  if (!hasItems && (status === "idle" || status === "loading")) {
    return (
      <div className={GRID} aria-busy="true" aria-label="Loading products">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="col" key={i}>
            <Skeleton />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="h5 mb-1">
          {searchQuery
            ? <>No products match &ldquo;{searchQuery}&rdquo;</>
            : hasItems
              ? "No products match your search"
              : "No products yet"}
        </p>
        <p className="text-secondary">
          {searchQuery ? "Clear the search to browse products matching your other filters." : hasItems ? "Try a different keyword or category." : "Check back soon."}
        </p>
        {hasItems && (
          <button type="button" className="btn btn-wasla" onClick={onReset}>
            {searchQuery ? "Clear search" : "Clear filters"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={GRID}>
      {products.map((product) => (
        <div className="col" key={product.id}>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
