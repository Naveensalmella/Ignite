"use client";
// Home: the Status Window.
import { useMemo } from "react";
import { Plus, Swords, Apple, Heart, ChevronRight } from "lucide-react";
import useAppStore from "@/stores/useAppStore";
import SysWin, { RankEmblem, GoldAmount } from "./SysWin";
import { DailyQuestCard, useNow, fmtClock } from "./QuestWidgets";
import WeeklyReport from "../WeeklyReport";
import { getLevel, getLevelProg, totalXpFor, xpForLevel, getStreakMult, today, toArr } from "@/utils";
import { hasDayWorkout } from "@/lib/workoutHelpers";
import { statSheet } from "@/lib/system/stats";
import { playerRank, availableTrial } from "@/lib/system/ranks";
import { allocate } from "@/lib/system/actions";
import { SKILLS, TITLES, classById, describeEffect, armyState } from "@/lib/system/progression";

function StatusWindow() {
    const s = useAppStore();
    const { system, totalXP = 0, streak = 0, profile, user, activeTitle } = s;
    const lv = getLevel(totalXP);
    const rank = playerRank(system, lv);
    const intoLevel = totalXP - totalXpFor(lv);
    const need = xpForLevel(lv + 1);
    const mult = getStreakMult(streak);
    const ap = Number(system?.abilityPoints) || 0;
    const now = useNow(15000);
    const potionLeft = now ? (Number(system?.buffs?.xpBoostUntil) || 0) - now : 0;
    const { workoutLog, foodLog, focusLog, journal, habitLog, tasks, finances } = s;
    const sheet = useMemo(
        () => statSheet({ workoutLog, foodLog, focusLog, journal, habitLog, tasks, finances }, system),
        [workoutLog, foodLog, focusLog, journal, habitLog, tasks, finances, system]
    );
    const power = sheet.reduce((a, st) => a + st.total, 0);
    const name = profile?.name || user?.name || "Player";
    const job = classById(system?.job?.id);

    return (
        <SysWin title="Status">
            <div className="flex items-center gap-4">
                <div className="text-center shrink-0 w-[92px]">
                    <div className="status-level">{lv}</div>
                    <div className="sys-label mt-1">Level</div>
                </div>
                <dl className="status-kv flex-1 min-w-0">
                    <dt>Name</dt><dd>{name}</dd>
                    <dt>Rank</dt><dd className="flex items-center gap-1.5"><RankEmblem rank={rank} size={20} /><span style={{ color: rank.color }}>{rank.name}</span></dd>
                    <dt>Job</dt><dd>{job ? <span style={{ color: "#fde68a" }}>{job.icon} {job.name}</span> : <span style={{ color: "var(--text-dim)" }}>{system?.job?.questStart ? "Job Change in progress" : "None"}</span>}</dd>
                    <dt>Title</dt><dd>{activeTitle || <span style={{ color: "var(--text-dim)" }}>—</span>}</dd>
                </dl>
            </div>

            <div className="mt-4">
                <div className="sys-row text-[12px] mb-1">
                    <span className="sys-label">XP</span>
                    <span style={{ color: "var(--text-secondary)" }}>{intoLevel.toLocaleString()} / {need.toLocaleString()}</span>
                </div>
                <div className="sys-bar" role="progressbar" aria-label="Progress to next level" aria-valuenow={Math.round(getLevelProg(totalXP) * 100)} aria-valuemin={0} aria-valuemax={100}>
                    <div style={{ width: `${Math.round(getLevelProg(totalXP) * 100)}%` }} />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div><GoldAmount value={system?.gold} size={16} /><div className="text-[11px]" style={{ color: "var(--text-dim)" }}>Gold</div></div>
                <div><span className="font-heading font-bold text-[16px]" style={{ color: "#fdba74" }}>🔥 {streak}</span><div className="text-[11px]" style={{ color: "var(--text-dim)" }}>Day streak{mult > 1 ? ` · ×${mult}` : ""}</div></div>
                <div><span className="font-heading font-bold text-[16px]" style={{ color: "#c4b5fd" }}>⚡ {power}</span><div className="text-[11px]" style={{ color: "var(--text-dim)" }}>Power</div></div>
            </div>
            {potionLeft > 0 && <div className="text-center text-[12.5px] mt-2" style={{ color: "#a5f3fc" }}>🧪 XP Potion active · ×2 XP · {fmtClock(potionLeft)} left</div>}

            <div className="sys-divider" />

            <div className="stat-grid">
                {sheet.map(st => (
                    <div key={st.key} className="stat-cell" title={`${st.name}: ${st.desc}. Base 10 + ${st.earned} earned + ${st.allocated} allocated`}>
                        <span className="stat-key" style={{ color: st.color }}>{st.label}</span>
                        <span className="stat-val">{st.total}</span>
                        {ap > 0 && <button type="button" onClick={() => allocate(st.key)} aria-label={`Add a point to ${st.name}`}><Plus size={16} /></button>}
                    </div>
                ))}
                <div className="stat-cell" style={{ justifyContent: "space-between" }}>
                    <span className="text-[11.5px] leading-tight" style={{ color: "var(--text-secondary)" }}>Available<br />Ability Points</span>
                    <span className="stat-val" style={{ color: ap > 0 ? "#7dd3fc" : "var(--text-dim)" }}>{ap}</span>
                </div>
            </div>
            <div className="text-[11.5px] mt-2" style={{ color: "var(--text-dim)" }}>
                Stats grow from what you actually do. Every level grants 3 Ability Points to spend.
            </div>
        </SysWin>
    );
}

function SkillsWindow({ setPage }) {
    const system = useAppStore(s => s.system);
    const activeTitle = useAppStore(s => s.activeTitle);
    const habits = useAppStore(s => s.habits);
    const habitLog = useAppStore(s => s.habitLog);
    if (!system?.awakened) return null;
    const owned = new Set(system.skills || []);
    const army = armyState(system, habits, habitLog);
    const title = TITLES.find(t => t.name === activeTitle && (system.titles || []).includes(t.id));
    const job = classById(system.job?.id);
    const bonuses = [
        ...SKILLS.filter(s => owned.has(s.id)).map(s => `${s.icon} ${s.name}: ${describeEffect(s.effect, s.desc)}`),
        ...(title ? [`🏷️ “${title.name}”: ${describeEffect(title.effect)}`] : []),
        ...(job ? [`${job.icon} ${job.name}: ${describeEffect(job.effect)}`] : []),
        ...(army.power > 0 ? [`👥 Shadow Army: +${Math.round(army.power * 100)}% XP from everything`] : []),
    ];
    return (
        <SysWin title="Skills" className="mb-4">
            <div className="skill-grid">
                {SKILLS.map(sk => {
                    const has = owned.has(sk.id);
                    return (
                        <div key={sk.id} className={`skill ${has ? "is-on" : ""}`} title={describeEffect(sk.effect, sk.desc)}>
                            <span className="skill-icon">{has ? sk.icon : "🔒"}</span>
                            <span className="skill-name">{sk.name}</span>
                            <span className="skill-req">{has ? describeEffect(sk.effect, sk.desc) : Object.entries(sk.req).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(" · ")}</span>
                        </div>
                    );
                })}
            </div>
            <div className="sys-divider" />
            <div className="sys-label mb-1">Active bonuses</div>
            {bonuses.length ? (
                <ul className="text-[12.5px] flex flex-col gap-1" style={{ color: "var(--text-secondary)" }}>{bonuses.map(b => <li key={b}>{b}</li>)}</ul>
            ) : <div className="text-[12.5px]" style={{ color: "var(--text-dim)" }}>None yet — raise stats to unlock skills, earn titles and raise shadows.</div>}
            <div className="flex gap-2 mt-3">
                <button type="button" className="sys-btn flex-1 !text-[12.5px]" onClick={() => setPage("army")}>👥 Shadow Army ({army.shadows.length})</button>
                <button type="button" className="sys-btn flex-1 !text-[12.5px]" onClick={() => setPage("titles")}>🏷️ Titles ({(system.titles || []).length})</button>
            </div>
        </SysWin>
    );
}

function Alerts({ setPage }) {
    const system = useAppStore(s => s.system);
    const totalXP = useAppStore(s => s.totalXP);
    const trial = system?.trial || availableTrial(system, getLevel(totalXP || 0));
    return (
        <>
            {system?.penalty?.active && (
                <button type="button" className="w-full text-left mb-4" onClick={() => setPage("quests")}>
                    <SysWin title="Warning" kind="warning">
                        <div className="sys-row">
                            <div className="text-[13.5px]">You are in the Penalty Zone. XP gains are halved until you survive it.</div>
                            <ChevronRight size={20} className="shrink-0" />
                        </div>
                    </SysWin>
                </button>
            )}
            {trial && (
                <button type="button" className="w-full text-left mb-4" onClick={() => setPage("quests")}>
                    <SysWin title="Rank Assessment" kind="gold">
                        <div className="sys-row">
                            <div className="text-[13.5px]">{system?.trial ? "Your assessment is in progress — the clock is running." : "A Rank Assessment is available. Pass it to be promoted."}</div>
                            <ChevronRight size={20} className="shrink-0" />
                        </div>
                    </SysWin>
                </button>
            )}
        </>
    );
}

function TodayTiles({ setPage }) {
    const workoutLog = useAppStore(s => s.workoutLog);
    const foodLog = useAppStore(s => s.foodLog);
    const journal = useAppStore(s => s.journal);
    const d = today();
    const tiles = [
        { label: "Training", Icon: Swords, done: hasDayWorkout(workoutLog, d), page: "training" },
        { label: "Nutrition", Icon: Apple, done: toArr(foodLog?.[d]).length > 0, page: "nutrition" },
        { label: "Wellness", Icon: Heart, done: !!journal?.[d]?.mood, page: "wellness" },
    ];
    return (
        <div className="grid grid-cols-3 gap-2 mb-4">
            {tiles.map(t => (
                <button type="button" key={t.label} onClick={() => setPage(t.page)} className="gc !p-3 flex flex-col items-center gap-1"
                    style={t.done ? { borderColor: "rgba(74,222,128,.35)", background: "rgba(74,222,128,.06)" } : undefined}>
                    <t.Icon size={20} style={{ color: t.done ? "#4ade80" : "var(--accent)" }} />
                    <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>{t.label}</span>
                    <span className="text-[11px]" style={{ color: t.done ? "#4ade80" : "var(--text-dim)" }}>{t.done ? "✓ Done" : "To do"}</span>
                </button>
            ))}
        </div>
    );
}

export default function StatusPage() {
    const setPage = useAppStore(s => s.setPage);
    const s = useAppStore();
    return (
        <div className="fade-in max-w-[720px] mx-auto">
            <Alerts setPage={setPage} />
            <div className="mb-4"><StatusWindow /></div>
            <div className="mb-4"><DailyQuestCard compact onOpen={() => setPage("quests")} /></div>
            <SkillsWindow setPage={setPage} />
            <div className="sys-label mb-2">Today</div>
            <TodayTiles setPage={setPage} />
            <WeeklyReport workoutLog={s.workoutLog} foodLog={s.foodLog} focusLog={s.focusLog} habitLog={s.habitLog} totalXP={s.totalXP} streak={s.streak} />
        </div>
    );
}
