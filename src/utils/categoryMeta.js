import { titleCase } from "./format";

// Real DummyJSON slugs -> the look from the UI/UX mockup (icon, label, description, accent color).
// Shared by Home (category tiles) and the Category page (header + breadcrumb), so both stay in sync.
// Falls back to a generic tag icon/description for any category db.json doesn't have yet.
export const CATEGORY_META = {
  beauty: {
    icon: "bi-magic",
    label: "Beauty & Scents",
    subtitle: "Skincare & cosmetics",
    description: "Skincare, cosmetics and beauty essentials from authorized brands.",
    accent: "cat-pink",
  },
  fragrances: {
    icon: "bi-flower2",
    label: "Fragrances",
    subtitle: "Perfumes & eau de parfum",
    description: "Perfumes and eau de parfum, sourced from verified fragrance houses.",
    accent: "cat-purple",
  },
  furniture: {
    icon: "bi-house-door",
    label: "Home & Furniture",
    subtitle: "Decor & furnishings",
    description: "Furniture and decor to furnish and upgrade your home.",
    accent: "cat-blue",
  },
  groceries: {
    icon: "bi-basket2",
    label: "Fresh Groceries",
    subtitle: "Pantry & daily needs",
    description: "Pantry staples and daily essentials, restocked regularly.",
    accent: "cat-green",
  },
};

export const getCategoryMeta = (slug) =>
  CATEGORY_META[slug] || {
    icon: "bi-tag",
    label: titleCase(slug),
    subtitle: "",
    description: `Browse everything in ${titleCase(slug)}.`,
    accent: "cat-blue",
  };
