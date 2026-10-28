// Muscle taxonomy (matches the free-exercise-db dataset) + helpers to map the
// app's older loose names ("core", "back", "legs", "Chest, Triceps", …) onto it.

export const MUSCLES = [
    "abdominals", "abductors", "adductors", "biceps", "calves", "chest", "forearms", "glutes",
    "hamstrings", "lats", "lower back", "middle back", "neck", "quadriceps", "shoulders", "traps", "triceps",
];

export const MUSCLE_LABELS = {
    abdominals: "Abs", abductors: "Outer thighs", adductors: "Inner thighs", biceps: "Biceps", calves: "Calves",
    chest: "Chest", forearms: "Forearms", glutes: "Glutes", hamstrings: "Hamstrings", lats: "Lats",
    "lower back": "Lower back", "middle back": "Mid back", neck: "Neck", quadriceps: "Quads",
    shoulders: "Shoulders", traps: "Traps", triceps: "Triceps",
};

// Training "body part" groups used for filters and the recovery view.
export const MUSCLE_GROUPS = {
    chest: ["chest"],
    back: ["lats", "middle back", "lower back", "traps"],
    shoulders: ["shoulders", "traps"],
    arms: ["biceps", "triceps", "forearms"],
    core: ["abdominals", "lower back"],
    legs: ["quadriceps", "hamstrings", "calves", "adductors", "abductors", "glutes"],
    glutes: ["glutes", "abductors"],
    cardio: [],
};

const ALIASES = {
    abs: ["abdominals"], ab: ["abdominals"], core: ["abdominals", "lower back"], obliques: ["abdominals"],
    "inner chest": ["chest"], "upper chest": ["chest"], "outer chest": ["chest"], pecs: ["chest"],
    back: ["lats", "middle back"], "upper back": ["middle back", "traps"], "lower back": ["lower back"], erectors: ["lower back"],
    lats: ["lats"], lat: ["lats"], traps: ["traps"], trap: ["traps"], rhomboids: ["middle back"],
    shoulder: ["shoulders"], shoulders: ["shoulders"], delts: ["shoulders"], "rear delts": ["shoulders"], "front delts": ["shoulders"],
    arms: ["biceps", "triceps"], arm: ["biceps", "triceps"], bicep: ["biceps"], biceps: ["biceps"], tricep: ["triceps"], triceps: ["triceps"],
    forearm: ["forearms"], forearms: ["forearms"], grip: ["forearms"],
    legs: ["quadriceps", "hamstrings", "calves"], leg: ["quadriceps", "hamstrings"], quads: ["quadriceps"], quad: ["quadriceps"], quadriceps: ["quadriceps"],
    hamstrings: ["hamstrings"], hamstring: ["hamstrings"], hams: ["hamstrings"], calves: ["calves"], calf: ["calves"],
    glutes: ["glutes"], glute: ["glutes"], butt: ["glutes"], hips: ["glutes", "abductors"], "hip flexors": ["quadriceps", "abdominals"],
    adductors: ["adductors"], "inner thighs": ["adductors"], abductors: ["abductors"], "outer thighs": ["abductors"],
    chest: ["chest"], neck: ["neck"], "full body": ["quadriceps", "chest", "shoulders", "abdominals"], cardio: [],
};

/** Normalise any muscle description (string, comma list or array) to taxonomy names. */
export function normalizeMuscles(input) {
    const list = Array.isArray(input) ? input : String(input || "").split(/[,/&+]| and /i);
    const out = new Set();
    for (const raw of list) {
        const k = String(raw || "").toLowerCase().replace(/\(.*?\)/g, "").trim();
        if (!k) continue;
        if (MUSCLES.includes(k)) { out.add(k); continue; }
        if (ALIASES[k]) { ALIASES[k].forEach(m => out.add(m)); continue; }
        // partial match ("Explosive Chest Power", "Single-arm Prep" …)
        for (const [alias, ms] of Object.entries(ALIASES)) {
            if (alias.length > 3 && k.includes(alias)) { ms.forEach(m => out.add(m)); break; }
        }
    }
    return [...out];
}
