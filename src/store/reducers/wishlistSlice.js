import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as wishlistApi from "../../api/wishlistApi";
import { authSlice } from "./authSlice";

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetch",
  async (userId, { rejectWithValue, signal }) => {
    try {
      return await wishlistApi.fetchWishlist(userId, signal);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Both toggles take a productId. While one is in flight for that product, a second click is ignored.
export const addToWishlist = createAsyncThunk(
  "wishlist/add",
  async (productId, { getState, rejectWithValue }) => {
    const userId = getState().auth.user?.id;
    if (userId === undefined) return rejectWithValue("Please log in first.");
    try {
      return await wishlistApi.addToWishlist(productId, userId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
  {
    condition: (productId, { getState }) => {
      const { items, pendingIds } = getState().wishlist;
      return !pendingIds.includes(productId) && !items.some((i) => i.productId === productId);
    },
  }
);

export const removeFromWishlist = createAsyncThunk(
  "wishlist/remove",
  async (productId, { getState, rejectWithValue }) => {
    const entry = getState().wishlist.items.find((i) => i.productId === productId);
    if (!entry) return productId;
    try {
      await wishlistApi.removeFromWishlist(entry.id); // DELETE /wishlist/:id
      return productId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
  { condition: (productId, { getState }) => !getState().wishlist.pendingIds.includes(productId) }
);

const initialState = {
  items: [], // [{ id, productId, userId }]
  status: "idle", // loading the list: idle | loading | succeeded | failed
  error: null,
  pendingIds: [], // productIds with an add/remove request in flight
  actionError: null, // last failed add/remove, shown as a notice
};

const startPending = (state, { meta }) => {
  state.pendingIds.push(meta.arg);
  state.actionError = null;
};
const stopPending = (state, { meta }) => {
  state.pendingIds = state.pendingIds.filter((id) => id !== meta.arg);
};
const failAction = (state, action) => {
  stopPending(state, action);
  state.actionError = action.payload ?? action.error.message;
};

export const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    resetStatus(state) {
      state.status = "idle";
      state.error = null;
    },
    clearActionError(state) {
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authSlice.actions.clearUser, () => initialState) // logout

      .addCase(fetchWishlist.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.items = payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.status = "failed";
        state.error = action.payload ?? action.error.message;
      })

      .addCase(addToWishlist.pending, startPending)
      .addCase(addToWishlist.fulfilled, (state, action) => {
        stopPending(state, action);
        if (!state.items.some((i) => i.productId === action.payload.productId)) {
          state.items.push(action.payload);
        }
      })
      .addCase(addToWishlist.rejected, failAction)

      .addCase(removeFromWishlist.pending, startPending)
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        stopPending(state, action);
        state.items = state.items.filter((i) => i.productId !== action.payload);
      })
      .addCase(removeFromWishlist.rejected, failAction);
  },
});

export const selectIsWishlisted = (productId) => (state) =>
  state.wishlist.items.some((i) => i.productId === productId);
export const selectIsWishlistPending = (productId) => (state) =>
  state.wishlist.pendingIds.includes(productId);

export const { resetStatus, clearActionError } = wishlistSlice.actions;
export default wishlistSlice.reducer;
