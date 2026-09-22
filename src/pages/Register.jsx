import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register, resetStatus } from "../store/reducers/authSlice";
import FormField from "../components/common/FormField";

const validate = ({ name, email, password, confirmPassword }) => {
  const errors = {};
  if (!name.trim()) errors.name = "Name is required";
  if (!email.trim()) errors.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email address";
  if (!password) errors.password = "Password is required";
  else if (password.length < 6) errors.password = "Use at least 6 characters";
  if (!confirmPassword) errors.confirmPassword = "Confirm your password";
  else if (confirmPassword !== password) errors.confirmPassword = "Passwords don't match";
  return errors;
};

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, status, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});

  const loading = status === "loading";

  useEffect(() => {
    dispatch(resetStatus());
  }, [dispatch]);

  if (user) return <Navigate to="/" replace />;

  const handleChange = ({ target: { name, value } }) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const { name, email, password } = form;
    dispatch(register({ name, email, password }))
      .unwrap()
      .then(() => navigate("/login", { replace: true, state: { registered: true } }))
      .catch(() => {}); // the error message is already in the store
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-5">
          <div className="bg-white border rounded-4 shadow-sm p-4 p-md-5">
            <h1 className="h3 text-wasla mb-1">Create your account</h1>
            <p className="text-secondary mb-4">Save your favorites and check out faster.</p>

            {error && (
              <div className="alert alert-danger py-2" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <FormField
                id="name"
                label="Full name"
                placeholder="Your name"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                error={errors.name}
              />
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
                placeholder="At least 6 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
              />
              <FormField
                id="confirmPassword"
                type="password"
                label="Confirm password"
                placeholder="Repeat your password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />
              <button type="submit" className="btn btn-accent w-100 py-2 mt-2" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <p className="text-center text-secondary small mt-4 mb-0">
              Already have an account? <Link to="/login" className="fw-semibold">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
