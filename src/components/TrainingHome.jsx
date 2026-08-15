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
        id: "massive_body", title: "MASSIVE BODY CHALLENGE", days: 28, color: "linear-gradient(135deg,#1e40af,#3b82f6)", desc: "Build serious muscle with progressive bodyweight training!", icon: "\u{1F4AA}",
        getDayExercises: (day) => buildChallengeDay(["chest", "back", "arms", "shoulders"], Math.min(3, 1 + Math.floor(day / 10)), 8 + Math.floor(day / 7))
    },
    {
        id: "fat_burner", title: "FAT BURNER CHALLENGE", days: 30, color: "linear-gradient(135deg,#dc2626,#f97316)", desc: "Burn fat with HIIT and cardio combos!", icon: "\u{1F525}",
        getDayExercises: (day) => buildChallengeDay(["cardio", "core", "legs"], Math.min(3, 1 + Math.floor(day / 10)), 6 + Math.floor(day / 5))
    },
    {
        id: "calisthenics", title: "CALISTHENICS PLAN", days: 28, color: "linear-gradient(135deg,#7c3aed,#a855f7)", desc: "Master bodyweight exercises for muscle and fat loss!", icon: "\u{1F938}",
        getDayExercises: (day) => buildChallengeDay(["chest", "back", "core", "legs"], Math.min(3, 1 + Math.floor(day / 10)), 8 + Math.floor(day / 7))
    },
    {
        id: "full_body", title: "FULL BODY CHALLENGE", days: 14, color: "linear-gradient(135deg,#059669,#10b981)", desc: "Start your fitness journey!", icon: "\u{26A1}",
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
        <div className="bg-[#1a1a2e] rounded-2xl px-5 py-4 mb-4">
            <div className="flex justify-between items-center mb-[14px]">
                <span className="text-base font-bold text-gray-100">Weekly Goal</span>
                <span><span className="font-black text-emerald-500 text-xl">{completedDays}</span><span className="text-gray-500">/{goal}</span></span>
            </div>
            <div className="flex justify-around">
                {days.map(d => {
                    const done = (() => { const e = workoutLog[d.date]; return e && (Array.isArray(e) ? e.length > 0 : true); })();
                    return (<div key={d.date} className="text-center"><div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] ${done ? "bg-blue-500 text-white font-bold" : d.isToday ? "bg-transparent border-2 border-blue-500 text-blue-500 font-bold" : "bg-transparent border border-gray-700 text-gray-500 font-normal"}`}>{done ? "✓" : d.day}</div></div>);
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
        <div className="mb-5">
            <div className="text-lg font-extrabold text-gray-100 mb-3">Challenge</div>
            <div ref={scrollRef} className="hide-scrollbar flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
                {CHALLENGES.map(ch => {
                    const progress = challengeProgress[ch.id] || { currentDay: 1, completedDays: 0 };
                    return (
                        <div key={ch.id} className="shrink-0 w-[85%] min-h-[220px] rounded-2xl p-5 relative overflow-hidden snap-start flex flex-col justify-between" style={{ background: ch.color }}>
                            <div className="absolute top-4 right-4 text-5xl opacity-30">{ch.icon}</div>
                            <div>
                                <div className="text-xs font-bold text-white/80 tracking-[1px]">{ch.days} DAYS</div>
                                <div className="text-[22px] font-black text-white leading-[1.1] mt-1">{ch.title}</div>
                                <div className="text-4xl font-black text-white mt-1">DAY {progress.currentDay}</div>
                                <div className="text-xs text-white/70 mt-1 max-w-[70%]">{ch.desc}</div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-[6px]">
                                    <span className="text-[11px] text-white/70">{progress.completedDays}/{ch.days}</span>
                                </div>
                                <div className="h-1 bg-white/20 rounded-sm">
                                    <div className="h-full rounded-sm bg-white transition-[width] duration-300" style={{ width: `${(progress.completedDays / ch.days) * 100}%` }} />
                                </div>
                                <button onClick={() => onStartChallenge(ch)} className="w-full mt-3 py-3 px-0 rounded-3xl bg-white/95 text-[#111] font-extrabold text-sm border-none cursor-pointer">
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
        <div className="mb-5">
            <div className="text-lg font-extrabold text-gray-100 mb-3">Programs</div>
            <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
                {allPrograms.map(p => {
                    const isActive = activeProgram === p.id;
                    const color = colors[p.level] || "#3b82f6";
                    return (
                        <div key={p.id} onClick={() => onSelectProgram(p)}
                            className="shrink-0 w-[180px] rounded-[14px] p-[14px] cursor-pointer" style={{ background: isActive ? `${color}15` : "#1a1a2e", border: isActive ? `1px solid ${color}40` : "1px solid transparent" }}>
                            <div className="text-2xl mb-2">{p.type === "combat" ? "\u{1F94A}" : "\u{1F3CB}️"}</div>
                            <div className="text-sm font-bold text-gray-100">{p.name}</div>
                            <div className="text-[11px] text-gray-500 mt-1">{p.desc?.substring(0, 60)}...</div>
                            <div className="mt-2 flex gap-[6px] items-center">
                                <span className="text-[10px] py-[2px] px-2 rounded-[10px] font-semibold" style={{ background: `${color}15`, color }}>{p.level || p.type}</span>
                                {p.daysPerWeek && <span className="text-[10px] text-gray-500">{p.daysPerWeek}d/wk</span>}
                            </div>
                            {isActive && <div className="mt-2 text-[11px] font-bold" style={{ color }}>{"✓"} Active</div>}
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
        <div className="fixed inset-0 bg-[#0a0a0a] z-50 overflow-y-auto">
            <div className="p-4">
                <button onClick={onClose} className="bg-none border-none text-gray-400 text-lg cursor-pointer">{"←"} Back</button>
                <div className="mt-3">
                    <div className="text-[22px] font-black text-gray-100">{program.name}</div>
                    <div className="text-[13px] text-gray-500 mt-1">{program.desc}</div>
                    {todayData?.phase && <div className="text-xs text-blue-500 mt-2">Phase: {todayData.phase} {"·"} {todayData.focus}</div>}
                    {todayData?.day && <div className="text-base font-bold text-gray-100 mt-3">Today: {todayData.day.name}</div>}
                </div>

                {exercises.length > 0 ? (
                    <div className="mt-4">
                        {exercises.map((ex, i) => (
                            <div key={i} className={`flex items-center gap-3 py-[14px] ${i < exercises.length - 1 ? "border-b border-b-[#1a1a2e]" : ""}`}>
                                <div className="w-12 h-12 rounded-[10px] bg-[#1a1a2e] flex items-center justify-center text-[10px] font-bold text-emerald-500 text-center">{"\u{1F3CB}️"}</div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-gray-100">{ex.name}</div>
                                    <div className="text-xs text-gray-500">{ex.sets} sets {"×"} {ex.reps} {"·"} Rest {ex.rest}s</div>
                                    {ex.progression && <div className="text-[10px] text-emerald-500">{ex.progression}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-10 text-center text-gray-500">Rest day {"—"} no workout scheduled</div>
                )}

                {exercises.length > 0 && (
                    <div className="px-4 pt-4 pb-[100px] sticky bottom-0" style={{ background: "linear-gradient(transparent, #0a0a0a 30%)" }}>
                        <button onClick={() => onStartWorkout({ id: program.id, name: `${program.name} — ${todayData.day.name}`, exercises: exercises.map(e => ({ ...e, reps: parseInt(e.reps) || 12 })), duration: `${exercises.length * 3} mins`, exerciseCount: exercises.length })}
                            className="w-full p-4 rounded-[14px] bg-gradient-to-br from-blue-500 to-blue-600 text-white font-extrabold text-base border-none cursor-pointer">
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
        <div className="mb-5">
            <div className="text-lg font-extrabold text-gray-100 mb-3">Recent Workouts</div>
            {entries.map((w, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[#1a1a2e] rounded-xl mb-2">
                    <div className="w-11 h-11 rounded-[10px] bg-slate-900 flex items-center justify-center text-xl">
                        {w.trainingType === "combat" ? "\u{1F94A}" : w.trainingType === "fitness" ? "\u{1F3C3}" : "\u{1F3CB}️"}
                    </div>
                    <div className="flex-1">
                        <div className="text-[13px] font-bold text-gray-100">{w.splitName || "Workout"}</div>
                        <div className="text-[11px] text-gray-500">
                            {w.date} {"·"} {Math.floor((w.duration || 0) / 60)}min {"·"} {w.calBurned || 0}cal
                        </div>
                    </div>
                    <div className="text-xs font-bold text-emerald-500">+{w.xpEarned || 0} XP</div>
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
        <div className="mb-5">
            <div onClick={() => setExpanded(!expanded)} className="flex justify-between items-center cursor-pointer">
                <div className="text-lg font-extrabold text-gray-100">{"\u{1F916}"} AI Workout Generator</div>
                <span className="text-gray-500 text-sm">{expanded ? "▲" : "▼"}</span>
            </div>
            {expanded && (
                <div className="mt-3">
                    <input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && generate()}
                        placeholder="e.g. Quick chest and tricep workout, 15 minutes..."
                        className="w-full p-3 rounded-[10px] text-sm bg-[#1a1a2e] border border-[#2a2a3e] text-gray-100 mb-2" />
                    <button onClick={generate} disabled={loading || !prompt.trim()}
                        className={`w-full p-3 rounded-[10px] text-white font-bold text-sm border-none ${loading ? "bg-[#1a1a2e] cursor-default" : "bg-gradient-to-br from-violet-500 to-violet-700 cursor-pointer"}`}>
                        {loading ? "Generating..." : "Generate Workout →"}
                    </button>
                    <div className="hide-scrollbar flex gap-[6px] mt-2 overflow-x-auto">
                        {["Quick full body 10 min", "Chest and arms no equipment", "Leg day intermediate", "Fat burning HIIT"].map(q => (
                            <button key={q} onClick={() => { setPrompt(q); }} className="shrink-0 py-[6px] px-3 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] text-gray-400 text-[11px] cursor-pointer">{q}</button>
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
        <div className="mb-5">
            <div className="text-lg font-extrabold text-gray-100 mb-3">Body Focus</div>
            <div className="hide-scrollbar flex gap-2 overflow-x-auto mb-[14px] pb-1">
                {BODY_PARTS.map(bp => (
                    <button key={bp.id} onClick={() => setActivePart(bp.id)}
                        className={`shrink-0 py-2 px-4 rounded-[20px] text-[13px] font-semibold cursor-pointer ${activePart === bp.id ? "bg-emerald-500 text-black border-none" : "bg-[#1a1a2e] text-gray-400 border border-[#2a2a3e]"}`}>
                        {bp.label}
                    </button>
                ))}
            </div>
            <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
                {workouts.map(w => (
                    <div key={w.id} onClick={() => onSelectWorkout(w)} className="shrink-0 w-[200px] bg-[#1a1a2e] rounded-[14px] overflow-hidden cursor-pointer">
                        <div className={`h-20 flex items-center justify-center p-[10px] bg-gradient-to-br ${w.difficulty === 1 ? "from-emerald-900 to-emerald-500" : w.difficulty === 2 ? "from-amber-900 to-amber-500" : "from-red-900 to-red-500"}`}>
                            <div className="text-xs font-bold text-white/90 text-center">{w.exercises.slice(0, 3).map(e => e.name).join(" · ")}</div>
                        </div>
                        <div className="p-3">
                            <div className="text-sm font-bold text-gray-100">{w.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{w.duration} {"·"} {w.exerciseCount} Exercises</div>
                            <div className="flex gap-[2px] mt-[6px]">{[1, 2, 3].map(i => (<span key={i} className={`text-[10px] ${i <= w.difficulty ? "text-amber-500" : "text-gray-700"}`}>{"⚡"}</span>))}</div>
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
        <div className="fixed inset-0 bg-[#0a0a0a] z-50 overflow-y-auto">
            <div className="px-4 pt-4">
                <button onClick={onClose} className="bg-none border-none text-gray-400 text-lg cursor-pointer">{"←"} Back</button>
                <div className="mt-3">
                    <div className="text-[22px] font-black text-gray-100">{workout.name}</div>
                    <div className="text-[13px] text-gray-500 mt-1">{workout.duration} {"·"} {workout.exerciseCount} Exercises</div>
                </div>
            </div>
            <div className="p-4">
                <div className="flex justify-between mb-3">
                    <span className="text-base font-bold text-gray-100">Exercises</span>
                </div>
                {exercises.map((ex, i) => (
                    <div key={i} draggable onDragStart={() => handleDragStart(i)} onDragOver={(e) => handleDragOver(e, i)} onDragEnd={handleDragEnd}
                        className={`flex items-center gap-3 py-[14px] cursor-grab ${i < exercises.length - 1 ? "border-b border-b-[#1a1a2e]" : ""} ${dragIdx === i ? "opacity-50" : "opacity-100"}`}>
                        <div className="text-gray-700 text-base">{"☰"}</div>
                        <div className="w-14 h-14 rounded-[10px] bg-[#1a1a2e] flex items-center justify-center shrink-0 text-[10px] font-bold text-emerald-500 text-center p-1">
                            {(ex.bodyPart || ex.muscle || "").split(",")[0].trim().toUpperCase() || "\u{1F4AA}"}
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-bold text-gray-100">{ex.name}</div>
                            <div className="text-xs text-gray-500">{ex.reps ? `x${ex.reps}` : ex.duration ? `${ex.duration}s` : `${ex.sets} sets`}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="px-4 pt-4 pb-[100px] sticky bottom-0" style={{ background: "linear-gradient(transparent, #0a0a0a 30%)" }}>
                <button onClick={() => onStart({ ...workout, exercises })} className="w-full p-4 rounded-[14px] bg-gradient-to-br from-blue-500 to-blue-600 text-white font-extrabold text-base border-none cursor-pointer">START WORKOUT →</button>
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
        <div className="fixed inset-0 bg-[#0a0a0a] z-[45] overflow-y-auto p-4">
            <div className="flex gap-3 items-center mb-4">
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search workouts, plans..." autoFocus
                    className="flex-1 py-3 px-4 rounded-xl text-sm bg-[#1a1a2e] border border-[#2a2a3e] text-gray-100" />
                <button onClick={onClose} className="bg-none border-none text-red-500 text-sm font-semibold cursor-pointer">Cancel</button>
            </div>
            {!query.trim() && (
                <>
                    <div className="text-base font-bold text-gray-100 mb-3">Workout Type</div>
                    <div className="grid grid-cols-2 gap-[10px] mb-5">
                        {[{ label: "Build Muscle", icon: "\u{1F4AA}" }, { label: "Warm-Up", icon: "\u{1F938}" }, { label: "Fat Burning", icon: "\u{1F525}" }, { label: "With Equipment", icon: "\u{1F3CB}️" }].map(t => (
                            <div key={t.label} onClick={() => setQuery(t.label)} className="bg-[#1a1a2e] rounded-xl p-4 flex items-center gap-[10px] cursor-pointer">
                                <span className="text-2xl">{t.icon}</span><span className="text-sm font-bold text-gray-100">{t.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="text-base font-bold text-gray-100 mb-3">Level</div>
                    <div className="flex gap-[10px] mb-5">
                        {["Beginner", "Intermediate", "Advanced"].map((lvl, i) => (
                            <button key={lvl} onClick={() => setQuery(lvl)} className={`py-2 px-5 rounded-[20px] text-[13px] font-semibold bg-transparent cursor-pointer ${i === 0 ? "border border-blue-500 text-blue-500" : i === 1 ? "border border-amber-500 text-amber-500" : "border border-red-500 text-red-500"}`}>{lvl}</button>
                        ))}
                    </div>
                </>
            )}
            {query.trim() && (
                <div>
                    {filtered.length === 0 && <div className="text-gray-500 text-center p-10">No workouts found</div>}
                    {filtered.map(w => (
                        <div key={w.id} onClick={() => { onClose(); onSelectWorkout(w); }} className="flex items-center gap-3 p-[14px] bg-[#1a1a2e] rounded-xl mb-2 cursor-pointer">
                            <div className="w-12 h-12 rounded-[10px] bg-slate-900 flex items-center justify-center text-xl">{"\u{1F3CB}️"}</div>
                            <div>
                                <div className="text-sm font-bold text-gray-100">{w.name}</div>
                                <div className="text-xs text-gray-500">{w.duration} {"·"} {w.exerciseCount} Exercises</div>
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
            <div className="flex justify-between items-center mb-4">
                <div className="text-[22px] font-black text-gray-100 font-heading tracking-[1px]">IGNITE TRAINING</div>
                <span className="text-xl">{"\u{1F525}"}</span>
            </div>

            {/* Search bar */}
            <div onClick={() => setShowSearch(true)} className="bg-[#1a1a2e] rounded-xl py-3 px-4 mb-4 flex items-center gap-[10px] cursor-pointer border border-[#2a2a3e]">
                <span className="text-gray-500">{"\u{1F50D}"}</span>
                <span className="text-gray-500 text-sm">Search workouts, plans...</span>
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
            <div className="h-[100px]" />

            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    );
}
