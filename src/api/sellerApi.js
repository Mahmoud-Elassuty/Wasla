import { request } from "./http";
import { ORDER_STATUSES } from "../utils/checkout";

const JSON_HEADERS = { "Content-Type": "application/json" };
const send = (method, body) => ({ method, headers: JSON_HEADERS, body: JSON.stringify(body) });

export const fetchSellerProducts = (sellerId, signal) =>
  request(`/products?sellerId=${encodeURIComponent(sellerId)}`, { signal });

export const createProduct = (productData) => request("/products", send("POST", productData));

// PUT replaces the whole product, so pass the complete object (existing fields + your changes).
export const updateProduct = (id, productData) =>
  request(`/products/${encodeURIComponent(id)}`, send("PUT", productData));

// Already deleted (404) counts as success.
export async function deleteProduct(id) {
  try {
    await request(`/products/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (err) {
    if (err.status !== 404) throw err;
  }
}

// Orders have no sellerId of their own — one order's `items` can span several vendors' products —
// so there's no `/orders?sellerId=` to query. Instead every order is fetched once and narrowed
// down here to just the items this seller owns, with a `sellerSubtotal` computed from those items
// alone (used for the seller's own totals, not the full order total which may include other
// vendors' items).
export async function fetchSellerOrders(sellerProductIds, signal) {
  const orders = await request("/orders?_sort=createdAt&_order=desc", { signal });
  const ids = new Set(sellerProductIds);
  return orders
    .map((order) => {
      const sellerItems = order.items.filter((item) => ids.has(item.productId));
      if (sellerItems.length === 0) return null;
      const sellerSubtotal = Math.round(sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;
      return { ...order, sellerItems, sellerSubtotal };
    })
    .filter(Boolean);
}

// PATCH: only `status` changes, the rest of the order (and any other vendor's items in it) stays
// as-is. Same simplification as admin: this schema has one status per order, not per line item.
export function updateOrderStatus(id, status) {
  if (!ORDER_STATUSES.includes(status)) return Promise.reject(new Error(`Invalid order status: ${status}`));
  return request(`/orders/${encodeURIComponent(id)}`, send("PATCH", { status }));
}

// PATCH, not PUT: the client only ever holds the password-stripped user record (see authApi's
// withoutPassword), so a full PUT would silently wipe fields we don't have — password, status,
// createdAt. Same reasoning as profileApi.updateProfile.
export const updateSellerProfile = (id, data) => request(`/users/${encodeURIComponent(id)}`, send("PATCH", data));
