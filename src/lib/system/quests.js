// Daily Quest ("Preparations to become powerful"), Penalty Zone and quest bookkeeping.
import { toArr, addDays, dateKey } from "@/utils";
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

// ── Difficulty: an edited quest must stay close to the System template for your level ──
// Effort per unit, in "reps": 1 km ≈ 15 reps, 1 s ≈ 0.5 reps, 1 min ≈ 30 reps.
const EFFORT = { reps: 1, km: 15, sec: 0.5, min: 30 };
export const MIN_QUEST_EFFORT = 0.75; // a custom quest must be ≥ 75% of the template

export const questEffort = (items) => toArr(items).reduce((a, i) => a + Math.max(0, Number(i?.target) || 0) * (EFFORT[i?.unit] ?? 1), 0);
export const templateEffort = (lv) => questEffort(questItems(null, lv));
/** How hard a quest list is compared with the template (1 = as hard or harder). */
export const questScale = (items, lv) => Math.min(1, questEffort(items) / Math.max(1, templateEffort(lv)));

/** Rewards for clearing `items` — scaled down when the quest is easier than the template. */
export function scaledQuestRewards(rankId, items, lv) {
    const r = questRewards(rankId);
    const k = questScale(items, lv);
    if (k >= 1) return { ...r, scale: 1 };
    return { xp: Math.round(r.xp * k), gold: Math.round(r.gold * k), ap: k >= MIN_QUEST_EFFORT ? r.ap : 0, boxChance: r.boxChance * k, scale: k };
}

/** The quest list can only be edited before today's quest has any progress. */
export const questEditable = (day) => !day?.claimed && !Object.values(day?.progress || {}).some(v => Number(v) > 0);

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

// ── Penalty Quest lifetime ──
// A penalty lasts PENALTY_DAYS days. Ignored that long, it expires and the System takes Gold instead.
export const PENALTY_DAYS = 3;
export const penaltyExpired = (penalty, todayKey) => !!penalty?.active && !!penalty.date && todayKey >= addDays(PENALTY_DAYS, penalty.date);
export const penaltyFine = (gold) => Math.min(Math.max(0, Math.floor(Number(gold) || 0)), Math.max(100, Math.round((Number(gold) || 0) * 0.2)));
/** Was the Daily Quest locked by this penalty on `day`? (Days spent in the Penalty Zone don't trigger a new one.) */
export function penaltyCovers(penalty, day) {
    if (!penalty?.date || penalty.date > day) return false;
    if (penalty.active) return true;
    const end = penalty.endedOn || (penalty.clearedAt ? dateKey(new Date(penalty.clearedAt)) : penalty.date);
    return day <= end;
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
