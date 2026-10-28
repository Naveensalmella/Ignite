// Hunter ranks and Rank Assessments (trials).
import { RANKS } from "@/data/index";

export const rankById = (id) => RANKS.find(r => r.id === id) || RANKS[0];
export const rankIndex = (id) => Math.max(0, RANKS.findIndex(r => r.id === id));
export const nextRank = (id) => RANKS[rankIndex(id) + 1] || null;

/** The rank a level qualifies for (used for other players, and before awakening). */
export function levelRank(lv) {
    for (let i = RANKS.length - 1; i >= 0; i--) if (lv >= RANKS[i].min) return RANKS[i];
    return RANKS[0];
}

/** The player's official rank: the last assessment passed. */
export const playerRank = (system, lv) => (system?.awakened && system.rank ? rankById(system.rank) : levelRank(lv));

/** The rank whose assessment is unlocked right now (level reached, not passed yet), or null. */
export function availableTrial(system, lv) {
    if (!system?.awakened) return null;
    const nr = nextRank(system.rank || "E");
    return nr && lv >= nr.min ? nr : null;
}

// Assessment per target rank: a real, timed test. Pattern names drive the animated demo.
const T = (name, target, unit, pattern) => ({ name, target, unit, pattern });
export const TRIALS = {
    D: { minutes: 40, tasks: [T("Push-ups", 30, "reps", "pushup"), T("Squats", 50, "reps", "squat"), T("Plank", 60, "sec", "plank"), T("Run", 2, "km", "jog")] },
    C: { minutes: 45, tasks: [T("Push-ups", 50, "reps", "pushup"), T("Squats", 80, "reps", "squat"), T("Burpees", 20, "reps", "burpee"), T("Run", 3, "km", "jog")] },
    B: { minutes: 60, tasks: [T("Push-ups", 70, "reps", "pushup"), T("Squats", 100, "reps", "squat"), T("Burpees", 30, "reps", "burpee"), T("Plank", 120, "sec", "plank"), T("Run", 5, "km", "jog")] },
    A: { minutes: 75, tasks: [T("Push-ups", 100, "reps", "pushup"), T("Squats", 150, "reps", "squat"), T("Burpees", 50, "reps", "burpee"), T("Pull-ups (or rows)", 10, "reps", "pull_up"), T("Run", 7, "km", "jog")] },
    S: { minutes: 90, tasks: [T("Push-ups", 150, "reps", "pushup"), T("Squats", 200, "reps", "squat"), T("Burpees", 80, "reps", "burpee"), T("Pull-ups (or rows)", 20, "reps", "pull_up"), T("Run", 10, "km", "jog")] },
    N: { minutes: 120, tasks: [T("Push-ups", 200, "reps", "pushup"), T("Squats", 300, "reps", "squat"), T("Burpees", 100, "reps", "burpee"), T("Pull-ups (or rows)", 30, "reps", "pull_up"), T("Run", 15, "km", "jog")] },
};

/** Rewards for passing an assessment into `rankId`. */
export function trialRewards(rankId) {
    const tier = rankById(rankId).tier;
    return { gold: 300 * tier, ap: 3 + tier };
}
