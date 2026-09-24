import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as authApi from "../../api/authApi";
import {
  getAuthUser,
  removeAuthUser,
  setAuthUser,
} from "../../utils/localStorage";

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const user = await authApi.login(email, password);
      setAuthUser(user);
      return user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      return await authApi.register(userData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const onPending = (state) => {
  state.status = "loading";
  state.error = null;
};
const onRejected = (state, { payload, error }) => {
  state.status = "failed";
  state.error = payload ?? error.message;
};

export const authSlice = createSlice({
  name: "auth",
  initialState: { user: getAuthUser(), status: "idle", error: null },
  reducers: {
    clearUser(state) {
      state.user = null;
      state.status = "idle";
      state.error = null;
    },
    resetStatus(state) {
      state.status = "idle";
      state.error = null;
    },
    // Used after a profile edit to keep the navbar, etc. in sync with the saved changes.
    setUser(state, { payload }) {
      state.user = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, onPending)
      .addCase(login.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.user = payload;
      })
      .addCase(login.rejected, onRejected)
      .addCase(register.pending, onPending)
      .addCase(register.fulfilled, (state) => {
        state.status = "succeeded"; // user must log in after registering
      })
      .addCase(register.rejected, onRejected);
  },
});

// Thunk (not a reducer) so the localStorage side effect stays out of the reducer.
export const logout = () => (dispatch) => {
  removeAuthUser();
  dispatch(authSlice.actions.clearUser());
};

export const { resetStatus } = authSlice.actions;
export default authSlice.reducer;
