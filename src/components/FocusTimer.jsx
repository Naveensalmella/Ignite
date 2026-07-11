import { useState, useEffect, useRef, useMemo } from 'react';
import { XP } from '../data';
import { today } from '../utils';

const MODES = [
  { key: "focus", label: "Focus", duration: 25 * 60, color: "#10b981", icon: "⚡" },
  { key: "short", label: "Short Break", duration: 5 * 60, color: "#06b6d4", icon: "☕" },
  { key: "long", label: "Long Break", duration: 15 * 60, color: "#8b5cf6", icon: "🌿" },
];

const FOCUS_DURATIONS = [15, 25, 30, 45, 60, 90];

const TAGS = [
  { id: "study", label: "Study", icon: "📚" },
  { id: "work", label: "Work", icon: "💼" },
  { id: "reading", label: "Reading", icon: "📖" },
  { id: "coding", label: "Coding", icon: "💻" },
  { id: "creative", label: "Creative", icon: "🎨" },
  { id: "planning", label: "Planning", icon: "📋" },
  { id: "meditation", label: "Meditation", icon: "🧘" },
  { id: "other", label: "Other", icon: "⭐" },
];

function MiniRing({ pct, color, size, stroke = 6, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset .6s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

export default function FocusTimer({ addXP, focusLog, setFocusLog }) {
  const [mode, setMode] = useState("focus");
  const [customDuration, setCustomDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [tag, setTag] = useState("study");
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(120); // minutes

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const d = today();
  const log = focusLog || {};

  const modeConfig = MODES.find(m => m.key === mode);
  const totalDuration = mode === "focus" ? customDuration * 60 : modeConfig.duration;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  // Timer logic
  useEffect(() => {
    if (running && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setRunning(false);
            clearInterval(timerRef.current);
            handleComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  const handleComplete = () => {
    if (mode === "focus") {
      const duration = customDuration;
      setSessions(s => s + 1);
      addXP(XP.focus, `${duration}min focus`);

      // Log the session
      const session = {
        id: Date.now(),
        date: d,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration, // minutes
        tag,
        tagLabel: TAGS.find(t => t.id === tag)?.label || tag,
      };

      setFocusLog(p => ({
        ...p,
        [d]: [...(p[d] || []), session],
      }));

      // Auto-switch to break
      const newSessions = sessions + 1;
      if (newSessions % 4 === 0) {
        switchMode("long");
      } else {
        switchMode("short");
      }
    } else {
      // Break complete — switch back to focus
      switchMode("focus");
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setRunning(false);
    if (m === "focus") {
      setTimeLeft(customDuration * 60);
    } else {
      const mc = MODES.find(x => x.key === m);
      setTimeLeft(mc.duration);
    }
  };

  const toggleTimer = () => {
    if (!running) startTimeRef.current = Date.now();
    setRunning(!running);
  };

  const resetTimer = () => {
    setRunning(false);
    setTimeLeft(mode === "focus" ? customDuration * 60 : modeConfig.duration);
  };

  const changeDuration = (mins) => {
    setCustomDuration(mins);
    if (mode === "focus" && !running) {
      setTimeLeft(mins * 60);
    }
  };

  // Today's focus data
  const todaySessions = log[d] || [];
  const todayMinutes = todaySessions.reduce((s, sess) => s + (sess.duration || 0), 0);
  const goalProgress = dailyGoal > 0 ? Math.min(100, Math.round((todayMinutes / dailyGoal) * 100)) : 0;

  // Weekly data
  const weekData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const ds = dt.toISOString().split("T")[0];
      const daySessions = log[ds] || [];
      const mins = daySessions.reduce((s, sess) => s + (sess.duration || 0), 0);
      const label = dt.toLocaleDateString('en', { weekday: 'narrow' });
      days.push({ date: ds, label, minutes: mins, sessions: daySessions.length, isToday: ds === d });
    }
    return days;
  }, [log, d]);

  const weekTotal = weekData.reduce((s, d) => s + d.minutes, 0);
  const maxWeekMin = Math.max(dailyGoal, ...weekData.map(d => d.minutes));

  // Focus streak
  const focusStreak = useMemo(() => {
    let s = 0;
    const dt = new Date(); dt.setDate(dt.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const ds = dt.toISOString().split("T")[0];
      if ((log[ds] || []).length > 0) { s++; dt.setDate(dt.getDate() - 1); }
      else break;
    }
    if (todaySessions.length > 0) s++;
    return s;
  }, [log, todaySessions]);

  // All-time stats
  const stats = useMemo(() => {
    const allDates = Object.keys(log);
    const totalSessions = allDates.reduce((s, ds) => s + (log[ds] || []).length, 0);
    const totalMinutes = allDates.reduce((s, ds) => s + (log[ds] || []).reduce((s2, sess) => s2 + (sess.duration || 0), 0), 0);
    const bestDay = allDates.reduce((best, ds) => {
      const mins = (log[ds] || []).reduce((s, sess) => s + (sess.duration || 0), 0);
      return mins > best.mins ? { date: ds, mins } : best;
    }, { date: "", mins: 0 });

    // Tag breakdown
    const tagCounts = {};
    allDates.forEach(ds => {
      (log[ds] || []).forEach(sess => {
        const t = sess.tag || "other";
        tagCounts[t] = (tagCounts[t] || 0) + (sess.duration || 0);
      });
    });

    return { totalSessions, totalMinutes, bestDay, tagCounts, activeDays: allDates.filter(ds => (log[ds] || []).length > 0).length };
  }, [log]);

  // History dates
  const historyDates = Object.keys(log)
    .filter(k => (log[k] || []).length > 0)
    .sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>

      {/* ══ MODE SELECTOR ══ */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
        {MODES.map(m => (
          <span key={m.key} className={`chip ${mode === m.key ? "chip-a" : "chip-i"}`}
            onClick={() => !running && switchMode(m.key)}
            style={mode === m.key ? { background: `${m.color}15`, color: m.color, borderColor: `${m.color}30` } : { opacity: running ? 0.4 : 1 }}>
            {m.icon} {m.label}
          </span>
        ))}
      </div>

      {/* ══ MAIN TIMER ══ */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <MiniRing pct={progress} color={modeConfig.color} size={260} stroke={8}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 60, fontWeight: 800, color: modeConfig.color, fontFamily: "Rajdhani,sans-serif", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{modeConfig.label}</div>
            {mode === "focus" && <div style={{ fontSize: 11, color: "#4b5563", marginTop: 2 }}>Session {sessions + 1}</div>}
          </div>
        </MiniRing>
      </div>

      {/* ══ TAG SELECTOR (only in focus mode, before starting) ══ */}
      {mode === "focus" && !running && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", textAlign: "center", marginBottom: 8 }}>What are you focusing on?</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {TAGS.map(t => (
              <span key={t.id} className={`chip ${tag === t.id ? "chip-a" : "chip-i"}`}
                onClick={() => setTag(t.id)} style={{ padding: "6px 12px" }}>
                {t.icon} {t.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ══ DURATION PICKER (only in focus mode, before starting) ══ */}
      {mode === "focus" && !running && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
          {FOCUS_DURATIONS.map(m => (
            <span key={m} className={`chip ${customDuration === m ? "chip-a" : "chip-i"}`}
              onClick={() => changeDuration(m)} style={{ padding: "6px 12px" }}>
              {m}min
            </span>
          ))}
        </div>
      )}

      {/* ══ CONTROLS ══ */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
        <button className="bp" onClick={toggleTimer}
          style={{ minWidth: 140, fontSize: 16, padding: 14, letterSpacing: 2, background: running ? "linear-gradient(135deg,#f59e0b,#d97706)" : `linear-gradient(135deg,${modeConfig.color},${modeConfig.color}cc)` }}>
          {running ? "PAUSE" : "START"}
        </button>
        <button className="bg" onClick={resetTimer} style={{ padding: "14px 20px" }}>Reset</button>
      </div>

      {/* ══ TODAY'S PROGRESS ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div className="sl" style={{ margin: 0 }}>Today's Focus</div>
          <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>{todayMinutes} min / {dailyGoal} min goal</span>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,.04)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ height: "100%", width: `${goalProgress}%`, background: goalProgress >= 100 ? "#22c55e" : "linear-gradient(90deg,#10b981,#06b6d4)", borderRadius: 4, transition: "width .5s" }} />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>⚡ {todaySessions.length} session{todaySessions.length !== 1 ? "s" : ""}</span>
          <span style={{ fontSize: 12, color: "#fbbf24" }}>+{todaySessions.length * XP.focus} XP earned</span>
          {focusStreak > 0 && <span style={{ fontSize: 12, color: "#f97316" }}>🔥 {focusStreak}d streak</span>}
        </div>

        {/* Today's sessions */}
        {todaySessions.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {todaySessions.map(sess => {
              const tagInfo = TAGS.find(t => t.id === sess.tag) || TAGS[7];
              return (
                <div key={sess.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: "1px solid rgba(255,255,255,.03)", fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{tagInfo.icon}</span>
                    <span style={{ color: "#d1d5db" }}>{tagInfo.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, color: "#6b7280" }}>
                    <span>{sess.duration}min</span>
                    <span>{sess.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ WEEKLY OVERVIEW ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="sl" style={{ margin: 0 }}>This Week</div>
          <span style={{ fontSize: 12, color: "#06b6d4", fontWeight: 600 }}>{Math.floor(weekTotal / 60)}h {weekTotal % 60}m total</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "end", height: 80 }}>
          {weekData.map(day => (
            <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: "100%", maxWidth: 32, borderRadius: 4,
                height: day.minutes > 0 ? `${Math.max(8, (day.minutes / maxWeekMin) * 60)}px` : 4,
                background: day.minutes >= dailyGoal ? "#22c55e" : day.minutes > 0 ? "linear-gradient(180deg,#10b981,#06b6d4)" : "rgba(255,255,255,.06)",
                transition: "height .5s",
              }} />
              <div style={{ fontSize: 9, color: day.isToday ? "#10b981" : "#6b7280", fontWeight: day.isToday ? 700 : 400 }}>{day.label}</div>
              {day.minutes > 0 && <div style={{ fontSize: 8, color: "#4b5563" }}>{day.minutes}m</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ══ SETTINGS ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div onClick={() => setShowSettings(!showSettings)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
          <div className="sl" style={{ margin: 0 }}>Settings</div>
          <span style={{ color: "#6b7280", fontSize: 14 }}>{showSettings ? "▾" : "▸"}</span>
        </div>
        {showSettings && (
          <div className="fade-in" style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Daily Focus Goal (minutes)</label>
              <div style={{ display: "flex", gap: 6 }}>
                {[60, 90, 120, 150, 180].map(m => (
                  <span key={m} className={`chip ${dailyGoal === m ? "chip-a" : "chip-i"}`}
                    onClick={() => setDailyGoal(m)} style={{ flex: 1, justifyContent: "center" }}>
                    {m >= 60 ? `${m / 60}h` : `${m}m`}{m === 60 ? "" : m === 120 ? "" : ""}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              After every 4 focus sessions, you'll get a long break (15 min) instead of a short one (5 min).
            </div>
          </div>
        )}
      </div>

      {/* ══ ALL-TIME STATS ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div onClick={() => setShowStats(!showStats)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
          <div className="sl" style={{ margin: 0 }}>Focus Stats</div>
          <span style={{ color: "#6b7280", fontSize: 14 }}>{showStats ? "▾" : "▸"}</span>
        </div>
        {showStats && (
          <div className="fade-in" style={{ marginTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 14 }}>
              {[
                ["⚡", stats.totalSessions, "Total Sessions"],
                ["⏱", `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`, "Total Focus Time"],
                ["🔥", focusStreak, "Current Streak"],
                ["📅", stats.activeDays, "Active Days"],
                ["🏆", stats.bestDay.mins > 0 ? `${stats.bestDay.mins}min` : "—", "Best Day"],
                ["📊", stats.activeDays > 0 ? `${Math.round(stats.totalMinutes / stats.activeDays)}min` : "—", "Avg / Day"],
              ].map(([icon, val, label]) => (
                <div key={label} style={{ padding: 10, background: "rgba(255,255,255,.02)", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 16 }}>{icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{val}</div>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Tag breakdown */}
            {Object.keys(stats.tagCounts).length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>Time by category</div>
                {Object.entries(stats.tagCounts).sort((a, b) => b[1] - a[1]).map(([tagId, mins]) => {
                  const tagInfo = TAGS.find(t => t.id === tagId) || TAGS[7];
                  const pct = stats.totalMinutes > 0 ? Math.round((mins / stats.totalMinutes) * 100) : 0;
                  return (
                    <div key={tagId} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: "#d1d5db" }}>{tagInfo.icon} {tagInfo.label}</span>
                        <span style={{ color: "#6b7280" }}>{Math.floor(mins / 60)}h {mins % 60}m ({pct}%)</span>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,.04)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "#10b981", borderRadius: 2, transition: "width .5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ HISTORY ══ */}
      <div className="gs">
        <div onClick={() => setShowHistory(!showHistory)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
          <div className="sl" style={{ margin: 0 }}>History · {historyDates.length} days</div>
          <span style={{ color: "#6b7280", fontSize: 14 }}>{showHistory ? "▾" : "▸"}</span>
        </div>
        {showHistory && (
          <div style={{ marginTop: 12 }}>
            {historyDates.length === 0 && <div style={{ fontSize: 13, color: "#6b7280", padding: "12px 0" }}>No focus sessions yet. Start one above!</div>}
            {historyDates.slice(0, 20).map(date => {
              const daySessions = log[date] || [];
              const dayMins = daySessions.reduce((s, sess) => s + (sess.duration || 0), 0);
              const label = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
              return (
                <div key={date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#e5e7eb" }}>{label}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      {daySessions.length} session{daySessions.length !== 1 ? "s" : ""} ·
                      {daySessions.map(s => TAGS.find(t => t.id === s.tag)?.icon || "⭐").join(" ")}
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{dayMins}min</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}