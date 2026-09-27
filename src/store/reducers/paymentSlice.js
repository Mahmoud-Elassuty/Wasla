import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as paymentApi from "../../api/paymentApi";

export const processPayment = createAsyncThunk("payment/process", async (arg, { rejectWithValue }) => {
  try {
    return await paymentApi.processPayment(arg);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Fire-and-forget bookkeeping once the order is created — not tracked with its own loading state
// since nothing in the UI waits on it.
export const linkPaymentToOrder = createAsyncThunk(
  "payment/link",
  async ({ paymentId, orderId }) => paymentApi.linkPaymentToOrder(paymentId, orderId)
);

const initialState = {
  transaction: null, // the last successful payment record, incl. transactionId
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

export const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    resetPayment(state) {
      state.transaction = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(processPayment.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.transaction = payload;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? action.error.message;
      })
      .addCase(linkPaymentToOrder.fulfilled, (state, { payload }) => {
        if (state.transaction?.id === payload.id) state.transaction = payload;
      });
  },
});

export const { resetPayment } = paymentSlice.actions;
export default paymentSlice.reducer;
