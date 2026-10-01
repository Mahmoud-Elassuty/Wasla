// Client-side Hugging Face helper (router / Inference Providers).
//
// SECURITY: the access token is never written in source. It is read at call time from
// localStorage["hf_access_token"] and only ever sent in the Authorization header. It is not kept
// in Redux, db.json, chat history, logs or UI text. Configure it locally in the browser console:
//   localStorage.setItem("hf_access_token", "YOUR_REAL_TOKEN")
// The key NAME is a fixed, non-secret string. A real token is only ever the VALUE stored under it.
export const HF_TOKEN_STORAGE_KEY = "hf_access_token";
export const HF_TOKEN_PLACEHOLDER = "YOUR_HF_ACCESS_TOKEN_HERE"; // "not configured" marker, keep as is

export const HF_CONFIG = {
  chatEndpoint: "https://router.huggingface.co/v1/chat/completions",
  textModel: "openai/gpt-oss-120b",
  visionModel: "zai-org/GLM-4.5V",
  imageModel: "black-forest-labs/FLUX.1-dev",
  imageProvider: "fal-ai",
  imageProviderModel: "fal-ai/flux/dev",
  imageEndpoint: "https://router.huggingface.co/fal-ai/fal-ai/flux/dev",
};

export const WASLA_SYSTEM_PROMPT = [
  "You are Wasla Assistant (مساعد وصلة), the shopping helper of Wasla, an online marketplace with customers, sellers and admins.",
  "Reply in the same language the user writes in (Arabic or English). Be concise: a few short sentences or a short list.",
  "You can help people browse products and categories, and explain in general terms how the cart, checkout, payment, coupons and order tracking work. Checkout is available to guests too, and signed-in customers can see their orders under 'My orders'.",
  "You cannot see the user's account, cart, orders or payments, and you do not have live product data. Say so honestly when asked.",
  "Never invent products, prices, discounts, coupon codes, policies, delivery times or order statuses. If you don't know, say so and point the user to the relevant page (Products, Cart, My orders) or to the store's support.",
  "Never ask for passwords, card numbers or other secrets.",
].join("\n");

// One error type so the UI can show a friendly message per `code`.
export class HfError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "HfError";
    this.code = code; // no_token | invalid_token | rate_limit | model_unavailable | network | empty | bad_input | unknown
    this.status = status;
  }
}

export function getAccessToken() {
  try {
    const token = (localStorage.getItem("hf_access_token") ?? "").trim();
    return token && token !== HF_TOKEN_PLACEHOLDER ? token : "";
  } catch {
    return ""; // storage blocked
  }
}

export const isConfigured = () => Boolean(getAccessToken());

const errorFromStatus = (status) => {
  if (status === 401 || status === 403) return new HfError("invalid_token", "Invalid or unauthorized token", status);
  if (status === 429) return new HfError("rate_limit", "Rate limit reached", status);
  if (status === 404 || status === 400 || status === 422 || status >= 500) {
    return new HfError("model_unavailable", "Model unavailable", status);
  }
  return new HfError("unknown", `Request failed (${status})`, status);
};

// Shared fetch: adds the token, maps failures to HfError. Never logs the token or the headers.
async function hfFetch(url, body, signal) {
  const token = getAccessToken();
  if (!token) throw new HfError("no_token", "Hugging Face token is not configured");

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new HfError("network", "Network error");
  }
  if (!res.ok) throw errorFromStatus(res.status);
  try {
    return await res.json();
  } catch {
    throw new HfError("unknown", "Unreadable response", res.status);
  }
}

export async function requestChatCompletion({
  model = HF_CONFIG.textModel,
  messages,
  maxTokens = 1024, // gpt-oss is a reasoning model: leave room for it, or the reply can come back empty
  temperature = 0.4,
  signal,
}) {
  const data = await hfFetch(HF_CONFIG.chatEndpoint, { model, messages, max_tokens: maxTokens, temperature, stream: false }, signal);
  const content = data?.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content.trim() : "";
  if (!text) throw new HfError("empty", "Empty reply");
  return text;
}

// `history`: prior { role: "user" | "assistant", content } messages. Anything else is dropped.
export function generateText(history = [], prompt, { systemPrompt = WASLA_SYSTEM_PROMPT, signal } = {}) {
  const text = typeof prompt === "string" ? prompt.trim() : "";
  if (!text) return Promise.reject(new HfError("bad_input", "Empty prompt"));

  const prior = history
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content }));

  return requestChatCompletion({
    model: HF_CONFIG.textModel,
    messages: [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      ...prior,
      { role: "user", content: text },
    ],
    signal,
  });
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new HfError("bad_input", "Couldn't read the image"));
    reader.readAsDataURL(file);
  });

// Not wired into the UI yet (no image-upload component exists). Kept for a later extension.
export async function analyzeImage(file, question = "Describe this image.", { signal } = {}) {
  if (!file || !file.type?.startsWith("image/")) throw new HfError("bad_input", "Choose an image file");
  if (file.size > MAX_IMAGE_BYTES) throw new HfError("bad_input", "Image is too large (max 4 MB)");
  const url = await readAsDataUrl(file);
  return requestChatCompletion({
    model: HF_CONFIG.visionModel,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: question },
          { type: "image_url", image_url: { url } },
        ],
      },
    ],
    signal,
  });
}

// Not wired into the UI yet, and not verified against the live provider. Returns an image URL
// (a data: URI when the provider answers synchronously).
export async function generateImage(prompt, { signal } = {}) {
  const text = typeof prompt === "string" ? prompt.trim() : "";
  if (!text) throw new HfError("bad_input", "Empty prompt");
  const data = await hfFetch(HF_CONFIG.imageEndpoint, { prompt: text, sync_mode: true }, signal);
  const url = data?.images?.[0]?.url;
  if (!url) throw new HfError("empty", "No image returned");
  return url;
}
