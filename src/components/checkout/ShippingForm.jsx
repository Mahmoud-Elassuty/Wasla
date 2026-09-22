import { useState } from "react";
import FormField from "../common/FormField";
import { GOVERNORATES } from "../../utils/checkout";

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^(\+?20|0)?1[0125]\d{8}$/; // Egyptian mobile: 010 / 011 / 012 / 015
const FIELD_ORDER = ["fullName", "email", "phone", "governorate", "city", "postalCode", "address", "notes"]; // on-screen order

const EMPTY = {
  fullName: "", email: "", phone: "", governorate: "", city: "", address: "", postalCode: "", notes: "",
};

const validate = (v) => {
  const errors = {};
  if (v.fullName.trim().length < 2) errors.fullName = "Full name is required";
  if (!v.email.trim()) errors.email = "Email is required";
  else if (!EMAIL_RE.test(v.email.trim())) errors.email = "Enter a valid email address";
  if (!v.phone.trim()) errors.phone = "Phone is required";
  else if (!PHONE_RE.test(v.phone.replace(/[\s-]/g, ""))) {
    errors.phone = "Enter a valid Egyptian mobile number, e.g. 01012345678";
  }
  if (!v.governorate) errors.governorate = "Choose a governorate";
  if (!v.city.trim()) errors.city = "City is required";
  if (v.address.trim().length < 5) errors.address = "Enter your full address";
  if (v.postalCode.trim() && !/^\d{5}$/.test(v.postalCode.trim())) {
    errors.postalCode = "Postal code must be 5 digits";
  }
  return errors;
};

// Submit it with any button that has form="shipping-form" (the id below).
export default function ShippingForm({ id = "shipping-form", initialValues, onSubmit, disabled = false }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});

  const handleChange = ({ target: { name, value } }) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    const found = validate(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((name) => found[name]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    onSubmit(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])));
  };

  const field = (name) => ({ value: values[name], onChange: handleChange, error: errors[name] });

  return (
    <form id={id} onSubmit={handleSubmit} noValidate>
      <fieldset disabled={disabled} className="border-0 p-0 m-0">
        <div className="row gx-3">
          <div className="col-md-6">
            <FormField id="fullName" label="Full name" autoComplete="name" {...field("fullName")} />
          </div>
          <div className="col-md-6">
            <FormField id="email" type="email" label="Email" autoComplete="email" {...field("email")} />
          </div>
          <div className="col-md-6">
            <FormField
              id="phone" type="tel" label="Phone" placeholder="01012345678"
              autoComplete="tel" {...field("phone")}
            />
          </div>
          <div className="col-md-6">
            <FormField
              id="governorate" as="select" label="Governorate"
              autoComplete="address-level1" {...field("governorate")}
            >
              <option value="">Select governorate</option>
              {GOVERNORATES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </FormField>
          </div>
          <div className="col-md-6">
            <FormField id="city" label="City" autoComplete="address-level2" {...field("city")} />
          </div>
          <div className="col-md-6">
            <FormField
              id="postalCode" label="Postal code (optional)" inputMode="numeric"
              maxLength={5} autoComplete="postal-code" {...field("postalCode")}
            />
          </div>
          <div className="col-12">
            <FormField
              id="address" label="Address" placeholder="Street, building, apartment"
              autoComplete="street-address" {...field("address")}
            />
          </div>
          <div className="col-12">
            <FormField
              id="notes" as="textarea" rows={3} maxLength={300}
              label="Delivery notes (optional)" placeholder="Landmark, preferred time..."
              {...field("notes")}
            />
          </div>
        </div>
      </fieldset>
    </form>
  );
}
