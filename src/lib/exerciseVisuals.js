// ══════════════════════════════════════════════════════════════
// Exercise knowledge: how to SHOW and EXPLAIN any exercise name.
//
// Sources, in order of preference:
//  1. Photo demo — free-exercise-db (public domain) start/end photos.
//     Curated matches for the app's own exercises are in
//     data/exerciseVisualMap.json and their images are bundled in
//     /public/exercises (built by scripts/build_exercise_assets.py).
//  2. Animated figure — every exercise also has a movement pattern for
//     <MoveFigure>, so combat drills, yoga and anything new (AI-generated
//     names) still get a demo.
// ══════════════════════════════════════════════════════════════
import VISUAL_MAP from "@/data/exerciseVisualMap.json";
import { EXERCISES, FIGHTING, WARMUP, COOLDOWN, RUNNING, YOGA, HIIT } from "@/data/exercises";
import { FORM_TIPS } from "@/data/exerciseMeta";
import { normalizeMuscles } from "./muscles";
import { classifyPattern } from "./movePattern";

export const DATASET_SHA = "f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5";
const REMOTE = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${DATASET_SHA}/exercises/`;

const key = (s) => String(s || "").toLowerCase().replace(/\(.*?\)/g, " ").replace(/[^a-z0-9]+/g, " ").replace(/\b(\w+?)s\b/g, "$1").trim();

const VENDORED = new Set(Object.values(VISUAL_MAP).map(v => v.id).filter(Boolean));
const MAP_BY_KEY = new Map(Object.entries(VISUAL_MAP).map(([n, v]) => [key(n), { name: n, ...v }]));

/** Photo frame URLs for a dataset id (bundled copy when we have one). */
export function photoFrames(datasetId) {
    if (!datasetId) return null;
    if (VENDORED.has(datasetId)) return [`/exercises/${datasetId}/0.webp`, `/exercises/${datasetId}/1.webp`];
    const base = REMOTE + encodeURIComponent(datasetId);
    return [`${base}/0.jpg`, `${base}/1.jpg`];
}

// ── App-authored exercise details (steps, tips, difficulty, calories) ──
const APP_INFO = new Map();
const addInfo = (e, extra = {}) => { if (e?.name && !APP_INFO.has(key(e.name))) APP_INFO.set(key(e.name), { ...e, ...extra }); };
for (const [equip, parts] of Object.entries(EXERCISES)) for (const list of Object.values(parts)) list.forEach(e => addInfo(e, { equipment: equip === "gym" ? "gym" : "body only" }));
for (const list of Object.values(FIGHTING)) list.forEach(e => addInfo(e, { category: "combat" }));
for (const list of Object.values(RUNNING)) list.forEach(e => addInfo(e, { category: "cardio" }));
[...WARMUP, ...COOLDOWN, ...YOGA, ...HIIT].forEach(e => addInfo(e));

// Fallback movement classification lives in ./movePattern (Home's stats use it without this file's data).
export { classifyPattern };

// Token-overlap similarity for names not in the curated map (e.g. AI output).
function similarity(a, b) {
    const A = new Set(a.split(" ")), B = new Set(b.split(" "));
    let inter = 0;
    A.forEach(t => { if (B.has(t)) inter++; });
    return (2 * inter) / (A.size + B.size || 1);
}

// Fuzzy matches scan the whole map, so remember every answer (names repeat constantly).
const LOOKUP_CACHE = new Map();
function lookupMap(name) {
    const k = key(name);
    if (MAP_BY_KEY.has(k)) return MAP_BY_KEY.get(k);
    if (LOOKUP_CACHE.has(k)) return LOOKUP_CACHE.get(k);
    let best = null, score = 0;
    for (const [mk, v] of MAP_BY_KEY) {
        const s = similarity(k, mk);
        if (s > score) { score = s; best = v; }
    }
    const hit = score >= 0.8 ? best : null;
    LOOKUP_CACHE.set(k, hit);
    return hit;
}

// Results are pure functions of the input: cache by name (strings) or by object identity.
const INFO_BY_NAME = new Map();
const INFO_BY_OBJ = new WeakMap();

/**
 * Everything the UI needs to demonstrate an exercise.
 * @param ex  exercise object or name. Library exercises carry `datasetId`.
 * @returns { name, frames: [url,url] | null, datasetId, pattern, primary, secondary, steps, tips, level, equipment, category }
 */
export function getExerciseInfo(ex) {
    if (typeof ex === "string") {
        let hit = INFO_BY_NAME.get(ex);
        if (!hit) { hit = buildExerciseInfo({ name: ex }); INFO_BY_NAME.set(ex, hit); }
        return hit;
    }
    if (ex && typeof ex === "object") {
        const hit = INFO_BY_OBJ.get(ex);
        if (hit && hit.name === (ex.name || "Exercise")) return hit; // guard against in-place edits
        const info = buildExerciseInfo(ex);
        INFO_BY_OBJ.set(ex, info);
        return info;
    }
    return buildExerciseInfo({});
}

function buildExerciseInfo(obj) {
    const name = obj.name || "Exercise";
    const mapped = lookupMap(name);
    const app = APP_INFO.get(key(name)) || (mapped ? APP_INFO.get(key(mapped.name)) : null) || {};
    const datasetId = obj.datasetId || mapped?.id || null;
    const fromApp = normalizeMuscles(app.muscle || obj.muscle || obj.bodyPart || "");
    const primary = obj.primary?.length ? obj.primary : mapped?.primary?.length ? mapped.primary : fromApp.slice(0, 2);
    const secondary = obj.secondary?.length ? obj.secondary : mapped?.secondary?.length ? mapped.secondary : fromApp.slice(2);
    const tip = FORM_TIPS[name] || (mapped ? FORM_TIPS[mapped.name] : null);
    return {
        name,
        datasetId,
        frames: photoFrames(datasetId),
        pattern: mapped?.pattern || classifyPattern(name, { anim: app.anim || obj.anim, bodyPart: app.bodyPart || obj.bodyPart }),
        primary,
        secondary: secondary.filter(m => !primary.includes(m)),
        steps: obj.steps || app.steps || [],
        tips: [...(tip ? [tip] : []), ...(obj.tips || app.tips || [])],
        level: obj.level || (app.difficulty ? ["", "beginner", "intermediate", "expert"][app.difficulty] : null),
        equipment: obj.equipment || app.equipment || null,
        category: obj.category || app.category || null,
        cal: app.cal || null,
    };
}

/** Normalise an exercise from any source into the workout player's shape. */
export function toWorkoutExercise(ex) {
    const e = typeof ex === "string" ? { name: ex } : { ...ex };
    const app = APP_INFO.get(key(e.name)) || {};
    const timedFlag = e.timed ?? app.timed;
    let reps = e.reps, duration = e.duration;
    if (typeof duration === "string" || typeof reps === "string") {
        const txt = String(reps ?? duration);
        const m = /(\d+)\s*(s|sec|secs|seconds|min|mins|minutes)\b/i.exec(txt);
        if (m) { duration = /^m/i.test(m[2]) ? Number(m[1]) * 60 : Number(m[1]); reps = undefined; }
        else { reps = parseInt(txt, 10) || 12; duration = undefined; }
    } else if (timedFlag && reps && !duration) {
        duration = Number(reps); reps = undefined;
    }
    return {
        name: e.name,
        sets: Math.max(1, Number(e.sets) || 3),
        ...(duration ? { duration: Number(duration) } : { reps: Number(reps) || 12 }),
        rest: Number(e.rest ?? 45) || 0,
        ...(e.datasetId ? { datasetId: e.datasetId } : {}),
        ...(e.primary?.length ? { primary: e.primary, secondary: e.secondary || [] } : {}),
        ...(e.bodyPart ? { bodyPart: e.bodyPart } : {}),
        ...(e.desc ? { desc: e.desc } : {}),
        ...(e.progression ? { progression: e.progression } : {}),
    };
}

/** Exercises that exist only in the app (combat, yoga, runs…) — shown in the library next to the catalog. */
export function appOnlyExercises() {
    return Object.entries(VISUAL_MAP)
        .filter(([n, v]) => !v.id && APP_INFO.has(key(n))) // authored drills only, not session names
        .map(([name, v]) => {
            const info = APP_INFO.get(key(name)) || {};
            return { id: `app:${name}`, name, primary: v.primary, secondary: v.secondary, pattern: v.pattern, equipment: "body only", category: info.category || (/(stretch|yoga|pose|breath|meditat|flow)/i.test(name) ? "stretching" : "app"), level: info.difficulty ? ["", "beginner", "intermediate", "expert"][info.difficulty] : "beginner", instructions: info.steps || [], app: true };
        });
}
