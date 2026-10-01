import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as adminApi from "../../api/adminApi";
import * as productsApi from "../../api/productsApi";
import { authSlice } from "./authSlice";
import { SELF_ACTION_MESSAGE } from "../../utils/users";

const makeThunk = (type, call) =>
  createAsyncThunk(type, async (arg, { rejectWithValue, signal }) => {
    try {
      return await call(arg, signal);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  });

export const fetchAdminOrders = makeThunk("admin/fetchOrders", (_, signal) =>
  adminApi.fetchAllOrders(signal),
);
export const fetchAdminProducts = makeThunk(
  "admin/fetchProducts",
  (_, signal) => adminApi.fetchAllProducts(signal),
);
// Only used to resolve a product's seller/store name on the order details page.
export const fetchAdminUsers = makeThunk("admin/fetchUsers", (_, signal) =>
  adminApi.fetchAllUsers(signal),
);
// Restrict / unrestrict / soft-delete / restore. An admin can never change their own account.
export const updateUserStatus = createAsyncThunk(
  "admin/updateUserStatus",
  async ({ id, status }, { rejectWithValue, getState }) => {
    if (String(getState().auth.user?.id) === String(id))
      return rejectWithValue(SELF_ACTION_MESSAGE);
    try {
      return await adminApi.updateUserStatus(id, status);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);
export const updateOrderStatus = makeThunk(
  "admin/updateOrderStatus",
  ({ id, status }) => adminApi.updateOrderStatus(id, status),
);
export const deleteProduct = makeThunk("admin/deleteProduct", async (id) => {
  await adminApi.deleteProduct(id);
  return id;
});
export const createProduct = makeThunk("admin/createProduct", (data) =>
  adminApi.createProduct(data),
);
export const updateProduct = makeThunk("admin/updateProduct", ({ id, data }) =>
  adminApi.updateProduct(id, data),
);
export const updateProductStock = createAsyncThunk(
  "admin/updateProductStock",
  async ({ id, stock }, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    const product = getState().admin.products.find(
      (item) => String(item.id) === String(id),
    );
    if (user?.role !== "admin" || !product) {
      return rejectWithValue("You are not allowed to restock this product.");
    }
    try {
      return await productsApi.updateProductStock(product.id, stock);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchAdminReviews = makeThunk("admin/fetchReviews", (_, signal) =>
  adminApi.fetchAllReviews(signal),
);
export const deleteReview = makeThunk("admin/deleteReview", async (id) => {
  await adminApi.deleteReview(id);
  return id;
});
export const updateReviewStatus = makeThunk(
  "admin/updateReviewStatus",
  ({ id, verified }) => adminApi.updateReviewStatus(id, verified),
);
export const updateReviewHomepage = makeThunk(
  "admin/updateReviewHomepage",
  ({ id, data }) => adminApi.updateReviewHomepage(id, data),
);

export const fetchAdminCoupons = makeThunk("admin/fetchCoupons", (_, signal) =>
  adminApi.fetchCoupons(signal),
);
export const createCoupon = makeThunk("admin/createCoupon", (data) =>
  adminApi.createCoupon(data),
);
export const updateCoupon = makeThunk("admin/updateCoupon", ({ id, data }) =>
  adminApi.updateCoupon(id, data),
);
export const deleteCoupon = makeThunk("admin/deleteCoupon", async (id) => {
  await adminApi.deleteCoupon(id);
  return id;
});
// Quick on/off toggle from the coupons table — a PUT of the same coupon with `active` flipped,
// tracked separately from `couponSaveStatus` so it doesn't fight with the add/edit form's own state.
export const toggleCouponActive = makeThunk(
  "admin/toggleCouponActive",
  (coupon) =>
    adminApi.updateCoupon(coupon.id, { ...coupon, active: !coupon.active }),
);

const initialState = {
  orders: [],
  ordersStatus: "idle", // idle | loading | succeeded | failed
  ordersError: null,
  products: [],
  productsStatus: "idle",
  productsError: null,
  users: [],
  usersStatus: "idle", // idle | loading | succeeded | failed
  usersError: null,
  updatingUserIds: [], // users with a status change in flight
  updatingOrderIds: [], // orders with a status change in flight
  deletingProductIds: [], // products being deleted
  saveStatus: "idle", // create / update product form
  saveError: null,
  actionError: null, // last failed status change or delete, shown at the top of the admin area
  reviews: [],
  reviewsStatus: "idle", // idle | loading | succeeded | failed
  reviewsError: null,
  deletingReviewIds: [], // reviews being deleted
  updatingReviewIds: [], // reviews with a verified-status change in flight
  coupons: [],
  couponsStatus: "idle", // idle | loading | succeeded | failed
  couponsError: null,
  deletingCouponIds: [], // coupons being deleted
  togglingCouponIds: [], // coupons with an active/inactive toggle in flight
  couponSaveStatus: "idle", // create / update coupon form
  couponSaveError: null,
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
    resetUsersStatus(state) {
      state.usersStatus = "idle";
      state.usersError = null;
    },
    resetReviewsStatus(state) {
      state.reviewsStatus = "idle";
      state.reviewsError = null;
    },
    resetCouponsStatus(state) {
      state.couponsStatus = "idle";
      state.couponsError = null;
    },
    resetCouponSave(state) {
      state.couponSaveStatus = "idle";
      state.couponSaveError = null;
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

      .addCase(fetchAdminUsers.pending, (state) => {
        state.usersStatus = "loading";
        state.usersError = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, { payload }) => {
        state.usersStatus = "succeeded";
        state.users = payload;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.usersStatus = "failed";
        state.usersError = errorOf(action);
      })

      .addCase(updateUserStatus.pending, (state, { meta }) => {
        state.updatingUserIds.push(meta.arg.id);
      })
      .addCase(updateUserStatus.fulfilled, (state, { meta, payload }) => {
        state.updatingUserIds = without(state.updatingUserIds, meta.arg.id);
        state.users = state.users.map((u) =>
          String(u.id) === String(payload.id) ? payload : u,
        );
      })
      .addCase(updateUserStatus.rejected, (state, { meta }) => {
        // the page shows the failure as a toast (see UserActions), so no top-of-page banner here
        state.updatingUserIds = without(state.updatingUserIds, meta.arg.id);
      })

      .addCase(updateOrderStatus.pending, (state, { meta }) => {
        state.updatingOrderIds.push(meta.arg.id);
        state.actionError = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, { meta, payload }) => {
        state.updatingOrderIds = without(state.updatingOrderIds, meta.arg.id);
        state.orders = state.orders.map((o) =>
          o.id === payload.id ? payload : o,
        );
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.updatingOrderIds = without(
          state.updatingOrderIds,
          action.meta.arg.id,
        );
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
        state.deletingProductIds = without(
          state.deletingProductIds,
          action.meta.arg,
        );
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

      .addCase(fetchAdminReviews.pending, (state) => {
        state.reviewsStatus = "loading";
        state.reviewsError = null;
      })
      .addCase(fetchAdminReviews.fulfilled, (state, { payload }) => {
        state.reviewsStatus = "succeeded";
        state.reviews = payload;
      })
      .addCase(fetchAdminReviews.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.reviewsStatus = "failed";
        state.reviewsError = errorOf(action);
      })

      .addCase(deleteReview.pending, (state, { meta }) => {
        state.deletingReviewIds.push(meta.arg);
        state.actionError = null;
      })
      .addCase(deleteReview.fulfilled, (state, { meta }) => {
        state.deletingReviewIds = without(state.deletingReviewIds, meta.arg);
        state.reviews = state.reviews.filter((r) => r.id !== meta.arg);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.deletingReviewIds = without(
          state.deletingReviewIds,
          action.meta.arg,
        );
        state.actionError = `Couldn't delete the review. ${errorOf(action)}`;
      })

      .addCase(updateReviewStatus.pending, (state, { meta }) => {
        state.updatingReviewIds.push(meta.arg.id);
        state.actionError = null;
      })
      .addCase(updateReviewStatus.fulfilled, (state, { meta, payload }) => {
        state.updatingReviewIds = without(state.updatingReviewIds, meta.arg.id);
        state.reviews = state.reviews.map((r) =>
          r.id === payload.id ? payload : r,
        );
      })
      .addCase(updateReviewStatus.rejected, (state, action) => {
        state.updatingReviewIds = without(
          state.updatingReviewIds,
          action.meta.arg.id,
        );
        state.actionError = `Couldn't update the review. ${errorOf(action)}`;
      })

      .addCase(updateReviewHomepage.pending, (state, { meta }) => {
        state.updatingReviewIds.push(meta.arg.id);
        state.actionError = null;
      })
      .addCase(updateReviewHomepage.fulfilled, (state, { meta, payload }) => {
        state.updatingReviewIds = without(state.updatingReviewIds, meta.arg.id);
        state.reviews = state.reviews.map((review) =>
          String(review.id) === String(payload.id) ? payload : review,
        );
      })
      .addCase(updateReviewHomepage.rejected, (state, action) => {
        state.updatingReviewIds = without(
          state.updatingReviewIds,
          action.meta.arg.id,
        );
        state.actionError = `Homepage review update failed: ${errorOf(action)}`;
      })

      .addCase(fetchAdminCoupons.pending, (state) => {
        state.couponsStatus = "loading";
        state.couponsError = null;
      })
      .addCase(fetchAdminCoupons.fulfilled, (state, { payload }) => {
        state.couponsStatus = "succeeded";
        state.coupons = payload;
      })
      .addCase(fetchAdminCoupons.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.couponsStatus = "failed";
        state.couponsError = errorOf(action);
      })

      .addCase(deleteCoupon.pending, (state, { meta }) => {
        state.deletingCouponIds.push(meta.arg);
        state.actionError = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, { meta }) => {
        state.deletingCouponIds = without(state.deletingCouponIds, meta.arg);
        state.coupons = state.coupons.filter((c) => c.id !== meta.arg);
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.deletingCouponIds = without(
          state.deletingCouponIds,
          action.meta.arg,
        );
        state.actionError = `Couldn't delete the coupon. ${errorOf(action)}`;
      })

      .addCase(createCoupon.pending, (state) => {
        state.couponSaveStatus = "loading";
        state.couponSaveError = null;
      })
      .addCase(createCoupon.fulfilled, (state, { payload }) => {
        state.couponSaveStatus = "succeeded";
        state.coupons.push(payload);
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.couponSaveStatus = "failed";
        state.couponSaveError = errorOf(action);
      })

      .addCase(updateCoupon.pending, (state) => {
        state.couponSaveStatus = "loading";
        state.couponSaveError = null;
      })
      .addCase(updateCoupon.fulfilled, (state, { payload }) => {
        state.couponSaveStatus = "succeeded";
        state.coupons = state.coupons.map((c) =>
          c.id === payload.id ? payload : c,
        );
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.couponSaveStatus = "failed";
        state.couponSaveError = errorOf(action);
      })

      .addCase(toggleCouponActive.pending, (state, { meta }) => {
        state.togglingCouponIds.push(meta.arg.id);
        state.actionError = null;
      })
      .addCase(toggleCouponActive.fulfilled, (state, { meta, payload }) => {
        state.togglingCouponIds = without(state.togglingCouponIds, meta.arg.id);
        state.coupons = state.coupons.map((c) =>
          c.id === payload.id ? payload : c,
        );
      })
      .addCase(toggleCouponActive.rejected, (state, action) => {
        state.togglingCouponIds = without(
          state.togglingCouponIds,
          action.meta.arg.id,
        );
        state.actionError = `Couldn't update the coupon. ${errorOf(action)}`;
      });
  },
});

export const {
  resetOrdersStatus,
  resetProductsStatus,
  resetUsersStatus,
  resetReviewsStatus,
  resetCouponsStatus,
  resetCouponSave,
  resetSave,
  clearActionError,
} = adminSlice.actions;
export default adminSlice.reducer;
