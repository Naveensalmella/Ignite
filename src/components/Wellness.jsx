import { useState, useEffect, useMemo } from 'react';
import { today } from '../utils';

const MOODS = [
  { emoji: "😄", label: "Great", color: "#22c55e", value: 5 },
  { emoji: "🙂", label: "Good", color: "#10b981", value: 4 },
  { emoji: "😐", label: "Okay", color: "#f59e0b", value: 3 },
  { emoji: "😔", label: "Low", color: "#f97316", value: 2 },
  { emoji: "😢", label: "Bad", color: "#ef4444", value: 1 },
];

const SLEEP_QUALITY = ["😴 Deep", "🙂 Good", "😐 Fair", "😟 Poor", "😩 Awful"];

function Ring({ pct, color, size = 56, stroke = 5, children }) { const r = (size - stroke) / 2, c = 2 * Math.PI * r; return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div></div>) }

export default function Wellness({ journal = {}, setJournal = () => { }, addXP = () => { } }) {
  const d = today();
  const [tab, setTab] = useState("today");
  const todayData = journal[d] || {};

  // Sleep state
  const [sleepHours, setSleepHours] = useState(todayData.sleepHours || "");
  const [sleepQuality, setSleepQuality] = useState(todayData.sleepQuality || "");
  const [bedTime, setBedTime] = useState(todayData.bedTime || "");
  const [wakeTime, setWakeTime] = useState(todayData.wakeTime || "");

  // Mood
  const [mood, setMood] = useState(todayData.mood || "");

  // Journal
  const [entry, setEntry] = useState(todayData.entry || "");
  const [gratitude, setGratitude] = useState(todayData.gratitude || ["", "", ""]);

  // Meditation
  const [medActive, setMedActive] = useState(false);
  const [medTime, setMedTime] = useState(0);
  const [medTarget, setMedTarget] = useState(300);
  const [breathPhase, setBreathPhase] = useState("Inhale");

  // Auto-save
  const save = (updates = {}) => {
    const data = { ...todayData, sleepHours: parseFloat(sleepHours) || 0, sleepQuality, bedTime, wakeTime, mood, entry, gratitude, ...updates };
    setJournal(prev => ({ ...prev, [d]: data }));
  };

  // Meditation timer
  useEffect(() => {
    if (!medActive) return;
    const interval = setInterval(() => {
      setMedTime(prev => {
        if (prev + 1 >= medTarget) { setMedActive(false); addXP(15, "Meditation session"); save({ meditationMin: Math.round(medTarget / 60) }); return 0; }
        return prev + 1;
      });
    }, 1000);
    // Breathing cycle (4-7-8)
    const breathInterval = setInterval(() => {
      setBreathPhase(prev => prev === "Inhale" ? "Hold" : prev === "Hold" ? "Exhale" : "Inhale");
    }, 4000);
    return () => { clearInterval(interval); clearInterval(breathInterval); };
  }, [medActive, medTarget]);

  // Wellness score
  const wellnessScore = useMemo(() => {
    let score = 0, max = 0;
    if (todayData.mood) { score += MOODS.find(m => m.emoji === todayData.mood)?.value || 0; max += 5; }
    if (todayData.sleepHours) { const h = parseFloat(todayData.sleepHours); score += h >= 7 ? 5 : h >= 6 ? 3 : 1; max += 5; }
    if (todayData.entry?.length > 10) { score += 3; max += 3; }
    if (todayData.gratitude?.filter(g => g.length > 0).length >= 2) { score += 2; max += 2; }
    if (todayData.meditationMin) { score += 3; max += 3; }
    return max > 0 ? Math.round((score / max) * 100) : 0;
  }, [todayData]);

  // 14-day mood history
  const moodHistory = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const ds = dt.toISOString().split("T")[0];
      const jd = journal[ds] || {};
      const moodVal = MOODS.find(m => m.emoji === jd.mood)?.value || 0;
      days.push({ date: ds, label: dt.toLocaleDateString("en", { weekday: "narrow" }), day: dt.getDate(), mood: jd.mood, value: moodVal, sleep: jd.sleepHours || 0, isToday: ds === d });
    }
    return days;
  }, [journal, d]);

  // 7-day sleep history
  const sleepHistory = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const ds = dt.toISOString().split("T")[0];
      const jd = journal[ds] || {};
      days.push({ date: ds, label: dt.toLocaleDateString("en", { weekday: "narrow" }), hours: parseFloat(jd.sleepHours) || 0, quality: jd.sleepQuality || "", isToday: ds === d });
    }
    return days;
  }, [journal, d]);

  const fmtMedTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
        {[["today", "💛 Today"], ["sleep", "😴 Sleep"], ["meditate", "🧘 Meditate"], ["trends", "📊 Trends"]].map(([k, l]) => (
          <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ flexShrink: 0, fontSize: 12 }}>{l}</span>
        ))}
      </div>

      {/* ══ TODAY TAB ══ */}
      {tab === "today" && (
        <div>
          {/* Wellness Score */}
          <div className="gs" style={{ marginBottom: 14, padding: 14, display: "flex", alignItems: "center", gap: 14 }}>
            <Ring pct={wellnessScore} color={wellnessScore >= 70 ? "#22c55e" : wellnessScore >= 40 ? "#f59e0b" : "#ef4444"} size={64} stroke={6}>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{wellnessScore}</span>
            </Ring>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Wellness Score</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{wellnessScore >= 70 ? "You're doing great today!" : wellnessScore >= 40 ? "Log more to boost your score" : "Start by tracking your mood"}</div>
            </div>
          </div>

          {/* Mood */}
          <div className="gs" style={{ marginBottom: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 10 }}>How are you feeling?</div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              {MOODS.map(m => (
                <div key={m.emoji} onClick={() => { setMood(m.emoji); save({ mood: m.emoji }); if (!todayData.mood) addXP(5, "Mood logged"); }}
                  style={{ textAlign: "center", cursor: "pointer", padding: "8px 6px", borderRadius: 12, background: mood === m.emoji ? `${m.color}15` : "transparent", border: mood === m.emoji ? `1px solid ${m.color}30` : "1px solid transparent", transition: "all .2s" }}>
                  <div style={{ fontSize: 28 }}>{m.emoji}</div>
                  <div style={{ fontSize: 10, color: mood === m.emoji ? m.color : "#6b7280", marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Sleep Log */}
          <div className="gs" style={{ marginBottom: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 8 }}>😴 Last night's sleep</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="inp" type="number" step="0.5" min="0" max="14" placeholder="Hours" value={sleepHours} onChange={e => setSleepHours(e.target.value)} onBlur={() => { save(); if (!todayData.sleepHours && sleepHours) addXP(5, "Sleep logged"); }} style={{ flex: 1 }} />
              <select className="inp" value={sleepQuality} onChange={e => { setSleepQuality(e.target.value); save({ sleepQuality: e.target.value }); }} style={{ flex: 1 }}>
                <option value="">Quality</option>
                {SLEEP_QUALITY.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </div>

          {/* Journal */}
          <div className="gs" style={{ marginBottom: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 8 }}>📝 Journal</div>
            <textarea className="inp" rows={3} placeholder="How was your day? What's on your mind?" value={entry} onChange={e => setEntry(e.target.value)} onBlur={() => { save(); if (!todayData.entry && entry.length > 10) addXP(10, "Journal entry"); }} style={{ width: "100%", resize: "none" }} />
          </div>

          {/* Gratitude */}
          <div className="gs" style={{ padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 8 }}>🙏 3 Things I'm Grateful For</div>
            {[0, 1, 2].map(i => (
              <input key={i} className="inp" placeholder={`${i + 1}. I'm grateful for...`} value={gratitude[i]} onChange={e => { const g = [...gratitude]; g[i] = e.target.value; setGratitude(g); }} onBlur={() => save()} style={{ marginBottom: 6, width: "100%" }} />
            ))}
          </div>
        </div>
      )}

      {/* ══ SLEEP TAB ══ */}
      {tab === "sleep" && (
        <div>
          <div className="gs" style={{ marginBottom: 14, padding: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 12 }}>😴 Sleep Tracker</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Bed Time</div>
                <input className="inp" type="time" value={bedTime} onChange={e => setBedTime(e.target.value)} onBlur={() => save()} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Wake Time</div>
                <input className="inp" type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} onBlur={() => save()} style={{ width: "100%" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Hours Slept</div>
                <input className="inp" type="number" step="0.5" min="0" max="14" value={sleepHours} onChange={e => setSleepHours(e.target.value)} onBlur={() => save()} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Quality</div>
                <select className="inp" value={sleepQuality} onChange={e => { setSleepQuality(e.target.value); save({ sleepQuality: e.target.value }); }} style={{ width: "100%" }}>
                  <option value="">Select</option>
                  {SLEEP_QUALITY.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 7-day sleep chart */}
          <div className="gs" style={{ padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 12 }}>📊 Sleep This Week</div>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80, marginBottom: 8 }}>
              {sleepHistory.map((day, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ fontSize: 9, color: day.hours >= 7 ? "#22c55e" : day.hours >= 5 ? "#f59e0b" : "#ef4444", fontWeight: 600, marginBottom: 2 }}>{day.hours > 0 ? `${day.hours}h` : ""}</div>
                  <div style={{ width: "100%", background: day.hours >= 7 ? "#22c55e" : day.hours >= 5 ? "rgba(245,158,11,.4)" : day.hours > 0 ? "rgba(239,68,68,.3)" : "rgba(255,255,255,.03)", borderRadius: "4px 4px 0 0", height: `${Math.max(4, (day.hours / 10) * 65)}px`, transition: "height .5s" }} />
                  <div style={{ fontSize: 10, color: day.isToday ? "#10b981" : "#6b7280", marginTop: 4, fontWeight: day.isToday ? 700 : 400 }}>{day.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4b5563" }}>
              <span>Target: 7-8 hours</span>
              <span>Avg: {(sleepHistory.reduce((s, d) => s + d.hours, 0) / Math.max(1, sleepHistory.filter(d => d.hours > 0).length)).toFixed(1)}h</span>
            </div>
          </div>
        </div>
      )}

      {/* ══ MEDITATE TAB ══ */}
      {tab === "meditate" && (
        <div>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            {/* Breathing circle */}
            <div style={{ width: 180, height: 180, borderRadius: "50%", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(circle, ${medActive ? "rgba(139,92,246,.08)" : "rgba(16,185,129,.04)"} 0%, transparent 70%)`, border: `2px solid ${medActive ? "rgba(139,92,246,.2)" : "rgba(255,255,255,.06)"}`, transition: "all 1s", transform: medActive ? (breathPhase === "Inhale" ? "scale(1.15)" : breathPhase === "Hold" ? "scale(1.15)" : "scale(0.9)") : "scale(1)" }}>
              <div style={{ textAlign: "center" }}>
                {medActive ? (
                  <>
                    <div style={{ fontSize: 36, fontWeight: 900, color: "#8b5cf6", fontFamily: "Rajdhani,sans-serif" }}>{fmtMedTime(medTime)}</div>
                    <div style={{ fontSize: 14, color: "#8b5cf6", fontWeight: 600, marginTop: 4 }}>{breathPhase}</div>
                    <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{breathPhase === "Inhale" ? "Breathe in..." : breathPhase === "Hold" ? "Hold..." : "Breathe out..."}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 36 }}>🧘</div>
                    <div style={{ fontSize: 14, color: "#8b5cf6", fontWeight: 600, marginTop: 4 }}>Meditation</div>
                  </>
                )}
              </div>
            </div>

            {!medActive ? (
              <div>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>Choose duration</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
                  {[3, 5, 10, 15, 20].map(min => (
                    <span key={min} className={`chip ${medTarget === min * 60 ? "chip-a" : "chip-i"}`} onClick={() => setMedTarget(min * 60)} style={{ padding: "10px 18px" }}>{min} min</span>
                  ))}
                </div>
                <button className="bp" onClick={() => { setMedActive(true); setMedTime(0); }} style={{ padding: "14px 40px", fontSize: 16 }}>🧘 Start Meditation</button>
              </div>
            ) : (
              <div>
                <div style={{ height: 6, background: "rgba(255,255,255,.04)", borderRadius: 3, margin: "0 40px 16px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(medTime / medTarget) * 100}%`, background: "linear-gradient(90deg,#8b5cf6,#06b6d4)", borderRadius: 3, transition: "width 1s" }} />
                </div>
                <button className="bg" onClick={() => { setMedActive(false); if (medTime >= 60) { addXP(10, "Meditation session"); save({ meditationMin: Math.round(medTime / 60) }); } }} style={{ padding: "12px 32px" }}>⏹ End Session</button>
              </div>
            )}
          </div>

          {/* Meditation tips */}
          <div className="gs" style={{ padding: 14, marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 8 }}>💡 Breathing Guide (4-7-8)</div>
            <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.8 }}>
              Inhale through nose for 4 seconds. Hold for 7 seconds. Exhale through mouth for 8 seconds. This activates your parasympathetic nervous system and reduces stress.
            </div>
          </div>
        </div>
      )}

      {/* ══ TRENDS TAB ══ */}
      {tab === "trends" && (
        <div>
          {/* 14-day mood chart */}
          <div className="gs" style={{ marginBottom: 14, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 12 }}>😊 Mood Trend (14 Days)</div>
            <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 70 }}>
              {moodHistory.map((day, i) => {
                const moodObj = MOODS.find(m => m.emoji === day.mood);
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ fontSize: 12, marginBottom: 2 }}>{day.mood || ""}</div>
                    <div style={{ width: "100%", background: moodObj ? `${moodObj.color}40` : "rgba(255,255,255,.03)", borderRadius: "4px 4px 0 0", height: `${Math.max(4, day.value * 12)}px`, transition: "height .5s" }} />
                    <div style={{ fontSize: 7, color: day.isToday ? "#10b981" : "#4b5563", marginTop: 2 }}>{day.day}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4b5563", marginTop: 6 }}>
              <span>Avg: {(moodHistory.reduce((s, d) => s + d.value, 0) / Math.max(1, moodHistory.filter(d => d.value > 0).length)).toFixed(1)}/5</span>
              <span>Logged: {moodHistory.filter(d => d.value > 0).length}/14 days</span>
            </div>
          </div>

          {/* Mood vs Sleep correlation */}
          <div className="gs" style={{ padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 12 }}>😴 Sleep vs Mood</div>
            {moodHistory.filter(d => d.value > 0 && d.sleep > 0).length < 3 ? (
              <div style={{ textAlign: "center", padding: 20, color: "#6b7280", fontSize: 12 }}>Log mood + sleep for 3+ days to see correlation</div>
            ) : (
              <div>
                {moodHistory.filter(d => d.value > 0).slice(-7).map((day, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                    <span style={{ fontSize: 10, color: "#6b7280", width: 24 }}>{day.day}</span>
                    <span style={{ fontSize: 16 }}>{day.mood}</span>
                    <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,.04)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(day.sleep / 10) * 100}%`, background: day.sleep >= 7 ? "#22c55e" : "#f59e0b", borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 10, color: "#6b7280", width: 28 }}>{day.sleep}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}