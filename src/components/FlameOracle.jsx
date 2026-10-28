"use client";
import { useState, useRef, useEffect, useMemo } from 'react';
import { hasDayWorkout, getDaySplit, countWorkoutDays } from '@/lib/workoutHelpers';
import { getLevel, getRank, today, toArr } from '../utils';

// Streaming AI call — calls onToken with the full text so far; resolves with the final text.
async function callAIStream(messages, mode, userContext, onToken) {
  let r;
  try {
    r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, mode, userContext }),
    });
  } catch {
    throw new Error("You seem to be offline. Check your connection and try again.");
  }

  if (!r.ok || !r.headers.get("content-type")?.includes("text/event-stream")) {
    let msg = `The AI service returned an error (${r.status}).`;
    try { const data = await r.json(); if (data.error) msg = data.error; } catch { /* not JSON */ }
    throw new Error(msg);
  }

  const reader = r.body?.getReader();
  if (!reader) throw new Error("Streaming isn't supported in this browser.");
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";
  let streamError = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // keep a partial line for the next chunk
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      let parsed;
      try { parsed = JSON.parse(data); } catch { continue; }
      if (parsed.error) streamError = parsed.error;
      if (parsed.token) {
        fullText += parsed.token;
        onToken?.(fullText);
      }
    }
  }
  if (!fullText && streamError) throw new Error(streamError);
  return fullText || "I couldn't come up with a reply — please try asking again.";
}

// ── Voice Output (AI speaks back) ──
function speakText(text) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*#🔥💪⚔️🍎⚡🎯📊✅❌🏆]/g, "").replace(/\n/g, ". ").slice(0, 500);
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 0.8;
  utterance.lang = "en-IN";
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang.includes("en") && v.name.includes("Google")) || voices.find(v => v.lang.includes("en"));
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

const MODES = [
  { id: "coach", name: "Coach", icon: "🔥", color: "#10b981", desc: "Fitness & training advice", personality: "You are an intense, motivating fitness coach. Push the user to their limits. Be direct, use short powerful sentences." },
  { id: "nutritionist", name: "Nutritionist", icon: "🍎", color: "#f59e0b", desc: "Diet & nutrition guidance", personality: "You are a knowledgeable sports nutritionist specializing in Indian diets. Give specific meal suggestions with macros." },
  { id: "wellness", name: "Wellness", icon: "🧘", color: "#8b5cf6", desc: "Mental health & recovery", personality: "You are a calm, empathetic wellness guide. Focus on sleep, stress, recovery, mindfulness. Speak gently." },
  { id: "motivator", name: "Motivator", icon: "⚡", color: "#ef4444", desc: "Pure motivation & hype", personality: "You are an EXPLOSIVE motivational speaker. Use CAPS for emphasis. Fire up the user. Short, punchy sentences." },
];

const PAGE_NAMES = { training: "⚔️ Training", nutrition: "🍎 Nutrition", dailyquest: "🎯 Daily Quests", focus: "⏱ Focus", wellness: "💛 Wellness", routine: "📅 My Day", growth: "🌱 Growth", profile: "👤 Profile", social: "👥 Social" };

const MAX_CHATS = 30;
const newChatObj = (mode = "coach") => ({ id: Date.now(), title: "New Chat", messages: [], mode });

export default function FlameOracle({ appState = {}, setFoodLog = () => { }, setChatHistory = () => { }, setPage = () => { }, profile = {}, totalXP = 0, streak = 0, workoutLog = {} }) {
  const d = today();

  // ── Load chats: Firestore (via Zustand) is source of truth, localStorage is fast cache ──
  const initChats = () => {
    // Account data (synced to Firestore via the store) is the source of truth
    const fromStore = toArr(appState?.oracleChats).filter(c => c && Array.isArray(c.messages));
    if (fromStore.length > 0) return fromStore;
    // One-time pick-up of chats that older versions only kept in this browser
    try { const local = JSON.parse(localStorage.getItem("ignite-oracle-chats")); if (Array.isArray(local) && local.length > 0 && local[0]?.messages) return local; } catch { /* ignore */ }
    return [newChatObj()];
  };

  const [chats, setChatsRaw] = useState(initChats);
  const setChats = (updater) => setChatsRaw(prev => (typeof updater === "function" ? updater(prev) : updater).slice(0, MAX_CHATS));
  // Mirror chats to the store, which saves them to the user's account.
  useEffect(() => { setChatHistory(chats); }, [chats, setChatHistory]);
  const [activeChatId, setActiveChatId] = useState(() => {
    let saved = null;
    try { saved = parseInt(localStorage.getItem("ignite-oracle-active"), 10) || null; } catch { /* ignore */ }
    return saved;
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [mode, setMode] = useState("coach");
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showModes, setShowModes] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (activeChatId) try { localStorage.setItem("ignite-oracle-active", activeChatId.toString()); } catch { /* ignore */ }
  }, [activeChatId]);

  // The chat being shown (falls back to the newest one if the saved id is gone)
  const activeChat = chats.find(c => c.id === activeChatId) || chats[0] || newChatObj();
  const activeId = activeChat.id;
  const speechSupported = typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const messages = activeChat?.messages || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, displayText]);

  // ── User context ──
  const userContext = useMemo(() => {
    const lv = getLevel(totalXP || 0);
    const rank = getRank(lv);
    const todayFood = toArr(appState?.foodLog?.[d]);
    const todayWorked = hasDayWorkout(workoutLog, d);
    const todayCal = todayFood.reduce((s, f) => s + (f.cal || 0), 0);
    const todayProtein = todayFood.reduce((s, f) => s + (f.protein || 0), 0);
    const water = appState?.foodLog?.[`water_${d}`] || 0;
    const totalWorkouts = countWorkoutDays(workoutLog);
    const w = parseFloat(profile?.weight) || 70, h = parseFloat(profile?.height) || 170, age = parseInt(profile?.age) || 25;
    const bmr = profile?.gender === "female" ? 10 * w + 6.25 * h - 5 * age - 161 : 10 * w + 6.25 * h - 5 * age + 5;
    const calTarget = Math.round(bmr * 1.55 * (profile?.goal === "lose" ? 0.8 : profile?.goal === "muscle" ? 1.2 : 1));
    return `USER: ${profile?.name || "Warrior"}, Age ${profile?.age || 25}, ${profile?.gender || "male"}, ${profile?.weight || 70}kg, Goal: ${profile?.goal || "fit"}, Level: ${lv} (${rank.name}), XP: ${totalXP || 0}, Streak: ${streak || 0}d, Workouts: ${totalWorkouts}\nTODAY: Trained=${todayWorked ? "YES (" + (getDaySplit(workoutLog, d) || "done") + ")" : "NO"}, Calories=${todayCal}/${calTarget}, Protein=${Math.round(todayProtein)}g, Water=${water}/8`;
  }, [totalXP, streak, workoutLog, appState, profile, d]);

  const curMode = MODES.find(m => m.id === mode) || MODES[0];

  const newChat = () => { const c = newChatObj(mode); setChats(p => [c, ...p]); setActiveChatId(c.id); setShowSidebar(false); };
  const switchChat = (id) => { setActiveChatId(id); setShowSidebar(false); };
  const deleteChat = (id) => { const rem = chats.filter(c => c.id !== id); if (rem.length === 0) { clearAllChats(); return; } setChats(rem); if (activeId === id) setActiveChatId(rem[0].id); };
  const clearAllChats = () => {
    if (chats.some(c => c.messages?.length) && !window.confirm("Delete all chats?")) return;
    const c = newChatObj(mode); setChats([c]); setActiveChatId(c.id); setShowSidebar(false);
  };

  // ── Process commands — NEVER auto-navigate, show buttons instead ──
  const processActions = (text) => {
    const actions = [];
    const foodMatches = [...text.matchAll(/\[ADD_FOOD:(.+?)\|(\d+)\|(\d+)\|(\d+)\|(\d+)\]/g)];
    for (const match of foodMatches) {
      const [, name, cal, protein, carbs, fat] = match;
      setFoodLog(prev => ({ ...prev, [d]: [...toArr(prev[d]), { name, emoji: "🍽️", cal: parseInt(cal), protein: parseInt(protein), carbs: parseInt(carbs), fat: parseInt(fat), fiber: 0, meal: "Snack", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), category: "AI Logged" }] }));
      actions.push(`✅ Logged: ${name} (${cal} cal)`);
    }
    // Extract navigation but DON'T auto-navigate — return page name for button rendering
    const navMatches = [...text.matchAll(/\[NAVIGATE:(.+?)\]/g)];
    const navPages = navMatches.map(m => m[1]);
    return { actions, navPages };
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

    const chatId = activeId;
    const updatedMessages = [...messages, { role: "user", text: userMsg, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }];
    setChats(prev => {
      const exists = prev.some(c => c.id === chatId);
      const base = exists ? prev : [{ ...activeChat, id: chatId }, ...prev];
      return base.map(c => c.id === chatId ? { ...c, messages: updatedMessages, title: c.messages.length === 0 ? userMsg.slice(0, 30) : c.title } : c);
    });

    try {
      const context = `${curMode.personality}\n\n${userContext}\n\nCOMMANDS (use ONLY when appropriate):\n- Log food: [ADD_FOOD:name|cal|protein|carbs|fat] — use when the user says they ATE something\n- Navigate: [NAVIGATE:page] — ONLY when the user EXPLICITLY asks to open/go to a page. Valid: training,nutrition,dailyquest,focus,wellness,routine,growth,profile,social\n\nCall the user by name.`;

      // Stream response in real-time
      setIsTyping(true);
      setDisplayText("");

      const aiText = await callAIStream(updatedMessages.slice(-10).map(m => ({ role: m.role, text: m.text })), curMode.id, context, (partialText) => {
        // Update display as tokens arrive
        const clean = partialText.replace(/\[ADD_FOOD:.*?\]/g, "").replace(/\[NAVIGATE:.*?\]/g, "").trim();
        setDisplayText(clean);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      });

      setIsTyping(false);
      const { actions, navPages } = processActions(aiText);
      let cleanText = aiText.replace(/\[ADD_FOOD:.*?\]/g, "").replace(/\[NAVIGATE:.*?\]/g, "").trim();
      if (actions.length > 0) cleanText += "\n\n" + actions.join("\n");

      const msgData = { role: "assistant", text: cleanText, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), mode: curMode.id, navPages: navPages.length > 0 ? navPages : undefined };
      const finalMessages = [...updatedMessages, msgData];
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: finalMessages } : c));
      if (voiceOn) speakText(cleanText);

    } catch (e) {
      setIsTyping(false);
      const raw = e?.message || "Something went wrong.";
      const errMsg = /429|rate/i.test(raw) ? "⏳ The AI is busy right now. Please wait a minute and try again." : "⚠️ " + raw;
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...updatedMessages, { role: "assistant", text: errMsg, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }] } : c));
    }
    setLoading(false); inputRef.current?.focus();
  };

  // ── Context-aware quick actions ──
  const quickActions = useMemo(() => {
    const todayWorked = hasDayWorkout(workoutLog, d);
    const todayCal = toArr(appState?.foodLog?.[d]).reduce((s, f) => s + (f.cal || 0), 0);
    const a = [];
    if (!todayWorked) a.push({ label: "Plan today's workout", icon: "⚔️" });
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
        <div style={{ fontSize: 11, color: m.role === "user" ? "rgba(255,255,255,.5)" : "#4b5563", marginTop: 4, textAlign: "right" }}>{m.time}</div>
      </div>
    </div>
  );

  return (
    <div className="oracle-shell" style={{ display: "flex", flexDirection: "column", position: "relative", maxWidth: "100%", overflowX: "hidden" }}>
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
            <div key={c.id} onClick={() => switchChat(c.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: c.id === activeId ? "rgba(16,185,129,.06)" : "rgba(255,255,255,.02)", border: c.id === activeId ? "1px solid rgba(16,185,129,.15)" : "1px solid transparent" }}>
              <div>
                <div style={{ fontSize: 13, color: c.id === activeId ? "#10b981" : "#d1d5db", fontWeight: c.id === activeId ? 600 : 400 }}>{c.title || "New Chat"}</div>
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
          {/* Voice output toggle */}
          <button onClick={() => { setVoiceOn(!voiceOn); if (voiceOn) stopSpeaking(); }} style={{ background: voiceOn ? "rgba(16,185,129,.15)" : "rgba(255,255,255,.03)", border: voiceOn ? "1px solid rgba(16,185,129,.3)" : "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: "10px 12px", cursor: "pointer", fontSize: 16, color: voiceOn ? "#10b981" : "#6b7280", flexShrink: 0 }}>
            {voiceOn ? "🔊" : "🔇"}
          </button>
          {speechSupported && (
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