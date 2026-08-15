"use client";
import { useState, useMemo } from 'react';
import { getLevel, getLevelProg, getRank, xpToNext, getStreakMult, today, toArr } from '@/utils';
import { RANKS, XP, DAILY_PENALTY } from '@/data/index';

import { getDailyXPProgress, getXPBreakdown, XP_SOURCES, getComboStatus, getLoginBonus, claimLoginBonus } from '@/data/gamingSystem';
import StreakFreeze from './StreakFreeze';
import WeeklyReport from './WeeklyReport';
import { AnimatedCard, StaggerContainer, StaggerItem } from './PageTransition';
import { hasDayWorkout, getDayCal, getDayDuration, getDaySplit, getTotalCal, countWorkoutDays } from '@/lib/workoutHelpers';

function Ring({ pct, color, size = 56, stroke = 5, children }) { const p = Number.isFinite(pct) ? pct : 0; const r = (size - stroke) / 2, c = 2 * Math.PI * r; return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, p / 100))} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div></div>) }

export default function Dashboard({ appState = {}, setPage = () => { }, totalXP = 0, streak = 0, workoutLog = {}, foodLog = {}, focusLog = {}, habitLog = {}, freezeData = null, setFreezeData = () => { }, addXP = () => { }, xpLog = {}, loginData = {}, setLoginData = () => { } }) {
  const d = today();
  const lv = getLevel(totalXP);
  const rank = getRank(lv);
  const prog = Math.round(getLevelProg(totalXP) * 100);
  const needed = xpToNext(totalXP);
  const mult = getStreakMult(streak);

  const todayWorkout = hasDayWorkout(workoutLog, d);
  const todayFood = toArr(foodLog[d]).length > 0;
  const todayFocus = toArr(focusLog[d]).length > 0;
  const todayQuests = toArr(habitLog[d]).length;
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
    <div className="max-w-full overflow-x-hidden">
      <StaggerContainer>
        {/* Hero Card — Level + XP */}
        <StaggerItem>
          <div className="gs mb-[14px] p-5 text-center border border-[rgba(16,185,129,.1)]" style={{ background: "linear-gradient(180deg, rgba(16,185,129,.06) 0%, rgba(13,17,23,.8) 100%)" }}>
            <div className="flex justify-center mb-3">
              <Ring pct={prog} color={rank.color || "#10b981"} size={90} stroke={7}>
                <div className="text-center">
                  <div className="text-[28px] font-black text-gray-100 font-heading">{lv}</div>
                  <div className="text-[11px] text-gray-500">LEVEL</div>
                </div>
              </Ring>
            </div>
            <div className="text-[18px] font-extrabold font-heading" style={{ color: rank.color || "#10b981" }}>{rank.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{totalXP.toLocaleString()} XP · {needed} to Lv.{lv + 1}</div>
            {streak > 0 && (
              <div className="inline-flex items-center gap-1 mt-2 px-[14px] py-1 rounded-full bg-[rgba(245,158,11,.08)] border border-[rgba(245,158,11,.15)]">
                <span className="text-sm">🔥</span>
                <span className="text-[13px] font-bold text-amber-500">{streak} day streak</span>
                {mult > 1 && <span className="text-[10px] text-amber-500">×{mult}</span>}
              </div>
            )}
          </div>
        </StaggerItem>

        {/* Daily Activity */}
        <StaggerItem>
          <div className="grid grid-cols-3 gap-2 mb-[14px]">
            {[
              { icon: "⚔️", label: "Training", done: todayWorkout, page: "training" },
              { icon: "🍎", label: "Nutrition", done: todayFood, page: "nutrition" },
              { icon: "💛", label: "Wellness", done: !!appState.journal?.[d]?.mood, page: "wellness" },
            ].map(item => (
              <div key={item.label} onClick={() => setPage(item.page)} className={`gc p-[14px] text-center cursor-pointer border ${item.done ? "border-[rgba(34,197,94,.15)] bg-[rgba(34,197,94,.04)]" : "border-[rgba(255,255,255,.05)]"}`}>
                <div className="text-[22px] mb-1">{item.icon}</div>
                <div className={`text-[11px] font-semibold ${item.done ? "text-green-500" : "text-gray-500"}`}>{item.label}</div>
                <div className={`text-[10px] mt-0.5 ${item.done ? "text-green-500" : "text-gray-600"}`}>{item.done ? "✓ Done" : "Pending"}</div>
              </div>
            ))}
          </div>
        </StaggerItem>

        {/* Daily XP + Combo Row */}
        <StaggerItem>
          <div className="flex gap-[10px] mb-[14px]">
            {/* Daily XP Goal */}
            <div className="gs flex-1 p-[14px] flex items-center gap-[10px]">
              <Ring pct={xpProgress.pct} color={xpProgress.pct >= 100 ? "#22c55e" : "#10b981"} size={48} stroke={5}>
                <span className="text-[13px] font-extrabold text-gray-100 font-heading">{xpProgress.earned}</span>
              </Ring>
              <div>
                <div className="text-xs font-bold text-gray-100 font-heading">Daily XP</div>
                <div className={`text-[10px] ${xpProgress.pct >= 100 ? "text-green-500" : "text-gray-500"}`}>{xpProgress.pct >= 100 ? "✅ Done!" : `${xpProgress.goal - xpProgress.earned} to go`}</div>
                {Object.keys(xpBreakdown).length > 0 && (
                  <div className="flex gap-[3px] mt-1 flex-wrap">
                    {Object.entries(xpBreakdown).slice(0, 3).map(([cat, amt]) => (
                      <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${(XP_SOURCES[cat] || XP_SOURCES.Other).color}10`, color: (XP_SOURCES[cat] || XP_SOURCES.Other).color }}>{(XP_SOURCES[cat] || XP_SOURCES.Other).icon}+{amt}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Combo */}
            {combo.count >= 2 && (
              <div className="gs p-[14px] text-center border border-[rgba(236,72,153,.12)] bg-[rgba(236,72,153,.03)] min-w-[100px]">
                <div className="text-[13px] font-extrabold text-pink-500 font-heading">{combo.label}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{combo.count} activities</div>
                <div className="text-[10px] text-pink-500">+{combo.bonusXP} XP</div>
              </div>
            )}
          </div>
        </StaggerItem>

        {/* Login Bonus */}
        {!bonusClaimed && (
          <StaggerItem>
            <div className="gs mb-[14px] p-[14px] cursor-pointer border border-[rgba(59,130,246,.15)] bg-[rgba(59,130,246,.04)]" onClick={claimBonus}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold text-blue-500 font-heading">📅 Daily Login Bonus — Day {loginBonus.streak}</div>
                  <div className="text-[11px] text-gray-500">Tap to claim!</div>
                </div>
                <div className="text-xl font-black text-blue-500 font-heading">+{loginBonus.reward}</div>
              </div>
              <div className="flex gap-[3px] mt-1.5">
                {[5, 10, 15, 20, 25, 35, 50].map((r, i) => (
                  <div key={i} className={`flex-1 h-[3px] rounded-sm ${i < loginBonus.dayIdx ? "bg-blue-500" : i === loginBonus.dayIdx ? "bg-blue-400" : "bg-[rgba(255,255,255,.06)]"}`} />
                ))}
              </div>
            </div>
          </StaggerItem>
        )}

        {/* Quick Actions */}
        <StaggerItem>
          <div className="grid grid-cols-4 gap-2 mb-[14px]">
            {[
              { icon: "⚔️", label: "Train", page: "training" },
              { icon: "🎯", label: "Quests", page: "dailyquest" },
              { icon: "⏱", label: "Focus", page: "focus" },
              { icon: "🎮", label: "Gaming", page: "gaming" },
            ].map(item => (
              <div key={item.label} onClick={() => setPage(item.page)} className="gc p-3 text-center cursor-pointer">
                <div className="text-[22px]">{item.icon}</div>
                <div className="text-[10px] text-gray-400 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </StaggerItem>

        {/* Stats Row */}
        <StaggerItem>
          <div className="grid grid-cols-3 gap-2 mb-[14px]">
            <div className="gc p-[14px] text-center">
              <div className="text-[22px] font-black text-emerald-500 font-heading">{totalWorkouts}</div>
              <div className="text-[10px] text-gray-500">Workouts</div>
            </div>
            <div className="gc p-[14px] text-center">
              <div className="text-[22px] font-black text-amber-500 font-heading">{streak}d</div>
              <div className="text-[10px] text-gray-500">Streak</div>
            </div>
            <div className="gc p-[14px] text-center">
              <div className="text-[22px] font-black text-violet-500 font-heading">{badges.length}</div>
              <div className="text-[10px] text-gray-500">Badges</div>
            </div>
          </div>
        </StaggerItem>

        {/* Daily Score Ring */}
        <StaggerItem>
          <div className="gs mb-[14px] p-[14px]">
            <div className="flex items-center gap-[14px]">
              <Ring pct={overallScore} color={overallScore >= 70 ? "#22c55e" : overallScore >= 40 ? "#f59e0b" : "#ef4444"} size={56} stroke={5}>
                <span className="text-base font-black text-gray-100 font-heading">{overallScore}%</span>
              </Ring>
              <div>
                <div className="text-sm font-bold text-gray-100 font-heading">Today's Score</div>
                <div className="text-[11px] text-gray-500">
                  {overallScore >= 70 ? "Great day! Keep it up!" : overallScore >= 40 ? "Good start, keep going" : "Complete more activities"}
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  {[
                    { k: "training", icon: "⚔️" }, { k: "nutrition", icon: "🍎" }, { k: "focus", icon: "⏱" },
                    { k: "quests", icon: "🎯" }, { k: "water", icon: "💧" }, { k: "wellness", icon: "💛" }
                  ].map(s => (
                    <span key={s.k} className={`text-xs ${sectionScores[s.k] > 0 ? "opacity-100" : "opacity-25"}`}>{s.icon}</span>
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
            <div className="gs p-[14px]">
              <div className="flex justify-between items-center mb-[10px]">
                <span className="text-[13px] font-bold text-gray-100 font-heading">🏅 Badges</span>
                <span onClick={() => setPage("profile")} className="text-[11px] text-emerald-500 cursor-pointer">See all →</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {badges.slice(0, 6).map(b => (
                  <div key={b.id} className="shrink-0 text-center w-14">
                    <div className="text-2xl">{b.icon}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{b.name.length > 8 ? b.name.slice(0, 8) + "…" : b.name}</div>
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
