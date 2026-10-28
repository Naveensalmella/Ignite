"use client";
import { useState, useMemo, useEffect } from 'react';
import { StaggerContainer, StaggerItem } from './PageTransition';
import { today, toArr } from '@/utils';

const TEMPLATES = {
  default: {
    name: "Default", icon: "☀️", blocks: [
      { id: "1", time: "06:00", name: "Wake Up", icon: "🌅", duration: 10, category: "health" },
      { id: "2", time: "06:15", name: "Morning Workout", icon: "💪", duration: 45, category: "fitness" },
      { id: "3", time: "07:00", name: "Shower & Get Ready", icon: "🚿", duration: 30, category: "health" },
      { id: "4", time: "07:30", name: "Breakfast", icon: "🥣", duration: 20, category: "nutrition" },
      { id: "5", time: "09:00", name: "Work / Study", icon: "💼", duration: 180, category: "work" },
      { id: "6", time: "12:00", name: "Lunch", icon: "🍽️", duration: 30, category: "nutrition" },
      { id: "7", time: "12:30", name: "Walk / Rest", icon: "🚶", duration: 30, category: "health" },
      { id: "8", time: "13:00", name: "Work / Study", icon: "📚", duration: 180, category: "work" },
      { id: "9", time: "17:00", name: "Evening Workout", icon: "⚔️", duration: 45, category: "fitness" },
      { id: "10", time: "18:00", name: "Dinner", icon: "🍛", duration: 30, category: "nutrition" },
      { id: "11", time: "19:00", name: "Free Time", icon: "🎮", duration: 60, category: "leisure" },
      { id: "12", time: "21:00", name: "Journal & Reflect", icon: "📝", duration: 15, category: "mind" },
      { id: "13", time: "21:30", name: "Sleep", icon: "😴", duration: 0, category: "health" },
    ]
  },
  earlybird: {
    name: "Early Bird", icon: "🐦", blocks: [
      { id: "1", time: "05:00", name: "Wake Up", icon: "🌅", duration: 10, category: "health" },
      { id: "2", time: "05:15", name: "Meditation", icon: "🧘", duration: 20, category: "mind" },
      { id: "3", time: "05:35", name: "Morning Run", icon: "🏃", duration: 40, category: "fitness" },
      { id: "4", time: "06:30", name: "Cold Shower", icon: "🚿", duration: 10, category: "health" },
      { id: "5", time: "07:00", name: "Healthy Breakfast", icon: "🥗", duration: 20, category: "nutrition" },
      { id: "6", time: "08:00", name: "Deep Work", icon: "💻", duration: 240, category: "work" },
      { id: "7", time: "12:00", name: "Lunch", icon: "🍽️", duration: 30, category: "nutrition" },
      { id: "8", time: "13:00", name: "Work", icon: "📊", duration: 180, category: "work" },
      { id: "9", time: "17:00", name: "Gym", icon: "💪", duration: 60, category: "fitness" },
      { id: "10", time: "19:00", name: "Dinner", icon: "🍛", duration: 30, category: "nutrition" },
      { id: "11", time: "20:00", name: "Reading", icon: "📖", duration: 60, category: "mind" },
      { id: "12", time: "21:00", name: "Sleep", icon: "😴", duration: 0, category: "health" },
    ]
  },
  student: {
    name: "Student", icon: "🎓", blocks: [
      { id: "1", time: "07:00", name: "Wake Up", icon: "🌅", duration: 10, category: "health" },
      { id: "2", time: "07:30", name: "Breakfast", icon: "🥣", duration: 20, category: "nutrition" },
      { id: "3", time: "08:00", name: "Classes", icon: "📚", duration: 180, category: "work" },
      { id: "4", time: "11:00", name: "Study Session", icon: "✏️", duration: 120, category: "work" },
      { id: "5", time: "13:00", name: "Lunch", icon: "🍽️", duration: 30, category: "nutrition" },
      { id: "6", time: "14:00", name: "Classes / Lab", icon: "🔬", duration: 120, category: "work" },
      { id: "7", time: "16:00", name: "Workout", icon: "💪", duration: 45, category: "fitness" },
      { id: "8", time: "17:00", name: "Free Time", icon: "🎮", duration: 60, category: "leisure" },
      { id: "9", time: "18:00", name: "Dinner", icon: "🍛", duration: 30, category: "nutrition" },
      { id: "10", time: "19:00", name: "Study / Revision", icon: "📖", duration: 120, category: "work" },
      { id: "11", time: "21:00", name: "Relax", icon: "📱", duration: 60, category: "leisure" },
      { id: "12", time: "22:00", name: "Sleep", icon: "😴", duration: 0, category: "health" },
    ]
  },
  weekend: {
    name: "Weekend", icon: "🌴", blocks: [
      { id: "1", time: "08:00", name: "Wake Up Late", icon: "🌅", duration: 10, category: "health" },
      { id: "2", time: "08:30", name: "Big Breakfast", icon: "🥞", duration: 30, category: "nutrition" },
      { id: "3", time: "09:00", name: "Workout", icon: "💪", duration: 60, category: "fitness" },
      { id: "4", time: "10:00", name: "Hobby / Side Project", icon: "🎨", duration: 120, category: "mind" },
      { id: "5", time: "12:00", name: "Lunch", icon: "🍽️", duration: 30, category: "nutrition" },
      { id: "6", time: "13:00", name: "Socialise / Go Out", icon: "👥", duration: 180, category: "leisure" },
      { id: "7", time: "16:00", name: "Self Care", icon: "💛", duration: 60, category: "health" },
      { id: "8", time: "17:00", name: "Free Time", icon: "🎮", duration: 120, category: "leisure" },
      { id: "9", time: "19:00", name: "Dinner", icon: "🍛", duration: 30, category: "nutrition" },
      { id: "10", time: "20:00", name: "Movie / Series", icon: "🎬", duration: 120, category: "leisure" },
      { id: "11", time: "22:00", name: "Sleep", icon: "😴", duration: 0, category: "health" },
    ]
  },
};

const CATS = {
  fitness: { color: "#38bdf8", label: "Fitness" },
  nutrition: { color: "#f59e0b", label: "Nutrition" },
  work: { color: "#3b82f6", label: "Work" },
  health: { color: "#06b6d4", label: "Health" },
  mind: { color: "#8b5cf6", label: "Mind" },
  leisure: { color: "#ec4899", label: "Leisure" },
};

// Firestore data is untrusted: routine may be an object with numeric keys, blocks may lack ids
const normRoutine = (r) => toArr(r).filter(b => b && typeof b === "object").map((b, i) => (b.id != null ? b : { ...b, id: `r${i}` }));
const asObj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

export default function RoutinePage({ routineData = null, setRoutineData = () => { } }) {
  const d = today();
  const data = asObj(routineData);
  const routine = useMemo(() => normRoutine(routineData?.routine), [routineData]);
  const daily = asObj(data.daily);
  const todayDone = toArr(asObj(daily[d]).done);

  const [showTemplates, setShowTemplates] = useState(routine.length === 0);
  const [customMode, setCustomMode] = useState(false);
  const [customBlocks, setCustomBlocks] = useState([]);
  const [customName, setCustomName] = useState('');
  const [customTime, setCustomTime] = useState('06:00');
  const [customIcon, setCustomIcon] = useState('⭐');
  const [customCat, setCustomCat] = useState('work');
  const [customDuration, setCustomDuration] = useState(30);
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTime, setNewTime] = useState("08:00");
  const newIcon = "⭐";
  const [newCat, setNewCat] = useState("work");

  // Current time for highlighting — re-render every minute so the NOW marker moves
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const getMin = (t) => { const [h, m] = (t || "00:00").split(":").map(Number); return h * 60 + m; };

  // Find current activity
  const currentIdx = useMemo(() => {
    for (let i = routine.length - 1; i >= 0; i--) {
      if (nowMin >= getMin(routine[i].time)) return i;
    }
    return -1;
  }, [routine, nowMin]);

  // Stats
  const totalBlocks = routine.length;
  const doneCount = routine.filter(b => todayDone.includes(b.id)).length;
  const pct = totalBlocks > 0 ? Math.round((doneCount / totalBlocks) * 100) : 0;

  const catStats = useMemo(() => {
    const stats = {};
    routine.forEach(b => {
      const cat = b.category || "work";
      stats[cat] = (stats[cat] || 0) + (Number(b.duration) || 30);
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [routine]);

  // Handlers
  // All writes are functional and merge into the latest stored data (no stale snapshots)
  const update = (fn) => setRoutineData(prev => {
    const p = asObj(prev);
    return { ...p, ...fn({ routine: normRoutine(p.routine), daily: asObj(p.daily) }) };
  });

  // Switching routine keeps past days' history but clears today's checks (block ids differ)
  const setNewRoutine = (blocks) => update(({ daily: dl }) => ({ routine: blocks, daily: { ...dl, [d]: { done: [] } } }));

  const applyTemplate = (key) => {
    const template = TEMPLATES[key];
    if (routine.length > 0 && !window.confirm(`Replace your current routine with the ${template.name} template?`)) return;
    setNewRoutine(template.blocks);
    setShowTemplates(false);
  };

  const toggleDone = (blockId) => update(({ daily: dl }) => {
    const cur = toArr(asObj(dl[d]).done);
    const done = cur.includes(blockId) ? cur.filter(x => x !== blockId) : [...cur, blockId];
    return { daily: { ...dl, [d]: { done } } };
  });

  const markAllDone = () => update(({ routine: r, daily: dl }) => ({ daily: { ...dl, [d]: { done: r.map(b => b.id) } } }));

  const addBlock = () => {
    if (!newName.trim()) return;
    const block = { id: Date.now().toString(), time: newTime || "08:00", name: newName.trim(), icon: newIcon, duration: 30, category: newCat };
    update(({ routine: r }) => ({ routine: [...r, block].sort((a, b) => getMin(a.time) - getMin(b.time)) }));
    setNewName(""); setAddMode(false);
  };

  const removeBlock = (id) => update(({ routine: r }) => ({ routine: r.filter(b => b.id !== id) }));

  const resetRoutine = () => {
    if (window.confirm("Reset entire routine? This removes all blocks.")) {
      setRoutineData({ routine: [], daily: {} });
      setShowTemplates(true);
    }
  };

  // ── Custom Plan Builder ──
  const ICONS = ['🌅', '💪', '🏃', '🧘', '🚿', '🥣', '💼', '📚', '✏️', '💻', '🍽️', '🚶', '⚔️', '🎮', '📖', '📝', '😴', '🎨', '👥', '📊', '🔬', '🎬', '📱', '💛', '🎯', '⭐'];
  const DURATIONS = [10, 15, 20, 30, 45, 60, 90, 120, 180, 240];

  const addCustomBlock = () => {
    if (!customName.trim()) return;
    const block = { id: Date.now().toString(), time: customTime, name: customName.trim(), icon: customIcon, duration: customDuration, category: customCat };
    const updated = [...customBlocks, block].sort((a, b) => getMin(a.time) - getMin(b.time));
    setCustomBlocks(updated);
    setCustomName('');
    // Auto-increment time
    const mins = ((getMin(customTime) || 0) + customDuration) % 1440; // wrap past midnight so the time input stays valid
    const nextH = Math.floor(mins / 60).toString().padStart(2, '0');
    const nextM = (mins % 60).toString().padStart(2, '0');
    setCustomTime(`${nextH}:${nextM}`);
  };

  const saveCustomPlan = () => {
    if (customBlocks.length < 2) return;
    setNewRoutine(customBlocks);
    setCustomMode(false);
    setCustomBlocks([]);
    setShowTemplates(false);
  };

  if (customMode) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani, sans-serif" }}>✨ Build Your Day</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{customBlocks.length} activities added</div>
          </div>
          <span onClick={() => { setCustomMode(false); setShowTemplates(true); setCustomBlocks([]); }} style={{ fontSize: 12, color: "#6b7280", cursor: "pointer" }}>← Back</span>
        </div>

        {/* Add activity form */}
        <div className="gs" style={{ marginBottom: 14, padding: 14 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input className="inp" type="time" aria-label="Start time" value={customTime} onChange={e => setCustomTime(e.target.value)} style={{ width: 100 }} />
            <input className="inp" placeholder="Activity name" value={customName} onChange={e => setCustomName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomBlock()} style={{ flex: 1 }} />
          </div>

          {/* Icon picker */}
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Icon</div>
          <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
            {ICONS.map(icon => (
              <span key={icon} onClick={() => setCustomIcon(icon)} style={{ fontSize: 18, padding: "4px 6px", borderRadius: 8, cursor: "pointer", background: customIcon === icon ? "rgba(56,189,248,.15)" : "transparent", border: customIcon === icon ? "1px solid rgba(56,189,248,.2)" : "1px solid transparent" }}>{icon}</span>
            ))}
          </div>

          {/* Duration */}
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Duration</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto" }}>
            {DURATIONS.map(dur => (
              <span key={dur} className={`chip ${customDuration === dur ? "chip-a" : "chip-i"}`} onClick={() => setCustomDuration(dur)} style={{ fontSize: 11, flexShrink: 0 }}>
                {dur >= 60 ? `${dur / 60}h` : `${dur}m`}
              </span>
            ))}
          </div>

          {/* Category */}
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Category</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {Object.entries(CATS).map(([key, cat]) => (
              <span key={key} className={`chip ${customCat === key ? "chip-a" : "chip-i"}`} onClick={() => setCustomCat(key)} style={{ fontSize: 11 }}>{cat.label}</span>
            ))}
          </div>

          <button className="bp" onClick={addCustomBlock} disabled={!customName.trim()} style={{ width: "100%", padding: 12, fontSize: 13 }}>
            ＋ Add Activity
          </button>
        </div>

        {/* Preview of added blocks */}
        {customBlocks.length > 0 && (
          <div>
            <div className="sl" style={{ marginBottom: 8 }}>Your Plan Preview</div>
            {customBlocks.map((block, i) => (
              <div key={block.id} style={{ display: "flex", gap: 10, padding: "8px 12px", marginBottom: 4, borderRadius: 10, background: "rgba(255,255,255,.02)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: CATS[block.category]?.color || "#6b7280" }} />
                  {i < customBlocks.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 16, background: "rgba(255,255,255,.04)", marginTop: 2 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#f3f4f6" }}>{block.icon} {block.name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{block.time} · {block.duration >= 60 ? `${block.duration / 60}h` : `${block.duration}m`}</div>
                </div>
                <span onClick={() => setCustomBlocks(customBlocks.filter(b => b.id !== block.id))} style={{ fontSize: 14, color: "#4b5563", cursor: "pointer" }}>×</span>
              </div>
            ))}

            <button className="bp" onClick={saveCustomPlan} disabled={customBlocks.length < 2} style={{ width: "100%", marginTop: 12, padding: 14, fontSize: 14 }}>
              ✅ Save My Plan ({customBlocks.length} activities)
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Template Selection ──
  if (showTemplates || routine.length === 0) {
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani, sans-serif" }}>Set Up Your Day</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Choose a template to get started</div>
          {routine.length > 0 && <span onClick={() => setShowTemplates(false)} style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: "#6b7280", cursor: "pointer" }}>← Back to my routine</span>}
        </div>

        <StaggerContainer>
          {/* Custom Plan */}
          <StaggerItem>
            <div className="gc" onClick={() => { setShowTemplates(false); setCustomMode(true); }} style={{ marginBottom: 10, padding: 16, cursor: "pointer", border: "1px solid rgba(56,189,248,.15)", background: "rgba(56,189,248,.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>✨</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#38bdf8", fontFamily: "Rajdhani, sans-serif" }}>Custom Plan</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Build your own day from scratch</div>
                </div>
                <span style={{ fontSize: 11, color: "#38bdf8" }}>Create →</span>
              </div>
            </div>
          </StaggerItem>

          {Object.entries(TEMPLATES).map(([key, tmpl]) => (
            <StaggerItem key={key}>
              <div className="gc" onClick={() => applyTemplate(key)} style={{ marginBottom: 10, padding: 16, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{tmpl.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani, sans-serif" }}>{tmpl.name}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{tmpl.blocks.length} activities · {tmpl.blocks[0]?.time} — {tmpl.blocks[tmpl.blocks.length - 1]?.time}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "#38bdf8" }}>Use →</span>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <StaggerContainer>
        {/* Today's Progress */}
        <StaggerItem>
          <div className="gs" style={{ marginBottom: 14, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani, sans-serif" }}>Today&apos;s Progress</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{doneCount}/{totalBlocks} completed</div>
              </div>
              <div style={{ position: "relative", width: 48, height: 48 }}>
                <svg width={48} height={48} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={24} cy={24} r={20} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={4} />
                  <circle cx={24} cy={24} r={20} fill="none" stroke={pct >= 100 ? "#22c55e" : "#38bdf8"} strokeWidth={4} strokeDasharray={125.6} strokeDashoffset={125.6 * (1 - pct / 100)} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani, sans-serif" }}>{pct}%</div>
              </div>
            </div>

            {/* Category breakdown */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {catStats.map(([cat, mins]) => (
                <span key={cat} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 100, background: `${CATS[cat]?.color || "#6b7280"}12`, color: CATS[cat]?.color || "#6b7280", border: `1px solid ${CATS[cat]?.color || "#6b7280"}20` }}>
                  {CATS[cat]?.label || cat} · {Math.round(mins / 60)}h
                </span>
              ))}
            </div>
          </div>
        </StaggerItem>

        {/* Actions */}
        <StaggerItem>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button className="bp" onClick={markAllDone} style={{ flex: 1, padding: "10px 14px", fontSize: 12 }}>✅ Mark All Done</button>
            <button className="bg" onClick={() => setAddMode(!addMode)} style={{ padding: "10px 14px", fontSize: 12 }}>{addMode ? "✕" : "＋ Add"}</button>
            <button className="bg" onClick={resetRoutine} style={{ padding: "10px 14px", fontSize: 12 }}>🔄</button>
          </div>
        </StaggerItem>

        {/* Add new block */}
        {addMode && (
          <StaggerItem>
            <div className="gs" style={{ marginBottom: 14, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani, sans-serif", marginBottom: 10 }}>Add Activity</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input className="inp" type="time" aria-label="Start time" value={newTime} onChange={e => setNewTime(e.target.value)} style={{ width: 110 }} />
                <input className="inp" placeholder="Activity name" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: 1 }} />
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {Object.entries(CATS).map(([key, cat]) => (
                  <span key={key} className={`chip ${newCat === key ? "chip-a" : "chip-i"}`} onClick={() => setNewCat(key)} style={{ fontSize: 11 }}>{cat.label}</span>
                ))}
              </div>
              <button className="bp" onClick={addBlock} disabled={!newName.trim()} style={{ width: "100%", padding: 10, fontSize: 13 }}>Add to Routine</button>
            </div>
          </StaggerItem>
        )}

        {/* Timeline */}
        {routine.map((block, i) => {
          const isDone = todayDone.includes(block.id);
          const isCurrent = i === currentIdx;
          const cat = CATS[block.category] || CATS.work;

          return (
            <StaggerItem key={block.id}>
              <div onClick={() => toggleDone(block.id)} style={{ display: "flex", gap: 12, marginBottom: 4, cursor: "pointer", padding: "10px 12px", borderRadius: 12, background: isCurrent ? "rgba(56,189,248,.06)" : isDone ? "rgba(34,197,94,.03)" : "transparent", border: isCurrent ? "1px solid rgba(56,189,248,.15)" : "1px solid transparent", transition: "all .2s" }}>
                {/* Timeline line + dot */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: isDone ? "#22c55e" : isCurrent ? "#38bdf8" : "rgba(255,255,255,.08)", border: isCurrent ? "2px solid #38bdf8" : "none", boxShadow: isCurrent ? "0 0 8px rgba(56,189,248,.3)" : "none", flexShrink: 0 }} />
                  {i < routine.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 24, background: isDone ? "rgba(34,197,94,.2)" : "rgba(255,255,255,.04)", marginTop: 4 }} />}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{block.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isDone ? "#6b7280" : "#f3f4f6", textDecoration: isDone ? "line-through" : "none" }}>{block.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: 11, color: "#6b7280" }}>{block.time}</span>
                          {block.duration > 0 && <span style={{ fontSize: 11, color: "#4b5563" }}>· {block.duration >= 60 ? `${Math.floor(block.duration / 60)}h${block.duration % 60 > 0 ? ` ${block.duration % 60}m` : ""}` : `${block.duration}m`}</span>}
                          <span style={{ fontSize: 11, padding: "1px 5px", borderRadius: 100, background: `${cat.color}12`, color: cat.color }}>{cat.label}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {isDone && <span style={{ fontSize: 14, color: "#22c55e" }}>✓</span>}
                      {isCurrent && !isDone && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: "rgba(56,189,248,.15)", color: "#38bdf8", fontWeight: 600 }}>NOW</span>}
                      <span onClick={e => { e.stopPropagation(); removeBlock(block.id); }} style={{ fontSize: 14, color: "#4b5563", padding: "2px 4px", cursor: "pointer" }}>×</span>
                    </div>
                  </div>
                </div>
              </div>
            </StaggerItem>
          );
        })}

        {/* Change template */}
        <StaggerItem>
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <span onClick={() => setShowTemplates(true)} style={{ fontSize: 11, color: "#6b7280", cursor: "pointer", textDecoration: "underline" }}>Change template</span>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}