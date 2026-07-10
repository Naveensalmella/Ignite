import { useState, useMemo } from 'react';
import { getLevel, getLevelProg, getRank, xpToNext, getStreakMult, calcBMI, bmiCat, bmiCol, today } from '../utils';
import { GATES, RANKS, REQUIRED_DAILY, PILLAR_MISSIONS, XP } from '../data';

const PILLAR_CONFIG = [
  { key: "physical", label: "Physical", icon: "💪", color: "#ef4444" },
  { key: "mental", label: "Mental", icon: "⚡", color: "#06b6d4" },
  { key: "emotional", label: "Emotional", icon: "💛", color: "#f59e0b" },
  { key: "spiritual", label: "Spirit", icon: "🌟", color: "#8b5cf6" },
  { key: "financial", label: "Fortune", icon: "💎", color: "#eab308" },
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
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

export default function Dashboard({ appState, setPage, totalXP, streak, workoutLog }) {
  const { habitLog, tasks, habits, user, profile, foodLog, journal, pillarProg, finances } = appState;
  const d = today();

  // ── LEVEL & RANK ──
  const lv = getLevel(totalXP);
  const rank = getRank(lv);
  const prog = getLevelProg(totalXP);
  const remain = xpToNext(totalXP);
  const mult = getStreakMult(streak);
  const nextRank = RANKS.find(r => r.min > lv);
  const unlockedGates = GATES.filter(g => lv >= g.unlock).length;
  const bmi = calcBMI(parseFloat(profile.weight), parseFloat(profile.height));

  // ── TODAY'S STATUS ──
  const todayHabits = habitLog[d] || [];
  const todayW = workoutLog[d];
  const todayFood = foodLog[d] || [];
  const todayWater = foodLog[`water_${d}`] || 0;
  const todayJournal = journal[d];
  const tasksDone = tasks.filter(t => t.done).length;

  // ── DAILY SCORE ──
  const dailyChecks = useMemo(() => {
    const items = [
      { key: "workout", label: "Training", done: !!todayW, icon: "⚔️", page: "training" },
      { key: "quests", label: `Quests (${todayHabits.length}/${habits.length})`, done: todayHabits.length >= REQUIRED_DAILY, icon: "🎯", page: "dailyquest" },
      { key: "nutrition", label: "Log Food", done: todayFood.length > 0, icon: "🍎", page: "nutrition" },
      { key: "water", label: `Water (${todayWater}/8)`, done: todayWater >= 8, icon: "💧", page: "nutrition" },
      { key: "journal", label: "Journal", done: !!(todayJournal?.entry && todayJournal.entry.length > 10), icon: "📝", page: "wellness" },
      { key: "mood", label: "Mood Check", done: !!(todayJournal?.mood && todayJournal.mood > 0), icon: "💛", page: "wellness" },
    ];
    return items;
  }, [todayW, todayHabits, habits, todayFood, todayWater, todayJournal]);

  const dailyScore = Math.round((dailyChecks.filter(c => c.done).length / dailyChecks.length) * 100);

  // ── PILLAR SCORES ──
  const pillarScores = useMemo(() => {
    // Physical: based on workout consistency + daily quests
    const totalDays = Math.max(1, Object.keys(workoutLog).length + 1);
    const workoutDays = Object.keys(workoutLog).length;
    const physical = Math.min(100, Math.round((workoutDays / Math.max(7, totalDays)) * 100));

    // Mental: growth missions completed
    const mentalMissions = PILLAR_MISSIONS.mind?.tiers?.flatMap(t => t.missions) || [];
    const mentalDone = mentalMissions.filter(m => pillarProg?.[m.id]).length;
    const mental = mentalMissions.length > 0 ? Math.round((mentalDone / mentalMissions.length) * 100) : 0;

    // Emotional: journal + mood consistency
    const journalDays = Object.keys(journal).filter(k => journal[k]?.entry?.length > 10).length;
    const emotional = Math.min(100, Math.round((journalDays / Math.max(7, totalDays)) * 100));

    // Spiritual: growth missions
    const spiritMissions = PILLAR_MISSIONS.spirit?.tiers?.flatMap(t => t.missions) || [];
    const spiritDone = spiritMissions.filter(m => pillarProg?.[m.id]).length;
    const spiritual = spiritMissions.length > 0 ? Math.round((spiritDone / spiritMissions.length) * 100) : 0;

    // Financial: finance tracking consistency
    const financeDays = [...new Set(finances.map(f => f.date))].length;
    const financial = Math.min(100, Math.round((financeDays / Math.max(7, totalDays)) * 100));

    return { physical, mental, emotional, spiritual, financial };
  }, [workoutLog, journal, pillarProg, finances]);

  const overallScore = Math.round(Object.values(pillarScores).reduce((a, b) => a + b, 0) / 5);

  // ── WEEKLY ACTIVITY ──
  const weekData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const ds = dt.toISOString().split("T")[0];
      const worked = !!workoutLog[ds];
      const habitsCount = (habitLog[ds] || []).length;
      const label = dt.toLocaleDateString('en', { weekday: 'narrow' });
      const isToday = ds === d;
      days.push({ date: ds, label, worked, habitsCount, isToday });
    }
    return days;
  }, [workoutLog, habitLog, d]);

  // ── GREETING ──
  const greet = () => {
    const h = new Date().getHours();
    if (h < 5) return "Night owl";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 21) return "Good evening";
    return "Night warrior";
  };

  // ── MOTIVATIONAL INSIGHT ──
  const insight = useMemo(() => {
    if (!todayW && new Date().getHours() > 16) return "The day isn't over yet. A quick workout can change your whole mood.";
    if (streak >= 30) return `${streak} days strong. You're not building a habit anymore — you're building a legacy.`;
    if (streak >= 14) return "Two weeks of consistency. Most people quit by now. You didn't.";
    if (streak >= 7) return "One week streak! Your discipline is becoming your identity.";
    if (todayHabits.length >= REQUIRED_DAILY && todayW) return "All daily targets hit. This is what a champion's day looks like.";
    if (todayW) return "Training complete. Your body is rebuilding stronger right now.";
    if (dailyScore >= 80) return "Outstanding day. Keep this energy.";
    if (overallScore < 30) return "Every master was once a beginner. Start with one thing today.";
    return "Consistency beats intensity. Show up today.";
  }, [streak, todayW, todayHabits, dailyScore, overallScore]);

  const penaltyRisk = todayHabits.length < REQUIRED_DAILY;

  return (
    <div>
      {/* ══ HERO: GREETING + LEVEL ══ */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: "#6b7280" }}>{greet()},</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1, marginTop: 2 }}>
          <span style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{profile.name || user.name}</span>
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{insight}</p>
      </div>

      {/* ══ LEVEL + DAILY SCORE ══ */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        {/* Level Card */}
        <div className="gs" style={{ flex: "1 1 280px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${rank.color},#10b981)` }} />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 42, fontWeight: 900, fontFamily: "Rajdhani,sans-serif", color: rank.color, lineHeight: 1 }}>{lv}</div>
              <span className="rank-badge" style={{ background: `${rank.color}15`, color: rank.color, border: `1px solid ${rank.color}25`, fontSize: 10, marginTop: 4 }}>{rank.emoji} {rank.name}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div className="xp-bar-bg" style={{ height: 10, borderRadius: 5 }}>
                <div className="xp-bar-fill" style={{ width: `${prog * 100}%`, background: `linear-gradient(90deg,${rank.color},#10b981)`, height: 10, borderRadius: 5 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4 }}>
                <span style={{ color: "#6b7280" }}>{totalXP.toLocaleString()} XP</span>
                <span style={{ color: rank.color }}>{remain.toLocaleString()} to Lv.{lv < 100 ? lv + 1 : "MAX"}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {streak > 0 && <span className="streak-fire" style={{ fontSize: 10, padding: "2px 8px" }}>🔥 {streak}d{mult > 1 ? ` ×${mult}` : ""}</span>}
                {nextRank && <span style={{ fontSize: 10, color: "#4b5563" }}>Next: <span style={{ color: nextRank.color }}>{nextRank.name}</span></span>}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Score Ring */}
        <div className="gs" style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 120 }}>
          <MiniRing pct={dailyScore} color={dailyScore >= 80 ? "#22c55e" : dailyScore >= 50 ? "#f59e0b" : "#ef4444"} size={72} stroke={6}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{dailyScore}%</div>
            </div>
          </MiniRing>
          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 6, fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>TODAY</div>
        </div>
      </div>

      {/* ══ PENALTY WARNING ══ */}
      {penaltyRisk && (
        <div className="gs" style={{ marginBottom: 16, border: "1px solid rgba(239,68,68,.2)", background: "rgba(239,68,68,.04)", padding: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: "#ef4444", fontFamily: "Rajdhani,sans-serif", fontSize: 13 }}>DAILY QUEST WARNING</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Complete {REQUIRED_DAILY - todayHabits.length} more quest{REQUIRED_DAILY - todayHabits.length > 1 ? "s" : ""} or lose <span style={{ color: "#ef4444" }}>-40 XP</span> at midnight
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TODAY'S CHECKLIST ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div className="sl">Today's Progress</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          {dailyChecks.map(c => (
            <div key={c.key} onClick={() => setPage(c.page)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                background: c.done ? "rgba(16,185,129,.06)" : "rgba(255,255,255,.02)",
                border: c.done ? "1px solid rgba(16,185,129,.15)" : "1px solid rgba(255,255,255,.04)",
                transition: "all .2s",
              }}>
              <span style={{ fontSize: 18 }}>{c.done ? "✅" : c.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: c.done ? "#22c55e" : "#e5e7eb", textDecoration: c.done ? "line-through" : "none" }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ 5 PILLAR BALANCE ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="sl" style={{ margin: 0 }}>Pillar Balance</div>
          <div style={{ fontSize: 12, color: overallScore >= 60 ? "#22c55e" : overallScore >= 30 ? "#f59e0b" : "#ef4444", fontWeight: 700 }}>
            {overallScore}% overall
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {PILLAR_CONFIG.map(p => {
            const score = pillarScores[p.key] || 0;
            return (
              <div key={p.key} style={{ textAlign: "center", minWidth: 70 }}
                onClick={() => setPage(p.key === "physical" ? "training" : p.key === "mental" ? "growth" : p.key === "emotional" ? "wellness" : p.key === "spiritual" ? "growth" : "finance")}>
                <MiniRing pct={score} color={p.color} size={56} stroke={4}>
                  <span style={{ fontSize: 20 }}>{p.icon}</span>
                </MiniRing>
                <div style={{ fontSize: 11, color: p.color, fontWeight: 600, marginTop: 4 }}>{score}%</div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>{p.label}</div>
              </div>
            );
          })}
        </div>

        {/* Pillar bar breakdown */}
        <div style={{ marginTop: 14 }}>
          {PILLAR_CONFIG.map(p => {
            const score = pillarScores[p.key] || 0;
            return (
              <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, width: 20, textAlign: "center" }}>{p.icon}</span>
                <span style={{ fontSize: 11, color: "#6b7280", width: 60 }}>{p.label}</span>
                <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,.04)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${score}%`, background: p.color, borderRadius: 3, transition: "width .8s" }} />
                </div>
                <span style={{ fontSize: 11, color: p.color, fontWeight: 600, width: 32, textAlign: "right" }}>{score}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ QUICK STATS ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 10, marginBottom: 16 }}>
        {[
          ["⚔️", todayW ? "Done" : "—", "Training", todayW ? "#22c55e" : "#ef4444", "training"],
          ["🏋️", Object.keys(workoutLog).length, "Workouts", "#10b981", "training"],
          ["🔥", `${Object.values(workoutLog).reduce((s, w) => s + (w.calBurned || 0), 0).toLocaleString()}`, "Cal Burned", "#f59e0b", "training"],
          ["📊", bmi || "—", bmiCat(bmi) || "BMI", bmiCol(bmi), "profile"],
          ["⚔️", `${unlockedGates}/6`, "Gates", "#a78bfa", "training"],
          ["📋", `${tasksDone}/${tasks.length}`, "Missions", "#06b6d4", "missions"],
        ].map(([icon, val, label, color, page]) => (
          <div key={label} className="gc" onClick={() => setPage(page)} style={{ textAlign: "center", padding: 12, cursor: "pointer" }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "Rajdhani,sans-serif" }}>{val}</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ══ WEEKLY ACTIVITY ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div className="sl">This Week</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
          {weekData.map(day => (
            <div key={day.date} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: day.isToday ? "#10b981" : "#6b7280", fontWeight: day.isToday ? 700 : 400, marginBottom: 6 }}>{day.label}</div>
              <div style={{
                width: 36, height: 36, borderRadius: 8, margin: "0 auto",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: day.worked ? "rgba(16,185,129,.15)" : day.isToday ? "rgba(16,185,129,.05)" : "rgba(255,255,255,.02)",
                border: day.isToday ? "1px solid rgba(16,185,129,.2)" : "1px solid rgba(255,255,255,.04)",
                fontSize: day.worked ? 16 : 12, color: day.worked ? "#22c55e" : "#4b5563",
              }}>
                {day.worked ? "✓" : "·"}
              </div>
              <div style={{ fontSize: 9, color: "#4b5563", marginTop: 4 }}>{day.habitsCount > 0 ? `${day.habitsCount}q` : ""}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ QUICK ACTIONS ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        {[
          { label: "Start Training", icon: "⚔️", color: "#10b981", page: "training" },
          { label: "Log Food", icon: "🍎", color: "#f59e0b", page: "nutrition" },
          { label: "Daily Quests", icon: "🎯", color: "#ef4444", page: "dailyquest" },
          { label: "Flame Oracle", icon: "🔮", color: "#a78bfa", page: "chat" },
        ].map(a => (
          <div key={a.label} className="gc" onClick={() => setPage(a.page)}
            style={{ cursor: "pointer", textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{a.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: a.color }}>{a.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}