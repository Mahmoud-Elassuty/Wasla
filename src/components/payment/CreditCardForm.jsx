import { useState } from "react";
import { detectCardBrand, formatCardNumber, formatExpiry, isExpiryValid, luhnValid } from "../../utils/creditCard";
import { formatPrice } from "../../utils/format";
import { useT } from "../../i18n/useT";

const BRAND_ICON = { Visa: "bi-credit-card-2-front", Mastercard: "bi-credit-card-2-front", Amex: "bi-credit-card-2-front", Discover: "bi-credit-card-2-front" };

const EMPTY = { number: "", name: "", expiry: "", cvv: "" };

function validate(v) {
  const errors = {};
  const digits = v.number.replace(/\s+/g, "");
  if (digits.length < 13 || digits.length > 19) errors.number = "Enter a valid card number";
  else if (!luhnValid(digits)) errors.number = "That card number doesn't look right";

  if (!v.name.trim()) errors.name = "Cardholder name is required";

  if (!isExpiryValid(v.expiry)) errors.expiry = "Enter a valid, unexpired MM/YY date";

  const brand = detectCardBrand(digits);
  const cvvLen = brand === "Amex" ? 4 : 3;
  if (!new RegExp(`^\\d{${cvvLen}}$`).test(v.cvv)) errors.cvv = cvvLen === 4 ? "Enter the 4-digit security code" : "Enter the 3-digit security code";

  return errors;
}

export default function CreditCardForm({ amount, processing, error, onSubmit }) {
  const { t } = useT();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [save, setSave] = useState(false);

  const digits = values.number.replace(/\s+/g, "");
  const brand = detectCardBrand(digits);

  const handleChange = ({ target: { name, value } }) => {
    const formatted = name === "number" ? formatCardNumber(value) : name === "expiry" ? formatExpiry(value) : name === "cvv" ? value.replace(/\D/g, "").slice(0, 4) : value;
    setValues((v) => ({ ...v, [name]: formatted }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (processing) return;
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({ brand, last4: digits.slice(-4), save });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset disabled={processing} className="border-0 p-0 m-0">
        <div className="mb-3">
          <label htmlFor="cc-number" className="form-label small fw-semibold">{t("Card number")}</label>
          <div className="position-relative">
            <input
              id="cc-number"
              name="number"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              autoComplete="cc-number"
              className={`form-control card-number-input py-2 pe-5${errors.number ? " is-invalid" : ""}`}
              value={values.number}
              onChange={handleChange}
            />
            {brand && (
              <i
                className={`bi ${BRAND_ICON[brand] ?? "bi-credit-card-2-front"} card-brand-icon position-absolute top-50 end-0 translate-middle-y me-3`}
                aria-label={brand}
              />
            )}
            {errors.number && <div className="invalid-feedback">{t(errors.number)}</div>}
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="cc-name" className="form-label small fw-semibold">{t("Cardholder name")}</label>
          <input
            id="cc-name"
            name="name"
            autoComplete="cc-name"
            placeholder={t("As shown on the card")}
            className={`form-control py-2${errors.name ? " is-invalid" : ""}`}
            value={values.name}
            onChange={handleChange}
          />
          {errors.name && <div className="invalid-feedback">{t(errors.name)}</div>}
        </div>

        <div className="row gx-3">
          <div className="col-6">
            <label htmlFor="cc-expiry" className="form-label small fw-semibold">{t("Expiry (MM/YY)")}</label>
            <input
              id="cc-expiry"
              name="expiry"
              inputMode="numeric"
              placeholder="12/28"
              autoComplete="cc-exp"
              className={`form-control py-2${errors.expiry ? " is-invalid" : ""}`}
              value={values.expiry}
              onChange={handleChange}
            />
            {errors.expiry && <div className="invalid-feedback">{t(errors.expiry)}</div>}
          </div>
          <div className="col-6">
            <label htmlFor="cc-cvv" className="form-label small fw-semibold">{t("CVV")}</label>
            <input
              id="cc-cvv"
              name="cvv"
              inputMode="numeric"
              placeholder="123"
              autoComplete="cc-csc"
              className={`form-control py-2${errors.cvv ? " is-invalid" : ""}`}
              value={values.cvv}
              onChange={handleChange}
            />
            {errors.cvv && <div className="invalid-feedback">{t(errors.cvv)}</div>}
          </div>
        </div>

        <div className="form-check mt-3">
          <input
            id="cc-save"
            type="checkbox"
            className="form-check-input"
            checked={save}
            onChange={(e) => setSave(e.target.checked)}
          />
          <label htmlFor="cc-save" className="form-check-label small">
            {t("Save this card for future purchases")}
          </label>
        </div>
      </fieldset>

      {error && (
        <div className="alert alert-danger py-2 mt-3" role="alert">
          {t(error)}
        </div>
      )}

      <button type="submit" className="btn btn-accent btn-lg w-100 mt-3" disabled={processing}>
        {processing ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
            {t("Processing...")}
          </>
        ) : (
          t("Pay Now — {price}", { price: formatPrice(amount) })
        )}
      </button>
    </form>
  );
}
