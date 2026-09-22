import { request } from "./http";

export const createOrder = (orderData) =>
  request("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });

// Newest first
export const fetchOrders = (userId, signal) =>
  request(`/orders?userId=${encodeURIComponent(userId)}&_sort=createdAt&_order=desc`, { signal });

export async function fetchOrderById(id, signal) {
  try {
    return await request(`/orders/${encodeURIComponent(id)}`, { signal });
  } catch (err) {
    if (err.status === 404) throw new Error("Order not found.");
    throw err;
  }
}
