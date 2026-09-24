import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as reviewsApi from "../../api/reviewsApi";
import { authSlice } from "./authSlice";

const makeThunk = (type, call) =>
  createAsyncThunk(type, async (arg, { rejectWithValue, signal }) => {
    try {
      return await call(arg, signal);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  });

export const fetchReviews = makeThunk("reviews/fetch", (productId, signal) =>
  reviewsApi.fetchReviews(productId, signal)
);
export const addReview = makeThunk("reviews/add", (reviewData) => reviewsApi.addReview(reviewData));

export const deleteReview = createAsyncThunk("reviews/delete", async (id, { rejectWithValue }) => {
  try {
    await reviewsApi.deleteReview(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Also used to bump a review's "helpful" count — pass { id, data: <full updated review> }.
export const updateReview = createAsyncThunk("reviews/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await reviewsApi.updateReview(id, data);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const average = (items) =>
  items.length ? Math.round((items.reduce((sum, r) => sum + r.rating, 0) / items.length) * 10) / 10 : 0;

const initialState = {
  items: [],
  status: "idle", // list: idle | loading | succeeded | failed
  error: null,
  averageRating: 0,
  productId: null, // which product `items` currently belongs to
  addStatus: "idle", // idle | loading | succeeded | failed
  addError: null,
  updatingIds: [], // reviews with a helpful/edit update in flight
  deletingIds: [],
  actionError: null, // last failed update/delete, shown as a notice
};

const errorOf = ({ payload, error }) => payload ?? error.message;
const without = (list, value) => list.filter((v) => v !== value);

export const reviewsSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {
    resetStatus(state) {
      state.status = "idle";
      state.error = null;
    },
    resetAddStatus(state) {
      state.addStatus = "idle";
      state.addError = null;
    },
    clearActionError(state) {
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authSlice.actions.clearUser, (state) => {
        // Logging out shouldn't hide the reviews already on screen, just any in-progress "add".
        state.addStatus = "idle";
        state.addError = null;
      })

      .addCase(fetchReviews.pending, (state, { meta }) => {
        state.status = "loading";
        state.error = null;
        state.productId = meta.arg;
      })
      .addCase(fetchReviews.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.items = payload;
        state.averageRating = average(payload);
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.status = "failed";
        state.error = errorOf(action);
      })

      .addCase(addReview.pending, (state) => {
        state.addStatus = "loading";
        state.addError = null;
      })
      .addCase(addReview.fulfilled, (state, { payload }) => {
        state.addStatus = "succeeded";
        state.items = [payload, ...state.items];
        state.averageRating = average(state.items);
      })
      .addCase(addReview.rejected, (state, action) => {
        state.addStatus = "failed";
        state.addError = errorOf(action);
      })

      .addCase(deleteReview.pending, (state, { meta }) => {
        state.deletingIds.push(meta.arg);
        state.actionError = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.deletingIds = without(state.deletingIds, action.meta.arg);
        state.items = state.items.filter((r) => r.id !== action.payload);
        state.averageRating = average(state.items);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.deletingIds = without(state.deletingIds, action.meta.arg);
        state.actionError = `Couldn't delete the review. ${errorOf(action)}`;
      })

      .addCase(updateReview.pending, (state, { meta }) => {
        state.updatingIds.push(meta.arg.id);
        state.actionError = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.updatingIds = without(state.updatingIds, action.meta.arg.id);
        state.items = state.items.map((r) => (r.id === action.payload.id ? action.payload : r));
        state.averageRating = average(state.items);
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.updatingIds = without(state.updatingIds, action.meta.arg.id);
        state.actionError = `Couldn't update the review. ${errorOf(action)}`;
      });
  },
});

export const { resetStatus, resetAddStatus, clearActionError } = reviewsSlice.actions;
export default reviewsSlice.reducer;
