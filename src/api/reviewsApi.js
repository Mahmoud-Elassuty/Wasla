import { request } from "./http";

const JSON_HEADERS = { "Content-Type": "application/json" };
const send = (method, body) => ({ method, headers: JSON_HEADERS, body: JSON.stringify(body) });

// Newest first, scoped to one product.
export const fetchReviews = (productId, signal) =>
  request(`/reviews?productId=${encodeURIComponent(productId)}&_sort=createdAt&_order=desc`, { signal });

export const addReview = (reviewData) => request("/reviews", send("POST", reviewData));

// Already deleted (404) counts as success.
export async function deleteReview(id) {
  try {
    await request(`/reviews/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (err) {
    if (err.status !== 404) throw err;
  }
}

// PUT replaces the whole review, so pass the complete object (existing fields + your changes).
export const updateReview = (id, reviewData) =>
  request(`/reviews/${encodeURIComponent(id)}`, send("PUT", reviewData));
