// Server-only: protect the AI routes. Every request must carry the signed-in user's
// Firebase ID token, and each user gets a per-route request budget so nobody can
// burn through the shared Groq/Gemini quota.
import { createRemoteJWKSet, jwtVerify } from "jose";

// FIREBASE_JWKS_URL only exists so local tests can sign their own tokens.
const JWKS = createRemoteJWKSet(new URL(process.env.FIREBASE_JWKS_URL || "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";

const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

/** Returns the caller's uid, or a 401 Response to send back. */
export async function requireUser(req: Request): Promise<string | Response> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return json({ error: "Please sign in to use AI features." }, 401);
  if (!PROJECT_ID) return json({ error: "Server is missing the Firebase project id." }, 503);
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      algorithms: ["RS256"],
    });
    if (!payload.sub) throw new Error("no subject");
    return payload.sub;
  } catch {
    return json({ error: "Your session has expired. Please sign in again." }, 401);
  }
}

// Sliding-window limiter. It lives in server memory, so on serverless hosts each warm
// instance keeps its own window — a best-effort guard, not an exact global count.
const hits = new Map<string, number[]>();

export function rateLimit(uid: string, bucket: string, limits: { perMinute: number; perDay: number }): Response | null {
  const key = `${bucket}:${uid}`;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter(t => now - t < 86_400_000);
  const lastMinute = recent.filter(t => now - t < 60_000).length;
  if (lastMinute >= limits.perMinute || recent.length >= limits.perDay) {
    const retry = lastMinute >= limits.perMinute ? 60 : Math.ceil((recent[0] + 86_400_000 - now) / 1000);
    hits.set(key, recent);
    const msg = lastMinute >= limits.perMinute ? "You're going a bit fast. Please wait a minute and try again." : "You've reached today's AI limit. It resets within 24 hours.";
    return json({ error: msg }, 429, { "Retry-After": String(retry) });
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > 86_400_000) hits.delete(k);
  return null;
}

/** Read a JSON body, refusing anything bigger than `maxBytes`. */
export async function readJson<T>(req: Request, maxBytes: number): Promise<T | Response> {
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > maxBytes) return json({ error: "Request is too large." }, 413);
  const text = await req.text();
  if (text.length > maxBytes) return json({ error: "Request is too large." }, 413);
  try { return JSON.parse(text) as T; } catch { return json({ error: "Invalid request" }, 400); }
}
