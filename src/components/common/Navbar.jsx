import { useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/reducers/authSlice";
import { fetchWishlist } from "../../store/reducers/wishlistSlice";
import WishlistNotice from "../wishlist/WishlistNotice";
import NotificationBell from "../notifications/NotificationBell";
import ProductSearch from "./ProductSearch";
import CategoriesDropdown from "../category/CategoriesDropdown";
import { formatPrice } from "../../utils/format";
import LanguageSwitcher from "./LanguageSwitcher";
import { useT } from "../../i18n/useT";

const links = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/offers", label: "Offers" },
  { to: "/cart", label: "Cart" },
];

// Desktop text link (the bottom nav covers Wishlist on phones). Sits right before Admin.
const wishlistLink = { to: "/wishlist", label: "Wishlist" };

const PREVIEW_LIMIT = 4;

export default function Navbar() {
  const { t } = useT();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { items, itemCount, total } = useSelector((s) => s.cart);
  const wishlistCount = useSelector((s) => s.wishlist.items.length);
  const navLinks =
    user?.role === "admin"
      ? [...links, wishlistLink, { to: "/admin", label: "Admin" }]
      : user?.role === "seller"
        ? [...links, wishlistLink, { to: "/seller", label: "Seller Dashboard" }]
        : [...links, wishlistLink];
  const userId = user?.id;

  // Load the saved products for whoever is logged in, so hearts are filled everywhere.
  useEffect(() => {
    if (userId === undefined) return;
    const request = dispatch(fetchWishlist(userId));
    return () => request.abort();
  }, [dispatch, userId]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <header className="site-header product-search-header bg-white border-bottom sticky-top">
      <div className="container">
        <div className="site-header-top row align-items-center g-2 py-2">
          <div className="col-auto col-md-auto">
            <Link to="/" className="text-decoration-none d-inline-block lh-1">
              <span className="font-display fs-4 fw-bold text-wasla">wasla</span>{" "}
              <span className="brand-ar fw-semibold text-accent" dir="rtl">(وصلة)</span>
              <small className="d-none d-lg-block text-secondary">{t("Your Gateway to Shopping")}</small>
            </Link>
          </div>

          <div className="col-12 col-md order-3 order-md-2">
            <ProductSearch />
          </div>

          <div className="col col-md-auto order-2 order-md-3 d-flex justify-content-end align-items-center gap-2 gap-sm-3">
            <LanguageSwitcher className="nav-lang-switch d-none d-md-inline-block" />
            <Link
              to="/wishlist"
              className="icon-btn position-relative"
              aria-label={t("Wishlist, {count} items", { count: wishlistCount })}
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
                aria-label={t("Cart, {count} items", { count: itemCount })}
              >
                <i className="bi bi-bag" />
                <span className="badge rounded-pill bg-accent position-absolute top-0 start-100 translate-middle">
                  {itemCount}
                </span>
              </button>

              <div className="dropdown-menu dropdown-menu-end p-0 cart-dropdown">
                {items.length === 0 ? (
                  <div className="text-center px-3 py-4">
                    <p className="small text-secondary mb-2">{t("Your cart is empty")}</p>
                    <Link to="/products" className="btn btn-sm btn-wasla">{t("Browse products")}</Link>
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
                        {t("nav.moreItems", { count: items.length - PREVIEW_LIMIT })}
                      </p>
                    )}
                    <div className="p-3 border-top">
                      <div className="d-flex justify-content-between fw-semibold mb-2">
                        <span>{t("Total")}</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                      <div className="d-flex gap-2">
                        <Link to="/cart" className="btn btn-outline-secondary flex-fill">{t("View cart")}</Link>
                        <Link to="/checkout" className="btn btn-accent flex-fill">{t("Checkout")}</Link>
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
                    <div className="fw-semibold small text-break">{user.name}</div>
                    <div className="text-secondary small text-break">{user.email}</div>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item" to="/profile">{t("My account")}</Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/orders">{t("My orders")}</Link>
                  </li>
                  {user.role === "admin" && (
                    <li>
                      <Link className="dropdown-item" to="/admin">{t("Admin panel")}</Link>
                    </li>
                  )}
                  {user.role === "seller" && (
                    <li>
                      <Link className="dropdown-item" to="/seller">{t("Seller dashboard")}</Link>
                    </li>
                  )}
                  <li>
                    <button type="button" className="dropdown-item" onClick={handleLogout}>
                      {t("Log out")}
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <Link to="/login" className="btn btn-wasla btn-sm px-2 px-sm-3 text-nowrap">{t("Log in")}</Link>
            )}
          </div>
        </div>
      </div>

      <nav className="site-nav border-top" aria-label={t("Main")}>
        <div className="container">
          <div className="site-nav-row site-nav-row-mobile-categories d-flex align-items-center gap-2 gap-md-3">
            <div className="nav-links-scroll gap-3 gap-md-4 py-1 py-md-0 d-none d-md-flex">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) => `nav-link-wasla text-nowrap${isActive ? " active" : ""}`}
                >
                  {t(label)}
                </NavLink>
              ))}
            </div>
            <CategoriesDropdown />
            {/* Phones: the toggle sits on the categories row so the logo + 4 header controls keep their room.
                Only one of the two switchers is ever displayed. */}
            <LanguageSwitcher className="d-md-none ms-auto flex-shrink-0" />
            {user?.role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-link-wasla text-nowrap d-md-none${isActive ? " active" : ""}`}
              >
                {t("Admin")}
              </NavLink>
            )}
          </div>
        </div>
      </nav>
      <WishlistNotice />
    </header>
  );
}
