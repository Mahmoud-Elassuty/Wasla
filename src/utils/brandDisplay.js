// Pure helper: derive the brands to show in the Home brand marquee from real product data.
// Reads only `product.brand`; nothing is hardcoded, stored, or written back.

const INVALID_TEXT = new Set(["null", "undefined", "n/a", "na", "none", "-"]);

export function buildBrandList(products, max = 12) {
  if (!Array.isArray(products)) return [];

  const counts = new Map(); // lowercase key -> { name, count }
  for (const product of products) {
    const raw = product?.brand;
    if (typeof raw !== "string") continue;
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name || INVALID_TEXT.has(name.toLowerCase())) continue;
    const key = name.toLowerCase();
    const entry = counts.get(key);
    if (entry) entry.count += 1;
    else counts.set(key, { name, count: 1 });
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || (a.name < b.name ? -1 : 1))
    .slice(0, max)
    .map((entry) => entry.name);
}

// Local logo files that actually exist in public/brand/ (served at /brand/<file>).
// Brands without an entry here simply render as text-only pills.
const BRAND_LOGOS = {
  adidas: "/brand/adidas.svg",
  apple: "/brand/apple.svg",
  asus: "/brand/asus.svg",
  nike: "/brand/nike.svg",
  oppo: "/brand/oppo.svg",
  samsung: "/brand/samsung.svg",
  vivo: "/brand/vivo.svg",
};

const logoKey = (name) => String(name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Returns the local logo path for a brand name, or null when there is no logo file.
export function getBrandLogo(name) {
  return BRAND_LOGOS[logoKey(name)] ?? null;
}
