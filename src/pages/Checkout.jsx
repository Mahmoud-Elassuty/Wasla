import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { validateCartInventory } from "../store/reducers/cartSlice";
import ShippingForm from "../components/checkout/ShippingForm";
import GuestChoice from "../components/checkout/GuestChoice";
import OrderSummary from "../components/checkout/OrderSummary";
import { fetchAddresses } from "../store/reducers/profileSlice";
import { formatPrice } from "../utils/format";
import { getOrderTotals } from "../utils/checkout";
import { showError } from "../utils/notifications";
import { useT } from "../i18n/useT";

// Step 1 of 2: shipping details only. Payment method, card/PayPal/wallet processing, and the
// order itself are all handled on the /payment step, which reads `shipping` back out of
// navigation state — see Payment.jsx.
//
// Guest checkout: a visitor who isn't logged in first sees a sign-in / guest choice, then the same
// shipping form. Coming back from the payment step's "Edit" link skips the choice and refills the form.
export default function Checkout() {
  const { t } = useT();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((s) => s.auth.user);
  const { addresses: storedAddresses, addressesStatus, addressesError } = useSelector((s) => s.profile);
  const cart = useSelector((s) => s.cart);
  const { coupon, discount: couponDiscount } = useSelector((s) => s.coupons);
  const [guestChosen, setGuestChosen] = useState(Boolean(location.state?.guest));
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const addressSelectionTouched = useRef(false);
  const defaultSelectionApplied = useRef(false);

  const addresses = user?.id === undefined
    ? []
    : storedAddresses.filter(
        (address) => String(address.userId) === String(user.id),
      );

  useEffect(() => {
    if (user?.id === undefined) return;
    const request = dispatch(fetchAddresses(user.id));
    return () => request.abort();
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (
      location.state?.shipping ||
      addressesStatus !== "succeeded" ||
      addressSelectionTouched.current ||
      defaultSelectionApplied.current
    ) return;
    defaultSelectionApplied.current = true;
    const defaultAddress = addresses.find((address) => address.isDefault);
    if (defaultAddress) setSelectedAddressId(String(defaultAddress.id));
  }, [addresses, addressesStatus, location.state?.shipping]);

  const selectedAddress = addresses.find(
    (address) => String(address.id) === selectedAddressId,
  );

  const showChoice = !user && !guestChosen;

  const appliedCoupon = coupon ? { code: coupon.code, discount: couponDiscount } : null;
  const { total } = getOrderTotals(cart, appliedCoupon);

  const handleContinue = (values) => {
    dispatch(validateCartInventory())
      .unwrap()
      .then((result) => {
        if (result.issues.length > 0) return;
        navigate("/payment", { state: { shipping: values } });
      })
      .catch((error) => dispatch(showError(typeof error === "string" ? error : "Current stock could not be checked.")));
  };

  useEffect(() => {
    if (cart.items.length > 0) dispatch(validateCartInventory());
  }, [dispatch, cart.items.length]);

  const inventoryBlocked = cart.inventoryStatus !== "valid";

  if (cart.items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-bag fs-1 text-secondary" aria-hidden="true" />
        <h1 className="h4 mt-3">{t("Your cart is empty")}</h1>
        <p className="text-secondary">{t("Add something to your cart before checking out.")}</p>
        <Link to="/products" className="btn btn-accent px-4">{t("Continue shopping")}</Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h3 mb-1">{t("Checkout")}</h1>
      <p className="text-secondary small mb-4">{t("Step 1 of 2 — Shipping details")}</p>

      <div className="row g-4">
        <div className="col-lg-7">
          {showChoice ? (
            <GuestChoice onContinueAsGuest={() => setGuestChosen(true)} />
          ) : (
            <section className="bg-white border rounded-4 p-3 p-sm-4">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                <h2 className="h5 mb-0">{t("Shipping details")}</h2>
                {!user && (
                  <span className="small text-secondary">
                    Guest checkout &middot;{" "}
                    <Link to="/login" state={{ from: location }}>{t("Sign in instead")}</Link>
                  </span>
                )}
              </div>
              {cart.inventoryStatus === "loading" && (
                <p className="small text-secondary" role="status">{t("Checking current product availability...")}</p>
              )}
              {cart.inventoryStatus === "failed" && (
                <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
                  <span>{cart.inventoryError ? t(cart.inventoryError) : t("Current stock could not be checked.")}</span>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => dispatch(validateCartInventory())}>
                    {t("Retry stock check")}
                  </button>
                </div>
              )}
              {cart.inventoryStatus === "invalid" && (
                <div className="alert alert-warning" role="alert">
                  <p className="fw-semibold mb-1">{t("Update your cart before continuing.")}</p>
                  <ul className="mb-2">
                    {cart.inventoryIssues.map((issue) => <li key={issue}>{issue}</li>)}
                  </ul>
                  <Link to="/cart" className="btn btn-sm btn-outline-secondary">{t("Review cart")}</Link>
                </div>
              )}
              {user && addressesStatus === "loading" && addresses.length === 0 && (
                <p className="small text-secondary" role="status">{t("Loading saved addresses...")}</p>
              )}
              {user && addressesStatus === "failed" && (
                <div className="alert alert-warning py-2 d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
                  <span>{addressesError ? t(addressesError) : t("Saved addresses could not be loaded. You can enter your address manually.")}</span>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => dispatch(fetchAddresses(user.id))}>
                    Retry
                  </button>
                </div>
              )}
              {user && addresses.length > 0 && (
                <div className="mb-3">
                  <label htmlFor="saved-address" className="form-label small fw-semibold">
                    {t("Use a saved address")}
                  </label>
                  <select
                    id="saved-address"
                    className="form-select"
                    value={selectedAddressId}
                    onChange={(event) => {
                      addressSelectionTouched.current = true;
                      setSelectedAddressId(event.target.value);
                    }}
                  >
                    <option value="">{t("Enter address manually")}</option>
                    {addresses.map((address) => (
                      <option key={address.id} value={String(address.id)}>
                        {address.name}{address.isDefault ? ` (${t("Default")})` : ""} · {address.city}, {address.governorate}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <ShippingForm
                key={selectedAddressId || "manual-shipping"}
                initialValues={
                  user
                    ? {
                        fullName: user.name ?? "",
                        email: user.email ?? "",
                        ...(location.state?.shipping ?? {}),
                        ...(selectedAddress
                          ? {
                              phone: selectedAddress.phone,
                              governorate: selectedAddress.governorate,
                              city: selectedAddress.city,
                              address: selectedAddress.address,
                              postalCode: selectedAddress.postalCode ?? "",
                            }
                          : {}),
                      }
                    : { ...(location.state?.shipping ?? {}) }
                }
                onSubmit={handleContinue}
              />
            </section>
          )}
        </div>

        <div className="col-lg-5">
          <OrderSummary>
            {!showChoice && (
              <button type="submit" form="shipping-form" className="btn btn-accent btn-lg w-100 mt-4" disabled={inventoryBlocked}>
                {cart.inventoryStatus === "loading" ? t("Checking stock...") : t("Continue to payment — {price}", { price: formatPrice(total) })}
              </button>
            )}
            <Link to="/cart" className={`btn btn-outline-secondary w-100 ${showChoice ? "mt-4" : "mt-2"}`}>
              {t("Back to cart")}
            </Link>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
