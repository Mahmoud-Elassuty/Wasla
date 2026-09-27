import { useState } from "react";
import { formatPrice } from "../../utils/format";

export default function WalletButton({ amount, processing, error, onConfirm }) {
  const [open, setOpen] = useState(false);

  const close = () => {
    if (processing) return;
    setOpen(false);
  };

  return (
    <>
      <button type="button" className="btn btn-dark btn-lg w-100 fw-semibold" onClick={() => setOpen(true)}>
        <i className="bi bi-apple me-1" aria-hidden="true" />
        <i className="bi bi-google me-2" aria-hidden="true" />
        Pay with Apple Pay / Google Pay
      </button>

      {open && (
        <div className="modal-backdrop-custom" onMouseDown={close}>
          <div
            className="modal-dialog-custom bg-white rounded-4 shadow-lg p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={`payment-gateway-icon wallet${processing ? " scanning" : ""}`}>
              <i className="bi bi-fingerprint" aria-hidden="true" />
            </div>
            <h2 id="wallet-modal-title" className="h5 mb-1">
              {processing ? "Verifying..." : "Confirm with Face ID / Touch ID"}
            </h2>
            <p className="text-secondary small mb-4">
              Authorize a payment of <strong>{formatPrice(amount)}</strong> from your digital wallet.
              This is a mock — no biometric check actually happens.
            </p>

            {error && (
              <div className="alert alert-danger py-2 text-start" role="alert">
                {error}
              </div>
            )}

            {processing ? (
              <div className="py-2">
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Verifying...
              </div>
            ) : (
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary flex-fill" onClick={close}>
                  Cancel
                </button>
                <button type="button" className="btn btn-accent flex-fill" onClick={onConfirm}>
                  Confirm Payment
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
