import { useState, useMemo } from 'react';
import { getLevel, getLevelProg, getRank, xpToNext, getStreakMult, calcBMI, bmiCat, bmiCol, today } from '../utils';
import { GATES, RANKS, REQUIRED_DAILY, PILLAR_MISSIONS, XP, DAILY_PENALTY } from '../data';
import { BADGES, checkBadges, getRarityColor } from '../data/badges';

const PILLAR_CONFIG = [
  { key: "physical", label: "Physical", icon: "💪", color: "#ef4444" },
  { key: "mental", label: "Mental", icon: "⚡", color: "#06b6d4" },
  { key: "emotional", label: "Emotional", icon: "💛", color: "#f59e0b" },
  { key: "spiritual", label: "Spirit", icon: "🌟", color: "#8b5cf6" },
  { key: "financial", label: "Fortune", icon: "💎", color: "#eab308" },
];

function MiniRing({ pct, color, size = 52, stroke = 5, children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} /><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div></div>);
}

export default function Dashboard({ appState, setPage, totalXP, streak, workoutLog }) {
  const { habitLog, tasks, habits, user, profile, foodLog, journal, pillarProg, finances, focusLog } = appState;
  const d = today();
  const lv = getLevel(totalXP), rank = getRank(lv), prog = getLevelProg(totalXP), remain = xpToNext(totalXP), mult = getStreakMult(streak);
  const nextRank = RANKS.find(r => r.min > lv);
  const unlockedGates = GATES.filter(g => lv >= g.unlock).length;
  const todayHabits = habitLog[d] || [], todayW = workoutLog[d], todayFood = foodLog[d] || [];
  const todayWater = foodLog[`water_${d}`] || 0, todayJournal = journal[d], tasksDone = tasks.filter(t => t.done).length;

  // Badges
  const earnedIds = useMemo(() => checkBadges({ totalXP, level: lv, streak, workoutLog, foodLog, journal, focusLog: focusLog || {}, pillarProg }), [totalXP, lv, streak, workoutLog, foodLog, journal, focusLog, pillarProg]);
  const earnedBadges = BADGES.filter(b => earnedIds.includes(b.id));
  const [showAllBadges, setShowAllBadges] = useState(false);

  // Daily checklist
  const dailyChecks = useMemo(() => [
    { key: "workout", label: "Training", done: !!todayW, icon: "⚔️", page: "training", required: true },
    { key: "nutrition", label: "Log Food", done: (todayFood || []).length > 0, icon: "🍎", page: "nutrition" },
    { key: "water", label: `Water (${todayWater}/8)`, done: todayWater >= 8, icon: "💧", page: "nutrition" },
    { key: "journal", label: "Journal", done: !!(todayJournal?.entry?.length > 10), icon: "📝", page: "wellness" },
    { key: "mood", label: "Mood Check", done: !!(todayJournal?.mood > 0), icon: "💛", page: "wellness" },
    { key: "habits", label: `Quests (${todayHabits.length})`, done: todayHabits.length >= 3, icon: "🎯", page: "dailyquest" },
  ], [todayW, todayFood, todayWater, todayJournal, todayHabits]);

  const dailyScore = Math.round((dailyChecks.filter(c => c.done).length / dailyChecks.length) * 100);
  const penaltyRisk = !todayW;

  // Pillar scores
  const pillarScores = useMemo(() => {
    const totalDays = Math.max(1, Object.keys(workoutLog).length + 1);
    const physical = Math.min(100, Math.round((Object.keys(workoutLog).length / Math.max(7, totalDays)) * 100));
    const mentalM = PILLAR_MISSIONS?.mind?.tiers?.flatMap(t => t.missions) || [];
    const mental = mentalM.length > 0 ? Math.round((mentalM.filter(m => pillarProg?.[m.id]).length / mentalM.length) * 100) : 0;
    const emotional = Math.min(100, Math.round((Object.keys(journal).filter(k => journal[k]?.entry?.length > 10).length / Math.max(7, totalDays)) * 100));
    const spiritM = PILLAR_MISSIONS?.spirit?.tiers?.flatMap(t => t.missions) || [];
    const spiritual = spiritM.length > 0 ? Math.round((spiritM.filter(m => pillarProg?.[m.id]).length / spiritM.length) * 100) : 0;
    const financial = Math.min(100, Math.round(([...new Set(finances.map(f => f.date))].length / Math.max(7, totalDays)) * 100));
    return { physical, mental, emotional, spiritual, financial };
  }, [workoutLog, journal, pillarProg, finances]);

  const overallScore = Math.round(Object.values(pillarScores).reduce((a, b) => a + b, 0) / 5);

  // Weekly activity
  const weekData = useMemo(() => { const days = []; for (let i = 6; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); const ds = dt.toISOString().split("T")[0]; days.push({ date: ds, label: dt.toLocaleDateString('en', { weekday: 'narrow' }), worked: !!workoutLog[ds], habitsCount: (habitLog[ds] || []).length, isToday: ds === d }); } return days; }, [workoutLog, habitLog, d]);

  const greet = () => { const h = new Date().getHours(); if (h < 5) return "Night owl"; if (h < 12) return "Good morning"; if (h < 17) return "Good afternoon"; if (h < 21) return "Good evening"; return "Night warrior"; };

  const insight = useMemo(() => {
    if (!todayW && new Date().getHours() > 16) return "The day isn't over. A single session can change everything.";
    if (streak >= 30) return `${streak} days. You're not building a habit — you're forging an identity.`;
    if (streak >= 14) return "Two weeks of fire. Most people quit by now. You didn't.";
    if (streak >= 7) return "One week strong. Your discipline is becoming your weapon.";
    if (todayW) return "Training complete. Rest, recover, return stronger.";
    if (dailyScore >= 80) return "Outstanding day. This is what greatness looks like.";
    return "Every journey starts with one step. Make today count.";
  }, [streak, todayW, dailyScore]);

  return (<div>
    {/* Hero */}
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 14, color: "#6b7280" }}>{greet()},</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1, marginTop: 2 }}>
        <span style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{profile.name || "Warrior"}</span>
      </h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{insight}</p>
    </div>

    {/* Level + Daily Score */}
    <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
      <div className="gs" style={{ flex: "1 1 280px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${rank.color},#10b981)` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 42, fontWeight: 900, fontFamily: "Rajdhani,sans-serif", color: rank.color, lineHeight: 1 }}>{lv}</div>
            <span className="rank-badge" style={{ background: `${rank.color}15`, color: rank.color, border: `1px solid ${rank.color}25`, fontSize: 10, marginTop: 4 }}>{rank.emoji} {rank.name}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div className="xp-bar-bg" style={{ height: 10, borderRadius: 5 }}><div className="xp-bar-fill" style={{ width: `${prog * 100}%`, background: `linear-gradient(90deg,${rank.color},#10b981)`, height: 10, borderRadius: 5 }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4 }}>
              <span style={{ color: "#6b7280" }}>{totalXP.toLocaleString()} XP</span>
              <span style={{ color: rank.color }}>{remain.toLocaleString()} to Lv.{lv + 1}</span>
            </div>
            {rank.title && <div style={{ fontSize: 11, color: `${rank.color}90`, marginTop: 4, fontStyle: "italic" }}>"{rank.title}"</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {streak > 0 && <span className="streak-fire" style={{ fontSize: 10, padding: "2px 8px" }}>🔥 {streak}d{mult > 1 ? ` ×${mult}` : ""}</span>}
              {nextRank && <span style={{ fontSize: 10, color: "#4b5563" }}>Next: <span style={{ color: nextRank.color }}>{nextRank.name}</span> (Lv.{nextRank.min})</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="gs" style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 110 }}>
        <MiniRing pct={dailyScore} color={dailyScore >= 80 ? "#22c55e" : dailyScore >= 50 ? "#f59e0b" : "#ef4444"} size={72} stroke={6}><div style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{dailyScore}%</div></div></MiniRing>
        <div style={{ fontSize: 10, color: "#6b7280", marginTop: 6, fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>TODAY</div>
      </div>
    </div>

    {/* Penalty Warning */}
    {penaltyRisk && <div className="gs" style={{ marginBottom: 16, border: "1px solid rgba(239,68,68,.2)", background: "rgba(239,68,68,.04)", padding: 14 }}><div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ fontSize: 22 }}>⚠️</span><div><div style={{ fontWeight: 700, color: "#ef4444", fontFamily: "Rajdhani,sans-serif", fontSize: 13 }}>TRAINING REQUIRED</div><div style={{ fontSize: 12, color: "#6b7280" }}>Complete your <span style={{ color: "#ef4444", fontWeight: 700 }}>daily training</span> or lose <span style={{ color: "#ef4444" }}>-{DAILY_PENALTY} XP</span> at midnight</div></div></div></div>}

    {/* Today's Checklist */}
    <div className="gs" style={{ marginBottom: 16 }}>
      <div className="sl">Today's Progress</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
        {dailyChecks.map(c => (<div key={c.key} onClick={() => setPage(c.page)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: c.done ? "rgba(16,185,129,.06)" : c.required && !c.done ? "rgba(239,68,68,.04)" : "rgba(255,255,255,.02)", border: c.done ? "1px solid rgba(16,185,129,.15)" : c.required && !c.done ? "1px solid rgba(239,68,68,.12)" : "1px solid rgba(255,255,255,.04)", transition: "all .2s" }}><span style={{ fontSize: 18 }}>{c.done ? "✅" : c.icon}</span><div><div style={{ fontSize: 13, fontWeight: 500, color: c.done ? "#22c55e" : c.required && !c.done ? "#ef4444" : "#e5e7eb" }}>{c.label}</div>{c.required && !c.done && <div style={{ fontSize: 10, color: "#ef4444" }}>Required</div>}</div></div>))}
      </div>
    </div>

    {/* Badges Showcase */}
    <div className="gs" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="sl" style={{ margin: 0 }}>Achievements · {earnedBadges.length}/{BADGES.length}</div>
        {earnedBadges.length > 6 && <span onClick={() => setShowAllBadges(!showAllBadges)} style={{ fontSize: 11, color: "#10b981", cursor: "pointer" }}>{showAllBadges ? "Show less" : "View all"}</span>}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {(showAllBadges ? earnedBadges : earnedBadges.slice(0, 8)).map(b => (
          <div key={b.id} style={{ padding: "8px 10px", borderRadius: 10, background: `${getRarityColor(b.rarity)}08`, border: `1px solid ${getRarityColor(b.rarity)}20`, textAlign: "center", minWidth: 72 }}>
            <div style={{ fontSize: 22 }}>{b.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: getRarityColor(b.rarity), marginTop: 2 }}>{b.name}</div>
          </div>
        ))}
        {earnedBadges.length === 0 && <div style={{ fontSize: 13, color: "#4b5563" }}>Complete tasks to earn your first badge!</div>}
      </div>
    </div>

    {/* Pillar Balance */}
    <div className="gs" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><div className="sl" style={{ margin: 0 }}>Pillar Balance</div><div style={{ fontSize: 12, color: overallScore >= 60 ? "#22c55e" : overallScore >= 30 ? "#f59e0b" : "#ef4444", fontWeight: 700 }}>{overallScore}%</div></div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {PILLAR_CONFIG.map(p => { const score = pillarScores[p.key] || 0; return (<div key={p.key} style={{ textAlign: "center", minWidth: 60, cursor: "pointer" }} onClick={() => setPage(p.key === "physical" ? "training" : p.key === "mental" ? "growth" : p.key === "emotional" ? "wellness" : p.key === "spiritual" ? "growth" : "finance")}><MiniRing pct={score} color={p.color} size={50} stroke={4}><span style={{ fontSize: 18 }}>{p.icon}</span></MiniRing><div style={{ fontSize: 11, color: p.color, fontWeight: 600, marginTop: 4 }}>{score}%</div><div style={{ fontSize: 9, color: "#6b7280" }}>{p.label}</div></div>); })}
      </div>
      <div style={{ marginTop: 14 }}>{PILLAR_CONFIG.map(p => { const score = pillarScores[p.key] || 0; return (<div key={p.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><span style={{ fontSize: 12, width: 20, textAlign: "center" }}>{p.icon}</span><span style={{ fontSize: 11, color: "#6b7280", width: 55 }}>{p.label}</span><div style={{ flex: 1, height: 6, background: "rgba(255,255,255,.04)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${score}%`, background: p.color, borderRadius: 3, transition: "width .8s" }} /></div><span style={{ fontSize: 11, color: p.color, fontWeight: 600, width: 30, textAlign: "right" }}>{score}%</span></div>); })}</div>
    </div>

    {/* Quick Stats */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 10, marginBottom: 16 }}>
      {[["⚔️", todayW ? "Done" : "—", "Training", todayW ? "#22c55e" : "#ef4444", "training"],["🏋️", Object.keys(workoutLog).length, "Workouts", "#10b981", "training"],["🏅", earnedBadges.length, "Badges", "#fbbf24", "profile"],["🔥", streak > 0 ? `${streak}d` : "—", "Streak", "#f97316", "dailyquest"],["⚔️", `${unlockedGates}/6`, "Gates", "#a78bfa", "training"],["📋", `${tasksDone}/${tasks.length}`, "Missions", "#06b6d4", "missions"]].map(([icon, val, label, color, page]) => (<div key={label} className="gc" onClick={() => setPage(page)} style={{ textAlign: "center", padding: 12, cursor: "pointer" }}><div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div><div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "Rajdhani,sans-serif" }}>{val}</div><div style={{ fontSize: 10, color: "#6b7280" }}>{label}</div></div>))}
    </div>

    {/* Weekly Activity */}
    <div className="gs" style={{ marginBottom: 16 }}><div className="sl">This Week</div><div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>{weekData.map(day => (<div key={day.date} style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: 10, color: day.isToday ? "#10b981" : "#6b7280", fontWeight: day.isToday ? 700 : 400, marginBottom: 6 }}>{day.label}</div><div style={{ width: 36, height: 36, borderRadius: 8, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", background: day.worked ? "rgba(16,185,129,.15)" : day.isToday ? "rgba(16,185,129,.05)" : "rgba(255,255,255,.02)", border: day.isToday ? "1px solid rgba(16,185,129,.2)" : "1px solid rgba(255,255,255,.04)", fontSize: day.worked ? 16 : 12, color: day.worked ? "#22c55e" : "#4b5563" }}>{day.worked ? "✓" : "·"}</div></div>))}</div></div>

    {/* Quick Actions */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
      {[{ label: "Start Training", icon: "⚔️", color: "#10b981", page: "training" },{ label: "Log Food", icon: "🍎", color: "#f59e0b", page: "nutrition" },{ label: "Daily Quests", icon: "🎯", color: "#ef4444", page: "dailyquest" },{ label: "Profile", icon: "👤", color: "#a78bfa", page: "profile" }].map(a => (<div key={a.label} className="gc" onClick={() => setPage(a.page)} style={{ cursor: "pointer", textAlign: "center", padding: 16 }}><div style={{ fontSize: 28, marginBottom: 6 }}>{a.icon}</div><div style={{ fontSize: 13, fontWeight: 600, color: a.color }}>{a.label}</div></div>))}
    </div>
  </div>);
}
