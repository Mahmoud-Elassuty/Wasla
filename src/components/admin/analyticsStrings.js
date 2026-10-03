import { useEffect, useState } from "react";

// The project has no i18n library or language switch yet, so these strings live next to the analytics UI.
// The language follows <html lang> / <html dir>, which is what a future switch would set.
export const STRINGS = {
  en: {
    title: "Analytics overview",
    subtitle: "Calculated from your existing orders, products and customers.",
    rangeLabel: "Date range",
    range7d: "Last 7 days",
    range30d: "Last 30 days",
    rangeAll: "All time",
    revenue: "Total revenue",
    revenueNote: "Excludes cancelled orders",
    orders: "Total orders",
    ordersNote: (n) => (n > 0 ? `${n} cancelled` : "No cancelled orders"),
    aov: "Average order value",
    aovNote: "Revenue / non-cancelled orders",
    customers: "Total customers",
    customersNote: "All time, not date-filtered",
    pending: "Pending orders",
    pendingNote: "In selected period",
    lowStock: "Low stock products",
    lowStockNote: (n) => `${n} units or fewer`,
    salesOverview: "Sales overview",
    metricRevenue: "Revenue",
    metricOrders: "Orders",
    metricToggle: "Chart metric",
    chartEmpty: "No orders in this period yet.",
    chartEmptyRevenue: "No revenue in this period yet.",
    chartHint: "Tap or hover a bar for details",
    ordersCount: (n) => `${n} ${n === 1 ? "order" : "orders"}`,
    statusTitle: "Order status",
    statusEmpty: "No orders in this period.",
    topProducts: "Top selling products",
    topProductsEmpty: "No product sales in this period.",
    unitsSold: (n) => `${n} sold`,
    categories: "Sales by category",
    categoriesEmpty: "No category sales in this period.",
    units: (n) => `${n} ${n === 1 ? "unit" : "units"}`,
    loading: "Loading...",
  },
  ar: {
    title: "نظرة عامة على التحليلات",
    subtitle: "محسوبة من الطلبات والمنتجات والعملاء الموجودين فعلاً.",
    rangeLabel: "الفترة الزمنية",
    range7d: "آخر 7 أيام",
    range30d: "آخر 30 يومًا",
    rangeAll: "كل الأوقات",
    revenue: "إجمالي الإيرادات",
    revenueNote: "لا تشمل الطلبات الملغاة",
    orders: "إجمالي الطلبات",
    ordersNote: (n) => (n > 0 ? `${n} ملغاة` : "لا توجد طلبات ملغاة"),
    aov: "متوسط قيمة الطلب",
    aovNote: "الإيرادات ÷ الطلبات غير الملغاة",
    customers: "إجمالي العملاء",
    customersNote: "كل الأوقات، دون تصفية بالتاريخ",
    pending: "الطلبات قيد المعالجة",
    pendingNote: "خلال الفترة المحددة",
    lowStock: "منتجات قاربت على النفاد",
    lowStockNote: (n) => `${n} وحدات أو أقل`,
    salesOverview: "نظرة عامة على المبيعات",
    metricRevenue: "الإيرادات",
    metricOrders: "الطلبات",
    metricToggle: "مؤشر الرسم البياني",
    chartEmpty: "لا توجد طلبات في هذه الفترة بعد.",
    chartEmptyRevenue: "لا توجد إيرادات في هذه الفترة بعد.",
    chartHint: "اضغط أو مرّر على عمود لعرض التفاصيل",
    ordersCount: (n) => `${n} ${n === 1 ? "طلب" : "طلبات"}`,
    statusTitle: "حالة الطلبات",
    statusEmpty: "لا توجد طلبات في هذه الفترة.",
    topProducts: "المنتجات الأكثر مبيعًا",
    topProductsEmpty: "لا توجد مبيعات منتجات في هذه الفترة.",
    unitsSold: (n) => `تم بيع ${n}`,
    categories: "المبيعات حسب الفئة",
    categoriesEmpty: "لا توجد مبيعات للفئات في هذه الفترة.",
    units: (n) => `${n} ${n === 1 ? "وحدة" : "وحدات"}`,
    loading: "جارٍ التحميل...",
  },
};

const readLang = () => {
  const root = document.documentElement;
  return root.lang?.toLowerCase().startsWith("ar") || root.dir === "rtl" ? "ar" : "en";
};

export function useAnalyticsLang() {
  const [lang, setLang] = useState(readLang);
  useEffect(() => {
    const observer = new MutationObserver(() => setLang(readLang()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
    return () => observer.disconnect();
  }, []);
  return lang;
}
