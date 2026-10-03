import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAddresses } from "../store/reducers/profileSlice";
import { fetchOrders, resetListStatus, selectOrdersByUserId } from "../store/reducers/ordersSlice";
import { sendPasswordReset } from "../store/reducers/emailSlice";
import { showSuccess } from "../utils/notifications";
import { formatPrice } from "../utils/format";
import { formatOrderDate, orderNumber } from "../utils/checkout";
import ProfileForm from "../components/profile/ProfileForm";
import AddressesList from "../components/profile/AddressesList";
import SecurityForm from "../components/profile/SecurityForm";
import PaymentMethods from "../components/profile/PaymentMethods";
import InterestPreferences from "../components/profile/InterestPreferences";
import "../styles/customer-experience.css";
import { useT } from "../i18n/useT";

const TABS = [
  { key: "info", label: "Profile info", icon: "bi-person" },
  { key: "addresses", label: "Addresses", icon: "bi-geo-alt" },
  { key: "payment", label: "Payment methods", icon: "bi-credit-card" },
  { key: "security", label: "Security", icon: "bi-shield-lock" },
];

const withProfileSource = (to) => `${to}${to.includes("?") ? "&" : "?"}from=profile`;

export default function Profile() {
  const { t, te } = useT();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const [searchParams] = useSearchParams();
  const emailSendStatus = useSelector((s) => s.email.sendStatus);
  const storedAddresses = useSelector((s) => s.profile.addresses);
  const addressesStatus = useSelector((s) => s.profile.addressesStatus);
  const wishlistItems = useSelector((s) => s.wishlist.items);
  const wishlistStatus = useSelector((s) => s.wishlist.status);
  const orders = useSelector((state) => selectOrdersByUserId(state, user?.id));
  const { status: ordersStatus, error: ordersError } = useSelector((s) => s.orders);
  const [tab, setTab] = useState(() =>
    user?.role === "customer" && searchParams.get("section") === "interests" ? "interests" : "info"
  );
  const sendingReset = emailSendStatus === "loading";
  const isCustomer = user?.role === "customer";
  const onboardingOpen = isCustomer
    && user?.onboardingCompleted === false
    && searchParams.get("onboarding") === "1";
  const addresses = useMemo(() =>
    user?.id === undefined
      ? []
      : storedAddresses.filter((address) => String(address.userId) === String(user.id)),
  [storedAddresses, user?.id]);
  const wishlistCount = useMemo(() =>
    user?.id === undefined
      ? 0
      : wishlistItems.filter((item) => String(item.userId) === String(user.id)).length,
  [wishlistItems, user?.id]);
  const recentOrders = orders.slice(0, 3);
  const primaryAddress = addresses.find((address) => address.isDefault) ?? addresses[0];

  useEffect(() => {
    if (user?.id === undefined) return;
    const request = dispatch(fetchAddresses(user.id));
    return () => request.abort();
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (!isCustomer || user?.id === undefined) return;
    const request = dispatch(fetchOrders(user.id));
    return () => {
      request.abort();
      dispatch(resetListStatus());
    };
  }, [dispatch, isCustomer, user?.id]);

  const handleSendResetEmail = () => {
    if (!user?.email || sendingReset) return;
    dispatch(sendPasswordReset(user.email))
      .unwrap()
      .then(() => dispatch(showSuccess(t("Password reset email sent to {email}.", { email: user.email }))))
      .catch(() => {}); // the mock API rarely fails; if it does, the button just re-enables
  };

  const openSettingsTab = (nextTab) => {
    setTab(nextTab);
    window.requestAnimationFrame(() => {
      document.getElementById("account-settings")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  const showDate = user?.createdAt && !Number.isNaN(new Date(user.createdAt).getTime());
  const initials = (user?.name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "W";

  useEffect(() => {
    if (!isCustomer || searchParams.get("section") !== "interests") return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("account-settings")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isCustomer, searchParams]);

  return (
    <div className="container py-4">
      <div className="mb-4">
        <p className="eyebrow mb-1">{t("My account")}</p>
        <h1 className="h3 mb-0">حسابي</h1>
      </div>

      {isCustomer && (
        <div className="customer-profile-dashboard">
          <section className="customer-profile-summary bg-white border rounded-4 p-3 p-md-4 mb-4" aria-label={t("Profile summary")}>
            <div className="customer-profile-avatar" aria-hidden="true">{initials}</div>
            <div className="customer-profile-identity">
              <span className="badge text-bg-light border mb-2">{t("Customer")}</span>
              <h2 className="h4 mb-1 text-break">{user?.name}</h2>
              <p className="text-secondary mb-2 text-break">{user?.email}</p>
              {primaryAddress && (
                <p className="small text-secondary mb-1">
                  <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                  <span className="fw-semibold">{primaryAddress.isDefault ? t("Default address:") : t("Saved address:")} </span>
                  {[primaryAddress.address, primaryAddress.city, primaryAddress.governorate, primaryAddress.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {showDate && <p className="small text-secondary mb-0">{t("Member since {date}", { date: formatOrderDate(user.createdAt) })}</p>}
            </div>
            <button type="button" className="btn btn-outline-secondary customer-profile-edit" onClick={() => openSettingsTab("info")}>
              <i className="bi bi-pencil me-2" aria-hidden="true" />{t("Edit Profile")}
            </button>
          </section>

          <section className="customer-profile-stats mb-4" aria-label={t("Account statistics")}>
            <Link to={withProfileSource("/orders")} className="customer-profile-stat bg-white border rounded-3 p-3 text-decoration-none">
              <span className="small text-secondary">{t("My Orders")}</span>
              <strong>{ordersStatus === "succeeded" || orders.length > 0 ? orders.length : "—"}</strong>
            </Link>
            <Link to={withProfileSource("/wishlist")} className="customer-profile-stat bg-white border rounded-3 p-3 text-decoration-none">
              <span className="small text-secondary">{t("Wishlist")}</span>
              <strong>{wishlistStatus === "succeeded" ? wishlistCount : "—"}</strong>
            </Link>
            <button type="button" className="customer-profile-stat bg-white border rounded-3 p-3 text-start" onClick={() => openSettingsTab("addresses")}>
              <span className="small text-secondary">{t("Saved Addresses")}</span>
              <strong>{addressesStatus === "succeeded" ? addresses.length : "—"}</strong>
            </button>
          </section>

          {(!Array.isArray(user?.interests) || user.interests.length === 0) && (
            <div className="customer-interest-prompt border rounded-3 p-3 mb-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
              <span className="small">{t("Choose your interests to personalize product suggestions.")}</span>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => openSettingsTab("interests")}>
                {t("Choose your interests")}
              </button>
            </div>
          )}

          <div className="row g-4 mb-4">
            <div className="col-lg-4">
              <section className="customer-profile-panel h-100 bg-white border rounded-4 p-3 p-md-4" aria-labelledby="profile-quick-actions-title">
                <h2 id="profile-quick-actions-title" className="h5 mb-3">{t("Quick Actions")}</h2>
                <div className="customer-profile-actions">
                  <Link to={withProfileSource("/orders")}><i className="bi bi-receipt" aria-hidden="true" />{t("My Orders")}</Link>
                  <Link to={withProfileSource("/wishlist")}><i className="bi bi-heart" aria-hidden="true" />{t("My Favorites")}</Link>
                  <button type="button" onClick={() => openSettingsTab("addresses")}><i className="bi bi-geo-alt" aria-hidden="true" />{t("My Addresses")}</button>
                  <button type="button" onClick={() => openSettingsTab("info")}><i className="bi bi-person-gear" aria-hidden="true" />{t("Edit Profile")}</button>
                  <button type="button" onClick={() => openSettingsTab("interests")}><i className="bi bi-sliders" aria-hidden="true" />{t("Manage Interests")}</button>
                </div>
              </section>
            </div>
            <div className="col-lg-8">
              <section className="customer-profile-panel h-100 bg-white border rounded-4 p-3 p-md-4" aria-labelledby="profile-recent-orders-title">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <h2 id="profile-recent-orders-title" className="h5 mb-0">{t("Recent Orders")}</h2>
                  <Link to={withProfileSource("/orders")} className="small fw-semibold text-decoration-none">{t("View All Orders")}</Link>
                </div>
                {recentOrders.length > 0 ? (
                  <div className="customer-recent-orders">
                    {recentOrders.map((order) => (
                      <Link key={order.id} to={withProfileSource(`/orders/${order.id}`)} className="customer-recent-order">
                        <span className="customer-recent-order-id">#{orderNumber(order.id)}</span>
                        <span className="customer-recent-order-date">{formatOrderDate(order.createdAt)}</span>
                        <span className="badge text-bg-light border text-capitalize">{order.status ? te("order", order.status) : t("Status unavailable")}</span>
                        {Number.isFinite(Number(order.total)) && <strong>{formatPrice(Number(order.total))}</strong>}
                      </Link>
                    ))}
                  </div>
                ) : ordersStatus === "idle" || ordersStatus === "loading" ? (
                  <div className="placeholder-glow" aria-busy="true" aria-label={t("Loading recent orders")}>
                    <span className="placeholder d-block col-12 mb-2" style={{ height: 48 }} />
                    <span className="placeholder d-block col-12" style={{ height: 48 }} />
                  </div>
                ) : ordersStatus === "failed" ? (
                  <div className="alert alert-danger py-2 mb-0" role="alert">{ordersError ? t(ordersError) : t("We couldn't load your orders.")}</div>
                ) : (
                  <div className="customer-orders-empty">
                    <i className="bi bi-receipt" aria-hidden="true" />
                    <p className="mb-2">{t("No orders yet.")}</p>
                    <Link to="/products" className="btn btn-sm btn-outline-secondary">{t("Browse products")}</Link>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-3">
          <div className="nav nav-pills flex-lg-column gap-1 profile-tabs" role="tablist" aria-label={t("Account sections")}>
            {TABS.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={`nav-link text-start d-flex align-items-center gap-2${tab === key ? " active" : ""}`}
                onClick={() => setTab(key)}
              >
                <i className={`bi ${icon}`} aria-hidden="true" />
                {t(label)}
              </button>
            ))}
          </div>
        </div>

        <div className="col-lg-9">
          <div className="bg-white border rounded-4 p-3 p-lg-4" id="account-settings">
            {isCustomer && <h2 className="h5 mb-3">{t("Account settings")}</h2>}
            {tab === "info" && (
              <>
                {isCustomer
                  ? <h3 className="h6 mb-3">{t("Profile information")}</h3>
                  : <h2 className="h5 mb-3">{t("Profile information")}</h2>}
                <ProfileForm />
              </>
            )}
            {tab === "addresses" && (
              <>
                {isCustomer
                  ? <h3 className="h6 mb-3">{t("Saved addresses")}</h3>
                  : <h2 className="h5 mb-3">{t("Saved addresses")}</h2>}
                <AddressesList />
              </>
            )}
            {tab === "payment" && (
              <>
                {isCustomer
                  ? <h3 className="h6 mb-3">{t("Payment methods")}</h3>
                  : <h2 className="h5 mb-3">{t("Payment methods")}</h2>}
                <PaymentMethods />
              </>
            )}
            {tab === "interests" && isCustomer && (
              <InterestPreferences onComplete={() => setTab("info")} />
            )}
            {tab === "security" && (
              <>
                {isCustomer
                  ? <h3 className="h6 mb-3">{t("Change password")}</h3>
                  : <h2 className="h5 mb-3">{t("Change password")}</h2>}
                <SecurityForm />

                <hr className="my-4" />

                {isCustomer
                  ? <h3 className="h6 mb-1">{t("Password reset email")}</h3>
                  : <h2 className="h6 mb-1">{t("Password reset email")}</h2>}
                <p className="text-secondary small">
                  {t("Send a mock password reset email to {email} — useful for testing the email flow without actually changing your password.", { email: user?.email ?? t("your inbox") })}
                </p>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={sendingReset}
                  onClick={handleSendResetEmail}
                >
                  {sendingReset ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                      {t("Sending...")}
                    </>
                  ) : (
                    t("Send password reset email")
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {onboardingOpen && (
        <InterestPreferences
          onboarding
          onComplete={() => navigate("/products", { replace: true })}
        />
      )}
    </div>
  );
}
