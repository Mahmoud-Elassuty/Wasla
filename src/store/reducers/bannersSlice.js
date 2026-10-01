import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as bannersApi from "../../api/bannersApi";

const sortBanners = (items) =>
  [...items].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder) || String(a.id).localeCompare(String(b.id)));

export const fetchBanners = createAsyncThunk(
  "banners/fetchAll",
  async (_, { rejectWithValue, signal }) => {
    try { return await bannersApi.fetchBanners(signal); }
    catch (err) { return rejectWithValue(err.message); }
  },
  { condition: (_, { getState }) => getState().banners.status !== "loading" }
);

export const fetchBannerById = createAsyncThunk(
  "banners/fetchById",
  async (id, { rejectWithValue, signal }) => {
    try { return await bannersApi.fetchBannerById(id, signal); }
    catch (err) { return rejectWithValue(err.message); }
  },
  {
    condition: (id, { getState }) => {
      const { detailStatus, detailId } = getState().banners;
      return detailStatus !== "loading" || String(detailId) !== String(id);
    },
  }
);

export const createBanner = createAsyncThunk("banners/create", async (data, { rejectWithValue }) => {
  try { return await bannersApi.createBanner(data); }
  catch (err) { return rejectWithValue(err.message); }
});

export const updateBanner = createAsyncThunk("banners/update", async ({ id, data }, { rejectWithValue }) => {
  try { return await bannersApi.updateBanner(id, data); }
  catch (err) { return rejectWithValue(err.message); }
});

export const setBannerStatus = createAsyncThunk("banners/setStatus", async ({ id, status }, { rejectWithValue }) => {
  try { return await bannersApi.updateBannerStatus(id, status); }
  catch (err) { return rejectWithValue(err.message); }
});

export const deleteBanner = createAsyncThunk("banners/delete", async (id, { rejectWithValue }) => {
  try { await bannersApi.deleteBanner(id); return id; }
  catch (err) { return rejectWithValue(err.message); }
});

const initialState = {
  items: [], status: "idle", error: null,
  detailId: null, selectedBanner: null, detailStatus: "idle", detailError: null,
  saveStatus: "idle", saveError: null, deletingIds: [], updatingIds: [], actionError: null,
};
const errorOf = ({ payload, error }) => payload ?? error.message;
const without = (list, value) => list.filter((item) => String(item) !== String(value));
const replaceBanner = (state, banner) => {
  state.items = sortBanners(state.items.map((item) => String(item.id) === String(banner.id) ? banner : item));
  if (String(state.selectedBanner?.id) === String(banner.id)) state.selectedBanner = banner;
};

export const bannersSlice = createSlice({
  name: "banners",
  initialState,
  reducers: {
    resetBannerSave(state) { state.saveStatus = "idle"; state.saveError = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(fetchBanners.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.items = sortBanners(payload);
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        if (action.meta.aborted) { state.status = "idle"; return; }
        state.status = "failed"; state.error = errorOf(action);
      })
      .addCase(fetchBannerById.pending, (state, { meta }) => {
        state.detailId = meta.arg; state.selectedBanner = null;
        state.detailStatus = "loading"; state.detailError = null;
      })
      .addCase(fetchBannerById.fulfilled, (state, { payload, meta }) => {
        if (String(state.detailId) !== String(meta.arg)) return;
        state.detailStatus = "succeeded"; state.selectedBanner = payload;
      })
      .addCase(fetchBannerById.rejected, (state, action) => {
        if (String(state.detailId) !== String(action.meta.arg)) return;
        if (action.meta.aborted) { state.detailStatus = "idle"; return; }
        state.detailStatus = "failed"; state.detailError = errorOf(action);
      })
      .addCase(createBanner.pending, (state) => { state.saveStatus = "loading"; state.saveError = null; })
      .addCase(createBanner.fulfilled, (state, { payload }) => {
        state.saveStatus = "succeeded"; state.items = sortBanners([...state.items, payload]);
      })
      .addCase(createBanner.rejected, (state, action) => { state.saveStatus = "failed"; state.saveError = errorOf(action); })
      .addCase(updateBanner.pending, (state) => { state.saveStatus = "loading"; state.saveError = null; })
      .addCase(updateBanner.fulfilled, (state, { payload }) => { state.saveStatus = "succeeded"; replaceBanner(state, payload); })
      .addCase(updateBanner.rejected, (state, action) => { state.saveStatus = "failed"; state.saveError = errorOf(action); })
      .addCase(setBannerStatus.pending, (state, { meta }) => {
        state.updatingIds.push(meta.arg.id); state.actionError = null;
      })
      .addCase(setBannerStatus.fulfilled, (state, { payload, meta }) => {
        state.updatingIds = without(state.updatingIds, meta.arg.id); replaceBanner(state, payload);
      })
      .addCase(setBannerStatus.rejected, (state, action) => {
        state.updatingIds = without(state.updatingIds, action.meta.arg.id); state.actionError = errorOf(action);
      })
      .addCase(deleteBanner.pending, (state, { meta }) => {
        state.deletingIds.push(meta.arg); state.actionError = null;
      })
      .addCase(deleteBanner.fulfilled, (state, { payload }) => {
        state.deletingIds = without(state.deletingIds, payload);
        state.items = state.items.filter((item) => String(item.id) !== String(payload));
      })
      .addCase(deleteBanner.rejected, (state, action) => {
        state.deletingIds = without(state.deletingIds, action.meta.arg); state.actionError = errorOf(action);
      });
  },
});

export const { resetBannerSave } = bannersSlice.actions;
export default bannersSlice.reducer;