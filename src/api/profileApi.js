import { request } from "./http";

const JSON_HEADERS = { "Content-Type": "application/json" };
const send = (method, body) => ({ method, headers: JSON_HEADERS, body: JSON.stringify(body) });

// PATCH, not PUT: the client only ever holds the password-stripped user record (see authApi's
// withoutPassword), so a full PUT would silently wipe fields we don't have — password, role,
// status, createdAt. PATCH touches only the fields being changed, same as adminApi.updateOrderStatus.
export const updateProfile = (id, data) => request(`/users/${encodeURIComponent(id)}`, send("PATCH", data));

export const fetchAddresses = (userId, signal) =>
  request(`/addresses?userId=${encodeURIComponent(userId)}`, { signal });

export const addAddress = (addressData) => request("/addresses", send("POST", addressData));

// PUT replaces the whole address, so pass the complete object (existing fields + your changes).
export const updateAddress = (id, addressData) =>
  request(`/addresses/${encodeURIComponent(id)}`, send("PUT", addressData));

// Already deleted (404) counts as success.
export async function deleteAddress(id) {
  try {
    await request(`/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (err) {
    if (err.status !== 404) throw err;
  }
}

// json-server has no real POST /users/:id/change-password route with auth logic behind it
// (the same situation as couponsApi.applyCoupon), so the current-password check happens here:
// look the user up by id + currentPassword, exactly like login, then PATCH just the password.
export async function changePassword({ userId, currentPassword, newPassword }) {
  const query = new URLSearchParams({ id: userId, password: currentPassword });
  const [match] = await request(`/users?${query}`);
  if (!match) throw new Error("Current password is incorrect.");
  await request(`/users/${encodeURIComponent(userId)}`, send("PATCH", { password: newPassword }));
}
