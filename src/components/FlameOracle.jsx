import { useState, useRef, useEffect } from 'react';

// Try Groq first (free, fast), fallback to Gemini
async function callAI(message, systemPrompt) {
  const groqKey = process.env.REACT_APP_GROQ_API_KEY;
  const geminiKey = process.env.REACT_APP_GEMINI_API_KEY;

  // Try Groq first
  if (groqKey) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }],
          max_tokens: 1024, temperature: 0.7,
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return d.choices?.[0]?.message?.content || "No response";
    } catch (e) {
      console.warn("Groq failed, trying Gemini:", e.message);
    }
  }

  // Fallback to Gemini
  if (geminiKey) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: message }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
      }),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return d.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "No response";
  }

  throw new Error("NO_KEY");
}

export default function FlameOracle({ appState, addXP, setFoodLog, setWorkoutLog, setPage, profile, routineData, setRoutineData }) {
  const initChats = () => {
    try { const s = appState?.oracleChats; if (Array.isArray(s) && s.length > 0 && s[0]?.messages) return s; } catch { }
    return [{ id: Date.now(), title: "New Chat", messages: [] }];
  };

  const [chats, setChats] = useState(initChats);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (!activeChatId && chats.length > 0) setActiveChatId(chats[0].id); }, []);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0] || { id: 0, title: "New Chat", messages: [] };
  const messages = activeChat?.messages || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const newChat = () => { const c = { id: Date.now(), title: "New Chat", messages: [] }; setChats(p => [c, ...p]); setActiveChatId(c.id); setShowSidebar(false); };
  const switchChat = (id) => { setActiveChatId(id); setShowSidebar(false); };
  const deleteChat = (id) => { const rem = chats.filter(c => c.id !== id); if (rem.length === 0) { newChat(); return; } setChats(rem); if (activeChatId === id) setActiveChatId(rem[0].id); };

  const processActions = (text) => {
    const actions = [];
    const foodMatch = text.match(/\[ADD_FOOD:(.+?)\|(\d+)\|(\d+)\|(\d+)\|(\d+)\]/);
    if (foodMatch) {
      const [_, name, cal, protein, carbs, fat] = foodMatch;
      const d = new Date().toISOString().split("T")[0];
      setFoodLog(prev => ({ ...prev, [d]: [...(prev[d] || []), { name, emoji: "🍽️", cal: parseInt(cal), protein: parseInt(protein), carbs: parseInt(carbs), fat: parseInt(fat), fiber: 0, meal: "Snack", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), category: "AI Logged" }] }));
      actions.push(`✅ Added ${name} to nutrition log`);
    }
    const navMatch = text.match(/\[NAVIGATE:(.+?)\]/);
    if (navMatch) { setTimeout(() => setPage(navMatch[1]), 500); actions.push(`→ Opening ${navMatch[1]} page`); }
    return actions;
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setLoading(true);

    const updatedMessages = [...messages, { role: "user", text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: updatedMessages, title: c.messages.length === 0 ? userMsg.slice(0, 30) : c.title } : c));

    try {
      const d = new Date().toISOString().split("T")[0];
      const todayFood = appState?.foodLog?.[d] || [];
      const todayWorkout = appState?.workoutLog?.[d];
      const todayCal = todayFood.reduce((s, f) => s + (f.cal || 0), 0);

      const systemPrompt = `You are Flame Oracle, the AI assistant for IGNITE — a self-improvement RPG app. You are helpful, motivating, and can control the app.

USER PROFILE: Name=${profile?.name || "Warrior"}, Goal=${profile?.goal || "fit"}, Level=${profile?.fitnessLevel || "intermediate"}, Weight=${profile?.weight || "70"}kg, Height=${profile?.height || "170"}cm, Age=${profile?.age || "25"}
TODAY'S STATUS: Trained=${!!todayWorkout}, Calories eaten=${todayCal}, Foods logged=${todayFood.length}

PREVIOUS MESSAGES:
${updatedMessages.slice(-6).map(m => `${m.role}: ${m.text}`).join("\n")}

APP CONTROL COMMANDS (include these EXACTLY in your response when needed):
- To log food: [ADD_FOOD:food name|calories|protein_grams|carbs_grams|fat_grams]
  Example: [ADD_FOOD:White Rice (1 cup)|206|4|45|0]
  Example: [ADD_FOOD:Chicken Biryani|250|12|30|8]
- To navigate: [NAVIGATE:page_name]
  Valid pages: training, nutrition, dailyquest, focus, wellness, routine, growth, profile, body, challenges, programs, share

RULES:
- If user says they ate something, calculate approximate Indian nutrition values and include [ADD_FOOD:...].
- If user asks to open a page, include [NAVIGATE:...].
- If user asks for a workout plan, suggest exercises with sets x reps.
- Be concise, motivating, use the user's name, use emojis naturally.`;

      const aiText = await callAI(userMsg, systemPrompt);
      const actions = processActions(aiText);
      let cleanText = aiText.replace(/\[ADD_FOOD:.*?\]/g, "").replace(/\[NAVIGATE:.*?\]/g, "").trim();
      if (actions.length > 0) cleanText += "\n\n" + actions.join("\n");

      const finalMessages = [...updatedMessages, { role: "assistant", text: cleanText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: finalMessages } : c));

    } catch (e) {
      console.error("Flame Oracle error:", e);
      const groqKey = process.env.REACT_APP_GROQ_API_KEY;
      const geminiKey = process.env.REACT_APP_GEMINI_API_KEY;
      let errMsg;
      if (e.message === "NO_KEY") {
        errMsg = "⚠️ No API key found.\n\nAdd to .env.local:\nREACT_APP_GROQ_API_KEY=gsk_your_key\n\nGet free key: console.groq.com/keys\n\nThen restart: Ctrl+C → npm start";
      } else if (e.message.includes("429") || e.message.includes("quota") || e.message.includes("rate")) {
        errMsg = "⏳ Rate limited. Wait 60 seconds and try again.";
      } else {
        errMsg = "❌ " + e.message + "\n\nGroq key: " + (groqKey ? "✅ Loaded" : "❌ Missing") + "\nGemini key: " + (geminiKey ? "✅ Loaded" : "❌ Missing");
      }
      const errMessages = [...updatedMessages, { role: "assistant", text: errMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: errMessages } : c));
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const quickActions = [
    { label: "I ate rice", icon: "🍚" }, { label: "I had 2 eggs", icon: "🥚" },
    { label: "Plan my workout", icon: "⚔️" }, { label: "Open training", icon: "🏋️" },
    { label: "How many calories today?", icon: "📊" }, { label: "Motivate me", icon: "🔥" },
    { label: "Plan my day", icon: "📅" }, { label: "I ate chicken biryani", icon: "🍗" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0 12px", borderBottom: "1px solid rgba(255,255,255,.04)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span onClick={() => setShowSidebar(!showSidebar)} style={{ fontSize: 18, cursor: "pointer", padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,.03)" }}>☰</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>🔮 Flame Oracle</div>
            <div style={{ fontSize: 11, color: "#4b5563" }}>AI assistant · Controls your app</div>
          </div>
        </div>
        <span onClick={newChat} style={{ fontSize: 12, color: "#10b981", cursor: "pointer", padding: "6px 12px", borderRadius: 8, background: "rgba(16,185,129,.06)" }}>+ New Chat</span>
      </div>

      {showSidebar && (
        <div className="fade-in" style={{ position: "absolute", top: 50, left: 0, right: 0, zIndex: 10, background: "#0d1117", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: 12, maxHeight: 300, overflowY: "auto" }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>CHAT HISTORY</div>
          {chats.map(c => (
            <div key={c.id} onClick={() => switchChat(c.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: c.id === activeChatId ? "rgba(16,185,129,.06)" : "rgba(255,255,255,.02)", border: c.id === activeChatId ? "1px solid rgba(16,185,129,.15)" : "1px solid transparent" }}>
              <div style={{ fontSize: 13, color: c.id === activeChatId ? "#10b981" : "#d1d5db", fontWeight: c.id === activeChatId ? 600 : 400 }}>{c.title || "New Chat"}</div>
              <span onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }} style={{ fontSize: 14, color: "#4b5563", padding: "0 4px" }}>×</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 0" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔮</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>What can I help with?</div>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6, marginBottom: 20 }}>I can log food, plan workouts, navigate the app, and answer any question.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {quickActions.map((qa, i) => (
                <span key={i} onClick={() => setInput(qa.label)} style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", cursor: "pointer", fontSize: 12, color: "#d1d5db" }}>{qa.icon} {qa.label}</span>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
            <div style={{ maxWidth: "85%", padding: "12px 16px", borderRadius: 16, ...(m.role === "user" ? { background: "linear-gradient(135deg,#10b981,#06b6d4)", borderBottomRightRadius: 4, color: "#fff" } : { background: "rgba(255,255,255,.04)", borderBottomLeftRadius: 4, color: "#d1d5db", border: "1px solid rgba(255,255,255,.06)" }) }}>
              <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.text}</div>
              <div style={{ fontSize: 10, color: m.role === "user" ? "rgba(255,255,255,.6)" : "#4b5563", marginTop: 4, textAlign: "right" }}>{m.time}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
            <div style={{ padding: "14px 20px", borderRadius: 16, borderBottomLeftRadius: 4, background: "rgba(255,255,255,.04)", display: "flex", gap: 6 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: `dotPulse 1.2s ${i * .2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ flexShrink: 0, padding: "12px 0 0", borderTop: "1px solid rgba(255,255,255,.04)" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={inputRef} className="inp" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Say 'I ate biryani' or 'plan my workout'..." style={{ flex: 1 }} />
          <button className="bp" onClick={send} disabled={!input.trim() || loading} style={{ padding: "12px 18px", fontSize: 16, flexShrink: 0 }}>→</button>
        </div>
      </div>
    </div>
  );
}