// Admin user management. Users are never physically deleted (soft-delete model):
//   active     - can log in and use their role's pages (a missing `status` counts as active,
//                because the seeded admin/customer have no status field and login already allows them)
//   restricted - blocked from logging in and from continuing an existing session
//   deleted    - soft-deleted: the record stays for history, but the user is blocked like "restricted"
export const USER_STATUSES = ["active", "restricted", "deleted"];
export const USER_ROLES = ["customer", "seller", "admin"];

export const getUserStatus = (user) => user?.status ?? "active";

export const STATUS_LABELS = { active: "Active", restricted: "Restricted", deleted: "Deleted" };
// Same pill classes the other admin tables already use (Active / Inactive / out of stock).
export const STATUS_TONE = { active: "stock-ok", restricted: "stock-low", deleted: "stock-out" };
export const ROLE_LABELS = { customer: "Customer", seller: "Seller", admin: "Admin" };

export const SELF_ACTION_MESSAGE = "You can't change your own account status.";

// Case-insensitive match on name or email.
export const matchesUserSearch = (user, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [user.name, user.email].some((v) => typeof v === "string" && v.toLowerCase().includes(q));
};
