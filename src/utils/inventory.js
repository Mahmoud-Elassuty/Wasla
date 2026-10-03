import { t } from "../i18n";

export const LOW_STOCK_THRESHOLD = 5;

export const isValidStock = (stock) => Number.isInteger(stock) && stock >= 0;

export const safeStock = (stock) => (isValidStock(stock) ? stock : 0);

export function getStockState(stock, active = true) {
  if (!isValidStock(stock)) {
    return {
      level: "invalid",
      label: t("Stock unavailable"),
      purchasable: false,
      quantity: 0,
    };
  }
  if (stock === 0) {
    return {
      level: "out",
      label: t("Out of stock"),
      purchasable: false,
      quantity: 0,
    };
  }
  if (active === false) {
    return {
      level: "unavailable",
      label: t("Unavailable"),
      purchasable: false,
      quantity: stock,
    };
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return {
      level: "low",
      label: t("Only {count} left", { count: stock }),
      purchasable: true,
      quantity: stock,
    };
  }
  return { level: "in", label: t("In stock"), purchasable: true, quantity: stock };
}

export function availabilityStatusFromStock(stock) {
  if (!isValidStock(stock))
    throw new Error("Stock must be a non-negative whole number.");
  if (stock === 0) return "Out of Stock";
  return stock <= LOW_STOCK_THRESHOLD ? "Low Stock" : "In Stock";
}
