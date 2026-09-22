export const SHIPPING_FEE_EGP = 50;
// Product prices are in USD. Change this rate to match the exchange rate you want to use.
export const EGP_PER_USD = 50;
export const SHIPPING_FEE = SHIPPING_FEE_EGP / EGP_PER_USD;

export const GOVERNORATES = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Qalyubia",
  "Port Said",
  "Suez",
  "Dakahlia",
  "Sharqia",
  "Gharbia",
  "Monufia",
  "Beheira",
  "Kafr El Sheikh",
  "Damietta",
  "Ismailia",
  "Fayoum",
  "Beni Suef",
  "Minya",
  "Assiut",
  "Sohag",
  "Qena",
  "Luxor",
  "Aswan",
  "Red Sea",
  "New Valley",
  "Matrouh",
  "North Sinai",
  "South Sinai",
];

const round2 = (n) => Math.round(n * 100) / 100;

export const getOrderTotals = ({ items, subtotal, discount, total }) => {
  const shipping = items.length > 0 ? SHIPPING_FEE : 0;
  return { subtotal, discount, shipping, total: round2(total + shipping) };
};

// Shown everywhere with a leading "#": `#${orderNumber(12)}` -> #WSL-00012
export const orderNumber = (id) => `WSL-${String(id).padStart(5, "0")}`;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export const PAYMENT_METHOD_LABELS = {
  cod: { label: "Cash on delivery", ar: "الدفع عند الاستلام" },
  card: { label: "Credit card", ar: "بطاقة ائتمان" },
  wallet: { label: "Wallet", ar: "محفظة إلكترونية" },
};

export const orderItemCount = (order) =>
  (order.items ?? []).reduce((n, i) => n + i.quantity, 0);

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatOrderDate = (iso, withTime = false) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return (withTime ? dateTimeFormat : dateFormat).format(date);
};
