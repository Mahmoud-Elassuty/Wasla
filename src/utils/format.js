const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export const formatPrice = (amount) => usd.format(amount);

// DummyJSON `price` is the pre-discount price; this is what the customer pays.
export const getSalePrice = ({ price, discountPercentage = 0 }) =>
  Math.round(price * (1 - discountPercentage / 100) * 100) / 100;

export const titleCase = (slug = "") =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
