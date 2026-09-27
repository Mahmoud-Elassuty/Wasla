import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAddresses } from "../store/reducers/profileSlice";
import { sendPasswordReset } from "../store/reducers/emailSlice";
import { showSuccess } from "../utils/notifications";
import ProfileForm from "../components/profile/ProfileForm";
import AddressesList from "../components/profile/AddressesList";
import SecurityForm from "../components/profile/SecurityForm";
import PaymentMethods from "../components/profile/PaymentMethods";

const TABS = [
  { key: "info", label: "Profile info", icon: "bi-person" },
  { key: "addresses", label: "Addresses", icon: "bi-geo-alt" },
  { key: "payment", label: "Payment methods", icon: "bi-credit-card" },
  { key: "security", label: "Security", icon: "bi-shield-lock" },
];

export default function Profile() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const emailSendStatus = useSelector((s) => s.email.sendStatus);
  const [tab, setTab] = useState("info");
  const sendingReset = emailSendStatus === "loading";

  useEffect(() => {
    if (user?.id === undefined) return;
    const request = dispatch(fetchAddresses(user.id));
    return () => request.abort();
  }, [dispatch, user?.id]);

  const handleSendResetEmail = () => {
    if (!user?.email || sendingReset) return;
    dispatch(sendPasswordReset(user.email))
      .unwrap()
      .then(() => dispatch(showSuccess(`Password reset email sent to ${user.email}.`)))
      .catch(() => {}); // the mock API rarely fails; if it does, the button just re-enables
  };

  return (
    <div className="container py-4">
      <div className="mb-4">
        <p className="eyebrow mb-1">My account</p>
        <h1 className="h3 mb-0">حسابي</h1>
      </div>

      <div className="row g-4">
        <div className="col-lg-3">
          <div className="nav nav-pills flex-lg-column gap-1 profile-tabs" role="tablist" aria-label="Account sections">
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
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="col-lg-9">
          <div className="bg-white border rounded-4 p-3 p-lg-4">
            {tab === "info" && (
              <>
                <h2 className="h5 mb-3">Profile information</h2>
                <ProfileForm />
              </>
            )}
            {tab === "addresses" && (
              <>
                <h2 className="h5 mb-3">Saved addresses</h2>
                <AddressesList />
              </>
            )}
            {tab === "payment" && (
              <>
                <h2 className="h5 mb-3">Payment methods</h2>
                <PaymentMethods />
              </>
            )}
            {tab === "security" && (
              <>
                <h2 className="h5 mb-3">Change password</h2>
                <SecurityForm />

                <hr className="my-4" />

                <h2 className="h6 mb-1">Password reset email</h2>
                <p className="text-secondary small">
                  Send a mock password reset email to {user?.email ?? "your inbox"} — useful for testing the email
                  flow without actually changing your password.
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
                      Sending...
                    </>
                  ) : (
                    "Send password reset email"
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
