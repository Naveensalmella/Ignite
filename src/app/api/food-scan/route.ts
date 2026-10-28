// Food recognition / nutrition estimates (Gemini) from a photo or a text description.
import { NextRequest, NextResponse } from "next/server";
import { geminiGenerate, AIError, clip } from "@/lib/ai";

type Food = { name: string; emoji: string; cal: number; protein: number; carbs: number; fat: number; fiber: number; serving: string };

const MAX_IMAGE_CHARS = 4_000_000; // ~3 MB of base64

const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) && x >= 0 ? Math.round(x * 10) / 10 : 0; };

function extractFoods(text: string): Food[] | null {
  let clean = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  clean = clean.replace(/```thought[\s\S]*?```/g, "").replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start === -1 || end <= start) return null;
  try {
    const raw = JSON.parse(clean.substring(start, end + 1));
    if (!Array.isArray(raw)) return null;
    const foods = raw
      .filter(f => f && typeof f.name === "string" && f.name.trim())
      .slice(0, 20)
      .map(f => ({
        name: String(f.name).trim().slice(0, 80),
        emoji: typeof f.emoji === "string" ? f.emoji.slice(0, 4) : "🍽️",
        cal: Math.round(n(f.cal ?? f.calories)),
        protein: n(f.protein), carbs: n(f.carbs ?? f.carbohydrates), fat: n(f.fat), fiber: n(f.fiber),
        serving: typeof f.serving === "string" ? f.serving.slice(0, 60) : "1 serving",
      }));
    return foods.length > 0 ? foods : null;
  } catch { return null; }
}

const FOOD_PROMPT = `You are an expert nutritionist specializing in Indian and global cuisines.
Identify EVERY food item visible in this image. For Indian foods, recognize specific dishes:
biryani, dal, roti, chapati, dosa, idli, sambar, paneer butter masala, chole, rajma,
pav bhaji, puri, paratha, thali plates (identify each item separately), etc.

Rules:
- Use realistic Indian portion sizes (e.g., 1 roti = 40g, 1 cup rice = 180g, 1 dosa = 120g)
- Estimate calories accurately based on cooking method (fried vs steamed vs grilled)
- If multiple items on a plate/thali, list EACH item separately
- Include cooking oil/ghee calories when visibly fried or oily

Return ONLY a JSON array, no other text:
[{"name":"Food Name","emoji":"🍛","cal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"serving":"portion size"}]`;

export async function POST(req: NextRequest) {
  let body: { description?: unknown; image?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request", foods: [] }, { status: 400 }); }

  const image = typeof body.image === "string" ? body.image : "";
  const description = clip(body.description, 1000).trim();

  try {
    if (image) {
      if (image.length > MAX_IMAGE_CHARS) return NextResponse.json({ error: "That photo is too large. Try a smaller one.", foods: [] }, { status: 413 });
      const match = /^data:(image\/[a-z+.-]+);base64,/i.exec(image);
      const mimeType = match?.[1] || "image/jpeg";
      const base64Data = image.includes(",") ? image.split(",")[1] : image;
      const text = await geminiGenerate(
        [{ inlineData: { mimeType, data: base64Data } }, { text: FOOD_PROMPT }],
        { temperature: 0.2, maxOutputTokens: 4096 },
      );
      const foods = extractFoods(text);
      if (foods) return NextResponse.json({ foods, source: "gemini-vision" });
      return NextResponse.json({ error: "Could not identify food items. Try a clearer photo or describe your meal.", foods: [] });
    }

    if (description) {
      const text = await geminiGenerate(
        [{ text: `${FOOD_PROMPT}\n\nThe user describes their food as: "${description}".\nAnalyze this description and return the JSON array.` }],
        { temperature: 0.2, maxOutputTokens: 4096 },
      );
      const foods = extractFoods(text);
      if (foods) return NextResponse.json({ foods, source: "gemini-text" });
      return NextResponse.json({ error: "Could not analyze that food. Try rephrasing.", foods: [] });
    }

    return NextResponse.json({ error: "Send a description or a photo", foods: [] }, { status: 400 });
  } catch (e) {
    const err = e as AIError;
    console.error("[food-scan]", err.message);
    return NextResponse.json({ error: err.message || "Analysis failed. Try again.", foods: [] }, { status: err.status || 500 });
  }
}
