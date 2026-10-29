// Food recognition / nutrition estimates from a photo, a meal description, or a
// per-100 g lookup. Tries Gemini → Groq vision → OpenRouter (see lib/ai.ts).
import { NextRequest, NextResponse } from "next/server";
import { analyzeWithFallback, publicError, clip } from "@/lib/ai";
import { requireUser, rateLimit, readJson } from "@/lib/apiAuth";

export const maxDuration = 60;

type Food = { name: string; emoji: string; cal: number; protein: number; carbs: number; fat: number; fiber: number; serving: string; grams?: number };

const MAX_IMAGE_CHARS = 1_500_000; // ~1.1 MB; the app sends ~100–250 KB JPEGs
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Clamp to a sane range so a model glitch can't log 90,000 kcal.
const n = (v: unknown, max: number) => { const x = Number(v); return Number.isFinite(x) && x >= 0 ? Math.min(max, Math.round(x * 10) / 10) : 0; };

function extractFoods(text: string): Food[] | null {
  let clean = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  clean = clean.replace(/```thought[\s\S]*?```/g, "").replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  let raw: unknown;
  try { raw = JSON.parse(clean); } catch {
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");
    if (start === -1 || end <= start) return null;
    try { raw = JSON.parse(clean.substring(start, end + 1)); } catch { return null; }
  }
  // Accept a bare array or {"foods":[…]} / {"items":[…]}.
  if (raw && !Array.isArray(raw) && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    raw = o.foods || o.items || (o.name ? [o] : null);
  }
  if (!Array.isArray(raw)) return null;
  const foods = raw
    .filter(f => f && typeof f.name === "string" && f.name.trim())
    .slice(0, 15)
    .map(f => ({
      name: String(f.name).trim().slice(0, 80),
      emoji: typeof f.emoji === "string" ? f.emoji.slice(0, 4) : "🍽️",
      cal: Math.round(n(f.cal ?? f.calories, 3000)),
      protein: n(f.protein, 300), carbs: n(f.carbs ?? f.carbohydrates, 500), fat: n(f.fat, 300), fiber: n(f.fiber, 100),
      serving: typeof f.serving === "string" ? f.serving.slice(0, 60) : "1 serving",
      ...(Number(f.grams) > 0 ? { grams: Math.min(2000, Math.round(Number(f.grams))) } : {}),
    }))
    .filter(f => f.cal > 0 || f.protein + f.carbs + f.fat > 0);
  return foods.length > 0 ? foods : null;
}

const RULES = `You are an expert nutritionist specialising in Indian and global cuisines.
Rules:
- Use realistic Indian portion sizes (1 roti = 40 g, 1 cup cooked rice = 180 g, 1 dosa = 120 g, 1 katori dal = 150 g)
- Account for the cooking method (fried vs steamed vs grilled) and visible oil/ghee
- If there are several items (e.g. a thali), list EACH item separately
- Give specific numbers; don't round calories to the nearest 100
- "grams" is your estimate of the portion weight in grams

Return ONLY a JSON array, no other text:
[{"name":"Food Name","emoji":"🍛","grams":150,"cal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"serving":"portion size"}]`;

const PHOTO_PROMPT = `Identify EVERY food item visible in this photo, including Indian dishes such as biryani, dal, roti, dosa, idli, sambar, paneer dishes, chole, rajma, pav bhaji, puri, paratha and thalis.
If the photo shows no food, return [].
${RULES}`;

const mealPrompt = (desc: string) => `The user ate: "${desc}".
Estimate the nutrition of each food item separately for the amounts described (assume one normal serving when no amount is given).
${RULES}`;

const lookupPrompt = (q: string) => `Give nutrition PER 100 g for the food "${q}". If it has common variations (e.g. fried vs boiled), return up to 4 of them.
Set "grams" to 100 and "serving" to "100 g" for every item.
Return ONLY a JSON array, no other text:
[{"name":"Food Name","emoji":"🍛","grams":100,"cal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"serving":"100 g"}]`;

// Lets the app know whether any AI provider is set up. Without one, the Nutrition page
// runs entirely on IGNITE's own food list, meal reader and barcode lookups.
export async function GET() {
  const ai = Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY);
  return NextResponse.json({ ai }, { headers: { "Cache-Control": "public, max-age=300" } });
}

export async function POST(req: NextRequest) {
  const uid = await requireUser(req);
  if (uid instanceof Response) return uid;
  const body = await readJson<{ description?: unknown; image?: unknown; lookup?: unknown }>(req, MAX_IMAGE_CHARS + 10_000);
  if (body instanceof Response) return body;

  const image = typeof body.image === "string" ? body.image : "";
  const description = clip(body.description, 300).replace(/["\\]/g, "'").trim();
  const lookup = clip(body.lookup, 60).replace(/["\\]/g, "'").trim();

  const limited = rateLimit(uid, "food", { perMinute: 8, perDay: 120 });
  if (limited) return limited;

  try {
    if (image) {
      const match = /^data:(image\/[a-z+.-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(image);
      if (!match || !IMAGE_TYPES.includes(match[1].toLowerCase())) return NextResponse.json({ error: "Please use a JPG, PNG or WebP photo.", foods: [] }, { status: 415 });
      const { result, provider } = await analyzeWithFallback({ prompt: PHOTO_PROMPT, image: { mimeType: match[1].toLowerCase(), data: match[2] } }, extractFoods, req.signal)
        .catch(e => { if ((e as { status?: number }).status === 422) return { result: null, provider: "" }; throw e; });
      if (result) return NextResponse.json({ foods: result, source: provider });
      return NextResponse.json({ error: "No food found in this photo. Try a clearer, closer photo in good light, or describe your meal.", foods: [] });
    }

    if (description || lookup) {
      const prompt = lookup ? lookupPrompt(lookup) : mealPrompt(description);
      const { result, provider } = await analyzeWithFallback({ prompt }, extractFoods, req.signal)
        .catch(e => { if ((e as { status?: number }).status === 422) return { result: null, provider: "" }; throw e; });
      if (result) return NextResponse.json({ foods: result, source: provider });
      return NextResponse.json({ error: "Couldn't work out that food. Try naming it differently, e.g. \"2 rotis and a bowl of dal\".", foods: [] });
    }

    return NextResponse.json({ error: "Send a description or a photo", foods: [] }, { status: 400 });
  } catch (e) {
    const { message, status } = publicError(e, "Food analysis failed. Please try again.");
    return NextResponse.json({ error: message, foods: [] }, { status });
  }
}
