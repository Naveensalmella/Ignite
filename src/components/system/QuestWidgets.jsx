"use client";
// Daily Quest, Penalty Zone and Rank Assessment windows.
import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2, RotateCcw } from "lucide-react";
import useAppStore from "@/stores/useAppStore";
import SysWin, { RankEmblem } from "./SysWin";
import MoveFigure from "../training/MoveFigure";
import Sheet from "../training/Sheet";
import { getLevel, today } from "@/utils";
import { play } from "../soundEngine";
import { questItems, questDay, questStatus, questRewards, msToMidnight, PENALTY_MOVES, PENALTY_SECONDS, PENALTY_INTERVAL, QUEST_TEMPLATE, templateTarget } from "@/lib/system/quests";
import { availableTrial, TRIALS, trialRewards, rankById } from "@/lib/system/ranks";
import { awaken, setQuestProgress, saveQuestItems, survivePenalty, consumeItem, startTrial, toggleTrialTask, submitTrial, failTrial } from "@/lib/system/actions";

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

const fmtNum = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
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

function QuestRow({ item, value, done, interactive, animate }) {
    return (
        <div className="quest-row">
            <div className="quest-fig"><MoveFigure pattern={item.pattern || "stand"} animate={animate} accent="#7dd3fc" /></div>
            <div className="flex-1 min-w-0">
                <div className="sys-row">
                    <span className="quest-name truncate">{item.name}</span>
                    <span className={`quest-count ${done ? "is-done" : ""}`}>
                        [{fmtNum(value)}/{fmtNum(item.target)}{item.unit === "reps" ? "" : ` ${item.unit}`}]{done ? " ✓" : ""}
                    </span>
                </div>
                <div className="sys-bar mt-1.5" aria-hidden="true"><div style={{ width: `${Math.min(100, (value / item.target) * 100)}%` }} /></div>
                {interactive && (
                    <div className="quest-steps">
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

/** Daily Quest window. `compact` = summary for the Status page. */
export function DailyQuestCard({ compact = false, onOpen }) {
    const { system, lv, items, day, status, locked } = useQuest();
    const now = useNow(1000);
    const [editing, setEditing] = useState(false);
    const r = questRewards(system?.rank);
    const left = now ? msToMidnight(new Date(now)) : null;

    if (!system?.awakened) {
        return (
            <SysWin title="Daily Quest">
                <div className="sys-notice-lines">
                    <p>You are not a Player yet.</p>
                    <p style={{ color: "var(--text-secondary)" }}>Accept the System to receive Daily Quests, stats and Gold. Your level and XP are kept.</p>
                </div>
                <button type="button" className="sys-btn w-full mt-4" onClick={() => {
                    awaken();
                    useAppStore.getState().notify({ kind: "quest", title: "PLAYER AWAKENED", lines: ["You are now a Player.", "Your first Daily Quest has arrived."] });
                }}>Accept</button>
            </SysWin>
        );
    }

    return (
        <>
        <SysWin title="Daily Quest" className={!day.claimed && !locked ? "sys-pulse" : ""}>
            <div className="text-center text-[13px] -mt-1 mb-2" style={{ color: "var(--text-secondary)" }}>Preparations to become powerful</div>
            {locked ? (
                <div className="text-center text-[13.5px] py-3" style={{ color: "#fca5a5" }}>🔒 Locked until the Penalty Quest is cleared.</div>
            ) : (
                <div>
                    {items.map(it => {
                        const v = Number(day.progress?.[it.id]) || 0;
                        return <QuestRow key={it.id} item={it} value={v} done={v >= it.target} interactive={!compact} animate={!compact && v < it.target} />;
                    })}
                </div>
            )}
            <div className="sys-divider" />
            <div className="sys-row text-[12.5px]">
                <span style={{ color: "var(--text-secondary)" }}>
                    {day.claimed ? <b style={{ color: "#4ade80" }}>✓ Cleared today{day.over ? " · Hidden reward claimed" : ""}</b> : <>Reward: +{r.xp} XP · {r.gold} Gold · +{r.ap} AP</>}
                </span>
                <span className="font-heading font-bold tracking-wider" style={{ color: day.claimed ? "var(--text-dim)" : "#fca5a5" }} aria-label="Time left today">
                    ⏱ {left == null ? "--:--:--" : fmtClock(left)}
                </span>
            </div>
            {!compact && !day.claimed && !locked && (
                <div className="text-[12px] mt-2" style={{ color: "var(--text-dim)" }}>
                    {Math.round(r.boxChance * 100)}% chance of a Random Box. Double every target for a hidden reward. Miss it and tomorrow starts in the Penalty Zone.
                </div>
            )}
            {!compact && day.claimed && !day.over && !locked && (
                <div className="text-[12px] mt-2" style={{ color: "var(--text-dim)" }}>Keep going — double every target for a hidden reward.</div>
            )}
            <div className="flex gap-2 mt-3">
                {compact
                    ? <button type="button" className="sys-btn flex-1" onClick={onOpen}>{locked ? "Enter Penalty Zone" : day.claimed ? "View quests" : `Continue · ${Math.round(status.pct * 100)}%`}</button>
                    : <button type="button" className="sys-btn" onClick={() => setEditing(true)} disabled={locked}><Pencil size={14} /> Edit quest</button>}
            </div>
        </SysWin>
        {/* Outside the window: .sys-win isolates stacking, which would trap the sheet under the nav. */}
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
            <p className="text-[13px] mb-3" style={{ color: "var(--text-secondary)" }}>
                The System template scales with your level (Lv {lv}: {templateTarget("pushups", lv)} reps, {templateTarget("run", lv)} km). Change any target, swap exercises or add your own.
            </p>
            <div className="flex flex-col gap-3">
                {list.map((it, idx) => (
                    <div key={it.id} className="gs !p-3">
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
                                <label className="flex items-center gap-1.5 text-[12.5px] ml-auto" style={{ color: "var(--text-secondary)" }}>
                                    <input type="checkbox" checked={!!it.auto} onChange={e => set(idx, e.target.checked ? { auto: true, target: templateTarget(it.id, lv) } : { auto: false })} />
                                    Scale with level
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
                    <button type="button" className="bg flex-1" onClick={reset}><RotateCcw size={16} /> System template</button>
                )}
            </div>
        </Sheet>
    );
}

/** Penalty Zone — survive 5 minutes of non-stop movement. */
export function PenaltyZone() {
    const system = useAppStore(s => s.system);
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
            const m = Math.floor((PENALTY_SECONDS * 1000 - left) / (PENALTY_INTERVAL * 1000));
            if (m !== lastMove.current) { if (lastMove.current >= 0) play("timerBeep"); lastMove.current = m; }
        }, 250);
        return () => clearInterval(t);
    }, [endsAt, finished]);

    if (!system?.penalty?.active) return null;
    const total = PENALTY_SECONDS * 1000;
    // `now` can lag behind the moment the zone started — clamp so the clock never runs backwards.
    const left = running && now ? Math.min(total, Math.max(0, endsAt - now)) : total;
    const moveIdx = Math.max(0, Math.floor((total - left) / (PENALTY_INTERVAL * 1000))) % PENALTY_MOVES.length;
    const move = PENALTY_MOVES[moveIdx];
    const moveLeft = Math.ceil((left % (PENALTY_INTERVAL * 1000)) / 1000) || PENALTY_INTERVAL;
    const pardons = Number(system.inventory?.pardon) || 0;

    return (
        <SysWin title="Penalty Quest" kind="warning" className="mb-4">
            <div className="text-center text-[13.5px] mb-3" style={{ color: "#fecaca" }}>
                {finished ? "You survived." : `Survive the Penalty Zone — ${PENALTY_SECONDS / 60} minutes of non-stop movement.`}
            </div>
            {!finished && (
                <div className="flex items-center gap-4">
                    <div className="w-28 h-28 shrink-0 rounded-[6px] overflow-hidden" style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(252,165,165,.25)" }}>
                        <MoveFigure pattern={move.pattern} animate={running} accent="#fca5a5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="sys-label" style={{ color: "#fca5a5" }}>{running ? "Now" : "First move"}</div>
                        <div className="font-heading text-[22px] font-bold leading-tight">{move.name}</div>
                        {running && <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{moveLeft}s · next: {PENALTY_MOVES[(moveIdx + 1) % PENALTY_MOVES.length].name}</div>}
                        <div className="quest-timer mt-1" aria-live="off">{fmtClock(left)}</div>
                    </div>
                </div>
            )}
            <div className="sys-bar mt-3" style={{ background: "rgba(239,68,68,.15)" }}><div style={{ width: `${100 - (left / (PENALTY_SECONDS * 1000)) * 100}%`, background: "linear-gradient(90deg,#ef4444,#f97316)", boxShadow: "0 0 10px rgba(239,68,68,.6)" }} /></div>
            <div className="text-[12px] mt-2" style={{ color: "var(--text-dim)" }}>Until it&apos;s cleared, XP gains are halved and the Daily Quest is locked. Nothing is taken away.</div>
            <div className="flex gap-2 mt-3">
                {finished
                    ? <button type="button" className="sys-btn flex-1" onClick={survivePenalty}>Claim survival</button>
                    : running
                        ? <button type="button" className="sys-btn flex-1" onClick={() => setEndsAt(null)}>Stop (start over)</button>
                        : <button type="button" className="sys-btn flex-1" onClick={() => { lastMove.current = -1; setFinished(false); setEndsAt(Date.now() + PENALTY_SECONDS * 1000); play("warning"); }}>Enter the Penalty Zone</button>}
                {pardons > 0 && !running && !finished && (
                    <button type="button" className="sys-btn" onClick={() => consumeItem("pardon")}>📜 Pardon ({pardons})</button>
                )}
            </div>
        </SysWin>
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
        <SysWin title="Rank Assessment" kind="gold" className="mb-4">
            <div className="flex items-center gap-3 mb-3">
                <RankEmblem rank={target} size={46} />
                <div className="min-w-0">
                    <div className="font-heading text-[20px] font-bold leading-tight">Promotion to {target.name}</div>
                    <div className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>Complete every task within {def.minutes} minutes · +{rw.gold} Gold · +{rw.ap} AP</div>
                </div>
            </div>
            <div>
                {def.tasks.map((t, i) => (
                    <label key={i} className="quest-row cursor-pointer">
                        <div className="quest-fig"><MoveFigure pattern={t.pattern} animate={!!trial && !trial.done?.[i]} accent="#fde68a" /></div>
                        <span className="flex-1 quest-name">{t.name}</span>
                        <span className={`quest-count ${trial?.done?.[i] ? "is-done" : ""}`}>{t.target} {t.unit}</span>
                        {trial && <input type="checkbox" className="w-5 h-5 accent-amber-400" checked={!!trial.done?.[i]} onChange={() => toggleTrialTask(i)} aria-label={`${t.name} done`} />}
                    </label>
                ))}
            </div>
            <div className="sys-divider" />
            {trial ? (
                <>
                    <div className="sys-row">
                        <span className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>Time remaining</span>
                        <span className="quest-timer" style={{ color: left != null && left < 5 * 60e3 ? "#fca5a5" : "#fde68a" }}>{left == null ? "--:--" : fmtClock(left)}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                        {left != null && left <= 0
                            ? <button type="button" className="sys-btn is-danger flex-1" onClick={() => failTrial("Time ran out.")}>Time&apos;s up</button>
                            : <button type="button" className="sys-btn flex-1" disabled={!allDone} onClick={submitTrial}>Submit assessment</button>}
                        <button type="button" className="sys-btn is-danger" onClick={() => failTrial()}>Withdraw</button>
                    </div>
                    <div className="text-[12px] mt-2" style={{ color: "var(--text-dim)" }}>Be honest — the System only knows what you tell it. Tick each task as you finish it.</div>
                </>
            ) : cooldown ? (
                <div className="text-center text-[13px]" style={{ color: "var(--text-secondary)" }}>You can retry the assessment tomorrow.</div>
            ) : (
                <>
                    <button type="button" className="sys-btn w-full" onClick={startTrial}>Begin assessment</button>
                    <div className="text-[12px] mt-2 text-center" style={{ color: "var(--text-dim)" }}>The timer starts when you begin. Warm up first.</div>
                </>
            )}
        </SysWin>
    );
}
