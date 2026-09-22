import { request } from "./http";

// Never keep the password in app state or localStorage.
const withoutPassword = ({ password: _password, ...user }) => user;

export async function login(email, password) {
  const query = new URLSearchParams({ email: email.trim().toLowerCase(), password });
  const [found] = await request(`/users?${query}`);
  if (!found) throw new Error("Invalid email or password");
  if (found.status && found.status !== "active") {
    throw new Error("This account is not active. Contact support.");
  }
  return withoutPassword(found);
}

export async function register({ name, email, password }) {
  const normalized = email.trim().toLowerCase();
  const existing = await request(`/users?email=${encodeURIComponent(normalized)}`);
  if (existing.length) throw new Error("This email is already registered");

  const created = await request("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name.trim(),
      email: normalized,
      password,
      role: "customer", // public sign-up is always a customer
      status: "active",
      createdAt: new Date().toISOString(),
    }),
  });
  return withoutPassword(created);
}
