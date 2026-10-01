import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getCart, setCart } from "../../utils/localStorage";
import * as productsApi from "../../api/productsApi";
import { isValidStock } from "../../utils/inventory";

const round2 = (n) => Math.round(n * 100) / 100;

// subtotal = full prices, total = what the customer pays, discount = the difference
const totalsOf = (items) => {
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = round2(
    items.reduce((s, i) => s + (i.listPrice ?? i.price) * i.quantity, 0),
  );
  const total = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
  return {
    itemCount,
    subtotal,
    discount: Math.max(0, round2(subtotal - total)),
    total,
  };
};

const isValidItem = (i) =>
  i != null &&
  i.id !== undefined &&
  typeof i.title === "string" &&
  Number.isFinite(i.price) &&
  Number.isInteger(i.quantity) &&
  i.quantity > 0;

// localStorage can be empty, edited by hand or corrupted: keep only well-formed items.
const loadItems = () => {
  const saved = getCart();
  return Array.isArray(saved) ? saved.filter(isValidItem) : [];
};

const initialItems = loadItems();
const resetInventoryValidation = (state) => {
  state.inventoryStatus = "idle";
  state.inventoryError = null;
  state.inventoryIssues = [];
};

export const validateCartInventory = createAsyncThunk(
  "cart/validateInventory",
  async (_, { getState, rejectWithValue, signal }) => {
    const items = getState().cart.items;
    if (items.length === 0) return { snapshots: [], issues: [] };

    try {
      const products = await productsApi.fetchProducts(signal);
      const productsById = new Map(
        products.map((product) => [String(product.id), product]),
      );
      const snapshots = [];
      const issues = [];

      for (const item of items) {
        const product = productsById.get(String(item.id));
        if (!product) {
          snapshots.push({ id: item.id, stock: undefined, active: false });
          issues.push(
            `"${item.title}" is no longer available. Remove it from your cart.`,
          );
          continue;
        }

        snapshots.push({
          id: product.id,
          stock: product.stock,
          active: product.active !== false,
        });
        if (product.active === false) {
          issues.push(
            `"${item.title}" is no longer available. Remove it from your cart.`,
          );
        } else if (!isValidStock(product.stock)) {
          issues.push(
            `Stock for "${item.title}" could not be confirmed. Contact support before ordering.`,
          );
        } else if (product.stock === 0) {
          issues.push(
            `"${item.title}" is out of stock. Remove it from your cart to continue.`,
          );
        } else if (item.quantity > product.stock) {
          issues.push(
            `Only ${product.stock} of "${item.title}" are available. Reduce the quantity to continue.`,
          );
        }
      }

      return { snapshots, issues };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: initialItems,
    ...totalsOf(initialItems),
    inventoryStatus: "idle",
    inventoryError: null,
    inventoryIssues: [],
  },
  reducers: {
    syncStockSnapshots(state, { payload }) {
      const { snapshots, issues } = payload;
      state.items = state.items.map((item) => {
        const snapshot = snapshots.find(
          (product) => String(product.id) === String(item.id),
        );
        return snapshot
          ? { ...item, stock: snapshot.stock, active: snapshot.active }
          : item;
      });
      state.inventoryStatus = issues.length ? "invalid" : "valid";
      state.inventoryIssues = issues;
      state.inventoryError = null;
    },
    addToCart(state, { payload }) {
      const {
        id,
        title,
        price,
        listPrice = price,
        thumbnail,
        stock,
        active = true,
        quantity = 1,
      } = payload;
      if (!isValidStock(stock) || stock === 0 || active === false) return;
      const limit = stock;
      const existing = state.items.find((i) => i.id === id);
      if (existing) {
        if (existing.quantity >= limit) return;
        existing.stock = stock;
        existing.active = active;
        existing.quantity = Math.min(
          existing.quantity + Math.max(1, Math.floor(quantity)),
          limit,
        );
      } else {
        state.items.push({
          id,
          title,
          price,
          listPrice,
          thumbnail,
          stock,
          active,
          quantity: Math.max(1, Math.min(Math.floor(quantity), limit)),
        });
      }
      Object.assign(state, totalsOf(state.items));
      resetInventoryValidation(state);
    },
    removeFromCart(state, { payload: id }) {
      state.items = state.items.filter((i) => i.id !== id);
      Object.assign(state, totalsOf(state.items));
      resetInventoryValidation(state);
    },
    updateQuantity(state, { payload: { id, quantity } }) {
      const item = state.items.find((i) => i.id === id);
      if (item && Number.isFinite(quantity)) {
        const nextQuantity = Math.max(1, Math.floor(quantity));
        const exceedsStock =
          !isValidStock(item.stock) ||
          item.active === false ||
          nextQuantity > item.stock;
        if (exceedsStock && nextQuantity >= item.quantity) return;
        item.quantity = nextQuantity;
        Object.assign(state, totalsOf(state.items));
        resetInventoryValidation(state);
      }
    },
    clearCart(state) {
      state.items = [];
      Object.assign(state, totalsOf(state.items));
      resetInventoryValidation(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(validateCartInventory.pending, (state) => {
        state.inventoryStatus = "loading";
        state.inventoryError = null;
        state.inventoryIssues = [];
      })
      .addCase(validateCartInventory.fulfilled, (state, { payload }) => {
        state.items = state.items.map((item) => {
          const snapshot = payload.snapshots.find(
            (product) => String(product.id) === String(item.id),
          );
          return snapshot
            ? { ...item, stock: snapshot.stock, active: snapshot.active }
            : item;
        });
        state.inventoryStatus = payload.issues.length ? "invalid" : "valid";
        state.inventoryIssues = payload.issues;
        state.inventoryError = null;
      })
      .addCase(validateCartInventory.rejected, (state, action) => {
        state.inventoryStatus = action.meta.aborted ? "idle" : "failed";
        state.inventoryError = action.meta.aborted
          ? null
          : (action.payload ?? action.error.message);
      });
  },
});

// Only the items are stored; totals are recalculated on load.
export const saveToLocalStorage = (cartState) => setCart(cartState.items);

export const selectCartCount = (state) => state.cart.itemCount;
export const selectItemQuantity = (id) => (state) =>
  state.cart.items.find((i) => i.id === id)?.quantity ?? 0;

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions;
export const { syncStockSnapshots } = cartSlice.actions;
export default cartSlice.reducer;
