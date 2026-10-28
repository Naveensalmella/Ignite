"use client";
import { useState, useMemo } from 'react';
import { getLevel, today, toArr } from '@/utils';
import {
    getDailyXPProgress, getXPBreakdown, getComboStatus,
    getLoginBonus, claimLoginBonus, generateWeeklyChallenges, getChallengeProgress,
    getUnlockedTitles, getCurrentTier,
    QUEST_CHAINS, getQuestChainProgress, getXPHistory,
    SKILL_TREE, getSkillTreeProgress, getWeekStart, getWeekSeed,
} from '@/data/gamingSystem';
import { countWorkoutDays } from '@/lib/workoutHelpers';
import { Card, Ring, Bar, IconBadge, Pill, ListRow, Tabs, EmptyState } from '@/components/ui/kit';
import {
    Dumbbell, Apple, Flame, Target, Timer, NotebookPen, Droplet, Zap, Sparkles, Swords, Star, Link2, Brain,
    Medal, Gem, Lock, CalendarCheck, Gift, RotateCcw, Play, Trophy, Crown, Check as CheckIcon, Award,
} from 'lucide-react';


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

// Display-only icon/tone maps (the data keeps its own emoji fields).
const CHALLENGE_ICON = {
    workouts: [Dumbbell, "orange"], foodDays: [Apple, "lime"], calBurned: [Flame, "orange"], quests: [Target, "teal"],
    focusSessions: [Timer, "violet"], journalDays: [NotebookPen, "rose"], waterDays: [Droplet, "sky"], weeklyXP: [Zap, "sky"], comboDays: [Sparkles, "rose"],
};
const CHAIN_ICON = { warrior_week: [Swords, "orange"], nutrition_master: [Apple, "lime"], focus_marathon: [Timer, "violet"], all_rounder: [Star, "amber"] };
const BRANCH_ICON = { strength: [Dumbbell, "orange"], nutrition: [Apple, "lime"], mind: [Brain, "violet"], discipline: [Flame, "rose"] };
const SOURCE_TONE = { Training: "orange", Nutrition: "lime", Quest: "teal", Focus: "violet", Wellness: "rose", Streak: "orange", Challenge: "amber", Login: "blue", Combo: "rose" };
const TIER_ICON = { workout_count: Dumbbell, streak: Flame, xp_total: Zap, food_days: Apple, focus_sessions: Timer };
const TIER_TONE = { bronze: "orange", silver: "blue", gold: "amber", diamond: "violet" };
const TIER_LABELS = { workout_count: "Workouts", streak: "Streak", xp_total: "Total XP", food_days: "Nutrition days", focus_sessions: "Focus sessions" };
const HUB_TABS = [["overview", "Overview"], ["challenges", "Weekly"], ["chains", "Chains"], ["titles", "Titles"], ["tree", "Skills"]];
const stripEmoji = (t) => String(t || "").replace(/^[^\p{L}\p{N}]+/u, "");

export default function GamingHub({ appState = {}, totalXP = 0, streak = 0, workoutLog = {}, addXP = () => { }, loginData = {}, setLoginData = () => { }, xpLog = {}, activeTitle = null, setActiveTitle = () => { }, questChainData = {}, setQuestChainData = () => { } }) {
    const [tab, setTab] = useState("overview"); // overview | challenges | chains | titles | tree
    const d = today();
    const lv = getLevel(totalXP);
    const st = appState || {};

    // ── Daily XP ──
    const xpProgress = getDailyXPProgress(xpLog || {}, 100);
    const xpBreakdown = getXPBreakdown(xpLog || {});
    const combo = getComboStatus(st, workoutLog);

    // ── Login Bonus ──
    // Derived from loginData (not copied into local state) so it stays correct when
    // loginData loads/changes after mount and can't be claimed twice.
    const loginBonus = getLoginBonus(loginData || {});
    const bonusClaimed = loginBonus.claimed;

    const claimBonus = () => {
        if (getLoginBonus(loginData || {}).claimed) return;
        setLoginData(claimLoginBonus(loginData || {}));
        addXP(loginBonus.reward, "Login");
    };

    // ── Weekly Challenges ──
    const weekSeed = getWeekSeed();
    const weekStart = getWeekStart();
    const challenges = useMemo(() => generateWeeklyChallenges(weekSeed), [weekSeed]);
    // Claimed weekly rewards are stored in questChainData._weekly = { weekStart, claimed: [ids] }
    const weeklyClaimed = questChainData?._weekly?.weekStart === weekStart ? toArr(questChainData._weekly.claimed) : [];
    const claimChallenge = (ch) => {
        if (weeklyClaimed.includes(ch.id)) return;
        setQuestChainData(p => {
            const prev = p?._weekly?.weekStart === weekStart ? toArr(p._weekly.claimed) : [];
            return { ...(p || {}), _weekly: { weekStart, claimed: [...prev, ch.id] } };
        });
        addXP(ch.reward, `Weekly Challenge ${ch.icon}`);
    };
    const claimChain = (chain) => {
        if (questChainData?.[chain.id]?.claimed) return;
        setQuestChainData(p => ({ ...(p || {}), [chain.id]: { ...(p?.[chain.id] || {}), claimed: true } }));
        addXP(chain.rewards.completion, `Quest Chain complete ${chain.icon}`);
    };

    // ── XP History ──
    const xpHistory = useMemo(() => getXPHistory(xpLog || {}, 14), [xpLog]);
    const maxDayXP = Math.max(1, ...xpHistory.map(h => h.xp));

    // ── Titles ──
    const unlockedTitles = getUnlockedTitles(lv);

    // ── Achievement Tiers ──
    const totalWorkouts = countWorkoutDays(workoutLog);
    const foodDays = Object.keys(st.foodLog || {}).filter(k => !k.startsWith("water_") && toArr(st.foodLog[k]).length > 0).length;
    const focusSessions = Object.values(st.focusLog || {}).reduce((s, v) => s + toArr(v).length, 0);

    const tierData = useMemo(() => ({
        workout_count: getCurrentTier("workout_count", totalWorkouts),
        streak: getCurrentTier("streak", streak),
        xp_total: getCurrentTier("xp_total", totalXP),
        food_days: getCurrentTier("food_days", foodDays),
        focus_sessions: getCurrentTier("focus_sessions", focusSessions),
    }), [totalWorkouts, streak, totalXP, foodDays, focusSessions]);

    // ── Skill Tree ──
    const stats = { totalWorkouts, foodDays, focusSessions, streak };

    const totalHistXP = xpHistory.reduce((sum, h) => sum + h.xp, 0);
    const avgHistXP = Math.round(totalHistXP / Math.max(1, xpHistory.filter(h => h.xp > 0).length));
    const goalHit = xpProgress.pct >= 100;

    return (
        <div className="flex flex-col gap-3 max-w-full overflow-x-hidden">
            <div className="overflow-x-auto no-scrollbar">
                <Tabs tabs={HUB_TABS} value={tab} onChange={setTab} label="Badges sections" className="min-w-full w-max" />
            </div>

            {/* ══ OVERVIEW ══ */}
            {tab === "overview" && (
                <>
                    {/* Daily XP Goal */}
                    <Card>
                        <div className="flex items-center gap-4">
                            <Ring value={xpProgress.pct / 100} size={72} stroke={7} color={goalHit ? "var(--ok)" : "var(--accent)"}>
                                <b className="text-[17px] font-extrabold leading-none num" style={{ color: "var(--text-primary)" }}>{xpProgress.earned}</b>
                                <small className="text-[11px] num" style={{ color: "var(--text-dim)" }}>/{xpProgress.goal}</small>
                            </Ring>
                            <div className="flex-1 min-w-0">
                                <div className="card-title">Daily XP goal</div>
                                <div className="text-[13px] mt-0.5" style={{ color: goalHit ? "var(--ok)" : "var(--text-secondary)" }}>
                                    {goalHit ? "Goal reached!" : `${xpProgress.goal - xpProgress.earned} XP to go`}
                                </div>
                                {Object.keys(xpBreakdown).length > 0 && (
                                    <div className="flex gap-1.5 mt-2 flex-wrap">
                                        {Object.entries(xpBreakdown).map(([cat, amount]) => (
                                            <Pill key={cat} tone={SOURCE_TONE[cat]} className="num">{cat} +{amount}</Pill>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Combo Status */}
                    {combo.count >= 2 && (
                        <Card tone="rose" className="!py-3">
                            <div className="flex items-center gap-3">
                                <IconBadge icon={Sparkles} tone="rose" size={36} />
                                <div className="flex-1 min-w-0">
                                    <div className="row-title">{stripEmoji(combo.label)}</div>
                                    <div className="row-sub">{combo.activities.join(" + ")} · +{combo.bonusXP} bonus XP</div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Login Bonus */}
                    {!bonusClaimed && (
                        <Card className="slide-up">
                            <div className="flex items-center gap-3">
                                <IconBadge icon={CalendarCheck} tone="blue" size={40} />
                                <div className="flex-1 min-w-0">
                                    <div className="row-title">Daily login bonus</div>
                                    <div className="row-sub">Day {loginBonus.streak} streak</div>
                                </div>
                                <button type="button" className="bp !py-2 !px-4 !text-[13px]" onClick={claimBonus}><Gift size={15} />+{loginBonus.reward} XP</button>
                            </div>
                            <div className="flex gap-1 mt-3" aria-hidden="true">
                                {[5, 10, 15, 20, 25, 35, 50].map((r, i) => (
                                    <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i < loginBonus.dayIdx ? "var(--tone-blue)" : i === loginBonus.dayIdx ? "color-mix(in srgb, var(--tone-blue) 55%, transparent)" : "var(--track)" }} />
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* XP History Chart */}
                    <Card title="XP history" sub="Last 14 days">
                        <div className="flex gap-0.5 items-end h-[64px]">
                            {xpHistory.map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center">
                                    <div className="w-full rounded-t-[3px]" style={{ background: h.xp > 0 ? (h.date === d ? "var(--accent)" : "color-mix(in srgb, var(--accent) 38%, transparent)") : "var(--track)", height: `${Math.max(2, (h.xp / maxDayXP) * 50)}px`, transition: "height .5s" }} />
                                    <div className="text-[10.5px] mt-1" style={{ color: h.date === d ? "var(--accent)" : "var(--text-dim)", fontWeight: h.date === d ? 700 : 400 }}>{h.day}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[12px] mt-2 num" style={{ color: "var(--text-dim)" }}>
                            <span>Total {totalHistXP} XP</span>
                            <span>Avg {avgHistXP}/day</span>
                        </div>
                    </Card>

                    {/* Achievement Tiers */}
                    <Card title="Achievement tiers">
                        <div>
                            {Object.entries(tierData).map(([key, data]) => {
                                if (!data) return null;
                                const unlockedTier = !!data.current;
                                return (
                                    <ListRow key={key}
                                        icon={unlockedTier ? (data.current.tier === "diamond" ? Gem : TIER_ICON[key] || Medal) : Lock}
                                        tone={unlockedTier ? TIER_TONE[data.current.tier] || "amber" : "sky"}
                                        className={unlockedTier ? "" : "opacity-70"}
                                        title={`${TIER_LABELS[key]} · ${data.current?.name || "Locked"}`}
                                        sub={data.next ? `Next: ${data.next.name} (${data.value}/${data.next.threshold})` : "Top tier reached"}
                                        right={data.next ? <div className="w-14 shrink-0"><Bar value={data.value / data.next.threshold} /></div> : <Pill tone="violet" icon={Award}>Max</Pill>} />
                                );
                            })}
                        </div>
                    </Card>
                </>
            )}

            {/* ══ CHALLENGES ══ */}
            {tab === "challenges" && (
                <Card title="Weekly challenges" sub="Resets every Monday">
                    <div>
                        {challenges.map(ch => {
                            const progress = getChallengeProgress(ch, st, workoutLog, weekStart);
                            const pct = Math.min(100, Math.round((progress / ch.target) * 100));
                            const done = progress >= ch.target;
                            const claimed = weeklyClaimed.includes(ch.id);
                            const [Icon, tone] = CHALLENGE_ICON[ch.type] || [Trophy, "amber"];
                            return (
                                <ListRow key={ch.id} icon={done ? CheckIcon : Icon} tone={done ? "teal" : tone} title={ch.title} sub={ch.desc}
                                    right={<div className="text-right shrink-0 self-start">
                                        <div className="text-[13px] font-bold num" style={{ color: done ? "var(--ok)" : "var(--text-primary)" }}>{done ? "Done" : `${progress}/${ch.target}`}</div>
                                        <div className="text-[11.5px] num" style={{ color: "var(--warn)" }}>+{ch.reward} XP</div>
                                    </div>}>
                                    <Bar value={pct / 100} color={done ? "var(--ok)" : undefined} className="mt-2" />
                                    {done && !claimed && (
                                        <button type="button" className="bp w-full mt-2.5 !py-2.5 !text-[13px]" onClick={() => claimChallenge(ch)}><Gift size={15} />Claim +{ch.reward} XP</button>
                                    )}
                                    {done && claimed && <div className="text-[12px] font-semibold mt-1.5" style={{ color: "var(--ok)" }}>Reward claimed</div>}
                                </ListRow>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* ══ QUEST CHAINS ══ */}
            {tab === "chains" && (
                <Card title="Quest chains" sub="Multi-day quests">
                    <div>
                        {QUEST_CHAINS.map(chain => {
                            const chainState = questChainData?.[chain.id];
                            const progress = chainState?.startDate ? getQuestChainProgress(chain, workoutLog, st, chainState.startDate) : null;
                            const isActive = progress?.active;
                            const isComplete = progress?.complete;
                            const isFailed = progress?.failed;
                            const [Icon, tone] = CHAIN_ICON[chain.id] || [Link2, "sky"];
                            return (
                                <ListRow key={chain.id} icon={Icon} tone={isComplete ? "teal" : tone} title={chain.name} sub={chain.desc}
                                    right={<div className="text-right shrink-0 self-start">
                                        {progress && <div className="text-[13px] font-bold num" style={{ color: isComplete ? "var(--ok)" : isFailed ? "var(--danger)" : isActive ? "var(--accent)" : "var(--text-primary)" }}>{progress.daysCompleted}/{chain.totalDays}</div>}
                                        <div className="text-[11.5px] num" style={{ color: "var(--warn)" }}>+{chain.rewards.completion} XP</div>
                                    </div>}>
                                    <div className="text-[12px] mt-1" style={{ color: "var(--text-dim)" }}>Daily: {chain.dailyTask}</div>
                                    {progress && (
                                        <div className="flex gap-1 mt-2" aria-hidden="true">
                                            {Array.from({ length: chain.totalDays }, (_, i) => (
                                                <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i < progress.daysCompleted ? "var(--ok)" : isFailed && i === progress.daysCompleted ? "var(--danger)" : "var(--track)" }} />
                                            ))}
                                        </div>
                                    )}
                                    {!chainState?.startDate && (
                                        <button type="button" className="bp w-full mt-2.5 !py-2.5 !text-[13px]" onClick={() => setQuestChainData(p => ({ ...p, [chain.id]: { startDate: d } }))}><Play size={15} />Start quest</button>
                                    )}
                                    {isFailed && (
                                        <button type="button" className="bg w-full mt-2.5 !py-2 !text-[13px]" onClick={() => setQuestChainData(p => ({ ...p, [chain.id]: { startDate: d } }))}><RotateCcw size={14} />Restart</button>
                                    )}
                                    {isComplete && !chainState?.claimed && (
                                        <button type="button" className="bp w-full mt-2.5 !py-2.5 !text-[13px]" onClick={() => claimChain(chain)}><Gift size={15} />Claim +{chain.rewards.completion} XP</button>
                                    )}
                                    {isComplete && chainState?.claimed && (
                                        <div className="flex items-center gap-2 mt-2.5">
                                            <Pill tone="teal" icon={Trophy}>Quest complete</Pill>
                                            <button type="button" className="bg flex-1 !py-2 !text-[13px]" onClick={() => setQuestChainData(p => ({ ...(p || {}), [chain.id]: { startDate: d } }))}><RotateCcw size={14} />Start again</button>
                                        </div>
                                    )}
                                </ListRow>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* ══ TITLES ══ */}
            {tab === "titles" && (
                <>
                    <Card title="Titles" sub="Earn and equip display titles">
                        {activeTitle && <div className="mb-2"><Pill tone="amber" icon={Crown}>Active: &ldquo;{activeTitle}&rdquo;</Pill></div>}
                        {unlockedTitles.length === 0 ? (
                            <EmptyState icon={Crown} title="No titles yet">Reach Level 15 to unlock your first title!</EmptyState>
                        ) : (
                            <div>
                                {unlockedTitles.map(t => {
                                    const isActive = activeTitle === t.title;
                                    return (
                                        <ListRow key={t.level} icon={Crown} tone={isActive ? "amber" : "sky"} onClick={() => setActiveTitle(t.title)}
                                            title={<>&ldquo;{t.title}&rdquo;</>} sub={`${t.reward} · Unlocked at Lv.${t.level}`}
                                            right={isActive ? <Pill tone="amber" icon={CheckIcon}>Active</Pill> : <span className="text-[12px] font-semibold shrink-0" style={{ color: "var(--accent)" }}>Equip</span>} />
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                    <Card title="Locked titles">
                        <div>
                            {Object.entries(LEVEL_REWARDS).filter(([lvl]) => parseInt(lvl) > lv).slice(0, 5).map(([lvl, data]) => (
                                <ListRow key={lvl} icon={Lock} tone="sky" className="opacity-60" title={<>&ldquo;{data.title}&rdquo;</>} sub={`Level ${lvl}`} />
                            ))}
                        </div>
                    </Card>
                </>
            )}

            {/* ══ SKILL TREE ══ */}
            {tab === "tree" && (
                <>
                    {Object.entries(SKILL_TREE).map(([key, branch]) => {
                        const nodes = getSkillTreeProgress(branch, stats);
                        const unlocked = nodes.filter(n => n.unlocked).length;
                        const [Icon, tone] = BRANCH_ICON[key] || [Sparkles, "sky"];
                        const toneVar = `var(--tone-${tone})`;
                        return (
                            <Card key={key}>
                                <div className="flex items-center gap-3 mb-3">
                                    <IconBadge icon={Icon} tone={tone} size={38} />
                                    <div className="flex-1 min-w-0">
                                        <div className="card-title">{branch.name}</div>
                                        <div className="text-[12px] num" style={{ color: "var(--text-dim)" }}>{unlocked}/{nodes.length} unlocked</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    {nodes.map((node, i) => (
                                        <div key={node.id} className={`flex items-center ${i < nodes.length - 1 ? "flex-1" : ""}`}>
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                                style={node.unlocked ? { background: toneVar, color: "var(--accent-ink)" } : { background: "var(--ghost-bg)", color: "var(--text-dim)" }}
                                                title={node.name}>
                                                {node.unlocked ? <CheckIcon size={15} strokeWidth={3} /> : node.progress > 0 ? <span className="text-[10px] font-bold num" style={{ color: toneVar }}>{node.progress}%</span> : <Lock size={12} />}
                                            </div>
                                            {i < nodes.length - 1 && <div className="flex-1 h-0.5 mx-0.5 rounded-full" style={{ background: node.unlocked ? toneVar : "var(--track)" }} />}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: `repeat(${nodes.length}, minmax(0, 1fr))` }}>
                                    {nodes.map(node => (
                                        <div key={node.id} className="text-[10.5px] text-center leading-tight" style={{ color: node.unlocked ? "var(--text-secondary)" : "var(--text-dim)" }}>{node.name}</div>
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                </>
            )}
        </div>
    );
}

// ── Milestone Overlay (import in App.jsx) ──
export function MilestoneOverlay({ milestone, onClose }) {
    if (!milestone) return null;
    return (
        <div className="fade-in fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.6)" }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Milestone reached">
            <Card className="slide-up w-full max-w-[340px] text-center !p-6" style={{ boxShadow: "var(--shadow)" }}>
                <div className="flex justify-center mb-3"><IconBadge icon={Trophy} tone="amber" size={64} round /></div>
                <div className="text-[12px] font-bold tracking-wide uppercase" style={{ color: "var(--tone-amber)" }}>Milestone reached</div>
                <div className="text-[21px] font-extrabold mt-1.5 leading-tight" style={{ color: "var(--text-primary)" }}>{milestone.title}</div>
                {milestone.msg && <div className="text-[14px] mt-1.5" style={{ color: "var(--text-secondary)" }}>{milestone.msg}</div>}
                <div className="mt-4 flex justify-center"><Pill tone="amber" icon={Zap} className="!text-[15px] !px-3.5 !py-1.5 num">{Number(milestone.xp || 0).toLocaleString()} XP</Pill></div>
                <button type="button" className="bp w-full mt-5" onClick={onClose}>Continue</button>
            </Card>
        </div>
    );
}
