import { ORDER_STATUSES } from "./checkout";
import { isValidStock } from "./inventory";

// Pure helpers: every function reads its arguments and returns new values. Nothing is mutated or stored.

export const RANGES = ["7d", "30d", "all"];
export const DEFAULT_RANGE = "30d";

// One Admin-wide "low stock" rule, shared by the dashboard Low stock panel and the analytics KPI:
// a product is low when it has this many units or fewer. (The storefront's own badge threshold in
// utils/inventory.js is separate and unchanged.)
export const ADMIN_LOW_STOCK_THRESHOLD = 10;
export const isLowStock = (product) => isValidStock(product?.stock) && product.stock <= ADMIN_LOW_STOCK_THRESHOLD;

const TOP_LIMIT = 5;
const round2 = (n) => Math.round(n * 100) / 100;
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export const isCancelled = (order) => order?.status === "cancelled";

const orderTime = (order) => {
  const t = Date.parse(order?.createdAt);
  return Number.isNaN(t) ? null : t;
};

const startOfDay = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d;
};

const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

const rangeDays = (range) => (range === "7d" ? 7 : 30);

// Orders inside the selected window (calendar days, local time, today included).
// "all" keeps every order. Orders without a valid createdAt can't be placed in a window, so they only count in "all".
export function filterOrdersByRange(orders, range, now = Date.now()) {
  if (range === "all") return orders;
  const start = startOfDay(now);
  start.setDate(start.getDate() - (rangeDays(range) - 1));
  const end = startOfDay(now);
  end.setDate(end.getDate() + 1);
  return orders.filter((o) => {
    const t = orderTime(o);
    return t !== null && t >= start.getTime() && t < end.getTime();
  });
}

// Gross sales (`revenue`) = sum of order.total for orders whose status is not "cancelled".
export function summarizeOrders(orders) {
  const valid = orders.filter((o) => !isCancelled(o));
  const revenue = round2(valid.reduce((sum, o) => sum + num(o.total), 0));
  // Delivered revenue = totals of delivered orders only (paymentStatus is deliberately not used).
  const deliveredRevenue = round2(
    orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + num(o.total), 0),
  );
  return {
    totalOrders: orders.length,
    validOrders: valid.length,
    cancelledOrders: orders.length - valid.length,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    revenue,
    deliveredRevenue,
    averageOrderValue: valid.length > 0 ? round2(revenue / valid.length) : 0,
  };
}

// One point per real calendar day (7d / 30d) or per month (all time). A period with no orders is a real zero.
export function buildSalesSeries(orders, range, now = Date.now()) {
  const buckets = new Map();
  const add = (key, date, unit) => buckets.set(key, { key, date, unit, revenue: 0, orders: 0 });

  if (range === "all") {
    const times = orders.map(orderTime).filter((t) => t !== null);
    if (times.length === 0) return [];
    const first = new Date(Math.min(...times));
    const last = new Date(Math.max(...times));
    const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
    const stop = new Date(last.getFullYear(), last.getMonth(), 1);
    while (cursor <= stop) {
      add(monthKey(cursor), new Date(cursor), "month");
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    const cursor = startOfDay(now);
    cursor.setDate(cursor.getDate() - (rangeDays(range) - 1));
    for (let i = 0; i < rangeDays(range); i += 1) {
      add(dayKey(cursor), new Date(cursor), "day");
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const keyOf = range === "all" ? monthKey : dayKey;
  orders.forEach((o) => {
    const t = orderTime(o);
    if (t === null) return;
    const bucket = buckets.get(keyOf(new Date(t)));
    if (!bucket) return;
    bucket.orders += 1;
    if (!isCancelled(o)) bucket.revenue = round2(bucket.revenue + num(o.total));
  });
  return [...buckets.values()];
}

// Real statuses only, known workflow order first, then any other value found in the data.
export function buildStatusBreakdown(orders) {
  const counts = new Map();
  orders.forEach((o) => {
    const status = o.status || "unknown";
    counts.set(status, (counts.get(status) ?? 0) + 1);
  });
  const known = ORDER_STATUSES.filter((s) => counts.has(s));
  const other = [...counts.keys()].filter((s) => !ORDER_STATUSES.includes(s));
  return [...known, ...other].map((status) => ({
    status,
    count: counts.get(status),
    percent: orders.length > 0 ? (counts.get(status) / orders.length) * 100 : 0,
  }));
}

// Line items of non-cancelled orders. Revenue here is item price x quantity (before shipping and coupons).
function* soldItems(orders) {
  for (const order of orders) {
    if (isCancelled(order) || !Array.isArray(order.items)) continue;
    for (const item of order.items) {
      const quantity = num(item?.quantity);
      if (item?.productId == null || quantity <= 0) continue;
      yield { item, quantity, revenue: num(item.price) * quantity };
    }
  }
}

export function buildTopProducts(orders, products) {
  const byId = new Map(products.map((p) => [String(p.id), p]));
  const totals = new Map();
  for (const { item, quantity, revenue } of soldItems(orders)) {
    const id = String(item.productId);
    const entry = totals.get(id) ?? { id, units: 0, revenue: 0, title: "", thumbnail: "" };
    entry.units += quantity;
    entry.revenue += revenue;
    entry.title ||= item.title || "";
    entry.thumbnail ||= item.thumbnail || "";
    totals.set(id, entry);
  }
  return [...totals.values()]
    .map((e) => {
      const product = byId.get(e.id);
      return {
        ...e,
        revenue: round2(e.revenue),
        title: e.title || product?.title || `#${e.id}`,
        thumbnail: product?.thumbnail || e.thumbnail,
      };
    })
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, TOP_LIMIT);
}

// Only items whose product still exists with a category are mapped; the rest are skipped, never guessed.
export function buildCategorySales(orders, products) {
  const categoryOf = new Map(products.filter((p) => p.category).map((p) => [String(p.id), p.category]));
  const totals = new Map();
  for (const { item, quantity, revenue } of soldItems(orders)) {
    const category = categoryOf.get(String(item.productId));
    if (!category) continue;
    const entry = totals.get(category) ?? { category, units: 0, revenue: 0 };
    entry.units += quantity;
    entry.revenue += revenue;
    totals.set(category, entry);
  }
  return [...totals.values()]
    .map((e) => ({ ...e, revenue: round2(e.revenue) }))
    .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
    .slice(0, TOP_LIMIT);
}

export const countLowStock = (products) => products.filter(isLowStock).length;

// Customers are accounts with the customer role that haven't been deleted. Users have no signup date, so this isn't range-filtered.
export const countCustomers = (users) =>
  users.filter((u) => u.role === "customer" && u.status !== "deleted").length;
