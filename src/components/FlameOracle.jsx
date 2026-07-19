import { useState, useRef, useEffect, useMemo } from 'react';
import { getLevel, getRank, today } from '../utils';

async function callAI(messages, systemPrompt) {
  const groqKey = process.env.REACT_APP_GROQ_API_KEY;
  const geminiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (groqKey) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: systemPrompt }, ...messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text }))], max_tokens: 1024, temperature: 0.7 }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return d.choices?.[0]?.message?.content || "No response";
    } catch (e) { console.warn("Groq failed:", e.message); }
  }
  if (geminiKey) {
    const userMsg = messages[messages.length - 1]?.text || "";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: userMsg }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { maxOutputTokens: 1024, temperature: 0.7 } }),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return d.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "No response";
  }
  throw new Error("NO_KEY");
}

const MODES = [
  { id: "coach", name: "Coach", icon: "🔥", color: "#10b981", desc: "Fitness & training advice", personality: "You are an intense, motivating fitness coach. Push the user to their limits. Be direct, use short powerful sentences." },
  { id: "nutritionist", name: "Nutritionist", icon: "🍎", color: "#f59e0b", desc: "Diet & nutrition guidance", personality: "You are a knowledgeable sports nutritionist specializing in Indian diets. Give specific meal suggestions with macros." },
  { id: "wellness", name: "Wellness", icon: "🧘", color: "#8b5cf6", desc: "Mental health & recovery", personality: "You are a calm, empathetic wellness guide. Focus on sleep, stress, recovery, mindfulness. Speak gently." },
  { id: "motivator", name: "Motivator", icon: "⚡", color: "#ef4444", desc: "Pure motivation & hype", personality: "You are an EXPLOSIVE motivational speaker. Use CAPS for emphasis. Fire up the user. Short, punchy sentences." },
];

const PAGE_NAMES = { training: "⚔️ Training", nutrition: "🍎 Nutrition", dailyquest: "🎯 Daily Quests", focus: "⏱ Focus", wellness: "💛 Wellness", routine: "📅 My Day", growth: "🌱 Growth", profile: "👤 Profile", social: "👥 Social" };

export default function FlameOracle({ appState, addXP, setFoodLog, setWorkoutLog, setPage, profile, totalXP, streak, workoutLog }) {
  const d = today();

  // ── Load chats: localStorage first (survives page switches), then Firestore ──
  const initChats = () => {
    try { const local = JSON.parse(localStorage.getItem("ignite-oracle-chats")); if (Array.isArray(local) && local.length > 0 && local[0]?.messages) return local; } catch { }
    try { const s = appState?.oracleChats; if (Array.isArray(s) && s.length > 0 && s[0]?.messages) return s; } catch { }
    return [{ id: Date.now(), title: "New Chat", messages: [], mode: "coach" }];
  };

  const [chats, setChats] = useState(initChats);
  const [activeChatId, setActiveChatId] = useState(() => {
    try { return parseInt(localStorage.getItem("ignite-oracle-active")) || null; } catch { return null; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [mode, setMode] = useState("coach");
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showModes, setShowModes] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingRef = useRef(null);

  useEffect(() => { if (!activeChatId && chats.length > 0) setActiveChatId(chats[0].id); }, []);

  // ── PERSIST chats to localStorage on every change ──
  useEffect(() => {
    try { localStorage.setItem("ignite-oracle-chats", JSON.stringify(chats)); } catch { }
  }, [chats]);

  useEffect(() => {
    if (activeChatId) try { localStorage.setItem("ignite-oracle-active", activeChatId.toString()); } catch { }
  }, [activeChatId]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0] || { id: 0, title: "New Chat", messages: [], mode: "coach" };
  const messages = activeChat?.messages || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, displayText]);

  // ── User context ──
  const userContext = useMemo(() => {
    const lv = getLevel(totalXP || 0);
    const rank = getRank(lv);
    const todayFood = appState?.foodLog?.[d] || [];
    const todayWorkout = workoutLog?.[d];
    const todayCal = todayFood.reduce((s, f) => s + (f.cal || 0), 0);
    const todayProtein = todayFood.reduce((s, f) => s + (f.protein || 0), 0);
    const water = appState?.foodLog?.[`water_${d}`] || 0;
    const totalWorkouts = Object.keys(workoutLog || {}).length;
    const w = parseFloat(profile?.weight) || 70, h = parseFloat(profile?.height) || 170, age = parseInt(profile?.age) || 25;
    const bmr = profile?.gender === "female" ? 10 * w + 6.25 * h - 5 * age - 161 : 10 * w + 6.25 * h - 5 * age + 5;
    const calTarget = Math.round(bmr * 1.55 * (profile?.goal === "lose" ? 0.8 : profile?.goal === "muscle" ? 1.2 : 1));
    return `USER: ${profile?.name || "Warrior"}, Age ${profile?.age || 25}, ${profile?.gender || "male"}, ${profile?.weight || 70}kg, Goal: ${profile?.goal || "fit"}, Level: ${lv} (${rank.name}), XP: ${totalXP || 0}, Streak: ${streak || 0}d, Workouts: ${totalWorkouts}\nTODAY: Trained=${todayWorkout ? "YES (" + (todayWorkout.splitName || "done") + ")" : "NO"}, Calories=${todayCal}/${calTarget}, Protein=${Math.round(todayProtein)}g, Water=${water}/8`;
  }, [totalXP, streak, workoutLog, appState, profile, d]);

  const curMode = MODES.find(m => m.id === mode) || MODES[0];

  const newChat = () => { const c = { id: Date.now(), title: "New Chat", messages: [], mode }; setChats(p => [c, ...p]); setActiveChatId(c.id); setShowSidebar(false); };
  const switchChat = (id) => { setActiveChatId(id); setShowSidebar(false); };
  const deleteChat = (id) => { const rem = chats.filter(c => c.id !== id); if (rem.length === 0) { newChat(); return; } setChats(rem); if (activeChatId === id) setActiveChatId(rem[0].id); };
  const clearAllChats = () => { const c = { id: Date.now(), title: "New Chat", messages: [], mode }; setChats([c]); setActiveChatId(c.id); setShowSidebar(false); };

  // ── Process commands — NEVER auto-navigate, show buttons instead ──
  const processActions = (text) => {
    const actions = [];
    const foodMatches = [...text.matchAll(/\[ADD_FOOD:(.+?)\|(\d+)\|(\d+)\|(\d+)\|(\d+)\]/g)];
    for (const match of foodMatches) {
      const [, name, cal, protein, carbs, fat] = match;
      setFoodLog(prev => ({ ...prev, [d]: [...(prev[d] || []), { name, emoji: "🍽️", cal: parseInt(cal), protein: parseInt(protein), carbs: parseInt(carbs), fat: parseInt(fat), fiber: 0, meal: "Snack", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), category: "AI Logged" }] }));
      actions.push(`✅ Logged: ${name} (${cal} cal)`);
    }
    // Extract navigation but DON'T auto-navigate — return page name for button rendering
    const navMatches = [...text.matchAll(/\[NAVIGATE:(.+?)\]/g)];
    const navPages = navMatches.map(m => m[1]);
    return { actions, navPages };
  };

  // ── Typing animation ──
  const typeText = (text, callback) => {
    if (typingRef.current) clearInterval(typingRef.current);
    setIsTyping(true); setDisplayText("");
    let i = 0;
    const words = text.split(" ");
    typingRef.current = setInterval(() => {
      if (i < words.length) { setDisplayText(prev => prev + (i > 0 ? " " : "") + words[i]); i++; bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }
      else { clearInterval(typingRef.current); setIsTyping(false); if (callback) callback(); }
    }, 40);
  };

  // ── Voice input ──
  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR(); rec.lang = "en-IN"; rec.interimResults = false;
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); setIsListening(false); };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    setIsListening(true); rec.start();
  };

  // ── Send message ──
  const send = async () => {
    if (!input.trim() || loading || isTyping) return;
    const userMsg = input.trim(); setInput(""); setLoading(true);

    const updatedMessages = [...messages, { role: "user", text: userMsg, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }];
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: updatedMessages, title: c.messages.length === 0 ? userMsg.slice(0, 30) : c.title } : c));

    try {
      const systemPrompt = `You are Flame Oracle (${curMode.name} mode), AI assistant for IGNITE self-improvement app.\n\n${curMode.personality}\n\n${userContext}\n\nCONVERSATION:\n${updatedMessages.slice(-8).map(m => `${m.role}: ${m.text}`).join("\n")}\n\nCOMMANDS (use ONLY when appropriate):\n- Log food: [ADD_FOOD:name|cal|protein|carbs|fat] — use when user says they ATE something\n- Navigate: [NAVIGATE:page] — ONLY when user EXPLICITLY says "open", "go to", "take me to", or "navigate to" a page. NEVER navigate just because you mention a topic. Valid: training,nutrition,dailyquest,focus,wellness,routine,growth,profile,social\n\nIMPORTANT: Do NOT use [NAVIGATE:...] unless the user directly asks to open a page. Discussing a topic is NOT a navigation request.\n\nBe concise (2-4 paragraphs max). Use emojis naturally. Call user by name.`;

      const aiText = await callAI(updatedMessages.slice(-8), systemPrompt);
      const { actions, navPages } = processActions(aiText);
      let cleanText = aiText.replace(/\[ADD_FOOD:.*?\]/g, "").replace(/\[NAVIGATE:.*?\]/g, "").trim();
      if (actions.length > 0) cleanText += "\n\n" + actions.join("\n");

      // Store nav pages for button rendering (don't auto-navigate)
      const msgData = { role: "assistant", text: cleanText, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), mode: curMode.id, navPages: navPages.length > 0 ? navPages : undefined };

      typeText(cleanText, () => {
        const finalMessages = [...updatedMessages, msgData];
        setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: finalMessages } : c));
      });

    } catch (e) {
      let errMsg;
      if (e.message === "NO_KEY") errMsg = "⚠️ No API key found.\n\nAdd to .env.local:\nREACT_APP_GROQ_API_KEY=gsk_your_key\n\nGet free: console.groq.com/keys\nThen restart: npm start";
      else if (e.message.includes("429") || e.message.includes("rate")) errMsg = "⏳ Rate limited. Wait 60 seconds.";
      else errMsg = "❌ " + e.message;
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...updatedMessages, { role: "assistant", text: errMsg, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }] } : c));
    }
    setLoading(false); inputRef.current?.focus();
  };

  // ── Context-aware quick actions ──
  const quickActions = useMemo(() => {
    const todayWorkout = workoutLog?.[d];
    const todayCal = (appState?.foodLog?.[d] || []).reduce((s, f) => s + (f.cal || 0), 0);
    const a = [];
    if (!todayWorkout) a.push({ label: "Plan today's workout", icon: "⚔️" });
    else a.push({ label: "Review my workout", icon: "📊" });
    if (todayCal === 0) a.push({ label: "What should I eat for breakfast?", icon: "🍳" });
    else a.push({ label: "Am I on track with calories?", icon: "📊" });
    a.push({ label: "Motivate me", icon: "🔥" }, { label: "I ate chicken biryani", icon: "🍗" }, { label: "Tips for better sleep", icon: "😴" }, { label: "Quick 10-min workout", icon: "⚡" }, { label: "Check my progress", icon: "📈" }, { label: "How to increase protein?", icon: "💪" });
    return a;
  }, [workoutLog, appState, d]);

  const lv = getLevel(totalXP || 0);
  const rank = getRank(lv);

  // ── Render a single message ──
  const renderMessage = (m, i) => (
    <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12, gap: 8 }}>
      {m.role === "assistant" && <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${(MODES.find(md => md.id === m.mode) || curMode).color},#06b6d4)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginTop: 4 }}>🔮</div>}
      <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: 16, ...(m.role === "user" ? { background: "linear-gradient(135deg,#10b981,#06b6d4)", borderBottomRightRadius: 4, color: "#fff" } : { background: "rgba(255,255,255,.04)", borderBottomLeftRadius: 4, color: "#d1d5db", border: "1px solid rgba(255,255,255,.06)" }) }}>
        <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{m.text}</div>
        {/* Navigation buttons — user taps to navigate, never auto */}
        {m.navPages && m.navPages.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {m.navPages.map((page, pi) => (
              <button key={pi} onClick={() => setPage(page)} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.2)", color: "#10b981", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>→ {PAGE_NAMES[page] || page}</button>
            ))}
          </div>
        )}
        <div style={{ fontSize: 9, color: m.role === "user" ? "rgba(255,255,255,.5)" : "#4b5563", marginTop: 4, textAlign: "right" }}>{m.time}</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", position: "relative", maxWidth: "100%", overflowX: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0 12px", borderBottom: "1px solid rgba(255,255,255,.04)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span onClick={() => setShowSidebar(!showSidebar)} style={{ fontSize: 18, cursor: "pointer", padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,.03)" }}>☰</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>🔮 Flame Oracle</div>
            <div style={{ fontSize: 10, color: curMode.color }}>{curMode.icon} {curMode.name} Mode</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <span onClick={() => setShowModes(!showModes)} style={{ padding: "6px 10px", borderRadius: 8, background: `${curMode.color}10`, border: `1px solid ${curMode.color}20`, cursor: "pointer", fontSize: 16 }}>{curMode.icon}</span>
          <span onClick={newChat} style={{ fontSize: 12, color: "#10b981", cursor: "pointer", padding: "6px 12px", borderRadius: 8, background: "rgba(16,185,129,.06)" }}>+ New</span>
        </div>
      </div>

      {/* Mode selector */}
      {showModes && (
        <div className="fade-in" style={{ display: "flex", gap: 6, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.04)", flexWrap: "wrap" }}>
          {MODES.map(m => (
            <div key={m.id} onClick={() => { setMode(m.id); setShowModes(false); }} style={{ flex: 1, minWidth: 70, textAlign: "center", padding: "8px 6px", borderRadius: 10, cursor: "pointer", background: mode === m.id ? `${m.color}10` : "rgba(255,255,255,.02)", border: mode === m.id ? `1px solid ${m.color}25` : "1px solid rgba(255,255,255,.04)" }}>
              <div style={{ fontSize: 20 }}>{m.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: mode === m.id ? m.color : "#6b7280", marginTop: 2 }}>{m.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sidebar */}
      {showSidebar && (
        <div className="fade-in" style={{ position: "absolute", top: 50, left: 0, right: 0, zIndex: 10, background: "#0d1117", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: 12, maxHeight: 350, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>CHATS ({chats.length})</span>
            <span onClick={clearAllChats} style={{ fontSize: 10, color: "#ef4444", cursor: "pointer" }}>Clear All</span>
          </div>
          {chats.map(c => (
            <div key={c.id} onClick={() => switchChat(c.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: c.id === activeChatId ? "rgba(16,185,129,.06)" : "rgba(255,255,255,.02)", border: c.id === activeChatId ? "1px solid rgba(16,185,129,.15)" : "1px solid transparent" }}>
              <div>
                <div style={{ fontSize: 13, color: c.id === activeChatId ? "#10b981" : "#d1d5db", fontWeight: c.id === activeChatId ? 600 : 400 }}>{c.title || "New Chat"}</div>
                <div style={{ fontSize: 10, color: "#4b5563" }}>{c.messages?.length || 0} messages</div>
              </div>
              <span onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }} style={{ fontSize: 14, color: "#4b5563", padding: "0 4px" }}>×</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 0" }}>
        {messages.length === 0 && !isTyping && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg,${curMode.color},#06b6d4)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 12px", boxShadow: `0 0 30px ${curMode.color}30` }}>🔮</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Hey {profile?.name || "Warrior"}!</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Lv.{lv} {rank.name} · 🔥 {streak || 0}d streak · {totalXP || 0} XP</div>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 8, marginBottom: 20 }}>{curMode.desc}. Ask me anything.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {quickActions.slice(0, 6).map((qa, i) => (
                <span key={i} onClick={() => { setInput(qa.label); setTimeout(() => inputRef.current?.focus(), 100); }} style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", cursor: "pointer", fontSize: 11, color: "#d1d5db" }}>{qa.icon} {qa.label}</span>
              ))}
            </div>
          </div>
        )}

        {messages.map(renderMessage)}

        {isTyping && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${curMode.color},#06b6d4)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginTop: 4 }}>🔮</div>
            <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: 16, borderBottomLeftRadius: 4, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: "#d1d5db", whiteSpace: "pre-wrap" }}>{displayText}<span style={{ animation: "blink 1s infinite" }}>▎</span></div>
            </div>
          </div>
        )}

        {loading && !isTyping && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${curMode.color},#06b6d4)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🔮</div>
            <div style={{ padding: "14px 20px", borderRadius: 16, borderBottomLeftRadius: 4, background: "rgba(255,255,255,.04)", display: "flex", gap: 6 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: curMode.color, animation: `dotPulse 1.2s ${i * .2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, padding: "10px 0 0", borderTop: "1px solid rgba(255,255,255,.04)" }}>
        {messages.length > 0 && messages.length < 6 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto", paddingBottom: 4 }}>
            {quickActions.slice(0, 4).map((qa, i) => (
              <span key={i} onClick={() => setInput(qa.label)} style={{ flexShrink: 0, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.05)", cursor: "pointer", fontSize: 10, color: "#9ca3af" }}>{qa.icon} {qa.label}</span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          {("webkitSpeechRecognition" in window || "SpeechRecognition" in window) && (
            <button onClick={startVoice} style={{ background: isListening ? "rgba(239,68,68,.15)" : "rgba(255,255,255,.03)", border: isListening ? "1px solid rgba(239,68,68,.3)" : "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: "10px 12px", cursor: "pointer", fontSize: 16, color: isListening ? "#ef4444" : "#6b7280", flexShrink: 0 }}>
              {isListening ? "🔴" : "🎤"}
            </button>
          )}
          <input ref={inputRef} className="inp" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={`Ask ${curMode.name}...`} style={{ flex: 1 }} />
          <button className="bp" onClick={send} disabled={!input.trim() || loading || isTyping} style={{ padding: "10px 16px", fontSize: 16, flexShrink: 0, borderRadius: 12 }}>→</button>
        </div>
      </div>
      <style>{`@keyframes blink { 0%,50% { opacity: 1 } 51%,100% { opacity: 0 } }`}</style>
    </div>
  );
}