const KEYS = { user: "wasla_user", cart: "wasla_cart", recentSearches: "wasla_recent_searches" };

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

const RECENT_SEARCHES_LIMIT = 5;
export const getRecentSearches = () => read(KEYS.recentSearches) ?? [];
// Most recent first, de-duplicated (case-insensitive), capped at RECENT_SEARCHES_LIMIT.
export const addRecentSearch = (query) => {
  const trimmed = query.trim();
  if (!trimmed) return getRecentSearches();
  const existing = getRecentSearches().filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
  const next = [trimmed, ...existing].slice(0, RECENT_SEARCHES_LIMIT);
  write(KEYS.recentSearches, next);
  return next;
};
export const clearRecentSearches = () => remove(KEYS.recentSearches);
