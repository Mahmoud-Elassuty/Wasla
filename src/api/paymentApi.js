import { request } from "./http";

const DELAY_MIN_MS = 2000;
const DELAY_MAX_MS = 3000;
const SUCCESS_RATE = 0.9; // 90% success, so the failure path is actually testable

const randomDelay = () =>
  new Promise((resolve) => setTimeout(resolve, DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS)));

const makeTransactionId = () =>
  `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// Simulates a gateway authorization. `orderId` isn't known yet at this point (the order is only
// created after payment succeeds), so every attempt — including failed ones, useful for admin
// visibility — is logged with `orderId: null` and linked afterwards via linkPaymentToOrder.
export async function processPayment({ method, amount }) {
  await randomDelay();
  const success = Math.random() < SUCCESS_RATE;

  const record = {
    method,
    amount,
    orderId: null,
    status: success ? "success" : "failed",
    transactionId: success ? makeTransactionId() : null,
    timestamp: new Date().toISOString(),
  };

  const saved = await request("/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });

  if (!success) {
    const error = new Error("Payment declined. Please check your details or try another method.");
    error.payment = saved;
    throw error;
  }
  return saved;
}

export function linkPaymentToOrder(paymentId, orderId) {
  return request(`/payments/${paymentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
}
