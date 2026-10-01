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
  },
);

export const fetchAddresses = createAsyncThunk(
  "profile/fetchAddresses",
  async (requestedUserId, { getState, rejectWithValue, signal }) => {
    const userId = getState().auth.user?.id;
    if (userId === undefined || !sameId(requestedUserId, userId)) {
      return rejectWithValue(
        "You can only load addresses for the signed-in customer.",
      );
    }
    try {
      const addresses = await profileApi.fetchAddresses(userId, signal);
      return addresses.filter((address) => belongsToUser(address, userId));
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const addAddress = createAsyncThunk(
  "profile/addAddress",
  async (addressData, { getState, rejectWithValue }) => {
    const userId = getState().auth.user?.id;
    if (userId === undefined)
      return rejectWithValue("Sign in before saving an address.");
    const addresses = getState().profile.addresses.filter((address) =>
      belongsToUser(address, userId),
    );
    const data = {
      ...pickAddressFields(addressData),
      userId,
      isDefault: Boolean(addressData.isDefault),
    };
    try {
      const save = () => profileApi.addAddress(data);
      return data.isDefault
        ? await saveAsDefault(addresses, null, save)
        : await save();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const updateAddress = createAsyncThunk(
  "profile/updateAddress",
  async ({ id, data }, { getState, rejectWithValue }) => {
    const userId = getState().auth.user?.id;
    const target = getState().profile.addresses.find(
      (address) => sameId(address.id, id) && belongsToUser(address, userId),
    );
    if (!target)
      return rejectWithValue("Address not found for the signed-in customer.");
    const patch = pickAddressFields(data);
    try {
      const save = () => profileApi.updateAddress(target.id, patch);
      return patch.isDefault === true
        ? await saveAsDefault(
            getState().profile.addresses.filter((address) =>
              belongsToUser(address, userId),
            ),
            target.id,
            save,
          )
        : await save();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const deleteAddress = createAsyncThunk(
  "profile/deleteAddress",
  async (id, { getState, rejectWithValue }) => {
    const userId = getState().auth.user?.id;
    const target = getState().profile.addresses.find(
      (address) => sameId(address.id, id) && belongsToUser(address, userId),
    );
    if (!target)
      return rejectWithValue("Address not found for the signed-in customer.");
    try {
      await profileApi.deleteAddress(target.id);
      return target.id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

// Only one address can be default at a time: unset whichever one currently is (if any and
// different), then set the target. Two requests, not a bulk endpoint — json-server has none.
export const setDefaultAddress = createAsyncThunk(
  "profile/setDefaultAddress",
  async (id, { getState, rejectWithValue }) => {
    const userId = getState().auth.user?.id;
    const addresses = getState().profile.addresses.filter((address) =>
      belongsToUser(address, userId),
    );
    const target = addresses.find((address) => sameId(address.id, id));
    if (!target)
      return rejectWithValue("Address not found for the signed-in customer.");
    try {
      return await saveAsDefault(addresses, target.id, () =>
        profileApi.updateAddress(target.id, { isDefault: true }),
      );
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
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
  },
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
const sameId = (a, b) => String(a) === String(b);
const belongsToUser = (address, userId) =>
  userId !== undefined &&
  userId !== null &&
  address?.userId !== undefined &&
  sameId(address.userId, userId);
const ADDRESS_FIELDS = [
  "name",
  "address",
  "city",
  "governorate",
  "postalCode",
  "phone",
  "isDefault",
];

const pickAddressFields = (data) =>
  Object.fromEntries(
    ADDRESS_FIELDS.filter((field) => Object.hasOwn(data, field)).map(
      (field) => [field, data[field]],
    ),
  );

async function saveAsDefault(addresses, targetId, save) {
  const previousDefaults = addresses.filter(
    (address) => address.isDefault && !sameId(address.id, targetId),
  );
  const cleared = [];

  try {
    for (const address of previousDefaults) {
      await profileApi.updateAddress(address.id, { isDefault: false });
      cleared.push(address);
    }
    return await save();
  } catch (error) {
    let rollbackFailed = false;
    for (const address of cleared) {
      try {
        await profileApi.updateAddress(address.id, { isDefault: true });
      } catch {
        rollbackFailed = true;
      }
    }
    if (rollbackFailed) {
      throw new Error(
        `${error.message} The previous default could not be restored; refresh addresses and retry.`,
      );
    }
    throw error;
  }
}

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
        if (payload.isDefault) {
          state.addresses = state.addresses.map((address) =>
            belongsToUser(address, payload.userId)
              ? { ...address, isDefault: false }
              : address,
          );
        }
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
        state.addresses = state.addresses.map((address) => {
          if (sameId(address.id, payload.id)) return payload;
          if (payload.isDefault && belongsToUser(address, payload.userId)) {
            return { ...address, isDefault: false };
          }
          return address;
        });
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
        state.deletingAddressIds = without(
          state.deletingAddressIds,
          action.meta.arg,
        );
        state.addresses = state.addresses.filter(
          (a) => a.id !== action.payload,
        );
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.deletingAddressIds = without(
          state.deletingAddressIds,
          action.meta.arg,
        );
        state.actionError = `Couldn't delete the address. ${errorOf(action)}`;
      })

      .addCase(setDefaultAddress.pending, (state, { meta }) => {
        state.settingDefaultIds.push(meta.arg);
        state.actionError = null;
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.settingDefaultIds = without(
          state.settingDefaultIds,
          action.meta.arg,
        );
        state.addresses = state.addresses.map((address) =>
          belongsToUser(address, action.payload.userId)
            ? { ...address, isDefault: sameId(address.id, action.payload.id) }
            : address,
        );
      })
      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.settingDefaultIds = without(
          state.settingDefaultIds,
          action.meta.arg,
        );
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

export const {
  resetSaveStatus,
  resetAddressSave,
  resetPasswordStatus,
  clearActionError,
} = profileSlice.actions;
export default profileSlice.reducer;
