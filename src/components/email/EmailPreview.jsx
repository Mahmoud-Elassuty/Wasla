import { useEffect } from "react";
import "../../styles/email.css";

const TYPE_LABEL = {
  order_confirmation: "Order confirmation",
  password_reset: "Password reset",
  welcome: "Welcome",
};

export default function EmailPreview({ email, onClose }) {
  // Close on Escape, same as any dialog should.
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!email) return null;

  return (
    <div className="modal-backdrop-custom" onMouseDown={onClose}>
      <div
        className="modal-dialog-custom bg-white rounded-4 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-preview-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-start p-3 p-md-4 border-bottom">
          <div className="min-w-0">
            <span className="badge rounded-pill bg-wasla-soft text-wasla mb-2">
              {TYPE_LABEL[email.type] ?? email.type}
            </span>
            <h2 id="email-preview-title" className="h5 mb-0 text-truncate">{email.subject}</h2>
          </div>
          <button type="button" className="btn-close flex-shrink-0" aria-label="Close" onClick={onClose} />
        </div>

        <div className="p-3 p-md-4">
          <dl className="row small mb-3">
            <dt className="col-3 col-md-2 text-secondary fw-normal">To</dt>
            <dd className="col-9 col-md-10 mb-1">{email.to}</dd>
            <dt className="col-3 col-md-2 text-secondary fw-normal">Sent</dt>
            <dd className="col-9 col-md-10 mb-1">{new Date(email.sentAt).toLocaleString()}</dd>
            <dt className="col-3 col-md-2 text-secondary fw-normal">Status</dt>
            <dd className="col-9 col-md-10 mb-0">
              <span className="badge bg-success-subtle text-success-emphasis text-capitalize">{email.status}</span>
            </dd>
          </dl>

          <div className="email-body-preview bg-light rounded-3 p-3 small" style={{ whiteSpace: "pre-wrap" }}>
            {email.body || "(No body was recorded for this email.)"}
          </div>
        </div>

        <div className="d-flex justify-content-end p-3 p-md-4 pt-0">
          <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
