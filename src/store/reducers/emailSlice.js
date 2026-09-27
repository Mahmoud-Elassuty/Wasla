import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as emailApi from "../../api/emailApi";

const makeThunk = (type, call) =>
  createAsyncThunk(type, async (arg, { rejectWithValue, signal }) => {
    try {
      return await call(arg, signal);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  });

export const sendOrderConfirmation = makeThunk("email/sendOrderConfirmation", (order) =>
  emailApi.sendOrderConfirmation(order)
);
export const sendPasswordReset = makeThunk("email/sendPasswordReset", (email) => emailApi.sendPasswordReset(email));
export const sendWelcomeEmail = makeThunk("email/sendWelcomeEmail", (user) => emailApi.sendWelcomeEmail(user));
export const fetchEmails = makeThunk("email/fetchAll", (_, signal) => emailApi.fetchEmails(signal));

const initialState = {
  sentEmails: [], // admin history, populated by fetchEmails
  status: "idle", // fetchEmails: idle | loading | succeeded | failed
  error: null,
  sendStatus: "idle", // most recent send*() call: idle | loading | succeeded | failed
  sendError: null,
};

const errorMessage = ({ payload, error }) => payload ?? error.message;

export const emailSlice = createSlice({
  name: "email",
  initialState,
  reducers: {
    resetSendStatus(state) {
      state.sendStatus = "idle";
      state.sendError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmails.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchEmails.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.sentEmails = payload;
      })
      .addCase(fetchEmails.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.status = "failed";
        state.error = errorMessage(action);
      });

    // All three send thunks share the same pending/fulfilled/rejected shape, and each fulfilled
    // email is pushed into `sentEmails` too, so the admin list stays live without a refetch —
    // same pattern adminSlice uses for create actions.
    [sendOrderConfirmation, sendPasswordReset, sendWelcomeEmail].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.sendStatus = "loading";
          state.sendError = null;
        })
        .addCase(thunk.fulfilled, (state, { payload }) => {
          state.sendStatus = "succeeded";
          state.sentEmails = [payload, ...state.sentEmails];
        })
        .addCase(thunk.rejected, (state, action) => {
          state.sendStatus = "failed";
          state.sendError = errorMessage(action);
        });
    });
  },
});

export const { resetSendStatus } = emailSlice.actions;
export default emailSlice.reducer;
