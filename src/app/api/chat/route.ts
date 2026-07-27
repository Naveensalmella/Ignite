// File: src/app/api/chat/route.ts
// Streaming AI — Groq only
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, mode, userContext } = await req.json();
    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const modePersonalities: Record<string, string> = {
      coach: "You are an intense fitness coach. Push the user. Be direct.",
      nutritionist: "You are a sports nutritionist specializing in Indian diets.",
      wellness: "You are a calm wellness guide. Focus on sleep, stress, recovery.",
      motivator: "You are an EXPLOSIVE motivational speaker. Use CAPS. Short punchy sentences.",
    };

    const systemPrompt = `You are Flame Oracle (${mode || "coach"} mode), AI assistant for IGNITE.\n${modePersonalities[mode || "coach"]}\n${userContext || ""}\nBe concise (2-4 paragraphs). Use emojis naturally.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
        ],
        max_tokens: 1024,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return new Response(JSON.stringify({ error: err.error?.message || "API error" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
            for (const line of lines) {
              const data = line.replace("data: ", "").trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const token = parsed.choices?.[0]?.delta?.content || "";
                if (token) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
              } catch { }
            }
          }
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: (e as Error).message })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}