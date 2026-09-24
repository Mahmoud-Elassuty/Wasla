import { createSlice, nanoid } from "@reduxjs/toolkit";

const MAX_ITEMS = 50; // cap the notification center so a long session doesn't grow it forever

const initialState = {
  items: [], // persistent list for the bell dropdown, newest first
  toasts: [], // currently-visible toast popups (separate lifecycle from `items`)
  unreadCount: 0,
};

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // Adds one notification that shows up both as a toast popup and in the bell's history.
    addNotification: {
      reducer(state, { payload }) {
        state.items = [payload, ...state.items].slice(0, MAX_ITEMS);
        state.toasts.push(payload);
        state.unreadCount += 1;
      },
      prepare({ type = "info", title, message }) {
        return { payload: { id: nanoid(), type, title, message, read: false, createdAt: new Date().toISOString() } };
      },
    },
    // Removes a toast popup only (auto-dismiss or manual X) — it stays in the bell's history.
    dismissToast(state, { payload: id }) {
      state.toasts = state.toasts.filter((t) => t.id !== id);
    },
    removeNotification(state, { payload: id }) {
      const item = state.items.find((n) => n.id === id);
      if (item && !item.read) state.unreadCount = Math.max(0, state.unreadCount - 1);
      state.items = state.items.filter((n) => n.id !== id);
    },
    markAsRead(state, { payload: id }) {
      const item = state.items.find((n) => n.id === id);
      if (item && !item.read) {
        item.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead(state) {
      state.items.forEach((n) => {
        n.read = true;
      });
      state.unreadCount = 0;
    },
    clearAll(state) {
      state.items = [];
      state.unreadCount = 0;
    },
  },
});

export const { addNotification, dismissToast, removeNotification, markAsRead, markAllAsRead, clearAll } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
