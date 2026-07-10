import { useState, useMemo } from 'react';
import { XP } from '../data';
import { today } from '../utils';

const MOODS = [
  { val: 1, emoji: "😫", label: "Burned Out", color: "#ef4444" },
  { val: 2, emoji: "😔", label: "Low Flame", color: "#f97316" },
  { val: 3, emoji: "😐", label: "Steady", color: "#f59e0b" },
  { val: 4, emoji: "🙂", label: "Blazing", color: "#22c55e" },
  { val: 5, emoji: "😄", label: "On Fire", color: "#10b981" },
];

const PROMPTS = [
  "What challenged you today and how did you handle it?",
  "What are you most proud of right now?",
  "What would make tomorrow even better?",
  "What lesson did today teach you?",
  "Describe a moment today that made you feel alive.",
  "What fear are you ready to face?",
  "What habit is serving you well? What isn't?",
  "Write about someone who inspires you and why.",
  "What would you tell your past self from 1 year ago?",
  "What does your ideal day look like?",
];

function MiniRing({ pct, color, size = 52, stroke = 5, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

export default function Wellness({ journal, setJournal, addXP }) {
  const d = today();
  const entry = journal[d] || { mood: 0, entry: "", gratitude: ["", "", ""], mL: false, jL: false, gL: false };
  const [showHistory, setShowHistory] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [historyDate, setHistoryDate] = useState(null);

  const todayPrompt = useMemo(() => {
    const idx = new Date().getDate() % PROMPTS.length;
    return PROMPTS[idx];
  }, []);

  const update = (field, value) => {
    const prev = entry;
    const next = { ...entry, [field]: value };
    if (field === "mood" && !prev.mL) { next.mL = true; addXP(XP.mood, "Mood check-in"); }
    if (field === "entry" && value.length > 20 && !prev.jL) { next.jL = true; addXP(XP.journal, "Journal entry"); }
    if (field === "gratitude") {
      const filled = value.filter(g => g.trim().length > 0).length;
      if (filled >= 3 && !prev.gL) { next.gL = true; addXP(XP.gratitude, "Gratitude practice"); }
    }
    setJournal(p => ({ ...p, [d]: next }));
  };

  const updateGratitude = (idx, val) => {
    const g = [...(entry.gratitude || ["", "", ""])];
    g[idx] = val;
    update("gratitude", g);
  };

  // Mood chart data (last 14 days)
  const moodData = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const ds = dt.toISOString().split("T")[0];
      const e = journal[ds];
      const label = dt.toLocaleDateString('en', { weekday: 'narrow' });
      const dayNum = dt.getDate();
      days.push({ date: ds, mood: e?.mood || 0, label, dayNum, isToday: ds === d });
    }
    return days;
  }, [journal, d]);

  const avgMood = useMemo(() => {
    const withMood = moodData.filter(d => d.mood > 0);
    if (withMood.length === 0) return 0;
    return Math.round(withMood.reduce((s, d) => s + d.mood, 0) / withMood.length * 10) / 10;
  }, [moodData]);

  // Journal streak
  const journalStreak = useMemo(() => {
    let s = 0;
    const dt = new Date(); dt.setDate(dt.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const ds = dt.toISOString().split("T")[0];
      if (journal[ds]?.entry?.length > 10) { s++; dt.setDate(dt.getDate() - 1); }
      else break;
    }
    if (entry.entry?.length > 10) s++;
    return s;
  }, [journal, entry]);

  // History dates
  const historyDates = Object.keys(journal)
    .filter(k => k !== d && journal[k]?.mood > 0)
    .sort((a, b) => b.localeCompare(a));

  // Daily wellness score
  const wellnessScore = useMemo(() => {
    let score = 0;
    if (entry.mood > 0) score += 33;
    if (entry.entry?.length > 20) score += 34;
    if (entry.gratitude?.filter(g => g.trim()).length >= 3) score += 33;
    return score;
  }, [entry]);

  return (
    <div>
      {/* ══ DAILY WELLNESS STATUS ══ */}
      <div className="gs" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <MiniRing pct={wellnessScore} color={wellnessScore >= 80 ? "#22c55e" : wellnessScore >= 40 ? "#f59e0b" : "#6b7280"} size={80} stroke={6}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{wellnessScore}%</div>
          </div>
        </MiniRing>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Wellness Check-in</div>
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 100, background: entry.mood > 0 ? "rgba(34,197,94,.1)" : "rgba(255,255,255,.03)", color: entry.mood > 0 ? "#22c55e" : "#6b7280" }}>
              {entry.mood > 0 ? "✓" : "○"} Mood
            </span>
            <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 100, background: entry.entry?.length > 20 ? "rgba(34,197,94,.1)" : "rgba(255,255,255,.03)", color: entry.entry?.length > 20 ? "#22c55e" : "#6b7280" }}>
              {entry.entry?.length > 20 ? "✓" : "○"} Journal
            </span>
            <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 100, background: entry.gratitude?.filter(g => g.trim()).length >= 3 ? "rgba(34,197,94,.1)" : "rgba(255,255,255,.03)", color: entry.gratitude?.filter(g => g.trim()).length >= 3 ? "#22c55e" : "#6b7280" }}>
              {entry.gratitude?.filter(g => g.trim()).length >= 3 ? "✓" : "○"} Gratitude
            </span>
          </div>
          {journalStreak > 0 && <div style={{ fontSize: 11, color: "#f97316", marginTop: 4 }}>🔥 {journalStreak} day journal streak</div>}
        </div>
      </div>

      {/* ══ MOOD PICKER ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div className="sl">How are you feeling?</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
          {MOODS.map(m => (
            <div key={m.val} onClick={() => update("mood", m.val)}
              style={{
                textAlign: "center", cursor: "pointer", padding: "8px 12px", borderRadius: 10, transition: "all .25s",
                background: entry.mood === m.val ? `${m.color}15` : "transparent",
                border: entry.mood === m.val ? `1px solid ${m.color}40` : "1px solid transparent",
                transform: entry.mood === m.val ? "scale(1.1)" : "scale(1)",
              }}>
              <div style={{ fontSize: entry.mood === m.val ? 36 : 28, transition: "font-size .2s", filter: entry.mood === m.val ? "none" : "grayscale(.5) opacity(.4)" }}>{m.emoji}</div>
              <div style={{ fontSize: 10, color: entry.mood === m.val ? m.color : "#4b5563", marginTop: 4, fontWeight: entry.mood === m.val ? 600 : 400 }}>{m.label}</div>
            </div>
          ))}
        </div>
        {entry.mood > 0 && (
          <div style={{ textAlign: "center", fontSize: 13, color: MOODS[entry.mood - 1].color, fontWeight: 600 }}>
            {MOODS[entry.mood - 1].label} {entry.mL ? "" : `· +${XP.mood} XP`}
          </div>
        )}
      </div>

      {/* ══ MOOD CHART (14 days) ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="sl" style={{ margin: 0 }}>Mood Trend · 14 Days</div>
          {avgMood > 0 && <span style={{ fontSize: 12, color: MOODS[Math.round(avgMood) - 1]?.color || "#6b7280", fontWeight: 600 }}>Avg: {avgMood}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "end", gap: 3, height: 80 }}>
          {moodData.map((day, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: "100%", maxWidth: 24, borderRadius: 4,
                height: day.mood > 0 ? `${(day.mood / 5) * 60}px` : 4,
                background: day.mood > 0 ? MOODS[day.mood - 1].color : "rgba(255,255,255,.06)",
                transition: "height .5s",
                opacity: day.isToday ? 1 : 0.7,
              }} />
              <div style={{ fontSize: 8, color: day.isToday ? "#10b981" : "#4b5563", fontWeight: day.isToday ? 700 : 400 }}>
                {day.dayNum}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "#4b5563" }}>
          <span>2 weeks ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* ══ GRATITUDE ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div className="sl">🙏 Gratitude · 3 Things <span style={{ color: "#fbbf24", fontWeight: 400 }}>+{XP.gratitude} XP</span></div>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{
              width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, fontFamily: "Rajdhani,sans-serif", flexShrink: 0,
              background: (entry.gratitude?.[i] || "").trim() ? "rgba(16,185,129,.1)" : "rgba(255,255,255,.03)",
              color: (entry.gratitude?.[i] || "").trim() ? "#10b981" : "#4b5563",
            }}>{i + 1}</span>
            <input className="inp" placeholder={["I'm grateful for...", "Something good today...", "A person, moment, or thing..."][i]}
              value={entry.gratitude?.[i] || ""}
              onChange={e => updateGratitude(i, e.target.value)}
              style={{ flex: 1 }} />
          </div>
        ))}
      </div>

      {/* ══ JOURNAL ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div className="sl" style={{ margin: 0 }}>📝 Battle Journal <span style={{ color: "#fbbf24", fontWeight: 400 }}>+{XP.journal} XP</span></div>
          <span onClick={() => setShowPrompts(!showPrompts)}
            style={{ fontSize: 11, color: "#10b981", cursor: "pointer" }}>
            {showPrompts ? "Hide prompts" : "Need a prompt?"}
          </span>
        </div>
        {showPrompts && (
          <div className="fade-in" style={{ marginBottom: 10, padding: 10, background: "rgba(16,185,129,.04)", borderRadius: 8, border: "1px solid rgba(16,185,129,.1)" }}>
            <div style={{ fontSize: 13, color: "#10b981", fontWeight: 600, marginBottom: 4 }}>Today's prompt:</div>
            <div style={{ fontSize: 14, color: "#d1d5db", fontStyle: "italic" }}>{todayPrompt}</div>
          </div>
        )}
        <textarea className="inp" placeholder="Write about your day, battles, victories, thoughts..."
          value={entry.entry || ""} onChange={e => update("entry", e.target.value)}
          style={{ minHeight: 140, resize: "vertical", lineHeight: 1.7 }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#4b5563" }}>
          <span>{(entry.entry || "").length} characters</span>
          <span>{(entry.entry || "").split(/\s+/).filter(w => w).length} words</span>
        </div>
      </div>

      {/* ══ HISTORY ══ */}
      <div className="gs">
        <div onClick={() => setShowHistory(!showHistory)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
          <div className="sl" style={{ margin: 0 }}>History · {historyDates.length} entries</div>
          <span style={{ color: "#6b7280", fontSize: 14 }}>{showHistory ? "▾" : "▸"}</span>
        </div>
        {showHistory && (
          <div style={{ marginTop: 12 }}>
            {historyDates.length === 0 && <div style={{ fontSize: 13, color: "#6b7280", padding: "12px 0" }}>No previous entries yet.</div>}
            {historyDates.slice(0, 20).map(date => {
              const e = journal[date];
              const isOpen = historyDate === date;
              const moodInfo = MOODS[(e.mood || 1) - 1];
              const label = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
              return (
                <div key={date} style={{ marginBottom: 4 }}>
                  <div onClick={() => setHistoryDate(isOpen ? null : date)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                      background: isOpen ? "rgba(16,185,129,.04)" : "transparent"
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{moodInfo?.emoji || "😐"}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#e5e7eb" }}>{label}</div>
                        <div style={{ fontSize: 11, color: moodInfo?.color }}>{moodInfo?.label}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {e.entry?.length > 10 && <span style={{ fontSize: 10, color: "#6b7280" }}>📝</span>}
                      {e.gratitude?.filter(g => g.trim()).length > 0 && <span style={{ fontSize: 10, color: "#6b7280" }}>🙏</span>}
                      <span style={{ color: "#4b5563", fontSize: 14 }}>{isOpen ? "▾" : "▸"}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="fade-in" style={{ padding: "8px 12px" }}>
                      {e.gratitude?.filter(g => g.trim()).length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginBottom: 4 }}>Grateful for:</div>
                          {e.gratitude.filter(g => g.trim()).map((g, i) => (
                            <div key={i} style={{ fontSize: 13, color: "#d1d5db", paddingLeft: 8, borderLeft: "2px solid rgba(16,185,129,.2)", marginBottom: 4 }}>{g}</div>
                          ))}
                        </div>
                      )}
                      {e.entry && (
                        <div>
                          <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600, marginBottom: 4 }}>Journal:</div>
                          <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{e.entry}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}