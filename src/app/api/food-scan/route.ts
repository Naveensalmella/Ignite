// File: src/app/api/food-scan/route.ts
import { NextRequest, NextResponse } from "next/server";

function extractFoods(text: string): any[] | null {
  let clean = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  clean = clean.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  clean = clean.replace(/```thought[\s\S]*?```/g, "").trim();

  // Find the JSON array — use greedy match to get the full array
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    const foods = JSON.parse(clean.substring(start, end + 1));
    return Array.isArray(foods) && foods.length > 0 ? foods : null;
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
  try {
    const { description, image } = await req.json();
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    // ── IMAGE ANALYSIS (Gemini) ──
    if (image) {
      if (!GEMINI_KEY) {
        return NextResponse.json({ error: "GEMINI_API_KEY not configured", foods: [] }, { status: 500 });
      }

      // Strip data URL prefix if present
      const base64Data = image.includes(",") ? image.split(",")[1] : image;

      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inlineData: { mimeType: "image/jpeg", data: base64Data } },
                  { text: FOOD_PROMPT },
                ],
              }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
            }),
          }
        );

        const data = await r.json();

        if (data.error) {
          console.error("[Gemini] Error:", data.error.message);
          return NextResponse.json({ error: data.error.message, foods: [] }, { status: 500 });
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        console.log("[Gemini] Response:", text.substring(0, 300));

        const foods = extractFoods(text);
        if (foods) {
          console.log(`[Gemini] ✅ ${foods.length} items detected`);
          return NextResponse.json({ foods, source: "gemini-vision" });
        }

        console.warn("[Gemini] No valid JSON in response");
        return NextResponse.json({ error: "Could not identify food items. Try a clearer photo.", foods: [] });

      } catch (e: any) {
        console.error("[Gemini] Exception:", e.message);
        return NextResponse.json({ error: "Scan failed. Try again.", foods: [] }, { status: 500 });
      }
    }

    // ── TEXT ANALYSIS (Gemini — unified with image analysis for consistent results) ──
    if (description) {
      if (!GEMINI_KEY) {
        return NextResponse.json({ error: "GEMINI_API_KEY not configured", foods: [] }, { status: 500 });
      }

      try {
        const textPrompt = `${FOOD_PROMPT}\n\nThe user describes their food as: "${description}".\nAnalyze this description and return the JSON array.`;

        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: textPrompt }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
            }),
          }
        );

        const data = await r.json();

        if (data.error) {
          console.error("[Gemini-Text] Error:", data.error.message);
          return NextResponse.json({ error: data.error.message, foods: [] }, { status: 500 });
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        console.log("[Gemini-Text] Response:", text.substring(0, 300));

        const foods = extractFoods(text);
        if (foods) {
          console.log(`[Gemini-Text] ✅ ${foods.length} items detected`);
          return NextResponse.json({ foods, source: "gemini-text" });
        }

        console.warn("[Gemini-Text] No valid JSON in response");
        return NextResponse.json({ error: "Could not analyze food. Try rephrasing.", foods: [] });

      } catch (e: any) {
        console.error("[Gemini-Text] Exception:", e.message);
        return NextResponse.json({ error: "Analysis failed. Try again.", foods: [] }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Send description or image", foods: [] }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, foods: [] }, { status: 500 });
  }
}