import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { fetchCategories, fetchProducts } from "../store/reducers/productsSlice";
import useCategoryCards from "../hooks/useCategoryCards";
import CategoryImageCard, { CategoryCardSkeletons } from "../components/category/CategoryImageCard";
import "../styles/categories.css";

export default function Categories() {
  const dispatch = useDispatch();
  const { cards, loading, failed } = useCategoryCards();

  return (
    <div className="container py-4 py-md-5 categories-page">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb mb-3 small">
          <li className="breadcrumb-item">
            <Link to="/" className="text-decoration-none">Home</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">Categories</li>
        </ol>
      </nav>

      <header className="categories-page-header d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <h1 className="h2 font-display fw-bold mb-1">Categories</h1>
          <p className="text-secondary mb-0">Pick a category and start exploring what Wasla has to offer.</p>
        </div>
        <Link to="/products" className="home-section-link fw-semibold text-decoration-none">
          Browse all products<i className="bi bi-arrow-right ms-2" aria-hidden="true" />
        </Link>
      </header>

      {loading ? (
        <CategoryCardSkeletons count={8} />
      ) : failed ? (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>We couldn't load the categories.</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => {
              dispatch(fetchProducts());
              dispatch(fetchCategories());
            }}
          >
            Try again
          </button>
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-5">
          <p className="h5 mb-1">No categories yet</p>
          <p className="text-secondary mb-3">Check back soon.</p>
          <Link to="/products" className="btn btn-wasla">Browse all products</Link>
        </div>
      ) : (
        <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-2 g-sm-3">
          {cards.map((card) => (
            <div className="col" key={card.slug}>
              <CategoryImageCard category={card} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
