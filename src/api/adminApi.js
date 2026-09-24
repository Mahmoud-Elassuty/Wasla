import { request } from "./http";
import { ORDER_STATUSES } from "../utils/checkout";

const JSON_HEADERS = { "Content-Type": "application/json" };
const send = (method, body) => ({ method, headers: JSON_HEADERS, body: JSON.stringify(body) });

// Every customer's orders, newest first.
export const fetchAllOrders = (signal) => request("/orders?_sort=createdAt&_order=desc", { signal });
export const fetchAllProducts = (signal) => request("/products", { signal });

// PATCH: only `status` changes, the rest of the order stays as it is.
export function updateOrderStatus(id, status) {
  if (!ORDER_STATUSES.includes(status)) return Promise.reject(new Error(`Invalid order status: ${status}`));
  return request(`/orders/${encodeURIComponent(id)}`, send("PATCH", { status }));
}

// Already deleted (404) counts as success.
export async function deleteProduct(id) {
  try {
    await request(`/products/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (err) {
    if (err.status !== 404) throw err;
  }
}

export const createProduct = (productData) => request("/products", send("POST", productData));

// PUT replaces the whole product, so pass the complete object (existing fields + your changes).
export const updateProduct = (id, productData) =>
  request(`/products/${encodeURIComponent(id)}`, send("PUT", productData));

// Newest first, across every product.
export const fetchAllReviews = (signal) => request("/reviews?_sort=createdAt&_order=desc", { signal });

// Already deleted (404) counts as success.
export async function deleteReview(id) {
  try {
    await request(`/reviews/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (err) {
    if (err.status !== 404) throw err;
  }
}

// PATCH: this schema's "status" is the review's verified flag — only that changes.
export const updateReviewStatus = (id, verified) =>
  request(`/reviews/${encodeURIComponent(id)}`, send("PATCH", { verified }));

export const fetchCoupons = (signal) => request("/coupons", { signal });

export const createCoupon = (couponData) => request("/coupons", send("POST", couponData));

// PUT replaces the whole coupon, so pass the complete object (existing fields + your changes).
export const updateCoupon = (id, couponData) =>
  request(`/coupons/${encodeURIComponent(id)}`, send("PUT", couponData));

// Already deleted (404) counts as success.
export async function deleteCoupon(id) {
  try {
    await request(`/coupons/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (err) {
    if (err.status !== 404) throw err;
  }
}
