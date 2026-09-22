import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as productsApi from "../../api/productsApi";

const makeThunk = (type, call) =>
  createAsyncThunk(type, async (arg, { rejectWithValue, signal }) => {
    try {
      return await call(arg, signal);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  });

export const fetchProducts = makeThunk("products/fetchAll", (_, signal) =>
  productsApi.fetchProducts(signal)
);
export const fetchProductById = makeThunk("products/fetchById", (id, signal) =>
  productsApi.fetchProductById(id, signal)
);
export const fetchCategories = makeThunk("products/fetchCategories", (_, signal) =>
  productsApi.fetchCategories(signal)
);

const initialState = {
  items: [],
  categories: [],
  selectedProduct: null,
  status: "idle", // list: idle | loading | succeeded | failed
  error: null,
  detailsStatus: "idle", // details page has its own status so it never disturbs the list
  detailsError: null,
};

const errorMessage = ({ payload, error }) => payload ?? error.message;

export const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearSelectedProduct(state) {
      state.selectedProduct = null;
      state.detailsStatus = "idle";
      state.detailsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.items = payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.status = "failed";
        state.error = errorMessage(action);
      })
      .addCase(fetchProductById.pending, (state) => {
        state.detailsStatus = "loading";
        state.detailsError = null;
        state.selectedProduct = null;
      })
      .addCase(fetchProductById.fulfilled, (state, { payload }) => {
        state.detailsStatus = "succeeded";
        state.selectedProduct = payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.detailsStatus = "failed";
        state.detailsError = errorMessage(action);
      })
      // Categories are optional: if this fails, Products derives them from the items.
      .addCase(fetchCategories.fulfilled, (state, { payload }) => {
        state.categories = payload;
      });
  },
});

export const { clearSelectedProduct } = productsSlice.actions;
export default productsSlice.reducer;
