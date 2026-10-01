import { createSlice } from "@reduxjs/toolkit";
import { generateText } from "../../api/huggingFaceApi";
import { CHAT_MAX_MESSAGES, getChat } from "../../utils/localStorage";

const HISTORY_LIMIT = 10; // prior messages sent to the model with each request
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// The token is never part of this state; the API helper reads it from localStorage per request.
const initialState = {
  messages: getChat(), // { id, role: "user" | "assistant", content, createdAt }
  isOpen: false,
  status: "idle", // idle | loading
  error: null, // error code from the helper (no_token, invalid_token, ...), shown as a bubble
  pendingId: null, // id of the user message being answered, so a late reply after "clear" is dropped
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    openChat(state) {
      state.isOpen = true;
    },
    closeChat(state) {
      state.isOpen = false;
    },
    toggleChat(state) {
      state.isOpen = !state.isOpen;
    },
    userMessageAdded: {
      reducer(state, { payload }) {
        state.messages.push(payload);
        state.messages = state.messages.slice(-CHAT_MAX_MESSAGES);
        state.status = "loading";
        state.error = null;
        state.pendingId = payload.id;
      },
      prepare: (content) => ({
        payload: { id: newId(), role: "user", content, createdAt: new Date().toISOString() },
      }),
    },
    assistantMessageAdded: {
      reducer(state, { payload }) {
        if (state.pendingId !== payload.forId) return; // conversation was cleared meanwhile
        const { forId, ...message } = payload; // eslint-disable-line no-unused-vars
        state.messages.push(message);
        state.messages = state.messages.slice(-CHAT_MAX_MESSAGES);
        state.status = "idle";
        state.pendingId = null;
      },
      prepare: (content, forId) => ({
        payload: { id: newId(), role: "assistant", content, createdAt: new Date().toISOString(), forId },
      }),
    },
    chatFailed(state, { payload: { code, forId } }) {
      if (state.pendingId !== forId) return;
      state.status = "idle";
      state.error = code;
      state.pendingId = null;
    },
    clearChat(state) {
      state.messages = [];
      state.status = "idle";
      state.error = null;
      state.pendingId = null;
    },
  },
});

export const { openChat, closeChat, toggleChat, clearChat } = chatSlice.actions;
const { userMessageAdded, assistantMessageAdded, chatFailed } = chatSlice.actions;

// Only real prior turns go to the model; the new prompt is passed separately.
const toHistory = (messages) => messages.slice(-HISTORY_LIMIT).map(({ role, content }) => ({ role, content }));

// Thunk: blank text and a second send while a reply is pending are ignored.
export const sendChatMessage = (text) => async (dispatch, getState) => {
  const prompt = typeof text === "string" ? text.trim() : "";
  const { messages, status } = getState().chat;
  if (!prompt || status === "loading") return;

  const history = toHistory(messages);
  const action = dispatch(userMessageAdded(prompt));
  const forId = action.payload.id;
  try {
    const reply = await generateText(history, prompt);
    dispatch(assistantMessageAdded(reply, forId));
  } catch (err) {
    dispatch(chatFailed({ code: err?.code ?? "unknown", forId }));
  }
};

export default chatSlice.reducer;
