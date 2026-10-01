import { request } from "./http";

const JSON_HEADERS = { "Content-Type": "application/json" };
const send = (method, body) => ({ method, headers: JSON_HEADERS, body: JSON.stringify(body) });

export const fetchBanners = (signal) =>
  request("/banners?_sort=sortOrder&_order=asc", { signal });

export async function fetchBannerById(id, signal) {
  try {
    return await request(`/banners/${encodeURIComponent(id)}`, { signal });
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export const createBanner = (data) => request("/banners", send("POST", data));
export const updateBanner = (id, data) =>
  request(`/banners/${encodeURIComponent(id)}`, send("PATCH", data));
export const updateBannerStatus = (id, status) =>
  request(`/banners/${encodeURIComponent(id)}`, send("PATCH", { status }));

export async function deleteBanner(id) {
  try {
    await request(`/banners/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (err) {
    if (err.status !== 404) throw err;
  }
}