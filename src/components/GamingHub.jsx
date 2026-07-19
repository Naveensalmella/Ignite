import { useState, useMemo } from 'react';
import { getLevel, getRank, today } from '../utils';
import {
    getDailyXPProgress, getXPBreakdown, XP_SOURCES, getComboStatus,
    getLoginBonus, claimLoginBonus, generateWeeklyChallenges, getChallengeProgress,
    getLevelReward, getUnlockedTitles, getCurrentTier, BADGE_TIERS,
    QUEST_CHAINS, getQuestChainProgress, getXPHistory, checkMilestone, MILESTONES,
    SKILL_TREE, getSkillTreeProgress, getWeekStart, getWeekSeed,
} from '../data/gamingSystem';


// Level-up rewards (inline to avoid import issues)
const LEVEL_REWARDS = {
    3: { title: "Starter Flame", reward: "Fire emoji unlocked", type: "cosmetic" },
    5: { title: "Rising Spark", reward: "Dark theme unlocked", type: "feature" },
    10: { title: "Iron Will", reward: "Accent colors unlocked", type: "feature" },
    15: { title: "Dedicated", reward: "Title: Dedicated", type: "title" },
    20: { title: "Warrior Born", reward: "Title: Warrior Born", type: "title" },
    25: { title: "Discipline King", reward: "Title: Discipline King", type: "title" },
    30: { title: "Unstoppable", reward: "Title: Unstoppable", type: "title" },
    40: { title: "Legend", reward: "Title: Legend + Gold badge", type: "title" },
    50: { title: "Mythic", reward: "Title: Mythic + Crown badge", type: "title" },
    75: { title: "Transcendent", reward: "Title: Transcendent", type: "title" },
    100: { title: "The Absolute", reward: "Title: The Absolute + Diamond frame", type: "title" },
};

function Ring({ pct, color, size = 56, stroke = 5, children }) { const r = (size - stroke) / 2, c = 2 * Math.PI * r; return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div></div>) }

export default function GamingHub({ appState = {}, totalXP = 0, streak = 0, workoutLog = {}, addXP = () => { }, profile = {}, loginData = {}, setLoginData = () => { }, xpLog = {}, activeTitle = null, setActiveTitle = () => { }, questChainData = {}, setQuestChainData = () => { } }) {
    const [tab, setTab] = useState("overview"); // overview | challenges | chains | titles | tree
    const d = today();
    const lv = getLevel(totalXP);

    // ── Daily XP ──
    const xpProgress = getDailyXPProgress(xpLog || {}, 100);
    const xpBreakdown = getXPBreakdown(xpLog || {});
    const combo = getComboStatus(appState, workoutLog);

    // ── Login Bonus ──
    const loginBonus = getLoginBonus(loginData || {});
    const [bonusClaimed, setBonusClaimed] = useState(loginBonus.claimed);

    const claimBonus = () => {
        if (bonusClaimed) return;
        addXP(loginBonus.reward, "Login");
        setLoginData(claimLoginBonus(loginData || {}));
        setBonusClaimed(true);
    };

    // ── Weekly Challenges ──
    const weekSeed = getWeekSeed();
    const weekStart = getWeekStart();
    const challenges = useMemo(() => generateWeeklyChallenges(weekSeed), [weekSeed]);

    // ── XP History ──
    const xpHistory = useMemo(() => getXPHistory(xpLog || {}, 14), [xpLog]);
    const maxDayXP = Math.max(1, ...xpHistory.map(h => h.xp));

    // ── Titles ──
    const unlockedTitles = getUnlockedTitles(lv);

    // ── Achievement Tiers ──
    const totalWorkouts = Object.keys(workoutLog || {}).length;
    const foodDays = Object.keys(appState.foodLog || {}).filter(k => !k.startsWith("water_") && Array.isArray(appState.foodLog[k]) && appState.foodLog[k].length > 0).length;
    const focusSessions = Object.values(appState.focusLog || {}).flat().length;

    const tierData = useMemo(() => ({
        workout_count: getCurrentTier("workout_count", totalWorkouts),
        streak: getCurrentTier("streak", streak),
        xp_total: getCurrentTier("xp_total", totalXP),
        food_days: getCurrentTier("food_days", foodDays),
        focus_sessions: getCurrentTier("focus_sessions", focusSessions),
    }), [totalWorkouts, streak, totalXP, foodDays, focusSessions]);

    // ── Skill Tree ──
    const stats = { totalWorkouts, foodDays, focusSessions, streak };

    return (
        <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
                {[["overview", "⚡ Overview"], ["challenges", "🏆 Challenges"], ["chains", "⛓️ Quests"], ["titles", "👑 Titles"], ["tree", "🌳 Skill Tree"]].map(([k, l]) => (
                    <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ flexShrink: 0, fontSize: 12 }}>{l}</span>
                ))}
            </div>

            {/* ══ OVERVIEW ══ */}
            {tab === "overview" && (
                <div>
                    {/* Daily XP Goal */}
                    <div className="gs" style={{ marginBottom: 12, padding: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <Ring pct={xpProgress.pct} color={xpProgress.pct >= 100 ? "#22c55e" : "#10b981"} size={64} stroke={6}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{xpProgress.earned}</div>
                                    <div style={{ fontSize: 8, color: "#6b7280" }}>/{xpProgress.goal}</div>
                                </div>
                            </Ring>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Daily XP Goal</div>
                                <div style={{ fontSize: 12, color: xpProgress.pct >= 100 ? "#22c55e" : "#6b7280" }}>
                                    {xpProgress.pct >= 100 ? "✅ Goal reached!" : `${xpProgress.goal - xpProgress.earned} XP to go`}
                                </div>
                                {/* XP Breakdown */}
                                {Object.keys(xpBreakdown).length > 0 && (
                                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                                        {Object.entries(xpBreakdown).map(([cat, amount]) => (
                                            <span key={cat} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: `${(XP_SOURCES[cat] || XP_SOURCES.Other).color}10`, color: (XP_SOURCES[cat] || XP_SOURCES.Other).color }}>
                                                {(XP_SOURCES[cat] || XP_SOURCES.Other).icon} +{amount}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Combo Status */}
                    {combo.count >= 2 && (
                        <div className="gs" style={{ marginBottom: 12, padding: "10px 14px", border: `1px solid rgba(236,72,153,.15)`, background: "rgba(236,72,153,.04)" }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#ec4899", fontFamily: "Rajdhani,sans-serif" }}>{combo.label}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>{combo.activities.join(" + ")} · +{combo.bonusXP} bonus XP</div>
                        </div>
                    )}

                    {/* Login Bonus */}
                    {!bonusClaimed && (
                        <div className="gs slide-up" onClick={claimBonus} style={{ marginBottom: 12, padding: 14, cursor: "pointer", border: "1px solid rgba(59,130,246,.2)", background: "rgba(59,130,246,.04)" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#3b82f6", fontFamily: "Rajdhani,sans-serif" }}>📅 Daily Login Bonus</div>
                                    <div style={{ fontSize: 12, color: "#6b7280" }}>Day {loginBonus.streak} streak · Tap to claim!</div>
                                </div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: "#3b82f6", fontFamily: "Rajdhani,sans-serif" }}>+{loginBonus.reward} XP</div>
                            </div>
                            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                                {[5, 10, 15, 20, 25, 35, 50].map((r, i) => (
                                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < loginBonus.dayIdx ? "#3b82f6" : i === loginBonus.dayIdx ? "#60a5fa" : "rgba(255,255,255,.06)" }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* XP History Chart */}
                    <div className="gs" style={{ marginBottom: 12, padding: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 10 }}>📈 XP History (14 days)</div>
                        <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 60 }}>
                            {xpHistory.map((h, i) => (
                                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <div style={{ width: "100%", background: h.xp > 0 ? (h.date === d ? "#10b981" : "rgba(16,185,129,.3)") : "rgba(255,255,255,.03)", borderRadius: "3px 3px 0 0", height: `${Math.max(2, (h.xp / maxDayXP) * 50)}px`, transition: "height .5s" }} />
                                    <div style={{ fontSize: 7, color: h.date === d ? "#10b981" : "#4b5563", marginTop: 2 }}>{h.day}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4b5563", marginTop: 4 }}>
                            <span>Total: {xpHistory.reduce((s, h) => s + h.xp, 0)} XP</span>
                            <span>Avg: {Math.round(xpHistory.reduce((s, h) => s + h.xp, 0) / Math.max(1, xpHistory.filter(h => h.xp > 0).length))}/day</span>
                        </div>
                    </div>

                    {/* Achievement Tiers */}
                    <div className="gs" style={{ padding: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 10 }}>🏅 Achievement Tiers</div>
                        {Object.entries(tierData).map(([key, data]) => {
                            if (!data) return null;
                            const labels = { workout_count: "Workouts", streak: "Streak", xp_total: "Total XP", food_days: "Nutrition Days", focus_sessions: "Focus Sessions" };
                            return (
                                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                                    <span style={{ fontSize: 18 }}>{data.current?.icon || "🔒"}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: data.current ? "#f3f4f6" : "#4b5563" }}>{labels[key]}: {data.current?.name || "Locked"}</div>
                                        {data.next && <div style={{ fontSize: 10, color: "#6b7280" }}>Next: {data.next.name} ({data.value}/{data.next.threshold})</div>}
                                    </div>
                                    {data.next && (
                                        <div style={{ width: 50, height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${Math.min(100, (data.value / data.next.threshold) * 100)}%`, background: "#10b981", borderRadius: 2 }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ══ CHALLENGES ══ */}
            {tab === "challenges" && (
                <div>
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>🏆 Weekly Challenges</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Resets every Monday · Complete for bonus XP</div>
                    </div>
                    {challenges.map(ch => {
                        const progress = getChallengeProgress(ch, appState, workoutLog, weekStart);
                        const pct = Math.min(100, Math.round((progress / ch.target) * 100));
                        const done = progress >= ch.target;
                        return (
                            <div key={ch.id} className="gs" style={{ marginBottom: 10, padding: 14, border: done ? "1px solid rgba(34,197,94,.2)" : "1px solid rgba(255,255,255,.04)", background: done ? "rgba(34,197,94,.04)" : undefined }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: done ? "#22c55e" : "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{ch.icon} {ch.title}</div>
                                        <div style={{ fontSize: 12, color: "#6b7280" }}>{ch.desc}</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: done ? "#22c55e" : "#f59e0b" }}>{done ? "✅" : `${progress}/${ch.target}`}</div>
                                        <div style={{ fontSize: 10, color: "#6b7280" }}>+{ch.reward} XP</div>
                                    </div>
                                </div>
                                <div style={{ height: 6, background: "rgba(255,255,255,.04)", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${pct}%`, background: done ? "#22c55e" : "linear-gradient(90deg,#10b981,#06b6d4)", borderRadius: 3, transition: "width .5s" }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ══ QUEST CHAINS ══ */}
            {tab === "chains" && (
                <div>
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>⛓️ Quest Chains</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Multi-day quests for mega rewards</div>
                    </div>
                    {QUEST_CHAINS.map(chain => {
                        const chainState = questChainData?.[chain.id];
                        const progress = chainState?.startDate ? getQuestChainProgress(chain, workoutLog, appState, chainState.startDate) : null;
                        const isActive = progress?.active;
                        const isComplete = progress?.complete;
                        const isFailed = progress?.failed;
                        return (
                            <div key={chain.id} className="gs" style={{ marginBottom: 10, padding: 14, border: isComplete ? "1px solid rgba(34,197,94,.2)" : isActive ? "1px solid rgba(16,185,129,.15)" : "1px solid rgba(255,255,255,.04)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: isComplete ? "#22c55e" : "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{chain.icon} {chain.name}</div>
                                        <div style={{ fontSize: 12, color: "#6b7280" }}>{chain.desc}</div>
                                        <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>Daily: {chain.dailyTask}</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        {progress && <div style={{ fontSize: 13, fontWeight: 700, color: isComplete ? "#22c55e" : isFailed ? "#ef4444" : "#10b981" }}>{progress.daysCompleted}/{chain.totalDays}</div>}
                                        <div style={{ fontSize: 10, color: "#f59e0b" }}>+{chain.rewards.completion} XP</div>
                                    </div>
                                </div>
                                {progress && (
                                    <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                                        {Array.from({ length: chain.totalDays }, (_, i) => (
                                            <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < progress.daysCompleted ? "#22c55e" : isFailed && i === progress.daysCompleted ? "#ef4444" : "rgba(255,255,255,.06)" }} />
                                        ))}
                                    </div>
                                )}
                                {!chainState?.startDate && (
                                    <button className="bp" onClick={() => setQuestChainData(p => ({ ...p, [chain.id]: { startDate: d } }))} style={{ width: "100%", marginTop: 10, padding: 10, fontSize: 13 }}>🚀 Start Quest</button>
                                )}
                                {isFailed && (
                                    <button className="bg" onClick={() => setQuestChainData(p => ({ ...p, [chain.id]: { startDate: d } }))} style={{ width: "100%", marginTop: 8, padding: 8, fontSize: 12 }}>🔄 Restart</button>
                                )}
                                {isComplete && <div style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: "#22c55e", fontWeight: 700 }}>🏆 Quest Complete!</div>}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ══ TITLES ══ */}
            {tab === "titles" && (
                <div>
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>👑 Titles</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Earn and equip display titles</div>
                        {activeTitle && <div style={{ fontSize: 14, color: "#f59e0b", marginTop: 6 }}>Active: "{activeTitle}"</div>}
                    </div>
                    {unlockedTitles.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 30, color: "#6b7280", fontSize: 13 }}>Reach Level 15 to unlock your first title!</div>
                    ) : (
                        unlockedTitles.map(t => (
                            <div key={t.level} className="gs" onClick={() => setActiveTitle(t.title)} style={{ marginBottom: 8, padding: 14, cursor: "pointer", border: activeTitle === t.title ? "1px solid rgba(245,158,11,.2)" : "1px solid rgba(255,255,255,.04)", background: activeTitle === t.title ? "rgba(245,158,11,.04)" : undefined }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: activeTitle === t.title ? "#f59e0b" : "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>"{t.title}"</div>
                                        <div style={{ fontSize: 11, color: "#6b7280" }}>{t.reward} · Unlocked at Lv.{t.level}</div>
                                    </div>
                                    {activeTitle === t.title ? <span style={{ fontSize: 12, color: "#f59e0b" }}>✓ Active</span> : <span style={{ fontSize: 11, color: "#4b5563" }}>Tap to equip</span>}
                                </div>
                            </div>
                        ))
                    )}
                    {/* Locked titles preview */}
                    <div className="sl" style={{ marginTop: 16 }}>Locked Titles</div>
                    {Object.entries(LEVEL_REWARDS).filter(([lvl]) => parseInt(lvl) > lv).slice(0, 5).map(([lvl, data]) => (
                        <div key={lvl} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.03)", opacity: 0.4 }}>
                            <span style={{ fontSize: 13, color: "#4b5563" }}>🔒 "{data.title}" — Level {lvl}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ══ SKILL TREE ══ */}
            {tab === "tree" && (
                <div>
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>🌳 Skill Tree</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Your progression across all pillars</div>
                    </div>
                    {Object.entries(SKILL_TREE).map(([key, branch]) => {
                        const nodes = getSkillTreeProgress(branch, stats);
                        const unlocked = nodes.filter(n => n.unlocked).length;
                        return (
                            <div key={key} className="gs" style={{ marginBottom: 12, padding: 14 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                    <span style={{ fontSize: 20 }}>{branch.icon}</span>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: branch.color, fontFamily: "Rajdhani,sans-serif" }}>{branch.name}</div>
                                        <div style={{ fontSize: 11, color: "#6b7280" }}>{unlocked}/{nodes.length} unlocked</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    {nodes.map((node, i) => (
                                        <div key={node.id} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                                            <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: node.unlocked ? `${branch.color}20` : "rgba(255,255,255,.03)", border: node.unlocked ? `2px solid ${branch.color}` : "2px solid rgba(255,255,255,.06)", position: "relative" }}>
                                                <span style={{ fontSize: node.unlocked ? 14 : 10, color: node.unlocked ? branch.color : "#4b5563" }}>{node.unlocked ? "✓" : "🔒"}</span>
                                                {!node.unlocked && node.progress > 0 && (
                                                    <div style={{ position: "absolute", bottom: -8, fontSize: 8, color: branch.color }}>{node.progress}%</div>
                                                )}
                                            </div>
                                            {i < nodes.length - 1 && <div style={{ flex: 1, height: 2, background: node.unlocked ? branch.color : "rgba(255,255,255,.06)", margin: "0 2px" }} />}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                                    {nodes.map(node => (
                                        <div key={node.id} style={{ flex: 1, textAlign: "center" }}>
                                            <div style={{ fontSize: 8, color: node.unlocked ? branch.color : "#4b5563" }}>{node.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Milestone Overlay (import in App.jsx) ──
export function MilestoneOverlay({ milestone, onClose }) {
    if (!milestone) return null;
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.85)" }} onClick={onClose}>
            <div className="slide-up" style={{ textAlign: "center", padding: 40, maxWidth: 320 }}>
                <div style={{ fontSize: 64, marginBottom: 12 }}>{milestone.emoji}</div>
                <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "Rajdhani,sans-serif", background: "linear-gradient(135deg,#f59e0b,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>MILESTONE!</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginTop: 8 }}>{milestone.title}</div>
                <div style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>{milestone.msg}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#f59e0b", marginTop: 12 }}>{milestone.xp.toLocaleString()} XP</div>
                <button className="bp" onClick={onClose} style={{ marginTop: 20, padding: "12px 32px" }}>Continue</button>
            </div>
        </div>
    );
}