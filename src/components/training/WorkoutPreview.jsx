"use client";
// Workout overview / editor: every exercise with its visual demo, targeted
// muscles, time estimate; sets & reps can be edited, reordered, added, removed.
import { useMemo, useState } from "react";
import { Play, Save, Plus, Minus, ChevronUp, ChevronDown, Trash2, Clock, Flame, ListOrdered, Pencil } from "lucide-react";
import Sheet from "./Sheet";
import ExerciseDemo from "./ExerciseDemo";
import ExerciseSheet from "./ExerciseSheet";
import ExerciseLibrary, { toExerciseRef } from "./ExerciseLibrary";
import BodyMap from "./BodyMap";
import { getExerciseInfo, toWorkoutExercise } from "@/lib/exerciseVisuals";
import { exerciseHistory } from "@/lib/trainingStats";
import { MUSCLE_LABELS } from "@/lib/muscles";

export function estimateWorkout(exercises) {
    let sec = 0;
    exercises.forEach(ex => {
        const work = ex.duration ? ex.duration : (ex.reps || 12) * 3.2;
        sec += ex.sets * work + Math.max(0, ex.sets - 1) * (ex.rest || 0) + 30;
    });
    const minutes = Math.max(1, Math.round(sec / 60));
    return { minutes, calories: Math.round(minutes * 6.5), sets: exercises.reduce((s, e) => s + e.sets, 0) };
}

export const describeTarget = (ex) => `${ex.sets} × ${ex.duration ? `${ex.duration >= 60 && ex.duration % 60 === 0 ? `${ex.duration / 60} min` : `${ex.duration}s`}` : `${ex.reps} reps`}`;

function Stepper({ value, onChange, min = 1, max = 99, step = 1, label, suffix = "" }) {
    return (
        <div className="stepper" aria-label={label}>
            <button type="button" onClick={() => onChange(Math.max(min, value - step))} aria-label={`Decrease ${label}`}><Minus size={14} /></button>
            <span>{value}{suffix}</span>
            <button type="button" onClick={() => onChange(Math.min(max, value + step))} aria-label={`Increase ${label}`}><Plus size={14} /></button>
        </div>
    );
}

export default function WorkoutPreview({ workout, sessions = [], startEditing = false, onClose, onStart, onSave, onDelete }) {
    const [name, setName] = useState(workout.name || "My Workout");
    const [list, setList] = useState(() => (workout.exercises || []).map(toWorkoutExercise));
    const [editing, setEditing] = useState(startEditing);
    const [detail, setDetail] = useState(null);
    const [picking, setPicking] = useState(false);
    const [picked, setPicked] = useState(new Map());

    const est = estimateWorkout(list);
    const muscles = useMemo(() => {
        const p = new Set(), s = new Set();
        list.forEach(ex => { const i = getExerciseInfo(ex); i.primary.forEach(m => p.add(m)); i.secondary.forEach(m => s.add(m)); });
        p.forEach(m => s.delete(m));
        return { primary: [...p], secondary: [...s] };
    }, [list]);

    const update = (i, patch) => setList(l => l.map((ex, j) => j === i ? { ...ex, ...patch } : ex));
    const move = (i, d) => setList(l => { const c = [...l]; const j = i + d; if (j < 0 || j >= c.length) return l; [c[i], c[j]] = [c[j], c[i]]; return c; });
    const remove = (i) => setList(l => l.filter((_, j) => j !== i));
    const current = () => ({ ...workout, name: name.trim() || "My Workout", exercises: list });

    const togglePick = (ex) => setPicked(m => {
        const n = new Map(m);
        if (n.has(ex.name)) n.delete(ex.name);
        else n.set(ex.name, toWorkoutExercise(ex.app ? { name: ex.name } : { ...toExerciseRef(ex), sets: 3, reps: 10, rest: 60 }));
        return n;
    });

    return (
        <Sheet onClose={onClose} title={editing ? "Edit workout" : name} subtitle={`${list.length} exercises · ~${est.minutes} min`}
            right={onSave && !editing ? <button type="button" className="icon-btn" onClick={() => setEditing(true)} aria-label="Edit workout"><Pencil size={17} /></button> : null}
            footer={
                <div className="flex gap-2">
                    {onSave && (editing || startEditing) && <button type="button" className="bg flex-1" disabled={list.length === 0} onClick={() => { onSave(current()); setEditing(false); }}><Save size={16} /> Save</button>}
                    <button type="button" className="bp flex-[2]" disabled={list.length === 0} onClick={() => onStart(current())}><Play size={16} /> Start workout</button>
                </div>
            }>
            {editing && (
                <label className="block mb-3">
                    <span className="sl">Workout name</span>
                    <input className="inp" value={name} onChange={e => setName(e.target.value)} maxLength={60} />
                </label>
            )}

            <div className="grid grid-cols-3 gap-2 mb-3">
                {[[Clock, `${est.minutes} min`, "Duration"], [ListOrdered, est.sets, "Total sets"], [Flame, `~${est.calories}`, "kcal"]].map(([Icon, v, l]) => (
                    <div key={l} className="gs !p-3 text-center">
                        <Icon size={16} className="mx-auto mb-1" style={{ color: "var(--accent)" }} />
                        <div className="stat-num">{v}</div><div className="stat-lbl">{l}</div>
                    </div>
                ))}
            </div>

            {muscles.primary.length > 0 && (
                <div className="gs mb-3">
                    <div className="sl">Muscles targeted</div>
                    <div className="flex items-center gap-3">
                        <BodyMap primary={muscles.primary} secondary={muscles.secondary} height={130} labels={false} />
                        <div className="flex flex-wrap gap-1.5">
                            {muscles.primary.slice(0, 8).map(m => <span key={m} className="chip chip-a">{MUSCLE_LABELS[m] || m}</span>)}
                        </div>
                    </div>
                </div>
            )}

            <div className="sl mt-1">Exercises</div>
            <div className="flex flex-col gap-2">
                {list.map((ex, i) => {
                    const info = getExerciseInfo(ex);
                    return (
                        <div key={`${ex.name}-${i}`} className="ex-row">
                            <button type="button" className="ex-row-main" onClick={() => setDetail(ex)} aria-label={`${ex.name} — how to`}>
                                <div className="ex-thumb"><ExerciseDemo info={info} animate={false} rounded={10} showBadge={false} /></div>
                                <div className="min-w-0 flex-1 text-left">
                                    <div className="ex-name"><span className="ex-idx">{i + 1}</span>{ex.name}</div>
                                    <div className="ex-sub">{describeTarget(ex)} · rest {ex.rest}s</div>
                                    <div className="ex-sub">{info.primary.slice(0, 3).map(m => MUSCLE_LABELS[m] || m).join(", ")}</div>
                                </div>
                            </button>
                            {editing && (
                                <div className="ex-edit">
                                    <Stepper label="sets" value={ex.sets} onChange={v => update(i, { sets: v })} max={10} suffix=" sets" />
                                    {ex.duration
                                        ? <Stepper label="seconds" value={ex.duration} onChange={v => update(i, { duration: v })} min={5} max={1800} step={5} suffix="s" />
                                        : <Stepper label="reps" value={ex.reps} onChange={v => update(i, { reps: v })} max={100} suffix=" reps" />}
                                    <div className="flex gap-1 ml-auto">
                                        <button type="button" className="icon-btn !w-9 !h-9" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ChevronUp size={16} /></button>
                                        <button type="button" className="icon-btn !w-9 !h-9" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down"><ChevronDown size={16} /></button>
                                        <button type="button" className="icon-btn !w-9 !h-9" onClick={() => remove(i)} aria-label={`Remove ${ex.name}`} style={{ color: "#ef4444" }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {list.length === 0 && <div className="gs text-center text-[13px] py-8" style={{ color: "var(--text-secondary)" }}>No exercises yet — add some from the library.</div>}

            {(editing || startEditing) && (
                <button type="button" className="bg w-full mt-3" onClick={() => { setPicked(new Map()); setPicking(true); }}><Plus size={16} /> Add exercises</button>
            )}
            {onDelete && editing && (
                <button type="button" className="w-full mt-3 text-[13px] py-3" style={{ color: "#ef4444" }} onClick={() => { if (window.confirm("Delete this workout?")) onDelete(workout); }}>Delete workout</button>
            )}

            {picking && (
                <Sheet onClose={() => setPicking(false)} title="Add exercises" subtitle={`${picked.size} selected`} z={70}
                    footer={<button type="button" className="bp w-full" disabled={picked.size === 0} onClick={() => { setList(l => [...l, ...picked.values()]); setPicking(false); }}>Add {picked.size || ""} to workout</button>}>
                    <ExerciseLibrary onOpen={setDetail} onAdd={togglePick} picked={new Set(picked.keys())} />
                </Sheet>
            )}
            {detail && <ExerciseSheet exercise={detail} history={exerciseHistory(sessions, detail.name)} onClose={() => setDetail(null)} />}
        </Sheet>
    );
}
