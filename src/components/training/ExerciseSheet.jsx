"use client";
// Exercise detail: visual demo, target muscles, step-by-step instructions,
// form tips and the user's own history with the movement.
import { useState } from "react";
import { Play, Plus, Dumbbell, Gauge, Layers, Trophy } from "lucide-react";
import Sheet from "./Sheet";
import ExerciseDemo from "./ExerciseDemo";
import BodyMap from "./BodyMap";
import { getExerciseInfo } from "@/lib/exerciseVisuals";
import useExerciseCatalog from "@/lib/useExerciseCatalog";
import { MUSCLE_LABELS } from "@/lib/muscles";
import { fmtDate } from "@/lib/trainingStats";

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

export default function ExerciseSheet({ exercise, history, onClose, onStart, onAdd, addLabel = "Add to workout" }) {
    const [view, setView] = useState("demo");
    const info = getExerciseInfo(exercise);
    const { catalog } = useExerciseCatalog(!!info.datasetId);
    const entry = info.datasetId ? catalog?.byId.get(info.datasetId) : null;

    const steps = entry?.instructions?.length ? entry.instructions : (info.steps.length ? info.steps : exercise?.instructions || []);
    const level = entry?.level || info.level;
    const equipment = entry?.equipment || info.equipment;
    const meta = [
        level && { Icon: Gauge, label: cap(level) },
        equipment && { Icon: Dumbbell, label: cap(equipment) },
        entry?.mechanic && { Icon: Layers, label: cap(entry.mechanic) },
        (entry?.category || info.category) && { Icon: null, label: cap(entry?.category || info.category) },
    ].filter(Boolean);

    return (
        <Sheet onClose={onClose} title={info.name} subtitle={info.primary.map(m => MUSCLE_LABELS[m] || m).join(" · ") || "Exercise guide"} z={80}
            footer={(onStart || onAdd) && (
                <div className="flex gap-2">
                    {onAdd && <button type="button" className={onStart ? "bg flex-1" : "bp flex-1"} onClick={() => onAdd(exercise)}><Plus size={16} /> {addLabel}</button>}
                    {onStart && <button type="button" className="bp flex-1" onClick={() => onStart(exercise)}><Play size={16} /> Try it now</button>}
                </div>
            )}>
            <div className="seg mb-3" role="tablist">
                {[["demo", "How it looks"], ["muscles", "Muscles"]].map(([k, l]) => (
                    <button key={k} type="button" role="tab" aria-selected={view === k} className={view === k ? "is-active" : ""} onClick={() => setView(k)}>{l}</button>
                ))}
            </div>
            <div className="demo-frame mb-4">
                {view === "demo"
                    ? <ExerciseDemo info={info} height="100%" />
                    : <div className="h-full flex items-center justify-center py-4"><BodyMap primary={info.primary} secondary={info.secondary} height={250} /></div>}
            </div>

            {meta.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {meta.map(m => <span key={m.label} className="chip chip-i gap-1.5">{m.Icon && <m.Icon size={13} />}{m.label}</span>)}
                </div>
            )}

            {(info.primary.length > 0 || info.secondary.length > 0) && (
                <div className="gs mb-3">
                    <div className="sl">Target muscles</div>
                    <div className="flex flex-wrap gap-1.5">
                        {info.primary.map(m => <span key={m} className="chip chip-a">{MUSCLE_LABELS[m] || m}</span>)}
                        {info.secondary.map(m => <span key={m} className="chip chip-i">{MUSCLE_LABELS[m] || m}</span>)}
                    </div>
                </div>
            )}

            {history && history.times > 0 && (
                <div className="gs mb-3">
                    <div className="sl flex items-center gap-1.5"><Trophy size={13} /> Your history</div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div><div className="stat-num">{history.times}</div><div className="stat-lbl">Sessions</div></div>
                        <div><div className="stat-num">{history.bestWeight > 0 ? `${history.bestWeight}kg` : "—"}</div><div className="stat-lbl">Best weight</div></div>
                        <div><div className="stat-num text-[15px]">{history.lastDate ? fmtDate(history.lastDate) : "—"}</div><div className="stat-lbl">Last done</div></div>
                    </div>
                </div>
            )}

            {steps.length > 0 && (
                <div className="gs mb-3">
                    <div className="sl">How to do it</div>
                    <ol className="steps">
                        {steps.map((s, i) => <li key={i}><span className="step-n">{i + 1}</span><span>{s}</span></li>)}
                    </ol>
                </div>
            )}

            {info.tips.length > 0 && (
                <div className="gs mb-3" style={{ borderColor: "rgba(245,158,11,.25)" }}>
                    <div className="sl" style={{ color: "#f59e0b" }}>Form tips</div>
                    <ul className="flex flex-col gap-2">
                        {info.tips.map((t, i) => <li key={i} className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>💡 {t}</li>)}
                    </ul>
                </div>
            )}

            {info.frames && <p className="text-[11px] text-center mt-2" style={{ color: "var(--text-dim)" }}>Photos: free-exercise-db (public domain)</p>}
        </Sheet>
    );
}
