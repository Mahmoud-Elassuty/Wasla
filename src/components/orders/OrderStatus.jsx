import { useT } from "../../i18n/useT";

const ICONS = {
  pending: "bi-hourglass-split",
  confirmed: "bi-check-circle",
  shipped: "bi-truck",
  delivered: "bi-bag-check",
  cancelled: "bi-x-circle",
};

// The stored status value is untouched; only the displayed label is translated.
export default function OrderStatus({ status }) {
  const { te, t } = useT();
  const known = ICONS[status];

  return (
    <span className={`status-badge status-${known ? status : "unknown"}`}>
      <i className={`bi ${known ?? "bi-question-circle"}`} aria-hidden="true" />
      {known ? te("order", status) : status || t("Unknown")}
    </span>
  );
}
