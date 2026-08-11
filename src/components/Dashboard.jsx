"use client";
import { useState, useMemo } from 'react';
import { getLevel, getLevelProg, getRank, xpToNext, getStreakMult, today } from '@/utils';
import { RANKS, XP, DAILY_PENALTY } from '@/data/index';

import { getDailyXPProgress, getXPBreakdown, XP_SOURCES, getComboStatus, getLoginBonus, claimLoginBonus } from '@/data/gamingSystem';
import StreakFreeze from './StreakFreeze';
import WeeklyReport from './WeeklyReport';
import { AnimatedCard, StaggerContainer, StaggerItem } from './PageTransition';
import { hasDayWorkout, getDayCal, getDayDuration, getDaySplit, getTotalCal, countWorkoutDays } from '@/lib/workoutHelpers';

function Ring({ pct, color, size = 56, stroke = 5, children }) { const r = (size - stroke) / 2, c = 2 * Math.PI * r; return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div></div>) }

export default function Dashboard({ appState = {}, setPage = () => { }, totalXP = 0, streak = 0, workoutLog = {}, foodLog = {}, focusLog = {}, habitLog = {}, freezeData = null, setFreezeData = () => { }, addXP = () => { }, xpLog = {}, loginData = {}, setLoginData = () => { } }) {
  const d = today();
  const lv = getLevel(totalXP);
  const rank = getRank(lv);
  const prog = Math.round(getLevelProg(totalXP) * 100);
  const needed = xpToNext(totalXP);
  const mult = getStreakMult(streak);

  const todayWorkout = hasDayWorkout(workoutLog, d);
  const todayFood = (foodLog[d] || []).length > 0;
  const todayFocus = (focusLog[d] || []).length > 0;
  const todayQuests = (habitLog[d] || []).length;
  const totalWorkouts = countWorkoutDays(workoutLog);

  // Section scores
  const sectionScores = {
    training: todayWorkout ? 100 : 0,
    nutrition: todayFood ? 100 : 0,
    focus: todayFocus ? 100 : 0,
    quests: Math.min(100, todayQuests * 25),
    water: Math.min(100, ((foodLog[`water_${d}`] || 0) / 8) * 100),
    wellness: appState.journal?.[d]?.mood ? 100 : 0,
  };
  const overallScore = Math.round(Object.values(sectionScores).reduce((a, b) => a + b, 0) / 6);

  // Gaming data
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

  const badges = [];

  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <StaggerContainer>
        {/* Hero Card — Level + XP */}
        <StaggerItem>
          <div className="gs" style={{ marginBottom: 14, padding: 20, textAlign: "center", background: "linear-gradient(180deg, rgba(16,185,129,.06) 0%, rgba(13,17,23,.8) 100%)", border: "1px solid rgba(16,185,129,.1)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <Ring pct={prog} color={rank.color || "#10b981"} size={90} stroke={7}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{lv}</div>
                  <div style={{ fontSize: 9, color: "#6b7280" }}>LEVEL</div>
                </div>
              </Ring>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: rank.color || "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{rank.name}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{totalXP.toLocaleString()} XP · {needed} to Lv.{lv + 1}</div>
            {streak > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, padding: "4px 14px", borderRadius: 100, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.15)" }}>
                <span style={{ fontSize: 14 }}>🔥</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{streak} day streak</span>
                {mult > 1 && <span style={{ fontSize: 10, color: "#f59e0b" }}>×{mult}</span>}
              </div>
            )}
          </div>
        </StaggerItem>

        {/* Daily Activity */}
        <StaggerItem>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              { icon: "⚔️", label: "Training", done: todayWorkout, page: "training" },
              { icon: "🍎", label: "Nutrition", done: todayFood, page: "nutrition" },
              { icon: "💛", label: "Wellness", done: !!appState.journal?.[d]?.mood, page: "wellness" },
            ].map(item => (
              <div key={item.label} onClick={() => setPage(item.page)} className="gc" style={{ padding: 14, textAlign: "center", cursor: "pointer", border: item.done ? "1px solid rgba(34,197,94,.15)" : "1px solid rgba(255,255,255,.05)", background: item.done ? "rgba(34,197,94,.04)" : undefined }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: item.done ? "#22c55e" : "#6b7280" }}>{item.label}</div>
                <div style={{ fontSize: 10, color: item.done ? "#22c55e" : "#4b5563", marginTop: 2 }}>{item.done ? "✓ Done" : "Pending"}</div>
              </div>
            ))}
          </div>
        </StaggerItem>

        {/* Daily XP + Combo Row */}
        <StaggerItem>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {/* Daily XP Goal */}
            <div className="gs" style={{ flex: 1, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <Ring pct={xpProgress.pct} color={xpProgress.pct >= 100 ? "#22c55e" : "#10b981"} size={48} stroke={5}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{xpProgress.earned}</span>
              </Ring>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Daily XP</div>
                <div style={{ fontSize: 10, color: xpProgress.pct >= 100 ? "#22c55e" : "#6b7280" }}>{xpProgress.pct >= 100 ? "✅ Done!" : `${xpProgress.goal - xpProgress.earned} to go`}</div>
                {Object.keys(xpBreakdown).length > 0 && (
                  <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                    {Object.entries(xpBreakdown).slice(0, 3).map(([cat, amt]) => (
                      <span key={cat} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 100, background: `${(XP_SOURCES[cat] || XP_SOURCES.Other).color}10`, color: (XP_SOURCES[cat] || XP_SOURCES.Other).color }}>{(XP_SOURCES[cat] || XP_SOURCES.Other).icon}+{amt}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Combo */}
            {combo.count >= 2 && (
              <div className="gs" style={{ padding: 14, textAlign: "center", border: "1px solid rgba(236,72,153,.12)", background: "rgba(236,72,153,.03)", minWidth: 100 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#ec4899", fontFamily: "Rajdhani,sans-serif" }}>{combo.label}</div>
                <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{combo.count} activities</div>
                <div style={{ fontSize: 10, color: "#ec4899" }}>+{combo.bonusXP} XP</div>
              </div>
            )}
          </div>
        </StaggerItem>

        {/* Login Bonus */}
        {!bonusClaimed && (
          <StaggerItem>
            <div className="gs" onClick={claimBonus} style={{ marginBottom: 14, padding: 14, cursor: "pointer", border: "1px solid rgba(59,130,246,.15)", background: "rgba(59,130,246,.04)" }}>
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
          </StaggerItem>
        )}

        {/* Quick Actions */}
        <StaggerItem>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
            {[
              { icon: "⚔️", label: "Train", page: "training" },
              { icon: "🎯", label: "Quests", page: "dailyquest" },
              { icon: "⏱", label: "Focus", page: "focus" },
              { icon: "🎮", label: "Gaming", page: "gaming" },
            ].map(item => (
              <div key={item.label} onClick={() => setPage(item.page)} className="gc" style={{ padding: 12, textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 22 }}>{item.icon}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </StaggerItem>

        {/* Stats Row */}
        <StaggerItem>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
            <div className="gc" style={{ padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{totalWorkouts}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Workouts</div>
            </div>
            <div className="gc" style={{ padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#f59e0b", fontFamily: "Rajdhani,sans-serif" }}>{streak}d</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Streak</div>
            </div>
            <div className="gc" style={{ padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#8b5cf6", fontFamily: "Rajdhani,sans-serif" }}>{badges.length}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Badges</div>
            </div>
          </div>
        </StaggerItem>

        {/* Daily Score Ring */}
        <StaggerItem>
          <div className="gs" style={{ marginBottom: 14, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Ring pct={overallScore} color={overallScore >= 70 ? "#22c55e" : overallScore >= 40 ? "#f59e0b" : "#ef4444"} size={56} stroke={5}>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{overallScore}%</span>
              </Ring>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Today's Score</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  {overallScore >= 70 ? "Great day! Keep it up!" : overallScore >= 40 ? "Good start, keep going" : "Complete more activities"}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  {[
                    { k: "training", icon: "⚔️" }, { k: "nutrition", icon: "🍎" }, { k: "focus", icon: "⏱" },
                    { k: "quests", icon: "🎯" }, { k: "water", icon: "💧" }, { k: "wellness", icon: "💛" }
                  ].map(s => (
                    <span key={s.k} style={{ fontSize: 12, opacity: sectionScores[s.k] > 0 ? 1 : 0.25 }}>{s.icon}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Streak Freeze + Weekly Report */}
        <StaggerItem>
          <StreakFreeze streak={streak} totalXP={totalXP} freezeData={freezeData} setFreezeData={setFreezeData} addXP={addXP} />
        </StaggerItem>
        <StaggerItem>
          <WeeklyReport workoutLog={workoutLog} foodLog={foodLog} focusLog={focusLog} habitLog={habitLog} totalXP={totalXP} streak={streak} />
        </StaggerItem>

        {/* Recent Badges */}
        {badges.length > 0 && (
          <StaggerItem>
            <div className="gs" style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>🏅 Badges</span>
                <span onClick={() => setPage("profile")} style={{ fontSize: 11, color: "#10b981", cursor: "pointer" }}>See all →</span>
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {badges.slice(0, 6).map(b => (
                  <div key={b.id} style={{ flexShrink: 0, textAlign: "center", width: 56 }}>
                    <div style={{ fontSize: 24 }}>{b.icon}</div>
                    <div style={{ fontSize: 8, color: "#6b7280", marginTop: 2 }}>{b.name.length > 8 ? b.name.slice(0, 8) + "…" : b.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </StaggerItem>
        )}
      </StaggerContainer>
    </div>
  );
}