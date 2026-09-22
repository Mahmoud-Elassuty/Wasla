const KEYS = { user: "wasla_user", cart: "wasla_cart" };

const read = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // corrupted JSON or storage blocked
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable */
  }
};

const remove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
};

export const getAuthUser = () => read(KEYS.user);
export const setAuthUser = (user) => write(KEYS.user, user);
export const removeAuthUser = () => remove(KEYS.user);

export const getCart = () => read(KEYS.cart);
export const setCart = (cart) => write(KEYS.cart, cart);
export const removeCart = () => remove(KEYS.cart);
