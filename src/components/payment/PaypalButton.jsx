import { useState } from "react";
import { formatPrice } from "../../utils/format";
import { useT } from "../../i18n/useT";

export default function PaypalButton({ amount, processing, error, onConfirm }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  const close = () => {
    if (processing) return; // can't cancel mid-"redirect"
    setOpen(false);
  };

  return (
    <>
      <button type="button" className="btn btn-lg w-100 text-white fw-semibold" style={{ background: "#003087" }} onClick={() => setOpen(true)}>
        <i className="bi bi-paypal me-2" aria-hidden="true" />
        {t("Pay with PayPal")}
      </button>

      {open && (
        <div className="modal-backdrop-custom" onMouseDown={close}>
          <div
            className="modal-dialog-custom bg-white rounded-4 shadow-lg p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="paypal-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="payment-gateway-icon paypal">
              <i className="bi bi-paypal" aria-hidden="true" />
            </div>
            <h2 id="paypal-modal-title" className="h5 mb-1">{t("Redirecting to PayPal")}</h2>
            <p className="text-secondary small mb-4">
              <bdi>{t("You'll complete a payment of {amount} using your PayPal account.", { amount: formatPrice(amount) })}</bdi>
              {t("This is a mock — no real PayPal window will open.")}
            </p>

            {error && (
              <div className="alert alert-danger py-2 text-start" role="alert">
                {t(error)}
              </div>
            )}

            {processing ? (
              <div className="py-2">
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                {t("Confirming with PayPal...")}
              </div>
            ) : (
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary flex-fill" onClick={close}>
                  {t("Cancel")}
                </button>
                <button type="button" className="btn btn-accent flex-fill" onClick={onConfirm}>
                  {t("Confirm Payment")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
