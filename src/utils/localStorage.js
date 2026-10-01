const KEYS = { user: "wasla_user", cart: "wasla_cart", recentSearches: "wasla_recent_searches", chat: "wasla_chat" };

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

// Chat history: only well-formed { id, role, content } messages survive a reload.
export const CHAT_MAX_MESSAGES = 50;
export const getChat = () => {
  const saved = read(KEYS.chat);
  if (!Array.isArray(saved)) return [];
  return saved
    .filter(
      (m) =>
        m != null &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim() !== "" &&
        (typeof m.id === "string" || typeof m.id === "number")
    )
    .map(({ id, role, content, createdAt }) => ({
      id,
      role,
      content,
      createdAt: typeof createdAt === "string" ? createdAt : null,
    }))
    .slice(-CHAT_MAX_MESSAGES);
};
export const setChat = (messages) => write(KEYS.chat, messages);
export const removeChat = () => remove(KEYS.chat);

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
