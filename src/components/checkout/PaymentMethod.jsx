import { useT } from "../../i18n/useT";
const METHODS = [
  { id: "cod", label: "Cash on delivery", hint: "Pay in cash when your order arrives.", icon: "bi-cash-coin" },
  { id: "credit_card", label: "Credit / Debit card", hint: "Pay online with Visa, Mastercard or Amex.", icon: "bi-credit-card" },
  { id: "paypal", label: "PayPal", hint: "Pay using your PayPal account.", icon: "bi-paypal" },
  { id: "wallet", label: "Digital wallet", hint: "Apple Pay or Google Pay.", icon: "bi-wallet2" },
];

export default function PaymentMethod({ value, onChange }) {
  const { t } = useT();
  return (
    <fieldset>
      <legend className="visually-hidden">{t("Payment method")}</legend>
      <div className="d-grid gap-2">
        {METHODS.map(({ id, label, hint, icon }) => (
          <label
            key={id}
            className={`payment-option d-flex align-items-center gap-3 p-3 rounded-3${
              value === id ? " selected" : ""
            }`}
          >
            <input
              type="radio"
              name="payment"
              className="form-check-input mt-0"
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
            />
            <i className={`bi ${icon} fs-4 text-wasla`} aria-hidden="true" />
            <span className="flex-grow-1">
              <span className="d-block fw-semibold">{t(label)}</span>
              <span className="d-block small text-secondary">{t(`payopt.${id}.hint`)}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
