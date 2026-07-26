// File: src/app/api/chat/route.ts
// This runs on the SERVER — API key is NEVER sent to browser
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, mode, userContext } = await req.json();
    
    // Server-side API key — invisible to browser
    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const modePersonalities: Record<string, string> = {
      coach: "You are an intense fitness coach. Push the user. Be direct.",
      nutritionist: "You are a sports nutritionist specializing in Indian diets.",
      wellness: "You are a calm wellness guide. Focus on sleep, stress, recovery.",
      motivator: "You are an EXPLOSIVE motivational speaker. Use CAPS. Short punchy sentences.",
    };

    const systemPrompt = `You are Flame Oracle (${mode || "coach"} mode), AI assistant for IGNITE.
${modePersonalities[mode || "coach"]}
${userContext || ""}
Be concise (2-4 paragraphs). Use emojis naturally.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: any) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.text,
          })),
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const text = data.choices?.[0]?.message?.content || "No response";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
