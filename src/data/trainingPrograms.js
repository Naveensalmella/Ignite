// ══════════════════════════════════════════════════════════
// IGNITE Training Programs — Structured like a real coach
// ══════════════════════════════════════════════════════════

// ── GYM PROGRAMS ──
// Each program has phases (4 weeks each), each phase has a weekly schedule
// Each day has exact exercises with sets × reps, and progression rules

export const GYM_PROGRAMS = {
    // ═══════════════════════════════════
    // BEGINNER MUSCLE BUILDING (3 days/week)
    // Full body, compound focused
    // ═══════════════════════════════════
    beginner_muscle: {
        id: "beginner_muscle",
        name: "Beginner Muscle Builder",
        desc: "Build your foundation with compound movements. 3 days per week, full body each session.",
        goal: "muscle",
        level: "beginner",
        daysPerWeek: 3,
        duration: "12 weeks",
        schedule: ["Mon", "Wed", "Fri"],
        restDays: ["Tue", "Thu", "Sat", "Sun"],
        phases: [
            {
                name: "Foundation", weeks: "1-4", focus: "Learn form, build base strength",
                days: {
                    A: {
                        name: "Full Body A", exercises: [
                            { name: "Squats", sets: 3, reps: "10", rest: 90, progression: "+2.5kg/week" },
                            { name: "Bench Press", sets: 3, reps: "10", rest: 90, progression: "+2.5kg/week" },
                            { name: "Bent Over Row", sets: 3, reps: "10", rest: 90, progression: "+2.5kg/week" },
                            { name: "Shoulder Press", sets: 2, reps: "12", rest: 60, progression: "+1kg/week" },
                            { name: "Bicep Curls", sets: 2, reps: "12", rest: 60, progression: "+1kg/week" },
                            { name: "Plank", sets: 3, reps: "30s", rest: 45, progression: "+5s/week" },
                        ]
                    },
                    B: {
                        name: "Full Body B", exercises: [
                            { name: "Deadlift", sets: 3, reps: "8", rest: 120, progression: "+5kg/week" },
                            { name: "Dumbbell Press", sets: 3, reps: "10", rest: 90, progression: "+2kg/week" },
                            { name: "Lat Pulldown", sets: 3, reps: "10", rest: 90, progression: "+2.5kg/week" },
                            { name: "Lunges", sets: 3, reps: "10 each", rest: 60, progression: "+2.5kg/week" },
                            { name: "Tricep Extension", sets: 2, reps: "12", rest: 60, progression: "+1kg/week" },
                            { name: "Leg Raises", sets: 3, reps: "12", rest: 45, progression: "+2 reps/week" },
                        ]
                    },
                },
                weekPattern: ["A", "B", "A"], // Mon=A, Wed=B, Fri=A, next week: B,A,B
            },
            {
                name: "Growth", weeks: "5-8", focus: "Increase volume, add isolation",
                days: {
                    A: {
                        name: "Full Body A", exercises: [
                            { name: "Squats", sets: 4, reps: "8", rest: 90, progression: "+2.5kg/week" },
                            { name: "Bench Press", sets: 4, reps: "8", rest: 90, progression: "+2.5kg/week" },
                            { name: "Bent Over Row", sets: 4, reps: "8", rest: 90, progression: "+2.5kg/week" },
                            { name: "Shoulder Press", sets: 3, reps: "10", rest: 60, progression: "+1kg/week" },
                            { name: "Bicep Curls", sets: 3, reps: "10", rest: 60, progression: "+1kg/week" },
                            { name: "Calf Raises", sets: 3, reps: "15", rest: 45, progression: "+2.5kg/week" },
                            { name: "Plank", sets: 3, reps: "45s", rest: 45, progression: "+5s/week" },
                        ]
                    },
                    B: {
                        name: "Full Body B", exercises: [
                            { name: "Deadlift", sets: 4, reps: "6", rest: 120, progression: "+5kg/week" },
                            { name: "Dumbbell Press", sets: 4, reps: "8", rest: 90, progression: "+2kg/week" },
                            { name: "Pull Ups", sets: 3, reps: "max", rest: 90, progression: "+1 rep/week" },
                            { name: "Bulgarian Split Squat", sets: 3, reps: "10 each", rest: 60, progression: "+2.5kg/week" },
                            { name: "Lateral Raise", sets: 3, reps: "12", rest: 45, progression: "+1kg/week" },
                            { name: "Hammer Curls", sets: 2, reps: "12", rest: 60, progression: "+1kg/week" },
                            { name: "Russian Twist", sets: 3, reps: "20", rest: 45, progression: "+4 reps/week" },
                        ]
                    },
                },
                weekPattern: ["A", "B", "A"],
            },
            {
                name: "Peak", weeks: "9-12", focus: "Push intensity, test your strength",
                days: {
                    A: {
                        name: "Full Body A", exercises: [
                            { name: "Squats", sets: 5, reps: "5", rest: 120, progression: "+2.5kg/week" },
                            { name: "Bench Press", sets: 5, reps: "5", rest: 120, progression: "+1.25kg/week" },
                            { name: "Bent Over Row", sets: 4, reps: "6", rest: 90, progression: "+2.5kg/week" },
                            { name: "Shoulder Press", sets: 3, reps: "8", rest: 60, progression: "+1kg/week" },
                            { name: "Bicep Curls", sets: 3, reps: "10", rest: 60, progression: "+1kg/week" },
                            { name: "Hanging Leg Raise", sets: 3, reps: "10", rest: 45, progression: "+2 reps/week" },
                        ]
                    },
                    B: {
                        name: "Full Body B", exercises: [
                            { name: "Deadlift", sets: 5, reps: "5", rest: 150, progression: "+2.5kg/week" },
                            { name: "Dumbbell Press", sets: 4, reps: "6", rest: 90, progression: "+2kg/week" },
                            { name: "Pull Ups", sets: 4, reps: "max", rest: 90, progression: "+1 rep/week" },
                            { name: "Hip Thrust", sets: 4, reps: "8", rest: 90, progression: "+5kg/week" },
                            { name: "Tricep Dips", sets: 3, reps: "max", rest: 60, progression: "+1 rep/week" },
                            { name: "Calf Raises", sets: 4, reps: "12", rest: 45, progression: "+2.5kg/week" },
                        ]
                    },
                },
                weekPattern: ["A", "B", "A"],
            },
        ],
        deloadEvery: 4, // every 4th week reduce volume by 40%
        tips: "Focus on form first. Add weight ONLY when you complete all reps with perfect form. Eat 1.6-2g protein per kg bodyweight. Sleep 7-8 hours."
    },

    // ═══════════════════════════════════
    // INTERMEDIATE MUSCLE (4 days - Upper/Lower)
    // ═══════════════════════════════════
    intermediate_muscle: {
        id: "intermediate_muscle",
        name: "Intermediate Hypertrophy",
        desc: "Upper/Lower split for maximum muscle growth. 4 days per week.",
        goal: "muscle", level: "intermediate", daysPerWeek: 4, duration: "12 weeks",
        schedule: ["Mon", "Tue", "Thu", "Fri"],
        restDays: ["Wed", "Sat", "Sun"],
        phases: [
            {
                name: "Volume Phase", weeks: "1-4", focus: "High reps, moderate weight, build work capacity",
                days: {
                    upper: {
                        name: "Upper Body", exercises: [
                            { name: "Bench Press", sets: 4, reps: "10", rest: 90, progression: "+2.5kg/week" },
                            { name: "Bent Over Row", sets: 4, reps: "10", rest: 90, progression: "+2.5kg/week" },
                            { name: "Shoulder Press", sets: 3, reps: "12", rest: 60, progression: "+1kg/week" },
                            { name: "Lat Pulldown", sets: 3, reps: "12", rest: 60, progression: "+2.5kg/week" },
                            { name: "Lateral Raise", sets: 3, reps: "15", rest: 45, progression: "+0.5kg/week" },
                            { name: "Bicep Curls", sets: 3, reps: "12", rest: 45, progression: "+1kg/week" },
                            { name: "Tricep Extension", sets: 3, reps: "12", rest: 45, progression: "+1kg/week" },
                        ]
                    },
                    lower: {
                        name: "Lower Body", exercises: [
                            { name: "Squats", sets: 4, reps: "10", rest: 120, progression: "+2.5kg/week" },
                            { name: "Romanian Deadlift", sets: 3, reps: "10", rest: 90, progression: "+2.5kg/week" },
                            { name: "Leg Press", sets: 3, reps: "12", rest: 90, progression: "+5kg/week" },
                            { name: "Walking Lunges", sets: 3, reps: "12 each", rest: 60, progression: "+2.5kg/week" },
                            { name: "Leg Curl", sets: 3, reps: "12", rest: 60, progression: "+2.5kg/week" },
                            { name: "Calf Raises", sets: 4, reps: "15", rest: 45, progression: "+2.5kg/week" },
                            { name: "Plank", sets: 3, reps: "45s", rest: 45, progression: "+10s/week" },
                        ]
                    },
                },
                weekPattern: ["upper", "lower", "upper", "lower"],
            },
            {
                name: "Intensity Phase", weeks: "5-8", focus: "Heavier weights, lower reps",
                days: {
                    upper: {
                        name: "Upper Body", exercises: [
                            { name: "Bench Press", sets: 5, reps: "6", rest: 120, progression: "+1.25kg/week" },
                            { name: "Bent Over Row", sets: 5, reps: "6", rest: 120, progression: "+2.5kg/week" },
                            { name: "Arnold Press", sets: 4, reps: "8", rest: 90, progression: "+1kg/week" },
                            { name: "Pull Ups", sets: 4, reps: "max", rest: 90, progression: "+1 rep/week" },
                            { name: "Face Pull", sets: 3, reps: "15", rest: 45, progression: "+1kg/week" },
                            { name: "Hammer Curls", sets: 3, reps: "10", rest: 45, progression: "+1kg/week" },
                            { name: "Skull Crushers", sets: 3, reps: "10", rest: 45, progression: "+1kg/week" },
                        ]
                    },
                    lower: {
                        name: "Lower Body", exercises: [
                            { name: "Squats", sets: 5, reps: "6", rest: 150, progression: "+2.5kg/week" },
                            { name: "Deadlift", sets: 4, reps: "5", rest: 150, progression: "+5kg/week" },
                            { name: "Bulgarian Split Squat", sets: 3, reps: "8 each", rest: 90, progression: "+2.5kg/week" },
                            { name: "Hip Thrust", sets: 4, reps: "8", rest: 90, progression: "+5kg/week" },
                            { name: "Leg Extension", sets: 3, reps: "12", rest: 60, progression: "+2.5kg/week" },
                            { name: "Calf Raises", sets: 4, reps: "12", rest: 45, progression: "+2.5kg/week" },
                            { name: "Hanging Leg Raise", sets: 3, reps: "12", rest: 45, progression: "+2 reps/week" },
                        ]
                    },
                },
                weekPattern: ["upper", "lower", "upper", "lower"],
            },
            {
                name: "Peak Phase", weeks: "9-12", focus: "Test maxes, refine physique",
                days: {
                    upper: {
                        name: "Upper Body", exercises: [
                            { name: "Bench Press", sets: 5, reps: "5", rest: 150, progression: "+1.25kg/week" },
                            { name: "Bent Over Row", sets: 5, reps: "5", rest: 120, progression: "+2.5kg/week" },
                            { name: "Shoulder Press", sets: 4, reps: "6", rest: 90, progression: "+1kg/week" },
                            { name: "Chin Ups", sets: 4, reps: "max", rest: 90, progression: "+1 rep/week" },
                            { name: "Chest Fly", sets: 3, reps: "12", rest: 60, progression: "+1kg/week" },
                            { name: "Bicep Curls", sets: 3, reps: "10", rest: 45, progression: "+1kg/week" },
                            { name: "Tricep Dips", sets: 3, reps: "max", rest: 60, progression: "+1 rep/week" },
                        ]
                    },
                    lower: {
                        name: "Lower Body", exercises: [
                            { name: "Squats", sets: 5, reps: "5", rest: 150, progression: "+2.5kg/week" },
                            { name: "Deadlift", sets: 5, reps: "3", rest: 180, progression: "+2.5kg/week" },
                            { name: "Leg Press", sets: 4, reps: "8", rest: 90, progression: "+5kg/week" },
                            { name: "Romanian Deadlift", sets: 3, reps: "8", rest: 90, progression: "+2.5kg/week" },
                            { name: "Step Ups", sets: 3, reps: "10 each", rest: 60, progression: "+2.5kg/week" },
                            { name: "Calf Raises", sets: 4, reps: "12", rest: 45, progression: "+2.5kg/week" },
                            { name: "Ab Wheel Rollout", sets: 3, reps: "10", rest: 45, progression: "+2 reps/week" },
                        ]
                    },
                },
                weekPattern: ["upper", "lower", "upper", "lower"],
            },
        ],
        deloadEvery: 4,
        tips: "Eat in a slight caloric surplus (300-500 cal above maintenance). Track your lifts — if you're not progressing, eat more and sleep more."
    },

    // ═══════════════════════════════════
    // ADVANCED PPL (6 days)
    // ═══════════════════════════════════
    advanced_muscle: {
        id: "advanced_muscle",
        name: "Advanced PPL Split",
        desc: "Push/Pull/Legs twice per week. For experienced lifters ready for serious volume.",
        goal: "muscle", level: "advanced", daysPerWeek: 6, duration: "12 weeks",
        schedule: ["Mon", "Tue", "Wed", "Fri", "Sat", "Sun"],
        restDays: ["Thu"],
        phases: [{
            name: "Hypertrophy", weeks: "1-12", focus: "Maximum muscle growth through volume",
            days: {
                push: {
                    name: "Push (Chest/Shoulders/Triceps)", exercises: [
                        { name: "Bench Press", sets: 4, reps: "8", rest: 90, progression: "+2.5kg/2weeks" },
                        { name: "Shoulder Press", sets: 4, reps: "10", rest: 60, progression: "+1kg/week" },
                        { name: "Incline Push Ups", sets: 3, reps: "12", rest: 60, progression: "+2 reps/week" },
                        { name: "Lateral Raise", sets: 4, reps: "15", rest: 45, progression: "+0.5kg/week" },
                        { name: "Chest Fly", sets: 3, reps: "12", rest: 60, progression: "+1kg/week" },
                        { name: "Tricep Extension", sets: 3, reps: "12", rest: 45, progression: "+1kg/week" },
                        { name: "Tricep Dips", sets: 3, reps: "max", rest: 60, progression: "+1 rep/week" },
                    ]
                },
                pull: {
                    name: "Pull (Back/Biceps)", exercises: [
                        { name: "Deadlift", sets: 4, reps: "6", rest: 120, progression: "+5kg/2weeks" },
                        { name: "Pull Ups", sets: 4, reps: "max", rest: 90, progression: "+1 rep/week" },
                        { name: "Bent Over Row", sets: 4, reps: "8", rest: 90, progression: "+2.5kg/week" },
                        { name: "Seated Row", sets: 3, reps: "10", rest: 60, progression: "+2.5kg/week" },
                        { name: "Face Pull", sets: 3, reps: "15", rest: 45, progression: "+1kg/week" },
                        { name: "Bicep Curls", sets: 3, reps: "10", rest: 45, progression: "+1kg/week" },
                        { name: "Hammer Curls", sets: 3, reps: "10", rest: 45, progression: "+1kg/week" },
                    ]
                },
                legs: {
                    name: "Legs (Quads/Hams/Glutes/Calves)", exercises: [
                        { name: "Squats", sets: 5, reps: "8", rest: 120, progression: "+2.5kg/week" },
                        { name: "Romanian Deadlift", sets: 4, reps: "10", rest: 90, progression: "+2.5kg/week" },
                        { name: "Leg Press", sets: 3, reps: "12", rest: 90, progression: "+5kg/week" },
                        { name: "Walking Lunges", sets: 3, reps: "12 each", rest: 60, progression: "+2.5kg/week" },
                        { name: "Leg Curl", sets: 3, reps: "12", rest: 60, progression: "+2.5kg/week" },
                        { name: "Calf Raises", sets: 4, reps: "15", rest: 45, progression: "+2.5kg/week" },
                        { name: "Plank", sets: 3, reps: "60s", rest: 45, progression: "+10s/week" },
                    ]
                },
            },
            weekPattern: ["push", "pull", "legs", "push", "pull", "legs"],
        }],
        deloadEvery: 4,
        tips: "This is high volume. Eat at surplus, get 8+ hours sleep, and take your rest day seriously. If joints hurt, back off."
    },

    // ═══════════════════════════════════
    // FAT LOSS (3 days + cardio)
    // ═══════════════════════════════════
    fat_loss: {
        id: "fat_loss",
        name: "Fat Loss Program",
        desc: "Full body resistance + cardio finishers. Burns fat while preserving muscle.",
        goal: "fat_loss", level: "beginner", daysPerWeek: 4, duration: "8 weeks",
        schedule: ["Mon", "Tue", "Thu", "Fri"],
        restDays: ["Wed", "Sat", "Sun"],
        phases: [{
            name: "Burn Phase", weeks: "1-8", focus: "High calorie burn, maintain muscle",
            days: {
                strength: {
                    name: "Full Body Strength", exercises: [
                        { name: "Squats", sets: 3, reps: "12", rest: 60, progression: "+2.5kg/week" },
                        { name: "Bench Press", sets: 3, reps: "12", rest: 60, progression: "+2.5kg/week" },
                        { name: "Bent Over Row", sets: 3, reps: "12", rest: 60, progression: "+2.5kg/week" },
                        { name: "Shoulder Press", sets: 3, reps: "12", rest: 60, progression: "+1kg/week" },
                        { name: "Glute Bridge", sets: 3, reps: "15", rest: 45, progression: "+5kg/week" },
                        { name: "Plank", sets: 3, reps: "45s", rest: 30, progression: "+5s/week" },
                    ]
                },
                hiit: {
                    name: "HIIT Cardio", exercises: [
                        { name: "Burpees", sets: 4, reps: "30s work / 30s rest", rest: 30, progression: "+5s work/week" },
                        { name: "Mountain Climbers", sets: 4, reps: "30s", rest: 30, progression: "+5s/week" },
                        { name: "Jump Squats", sets: 4, reps: "30s", rest: 30, progression: "+5s/week" },
                        { name: "High Knees", sets: 4, reps: "30s", rest: 30, progression: "+5s/week" },
                        { name: "Jumping Jacks", sets: 4, reps: "30s", rest: 30, progression: "+5s/week" },
                    ]
                },
            },
            weekPattern: ["strength", "hiit", "strength", "hiit"],
        }],
        deloadEvery: 4,
        tips: "Eat at a 500cal deficit. High protein (2g/kg). Don't skip resistance training — it preserves muscle while you cut."
    },

    // HOME WORKOUT (no equipment)
    home_bodyweight: {
        id: "home_bodyweight",
        name: "Home Bodyweight Builder",
        desc: "No equipment needed. Build strength and muscle at home.",
        goal: "muscle", level: "beginner", daysPerWeek: 4, duration: "12 weeks",
        schedule: ["Mon", "Tue", "Thu", "Fri"],
        restDays: ["Wed", "Sat", "Sun"],
        phases: [{
            name: "Bodyweight Mastery", weeks: "1-12", focus: "Progressive calisthenics",
            days: {
                upper: {
                    name: "Upper Body", exercises: [
                        { name: "Push Ups", sets: 4, reps: "max", rest: 60, progression: "+2 reps/week" },
                        { name: "Diamond Push Ups", sets: 3, reps: "max", rest: 60, progression: "+1 rep/week" },
                        { name: "Pike Push Ups", sets: 3, reps: "max", rest: 60, progression: "+1 rep/week" },
                        { name: "Tricep Dips", sets: 3, reps: "max", rest: 60, progression: "+1 rep/week" },
                        { name: "Plank", sets: 3, reps: "60s", rest: 45, progression: "+10s/week" },
                        { name: "Superman", sets: 3, reps: "15", rest: 45, progression: "+2 reps/week" },
                    ]
                },
                lower: {
                    name: "Lower + Core", exercises: [
                        { name: "Squats", sets: 4, reps: "20", rest: 60, progression: "+3 reps/week" },
                        { name: "Lunges", sets: 3, reps: "12 each", rest: 60, progression: "+2 reps/week" },
                        { name: "Glute Bridge", sets: 3, reps: "20", rest: 45, progression: "+3 reps/week" },
                        { name: "Calf Raises", sets: 3, reps: "25", rest: 30, progression: "+5 reps/week" },
                        { name: "Bicycle Crunches", sets: 3, reps: "20", rest: 45, progression: "+4 reps/week" },
                        { name: "Leg Raises", sets: 3, reps: "12", rest: 45, progression: "+2 reps/week" },
                        { name: "Mountain Climbers", sets: 3, reps: "30s", rest: 30, progression: "+5s/week" },
                    ]
                },
            },
            weekPattern: ["upper", "lower", "upper", "lower"],
        }],
        deloadEvery: 4,
        tips: "Focus on slow, controlled reps. When an exercise becomes easy (30+ reps), upgrade to the harder variation."
    },
};

// ═══════════════════════════════════════════════════════
// COMBAT PROGRAMS — Structured skill-based curricula
// Each week builds on the previous, teaching real skills
// ═══════════════════════════════════════════════════════

export const COMBAT_PROGRAMS = {
    boxing: {
        id: "boxing", name: "Boxing Fundamentals", icon: "🥊",
        desc: "Learn boxing from scratch. Stance, punches, defense, combos, footwork.",
        duration: "12 weeks", daysPerWeek: 3, schedule: ["Mon", "Wed", "Fri"],
        curriculum: [
            {
                week: 1, title: "Stance & Guard", focus: "Orthodox/Southpaw stance, basic guard position, movement",
                skills: ["Orthodox Stance — feet shoulder width, lead foot forward, hands up", "Basic Guard — hands by cheekbones, elbows tucked, chin down", "Footwork Basics — step-drag movement, never cross feet"],
                drills: [
                    { name: "Stance Hold", duration: "2 min", desc: "Hold proper stance, shift weight front to back" },
                    { name: "Shadow Footwork", duration: "3 min", desc: "Move forward, back, left, right maintaining stance" },
                    { name: "Guard Check", duration: "2 min", desc: "Partner taps gloves to check guard position" },
                ],
                conditioning: [
                    { name: "Jump Rope", sets: 3, reps: "1 min", rest: 30 },
                    { name: "High Knees", sets: 3, reps: "30s", rest: 30 },
                    { name: "Plank", sets: 3, reps: "30s", rest: 30 },
                ]
            },
            {
                week: 2, title: "The Jab", focus: "Most important punch — your rangefinder and setup",
                skills: ["Jab Mechanics — extend lead hand straight, rotate fist, snap back", "Jab Variations — body jab, double jab, jab to the body", "Distance Management — jab determines your fighting range"],
                drills: [
                    { name: "Single Jab Practice", duration: "3 min", desc: "Throw 1 jab every 3 seconds, focus on full extension and snap back" },
                    { name: "Double Jab", duration: "3 min", desc: "Jab-jab rhythm, second jab harder than first" },
                    { name: "Jab + Footwork", duration: "3 min", desc: "Step forward jab, step back, step forward jab" },
                ],
                conditioning: [
                    { name: "Shadow Boxing (jab only)", sets: 3, reps: "2 min", rest: 30 },
                    { name: "Push Ups", sets: 3, reps: "15", rest: 45 },
                    { name: "Burpees", sets: 3, reps: "10", rest: 45 },
                ]
            },
            {
                week: 3, title: "The Cross", focus: "Your power punch — rear hand straight",
                skills: ["Cross Mechanics — rotate hips and shoulders, rear hand straight, pivot rear foot", "Jab-Cross Combo — the 1-2, boxing's bread and butter", "Power Generation — power comes from legs and hips, not arm"],
                drills: [
                    { name: "Cross Practice", duration: "3 min", desc: "Focus on hip rotation and rear foot pivot" },
                    { name: "1-2 Combo", duration: "4 min", desc: "Jab-cross, return to guard. Jab sets up the cross." },
                    { name: "1-2 + Step Back", duration: "3 min", desc: "Throw 1-2 then immediately step back out of range" },
                ],
                conditioning: [
                    { name: "Shadow Boxing (1-2)", sets: 4, reps: "2 min", rest: 30 },
                    { name: "Mountain Climbers", sets: 3, reps: "30s", rest: 30 },
                    { name: "Russian Twist", sets: 3, reps: "20", rest: 30 },
                ]
            },
            {
                week: 4, title: "The Hook", focus: "Close range power — horizontal punch",
                skills: ["Lead Hook — bend arm 90°, rotate hips, horizontal arc", "Hook Targets — chin (KO punch), body (liver shot)", "Hook Defense — keeping guard tight against hooks"],
                drills: [
                    { name: "Hook Practice", duration: "3 min", desc: "Lead hook, focus on keeping elbow at 90°, rotate torso" },
                    { name: "1-2-3 Combo", duration: "4 min", desc: "Jab-Cross-Hook, the classic three-punch combo" },
                    { name: "Body Hooks", duration: "3 min", desc: "Drop level slightly, hook to the body" },
                ],
                conditioning: [
                    { name: "Shadow Boxing (1-2-3)", sets: 4, reps: "2 min", rest: 30 },
                    { name: "Bicycle Crunches", sets: 3, reps: "20", rest: 30 },
                    { name: "Jump Squats", sets: 3, reps: "10", rest: 45 },
                ]
            },
            {
                week: 5, title: "The Uppercut", focus: "Rising punch for close range",
                skills: ["Uppercut Mechanics — drop hand slightly, drive upward, rotate hips", "Lead vs Rear Uppercut — lead is faster, rear is more powerful", "Setting up the Uppercut — use jab to bring guard high, then go underneath"],
                drills: [
                    { name: "Uppercut Practice", duration: "3 min", desc: "Lead and rear uppercuts, focus on driving up through the hips" },
                    { name: "1-2-5-2 Combo", duration: "4 min", desc: "Jab-Cross-Uppercut-Cross" },
                    { name: "Body-Head Combo", duration: "3 min", desc: "Uppercut to body, then uppercut to head" },
                ],
                conditioning: [
                    { name: "Shadow Boxing (all punches)", sets: 4, reps: "2 min", rest: 30 },
                    { name: "Plank", sets: 3, reps: "45s", rest: 30 },
                    { name: "Burpees", sets: 3, reps: "12", rest: 45 },
                ]
            },
            {
                week: 6, title: "Defense — Slip & Roll", focus: "Don't just hit — learn to not get hit",
                skills: ["Slip — small head movement left/right to dodge straight punches", "Roll — bend knees and roll under hooks", "Counter after defense — slip then counter with cross"],
                drills: [
                    { name: "Slip Drill", duration: "3 min", desc: "Partner throws slow jabs, you slip left and right" },
                    { name: "Roll Under", duration: "3 min", desc: "Partner throws slow hooks, you roll under" },
                    { name: "Slip + Counter", duration: "4 min", desc: "Slip the jab, counter with a cross" },
                ],
                conditioning: [
                    { name: "Shadow Boxing + Defense", sets: 4, reps: "2 min", rest: 30 },
                    { name: "High Knees", sets: 3, reps: "45s", rest: 30 },
                    { name: "Mountain Climbers", sets: 3, reps: "30s", rest: 30 },
                ]
            },
            {
                week: 7, title: "Combinations", focus: "Chain punches into fight-ending combos",
                skills: ["3-2 (Hook-Cross)", "1-2-3-2 (Jab-Cross-Hook-Cross)", "1-1-2-3 (Double Jab-Cross-Hook)"],
                drills: [
                    { name: "5-Punch Combo", duration: "4 min", desc: "1-2-3-2-3: Jab-Cross-Hook-Cross-Hook" },
                    { name: "Combo + Movement", duration: "4 min", desc: "Throw combo, angle off to the side, throw again" },
                    { name: "Freestyle Combos", duration: "3 min", desc: "Mix all punches creatively, minimum 3 punches per combo" },
                ],
                conditioning: [
                    { name: "Shadow Boxing (free)", sets: 5, reps: "2 min", rest: 30 },
                    { name: "Push Ups", sets: 3, reps: "20", rest: 30 },
                    { name: "Flutter Kicks", sets: 3, reps: "30s", rest: 30 },
                ]
            },
            {
                week: 8, title: "Footwork & Angles", focus: "Move like a boxer, create angles",
                skills: ["Pivot — plant lead foot, swing rear foot to create angle", "Cut Off Ring — use footwork to corner your opponent", "In-and-out — explosive step in to attack, step out to safety"],
                drills: [
                    { name: "Pivot Drill", duration: "3 min", desc: "Throw 1-2, pivot 45° left, throw 1-2 again" },
                    { name: "In-Out Attack", duration: "3 min", desc: "Explode in with 1-2, immediately back out" },
                    { name: "Circle Drill", duration: "4 min", desc: "Circle left throwing jabs, circle right throwing jabs" },
                ],
                conditioning: [
                    { name: "Shadow Boxing (movement focus)", sets: 4, reps: "3 min", rest: 30 },
                    { name: "Jump Rope", sets: 3, reps: "2 min", rest: 30 },
                    { name: "Calf Raises", sets: 3, reps: "20", rest: 30 },
                ]
            },
            {
                week: 9, title: "Body Shots", focus: "Attack the body to break down your opponent",
                skills: ["Level Change — drop level to target body", "Liver Shot — left hook to opponent's right side", "Body-Head Switching — go low to bring guard down, then go high"],
                drills: [
                    { name: "Body Shot Practice", duration: "3 min", desc: "1-body-2: Jab, hook to body, cross to head" },
                    { name: "Level Change Drill", duration: "3 min", desc: "Alternate head and body targets with each combo" },
                    { name: "3-Punch Body Combo", duration: "4 min", desc: "Jab body, cross body, hook head" },
                ],
                conditioning: [
                    { name: "Shadow Boxing (body focus)", sets: 4, reps: "2 min", rest: 30 },
                    { name: "Russian Twist", sets: 3, reps: "30", rest: 30 },
                    { name: "Plank", sets: 3, reps: "60s", rest: 30 },
                ]
            },
            {
                week: 10, title: "Counter Punching", focus: "Make them pay for attacking",
                skills: ["Catch and Counter — block jab, counter with cross", "Pull Counter — lean back from cross, counter with your own cross", "Check Hook — step to side, throw hook as opponent comes forward"],
                drills: [
                    { name: "Catch-Counter", duration: "4 min", desc: "Partner jabs, you catch and immediately counter with 2-3" },
                    { name: "Pull Counter", duration: "3 min", desc: "Pull back from cross, snap back with your cross" },
                    { name: "Counter Combos", duration: "4 min", desc: "Defend, then explode with 3-4 punch combos" },
                ],
                conditioning: [
                    { name: "Shadow Boxing (counter focus)", sets: 4, reps: "3 min", rest: 30 },
                    { name: "Burpees", sets: 3, reps: "15", rest: 45 },
                    { name: "V-Ups", sets: 3, reps: "15", rest: 30 },
                ]
            },
            {
                week: 11, title: "Sparring Drills", focus: "Put it all together in controlled practice",
                skills: ["Touch Sparring — light contact, focus on technique not power", "Situational Sparring — only jabs, or only body shots", "Flow Sparring — continuous exchange, no stopping"],
                drills: [
                    { name: "Jab-Only Spar", duration: "3 min", desc: "Only jabs allowed. Focus on timing and distance." },
                    { name: "1-2 Only Spar", duration: "3 min", desc: "Only 1-2 combos. Work on setting up the cross." },
                    { name: "Free Flow", duration: "4 min", desc: "All punches, light contact, focus on rhythm and reading opponent" },
                ],
                conditioning: [
                    { name: "Shadow Boxing (simulate fight)", sets: 5, reps: "3 min", rest: 60 },
                    { name: "Push Ups", sets: 3, reps: "25", rest: 30 },
                    { name: "Jump Squats", sets: 3, reps: "15", rest: 30 },
                ]
            },
            {
                week: 12, title: "Fight Simulation", focus: "Full rounds, testing everything you've learned",
                skills: ["Round Structure — 3 min rounds, 1 min rest between", "Pacing — don't gas out in round 1", "Ring IQ — when to attack, when to defend, when to rest"],
                drills: [
                    { name: "3-Round Shadow Fight", duration: "12 min", desc: "3× 3min rounds with 1min rest. Fight an imaginary opponent." },
                    { name: "Power Round", duration: "2 min", desc: "Maximum power on every punch for 2 minutes" },
                    { name: "Technical Round", duration: "3 min", desc: "Focus only on clean technique, no power" },
                ],
                conditioning: [
                    { name: "Shadow Boxing (full fight)", sets: 3, reps: "3 min", rest: 60 },
                    { name: "Burpees", sets: 3, reps: "20", rest: 30 },
                    { name: "Plank", sets: 3, reps: "90s", rest: 30 },
                ]
            },
        ],
        tips: "Boxing is 80% defense and footwork, 20% offense. Never sacrifice your guard to throw a punch. Breathe out on every punch."
    },

    kickboxing: {
        id: "kickboxing", name: "Kickboxing", icon: "🦶",
        desc: "Boxing + kicks. Learn to fight with hands and feet.",
        duration: "12 weeks", daysPerWeek: 3, schedule: ["Mon", "Wed", "Fri"],
        curriculum: [
            {
                week: 1, title: "Stance & Basic Kicks", focus: "Kickboxing stance (wider than boxing), front kick, round kick chamber",
                skills: ["Kickboxing Stance — wider than boxing, weight 50/50", "Front Kick (Teep) — push kick to create distance", "Round Kick Chamber — knee up, hip rotation"],
                drills: [
                    { name: "Teep Practice", duration: "3 min", desc: "Push kick with lead and rear leg" },
                    { name: "Round Kick Chamber", duration: "3 min", desc: "Practice chambering the knee before kicking" },
                    { name: "Stance Switches", duration: "2 min", desc: "Switch between orthodox and southpaw" },
                ],
                conditioning: [
                    { name: "Shadow Kickboxing", sets: 3, reps: "2 min", rest: 30 },
                    { name: "High Knees", sets: 3, reps: "30s", rest: 30 },
                    { name: "Jump Squats", sets: 3, reps: "15", rest: 45 },
                ]
            },
            {
                week: 2, title: "Jab-Cross + Low Kick", focus: "Combine hands with kicks",
                skills: ["Low Kick — round kick targeting the thigh", "1-2-Low Kick — boxing combo finished with a kick", "Checking Kicks — lift knee to block incoming kicks"],
                drills: [
                    { name: "1-2-Low Kick", duration: "4 min", desc: "Jab-Cross then immediately low kick" },
                    { name: "Low Kick Both Sides", duration: "3 min", desc: "Practice low kicks from both stances" },
                    { name: "Check Drill", duration: "3 min", desc: "Partner throws slow low kicks, you check (lift knee)" },
                ],
                conditioning: [
                    { name: "Shadow Kickboxing", sets: 4, reps: "2 min", rest: 30 },
                    { name: "Lunges", sets: 3, reps: "12 each", rest: 45 },
                    { name: "Plank", sets: 3, reps: "45s", rest: 30 },
                ]
            },
            {
                week: 3, title: "Round Kick to Body & Head", focus: "The signature kickboxing weapon",
                skills: ["Mid Kick — round kick to the body/ribs", "High Kick — round kick to the head", "Kick with Shin — hit with the shin, not the foot"],
                drills: [
                    { name: "Body Kick Drill", duration: "3 min", desc: "Focus on hip rotation and kicking through the target" },
                    { name: "High Kick Flexibility", duration: "3 min", desc: "Slow high kicks focusing on height and balance" },
                    { name: "Combo: 1-2-Body Kick", duration: "4 min", desc: "Hands set up the kick" },
                ],
                conditioning: [
                    { name: "Shadow Kickboxing (kicks focus)", sets: 4, reps: "2 min", rest: 30 },
                    { name: "Calf Raises", sets: 3, reps: "20", rest: 30 },
                    { name: "Flutter Kicks", sets: 3, reps: "30s", rest: 30 },
                ]
            },
            { week: 4, title: "Knees & Clinch Basics", focus: "Close range devastation", skills: ["Straight Knee — drive knee straight up into target", "Clinch Entry — grab behind the head, control posture", "Knee from Clinch — pull head down, drive knee up"], drills: [{ name: "Knee Strike Practice", duration: "3 min", desc: "Step in with rear knee, drive hips forward" }, { name: "Clinch Entry", duration: "3 min", desc: "Practice grabbing behind head and pulling down" }, { name: "Clinch Knee Combo", duration: "4 min", desc: "Enter clinch, throw 3 knees, push away" }], conditioning: [{ name: "Shadow Kickboxing (knees)", sets: 4, reps: "2 min", rest: 30 }, { name: "Squats", sets: 3, reps: "20", rest: 45 }, { name: "Mountain Climbers", sets: 3, reps: "30s", rest: 30 }] },
            { week: 5, title: "Elbows", focus: "Devastating close range", skills: ["Horizontal Elbow — slash across", "Uppercut Elbow — rising elbow strike", "Spinning Elbow — advanced, high risk high reward"], drills: [{ name: "Elbow Practice", duration: "3 min", desc: "Horizontal and uppercut elbows both sides" }, { name: "1-2-Elbow", duration: "4 min", desc: "Close distance with punches, finish with elbow" }, { name: "Elbow from Clinch", duration: "3 min", desc: "Break clinch with elbow" }], conditioning: [{ name: "Shadow Kickboxing (elbows)", sets: 4, reps: "2 min", rest: 30 }, { name: "Push Ups", sets: 3, reps: "20", rest: 30 }, { name: "Plank", sets: 3, reps: "60s", rest: 30 }] },
            { week: 6, title: "Combinations — Hands + Kicks", focus: "Flow between hands and feet", skills: ["Switch Kick — switch stance, rear leg becomes lead, kick", "Dutch Combo — Hook-Cross-Low Kick (3-2-Low)", "Kick catch to sweep"], drills: [{ name: "Dutch Combo", duration: "4 min", desc: "Hook-Cross-Low Kick, repeat" }, { name: "Switch Kick", duration: "3 min", desc: "Step switch then immediately rear round kick" }, { name: "Mix Combos", duration: "4 min", desc: "Minimum 2 punches + 1 kick per combo" }], conditioning: [{ name: "Shadow Kickboxing (combos)", sets: 5, reps: "2 min", rest: 30 }, { name: "Burpees", sets: 3, reps: "12", rest: 45 }, { name: "Russian Twist", sets: 3, reps: "20", rest: 30 }] },
            { week: 7, title: "Defense Against Kicks", focus: "Check, catch, evade", skills: ["Check — lift knee, block kick with shin", "Catch — catch body kick, sweep standing leg", "Step Back — pull back out of range"], drills: [{ name: "Check Drill", duration: "3 min", desc: "Check kicks from both sides" }, { name: "Catch and Counter", duration: "4 min", desc: "Catch kick, counter with cross or sweep" }, { name: "Defense Flow", duration: "3 min", desc: "Partner attacks, you only defend" }], conditioning: [{ name: "Shadow (defense focus)", sets: 4, reps: "2 min", rest: 30 }, { name: "Jump Rope", sets: 3, reps: "2 min", rest: 30 }, { name: "V-Ups", sets: 3, reps: "15", rest: 30 }] },
            { week: 8, title: "Footwork & Range", focus: "Control distance like a pro", skills: ["In-Out Movement — explode in to attack, slide out", "Angle Changes — pivot after combos to avoid counter", "Push Kick (Teep) — use to control distance"], drills: [{ name: "Teep Range Control", duration: "3 min", desc: "Use teep to keep opponent at kicking range" }, { name: "Angle Off Drill", duration: "4 min", desc: "Throw combo, pivot 45°, throw again" }, { name: "In-Out Attack", duration: "3 min", desc: "Explode in, combo, immediately back out" }], conditioning: [{ name: "Shadow (movement focus)", sets: 4, reps: "3 min", rest: 30 }, { name: "Calf Raises", sets: 3, reps: "25", rest: 30 }, { name: "High Knees", sets: 3, reps: "45s", rest: 30 }] },
            { week: 9, title: "Advanced Combos", focus: "Multi-weapon attacks", skills: ["Punch-Kick-Knee chains", "Setting up kicks with punches", "Body-head level changes"], drills: [{ name: "5-Strike Combo", duration: "4 min", desc: "1-2-Low Kick-3-Body Kick" }, { name: "Punch-Knee-Elbow", duration: "3 min", desc: "Close range: cross-knee-elbow" }, { name: "Freestyle", duration: "4 min", desc: "Create your own 4+ strike combos" }], conditioning: [{ name: "Shadow (full arsenal)", sets: 5, reps: "3 min", rest: 45 }, { name: "Burpees", sets: 3, reps: "15", rest: 30 }, { name: "Plank", sets: 3, reps: "90s", rest: 30 }] },
            { week: 10, title: "Strategy & Timing", focus: "Fight IQ", skills: ["Timing — strike when opponent is moving forward", "Feints — fake an attack to create openings", "Patterns — recognize and exploit opponent habits"], drills: [{ name: "Feint Drill", duration: "3 min", desc: "Feint jab, when opponent reacts, throw real attack" }, { name: "Timing Drill", duration: "4 min", desc: "Partner walks forward, you time a counter" }, { name: "Pattern Read", duration: "4 min", desc: "Partner repeats a pattern, you find the counter" }], conditioning: [{ name: "Shadow (tactical)", sets: 4, reps: "3 min", rest: 45 }, { name: "Jump Squats", sets: 3, reps: "15", rest: 30 }, { name: "Mountain Climbers", sets: 3, reps: "45s", rest: 30 }] },
            { week: 11, title: "Sparring Preparation", focus: "Controlled practice", skills: ["Light Sparring Rules — 30% power, technique focus", "Punch-only rounds", "Kick-only rounds"], drills: [{ name: "Punch-Only Spar", duration: "3 min", desc: "Boxing rules, light contact" }, { name: "Kick-Only Spar", duration: "3 min", desc: "Only kicks and checks allowed" }, { name: "Full Rules Light", duration: "4 min", desc: "All weapons, 30% power, technique focus" }], conditioning: [{ name: "Shadow Fight Simulation", sets: 3, reps: "3 min", rest: 60 }, { name: "Push Ups", sets: 3, reps: "25", rest: 30 }, { name: "Squat Jumps", sets: 3, reps: "15", rest: 30 }] },
            { week: 12, title: "Full Fight Simulation", focus: "Everything together", skills: ["5-round shadow fight", "Pacing through rounds", "Using full arsenal strategically"], drills: [{ name: "5-Round Fight", duration: "25 min", desc: "5× 3min rounds, 1min rest. Use everything." }, { name: "Power Round", duration: "2 min", desc: "Maximum power and speed for 2 minutes" }, { name: "Recovery Round", duration: "3 min", desc: "Light technique, catch your breath while moving" }], conditioning: [{ name: "Shadow Fight", sets: 5, reps: "3 min", rest: 60 }, { name: "Burpees", sets: 3, reps: "20", rest: 30 }, { name: "Plank", sets: 3, reps: "120s", rest: 30 }] },
        ],
        tips: "In kickboxing, your kicks should be thrown with the shin, not the foot. Always return to guard after every strike. Keep your chin down."
    },

    mma: {
        id: "mma", name: "MMA Foundations", icon: "🤼",
        desc: "Mixed martial arts — striking + grappling + ground work. The complete fighter.",
        duration: "16 weeks", daysPerWeek: 4, schedule: ["Mon", "Tue", "Thu", "Fri"],
        curriculum: [
            { week: 1, title: "MMA Stance & Movement", focus: "Wider stance than boxing, hands ready for takedown defense", skills: ["MMA Stance — lower and wider, ready for strikes and takedowns", "Cage movement — circling, cutting angles, using the cage", "Sprawl basics — drop hips to defend takedowns"], drills: [{ name: "Stance Transitions", duration: "3 min", desc: "Switch between striking and grappling stance" }, { name: "Sprawl Drill", duration: "3 min", desc: "Partner shoots, you sprawl (drop hips, push head down)" }, { name: "Shadow MMA", duration: "3 min", desc: "Mix punches, kicks, and sprawls" }], conditioning: [{ name: "Burpees", sets: 3, reps: "15", rest: 45 }, { name: "Sprawls", sets: 3, reps: "10", rest: 30 }, { name: "Plank", sets: 3, reps: "45s", rest: 30 }] },
            { week: 2, title: "Boxing for MMA", focus: "Shorter punches, hands lower, ready for takedowns", skills: ["Shorter Jab-Cross — don't over-extend, easy to get taken down", "Dirty Boxing — short hooks and uppercuts in clinch", "Punching into takedowns — jab-cross-level change"], drills: [{ name: "Short Combo Drill", duration: "3 min", desc: "1-2, don't over-commit, stay balanced" }, { name: "Combo to Sprawl", duration: "4 min", desc: "1-2, partner shoots, you sprawl" }, { name: "Dirty Boxing", duration: "3 min", desc: "Short punches from clinch position" }], conditioning: [{ name: "Shadow MMA", sets: 4, reps: "2 min", rest: 30 }, { name: "Push Ups", sets: 3, reps: "20", rest: 30 }, { name: "Russian Twist", sets: 3, reps: "20", rest: 30 }] },
            { week: 3, title: "Kicks for MMA", focus: "Low kicks and teeps dominate in MMA", skills: ["Low Kick — target the lead leg, slow opponent down", "Teep (Push Kick) — create distance, stop opponent advancing", "Calf Kick — target the calf, modern MMA technique"], drills: [{ name: "Low Kick Drill", duration: "3 min", desc: "Lead and rear low kicks to thigh and calf" }, { name: "Teep Practice", duration: "3 min", desc: "Push kick to create distance" }, { name: "1-2-Low Kick", duration: "4 min", desc: "Set up kicks with punches" }], conditioning: [{ name: "Shadow MMA (kicks)", sets: 4, reps: "2 min", rest: 30 }, { name: "Squats", sets: 3, reps: "20", rest: 45 }, { name: "Calf Raises", sets: 3, reps: "20", rest: 30 }] },
            { week: 4, title: "Clinch Work", focus: "Controlling opponent in close range", skills: ["Muay Thai Clinch — double collar tie, control head", "Underhook — arm under opponent's arm, control position", "Knee from clinch — pull head down, drive knee"], drills: [{ name: "Clinch Entry", duration: "3 min", desc: "Close distance, establish clinch control" }, { name: "Clinch Knees", duration: "4 min", desc: "Control head, throw alternating knees" }, { name: "Clinch Escape", duration: "3 min", desc: "Partner clinches you, practice breaking free" }], conditioning: [{ name: "Shadow + Clinch", sets: 4, reps: "2 min", rest: 30 }, { name: "Plank", sets: 3, reps: "60s", rest: 30 }, { name: "Burpees", sets: 3, reps: "12", rest: 45 }] },
            { week: 5, title: "Takedown Basics", focus: "Getting the fight to the ground", skills: ["Double Leg — shoot on both legs, drive through", "Single Leg — grab one leg, trip the other", "Level Change — drop level to set up the shot"], drills: [{ name: "Penetration Step", duration: "3 min", desc: "Practice the level change and first step" }, { name: "Double Leg Solo", duration: "3 min", desc: "Shoot on an imaginary opponent, drive through" }, { name: "Single Leg Finish", duration: "4 min", desc: "Grab the leg, trip/lift to take down" }], conditioning: [{ name: "Sprawl-Shoot Drill", sets: 4, reps: "10 each", rest: 45 }, { name: "Jump Squats", sets: 3, reps: "15", rest: 30 }, { name: "Mountain Climbers", sets: 3, reps: "30s", rest: 30 }] },
            { week: 6, title: "Takedown Defense", focus: "Staying on your feet", skills: ["Sprawl — hips drop, legs back, flatten opponent", "Whizzer — overhook to prevent takedown", "Cage Use — back against cage for support"], drills: [{ name: "Sprawl Drill", duration: "4 min", desc: "React to shot with explosive sprawl" }, { name: "Whizzer Counter", duration: "3 min", desc: "Overhook when opponent gets underhook" }, { name: "Cage Getup", duration: "3 min", desc: "Back to wall, stand up while partner holds you" }], conditioning: [{ name: "Sprawl Burpees", sets: 4, reps: "10", rest: 30 }, { name: "Bear Crawl", sets: 3, reps: "30s", rest: 30 }, { name: "Plank", sets: 3, reps: "60s", rest: 30 }] },
            { week: 7, title: "Ground Control", focus: "Position before submission", skills: ["Mount — sit on opponent's chest, control", "Side Control — control from the side", "Guard — fighting from your back (not helpless)"], drills: [{ name: "Mount Hold", duration: "3 min", desc: "Maintain mount position, partner tries to escape" }, { name: "Side Control Pressure", duration: "3 min", desc: "Keep heavy pressure, don't let them turn" }, { name: "Guard Recovery", duration: "4 min", desc: "From bottom, recover guard (legs around opponent)" }], conditioning: [{ name: "Positional Drills", sets: 4, reps: "2 min", rest: 30 }, { name: "Push Ups", sets: 3, reps: "25", rest: 30 }, { name: "Hip Bridges", sets: 3, reps: "15", rest: 30 }] },
            { week: 8, title: "Ground & Pound", focus: "Striking from top position", skills: ["Posture up in mount — create distance for powerful strikes", "Short shots from guard — elbows and short punches", "Maintaining position while striking"], drills: [{ name: "GnP from Mount", duration: "4 min", desc: "Maintain mount, throw controlled strikes" }, { name: "GnP from Guard", duration: "3 min", desc: "In opponent's guard, posture and strike" }, { name: "Strike-Pass Combo", duration: "3 min", desc: "Strike to distract, pass to better position" }], conditioning: [{ name: "GnP Simulation", sets: 4, reps: "2 min", rest: 30 }, { name: "Burpees", sets: 3, reps: "15", rest: 30 }, { name: "Plank", sets: 3, reps: "90s", rest: 30 }] },
            { week: 9, title: "Basic Submissions", focus: "Ending the fight", skills: ["Rear Naked Choke — from back control, arm under chin", "Armbar — hyperextend the elbow from guard or mount", "Guillotine — front headlock choke"], drills: [{ name: "RNC Drill", duration: "4 min", desc: "Take the back, secure hooks, apply choke" }, { name: "Armbar from Guard", duration: "4 min", desc: "From closed guard, isolate arm, swing leg over, extend" }, { name: "Guillotine Setup", duration: "3 min", desc: "From standing, snap head down, apply choke" }], conditioning: [{ name: "Submission Flow", sets: 4, reps: "2 min", rest: 30 }, { name: "Pull Ups", sets: 3, reps: "max", rest: 45 }, { name: "Hip Bridges", sets: 3, reps: "20", rest: 30 }] },
            { week: 10, title: "Transitions", focus: "Flowing between striking and grappling", skills: ["Striking to takedown — 1-2 into double leg", "Takedown to ground & pound — take down then strike", "Submission attempt to standup — if sub fails, stand up"], drills: [{ name: "1-2-Takedown", duration: "4 min", desc: "Jab-cross, level change, shoot double leg" }, { name: "Takedown-GnP-Sub", duration: "4 min", desc: "Take down, ground and pound, go for armbar" }, { name: "Full Transition Drill", duration: "4 min", desc: "Stand up → strike → clinch → takedown → ground → stand up" }], conditioning: [{ name: "MMA Simulation", sets: 4, reps: "3 min", rest: 45 }, { name: "Sprawls", sets: 3, reps: "10", rest: 30 }, { name: "Mountain Climbers", sets: 3, reps: "45s", rest: 30 }] },
            { week: 11, title: "Fight Strategy", focus: "Game planning", skills: ["Striker vs Grappler — keep distance, use teep", "Grappler vs Striker — close distance, get clinch/takedown", "Against the cage — dirty boxing and trips"], drills: [{ name: "Striker Gameplan", duration: "4 min", desc: "Stay at range, jab, low kick, sprawl takedowns" }, { name: "Grappler Gameplan", duration: "4 min", desc: "Close distance, clinch, takedown, control" }, { name: "Mixed Gameplan", duration: "4 min", desc: "Freestyle: pick your moments to strike or grapple" }], conditioning: [{ name: "Fight Simulation", sets: 3, reps: "5 min", rest: 60 }, { name: "Burpees", sets: 3, reps: "20", rest: 30 }, { name: "Plank", sets: 3, reps: "120s", rest: 30 }] },
            { week: 12, title: "Full MMA Rounds", focus: "Everything together", skills: ["5-round fight simulation", "Round pacing", "Using all tools — striking, clinch, takedowns, ground"], drills: [{ name: "5-Round Shadow MMA", duration: "25 min", desc: "5× 3min rounds, 1min rest. Use everything." }, { name: "Scramble Drill", duration: "3 min", desc: "Rapid transitions between positions" }, { name: "Finish Drill", duration: "3 min", desc: "Create a finish: KO or submission" }], conditioning: [{ name: "MMA Circuit", sets: 3, reps: "5 min", rest: 60 }, { name: "Full Body HIIT", sets: 1, reps: "5 min", rest: 0 }] },
        ],
        tips: "MMA is about being comfortable everywhere. Don't neglect any area — the best fighters can strike, grapple, and transition seamlessly."
    },

    muay_thai: {
        id: "muay_thai", name: "Muay Thai", icon: "🇹🇭",
        desc: "The art of 8 limbs — punches, kicks, elbows, knees. Thailand's national martial art.",
        duration: "12 weeks", daysPerWeek: 3, schedule: ["Mon", "Wed", "Fri"],
        curriculum: [
            { week: 1, title: "Muay Thai Stance & Teep", focus: "The foundation of Muay Thai", skills: ["Muay Thai Stance — square, weight centered, arms higher than boxing", "Teep (Push Kick) — the jab of Muay Thai", "Long Guard — lead arm extended to create distance"], drills: [{ name: "Teep Drill", duration: "4 min", desc: "Lead and rear teeps, aim for solar plexus" }, { name: "Long Guard Walk", duration: "3 min", desc: "Walk forward with extended lead arm" }, { name: "Stance Movement", duration: "3 min", desc: "Move in all 4 directions maintaining stance" }], conditioning: [{ name: "Shadow Muay Thai", sets: 3, reps: "2 min", rest: 30 }, { name: "High Knees", sets: 3, reps: "30s", rest: 30 }, { name: "Plank", sets: 3, reps: "45s", rest: 30 }] },
            { week: 2, title: "Punches + Round Kick", focus: "Basic strikes", skills: ["1-2 (Jab-Cross)", "Thai Round Kick — kick through with shin, rotate hip fully", "Kick with shin, not foot"], drills: [{ name: "Round Kick Practice", duration: "4 min", desc: "Rear round kick, focus on turning over the hip" }, { name: "1-2-Kick", duration: "3 min", desc: "Set up kick with punches" }, { name: "Kick Both Sides", duration: "3 min", desc: "Switch kick from both stances" }], conditioning: [{ name: "Shadow (punches + kicks)", sets: 4, reps: "2 min", rest: 30 }, { name: "Lunges", sets: 3, reps: "12 each", rest: 45 }, { name: "Calf Raises", sets: 3, reps: "20", rest: 30 }] },
            { week: 3, title: "Elbows & Knees", focus: "The unique Muay Thai weapons", skills: ["Horizontal Elbow", "Uppercut Elbow", "Straight Knee from clinch"], drills: [{ name: "Elbow Combos", duration: "3 min", desc: "1-2-Elbow in close range" }, { name: "Knee Strikes", duration: "3 min", desc: "Step in rear knee, alternating" }, { name: "Clinch Knees", duration: "4 min", desc: "Double collar tie, throw 5 knees" }], conditioning: [{ name: "Shadow (8 limbs)", sets: 4, reps: "2 min", rest: 30 }, { name: "Squats", sets: 3, reps: "20", rest: 45 }, { name: "Mountain Climbers", sets: 3, reps: "30s", rest: 30 }] },
            { week: 4, title: "Clinch Mastery", focus: "Muay Thai clinch is an art form", skills: ["Double Collar Tie — control head", "Single Collar Tie + Underhook", "Clinch sweeps and throws"], drills: [{ name: "Clinch Position", duration: "3 min", desc: "Fight for double collar tie control" }, { name: "Clinch Knees", duration: "4 min", desc: "Alternate knees while controlling head" }, { name: "Clinch Sweep", duration: "3 min", desc: "Off-balance opponent and trip/sweep" }], conditioning: [{ name: "Shadow + Clinch", sets: 4, reps: "2 min", rest: 30 }, { name: "Russian Twist", sets: 3, reps: "20", rest: 30 }, { name: "Hip Bridges", sets: 3, reps: "15", rest: 30 }] },
            { week: 5, title: "Checking & Defense", focus: "Block kicks and counter", skills: ["Check — lift knee to block round kick with shin", "Catch kick — catch body kick, counter sweep", "Lean Back — evade head kicks"], drills: [{ name: "Check Both Sides", duration: "3 min", desc: "Check kicks alternating legs" }, { name: "Catch + Counter", duration: "4 min", desc: "Catch kick, sweep or strike" }, { name: "Defense Flow", duration: "3 min", desc: "Partner attacks slowly, practice all defenses" }], conditioning: [{ name: "Shadow (defense focus)", sets: 4, reps: "2 min", rest: 30 }, { name: "Jump Squats", sets: 3, reps: "15", rest: 45 }, { name: "Plank", sets: 3, reps: "60s", rest: 30 }] },
            { week: 6, title: "Combinations (8 Limbs)", focus: "Chain all weapons together", skills: ["Punch-Kick-Knee chains", "Punch-Elbow in close range", "Question Mark Kick — fake low, go high"], drills: [{ name: "8-Count Combo", duration: "4 min", desc: "1-2-Kick-Knee-Elbow-Cross-Hook-Kick" }, { name: "Question Mark Kick", duration: "3 min", desc: "Chamber like body kick, redirect to head" }, { name: "Freestyle Muay Thai", duration: "4 min", desc: "Create combos using all 8 weapons" }], conditioning: [{ name: "Shadow Fight", sets: 5, reps: "3 min", rest: 45 }, { name: "Burpees", sets: 3, reps: "15", rest: 30 }, { name: "V-Ups", sets: 3, reps: "15", rest: 30 }] },
            { week: 7, title: "Counter Striking", focus: "Make them pay", skills: ["Counter kick after catching", "Cross counter after slip", "Teep counter to stop aggression"], drills: [{ name: "Catch-Cross", duration: "3 min", desc: "Catch kick with arm, counter with rear cross" }, { name: "Slip-Cross Counter", duration: "3 min", desc: "Slip jab, counter with cross" }, { name: "Teep Counter", duration: "4 min", desc: "When opponent advances, time the teep" }], conditioning: [{ name: "Shadow (counter focus)", sets: 4, reps: "3 min", rest: 30 }, { name: "High Knees", sets: 3, reps: "45s", rest: 30 }, { name: "Push Ups", sets: 3, reps: "25", rest: 30 }] },
            { week: 8, title: "Low Kicks Mastery", focus: "Destroy the legs", skills: ["Inside Low Kick", "Outside Low Kick", "Calf Kick — modern technique"], drills: [{ name: "Low Kick Combos", duration: "4 min", desc: "1-2-Inside Low, 1-2-Outside Low, switch" }, { name: "Calf Kick", duration: "3 min", desc: "Target the calf muscle specifically" }, { name: "Low Kick to Body Kick", duration: "3 min", desc: "Low kick to lower guard, body kick when hands drop" }], conditioning: [{ name: "Shadow (kicks focus)", sets: 4, reps: "3 min", rest: 30 }, { name: "Squats", sets: 3, reps: "25", rest: 30 }, { name: "Calf Raises", sets: 4, reps: "20", rest: 30 }] },
            { week: 9, title: "Fight IQ & Timing", focus: "Fight smart", skills: ["Rhythm Breaking — change tempo to surprise opponent", "Feints — fake attacks to create openings", "Reading tells — recognize patterns"], drills: [{ name: "Feint to Attack", duration: "4 min", desc: "Feint jab, when they react, throw real attack" }, { name: "Tempo Changes", duration: "3 min", desc: "Slow-slow-FAST, change rhythm" }, { name: "Pattern Drill", duration: "4 min", desc: "Partner repeats a combo, find the counter" }], conditioning: [{ name: "Shadow (tactical)", sets: 4, reps: "3 min", rest: 30 }, { name: "Burpees", sets: 3, reps: "15", rest: 30 }, { name: "Plank", sets: 3, reps: "90s", rest: 30 }] },
            { week: 10, title: "Sweeps & Dumps", focus: "Put them on the ground", skills: ["Inside Trip", "Outside Trip", "Dump from clinch"], drills: [{ name: "Inside Trip", duration: "3 min", desc: "Catch kick, step inside, trip" }, { name: "Clinch Dump", duration: "4 min", desc: "From clinch, off-balance and dump opponent" }, { name: "Sweep to Strike", duration: "3 min", desc: "Sweep, then immediately attack on the ground" }], conditioning: [{ name: "Shadow + Trips", sets: 4, reps: "2 min", rest: 30 }, { name: "Sprawls", sets: 3, reps: "10", rest: 30 }, { name: "Mountain Climbers", sets: 3, reps: "45s", rest: 30 }] },
            { week: 11, title: "Sparring Preparation", focus: "Controlled practice", skills: ["Technical sparring — 30% power", "Clinch sparring", "Kick-only sparring"], drills: [{ name: "Technical Spar", duration: "4 min", desc: "All weapons, light contact, focus on technique" }, { name: "Clinch Spar", duration: "3 min", desc: "Start in clinch, fight for position" }, { name: "Kick-Only Spar", duration: "3 min", desc: "Only kicks and checks" }], conditioning: [{ name: "Fight Rounds", sets: 3, reps: "3 min", rest: 60 }, { name: "Push Ups", sets: 3, reps: "30", rest: 30 }, { name: "Flutter Kicks", sets: 3, reps: "45s", rest: 30 }] },
            { week: 12, title: "5-Round Fight Simulation", focus: "The final test", skills: ["5 × 3min rounds with all weapons", "Pacing — save energy for later rounds", "Finishing — pour it on when opponent is hurt"], drills: [{ name: "5-Round Fight", duration: "25 min", desc: "5× 3min rounds, 1min rest. Full Muay Thai." }, { name: "Power Round", duration: "2 min", desc: "Max power kicks and knees" }, { name: "Cooldown Flow", duration: "3 min", desc: "Light shadow work, stretch kicks" }], conditioning: [{ name: "Full Fight Sim", sets: 5, reps: "3 min", rest: 60 }, { name: "Burpees", sets: 3, reps: "20", rest: 30 }] },
        ],
        tips: "Muay Thai is about timing and power, not speed. Kick through targets, not at them. The clinch wins fights."
    },

    martial_arts: {
        id: "martial_arts", name: "Traditional Martial Arts", icon: "🥋",
        desc: "Discipline, technique, and philosophy. Stances, forms, blocks, and strikes.",
        duration: "12 weeks", daysPerWeek: 3, schedule: ["Tue", "Thu", "Sat"],
        curriculum: [
            { week: 1, title: "Meditation & Stances", focus: "Center yourself, build foundation", skills: ["Horse Stance — wide squat, build leg strength", "Front Stance — weight forward for power attacks", "Back Stance — weight back for defensive movement"], drills: [{ name: "Horse Stance Hold", duration: "5 min", desc: "Hold horse stance, breathe deeply, build mental toughness" }, { name: "Stance Transitions", duration: "3 min", desc: "Move between horse, front, and back stance" }, { name: "Walking Meditation", duration: "3 min", desc: "Slow deliberate steps, focus on each movement" }], conditioning: [{ name: "Wall Sit", sets: 3, reps: "45s", rest: 30 }, { name: "Slow Squats", sets: 3, reps: "15", rest: 30 }, { name: "Plank", sets: 3, reps: "60s", rest: 30 }] },
            { week: 2, title: "Basic Blocks", focus: "Defense before offense", skills: ["High Block — protect head from downward attacks", "Middle Block — protect torso from straight attacks", "Low Block — protect legs from kicks"], drills: [{ name: "Block Drill", duration: "3 min", desc: "Practice all 3 blocks in sequence" }, { name: "React Block", duration: "4 min", desc: "Partner calls high/mid/low, you react with correct block" }, { name: "Block + Step", duration: "3 min", desc: "Block while stepping back to create distance" }], conditioning: [{ name: "Shadow (blocks)", sets: 3, reps: "2 min", rest: 30 }, { name: "Push Ups", sets: 3, reps: "15", rest: 30 }, { name: "Horse Stance Hold", sets: 3, reps: "30s", rest: 30 }] },
            { week: 3, title: "Basic Punches", focus: "Straight punch, reverse punch", skills: ["Front Punch — lead hand straight, from hip", "Reverse Punch — rear hand with hip rotation", "Kiai — power shout to increase focus and power"], drills: [{ name: "Front Punch", duration: "3 min", desc: "From horse stance, practice front punch with kiai" }, { name: "Reverse Punch", duration: "3 min", desc: "From front stance, hip rotation into reverse punch" }, { name: "1-2 from Stance", duration: "4 min", desc: "Front punch-reverse punch, snap back to guard" }], conditioning: [{ name: "Shadow (punches + blocks)", sets: 4, reps: "2 min", rest: 30 }, { name: "Crunches", sets: 3, reps: "20", rest: 30 }, { name: "Squat Hold", sets: 3, reps: "30s", rest: 30 }] },
            { week: 4, title: "Front Kick & Side Kick", focus: "Precision kicking", skills: ["Front Snap Kick — chamber knee, snap kick out, re-chamber", "Side Kick — chamber knee, thrust sideways with heel", "Kick Height — start low, work up as flexibility improves"], drills: [{ name: "Front Kick Drill", duration: "3 min", desc: "Chamber-kick-re-chamber, focus on snap" }, { name: "Side Kick Drill", duration: "3 min", desc: "Chamber-thrust-return, push through heel" }, { name: "Kick Combos", duration: "4 min", desc: "Front kick-reverse punch, side kick-back fist" }], conditioning: [{ name: "Slow Kicks", sets: 3, reps: "10 each", rest: 30 }, { name: "Leg Raises", sets: 3, reps: "12", rest: 30 }, { name: "Calf Raises", sets: 3, reps: "20", rest: 30 }] },
            { week: 5, title: "Round Kick & Back Kick", focus: "Powerful rotational kicks", skills: ["Roundhouse Kick — pivot on standing foot, kick with instep", "Back Kick — turn, thrust heel backward", "Spinning — control your spin, always see the target"], drills: [{ name: "Roundhouse Drill", duration: "3 min", desc: "Practice roundhouse both legs, focus on pivot" }, { name: "Back Kick", duration: "3 min", desc: "180° turn, thrust heel, look over shoulder" }, { name: "Combo Kicks", duration: "4 min", desc: "Roundhouse, then same leg back kick" }], conditioning: [{ name: "Shadow (all kicks)", sets: 4, reps: "2 min", rest: 30 }, { name: "Lunges", sets: 3, reps: "15 each", rest: 30 }, { name: "Plank", sets: 3, reps: "60s", rest: 30 }] },
            { week: 6, title: "Forms / Kata Introduction", focus: "Sequential moves telling a story", skills: ["Basic Form — sequence of blocks, punches, kicks in pattern", "Breathing — coordinate breath with movements", "Focus — each move has a purpose, visualize opponent"], drills: [{ name: "8-Move Form", duration: "5 min", desc: "Down block-punch-turn-block-punch-kick-block-punch" }, { name: "Slow Form", duration: "3 min", desc: "Perform form at half speed, perfect each position" }, { name: "Power Form", duration: "3 min", desc: "Full speed, full power, kiai on last move" }], conditioning: [{ name: "Form Practice", sets: 5, reps: "1 each", rest: 30 }, { name: "Horse Stance", sets: 3, reps: "60s", rest: 30 }, { name: "Push Ups", sets: 3, reps: "20", rest: 30 }] },
            { week: 7, title: "One-Step Sparring", focus: "Pre-arranged defense patterns", skills: ["Attacker throws specific attack, defender blocks and counters", "Timing — react as attack comes, not before or after", "Distance — maintain proper fighting distance"], drills: [{ name: "Punch Defense 1", duration: "3 min", desc: "Partner punches, you block and reverse punch" }, { name: "Kick Defense 1", duration: "3 min", desc: "Partner front kicks, you step back and counter" }, { name: "Combo Defense", duration: "4 min", desc: "Partner throws 2-punch combo, you block both and counter" }], conditioning: [{ name: "Reaction Drills", sets: 4, reps: "2 min", rest: 30 }, { name: "Burpees", sets: 3, reps: "10", rest: 45 }, { name: "V-Ups", sets: 3, reps: "12", rest: 30 }] },
            { week: 8, title: "Advanced Kicks", focus: "Spinning and jumping techniques", skills: ["Spinning Hook Kick — 360° turn, hook with heel", "Jump Front Kick — leap and front kick in air", "Crescent Kick — arcing kick for deflection"], drills: [{ name: "Spinning Hook Kick", duration: "4 min", desc: "Spin on lead foot, hook kick with rear leg" }, { name: "Jump Kick", duration: "3 min", desc: "Start with step-behind jump, front kick at peak" }, { name: "Kick Flow", duration: "3 min", desc: "Chain: front kick, roundhouse, back kick, all same leg" }], conditioning: [{ name: "Jump Kicks", sets: 3, reps: "10", rest: 45 }, { name: "Jump Squats", sets: 3, reps: "15", rest: 30 }, { name: "Plank", sets: 3, reps: "90s", rest: 30 }] },
            { week: 9, title: "Self-Defense Applications", focus: "Real-world techniques", skills: ["Wrist Grab Defense — rotate and counter", "Choke Defense — tuck chin, create space, counter", "Bear Hug Defense — drop weight, elbow, escape"], drills: [{ name: "Grab Defense", duration: "3 min", desc: "Partner grabs wrist, you rotate and counter" }, { name: "Choke Defense", duration: "3 min", desc: "Partner simulates choke, you tuck chin and escape" }, { name: "Scenario Drill", duration: "4 min", desc: "Random attacks, you react with defense + counter" }], conditioning: [{ name: "Reaction Drills", sets: 4, reps: "2 min", rest: 30 }, { name: "Push Ups", sets: 3, reps: "25", rest: 30 }, { name: "Mountain Climbers", sets: 3, reps: "45s", rest: 30 }] },
            { week: 10, title: "Sparring Basics", focus: "Light contact, technique focus", skills: ["Point Sparring — score points with clean techniques", "Control — hit the target, don't hurt your partner", "Timing & Distance — the two pillars of sparring"], drills: [{ name: "Light Sparring", duration: "4 min", desc: "Point sparring, 30% power, score with technique" }, { name: "Attack-Only Round", duration: "3 min", desc: "You attack, partner only defends" }, { name: "Defense-Only Round", duration: "3 min", desc: "Partner attacks, you only defend and counter" }], conditioning: [{ name: "Spar Rounds", sets: 3, reps: "2 min", rest: 60 }, { name: "Burpees", sets: 3, reps: "15", rest: 30 }, { name: "Plank", sets: 3, reps: "120s", rest: 30 }] },
            { week: 11, title: "Advanced Forms", focus: "Longer, more complex sequences", skills: ["Extended Form — 20+ moves", "Speed and Power — fast moves, powerful kiai", "Performance — forms should tell a story"], drills: [{ name: "Full Form", duration: "5 min", desc: "Perform complete 20+ move form" }, { name: "Breakdown Practice", duration: "5 min", desc: "Break form into 4 sections, perfect each" }, { name: "Mirror Form", duration: "3 min", desc: "Perform form in reverse (opposite side)" }], conditioning: [{ name: "Form Practice", sets: 5, reps: "1 each", rest: 30 }, { name: "Horse Stance", sets: 3, reps: "90s", rest: 30 }, { name: "Slow Kicks", sets: 3, reps: "10 each", rest: 30 }] },
            { week: 12, title: "Belt Test Preparation", focus: "Demonstrate all learned skills", skills: ["Review all stances, blocks, strikes, kicks", "Perform all forms with power and precision", "Demonstrate self-defense techniques and sparring ability"], drills: [{ name: "Full Review", duration: "10 min", desc: "Go through every technique learned in the program" }, { name: "Form Performance", duration: "5 min", desc: "Perform best form at full power" }, { name: "Sparring Round", duration: "3 min", desc: "2 rounds of light sparring, show all skills" }], conditioning: [{ name: "Full Workout", sets: 1, reps: "15 min", rest: 0 }, { name: "Meditation", sets: 1, reps: "5 min", rest: 0 }] },
        ],
        tips: "Martial arts is a journey, not a destination. Respect the art, respect your training partners, and always bow with sincerity."
    },
};

// Helper to get today's workout from a program
export function getTodayWorkout(program, currentWeek, currentDay) {
    if (!program) return null;

    // For combat programs
    if (program.curriculum) {
        const weekData = program.curriculum[Math.min(currentWeek, program.curriculum.length - 1)];
        return weekData;
    }

    // For gym programs
    const phase = program.phases.find((p, i) => {
        const startWeek = program.phases.slice(0, i).reduce((s, ph) => {
            const match = ph.weeks.match(/(\d+)-(\d+)/);
            return match ? parseInt(match[1]) - 1 : s;
        }, 0);
        const match = p.weeks.match(/(\d+)-(\d+)/);
        if (match) {
            return currentWeek >= parseInt(match[0]) - 1 && currentWeek <= parseInt(match[1]) - 1;
        }
        return false;
    }) || program.phases[0];

    if (!phase) return null;

    const dayIdx = currentDay % phase.weekPattern.length;
    const dayKey = phase.weekPattern[dayIdx];
    const isDeload = program.deloadEvery && (currentWeek + 1) % program.deloadEvery === 0;

    return {
        phase: phase.name,
        focus: phase.focus,
        day: phase.days[dayKey],
        isDeload,
        dayKey,
    };
}

// ══ Re-export Fitness Programs ══
// Import these in TrainingPage alongside GYM_PROGRAMS and COMBAT_PROGRAMS