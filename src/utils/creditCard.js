// A real Luhn checksum applied to a mock card number — the number itself isn't real, but the
// algorithm that validates its shape is, per the spec's "mock Luhn algorithm validation".
export function luhnValid(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function detectCardBrand(digits) {
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2(2[2-9]|[3-6]\d|7[01]|720)/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6(?:011|5)/.test(digits)) return "Discover";
  return null;
}

export const formatCardNumber = (raw) =>
  raw.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();

export const formatExpiry = (raw) => {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export function isExpiryValid(mmYY) {
  const m = /^(\d{2})\/(\d{2})$/.exec(mmYY);
  if (!m) return false;
  const month = Number(m[1]);
  if (month < 1 || month > 12) return false;
  const year = 2000 + Number(m[2]);
  const now = new Date();
  if (year < now.getFullYear()) return false;
  if (year === now.getFullYear() && month < now.getMonth() + 1) return false;
  return true;
}
