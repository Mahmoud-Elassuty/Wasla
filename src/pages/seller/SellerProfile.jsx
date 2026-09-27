import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetProfileSave, updateSellerProfile } from "../../store/reducers/sellerSlice";
import { showError, showSuccess } from "../../utils/notifications";
import FormField from "../../components/common/FormField";

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^(\+?20|0)?1[0125]\d{8}$/; // Egyptian mobile: 010 / 011 / 012 / 015
const FIELD_ORDER = ["storeName", "storeDescription", "storeEmail", "storePhone", "logoUrl"];

const isUrl = (s) => {
  try {
    const { protocol } = new URL(s);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

const toForm = (u) => ({
  storeName: u?.storeName ?? "",
  storeDescription: u?.storeDescription ?? "",
  storeEmail: u?.storeEmail ?? "",
  storePhone: u?.storePhone ?? "",
  logoUrl: u?.logoUrl ?? "",
});

function validate(v) {
  const e = {};
  if (!v.storeName.trim()) e.storeName = "Store name is required";
  if (v.storeEmail.trim() && !EMAIL_RE.test(v.storeEmail.trim())) e.storeEmail = "Enter a valid email address";
  if (v.storePhone.trim() && !PHONE_RE.test(v.storePhone.replace(/[\s-]/g, ""))) {
    e.storePhone = "Enter a valid Egyptian mobile number, e.g. 01012345678";
  }
  if (v.logoUrl.trim() && !isUrl(v.logoUrl.trim())) e.logoUrl = "Enter a valid http(s) URL";
  return e;
}

export default function SellerProfile() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { profileSaveStatus, profileSaveError } = useSelector((s) => s.seller);
  const [values, setValues] = useState(() => toForm(user));
  const [errors, setErrors] = useState({});
  const saving = profileSaveStatus === "loading";

  // "Store profile updated" fades after a few seconds instead of sticking around forever.
  useEffect(() => {
    if (profileSaveStatus !== "succeeded") return;
    dispatch(showSuccess("Store profile updated."));
    const timer = setTimeout(() => dispatch(resetProfileSave()), 4000);
    return () => clearTimeout(timer);
  }, [profileSaveStatus, dispatch]);

  useEffect(() => {
    if (profileSaveStatus === "failed" && profileSaveError) dispatch(showError(profileSaveError));
  }, [profileSaveStatus, profileSaveError, dispatch]);

  const handleChange = ({ target: { name, value } }) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (saving || !user) return;
    const found = validate(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((f) => found[f]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    dispatch(
      updateSellerProfile({
        id: user.id,
        data: {
          storeName: values.storeName.trim(),
          storeDescription: values.storeDescription.trim(),
          storeEmail: values.storeEmail.trim(),
          storePhone: values.storePhone.trim(),
          logoUrl: values.logoUrl.trim(),
        },
      })
    );
  };

  const field = (name) => ({ id: name, value: values[name], onChange: handleChange, error: errors[name] });

  return (
    <>
      <div className="mb-4">
        <p className="eyebrow mb-1">Store profile</p>
        <h1 className="h3 mb-0">ملف المتجر</h1>
      </div>

      <form className="admin-card p-3 p-md-4" style={{ maxWidth: 640 }} onSubmit={handleSubmit} noValidate>
        <fieldset disabled={saving} className="border-0 p-0 m-0">
          <FormField {...field("storeName")} label="Store name" placeholder="Your store's name" maxLength={80} />
          <FormField
            {...field("storeDescription")}
            as="textarea"
            rows={4}
            label="Store description"
            placeholder="What do you sell? What makes your store worth buying from?"
            maxLength={500}
          />
          <div className="row gx-3">
            <div className="col-md-6">
              <FormField {...field("storeEmail")} type="email" label="Contact email (optional)" placeholder="store@example.com" autoComplete="email" />
            </div>
            <div className="col-md-6">
              <FormField {...field("storePhone")} type="tel" label="Contact phone (optional)" placeholder="01012345678" autoComplete="tel" />
            </div>
          </div>
          <FormField {...field("logoUrl")} label="Logo URL (optional)" placeholder="https://example.com/logo.png" spellCheck={false} />
          {values.logoUrl.trim() && isUrl(values.logoUrl.trim()) && (
            <img
              src={values.logoUrl.trim()}
              alt=""
              className="admin-thumb mb-3"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
        </fieldset>

        {profileSaveError && (
          <div className="alert alert-danger py-2" role="alert">
            {profileSaveError}
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
    </>
  );
}
