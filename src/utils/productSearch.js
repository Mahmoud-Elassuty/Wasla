export const normalizeProductQuery = (query) =>
  String(query ?? "")
    .trim()
    .toLowerCase();

export function matchesProductQuery(product, query) {
  const normalizedQuery = normalizeProductQuery(query);
  if (!normalizedQuery) return true;

  const fields = [product.title, product.category, product.brand];
  if (Array.isArray(product.tags)) fields.push(...product.tags);

  return fields.some(
    (field) =>
      typeof field === "string" &&
      field.toLowerCase().includes(normalizedQuery),
  );
}

export function searchProducts(products, query) {
  const normalizedQuery = normalizeProductQuery(query);
  if (!normalizedQuery) return [];
  return products.filter((product) =>
    matchesProductQuery(product, normalizedQuery),
  );
}
