import { titleCase } from "./format";
import { tOr } from "../i18n";

// "mens-shirts" -> "Men's Shirts", "home-decoration" -> "Home Decoration".
// Derived from the slug, so any category that appears in the data gets a friendly name automatically.
// The Arabic label (if the slug has one) is looked up at call time; the slug itself is never changed.
export const getCategoryDisplayName = (slug = "") =>
  tOr(`catname.${slug}`, titleCase(slug).replace(/\bMens\b/, "Men's").replace(/\bWomens\b/, "Women's"));

// Thumbnail first, then the first gallery image. Empty string when the product has neither.
export const pickProductImage = (product) => product?.thumbnail || product?.images?.[0] || "";

// One card per category, merged from two real sources:
//   1. the categories collection (API / Redux), so an empty category is still listed;
//   2. the category of every loaded product, because the collection can lag behind the catalog.
// Count and image come from the real products of that category. Nothing is hardcoded.
export function buildCategoryCards(categories = [], items = []) {
  const slugs = new Set();
  categories.forEach((category) => category?.slug && slugs.add(category.slug));
  items.forEach((product) => product?.category && slugs.add(product.category));

  const stats = new Map();
  items.forEach((product) => {
    if (!product?.category) return;
    const entry = stats.get(product.category) ?? { count: 0, thumbnail: "", gallery: "" };
    entry.count += 1;
    if (!entry.thumbnail && product.thumbnail) entry.thumbnail = product.thumbnail;
    if (!entry.gallery && product.images?.[0]) entry.gallery = product.images[0];
    stats.set(product.category, entry);
  });

  return [...slugs]
    .sort((a, b) => a.localeCompare(b))
    .map((slug) => {
      const entry = stats.get(slug);
      return {
        slug,
        displayName: getCategoryDisplayName(slug),
        count: entry?.count ?? 0,
        image: entry?.thumbnail || entry?.gallery || "",
      };
    });
}
