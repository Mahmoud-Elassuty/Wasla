import { useState } from "react";
import FormField from "../common/FormField";
import { GOVERNORATES } from "../../utils/checkout";

const PHONE_RE = /^(\+?20|0)?1[0125]\d{8}$/; // Egyptian mobile: 010 / 011 / 012 / 015
const FIELD_ORDER = ["name", "phone", "governorate", "city", "postalCode", "address"];

const EMPTY = { name: "", address: "", city: "", governorate: "", postalCode: "", phone: "" };

const validate = (v) => {
  const e = {};
  if (!v.name.trim()) e.name = "Give this address a label, e.g. Home or Work";
  if (!v.phone.trim()) e.phone = "Phone is required";
  else if (!PHONE_RE.test(v.phone.replace(/[\s-]/g, ""))) {
    e.phone = "Enter a valid Egyptian mobile number, e.g. 01012345678";
  }
  if (!v.governorate) e.governorate = "Choose a governorate";
  if (!v.city.trim()) e.city = "City is required";
  if (v.address.trim().length < 5) e.address = "Enter the full address";
  if (v.postalCode.trim() && !/^\d{5}$/.test(v.postalCode.trim())) {
    e.postalCode = "Postal code must be 5 digits";
  }
  return e;
};

// Parent (AddressesList) owns save/cancel wiring; this component only validates and hands
// back clean values. Works for both "add" (no initialValues) and "edit" (initialValues set).
export default function AddressForm({ initialValues, onSubmit, onCancel, saving = false, error = null }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});

  const handleChange = ({ target: { name, value } }) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (saving) return;
    const found = validate(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((name) => found[name]);
    if (firstInvalid) {
      document.getElementById(`addr-${firstInvalid}`)?.focus();
      return;
    }
    onSubmit(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])));
  };

  const field = (name) => ({ id: `addr-${name}`, value: values[name], onChange: handleChange, error: errors[name] });

  return (
    <form onSubmit={handleSubmit} noValidate className="address-form border rounded-4 p-3 p-md-4 mb-3 bg-white">
      <fieldset disabled={saving} className="border-0 p-0 m-0">
        <div className="row gx-3">
          <div className="col-md-6">
            <FormField {...field("name")} label="Label" placeholder="Home, Work..." maxLength={40} />
          </div>
          <div className="col-md-6">
            <FormField {...field("phone")} type="tel" label="Phone" placeholder="01012345678" autoComplete="tel" />
          </div>
          <div className="col-md-6">
            <FormField {...field("governorate")} as="select" label="Governorate">
              <option value="">Select governorate</option>
              {GOVERNORATES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </FormField>
          </div>
          <div className="col-md-6">
            <FormField {...field("city")} label="City" autoComplete="address-level2" />
          </div>
          <div className="col-md-6">
            <FormField
              {...field("postalCode")}
              label="Postal code (optional)"
              inputMode="numeric"
              maxLength={5}
              autoComplete="postal-code"
            />
          </div>
          <div className="col-12">
            <FormField
              {...field("address")}
              label="Address"
              placeholder="Street, building, apartment"
              autoComplete="street-address"
            />
          </div>
        </div>
      </fieldset>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <div className="d-flex flex-wrap gap-2">
        <button type="submit" className="btn btn-accent px-4" disabled={saving}>
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Saving...
            </>
          ) : (
            "Save address"
          )}
        </button>
        <button type="button" className="btn btn-outline-secondary px-4" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
