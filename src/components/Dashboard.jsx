import { useState, useMemo } from 'react';
import { getLevel, getLevelProg, getRank, xpToNext, getStreakMult, today } from '../utils';
import { GATES, RANKS, XP, DAILY_PENALTY } from '../data';
import { BADGES, checkBadges, getRarityColor } from '../data/badges';
import StreakFreeze from './StreakFreeze';
import WeeklyReport from './WeeklyReport';
import { getDailyXPProgress, getXPBreakdown, XP_SOURCES, getComboStatus, getLoginBonus, claimLoginBonus } from '../data/gamingSystem';

const SECTIONS = [
  { key: "training", label: "Training", icon: "⚔️", color: "#10b981", page: "training" },
  { key: "nutrition", label: "Nutrition", icon: "🍎", color: "#f59e0b", page: "nutrition" },
  { key: "quests", label: "Quests", icon: "🎯", color: "#ef4444", page: "dailyquest" },
  { key: "focus", label: "Focus", icon: "⏱", color: "#06b6d4", page: "focus" },
  { key: "wellness", label: "Wellness", icon: "💛", color: "#8b5cf6", page: "wellness" },
  { key: "routine", label: "My Day", icon: "📅", color: "#f97316", page: "routine" },
];

function Ring({ pct, color, size = 52, stroke = 5, children }) { const r = (size - stroke) / 2, c = 2 * Math.PI * r; return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div></div>) }

export default function Dashboard({ appState = {}, setPage = () => { }, totalXP = 0, streak = 0, workoutLog = {}, foodLog = {}, focusLog = {}, habitLog = {}, freezeData = null, setFreezeData = () => { }, addXP = () => { }, xpLog = {}, loginData = {}, setLoginData = () => { } }) {
  const { habits, tasks, user, profile, journal, pillarProg, finances, routineData } = appState;
  const hLog = habitLog || appState.habitLog || {};
  const fLog = foodLog || appState.foodLog || {};
  const fcLog = focusLog || appState.focusLog || {};
  const d = today();
  const lv = getLevel(totalXP), rank = getRank(lv), prog = getLevelProg(totalXP), remain = xpToNext(totalXP), mult = getStreakMult(streak);
  const nextRank = RANKS.find(r => r.min > lv);
  const todayW = workoutLog[d], todayHabits = hLog[d] || [], todayFood = fLog[d] || [], todayWater = fLog[`water_${d}`] || 0, todayJournal = journal[d];
  const [showAllBadges, setShowAllBadges] = useState(false);

  const earnedIds = useMemo(() => checkBadges({ totalXP, level: lv, streak, workoutLog, foodLog: fLog, journal, focusLog: fcLog, pillarProg }), [totalXP, lv, streak, workoutLog, fLog, journal, fcLog, pillarProg]);
  const earnedBadges = BADGES.filter(b => earnedIds.includes(b.id));

  const sectionScores = useMemo(() => {
    const w = parseFloat(profile.weight) || 70, h = parseFloat(profile.height) || 170, age = parseInt(profile.age) || 25;
    const bmr = profile.gender === "female" ? 10 * w + 6.25 * h - 5 * age - 161 : 10 * w + 6.25 * h - 5 * age + 5;
    const target = Math.round(bmr * (profile.fitnessLevel === "beginner" ? 1.375 : profile.fitnessLevel === "advanced" ? 1.725 : 1.55));
    const todayCal = todayFood.reduce((s, f) => s + (f.cal || 0), 0);
    const focusSessions = fcLog[d] || [];
    const focusMin = Array.isArray(focusSessions) ? focusSessions.reduce((s, sess) => s + (sess.duration || 0), 0) : 0;
    const focusGoal = parseInt(profile.dailyFocusGoal) || 120;
    const routineBlocks = (routineData?.routine || []);
    const routineDone = (routineData?.daily?.[d]?.done || []).length;
    const wellnessDone = (todayJournal?.mood ? 1 : 0) + (todayJournal?.entry?.length > 10 ? 1 : 0) + ((todayJournal?.gratitude || []).filter(g => g?.trim()).length >= 3 ? 1 : 0);
    return {
      training: todayW ? 100 : 0,
      nutrition: target > 0 ? Math.min(100, Math.round((todayCal / target) * 100)) : 0,
      quests: habits.length > 0 ? Math.round((todayHabits.length / Math.max(1, habits.length)) * 100) : 0,
      focus: focusGoal > 0 ? Math.min(100, Math.round((focusMin / focusGoal) * 100)) : 0,
      wellness: Math.round((wellnessDone / 3) * 100),
      routine: routineBlocks.length > 0 ? Math.round((routineDone / routineBlocks.length) * 100) : 0,
    };
  }, [todayW, todayFood, todayHabits, habits, fcLog, d, profile, todayJournal, routineData]);

  const overallScore = Math.round(Object.values(sectionScores).reduce((a, b) => a + b, 0) / 6);

  // Gaming widgets data
  const xpProgress = getDailyXPProgress(xpLog || {}, 100);
  const xpBreakdown = getXPBreakdown(xpLog || {});
  const combo = getComboStatus(appState, workoutLog);
  const loginBonus = getLoginBonus(loginData || {});
  const [bonusClaimed, setBonusClaimed] = useState(loginBonus.claimed);

  const claimBonus = () => {
    if (bonusClaimed) return;
    addXP(loginBonus.reward, "Login");
    setLoginData(claimLoginBonus(loginData || {}));
    setBonusClaimed(true);
  };

  const weekData = useMemo(() => { const days = []; for (let i = 6; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); const ds = dt.toISOString().split("T")[0]; days.push({ date: ds, label: dt.toLocaleDateString('en', { weekday: 'narrow' }), worked: !!workoutLog[ds], isToday: ds === d }) } return days }, [workoutLog, d]);

  const greet = () => { const h = new Date().getHours(); if (h < 5) return "Night owl"; if (h < 12) return "Good morning"; if (h < 17) return "Good afternoon"; if (h < 21) return "Good evening"; return "Night warrior" };

  const insight = useMemo(() => {
    if (!todayW && new Date().getHours() > 16) return "The day isn't over. One session can change everything.";
    if (streak >= 30) return `${streak} days strong. You're forging an identity.`;
    if (streak >= 7) return "One week of fire. Your discipline is becoming your weapon.";
    if (todayW && overallScore >= 80) return "Outstanding day. This is what a champion looks like.";
    if (todayW) return "Training done. Your body is rebuilding stronger.";
    return "Every journey starts with one step. Make today count.";
  }, [streak, todayW, overallScore]);

  return (<div style={{ maxWidth: "100%", overflowX: "hidden" }}>
    {/* Hero */}
    <div style={{ marginBottom: 20 }}><div style={{ fontSize: 14, color: "#6b7280" }}>{greet()},</div><h1 style={{ fontSize: 28, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1, marginTop: 2 }}><span style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{profile.name || "Warrior"}</span></h1><p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{insight}</p></div>

    {/* Level + Daily Score */}
    <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
      <div className="gs" style={{ flex: "1 1 260px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${rank.color},#10b981)` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 42, fontWeight: 900, fontFamily: "Rajdhani,sans-serif", color: rank.color, lineHeight: 1 }}>{lv}</div><span className="rank-badge" style={{ background: `${rank.color}15`, color: rank.color, border: `1px solid ${rank.color}25`, fontSize: 10, marginTop: 4 }}>{rank.emoji} {rank.name}</span></div>
          <div style={{ flex: 1 }}>
            <div className="xp-bar-bg" style={{ height: 10, borderRadius: 5 }}><div className="xp-bar-fill" style={{ width: `${prog * 100}%`, background: `linear-gradient(90deg,${rank.color},#10b981)`, height: 10, borderRadius: 5 }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4 }}><span style={{ color: "#6b7280" }}>{totalXP.toLocaleString()} XP</span><span style={{ color: rank.color }}>{remain.toLocaleString()} to Lv.{lv + 1}</span></div>
            {rank.title && <div style={{ fontSize: 11, color: `${rank.color}90`, marginTop: 3, fontStyle: "italic" }}>"{rank.title}"</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>{streak > 0 && <span className="streak-fire" style={{ fontSize: 10, padding: "2px 8px" }}>🔥 {streak}d{mult > 1 ? ` ×${mult}` : ""}</span>}{nextRank && <span style={{ fontSize: 10, color: "#4b5563" }}>Next: <span style={{ color: nextRank.color }}>{nextRank.name}</span> Lv.{nextRank.min}</span>}</div>
          </div>
        </div>
      </div>
      <div className="gs" style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 100 }}>
        <Ring pct={overallScore} color={overallScore >= 80 ? "#22c55e" : overallScore >= 50 ? "#f59e0b" : "#ef4444"} size={72} stroke={6}><div style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{overallScore}%</div></div></Ring>
        <div style={{ fontSize: 10, color: "#6b7280", marginTop: 6, fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>TODAY</div>
      </div>
    </div>

    {/* Gaming Widgets */}
    <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
      {/* Daily XP Goal */}
      <div className="gs" style={{ flex: "1 1 140px", padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <Ring pct={xpProgress.pct} color={xpProgress.pct >= 100 ? "#22c55e" : "#10b981"} size={48} stroke={5}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{xpProgress.earned}</span>
        </Ring>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Daily XP</div>
          <div style={{ fontSize: 10, color: xpProgress.pct >= 100 ? "#22c55e" : "#6b7280" }}>{xpProgress.pct >= 100 ? "✅ Done!" : `${xpProgress.goal - xpProgress.earned} to go`}</div>
          {Object.keys(xpBreakdown).length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
              {Object.entries(xpBreakdown).slice(0, 3).map(([cat, amt]) => (
                <span key={cat} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 100, background: `${(XP_SOURCES[cat] || XP_SOURCES.Other).color}10`, color: (XP_SOURCES[cat] || XP_SOURCES.Other).color }}>{(XP_SOURCES[cat] || XP_SOURCES.Other).icon}+{amt}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Combo */}
      {combo.count >= 2 && (
        <div className="gs" style={{ flex: "1 1 120px", padding: 12, textAlign: "center", border: "1px solid rgba(236,72,153,.12)", background: "rgba(236,72,153,.03)" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#ec4899", fontFamily: "Rajdhani,sans-serif" }}>{combo.label}</div>
          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{combo.count} activities · +{combo.bonusXP} XP</div>
        </div>
      )}
    </div>

    {/* Login Bonus */}
    {!bonusClaimed && (
      <div className="gs slide-up" onClick={claimBonus} style={{ marginBottom: 16, padding: 12, cursor: "pointer", border: "1px solid rgba(59,130,246,.15)", background: "rgba(59,130,246,.03)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", fontFamily: "Rajdhani,sans-serif" }}>📅 Daily Login Bonus — Day {loginBonus.streak}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Tap to claim!</div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#3b82f6", fontFamily: "Rajdhani,sans-serif" }}>+{loginBonus.reward}</div>
        </div>
        <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
          {[5, 10, 15, 20, 25, 35, 50].map((r, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < loginBonus.dayIdx ? "#3b82f6" : i === loginBonus.dayIdx ? "#60a5fa" : "rgba(255,255,255,.06)" }} />
          ))}
        </div>
      </div>
    )}

    {/* Penalty */}
    {!todayW && <div className="gs" style={{ marginBottom: 16, border: "1px solid rgba(239,68,68,.2)", background: "rgba(239,68,68,.04)", padding: 14 }}><div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ fontSize: 22 }}>⚠️</span><div><div style={{ fontWeight: 700, color: "#ef4444", fontFamily: "Rajdhani,sans-serif", fontSize: 13 }}>TRAINING REQUIRED</div><div style={{ fontSize: 12, color: "#6b7280" }}>Complete your <span style={{ color: "#ef4444", fontWeight: 700 }}>daily training</span> or lose <span style={{ color: "#ef4444" }}>-{DAILY_PENALTY} XP</span> at midnight</div></div></div></div>}

    {/* 🧊 Streak Freeze */}
    <div style={{ marginBottom: 16 }}>
      <StreakFreeze streak={streak} totalXP={totalXP} freezeData={freezeData} setFreezeData={setFreezeData} addXP={addXP} />
    </div>

    {/* Today's Activity */}
    <div className="gs" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="sl" style={{ margin: 0 }}>Today's Activity</div>
        <span style={{ fontSize: 12, color: overallScore >= 70 ? "#22c55e" : overallScore >= 40 ? "#f59e0b" : "#ef4444", fontWeight: 700 }}>{overallScore}% overall</span>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 14 }}>
        {SECTIONS.map(s => {
          const score = sectionScores[s.key] || 0; return (
            <div key={s.key} style={{ textAlign: "center", minWidth: 55, cursor: "pointer" }} onClick={() => setPage(s.page)}>
              <Ring pct={score} color={s.color} size={48} stroke={4}><span style={{ fontSize: 16 }}>{s.icon}</span></Ring>
              <div style={{ fontSize: 10, color: s.color, fontWeight: 600, marginTop: 4 }}>{score}%</div>
              <div style={{ fontSize: 9, color: "#6b7280" }}>{s.label}</div>
            </div>
          )
        })}
      </div>
      {SECTIONS.map(s => {
        const score = sectionScores[s.key] || 0; return (
          <div key={s.key} onClick={() => setPage(s.page)} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer" }}>
            <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{s.icon}</span>
            <span style={{ fontSize: 11, color: "#6b7280", width: 60 }}>{s.label}</span>
            <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,.04)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${score}%`, background: score >= 80 ? s.color : `${s.color}80`, borderRadius: 3, transition: "width .8s" }} /></div>
            <span style={{ fontSize: 11, color: score >= 80 ? s.color : "#6b7280", fontWeight: 600, width: 30, textAlign: "right" }}>{score}%</span>
          </div>
        )
      })}
    </div>

    {/* 📈 Weekly Report */}
    <div style={{ marginBottom: 16 }}>
      <WeeklyReport totalXP={totalXP} streak={streak} workoutLog={workoutLog} foodLog={fLog} habitLog={hLog} focusLog={fcLog} />
    </div>

    {/* Badges */}
    <div className="gs" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div className="sl" style={{ margin: 0 }}>Achievements · {earnedBadges.length}/{BADGES.length}</div>{earnedBadges.length > 6 && <span onClick={() => setShowAllBadges(!showAllBadges)} style={{ fontSize: 11, color: "#10b981", cursor: "pointer" }}>{showAllBadges ? "Less" : "All"}</span>}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>{(showAllBadges ? earnedBadges : earnedBadges.slice(0, 8)).map(b => (<div key={b.id} style={{ padding: "8px 10px", borderRadius: 10, background: `${getRarityColor(b.rarity)}08`, border: `1px solid ${getRarityColor(b.rarity)}20`, textAlign: "center", minWidth: 60 }}><div style={{ fontSize: 22 }}>{b.icon}</div><div style={{ fontSize: 10, fontWeight: 600, color: getRarityColor(b.rarity), marginTop: 2 }}>{b.name}</div></div>))}{earnedBadges.length === 0 && <div style={{ fontSize: 13, color: "#4b5563" }}>Complete tasks to earn badges!</div>}</div>
    </div>

    {/* Weekly Activity */}
    <div className="gs" style={{ marginBottom: 16 }}><div className="sl">This Week</div><div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>{weekData.map(day => (<div key={day.date} style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: 10, color: day.isToday ? "#10b981" : "#6b7280", fontWeight: day.isToday ? 700 : 400, marginBottom: 6 }}>{day.label}</div><div style={{ width: 36, height: 36, borderRadius: 8, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", background: day.worked ? "rgba(16,185,129,.15)" : day.isToday ? "rgba(16,185,129,.05)" : "rgba(255,255,255,.02)", border: day.isToday ? "1px solid rgba(16,185,129,.2)" : "1px solid rgba(255,255,255,.04)", fontSize: day.worked ? 16 : 12, color: day.worked ? "#22c55e" : "#4b5563" }}>{day.worked ? "✓" : "·"}</div></div>))}</div></div>

    {/* Quick Actions */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
      {[{ label: "Start Training", icon: "⚔️", color: "#10b981", page: "training" }, { label: "Log Food", icon: "🍎", color: "#f59e0b", page: "nutrition" }, { label: "Daily Quests", icon: "🎯", color: "#ef4444", page: "dailyquest" }, { label: "My Day", icon: "📅", color: "#f97316", page: "routine" }, { label: "Profile", icon: "👤", color: "#a78bfa", page: "profile" }, { label: "Growth", icon: "🌱", color: "#06b6d4", page: "growth" }].map(a => (<div key={a.label} className="gc" onClick={() => setPage(a.page)} style={{ cursor: "pointer", textAlign: "center", padding: 16 }}><div style={{ fontSize: 28, marginBottom: 6 }}>{a.icon}</div><div style={{ fontSize: 13, fontWeight: 600, color: a.color }}>{a.label}</div></div>))}
    </div>
  </div>);
}