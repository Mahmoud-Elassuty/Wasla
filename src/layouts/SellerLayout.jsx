import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/reducers/authSlice";
import { clearActionError } from "../store/reducers/sellerSlice";
// Reuses the admin shell's layout classes (.admin-shell, .admin-sidebar, .admin-nav-link, ...) —
// a seller dashboard is the same kind of back-office chrome, so this avoids duplicating ~100
// lines of near-identical CSS for a second role.
import "../styles/admin.css";

const NAV = [
  { to: "/seller", label: "Dashboard", icon: "bi-grid-1x2", end: true },
  { to: "/seller/products", label: "Products", icon: "bi-box-seam" },
  { to: "/seller/orders", label: "Orders", icon: "bi-receipt" },
  { to: "/seller/profile", label: "Store profile", icon: "bi-shop" },
];

export default function SellerLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const actionError = useSelector((s) => s.seller.actionError);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/seller" className="text-decoration-none d-block mb-3 lh-1">
          <span className="font-display fs-4 fw-bold text-wasla">wasla</span>{" "}
          <span className="font-display fs-5 fw-semibold">Seller</span>
          <span className="eyebrow d-block mt-1">{user?.storeName || "Seller dashboard"}</span>
        </Link>

        <nav className="admin-nav" aria-label="Seller">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}
            >
              <i className={`bi ${icon}`} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-3 mt-lg-auto pt-3 border-top d-flex flex-wrap flex-lg-column gap-2 align-items-lg-stretch">
          <div className="small me-auto">
            <div className="fw-semibold">{user?.name}</div>
            <div className="text-secondary text-break">{user?.email}</div>
          </div>
          <Link to="/" className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-shop-window me-1" aria-hidden="true" />
            Back to store
          </Link>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1" aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {actionError && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center gap-3" role="alert">
            <span>{actionError}</span>
            <button type="button" className="btn-close" aria-label="Dismiss" onClick={() => dispatch(clearActionError())} />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
