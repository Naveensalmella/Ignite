// File: src/app/api/food-scan/route.ts
// Uses Groq only — no Gemini
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { description, image } = await req.json();
    const GROQ_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const systemPrompt = 'You are a nutrition expert specializing in Indian food. Analyze the food and return ONLY a valid JSON array. Each item: {"name":"Food Name","emoji":"🍛","cal":number,"protein":number,"carbs":number,"fat":number,"fiber":number,"serving":"portion size"}. Use realistic Indian portions (1 roti=80cal, 1 cup rice=200cal, 1 cup dal=180cal). Return ONLY the JSON array, no markdown, no backticks, no explanation.';

    // ── IMAGE ANALYSIS ──
    if (image) {
      const dataUrl = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;

      // Try vision models one by one
      const visionModels = ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"];

      for (const model of visionModels) {
        try {
          const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
            body: JSON.stringify({
              model,
              max_tokens: 1024,
              temperature: 0.3,
              messages: [
                {
                  role: "user", content: [
                    { type: "image_url", image_url: { url: dataUrl } },
                    { type: "text", text: "Identify every food item in this image. For each item estimate portion size and provide: name, emoji, calories, protein, carbs, fat, fiber, serving. Return ONLY a JSON array." }
                  ]
                }
              ],
            }),
          });
          const data = await r.json();

          if (data.error) {
            console.warn(`Groq ${model}:`, data.error.message);
            continue;
          }

          const text = data.choices?.[0]?.message?.content || "";
          const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const match = clean.match(/\[[\s\S]*\]/);
          if (match) {
            const foods = JSON.parse(match[0]);
            if (foods.length > 0) return NextResponse.json({ foods, source: model });
          }
        } catch (e: any) {
          console.warn(`Groq ${model} error:`, e.message);
        }
      }

      return NextResponse.json({ error: "Could not analyze image. Try a clearer well-lit photo, or use Describe mode.", foods: [] });
    }

    // ── TEXT ANALYSIS ──
    if (description) {
      try {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            max_tokens: 1024,
            temperature: 0.3,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Analyze this food: "${description}"` },
            ],
          }),
        });
        const data = await r.json();
        if (!data.error) {
          const text = data.choices?.[0]?.message?.content || "";
          const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const match = clean.match(/\[[\s\S]*\]/);
          if (match) return NextResponse.json({ foods: JSON.parse(match[0]), source: "groq-text" });
        }
      } catch { }

      return NextResponse.json({ error: "Analysis failed. Try again.", foods: [] });
    }

    return NextResponse.json({ error: "Provide description or image", foods: [] }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, foods: [] }, { status: 500 });
  }
}