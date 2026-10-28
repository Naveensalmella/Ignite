"use client";
// Programs: strength, combat, running, yoga/mobility, HIIT and mind programs,
// with progress tracking for the active one.
import { useMemo, useState } from "react";
import { Play, Calendar, Clock, Target, LogOut } from "lucide-react";
import Sheet from "./Sheet";
import ExerciseDemo from "./ExerciseDemo";
import { GYM_PROGRAMS, COMBAT_PROGRAMS, getTodayWorkout } from "@/data/trainingPrograms";
import { FITNESS_PROGRAMS, PROGRAM_TAGS, getRecommendedPrograms } from "@/data/fitnessPrograms";
import { getExerciseInfo, toWorkoutExercise } from "@/lib/exerciseVisuals";
import { Dumbbell, Flame, Swords, Footprints, Flower2, Brain } from "lucide-react";
import { IconBadge } from "../ui/kit";
import { today, parseDateKey, toArr } from "@/utils";

const CATEGORY = {
    strength: { label: "Strength", ids: ["beginner_muscle", "intermediate_muscle", "advanced_muscle", "home_bodyweight", "powerlifting", "calisthenics", "womens_tone"] },
    fatloss: { label: "Fat loss & HIIT", ids: ["fat_loss", "hiit_burner", "stamina"] },
    combat: { label: "Combat", ids: ["boxing", "kickboxing", "mma", "muay_thai", "martial_arts"] },
    running: { label: "Running", ids: ["couch_to_5k", "run_10k"] },
    mobility: { label: "Yoga & mobility", ids: ["yoga", "flexibility", "posture_fix", "senior_fit"] },
    mind: { label: "Mind", ids: ["meditation"] },
};
export const ALL_PROGRAMS = { ...GYM_PROGRAMS, ...COMBAT_PROGRAMS, ...FITNESS_PROGRAMS };
const categoryOf = (id) => Object.entries(CATEGORY).find(([, c]) => c.ids.includes(id))?.[0] || "strength";
const levelOf = (p) => p.level || PROGRAM_TAGS[p.id]?.tags.find(t => ["beginner", "intermediate", "advanced"].includes(t)) || "all levels";
const weeksOf = (p) => p.curriculum?.length || parseInt(p.duration, 10) || 12;
const CAT_ICON = { strength: Dumbbell, fatloss: Flame, combat: Swords, running: Footprints, mobility: Flower2, mind: Brain };
const CAT_TONE = { strength: "orange", fatloss: "rose", combat: "amber", running: "sky", mobility: "teal", mind: "violet" };
function ProgIcon({ p, size = 40 }) {
    const c = categoryOf(p.id);
    return <IconBadge icon={CAT_ICON[c] || Dumbbell} tone={CAT_TONE[c] || "sky"} size={size} />;
}

/** Program position for the active user: week index, session index, progress. */
export function programProgress(program, programState = {}) {
    const active = programState.activeProgram === program.id;
    const completed = active ? toArr(programState.completedDays) : [];
    const start = active && programState.startDate ? programState.startDate : today();
    const weeksSinceStart = Math.max(0, Math.floor((parseDateKey(today()) - parseDateKey(start)) / (7 * 864e5)));
    const perWeek = program.daysPerWeek || 3;
    const weekIdx = program.curriculum ? Math.min(Math.floor(completed.length / perWeek), program.curriculum.length - 1) : weeksSinceStart;
    const total = weeksOf(program) * perWeek;
    return { active, completed, weekIdx, sessionIdx: completed.length, total, pct: Math.min(100, Math.round((completed.length / total) * 100)), doneToday: completed.includes(today()) };
}

/** The workout for a program session (curriculum week or gym phase day). */
export function programSession(program, weekIdx, sessionIdx) {
    const data = getTodayWorkout(program, weekIdx, sessionIdx);
    if (!data) return null;
    if (program.curriculum) {
        const drills = toArr(data.drills).map(d => ({ name: d.name, sets: 1, reps: d.duration || "3 min", rest: 30, desc: d.desc }));
        return {
            id: `${program.id}_w${weekIdx + 1}`, programId: program.id, source: "program",
            trainingType: categoryOf(program.id) === "combat" ? "combat" : "fitness",
            name: `${program.name} · Week ${data.week || weekIdx + 1}: ${data.title || ""}`,
            focus: data.focus, skills: toArr(data.skills),
            exercises: [...drills, ...toArr(data.conditioning)].map(toWorkoutExercise),
        };
    }
    const exercises = toArr(data.day?.exercises).map(e => toWorkoutExercise(data.isDeload ? { ...e, sets: Math.max(2, (e.sets || 3) - 1) } : e));
    return {
        id: `${program.id}_${data.dayKey}`, programId: program.id, source: "program", trainingType: "gym",
        name: `${program.name} · ${data.day?.name || "Session"}`, focus: `${data.phase} — ${data.focus}${data.isDeload ? " · deload week" : ""}`,
        exercises,
    };
}

function ProgramCard({ p, active, onOpen }) {
    return (
        <button type="button" className={`prog-card ${active ? "is-active" : ""}`} onClick={() => onOpen(p)}>
            <div className="prog-icon"><ProgIcon p={p} size={38} /></div>
            <div className="prog-name">{p.name}</div>
            <div className="prog-desc">{p.desc}</div>
            <div className="prog-meta">
                <span>{weeksOf(p)} wk</span><span>{p.daysPerWeek}×/wk</span><span className="capitalize">{levelOf(p)}</span>
            </div>
            {active && <div className="prog-badge">Active</div>}
        </button>
    );
}

export function ProgramSheet({ program, programState, onClose, onActivate, onLeave, onPreview }) {
    const prog = programProgress(program, programState);
    const [week, setWeek] = useState(prog.weekIdx);
    const next = programSession(program, prog.weekIdx, prog.sessionIdx);
    const browse = program.curriculum ? program.curriculum[week] : null;

    return (
        <Sheet onClose={onClose} title={program.name} subtitle={`${weeksOf(program)} weeks · ${program.daysPerWeek} sessions per week`}
            footer={prog.active
                ? <button type="button" className="bp w-full" disabled={!next} onClick={() => onPreview(next)}><Play size={16} /> {prog.doneToday ? "Train again" : "Start next session"}</button>
                : <button type="button" className="bp w-full" onClick={() => onActivate(program.id)}>Start this program</button>}>
            <div className="card mb-3">
                <div className="flex gap-3 items-start">
                    <ProgIcon p={program} size={44} />
                    <div className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{program.desc}</div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                    <span className="chip chip-i gap-1"><Clock size={12} />{program.duration || `${weeksOf(program)} weeks`}</span>
                    {program.schedule && <span className="chip chip-i gap-1"><Calendar size={12} />{program.schedule.join(" · ")}</span>}
                    <span className="chip chip-i gap-1 capitalize"><Target size={12} />{levelOf(program)}</span>
                </div>
                {prog.active && (
                    <div className="mt-4">
                        <div className="flex justify-between text-[12px] mb-1.5" style={{ color: "var(--text-secondary)" }}>
                            <span>{prog.completed.length} of {prog.total} sessions</span><span>{prog.pct}%</span>
                        </div>
                        <div className="progress"><div style={{ width: `${prog.pct}%` }} /></div>
                    </div>
                )}
            </div>

            {next && (
                <div className="gs mb-3">
                    <div className="sl">{prog.active ? "Next session" : "First session"}</div>
                    <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{next.name.split(" · ").slice(1).join(" · ")}</div>
                    {next.focus && <div className="text-[12px] mb-3" style={{ color: "var(--text-dim)" }}>{next.focus}</div>}
                    <div className="thumb-strip">
                        {next.exercises.slice(0, 6).map((ex, i) => (
                            <div key={i} className="thumb-strip-item" title={ex.name}><ExerciseDemo info={getExerciseInfo(ex)} animate={false} rounded={10} showBadge={false} /></div>
                        ))}
                    </div>
                    <button type="button" className="bg w-full mt-3" onClick={() => onPreview(next)}>See all {next.exercises.length} exercises</button>
                </div>
            )}

            {program.curriculum && (
                <div className="gs mb-3">
                    <div className="sl">Curriculum</div>
                    <div className="chip-row mb-3">
                        {program.curriculum.map((w, i) => (
                            <button key={i} type="button" className={`chip ${week === i ? "chip-a" : "chip-i"}`} onClick={() => setWeek(i)}>
                                {prog.active && i < prog.weekIdx ? "✓ " : ""}Week {w.week || i + 1}
                            </button>
                        ))}
                    </div>
                    {browse && (
                        <>
                            <div className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>{browse.title}</div>
                            <div className="text-[12px] mb-2" style={{ color: "var(--text-dim)" }}>{browse.focus}</div>
                            <ul className="flex flex-col gap-1.5 mb-3">
                                {toArr(browse.skills).map((s, i) => <li key={i} className="text-[13px]" style={{ color: "var(--text-secondary)" }}>• {s}</li>)}
                            </ul>
                            <button type="button" className="bg w-full" onClick={() => onPreview(programSession(program, week, 0))}>Preview week {browse.week || week + 1}</button>
                        </>
                    )}
                </div>
            )}

            {!program.curriculum && toArr(program.phases).length > 0 && (
                <div className="gs mb-3">
                    <div className="sl">Phases</div>
                    {program.phases.map((ph, i) => (
                        <div key={i} className="py-2" style={{ borderTop: i ? "1px solid var(--border)" : "none" }}>
                            <div className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>Weeks {ph.weeks}: {ph.name}</div>
                            <div className="text-[12px]" style={{ color: "var(--text-dim)" }}>{ph.focus}</div>
                            <div className="text-[12px] mt-1" style={{ color: "var(--text-secondary)" }}>{Object.values(ph.days || {}).map(d => d.name).join(" · ")}</div>
                        </div>
                    ))}
                </div>
            )}

            {program.tips && <div className="gs mb-3 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>💡 {program.tips}</div>}

            {prog.active && (
                <button type="button" className="w-full flex items-center justify-center gap-2 text-[13px] py-3" style={{ color: "#ef4444" }}
                    onClick={() => { if (window.confirm("Leave this program? Your progress in it will be reset.")) onLeave(); }}>
                    <LogOut size={15} /> Leave program
                </button>
            )}
        </Sheet>
    );
}

export default function ProgramsTab({ programState, profile, onOpen }) {
    const [cat, setCat] = useState("all");
    const activeId = programState?.activeProgram;
    const { gender, age, goal } = profile || {};
    const recommended = useMemo(() => {
        try { return getRecommendedPrograms(gender, age, goal).slice(0, 4).map(r => ALL_PROGRAMS[r.id || r]).filter(Boolean); }
        catch { return []; }
    }, [gender, age, goal]);
    const list = Object.values(ALL_PROGRAMS).filter(p => cat === "all" || categoryOf(p.id) === cat);

    return (
        <div>
            {cat === "all" && recommended.length > 0 && (
                <>
                    <div className="sl">Recommended for you</div>
                    <div className="h-scroll mb-4">
                        {recommended.map(p => <div key={p.id} className="w-[220px] shrink-0"><ProgramCard p={p} active={p.id === activeId} onOpen={onOpen} /></div>)}
                    </div>
                </>
            )}
            <div className="chip-row mb-3">
                {[["all", "All"], ...Object.entries(CATEGORY).map(([k, c]) => [k, c.label])].map(([k, l]) => (
                    <button key={k} type="button" className={`chip ${cat === k ? "chip-a" : "chip-i"}`} onClick={() => setCat(k)}>{l}</button>
                ))}
            </div>
            <div className="prog-grid">
                {list.map(p => <ProgramCard key={p.id} p={p} active={p.id === activeId} onOpen={onOpen} />)}
            </div>
        </div>
    );
}
