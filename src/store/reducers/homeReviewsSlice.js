import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchAllReviews } from "../../api/reviewsApi";

export const fetchHomepageReviews = createAsyncThunk(
  "homeReviews/fetchAll",
  async (_, { rejectWithValue, signal }) => {
    try { return await fetchAllReviews(signal); }
    catch (error) { return rejectWithValue(error.message); }
  },
  { condition: (_, { getState }) => getState().homeReviews.status !== "loading" }
);

const homeReviewsSlice = createSlice({
  name: "homeReviews",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomepageReviews.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(fetchHomepageReviews.fulfilled, (state, { payload }) => { state.status = "succeeded"; state.items = payload; })
      .addCase(fetchHomepageReviews.rejected, (state, action) => {
        if (action.meta.aborted) { state.status = "idle"; return; }
        state.status = "failed";
        state.error = action.payload ?? action.error.message;
      });
  },
});

export default homeReviewsSlice.reducer;