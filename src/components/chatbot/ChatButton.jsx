import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { openChat } from "../../store/reducers/chatSlice";
import "../../styles/chatbot.css";

// Floating launcher. Hidden while the window is open; focus returns to it when the window closes.
export default function ChatButton() {
  const dispatch = useDispatch();
  const isOpen = useSelector((s) => s.chat.isOpen);
  const buttonRef = useRef(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!isOpen && wasOpen.current) buttonRef.current?.focus();
    wasOpen.current = isOpen;
  }, [isOpen]);

  if (isOpen) return null;

  return (
    <button
      ref={buttonRef}
      type="button"
      className="chat-fab"
      aria-label="Open Wasla Assistant chat / افتح مساعد وصلة"
      title="Wasla Assistant"
      onClick={() => dispatch(openChat())}
    >
      <i className="bi bi-chat-dots-fill" aria-hidden="true" />
    </button>
  );
}
