"use client";
import { useState, useRef, useEffect, useMemo } from 'react';
import { today } from '@/utils';
import { EXERCISES } from '../data/exercises';
import { GYM_PROGRAMS, COMBAT_PROGRAMS, getTodayWorkout } from '../data/trainingPrograms';
import { localSync } from '@/utils/localSync';
import ActiveWorkout from './ActiveWorkout';

// ── Challenge Data ──
function buildChallengeDay(bodyParts, difficulty, count) {
    const pool = bodyParts.flatMap(bp => [
        ...(EXERCISES.bodyweight?.[bp] || []),
        ...(EXERCISES.gym?.[bp] || []),
    ]).filter(e => e.difficulty <= difficulty);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

const CHALLENGES = [
    {
        id: "massive_body", title: "MASSIVE BODY CHALLENGE", days: 28, color: "linear-gradient(135deg,#1e40af,#3b82f6)", desc: "Build serious muscle with progressive bodyweight training!", icon: "💪",
        getDayExercises: (day) => buildChallengeDay(["chest", "back", "arms", "shoulders"], Math.min(3, 1 + Math.floor(day / 10)), 8 + Math.floor(day / 7))
    },
    {
        id: "fat_burner", title: "FAT BURNER CHALLENGE", days: 30, color: "linear-gradient(135deg,#dc2626,#f97316)", desc: "Burn fat with HIIT and cardio combos!", icon: "🔥",
        getDayExercises: (day) => buildChallengeDay(["cardio", "core", "legs"], Math.min(3, 1 + Math.floor(day / 10)), 6 + Math.floor(day / 5))
    },
    {
        id: "calisthenics", title: "CALISTHENICS PLAN", days: 28, color: "linear-gradient(135deg,#7c3aed,#a855f7)", desc: "Master bodyweight exercises for muscle and fat loss!", icon: "🤸",
        getDayExercises: (day) => buildChallengeDay(["chest", "back", "core", "legs"], Math.min(3, 1 + Math.floor(day / 10)), 8 + Math.floor(day / 7))
    },
    {
        id: "full_body", title: "FULL BODY CHALLENGE", days: 14, color: "linear-gradient(135deg,#059669,#10b981)", desc: "Start your fitness journey!", icon: "⚡",
        getDayExercises: (day) => buildChallengeDay(["chest", "back", "legs", "core", "arms"], 2, 6 + Math.floor(day / 3))
    },
];

const BODY_PARTS = [
    { id: "core", label: "Abs/Core" }, { id: "arms", label: "Arm" }, { id: "chest", label: "Chest" },
    { id: "legs", label: "Leg" }, { id: "shoulders", label: "Shoulder" }, { id: "back", label: "Back" },
    { id: "glutes", label: "Glutes" }, { id: "cardio", label: "Cardio" },
];

function getWorkoutsForBodyPart(bodyPart) {
    const levels = [
        { suffix: "Beginner", difficulty: 1, count: 8, mins: 7 },
        { suffix: "Intermediate", difficulty: 2, count: 12, mins: 12 },
        { suffix: "Advanced", difficulty: 3, count: 16, mins: 18 },
    ];
    const partLabel = bodyPart.charAt(0).toUpperCase() + bodyPart.slice(1);
    return levels.map(l => {
        const allEx = [...(EXERCISES.bodyweight?.[bodyPart] || []), ...(EXERCISES.gym?.[bodyPart] || [])].filter(e => e.difficulty <= l.difficulty);
        return { id: `${bodyPart}_${l.suffix.toLowerCase()}`, name: `${partLabel} ${l.suffix}`, duration: `${l.mins} mins`, exerciseCount: allEx.slice(0, l.count).length, difficulty: l.difficulty, exercises: allEx.slice(0, l.count) };
    }).filter(w => w.exerciseCount > 0);
}

// ══════════════════════════════════════
// WEEKLY GOAL
// ══════════════════════════════════════
function WeeklyGoal({ workoutLog, goal = 4 }) {
    const now = new Date();
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
    const days = [...Array(7)].map((_, i) => {
        const dt = new Date(startOfWeek); dt.setDate(startOfWeek.getDate() + i);
        return { date: dt.toISOString().split("T")[0], day: dt.getDate(), isToday: dt.toDateString() === now.toDateString() };
    });
    const completedDays = days.filter(d => { const e = workoutLog[d.date]; return e && (Array.isArray(e) ? e.length > 0 : true); }).length;

    return (
        <div style={{ background: "#1a1a2e", borderRadius: 16, padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6" }}>Weekly Goal</span>
                <span><span style={{ fontWeight: 900, color: "#10b981", fontSize: 20 }}>{completedDays}</span><span style={{ color: "#6b7280" }}>/{goal}</span></span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
                {days.map(d => {
                    const done = (() => { const e = workoutLog[d.date]; return e && (Array.isArray(e) ? e.length > 0 : true); })();
                    return (<div key={d.date} style={{ textAlign: "center" }}><div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: done ? "#3b82f6" : "transparent", border: d.isToday && !done ? "2px solid #3b82f6" : done ? "none" : "1px solid #374151", color: done ? "#fff" : d.isToday ? "#3b82f6" : "#6b7280", fontSize: 13, fontWeight: done || d.isToday ? 700 : 400 }}>{done ? "✓" : d.day}</div></div>);
                })}
            </div>
        </div>
    );
}

// ══════════════════════════════════════
// CHALLENGE CAROUSEL (with persistence)
// ══════════════════════════════════════
function ChallengeCarousel({ challengeProgress, setChallengeProgress, onStartChallenge }) {
    const scrollRef = useRef(null);
    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", marginBottom: 12 }}>Challenge</div>
            <div ref={scrollRef} style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 8 }} className="hide-scrollbar">
                {CHALLENGES.map(ch => {
                    const progress = challengeProgress[ch.id] || { currentDay: 1, completedDays: 0 };
                    return (
                        <div key={ch.id} style={{ flexShrink: 0, width: "85%", minHeight: 220, borderRadius: 16, padding: 20, background: ch.color, position: "relative", overflow: "hidden", scrollSnapAlign: "start", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div style={{ position: "absolute", top: 16, right: 16, fontSize: 48, opacity: 0.3 }}>{ch.icon}</div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: 1 }}>{ch.days} DAYS</div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginTop: 4 }}>{ch.title}</div>
                                <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginTop: 4 }}>DAY {progress.currentDay}</div>
                                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4, maxWidth: "70%" }}>{ch.desc}</div>
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{progress.completedDays}/{ch.days}</span>
                                </div>
                                <div style={{ height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2 }}>
                                    <div style={{ height: "100%", borderRadius: 2, background: "#fff", width: `${(progress.completedDays / ch.days) * 100}%`, transition: "width .3s" }} />
                                </div>
                                <button onClick={() => onStartChallenge(ch)} style={{ width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 24, background: "rgba(255,255,255,0.95)", color: "#111", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer" }}>
                                    START DAY {progress.currentDay} →
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ══════════════════════════════════════
// PROGRAMS SECTION (v3 programs back)
// ══════════════════════════════════════
function ProgramsSection({ onSelectProgram, activeProgram }) {
    const allPrograms = [
        ...Object.values(GYM_PROGRAMS).map(p => ({ ...p, type: "gym" })),
        ...Object.values(COMBAT_PROGRAMS).map(p => ({ ...p, type: "combat" })),
    ];
    const colors = { beginner: "#10b981", intermediate: "#f59e0b", advanced: "#ef4444" };

    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", marginBottom: 12 }}>Programs</div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }} className="hide-scrollbar">
                {allPrograms.map(p => {
                    const isActive = activeProgram === p.id;
                    const color = colors[p.level] || "#3b82f6";
                    return (
                        <div key={p.id} onClick={() => onSelectProgram(p)}
                            style={{ flexShrink: 0, width: 180, background: isActive ? `${color}15` : "#1a1a2e", borderRadius: 14, padding: 14, cursor: "pointer", border: isActive ? `1px solid ${color}40` : "1px solid transparent" }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{p.type === "combat" ? "🥊" : "🏋️"}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6" }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{p.desc?.substring(0, 60)}...</div>
                            <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
                                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: `${color}15`, color, fontWeight: 600 }}>{p.level || p.type}</span>
                                {p.daysPerWeek && <span style={{ fontSize: 10, color: "#6b7280" }}>{p.daysPerWeek}d/wk</span>}
                            </div>
                            {isActive && <div style={{ marginTop: 8, fontSize: 11, color, fontWeight: 700 }}>✓ Active</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ══════════════════════════════════════
// PROGRAM DETAIL (shows today's workout from a program)
// ══════════════════════════════════════
function ProgramDetail({ program, onClose, onStartWorkout }) {
    if (!program) return null;
    const todayData = getTodayWorkout(program, 1, new Date().getDay());
    const exercises = todayData?.day?.exercises || [];

    return (
        <div style={{ position: "fixed", inset: 0, background: "#0a0a0a", zIndex: 50, overflowY: "auto" }}>
            <div style={{ padding: 16 }}>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 18, cursor: "pointer" }}>← Back</button>
                <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#f3f4f6" }}>{program.name}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{program.desc}</div>
                    {todayData?.phase && <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 8 }}>Phase: {todayData.phase} · {todayData.focus}</div>}
                    {todayData?.day && <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", marginTop: 12 }}>Today: {todayData.day.name}</div>}
                </div>

                {exercises.length > 0 ? (
                    <div style={{ marginTop: 16 }}>
                        {exercises.map((ex, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: i < exercises.length - 1 ? "1px solid #1a1a2e" : "none" }}>
                                <div style={{ width: 48, height: 48, borderRadius: 10, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#10b981", textAlign: "center" }}>🏋️</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6" }}>{ex.name}</div>
                                    <div style={{ fontSize: 12, color: "#6b7280" }}>{ex.sets} sets × {ex.reps} · Rest {ex.rest}s</div>
                                    {ex.progression && <div style={{ fontSize: 10, color: "#10b981" }}>{ex.progression}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Rest day — no workout scheduled</div>
                )}

                {exercises.length > 0 && (
                    <div style={{ padding: "16px 16px 100px", position: "sticky", bottom: 0, background: "linear-gradient(transparent, #0a0a0a 30%)" }}>
                        <button onClick={() => onStartWorkout({ id: program.id, name: `${program.name} — ${todayData.day.name}`, exercises: exercises.map(e => ({ ...e, reps: parseInt(e.reps) || 12 })), duration: `${exercises.length * 3} mins`, exerciseCount: exercises.length })}
                            style={{ width: "100%", padding: 16, borderRadius: 14, background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer" }}>
                            START WORKOUT →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ══════════════════════════════════════
// WORKOUT HISTORY
// ══════════════════════════════════════
function WorkoutHistory({ workoutLog }) {
    const entries = useMemo(() => {
        const all = [];
        Object.entries(workoutLog || {}).forEach(([date, val]) => {
            const items = Array.isArray(val) ? val : val ? [val] : [];
            items.forEach(w => all.push({ ...w, date }));
        });
        return all.sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 15);
    }, [workoutLog]);

    if (entries.length === 0) return null;

    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", marginBottom: 12 }}>Recent Workouts</div>
            {entries.map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#1a1a2e", borderRadius: 12, marginBottom: 8 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                        {w.trainingType === "combat" ? "🥊" : w.trainingType === "fitness" ? "🏃" : "🏋️"}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6" }}>{w.splitName || "Workout"}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>
                            {w.date} · {Math.floor((w.duration || 0) / 60)}min · {w.calBurned || 0}cal
                        </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>+{w.xpEarned || 0} XP</div>
                </div>
            ))}
        </div>
    );
}

// ══════════════════════════════════════
// AI WORKOUT GENERATOR
// ══════════════════════════════════════
function AIWorkoutGenerator({ onStartWorkout }) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    async function generate() {
        if (!prompt.trim() || loading) return;
        setLoading(true);
        try {
            const r = await fetch("/api/generate-workout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            const data = await r.json();
            if (data.workout) {
                const workout = data.workout;
                workout.id = "ai_" + Date.now();
                workout.duration = `${(workout.exercises?.length || 6) * 3} mins`;
                workout.exerciseCount = workout.exercises?.length || 0;
                onStartWorkout(workout);
            } else {
                console.error("AI gen failed:", data.error);
            }
        } catch (e) { console.error("AI gen error:", e); }
        setLoading(false);
    }

    return (
        <div style={{ marginBottom: 20 }}>
            <div onClick={() => setExpanded(!expanded)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6" }}>🤖 AI Workout Generator</div>
                <span style={{ color: "#6b7280", fontSize: 14 }}>{expanded ? "▲" : "▼"}</span>
            </div>
            {expanded && (
                <div style={{ marginTop: 12 }}>
                    <input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && generate()}
                        placeholder="e.g. Quick chest and tricep workout, 15 minutes..."
                        style={{ width: "100%", padding: 12, borderRadius: 10, fontSize: 14, background: "#1a1a2e", border: "1px solid #2a2a3e", color: "#f3f4f6", marginBottom: 8 }} />
                    <button onClick={generate} disabled={loading || !prompt.trim()}
                        style={{ width: "100%", padding: 12, borderRadius: 10, background: loading ? "#1a1a2e" : "linear-gradient(135deg,#8b5cf6,#6d28d9)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: loading ? "default" : "pointer" }}>
                        {loading ? "Generating..." : "Generate Workout →"}
                    </button>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto" }} className="hide-scrollbar">
                        {["Quick full body 10 min", "Chest and arms no equipment", "Leg day intermediate", "Fat burning HIIT"].map(q => (
                            <button key={q} onClick={() => { setPrompt(q); }} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #2a2a3e", color: "#9ca3af", fontSize: 11, cursor: "pointer" }}>{q}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════
// BODY FOCUS SECTION
// ══════════════════════════════════════
function BodyFocusSection({ onSelectWorkout }) {
    const [activePart, setActivePart] = useState("abs");
    const workouts = getWorkoutsForBodyPart(activePart);
    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", marginBottom: 12 }}>Body Focus</div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }} className="hide-scrollbar">
                {BODY_PARTS.map(bp => (
                    <button key={bp.id} onClick={() => setActivePart(bp.id)}
                        style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: activePart === bp.id ? "#10b981" : "#1a1a2e", color: activePart === bp.id ? "#000" : "#9ca3af", border: activePart === bp.id ? "none" : "1px solid #2a2a3e", cursor: "pointer" }}>
                        {bp.label}
                    </button>
                ))}
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }} className="hide-scrollbar">
                {workouts.map(w => (
                    <div key={w.id} onClick={() => onSelectWorkout(w)} style={{ flexShrink: 0, width: 200, background: "#1a1a2e", borderRadius: 14, overflow: "hidden", cursor: "pointer" }}>
                        <div style={{ height: 80, background: w.difficulty === 1 ? "linear-gradient(135deg,#064e3b,#10b981)" : w.difficulty === 2 ? "linear-gradient(135deg,#78350f,#f59e0b)" : "linear-gradient(135deg,#7f1d1d,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)", textAlign: "center" }}>{w.exercises.slice(0, 3).map(e => e.name).join(" · ")}</div>
                        </div>
                        <div style={{ padding: 12 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6" }}>{w.name}</div>
                            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{w.duration} · {w.exerciseCount} Exercises</div>
                            <div style={{ display: "flex", gap: 2, marginTop: 6 }}>{[1, 2, 3].map(i => (<span key={i} style={{ fontSize: 10, color: i <= w.difficulty ? "#f59e0b" : "#374151" }}>⚡</span>))}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ══════════════════════════════════════
// WORKOUT DETAIL
// ══════════════════════════════════════
function WorkoutDetail({ workout, onClose, onStart }) {
    const [exercises, setExercises] = useState(workout?.exercises || []);
    const [dragIdx, setDragIdx] = useState(null);
    if (!workout) return null;

    function handleDragStart(i) { setDragIdx(i); }
    function handleDragOver(e, i) { e.preventDefault(); if (dragIdx === null || dragIdx === i) return; const r = [...exercises]; const [m] = r.splice(dragIdx, 1); r.splice(i, 0, m); setExercises(r); setDragIdx(i); }
    function handleDragEnd() { setDragIdx(null); }

    return (
        <div style={{ position: "fixed", inset: 0, background: "#0a0a0a", zIndex: 50, overflowY: "auto" }}>
            <div style={{ padding: "16px 16px 0" }}>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 18, cursor: "pointer" }}>← Back</button>
                <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#f3f4f6" }}>{workout.name}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{workout.duration} · {workout.exerciseCount} Exercises</div>
                </div>
            </div>
            <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6" }}>Exercises</span>
                </div>
                {exercises.map((ex, i) => (
                    <div key={i} draggable onDragStart={() => handleDragStart(i)} onDragOver={(e) => handleDragOver(e, i)} onDragEnd={handleDragEnd}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: i < exercises.length - 1 ? "1px solid #1a1a2e" : "none", opacity: dragIdx === i ? 0.5 : 1, cursor: "grab" }}>
                        <div style={{ color: "#374151", fontSize: 16 }}>☰</div>
                        <div style={{ width: 56, height: 56, borderRadius: 10, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 700, color: "#10b981", textAlign: "center", padding: 4 }}>
                            {(ex.bodyPart || ex.muscle || "").split(",")[0].trim().toUpperCase() || "💪"}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6" }}>{ex.name}</div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>{ex.reps ? `x${ex.reps}` : ex.duration ? `${ex.duration}s` : `${ex.sets} sets`}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ padding: "16px 16px 100px", position: "sticky", bottom: 0, background: "linear-gradient(transparent, #0a0a0a 30%)" }}>
                <button onClick={() => onStart({ ...workout, exercises })} style={{ width: "100%", padding: 16, borderRadius: 14, background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer" }}>START WORKOUT →</button>
            </div>
        </div>
    );
}

// ══════════════════════════════════════
// SEARCH SCREEN
// ══════════════════════════════════════
function SearchScreen({ onClose, onSelectWorkout }) {
    const [query, setQuery] = useState("");
    const allWorkouts = [
        ...BODY_PARTS.flatMap(bp => getWorkoutsForBodyPart(bp.id)),
        ...Object.values(GYM_PROGRAMS).map(p => ({ ...p, duration: p.duration || "12 weeks", exerciseCount: p.daysPerWeek || 3, exercises: [] })),
        ...Object.values(COMBAT_PROGRAMS).map(p => ({ ...p, duration: "Ongoing", exerciseCount: 0, exercises: [] })),
    ];
    const q = query.trim().toLowerCase();
    const filtered = q ? allWorkouts.filter(w => (w.name || "").toLowerCase().includes(q) || (w.desc || "").toLowerCase().includes(q) || (w.level || "").toLowerCase().includes(q) || (w.goal || "").toLowerCase().includes(q)) : [];

    return (
        <div style={{ position: "fixed", inset: 0, background: "#0a0a0a", zIndex: 45, overflowY: "auto", padding: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search workouts, plans..." autoFocus
                    style={{ flex: 1, padding: "12px 16px", borderRadius: 12, fontSize: 14, background: "#1a1a2e", border: "1px solid #2a2a3e", color: "#f3f4f6" }} />
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
            {!query.trim() && (
                <>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", marginBottom: 12 }}>Workout Type</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                        {[{ label: "Build Muscle", icon: "💪" }, { label: "Warm-Up", icon: "🤸" }, { label: "Fat Burning", icon: "🔥" }, { label: "With Equipment", icon: "🏋️" }].map(t => (
                            <div key={t.label} onClick={() => setQuery(t.label)} style={{ background: "#1a1a2e", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                                <span style={{ fontSize: 24 }}>{t.icon}</span><span style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6" }}>{t.label}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", marginBottom: 12 }}>Level</div>
                    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                        {["Beginner", "Intermediate", "Advanced"].map((lvl, i) => (
                            <button key={lvl} onClick={() => setQuery(lvl)} style={{ padding: "8px 20px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: "transparent", cursor: "pointer", border: `1px solid ${i === 0 ? "#3b82f6" : i === 1 ? "#f59e0b" : "#ef4444"}`, color: i === 0 ? "#3b82f6" : i === 1 ? "#f59e0b" : "#ef4444" }}>{lvl}</button>
                        ))}
                    </div>
                </>
            )}
            {query.trim() && (
                <div>
                    {filtered.length === 0 && <div style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>No workouts found</div>}
                    {filtered.map(w => (
                        <div key={w.id} onClick={() => { onClose(); onSelectWorkout(w); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "#1a1a2e", borderRadius: 12, marginBottom: 8, cursor: "pointer" }}>
                            <div style={{ width: 48, height: 48, borderRadius: 10, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏋️</div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6" }}>{w.name}</div>
                                <div style={{ fontSize: 12, color: "#6b7280" }}>{w.duration} · {w.exerciseCount} Exercises</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════
// MAIN TRAINING HOME
// ══════════════════════════════════════
export default function TrainingHome({ workoutLog = {}, setWorkoutLog, addXP, profile = {} }) {
    const [showSearch, setShowSearch] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [activeWorkout, setActiveWorkout] = useState(null);

    // Challenge progress — synced to localStorage + Firestore profile
    const cpSync = useMemo(() => localSync("ignite-challenge-progress", {}), []);
    const [challengeProgress, setChallengeProgressRaw] = useState(cpSync.get);
    const setChallengeProgress = (v) => {
        setChallengeProgressRaw(prev => {
            const next = typeof v === "function" ? v(prev) : v;
            cpSync.set(next);
            return next;
        });
    };

    function handleStartChallenge(challenge) {
        const progress = challengeProgress[challenge.id] || { currentDay: 1, completedDays: 0 };
        const exercises = challenge.getDayExercises(progress.currentDay);
        setActiveWorkout({
            id: `${challenge.id}_day${progress.currentDay}`,
            name: `${challenge.title} — Day ${progress.currentDay}`,
            challengeId: challenge.id,
            duration: `${8 + exercises.length} mins`,
            exerciseCount: exercises.length,
            exercises,
        });
    }

    function handleWorkoutComplete(result) {
        const d = today();
        const xp = Math.max(20, result.exercisesDone * 5 + Math.floor(result.duration / 60) * 3);
        const entry = {
            id: `${d}_gym_${Date.now()}`, date: d, trainingType: "gym",
            splitName: result.workout.name, duration: result.duration,
            calBurned: result.caloriesBurned, xpEarned: xp,
            startedAt: Date.now() - (result.duration * 1000), completedAt: Date.now(),
            gym: {
                exercises: result.workout.exercises.map(ex => ({ name: ex.name, sets: [] })),
                totalSets: result.workout.exercises.reduce((s, ex) => s + (ex.sets || 3), 0),
                totalReps: result.workout.exercises.reduce((s, ex) => s + (parseInt(ex.reps) || 12), 0),
                maxWeight: 0, musclesWorked: [...new Set(result.workout.exercises.map(ex => ex.bodyPart).filter(Boolean))]
            },
        };
        if (setWorkoutLog) {
            setWorkoutLog(prev => {
                const dayEntries = Array.isArray(prev[d]) ? prev[d] : prev[d] ? [prev[d]] : [];
                return { ...prev, [d]: [...dayEntries, entry] };
            });
        }
        if (addXP) addXP(xp, "Workout Complete");

        // Update challenge progress if this was a challenge workout
        if (result.workout.challengeId) {
            setChallengeProgress(prev => {
                const old = prev[result.workout.challengeId] || { currentDay: 1, completedDays: 0 };
                return { ...prev, [result.workout.challengeId]: { currentDay: old.currentDay + 1, completedDays: old.completedDays + 1 } };
            });
        }
        setActiveWorkout(null);
    }

    if (activeWorkout) {
        return <ActiveWorkout workout={activeWorkout} onComplete={handleWorkoutComplete} onQuit={() => setActiveWorkout(null)} />;
    }

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>IGNITE TRAINING</div>
                <span style={{ fontSize: 20 }}>🔥</span>
            </div>

            {/* Search bar */}
            <div onClick={() => setShowSearch(true)} style={{ background: "#1a1a2e", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", border: "1px solid #2a2a3e" }}>
                <span style={{ color: "#6b7280" }}>🔍</span>
                <span style={{ color: "#6b7280", fontSize: 14 }}>Search workouts, plans...</span>
            </div>

            <WeeklyGoal workoutLog={workoutLog} goal={4} />
            <ChallengeCarousel challengeProgress={challengeProgress} setChallengeProgress={setChallengeProgress} onStartChallenge={handleStartChallenge} />
            <ProgramsSection onSelectProgram={setSelectedProgram} activeProgram={null} />
            <AIWorkoutGenerator onStartWorkout={(w) => setSelectedWorkout(w)} />
            <BodyFocusSection onSelectWorkout={setSelectedWorkout} />
            <WorkoutHistory workoutLog={workoutLog} />

            {/* Overlays */}
            {showSearch && <SearchScreen onClose={() => setShowSearch(false)} onSelectWorkout={(w) => { setShowSearch(false); setSelectedWorkout(w); }} />}
            {selectedWorkout && <WorkoutDetail workout={selectedWorkout} onClose={() => setSelectedWorkout(null)} onStart={(w) => { setSelectedWorkout(null); setActiveWorkout(w); }} />}
            {selectedProgram && <ProgramDetail program={selectedProgram} onClose={() => setSelectedProgram(null)} onStartWorkout={(w) => { setSelectedProgram(null); setActiveWorkout(w); }} />}

            {/* Bottom spacer for navbar */}
            <div style={{ height: 100 }} />

            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    );
}