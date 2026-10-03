import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import UserActions from "./UserActions";
import { formatOrderDate } from "../../utils/checkout";
import { ROLE_LABELS, STATUS_LABELS, STATUS_TONE, getUserStatus } from "../../utils/users";
import { useT } from "../../i18n/useT";

export function UserStatusBadge({ user }) {
  const status = getUserStatus(user);
  return (
    <span className={`badge rounded-pill ${STATUS_TONE[status] ?? "stock-low"}`}>{te("userstatus", status) ?? status}</span>
  );
}

// Passwords never reach this component: adminApi strips them before users enter Redux.
export default function UsersTable({ users, emptyMessage }) {
  const { t, te } = useT();
  const currentUserId = useSelector((s) => s.auth.user?.id);

  return (
    <div className="admin-card">
      <div className="table-responsive">
        <table className="table admin-table align-middle mb-0">
          <thead>
            <tr>
              <th>{t("User")}</th>
              <th>{t("Role")}</th>
              <th>{t("Store")}</th>
              <th>{t("Status")}</th>
              <th>{t("Joined")}</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="fw-semibold">
                    {user.name || "-"}
                    {String(user.id) === String(currentUserId) && (
                      <span className="badge text-bg-light border ms-2">{t("You")}</span>
                    )}
                  </div>
                  <div className="small text-secondary text-break">{user.email || "-"}</div>
                  {user.phone && <div className="small text-secondary">{user.phone}</div>}
                </td>
                <td>{ROLE_LABELS[user.role] ?? user.role ?? "-"}</td>
                <td>{user.storeName || "-"}</td>
                <td>
                  <UserStatusBadge user={user} />
                </td>
                <td className="text-nowrap">{user.createdAt ? formatOrderDate(user.createdAt) : "-"}</td>
                <td className="text-nowrap">
                  <span className="d-inline-flex flex-wrap align-items-center gap-2">
                    <Link
                      to={`/admin/users/${user.id}`}
                      className="btn btn-sm btn-outline-secondary"
                      aria-label={`View ${user.name || user.email}`}
                    >
                      {t("View")}
                    </Link>
                    <UserActions user={user} />
                  </span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-secondary py-5">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
