import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as sellerApi from "../../api/sellerApi";
import * as productsApi from "../../api/productsApi";
import { authSlice } from "./authSlice";

const makeThunk = (type, call) =>
  createAsyncThunk(type, async (arg, { rejectWithValue, signal }) => {
    try {
      return await call(arg, signal);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  });

export const fetchSellerProducts = makeThunk(
  "seller/fetchProducts",
  (sellerId, signal) => sellerApi.fetchSellerProducts(sellerId, signal),
);
export const createProduct = makeThunk("seller/createProduct", (data) =>
  sellerApi.createProduct(data),
);
export const updateProduct = makeThunk("seller/updateProduct", ({ id, data }) =>
  sellerApi.updateProduct(id, data),
);
export const updateProductStock = createAsyncThunk(
  "seller/updateProductStock",
  async ({ id, stock }, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    const product = getState().seller.products.find(
      (item) =>
        String(item.id) === String(id) &&
        String(item.sellerId) === String(user?.id),
    );
    if (user?.role !== "seller" || !product) {
      return rejectWithValue("You can only restock your own products.");
    }
    try {
      return await productsApi.updateProductStock(product.id, stock);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);
export const deleteProduct = makeThunk("seller/deleteProduct", async (id) => {
  await sellerApi.deleteProduct(id);
  return id;
});

// `sellerProductIds` (this seller's own product ids) drives the client-side filter — see
// sellerApi.fetchSellerOrders for why orders can't be queried by sellerId directly.
export const fetchSellerOrders = makeThunk(
  "seller/fetchOrders",
  (sellerProductIds, signal) =>
    sellerApi.fetchSellerOrders(sellerProductIds, signal),
);
export const updateOrderStatus = makeThunk(
  "seller/updateOrderStatus",
  ({ id, status }) => sellerApi.updateOrderStatus(id, status),
);

export const updateSellerProfile = createAsyncThunk(
  "seller/updateProfile",
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      const updated = await sellerApi.updateSellerProfile(id, data);
      dispatch(authSlice.actions.setUser(updated)); // keep the navbar/session in sync immediately
      return updated;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const initialState = {
  products: [],
  productsStatus: "idle", // idle | loading | succeeded | failed
  productsError: null,
  saveStatus: "idle", // create / update product form
  saveError: null,
  deletingProductIds: [],
  orders: [],
  ordersStatus: "idle",
  ordersError: null,
  updatingOrderIds: [],
  profileSaveStatus: "idle",
  profileSaveError: null,
  actionError: null, // last failed status change or delete, shown at the top of the seller area
};

const errorOf = ({ payload, error }) => payload ?? error.message;
const without = (list, value) => list.filter((v) => v !== value);

export const sellerSlice = createSlice({
  name: "seller",
  initialState,
  reducers: {
    resetProductsStatus(state) {
      state.productsStatus = "idle";
      state.productsError = null;
    },
    resetOrdersStatus(state) {
      state.ordersStatus = "idle";
      state.ordersError = null;
    },
    resetSave(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
    resetProfileSave(state) {
      state.profileSaveStatus = "idle";
      state.profileSaveError = null;
    },
    clearActionError(state) {
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authSlice.actions.clearUser, () => initialState) // logout: drop everyone's data

      .addCase(fetchSellerProducts.pending, (state) => {
        state.productsStatus = "loading";
        state.productsError = null;
      })
      .addCase(fetchSellerProducts.fulfilled, (state, { payload }) => {
        state.productsStatus = "succeeded";
        state.products = payload;
      })
      .addCase(fetchSellerProducts.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.productsStatus = "failed";
        state.productsError = errorOf(action);
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
        state.products = state.products.map((p) =>
          p.id === payload.id ? payload : p,
        );
      })
      .addCase(updateProductStock.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(updateProductStock.fulfilled, (state, { payload }) => {
        state.saveStatus = "succeeded";
        state.products = state.products.map((product) =>
          String(product.id) === String(payload.id) ? payload : product,
        );
      })
      .addCase(updateProductStock.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = errorOf(action);
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = errorOf(action);
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
        state.deletingProductIds = without(
          state.deletingProductIds,
          action.meta.arg,
        );
        state.actionError = `Couldn't delete the product. ${errorOf(action)}`;
      })

      .addCase(fetchSellerOrders.pending, (state) => {
        state.ordersStatus = "loading";
        state.ordersError = null;
      })
      .addCase(fetchSellerOrders.fulfilled, (state, { payload }) => {
        state.ordersStatus = "succeeded";
        state.orders = payload;
      })
      .addCase(fetchSellerOrders.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.ordersStatus = "failed";
        state.ordersError = errorOf(action);
      })

      .addCase(updateOrderStatus.pending, (state, { meta }) => {
        state.updatingOrderIds.push(meta.arg.id);
        state.actionError = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, { meta, payload }) => {
        state.updatingOrderIds = without(state.updatingOrderIds, meta.arg.id);
        // The order came back without `sellerItems`/`sellerSubtotal` (a plain PATCH result), so
        // keep those two fields from what we already had rather than losing them.
        state.orders = state.orders.map((o) =>
          o.id === payload.id ? { ...o, ...payload } : o,
        );
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.updatingOrderIds = without(
          state.updatingOrderIds,
          action.meta.arg.id,
        );
        state.actionError = `Couldn't update the order status. ${errorOf(action)}`;
      })

      .addCase(updateSellerProfile.pending, (state) => {
        state.profileSaveStatus = "loading";
        state.profileSaveError = null;
      })
      .addCase(updateSellerProfile.fulfilled, (state) => {
        state.profileSaveStatus = "succeeded";
      })
      .addCase(updateSellerProfile.rejected, (state, action) => {
        state.profileSaveStatus = "failed";
        state.profileSaveError = errorOf(action);
      });
  },
});

export const {
  resetProductsStatus,
  resetOrdersStatus,
  resetSave,
  resetProfileSave,
  clearActionError,
} = sellerSlice.actions;
export default sellerSlice.reducer;
