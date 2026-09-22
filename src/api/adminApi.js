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
