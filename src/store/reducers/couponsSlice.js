import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as couponsApi from "../../api/couponsApi";
import { authSlice } from "./authSlice";

// { code, cartTotal } -> validates the coupon against the current cart and returns the discount.
export const applyCoupon = createAsyncThunk(
  "coupons/apply",
  async ({ code, cartTotal }, { rejectWithValue }) => {
    try {
      return await couponsApi.applyCoupon(code, cartTotal);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Called once an order using the applied coupon has actually been placed, to record the usage.
// Non-fatal by design: the order already went through, so a failure here shouldn't block anything —
// the slice resets on `pending` regardless of how the PATCH turns out.
export const redeemCoupon = createAsyncThunk(
  "coupons/redeem",
  async (_, { getState, rejectWithValue }) => {
    const { coupon } = getState().coupons;
    if (!coupon) return null;
    try {
      return await couponsApi.redeemCoupon(coupon.id, coupon.usedCount);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  code: "",
  coupon: null, // the full coupon record once applied
  discount: 0,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

export const couponsSlice = createSlice({
  name: "coupons",
  initialState,
  reducers: {
    removeCoupon() {
      // Nothing to persist server-side for "remove" — the coupon was never attached to
      // anything but this local cart session, so clearing the slice is all that's needed.
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authSlice.actions.clearUser, () => initialState) // logout

      .addCase(applyCoupon.pending, (state, { meta }) => {
        state.status = "loading";
        state.error = null;
        state.code = meta.arg.code;
      })
      .addCase(applyCoupon.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.coupon = payload.coupon;
        state.discount = payload.discount;
        state.code = payload.coupon.code;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? action.error.message;
        state.coupon = null;
        state.discount = 0;
      })

      // Reset right away (optimistic) so the cart/checkout UI moves on immediately —
      // the order itself already has the discount baked in either way.
      .addCase(redeemCoupon.pending, () => initialState);
  },
});

export const { removeCoupon } = couponsSlice.actions;
export default couponsSlice.reducer;
