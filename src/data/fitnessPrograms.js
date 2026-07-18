// ══════════════════════════════════════════════════════════
// IGNITE Fitness Programs — Yoga, Running, HIIT, etc.
// Personalized by gender + age
// ══════════════════════════════════════════════════════════

// ── Program Tags for Recommendations ──
export const PROGRAM_TAGS = {
    // Existing gym programs
    beginner_muscle: { gender: "all", ageMin: 16, ageMax: 55, tags: ["muscle", "strength", "beginner"], icon: "🏋️" },
    intermediate_muscle: { gender: "all", ageMin: 18, ageMax: 50, tags: ["muscle", "hypertrophy", "intermediate"], icon: "🏋️" },
    advanced_muscle: { gender: "all", ageMin: 18, ageMax: 45, tags: ["muscle", "advanced", "ppl"], icon: "🏋️" },
    fat_loss: { gender: "all", ageMin: 16, ageMax: 60, tags: ["fat loss", "cardio", "beginner"], icon: "🔥" },
    home_bodyweight: { gender: "all", ageMin: 14, ageMax: 65, tags: ["home", "bodyweight", "beginner"], icon: "🏠" },
    // Existing combat
    boxing: { gender: "all", ageMin: 14, ageMax: 50, tags: ["combat", "boxing", "skill"], icon: "🥊" },
    kickboxing: { gender: "all", ageMin: 14, ageMax: 50, tags: ["combat", "kickboxing", "skill"], icon: "🦶" },
    mma: { gender: "all", ageMin: 16, ageMax: 45, tags: ["combat", "mma", "grappling"], icon: "🤼" },
    muay_thai: { gender: "all", ageMin: 14, ageMax: 50, tags: ["combat", "muay thai", "skill"], icon: "🇹🇭" },
    martial_arts: { gender: "all", ageMin: 10, ageMax: 60, tags: ["combat", "discipline", "skill"], icon: "🥋" },
    // New programs
    yoga: { gender: "all", ageMin: 12, ageMax: 70, tags: ["yoga", "flexibility", "mindfulness", "beginner"], icon: "🧘" },
    couch_to_5k: { gender: "all", ageMin: 14, ageMax: 65, tags: ["running", "cardio", "beginner"], icon: "🏃" },
    run_10k: { gender: "all", ageMin: 16, ageMax: 55, tags: ["running", "endurance", "intermediate"], icon: "🏃" },
    hiit_burner: { gender: "all", ageMin: 16, ageMax: 50, tags: ["hiit", "fat loss", "cardio"], icon: "⚡" },
    flexibility: { gender: "all", ageMin: 12, ageMax: 70, tags: ["flexibility", "mobility", "recovery"], icon: "🤸" },
    powerlifting: { gender: "all", ageMin: 18, ageMax: 50, tags: ["strength", "powerlifting", "advanced"], icon: "🏋️" },
    calisthenics: { gender: "all", ageMin: 14, ageMax: 45, tags: ["calisthenics", "bodyweight", "skill"], icon: "💪" },
    posture_fix: { gender: "all", ageMin: 14, ageMax: 70, tags: ["posture", "rehab", "desk worker", "beginner"], icon: "🧑‍💻" },
    meditation: { gender: "all", ageMin: 10, ageMax: 80, tags: ["meditation", "breathwork", "mental"], icon: "🧘" },
    womens_tone: { gender: "female", ageMin: 16, ageMax: 55, tags: ["glutes", "toning", "female"], icon: "🍑" },
    stamina: { gender: "all", ageMin: 14, ageMax: 55, tags: ["stamina", "endurance", "cardio"], icon: "🫀" },
    senior_fit: { gender: "all", ageMin: 50, ageMax: 90, tags: ["senior", "low impact", "gentle", "joint-friendly"], icon: "🧓" },
};

// ── Recommendation Engine ──
export function getRecommendedPrograms(gender, age, goal) {
    const g = (gender || "").toLowerCase();
    const a = parseInt(age) || 25;
    const goalLower = (goal || "").toLowerCase();

    return Object.entries(PROGRAM_TAGS)
        .filter(([id, tag]) => {
            if (tag.gender !== "all" && tag.gender !== g) return false;
            if (a < tag.ageMin || a > tag.ageMax) return false;
            return true;
        })
        .map(([id, tag]) => {
            let score = 0;
            // Boost score based on goal match
            if (goalLower.includes("muscle") && tag.tags.includes("muscle")) score += 10;
            if (goalLower.includes("fat") && tag.tags.includes("fat loss")) score += 10;
            if (goalLower.includes("lose") && tag.tags.includes("fat loss")) score += 10;
            if (goalLower.includes("strength") && tag.tags.includes("strength")) score += 10;
            if (goalLower.includes("flex") && tag.tags.includes("flexibility")) score += 8;
            if (goalLower.includes("run") && tag.tags.includes("running")) score += 10;
            if (goalLower.includes("combat") && tag.tags.includes("combat")) score += 10;
            if (goalLower.includes("fight") && tag.tags.includes("combat")) score += 10;
            if (goalLower.includes("yoga") && tag.tags.includes("yoga")) score += 10;
            if (goalLower.includes("posture") && tag.tags.includes("posture")) score += 10;
            if (goalLower.includes("tone") && tag.tags.includes("toning")) score += 10;
            if (goalLower.includes("endur") && tag.tags.includes("endurance")) score += 8;
            if (goalLower.includes("home") && tag.tags.includes("home")) score += 8;
            if (goalLower.includes("mental") && tag.tags.includes("mental")) score += 8;
            // Age-based boosts
            if (a >= 50 && tag.tags.includes("senior")) score += 5;
            if (a >= 50 && tag.tags.includes("gentle")) score += 3;
            if (a < 20 && tag.tags.includes("beginner")) score += 3;
            // Gender boost
            if (g === "female" && tag.tags.includes("female")) score += 5;
            return { id, ...tag, score };
        })
        .sort((a, b) => b.score - a.score);
}

// Adjust reps/sets/rest based on age and gender
export function adjustForProfile(exercise, gender, age) {
    const a = parseInt(age) || 25;
    const g = (gender || "").toLowerCase();
    let { sets, reps, rest } = exercise;

    // Age adjustments
    if (a > 50) { rest = Math.round(rest * 1.3); sets = Math.max(2, sets - 1); }
    if (a > 60) { rest = Math.round(rest * 1.5); sets = Math.max(2, sets - 1); }
    if (a < 18) { sets = Math.max(2, sets); } // Teens: fewer sets

    // Gender adjustments for certain exercises
    if (g === "female") {
        // Slightly lower upper body volume, higher lower body
        const upperBody = ["Bench Press", "Shoulder Press", "Pull Ups", "Push Ups", "Dumbbell Press"];
        if (upperBody.some(u => exercise.name?.includes(u))) {
            sets = Math.max(2, sets - 1);
        }
    }

    return { ...exercise, sets, reps, rest };
}

// ══════════════════════════════════════
// NEW PROGRAMS
// ══════════════════════════════════════

export const FITNESS_PROGRAMS = {

    // ═══ 1. YOGA ═══
    yoga: {
        id: "yoga", name: "Yoga Journey", icon: "🧘",
        desc: "From complete beginner to flowing sequences. Build flexibility, balance, and inner peace.",
        duration: "8 weeks", daysPerWeek: 3, schedule: ["Mon", "Wed", "Fri"], restDays: ["Tue", "Thu", "Sat", "Sun"],
        curriculum: [
            {
                week: 1, title: "Breath & Foundation", focus: "Learn proper breathing and basic poses",
                skills: ["Ujjayi Breath — ocean breath, inhale/exhale through nose", "Mountain Pose (Tadasana) — stand tall, weight balanced", "Child's Pose (Balasana) — rest position, stretch back"],
                drills: [{ name: "Breath Practice", duration: "5 min", desc: "Sit cross-legged, practice ujjayi breath — slow, steady, through the nose" }, { name: "Mountain Pose Hold", duration: "3 min", desc: "Stand tall, feet together, arms at sides, eyes closed. Feel your balance." }, { name: "Child's Pose Flow", duration: "3 min", desc: "Move between child's pose and tabletop, synchronize with breath" }],
                conditioning: [{ name: "Cat-Cow Stretch", sets: 3, reps: "10", rest: 15 }, { name: "Child's Pose Hold", sets: 3, reps: "30s", rest: 15 }, { name: "Seated Meditation", sets: 1, reps: "3 min", rest: 0 }]
            },
            {
                week: 2, title: "Sun Salutation A", focus: "The foundation flow of all yoga",
                skills: ["Forward Fold (Uttanasana)", "Plank to Chaturanga (low push up)", "Upward Dog / Cobra → Downward Dog"],
                drills: [{ name: "Half Sun Salutation", duration: "5 min", desc: "Mountain → Forward Fold → Halfway Lift → Forward Fold → Mountain" }, { name: "Full Sun Salutation A", duration: "5 min", desc: "Complete flow: Mountain → Fold → Plank → Chaturanga → Up Dog → Down Dog → Fold → Mountain" }, { name: "3 Rounds Continuous", duration: "5 min", desc: "Flow through 3 Sun Salutation A with breath" }],
                conditioning: [{ name: "Downward Dog Hold", sets: 3, reps: "30s", rest: 15 }, { name: "Plank Hold", sets: 3, reps: "20s", rest: 15 }, { name: "Cobra Stretch", sets: 3, reps: "15s", rest: 10 }]
            },
            {
                week: 3, title: "Standing Poses", focus: "Build strength and stability",
                skills: ["Warrior I (Virabhadrasana I)", "Warrior II (Virabhadrasana II)", "Triangle Pose (Trikonasana)"],
                drills: [{ name: "Warrior Flow", duration: "5 min", desc: "Warrior I → Warrior II → Reverse Warrior, both sides" }, { name: "Triangle Practice", duration: "4 min", desc: "Hold triangle 30s each side, reach through fingertips" }, { name: "Standing Sequence", duration: "5 min", desc: "Sun Sal → Warrior I → Warrior II → Triangle → fold" }],
                conditioning: [{ name: "Warrior II Hold", sets: 2, reps: "45s each side", rest: 15 }, { name: "Chair Pose", sets: 3, reps: "20s", rest: 15 }, { name: "Tree Pose", sets: 3, reps: "20s each", rest: 10 }]
            },
            {
                week: 4, title: "Balance & Core", focus: "Develop stability and core strength",
                skills: ["Tree Pose (Vrksasana)", "Eagle Pose (Garudasana)", "Boat Pose (Navasana)"],
                drills: [{ name: "Balance Flow", duration: "5 min", desc: "Tree → Eagle → Warrior III, 30s each, both sides" }, { name: "Core Yoga", duration: "4 min", desc: "Boat Pose → Bicycle legs → Plank → Side Plank" }, { name: "Full Flow", duration: "5 min", desc: "Sun Sal → Standing → Balance → Core → Rest" }],
                conditioning: [{ name: "Boat Pose Hold", sets: 3, reps: "20s", rest: 15 }, { name: "Side Plank", sets: 2, reps: "20s each", rest: 15 }, { name: "Seated Meditation", sets: 1, reps: "3 min", rest: 0 }]
            },
            {
                week: 5, title: "Hip Openers", focus: "Release tension, improve flexibility",
                skills: ["Pigeon Pose", "Lizard Pose", "Happy Baby Pose"],
                drills: [{ name: "Hip Sequence", duration: "6 min", desc: "Low lunge → Lizard → Pigeon, hold 1 min each side" }, { name: "Happy Baby Flow", duration: "3 min", desc: "Rock side to side, open hips" }, { name: "Full Flow + Hips", duration: "6 min", desc: "Sun Sal → Standing → Hip openers → Savasana" }],
                conditioning: [{ name: "Pigeon Hold", sets: 2, reps: "60s each", rest: 15 }, { name: "Butterfly Stretch", sets: 3, reps: "30s", rest: 10 }, { name: "Deep Breathing", sets: 1, reps: "3 min", rest: 0 }]
            },
            {
                week: 6, title: "Backbends & Twists", focus: "Open the spine, improve posture",
                skills: ["Bridge Pose", "Camel Pose (Ustrasana)", "Seated Twist (Ardha Matsyendrasana)"],
                drills: [{ name: "Backbend Sequence", duration: "5 min", desc: "Cobra → Up Dog → Bridge → Camel (with support)" }, { name: "Twist Flow", duration: "4 min", desc: "Seated twist → Supine twist, hold 45s each side" }, { name: "Full Flow", duration: "6 min", desc: "Sun Sal → Standing → Backbends → Twists → Rest" }],
                conditioning: [{ name: "Bridge Hold", sets: 3, reps: "20s", rest: 15 }, { name: "Cat-Cow", sets: 3, reps: "10", rest: 10 }, { name: "Savasana", sets: 1, reps: "3 min", rest: 0 }]
            },
            {
                week: 7, title: "Flow Sequences", focus: "Link poses smoothly with breath",
                skills: ["Vinyasa flow", "Sun Salutation B", "Linking breath with movement"],
                drills: [{ name: "Sun Salutation B", duration: "6 min", desc: "Full Sun Sal B with Chair Pose and Warriors" }, { name: "Creative Flow", duration: "6 min", desc: "Create your own flow: 10 poses linked together" }, { name: "Slow Flow", duration: "5 min", desc: "One breath per movement, extremely slow and mindful" }],
                conditioning: [{ name: "Flow Practice", sets: 3, reps: "3 min", rest: 30 }, { name: "Headstand Prep", sets: 3, reps: "20s", rest: 15 }, { name: "Meditation", sets: 1, reps: "5 min", rest: 0 }]
            },
            {
                week: 8, title: "Full Practice", focus: "60-minute complete yoga session",
                skills: ["Complete yoga class structure", "Breathing → Warm-up → Standing → Balance → Floor → Cool-down → Savasana"],
                drills: [{ name: "Opening Meditation", duration: "3 min", desc: "Set intention, connect with breath" }, { name: "Full 20-Min Flow", duration: "20 min", desc: "Sun Sal A×3 → Sun Sal B×2 → Warriors → Balance → Hip Openers → Backbends → Twists" }, { name: "Savasana", duration: "5 min", desc: "Complete rest, body scan, total relaxation" }],
                conditioning: [{ name: "Deep Stretching", sets: 1, reps: "5 min", rest: 0 }, { name: "Pranayama", sets: 1, reps: "3 min", rest: 0 }]
            },
        ],
        tips: "Yoga is not about touching your toes — it's about what you learn on the way down. Never force a pose. Breathe through discomfort, but stop at pain."
    },

    // ═══ 2. COUCH TO 5K ═══
    couch_to_5k: {
        id: "couch_to_5k", name: "Couch to 5K", icon: "🏃",
        desc: "Go from zero running to completing 5 kilometers in 8 weeks. Walk/run intervals that anyone can do.",
        duration: "8 weeks", daysPerWeek: 3, schedule: ["Mon", "Wed", "Fri"], restDays: ["Tue", "Thu", "Sat", "Sun"],
        curriculum: [
            { week: 1, title: "Walk/Run Intervals", focus: "60s run, 90s walk × 8", skills: ["Run at a conversational pace — if you can't talk, slow down", "Land mid-foot, not on heels", "Breathe: 2 steps inhale, 2 steps exhale"], drills: [{ name: "Walk/Run Intervals", duration: "20 min", desc: "Warm up 5 min walk. Then alternate: 60s jog / 90s walk × 8. Cool down 5 min walk." }], conditioning: [{ name: "Calf Raises", sets: 2, reps: "15", rest: 30 }, { name: "Squats", sets: 2, reps: "15", rest: 30 }] },
            { week: 2, title: "Building Rhythm", focus: "90s run, 60s walk × 8", skills: ["Find your natural rhythm", "Keep shoulders relaxed, arms at 90°", "Don't grip fists — relax hands"], drills: [{ name: "Walk/Run Intervals", duration: "22 min", desc: "5 min walk. 90s jog / 60s walk × 8. 5 min walk." }], conditioning: [{ name: "Lunges", sets: 2, reps: "10 each", rest: 30 }, { name: "Plank", sets: 2, reps: "30s", rest: 30 }] },
            { week: 3, title: "Longer Runs", focus: "3 min run, 90s walk × 4", skills: ["Pace yourself for longer intervals", "Breathe through nose if possible", "Pick a point ahead and run to it"], drills: [{ name: "Interval Run", duration: "24 min", desc: "5 min walk. 3 min run / 90s walk × 4. 5 min walk." }], conditioning: [{ name: "Calf Raises", sets: 3, reps: "15", rest: 30 }, { name: "Glute Bridge", sets: 2, reps: "15", rest: 30 }] },
            { week: 4, title: "5 Minute Runs", focus: "5 min run, 2 min walk × 3", skills: ["Mental toughness — the run gets easier after 2 minutes", "Check your form: upright posture, forward lean", "Hydrate before running"], drills: [{ name: "Interval Run", duration: "26 min", desc: "5 min walk. 5 min run / 2 min walk × 3. 5 min walk." }], conditioning: [{ name: "Squats", sets: 3, reps: "15", rest: 30 }, { name: "High Knees", sets: 2, reps: "30s", rest: 30 }] },
            { week: 5, title: "8 Minute Runs", focus: "8 min run, 2 min walk × 2, then 5 min run", skills: ["You're now running more than walking", "Start slow, finish strong", "If you need to walk, walk — but try to keep going"], drills: [{ name: "Long Intervals", duration: "30 min", desc: "5 min walk. 8 min run / 2 min walk / 8 min run / 2 min walk / 5 min run." }], conditioning: [{ name: "Walking Lunges", sets: 2, reps: "12 each", rest: 30 }, { name: "Plank", sets: 2, reps: "45s", rest: 30 }] },
            { week: 6, title: "15 Minute Runs", focus: "15 min continuous run", skills: ["Big milestone: 15 minutes non-stop!", "Find a route you enjoy", "Music or podcast can help motivation"], drills: [{ name: "Continuous Run", duration: "30 min", desc: "5 min walk. 15 min run / 3 min walk / 10 min run. 5 min walk." }], conditioning: [{ name: "Calf Raises", sets: 3, reps: "20", rest: 30 }, { name: "Squats", sets: 3, reps: "20", rest: 30 }] },
            { week: 7, title: "25 Minute Runs", focus: "25 min continuous run", skills: ["You can run for 25 minutes — trust the process", "Run by time, not distance", "Slow down if needed but don't stop"], drills: [{ name: "Continuous Run", duration: "32 min", desc: "5 min walk. 25 min continuous run. 5 min walk cool down." }], conditioning: [{ name: "Glute Bridge", sets: 3, reps: "15", rest: 30 }, { name: "Plank", sets: 3, reps: "45s", rest: 30 }] },
            { week: 8, title: "5K — You Did It!", focus: "30 min continuous run ≈ 5K", skills: ["Run for 30 minutes straight — that's approximately 5K!", "You are officially a runner", "Next goal: improve your time or train for 10K"], drills: [{ name: "5K Run", duration: "35 min", desc: "5 min walk. 30 min continuous run (your 5K!). 5 min walk." }], conditioning: [{ name: "Stretching", sets: 1, reps: "5 min", rest: 0 }, { name: "Deep Breathing", sets: 1, reps: "3 min", rest: 0 }] },
        ],
        tips: "The biggest mistake beginners make is running too fast. Slow down. If you can hold a conversation while running, you're at the right pace."
    },

    // ═══ 3. 10K TRAINING ═══
    run_10k: {
        id: "run_10k", name: "10K Training Plan", icon: "🏃",
        desc: "Already run 5K? Train for 10K with structured speed work, tempo runs, and long runs.",
        duration: "10 weeks", daysPerWeek: 4, schedule: ["Mon", "Tue", "Thu", "Sat"], restDays: ["Wed", "Fri", "Sun"],
        curriculum: [
            { week: 1, title: "Base Building", focus: "3-4 easy runs, establish base", skills: ["Easy pace: can hold conversation", "Run 4 times this week", "Total: ~15km for the week"], drills: [{ name: "Easy Run", duration: "25 min", desc: "Comfortable pace, enjoy the run" }, { name: "Tempo Run", duration: "20 min", desc: "5 min easy → 10 min slightly faster → 5 min easy" }], conditioning: [{ name: "Squats", sets: 3, reps: "15", rest: 30 }, { name: "Plank", sets: 3, reps: "30s", rest: 30 }] },
            { week: 2, title: "Adding Intervals", focus: "Speed work introduction", skills: ["Intervals improve speed and VO2 max", "Run hard for short bursts, recover, repeat"], drills: [{ name: "Interval Run", duration: "25 min", desc: "5 min warm up. 6× (1 min fast / 2 min easy). 5 min cool down." }, { name: "Easy Long Run", duration: "30 min", desc: "Comfortable pace, build endurance" }], conditioning: [{ name: "Lunges", sets: 3, reps: "12 each", rest: 30 }, { name: "Calf Raises", sets: 3, reps: "20", rest: 30 }] },
            { week: 3, title: "Tempo Runs", focus: "Comfortably hard pace", skills: ["Tempo pace: can speak in short phrases, not full sentences", "Builds lactate threshold"], drills: [{ name: "Tempo Run", duration: "30 min", desc: "5 min easy → 20 min tempo pace → 5 min easy" }, { name: "Easy Run", duration: "25 min", desc: "Recovery pace" }], conditioning: [{ name: "Glute Bridge", sets: 3, reps: "15", rest: 30 }, { name: "High Knees", sets: 3, reps: "30s", rest: 30 }] },
            { week: 4, title: "Long Run Week", focus: "Build to 7km long run", skills: ["Long slow run builds endurance", "Fuel with water, consider energy gels for 60+ min runs"], drills: [{ name: "Long Run", duration: "40 min", desc: "Easy pace, aim for ~7km" }, { name: "Interval Run", duration: "25 min", desc: "8× (1 min fast / 1 min easy)" }], conditioning: [{ name: "Squats", sets: 3, reps: "20", rest: 30 }, { name: "Plank", sets: 3, reps: "45s", rest: 30 }] },
            { week: 5, title: "Speed Development", focus: "Faster intervals", skills: ["Hill repeats build strength and speed", "Focus on driving knees up on hills"], drills: [{ name: "Hill Repeats", duration: "25 min", desc: "Find a hill. 6× run up hard, jog down easy." }, { name: "Easy Run", duration: "30 min", desc: "Comfortable pace" }], conditioning: [{ name: "Jump Squats", sets: 3, reps: "12", rest: 45 }, { name: "Calf Raises", sets: 3, reps: "25", rest: 30 }] },
            { week: 6, title: "Build to 8km", focus: "Increasing long run distance", skills: ["Your body is adapting — trust the training", "Negative splits: run the second half faster than the first"], drills: [{ name: "Long Run", duration: "45 min", desc: "Easy pace, aim for ~8km with negative splits" }, { name: "Tempo Run", duration: "30 min", desc: "5 min easy → 20 min tempo → 5 min easy" }], conditioning: [{ name: "Walking Lunges", sets: 3, reps: "15 each", rest: 30 }, { name: "Plank", sets: 3, reps: "60s", rest: 30 }] },
            { week: 7, title: "Race Pace Practice", focus: "Run at target 10K pace", skills: ["Practice running at race pace", "Know your target time and pace per km"], drills: [{ name: "Race Pace Run", duration: "30 min", desc: "5 min easy → 20 min at target 10K pace → 5 min easy" }, { name: "Easy Recovery", duration: "25 min", desc: "Very easy pace, active recovery" }], conditioning: [{ name: "Squats", sets: 3, reps: "15", rest: 30 }, { name: "Stretching", sets: 1, reps: "5 min", rest: 0 }] },
            { week: 8, title: "Peak: 9km Long Run", focus: "Almost there!", skills: ["Run 9km at easy pace — you're ready for 10K", "Mental preparation: visualize your race"], drills: [{ name: "Long Run", duration: "50 min", desc: "Easy pace, aim for 9km" }, { name: "Short Intervals", duration: "20 min", desc: "4× (2 min fast / 2 min easy)" }], conditioning: [{ name: "Glute Bridge", sets: 3, reps: "15", rest: 30 }, { name: "Plank", sets: 3, reps: "60s", rest: 30 }] },
            { week: 9, title: "Taper Week", focus: "Reduce volume, stay sharp", skills: ["Taper: less running, more rest before race day", "Your body needs rest to perform its best"], drills: [{ name: "Easy Run", duration: "20 min", desc: "Short, easy, just keep legs moving" }, { name: "Strides", duration: "15 min", desc: "5 min easy → 6× 20s fast strides → 5 min easy" }], conditioning: [{ name: "Light Stretching", sets: 1, reps: "5 min", rest: 0 }, { name: "Deep Breathing", sets: 1, reps: "3 min", rest: 0 }] },
            { week: 10, title: "RACE DAY: 10K!", focus: "Run your first 10K!", skills: ["Start slower than you think", "Push in the last 2km", "Celebrate — you earned this!"], drills: [{ name: "10K Run", duration: "55 min", desc: "Run 10 kilometers. Start easy, build through the middle, give everything in the last 2km." }], conditioning: [{ name: "Stretching", sets: 1, reps: "10 min", rest: 0 }] },
        ],
        tips: "Don't increase weekly mileage by more than 10%. Most runs should be easy — save intensity for interval and tempo days."
    },

    // ═══ 4. HIIT FAT BURNER ═══
    hiit_burner: {
        id: "hiit_burner", name: "HIIT Fat Burner", icon: "⚡",
        desc: "High-intensity interval training. Maximum calorie burn in minimum time. 25-minute sessions.",
        duration: "8 weeks", daysPerWeek: 3, schedule: ["Mon", "Wed", "Fri"], restDays: ["Tue", "Thu", "Sat", "Sun"],
        curriculum: [
            { week: 1, title: "HIIT Foundations", focus: "20s work / 40s rest × 8 exercises", skills: ["Work as hard as you can during work intervals", "Fully rest during rest intervals", "Focus on form even when tired"], drills: [{ name: "HIIT Circuit", duration: "12 min", desc: "20s work / 40s rest: Jumping Jacks → Squats → Push Ups → High Knees → Lunges → Mountain Climbers → Burpees → Plank" }], conditioning: [{ name: "Cool Down Walk", sets: 1, reps: "3 min", rest: 0 }, { name: "Stretching", sets: 1, reps: "3 min", rest: 0 }] },
            { week: 2, title: "Increasing Work", focus: "25s work / 35s rest", skills: ["Push harder during work intervals", "Track how many reps you can do in each interval"], drills: [{ name: "HIIT Circuit", duration: "14 min", desc: "25s work / 35s rest: Jump Squats → Push Ups → Butt Kicks → Burpees → Bicycle Crunches → High Knees → Lunges → Mountain Climbers → Plank" }], conditioning: [{ name: "Walk", sets: 1, reps: "3 min", rest: 0 }, { name: "Stretch", sets: 1, reps: "3 min", rest: 0 }] },
            { week: 3, title: "30/30 Intervals", focus: "Equal work and rest", skills: ["30s on / 30s off — the classic HIIT ratio", "Don't slow down in the last rounds"], drills: [{ name: "HIIT Circuit", duration: "16 min", desc: "30s/30s × 8 exercises, 2 rounds" }], conditioning: [{ name: "Walk", sets: 1, reps: "3 min", rest: 0 }, { name: "Stretch", sets: 1, reps: "3 min", rest: 0 }] },
            { week: 4, title: "Tabata Introduction", focus: "20s work / 10s rest (Tabata protocol)", skills: ["Tabata: the most efficient HIIT format", "8 rounds of 20s max effort / 10s rest = 4 minutes of hell", "Do 2 Tabata blocks with 2 min rest between"], drills: [{ name: "Tabata Block 1", duration: "4 min", desc: "20s/10s × 8: Burpees" }, { name: "Tabata Block 2", duration: "4 min", desc: "20s/10s × 8: Mountain Climbers" }], conditioning: [{ name: "Walk", sets: 1, reps: "3 min", rest: 0 }, { name: "Stretch", sets: 1, reps: "5 min", rest: 0 }] },
            { week: 5, title: "Complexity Up", focus: "Compound movements, harder exercises", skills: ["Combine movements: squat + press, lunge + twist", "More muscles = more calories burned"], drills: [{ name: "Complex HIIT", duration: "18 min", desc: "30s/20s: Squat Jumps → Push Up + Shoulder Tap → Lunge Jumps → Burpee + Tuck Jump → Bear Crawl → V-Ups. 3 rounds." }], conditioning: [{ name: "Walk", sets: 1, reps: "3 min", rest: 0 }, { name: "Stretch", sets: 1, reps: "3 min", rest: 0 }] },
            { week: 6, title: "AMRAP Rounds", focus: "As Many Reps As Possible", skills: ["AMRAP: do as many rounds as possible in the time limit", "Track your score — beat it next time"], drills: [{ name: "12-Min AMRAP", duration: "12 min", desc: "10 Burpees → 15 Squats → 20 Mountain Climbers → 10 Push Ups. Repeat for 12 min." }], conditioning: [{ name: "Walk", sets: 1, reps: "3 min", rest: 0 }, { name: "Stretch", sets: 1, reps: "5 min", rest: 0 }] },
            { week: 7, title: "EMOM Training", focus: "Every Minute On the Minute", skills: ["EMOM: start exercise at top of each minute", "Finish fast = more rest. Finish slow = less rest.", "Great for building work capacity"], drills: [{ name: "20-Min EMOM", duration: "20 min", desc: "Min 1: 10 Burpees. Min 2: 15 Squats. Min 3: 10 Push Ups. Min 4: 20 High Knees. Repeat 5x." }], conditioning: [{ name: "Walk", sets: 1, reps: "3 min", rest: 0 }, { name: "Stretch", sets: 1, reps: "5 min", rest: 0 }] },
            { week: 8, title: "Ultimate HIIT Challenge", focus: "Test your limits", skills: ["Everything you've built leads to this", "Give maximum effort in every interval", "Compare your scores to week 1"], drills: [{ name: "Tabata × 4", duration: "20 min", desc: "4 Tabata blocks (20s/10s × 8): Burpees → Jump Squats → Mountain Climbers → Push Ups. 2 min rest between blocks." }], conditioning: [{ name: "Cool Down", sets: 1, reps: "5 min", rest: 0 }, { name: "Deep Stretch", sets: 1, reps: "5 min", rest: 0 }] },
        ],
        tips: "HIIT works because of intensity, not duration. 20 minutes of real HIIT beats 60 minutes of moderate cardio. But you MUST push hard during work intervals."
    },

    // ═══ 5. FLEXIBILITY & MOBILITY ═══
    flexibility: {
        id: "flexibility", name: "Flexibility & Mobility", icon: "🤸",
        desc: "Improve range of motion, reduce injury risk, and feel better in your body. Work toward full splits.",
        duration: "8 weeks", daysPerWeek: 4, schedule: ["Mon", "Tue", "Thu", "Fri"], restDays: ["Wed", "Sat", "Sun"],
        curriculum: [
            { week: 1, title: "Baseline Assessment", focus: "Test your current flexibility, establish routine", skills: ["Hamstring test: sit and reach", "Hip test: pigeon pose depth", "Shoulder test: behind-back clasp"], drills: [{ name: "Full Body Stretch", duration: "15 min", desc: "30s each: neck circles, shoulder stretch, chest opener, hip flexor, hamstring, quad, calf, ankle circles" }], conditioning: [{ name: "Cat-Cow", sets: 3, reps: "10", rest: 10 }, { name: "Child's Pose", sets: 3, reps: "30s", rest: 10 }] },
            { week: 2, title: "Hamstring Focus", focus: "Most common tight area", skills: ["Forward fold progression", "Single leg stretch", "PNF stretching technique"], drills: [{ name: "Hamstring Routine", duration: "15 min", desc: "Standing forward fold 60s → Seated reach 60s → Single leg stretch 45s each → Lying hamstring 60s each" }], conditioning: [{ name: "Leg Swings", sets: 2, reps: "15 each", rest: 10 }, { name: "Downward Dog", sets: 3, reps: "30s", rest: 10 }] },
            { week: 3, title: "Hip Opening", focus: "Hips hold tension from sitting", skills: ["Deep lunge progression", "Pigeon pose", "90/90 stretch"], drills: [{ name: "Hip Routine", duration: "15 min", desc: "Low lunge 60s each → Pigeon 90s each → 90/90 sit 60s each → Butterfly 60s → Frog stretch 60s" }], conditioning: [{ name: "Hip Circles", sets: 2, reps: "10 each direction", rest: 10 }, { name: "Squat Hold", sets: 3, reps: "30s", rest: 15 }] },
            { week: 4, title: "Shoulders & Upper Back", focus: "Counter desk posture", skills: ["Shoulder dislocations with band/towel", "Thread the needle", "Wall slides"], drills: [{ name: "Upper Body Mobility", duration: "15 min", desc: "Shoulder circles → Thread the needle 45s each → Door frame chest stretch 45s each → Wall angels 10 reps → Thoracic extension 60s" }], conditioning: [{ name: "Arm Circles", sets: 2, reps: "20 each", rest: 10 }, { name: "Cat-Cow", sets: 3, reps: "10", rest: 10 }] },
            { week: 5, title: "Front Splits Prep", focus: "Work toward front splits", skills: ["Low lunge progression", "Half split (runner's stretch)", "Active flexibility: kicking drills"], drills: [{ name: "Splits Routine", duration: "18 min", desc: "Low lunge 90s each → Half split 90s each → Pigeon 90s each → Front split attempt 60s each (use blocks)" }], conditioning: [{ name: "Leg Swings Front/Back", sets: 2, reps: "15 each", rest: 10 }, { name: "Standing Quad Pull", sets: 2, reps: "45s each", rest: 10 }] },
            { week: 6, title: "Middle Splits Prep", focus: "Open the inner thighs", skills: ["Wide straddle progression", "Frog stretch", "Pancake stretch"], drills: [{ name: "Middle Split Routine", duration: "18 min", desc: "Butterfly 60s → Frog stretch 90s → Wide straddle seated 90s → Wall middle split 90s → Cossack squat 45s each" }], conditioning: [{ name: "Sumo Squat Hold", sets: 3, reps: "30s", rest: 15 }, { name: "Side Lunges", sets: 2, reps: "10 each", rest: 15 }] },
            { week: 7, title: "Full Body Flow", focus: "Combined flexibility session", skills: ["Flow between stretches without rest", "Use breathing to deepen each stretch", "Hold longer: 90-120 seconds per stretch"], drills: [{ name: "20-Min Flow", duration: "20 min", desc: "Down Dog → Low Lunge → Pigeon → Seated Forward Fold → Straddle → Butterfly → Spine Twist → Bridge → Child's Pose" }], conditioning: [{ name: "Deep Breathing", sets: 1, reps: "3 min", rest: 0 }] },
            { week: 8, title: "Test & Progress", focus: "Re-test flexibility, celebrate progress", skills: ["Compare to week 1 baseline", "Take progress photos", "Set next flexibility goal"], drills: [{ name: "Flexibility Test", duration: "10 min", desc: "Re-test all baseline positions: sit and reach, pigeon depth, splits distance" }, { name: "Full Practice", duration: "15 min", desc: "Complete flexibility routine using all techniques learned" }], conditioning: [{ name: "Meditation", sets: 1, reps: "5 min", rest: 0 }] },
        ],
        tips: "Stretch when warm, never cold. Hold each stretch at least 30 seconds — the real change happens after 30s. Breathe deeply into tight areas."
    },

    // ═══ 6. POWERLIFTING ═══
    powerlifting: {
        id: "powerlifting", name: "Strength & Power", icon: "🏋️",
        desc: "Get seriously strong. Focus on the big 3: Squat, Bench Press, Deadlift. For experienced lifters.",
        duration: "12 weeks", daysPerWeek: 4, schedule: ["Mon", "Tue", "Thu", "Fri"], restDays: ["Wed", "Sat", "Sun"],
        phases: [
            {
                name: "Volume Phase", weeks: "1-4", focus: "Build work capacity at moderate weights",
                days: {
                    squat_bench: {
                        name: "Squat + Bench", exercises: [
                            { name: "Squats", sets: 5, reps: "5", rest: 180, progression: "+2.5kg/week" },
                            { name: "Bench Press", sets: 5, reps: "5", rest: 180, progression: "+1.25kg/week" },
                            { name: "Bent Over Row", sets: 3, reps: "8", rest: 90, progression: "+2.5kg/week" },
                            { name: "Shoulder Press", sets: 3, reps: "8", rest: 90, progression: "+1kg/week" },
                            { name: "Plank", sets: 3, reps: "60s", rest: 45, progression: "+10s/week" },
                        ]
                    },
                    deadlift_bench: {
                        name: "Deadlift + Bench", exercises: [
                            { name: "Deadlift", sets: 5, reps: "5", rest: 180, progression: "+5kg/week" },
                            { name: "Bench Press", sets: 3, reps: "8", rest: 120, progression: "+1.25kg/week" },
                            { name: "Pull Ups", sets: 3, reps: "max", rest: 90, progression: "+1 rep/week" },
                            { name: "Romanian Deadlift", sets: 3, reps: "8", rest: 90, progression: "+2.5kg/week" },
                            { name: "Hanging Leg Raise", sets: 3, reps: "10", rest: 45, progression: "+2 reps/week" },
                        ]
                    },
                },
                weekPattern: ["squat_bench", "deadlift_bench", "squat_bench", "deadlift_bench"],
            },
            {
                name: "Intensity Phase", weeks: "5-8", focus: "Heavier singles, doubles, triples",
                days: {
                    squat_bench: {
                        name: "Heavy Squat + Bench", exercises: [
                            { name: "Squats", sets: 5, reps: "3", rest: 240, progression: "+2.5kg/week" },
                            { name: "Bench Press", sets: 5, reps: "3", rest: 240, progression: "+1.25kg/week" },
                            { name: "Bent Over Row", sets: 4, reps: "6", rest: 120, progression: "+2.5kg/week" },
                            { name: "Tricep Dips", sets: 3, reps: "max", rest: 90, progression: "+1 rep/week" },
                        ]
                    },
                    deadlift_bench: {
                        name: "Heavy Deadlift + Bench", exercises: [
                            { name: "Deadlift", sets: 5, reps: "3", rest: 240, progression: "+2.5kg/week" },
                            { name: "Bench Press", sets: 3, reps: "5", rest: 180, progression: "+1.25kg/week" },
                            { name: "Pull Ups", sets: 4, reps: "max", rest: 90, progression: "+1 rep/week" },
                            { name: "Hip Thrust", sets: 3, reps: "8", rest: 90, progression: "+5kg/week" },
                        ]
                    },
                },
                weekPattern: ["squat_bench", "deadlift_bench", "squat_bench", "deadlift_bench"],
            },
            {
                name: "Peaking Phase", weeks: "9-12", focus: "Test your 1RM, hit new PRs",
                days: {
                    squat_bench: {
                        name: "Peak Squat + Bench", exercises: [
                            { name: "Squats", sets: 3, reps: "2", rest: 300, progression: "+1.25kg/week" },
                            { name: "Bench Press", sets: 3, reps: "2", rest: 300, progression: "+1.25kg/week" },
                            { name: "Bent Over Row", sets: 3, reps: "5", rest: 120, progression: "+2.5kg/week" },
                        ]
                    },
                    deadlift_bench: {
                        name: "Peak Deadlift", exercises: [
                            { name: "Deadlift", sets: 3, reps: "2", rest: 300, progression: "+2.5kg/week" },
                            { name: "Bench Press", sets: 3, reps: "3", rest: 180, progression: "+1.25kg/week" },
                            { name: "Pull Ups", sets: 3, reps: "max", rest: 90, progression: "+1 rep/week" },
                        ]
                    },
                },
                weekPattern: ["squat_bench", "deadlift_bench", "squat_bench", "deadlift_bench"],
            },
        ],
        deloadEvery: 4,
        tips: "Powerlifting is about patience. Add weight slowly. A 2.5kg increase every week is 130kg in a year. Rest 3-5 min between heavy sets."
    },

    // ═══ 7. CALISTHENICS MASTERY ═══
    calisthenics: {
        id: "calisthenics", name: "Calisthenics Mastery", icon: "💪",
        desc: "Master your bodyweight. Progress from basics to muscle-ups, handstands, and advanced holds.",
        duration: "12 weeks", daysPerWeek: 4, schedule: ["Mon", "Tue", "Thu", "Fri"], restDays: ["Wed", "Sat", "Sun"],
        curriculum: [
            { week: 1, title: "Foundation Strength", focus: "Perfect the basics", skills: ["Perfect Push Up — full range, core tight", "Perfect Pull Up — dead hang to chin over bar", "Perfect Squat — below parallel, no heel lift"], drills: [{ name: "Push Up Test", duration: "2 min", desc: "Max perfect push ups — record your number" }, { name: "Pull Up Test", duration: "2 min", desc: "Max pull ups (or negatives if 0)" }, { name: "Pistol Squat Prep", duration: "3 min", desc: "Assisted single leg squats, hold support" }], conditioning: [{ name: "Push Ups", sets: 4, reps: "max", rest: 60 }, { name: "Pull Ups", sets: 4, reps: "max", rest: 90 }, { name: "Squats", sets: 3, reps: "20", rest: 60 }] },
            { week: 2, title: "Dip Progression", focus: "Master the dip for pushing strength", skills: ["Bench Dips → Parallel Dips → Ring Dips", "Dip is the squat of the upper body", "Keep elbows close, lean slightly forward for chest"], drills: [{ name: "Dip Progression", duration: "4 min", desc: "3× max reps at your current level" }, { name: "Push Up Variations", duration: "4 min", desc: "Wide → Diamond → Decline, 10 each" }, { name: "L-Sit Prep", duration: "3 min", desc: "Tuck L-Sit on parallel bars, hold max" }], conditioning: [{ name: "Dips", sets: 4, reps: "max", rest: 90 }, { name: "Push Ups", sets: 3, reps: "max", rest: 60 }, { name: "Plank", sets: 3, reps: "60s", rest: 30 }] },
            { week: 3, title: "Pull Strength", focus: "Build toward muscle-up", skills: ["High Pull Ups — pull to chest, not just chin", "Explosive Pull Ups — generate momentum", "Negative Muscle Up — jump up, lower slowly"], drills: [{ name: "High Pull Ups", duration: "4 min", desc: "Pull as high as possible each rep" }, { name: "Explosive Pulls", duration: "3 min", desc: "Pull fast, try to get chest to bar" }, { name: "Muscle Up Negatives", duration: "3 min", desc: "Jump to top of muscle up, lower slowly (5 sec)" }], conditioning: [{ name: "Pull Ups", sets: 5, reps: "max", rest: 90 }, { name: "Chin Ups", sets: 3, reps: "max", rest: 60 }, { name: "Dead Hang", sets: 3, reps: "30s", rest: 30 }] },
            { week: 4, title: "Handstand Prep", focus: "Inversion and balance", skills: ["Wall Handstand — kick up, hold against wall", "Shoulder strength for handstands", "Core control upside down"], drills: [{ name: "Wall Handstand", duration: "5 min", desc: "Kick up to wall, hold 20-30s × 5 attempts" }, { name: "Pike Push Ups", duration: "3 min", desc: "Feet elevated, push up targeting shoulders" }, { name: "Hollow Body Hold", duration: "3 min", desc: "Lie on back, arms/legs extended, hold" }], conditioning: [{ name: "Wall Handstand", sets: 5, reps: "20s", rest: 60 }, { name: "Pike Push Ups", sets: 3, reps: "max", rest: 60 }, { name: "Hollow Hold", sets: 3, reps: "20s", rest: 30 }] },
            { week: 5, title: "Leg Mastery", focus: "Single leg strength", skills: ["Pistol Squat progression", "Jump training — box jumps, tuck jumps", "Nordic curl progression"], drills: [{ name: "Pistol Squat Prep", duration: "5 min", desc: "Assisted pistol squats, reduce assistance each rep" }, { name: "Jump Training", duration: "3 min", desc: "Box jumps or tuck jumps × 10" }, { name: "Nordic Curl Negatives", duration: "3 min", desc: "Kneel, slowly lower forward, push back up" }], conditioning: [{ name: "Pistol Squats", sets: 3, reps: "max each", rest: 60 }, { name: "Jump Squats", sets: 3, reps: "15", rest: 45 }, { name: "Calf Raises", sets: 3, reps: "25", rest: 30 }] },
            { week: 6, title: "Core Mastery", focus: "Advanced core strength", skills: ["L-Sit on bars or floor", "Dragon Flags", "Front Lever progression"], drills: [{ name: "L-Sit Practice", duration: "4 min", desc: "Hold L-Sit as long as possible × 5" }, { name: "Dragon Flag Negatives", duration: "3 min", desc: "Lie on bench, lower legs slowly in straight line" }, { name: "Tuck Front Lever", duration: "3 min", desc: "Hang from bar, bring knees to chest, hold horizontal" }], conditioning: [{ name: "L-Sit", sets: 5, reps: "max hold", rest: 60 }, { name: "Hanging Leg Raise", sets: 3, reps: "10", rest: 45 }, { name: "Ab Wheel Rollout", sets: 3, reps: "8", rest: 45 }] },
            { week: 7, title: "Muscle Up Training", focus: "The king of calisthenics", skills: ["Kipping muscle up — use momentum to learn the transition", "False grip — wrists over bar, key for strict muscle up", "Transition training — the hardest part"], drills: [{ name: "False Grip Hang", duration: "3 min", desc: "Hang with wrists over bar, hold 15s × 5" }, { name: "Transition Practice", duration: "5 min", desc: "Band-assisted muscle ups or jumping muscle ups" }, { name: "High Pull to Dip", duration: "3 min", desc: "High pull up → immediately dip = muscle up" }], conditioning: [{ name: "Muscle Up Attempts", sets: 5, reps: "max", rest: 120 }, { name: "Pull Ups", sets: 3, reps: "max", rest: 60 }, { name: "Dips", sets: 3, reps: "max", rest: 60 }] },
            { week: 8, title: "Planche Prep", focus: "The ultimate push strength", skills: ["Planche lean — lean forward in push up position", "Tuck Planche — hold tuck position off ground", "Straight arm strength"], drills: [{ name: "Planche Lean", duration: "4 min", desc: "Push up position, lean forward until shoulders past wrists" }, { name: "Tuck Planche", duration: "4 min", desc: "From push up, tuck knees to chest, lift feet" }, { name: "Pseudo Planche Push Ups", duration: "3 min", desc: "Push ups with hands by waist" }], conditioning: [{ name: "Planche Lean Hold", sets: 5, reps: "15s", rest: 60 }, { name: "Pseudo Planche Push Ups", sets: 3, reps: "max", rest: 60 }, { name: "Handstand Hold", sets: 3, reps: "max", rest: 60 }] },
            { week: 9, title: "Skill Combos", focus: "Chain skills together", skills: ["Muscle Up to Dip", "Handstand Push Up", "Pistol Squat to Jump"], drills: [{ name: "Combo Practice", duration: "6 min", desc: "Muscle Up → 3 Dips → Muscle Down. Repeat." }, { name: "Handstand Push Up", duration: "4 min", desc: "Wall handstand push ups, go as low as possible" }, { name: "Pistol to Jump", duration: "3 min", desc: "Pistol squat, explode up to jump at the top" }], conditioning: [{ name: "Full Workout", sets: 1, reps: "20 min", rest: 0 }] },
            { week: 10, title: "Front Lever", focus: "Horizontal pull strength", skills: ["Tuck Front Lever → Advanced Tuck → One Leg → Full", "Requires massive lat and core strength"], drills: [{ name: "Front Lever Progression", duration: "5 min", desc: "Hold your current progression level × 5 max holds" }, { name: "Front Lever Rows", duration: "4 min", desc: "In tuck lever, pull chest to bar" }, { name: "Supplemental Pulls", duration: "3 min", desc: "Pull Ups, Chin Ups, Rows" }], conditioning: [{ name: "Front Lever Holds", sets: 5, reps: "max", rest: 90 }, { name: "Pull Ups", sets: 4, reps: "max", rest: 60 }] },
            { week: 11, title: "Back Lever & Flags", focus: "Straight arm pushing/pulling", skills: ["Back Lever — hang and rotate backward", "Human Flag — hold body horizontal on pole", "These are long-term goals — start the progression"], drills: [{ name: "Back Lever Tuck", duration: "4 min", desc: "Hang from bar, tuck knees, rotate backward, hold" }, { name: "Flag Prep", duration: "4 min", desc: "On pole: bottom hand pushes, top hand pulls, tuck legs" }, { name: "Skill Work", duration: "5 min", desc: "Practice your weakest skill" }], conditioning: [{ name: "Full Upper Body", sets: 1, reps: "15 min", rest: 0 }] },
            { week: 12, title: "Skills Showcase", focus: "Show what you've learned", skills: ["Perform all skills: Muscle Up, Handstand, Pistol, L-Sit, Front Lever attempt", "Record yourself — compare to week 1", "Set goals for next 12 weeks"], drills: [{ name: "Skills Test", duration: "10 min", desc: "Attempt each skill: Muscle Up, Handstand, Pistol Squat, L-Sit, Front Lever" }, { name: "Max Rep Test", duration: "5 min", desc: "Max Push Ups, Max Pull Ups, Max Dips — compare to week 1" }], conditioning: [{ name: "Celebration Workout", sets: 1, reps: "15 min", rest: 0 }] },
        ],
        tips: "Calisthenics is about progressive skill development. Master each progression before moving to the next. Record your attempts — small improvements compound."
    },

    // ═══ 8. POSTURE CORRECTION ═══
    posture_fix: {
        id: "posture_fix", name: "Posture Correction", icon: "🧑‍💻",
        desc: "Fix desk posture: forward head, rounded shoulders, tight hips. Feel taller and pain-free.",
        duration: "6 weeks", daysPerWeek: 5, schedule: ["Mon", "Tue", "Wed", "Thu", "Fri"], restDays: ["Sat", "Sun"],
        curriculum: [
            { week: 1, title: "Awareness & Assessment", focus: "Identify your posture problems", skills: ["Wall Test — stand against wall: head, shoulders, butt, heels should touch", "Phone Posture — chin tuck, raise phone to eye level", "Desk Setup — screen at eye level, feet flat, 90° elbows"], drills: [{ name: "Wall Angels", duration: "3 min", desc: "Back to wall, slide arms up and down like snow angels" }, { name: "Chin Tucks", duration: "2 min", desc: "Pull chin straight back (double chin). Hold 5s × 10" }, { name: "Chest Opener", duration: "3 min", desc: "Clasp hands behind back, squeeze shoulder blades, lift chest" }], conditioning: [{ name: "Wall Angels", sets: 3, reps: "10", rest: 15 }, { name: "Chin Tucks", sets: 3, reps: "10", rest: 10 }, { name: "Cat-Cow", sets: 3, reps: "10", rest: 10 }] },
            { week: 2, title: "Upper Back Strengthening", focus: "Strengthen the muscles that pull shoulders back", skills: ["Rhomboids and lower traps are weak in desk workers", "Strengthening them pulls shoulders back naturally"], drills: [{ name: "Band Pull Aparts", duration: "3 min", desc: "Hold band at chest height, pull apart squeezing back" }, { name: "Superman Y-Raise", duration: "3 min", desc: "Lie face down, arms in Y shape, lift and hold 3s" }, { name: "Face Down Rows", duration: "3 min", desc: "Lie on bench face down, row dumbbells back" }], conditioning: [{ name: "Superman Y-Raise", sets: 3, reps: "12", rest: 30 }, { name: "Plank", sets: 3, reps: "30s", rest: 15 }, { name: "Wall Angels", sets: 3, reps: "10", rest: 15 }] },
            { week: 3, title: "Hip Flexor Release", focus: "Sitting tightens hip flexors — releasing them fixes pelvic tilt", skills: ["Anterior pelvic tilt: tight hip flexors pull pelvis forward", "Stretching hip flexors + strengthening glutes fixes this"], drills: [{ name: "Hip Flexor Stretch", duration: "3 min", desc: "Half kneeling, push hips forward, hold 45s each side" }, { name: "Glute Activation", duration: "3 min", desc: "Glute bridges with 3s squeeze at top" }, { name: "Dead Bug", duration: "3 min", desc: "Lie on back, alternate extending opposite arm/leg" }], conditioning: [{ name: "Hip Flexor Stretch", sets: 2, reps: "45s each", rest: 10 }, { name: "Glute Bridge", sets: 3, reps: "15", rest: 30 }, { name: "Dead Bug", sets: 3, reps: "10 each", rest: 15 }] },
            { week: 4, title: "Neck & Shoulder Release", focus: "Counter forward head posture", skills: ["Suboccipital release — tennis ball under base of skull", "Neck stretches — ear to shoulder", "Upper trap release"], drills: [{ name: "Neck Stretches", duration: "3 min", desc: "Ear to shoulder, hold 30s each side. Then chin to chest 30s." }, { name: "Thoracic Extension", duration: "3 min", desc: "Foam roller under upper back, extend over it, arms overhead" }, { name: "Levator Scapulae Stretch", duration: "3 min", desc: "Turn head 45°, look down, gentle pull with hand" }], conditioning: [{ name: "Chin Tucks", sets: 3, reps: "10", rest: 10 }, { name: "Neck Stretches", sets: 2, reps: "30s each", rest: 10 }, { name: "Shoulder Rolls", sets: 3, reps: "10 each direction", rest: 10 }] },
            { week: 5, title: "Core Stability", focus: "Deep core holds posture from the inside", skills: ["Transverse Abdominis — deep core muscle that stabilizes spine", "Diaphragmatic breathing — breathe into belly, not chest", "Anti-rotation exercises"], drills: [{ name: "Diaphragmatic Breathing", duration: "3 min", desc: "Hand on belly, breathe into hand — belly rises first" }, { name: "Pallof Press", duration: "3 min", desc: "Band at chest, press out, resist rotation. Hold 5s × 10" }, { name: "Bird Dog", duration: "3 min", desc: "All fours, extend opposite arm/leg, hold 5s" }], conditioning: [{ name: "Bird Dog", sets: 3, reps: "10 each", rest: 15 }, { name: "Dead Bug", sets: 3, reps: "10 each", rest: 15 }, { name: "Plank", sets: 3, reps: "30s", rest: 15 }] },
            { week: 6, title: "Daily Posture Habit", focus: "Make good posture automatic", skills: ["Posture check every hour — set a timer", "Desk exercise routine — do these 3 exercises hourly", "Sleep posture — pillow height, sleeping position"], drills: [{ name: "Hourly Reset", duration: "2 min", desc: "Every hour: 5 chin tucks, 10 shoulder rolls, 15s chest stretch" }, { name: "Full Posture Routine", duration: "10 min", desc: "Wall angels → Cat-cow → Hip flexor stretch → Glute bridge → Superman → Chin tucks" }, { name: "Posture Check", duration: "2 min", desc: "Wall test: can head, shoulders, butt all touch? Compare to week 1" }], conditioning: [{ name: "Full Routine", sets: 1, reps: "10 min", rest: 0 }, { name: "Deep Breathing", sets: 1, reps: "3 min", rest: 0 }] },
        ],
        tips: "Posture correction is 80% awareness and 20% exercise. Set an hourly alarm to check your posture. The exercises fix the muscles, but YOU have to remember to sit up straight."
    },

    // ═══ 9. MEDITATION & BREATHWORK ═══
    meditation: {
        id: "meditation", name: "Meditation & Breathwork", icon: "🧘",
        desc: "Train your mind. Reduce stress, improve focus, sleep better. From 2 minutes to 20.",
        duration: "6 weeks", daysPerWeek: 5, schedule: ["Mon", "Tue", "Wed", "Thu", "Fri"], restDays: ["Sat", "Sun"],
        curriculum: [
            { week: 1, title: "Just Breathe", focus: "2-minute sessions, learn to sit still", skills: ["Find a quiet spot, sit comfortably", "Close eyes, focus on breath", "When mind wanders (it will), gently return to breath"], drills: [{ name: "2-Min Breath Focus", duration: "2 min", desc: "Sit comfortably, close eyes, count each exhale up to 10. Start over when you lose count." }], conditioning: [{ name: "Body Scan", sets: 1, reps: "1 min", rest: 0 }] },
            { week: 2, title: "Box Breathing", focus: "4-4-4-4 pattern, used by Navy SEALs", skills: ["Inhale 4s → Hold 4s → Exhale 4s → Hold 4s", "Activates parasympathetic nervous system", "Use before stressful situations"], drills: [{ name: "Box Breathing", duration: "4 min", desc: "Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat for 4 minutes." }, { name: "Breath Focus", duration: "3 min", desc: "Focus only on the sensation of air entering and leaving nostrils" }], conditioning: [{ name: "Box Breathing", sets: 1, reps: "4 min", rest: 0 }] },
            { week: 3, title: "Body Scan Meditation", focus: "5-minute sessions", skills: ["Scan from toes to head", "Notice sensations without judging", "Release tension in each area"], drills: [{ name: "Body Scan", duration: "5 min", desc: "Start at toes. Slowly move attention up: feet, calves, thighs, hips, belly, chest, hands, arms, shoulders, neck, face, head. Notice each area." }], conditioning: [{ name: "3 Deep Breaths", sets: 3, reps: "1 each", rest: 10 }] },
            { week: 4, title: "Wim Hof Breathing", focus: "Power breathing for energy", skills: ["30 deep breaths → hold empty → recovery breath", "Increases oxygen, alkalizes blood, boosts alertness", "May feel tingling — this is normal"], drills: [{ name: "Wim Hof Round", duration: "5 min", desc: "Lie down. 30 deep breaths (in through nose, out through mouth). After 30th exhale, hold empty as long as comfortable. Inhale, hold 15s. That's 1 round. Do 3 rounds." }], conditioning: [{ name: "Cold Exposure", sets: 1, reps: "30s cold shower", rest: 0 }] },
            { week: 5, title: "Mindfulness", focus: "10-minute sessions", skills: ["Observe thoughts without engaging", "Label thoughts: 'thinking', 'planning', 'remembering'", "Return to breath anchor"], drills: [{ name: "10-Min Mindfulness", duration: "10 min", desc: "Sit comfortably. Focus on breath. When thoughts arise, label them ('thinking') and return to breath. No judgment." }, { name: "Walking Meditation", duration: "5 min", desc: "Walk slowly. Feel each step: heel, ball, toes. Be fully present." }], conditioning: [{ name: "Gratitude", sets: 1, reps: "3 things", rest: 0 }] },
            { week: 6, title: "20-Minute Practice", focus: "Full meditation session", skills: ["20 minutes of uninterrupted practice", "Mix techniques: breath focus → body scan → open awareness", "This is now YOUR practice — customize it"], drills: [{ name: "Full Practice", duration: "20 min", desc: "5 min breath focus → 5 min body scan → 5 min open awareness → 5 min loving-kindness (send good wishes to yourself and others)" }], conditioning: [{ name: "Journal", sets: 1, reps: "2 min", rest: 0 }] },
        ],
        tips: "The goal isn't to stop thinking — it's to notice when you're thinking and choose to return to the present. A wandering mind is not failure; noticing it wandered is success."
    },

    // ═══ 10. WOMEN'S GLUTE & TONE ═══
    womens_tone: {
        id: "womens_tone", name: "Glute & Tone", icon: "🍑",
        desc: "Build a strong, toned physique. Emphasis on glutes, legs, and full-body sculpting.",
        duration: "8 weeks", daysPerWeek: 4, schedule: ["Mon", "Tue", "Thu", "Fri"], restDays: ["Wed", "Sat", "Sun"],
        phases: [{
            name: "Sculpt Phase", weeks: "1-8", focus: "Build muscle tone and shape",
            days: {
                glutes_legs: {
                    name: "Glutes & Legs", exercises: [
                        { name: "Hip Thrust", sets: 4, reps: "12", rest: 60, progression: "+2.5kg/week" },
                        { name: "Sumo Squat", sets: 4, reps: "12", rest: 60, progression: "+2.5kg/week" },
                        { name: "Bulgarian Split Squat", sets: 3, reps: "10 each", rest: 60, progression: "+2kg/week" },
                        { name: "Romanian Deadlift", sets: 3, reps: "12", rest: 60, progression: "+2.5kg/week" },
                        { name: "Glute Bridge", sets: 3, reps: "15", rest: 45, progression: "+2.5kg/week" },
                        { name: "Calf Raises", sets: 3, reps: "20", rest: 30, progression: "+2.5kg/week" },
                    ]
                },
                upper_core: {
                    name: "Upper Body & Core", exercises: [
                        { name: "Push Ups", sets: 3, reps: "max", rest: 60, progression: "+2 reps/week" },
                        { name: "Dumbbell Row", sets: 3, reps: "12", rest: 60, progression: "+1kg/week" },
                        { name: "Shoulder Press", sets: 3, reps: "12", rest: 60, progression: "+1kg/week" },
                        { name: "Lateral Raise", sets: 3, reps: "15", rest: 45, progression: "+0.5kg/week" },
                        { name: "Bicycle Crunches", sets: 3, reps: "20", rest: 30, progression: "+4 reps/week" },
                        { name: "Plank", sets: 3, reps: "45s", rest: 30, progression: "+5s/week" },
                        { name: "Russian Twist", sets: 3, reps: "20", rest: 30, progression: "+4 reps/week" },
                    ]
                },
            },
            weekPattern: ["glutes_legs", "upper_core", "glutes_legs", "upper_core"],
        }],
        deloadEvery: 4,
        tips: "Don't be afraid of lifting heavy — it builds tone, not bulk. Focus on progressive overload on hip thrusts and squats. Eat enough protein (1.6g/kg)."
    },

    // ═══ 11. STAMINA BUILDER ═══
    stamina: {
        id: "stamina", name: "Stamina & Endurance", icon: "🫀",
        desc: "Build cardiovascular endurance and muscular stamina. Longer workouts, higher reps, less rest.",
        duration: "8 weeks", daysPerWeek: 4, schedule: ["Mon", "Tue", "Thu", "Sat"], restDays: ["Wed", "Fri", "Sun"],
        curriculum: [
            { week: 1, title: "Endurance Baseline", focus: "Test and establish base", skills: ["Pace yourself — endurance is about going longer, not faster", "Breathe rhythmically", "Track heart rate if possible"], drills: [{ name: "20-Min Circuit", duration: "20 min", desc: "20 Squats → 10 Push Ups → 20 Jumping Jacks → 10 Lunges → 30s Plank. Repeat for 20 min." }], conditioning: [{ name: "Easy Jog", sets: 1, reps: "10 min", rest: 0 }, { name: "Stretching", sets: 1, reps: "5 min", rest: 0 }] },
            { week: 2, title: "Circuit Training", focus: "Minimal rest between exercises", skills: ["Reduce rest to 15s between exercises", "Keep moving — active recovery beats sitting"], drills: [{ name: "6-Exercise Circuit", duration: "25 min", desc: "15 Squats → 10 Push Ups → 15 Lunges → 10 Burpees → 20 Mountain Climbers → 30s Plank. 15s rest between. 4 rounds." }], conditioning: [{ name: "Jump Rope", sets: 3, reps: "2 min", rest: 30 }] },
            { week: 3, title: "Threshold Training", focus: "Work at the edge of comfort", skills: ["Lactate threshold — point where muscles start burning", "Training here improves endurance the most"], drills: [{ name: "Threshold Circuit", duration: "25 min", desc: "40s work / 20s rest: 8 exercises, 3 rounds" }], conditioning: [{ name: "Tempo Run", sets: 1, reps: "15 min", rest: 0 }] },
            { week: 4, title: "Long Duration", focus: "30+ minute continuous work", skills: ["Build mental toughness for longer sessions", "Break workout into segments mentally"], drills: [{ name: "30-Min Continuous", duration: "30 min", desc: "10 Squats → 5 Push Ups → 10 Lunges → 5 Burpees → 20 High Knees. Non-stop for 30 min." }], conditioning: [{ name: "Easy Jog", sets: 1, reps: "15 min", rest: 0 }] },
            { week: 5, title: "Partner/Pair Exercises", focus: "Alternating exercises, no full rest", skills: ["Pair upper and lower body exercises", "While upper body rests, lower body works and vice versa"], drills: [{ name: "Paired Workout", duration: "30 min", desc: "Pair 1: Push Ups × 15 / Squats × 20 (alternate, no rest). Pair 2: Pull movement × 10 / Lunges × 12 each. Pair 3: Plank 45s / High Knees 45s. 3 rounds each pair." }], conditioning: [{ name: "Continuous Movement", sets: 1, reps: "10 min", rest: 0 }] },
            { week: 6, title: "AMRAP Challenge", focus: "As Many Reps As Possible", skills: ["AMRAP builds both mental and physical endurance", "Track your rounds — beat them next time"], drills: [{ name: "20-Min AMRAP", duration: "20 min", desc: "10 Burpees → 15 Squats → 20 Mountain Climbers → 10 Push Ups. As many rounds as possible in 20 min." }], conditioning: [{ name: "Walk", sets: 1, reps: "5 min", rest: 0 }, { name: "Stretch", sets: 1, reps: "5 min", rest: 0 }] },
            { week: 7, title: "Tempo Training", focus: "Sustained moderate intensity", skills: ["Find a pace you can maintain for 40 minutes", "This builds aerobic base better than sprints"], drills: [{ name: "40-Min Steady", duration: "40 min", desc: "Moderate intensity continuous circuit: easy exercises, steady pace, don't stop" }], conditioning: [{ name: "Cool Down", sets: 1, reps: "5 min", rest: 0 }] },
            { week: 8, title: "Ultimate Endurance Test", focus: "45-minute continuous challenge", skills: ["You've built the endurance — now test it", "Compare to week 1 performance"], drills: [{ name: "45-Min Challenge", duration: "45 min", desc: "Non-stop movement for 45 minutes. Mix all exercises. Track total reps." }], conditioning: [{ name: "Stretch & Breathe", sets: 1, reps: "5 min", rest: 0 }] },
        ],
        tips: "Endurance is built slowly. Don't increase duration by more than 10% per week. Hydrate well. Carbs are fuel for endurance work."
    },

    // ═══ 12. SENIOR FITNESS ═══
    senior_fit: {
        id: "senior_fit", name: "Active & Strong (50+)", icon: "🧓",
        desc: "Stay active, prevent falls, maintain independence. Gentle but effective. Joint-friendly exercises.",
        duration: "8 weeks", daysPerWeek: 3, schedule: ["Mon", "Wed", "Fri"], restDays: ["Tue", "Thu", "Sat", "Sun"],
        curriculum: [
            { week: 1, title: "Gentle Start", focus: "Easy movements, build habit", skills: ["Move at your own pace — there's no rush", "If something hurts, skip it", "Chair is your friend — use it for balance"], drills: [{ name: "Seated Warm Up", duration: "5 min", desc: "Seated: neck rolls, shoulder rolls, arm circles, ankle circles" }, { name: "Standing Balance", duration: "3 min", desc: "Stand near chair, lift one foot 2 inches, hold 10s each" }, { name: "Gentle Walk", duration: "5 min", desc: "Walk around room or outside, comfortable pace" }], conditioning: [{ name: "Chair Squats", sets: 2, reps: "8", rest: 45 }, { name: "Wall Push Ups", sets: 2, reps: "8", rest: 30 }, { name: "Marching in Place", sets: 2, reps: "30s", rest: 30 }] },
            { week: 2, title: "Balance & Stability", focus: "Prevent falls", skills: ["Single leg balance improves fall prevention", "Heel-to-toe walking", "Core stability for balance"], drills: [{ name: "Heel-Toe Walk", duration: "3 min", desc: "Walk in straight line, heel touching toe, 10 steps. Use wall for support." }, { name: "Single Leg Stand", duration: "3 min", desc: "Hold chair, lift one foot, hold 15s each side" }, { name: "Side Steps", duration: "3 min", desc: "Side step 5 steps left, 5 steps right" }], conditioning: [{ name: "Chair Squats", sets: 2, reps: "10", rest: 45 }, { name: "Calf Raises (chair)", sets: 2, reps: "10", rest: 30 }, { name: "Seated Leg Lifts", sets: 2, reps: "10 each", rest: 30 }] },
            { week: 3, title: "Upper Body", focus: "Maintain arm and shoulder strength", skills: ["Use light weights (1-3 kg) or water bottles", "Focus on range of motion", "Breathe out on exertion"], drills: [{ name: "Arm Exercises", duration: "5 min", desc: "Bicep curls × 10, shoulder press × 10, lateral raise × 10, all with light weights" }, { name: "Wall Push Ups", duration: "3 min", desc: "10 wall push ups, slow and controlled" }, { name: "Resistance Band", duration: "3 min", desc: "Band pull aparts, rows with band" }], conditioning: [{ name: "Bicep Curls", sets: 2, reps: "10", rest: 30 }, { name: "Shoulder Press", sets: 2, reps: "8", rest: 30 }, { name: "Wall Push Ups", sets: 2, reps: "10", rest: 30 }] },
            { week: 4, title: "Lower Body", focus: "Keep legs strong for mobility", skills: ["Strong legs = independence", "Start with chair support, reduce as confidence grows"], drills: [{ name: "Leg Routine", duration: "5 min", desc: "Chair squats × 10 → Standing calf raises × 10 → Side leg lifts × 10 each → Gentle lunges × 5 each" }, { name: "Stair Practice", duration: "3 min", desc: "Step up and down a single step, alternating legs" }], conditioning: [{ name: "Chair Squats", sets: 3, reps: "10", rest: 45 }, { name: "Calf Raises", sets: 2, reps: "12", rest: 30 }, { name: "Step Ups", sets: 2, reps: "8 each", rest: 45 }] },
            { week: 5, title: "Flexibility", focus: "Stay limber, reduce stiffness", skills: ["Gentle stretching — never bounce", "Hold each stretch 20-30 seconds", "Breathe deeply into each stretch"], drills: [{ name: "Full Body Stretch", duration: "10 min", desc: "Neck → Shoulders → Chest → Back → Hips → Hamstrings → Calves. 30s each." }], conditioning: [{ name: "Cat-Cow (on chair)", sets: 3, reps: "8", rest: 10 }, { name: "Seated Twist", sets: 2, reps: "15s each", rest: 10 }, { name: "Gentle Walk", sets: 1, reps: "5 min", rest: 0 }] },
            { week: 6, title: "Coordination & Agility", focus: "Keep mind-body connection sharp", skills: ["Coordination exercises help prevent falls", "Challenge your brain and body together"], drills: [{ name: "Coordination Drill", duration: "5 min", desc: "Touch left knee with right hand, switch. Tap shoulders alternating. Clap patterns." }, { name: "Reaction Drill", duration: "3 min", desc: "Partner (or timer) calls left/right/up/down, you reach that direction quickly" }, { name: "Gentle Dance", duration: "3 min", desc: "Put on music, move freely, enjoy!" }], conditioning: [{ name: "Marching", sets: 2, reps: "60s", rest: 30 }, { name: "Side Steps", sets: 2, reps: "10 each", rest: 30 }, { name: "Toe Taps", sets: 2, reps: "15", rest: 30 }] },
            { week: 7, title: "Full Routine", focus: "Combine everything into one session", skills: ["You now have all the tools for a complete workout", "Balance + Strength + Flexibility + Coordination"], drills: [{ name: "Complete Session", duration: "15 min", desc: "Warm up → Balance drills → Strength (upper + lower) → Stretching → Cool down" }], conditioning: [{ name: "Full Routine", sets: 1, reps: "15 min", rest: 0 }] },
            { week: 8, title: "Keep Going!", focus: "You've built a foundation — now maintain it", skills: ["Continue 3× per week minimum", "Gradually increase weights or reps", "Join a class or walk group for social motivation"], drills: [{ name: "Your Routine", duration: "15 min", desc: "Do your full routine. You know what to do!" }, { name: "Walk", duration: "15 min", desc: "Walk outside if possible. Enjoy the movement." }], conditioning: [{ name: "Your Choice", sets: 1, reps: "10 min", rest: 0 }] },
        ],
        tips: "Consistency beats intensity. 3 gentle sessions per week is better than 1 hard session. Stay hydrated, warm up always, and listen to your body."
    },
};