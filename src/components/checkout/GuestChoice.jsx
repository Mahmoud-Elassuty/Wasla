import { Link, useLocation } from "react-router-dom";

// Shown on /checkout when nobody is logged in. Signing in returns here afterwards (Login reads
// `state.from`); "Continue as guest" just tells the parent to show the normal shipping form.
export default function GuestChoice({ onContinueAsGuest }) {
  const location = useLocation();
  const fromState = { from: location };

  return (
    <section className="bg-white border rounded-4 p-3 p-sm-4" aria-labelledby="guest-choice-title">
      <h2 id="guest-choice-title" className="h5 mb-1">How would you like to check out?</h2>
      <p className="text-secondary small mb-4">
        Sign in to track your orders, or check out quickly without an account.
      </p>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="border rounded-4 p-3 h-100 d-flex flex-column">
            <h3 className="h6 mb-1">
              <i className="bi bi-person-circle me-2" aria-hidden="true" />
              Have an account?
            </h3>
            <p className="small text-secondary flex-grow-1">
              Sign in to check out faster and see your order history.
            </p>
            <Link to="/login" state={fromState} className="btn btn-accent w-100">
              Sign in
            </Link>
            <Link to="/register" state={fromState} className="btn btn-link btn-sm mt-2">
              Create an account
            </Link>
          </div>
        </div>

        <div className="col-md-6">
          <div className="border rounded-4 p-3 h-100 d-flex flex-column">
            <h3 className="h6 mb-1">
              <i className="bi bi-bag-check me-2" aria-hidden="true" />
              Continue as guest
            </h3>
            <p className="small text-secondary flex-grow-1">
              No password needed. We only need your contact and delivery details.
            </p>
            <button type="button" className="btn btn-outline-secondary w-100" onClick={onContinueAsGuest}>
              Continue as guest
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
