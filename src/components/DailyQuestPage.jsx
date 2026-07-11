import { useState, useMemo } from 'react';
import { XP, DEFAULT_HABITS, REQUIRED_DAILY, DAILY_PENALTY } from '../data';
import { today } from '../utils';

const QUEST_CATEGORIES = [
  { id: "power", label: "Physical", icon: "💪", color: "#ef4444" },
  { id: "mind", label: "Mental", icon: "⚡", color: "#06b6d4" },
  { id: "spirit", label: "Spirit", icon: "🌟", color: "#8b5cf6" },
  { id: "heart", label: "Heart", icon: "💛", color: "#f59e0b" },
  { id: "life", label: "Life", icon: "🌱", color: "#10b981" },
];

function MiniRing({ pct, color, size = 80, stroke = 6, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

export default function DailyQuestPage({ habits, setHabits, habitLog, setHabitLog, addXP }) {
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("life");
  const [showAdd, setShowAdd] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const d = today();
  const checked = habitLog[d] || [];

  const toggle = (id) => {
    const was = checked.includes(id);
    setHabitLog(p => {
      const dl = p[d] || [];
      return { ...p, [d]: was ? dl.filter(x => x !== id) : [...dl, id] };
    });
    if (!was) addXP(XP.habit, "Quest completed");
  };

  const addQuest = () => {
    if (!newName.trim()) return;
    setHabits(p => [...p, {
      id: `h${Date.now()}`,
      name: newName.trim(),
      icon: QUEST_CATEGORIES.find(c => c.id === newCat)?.icon || "⭐",
      pillar: newCat,
    }]);
    setNewName("");
    setShowAdd(false);
  };

  const removeQuest = (id) => {
    if (DEFAULT_HABITS.find(dh => dh.id === id)) return;
    setHabits(p => p.filter(h => h.id !== id));
  };

  // Streak per habit
  const getStreak = (id) => {
    let s = 0;
    const dt = new Date();
    dt.setDate(dt.getDate() - 1); // Start from yesterday (today might be in progress)
    for (let i = 0; i < 365; i++) {
      const ds = dt.toISOString().split("T")[0];
      if ((habitLog[ds] || []).includes(id)) { s++; dt.setDate(dt.getDate() - 1); }
      else break;
    }
    // Add today if done
    if (checked.includes(id)) s++;
    return s;
  };

  // Progress
  const required = habits.filter(h => h.required);
  const optional = habits.filter(h => !h.required);
  const progress = habits.length > 0 ? Math.round((checked.length / habits.length) * 100) : 0;
  const penaltyRisk = checked.length < REQUIRED_DAILY;
  const xpEarned = checked.length * XP.habit;

  // Calendar data - current month
  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dayChecked = habitLog[ds] || [];
      const completed = dayChecked.length >= REQUIRED_DAILY;
      const partial = dayChecked.length > 0 && !completed;
      days.push({ day: i, date: ds, completed, partial, count: dayChecked.length });
    }
    return days;
  }, [habitLog]);

  const monthCompleted = calendarDays.filter(d => d?.completed).length;

  // Stats
  const stats = useMemo(() => {
    const allDates = Object.keys(habitLog).sort();
    const totalDays = allDates.length;
    const perfectDays = allDates.filter(ds => (habitLog[ds] || []).length >= REQUIRED_DAILY).length;
    const totalQuests = allDates.reduce((s, ds) => s + (habitLog[ds] || []).length, 0);

    // Longest streak
    let longest = 0, current = 0;
    const dt = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = dt.toISOString().split("T")[0];
      if ((habitLog[ds] || []).length >= REQUIRED_DAILY) { current++; longest = Math.max(longest, current); }
      else current = 0;
      dt.setDate(dt.getDate() - 1);
    }
    return { totalDays, perfectDays, totalQuests, longest };
  }, [habitLog]);

  const getCatInfo = (pillar) => QUEST_CATEGORIES.find(c => c.id === pillar) || QUEST_CATEGORIES[4];

  return (
    <div>
      {/* ══ HERO: Progress Ring + Status ══ */}
      <div className="gs" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <MiniRing pct={progress} color={progress >= 100 ? "#22c55e" : progress >= 50 ? "#10b981" : "#f59e0b"} size={90} stroke={7}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{progress}%</div>
            <div style={{ fontSize: 9, color: "#6b7280" }}>done</div>
          </div>
        </MiniRing>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>
            {checked.length}/{habits.length} Quests
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
            {progress >= 100 ? "All quests complete! 🎉" :
             `${habits.length - checked.length} remaining today`}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>+{xpEarned} XP earned</span>
            <span style={{ fontSize: 12, color: "#10b981" }}>+{XP.habit} XP each</span>
          </div>
        </div>
      </div>

      {/* ══ PENALTY WARNING ══ */}
      {penaltyRisk && (
        <div className="gs" style={{ marginBottom: 16, border: "1px solid rgba(239,68,68,.2)", background: "rgba(239,68,68,.04)", padding: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: "#ef4444", fontFamily: "Rajdhani,sans-serif", fontSize: 13, letterSpacing: 1 }}>PENALTY WARNING</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Complete <span style={{ color: "#ef4444", fontWeight: 700 }}>{REQUIRED_DAILY - checked.length}</span> more quest{REQUIRED_DAILY - checked.length > 1 ? "s" : ""} or lose <span style={{ color: "#ef4444" }}>-{DAILY_PENALTY} XP</span> at midnight. Levels CAN drop!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MANDATORY QUESTS ══ */}
      <div className="sl" style={{ color: "#ef4444", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>🔥 Mandatory Training ({required.filter(h => checked.includes(h.id)).length}/{required.length})</span>
        <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 400, letterSpacing: 0 }}>Min {REQUIRED_DAILY} required</span>
      </div>
      <div style={{ marginBottom: 20 }}>
        {required.map(h => {
          const done = checked.includes(h.id);
          const streak = getStreak(h.id);
          const cat = getCatInfo(h.pillar);
          return (
            <div key={h.id} className="gc" style={{
              padding: 14, marginBottom: 8, cursor: "pointer",
              border: done ? "1px solid rgba(34,197,94,.15)" : "1px solid rgba(255,255,255,.04)",
              background: done ? "rgba(34,197,94,.04)" : undefined,
              transition: "all .3s",
            }} onClick={() => toggle(h.id)}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, flexShrink: 0, transition: "all .3s",
                    ...(done
                      ? { background: "linear-gradient(135deg,#22c55e,#10b981)", color: "#060a0c" }
                      : { border: "2px solid #374151" }),
                  }}>{done ? "✓" : ""}</div>
                  <span style={{ fontSize: 20 }}>{h.icon}</span>
                  <div>
                    <span style={{
                      fontSize: 14, fontWeight: 500,
                      color: done ? "#6b7280" : "#e5e7eb",
                      textDecoration: done ? "line-through" : "none",
                      transition: "all .3s",
                    }}>{h.name}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {streak > 0 && (
                    <span style={{
                      fontSize: 11, padding: "3px 8px", borderRadius: 100,
                      background: streak >= 7 ? "rgba(249,115,22,.1)" : "rgba(255,255,255,.03)",
                      color: streak >= 7 ? "#f97316" : "#6b7280",
                      fontWeight: 600,
                    }}>🔥 {streak}d</span>
                  )}
                  <span style={{
                    fontSize: 9, padding: "3px 6px", borderRadius: 100,
                    background: "rgba(239,68,68,.08)", color: "#ef4444",
                    fontWeight: 700, fontFamily: "Rajdhani,sans-serif", letterSpacing: 1,
                  }}>REQ</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ ADDITIONAL QUESTS ══ */}
      <div className="sl" style={{ color: "#10b981", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>⭐ Additional Quests ({optional.filter(h => checked.includes(h.id)).length}/{optional.length})</span>
        <span onClick={() => setShowAdd(!showAdd)} style={{ fontSize: 12, color: "#10b981", cursor: "pointer", fontWeight: 600, letterSpacing: 0 }}>
          {showAdd ? "Cancel" : "+ Add Quest"}
        </span>
      </div>

      {/* Add Quest Form */}
      {showAdd && (
        <div className="gs fade-in" style={{ marginBottom: 12, border: "1px solid rgba(16,185,129,.15)" }}>
          <input className="inp" placeholder="Quest name... (e.g. Read 20 pages, Drink 3L water)"
            value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addQuest()}
            style={{ marginBottom: 10 }} autoFocus />
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {QUEST_CATEGORIES.map(c => (
              <span key={c.id} className={`chip ${newCat === c.id ? "chip-a" : "chip-i"}`}
                onClick={() => setNewCat(c.id)} style={{ padding: "6px 12px" }}>
                {c.icon} {c.label}
              </span>
            ))}
          </div>
          <button className="bp" onClick={addQuest} disabled={!newName.trim()}
            style={{ width: "100%", padding: 12 }}>+ Add Quest</button>
        </div>
      )}

      {optional.length === 0 && !showAdd && (
        <div style={{ textAlign: "center", padding: "16px 0", color: "#6b7280", fontSize: 13 }}>
          No additional quests yet. Add your own goals above.
        </div>
      )}

      {optional.map(h => {
        const done = checked.includes(h.id);
        const streak = getStreak(h.id);
        const cat = getCatInfo(h.pillar);
        return (
          <div key={h.id} className="gc" style={{
            padding: 14, marginBottom: 8, cursor: "pointer",
            border: done ? "1px solid rgba(16,185,129,.15)" : "1px solid rgba(255,255,255,.04)",
            background: done ? "rgba(16,185,129,.03)" : undefined,
            transition: "all .3s",
          }} onClick={() => toggle(h.id)}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, flexShrink: 0, transition: "all .3s",
                  ...(done
                    ? { background: "linear-gradient(135deg,#10b981,#06b6d4)", color: "#060a0c" }
                    : { border: "2px solid #374151" }),
                }}>{done ? "✓" : ""}</div>
                <span style={{ fontSize: 18 }}>{h.icon}</span>
                <div>
                  <div style={{
                    fontSize: 14, fontWeight: 500,
                    color: done ? "#6b7280" : "#e5e7eb",
                    textDecoration: done ? "line-through" : "none",
                  }}>{h.name}</div>
                  <div style={{ fontSize: 10, color: cat.color }}>{cat.label}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {streak > 0 && (
                  <span style={{ fontSize: 11, color: streak >= 7 ? "#f97316" : "#6b7280", fontWeight: 600 }}>
                    🔥 {streak}d
                  </span>
                )}
                {!DEFAULT_HABITS.find(dh => dh.id === h.id) && (
                  <span onClick={e => { e.stopPropagation(); removeQuest(h.id); }}
                    style={{ color: "#4b5563", fontSize: 16, padding: "2px 6px", cursor: "pointer" }}>×</span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* ══ CONSISTENCY CALENDAR ══ */}
      <div className="gs" style={{ marginTop: 16, marginBottom: 16 }}>
        <div onClick={() => setShowCalendar(!showCalendar)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
          <div className="sl" style={{ margin: 0 }}>
            {new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })} · {monthCompleted} perfect days
          </div>
          <span style={{ color: "#6b7280", fontSize: 14 }}>{showCalendar ? "▾" : "▸"}</span>
        </div>
        {showCalendar && (
          <div className="fade-in" style={{ marginTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center" }}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                <div key={day} style={{ fontSize: 10, color: "#6b7280", padding: 4, fontWeight: 600 }}>{day}</div>
              ))}
              {calendarDays.map((day, i) => (
                <div key={i} style={{
                  padding: 6, borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: day?.completed ? "rgba(34,197,94,.15)" :
                             day?.partial ? "rgba(245,158,11,.1)" :
                             day?.date === d ? "rgba(16,185,129,.05)" : "transparent",
                  border: day?.date === d ? "1px solid rgba(16,185,129,.2)" : "1px solid transparent",
                  color: day?.completed ? "#22c55e" :
                         day?.partial ? "#f59e0b" :
                         day ? "#4b5563" : "transparent",
                }}>
                  {day?.day || ""}
                  {day?.completed && <div style={{ width: 4, height: 4, borderRadius: 2, background: "#22c55e", margin: "2px auto 0" }} />}
                  {day?.partial && !day?.completed && <div style={{ width: 4, height: 4, borderRadius: 2, background: "#f59e0b", margin: "2px auto 0" }} />}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 10, fontSize: 11, color: "#6b7280" }}>
              <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "rgba(34,197,94,.3)", marginRight: 4 }} />Complete (4+ quests)</span>
              <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "rgba(245,158,11,.3)", marginRight: 4 }} />Partial</span>
            </div>
          </div>
        )}
      </div>

      {/* ══ QUEST STATS ══ */}
      <div className="gs">
        <div onClick={() => setShowStats(!showStats)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
          <div className="sl" style={{ margin: 0 }}>Quest Stats</div>
          <span style={{ color: "#6b7280", fontSize: 14 }}>{showStats ? "▾" : "▸"}</span>
        </div>
        {showStats && (
          <div className="fade-in" style={{ marginTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {[
                ["🏆", stats.perfectDays, "Perfect Days", "All required quests done"],
                ["🔥", stats.longest, "Longest Streak", "Consecutive perfect days"],
                ["⚡", stats.totalQuests, "Total Completed", "Quests across all days"],
                ["📅", stats.totalDays, "Days Active", "Days with any quest done"],
              ].map(([icon, val, label, desc]) => (
                <div key={label} style={{ padding: 12, background: "rgba(255,255,255,.02)", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 18 }}>{icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{val}</div>
                  <div style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
