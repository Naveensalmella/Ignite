"use client";
import { useState, useEffect, useRef } from 'react';

function beep(f = 800, d = 0.12) {
    try { const c = new (window.AudioContext || window.webkitAudioContext)(); const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.value = 0.3; g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + d); } catch { }
}
function victorySound() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.2), i * 120)); }

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
    useEffect(() => { setStepIdx(0); }, [exercise?.name]);
    useEffect(() => { if (steps.length <= 1) return; const i = setInterval(() => setStepIdx(s => (s + 1) % steps.length), 2000); return () => clearInterval(i); }, [steps.length]);

    return (
        <div style={{ width: size, height: size, borderRadius: 20, overflow: "hidden", background: gif ? "#fff" : "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, flexShrink: 0 }}>
            {gif ? (
                <img src={gif} alt={exercise?.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20 }} />
            ) : (
                <div style={{ textAlign: "center", padding: 16 }}>
                    <div style={{ fontSize: 48, animation: "pulse 1.5s ease-in-out infinite" }}>{BODY_EMOJI[exercise?.bodyPart] || "💪"}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", marginTop: 8 }}>{exercise?.muscle || exercise?.bodyPart || ""}</div>
                    {steps.length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: "#d1d5db" }}><span style={{ color: "#f59e0b", fontWeight: 700 }}>Step {stepIdx + 1}:</span> {steps[stepIdx]}</div>}
                </div>
            )}
        </div>
    );
}

// ══ WARMUP / COOLDOWN ══
function WarmupCooldown({ type, exercises, onDone }) {
    const [idx, setIdx] = useState(0);
    const [timer, setTimer] = useState(exercises[0]?.duration || 20);
    const timerRef = useRef(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimer(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    if (idx < exercises.length - 1) { setIdx(i => i + 1); return exercises[idx + 1]?.duration || 20; }
                    else { onDone(); return 0; }
                }
                if (t <= 4) beep(660, 0.08);
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [idx]);

    const cur = exercises[idx];
    return (
        <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: type === "warmup" ? "#f59e0b" : "#3b82f6", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
                {type === "warmup" ? "🔥 WARM-UP" : "🧊 COOL DOWN"} · {idx + 1}/{exercises.length}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", marginBottom: 24 }}>{cur?.name}</div>
            <CircleTimer current={timer} total={cur?.duration || 20} size={140} color={type === "warmup" ? "#f59e0b" : "#3b82f6"} />
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button onClick={() => { clearInterval(timerRef.current); if (idx < exercises.length - 1) { setIdx(i => i + 1); setTimer(exercises[idx + 1]?.duration || 20); } else onDone(); }}
                    style={{ padding: "10px 24px", borderRadius: 12, background: "#1a1a2e", color: "#9ca3af", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>Skip →</button>
                <button onClick={() => { clearInterval(timerRef.current); onDone(); }}
                    style={{ padding: "10px 24px", borderRadius: 12, background: "#1a1a2e", color: "#f59e0b", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>Skip All →→</button>
            </div>
        </div>
    );
}

// ══ READY TO GO (first exercise only) ══
function ReadyPhase({ exercise, gif, countdown, total, onSkip }) {
    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0a0a14, #101020)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
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
                        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>{sets} sets</div>
                        <div style={{ width: "100%", maxWidth: 280 }}>
                            {[...Array(sets)].map((_, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, color: "#6b7280", width: 40 }}>Set {i + 1}</span>
                                    <input type="number" placeholder="kg" value={weights[exerciseIndex]?.[i] || ""}
                                        onChange={e => { const val = e.target.value; setWeights(prev => { const copy = { ...prev }; if (!copy[exerciseIndex]) copy[exerciseIndex] = {}; copy[exerciseIndex][i] = val; return copy; }); }}
                                        style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #2a2a3e", color: "#f3f4f6", fontSize: 14, textAlign: "center" }} />
                                    <span style={{ fontSize: 12, color: "#6b7280" }}>kg</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Fixed bottom buttons */}
            <div style={{ flexShrink: 0, padding: "12px 24px 90px", background: "#0a0a0a", borderTop: "1px solid #1a1a2e" }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <button onClick={onPause} style={{ flex: 1, padding: 14, borderRadius: 14, background: "#1a1a2e", color: "#f3f4f6", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}>
                        {isPaused ? "▶ Resume" : "⏸ Pause"}
                    </button>
                    <button onClick={onSkip} style={{ flex: 1, padding: 14, borderRadius: 14, background: "#1a1a2e", color: "#f59e0b", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}>
                        Next →
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
        <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 12, letterSpacing: 2, fontWeight: 700 }}>REST</div>
            <CircleTimer current={timer} total={total} size={160} color="#f59e0b" />
            {nextExercise && (
                <div style={{ marginTop: 32, background: "#1a1a2e", borderRadius: 14, padding: 16, width: "100%", maxWidth: 280 }}>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, letterSpacing: 1 }}>NEXT UP</div>
                    {nextGif ? <img src={nextGif} alt={nextExercise.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, margin: "0 auto 8px", display: "block" }} /> :
                        <div style={{ fontSize: 28, marginBottom: 4 }}>{BODY_EMOJI[nextExercise.bodyPart] || "💪"}</div>}
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6" }}>{nextExercise.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{nextExercise.reps ? `x${nextExercise.reps}` : `${nextExercise.duration || 30}s`}</div>
                </div>
            )}
            <button onClick={onSkip} style={{ marginTop: 24, padding: "12px 40px", borderRadius: 12, background: "#1a1a2e", color: "#f3f4f6", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>Skip Rest →</button>
        </div>
    );
}

// ══ COMPLETE ══
function CompletePhase({ workout, duration, caloriesBurned, exercisesDone, maxWeight, onDone }) {
    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0a0a0a, #0f172a)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
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
            <button onClick={onDone} style={{ width: "100%", maxWidth: 300, padding: 16, borderRadius: 14, marginBottom: 100, background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer" }}>DONE ✓</button>
        </div>
    );
}

// ══════════════════════════════════════
// MAIN CONTROLLER
// ══════════════════════════════════════
export default function ActiveWorkout({ workout, onComplete, onQuit }) {
    const [phase, setPhase] = useState("warmup"); // warmup → ready → exercise → rest → ... → cooldown → complete
    const [exIndex, setExIndex] = useState(0);
    const [timer, setTimer] = useState(15);
    const [isPaused, setIsPaused] = useState(false);
    const [startTime] = useState(Date.now());
    const [weights, setWeights] = useState({});
    const timerRef = useRef(null);

    const exercises = workout?.exercises || [];
    const curEx = exercises[exIndex];
    const nextEx = exercises[exIndex + 1];
    const restDuration = curEx?.rest || 30;
    const isTimeBased = curEx && !!(curEx.duration || curEx.time) && !curEx.reps;
    const exTime = curEx?.duration || curEx?.time || 30;

    // Pre-fetch all GIFs at workout start
    const gifs = useWorkoutGifs(exercises);

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (isPaused || phase === "warmup" || phase === "cooldown" || phase === "complete") return;

        const needsTimer = phase === "ready" || (phase === "exercise" && isTimeBased) || phase === "rest";
        if (!needsTimer) return;

        timerRef.current = setInterval(() => {
            setTimer(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current); timerRef.current = null; beep(880, 0.15);
                    if (phase === "ready") { if (isTimeBased) setTimer(exTime); setPhase("exercise"); }
                    else if (phase === "exercise") { exerciseDone(); }
                    else if (phase === "rest") { goNextExercise(); }
                    return 0;
                }
                if (t <= 4) beep(660, 0.08);
                return t - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
    }, [phase, isPaused, exIndex]);

    function exerciseDone() {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (exIndex >= exercises.length - 1) { setPhase("cooldown"); }
        else { setTimer(restDuration); setPhase("rest"); }
    }

    function goNextExercise() {
        setExIndex(i => i + 1);
        setPhase("exercise");
    }

    function handleComplete() {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        const allWeights = Object.values(weights).flatMap(s => Object.values(s)).map(Number).filter(n => n > 0);
        const maxWeight = allWeights.length > 0 ? Math.max(...allWeights) : 0;
        onComplete?.({ workout, duration, caloriesBurned: Math.round(duration * 0.15), exercisesDone: exercises.length, maxWeight, weights });
    }

    if (!workout || exercises.length === 0) return null;

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#0a0a0a" }}>
            {/* Quit button with confirmation */}
            {phase !== "complete" && (
                <button onClick={() => {
                    if (window.confirm("Are you sure you want to quit? Your workout progress will be lost.")) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        onQuit?.();
                    }
                }}
                    style={{ position: "absolute", top: 16, left: 16, zIndex: 110, background: "none", border: "none", color: "#6b7280", fontSize: 16, cursor: "pointer" }}>← Quit</button>
            )}

            {phase === "warmup" && <WarmupCooldown type="warmup" exercises={WARMUP_EXERCISES} onDone={() => { setTimer(15); setPhase("ready"); }} />}

            {phase === "ready" && curEx && (
                <ReadyPhase exercise={curEx} gif={gifs[curEx.name]} countdown={timer} total={15}
                    onSkip={() => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } if (isTimeBased) setTimer(exTime); setPhase("exercise"); }} />
            )}

            {phase === "exercise" && curEx && (
                <ExercisePhase exercise={curEx} gif={gifs[curEx.name]} exerciseIndex={exIndex} totalExercises={exercises.length}
                    timer={timer} totalTime={exTime} isTimeBased={isTimeBased}
                    onDone={exerciseDone} onSkip={exerciseDone} onPause={() => setIsPaused(p => !p)} isPaused={isPaused}
                    weights={weights} setWeights={setWeights} />
            )}

            {phase === "rest" && (
                <RestPhase timer={timer} total={restDuration} nextExercise={nextEx} nextGif={nextEx ? gifs[nextEx.name] : null}
                    onSkip={() => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } goNextExercise(); }} />
            )}

            {phase === "cooldown" && <WarmupCooldown type="cooldown" exercises={COOLDOWN_EXERCISES} onDone={() => { victorySound(); setPhase("complete"); }} />}

            {phase === "complete" && (
                <CompletePhase workout={workout} duration={Math.floor((Date.now() - startTime) / 1000)}
                    caloriesBurned={Math.round(Math.floor((Date.now() - startTime) / 1000) * 0.15)}
                    exercisesDone={exercises.length}
                    maxWeight={Object.values(weights).flatMap(s => Object.values(s)).map(Number).filter(n => n > 0).reduce((a, b) => Math.max(a, b), 0)}
                    onDone={handleComplete} />
            )}

            <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }`}</style>
        </div>
    );
}