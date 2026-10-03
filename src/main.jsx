import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles/theme.css";
import "./styles/responsive.css";
import "./styles/rtl.css";
import store from "./store/store";
import { validateSession } from "./store/reducers/authSlice";
import router from "./router/router";
import ToastContainer from "./components/notifications/Toast";
import { initLanguage } from "./store/reducers/languageSlice";

store.dispatch(validateSession()); // sign out a stored user who has since been restricted or deleted

// Set <html lang/dir> and load the matching Bootstrap build (LTR/RTL) before the first paint.
initLanguage().then(() => {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <Provider store={store}>
        <RouterProvider router={router} />
        <ToastContainer />
      </Provider>
    </StrictMode>
  );
});
