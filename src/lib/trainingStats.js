// Pure analytics over workoutLog for the Training hub & Progress tab.
import { today, dateKey, parseDateKey, addDays, toArr } from "@/utils";
import { getDayEntries } from "@/lib/workoutHelpers";
import { getExerciseInfo } from "@/lib/exerciseVisuals";
import { MUSCLE_GROUPS, normalizeMuscles } from "@/lib/muscles";
import { EXERCISES } from "@/data/exercises";

/** Every logged session, newest first, in one shape. */
export function allSessions(workoutLog) {
    const out = [];
    for (const date of Object.keys(workoutLog || {})) {
        getDayEntries(workoutLog, date).forEach((e, i) => {
            if (!e || typeof e !== "object") return;
            const exercises = toArr(e.gym?.exercises ?? e.exercises).filter(Boolean).map(x => ({
                name: x.name || "Exercise",
                sets: toArr(x.sets).filter(s => s && typeof s === "object"),
            }));
            const ts = Number(e.completedAt) || parseDateKey(date).getTime() + 12 * 3600e3 + i;
            out.push({ ...e, date, exercises, completedAt: ts, duration: Number(e.duration) || 0, calBurned: Number(e.calBurned) || 0 });
        });
    }
    return out.sort((a, b) => b.completedAt - a.completedAt);
}

const setVolume = (s) => (Number(s.weight) || 0) * (Number(s.reps) || 0);
export const sessionVolume = (s) => s.exercises.reduce((v, ex) => v + ex.sets.reduce((a, st) => a + setVolume(st), 0), 0);
export const sessionSets = (s) => s.exercises.reduce((v, ex) => v + ex.sets.filter(st => st.done !== false).length, 0) || Number(s.gym?.totalSets) || Number(s.totalSets) || 0;

// Week starts on Monday.
export function weekStart(d = new Date()) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
}

export function weekSummary(sessions, ref = new Date()) {
    const start = dateKey(weekStart(ref));
    const end = addDays(7, start);
    const week = sessions.filter(s => s.date >= start && s.date < end);
    const days = new Set(week.map(s => s.date));
    return {
        start,
        days: [...Array(7)].map((_, i) => { const k = addDays(i, start); return { date: k, done: days.has(k), isToday: k === today() }; }),
        workouts: days.size,
        sessions: week.length,
        minutes: Math.round(week.reduce((m, s) => m + s.duration, 0) / 60),
        volume: Math.round(week.reduce((v, s) => v + sessionVolume(s), 0)),
        sets: week.reduce((v, s) => v + sessionSets(s), 0),
        calories: week.reduce((c, s) => c + s.calBurned, 0),
    };
}

/** Hours since each muscle was last trained (primary = full load, secondary counts too). */
export function muscleRecovery(sessions, now = Date.now()) {
    const last = {};
    for (const s of sessions) {
        if (now - s.completedAt > 5 * 864e5) break; // sorted newest first
        for (const ex of s.exercises) {
            const info = getExerciseInfo(ex.name);
            [...info.primary, ...info.secondary].forEach(m => { if (!(m in last)) last[m] = (now - s.completedAt) / 3600e3; });
        }
        normalizeMuscles(toArr(s.gym?.musclesWorked)).forEach(m => { if (!(m in last)) last[m] = (now - s.completedAt) / 3600e3; });
    }
    return last;
}

// Status palette (fixed): critical / serious / warning / good — always shown with a text label.
export const RECOVERY_COLORS = { fatigued: "#d03b3b", recovering: "#ec835a", almost: "#fab219", ready: "#0ca30c" };
export const RECOVERY_LABELS = { fatigued: "Fatigued (<24h)", recovering: "Recovering (24–48h)", almost: "Almost ready (48–72h)", ready: "Ready" };
export function recoveryState(hours) {
    if (hours === undefined) return "ready";
    return hours < 24 ? "fatigued" : hours < 48 ? "recovering" : hours < 72 ? "almost" : "ready";
}

/** Per-exercise records from logged sets: best weight, best estimated 1RM (Epley), best reps. */
export function personalRecords(sessions) {
    const prs = {};
    for (const s of sessions) for (const ex of s.exercises) for (const st of ex.sets) {
        if (st.done === false) continue;
        const w = Number(st.weight) || 0, r = Number(st.reps) || 0;
        const cur = prs[ex.name] || { name: ex.name, weight: 0, reps: 0, e1rm: 0, date: s.date, times: 0 };
        if (w > cur.weight) { cur.weight = w; cur.date = s.date; }
        if (r > cur.reps) cur.reps = r;
        if (w > 0 && r > 0) cur.e1rm = Math.max(cur.e1rm, Math.round(w * (1 + Math.min(r, 12) / 30) * 10) / 10);
        prs[ex.name] = cur;
    }
    for (const s of sessions) for (const ex of s.exercises) if (prs[ex.name]) prs[ex.name].times++;
    return prs;
}

/** History of one exercise: last session's sets (for the "previous" column) and totals. */
export function exerciseHistory(sessions, name) {
    const hits = [];
    for (const s of sessions) {
        const ex = s.exercises.find(e => e.name === name);
        if (ex) hits.push({ date: s.date, sets: ex.sets });
    }
    const best = hits.reduce((b, h) => Math.max(b, ...h.sets.map(st => Number(st.weight) || 0)), 0);
    return { last: hits[0] || null, times: hits.length, bestWeight: best, lastDate: hits[0]?.date || null };
}

/** Minutes and session counts for the last N weeks (oldest → newest). */
export function weeklyTrend(sessions, weeks = 8) {
    const start = weekStart();
    return [...Array(weeks)].map((_, i) => {
        const ws = new Date(start); ws.setDate(ws.getDate() - (weeks - 1 - i) * 7);
        const a = dateKey(ws), b = addDays(7, a);
        const list = sessions.filter(s => s.date >= a && s.date < b);
        return { label: `${ws.getDate()}/${ws.getMonth() + 1}`, start: a, sessions: list.length, minutes: Math.round(list.reduce((m, s) => m + s.duration, 0) / 60), volume: Math.round(list.reduce((v, s) => v + sessionVolume(s), 0)) };
    });
}

/** Completed sets per muscle group over the last `days` days. */
export function groupDistribution(sessions, days = 30) {
    const since = addDays(-days);
    const counts = Object.fromEntries(Object.keys(MUSCLE_GROUPS).filter(g => g !== "cardio").map(g => [g, 0]));
    for (const s of sessions) {
        if (s.date < since) continue;
        for (const ex of s.exercises) {
            const prim = getExerciseInfo(ex.name).primary;
            const n = ex.sets.filter(st => st.done !== false).length || 1;
            for (const [g, ms] of Object.entries(MUSCLE_GROUPS)) if (g in counts && prim.some(m => ms.includes(m))) counts[g] += n;
        }
    }
    return counts;
}

export function totals(sessions) {
    return {
        sessions: sessions.length,
        days: new Set(sessions.map(s => s.date)).size,
        minutes: Math.round(sessions.reduce((m, s) => m + s.duration, 0) / 60),
        volume: Math.round(sessions.reduce((v, s) => v + sessionVolume(s), 0)),
        calories: sessions.reduce((c, s) => c + s.calBurned, 0),
    };
}

// ── Today's recommendation ──
const FOCUS_OPTIONS = [
    { id: "push", name: "Push Day", parts: ["chest", "shoulders", "arms"], groups: ["chest", "shoulders", "arms"] },
    { id: "pull", name: "Pull Day", parts: ["back", "arms"], groups: ["back", "arms"] },
    { id: "legs", name: "Leg Day", parts: ["legs", "glutes"], groups: ["legs", "glutes"] },
    { id: "core", name: "Core & Conditioning", parts: ["core", "cardio"], groups: ["core"] },
    { id: "full", name: "Full Body", parts: ["chest", "back", "legs", "core"], groups: ["chest", "back", "legs", "core"] },
];

// Deterministic shuffle so the suggestion doesn't change on every render.
function seeded(seedStr) {
    let h = 2166136261;
    for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}

export function recommendWorkout({ sessions, profile = {} }) {
    const rec = muscleRecovery(sessions);
    const fatigue = (groups) => groups.reduce((s, g) => s + MUSCLE_GROUPS[g].reduce((a, m) => a + (rec[m] !== undefined ? Math.max(0, 72 - rec[m]) : 0), 0) / Math.max(1, MUSCLE_GROUPS[g].length), 0) / groups.length;
    const rand = seeded(today() + (profile.name || ""));
    const ranked = FOCUS_OPTIONS.map(f => ({ ...f, fatigue: fatigue(f.groups) + rand() * 6 })).sort((a, b) => a.fatigue - b.fatigue);
    const pick = ranked[0];

    const gym = profile.trainingType === "gym" || profile.trainingType === "mixed";
    const level = profile.fitnessLevel === "beginner" ? 1 : profile.fitnessLevel === "advanced" ? 3 : 2;
    const perPart = Math.max(2, Math.round(6 / pick.parts.length));
    const chosen = [];
    for (const part of pick.parts) {
        const pool = [...(gym ? EXERCISES.gym?.[part] || [] : []), ...(EXERCISES.bodyweight?.[part] || [])].filter(e => (e.difficulty || 1) <= level);
        const shuffled = [...pool].sort(() => rand() - 0.5);
        for (const e of shuffled) {
            if (chosen.length >= 7) break;
            if (!chosen.find(c => c.name === e.name)) { chosen.push(e); if (chosen.filter(c => pool.includes(c)).length >= perPart) break; }
        }
    }
    return {
        id: `rec_${today()}_${pick.id}`,
        name: `${pick.name}`,
        source: "recommended",
        reason: pick.fatigue < 10 ? "These muscles are fully recovered" : "Least-fatigued muscle groups today",
        exercises: chosen.map(e => ({ ...e, rest: e.rest ?? 45 })),
    };
}

export const fmtDuration = (sec) => {
    const m = Math.round((Number(sec) || 0) / 60);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

export const fmtDate = (k) => {
    if (k === today()) return "Today";
    if (k === addDays(-1)) return "Yesterday";
    return parseDateKey(k).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};
