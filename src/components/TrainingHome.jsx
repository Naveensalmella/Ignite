"use client";
// ══════════════════════════════════════════════════════════════
// Training hub — today's workout, weekly progress, muscle recovery,
// and tabs for Workouts · Programs · Exercise library · Progress.
// ══════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from "react";
import { Play, Eye, Sparkles, Plus, Flame, Clock, Dumbbell, ChevronRight, Trophy, Zap, Activity } from "lucide-react";
import { IconBadge, Bar } from "./ui/kit";
import { today, toArr } from "@/utils";
import { EXERCISES } from "@/data/exercises";
import { localSync } from "@/utils/localSync";
import { requestWakeLock, releaseWakeLock } from "./wakeLock";
import ActiveWorkout from "./ActiveWorkout";
import ExerciseDemo from "./training/ExerciseDemo";
import ExerciseSheet from "./training/ExerciseSheet";
import ExerciseLibrary from "./training/ExerciseLibrary";
import WorkoutPreview, { estimateWorkout } from "./training/WorkoutPreview";
import ProgramsTab, { ProgramSheet, ALL_PROGRAMS, programProgress, programSession } from "./training/ProgramsTab";
import ProgressView from "./training/ProgressView";
import GatesBoard from "./system/GatesBoard";
import { clearGate } from "@/lib/system/actions";
import BodyMap from "./training/BodyMap";
import { getExerciseInfo, toWorkoutExercise } from "@/lib/exerciseVisuals";
import { MUSCLES, MUSCLE_LABELS } from "@/lib/muscles";
import {
    allSessions, weekSummary, muscleRecovery, recoveryState, RECOVERY_COLORS, RECOVERY_LABELS,
    personalRecords, exerciseHistory, recommendWorkout,
} from "@/lib/trainingStats";

// ── Challenges (multi-day plans) ──
function buildChallengeDay(bodyParts, difficulty, count, seed) {
    const pool = bodyParts.flatMap(bp => [...(EXERCISES.bodyweight?.[bp] || [])]).filter(e => e.difficulty <= difficulty);
    let h = seed * 9301 + 49297;
    const rnd = () => { h = (h * 9301 + 49297) % 233280; return h / 233280; };
    return [...pool].sort(() => rnd() - 0.5).slice(0, count);
}
const CHALLENGES = [
    { id: "massive_body", title: "Massive Body", days: 28, color: "linear-gradient(135deg,#1e40af,#3b82f6)", desc: "Progressive bodyweight muscle building", icon: "💪", getDayExercises: (day) => buildChallengeDay(["chest", "back", "arms", "shoulders"], Math.min(3, 1 + Math.floor(day / 10)), Math.min(10, 5 + Math.floor(day / 7)), day) },
    { id: "fat_burner", title: "Fat Burner", days: 30, color: "linear-gradient(135deg,#dc2626,#f97316)", desc: "HIIT and cardio combos", icon: "🔥", getDayExercises: (day) => buildChallengeDay(["cardio", "core", "legs"], Math.min(3, 1 + Math.floor(day / 10)), Math.min(10, 5 + Math.floor(day / 5)), day) },
    { id: "calisthenics", title: "Calisthenics", days: 28, color: "linear-gradient(135deg,#7c3aed,#a855f7)", desc: "Master bodyweight strength", icon: "🤸", getDayExercises: (day) => buildChallengeDay(["chest", "back", "core", "legs"], Math.min(3, 1 + Math.floor(day / 10)), Math.min(10, 6 + Math.floor(day / 7)), day) },
    { id: "full_body", title: "Full Body Kickstart", days: 14, color: "linear-gradient(135deg,#0284c7,#38bdf8)", desc: "Two weeks to build the habit", icon: "⚡", getDayExercises: (day) => buildChallengeDay(["chest", "back", "legs", "core", "arms"], 2, Math.min(9, 5 + Math.floor(day / 3)), day) },
];

const CHALLENGE_ICON = { massive_body: Dumbbell, fat_burner: Flame, calisthenics: Activity, full_body: Zap };
const CHALLENGE_TONE = { massive_body: "blue", fat_burner: "rose", calisthenics: "violet", full_body: "sky" };

// ── Quick workouts ──
const T = (name, duration, rest = 10) => ({ name, sets: 1, duration, rest });
const S = (name, sets, reps, rest = 45) => ({ name, sets, reps, rest });
const QUICK = [
    { id: "q7", name: "7-Minute Workout", tag: "Full body · no equipment", icon: "⏱️", exercises: [T("Jumping Jacks", 30), T("Wall Sit", 30), T("Standard Push-ups", 30), T("Crunches", 30), T("Step Ups", 30), T("Bodyweight Squats", 30), T("Tricep Dips (chair)", 30), T("Plank Hold", 30), T("High Knees", 30), T("Lunges", 30), T("Pushups", 30), T("Side Plank", 30, 0)] },
    { id: "qabs", name: "10-Min Abs", tag: "Core · no equipment", icon: "🎯", exercises: [T("Crunches", 40, 15), T("Bicycle Crunches", 40, 15), T("Leg Raises", 40, 15), T("Russian Twists", 40, 15), T("Plank Hold", 40, 15), T("Mountain Climbers", 40, 15), T("Flutter Kicks", 40, 15), T("Superman", 40, 0)] },
    { id: "qhiit", name: "15-Min HIIT", tag: "Fat burn · high intensity", icon: "🔥", exercises: [{ ...T("Burpees", 30, 15), sets: 3 }, { ...T("Jump Squats", 30, 15), sets: 3 }, { ...T("Mountain Climbers", 30, 15), sets: 3 }, { ...T("High Knees", 30, 15), sets: 3 }, { ...T("Jumping Jacks", 30, 15), sets: 3 }] },
    { id: "qupper", name: "Upper Body Strength", tag: "Chest · back · arms", icon: "💪", exercises: [S("Standard Push-ups", 3, 12), S("Inverted Rows (table/bar)", 3, 10), S("Pike Push-ups", 3, 10), S("Tricep Dips (chair)", 3, 12), S("Diamond Push-ups", 3, 8), S("Shoulder Taps", 3, 20)] },
    { id: "qlower", name: "Lower Body Burn", tag: "Legs · glutes", icon: "🦵", exercises: [S("Bodyweight Squats", 3, 15), S("Lunges", 3, 12), S("Glute Bridges", 3, 15), S("Bulgarian Split Squats", 3, 10), S("Calf Raises", 3, 20), { ...T("Wall Sit", 40, 30), sets: 3 }] },
    { id: "qmob", name: "Mobility Flow", tag: "Stretch · recovery", icon: "🧘", exercises: [T("Cat-Cow", 45, 5), T("Downward Dog", 45, 5), T("Cobra Stretch", 45, 5), T("Child's Pose", 45, 5), T("Hip Circles", 45, 5), T("Standing Forward Fold", 45, 5), T("Deep Breathing", 60, 0)] },
];

const BODY_PARTS = [["core", "Abs & core"], ["chest", "Chest"], ["back", "Back"], ["arms", "Arms"], ["shoulders", "Shoulders"], ["legs", "Legs"], ["glutes", "Glutes"], ["cardio", "Cardio"]];
function focusWorkouts(part, gym) {
    const levels = [["Beginner", 1, 6], ["Intermediate", 2, 8], ["Advanced", 3, 10]];
    const label = BODY_PARTS.find(b => b[0] === part)?.[1] || part;
    return levels.map(([lvl, diff, count]) => {
        const pool = [...(EXERCISES.bodyweight?.[part] || []), ...(gym ? EXERCISES.gym?.[part] || [] : [])].filter(e => e.difficulty <= diff);
        return { id: `${part}_${lvl}`, name: `${label} · ${lvl}`, level: diff, source: "focus", exercises: pool.slice(0, count) };
    }).filter(w => w.exercises.length > 0);
}

// ── Small building blocks ──
function Thumbs({ exercises, n = 4 }) {
    return (
        <div className="thumb-strip">
            {exercises.slice(0, n).map((e, i) => <div key={i} className="thumb-strip-item" title={e.name}><ExerciseDemo info={getExerciseInfo(e)} animate={false} rounded={10} showBadge={false} /></div>)}
            {exercises.length > n && <div className="thumb-strip-more">+{exercises.length - n}</div>}
        </div>
    );
}

function WorkoutCard({ w, onOpen, accent }) {
    const est = estimateWorkout(w.exercises.map(toWorkoutExercise));
    const first = w.exercises[0];
    return (
        <button type="button" className="wk-card" onClick={() => onOpen(w)}>
            <div className="wk-card-img">{first && <ExerciseDemo info={getExerciseInfo(first)} animate={false} rounded={0} showBadge={false} />}</div>
            <div className="wk-card-body">
                <div className="wk-card-name">{w.name}</div>
                <div className="wk-card-meta">{w.tag || `${w.exercises.length} exercises`} · {est.minutes} min</div>
                {accent && <div className="wk-card-level flex gap-1 mt-1.5" aria-label={`Level ${accent} of 3`}>{[1, 2, 3].map(i => <span key={i} className="h-1.5 w-5 rounded-full" style={{ background: i <= accent ? "var(--accent)" : "var(--track)" }} />)}</div>}
            </div>
        </button>
    );
}

function AIGenerator({ onReady }) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    async function generate(text = prompt) {
        if (!text.trim() || loading) return;
        setLoading(true); setError("");
        try {
            const r = await fetch("/api/generate-workout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: text }) });
            const data = await r.json();
            if (data.workout && toArr(data.workout.exercises).length) onReady({ id: `ai_${Date.now()}`, source: "ai", name: data.workout.name || "AI Workout", exercises: toArr(data.workout.exercises) });
            else setError(data.error || "Couldn't generate a workout. Try describing it differently.");
        } catch { setError("Couldn't reach the AI. Check your connection and try again."); }
        setLoading(false);
    }
    return (
        <div className="gs">
            <div className="flex items-center gap-2 mb-1"><Sparkles size={16} style={{ color: "var(--tone-violet)" }} /><span className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>AI workout builder</span></div>
            <div className="text-[12px] mb-3" style={{ color: "var(--text-secondary)" }}>Describe what you want — every exercise comes with a visual guide.</div>
            <div className="flex gap-2">
                <input className="inp" value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && generate()} placeholder="e.g. 20 min chest & triceps with dumbbells" aria-label="Describe your workout" />
                <button type="button" className="bp shrink-0" onClick={() => generate()} disabled={loading || !prompt.trim()}>{loading ? "…" : "Create"}</button>
            </div>
            <div className="chip-row mt-2">
                {["Quick full body, 15 min", "Leg day with dumbbells", "Core blast, no equipment", "Fat-burning HIIT"].map(q => (
                    <button key={q} type="button" className="chip chip-i" onClick={() => { setPrompt(q); generate(q); }} disabled={loading}>{q}</button>
                ))}
            </div>
            {loading && <div className="text-[12px] mt-2" style={{ color: "var(--text-secondary)" }}>Designing your workout…</div>}
            {error && <div className="text-[12px] mt-2 text-red-500">{error}</div>}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
export default function TrainingHome({ workoutLog = {}, setWorkoutLog, addXP, profile = {}, programState = {}, setProgramState = () => { } }) {
    const ps = useMemo(() => programState || {}, [programState]);
    // New players start on Workouts (plain workouts); the last tab used is remembered.
    const [tab, setTab] = useState(() => { try { return localStorage.getItem("ignite-training-tab") || "workouts"; } catch { return "workouts"; } });
    const [preview, setPreview] = useState(null);       // { workout, editing }
    const [active, setActive] = useState(null);
    const [program, setProgram] = useState(null);
    const [exercise, setExercise] = useState(null);
    const [part, setPart] = useState("core");
    const [showAllRecovery, setShowAllRecovery] = useState(false);

    useEffect(() => { try { localStorage.setItem("ignite-training-tab", tab); } catch { /* ignore */ } }, [tab]);
    useEffect(() => {
        if (!active) return;
        requestWakeLock();
        return () => { releaseWakeLock(); };
    }, [active]);

    const sessions = useMemo(() => allSessions(workoutLog), [workoutLog]);
    const week = useMemo(() => weekSummary(sessions), [sessions]);
    const recovery = useMemo(() => muscleRecovery(sessions), [sessions]);
    const prs = useMemo(() => personalRecords(sessions), [sessions]);
    const goal = Number(ps.weeklyGoal) || 4;
    const gym = profile.trainingType === "gym" || profile.trainingType === "mixed";

    const cpSync = useMemo(() => localSync("ignite-challenge-progress", {}), []);
    const [challengeProgress, setChallengeProgressRaw] = useState(cpSync.get);
    const setChallengeProgress = (fn) => { const next = typeof fn === "function" ? fn(challengeProgress) : fn; setChallengeProgressRaw(next); cpSync.set(next); };

    // Today's suggestion: next program session, else a recovery-aware pick.
    const activeProgram = ps.activeProgram ? ALL_PROGRAMS[ps.activeProgram] : null;
    const todays = useMemo(() => {
        if (activeProgram) {
            const pr = programProgress(activeProgram, ps);
            const s = programSession(activeProgram, pr.weekIdx, pr.sessionIdx);
            if (s) return { ...s, reason: `${activeProgram.name} · ${pr.completed.length}/${pr.total} sessions done` };
        }
        return recommendWorkout({ sessions, profile });
    }, [activeProgram, ps, sessions, profile]);
    const todaysEx = useMemo(() => todays.exercises.map(toWorkoutExercise), [todays]);
    const todaysEst = estimateWorkout(todaysEx);
    const todaysMuscles = useMemo(() => [...new Set(todaysEx.flatMap(e => getExerciseInfo(e).primary))].slice(0, 4), [todaysEx]);
    const trainedToday = week.days.find(d => d.isToday)?.done;

    const recoveryColors = useMemo(() => Object.fromEntries(MUSCLES.map(m => [m, RECOVERY_COLORS[recoveryState(recovery[m])]])), [recovery]);
    const fatigued = MUSCLES.filter(m => ["fatigued", "recovering"].includes(recoveryState(recovery[m])));

    const open = (workout, editing = false) => setPreview({ workout, editing });
    const start = (workout) => { setPreview(null); setProgram(null); setActive({ ...workout, exercises: workout.exercises.map(toWorkoutExercise) }); };

    function handleComplete(result) {
        const d = today();
        const t = Date.now();
        const logged = result.log.map(ex => ({
            name: ex.name,
            ...(ex.datasetId ? { datasetId: ex.datasetId } : {}),
            sets: ex.sets.map(s => (ex.duration ? { duration: s.duration || ex.duration, done: s.done } : { reps: s.reps, weight: s.weight, done: s.done })),
        }));
        const doneSets = logged.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0);
        const volume = logged.reduce((v, e) => v + e.sets.reduce((a, s) => a + (s.done ? (s.weight || 0) * (s.reps || 0) : 0), 0), 0);
        const xp = Math.max(20, doneSets * 5 + Math.floor(result.duration / 60) * 3);
        const muscles = [...new Set(result.log.filter(e => e.sets.some(s => s.done)).flatMap(e => getExerciseInfo(e).primary))];
        const entry = {
            id: `${d}_${result.workout.trainingType || "gym"}_${t}`, date: d,
            trainingType: result.workout.trainingType || "gym",
            splitName: result.workout.name, duration: result.duration,
            calBurned: result.caloriesBurned, xpEarned: xp, rpe: result.rpe || 0,
            startedAt: t - result.duration * 1000, completedAt: t,
            gym: {
                exercises: logged, totalSets: doneSets,
                totalReps: logged.reduce((n, e) => n + e.sets.reduce((a, s) => a + (s.done ? s.reps || 0 : 0), 0), 0),
                maxWeight: Math.max(0, ...logged.flatMap(e => e.sets.map(s => (s.done ? s.weight || 0 : 0)))),
                volume: Math.round(volume), musclesWorked: muscles,
            },
        };
        setWorkoutLog?.(prev => {
            const day = Array.isArray(prev[d]) ? prev[d] : prev[d] ? [prev[d]] : [];
            return { ...prev, [d]: [...day, entry] };
        });
        addXP?.(xp, "Workout Complete");
        if (result.workout.gate) setTimeout(() => clearGate(result.workout.gate, result.log), 400);
        if (result.workout.challengeId) {
            setChallengeProgress(prev => {
                const old = prev[result.workout.challengeId] || { currentDay: 1, completedDays: 0 };
                return { ...prev, [result.workout.challengeId]: { currentDay: old.currentDay + 1, completedDays: old.completedDays + 1 } };
            });
        }
        if (result.workout.programId && result.workout.programId === ps.activeProgram) {
            setProgramState(prev => ({ ...(prev || {}), completedDays: [...toArr(prev?.completedDays), d] }));
        }
        setActive(null);
        setTab(result.workout.gate ? "gates" : "progress");
    }

    function startChallenge(ch) {
        let pr = challengeProgress[ch.id] || { currentDay: 1, completedDays: 0 };
        if (pr.completedDays >= ch.days) { pr = { currentDay: 1, completedDays: 0 }; setChallengeProgress(p => ({ ...p, [ch.id]: pr })); }
        open({ id: `${ch.id}_day${pr.currentDay}`, challengeId: ch.id, source: "challenge", name: `${ch.title} — Day ${pr.currentDay}`, exercises: ch.getDayExercises(pr.currentDay) });
    }

    const saveCustom = (w) => setProgramState(prev => {
        const list = toArr(prev?.customWorkouts).filter(c => c.id !== w.id);
        const clean = { id: w.id?.startsWith("custom_") ? w.id : `custom_${Date.now()}`, name: w.name, source: "custom", exercises: w.exercises.map(toWorkoutExercise) };
        return { ...(prev || {}), customWorkouts: [clean, ...list].slice(0, 30) };
    });
    const deleteCustom = (w) => { setProgramState(prev => ({ ...(prev || {}), customWorkouts: toArr(prev?.customWorkouts).filter(c => c.id !== w.id) })); setPreview(null); };
    const customs = toArr(ps.customWorkouts);

    if (active) {
        return <ActiveWorkout workout={active} sessions={sessions} onComplete={handleComplete} onQuit={() => setActive(null)} />;
    }

    return (
        <div className="training fade-in">
            {/* ── Today ── */}
            <div className="today-card">
                <div className="today-media">
                    {todaysEx[0] && <ExerciseDemo info={getExerciseInfo(todaysEx[0])} rounded={0} showBadge={false} />}
                    <div className="today-shade" />
                    <div className="today-label">{trainedToday ? "Trained today ✓ · Ready for more?" : activeProgram ? "Next in your program" : "Today's workout"}</div>
                </div>
                <div className="today-body">
                    <div className="today-name">{todays.name}</div>
                    <div className="today-reason">{todays.reason || todays.focus}</div>
                    <div className="today-stats">
                        <span><Clock size={13} /> {todaysEst.minutes} min</span>
                        <span><Dumbbell size={13} /> {todaysEx.length} exercises</span>
                        <span><Flame size={13} /> ~{todaysEst.calories} kcal</span>
                    </div>
                    {todaysMuscles.length > 0 && <div className="flex flex-wrap gap-1.5 mb-3">{todaysMuscles.map(m => <span key={m} className="chip chip-i !text-[11px] !py-1">{MUSCLE_LABELS[m]}</span>)}</div>}
                    <div className="flex gap-2">
                        <button type="button" className="bp flex-[2]" onClick={() => start(todays)}><Play size={16} /> Start</button>
                        <button type="button" className="bg flex-1" onClick={() => open(todays)}><Eye size={16} /> Preview</button>
                    </div>
                </div>
            </div>

            {/* ── This week ── */}
            <div className="gs mb-3">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="sl !mb-0">This week</div>
                        <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                            <b style={{ color: "var(--text-primary)" }}>{week.workouts}</b> of {goal} workouts{week.workouts >= goal ? " — goal reached 🎉" : ""}
                        </div>
                    </div>
                    <div className="flex items-center gap-1" aria-label="Weekly workout goal">
                        <button type="button" className="icon-btn tap-44 !w-8 !h-8" onClick={() => setProgramState(p => ({ ...(p || {}), weeklyGoal: Math.max(1, goal - 1) }))} aria-label="Lower weekly goal">−</button>
                        <span className="text-[12px] w-12 text-center" style={{ color: "var(--text-dim)" }}>goal {goal}</span>
                        <button type="button" className="icon-btn tap-44 !w-8 !h-8" onClick={() => setProgramState(p => ({ ...(p || {}), weeklyGoal: Math.min(7, goal + 1) }))} aria-label="Raise weekly goal">+</button>
                    </div>
                </div>
                <div className="week-row">
                    {week.days.map((d, i) => (
                        <div key={d.date} className={`week-day ${d.done ? "is-done" : ""} ${d.isToday ? "is-today" : ""}`}>
                            <span className="week-day-l">{"MTWTFSS"[i]}</span>
                            <span className="week-day-c">{d.done ? "✓" : Number(d.date.slice(8))}</span>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div><div className="stat-num">{week.minutes}</div><div className="stat-lbl">Minutes</div></div>
                    <div><div className="stat-num">{week.sets}</div><div className="stat-lbl">Sets</div></div>
                    <div><div className="stat-num">{week.volume ? `${(week.volume / 1000).toFixed(1)}t` : "—"}</div><div className="stat-lbl">Volume</div></div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="tr-tabs" role="tablist">
                {[["gates", "Gates"], ["workouts", "Workouts"], ["programs", "Programs"], ["library", "Exercises"], ["progress", "Progress"]].map(([k, l]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "is-active" : ""} onClick={() => setTab(k)}>{l}</button>
                ))}
            </div>

            {tab === "workouts" && (
                <div className="flex flex-col gap-4">
                    {/* Recovery */}
                    <div className="gs">
                        <div className="flex items-center justify-between mb-2">
                            <div className="sl !mb-0">Muscle recovery</div>
                            <button type="button" className="text-[12px] font-semibold" style={{ color: "var(--accent)" }} onClick={() => setShowAllRecovery(s => !s)}>{showAllRecovery ? "Hide details" : "Details"}</button>
                        </div>
                        <div className="flex items-center gap-4">
                            <BodyMap colors={recoveryColors} height={150} labels={false} />
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] mb-2" style={{ color: "var(--text-secondary)" }}>
                                    {fatigued.length ? <>Give <b style={{ color: "var(--text-primary)" }}>{fatigued.slice(0, 3).map(m => MUSCLE_LABELS[m]).join(", ")}</b> some rest.</> : "Every muscle group is fresh — great day to train hard."}
                                </div>
                                <div className="flex flex-col gap-1">
                                    {Object.entries(RECOVERY_LABELS).map(([k, l]) => <span key={k} className="legend"><i style={{ background: RECOVERY_COLORS[k] }} />{l}</span>)}
                                </div>
                            </div>
                        </div>
                        {showAllRecovery && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-[12px]">
                                {MUSCLES.map(m => {
                                    const st = recoveryState(recovery[m]);
                                    return <div key={m} className="flex justify-between"><span style={{ color: "var(--text-secondary)" }}>{MUSCLE_LABELS[m]}</span><span className="legend"><i style={{ background: RECOVERY_COLORS[st] }} />{recovery[m] !== undefined ? `${Math.round(recovery[m])}h ago` : "Fresh"}</span></div>;
                                })}
                            </div>
                        )}
                    </div>

                    {/* Quick workouts */}
                    <section>
                        <div className="section-h"><span>Quick workouts</span></div>
                        <div className="h-scroll">
                            {QUICK.map(w => <div key={w.id} className="w-[230px] shrink-0"><WorkoutCard w={{ ...w, source: "quick" }} onOpen={open} /></div>)}
                        </div>
                    </section>

                    {/* Body focus */}
                    <section>
                        <div className="section-h"><span>Body focus</span></div>
                        <div className="chip-row mb-2">
                            {BODY_PARTS.map(([k, l]) => <button key={k} type="button" className={`chip ${part === k ? "chip-a" : "chip-i"}`} onClick={() => setPart(k)}>{l}</button>)}
                        </div>
                        <div className="h-scroll">
                            {focusWorkouts(part, gym).map(w => <div key={w.id} className="w-[230px] shrink-0"><WorkoutCard w={w} onOpen={open} accent={w.level} /></div>)}
                        </div>
                    </section>

                    {/* Challenges */}
                    <section>
                        <div className="section-h"><span>Challenges</span></div>
                        <div className="h-scroll">
                            {CHALLENGES.map(ch => {
                                const pr = challengeProgress[ch.id] || { currentDay: 1, completedDays: 0 };
                                const finished = pr.completedDays >= ch.days;
                                return (
                                    <div key={ch.id} className="card w-[260px] shrink-0 flex flex-col">
                                        <div className="flex items-center gap-3 mb-2">
                                            <IconBadge icon={CHALLENGE_ICON[ch.id] || Trophy} tone={CHALLENGE_TONE[ch.id] || "sky"} size={40} />
                                            <div className="min-w-0">
                                                <div className="text-[11px] font-bold dim">{ch.days}-DAY CHALLENGE</div>
                                                <div className="row-title truncate">{ch.title}</div>
                                            </div>
                                        </div>
                                        <div className="text-[12.5px] muted mb-3 flex-1">{ch.desc}</div>
                                        <div className="flex justify-between text-[12px] dim mb-1"><span>{finished ? "Completed!" : `Day ${pr.currentDay}`}</span><span className="num">{pr.completedDays}/{ch.days}</span></div>
                                        <Bar value={pr.completedDays / ch.days} className="mb-3" />
                                        <button type="button" className={finished ? "bg w-full" : "bp w-full"} onClick={() => startChallenge(ch)}>{finished ? "Restart" : `Start day ${pr.currentDay}`}</button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <AIGenerator onReady={(w) => open(w)} />

                    {/* My workouts */}
                    <section>
                        <div className="section-h">
                            <span>My workouts</span>
                            <button type="button" className="text-[13px] font-semibold flex items-center gap-1" style={{ color: "var(--accent)" }} onClick={() => open({ id: "", name: "My Workout", source: "custom", exercises: [] }, true)}><Plus size={15} /> Create</button>
                        </div>
                        {customs.length === 0 ? (
                            <button type="button" className="gs w-full text-left flex items-center gap-3" onClick={() => open({ id: "", name: "My Workout", source: "custom", exercises: [] }, true)}>
                                <div className="icon-btn !w-11 !h-11"><Plus size={18} /></div>
                                <div><div className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>Build your own workout</div><div className="text-[12px]" style={{ color: "var(--text-dim)" }}>Pick from 900+ exercises, set your sets & reps, save it.</div></div>
                            </button>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {customs.map(w => (
                                    <button key={w.id} type="button" className="gs !p-3 w-full flex items-center gap-3 text-left" onClick={() => open(w)}>
                                        <Thumbs exercises={w.exercises} n={3} />
                                        <div className="min-w-0 flex-1"><div className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{w.name}</div><div className="text-[12px]" style={{ color: "var(--text-dim)" }}>{w.exercises.length} exercises · {estimateWorkout(w.exercises).minutes} min</div></div>
                                        <ChevronRight size={18} style={{ color: "var(--text-dim)" }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {tab === "gates" && <GatesBoard onEnter={start} />}
            {tab === "programs" && <ProgramsTab programState={ps} profile={profile} onOpen={setProgram} />}
            {tab === "library" && <ExerciseLibrary onOpen={setExercise} />}
            {tab === "progress" && <ProgressView sessions={sessions} prs={prs} onOpenExercise={setExercise} />}

            {/* ── Overlays ── */}
            {program && (
                <ProgramSheet program={program} programState={ps} onClose={() => setProgram(null)}
                    onActivate={(id) => setProgramState(prev => ({ ...(prev || {}), activeProgram: id, startDate: today(), completedDays: [] }))}
                    onLeave={() => { setProgramState(prev => ({ ...(prev || {}), activeProgram: null, startDate: null, completedDays: [] })); setProgram(null); }}
                    onPreview={(w) => open(w)} />
            )}
            {preview && (
                <WorkoutPreview key={preview.workout.id || "new"} workout={preview.workout} sessions={sessions} startEditing={preview.editing}
                    onClose={() => setPreview(null)} onStart={start}
                    onSave={preview.workout.source === "custom" || preview.editing ? (w) => { saveCustom(w); setPreview(null); } : undefined}
                    onDelete={preview.workout.source === "custom" && preview.workout.id ? deleteCustom : undefined} />
            )}
            {exercise && (
                <ExerciseSheet exercise={exercise} history={exerciseHistory(sessions, exercise.name)} onClose={() => setExercise(null)}
                    onStart={(ex) => { setExercise(null); start({ id: `single_${Date.now()}`, name: ex.name, source: "single", exercises: [{ ...ex, sets: 3, reps: 10, rest: 60 }] }); }}
                    onAdd={(ex) => { setExercise(null); open({ id: "", name: "My Workout", source: "custom", exercises: [{ ...ex, sets: 3, reps: 10, rest: 60 }] }, true); }}
                    addLabel="Build workout" />
            )}
        </div>
    );
}
