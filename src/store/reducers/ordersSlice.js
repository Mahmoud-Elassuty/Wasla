import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import * as ordersApi from "../../api/ordersApi";
import * as productsApi from "../../api/productsApi";
import { authSlice } from "./authSlice";
import { syncStockSnapshots } from "./cartSlice";
import { productStockUpdated } from "./productsSlice";
import {
  availabilityStatusFromStock,
  isValidStock,
} from "../../utils/inventory";

const makeThunk = (type, call) =>
  createAsyncThunk(type, async (arg, { rejectWithValue, signal }) => {
    try {
      return await call(arg, signal);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  });

export const createOrder = createAsyncThunk(
  "orders/create",
  async (orderData, { dispatch, rejectWithValue, signal }) => {
    let products;
    try {
      products = await productsApi.fetchProducts(signal);
    } catch (error) {
      return rejectWithValue(
        `Current stock could not be checked. ${error.message}`,
      );
    }

    const productsById = new Map(
      products.map((product) => [String(product.id), product]),
    );
    const requested = new Map();
    const issues = [];
    for (const item of orderData.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        issues.push(`The quantity for "${item.title}" is invalid.`);
        continue;
      }
      const productId = String(item.productId);
      const existing = requested.get(productId);
      requested.set(productId, {
        product: productsById.get(productId),
        quantity: (existing?.quantity ?? 0) + item.quantity,
        title: item.title,
      });
    }

    const snapshots = [];
    for (const [id, item] of requested) {
      const product = item.product;
      if (!product) {
        snapshots.push({ id, stock: undefined, active: false });
        issues.push(
          `"${item.title}" is no longer available. Return to your cart.`,
        );
      } else {
        snapshots.push({
          id: product.id,
          stock: product.stock,
          active: product.active !== false,
        });
        if (product.active === false) {
          issues.push(
            `"${item.title}" is no longer available. Return to your cart.`,
          );
        } else if (!isValidStock(product.stock)) {
          issues.push(
            `Stock for "${item.title}" could not be confirmed. Contact support before ordering.`,
          );
        } else if (product.stock < item.quantity) {
          issues.push(
            product.stock === 0
              ? `"${item.title}" is out of stock. Return to your cart.`
              : `Only ${product.stock} of "${item.title}" are available; your cart has ${item.quantity}. Return to your cart.`,
          );
        }
      }
    }

    dispatch(syncStockSnapshots({ snapshots, issues }));
    if (issues.length > 0) return rejectWithValue(issues.join(" "));

    let order;
    try {
      order = await ordersApi.createOrder(orderData);
    } catch (error) {
      return rejectWithValue(error.message);
    }

    const inventoryFailures = [];
    for (const [id, item] of requested) {
      const nextStock = item.product.stock - item.quantity;
      try {
        const updated = await productsApi.updateProductStock(
          item.product.id,
          nextStock,
        );
        dispatch(
          productStockUpdated({
            id: item.product.id,
            stock: updated.stock,
            availabilityStatus:
              updated.availabilityStatus ??
              availabilityStatusFromStock(nextStock),
          }),
        );
      } catch (error) {
        inventoryFailures.push(`${item.title}: ${error.message}`);
      }
    }

    return { order, inventoryFailures };
  },
  {
    condition: (_, { getState }) => {
      const state = getState();
      return (
        state.orders.createStatus !== "loading" && state.cart.items.length > 0
      );
    },
  },
);
export const fetchOrders = makeThunk("orders/fetchAll", (userId, signal) =>
  ordersApi.fetchOrders(userId, signal),
);
export const fetchOrderById = makeThunk("orders/fetchById", (id, signal) =>
  ordersApi.fetchOrderById(id, signal),
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
        state.currentOrder = payload.order;
        state.items.unshift(payload.order);
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
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
);

export const { resetListStatus, resetCreateStatus, clearCurrentOrder } =
  ordersSlice.actions;
export default ordersSlice.reducer;
