import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as adminApi from "../../api/adminApi";
import { authSlice } from "./authSlice";

const makeThunk = (type, call) =>
  createAsyncThunk(type, async (arg, { rejectWithValue, signal }) => {
    try {
      return await call(arg, signal);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  });

export const fetchAdminOrders = makeThunk("admin/fetchOrders", (_, signal) => adminApi.fetchAllOrders(signal));
export const fetchAdminProducts = makeThunk("admin/fetchProducts", (_, signal) => adminApi.fetchAllProducts(signal));
export const updateOrderStatus = makeThunk("admin/updateOrderStatus", ({ id, status }) =>
  adminApi.updateOrderStatus(id, status)
);
export const deleteProduct = makeThunk("admin/deleteProduct", async (id) => {
  await adminApi.deleteProduct(id);
  return id;
});
export const createProduct = makeThunk("admin/createProduct", (data) => adminApi.createProduct(data));
export const updateProduct = makeThunk("admin/updateProduct", ({ id, data }) => adminApi.updateProduct(id, data));

const initialState = {
  orders: [],
  ordersStatus: "idle", // idle | loading | succeeded | failed
  ordersError: null,
  products: [],
  productsStatus: "idle",
  productsError: null,
  updatingOrderIds: [], // orders with a status change in flight
  deletingProductIds: [], // products being deleted
  saveStatus: "idle", // create / update product form
  saveError: null,
  actionError: null, // last failed status change or delete, shown at the top of the admin area
};

const errorOf = ({ payload, error }) => payload ?? error.message;
const without = (list, value) => list.filter((v) => v !== value);

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    resetOrdersStatus(state) {
      state.ordersStatus = "idle";
      state.ordersError = null;
    },
    resetProductsStatus(state) {
      state.productsStatus = "idle";
      state.productsError = null;
    },
    resetSave(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
    clearActionError(state) {
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authSlice.actions.clearUser, () => initialState) // logout: drop everyone's data

      .addCase(fetchAdminOrders.pending, (state) => {
        state.ordersStatus = "loading";
        state.ordersError = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, { payload }) => {
        state.ordersStatus = "succeeded";
        state.orders = payload;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.ordersStatus = "failed";
        state.ordersError = errorOf(action);
      })

      .addCase(fetchAdminProducts.pending, (state) => {
        state.productsStatus = "loading";
        state.productsError = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, { payload }) => {
        state.productsStatus = "succeeded";
        state.products = payload;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.productsStatus = "failed";
        state.productsError = errorOf(action);
      })

      .addCase(updateOrderStatus.pending, (state, { meta }) => {
        state.updatingOrderIds.push(meta.arg.id);
        state.actionError = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, { meta, payload }) => {
        state.updatingOrderIds = without(state.updatingOrderIds, meta.arg.id);
        state.orders = state.orders.map((o) => (o.id === payload.id ? payload : o));
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.updatingOrderIds = without(state.updatingOrderIds, action.meta.arg.id);
        state.actionError = `Couldn't update the order status. ${errorOf(action)}`;
      })

      .addCase(deleteProduct.pending, (state, { meta }) => {
        state.deletingProductIds.push(meta.arg);
        state.actionError = null;
      })
      .addCase(deleteProduct.fulfilled, (state, { meta }) => {
        state.deletingProductIds = without(state.deletingProductIds, meta.arg);
        state.products = state.products.filter((p) => p.id !== meta.arg);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.deletingProductIds = without(state.deletingProductIds, action.meta.arg);
        state.actionError = `Couldn't delete the product. ${errorOf(action)}`;
      })

      .addCase(createProduct.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createProduct.fulfilled, (state, { payload }) => {
        state.saveStatus = "succeeded";
        state.products.push(payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = errorOf(action);
      })

      .addCase(updateProduct.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(updateProduct.fulfilled, (state, { payload }) => {
        state.saveStatus = "succeeded";
        state.products = state.products.map((p) => (p.id === payload.id ? payload : p));
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = errorOf(action);
      });
  },
});

export const { resetOrdersStatus, resetProductsStatus, resetSave, clearActionError } = adminSlice.actions;
export default adminSlice.reducer;
