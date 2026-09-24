import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dismissToast } from "../../store/reducers/notificationsSlice";
import "../../styles/notifications.css";

const AUTO_DISMISS_MS = 5000;
const LEAVE_ANIMATION_MS = 250;

const TYPE_META = {
  success: { icon: "bi-check-circle-fill", className: "toast-success" },
  error: { icon: "bi-x-circle-fill", className: "toast-error" },
  warning: { icon: "bi-exclamation-triangle-fill", className: "toast-warning" },
  info: { icon: "bi-info-circle-fill", className: "toast-info" },
};

function ToastItem({ toast }) {
  const dispatch = useDispatch();
  const [leaving, setLeaving] = useState(false);
  const { icon, className } = TYPE_META[toast.type] ?? TYPE_META.info;

  const close = () => setLeaving(true); // triggers the fade-out class; actual removal below

  useEffect(() => {
    const timer = setTimeout(close, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast.id never changes for this item
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), LEAVE_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [leaving, dispatch, toast.id]);

  return (
    <div
      className={`toast-item ${className}${leaving ? " toast-leaving" : ""}`}
      role={toast.type === "error" ? "alert" : "status"}
    >
      <i className={`bi ${icon} toast-icon`} aria-hidden="true" />
      <div className="toast-body">
        {toast.title && <p className="toast-title mb-0">{toast.title}</p>}
        <p className="toast-message mb-0">{toast.message}</p>
      </div>
      <button type="button" className="toast-close" onClick={close} aria-label="Dismiss notification">
        <i className="bi bi-x" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useSelector((s) => s.notifications.toasts);
  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
