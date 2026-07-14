import { useState, useMemo } from 'react';
import { today } from '../utils';
import HistoryPanel from './HistoryPanel';

const CATEGORIES = [
  { id: "power", label: "Physical", icon: "💪", color: "#ef4444" },
  { id: "mind", label: "Mental", icon: "⚡", color: "#06b6d4" },
  { id: "heart", label: "Heart", icon: "💛", color: "#f59e0b" },
  { id: "spirit", label: "Spirit", icon: "🌟", color: "#8b5cf6" },
  { id: "life", label: "Life", icon: "🌱", color: "#10b981" },
];

const CAT_COLORS = { power: "#ef4444", mind: "#06b6d4", heart: "#f59e0b", spirit: "#8b5cf6", life: "#10b981" };

const PRESET_BLOCKS = [
  { time: "05:30", activity: "Wake Up", icon: "🌅", duration: 10, cat: "spirit" },
  { time: "05:40", activity: "Cold Water + Freshen Up", icon: "🚿", duration: 20, cat: "life" },
  { time: "06:00", activity: "Training / Workout", icon: "⚔️", duration: 60, cat: "power" },
  { time: "07:00", activity: "Shower + Get Ready", icon: "🧖", duration: 30, cat: "life" },
  { time: "07:30", activity: "Breakfast", icon: "🍳", duration: 30, cat: "power" },
  { time: "08:00", activity: "Deep Work / Study", icon: "💻", duration: 120, cat: "mind" },
  { time: "10:00", activity: "Break + Stretch", icon: "🤸", duration: 15, cat: "power" },
  { time: "10:15", activity: "Work / Study Block 2", icon: "📚", duration: 105, cat: "mind" },
  { time: "12:00", activity: "Lunch", icon: "🍽️", duration: 45, cat: "power" },
  { time: "12:45", activity: "Short Walk / Rest", icon: "🚶", duration: 15, cat: "spirit" },
  { time: "13:00", activity: "Afternoon Work / Study", icon: "📊", duration: 120, cat: "mind" },
  { time: "15:00", activity: "Snack Break", icon: "🍎", duration: 15, cat: "power" },
  { time: "15:15", activity: "Focus Session", icon: "🎯", duration: 90, cat: "mind" },
  { time: "16:45", activity: "Skill Practice / Learning", icon: "🧠", duration: 45, cat: "mind" },
  { time: "17:30", activity: "Evening Exercise / Walk", icon: "🏃", duration: 30, cat: "power" },
  { time: "18:00", activity: "Free Time / Hobbies", icon: "🎮", duration: 60, cat: "heart" },
  { time: "19:00", activity: "Dinner", icon: "🍽️", duration: 45, cat: "power" },
  { time: "19:45", activity: "Family / Social Time", icon: "👨‍👩‍👧", duration: 45, cat: "heart" },
  { time: "20:30", activity: "Reading", icon: "📖", duration: 30, cat: "mind" },
  { time: "21:00", activity: "Journal + Reflect", icon: "📝", duration: 20, cat: "heart" },
  { time: "21:20", activity: "Meditate + Gratitude", icon: "🧘", duration: 15, cat: "spirit" },
  { time: "21:35", activity: "Wind Down + Sleep", icon: "😴", duration: 25, cat: "spirit" },
];

const TEMPLATES = {
  warrior: { name: "Warrior's Day", icon: "⚔️", desc: "5:30 AM start, intense training, deep work focus", blocks: PRESET_BLOCKS },
  balanced: {
    name: "Balanced Day", icon: "⚖️", desc: "7 AM start, moderate pace, work-life balance", blocks: [
      { time: "07:00", activity: "Wake Up + Morning Routine", icon: "🌅", duration: 30, cat: "spirit" },
      { time: "07:30", activity: "Light Exercise / Yoga", icon: "🧘", duration: 30, cat: "power" },
      { time: "08:00", activity: "Breakfast", icon: "🍳", duration: 30, cat: "power" },
      { time: "08:30", activity: "Work / Study", icon: "💼", duration: 150, cat: "mind" },
      { time: "11:00", activity: "Break + Snack", icon: "☕", duration: 15, cat: "life" },
      { time: "11:15", activity: "Work / Study Block 2", icon: "💻", duration: 105, cat: "mind" },
      { time: "13:00", activity: "Lunch + Rest", icon: "🍽️", duration: 60, cat: "power" },
      { time: "14:00", activity: "Afternoon Work", icon: "📊", duration: 120, cat: "mind" },
      { time: "16:00", activity: "Training Session", icon: "⚔️", duration: 60, cat: "power" },
      { time: "17:00", activity: "Free Time", icon: "🎮", duration: 60, cat: "heart" },
      { time: "18:00", activity: "Dinner + Family", icon: "🍽️", duration: 90, cat: "heart" },
      { time: "19:30", activity: "Reading + Learning", icon: "📖", duration: 45, cat: "mind" },
      { time: "20:15", activity: "Journal + Meditate", icon: "📝", duration: 30, cat: "spirit" },
      { time: "20:45", activity: "Relax + Sleep", icon: "😴", duration: 30, cat: "spirit" },
    ]
  },
  student: {
    name: "Student Mode", icon: "📚", desc: "Optimized for learning, exams, and growth", blocks: [
      { time: "06:00", activity: "Wake Up + Quick Workout", icon: "💪", duration: 45, cat: "power" },
      { time: "06:45", activity: "Shower + Breakfast", icon: "🍳", duration: 45, cat: "life" },
      { time: "07:30", activity: "Study / Classes", icon: "📚", duration: 150, cat: "mind" },
      { time: "10:00", activity: "Break", icon: "☕", duration: 15, cat: "life" },
      { time: "10:15", activity: "Study Block 2", icon: "📖", duration: 105, cat: "mind" },
      { time: "12:00", activity: "Lunch", icon: "🍽️", duration: 45, cat: "power" },
      { time: "12:45", activity: "Power Nap / Walk", icon: "🚶", duration: 15, cat: "spirit" },
      { time: "13:00", activity: "Study / Classes", icon: "💻", duration: 120, cat: "mind" },
      { time: "15:00", activity: "Snack + Break", icon: "🍎", duration: 15, cat: "power" },
      { time: "15:15", activity: "Hardest Subject Focus", icon: "🧠", duration: 90, cat: "mind" },
      { time: "16:45", activity: "Training / Sports", icon: "⚔️", duration: 60, cat: "power" },
      { time: "17:45", activity: "Free Time", icon: "🎮", duration: 45, cat: "heart" },
      { time: "18:30", activity: "Dinner", icon: "🍽️", duration: 45, cat: "power" },
      { time: "19:15", activity: "Light Revision", icon: "📝", duration: 60, cat: "mind" },
      { time: "20:15", activity: "Social / Relax", icon: "💛", duration: 45, cat: "heart" },
      { time: "21:00", activity: "Journal + Sleep", icon: "😴", duration: 30, cat: "spirit" },
    ]
  },
};

function Ring({ pct, color, size = 70, stroke = 5, children }) { const r = (size - stroke) / 2, c = 2 * Math.PI * r; return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div></div>) }

export default function RoutinePage({ routineData, setRoutineData }) {
  const d = today();
  const [mode, setMode] = useState("daily"); // daily | setup | edit | history
  const [addTime, setAddTime] = useState("08:00");
  const [addName, setAddName] = useState("");
  const [addIcon, setAddIcon] = useState("⭐");
  const [addDur, setAddDur] = useState("30");
  const [addCat, setAddCat] = useState("mind");

  // Data structure: { routine: [...blocks], daily: { "date": { done: [], missed: [] } } }
  const data = routineData || { routine: [], daily: {} };
  const routine = data.routine || [];
  const dailyStatus = data.daily?.[d] || { done: [], missed: [] };

  const hasRoutine = routine.length > 0;

  const save = (newData) => setRoutineData(newData);

  // ── SETUP: Apply template or start blank ──
  const applyTemplate = (key) => {
    const t = TEMPLATES[key];
    const blocks = t.blocks.map((b, i) => ({ ...b, id: `b${i}_${Date.now()}` }));
    save({ ...data, routine: blocks });
    setMode("daily");
  };

  const startBlank = () => {
    save({ ...data, routine: [] });
    setMode("edit");
  };

  // ── EDIT: Add/Remove blocks ──
  const addBlock = () => {
    if (!addName.trim()) return;
    const newBlock = { id: `b${Date.now()}`, time: addTime, activity: addName.trim(), icon: addIcon, duration: parseInt(addDur) || 30, cat: addCat };
    const newRoutine = [...routine, newBlock].sort((a, b) => a.time.localeCompare(b.time));
    save({ ...data, routine: newRoutine });
    setAddName(""); setAddTime("08:00");
  };

  const removeBlock = (id) => {
    save({ ...data, routine: routine.filter(b => b.id !== id) });
  };

  const addPreset = (preset) => {
    const block = { ...preset, id: `b${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
    const newRoutine = [...routine, block].sort((a, b) => a.time.localeCompare(b.time));
    save({ ...data, routine: newRoutine });
  };

  // ── DAILY: Mark done/missed ──
  const markDone = (id) => {
    const newDaily = { ...data.daily, [d]: { done: [...(dailyStatus.done || []).filter(x => x !== id), id], missed: (dailyStatus.missed || []).filter(x => x !== id) } };
    save({ ...data, daily: newDaily });
  };

  const markMissed = (id) => {
    const newDaily = { ...data.daily, [d]: { done: (dailyStatus.done || []).filter(x => x !== id), missed: [...(dailyStatus.missed || []).filter(x => x !== id), id] } };
    save({ ...data, daily: newDaily });
  };

  const unmark = (id) => {
    const newDaily = { ...data.daily, [d]: { done: (dailyStatus.done || []).filter(x => x !== id), missed: (dailyStatus.missed || []).filter(x => x !== id) } };
    save({ ...data, daily: newDaily });
  };

  const getStatus = (id) => {
    if ((dailyStatus.done || []).includes(id)) return "done";
    if ((dailyStatus.missed || []).includes(id)) return "missed";
    return "pending";
  };

  // Stats
  const doneCount = (dailyStatus.done || []).length;
  const missedCount = (dailyStatus.missed || []).length;
  const totalBlocks = routine.length;
  const markedCount = doneCount + missedCount;
  const progress = totalBlocks > 0 ? Math.round((doneCount / totalBlocks) * 100) : 0;
  const totalMin = routine.reduce((s, b) => s + (b.duration || 30), 0);

  // Current time indicator
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const currentBlockIdx = routine.findIndex(b => {
    const [h, m] = b.time.split(":").map(Number);
    const blockStart = h * 60 + m;
    return blockStart + (b.duration || 30) > nowMinutes && blockStart <= nowMinutes + 30;
  });

  // History data
  const historyEntries = useMemo(() => {
    return Object.entries(data.daily || {}).filter(([date]) => date !== d).map(([date, status]) => {
      const done = (status.done || []).length;
      const missed = (status.missed || []).length;
      const total = routine.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        date,
        icon: pct >= 80 ? "🏆" : pct >= 50 ? "⚡" : "📅",
        title: `${pct}% completed`,
        subtitle: `${done} done · ${missed} missed · ${total - done - missed} unmarked`,
        value: `${done}/${total}`,
        valueColor: pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444",
        badge: pct >= 100 ? { text: "Perfect Day", color: "#22c55e" } : pct >= 80 ? { text: "Great Day", color: "#10b981" } : null,
        details: [
          { label: "Completed", value: done, color: "#22c55e" },
          { label: "Missed", value: missed, color: "#ef4444" },
          { label: "Unmarked", value: total - done - missed },
          { label: "Score", value: `${pct}%`, color: pct >= 80 ? "#22c55e" : "#f59e0b" },
        ],
        items: routine.map(b => {
          const s = (status.done || []).includes(b.id) ? "done" : (status.missed || []).includes(b.id) ? "missed" : "unmarked";
          return {
            icon: s === "done" ? "✅" : s === "missed" ? "❌" : "⬜",
            text: `${b.time} — ${b.activity}`,
            sub: `${b.duration}min`,
            value: s === "done" ? "✓" : s === "missed" ? "✗" : "—",
            valueColor: s === "done" ? "#22c55e" : s === "missed" ? "#ef4444" : "#4b5563",
          };
        }),
      };
    });
  }, [data.daily, routine, d]);

  // ══ NO ROUTINE — SETUP ══
  if (!hasRoutine && mode !== "edit") {
    return (<div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>Build Your Daily Routine</h2>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>Create once, follow every day. Choose a template or build your own.</p>
      </div>

      {Object.entries(TEMPLATES).map(([key, t]) => (
        <div key={key} className="gc" onClick={() => applyTemplate(key)} style={{ padding: 16, marginBottom: 10, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 32 }}>{t.icon}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6" }}>{t.name}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{t.desc}</div>
              <div style={{ fontSize: 11, color: "#4b5563", marginTop: 2 }}>{t.blocks.length} activities · {Math.floor(t.blocks.reduce((s, b) => s + (b.duration || 30), 0) / 60)}h planned</div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button className="bg" onClick={startBlank} style={{ padding: "12px 24px" }}>🛠️ Build From Scratch</button>
      </div>
    </div>);
  }

  // ══ EDIT MODE ══
  if (mode === "edit") {
    return (<div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>🛠️ Edit Routine</div><div style={{ fontSize: 12, color: "#6b7280" }}>{routine.length} blocks · {Math.floor(totalMin / 60)}h {totalMin % 60}m</div></div>
        <button className="bp" onClick={() => setMode("daily")} style={{ padding: "8px 18px" }}>✓ Done</button>
      </div>

      {/* Add Block Form */}
      <div className="gs" style={{ marginBottom: 16, border: "1px solid rgba(16,185,129,.15)" }}>
        <div className="sl">Add New Block</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input className="inp" type="time" value={addTime} onChange={e => setAddTime(e.target.value)} style={{ width: 110 }} />
          <input className="inp" placeholder="Activity name" value={addName} onChange={e => setAddName(e.target.value)} style={{ flex: 1 }} />
          <input className="inp" type="number" placeholder="min" value={addDur} onChange={e => setAddDur(e.target.value)} style={{ width: 60, textAlign: "center" }} />
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {CATEGORIES.map(c => <span key={c.id} className={`chip ${addCat === c.id ? "chip-a" : "chip-i"}`} onClick={() => setAddCat(c.id)}>{c.icon} {c.label}</span>)}
        </div>
        <button className="bp" onClick={addBlock} disabled={!addName.trim()} style={{ width: "100%", padding: 10 }}>+ Add Block</button>
      </div>

      {/* Quick Add from Presets */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div className="sl">Quick Add</div>
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
          {PRESET_BLOCKS.filter(p => !routine.some(r => r.activity === p.activity)).map((p, i) => (
            <div key={i} onClick={() => addPreset(p)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.03)", cursor: "pointer" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 16 }}>{p.icon}</span>
                <div><div style={{ fontSize: 13, color: "#e5e7eb" }}>{p.activity}</div><div style={{ fontSize: 10, color: "#4b5563" }}>{p.time} · {p.duration}min</div></div>
              </div>
              <span style={{ color: "#10b981", fontSize: 18 }}>+</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Routine */}
      <div className="sl">Your Routine ({routine.length})</div>
      {routine.map(b => (
        <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: CAT_COLORS[b.cat] || "#6b7280", flexShrink: 0 }} />
          <span style={{ fontSize: 16 }}>{b.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#e5e7eb" }}>{b.activity}</div>
            <div style={{ fontSize: 11, color: "#4b5563" }}>{b.time} · {b.duration}min</div>
          </div>
          <span onClick={() => removeBlock(b.id)} style={{ color: "#ef4444", fontSize: 14, cursor: "pointer", padding: "4px 8px" }}>✕</span>
        </div>
      ))}

      {/* Reset */}
      <button onClick={() => { save({ ...data, routine: [] }); }} style={{ width: "100%", marginTop: 16, padding: 10, background: "transparent", border: "1px solid rgba(239,68,68,.15)", borderRadius: 8, color: "#ef4444", fontSize: 12, cursor: "pointer" }}>Reset Routine</button>
    </div>);
  }

  // ══ HISTORY MODE ══
  if (mode === "history") {
    return (<div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>📅 Routine History</div>
        <button className="bg" onClick={() => setMode("daily")} style={{ padding: "8px 16px" }}>← Back</button>
      </div>
      <HistoryPanel entries={historyEntries} title="Daily Routine History" emptyText="Follow your routine for a day to see history here" />
    </div>);
  }

  // ══ DAILY VIEW ══
  return (<div>
    {/* Header */}
    <div className="gs" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <Ring pct={progress} color={progress >= 80 ? "#22c55e" : progress >= 50 ? "#f59e0b" : "#ef4444"} size={75} stroke={6}>
        <div style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{progress}%</div><div style={{ fontSize: 8, color: "#6b7280" }}>done</div></div>
      </Ring>
      <div style={{ flex: 1, minWidth: 140 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Today's Routine</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
          <span style={{ color: "#22c55e" }}>✓ {doneCount}</span> · <span style={{ color: "#ef4444" }}>✗ {missedCount}</span> · <span>{totalBlocks - markedCount} remaining</span>
        </div>
        <div style={{ fontSize: 11, color: "#4b5563", marginTop: 2 }}>{Math.floor(totalMin / 60)}h {totalMin % 60}m planned</div>
      </div>
    </div>

    {/* Action buttons */}
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      <button className="bg" onClick={() => setMode("edit")} style={{ flex: 1, padding: 10 }}>✏️ Edit</button>
      <button className="bg" onClick={() => setMode("history")} style={{ flex: 1, padding: 10 }}>📅 History</button>
    </div>

    {/* Timeline */}
    {routine.map((b, i) => {
      const status = getStatus(b.id);
      const isCurrent = i === currentBlockIdx;
      const [bh, bm] = b.time.split(":").map(Number);
      const blockMin = bh * 60 + bm;
      const isPast = blockMin + (b.duration || 30) < nowMinutes;
      const catColor = CAT_COLORS[b.cat] || "#6b7280";

      return (
        <div key={b.id} style={{ display: "flex", gap: 10, position: "relative" }}>
          {/* Timeline rail */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24 }}>
            <div style={{
              width: 12, height: 12, borderRadius: "50%", flexShrink: 0, transition: "all .3s",
              background: status === "done" ? "#22c55e" : status === "missed" ? "#ef4444" : isCurrent ? "#10b981" : "rgba(255,255,255,.06)",
              border: isCurrent && status === "pending" ? "2px solid #10b981" : "none",
              boxShadow: isCurrent ? "0 0 8px rgba(16,185,129,.4)" : "none",
            }} />
            {i < routine.length - 1 && <div style={{ width: 2, flex: 1, background: status === "done" ? "rgba(34,197,94,.2)" : "rgba(255,255,255,.04)" }} />}
          </div>

          {/* Block card */}
          <div style={{
            flex: 1, padding: "10px 14px", marginBottom: 6, borderRadius: 10, transition: "all .2s",
            background: status === "done" ? "rgba(34,197,94,.04)" : status === "missed" ? "rgba(239,68,68,.03)" : isCurrent ? "rgba(16,185,129,.04)" : "rgba(255,255,255,.015)",
            border: isCurrent && status === "pending" ? "1px solid rgba(16,185,129,.2)" : status === "done" ? "1px solid rgba(34,197,94,.1)" : status === "missed" ? "1px solid rgba(239,68,68,.1)" : "1px solid rgba(255,255,255,.03)",
            opacity: status === "done" || status === "missed" ? 0.75 : 1,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                <span style={{ fontSize: 18 }}>{b.icon}</span>
                <div>
                  <div style={{
                    fontSize: 14, fontWeight: 500, color: status === "done" ? "#6b7280" : "#e5e7eb",
                    textDecoration: status === "done" ? "line-through" : "none",
                  }}>{b.activity}</div>
                  <div style={{ fontSize: 11, color: "#4b5563" }}>
                    {b.time} · {b.duration}min
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: catColor, marginLeft: 6, verticalAlign: "middle" }} />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {status === "pending" && (
                  <>
                    <button onClick={() => markDone(b.id)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(34,197,94,.2)", background: "rgba(34,197,94,.06)", color: "#22c55e", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</button>
                    <button onClick={() => markMissed(b.id)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(239,68,68,.2)", background: "rgba(239,68,68,.06)", color: "#ef4444", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✗</button>
                  </>
                )}
                {status !== "pending" && (
                  <button onClick={() => unmark(b.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,.06)", background: "transparent", color: "#6b7280", fontSize: 10, cursor: "pointer" }}>Undo</button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>);
}