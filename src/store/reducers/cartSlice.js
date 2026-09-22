import { createSlice } from "@reduxjs/toolkit";
import { getCart, setCart } from "../../utils/localStorage";

const MAX_QTY = 99;
const round2 = (n) => Math.round(n * 100) / 100;

// subtotal = full prices, total = what the customer pays, discount = the difference
const totalsOf = (items) => {
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = round2(items.reduce((s, i) => s + (i.listPrice ?? i.price) * i.quantity, 0));
  const total = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
  return { itemCount, subtotal, discount: Math.max(0, round2(subtotal - total)), total };
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

export const cartSlice = createSlice({
  name: "cart",
  initialState: { items: initialItems, ...totalsOf(initialItems) },
  reducers: {
    addToCart(state, { payload }) {
      const { id, title, price, listPrice = price, thumbnail, stock, quantity = 1 } = payload;
      const limit = stock ?? MAX_QTY;
      const existing = state.items.find((i) => i.id === id);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, existing.stock ?? MAX_QTY);
      } else {
        state.items.push({
          id, title, price, listPrice, thumbnail, stock,
          quantity: Math.max(1, Math.min(quantity, limit)),
        });
      }
      Object.assign(state, totalsOf(state.items));
    },
    removeFromCart(state, { payload: id }) {
      state.items = state.items.filter((i) => i.id !== id);
      Object.assign(state, totalsOf(state.items));
    },
    updateQuantity(state, { payload: { id, quantity } }) {
      const item = state.items.find((i) => i.id === id);
      if (item && Number.isFinite(quantity)) {
        item.quantity = Math.min(Math.max(1, Math.floor(quantity)), item.stock ?? MAX_QTY);
        Object.assign(state, totalsOf(state.items));
      }
    },
    clearCart(state) {
      state.items = [];
      Object.assign(state, totalsOf(state.items));
    },
  },
});

// Only the items are stored; totals are recalculated on load.
export const saveToLocalStorage = (cartState) => setCart(cartState.items);

export const selectCartCount = (state) => state.cart.itemCount;
export const selectItemQuantity = (id) => (state) =>
  state.cart.items.find((i) => i.id === id)?.quantity ?? 0;

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
