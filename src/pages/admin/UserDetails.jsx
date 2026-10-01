import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminUsers, resetUsersStatus } from "../../store/reducers/adminSlice";
import { fetchUserAddresses } from "../../api/adminApi";
import UserActions from "../../components/admin/UserActions";
import { UserStatusBadge } from "../../components/admin/UsersTable";
import { formatOrderDate } from "../../utils/checkout";
import { ROLE_LABELS, SELF_ACTION_MESSAGE, getUserStatus } from "../../utils/users";

const BackLink = () => (
  <Link to="/admin/users" className="btn btn-outline-secondary">
    <i className="bi bi-arrow-left me-1" aria-hidden="true" />
    Back to users
  </Link>
);

const Field = ({ label, children }) => (
  <div className="row py-2 border-bottom">
    <dt className="col-sm-4 fw-normal text-secondary">{label}</dt>
    <dd className="col-sm-8 mb-0 text-break">{children || "-"}</dd>
  </div>
);

function Addresses({ userId }) {
  const [state, setState] = useState({ status: "loading", items: [] });

  useEffect(() => {
    const controller = new AbortController();
    fetchUserAddresses(userId, controller.signal)
      .then((items) => setState({ status: "done", items }))
      .catch((err) => {
        if (err.name !== "AbortError") setState({ status: "failed", items: [] });
      });
    return () => controller.abort();
  }, [userId]);

  if (state.status === "loading") return <p className="text-secondary small mb-0">Loading addresses...</p>;
  if (state.status === "failed") return <p className="text-secondary small mb-0">Couldn't load saved addresses.</p>;
  if (state.items.length === 0) return <p className="text-secondary small mb-0">No saved addresses.</p>;

  return (
    <ul className="list-unstyled mb-0">
      {state.items.map((a) => (
        <li key={a.id} className="py-2 border-bottom">
          <div className="fw-semibold">
            {a.name || "-"}
            {a.isDefault && <span className="badge text-bg-light border ms-2">Default</span>}
          </div>
          <div className="small">{[a.address, a.city, a.governorate, a.postalCode].filter(Boolean).join(", ") || "-"}</div>
          <div className="small text-secondary">{a.phone || "-"}</div>
        </li>
      ))}
    </ul>
  );
}

export default function UserDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { users, usersStatus, usersError } = useSelector((s) => s.admin);
  const currentUserId = useSelector((s) => s.auth.user?.id);

  useEffect(() => {
    const request = dispatch(fetchAdminUsers());
    return () => {
      request.abort();
      dispatch(resetUsersStatus());
    };
  }, [dispatch]);

  const user = users.find((u) => String(u.id) === String(id));

  if (!user) {
    if (usersStatus === "failed") {
      return (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{usersError || "We couldn't load this user."}</span>
          <span className="d-flex gap-2">
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchAdminUsers())}>
              Try again
            </button>
            <BackLink />
          </span>
        </div>
      );
    }
    if (usersStatus === "succeeded") {
      return (
        <div className="py-5 text-center">
          <h1 className="h4">We couldn't find this user</h1>
          <p className="text-secondary">The user may not exist, or the link is incorrect.</p>
          <BackLink />
        </div>
      );
    }
    return (
      <div className="py-5 text-center" role="status">
        <div className="spinner-border text-primary" />
        <span className="visually-hidden">Loading user...</span>
      </div>
    );
  }

  const status = getUserStatus(user);
  const isSelf = String(user.id) === String(currentUserId);

  return (
    <>
      <div className="mb-3">
        <BackLink />
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="eyebrow mb-1">User details</p>
          <h1 className="h3 mb-1">{user.name || "-"}</h1>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <UserStatusBadge user={user} />
            <span className="small text-secondary">{ROLE_LABELS[user.role] ?? user.role ?? "-"}</span>
            {isSelf && <span className="badge text-bg-light border">You</span>}
          </div>
        </div>
        <div>
          <UserActions user={user} />
          {isSelf && <div className="small text-secondary mt-2">{SELF_ACTION_MESSAGE}</div>}
        </div>
      </div>

      {status !== "active" && (
        <div className="alert alert-warning" role="status">
          {status === "restricted"
            ? "This account is restricted: the user can't log in, and any open session is signed out on its next check."
            : "This account is soft-deleted: the record is kept for history, and the user can't log in. Restore it to reactivate."}
        </div>
      )}

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="admin-card p-4 h-100">
            <h2 className="h5 mb-3">Account</h2>
            <dl className="mb-0">
              <Field label="Name">{user.name}</Field>
              <Field label="Email">{user.email}</Field>
              <Field label="Phone">{user.phone}</Field>
              <Field label="Role">{ROLE_LABELS[user.role] ?? user.role}</Field>
              <Field label="Status">
                <UserStatusBadge user={user} />
              </Field>
              <Field label="User ID">{String(user.id)}</Field>
              <Field label="Joined">{user.createdAt ? formatOrderDate(user.createdAt, true) : ""}</Field>
            </dl>
          </div>
        </div>

        <div className="col-lg-6">
          {user.role === "seller" && (
            <div className="admin-card p-4 mb-3">
              <h2 className="h5 mb-3">Store</h2>
              <dl className="mb-0">
                <Field label="Store name">{user.storeName}</Field>
                <Field label="Description">{user.storeDescription}</Field>
              </dl>
            </div>
          )}
          <div className="admin-card p-4">
            <h2 className="h5 mb-3">Saved addresses</h2>
            <Addresses userId={user.id} />
          </div>
        </div>
      </div>
    </>
  );
}
