import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { prompt } = await req.json();
    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) return NextResponse.json({ error: "No API key" }, { status: 500 });

    try {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
            body: JSON.stringify({
                model: "openai/gpt-oss-120b",
                temperature: 0.3,
                max_tokens: 1024,
                messages: [
                    {
                        role: "system",
                        content: `You are a workout generator. Return ONLY valid JSON, nothing else. No emojis, no explanation, no markdown, no thinking tags. Just a raw JSON object.

Format:
{"name":"Workout Name","exercises":[{"name":"Exercise Name","reps":12,"sets":3,"rest":60,"bodyPart":"chest"}]}

Rules:
- 4 to 10 exercises
- bodyPart must be one of: chest, back, shoulders, arms, core, legs, glutes, cardio
- reps must be a number
- sets must be a number
- rest in seconds
- No emojis anywhere in the JSON`
                    },
                    { role: "user", content: prompt }
                ],
            }),
        });

        const data = await r.json();
        const text = data.choices?.[0]?.message?.content || "";
        const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        const start = clean.indexOf("{");
        const end = clean.lastIndexOf("}");
        if (start === -1 || end === -1) return NextResponse.json({ error: "No workout generated" }, { status: 400 });

        const workout = JSON.parse(clean.substring(start, end + 1));
        if (!workout.exercises || !Array.isArray(workout.exercises)) {
            return NextResponse.json({ error: "Invalid workout format" }, { status: 400 });
        }

        return NextResponse.json({ workout });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}