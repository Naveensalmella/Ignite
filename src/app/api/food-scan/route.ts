// File: src/app/api/food-scan/route.ts
import { NextRequest, NextResponse } from "next/server";

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  try {
    const { description, image } = await req.json();
    const GROQ_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    // Helper: extract JSON array from messy AI response
    function extractFoods(text: string): any[] | null {
      let clean = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      clean = clean.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const match = clean.match(/\[[\s\S]*?\]/);
      if (!match) return null;
      try {
        const foods = JSON.parse(match[0]);
        return Array.isArray(foods) && foods.length > 0 ? foods : null;
      } catch { return null; }
    }

    // ── IMAGE ANALYSIS ──
    if (image) {
      const dataUrl = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          console.log(`[Vision] Attempt ${attempt + 1}`);

          const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${GROQ_KEY}`,
            },
            body: JSON.stringify({
              model: "qwen/qwen3.6-27b",
              max_tokens: 512,
              temperature: 0.2,
              messages: [{
                role: "user",
                content: [
                  { type: "image_url", image_url: { url: dataUrl } },
                  { type: "text", text: '/no_think\nIdentify food items in image. Return ONLY JSON array: [{"name":"Food","emoji":"🍛","cal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"serving":"1 cup"}]. No explanation.' }
                ]
              }],
            }),
          });

          const data = await r.json();

          if (data.error?.message?.includes("imit") || data.error?.message?.includes("rate")) {
            const waitMatch = data.error.message.match(/(\d+\.?\d*)s/);
            const waitSec = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) + 2 : 15;
            console.log(`[Vision] Rate limited. Waiting ${waitSec}s...`);
            await wait(waitSec * 1000);
            continue;
          }

          if (data.error) {
            console.warn(`[Vision] Error: ${data.error.message}`);
            break;
          }

          const text = data.choices?.[0]?.message?.content || "";
          console.log(`[Vision] Response: ${text.substring(0, 200)}`);

          const foods = extractFoods(text);
          if (foods) {
            console.log(`[Vision] ✅ ${foods.length} items`);
            return NextResponse.json({ foods, source: "qwen-vision" });
          }

          console.warn("[Vision] No valid JSON");
          break;

        } catch (e: any) {
          console.warn(`[Vision] Exception: ${e.message}`);
          break;
        }
      }

      return NextResponse.json({
        error: "Photo scan rate limited (free tier: 2 scans/min). Wait 30 seconds or use Describe mode.",
        foods: []
      });
    }

    // ── TEXT ANALYSIS ──
    if (description) {
      try {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            max_tokens: 512,
            temperature: 0.3,
            messages: [
              { role: "system", content: 'You are a nutrition expert. Return ONLY a JSON array: [{"name":"Food","emoji":"🍛","cal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"serving":"portion"}]. Indian portions. No explanation.' },
              { role: "user", content: `Analyze: "${description}"` },
            ],
          }),
        });
        const data = await r.json();
        if (!data.error) {
          const foods = extractFoods(data.choices?.[0]?.message?.content || "");
          if (foods) return NextResponse.json({ foods, source: "groq-text" });
        }
      } catch { }
      return NextResponse.json({ error: "Analysis failed. Try again.", foods: [] });
    }

    return NextResponse.json({ error: "Send description or image", foods: [] }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, foods: [] }, { status: 500 });
  }
}