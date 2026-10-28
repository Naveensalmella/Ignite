"use client";
import { useState, useEffect, useRef } from 'react';
import { beep, victorySound } from '@/lib/beep';

const BODY_EMOJI = { chest: "🫁", back: "🔙", shoulders: "🏅", arms: "💪", core: "🎯", legs: "🦵", glutes: "🍑", cardio: "❤️‍🔥" };

const WARMUP_EXERCISES = [
    { name: "Arm Circles", duration: 20 },
    { name: "Jumping Jacks", duration: 30 },
    { name: "High Knees", duration: 20 },
];
const COOLDOWN_EXERCISES = [
    { name: "Standing Hamstring Stretch", duration: 20 },
    { name: "Quad Stretch", duration: 20 },
    { name: "Deep Breathing", duration: 20 },
];

// ── Circular Timer ──
function CircleTimer({ current, total, size = 140, color = "#3b82f6" }) {
    const r = (size - 12) / 2, c = 2 * Math.PI * r, pct = total > 0 ? current / total : 0;
    return (
        <div style={{ position: "relative", width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.3s" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: "#f3f4f6" }}>{current}</span>
            </div>
        </div>
    );
}

// ── Pre-fetch ALL workout GIFs at start ──
const gifCache = {};
function useWorkoutGifs(exercises) {
    const [gifs, setGifs] = useState({});
    useEffect(() => {
        if (!exercises?.length) return;
        exercises.forEach(ex => {
            const name = ex.name;
            if (!name) return;
            if (gifCache[name] && gifCache[name] !== true) {
                setGifs(prev => ({ ...prev, [name]: gifCache[name] }));
                return;
            }
            if (gifCache[name] === false) return; // already failed
            if (gifCache[name] === true) return; // already fetching
            gifCache[name] = true; // mark fetching
            fetch(`/api/exercise-gif?name=${encodeURIComponent(name)}`)
                .then(r => r.json())
                .then(d => {
                    gifCache[name] = d.gif || false;
                    if (d.gif) setGifs(prev => ({ ...prev, [name]: d.gif }));
                })
                .catch(() => { gifCache[name] = false; });
        });
    }, [exercises]);
    return gifs;
}

// ── Exercise Visual (takes gif as prop) ──
function ExerciseVisual({ exercise, gif, size = 240 }) {
    const [stepIdx, setStepIdx] = useState(0);
    const steps = exercise?.steps || [];
    useEffect(() => { if (steps.length <= 1) return; const i = setInterval(() => setStepIdx(s => (s + 1) % steps.length), 2500); return () => clearInterval(i); }, [steps.length]);

    return (
        <div style={{ width: size, height: size, borderRadius: 20, overflow: "hidden", background: gif ? "#fff" : "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, flexShrink: 0 }}>
            {gif ? (
                <img src={gif} alt={exercise?.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20 }} />
            ) : (
                <div style={{ textAlign: "center", padding: 16 }}>
                    <div style={{ fontSize: 48, animation: "pulse 1.5s ease-in-out infinite" }}>{BODY_EMOJI[exercise?.bodyPart] || "💪"}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", marginTop: 8 }}>{exercise?.muscle || exercise?.bodyPart || ""}</div>
                    {steps.length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: "#d1d5db" }}><span style={{ color: "#f59e0b", fontWeight: 700 }}>Step {(stepIdx % steps.length) + 1}:</span> {steps[stepIdx % steps.length]}</div>}
                </div>
            )}
        </div>
    );
}

// ══ WARMUP / COOLDOWN ══
function WarmupCooldown({ type, exercises, idx, timer, onSkip, onSkipAll }) {
    const cur = exercises[idx];
    const color = type === "warmup" ? "#f59e0b" : "#3b82f6";
    return (
        <div style={{ minHeight: "100dvh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 12, color, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
                {type === "warmup" ? "🔥 WARM-UP" : "🧊 COOL DOWN"} · {idx + 1}/{exercises.length}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", marginBottom: 24 }}>{cur?.name}</div>
            <CircleTimer current={timer} total={cur?.duration || 20} size={140} color={color} />
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button type="button" onClick={onSkip}
                    style={{ padding: "10px 24px", borderRadius: 12, background: "#1a1a2e", color: "#9ca3af", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>Skip →</button>
                <button type="button" onClick={onSkipAll}
                    style={{ padding: "10px 24px", borderRadius: 12, background: "#1a1a2e", color, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>Skip All →→</button>
            </div>
        </div>
    );
}

// ══ READY TO GO (first exercise only) ══
function ReadyPhase({ exercise, gif, countdown, total, onSkip }) {
    return (
        <div style={{ minHeight: "100dvh", background: "linear-gradient(180deg, #0a0a14, #101020)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
            <div style={{ width: 220, height: 220, borderRadius: "50%", overflow: "hidden", background: gif ? "#fff" : "rgba(59,130,246,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, flexShrink: 0 }}>
                {gif ? <img src={gif} alt={exercise.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> :
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 64, animation: "pulse 1.5s ease-in-out infinite" }}>{BODY_EMOJI[exercise?.bodyPart] || "💪"}</div></div>}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#3b82f6", letterSpacing: 2 }}>READY TO GO!</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", textTransform: "uppercase", marginTop: 8, marginBottom: 32 }}>{exercise.name}</div>
            <CircleTimer current={countdown} total={total} size={120} color="#3b82f6" />
            <button onClick={onSkip} style={{ marginTop: 24, padding: "10px 32px", borderRadius: 12, background: "#1a1a2e", color: "#9ca3af", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>Skip →</button>
        </div>
    );
}

// ══ EXERCISE PHASE (with weight tracking) ══
function ExercisePhase({ exercise, gif, exerciseIndex, totalExercises, timer, totalTime, isTimeBased, onDone, onSkip, onPause, isPaused, weights, setWeights }) {
    const progressPct = ((exerciseIndex + 1) / totalExercises) * 100;
    const sets = exercise.sets || 3;

    return (
        <div style={{ position: "fixed", inset: 0, background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
            {/* Progress bar */}
            <div style={{ height: 4, background: "#1a1a2e", flexShrink: 0 }}><div style={{ height: "100%", background: "#3b82f6", width: `${progressPct}%`, transition: "width 0.3s" }} /></div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <ExerciseVisual exercise={exercise} gif={gif} size={200} />
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", textTransform: "uppercase", textAlign: "center" }}>{exercise.name}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>{exerciseIndex + 1} of {totalExercises}</div>

                {isTimeBased ? (
                    <CircleTimer current={timer} total={totalTime} size={140} color="#10b981" />
                ) : (
                    <>
                        <div style={{ fontSize: 48, fontWeight: 900, color: "#10b981", textAlign: "center" }}>x{exercise.reps || 12}</div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>{sets} sets · log weight (optional)</div>
                        <div style={{ width: "100%", maxWidth: 280 }}>
                            {[...Array(sets)].map((_, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, color: "#6b7280", width: 40 }}>Set {i + 1}</span>
                                    <input type="number" placeholder="kg" value={weights[exerciseIndex]?.[i] || ""}
                                        aria-label={`Set ${i + 1} weight in kg`} inputMode="decimal"
                                        onChange={e => { const val = e.target.value; setWeights(prev => ({ ...prev, [exerciseIndex]: { ...(prev[exerciseIndex] || {}), [i]: val } })); }}
                                        style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #2a2a3e", color: "#f3f4f6", fontSize: 14, textAlign: "center" }} />
                                    <span style={{ fontSize: 12, color: "#6b7280" }}>kg</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Fixed bottom buttons */}
            <div style={{ flexShrink: 0, padding: "12px 24px calc(16px + env(safe-area-inset-bottom))", background: "#0a0a0a", borderTop: "1px solid #1a1a2e" }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <button onClick={onPause} style={{ flex: 1, padding: 14, borderRadius: 14, background: "#1a1a2e", color: "#f3f4f6", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}>
                        {isPaused ? "▶ Resume" : "⏸ Pause"}
                    </button>
                    <button onClick={onSkip} style={{ flex: 1, padding: 14, borderRadius: 14, background: "#1a1a2e", color: "#f59e0b", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}>
                        Skip →
                    </button>
                </div>
                <button onClick={onDone} style={{ width: "100%", padding: 16, borderRadius: 14, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontSize: 16, fontWeight: 800, border: "none", cursor: "pointer" }}>
                    DONE ✓
                </button>
            </div>
        </div>
    );
}

// ══ REST ══
function RestPhase({ timer, total, nextExercise, nextGif, onSkip }) {
    return (
        <div style={{ minHeight: "100dvh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 12, letterSpacing: 2, fontWeight: 700 }}>REST</div>
            <CircleTimer current={timer} total={total} size={160} color="#f59e0b" />
            {nextExercise && (
                <div style={{ marginTop: 32, background: "#1a1a2e", borderRadius: 14, padding: 16, width: "100%", maxWidth: 280 }}>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, letterSpacing: 1 }}>NEXT UP</div>
                    {nextGif ? <img src={nextGif} alt={nextExercise.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, margin: "0 auto 8px", display: "block" }} /> :
                        <div style={{ fontSize: 28, marginBottom: 4 }}>{BODY_EMOJI[nextExercise.bodyPart] || "💪"}</div>}
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6" }}>{nextExercise.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{nextExercise.duration ? `${nextExercise.duration}s` : `x${nextExercise.reps || 12}`}</div>
                </div>
            )}
            <button onClick={onSkip} style={{ marginTop: 24, padding: "12px 40px", borderRadius: 12, background: "#1a1a2e", color: "#f3f4f6", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>Skip Rest →</button>
        </div>
    );
}

// ══ COMPLETE ══
function CompletePhase({ workout, duration, caloriesBurned, exercisesDone, maxWeight, onDone }) {
    return (
        <div style={{ minHeight: "100dvh", background: "linear-gradient(180deg, #0a0a0a, #0f172a)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#f3f4f6", marginBottom: 8 }}>Great Work!</div>
            <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 32 }}>You crushed {workout.name}!</div>
            <div style={{ display: "flex", gap: 20, marginBottom: 40, flexWrap: "wrap", justifyContent: "center" }}>
                {[[exercisesDone, "Exercises", "#10b981"], [`${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`, "Duration", "#3b82f6"], [caloriesBurned, "Calories", "#f59e0b"], [maxWeight > 0 ? `${maxWeight}kg` : "-", "Max Weight", "#8b5cf6"]].map(([v, l, c]) => (
                    <div key={l} style={{ textAlign: "center", minWidth: 60 }}><div style={{ fontSize: 24, fontWeight: 900, color: c }}>{v}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{l}</div></div>
                ))}
            </div>
            <div style={{ background: "#1a1a2e", borderRadius: 16, padding: 20, marginBottom: 32, width: "100%", maxWidth: 300 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💪</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6" }}>Results will follow!</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Consistency beats perfection.</div>
            </div>
            <button onClick={onDone} style={{ width: "100%", maxWidth: 300, padding: 16, borderRadius: 14, marginBottom: 24, background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer" }}>DONE ✓</button>
        </div>
    );
}

// ══════════════════════════════════════
// MAIN CONTROLLER
// warmup → ready → exercise → rest → exercise … → cooldown → complete
// ══════════════════════════════════════
const READY_SECONDS = 10;
const isTimed = (ex) => !!ex && !!(ex.duration || ex.time) && !ex.reps;
const timedLength = (ex) => Number(ex?.duration || ex?.time) || 30;

export default function ActiveWorkout({ workout, onComplete, onQuit }) {
    const exercises = workout?.exercises || [];
    const [phase, setPhase] = useState("warmup");
    const [stepIdx, setStepIdx] = useState(0);              // warm-up / cool-down item
    const [exIndex, setExIndex] = useState(0);
    const [timer, setTimer] = useState(WARMUP_EXERCISES[0].duration);
    const [isPaused, setIsPaused] = useState(false);
    const [startTime] = useState(() => Date.now());
    const [endTime, setEndTime] = useState(null);
    const [weights, setWeights] = useState({});
    const [completedIdx, setCompletedIdx] = useState([]);

    const curEx = exercises[exIndex];
    const restDuration = Number(exercises[Math.max(0, exIndex - 1)]?.rest) || 30;
    const gifs = useWorkoutGifs(exercises);

    const timedPhase = phase === "warmup" || phase === "cooldown" || phase === "ready" || phase === "rest" || (phase === "exercise" && isTimed(curEx));

    // Timer value is mirrored in a ref so the interval can read it without re-subscribing.
    const timerRef = useRef(timer);
    const setCountdown = (v) => { timerRef.current = v; setTimer(v); };

    function startExercise(idx) {
        setExIndex(idx);
        setPhase("exercise");
        setCountdown(isTimed(exercises[idx]) ? timedLength(exercises[idx]) : 0);
    }

    function finishExercise(done) {
        if (done) setCompletedIdx(prev => prev.includes(exIndex) ? prev : [...prev, exIndex]);
        if (exIndex >= exercises.length - 1) {
            setStepIdx(0); setPhase("cooldown"); setCountdown(COOLDOWN_EXERCISES[0].duration);
        } else {
            setExIndex(exIndex + 1); setPhase("rest"); setCountdown(Number(curEx?.rest) || 30);
        }
    }

    function nextWarmCool(list, onFinished) {
        if (stepIdx < list.length - 1) { setStepIdx(stepIdx + 1); setCountdown(list[stepIdx + 1].duration); }
        else onFinished();
    }
    const endWarmup = () => { setPhase("ready"); setCountdown(READY_SECONDS); };
    const endCooldown = () => { victorySound(); setEndTime(Date.now()); setPhase("complete"); };

    // What happens when the current countdown reaches zero (latest closure, read by the interval).
    const onZeroRef = useRef(null);
    useEffect(() => {
        onZeroRef.current = () => {
            if (phase === "warmup") nextWarmCool(WARMUP_EXERCISES, endWarmup);
            else if (phase === "cooldown") nextWarmCool(COOLDOWN_EXERCISES, endCooldown);
            else if (phase === "ready" || phase === "rest") startExercise(exIndex);
            else if (phase === "exercise") finishExercise(true);
        };
    });

    // ── Tick (paused, or untimed phases, don't run) ──
    useEffect(() => {
        if (!timedPhase || isPaused) return;
        const id = setInterval(() => {
            const next = Math.max(0, timerRef.current - 1);
            setCountdown(next);
            if (next > 0 && next <= 3) beep(660, 0.08);
            if (next === 0) { beep(880, 0.15); onZeroRef.current?.(); }
        }, 1000);
        return () => clearInterval(id);
    }, [timedPhase, isPaused, phase, exIndex, stepIdx]);

    const duration = endTime ? Math.floor((endTime - startTime) / 1000) : 0;
    const maxWeight = Object.values(weights).flatMap(s => Object.values(s)).map(Number).filter(n => n > 0).reduce((a, b) => Math.max(a, b), 0);

    function handleComplete() {
        onComplete?.({ workout, duration, caloriesBurned: Math.round(duration * 0.15), exercisesDone: completedIdx.length, completedIdx, maxWeight, weights });
    }

    function quit() {
        const started = phase !== "warmup" || completedIdx.length > 0;
        if (!started || window.confirm("Quit this workout? Progress from this session won't be saved.")) onQuit?.();
    }

    if (!workout || exercises.length === 0) return null;

    return (
        <div className="keep-dark" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#0a0a0a", overflowY: "auto" }}>
            {phase !== "complete" && (
                <button type="button" onClick={quit}
                    style={{ position: "absolute", top: "calc(12px + env(safe-area-inset-top))", left: 12, zIndex: 1010, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "6px 12px", color: "#9ca3af", fontSize: 14, cursor: "pointer" }}>← Quit</button>
            )}

            {phase === "warmup" && (
                <WarmupCooldown type="warmup" exercises={WARMUP_EXERCISES} idx={stepIdx} timer={timer}
                    onSkip={() => nextWarmCool(WARMUP_EXERCISES, endWarmup)} onSkipAll={endWarmup} />
            )}

            {phase === "ready" && curEx && (
                <ReadyPhase exercise={curEx} gif={gifs[curEx.name]} countdown={timer} total={READY_SECONDS} onSkip={() => startExercise(exIndex)} />
            )}

            {phase === "exercise" && curEx && (
                <ExercisePhase exercise={curEx} gif={gifs[curEx.name]} exerciseIndex={exIndex} totalExercises={exercises.length}
                    timer={timer} totalTime={timedLength(curEx)} isTimeBased={isTimed(curEx)}
                    onDone={() => finishExercise(true)} onSkip={() => finishExercise(false)} onPause={() => setIsPaused(p => !p)} isPaused={isPaused}
                    weights={weights} setWeights={setWeights} />
            )}

            {phase === "rest" && (
                <RestPhase timer={timer} total={restDuration} nextExercise={curEx} nextGif={curEx ? gifs[curEx.name] : null}
                    onSkip={() => startExercise(exIndex)} />
            )}

            {phase === "cooldown" && (
                <WarmupCooldown type="cooldown" exercises={COOLDOWN_EXERCISES} idx={stepIdx} timer={timer}
                    onSkip={() => nextWarmCool(COOLDOWN_EXERCISES, endCooldown)} onSkipAll={endCooldown} />
            )}

            {phase === "complete" && (
                <CompletePhase workout={workout} duration={duration} caloriesBurned={Math.round(duration * 0.15)}
                    exercisesDone={completedIdx.length} maxWeight={maxWeight} onDone={handleComplete} />
            )}

            <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }`}</style>
        </div>
    );
}
