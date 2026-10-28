// Server-only helpers for the AI routes (Groq for chat/workouts, Gemini for food).
// Model names are configurable via env vars and fall back automatically when a
// model is retired, so a provider deprecation doesn't take the feature down.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const unique = (list: (string | undefined)[]) => [...new Set(list.filter((m): m is string => !!m && m.trim().length > 0))];

export const groqModels = () => unique([process.env.GROQ_MODEL, "openai/gpt-oss-120b", "llama-3.3-70b-versatile"]);
export const geminiModels = () => unique([process.env.GEMINI_MODEL, "gemini-3.5-flash", "gemini-2.5-flash", "gemini-flash-latest"]);

// Errors that mean "this model name doesn't work" — worth trying the next one.
const isModelError = (status: number, message = "") =>
  status === 404 || /model.*(not found|decommissioned|does not exist|not supported|deprecated)|not found for api version/i.test(message);

export class AIError extends Error {
  status: number;
  constructor(message: string, status = 500) { super(message); this.status = status; }
}

type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

/** POST to Groq, trying each configured model until one accepts the request. */
export async function groqRequest(body: { messages: GroqMessage[]; [k: string]: unknown }): Promise<Response> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new AIError("The AI coach isn't configured on this server (GROQ_API_KEY missing).", 503);
  let lastError = "AI request failed";
  for (const model of groqModels()) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ ...body, model }),
    });
    if (res.ok) return res;
    let message = `Groq error ${res.status}`;
    try { const j = await res.json(); message = j?.error?.message || message; } catch { /* not JSON */ }
    lastError = message;
    if (res.status === 429) throw new AIError("The AI is busy right now (rate limit). Please try again in a minute.", 429);
    if (!isModelError(res.status, message)) throw new AIError(message, res.status >= 500 ? 502 : res.status);
  }
  throw new AIError(lastError, 502);
}

/** Call Gemini generateContent with the first working model; returns the text output. */
export async function geminiGenerate(parts: unknown[], generationConfig: Record<string, unknown> = {}): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AIError("Food analysis isn't configured on this server (GEMINI_API_KEY missing).", 503);
  let lastError = "Gemini request failed";
  for (const model of geminiModels()) {
    const res = await fetch(`${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ parts }], generationConfig }),
    });
    let data: { error?: { message?: string }; candidates?: { content?: { parts?: { text?: string }[] } }[] } = {};
    try { data = await res.json(); } catch { /* empty body */ }
    if (res.ok && !data.error) {
      return (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
    }
    const message = data.error?.message || `Gemini error ${res.status}`;
    lastError = message;
    if (res.status === 429) throw new AIError("Food analysis is busy right now (rate limit). Please try again in a minute.", 429);
    if (!isModelError(res.status, message)) throw new AIError(message, res.status >= 500 ? 502 : res.status);
  }
  throw new AIError(lastError, 502);
}

export const clip = (v: unknown, max: number) => String(v ?? "").slice(0, max);
