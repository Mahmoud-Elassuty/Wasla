const METHODS = [
  { id: "cod", label: "Cash on delivery", hint: "Pay in cash when your order arrives.", icon: "bi-cash-coin", enabled: true },
  { id: "card", label: "Credit card", hint: "Pay online with your card.", icon: "bi-credit-card", enabled: false },
  { id: "wallet", label: "Wallet", hint: "Pay with a mobile wallet.", icon: "bi-wallet2", enabled: false },
];

export default function PaymentMethod({ value, onChange }) {
  return (
    <fieldset>
      <legend className="visually-hidden">Payment method</legend>
      <div className="d-grid gap-2">
        {METHODS.map(({ id, label, hint, icon, enabled }) => (
          <label
            key={id}
            className={`payment-option d-flex align-items-center gap-3 p-3 rounded-3${
              value === id ? " selected" : ""
            }${enabled ? "" : " disabled"}`}
          >
            <input
              type="radio"
              name="payment"
              className="form-check-input mt-0"
              value={id}
              checked={value === id}
              disabled={!enabled}
              onChange={() => onChange(id)}
            />
            <i className={`bi ${icon} fs-4 text-wasla`} aria-hidden="true" />
            <span className="flex-grow-1">
              <span className="d-block fw-semibold">{label}</span>
              <span className="d-block small text-secondary">{hint}</span>
            </span>
            {!enabled && <span className="badge text-bg-light border fw-medium">Coming soon</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
