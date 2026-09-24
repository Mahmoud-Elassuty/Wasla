import { addNotification } from "../store/reducers/notificationsSlice";

// These return a plain action (from addNotification) rather than dispatching themselves — this
// codebase always dispatches through `useDispatch()` in components/thunks, with no direct-store-
// import pattern anywhere, so callers do `dispatch(showSuccess("..."))` to actually fire one.
export const showSuccess = (message, title) => addNotification({ type: "success", message, title });
export const showError = (message, title) => addNotification({ type: "error", message, title });
export const showWarning = (message, title) => addNotification({ type: "warning", message, title });
export const showInfo = (message, title) => addNotification({ type: "info", message, title });
