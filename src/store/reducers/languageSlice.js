import { createSlice } from "@reduxjs/toolkit";
import { applyDirection } from "../../i18n/direction";
import { getStoredLanguage, isSupported, setCurrentLanguage, storeLanguage } from "../../i18n";

const languageSlice = createSlice({
  name: "language",
  initialState: { lang: getStoredLanguage() },
  reducers: {
    setLanguage(state, action) {
      if (isSupported(action.payload)) state.lang = action.payload;
    },
  },
});

export const { setLanguage } = languageSlice.actions;

// Persist, update <html lang/dir>, swap Bootstrap's stylesheet, then update state (instant re-render).
export const changeLanguage = (code) => (dispatch) => {
  if (!isSupported(code)) return;
  storeLanguage(code);
  setCurrentLanguage(code);
  applyDirection(code);
  dispatch(setLanguage(code));
};

// Called once before the first render.
export const initLanguage = () => {
  const code = getStoredLanguage();
  setCurrentLanguage(code);
  return applyDirection(code);
};

export default languageSlice.reducer;
