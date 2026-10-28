"use client";
// Daily Quest, Penalty Zone, Rank Assessment and Job Change cards (B6 style).
import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2, RotateCcw, Clock, Lock, Gift, ScrollText, ChevronRight, TriangleAlert } from "lucide-react";
import useAppStore from "@/stores/useAppStore";
import { Card, Bar, Ring, Check, Pill, IconBadge } from "../ui/kit";
import { CLASS_ICON } from "../ui/icons";
import { RankEmblem } from "./SysWin";
import MoveFigure from "../training/MoveFigure";
import Sheet from "../training/Sheet";
import { getLevel, today } from "@/utils";
import { play } from "../soundEngine";
import { questItems, questDay, questStatus, questRewards, msToMidnight, PENALTY_MOVES, PENALTY_SECONDS as PENALTY_BASE_SECONDS, PENALTY_INTERVAL, QUEST_TEMPLATE, templateTarget } from "@/lib/system/quests";
import { availableTrial, TRIALS, trialRewards, rankById } from "@/lib/system/ranks";
import { effectSum, CLASSES, JOB_LEVEL, JOB_DAYS, jobQuestProgress, monarchEligible, describeEffect } from "@/lib/system/progression";
import { statSheet } from "@/lib/system/stats";
import { hasDayWorkout } from "@/lib/workoutHelpers";
import { awaken, startJobQuest, chooseClass, setQuestProgress, saveQuestItems, survivePenalty, consumeItem, startTrial, toggleTrialTask, submitTrial, failTrial } from "@/lib/system/actions";

/** Current time, refreshed every `ms` (0 until the first tick — never read during render). */
export function useNow(ms = 1000) {
    const [now, setNow] = useState(0);
    useEffect(() => {
        const tick = () => setNow(Date.now());
        const first = setTimeout(tick, 0);
        const t = setInterval(tick, ms);
        return () => { clearTimeout(first); clearInterval(t); };
    }, [ms]);
    return now;
}

export const fmtClock = (ms) => {
    if (ms == null || ms < 0) ms = 0;
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${h > 0 ? `${String(h).padStart(2, "0")}:` : ""}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

/** "6h 12m" style. */
export const fmtLeft = (ms) => {
    const m = Math.max(0, Math.floor(ms / 60000));
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

const fmtNum = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
const unitLabel = (u) => (u === "reps" ? "" : ` ${u}`);
const stepsFor = (unit) => unit === "km" ? [0.5, 1] : unit === "sec" ? [15, 30] : unit === "min" ? [5, 10] : [5, 10, 25];

function useQuest() {
    const system = useAppStore(s => s.system);
    const totalXP = useAppStore(s => s.totalXP);
    const lv = getLevel(totalXP || 0);
    const day = questDay(system, today());
    // A cleared day keeps the targets it was cleared against (levelling up later raises them).
    const items = questItems(system, lv).map(i => (day.claimed && day.targets?.[i.id] ? { ...i, target: day.targets[i.id] } : i));
    const status = questStatus(items, day);
    return { system, lv, items, day, status, locked: !!system?.penalty?.active };
}

function QuestRow({ item, value, full }) {
    const done = value >= item.target;
    return (
        <div className="list-row !items-start">
            {full
                ? <div className="w-12 h-12 shrink-0 rounded-[14px] overflow-hidden" style={{ background: "var(--ghost-bg)" }}><MoveFigure pattern={item.pattern || "stand"} animate={!done} /></div>
                : <Check on={done} label={done ? `${item.name} done` : `${item.name} not done`} />}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2 items-baseline">
                    <span className={`row-title truncate ${done && !full ? "is-done-text" : ""}`}>{item.name}</span>
                    <span className="text-[13px] num shrink-0" style={{ color: done ? "var(--ok)" : "var(--text-secondary)", fontWeight: done ? 700 : 500 }}>
                        {done && full ? "✓ " : ""}{fmtNum(value)} / {fmtNum(item.target)}{unitLabel(item.unit)}
                    </span>
                </div>
                {(!done || full) && <Bar value={value / item.target} color={done ? "var(--ok)" : undefined} className="mt-1.5" />}
                {full && (
                    <div className="step-btns">
                        {stepsFor(item.unit).map(n => (
                            <button key={n} type="button" onClick={() => { play("tap"); setQuestProgress(item.id, value + n); }} aria-label={`Add ${n} ${item.unit} to ${item.name}`}>+{n}</button>
                        ))}
                        <input key={value} type="number" inputMode="decimal" min="0" step={item.unit === "km" ? "0.1" : "1"} defaultValue={value || ""} placeholder="Set"
                            aria-label={`${item.name} total`}
                            onBlur={e => { const v = Number(e.target.value); if (Number.isFinite(v) && v !== value) setQuestProgress(item.id, v); }}
                            onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }} />
                    </div>
                )}
            </div>
        </div>
    );
}

/** Daily Quest card. `compact` = checklist summary for Home. */
export function DailyQuestCard({ compact = false, onOpen }) {
    const { system, lv, items, day, locked } = useQuest();
    const now = useNow(compact ? 30000 : 1000);
    const [editing, setEditing] = useState(false);
    const r = questRewards(system?.rank);
    const left = now ? msToMidnight(new Date(now)) : null;

    if (!system?.awakened) {
        return (
            <Card title="Daily Quest">
                <p className="text-[13.5px] muted">Accept the System to get a Daily Quest, stats and Gold. Your level and XP are kept.</p>
                <button type="button" className="bp w-full mt-3" onClick={() => {
                    awaken();
                    useAppStore.getState().notify({ kind: "quest", title: "PLAYER AWAKENED", lines: ["You are now a Player.", "Your first Daily Quest has arrived."] });
                }}>Accept</button>
            </Card>
        );
    }

    const doneCount = items.filter(i => (Number(day.progress?.[i.id]) || 0) >= i.target).length;
    return (
        <>
            <Card title="Daily Quest" sub={locked ? "Locked" : day.claimed ? "Cleared today" : `${doneCount} of ${items.length} done`}>
                {!compact && !locked && <p className="text-[12.5px] dim -mt-1 mb-1">Preparations to become powerful</p>}
                {locked ? (
                    <div className="flex items-center gap-3 py-2">
                        <IconBadge icon={Lock} tone="rose" size={36} />
                        <div className="text-[13.5px] muted">Locked until you clear the Penalty Quest.</div>
                    </div>
                ) : (
                    <div>
                        {items.map(it => <QuestRow key={it.id} item={it} value={Number(day.progress?.[it.id]) || 0} full={!compact} />)}
                    </div>
                )}

                {!compact && !locked && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {day.claimed
                            ? <Pill tone="teal">✓ Cleared{day.over ? " · hidden reward claimed" : ""}</Pill>
                            : <><Pill tone="sky">+{r.xp} XP</Pill><Pill tone="amber">+{r.gold} Gold</Pill><Pill tone="violet">+{r.ap} point</Pill><Pill tone="orange" icon={Gift}>{Math.round(r.boxChance * 100)}% box</Pill></>}
                    </div>
                )}

                <div className="flex justify-between items-center gap-3 mt-3">
                    <span className="text-[12.5px] dim inline-flex items-center gap-1"><Clock size={14} /> {left == null ? "…" : `${fmtLeft(left)} left today`}</span>
                    {compact
                        ? <button type="button" className="bp !py-2.5" onClick={onOpen}>{locked ? "Penalty Zone" : day.claimed ? "View" : "Continue"}</button>
                        : <button type="button" className="bg !py-2" onClick={() => setEditing(true)} disabled={locked}><Pencil size={14} /> Edit quest</button>}
                </div>
                {!compact && !locked && (
                    <p className="text-[12px] dim mt-2">{day.claimed && !day.over ? "Keep going — double every target for a hidden reward." : !day.claimed ? "Double every target for a hidden reward. Miss today and tomorrow starts with a short Penalty Zone." : ""}</p>
                )}
            </Card>
            {editing && <QuestEditor items={items} lv={lv} custom={!!system?.quest?.items?.length} onClose={() => setEditing(false)} />}
        </>
    );
}

let nextId = 0;
function QuestEditor({ items, lv, custom, onClose }) {
    const [list, setList] = useState(() => items.map(i => ({ ...i })));
    const set = (idx, patch) => setList(l => l.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
    const save = () => { saveQuestItems(list); onClose(); };
    const reset = () => { saveQuestItems(null); onClose(); };
    return (
        <Sheet title="Edit Daily Quest" subtitle="Your quest, your rules" onClose={onClose}
            footer={<button type="button" className="bp w-full" onClick={save}>Save quest</button>}>
            <p className="text-[13px] muted mb-3">
                The template grows with your level (Lv {lv}: {templateTarget("pushups", lv)} reps, {templateTarget("run", lv)} km). Change any target, swap exercises or add your own.
            </p>
            <div className="flex flex-col gap-3">
                {list.map((it, idx) => (
                    <div key={it.id} className="card !p-3">
                        <div className="flex gap-2">
                            <input className="inp flex-1" value={it.name} maxLength={40} onChange={e => set(idx, { name: e.target.value })} aria-label="Exercise name" />
                            <button type="button" className="icon-btn" onClick={() => setList(l => l.filter((_, i) => i !== idx))} aria-label={`Remove ${it.name}`}><Trash2 size={16} /></button>
                        </div>
                        <div className="flex gap-2 mt-2 items-center">
                            <input className="inp !w-24" type="number" min="0.5" step="0.5" value={it.target} disabled={it.auto}
                                onChange={e => set(idx, { target: e.target.value, auto: false })} aria-label="Target" />
                            <select className="inp !w-24" value={it.unit} onChange={e => set(idx, { unit: e.target.value })} aria-label="Unit">
                                {["reps", "km", "min", "sec"].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            {templateTarget(it.id, lv) != null && (
                                <label className="flex items-center gap-1.5 text-[12.5px] ml-auto muted">
                                    <input type="checkbox" checked={!!it.auto} onChange={e => set(idx, e.target.checked ? { auto: true, target: templateTarget(it.id, lv) } : { auto: false })} />
                                    Grow with level
                                </label>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 mt-3">
                <button type="button" className="bg flex-1" disabled={list.length >= 8}
                    onClick={() => setList(l => [...l, { id: `c${Date.now().toString(36)}${nextId++}`, name: "Plank", unit: "sec", target: 60, pattern: null, auto: false }])}>
                    <Plus size={16} /> Add exercise
                </button>
                {(custom || list.length !== QUEST_TEMPLATE.length) && (
                    <button type="button" className="bg flex-1" onClick={reset}><RotateCcw size={16} /> Use template</button>
                )}
            </div>
        </Sheet>
    );
}

/** Penalty Zone — survive a few minutes of non-stop movement. */
export function PenaltyZone() {
    const system = useAppStore(s => s.system);
    const activeTitle = useAppStore(s => s.activeTitle);
    // Tenacity (skill) and the Tank class shorten the zone.
    const zoneSeconds = Math.max(60, PENALTY_BASE_SECONDS - effectSum(system, activeTitle, "penaltyCut"));
    const [endsAt, setEndsAt] = useState(null);
    const [finished, setFinished] = useState(false);
    const now = useNow(250);
    const lastMove = useRef(-1);
    const running = endsAt != null && !finished;

    // Move change beeps and completion happen in the timer callback, not in render.
    useEffect(() => {
        if (endsAt == null || finished) return;
        const t = setInterval(() => {
            const left = endsAt - Date.now();
            if (left <= 0) { setFinished(true); play("timerEnd"); return; }
            const m = Math.floor((zoneSeconds * 1000 - left) / (PENALTY_INTERVAL * 1000));
            if (m !== lastMove.current) { if (lastMove.current >= 0) play("timerBeep"); lastMove.current = m; }
        }, 250);
        return () => clearInterval(t);
    }, [endsAt, finished, zoneSeconds]);

    if (!system?.penalty?.active) return null;
    const total = zoneSeconds * 1000;
    // `now` can lag behind the moment the zone started — clamp so the clock never runs backwards.
    const left = running && now ? Math.min(total, Math.max(0, endsAt - now)) : total;
    const moveIdx = Math.max(0, Math.floor((total - left) / (PENALTY_INTERVAL * 1000))) % PENALTY_MOVES.length;
    const move = PENALTY_MOVES[moveIdx];
    const moveLeft = Math.ceil((left % (PENALTY_INTERVAL * 1000)) / 1000) || PENALTY_INTERVAL;
    const pardons = Number(system.inventory?.pardon) || 0;

    return (
        <Card tone="rose" title={<span className="inline-flex items-center gap-2"><TriangleAlert size={17} style={{ color: "var(--danger)" }} /> Penalty Quest</span>}
            sub={finished ? "Survived" : `${Math.round(zoneSeconds / 60)} min`}>
            <p className="text-[13.5px] muted -mt-1 mb-3">
                {finished ? "You survived the Penalty Zone." : "Yesterday's Daily Quest was missed. Survive non-stop movement to lift the penalty — until then XP is halved."}
            </p>
            {!finished && (
                <div className="flex items-center gap-4">
                    <Ring value={1 - left / total} size={104} stroke={8} color="var(--danger)">
                        <span className="text-[19px] font-extrabold num">{fmtClock(left)}</span>
                    </Ring>
                    <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold dim">{running ? "Now" : "First move"}</div>
                        <div className="text-[19px] font-bold leading-tight">{move.name}</div>
                        {running && <div className="text-[12.5px] muted">{moveLeft}s · next: {PENALTY_MOVES[(moveIdx + 1) % PENALTY_MOVES.length].name}</div>}
                    </div>
                    <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden" style={{ background: "var(--ghost-bg)" }}>
                        <MoveFigure pattern={move.pattern} animate={running} accent="var(--danger)" />
                    </div>
                </div>
            )}
            <div className="flex gap-2 mt-4">
                {finished
                    ? <button type="button" className="bp flex-1" onClick={survivePenalty}>Claim survival</button>
                    : running
                        ? <button type="button" className="bg flex-1" onClick={() => setEndsAt(null)}>Stop (start over)</button>
                        : <button type="button" className="bp flex-1" style={{ background: "var(--danger)", color: "#fff" }} onClick={() => { lastMove.current = -1; setFinished(false); setEndsAt(Date.now() + zoneSeconds * 1000); play("warning"); }}>Start Penalty Zone</button>}
                {pardons > 0 && !running && !finished && (
                    <button type="button" className="bg" onClick={() => consumeItem("pardon")}><ScrollText size={15} /> Pardon ({pardons})</button>
                )}
            </div>
        </Card>
    );
}

/** Rank Assessment — unlocked by level, passed by a real timed test. */
export function RankTrialCard() {
    const system = useAppStore(s => s.system);
    const totalXP = useAppStore(s => s.totalXP);
    const now = useNow(1000);
    const lv = getLevel(totalXP || 0);
    const trial = system?.trial;
    const target = trial ? rankById(trial.rank) : availableTrial(system, lv);
    if (!target) return null;
    const def = TRIALS[target.id];
    const rw = trialRewards(target.id);
    const cooldown = !trial && system?.trialCooldown && system.trialCooldown > today();
    const left = trial && now ? trial.deadline - now : null;
    const allDone = trial && def.tasks.every((_, i) => trial.done?.[i]);

    return (
        <Card tone="amber">
            <div className="flex items-center gap-3 mb-2">
                <RankEmblem rank={target} size={44} />
                <div className="min-w-0 flex-1">
                    <div className="card-title">Rank Assessment · {target.name}</div>
                    <div className="text-[12.5px] dim">Finish every task within {def.minutes} min · +{rw.gold} Gold · +{rw.ap} points</div>
                </div>
            </div>
            <div>
                {def.tasks.map((t, i) => (
                    <div key={i} className="list-row">
                        <div className="w-10 h-10 shrink-0 rounded-xl overflow-hidden" style={{ background: "var(--ghost-bg)" }}><MoveFigure pattern={t.pattern} animate={!!trial && !trial.done?.[i]} /></div>
                        <span className={`flex-1 row-title ${trial?.done?.[i] ? "is-done-text" : ""}`}>{t.name}</span>
                        <span className="text-[13px] num muted">{t.target} {t.unit}</span>
                        {trial && <Check on={!!trial.done?.[i]} onClick={() => toggleTrialTask(i)} label={`${t.name} done`} />}
                    </div>
                ))}
            </div>
            {trial ? (
                <>
                    <div className="flex justify-between items-center mt-3">
                        <span className="text-[12.5px] dim">Time left</span>
                        <span className="big-timer" style={{ color: left != null && left < 5 * 60e3 ? "var(--danger)" : undefined }}>{left == null ? "--:--" : fmtClock(left)}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                        {left != null && left <= 0
                            ? <button type="button" className="bp flex-1" onClick={() => failTrial("Time ran out.")}>Time&apos;s up</button>
                            : <button type="button" className="bp flex-1" disabled={!allDone} onClick={submitTrial}>Submit assessment</button>}
                        <button type="button" className="bg" onClick={() => failTrial()}>Withdraw</button>
                    </div>
                    <p className="text-[12px] dim mt-2">Be honest — tick each task as you finish it.</p>
                </>
            ) : cooldown ? (
                <p className="text-[13px] muted mt-2">You can retry the assessment tomorrow.</p>
            ) : (
                <>
                    <button type="button" className="bp w-full mt-3" onClick={startTrial}>Begin assessment</button>
                    <p className="text-[12px] dim mt-2 text-center">The timer starts when you begin. Warm up first.</p>
                </>
            )}
        </Card>
    );
}

/** Job Change Quest (Lv 40): 7 days in a row of Daily Quest + a workout, then pick a class. */
export function JobChangeCard() {
    const state = useAppStore();
    const { system, totalXP, workoutLog } = state;
    const lv = getLevel(totalXP || 0);
    if (!system?.awakened || system.job?.id) return null;
    if (lv < JOB_LEVEL) {
        return (
            <Card>
                <div className="flex items-center gap-3">
                    <IconBadge icon={Lock} tone="amber" size={36} />
                    <div className="flex-1 min-w-0">
                        <div className="row-title">Job Change</div>
                        <div className="row-sub">Unlocks at Level {JOB_LEVEL} — you are Level {lv}.</div>
                    </div>
                    <Bar value={lv / JOB_LEVEL} className="w-16" color="var(--warn)" />
                </div>
            </Card>
        );
    }
    const prog = jobQuestProgress(system, (k) => hasDayWorkout(workoutLog, k));
    if (!prog) {
        return (
            <Card tone="amber" title="Job Change Quest available">
                <p className="text-[13.5px] muted -mt-1">For {JOB_DAYS} days in a row: clear the Daily Quest and finish a workout or Gate. Then choose your class.</p>
                <button type="button" className="bp w-full mt-3" onClick={startJobQuest}>Accept quest</button>
            </Card>
        );
    }
    if (!prog.complete) {
        return (
            <Card tone={prog.failed ? "rose" : "amber"} title="Job Change Quest" sub={`${prog.done} / ${JOB_DAYS} days`}>
                <div className="flex justify-between gap-1 my-1" aria-hidden="true">
                    {Array.from({ length: JOB_DAYS }, (_, i) => <span key={i} className={`job-dot ${i < prog.done ? "is-on" : ""}`}>{i + 1}</span>)}
                </div>
                <p className="text-[13px] muted mt-2">
                    {prog.failed ? "A day was missed, so the quest failed." : `Today: clear the Daily Quest and finish a workout or Gate.`}
                </p>
                {prog.failed && <button type="button" className="bp w-full mt-3" onClick={startJobQuest}>Restart from today</button>}
            </Card>
        );
    }
    const sheet = statSheet(state, system);
    const top = [...sheet].sort((a, b) => b.total - a.total)[0];
    const options = CLASSES.filter(c => !c.hidden || monarchEligible(sheet, system));
    return (
        <Card tone="amber" title="Choose your job" sub="Permanent">
            {options.map(c => {
                const stat = sheet.find(s => s.key === c.stat);
                return (
                    <div key={c.id} className="list-row">
                        <IconBadge icon={CLASS_ICON[c.id]} tone={c.hidden ? "violet" : "amber"} size={38} />
                        <div className="flex-1 min-w-0">
                            <div className="row-title">{c.name}{c.hidden ? " · hidden" : ""}{stat && top.key === c.stat ? " · recommended" : ""}</div>
                            <div className="row-sub">{stat ? `${stat.label} ${stat.total} · ` : ""}{describeEffect(c.effect)}</div>
                        </div>
                        <button type="button" className="bg !py-2 !px-3 !text-[12.5px]" onClick={() => { if (window.confirm(`Become a ${c.name}? This can't be changed.`)) chooseClass(c.id); }}>Choose <ChevronRight size={14} /></button>
                    </div>
                );
            })}
        </Card>
    );
}
