"use client";
// ══════════════════════════════════════════════════════════════
// Workout player — warm-up → exercises (set logging + rest timer) →
// cool-down → summary. Every exercise shows a live visual demo.
// ══════════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from "react";
import { X, Check, Plus, Minus, Play, Pause, SkipForward, ChevronLeft, ChevronRight, Info, Repeat, Trophy, Timer, Dumbbell, Layers, Clock } from "lucide-react";
import ExerciseDemo from "./training/ExerciseDemo";
import ExerciseSheet from "./training/ExerciseSheet";
import BodyMap from "./training/BodyMap";
import { getExerciseInfo, toWorkoutExercise } from "@/lib/exerciseVisuals";
import { exerciseHistory } from "@/lib/trainingStats";
import { MUSCLE_LABELS } from "@/lib/muscles";
import { WARMUP, COOLDOWN, getSwapOptions } from "@/data/exerciseMeta";
import { EXERCISES } from "@/data/exercises";
import { beep, victorySound } from "@/lib/beep";

const fmt = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, Math.round(s)) % 60).padStart(2, "0")}`;

function buildLog(exercises, sessions) {
    return exercises.map(ex => {
        const prev = exerciseHistory(sessions, ex.name).last;
        const prevSets = prev?.sets || [];
        return {
            ...ex,
            sets: Array.from({ length: ex.sets }, (_, i) => ({
                reps: ex.duration ? 0 : (ex.reps || 12),
                duration: ex.duration || 0,
                weight: Number(prevSets[i]?.weight ?? prevSets[prevSets.length - 1]?.weight) || 0,
                prev: prevSets[i] || null,
                done: false,
            })),
        };
    });
}

function swapsFor(name) {
    const info = getExerciseInfo(name);
    const own = getSwapOptions(name);
    const same = [];
    for (const parts of Object.values(EXERCISES)) for (const list of Object.values(parts)) for (const e of list) {
        if (e.name === name || own.includes(e.name)) continue;
        const p = getExerciseInfo(e).primary;
        if (p.some(m => info.primary.includes(m))) same.push(e.name);
    }
    return [...new Set([...own, ...same])].slice(0, 8);
}

// ── Warm-up / cool-down step ──
function Guided({ title, list, color, onDone }) {
    const [idx, setIdx] = useState(0);
    const [left, setLeft] = useState(list[0].duration);
    const [paused, setPaused] = useState(false);
    const ref = useRef({ idx: 0, left: list[0].duration });
    const next = () => {
        const i = ref.current.idx + 1;
        if (i >= list.length) { onDone(); return; }
        ref.current = { idx: i, left: list[i].duration };
        setIdx(i); setLeft(list[i].duration);
    };
    const nextRef = useRef(next);
    useEffect(() => { nextRef.current = next; });
    useEffect(() => {
        if (paused) return;
        const id = setInterval(() => {
            const l = ref.current.left - 1;
            ref.current.left = l; setLeft(l);
            if (l > 0 && l <= 3) beep(660, 0.08);
            if (l <= 0) { beep(880, 0.15); nextRef.current(); }
        }, 1000);
        return () => clearInterval(id);
    }, [paused]);
    const cur = list[idx];
    const info = getExerciseInfo(cur.name);
    return (
        <div className="player-guided">
            <div className="text-[12px] font-bold tracking-[2px] mb-1" style={{ color }}>{title} · {idx + 1}/{list.length}</div>
            <div className="text-[22px] font-extrabold mb-3 text-center">{cur.name}</div>
            <div className="player-demo-sm"><ExerciseDemo info={info} /></div>
            <div className="text-[44px] font-black tabular-nums mt-3" style={{ color }}>{fmt(left)}</div>
            <div className="flex gap-2 mt-3">
                <button type="button" className="pl-btn" onClick={() => setPaused(p => !p)}>{paused ? <Play size={16} /> : <Pause size={16} />}{paused ? "Resume" : "Pause"}</button>
                <button type="button" className="pl-btn" onClick={next}><SkipForward size={16} /> Next</button>
                <button type="button" className="pl-btn" style={{ color }} onClick={onDone}>Skip all</button>
            </div>
            {idx + 1 < list.length && <div className="text-[12px] mt-4" style={{ color: "#9ca3af" }}>Up next: {list[idx + 1].name}</div>}
        </div>
    );
}

// ── Summary ──
function Summary({ workout, log, seconds, sessions, onSave, onDiscard }) {
    const [rpe, setRpe] = useState(0);
    const done = log.map(ex => ({ ...ex, sets: ex.sets.filter(s => s.done) })).filter(ex => ex.sets.length);
    const sets = done.reduce((n, ex) => n + ex.sets.length, 0);
    const volume = Math.round(done.reduce((v, ex) => v + ex.sets.reduce((a, s) => a + s.weight * s.reps, 0), 0));
    const prs = done.map(ex => {
        const best = Math.max(0, ...ex.sets.map(s => s.weight));
        const prev = exerciseHistory(sessions, ex.name).bestWeight;
        return best > 0 && best > prev ? { name: ex.name, best, prev } : null;
    }).filter(Boolean);
    const muscles = (() => {
        const p = new Set(), s = new Set();
        done.forEach(ex => { const i = getExerciseInfo(ex); i.primary.forEach(m => p.add(m)); i.secondary.forEach(m => s.add(m)); });
        p.forEach(m => s.delete(m));
        return { primary: [...p], secondary: [...s] };
    })();

    return (
        <div className="player-summary">
            <div className="text-[56px] leading-none mb-2">🏆</div>
            <div className="text-[26px] font-black">Workout complete!</div>
            <div className="text-[13px] mb-5" style={{ color: "#9ca3af" }}>{workout.name}</div>
            <div className="grid grid-cols-2 gap-2 w-full mb-4">
                {[[Clock, fmt(seconds), "Duration"], [Layers, sets, "Sets"], [Dumbbell, volume ? `${volume.toLocaleString()} kg` : "—", "Volume"], [Check, `${done.length}/${log.length}`, "Exercises"]].map(([Icon, v, l]) => (
                    <div key={l} className="pl-card text-center"><Icon size={16} className="mx-auto mb-1 text-sky-300" /><div className="text-[20px] font-extrabold tabular-nums">{v}</div><div className="text-[11px]" style={{ color: "#9ca3af" }}>{l}</div></div>
                ))}
            </div>
            {prs.length > 0 && (
                <div className="pl-card w-full mb-4" style={{ borderColor: "rgba(245,158,11,.35)" }}>
                    <div className="flex items-center gap-2 text-[14px] font-bold mb-2 text-amber-400"><Trophy size={16} /> New personal records</div>
                    {prs.map(p => <div key={p.name} className="flex justify-between text-[13px] py-0.5"><span>{p.name}</span><b>{p.best} kg <span className="font-normal" style={{ color: "#9ca3af" }}>{p.prev ? `(was ${p.prev})` : "(first)"}</span></b></div>)}
                </div>
            )}
            {muscles.primary.length > 0 && (
                <div className="pl-card w-full mb-4">
                    <div className="text-[12px] font-bold tracking-[1.5px] mb-2" style={{ color: "#9ca3af" }}>MUSCLES WORKED</div>
                    <BodyMap primary={muscles.primary} secondary={muscles.secondary} height={170} />
                </div>
            )}
            <div className="pl-card w-full mb-5">
                <div className="text-[12px] font-bold tracking-[1.5px] mb-2" style={{ color: "#9ca3af" }}>HOW HARD WAS IT?</div>
                <div className="grid grid-cols-5 gap-1.5">
                    {[["😌", "Easy"], ["🙂", "Moderate"], ["😤", "Hard"], ["🥵", "Very hard"], ["💀", "Max"]].map(([e, l], i) => (
                        <button key={l} type="button" onClick={() => setRpe(i + 1)} className={`rpe ${rpe === i + 1 ? "is-on" : ""}`}><span className="text-[22px]">{e}</span><span className="text-[11px]">{l}</span></button>
                    ))}
                </div>
            </div>
            <button type="button" className="bp w-full !py-4 text-[16px]" onClick={() => onSave({ rpe, prs })}>Save workout</button>
            <button type="button" className="w-full py-3 mt-1 text-[13px]" style={{ color: "#9ca3af" }} onClick={onDiscard}>Discard</button>
        </div>
    );
}

export default function ActiveWorkout({ workout, sessions = [], onComplete, onQuit }) {
    const initial = useMemo(() => (workout?.exercises || []).map(toWorkoutExercise), [workout]);
    const [stage, setStage] = useState("warmup");
    const [log, setLog] = useState(() => buildLog(initial, sessions));
    const [idx, setIdx] = useState(0);
    const [startAt] = useState(() => Date.now());
    const [endAt, setEndAt] = useState(null);
    const [now, setNow] = useState(() => Date.now());
    const [rest, setRest] = useState(null);           // { endAt, total, label }
    const [timer, setTimer] = useState(null);         // timed set: { set, endAt, left, running }
    const [view, setView] = useState("demo");
    const [howTo, setHowTo] = useState(false);
    const [swapOpen, setSwapOpen] = useState(false);

    const ex = log[idx];
    const info = ex ? getExerciseInfo(ex) : null;
    const timed = !!ex?.duration;
    const doneSets = (e) => e.sets.filter(s => s.done).length;
    const allDone = ex && doneSets(ex) === ex.sets.length;

    // One clock for elapsed time, rest and timed sets.
    const tickRef = useRef(null);
    useEffect(() => {
        tickRef.current = () => {
            const t = Date.now();
            setNow(t);
            if (rest) {
                const left = Math.ceil((rest.endAt - t) / 1000);
                if (left <= 3 && left > 0 && left !== rest.beeped) { beep(660, 0.08); setRest(r => r && { ...r, beeped: left }); }
                if (t >= rest.endAt) { beep(880, 0.2); setTimeout(() => beep(1100, 0.25), 180); setRest(null); }
            }
            if (timer?.running) {
                const left = Math.ceil((timer.endAt - t) / 1000);
                if (left <= 3 && left > 0 && left !== timer.beeped) { beep(660, 0.08); setTimer(tm => tm && { ...tm, beeped: left }); }
                if (t >= timer.endAt) { beep(880, 0.2); completeSet(timer.set); setTimer(null); }
            }
        };
    });
    useEffect(() => {
        if (stage !== "workout") return;
        const id = setInterval(() => tickRef.current?.(), 250);
        return () => clearInterval(id);
    }, [stage]);

    const updateSet = (s, patch) => setLog(l => l.map((e, i) => i !== idx ? e : { ...e, sets: e.sets.map((st, j) => j === s ? { ...st, ...patch } : st) }));

    function completeSet(s) {
        const willBeLast = ex.sets.filter((st, j) => st.done || j === s).length === ex.sets.length;
        updateSet(s, { done: true });
        const restSec = ex.rest || 0;
        if (restSec > 0 && !(willBeLast && idx === log.length - 1)) {
            const nextEx = willBeLast ? log[idx + 1] : null;
            setRest({ endAt: Date.now() + restSec * 1000, total: restSec, label: nextEx ? `Next: ${nextEx.name}` : `Next: set ${s + 2}` });
        }
        if (willBeLast && idx < log.length - 1) setTimeout(() => goTo(idx + 1), 350);
    }
    const toggleSet = (s) => {
        if (ex.sets[s].done) { updateSet(s, { done: false }); return; }
        completeSet(s);
    };

    function goTo(i) {
        if (i < 0 || i >= log.length) return;
        setIdx(i); setView("demo"); setTimer(null); setSwapOpen(false);
    }
    const addSet = () => setLog(l => l.map((e, i) => i !== idx ? e : { ...e, sets: [...e.sets, { ...e.sets[e.sets.length - 1], done: false, prev: null }] }));
    const removeSet = () => setLog(l => l.map((e, i) => i !== idx || e.sets.length <= 1 ? e : { ...e, sets: e.sets.slice(0, -1) }));
    const swap = (name) => {
        setLog(l => l.map((e, i) => i !== idx ? e : { ...buildLog([toWorkoutExercise({ ...e, name, datasetId: undefined, primary: undefined })], sessions)[0], sets: e.sets.map(st => ({ ...st, done: false, prev: null })) }));
        setSwapOpen(false);
    };

    const startTimedSet = (s) => {
        const left = timer?.set === s && !timer.running ? timer.left : ex.duration;
        setTimer({ set: s, endAt: Date.now() + left * 1000, left, running: true });
    };
    const pauseTimedSet = () => setTimer(tm => tm && { ...tm, running: false, left: Math.max(1, Math.ceil((tm.endAt - Date.now()) / 1000)) });

    const finish = () => { setRest(null); setTimer(null); setEndAt(Date.now()); setStage("cooldown"); };
    const quit = () => {
        const started = log.some(e => e.sets.some(s => s.done));
        if (!started || window.confirm("Quit this workout? Sets you logged in this session won't be saved.")) onQuit?.();
    };

    const elapsed = ((endAt || now) - startAt) / 1000;
    const totalSets = log.reduce((n, e) => n + e.sets.length, 0);
    const totalDone = log.reduce((n, e) => n + doneSets(e), 0);

    if (!workout || log.length === 0) return null;

    if (stage === "summary") {
        return (
            <div className="player keep-dark">
                <Summary workout={workout} log={log} seconds={elapsed} sessions={sessions}
                    onDiscard={() => { if (window.confirm("Discard this workout?")) onQuit?.(); }}
                    onSave={({ rpe, prs }) => onComplete?.({ workout, duration: Math.round(elapsed), caloriesBurned: Math.round(elapsed / 60 * 6.5), log, rpe, prs })} />
            </div>
        );
    }

    if (stage === "warmup" || stage === "cooldown") {
        return (
            <div className="player keep-dark">
                <div className="player-top">
                    <button type="button" className="pl-icon" onClick={quit} aria-label="Quit workout"><X size={20} /></button>
                    <div className="text-[14px] font-semibold truncate">{workout.name}</div>
                    <span className="w-10" />
                </div>
                {stage === "warmup"
                    ? <Guided title="WARM-UP" list={WARMUP} color="#f59e0b" onDone={() => { setStage("workout"); setNow(Date.now()); }} />
                    : <Guided title="COOL-DOWN" list={COOLDOWN} color="#38bdf8" onDone={() => { victorySound(); setStage("summary"); }} />}
            </div>
        );
    }

    const restLeft = rest ? Math.max(0, Math.ceil((rest.endAt - now) / 1000)) : 0;
    const timerLeft = timer ? (timer.running ? Math.max(0, Math.ceil((timer.endAt - now) / 1000)) : timer.left) : 0;

    return (
        <div className="player keep-dark">
            <div className="player-top">
                <button type="button" className="pl-icon" onClick={quit} aria-label="Quit workout"><X size={20} /></button>
                <div className="min-w-0 text-center">
                    <div className="text-[13px] font-semibold truncate">{workout.name}</div>
                    <div className="text-[11px] tabular-nums" style={{ color: "#9ca3af" }}>{fmt(elapsed)} · {totalDone}/{totalSets} sets</div>
                </div>
                <button type="button" className="pl-finish" onClick={finish}>Finish</button>
            </div>
            <div className="player-progress"><div style={{ width: `${(totalDone / Math.max(1, totalSets)) * 100}%` }} /></div>

            <div className="player-body">
                <div className="player-demo">
                    {view === "demo" ? <ExerciseDemo info={info} key={ex.name} /> : <div className="h-full flex items-center justify-center bg-[#0f141c]"><BodyMap primary={info.primary} secondary={info.secondary} height={230} /></div>}
                    <div className="player-demo-tabs">
                        <button type="button" className={view === "demo" ? "is-on" : ""} onClick={() => setView("demo")}>Demo</button>
                        <button type="button" className={view === "muscles" ? "is-on" : ""} onClick={() => setView("muscles")}>Muscles</button>
                        <button type="button" onClick={() => setHowTo(true)}><Info size={14} /> How to</button>
                    </div>
                </div>

                <div className="px-4">
                    <div className="flex items-start justify-between gap-3 mt-3">
                        <div className="min-w-0">
                            <div className="text-[11px] font-bold tracking-[1.5px] text-sky-300">EXERCISE {idx + 1} OF {log.length}</div>
                            <div className="text-[21px] font-extrabold leading-tight">{ex.name}</div>
                            <div className="text-[13px]" style={{ color: "#9ca3af" }}>{ex.sets.length} sets × {timed ? `${ex.duration}s` : `${ex.reps} reps`} · rest {ex.rest}s</div>
                        </div>
                        <button type="button" className="pl-icon shrink-0" onClick={() => setSwapOpen(o => !o)} aria-label="Swap exercise"><Repeat size={17} /></button>
                    </div>
                    {info.primary.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {info.primary.map(m => <span key={m} className="pl-chip">{MUSCLE_LABELS[m] || m}</span>)}
                            {info.secondary.slice(0, 3).map(m => <span key={m} className="pl-chip is-dim">{MUSCLE_LABELS[m] || m}</span>)}
                        </div>
                    )}
                    {info.tips[0] && <div className="pl-tip">💡 {info.tips[0]}</div>}

                    {swapOpen && (
                        <div className="pl-card mt-3">
                            <div className="text-[12px] font-bold mb-2" style={{ color: "#9ca3af" }}>Swap for a similar exercise</div>
                            <div className="flex flex-wrap gap-1.5">
                                {swapsFor(ex.name).map(n => <button key={n} type="button" className="pl-chip !py-1.5 !px-3" onClick={() => swap(n)}>{n}</button>)}
                            </div>
                        </div>
                    )}

                    {/* Sets table */}
                    <div className="pl-sets mt-3">
                        <div className="pl-sets-head">
                            <span>Set</span><span>Previous</span>{timed ? <span className="col-span-2">Time</span> : <><span>kg</span><span>Reps</span></>}<span className="text-center">✓</span>
                        </div>
                        {ex.sets.map((st, s) => {
                            const running = timer?.set === s;
                            return (
                                <div key={s} className={`pl-set ${st.done ? "is-done" : ""}`}>
                                    <span className="font-bold">{s + 1}</span>
                                    <span className="text-[12px]" style={{ color: "#9ca3af" }}>{st.prev ? (st.prev.duration ? `${st.prev.duration}s` : `${st.prev.weight ? `${st.prev.weight}×` : ""}${st.prev.reps}`) : "—"}</span>
                                    {timed ? (
                                        <div className="col-span-2 flex items-center gap-2">
                                            <span className="tabular-nums font-bold text-[16px] w-12">{fmt(running ? timerLeft : ex.duration)}</span>
                                            {!st.done && (running && timer.running
                                                ? <button type="button" className="pl-mini" onClick={pauseTimedSet}><Pause size={14} /></button>
                                                : <button type="button" className="pl-mini is-go" onClick={() => startTimedSet(s)}><Play size={14} /></button>)}
                                        </div>
                                    ) : (
                                        <>
                                            <input className="pl-inp" type="number" inputMode="decimal" min="0" step="0.5" value={st.weight || ""} placeholder="0"
                                                aria-label={`Set ${s + 1} weight kg`} onChange={e => updateSet(s, { weight: Math.max(0, parseFloat(e.target.value) || 0) })} />
                                            <input className="pl-inp" type="number" inputMode="numeric" min="0" value={st.reps || ""} placeholder={String(ex.reps)}
                                                aria-label={`Set ${s + 1} reps`} onChange={e => updateSet(s, { reps: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
                                        </>
                                    )}
                                    <button type="button" className={`pl-check ${st.done ? "is-on" : ""}`} onClick={() => toggleSet(s)} aria-label={st.done ? `Undo set ${s + 1}` : `Complete set ${s + 1}`}><Check size={16} /></button>
                                </div>
                            );
                        })}
                        <div className="flex gap-2 mt-2">
                            <button type="button" className="pl-btn flex-1" onClick={addSet}><Plus size={14} /> Add set</button>
                            <button type="button" className="pl-btn flex-1" onClick={removeSet} disabled={ex.sets.length <= 1}><Minus size={14} /> Remove set</button>
                        </div>
                    </div>

                    {allDone && idx === log.length - 1 && (
                        <button type="button" className="bp w-full mt-3 !py-4 text-[15px]" onClick={finish}>All done — cool down & finish</button>
                    )}

                    {/* Exercise navigator */}
                    <div className="pl-strip mt-4">
                        {log.map((e, i) => {
                            const d = doneSets(e), complete = d === e.sets.length;
                            return (
                                <button key={i} type="button" onClick={() => goTo(i)} className={`pl-strip-item ${i === idx ? "is-cur" : ""} ${complete ? "is-done" : ""}`} aria-label={`${e.name}, ${d} of ${e.sets.length} sets`}>
                                    <div className="pl-strip-thumb"><ExerciseDemo info={getExerciseInfo(e)} animate={false} rounded={8} showBadge={false} /></div>
                                    <div className="pl-strip-count">{complete ? "✓" : `${d}/${e.sets.length}`}</div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="h-28" />
                </div>
            </div>

            {/* Bottom bar: rest timer or prev/next */}
            <div className="player-bottom">
                {rest ? (
                    <div className="pl-rest">
                        <div className="pl-rest-ring" style={{ "--p": `${(restLeft / rest.total) * 360}deg` }}><span className="tabular-nums">{fmt(restLeft)}</span></div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[12px] font-bold tracking-[1.5px] text-amber-400 flex items-center gap-1"><Timer size={13} /> REST</div>
                            <div className="text-[13px] truncate">{rest.label}</div>
                        </div>
                        <button type="button" className="pl-mini" onClick={() => setRest(r => ({ ...r, endAt: r.endAt - 15000 }))} aria-label="Rest 15 seconds less">−15</button>
                        <button type="button" className="pl-mini" onClick={() => setRest(r => ({ ...r, endAt: r.endAt + 15000, total: r.total + 15 }))} aria-label="Rest 15 seconds more">+15</button>
                        <button type="button" className="pl-mini is-go" onClick={() => setRest(null)}>Skip</button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button type="button" className="pl-btn" onClick={() => goTo(idx - 1)} disabled={idx === 0}><ChevronLeft size={16} /> Prev</button>
                        {idx < log.length - 1
                            ? <button type="button" className="bp flex-1" onClick={() => goTo(idx + 1)}>Next exercise <ChevronRight size={16} /></button>
                            : <button type="button" className="bp flex-1" onClick={finish}>Finish workout</button>}
                    </div>
                )}
            </div>

            {howTo && <ExerciseSheet exercise={ex} history={exerciseHistory(sessions, ex.name)} onClose={() => setHowTo(false)} />}
        </div>
    );
}
