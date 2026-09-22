const STATUSES = {
  pending: { label: "Pending", ar: "قيد المعالجة", icon: "bi-hourglass-split" },
  confirmed: { label: "Confirmed", ar: "مؤكد", icon: "bi-check-circle" },
  shipped: { label: "Shipped", ar: "تم الشحن", icon: "bi-truck" },
  delivered: { label: "Delivered", ar: "تم التسليم", icon: "bi-bag-check" },
  cancelled: { label: "Cancelled", ar: "ملغي", icon: "bi-x-circle" },
};

export default function OrderStatus({ status }) {
  const known = STATUSES[status];
  const { label, ar, icon } = known ?? { label: status || "Unknown", ar: null, icon: "bi-question-circle" };

  return (
    <span className={`status-badge status-${known ? status : "unknown"}`}>
      <i className={`bi ${icon}`} aria-hidden="true" />
      {label}
      {ar && (
        <>
          <span aria-hidden="true">·</span>
          <span lang="ar" dir="rtl">{ar}</span>
        </>
      )}
    </span>
  );
}
