// Daily Quest ("Preparations to become powerful"), Penalty Zone and quest bookkeeping.
import { toArr, addDays } from "@/utils";
import { rankIndex } from "./ranks";

export const QUEST_TEMPLATE = [
    { id: "pushups", name: "Push-ups", unit: "reps", pattern: "pushup" },
    { id: "situps", name: "Sit-ups", unit: "reps", pattern: "crunch" },
    { id: "squats", name: "Squats", unit: "reps", pattern: "squat" },
    { id: "run", name: "Running", unit: "km", pattern: "jog" },
];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Template target for a level: 10 reps / 1 km at Lv 1, up to the anime's 100 reps / 10 km. */
export function templateTarget(id, lv) {
    if (id === "run") return clamp(Math.round((1 + lv * 0.1) * 2) / 2, 1, 10);
    if (QUEST_TEMPLATE.some(t => t.id === id)) return clamp(Math.round((10 + lv * 2) / 5) * 5, 10, 100);
    return null;
}

/** Today's quest items with targets. Template items marked `auto` scale with level. */
export function questItems(system, lv) {
    const custom = toArr(system?.quest?.items).filter(i => i && i.id && i.name);
    const list = custom.length ? custom : QUEST_TEMPLATE.map(t => ({ ...t, auto: true }));
    return list.map(i => {
        const auto = i.auto ? templateTarget(i.id, lv) : null;
        return { ...i, target: auto ?? Math.max(0.5, Number(i.target) || 1) };
    });
}

export const questDay = (system, date) => system?.questLog?.[date] || { progress: {} };

export function questStatus(items, day) {
    const val = (i) => Number(day?.progress?.[i.id]) || 0;
    const pct = items.length ? items.reduce((a, i) => a + Math.min(1, val(i) / i.target), 0) / items.length : 0;
    return {
        pct,
        done: items.length > 0 && items.every(i => val(i) >= i.target),
        over: items.length > 0 && items.every(i => val(i) >= i.target * 2),
    };
}

export function questRewards(rankId) {
    const r = rankIndex(rankId);
    return { xp: 40 + 15 * r, gold: 50 + 25 * r, ap: 1, boxChance: 0.25 };
}

export const OVERACHIEVE_BONUS = { gold: 100, ap: 1 };

export function msToMidnight(now = new Date()) {
    const m = new Date(now);
    m.setHours(24, 0, 0, 0);
    return m - now;
}

/** Keep ~6 weeks of quest days in the main document; older cleared days become a counter. */
export function pruneQuestLog(system, todayKey) {
    const cutoff = addDays(-42, todayKey);
    const questLog = {};
    let archived = Number(system?.questArchive) || 0;
    for (const [k, v] of Object.entries(system?.questLog || {})) {
        if (k >= cutoff) questLog[k] = v;
        else if (v?.claimed) archived++;
    }
    return { questLog, questArchive: archived };
}

// Penalty Zone: survive 5 minutes of non-stop movement (30 s per move).
export const PENALTY_MOVES = [
    { name: "Burpees", pattern: "burpee" },
    { name: "Mountain climbers", pattern: "mountain_climber" },
    { name: "Jump squats", pattern: "jump_squat" },
    { name: "High knees", pattern: "high_knees" },
    { name: "Plank hold", pattern: "plank" },
];
export const PENALTY_SECONDS = 300;
export const PENALTY_INTERVAL = 30;
