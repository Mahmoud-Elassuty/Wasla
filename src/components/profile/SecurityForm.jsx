import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { changePassword, resetPasswordStatus } from "../../store/reducers/profileSlice";
import { showError, showSuccess } from "../../utils/notifications";
import FormField from "../common/FormField";

const FIELD_ORDER = ["currentPassword", "newPassword", "confirmPassword"];
const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

const validate = (v) => {
  const e = {};
  if (!v.currentPassword) e.currentPassword = "Enter your current password";
  if (!v.newPassword) e.newPassword = "Enter a new password";
  else if (v.newPassword.length < 6) e.newPassword = "Use at least 6 characters";
  if (!v.confirmPassword) e.confirmPassword = "Confirm your new password";
  else if (v.confirmPassword !== v.newPassword) e.confirmPassword = "Passwords don't match";
  return e;
};

export default function SecurityForm() {
  const dispatch = useDispatch();
  const { passwordStatus, passwordError } = useSelector((s) => s.profile);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const saving = passwordStatus === "loading";

  // Clear the form and fade the success message after a change goes through.
  useEffect(() => {
    if (passwordStatus !== "succeeded") return;
    dispatch(showSuccess("Password updated."));
    setValues(EMPTY);
    const timer = setTimeout(() => dispatch(resetPasswordStatus()), 4000);
    return () => clearTimeout(timer);
  }, [passwordStatus, dispatch]);

  useEffect(() => {
    if (passwordStatus === "failed" && passwordError) dispatch(showError(passwordError));
  }, [passwordStatus, passwordError, dispatch]);

  const handleChange = ({ target: { name, value } }) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (saving) return;
    const found = validate(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((f) => found[f]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    dispatch(changePassword(values));
  };

  const field = (name) => ({
    id: name,
    type: "password",
    autoComplete: name === "currentPassword" ? "current-password" : "new-password",
    value: values[name],
    onChange: handleChange,
    error: errors[name],
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset disabled={saving} className="border-0 p-0 m-0">
        <div className="row gx-3">
          <div className="col-md-6">
            <FormField {...field("currentPassword")} label="Current password" />
          </div>
          <div className="col-md-6" />
          <div className="col-md-6">
            <FormField {...field("newPassword")} label="New password" />
          </div>
          <div className="col-md-6">
            <FormField {...field("confirmPassword")} label="Confirm new password" />
          </div>
        </div>
      </fieldset>

      {passwordStatus === "succeeded" && (
        <div className="alert alert-success py-2" role="status">
          Password updated.
        </div>
      )}
      {passwordError && (
        <div className="alert alert-danger py-2" role="alert">
          {passwordError}
        </div>
      )}

      <button type="submit" className="btn btn-accent px-4" disabled={saving}>
        {saving ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
            Updating...
          </>
        ) : (
          "Update password"
        )}
      </button>
    </form>
  );
}
