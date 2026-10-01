import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminUsers, resetUsersStatus } from "../../store/reducers/adminSlice";
import UsersTable from "../../components/admin/UsersTable";
import { ROLE_LABELS, STATUS_LABELS, USER_ROLES, USER_STATUSES, getUserStatus, matchesUserSearch } from "../../utils/users";

export default function Users() {
  const dispatch = useDispatch();
  const { users, usersStatus, usersError } = useSelector((s) => s.admin);
  const [params, setParams] = useSearchParams();

  // Filters live in the URL (same as Admin Orders), so a filtered view survives a refresh.
  const role = USER_ROLES.includes(params.get("role")) ? params.get("role") : "all";
  const status = USER_STATUSES.includes(params.get("status")) ? params.get("status") : "all";
  const search = params.get("search") ?? "";

  useEffect(() => {
    const request = dispatch(fetchAdminUsers());
    return () => {
      request.abort();
      dispatch(resetUsersStatus());
    };
  }, [dispatch]);

  const setParam = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== "all") next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );

  const visible = useMemo(
    () =>
      users.filter(
        (u) =>
          (role === "all" || u.role === role) &&
          (status === "all" || getUserStatus(u) === status) &&
          matchesUserSearch(u, search)
      ),
    [users, role, status, search]
  );

  const hasUsers = users.length > 0;
  const loading = !hasUsers && (usersStatus === "idle" || usersStatus === "loading");
  const failed = !hasUsers && usersStatus === "failed";
  const filtered = search.trim() !== "" || role !== "all" || status !== "all";

  return (
    <>
      <div className="mb-4">
        <p className="eyebrow mb-1">Users management</p>
        <h1 className="h3 mb-1">User Management</h1>
        {hasUsers && (
          <p className="small text-secondary mb-0">
            Showing {visible.length} of {users.length} users
          </p>
        )}
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-6 col-lg-4">
          <div className="search-box">
            <input
              type="search"
              className="form-control"
              placeholder="Search by name or email"
              aria-label="Search users"
              value={search}
              onChange={(e) => setParam("search", e.target.value)}
            />
          </div>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <select
            className="form-select"
            aria-label="Filter by role"
            value={role}
            onChange={(e) => setParam("role", e.target.value)}
          >
            <option value="all">All roles</option>
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <select
            className="form-select"
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setParam("status", e.target.value)}
          >
            <option value="all">All statuses</option>
            {USER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {failed ? (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{usersError || "We couldn't load the users."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchAdminUsers())}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="admin-card p-4 placeholder-glow" aria-busy="true" aria-label="Loading users">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="placeholder d-block col-12 mb-3" style={{ height: 24 }} />
          ))}
        </div>
      ) : (
        <UsersTable users={visible} emptyMessage={filtered ? "No users match your filters." : "No users yet."} />
      )}
    </>
  );
}
