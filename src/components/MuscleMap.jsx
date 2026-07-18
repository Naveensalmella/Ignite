// ══════════════════════════════════════
// MuscleMap — SVG human body with highlighted muscles
// Like Home Workout app style
// ══════════════════════════════════════

const MUSCLE_PATHS = {
    // ── FRONT VIEW ──
    chest: { d: "M30,38 Q40,35 50,38 Q50,48 40,50 Q30,48 30,38Z", view: "front", label: "Chest" },
    abs: { d: "M34,50 L46,50 L46,72 L34,72Z", view: "front", label: "Abs" },
    obliques_l: { d: "M28,50 L34,50 L34,72 L28,68Z", view: "front", label: "Obliques" },
    obliques_r: { d: "M46,50 L52,50 L52,68 L46,72Z", view: "front", label: "Obliques" },
    shoulders_l: { d: "M20,32 Q25,28 30,32 L30,40 Q25,42 20,38Z", view: "front", label: "Shoulders" },
    shoulders_r: { d: "M50,32 Q55,28 60,32 L60,38 Q55,42 50,40Z", view: "front", label: "Shoulders" },
    biceps_l: { d: "M18,40 Q22,38 24,42 L22,56 Q18,56 16,52Z", view: "front", label: "Biceps" },
    biceps_r: { d: "M56,42 Q58,38 62,40 L64,52 Q62,56 58,56Z", view: "front", label: "Biceps" },
    forearms_l: { d: "M16,56 L22,56 L20,72 L14,70Z", view: "front", label: "Forearms" },
    forearms_r: { d: "M58,56 L64,56 L66,70 L60,72Z", view: "front", label: "Forearms" },
    quads_l: { d: "M28,74 L38,74 L36,100 L26,98Z", view: "front", label: "Quads" },
    quads_r: { d: "M42,74 L52,74 L54,98 L44,100Z", view: "front", label: "Quads" },
    calves_l: { d: "M28,104 L36,102 L34,122 L28,122Z", view: "front", label: "Calves" },
    calves_r: { d: "M44,102 L52,104 L52,122 L46,122Z", view: "front", label: "Calves" },
    // ── BACK VIEW ──
    traps: { d: "M30,30 Q40,26 50,30 L48,38 Q40,36 32,38Z", view: "back", label: "Traps" },
    upper_back: { d: "M30,38 Q40,36 50,38 Q50,48 40,50 Q30,48 30,38Z", view: "back", label: "Upper Back" },
    lats_l: { d: "M24,40 L30,38 L30,55 L26,58Z", view: "back", label: "Lats" },
    lats_r: { d: "M50,38 L56,40 L54,58 L50,55Z", view: "back", label: "Lats" },
    lower_back: { d: "M32,55 L48,55 L48,72 L32,72Z", view: "back", label: "Lower Back" },
    triceps_l: { d: "M16,40 Q20,38 22,42 L20,56 Q16,56 14,50Z", view: "back", label: "Triceps" },
    triceps_r: { d: "M58,42 Q60,38 64,40 L66,50 Q64,56 60,56Z", view: "back", label: "Triceps" },
    glutes_l: { d: "M28,72 L40,72 L38,84 L26,82Z", view: "back", label: "Glutes" },
    glutes_r: { d: "M40,72 L52,72 L54,82 L42,84Z", view: "back", label: "Glutes" },
    hamstrings_l: { d: "M26,84 L38,84 L36,104 L26,102Z", view: "back", label: "Hamstrings" },
    hamstrings_r: { d: "M42,84 L54,84 L54,102 L44,104Z", view: "back", label: "Hamstrings" },
    calves_back_l: { d: "M28,104 L36,104 L34,122 L28,122Z", view: "back", label: "Calves" },
    calves_back_r: { d: "M44,104 L52,104 L52,122 L46,122Z", view: "back", label: "Calves" },
};

// Head + body outline
const BODY_OUTLINE_FRONT = "M40,6 Q48,6 48,14 Q48,22 40,24 Q32,22 32,14 Q32,6 40,6Z M30,26 Q22,28 18,34 L14,52 L12,70 L20,72 L24,56 L28,74 L26,100 L26,122 L28,128 L36,128 L38,100 L40,80 L42,100 L44,128 L52,128 L54,122 L54,100 L52,74 L56,56 L60,72 L68,70 L66,52 L62,34 Q58,28 50,26Z";
const BODY_OUTLINE_BACK = BODY_OUTLINE_FRONT;

export default function MuscleMap({ muscles = [], size = 160, accent = "#10b981", showLabels = false }) {
    const frontMuscles = Object.entries(MUSCLE_PATHS).filter(([_, m]) => m.view === "front");
    const backMuscles = Object.entries(MUSCLE_PATHS).filter(([_, m]) => m.view === "back");
    const activeSet = new Set(muscles.map(m => m.toLowerCase().replace(/\s+/g, "_")));

    // Map common names to muscle keys
    const nameMap = {
        chest: ["chest"],
        back: ["upper_back", "lats_l", "lats_r", "lower_back"],
        shoulders: ["shoulders_l", "shoulders_r"],
        biceps: ["biceps_l", "biceps_r"],
        triceps: ["triceps_l", "triceps_r"],
        arms: ["biceps_l", "biceps_r", "triceps_l", "triceps_r", "forearms_l", "forearms_r"],
        forearms: ["forearms_l", "forearms_r"],
        abs: ["abs", "obliques_l", "obliques_r"],
        core: ["abs", "obliques_l", "obliques_r", "lower_back"],
        legs: ["quads_l", "quads_r", "hamstrings_l", "hamstrings_r", "calves_l", "calves_r", "calves_back_l", "calves_back_r", "glutes_l", "glutes_r"],
        quads: ["quads_l", "quads_r"],
        hamstrings: ["hamstrings_l", "hamstrings_r"],
        glutes: ["glutes_l", "glutes_r"],
        calves: ["calves_l", "calves_r", "calves_back_l", "calves_back_r"],
        traps: ["traps"],
        lats: ["lats_l", "lats_r"],
        upper_back: ["upper_back", "traps"],
        lower_back: ["lower_back"],
        full_body: Object.keys(MUSCLE_PATHS),
    };

    const expandedActive = new Set();
    activeSet.forEach(name => {
        if (nameMap[name]) nameMap[name].forEach(k => expandedActive.add(k));
        else expandedActive.add(name);
    });

    const half = size / 2 - 4;

    const renderBody = (muscleList, xOffset, label) => (
        <g transform={`translate(${xOffset}, 0)`}>
            {/* Body outline */}
            <path d={BODY_OUTLINE_FRONT} fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.08)" strokeWidth="0.5"
                transform="scale(0.95)" style={{ transformOrigin: "40px 70px" }} />
            {/* Muscle groups */}
            {muscleList.map(([key, m]) => {
                const active = expandedActive.has(key);
                return (
                    <path key={key} d={m.d}
                        fill={active ? `${accent}40` : "rgba(255,255,255,.02)"}
                        stroke={active ? accent : "rgba(255,255,255,.06)"}
                        strokeWidth={active ? "0.8" : "0.3"}
                        style={{ transition: "all .4s", filter: active ? `drop-shadow(0 0 4px ${accent}60)` : "none" }}
                    />
                );
            })}
            {/* Label */}
            {showLabels && <text x="40" y="135" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="Inter,sans-serif">{label}</text>}
        </g>
    );

    return (
        <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
            <svg width={half} height={size} viewBox="0 0 80 140" style={{ overflow: "visible" }}>
                {renderBody(frontMuscles, 0, "FRONT")}
            </svg>
            <svg width={half} height={size} viewBox="0 0 80 140" style={{ overflow: "visible" }}>
                {renderBody(backMuscles, 0, "BACK")}
            </svg>
        </div>
    );
}

// Export muscle mapping for exercises
export const EXERCISE_MUSCLES = {
    // Chest
    "Push Ups": ["chest", "triceps", "shoulders"],
    "Wide Push Ups": ["chest", "shoulders"],
    "Diamond Push Ups": ["triceps", "chest"],
    "Decline Push Ups": ["chest", "shoulders"],
    "Incline Push Ups": ["chest", "triceps"],
    "Chest Dips": ["chest", "triceps"],
    "Chest Fly": ["chest"],
    "Bench Press": ["chest", "triceps", "shoulders"],
    "Dumbbell Press": ["chest", "triceps"],
    "Cable Crossover": ["chest"],
    // Back
    "Pull Ups": ["lats", "biceps", "upper_back"],
    "Chin Ups": ["biceps", "lats"],
    "Lat Pulldown": ["lats", "biceps"],
    "Bent Over Row": ["upper_back", "lats", "biceps"],
    "Dumbbell Row": ["upper_back", "lats"],
    "Seated Row": ["upper_back", "lats"],
    "Superman": ["lower_back", "glutes"],
    "Back Extension": ["lower_back"],
    "Deadlift": ["lower_back", "hamstrings", "glutes", "traps"],
    "T-Bar Row": ["upper_back", "lats"],
    // Shoulders
    "Shoulder Press": ["shoulders", "triceps"],
    "Lateral Raise": ["shoulders"],
    "Front Raise": ["shoulders"],
    "Arnold Press": ["shoulders", "triceps"],
    "Rear Delt Fly": ["shoulders", "upper_back"],
    "Pike Push Ups": ["shoulders", "triceps"],
    "Handstand Push Ups": ["shoulders", "triceps", "core"],
    "Shrugs": ["traps"],
    "Upright Row": ["shoulders", "traps"],
    "Face Pull": ["shoulders", "upper_back"],
    // Arms
    "Bicep Curls": ["biceps"],
    "Hammer Curls": ["biceps", "forearms"],
    "Tricep Dips": ["triceps", "chest"],
    "Tricep Extension": ["triceps"],
    "Tricep Kickback": ["triceps"],
    "Skull Crushers": ["triceps"],
    "Concentration Curl": ["biceps"],
    "Wrist Curls": ["forearms"],
    "Close Grip Push Ups": ["triceps", "chest"],
    // Abs
    "Crunches": ["abs"],
    "Sit Ups": ["abs"],
    "Leg Raises": ["abs", "core"],
    "Plank": ["core", "abs"],
    "Side Plank": ["obliques_l", "obliques_r", "core"],
    "Mountain Climbers": ["abs", "core", "shoulders"],
    "Bicycle Crunches": ["abs", "obliques_l", "obliques_r"],
    "Russian Twist": ["obliques_l", "obliques_r", "abs"],
    "Flutter Kicks": ["abs", "core"],
    "V-Ups": ["abs", "core"],
    "Hanging Leg Raise": ["abs", "core"],
    "Ab Wheel Rollout": ["abs", "core", "shoulders"],
    // Legs
    "Squats": ["quads", "glutes"],
    "Jump Squats": ["quads", "glutes", "calves"],
    "Lunges": ["quads", "glutes", "hamstrings"],
    "Walking Lunges": ["quads", "glutes", "hamstrings"],
    "Bulgarian Split Squat": ["quads", "glutes"],
    "Wall Sit": ["quads"],
    "Calf Raises": ["calves"],
    "Glute Bridge": ["glutes", "hamstrings"],
    "Hip Thrust": ["glutes", "hamstrings"],
    "Step Ups": ["quads", "glutes"],
    "Leg Press": ["quads", "glutes"],
    "Leg Curl": ["hamstrings"],
    "Leg Extension": ["quads"],
    "Romanian Deadlift": ["hamstrings", "glutes", "lower_back"],
    "Sumo Squat": ["quads", "glutes"],
    "Box Jumps": ["quads", "calves", "glutes"],
    // Full body / Cardio
    "Burpees": ["full_body"],
    "Jumping Jacks": ["full_body"],
    "High Knees": ["quads", "abs", "calves"],
    "Butt Kicks": ["hamstrings", "calves"],
    "Bear Crawl": ["shoulders", "core", "quads"],
    "Inchworm": ["hamstrings", "shoulders", "core"],
    "Thrusters": ["quads", "shoulders", "core"],
    "Clean and Press": ["full_body"],
    "Kettlebell Swing": ["glutes", "hamstrings", "core", "shoulders"],
    "Battle Ropes": ["shoulders", "arms", "core"],
    // Combat
    "Jab Cross": ["shoulders", "core", "arms"],
    "Hook": ["obliques_l", "obliques_r", "shoulders"],
    "Uppercut": ["biceps", "shoulders", "core"],
    "Front Kick": ["quads", "abs"],
    "Roundhouse Kick": ["quads", "glutes", "obliques_l", "obliques_r"],
    "Knee Strike": ["quads", "abs", "core"],
    "Shadow Boxing": ["shoulders", "arms", "core"],
    "Elbow Strike": ["triceps", "core"],
    // Stretching
    "Neck Stretch": ["traps"],
    "Shoulder Stretch": ["shoulders"],
    "Chest Stretch": ["chest"],
    "Quad Stretch": ["quads"],
    "Hamstring Stretch": ["hamstrings"],
    "Calf Stretch": ["calves"],
    "Hip Flexor Stretch": ["quads", "abs"],
    "Cat Cow Stretch": ["lower_back", "abs"],
    "Child's Pose": ["lower_back", "lats"],
    "Cobra Stretch": ["abs", "lower_back"],
};

// Get muscles for an exercise (fuzzy match)
export function getMusclesForExercise(name) {
    if (!name) return [];
    const exact = EXERCISE_MUSCLES[name];
    if (exact) return exact;
    const lower = name.toLowerCase();
    for (const [key, val] of Object.entries(EXERCISE_MUSCLES)) {
        if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return val;
    }
    // Guess from keywords
    if (lower.includes("push")) return ["chest", "triceps"];
    if (lower.includes("pull") || lower.includes("row")) return ["lats", "biceps"];
    if (lower.includes("squat")) return ["quads", "glutes"];
    if (lower.includes("curl")) return ["biceps"];
    if (lower.includes("press")) return ["chest", "shoulders", "triceps"];
    if (lower.includes("plank") || lower.includes("crunch")) return ["abs", "core"];
    if (lower.includes("kick")) return ["quads", "glutes"];
    if (lower.includes("lunge")) return ["quads", "glutes", "hamstrings"];
    return ["full_body"];
}