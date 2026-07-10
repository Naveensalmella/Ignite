import { useState, useEffect, useRef } from 'react';
import { getLevel, getRank, today } from '../utils';
import { GATES, XP } from '../data';

export default function AIChat({ appState, onAction, chatHistory, setChatHistory, totalXP, streak, workoutLog }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef(null);

  const lv = getLevel(totalXP);
  const rank = getRank(lv);
  const ug = GATES.filter(g => lv >= g.unlock).length;
  const { user, profile, habits, habitLog, tasks, journal, foodLog } = appState;
  const d = today();

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  // Build rich context about the user
  const buildSystemPrompt = () => {
    const todayHabits = habitLog[d] || [];
    const todayFood = foodLog[d] || [];
    const todayJournal = journal[d];
    const totalWorkouts = Object.keys(workoutLog).length;
    const todayTrained = !!workoutLog[d];

    return `You are the Flame Oracle — the wise, bold AI coach of IGNITE, a self-improvement RPG platform. You speak with authority and warmth. Address the user as "Champion."

USER PROFILE:
- Name: ${profile.name || user.name}
- Age: ${profile.age || "unknown"}, Gender: ${profile.gender || "unknown"}
- Weight: ${profile.weight || "?"}kg, Height: ${profile.height || "?"}cm
- Fitness Level: ${profile.fitnessLevel || "intermediate"}
- Training Style: ${profile.trainingType || "bodyweight"}
- Fighting Interest: ${profile.fightingStyle || "none"}
- Goal: ${profile.goal || "general fitness"}
- Daily Training Time: ${profile.dailyTime || 45} minutes

RPG STATUS:
- Level ${lv} "${rank.name}" (${rank.emoji})
- Total XP: ${totalXP.toLocaleString()}
- Streak: ${streak} days ${streak >= 7 ? "(streak multiplier active!)" : ""}
- Gates Unlocked: ${ug}/6
- Total Workouts: ${totalWorkouts}

TODAY'S STATUS:
- Training: ${todayTrained ? "COMPLETED ✅" : "NOT YET ❌"}
- Daily Quests: ${todayHabits.length}/${habits.length} done
- Food logged: ${todayFood.length} items
- Journal: ${todayJournal?.entry ? "Written" : "Not yet"}
- Mood: ${todayJournal?.mood ? ["", "Burned Out", "Low", "Steady", "Blazing", "On Fire"][todayJournal.mood] : "Not checked"}

COACHING GUIDELINES:
- Be motivating but honest. If they're slacking, call it out with love.
- Use RPG metaphors naturally (quests, leveling up, XP, warrior path).
- Give specific, actionable advice based on their profile and goals.
- For exercise questions, give detailed form cues and progressions.
- For nutrition, give practical meal suggestions considering Indian cuisine.
- For mental health, be supportive but recommend professional help for serious issues.
- Keep responses focused and under 200 words unless they ask for detail.
- If they ask about their stats, reference their actual data above.
- If asked to create tasks or habits, output: <action>{"type":"add_task","text":"...","priority":"medium"}</action>
- If asked to navigate, output: <action>{"type":"navigate","page":"training"}</action>`;
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: buildSystemPrompt(),
          messages: newHistory.slice(-20).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      let text = data.content?.filter(c => c.type === "text").map(c => c.text).join("\n") || "The flame flickers. Try again.";

      // Handle actions
      const actionMatch = text.match(/<action>([\s\S]*?)<\/action>/);
      if (actionMatch) {
        text = text.replace(/<action>[\s\S]*?<\/action>/, "").trim();
        onAction(actionMatch[1].trim());
      }

      setChatHistory(h => [...h, { role: "assistant", content: text }]);
    } catch (err) {
      setChatHistory(h => [...h, {
        role: "assistant",
        content: `⚠️ ${err.message}\n\nMake sure GEMINI_API_KEY is set in Vercel → Settings → Environment Variables. Get a free key at aistudio.google.com/apikey`
      }]);
    }
    setLoading(false);
  };

  const suggestions = [
    "Analyze my stats — what should I improve?",
    "Plan my meals for today based on my goals",
    "I'm feeling unmotivated. Help me push through.",
    "What exercises should I focus on for my goal?",
    "How's my training consistency?",
    "Give me a recovery plan for today",
    "What fighting technique should I practice?",
    "Help me build a better daily routine",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)" }}>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16 }}>
        {/* Welcome screen */}
        {chatHistory.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ width: 72, height: 72, borderRadius: 16, margin: "0 auto 16px", background: "linear-gradient(135deg,#10b981,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, boxShadow: "0 0 40px rgba(16,185,129,.3)", animation: "emberGlow 3s infinite" }}>🔮</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Flame Oracle</h3>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 6 }}>Your AI training coach with full knowledge of your stats</p>
            <p style={{ color: "#4b5563", fontSize: 12, marginBottom: 24 }}>
              Lv.{lv} {rank.name} · {ug} Gates · {streak}d streak
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 500, margin: "0 auto" }}>
              {suggestions.map((s, i) => (
                <span key={i} className="chip chip-i" onClick={() => setInput(s)}
                  style={{ padding: "10px 16px", fontSize: 13, cursor: "pointer" }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {chatHistory.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
            {m.role === "assistant" && (
              <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg,#10b981,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginRight: 8, marginTop: 4 }}>🔮</div>
            )}
            <div className={`cb ${m.role === "user" ? "cbu" : "cba"}`}>{m.content}</div>
          </div>
        ))}

        {/* Loading dots */}
        {loading && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg,#10b981,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>🔮</div>
            <div className="cb cba">
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: `dotPulse 1.2s ${i * .2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10, borderTop: "1px solid rgba(16,185,129,.08)", paddingTop: 14 }}>
        <input className="inp" placeholder="Ask the Oracle anything..." value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          style={{ flex: 1 }} />
        <button className="bp" onClick={send} disabled={loading}
          style={{ padding: "12px 28px", fontSize: 16 }}>
          {loading ? "..." : "↑"}
        </button>
      </div>
    </div>
  );
}