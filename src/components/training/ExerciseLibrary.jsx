"use client";
// Browsable exercise library (870+ exercises with photo demos, plus the app's
// own combat / yoga / cardio drills with animated demos).
import { useDeferredValue, useMemo, useState } from "react";
import { Search, Plus, Check, X } from "lucide-react";
import ExerciseDemo from "./ExerciseDemo";
import useExerciseCatalog from "@/lib/useExerciseCatalog";
import { appOnlyExercises, getExerciseInfo } from "@/lib/exerciseVisuals";
import { MUSCLE_GROUPS, MUSCLE_LABELS } from "@/lib/muscles";

const GROUPS = [["all", "All"], ["chest", "Chest"], ["back", "Back"], ["shoulders", "Shoulders"], ["arms", "Arms"], ["core", "Core"], ["legs", "Legs"], ["glutes", "Glutes"], ["cardio", "Cardio & Combat"], ["stretch", "Stretch & Yoga"]];
const EQUIP = [["any", "Any equipment"], ["body only", "Bodyweight"], ["dumbbell", "Dumbbell"], ["barbell", "Barbell"], ["kettlebells", "Kettlebell"], ["cable", "Cable"], ["machine", "Machine"], ["bands", "Bands"]];
const LEVELS = [["any", "Any level"], ["beginner", "Beginner"], ["intermediate", "Intermediate"], ["expert", "Advanced"]];
const PAGE = 36;

const norm = (s) => String(s || "").toLowerCase();

function matchesGroup(ex, g) {
    if (g === "all") return true;
    if (g === "cardio") return ex.category === "cardio" || ex.category === "plyometrics" || ex.category === "combat" || (ex.app && ex.category === "app");
    if (g === "stretch") return ex.category === "stretching" || /yoga|pose|stretch/.test(norm(ex.name));
    return ex.primary?.some(m => MUSCLE_GROUPS[g]?.includes(m));
}

/** Library entry → exercise reference understood by getExerciseInfo / the workout player. */
export const toExerciseRef = (ex) => ex.app
    ? { name: ex.name }
    : { name: ex.name, datasetId: ex.id, primary: ex.primary, secondary: ex.secondary, level: ex.level, equipment: ex.equipment, category: ex.category, instructions: ex.instructions };

function Card({ ex, onOpen, onAdd, picked }) {
    const info = getExerciseInfo(toExerciseRef(ex));
    return (
        <div className={`lib-card ${picked ? "is-picked" : ""}`}>
            <button type="button" className="lib-card-main" onClick={() => onOpen(toExerciseRef(ex))} aria-label={`${ex.name} details`}>
                <div className="lib-thumb"><ExerciseDemo info={info} animate={false} rounded={12} showBadge={false} /></div>
                <div className="lib-name">{ex.name}</div>
                <div className="lib-meta">{(ex.primary || []).slice(0, 2).map(m => MUSCLE_LABELS[m] || m).join(" · ") || "Full body"}</div>
            </button>
            {onAdd && (
                <button type="button" className={`lib-add ${picked ? "is-on" : ""}`} onClick={() => onAdd(ex)} aria-label={picked ? `Remove ${ex.name}` : `Add ${ex.name}`}>
                    {picked ? <Check size={16} /> : <Plus size={16} />}
                </button>
            )}
        </div>
    );
}

/**
 * @param onOpen   open an exercise's detail sheet
 * @param onAdd    (picker mode) toggle an exercise in the selection
 * @param picked   Set of selected exercise names (picker mode)
 */
export default function ExerciseLibrary({ onOpen, onAdd, picked }) {
    const { catalog, error } = useExerciseCatalog(true);
    const [q, setQ] = useState("");
    const [group, setGroup] = useState("all");
    const [equip, setEquip] = useState("any");
    const [level, setLevel] = useState("any");
    const [limit, setLimit] = useState(PAGE);
    const dq = useDeferredValue(q);

    const all = useMemo(() => {
        const appOnes = appOnlyExercises();
        const cat = (catalog?.list || []).filter(e => e.imgs >= 1);
        // Bundled (curated) photo exercises first — the ones the app's workouts use —
        // then the app's own drills (animated), then the rest of the catalog.
        return [...cat.filter(e => e.v), ...appOnes, ...cat.filter(e => !e.v)];
    }, [catalog]);

    const results = useMemo(() => {
        const terms = norm(dq).split(/\s+/).filter(Boolean);
        return all.filter(ex =>
            matchesGroup(ex, group)
            && (equip === "any" || norm(ex.equipment) === equip)
            && (level === "any" || norm(ex.level) === level)
            && terms.every(t => norm(ex.name).includes(t) || (ex.primary || []).some(m => m.includes(t)) || norm(ex.equipment).includes(t))
        );
    }, [all, dq, group, equip, level]);

    const reset = (fn) => (v) => { fn(v); setLimit(PAGE); };

    return (
        <div>
            <div className="search-box mb-3">
                <Search size={16} />
                <input value={q} onChange={e => reset(setQ)(e.target.value)} placeholder="Search 900+ exercises, muscles, equipment…" aria-label="Search exercises" />
                {q && <button type="button" onClick={() => reset(setQ)("")} aria-label="Clear search"><X size={16} /></button>}
            </div>
            <div className="chip-row mb-2">
                {GROUPS.map(([k, l]) => <button key={k} type="button" className={`chip ${group === k ? "chip-a" : "chip-i"}`} onClick={() => reset(setGroup)(k)}>{l}</button>)}
            </div>
            <div className="flex gap-2 mb-3">
                <select className="inp !py-2 text-[13px]" value={equip} onChange={e => reset(setEquip)(e.target.value)} aria-label="Equipment">
                    {EQUIP.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <select className="inp !py-2 text-[13px]" value={level} onChange={e => reset(setLevel)(e.target.value)} aria-label="Level">
                    {LEVELS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
            </div>

            {error && !catalog && <div className="gs text-center text-[13px] mb-3" style={{ color: "var(--text-secondary)" }}>{error} Showing the app&apos;s built-in drills.</div>}
            <div className="text-[12px] mb-2" style={{ color: "var(--text-dim)" }}>{catalog ? `${results.length} exercises` : "Loading library…"}</div>

            <div className="lib-grid">
                {results.slice(0, limit).map(ex => <Card key={ex.id} ex={ex} onOpen={onOpen} onAdd={onAdd} picked={picked?.has(ex.name)} />)}
            </div>
            {results.length === 0 && catalog && <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-dim)" }}>No exercises match these filters.</div>}
            {results.length > limit && (
                <button type="button" className="bg w-full mt-3" onClick={() => setLimit(l => l + PAGE)}>Show more ({results.length - limit} left)</button>
            )}
        </div>
    );
}
