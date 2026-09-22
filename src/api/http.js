const API_URL = "http://localhost:3001";

// Shared fetch helper: friendly network error, `error.status` for HTTP failures, JSON body.
export async function request(path, options) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, options);
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new Error("Can't reach the server. Make sure JSON Server is running (npm run server).");
  }
  if (!res.ok) {
    const error = new Error(`Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}
