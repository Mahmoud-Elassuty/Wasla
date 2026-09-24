import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/reducers/authSlice";
import { fetchWishlist } from "../../store/reducers/wishlistSlice";
import WishlistNotice from "../wishlist/WishlistNotice";
import NotificationBell from "../notifications/NotificationBell";
import { formatPrice } from "../../utils/format";

const links = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/offers", label: "Offers" },
  { to: "/cart", label: "Cart" },
];

const PREVIEW_LIMIT = 4;

export default function Navbar() {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("q") ?? searchParams.get("search") ?? "";
  const [query, setQuery] = useState(urlSearch);
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { items, itemCount, total } = useSelector((s) => s.cart);
  const wishlistCount = useSelector((s) => s.wishlist.items.length);
  const navLinks = user?.role === "admin" ? [...links, { to: "/admin", label: "Admin" }] : links;
  const userId = user?.id;

  // Load the saved products for whoever is logged in, so hearts are filled everywhere.
  useEffect(() => {
    if (userId === undefined) return;
    const request = dispatch(fetchWishlist(userId));
    return () => request.abort();
  }, [dispatch, userId]);

  // Keep the navbar box in sync when the search changes in the URL (e.g. typed on the Products page).
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setQuery(urlSearch);
  }

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <header className="bg-white border-bottom sticky-top">
      <div className="container">
        <div className="row align-items-center g-2 py-2">
          <div className="col-6 col-md-auto">
            <Link to="/" className="text-decoration-none d-inline-block lh-1">
              <span className="font-display fs-4 fw-bold text-wasla">wasla</span>{" "}
              <span className="fw-semibold text-accent" dir="rtl">(وصلة)</span>
              <small className="d-none d-lg-block text-secondary">Your Gateway to Shopping</small>
            </Link>
          </div>

          <div className="col-12 col-md order-3 order-md-2">
            <form className="input-group search-box" onSubmit={handleSearch} role="search">
              <input
                type="search"
                className="form-control"
                placeholder="Search products, brands, essentials..."
                aria-label="Search products"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="btn btn-accent px-3" type="submit" aria-label="Search">
                <i className="bi bi-search" />
              </button>
            </form>
          </div>

          <div className="col-6 col-md-auto order-2 order-md-3 d-flex justify-content-end align-items-center gap-3">
            <span className="d-none d-lg-inline small text-secondary">EN | العربية</span>
            <Link
              to="/wishlist"
              className="icon-btn position-relative"
              aria-label={`Wishlist, ${wishlistCount} ${wishlistCount === 1 ? "item" : "items"}`}
            >
              <i className="bi bi-heart" />
              {wishlistCount > 0 && (
                <span className="badge rounded-pill bg-accent position-absolute top-0 start-100 translate-middle">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <NotificationBell />

            <div className="dropdown">
              <button
                type="button"
                className="icon-btn position-relative bg-transparent border-0 p-0"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                aria-label={`Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
              >
                <i className="bi bi-bag" />
                <span className="badge rounded-pill bg-accent position-absolute top-0 start-100 translate-middle">
                  {itemCount}
                </span>
              </button>

              <div className="dropdown-menu dropdown-menu-end p-0 cart-dropdown">
                {items.length === 0 ? (
                  <div className="text-center px-3 py-4">
                    <p className="small text-secondary mb-2">Your cart is empty</p>
                    <Link to="/products" className="btn btn-sm btn-wasla">Browse products</Link>
                  </div>
                ) : (
                  <>
                    <ul className="list-unstyled mb-0 px-3">
                      {items.slice(0, PREVIEW_LIMIT).map((item) => (
                        <li key={item.id} className="cart-item d-flex align-items-center gap-2 py-2">
                          <span className="cart-thumb sm flex-shrink-0">
                            <img src={item.thumbnail} alt="" />
                          </span>
                          <div className="flex-grow-1 min-w-0">
                            <div className="small fw-semibold text-truncate">{item.title}</div>
                            <div className="small text-secondary">
                              {item.quantity} × {formatPrice(item.price)}
                            </div>
                          </div>
                          <span className="small fw-semibold flex-shrink-0">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {items.length > PREVIEW_LIMIT && (
                      <p className="small text-secondary px-3 mb-2">
                        +{items.length - PREVIEW_LIMIT} more {items.length - PREVIEW_LIMIT === 1 ? "item" : "items"}
                      </p>
                    )}
                    <div className="p-3 border-top">
                      <div className="d-flex justify-content-between fw-semibold mb-2">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                      <div className="d-flex gap-2">
                        <Link to="/cart" className="btn btn-outline-secondary flex-fill">View cart</Link>
                        <Link to="/checkout" className="btn btn-accent flex-fill">Checkout</Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {user ? (
              <div className="dropdown">
                <button
                  type="button"
                  className="btn p-0 border-0 d-flex align-items-center gap-2"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="avatar-circle">{user.name?.[0]?.toUpperCase()}</span>
                  <span className="d-none d-lg-inline small fw-semibold">{user.name}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li className="px-3 py-2">
                    <div className="fw-semibold small">{user.name}</div>
                    <div className="text-secondary small">{user.email}</div>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item" to="/profile">My account</Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/orders">My orders</Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/wishlist">Wishlist</Link>
                  </li>
                  {user.role === "admin" && (
                    <li>
                      <Link className="dropdown-item" to="/admin">Admin panel</Link>
                    </li>
                  )}
                  <li>
                    <button type="button" className="dropdown-item" onClick={handleLogout}>
                      Log out
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <Link to="/login" className="btn btn-wasla btn-sm px-3">Log in</Link>
            )}
          </div>
        </div>
      </div>

      <nav className="border-top" aria-label="Main">
        <div className="container d-flex gap-4">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `nav-link-wasla${isActive ? " active" : ""}`}
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
      <WishlistNotice />
    </header>
  );
}
