import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import * as ordersApi from "../../api/ordersApi";
import { authSlice } from "./authSlice";

const makeThunk = (type, call) =>
  createAsyncThunk(type, async (arg, { rejectWithValue, signal }) => {
    try {
      return await call(arg, signal);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  });

export const createOrder = makeThunk("orders/create", (orderData) => ordersApi.createOrder(orderData));
export const fetchOrders = makeThunk("orders/fetchAll", (userId, signal) =>
  ordersApi.fetchOrders(userId, signal)
);
export const fetchOrderById = makeThunk("orders/fetchById", (id, signal) =>
  ordersApi.fetchOrderById(id, signal)
);

// One status per use, so e.g. a failed "order details" request never breaks the orders list.
const initialState = {
  items: [],
  currentOrder: null,
  status: "idle", // orders list
  error: null,
  detailsStatus: "idle", // single order
  detailsError: null,
  createStatus: "idle", // placing an order (checkout)
  createError: null,
};

const errorOf = ({ payload, error }) => payload ?? error.message;

export const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    resetListStatus(state) {
      state.status = "idle";
      state.error = null;
    },
    resetCreateStatus(state) {
      state.createStatus = "idle";
      state.createError = null;
    },
    clearCurrentOrder(state) {
      state.currentOrder = null;
      state.detailsStatus = "idle";
      state.detailsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authSlice.actions.clearUser, () => initialState) // logout: forget this user's orders

      .addCase(createOrder.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createOrder.fulfilled, (state, { payload }) => {
        state.createStatus = "succeeded";
        state.currentOrder = payload;
        state.items.unshift(payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = errorOf(action);
      })

      .addCase(fetchOrders.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.items = payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.status = "failed";
        state.error = errorOf(action);
      })

      .addCase(fetchOrderById.pending, (state) => {
        state.detailsStatus = "loading";
        state.detailsError = null;
        state.currentOrder = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, { payload }) => {
        state.detailsStatus = "succeeded";
        state.currentOrder = payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.detailsStatus = "failed";
        state.detailsError = errorOf(action);
      });
  },
});

// One user's orders, newest first. Memoised, so components only re-render when the result changes.
export const selectOrdersByUserId = createSelector(
  [(state) => state.orders.items, (_state, userId) => userId],
  (items, userId) =>
    items
      .filter((o) => String(o.userId) === String(userId))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
);

export const { resetListStatus, resetCreateStatus, clearCurrentOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
