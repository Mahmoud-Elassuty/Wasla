import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetSaveStatus, updateProfile } from "../../store/reducers/profileSlice";
import { showError, showSuccess } from "../../utils/notifications";
import FormField from "../common/FormField";

const PHONE_RE = /^(\+?20|0)?1[0125]\d{8}$/; // Egyptian mobile: 010 / 011 / 012 / 015
const FIELD_ORDER = ["name", "phone"];

const validate = (v) => {
  const e = {};
  if (v.name.trim().length < 2) e.name = "Name is required";
  if (v.phone.trim() && !PHONE_RE.test(v.phone.replace(/[\s-]/g, ""))) {
    e.phone = "Enter a valid Egyptian mobile number, e.g. 01012345678";
  }
  return e;
};

export default function ProfileForm() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { saveStatus, saveError } = useSelector((s) => s.profile);
  const [values, setValues] = useState({ name: user?.name ?? "", phone: user?.phone ?? "" });
  const [errors, setErrors] = useState({});
  const saving = saveStatus === "loading";

  // "Profile updated" fades after a few seconds instead of sticking around forever.
  useEffect(() => {
    if (saveStatus !== "succeeded") return;
    dispatch(showSuccess("Profile updated."));
    const timer = setTimeout(() => dispatch(resetSaveStatus()), 4000);
    return () => clearTimeout(timer);
  }, [saveStatus, dispatch]);

  useEffect(() => {
    if (saveStatus === "failed" && saveError) dispatch(showError(saveError));
  }, [saveStatus, saveError, dispatch]);

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
    dispatch(updateProfile({ name: values.name.trim(), phone: values.phone.trim() }));
  };

  const field = (name) => ({ id: name, value: values[name], onChange: handleChange, error: errors[name] });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset disabled={saving} className="border-0 p-0 m-0">
        <div className="row gx-3">
          <div className="col-md-6">
            <FormField {...field("name")} label="Name" autoComplete="name" />
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="email" className="form-label small fw-semibold">Email</label>
              <input id="email" className="form-control py-2" value={user?.email ?? ""} disabled readOnly />
              <p className="form-text" style={{ marginTop: "-0.25rem" }}>
                Contact support to change the email on your account.
              </p>
            </div>
          </div>
          <div className="col-md-6">
            <FormField
              {...field("phone")}
              type="tel"
              label="Phone (optional)"
              placeholder="01012345678"
              autoComplete="tel"
            />
          </div>
        </div>
      </fieldset>

      {saveStatus === "succeeded" && (
        <div className="alert alert-success py-2" role="status">
          Profile updated.
        </div>
      )}
      {saveError && (
        <div className="alert alert-danger py-2" role="alert">
          {saveError}
        </div>
      )}

      <button type="submit" className="btn btn-accent px-4" disabled={saving}>
        {saving ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
            Saving...
          </>
        ) : (
          "Save changes"
        )}
      </button>
    </form>
  );
}
