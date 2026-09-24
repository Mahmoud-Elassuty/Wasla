import { useDispatch, useSelector } from "react-redux";
import { clearAll, markAllAsRead, markAsRead, removeNotification } from "../../store/reducers/notificationsSlice";
import "../../styles/notifications.css";

const TYPE_ICON = {
  success: "bi-check-circle-fill",
  error: "bi-x-circle-fill",
  warning: "bi-exclamation-triangle-fill",
  info: "bi-info-circle-fill",
};

// Short relative time ("just now", "5m ago", "3h ago"); falls back to a plain date further out.
function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell() {
  const dispatch = useDispatch();
  const { items, unreadCount } = useSelector((s) => s.notifications);

  return (
    <div className="dropdown notification-bell">
      <button
        type="button"
        className="icon-btn position-relative bg-transparent border-0 p-0"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        <i className="bi bi-bell" />
        {unreadCount > 0 && (
          <span className="badge rounded-pill bg-accent notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <div className="dropdown-menu dropdown-menu-end notification-dropdown">
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <span className="fw-semibold small">Notifications</span>
          <div className="d-flex gap-3">
            <button
              type="button"
              className="btn btn-link btn-sm p-0"
              disabled={unreadCount === 0}
              onClick={() => dispatch(markAllAsRead())}
            >
              Mark all as read
            </button>
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-danger"
              disabled={items.length === 0}
              onClick={() => dispatch(clearAll())}
            >
              Clear all
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-secondary small text-center py-4 mb-0">No notifications yet</p>
        ) : (
          <ul className="list-unstyled mb-0 notification-list">
            {items.map((n) => (
              <li
                key={n.id}
                className={`notification-row type-${n.type}${n.read ? "" : " unread"}`}
                onClick={() => !n.read && dispatch(markAsRead(n.id))}
                role="button"
              >
                <i className={`bi ${TYPE_ICON[n.type] ?? TYPE_ICON.info} notification-row-icon`} aria-hidden="true" />
                <div className="flex-grow-1 min-w-0">
                  {n.title && <div className="small fw-semibold">{n.title}</div>}
                  <div className="small text-truncate">{n.message}</div>
                  <div className="small text-secondary">{timeAgo(n.createdAt)}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-secondary"
                  aria-label="Remove notification"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(removeNotification(n.id));
                  }}
                >
                  <i className="bi bi-x" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
