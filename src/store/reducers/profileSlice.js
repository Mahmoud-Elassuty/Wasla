import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as profileApi from "../../api/profileApi";
import { authSlice } from "./authSlice";
import { setAuthUser } from "../../utils/localStorage";

// Saves the changed fields, then syncs the same update into authSlice + localStorage so the
// navbar and everything else reading `auth.user` picks it up immediately — mirrors what
// authSlice.login already does on sign-in.
export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async (data, { getState, dispatch, rejectWithValue }) => {
    const current = getState().auth.user;
    try {
      const updated = await profileApi.updateProfile(current.id, data);
      const merged = { ...current, ...updated };
      setAuthUser(merged);
      dispatch(authSlice.actions.setUser(merged));
      return merged;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchAddresses = createAsyncThunk(
  "profile/fetchAddresses",
  async (userId, { rejectWithValue, signal }) => {
    try {
      return await profileApi.fetchAddresses(userId, signal);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addAddress = createAsyncThunk(
  "profile/addAddress",
  async (addressData, { getState, rejectWithValue }) => {
    const userId = getState().auth.user?.id;
    try {
      return await profileApi.addAddress({ ...addressData, userId, isDefault: addressData.isDefault ?? false });
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateAddress = createAsyncThunk(
  "profile/updateAddress",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await profileApi.updateAddress(id, data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteAddress = createAsyncThunk("profile/deleteAddress", async (id, { rejectWithValue }) => {
  try {
    await profileApi.deleteAddress(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Only one address can be default at a time: unset whichever one currently is (if any and
// different), then set the target. Two requests, not a bulk endpoint — json-server has none.
export const setDefaultAddress = createAsyncThunk(
  "profile/setDefaultAddress",
  async (id, { getState, rejectWithValue }) => {
    const { addresses } = getState().profile;
    const target = addresses.find((a) => a.id === id);
    if (!target) return rejectWithValue("Address not found.");
    const prevDefault = addresses.find((a) => a.isDefault && a.id !== id);
    try {
      if (prevDefault) await profileApi.updateAddress(prevDefault.id, { ...prevDefault, isDefault: false });
      return await profileApi.updateAddress(id, { ...target, isDefault: true });
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const changePassword = createAsyncThunk(
  "profile/changePassword",
  async ({ currentPassword, newPassword }, { getState, rejectWithValue }) => {
    const userId = getState().auth.user?.id;
    try {
      await profileApi.changePassword({ userId, currentPassword, newPassword });
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  saveStatus: "idle", // idle | loading | succeeded | failed — profile info form
  saveError: null,

  addresses: [],
  addressesStatus: "idle", // idle | loading | succeeded | failed — the list itself
  addressesError: null,
  addressSaveStatus: "idle", // idle | loading | succeeded | failed — add/edit address form
  addressSaveError: null,
  deletingAddressIds: [],
  settingDefaultIds: [],
  actionError: null, // last failed delete/set-default, shown as a dismissible notice

  passwordStatus: "idle", // idle | loading | succeeded | failed
  passwordError: null,
};

const errorOf = ({ payload, error }) => payload ?? error.message;
const without = (list, value) => list.filter((v) => v !== value);

export const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
    resetAddressSave(state) {
      state.addressSaveStatus = "idle";
      state.addressSaveError = null;
    },
    resetPasswordStatus(state) {
      state.passwordStatus = "idle";
      state.passwordError = null;
    },
    clearActionError(state) {
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authSlice.actions.clearUser, () => initialState) // logout: drop everyone's data

      .addCase(updateProfile.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(updateProfile.fulfilled, (state) => {
        state.saveStatus = "succeeded";
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = errorOf(action);
      })

      .addCase(fetchAddresses.pending, (state) => {
        state.addressesStatus = "loading";
        state.addressesError = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, { payload }) => {
        state.addressesStatus = "succeeded";
        state.addresses = payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.addressesStatus = "failed";
        state.addressesError = errorOf(action);
      })

      .addCase(addAddress.pending, (state) => {
        state.addressSaveStatus = "loading";
        state.addressSaveError = null;
      })
      .addCase(addAddress.fulfilled, (state, { payload }) => {
        state.addressSaveStatus = "succeeded";
        state.addresses.push(payload);
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.addressSaveStatus = "failed";
        state.addressSaveError = errorOf(action);
      })

      .addCase(updateAddress.pending, (state) => {
        state.addressSaveStatus = "loading";
        state.addressSaveError = null;
      })
      .addCase(updateAddress.fulfilled, (state, { payload }) => {
        state.addressSaveStatus = "succeeded";
        state.addresses = state.addresses.map((a) => (a.id === payload.id ? payload : a));
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.addressSaveStatus = "failed";
        state.addressSaveError = errorOf(action);
      })

      .addCase(deleteAddress.pending, (state, { meta }) => {
        state.deletingAddressIds.push(meta.arg);
        state.actionError = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.deletingAddressIds = without(state.deletingAddressIds, action.meta.arg);
        state.addresses = state.addresses.filter((a) => a.id !== action.payload);
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.deletingAddressIds = without(state.deletingAddressIds, action.meta.arg);
        state.actionError = `Couldn't delete the address. ${errorOf(action)}`;
      })

      .addCase(setDefaultAddress.pending, (state, { meta }) => {
        state.settingDefaultIds.push(meta.arg);
        state.actionError = null;
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.settingDefaultIds = without(state.settingDefaultIds, action.meta.arg);
        state.addresses = state.addresses.map((a) => ({ ...a, isDefault: a.id === action.payload.id }));
      })
      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.settingDefaultIds = without(state.settingDefaultIds, action.meta.arg);
        state.actionError = `Couldn't set the default address. ${errorOf(action)}`;
      })

      .addCase(changePassword.pending, (state) => {
        state.passwordStatus = "loading";
        state.passwordError = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.passwordStatus = "succeeded";
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordStatus = "failed";
        state.passwordError = errorOf(action);
      });
  },
});

export const { resetSaveStatus, resetAddressSave, resetPasswordStatus, clearActionError } = profileSlice.actions;
export default profileSlice.reducer;
