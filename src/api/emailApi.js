import { request } from "./http";
import { formatPrice } from "../utils/format";
import { orderNumber } from "../utils/checkout";

const SIMULATED_DELAY_MS = 1500; // json-server can't actually send mail, so this just mimics real latency
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function send(email) {
  await delay(SIMULATED_DELAY_MS);
  return request("/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...email, sentAt: new Date().toISOString(), status: "sent" }),
  });
}

export function sendOrderConfirmation(order) {
  return send({
    to: order.customer.email,
    subject: `Order Confirmation #${orderNumber(order.id)}`,
    type: "order_confirmation",
    orderId: order.id,
    body:
      `Hi ${order.customer.name},\n\nThanks for your order! We've received order #${orderNumber(order.id)} ` +
      `for ${formatPrice(order.total)} and it's being prepared for delivery to ${order.shippingAddress.city}, ` +
      `${order.shippingAddress.governorate}.\n\nWe'll be in touch at ${order.customer.phone} to confirm delivery.`,
  });
}

export function sendPasswordReset(email) {
  return send({
    to: email,
    subject: "Reset your wasla password",
    type: "password_reset",
    body:
      `We received a request to reset the password for ${email}.\n\n` +
      "This is a mock email — no real reset link is sent, and your password hasn't been changed.",
  });
}

export function sendWelcomeEmail(user) {
  return send({
    to: user.email,
    subject: "Welcome to wasla! (وصلة)",
    type: "welcome",
    body:
      `Hi ${user.name},\n\nWelcome to wasla! Your account is ready — start browsing to find deals across ` +
      "electronics, fashion, home and more.",
  });
}

export function fetchEmails(signal) {
  return request("/emails?_sort=sentAt&_order=desc", { signal });
}
