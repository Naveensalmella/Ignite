// Player stats, earned from real activity (history) plus allocated Ability Points.
import { toArr, habitDoneIds } from "@/utils";
import { getDayEntries } from "@/lib/workoutHelpers";
import { classifyPattern } from "@/lib/exerciseVisuals";

export const STATS = [
    { key: "str", label: "STR", name: "Strength", color: "#f87171", desc: "Strength training — every completed set" },
    { key: "agi", label: "AGI", name: "Agility", color: "#facc15", desc: "Cardio, running, combat & HIIT" },
    { key: "vit", label: "VIT", name: "Vitality", color: "#4ade80", desc: "Meals, water, mobility & showing up to train" },
    { key: "int", label: "INT", name: "Intelligence", color: "#60a5fa", desc: "Focus sessions, missions & money tracking" },
    { key: "per", label: "PER", name: "Perception", color: "#c084fc", desc: "Habits, journaling & meditation" },
];
export const STAT_KEYS = STATS.map(s => s.key);
export const BASE_STAT = 10;
export const AP_PER_LEVEL = 3;
export const emptyStats = () => Object.fromEntries(STAT_KEYS.map(k => [k, 0]));

const AGI_PATTERNS = new Set(["burpee", "sprawl", "mountain_climber", "bear_crawl", "jumping_jack", "jump_rope", "high_knees", "jump_squat", "jog", "walk", "front_kick", "side_kick", "roundhouse_kick", "knee_strike", "elbow_strike", "clinch", "level_change", "ground_strikes", "block", "hook_uppercut", "jab_cross", "shadow_boxing", "boxing_stance", "leg_swing"]);
const VIT_PATTERNS = new Set(["wall_sit", "horse_stance", "warrior", "tree_pose", "downward_dog", "child_pose", "cobra", "cat_cow", "forward_fold", "arm_circles", "hip_circles", "lying_rest", "meditate", "side_stretch"]);

// Only finished sets count. Old entries without per-set `done` flags count every logged set;
// a plain number of sets (legacy) counts up to 10.
const setCount = (ex) => {
    if (typeof ex.sets === "number" || typeof ex.sets === "string") return Math.min(10, Math.max(0, Number(ex.sets) || 0));
    const sets = toArr(ex.sets).filter(s => s && typeof s === "object");
    const flagged = sets.some(s => "done" in s);
    return sets.filter(s => (flagged ? s.done === true : true)).length;
};

/** Stat points earned from history (fractional; the UI floors them). */
export function earnedStats({ workoutLog, foodLog, focusLog, journal, habitLog, tasks, finances, system } = {}) {
    const e = emptyStats();

    for (const date of Object.keys(workoutLog || {})) {
        for (const s of getDayEntries(workoutLog, date)) {
            if (!s || typeof s !== "object") continue;
            let counted = 0;
            const exercises = toArr(s.gym?.exercises ?? s.exercises).filter(ex => ex?.name);
            for (const ex of exercises) {
                const n = setCount(ex);
                if (!n) continue;
                const p = classifyPattern(ex.name);
                e[AGI_PATTERNS.has(p) ? "agi" : VIT_PATTERNS.has(p) ? "vit" : "str"] += n * 0.05;
                counted += n;
            }
            if (exercises.length && !counted) continue; // logged, but no set was finished
            if (!counted) e[s.trainingType === "combat" || s.trainingType === "fitness" ? "agi" : "str"] += 0.6;
            e.vit += 0.15; // showing up
        }
    }

    for (const [k, v] of Object.entries(foodLog || {})) {
        if (k.startsWith("_")) continue; // app settings like _savedPlans, not days
        if (k.startsWith("water_")) { if ((Number(v) || 0) >= 8) e.vit += 0.15; }
        else if (toArr(v).length > 0) e.vit += 0.25;
    }

    for (const day of Object.values(focusLog || {})) {
        for (const sess of toArr(day)) e.int += (Number(sess?.duration) || 0) / 50;
    }
    e.int += toArr(tasks).filter(t => t?.done).length * 0.3;
    e.int += Math.min(200, toArr(finances).length) * 0.04;

    for (const entry of Object.values(journal || {})) {
        if (!entry) continue;
        e.per += 0.25;
        e.per += (Number(entry.meditationMin) || 0) / 30;
    }
    for (const day of Object.values(habitLog || {})) e.per += habitDoneIds(day).length * 0.1;

    const quests = Object.values(system?.questLog || {}).filter(q => q?.claimed).length + (Number(system?.questArchive) || 0);
    e.str += quests * 0.3; e.agi += quests * 0.3; e.vit += quests * 0.3;

    const bonus = system?.bonusStats || {};
    STAT_KEYS.forEach(k => { e[k] += Number(bonus[k]) || 0; });
    return e;
}

/** Full stat sheet: [{ ...STAT, earned, allocated, total }]. */
export function statSheet(data, system) {
    const e = earnedStats({ ...data, system });
    const alloc = system?.allocated || {};
    return STATS.map(s => {
        const earned = Math.floor(e[s.key]);
        const allocated = Number(alloc[s.key]) || 0;
        return { ...s, earned, allocated, total: BASE_STAT + earned + allocated, progress: e[s.key] - earned };
    });
}
