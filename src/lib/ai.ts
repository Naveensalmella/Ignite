// Server-only helpers for the AI routes (Groq for chat/workouts; Gemini → Groq vision →
// OpenRouter for food). Model names are configurable via env vars and every call falls
// through to the next model/provider when one is retired, rate-limited or down, so a
// single free-tier quota running out doesn't take the feature down.

const GROQ_URL = `${process.env.GROQ_API_BASE || "https://api.groq.com/openai/v1"}/chat/completions`;
const GEMINI_URL = `${process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta"}/models`;
const OPENROUTER_URL = `${process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1"}/chat/completions`;

const unique = (list: (string | undefined)[]) => [...new Set(list.filter((m): m is string => !!m && m.trim().length > 0))];
const csv = (v?: string) => (v || "").split(",").map(s => s.trim());

export const groqModels = () => unique([process.env.GROQ_MODEL, "openai/gpt-oss-120b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]);
// "-latest" aliases always point at Google's current model, so they survive retirements.
// Flash-Lite has the biggest free quota, so it's the fallback when Flash is rate-limited.
export const geminiModels = () => unique([...csv(process.env.GEMINI_MODEL), "gemini-flash-latest", "gemini-2.5-flash", "gemini-flash-lite-latest", "gemini-2.5-flash-lite"]);
const groqVisionModels = () => unique([...csv(process.env.GROQ_VISION_MODEL), "meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct"]);
const openrouterModels = () => unique([...csv(process.env.OPENROUTER_MODEL), "google/gemma-3-27b-it:free", "mistralai/mistral-small-3.2-24b-instruct:free"]);

const CALL_TIMEOUT_MS = 25_000;

export class AIError extends Error {
  status: number;
  constructor(message: string, status = 500) { super(message); this.status = status; }
}

/** Log the provider's real error on the server; send the browser a plain one. */
export function publicError(e: unknown, fallback: string) {
  const err = e as AIError;
  const status = err?.status || 500;
  console.error("[ai]", err?.message || e);
  if (status === 429) return { message: "The AI is busy right now. Please try again in a minute.", status };
  if (status === 503) return { message: err.message, status }; // "not configured" messages are ours
  if (status === 504) return { message: "The AI took too long to answer. Please try again.", status };
  return { message: fallback, status: status >= 500 ? 502 : status };
}

const timeoutSignal = (ms = CALL_TIMEOUT_MS, outer?: AbortSignal) =>
  outer ? AbortSignal.any([outer, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms);

async function post(url: string, headers: Record<string, string>, body: unknown, signal?: AbortSignal) {
  try {
    return await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body), signal: timeoutSignal(CALL_TIMEOUT_MS, signal) });
  } catch (e) {
    const name = (e as Error)?.name;
    if (name === "TimeoutError") throw new AIError("AI request timed out", 504);
    if (name === "AbortError") throw new AIError("Request cancelled", 499);
    throw new AIError(`AI provider unreachable: ${(e as Error)?.message}`, 502);
  }
}

async function errorMessage(res: Response, fallback: string) {
  try { const j = await res.json(); return j?.error?.message || j?.error || fallback; } catch { return fallback; }
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * POST to Groq, trying each configured model until one accepts the request.
 * Rate limits are per model, so a 429 moves on to the next model too.
 */
export async function groqRequest(body: { messages: ChatMessage[]; [k: string]: unknown }, signal?: AbortSignal): Promise<Response> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new AIError("The AI coach isn't configured on this server (GROQ_API_KEY missing).", 503);
  let last = new AIError("AI request failed", 502);
  for (const model of groqModels()) {
    const res = await post(GROQ_URL, { Authorization: `Bearer ${key}` }, { ...body, model }, signal);
    if (res.ok) return res;
    last = new AIError(await errorMessage(res, `Groq error ${res.status}`), res.status === 429 ? 429 : res.status >= 500 ? 502 : res.status);
    if (res.status === 401 || res.status === 403) break; // bad key: other models won't help
  }
  throw last;
}

// ── Food vision ──

export type VisionInput = { prompt: string; image?: { mimeType: string; data: string } };
type Attempt = { provider: string; model: string; run: (signal?: AbortSignal) => Promise<string> };

function geminiAttempts(input: VisionInput): Attempt[] {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return [];
  const parts: unknown[] = input.image ? [{ inlineData: { mimeType: input.image.mimeType, data: input.image.data } }, { text: input.prompt }] : [{ text: input.prompt }];
  return geminiModels().map(model => ({
    provider: "gemini", model,
    run: async (signal) => {
      const res = await post(`${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`, { "x-goog-api-key": key }, {
        contents: [{ parts }],
        // JSON mode stops the model wrapping the answer in prose; a generous token
        // budget leaves room for "thinking" models so the JSON isn't cut off.
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: "application/json" },
      }, signal);
      let data: { error?: { message?: string }; candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] } = {};
      try { data = await res.json(); } catch { /* empty body */ }
      if (!res.ok || data.error) throw new AIError(data.error?.message || `Gemini error ${res.status}`, res.status === 200 ? 502 : res.status);
      return (data.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || "").join("");
    },
  }));
}

function openAIStyleAttempts(provider: string, url: string, key: string | undefined, models: string[], input: VisionInput, extraHeaders: Record<string, string> = {}): Attempt[] {
  if (!key) return [];
  const content = input.image
    ? [{ type: "text", text: input.prompt }, { type: "image_url", image_url: { url: `data:${input.image.mimeType};base64,${input.image.data}` } }]
    : input.prompt;
  return models.map(model => ({
    provider, model,
    run: async (signal) => {
      const res = await post(url, { Authorization: `Bearer ${key}`, ...extraHeaders }, { model, messages: [{ role: "user", content }], temperature: 0.2, max_tokens: 2048 }, signal);
      if (!res.ok) throw new AIError(await errorMessage(res, `${provider} error ${res.status}`), res.status);
      const data = await res.json().catch(() => ({}));
      return data?.choices?.[0]?.message?.content || "";
    },
  }));
}

/**
 * Ask each configured provider/model in turn until one returns something `parse`
 * accepts. Gemini first (best at Indian dishes), then Groq vision, then OpenRouter's
 * free models. Text-only requests can also use Groq's regular chat models.
 */
export async function analyzeWithFallback<T>(input: VisionInput, parse: (text: string) => T | null, signal?: AbortSignal): Promise<{ result: T; provider: string; model: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  const attempts: Attempt[] = [
    ...geminiAttempts(input),
    ...openAIStyleAttempts("groq", GROQ_URL, groqKey, input.image ? groqVisionModels() : unique([...groqVisionModels(), ...groqModels()]), input),
    ...openAIStyleAttempts("openrouter", OPENROUTER_URL, process.env.OPENROUTER_API_KEY, openrouterModels(), input, { "X-Title": "IGNITE" }),
  ];
  if (attempts.length === 0) throw new AIError("Food analysis isn't configured on this server (add GEMINI_API_KEY or GROQ_API_KEY).", 503);

  const deadline = Date.now() + 50_000;
  const badKeys = new Set<string>();
  let last: AIError = new AIError("Food analysis failed", 502);
  let sawRateLimit = false;
  for (const a of attempts) {
    if (badKeys.has(a.provider)) continue;
    if (Date.now() > deadline) break;
    try {
      const text = await a.run(signal);
      const result = parse(text);
      if (result) return { result, provider: a.provider, model: a.model };
      last = new AIError(`${a.provider}/${a.model} returned no usable result`, 422);
    } catch (e) {
      const err = e instanceof AIError ? e : new AIError(String(e), 502);
      if (err.status === 499) throw err;
      console.warn(`[ai] ${a.provider}/${a.model} failed (${err.status}): ${err.message}`);
      if (err.status === 401 || err.status === 403) badKeys.add(a.provider);
      if (err.status === 429) sawRateLimit = true;
      last = err;
    }
  }
  if (sawRateLimit && last.status !== 422) throw new AIError(last.message, 429);
  throw last;
}

export const clip = (v: unknown, max: number) => String(v ?? "").slice(0, max);
