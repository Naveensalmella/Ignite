"use client";
import { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, History, SquarePen, X, ChevronRight, Plus, Check, Volume2, VolumeX, Mic, ArrowUp, Dumbbell, Apple, Flower2, Zap } from 'lucide-react';
import { Tabs } from './ui/kit';
import { hasDayWorkout, getDaySplit, countWorkoutDays } from '@/lib/workoutHelpers';
import { getLevel, today, toArr } from '../utils';
import useAppStore from '@/stores/useAppStore';
import { playerRank } from '@/lib/system/ranks';
import { statSheet } from '@/lib/system/stats';
import { questItems, questDay, questStatus } from '@/lib/system/quests';
import { classById } from '@/lib/system/progression';
import { aiFetch } from '@/lib/aiClient';

// Streaming AI call — calls onToken with the full text so far; resolves with the final text.
async function callAIStream(messages, mode, userContext, onToken) {
  let r;
  try {
    r = await aiFetch("/api/chat", { messages, mode, userContext }, { timeoutMs: 90000 });
  } catch (e) {
    if (e?.name === "TimeoutError") throw new Error("The coach took too long to answer. Please try again.");
    throw new Error(e?.offline ? e.message : "You seem to be offline. Check your connection and try again.");
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
  { id: "coach", name: "Trainer", icon: "⚔️", color: "#38bdf8", desc: "Fitness & training advice", personality: "You are an intense, motivating fitness coach. Push the user to their limits. Be direct, use short powerful sentences." },
  { id: "nutritionist", name: "Nutrition", icon: "🍎", color: "#f59e0b", desc: "Diet & nutrition guidance", personality: "You are a knowledgeable sports nutritionist specializing in Indian diets. Give specific meal suggestions with macros." },
  { id: "wellness", name: "Recovery", icon: "🧘", color: "#8b5cf6", desc: "Mental health & recovery", personality: "You are a calm, empathetic wellness guide. Focus on sleep, stress, recovery, mindfulness. Speak gently." },
  { id: "motivator", name: "Commander", icon: "⚡", color: "#ef4444", desc: "Pure motivation & hype", personality: "You are an EXPLOSIVE motivational speaker. Use CAPS for emphasis. Fire up the user. Short, punchy sentences." },
];

const PAGE_NAMES = { status: "Home", quests: "Quests", inventory: "Items", training: "Train", nutrition: "Nutrition", dailyquest: "Habits", focus: "Focus", wellness: "Wellness", routine: "My Day", growth: "Goals", profile: "Profile", social: "Social", army: "Shadow Army" };
const MODE_ICON = { coach: Dumbbell, nutritionist: Apple, wellness: Flower2, motivator: Zap };

function CoachAvatar() {
  return <span className="avatar !w-8 !h-8 shrink-0 mt-0.5" aria-hidden="true"><Sparkles size={15} /></span>;
}

const MAX_CHATS = 30;
const newChatObj = (mode = "coach") => ({ id: Date.now(), title: "New Chat", messages: [], mode });

export default function FlameOracle({ appState = {}, setFoodLog = () => { }, setChatHistory = () => { }, setPage = () => { }, profile = {}, totalXP = 0, streak = 0, workoutLog = {} }) {
  const d = today();

  // ── Chats live in the store (saved to the account and kept in sync across devices);
  // this page reads them from there instead of keeping its own copy. ──
  const validChats = (list) => toArr(list).filter(c => c && Array.isArray(c.messages));
  const storeChats = useAppStore(s => s.chatHistory);
  const [placeholder] = useState(() => newChatObj());
  const chats = validChats(storeChats).length ? validChats(storeChats) : [placeholder];
  const setChats = (updater) => {
    const live = validChats(useAppStore.getState().chatHistory);
    const cur = live.length ? live : [placeholder];
    setChatHistory((typeof updater === "function" ? updater(cur) : updater).slice(0, MAX_CHATS));
  };
  // One-time pick-up of chats that older versions only kept in this browser.
  useEffect(() => {
    if (validChats(useAppStore.getState().chatHistory).length) return;
    try { const local = JSON.parse(localStorage.getItem("ignite-oracle-chats")); if (validChats(local).length) setChatHistory(validChats(local).slice(0, MAX_CHATS)); } catch { /* ignore */ }
  }, [setChatHistory]);
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
  const system = useAppStore(st => st.system);
  const userContext = useMemo(() => {
    const lv = getLevel(totalXP || 0);
    const rank = playerRank(system, lv);
    const stats = statSheet(appState || {}, system).map(x => `${x.label} ${x.total}`).join(", ");
    const qItems = questItems(system, lv);
    const qDay = questDay(system, d);
    const qs = questStatus(qItems, qDay);
    const questLine = !system?.awakened ? "Not awakened yet."
      : system.penalty?.active ? "PENALTY ZONE ACTIVE (missed yesterday's Daily Quest): XP halved until the 5-minute Penalty Zone is survived."
        : `Daily Quest today: ${qDay.claimed ? "COMPLETED" : `${Math.round(qs.pct * 100)}% — ` + qItems.map(i => `${i.name} ${Number(qDay.progress?.[i.id]) || 0}/${i.target}${i.unit === "reps" ? "" : i.unit}`).join(", ")}.`;
    const systemLine = `SYSTEM STATUS: Hunter rank ${rank.name}. Stats: ${stats}. Unspent Ability Points: ${Number(system?.abilityPoints) || 0}. Gold: ${Number(system?.gold) || 0}. Job: ${classById(system?.job?.id)?.name || "none"}. Shadows: ${toArr(system?.shadows).length}. Gates cleared: ${Number(system?.gateStats?.cleared) || 0}. ${questLine}`;
    const todayFood = toArr(appState?.foodLog?.[d]);
    const todayWorked = hasDayWorkout(workoutLog, d);
    const todayCal = todayFood.reduce((s, f) => s + (f.cal || 0), 0);
    const todayProtein = todayFood.reduce((s, f) => s + (f.protein || 0), 0);
    const water = appState?.foodLog?.[`water_${d}`] || 0;
    const totalWorkouts = countWorkoutDays(workoutLog);
    const w = parseFloat(profile?.weight) || 70, h = parseFloat(profile?.height) || 170, age = parseInt(profile?.age) || 25;
    const bmr = profile?.gender === "female" ? 10 * w + 6.25 * h - 5 * age - 161 : 10 * w + 6.25 * h - 5 * age + 5;
    const calTarget = Math.round(bmr * 1.55 * (profile?.goal === "lose" ? 0.8 : profile?.goal === "muscle" ? 1.2 : 1));
    return `USER: ${profile?.name || "Warrior"}, Age ${profile?.age || 25}, ${profile?.gender || "male"}, ${profile?.weight || 70}kg, Goal: ${profile?.goal || "fit"}, Level: ${lv} (${rank.name}), XP: ${totalXP || 0}, Streak: ${streak || 0}d, Workouts: ${totalWorkouts}\nTODAY: Trained=${todayWorked ? "YES (" + (getDaySplit(workoutLog, d) || "done") + ")" : "NO"}, Calories=${todayCal}/${calTarget}, Protein=${Math.round(todayProtein)}g, Water=${water}/8\n${systemLine}`;
  }, [totalXP, streak, workoutLog, appState, profile, d, system]);

  const curMode = MODES.find(m => m.id === mode) || MODES[0];

  const newChat = () => { const c = newChatObj(mode); setChats(p => [c, ...p]); setActiveChatId(c.id); setShowSidebar(false); };
  const switchChat = (id) => { setActiveChatId(id); setShowSidebar(false); };
  const deleteChat = (id) => { const c = chats.find(x => x.id === id); if (c?.messages?.length && !window.confirm(`Delete "${c.title || "this chat"}"?`)) return; const rem = chats.filter(c => c.id !== id); if (rem.length === 0) { clearAllChats(); return; } setChats(rem); if (activeId === id) setActiveChatId(rem[0].id); };
  const clearAllChats = () => {
    if (chats.some(c => c.messages?.length) && !window.confirm("Delete all chats?")) return;
    const c = newChatObj(mode); setChats([c]); setActiveChatId(c.id); setShowSidebar(false);
  };

  // ── Commands in the reply never act on their own: food and pages become buttons
  // the user taps. Values are bounded and pages are limited to known ones. ──
  const processActions = (text) => {
    const clamp = (v, max) => Math.min(max, Math.max(0, parseInt(v) || 0));
    const foods = [...text.matchAll(/\[ADD_FOOD:(.+?)\|(\d+)\|(\d+)\|(\d+)\|(\d+)\]/g)]
      .filter(([, name, cal]) => name.trim() && +cal > 0 && +cal <= 2500) // drop implausible numbers instead of logging them
      .slice(0, 6)
      .map(([, name, cal, protein, carbs, fat]) => ({ name: name.trim().slice(0, 60), cal: +cal, protein: clamp(protein, 200), carbs: clamp(carbs, 400), fat: clamp(fat, 200) }));
    const navPages = [...new Set([...text.matchAll(/\[NAVIGATE:(.+?)\]/g)].map(m => m[1].trim().toLowerCase()))].filter(p => PAGE_NAMES[p]).slice(0, 3);
    return { foods, navPages };
  };
  const logCoachFood = (chatId, msgIndex, foodIndex) => {
    const chat = chats.find(c => c.id === chatId);
    const f = chat?.messages?.[msgIndex]?.foods?.[foodIndex];
    if (!f || f.logged) return;
    setFoodLog(prev => ({ ...prev, [d]: [...toArr(prev[d]), { name: f.name, emoji: "🍽️", cal: f.cal, protein: f.protein, carbs: f.carbs, fat: f.fat, fiber: 0, meal: "Snack", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), category: "AI Logged" }] }));
    setChats(prev => prev.map(c => c.id !== chatId ? c : { ...c, messages: c.messages.map((m, mi) => mi !== msgIndex ? m : { ...m, foods: m.foods.map((x, fi) => fi === foodIndex ? { ...x, logged: true } : x) }) }));
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
      const context = `${curMode.personality}\n\n${userContext}\n\nCOMMANDS (use ONLY when appropriate):\n- Offer to log food: [ADD_FOOD:name|cal|protein|carbs|fat] — use when the user says they ATE something (the user confirms it with a button; mention that they can tap to log it)\n- Navigate: [NAVIGATE:page] — ONLY when the user EXPLICITLY asks to open/go to a page. Valid: status,quests,training,nutrition,inventory,focus,wellness,routine,profile,social\n\nCall the user by name.`;

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
      const { foods, navPages } = processActions(aiText);
      const cleanText = aiText.replace(/\[ADD_FOOD:.*?\]/g, "").replace(/\[NAVIGATE:.*?\]/g, "").trim();

      const msgData = { role: "assistant", text: cleanText, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), mode: curMode.id, ...(navPages.length > 0 ? { navPages } : {}), ...(foods.length > 0 ? { foods } : {}) };
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
    a.push({ label: todayWorked ? "Review my workout" : "Plan today's workout" });
    a.push({ label: todayCal === 0 ? "What should I eat for breakfast?" : "Am I on track with calories?" });
    a.push({ label: "Motivate me" }, { label: "I ate chicken biryani" }, { label: "Tips for better sleep" }, { label: "Quick 10-min workout" }, { label: "Check my progress" }, { label: "How to increase protein?" });
    return a;
  }, [workoutLog, appState, d]);

  const lv = getLevel(totalXP || 0);
  const rank = playerRank(system, lv);
  const firstName = String(profile?.name || "").split(" ")[0];
  const ModeIcon = MODE_ICON[curMode.id] || Sparkles;

  // ── Render a single message ──
  const renderMessage = (m, i) => (
    <div key={i} className={`flex gap-2 mb-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
      {m.role === "assistant" && <CoachAvatar />}
      <div className="max-w-[82%] px-3.5 py-2.5" style={m.role === "user"
        ? { background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "18px 18px 6px 18px" }
        : { background: "var(--card-bg)", color: "var(--text-primary)", border: "1px solid var(--card-border)", boxShadow: "var(--card-shadow)", borderRadius: "18px 18px 18px 6px" }}>
        <div className="text-[14px] leading-relaxed whitespace-pre-wrap">{m.text}</div>
        {/* Food the coach suggests logging — nothing is added until the user taps */}
        {m.foods?.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2">
            {m.foods.map((f, fi) => (
              <button key={fi} type="button" className={`chip ${f.logged ? "chip-i" : "chip-a"} justify-between`} disabled={f.logged} onClick={() => logCoachFood(activeId, i, fi)}>
                <span className="truncate">{f.logged ? "Logged" : "Log"}: {f.name} · {f.cal} kcal</span>{f.logged ? <Check size={13} /> : <Plus size={13} />}
              </button>
            ))}
          </div>
        )}
        {/* Navigation buttons — user taps to navigate, never auto */}
        {m.navPages && m.navPages.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-2">
            {m.navPages.filter(page => PAGE_NAMES[page]).map((page, pi) => (
              <button key={pi} type="button" className="chip chip-a" onClick={() => setPage(page)}>Open {PAGE_NAMES[page]} <ChevronRight size={13} /></button>
            ))}
          </div>
        )}
        <div className="text-[11px] mt-1 text-right" style={{ color: m.role === "user" ? "color-mix(in srgb, var(--accent-ink) 60%, transparent)" : "var(--text-dim)" }}>{m.time}</div>
      </div>
    </div>
  );

  return (
    <div className="oracle-shell flex flex-col relative max-w-[760px] mx-auto w-full overflow-x-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 pb-3 shrink-0">
        <button type="button" className="icon-btn" onClick={() => setShowSidebar(!showSidebar)} aria-label="Chat history" aria-expanded={showSidebar}><History size={18} /></button>
        <div className="flex-1 min-w-0">
          <div className="row-title truncate">{activeChat.title && activeChat.messages?.length ? activeChat.title : "New chat"}</div>
          <div className="text-[12px] dim truncate inline-flex items-center gap-1"><ModeIcon size={12} /> {curMode.name} · speaks as the System</div>
        </div>
        <button type="button" className="icon-btn" onClick={newChat} aria-label="New chat"><SquarePen size={18} /></button>
      </div>

      {/* Modes */}
      <Tabs tabs={MODES.map(m => [m.id, m.name])} value={mode} onChange={setMode} label="Coach mode" className="shrink-0 mb-1" />

      {/* Chat history */}
      {showSidebar && (
        <div className="card fade-in absolute left-0 right-0 top-[52px] z-10 max-h-[360px] overflow-y-auto" style={{ boxShadow: "var(--shadow)" }}>
          <div className="card-head">
            <span className="card-title">Chats ({chats.length})</span>
            <button type="button" className="link-btn" style={{ color: "var(--danger)" }} onClick={clearAllChats}>Clear all</button>
          </div>
          {chats.map(c => (
            <div key={c.id} className="list-row">
              <button type="button" className="flex-1 min-w-0 text-left bg-transparent border-0 p-0" onClick={() => switchChat(c.id)}>
                <div className="row-title truncate" style={c.id === activeId ? { color: "var(--accent)" } : undefined}>{c.title || "New Chat"}</div>
                <div className="row-sub">{c.messages?.length || 0} messages</div>
              </button>
              <button type="button" className="icon-btn !w-8 !h-8" onClick={() => deleteChat(c.id)} aria-label={`Delete chat ${c.title || ""}`}><X size={15} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 && !isTyping && (
          <div className="text-center py-6">
            <div className="flex justify-center mb-3"><span className="avatar !w-16 !h-16"><Sparkles size={28} /></span></div>
            <div className="text-[20px] font-extrabold">Hi{firstName ? ` ${firstName}` : ""}, how can I help?</div>
            <div className="text-[12.5px] dim mt-1">Level {lv} · {rank.name} · {streak || 0}-day streak</div>
            <p className="text-[13px] muted mt-2 mb-5 px-4">{curMode.desc}. I can also log food — just tell me what you ate.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickActions.slice(0, 6).map((qa, i) => (
                <button key={i} type="button" className="chip chip-i" onClick={() => { setInput(qa.label); setTimeout(() => inputRef.current?.focus(), 100); }}>{qa.label}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map(renderMessage)}

        {isTyping && (
          <div className="flex gap-2 mb-3">
            <CoachAvatar />
            <div className="max-w-[82%] px-3.5 py-2.5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "18px 18px 18px 6px" }}>
              <div className="text-[14px] leading-relaxed whitespace-pre-wrap">{displayText}<span style={{ animation: "blink 1s infinite" }}>▎</span></div>
            </div>
          </div>
        )}

        {loading && !isTyping && (
          <div className="flex gap-2 mb-3">
            <CoachAvatar />
            <div className="flex gap-1.5 px-4 py-3.5" style={{ background: "var(--card-bg)", borderRadius: "18px 18px 18px 6px" }}>
              {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full" style={{ background: "var(--accent)", animation: `dotPulse 1.2s ${i * .2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-2">
        {messages.length > 0 && messages.length < 6 && (
          <div className="chip-row mb-2">
            {quickActions.slice(0, 4).map((qa, i) => (
              <button key={i} type="button" className="chip chip-i shrink-0" onClick={() => setInput(qa.label)}>{qa.label}</button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5 p-1.5 rounded-full" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", boxShadow: "var(--card-shadow)" }}>
          <button type="button" className="icon-btn !w-9 !h-9 shrink-0" onClick={() => { setVoiceOn(!voiceOn); if (voiceOn) stopSpeaking(); }}
            aria-label={voiceOn ? "Turn off spoken replies" : "Read replies aloud"} aria-pressed={voiceOn} style={voiceOn ? { color: "var(--accent)" } : undefined}>
            {voiceOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          {speechSupported && (
            <button type="button" className="icon-btn !w-9 !h-9 shrink-0" onClick={startVoice} aria-label="Speak your message" style={isListening ? { color: "var(--danger)" } : undefined}>
              <Mic size={17} />
            </button>
          )}
          <input ref={inputRef} className="flex-1 min-w-0 bg-transparent border-0 outline-none px-2 text-[14px]" style={{ color: "var(--text-primary)" }}
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={`Ask your ${curMode.name.toLowerCase()} coach…`} aria-label="Message" />
          <button type="button" className="bp !w-10 !h-10 !p-0 shrink-0" onClick={send} disabled={!input.trim() || loading || isTyping} aria-label="Send"><ArrowUp size={18} strokeWidth={2.6} /></button>
        </div>
      </div>
      <style>{`@keyframes blink { 0%,50% { opacity: 1 } 51%,100% { opacity: 0 } }`}</style>
    </div>
  );
}
