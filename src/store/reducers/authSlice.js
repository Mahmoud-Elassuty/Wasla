import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as authApi from "../../api/authApi";
import {
  getAuthUser,
  removeAuthUser,
  setAuthUser,
} from "../../utils/localStorage";
import { showError } from "../../utils/notifications";

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

export const updatePreferences = createAsyncThunk(
  "auth/updatePreferences",
  async (
    { interests, onboardingCompleted },
    { getState, dispatch, rejectWithValue },
  ) => {
    const current = getState().auth.user;
    if (current?.id === undefined || current?.id === null) {
      return rejectWithValue("Sign in before saving your interests.");
    }

    const patch = {
      interests: Array.isArray(interests)
        ? [
            ...new Set(
              interests.filter(
                (interest) => typeof interest === "string" && interest.trim(),
              ),
            ),
          ]
        : Array.isArray(current.interests)
          ? current.interests
          : [],
      onboardingCompleted:
        typeof onboardingCompleted === "boolean"
          ? onboardingCompleted
          : current.onboardingCompleted === true,
    };

    try {
      const saved = await authApi.updatePreferences(current.id, patch);
      const active = getState().auth.user;
      if (!active || String(active.id) !== String(current.id)) {
        return rejectWithValue(
          "Your session changed. Sign in again before saving preferences.",
        );
      }
      const updatedUser = {
        ...active,
        interests: Array.isArray(saved.interests)
          ? saved.interests
          : patch.interests,
        onboardingCompleted:
          typeof saved.onboardingCompleted === "boolean"
            ? saved.onboardingCompleted
            : patch.onboardingCompleted,
      };
      setAuthUser(updatedUser);
      dispatch(authSlice.actions.setUser(updatedUser));
      return updatedUser;
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

// Re-checks the stored user against db.json. A restricted / soft-deleted / removed account is logged
// out with a message. If the server can't be reached the session is kept (no lock-outs on a hiccup).
export const validateSession = () => async (dispatch, getState) => {
  const user = getState().auth.user;
  if (!user) return;
  let status;
  try {
    status = await authApi.fetchSessionStatus(user.id);
  } catch {
    return;
  }
  if (status === "active") return;
  if (getState().auth.user?.id !== user.id) return; // already logged out / switched user meanwhile
  dispatch(logout());
  dispatch(
    showError(
      status === "missing"
        ? "This account no longer exists."
        : authApi.blockedMessage(status),
      "Signed out",
    ),
  );
};

export const { resetStatus } = authSlice.actions;
export default authSlice.reducer;
