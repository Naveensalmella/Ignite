// ══════════════════════════════════════
// Exercise Metadata — Form Tips + Swap Alternatives
// ══════════════════════════════════════

export const FORM_TIPS = {
    "Push Ups": "Keep elbows at 45°, core tight, full range of motion. Don't let hips sag.",
    "Wide Push Ups": "Hands wider than shoulders. Squeeze chest at the top.",
    "Diamond Push Ups": "Hands form a diamond under chest. Elbows stay close to body.",
    "Decline Push Ups": "Feet elevated on chair. Targets upper chest.",
    "Pull Ups": "Dead hang start, pull until chin clears bar. No kipping.",
    "Chin Ups": "Underhand grip, focus on bicep squeeze at top.",
    "Squats": "Feet shoulder-width, knees track over toes, sit back. Depth below parallel.",
    "Jump Squats": "Land softly on balls of feet. Absorb impact with bent knees.",
    "Lunges": "Front knee stays over ankle. Back knee nearly touches ground.",
    "Walking Lunges": "Long stride, upright torso, push through front heel.",
    "Bulgarian Split Squat": "Rear foot on bench. Keep torso upright, front knee stable.",
    "Crunches": "Curl shoulders off floor, don't pull neck. Exhale on the way up.",
    "Sit Ups": "Feet flat, cross arms on chest. Control the descent.",
    "Plank": "Straight line from head to heels. Don't hold breath — breathe steadily.",
    "Side Plank": "Stack feet or stagger. Hips high, don't let them drop.",
    "Mountain Climbers": "Hands under shoulders, drive knees to chest. Keep hips level.",
    "Bicycle Crunches": "Opposite elbow to knee. Slow and controlled, not fast.",
    "Russian Twist": "Lean back 45°, lift feet for harder. Rotate from torso not arms.",
    "Burpees": "Chest to floor, explosive jump, full hip extension at top.",
    "Jumping Jacks": "Land softly, arms fully extended overhead.",
    "High Knees": "Drive knees to waist height. Pump arms, stay on toes.",
    "Leg Raises": "Press lower back into floor. Slow descent, don't arch back.",
    "Flutter Kicks": "Lower back pressed down. Small kicks, controlled tempo.",
    "Glute Bridge": "Drive through heels, squeeze glutes at top. Hold 1-2 seconds.",
    "Hip Thrust": "Upper back on bench, drive hips up. Squeeze glutes hard at top.",
    "Calf Raises": "Full range — stretch at bottom, squeeze at top. Pause at peak.",
    "Wall Sit": "Back flat against wall, thighs parallel to floor. Breathe.",
    "Superman": "Lift arms and legs simultaneously. Hold 2-3 seconds at top.",
    "Shoulder Press": "Press straight up, don't arch back. Core stays tight.",
    "Lateral Raise": "Slight bend in elbows, raise to shoulder height. Control the lower.",
    "Bicep Curls": "Elbows pinned to sides. Full extension, full contraction.",
    "Hammer Curls": "Neutral grip, controlled tempo. Don't swing.",
    "Tricep Dips": "Elbows point back not out. Lower until 90° elbow angle.",
    "Tricep Extension": "Keep upper arms still. Only forearms move.",
    "Deadlift": "Hinge at hips, flat back. Bar stays close to body. Drive through heels.",
    "Romanian Deadlift": "Soft knees, hinge forward. Feel hamstring stretch. Flat back.",
    "Bench Press": "Retract shoulder blades, arch slightly. Bar path from chest to above shoulders.",
    "Dumbbell Press": "Full range of motion, squeeze at top. Control the negative.",
    "Bent Over Row": "45° torso angle, pull to lower chest. Squeeze shoulder blades.",
    "Dumbbell Row": "One hand on bench, pull to hip. No torso rotation.",
    "Shadow Boxing": "Stay light on feet, rotate hips into punches. Keep guard up.",
    "Jab Cross": "Rotate hips and shoulders. Snap punches back quickly.",
    "Roundhouse Kick": "Pivot on standing foot, drive hip through. Kick with shin.",
    "Front Kick": "Chamber knee first, snap kick out. Re-chamber before lowering.",
    "Kettlebell Swing": "Hip hinge, not squat. Power comes from hip snap. Arms are just ropes.",
    "Box Jumps": "Swing arms, land softly with bent knees. Step down, don't jump.",
    "V-Ups": "Reach hands to toes, keep legs straight. Control the descent.",
    "Inchworm": "Walk hands out to plank, walk feet to hands. Keep legs straight.",
    "Bear Crawl": "Knees 1 inch off ground. Opposite hand and foot move together.",
    "Hanging Leg Raise": "No swinging. Slow controlled raise. Curl pelvis at top.",
    "Step Ups": "Drive through top foot. Don't push off bottom foot.",
};

export const SWAP_ALTERNATIVES = {
    "Push Ups": ["Knee Push Ups", "Wall Push Ups", "Incline Push Ups"],
    "Wide Push Ups": ["Push Ups", "Chest Fly", "Dumbbell Press"],
    "Diamond Push Ups": ["Close Grip Push Ups", "Tricep Dips", "Tricep Extension"],
    "Pull Ups": ["Chin Ups", "Lat Pulldown", "Bent Over Row"],
    "Chin Ups": ["Pull Ups", "Bicep Curls", "Lat Pulldown"],
    "Squats": ["Wall Sit", "Leg Press", "Goblet Squat"],
    "Jump Squats": ["Squats", "Box Jumps", "Step Ups"],
    "Lunges": ["Step Ups", "Bulgarian Split Squat", "Walking Lunges"],
    "Walking Lunges": ["Lunges", "Step Ups", "Bulgarian Split Squat"],
    "Bulgarian Split Squat": ["Lunges", "Squats", "Step Ups"],
    "Burpees": ["Mountain Climbers", "Jump Squats", "High Knees"],
    "Mountain Climbers": ["High Knees", "Burpees", "Plank"],
    "Plank": ["Dead Bug", "Bird Dog", "Side Plank"],
    "Crunches": ["Sit Ups", "Bicycle Crunches", "V-Ups"],
    "Leg Raises": ["Flutter Kicks", "Hanging Leg Raise", "V-Ups"],
    "Deadlift": ["Romanian Deadlift", "Glute Bridge", "Hip Thrust"],
    "Bench Press": ["Push Ups", "Dumbbell Press", "Chest Fly"],
    "Shoulder Press": ["Pike Push Ups", "Lateral Raise", "Arnold Press"],
    "Bicep Curls": ["Hammer Curls", "Chin Ups", "Concentration Curl"],
    "Tricep Dips": ["Tricep Extension", "Diamond Push Ups", "Tricep Kickback"],
    "Glute Bridge": ["Hip Thrust", "Romanian Deadlift", "Squats"],
    "Shadow Boxing": ["Jab Cross", "Jumping Jacks", "High Knees"],
    "Box Jumps": ["Jump Squats", "Step Ups", "Tuck Jumps"],
    "Kettlebell Swing": ["Romanian Deadlift", "Hip Thrust", "Sumo Squat"],
};

// Warm-up exercises (5 exercises, 30 sec each)
export const WARMUP = [
    { name: "Arm Circles", duration: 30, icon: "🔄" },
    { name: "Jumping Jacks", duration: 30, icon: "⭐" },
    { name: "Hip Circles", duration: 30, icon: "🔄" },
    { name: "High Knees", duration: 30, icon: "🦵" },
    { name: "Torso Twist", duration: 30, icon: "🔄" },
];

// Cool-down stretches (5 stretches, 30 sec each)
export const COOLDOWN = [
    { name: "Quad Stretch", duration: 30, icon: "🦵" },
    { name: "Hamstring Stretch", duration: 30, icon: "🦵" },
    { name: "Shoulder Stretch", duration: 30, icon: "💪" },
    { name: "Child's Pose", duration: 30, icon: "🧘" },
    { name: "Deep Breathing", duration: 30, icon: "🌬️" },
];

export function getFormTip(exerciseName) {
    if (!exerciseName) return null;
    const exact = FORM_TIPS[exerciseName];
    if (exact) return exact;
    const lower = exerciseName.toLowerCase();
    for (const [key, val] of Object.entries(FORM_TIPS)) {
        if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return val;
    }
    return null;
}

export function getSwapOptions(exerciseName) {
    if (!exerciseName) return [];
    return SWAP_ALTERNATIVES[exerciseName] || [];
}