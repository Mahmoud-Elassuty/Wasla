import { request } from "./http";
import { formatPrice } from "../utils/format";

const JSON_HEADERS = { "Content-Type": "application/json" };
const send = (method, body) => ({ method, headers: JSON_HEADERS, body: JSON.stringify(body) });

const round2 = (n) => Math.round(n * 100) / 100;
const today = () => new Date().toISOString().slice(0, 10);

// Codes are always stored uppercase, so lookups are case-insensitive from the user's side.
export async function fetchCouponByCode(code) {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) throw new Error("Enter a coupon code.");
  const [coupon] = await request(`/coupons?code=${encodeURIComponent(trimmed)}`);
  if (!coupon) throw new Error("Invalid coupon code.");
  return coupon;
}

// json-server has no real /coupons/apply route with business logic behind it, so the checks
// (active, date range, minimum spend, usage limit) run here, client-side, against the coupon
// record fetched by code, and the resulting discount is computed the same way.
export async function applyCoupon(code, cartTotal) {
  const coupon = await fetchCouponByCode(code);

  if (!coupon.active) throw new Error("This coupon is no longer active.");
  if (coupon.validFrom && today() < coupon.validFrom) throw new Error("This coupon isn't valid yet.");
  if (coupon.validUntil && today() > coupon.validUntil) throw new Error("This coupon has expired.");
  if (coupon.usageLimit != null && (coupon.usedCount ?? 0) >= coupon.usageLimit) {
    throw new Error("This coupon has reached its usage limit.");
  }
  if (coupon.minTotal && cartTotal < coupon.minTotal) {
    throw new Error(`Spend at least ${formatPrice(coupon.minTotal)} to use this coupon.`);
  }

  let discount = coupon.type === "percentage" ? (cartTotal * coupon.discount) / 100 : coupon.discount;
  if (coupon.type === "percentage" && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(round2(discount), cartTotal);

  return { coupon, discount };
}

// PATCH: bump usedCount by 1 once an order using this coupon actually goes through.
export const redeemCoupon = (id, usedCount) =>
  request(`/coupons/${encodeURIComponent(id)}`, send("PATCH", { usedCount: (usedCount ?? 0) + 1 }));
