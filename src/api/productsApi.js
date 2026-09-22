import { request } from "./http";
import { titleCase } from "../utils/format";

export const fetchProducts = (signal) => request("/products", { signal });

export async function fetchProductById(id, signal) {
  try {
    return await request(`/products/${encodeURIComponent(id)}`, { signal });
  } catch (err) {
    if (err.status === 404) throw new Error("This product doesn't exist or was removed.");
    throw err;
  }
}

// Accepts DummyJSON objects ({ slug, name }) or plain slug strings.
export async function fetchCategories(signal) {
  const raw = await request("/categories", { signal });
  return raw.map((c) =>
    typeof c === "string"
      ? { slug: c, name: titleCase(c) }
      : { slug: c.slug, name: c.name ?? titleCase(c.slug) }
  );
}
