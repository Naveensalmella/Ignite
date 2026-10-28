// Streaming AI chat for Flame Oracle (Groq, OpenAI-compatible SSE).
import { NextRequest } from "next/server";
import { groqRequest, AIError, clip } from "@/lib/ai";

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const MODE_PERSONALITIES: Record<string, string> = {
  coach: "You are an intense fitness coach. Push the user. Be direct.",
  nutritionist: "You are a sports nutritionist specializing in Indian diets.",
  wellness: "You are a calm wellness guide. Focus on sleep, stress, recovery.",
  motivator: "You are an EXPLOSIVE motivational speaker. Use CAPS. Short punchy sentences.",
};

type InMessage = { role?: string; text?: string };

export async function POST(req: NextRequest) {
  let payload: { messages?: InMessage[]; mode?: string; userContext?: string };
  try { payload = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }

  const mode = payload.mode && MODE_PERSONALITIES[payload.mode] ? payload.mode : "coach";
  const history = (Array.isArray(payload.messages) ? payload.messages : [])
    .filter(m => m && typeof m.text === "string" && m.text.trim())
    .slice(-12)
    .map(m => ({ role: m.role === "assistant" ? "assistant" as const : "user" as const, content: clip(m.text, 4000) }));
  if (history.length === 0) return json({ error: "Message is empty" }, 400);

  const systemPrompt = `You are Flame Oracle (${mode} mode), the AI assistant inside IGNITE, a gamified self-improvement app.\n${MODE_PERSONALITIES[mode]}\n${clip(payload.userContext, 6000)}\nBe concise (2-4 short paragraphs). Use emojis naturally.`;

  let upstream: Response;
  try {
    upstream = await groqRequest({
      messages: [{ role: "system", content: systemPrompt }, ...history],
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    });
  } catch (e) {
    const err = e as AIError;
    return json({ error: err.message || "AI request failed" }, err.status || 500);
  }

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, obj: unknown) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

  const readable = new ReadableStream({
    async start(controller) {
      const reader = upstream.body?.getReader();
      if (!reader) { send(controller, { error: "Empty response from AI" }); controller.close(); return; }
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // a partial line waits for the next chunk
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content || "";
              if (token) send(controller, { token });
            } catch { /* ignore keep-alives / malformed lines */ }
          }
        }
      } catch (e) {
        send(controller, { error: (e as Error).message || "Stream interrupted" });
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
