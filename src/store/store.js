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
import emailReducer from "./reducers/emailSlice";
import paymentReducer from "./reducers/paymentSlice";
import sellerReducer from "./reducers/sellerSlice";
import cartReducer, { saveToLocalStorage } from "./reducers/cartSlice";
import bannersReducer from "./reducers/bannersSlice";
import homeReviewsReducer from "./reducers/homeReviewsSlice";
import chatReducer from "./reducers/chatSlice";
import languageReducer from "./reducers/languageSlice";
import { removeChat, setChat } from "../utils/localStorage";

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
    email: emailReducer,
    payment: paymentReducer,
    seller: sellerReducer,
    banners: bannersReducer,
    homeReviews: homeReviewsReducer,
    chat: chatReducer,
    language: languageReducer,
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

// Persist the chat whenever its messages change (an empty list removes the key, i.e. "clear").
let savedMessages = store.getState().chat.messages;
store.subscribe(() => {
  const { messages } = store.getState().chat;
  if (messages !== savedMessages) {
    savedMessages = messages;
    if (messages.length === 0) removeChat();
    else setChat(messages);
  }
});

export default store;
