// File: src/app/api/food-scan/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();
    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        temperature: 0.3,
        messages: [
          { role: "system", content: 'You are a nutrition expert. Analyze food and return ONLY valid JSON array. Each item: {"name":"Food","emoji":"🍛","cal":number,"protein":number,"carbs":number,"fat":number,"fiber":number,"serving":"portion"}. Use Indian food portions. Return ONLY the JSON array.' },
          { role: "user", content: `Analyze: "${description}"` },
        ],
      }),
    });

    const data = await response.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });

    const text = data.choices?.[0]?.message?.content || "[]";
    const jsonMatch = text.match(/\[.*\]/s);
    const foods = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    
    return NextResponse.json({ foods });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
