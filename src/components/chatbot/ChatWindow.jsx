import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearChat, closeChat, sendChatMessage } from "../../store/reducers/chatSlice";
import "../../styles/chatbot.css";
import { useT } from "../../i18n/useT";

const MAX_LENGTH = 1000;

const SUGGESTIONS = [
  "How do I track my order?",
  "How do coupons work?",
  "Can I check out without an account?",
];

// Friendly in-chat text per error code from huggingFaceApi.js (Arabic + English, no secrets).
const ERROR_TEXT = {
  no_token:
    "The Hugging Face token isn't configured. Set it locally in your browser, then try again:\n" +
    'localStorage.setItem("hf_access_token", "YOUR_REAL_TOKEN")',
  invalid_token:
    "The Hugging Face token was rejected. Check that it is valid and has Inference Providers access.",
  rate_limit:
    "Too many requests right now. Please wait a moment and try again.",
  model_unavailable:
    "The assistant's model is unavailable right now. Please try again later.",
  network:
    "Couldn't reach the assistant. Check your connection and try again.",
  empty:
    "The assistant sent an empty reply. Try rephrasing your question.",
  unknown:
    "Something went wrong. Please try again.",
};

export default function ChatWindow() {
  const { t } = useT();
  const dispatch = useDispatch();
  const { messages, isOpen, status, error } = useSelector((s) => s.chat);
  const [draft, setDraft] = useState("");
  const [confirmingClear, setConfirmingClear] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const loading = status === "loading";
  const canSend = draft.trim() !== "" && !loading;

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Keep the newest message (or the thinking / error bubble) in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loading, error, isOpen]);

  if (!isOpen) return null;

  const send = (text) => {
    const value = text.trim();
    if (!value || loading) return;
    dispatch(sendChatMessage(value));
    setDraft("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(draft);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(draft);
    }
  };

  const handleWindowKeyDown = (e) => {
    if (e.key === "Escape") dispatch(closeChat());
  };

  return (
    <section
      className="chat-window"
      role="dialog"
      aria-label={t("Wasla Assistant")}
      onKeyDown={handleWindowKeyDown}
    >
      <header className="chat-header d-flex align-items-center gap-2 px-3 py-2">
        <i className="bi bi-chat-dots-fill" aria-hidden="true" />
        <h2 className="h6 mb-0 flex-grow-1">
          {t("Wasla Assistant")}
        </h2>
        {messages.length > 0 && !confirmingClear && (
          <button
            type="button"
            className="btn btn-sm"
            aria-label={t("Clear conversation")}
            title={t("Clear conversation")}
            onClick={() => setConfirmingClear(true)}
          >
            <i className="bi bi-trash3" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          className="btn btn-sm"
          aria-label={t("Close chat")}
          title={t("Close chat")}
          onClick={() => dispatch(closeChat())}
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </header>

      {confirmingClear && (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-2 bg-white border-bottom small">
          <span>{t("Clear this conversation?")}</span>
          <span className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => {
                dispatch(clearChat());
                setConfirmingClear(false);
                inputRef.current?.focus();
              }}
            >
              {t("Clear")}
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmingClear(false)}>
              {t("Cancel")}
            </button>
          </span>
        </div>
      )}

      <div ref={listRef} className="chat-messages p-3" role="log" aria-live="polite" aria-label={t("Conversation")}>
        {messages.length === 0 && !loading && !error ? (
          <div className="text-center text-secondary py-3">
            <i className="bi bi-stars fs-2 text-accent" aria-hidden="true" />
            <p className="fw-semibold text-body mt-2 mb-1">{t("Welcome to wasla! 👋")}</p>
            <p className="small mb-3">
              {t("Hi! Ask me about products, your cart, checkout, coupons or tracking an order.")}
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => send(t(s))}>
                  {t(s)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {messages.map((m) => (
              <div key={m.id} className={`d-flex ${m.role === "user" ? "justify-content-end" : "justify-content-start"}`}>
                <div className={`chat-bubble ${m.role}`} dir="auto">
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="d-flex justify-content-start" role="status">
                <div className="chat-bubble assistant text-secondary">
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  {t("Thinking…")}
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="d-flex justify-content-start" role="alert">
                <div className="chat-bubble error" dir="auto">
                  {t(ERROR_TEXT[error] ?? ERROR_TEXT.unknown)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="d-flex align-items-end gap-2 p-2 bg-white border-top" noValidate>
        <label htmlFor="chat-input" className="visually-hidden">
          {t("Message")}
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          className="form-control chat-input"
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder={t("Type a message…")}
          dir="auto"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" className="btn btn-accent" disabled={!canSend} aria-label={t("Send")}>
          <i className="bi bi-send-fill" aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}
