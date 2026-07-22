import { useState, useEffect, useRef, useMemo } from 'react';
import { today } from '../utils';

const TAGS = ["Study", "Work", "Code", "Read", "Create", "Exercise", "Other"];
const POMODORO = { work: 25, shortBreak: 5, longBreak: 15 };

function Ring({ pct, color, size = 56, stroke = 5, children }) { const r = (size - stroke) / 2, c = 2 * Math.PI * r; return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div></div>) }

export default function FocusTimer({ focusLog = {}, setFocusLog = () => { }, addXP = () => { } }) {
  const d = today();
  const [tab, setTab] = useState("focus");
  const [mode, setMode] = useState("pomodoro"); // pomodoro | freeform
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(POMODORO.work * 60);
  const [phase, setPhase] = useState("work"); // work | break
  const [pomCount, setPomCount] = useState(0);
  const [tag, setTag] = useState("Study");
  const [dailyGoal, setDailyGoal] = useState(120); // minutes
  const [freeformElapsed, setFreeformElapsed] = useState(0);
  const intervalRef = useRef(null);

  const todaySessions = focusLog[d] || [];
  const todayMinutes = todaySessions.reduce((s, sess) => s + (sess.duration || 0), 0);
  const goalPct = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  // Timer logic
  useEffect(() => {
    if (!isRunning) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      if (mode === "pomodoro") {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (phase === "work") {
              const dur = POMODORO.work;
              logSession(dur);
              setPomCount(p => p + 1);
              const isLongBreak = (pomCount + 1) % 4 === 0;
              setPhase("break");
              return (isLongBreak ? POMODORO.longBreak : POMODORO.shortBreak) * 60;
            } else {
              setPhase("work");
              return POMODORO.work * 60;
            }
          }
          return prev - 1;
        });
      } else {
        setFreeformElapsed(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode, phase, pomCount]);

  const logSession = (durationMin) => {
    const session = { duration: durationMin, tag, start: new Date().toISOString(), type: mode };
    setFocusLog(prev => ({ ...prev, [d]: [...(prev[d] || []), session] }));
    addXP(Math.round(durationMin * 0.5), "Focus session");
  };

  const startTimer = () => {
    if (mode === "pomodoro") { setTimeLeft(POMODORO.work * 60); setPhase("work"); }
    else { setFreeformElapsed(0); }
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (mode === "freeform" && freeformElapsed >= 60) {
      logSession(Math.round(freeformElapsed / 60));
    }
    setFreeformElapsed(0);
  };

  const fmtTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // 7-day history
  const weekHistory = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const ds = dt.toISOString().split("T")[0];
      const sessions = focusLog[ds] || [];
      const mins = sessions.reduce((s, sess) => s + (sess.duration || 0), 0);
      days.push({ date: ds, label: dt.toLocaleDateString("en", { weekday: "narrow" }), minutes: mins, sessions: sessions.length, isToday: ds === d });
    }
    return days;
  }, [focusLog, d]);

  const maxMin = Math.max(1, ...weekHistory.map(d => d.minutes));

  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
        {[["focus", "⏱ Focus"], ["stats", "📊 Stats"]].map(([k, l]) => (
          <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ flexShrink: 0, fontSize: 12 }}>{l}</span>
        ))}
      </div>

      {/* ══ FOCUS TAB ══ */}
      {tab === "focus" && (
        <div>
          {/* Daily Goal */}
          <div className="gs" style={{ marginBottom: 14, padding: 14, display: "flex", alignItems: "center", gap: 14 }}>
            <Ring pct={goalPct} color={goalPct >= 100 ? "#22c55e" : "#06b6d4"} size={64} stroke={6}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{todayMinutes}</div>
                <div style={{ fontSize: 8, color: "#6b7280" }}>min</div>
              </div>
            </Ring>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Daily Focus Goal</div>
              <div style={{ fontSize: 12, color: goalPct >= 100 ? "#22c55e" : "#6b7280" }}>{goalPct >= 100 ? "✅ Goal reached!" : `${dailyGoal - todayMinutes} min to go`}</div>
              <div style={{ fontSize: 10, color: "#4b5563", marginTop: 2 }}>{todaySessions.length} sessions today · {pomCount} pomodoros</div>
            </div>
          </div>

          {/* Mode selector */}
          {!isRunning && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <div className={`gc ${mode === "pomodoro" ? "" : ""}`} onClick={() => setMode("pomodoro")} style={{ flex: 1, padding: 14, textAlign: "center", cursor: "pointer", border: mode === "pomodoro" ? "1px solid rgba(6,182,212,.2)" : "1px solid rgba(255,255,255,.04)", background: mode === "pomodoro" ? "rgba(6,182,212,.04)" : undefined }}>
                <div style={{ fontSize: 20 }}>🍅</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: mode === "pomodoro" ? "#06b6d4" : "#f3f4f6", marginTop: 4 }}>Pomodoro</div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>25 min work + 5 break</div>
              </div>
              <div className="gc" onClick={() => setMode("freeform")} style={{ flex: 1, padding: 14, textAlign: "center", cursor: "pointer", border: mode === "freeform" ? "1px solid rgba(16,185,129,.2)" : "1px solid rgba(255,255,255,.04)", background: mode === "freeform" ? "rgba(16,185,129,.04)" : undefined }}>
                <div style={{ fontSize: 20 }}>⏱</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: mode === "freeform" ? "#10b981" : "#f3f4f6", marginTop: 4 }}>Free Focus</div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>Open-ended timer</div>
              </div>
            </div>
          )}

          {/* Tag selector */}
          {!isRunning && (
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {TAGS.map(t => (
                <span key={t} className={`chip ${tag === t ? "chip-a" : "chip-i"}`} onClick={() => setTag(t)} style={{ fontSize: 11 }}>{t}</span>
              ))}
            </div>
          )}

          {/* Timer Display */}
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Ring pct={mode === "pomodoro" ? ((1 - timeLeft / (phase === "work" ? POMODORO.work * 60 : (pomCount % 4 === 0 ? POMODORO.longBreak : POMODORO.shortBreak) * 60)) * 100) : 100} color={phase === "work" ? "#06b6d4" : "#22c55e"} size={180} stroke={8}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>
                  {mode === "pomodoro" ? fmtTime(timeLeft) : fmtTime(freeformElapsed)}
                </div>
                {isRunning && (
                  <div style={{ fontSize: 12, color: phase === "work" ? "#06b6d4" : "#22c55e", fontWeight: 600, marginTop: 4 }}>
                    {mode === "pomodoro" ? (phase === "work" ? "🍅 Focus Time" : "☕ Break Time") : `⏱ Focusing on ${tag}`}
                  </div>
                )}
              </div>
            </Ring>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
            {!isRunning ? (
              <button className="bp" onClick={startTimer} style={{ padding: "14px 40px", fontSize: 16 }}>▶ Start {mode === "pomodoro" ? "Pomodoro" : "Focus"}</button>
            ) : (
              <>
                <button className="bg" onClick={() => setIsRunning(false)} style={{ padding: "14px 20px" }}>⏸ Pause</button>
                <button style={{ padding: "14px 24px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, color: "#ef4444", cursor: "pointer", fontSize: 14 }} onClick={stopTimer}>⏹ Stop</button>
              </>
            )}
          </div>

          {/* Today's sessions */}
          {todaySessions.length > 0 && (
            <div className="gs" style={{ marginTop: 16, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 8 }}>Today's Sessions</div>
              {todaySessions.map((sess, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < todaySessions.length - 1 ? "1px solid rgba(255,255,255,.03)" : "none" }}>
                  <span style={{ fontSize: 12, color: "#d1d5db" }}>{sess.tag || "Focus"} · {sess.type === "pomodoro" ? "🍅" : "⏱"}</span>
                  <span style={{ fontSize: 12, color: "#06b6d4", fontWeight: 600 }}>{sess.duration} min</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ STATS TAB ══ */}
      {tab === "stats" && (
        <div>
          {/* Weekly chart */}
          <div className="gs" style={{ marginBottom: 14, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 12 }}>📊 Focus This Week</div>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80, marginBottom: 8 }}>
              {weekHistory.map((day, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ fontSize: 9, color: day.minutes > 0 ? "#06b6d4" : "#4b5563", fontWeight: 600, marginBottom: 2 }}>{day.minutes > 0 ? `${day.minutes}m` : ""}</div>
                  <div style={{ width: "100%", background: day.isToday ? "#06b6d4" : day.minutes > 0 ? "rgba(6,182,212,.3)" : "rgba(255,255,255,.03)", borderRadius: "4px 4px 0 0", height: `${Math.max(4, (day.minutes / maxMin) * 65)}px`, transition: "height .5s" }} />
                  <div style={{ fontSize: 10, color: day.isToday ? "#06b6d4" : "#6b7280", marginTop: 4, fontWeight: day.isToday ? 700 : 400 }}>{day.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4b5563" }}>
              <span>Total: {weekHistory.reduce((s, d) => s + d.minutes, 0)} min</span>
              <span>Avg: {Math.round(weekHistory.reduce((s, d) => s + d.minutes, 0) / Math.max(1, weekHistory.filter(d => d.minutes > 0).length))} min/day</span>
            </div>
          </div>

          {/* Stats cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="gc" style={{ padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#06b6d4", fontFamily: "Rajdhani,sans-serif" }}>{todayMinutes}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Minutes Today</div>
            </div>
            <div className="gc" style={{ padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{todaySessions.length}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Sessions Today</div>
            </div>
            <div className="gc" style={{ padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#f59e0b", fontFamily: "Rajdhani,sans-serif" }}>{Object.values(focusLog).flat().length}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Total Sessions</div>
            </div>
            <div className="gc" style={{ padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#8b5cf6", fontFamily: "Rajdhani,sans-serif" }}>{Math.round(Object.values(focusLog).flat().reduce((s, sess) => s + (sess.duration || 0), 0) / 60)}h</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Total Hours</div>
            </div>
          </div>

          {/* Goal setting */}
          <div className="gs" style={{ marginTop: 14, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 8 }}>🎯 Daily Goal</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[60, 90, 120, 180, 240].map(min => (
                <span key={min} className={`chip ${dailyGoal === min ? "chip-a" : "chip-i"}`} onClick={() => setDailyGoal(min)} style={{ flex: 1, textAlign: "center", fontSize: 11 }}>{min >= 60 ? `${min / 60}h` : `${min}m`}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}