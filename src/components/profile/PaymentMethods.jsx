import { useState } from "react";

const CARD_RE = /^\d{13,19}$/;
const EMPTY = { holder: "", number: "", expiry: "", brand: "Card" };

const detectBrand = (digits) => {
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  return "Card";
};

const validate = (v) => {
  const e = {};
  if (!v.holder.trim()) e.holder = "Cardholder name is required";
  const digits = v.number.replace(/\s+/g, "");
  if (!CARD_RE.test(digits)) e.number = "Enter a valid card number";
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(v.expiry.trim())) e.expiry = "Use MM/YY";
  return e;
};

// This is a UI-only mock — no card data is sent anywhere or stored server-side, only kept in
// memory for this session, since json-server has nowhere real (or PCI-safe) to put it.
export default function PaymentMethods() {
  const [cards, setCards] = useState([]);
  const [adding, setAdding] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const handleChange = ({ target: { name, value } }) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const digits = values.number.replace(/\s+/g, "");
    setCards((c) => [
      ...c,
      { id: Date.now(), holder: values.holder.trim(), last4: digits.slice(-4), brand: detectBrand(digits), expiry: values.expiry.trim() },
    ]);
    setValues(EMPTY);
    setAdding(false);
  };

  return (
    <div>
      <p className="small text-secondary">
        Demo only — cards are kept in this browser session and are never saved or sent anywhere.
      </p>

      {cards.length === 0 && !adding && (
        <p className="text-secondary mb-3">No payment methods saved yet.</p>
      )}

      {cards.map((card) => (
        <div key={card.id} className="d-flex justify-content-between align-items-center border rounded-4 p-3 mb-3">
          <div className="d-flex align-items-center gap-3">
            <i className="bi bi-credit-card-2-front fs-4 text-wasla" aria-hidden="true" />
            <div>
              <div className="fw-semibold">
                {card.brand} &middot;&middot;&middot;&middot; {card.last4}
              </div>
              <div className="small text-secondary">
                {card.holder} &middot; Expires {card.expiry}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => setCards((c) => c.filter((x) => x.id !== card.id))}
          >
            Delete
          </button>
        </div>
      ))}

      {adding ? (
        <form onSubmit={handleAdd} className="border rounded-4 p-3 p-md-4 bg-white" noValidate>
          <div className="row gx-3">
            <div className="col-12">
              <div className="mb-3">
                <label htmlFor="pm-holder" className="form-label small fw-semibold">Cardholder name</label>
                <input
                  id="pm-holder"
                  name="holder"
                  className={`form-control py-2${errors.holder ? " is-invalid" : ""}`}
                  value={values.holder}
                  onChange={handleChange}
                  autoComplete="cc-name"
                />
                {errors.holder && <div className="invalid-feedback">{errors.holder}</div>}
              </div>
            </div>
            <div className="col-md-8">
              <div className="mb-3">
                <label htmlFor="pm-number" className="form-label small fw-semibold">Card number</label>
                <input
                  id="pm-number"
                  name="number"
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  className={`form-control py-2${errors.number ? " is-invalid" : ""}`}
                  value={values.number}
                  onChange={handleChange}
                  autoComplete="cc-number"
                />
                {errors.number && <div className="invalid-feedback">{errors.number}</div>}
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label htmlFor="pm-expiry" className="form-label small fw-semibold">Expiry (MM/YY)</label>
                <input
                  id="pm-expiry"
                  name="expiry"
                  placeholder="12/28"
                  className={`form-control py-2${errors.expiry ? " is-invalid" : ""}`}
                  value={values.expiry}
                  onChange={handleChange}
                  autoComplete="cc-exp"
                />
                {errors.expiry && <div className="invalid-feedback">{errors.expiry}</div>}
              </div>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button type="submit" className="btn btn-accent px-4">Save card</button>
            <button
              type="button"
              className="btn btn-outline-secondary px-4"
              onClick={() => {
                setAdding(false);
                setValues(EMPTY);
                setErrors({});
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-outline-secondary" onClick={() => setAdding(true)}>
          <i className="bi bi-plus-lg me-1" aria-hidden="true" />
          Add new payment method
        </button>
      )}
    </div>
  );
}
