import { request } from "./http";

const JSON_HEADERS = { "Content-Type": "application/json" };

export const fetchWishlist = (userId, signal) =>
  request(`/wishlist?userId=${encodeURIComponent(userId)}`, { signal });

// Safe to call twice: if the product is already saved, the existing entry is returned.
export async function addToWishlist(productId, userId) {
  const query = `userId=${encodeURIComponent(userId)}&productId=${encodeURIComponent(productId)}`;
  const existing = await request(`/wishlist?${query}`);
  if (existing.length > 0) return existing[0];
  return request("/wishlist", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ productId, userId }),
  });
}

// `id` is the wishlist entry's id (not the product's). Already gone (404) counts as success.
export async function removeFromWishlist(id) {
  try {
    await request(`/wishlist/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (err) {
    if (err.status !== 404) throw err;
  }
}
