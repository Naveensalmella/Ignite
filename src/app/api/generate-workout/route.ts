import { NextRequest, NextResponse } from 'next/server';
import { groqRequest, publicError, clip } from '@/lib/ai';
import { requireUser, rateLimit, readJson } from '@/lib/apiAuth';

export const maxDuration = 60;

const BODY_PARTS = ["chest", "back", "shoulders", "arms", "core", "legs", "glutes", "cardio"];

const SYSTEM = `You are a workout generator. Return ONLY valid JSON, nothing else. No emojis, no explanation, no markdown, no thinking tags. Just a raw JSON object.

Format:
{"name":"Workout Name","exercises":[{"name":"Exercise Name","reps":12,"sets":3,"rest":60,"bodyPart":"chest"}]}

Rules:
- 4 to 10 exercises
- bodyPart must be one of: ${BODY_PARTS.join(", ")}
- reps must be a number; for timed exercises (planks, holds, cardio intervals) omit reps and give "duration" in seconds
- sets must be a number
- rest in seconds
- No emojis anywhere in the JSON`;

type RawExercise = { name?: unknown; reps?: unknown; sets?: unknown; rest?: unknown; duration?: unknown; bodyPart?: unknown };

const num = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export async function POST(req: NextRequest) {
  const uid = await requireUser(req);
  if (uid instanceof Response) return uid;
  const limited = rateLimit(uid, "workout", { perMinute: 4, perDay: 40 });
  if (limited) return limited;
  const body = await readJson<{ prompt?: unknown }>(req, 4_000);
  if (body instanceof Response) return body;
  const prompt = clip(body.prompt, 500).trim();
  if (!prompt) return NextResponse.json({ error: "Describe the workout you want" }, { status: 400 });

  try {
    const r = await groqRequest({
      temperature: 0.3,
      max_tokens: 1024,
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }],
    }, req.signal);
    const data = await r.json();
    const text: string = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end <= start) return NextResponse.json({ error: "Couldn't generate a workout. Try describing it differently." }, { status: 422 });

    let parsed: { name?: unknown; exercises?: RawExercise[] };
    try { parsed = JSON.parse(clean.substring(start, end + 1)); } catch {
      return NextResponse.json({ error: "Couldn't generate a workout. Try again." }, { status: 422 });
    }
    const exercises = (Array.isArray(parsed.exercises) ? parsed.exercises : [])
      .filter(e => e && typeof e.name === "string" && e.name.trim())
      .slice(0, 12)
      .map(e => {
        const bodyPart = BODY_PARTS.includes(String(e.bodyPart).toLowerCase()) ? String(e.bodyPart).toLowerCase() : "core";
        const base = { name: String(e.name).trim().slice(0, 80), sets: num(e.sets, 1, 10, 3), rest: num(e.rest, 0, 300, 45), bodyPart };
        return e.duration && !e.reps
          ? { ...base, duration: num(e.duration, 5, 600, 30) }
          : { ...base, reps: num(e.reps, 1, 100, 12) };
      });
    if (exercises.length === 0) return NextResponse.json({ error: "Couldn't generate a workout. Try again." }, { status: 422 });

    return NextResponse.json({ workout: { name: clip(parsed.name || "AI Workout", 80), exercises } });
  } catch (e) {
    const { message, status } = publicError(e, "Couldn't generate a workout right now. Please try again.");
    return NextResponse.json({ error: message }, { status });
  }
}
