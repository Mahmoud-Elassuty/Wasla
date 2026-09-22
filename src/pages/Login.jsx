import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, resetStatus } from "../store/reducers/authSlice";
import FormField from "../components/common/FormField";

const validate = ({ email, password }) => {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email address";
  if (!password) errors.password = "Password is required";
  return errors;
};

export default function Login() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, status, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const from = location.state?.from?.pathname || "/";
  const loading = status === "loading";

  useEffect(() => {
    dispatch(resetStatus());
  }, [dispatch]);

  // Logged in (just now or earlier): go back to where the user came from.
  if (user) return <Navigate to={from} replace />;

  const handleChange = ({ target: { name, value } }) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) dispatch(login(form));
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-5">
          <div className="bg-white border rounded-4 shadow-sm p-4 p-md-5">
            <h1 className="h3 text-wasla mb-1">Welcome back</h1>
            <p className="text-secondary mb-4">Log in to track orders and check out faster.</p>

            {location.state?.registered && (
              <div className="alert alert-success py-2" role="status">
                Account created. Log in to continue.
              </div>
            )}
            {error && (
              <div className="alert alert-danger py-2" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <FormField
                id="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
              />
              <FormField
                id="password"
                type="password"
                label="Password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
              />
              <button type="submit" className="btn btn-accent w-100 py-2 mt-2" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </button>
            </form>

            <p className="text-center text-secondary small mt-4 mb-0">
              New to wasla? <Link to="/register" className="fw-semibold">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
