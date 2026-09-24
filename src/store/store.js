import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducers/authSlice";
import productsReducer from "./reducers/productsSlice";
import ordersReducer from "./reducers/ordersSlice";
import wishlistReducer from "./reducers/wishlistSlice";
import adminReducer from "./reducers/adminSlice";
import reviewsReducer from "./reducers/reviewsSlice";
import couponsReducer from "./reducers/couponsSlice";
import profileReducer from "./reducers/profileSlice";
import notificationsReducer from "./reducers/notificationsSlice";
import cartReducer, { saveToLocalStorage } from "./reducers/cartSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    orders: ordersReducer,
    wishlist: wishlistReducer,
    admin: adminReducer,
    reviews: reviewsReducer,
    coupons: couponsReducer,
    profile: profileReducer,
    notifications: notificationsReducer,
  },
});

// Save the cart whenever it changes. Immer only creates a new `items` array on a real change.
let savedItems = store.getState().cart.items;
store.subscribe(() => {
  const { cart } = store.getState();
  if (cart.items !== savedItems) {
    savedItems = cart.items;
    saveToLocalStorage(cart);
  }
});

export default store;
