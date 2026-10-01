import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCartCount } from "../../store/reducers/cartSlice";

// Routes where a persistent bar would interrupt a sensitive flow (auth, checkout, payment,
// and the order details / confirmation screen).
const HIDDEN_ON = [
  /^\/login\/?$/,
  /^\/register\/?$/,
  /^\/checkout\/?$/,
  /^\/payment\/?$/,
  /^\/orders\/[^/]+\/?$/,
];

// Shared by MainLayout (to reserve bottom space) and this component (to render), so the
// two can never disagree about whether the bar is on screen.
export function useShowMobileBottomNav() {
  const { pathname } = useLocation();
  return !HIDDEN_ON.some((pattern) => pattern.test(pathname));
}

const startsWith = (prefix) => (path) => path === prefix || path.startsWith(`${prefix}/`);

// Mobile-only (CSS hides it from 768px up). Reuses the existing routes, auth state and cart count.
export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const user = useSelector((s) => s.auth.user);
  const cartCount = useSelector(selectCartCount);

  const tabs = [
    { key: "home", label: "Home", to: "/", icon: "bi-house", activeIcon: "bi-house-fill", isActive: (p) => p === "/" },
    {
      key: "products",
      label: "Products",
      to: "/products",
      icon: "bi-grid",
      activeIcon: "bi-grid-fill",
      isActive: (p) => ["/products", "/category", "/offers", "/search"].some((prefix) => startsWith(prefix)(p)),
    },
    { key: "wishlist", label: "Wishlist", to: "/wishlist", icon: "bi-heart", activeIcon: "bi-heart-fill", isActive: startsWith("/wishlist") },
    {
      key: "cart",
      label: "Cart",
      to: "/cart",
      icon: "bi-bag",
      activeIcon: "bi-bag-fill",
      isActive: startsWith("/cart"),
      badge: cartCount,
    },
    {
      key: "profile",
      label: "Profile",
      to: user ? "/profile" : "/login",
      icon: "bi-person",
      activeIcon: "bi-person-fill",
      isActive: (p) => startsWith("/profile")(p) || startsWith("/orders")(p),
      ariaLabel: user ? "Profile" : "Profile, log in",
    },
  ];

  return (
    <nav className="mobile-bottom-nav d-md-none" aria-label="Primary">
      <ul className="mobile-bottom-nav-list list-unstyled mb-0">
        {tabs.map(({ key, label, to, icon, activeIcon, isActive, badge, ariaLabel }) => {
          const active = isActive(pathname);
          return (
            <li key={key} className="mobile-bottom-nav-item">
              <Link
                to={to}
                className={`mobile-bottom-nav-link${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
                aria-label={
                  key === "cart"
                    ? `Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`
                    : ariaLabel
                }
              >
                <span className="mobile-bottom-nav-icon">
                  <i className={`bi ${active ? activeIcon : icon}`} aria-hidden="true" />
                  {badge > 0 && (
                    <span className="mobile-bottom-nav-badge" aria-hidden="true">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                <span className="mobile-bottom-nav-label">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
