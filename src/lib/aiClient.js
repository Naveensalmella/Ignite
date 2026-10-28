// Browser helper for the AI routes: attaches the signed-in user's Firebase ID token
// and turns network/HTTP failures into a friendly `error` string.
import { auth } from "@/lib/firebase";

export async function authHeaders() {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken().catch(() => "") : "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** POST JSON to an AI route. Returns the raw Response (for streaming routes). */
export async function aiFetch(path, body, { signal, timeoutMs = 60000 } = {}) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw Object.assign(new Error("You're offline. Connect to the internet to use AI features."), { offline: true });
  }
  const timeout = AbortSignal.timeout(timeoutMs);
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
}

/** POST JSON and parse a JSON reply; never throws — failures come back as { error }. */
export async function aiJson(path, body, opts) {
  try {
    const r = await aiFetch(path, body, opts);
    const data = await r.json().catch(() => ({}));
    if (!r.ok && !data.error) data.error = r.status === 401 ? "Please sign in again to use AI features." : "Something went wrong. Please try again.";
    return data;
  } catch (e) {
    if (e?.name === "AbortError" && opts?.signal?.aborted) return { error: "", cancelled: true };
    if (e?.name === "TimeoutError" || e?.name === "AbortError") return { error: "The AI took too long to answer. Please try again." };
    return { error: e?.offline ? e.message : "Couldn't reach the server. Check your internet connection and try again." };
  }
}
