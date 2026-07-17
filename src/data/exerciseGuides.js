// ══════════════════════════════════════════
// EXERCISE GUIDES — Step-by-step instructions
// Every exercise has: steps, tips, mistakes, muscles, difficulty, animation cues
// ══════════════════════════════════════════

export const EXERCISE_GUIDES = {
  // ─── BODYWEIGHT / GYM ───
  "Push-ups": {
    muscles: ["Chest", "Triceps", "Shoulders"],
    difficulty: 1,
    steps: [
      "Place hands shoulder-width apart on the floor, fingers forward",
      "Extend legs back, body in a straight line from head to heels",
      "Lower your chest toward the floor by bending elbows (2 sec down)",
      "Chest should nearly touch the floor — pause briefly",
      "Push back up to starting position (1 sec up)",
      "Keep core tight throughout — don't let hips sag or pike up"
    ],
    tips: ["Look slightly ahead, not straight down", "Squeeze your glutes to keep body straight", "Breathe in going down, out pushing up"],
    mistakes: ["Flaring elbows out to 90° (keep them at ~45°)", "Half reps — go all the way down", "Sagging hips or piking butt up"],
    breathing: "Inhale down, exhale up",
    animation: "down-up", // animation type
  },
  "Diamond Push-ups": {
    muscles: ["Triceps", "Inner Chest"],
    difficulty: 2,
    steps: [
      "Place hands together under your chest, thumbs and index fingers touching to form a diamond shape",
      "Extend legs back, body straight",
      "Lower chest to your hands slowly (2 sec)",
      "Elbows should track along your sides, not flare out",
      "Push back up by straightening arms",
      "Keep core engaged the entire time"
    ],
    tips: ["Start with knees on floor if too hard", "Focus on squeezing triceps at the top", "Keep diamond hand position directly under chest"],
    mistakes: ["Hands too far forward", "Elbows flaring sideways", "Not going deep enough"],
    breathing: "Inhale down, exhale up",
    animation: "down-up",
  },
  "Squats": {
    muscles: ["Quads", "Glutes", "Hamstrings"],
    difficulty: 1,
    steps: [
      "Stand with feet shoulder-width apart, toes slightly turned out",
      "Keep chest up, shoulders back, core tight",
      "Push hips back and bend knees as if sitting into a chair",
      "Lower until thighs are parallel to the floor (or lower)",
      "Keep knees tracking over toes — don't let them cave in",
      "Drive through heels to stand back up"
    ],
    tips: ["Weight should be on your heels, not toes", "Keep your chest lifted the entire time", "Go as deep as your mobility allows"],
    mistakes: ["Knees caving inward", "Rising on toes", "Leaning too far forward", "Not going deep enough"],
    breathing: "Inhale going down, exhale standing up",
    animation: "squat",
  },
  "Lunges": {
    muscles: ["Quads", "Glutes", "Hamstrings"],
    difficulty: 1,
    steps: [
      "Stand tall, feet hip-width apart",
      "Step forward with one leg about 2-3 feet",
      "Lower your body until both knees are at 90° angles",
      "Back knee should nearly touch the floor",
      "Front knee should stay over your ankle (not past toes)",
      "Push through front heel to return to standing"
    ],
    tips: ["Take a big enough step — too short stresses the knee", "Keep torso upright", "Alternate legs each rep"],
    mistakes: ["Front knee going past toes", "Leaning forward", "Back knee slamming the ground"],
    breathing: "Inhale stepping forward, exhale pushing back",
    animation: "lunge",
  },
  "Plank": {
    muscles: ["Core", "Shoulders", "Back"],
    difficulty: 1,
    steps: [
      "Start in a forearm position — elbows under shoulders",
      "Extend legs back, balance on toes",
      "Body should form a perfectly straight line",
      "Engage your core — pull belly button toward spine",
      "Hold this position for the prescribed time",
      "Don't hold your breath — keep breathing normally"
    ],
    tips: ["Squeeze your glutes to help maintain position", "Look at the floor just ahead of your hands", "If shaking, that means it's working"],
    mistakes: ["Hips sagging down (most common)", "Butt piking up too high", "Holding breath", "Looking up (strains neck)"],
    breathing: "Breathe normally throughout — never hold breath",
    animation: "hold",
  },
  "Burpees": {
    muscles: ["Full Body", "Cardio"],
    difficulty: 3,
    steps: [
      "Stand with feet shoulder-width apart",
      "Squat down and place hands on the floor in front of you",
      "Jump feet back into a push-up position",
      "Do one push-up (chest touches floor)",
      "Jump feet forward back to squat position",
      "Explode upward into a jump with arms overhead",
      "Land softly and immediately go into the next rep"
    ],
    tips: ["Speed comes with practice — start slow with good form", "Land softly on the jump to protect joints", "Modify: step back instead of jumping back"],
    mistakes: ["Skipping the push-up", "Not jumping at the top", "Landing with stiff legs"],
    breathing: "Exhale on the jump up, inhale on the way down",
    animation: "burpee",
  },
  "Mountain Climbers": {
    muscles: ["Core", "Cardio", "Hip Flexors"],
    difficulty: 2,
    steps: [
      "Start in a high plank position — hands under shoulders",
      "Drive right knee toward your chest quickly",
      "As you extend right leg back, drive left knee in",
      "Continue alternating legs in a running motion",
      "Keep hips level — don't let them bounce up and down",
      "Maintain a fast, controlled pace"
    ],
    tips: ["Keep shoulders directly over hands", "Go as fast as you can while maintaining form", "Core stays tight throughout"],
    mistakes: ["Bouncing hips up and down", "Hands creeping forward", "Not driving knees far enough"],
    breathing: "Quick breaths matching your rhythm",
    animation: "climb",
  },
  "Tricep Dips": {
    muscles: ["Triceps", "Shoulders", "Chest"],
    difficulty: 2,
    steps: [
      "Sit on the edge of a sturdy chair or bench",
      "Place hands next to hips, fingers gripping the edge",
      "Slide hips off the edge, supporting weight on arms",
      "Lower body by bending elbows to 90° (2 sec down)",
      "Keep back close to the chair/bench",
      "Push back up by straightening arms (1 sec up)"
    ],
    tips: ["Keep elbows pointing backward, not outward", "The further your feet are from the bench, the harder it is", "Don't use momentum — control the movement"],
    mistakes: ["Elbows flaring out", "Going too deep (stresses shoulders)", "Using legs to push up"],
    breathing: "Inhale going down, exhale pushing up",
    animation: "down-up",
  },
  "Jump Squats": {
    muscles: ["Quads", "Glutes", "Calves", "Cardio"],
    difficulty: 2,
    steps: [
      "Stand with feet shoulder-width apart",
      "Lower into a squat (thighs parallel to floor)",
      "Explode upward, jumping as high as you can",
      "Swing arms up for momentum",
      "Land softly on the balls of your feet, immediately sinking back into a squat",
      "Repeat without pausing between reps"
    ],
    tips: ["Land as quietly as possible — soft knees", "Use arms to generate power", "Full squat depth before each jump"],
    mistakes: ["Landing with straight legs (injury risk)", "Not squatting deep enough", "Landing flat-footed"],
    breathing: "Exhale on the jump, inhale on landing",
    animation: "jump",
  },
  "Crunches": {
    muscles: ["Abs", "Core"],
    difficulty: 1,
    steps: [
      "Lie on your back, knees bent, feet flat on floor",
      "Place hands behind your head (don't pull on neck)",
      "Engage your core — pull belly button to spine",
      "Lift shoulders off the ground by contracting abs",
      "Rise about 30° — you don't need to sit all the way up",
      "Lower back down with control (2 sec down)"
    ],
    tips: ["Focus on using abs, not momentum", "Keep a fist-sized gap between chin and chest", "Exhale as you crunch up for better contraction"],
    mistakes: ["Pulling on your neck with hands", "Using momentum to swing up", "Coming up too high (hip flexors take over)"],
    breathing: "Exhale crunching up, inhale going down",
    animation: "crunch",
  },

  // ─── BOXING ───
  "Jab": {
    muscles: ["Shoulders", "Triceps", "Core"],
    difficulty: 1,
    steps: [
      "Stand in boxing stance — lead foot forward, hands up protecting face",
      "Extend your lead hand (left for orthodox) straight out",
      "Rotate your fist so palm faces down at full extension",
      "Snap the punch out and immediately bring it back",
      "Keep your other hand up protecting your chin",
      "Stay on the balls of your feet, don't lean forward"
    ],
    tips: ["Speed is more important than power for jabs", "Snap it back as fast as you throw it", "Keep your shoulder up to protect your chin"],
    mistakes: ["Dropping the non-punching hand", "Leaning forward", "Telegraphing by pulling hand back first", "Locking elbow (injury risk)"],
    breathing: "Sharp exhale on each punch",
    animation: "punch",
  },
  "Cross": {
    muscles: ["Shoulders", "Chest", "Core", "Hips"],
    difficulty: 1,
    steps: [
      "From boxing stance, rotate your back hip forward",
      "Extend your rear hand straight toward the target",
      "Rotate your fist palm-down at full extension",
      "Drive power from your back foot through your hip",
      "Your rear heel should lift and pivot as you punch",
      "Return to guard position immediately"
    ],
    tips: ["Power comes from hip rotation, not just the arm", "Keep lead hand up while throwing", "Pivot on your back foot for maximum power"],
    mistakes: ["No hip rotation (arm-only punch = weak)", "Dropping guard hand", "Reaching instead of stepping into range"],
    breathing: "Sharp exhale on the punch",
    animation: "punch",
  },
  "Hook": {
    muscles: ["Shoulders", "Obliques", "Core"],
    difficulty: 2,
    steps: [
      "From boxing stance, bring your lead elbow up to 90°",
      "Rotate your lead foot, hip, and torso together",
      "Swing your arm in a horizontal arc at chin height",
      "Keep fist vertical (thumb on top) or horizontal",
      "The power comes entirely from your hip rotation",
      "Don't extend your arm — keep the 90° bend"
    ],
    tips: ["Think of it as turning your whole body, not swinging your arm", "Aim at chin level", "Short, tight hooks are more effective than wide ones"],
    mistakes: ["Swinging arm wide (telegraphs the punch)", "Not rotating hips", "Dropping opposite hand"],
    breathing: "Sharp exhale with rotation",
    animation: "hook",
  },
  "Uppercut": {
    muscles: ["Shoulders", "Biceps", "Core", "Legs"],
    difficulty: 2,
    steps: [
      "From boxing stance, slightly dip your rear shoulder",
      "Bend your knees slightly to load power",
      "Drive upward from your legs through your hip",
      "Bring your rear fist up in a vertical arc (palm facing you)",
      "Target is the opponent's chin — punch upward",
      "Return to guard immediately"
    ],
    tips: ["Power comes from legs and hips, not arm", "Keep it tight — don't wind up", "Dip and drive in one smooth motion"],
    mistakes: ["Leaning back too far", "Dropping hands before throwing", "Only using arm strength"],
    breathing: "Exhale driving upward",
    animation: "uppercut",
  },
  "Shadow Boxing": {
    muscles: ["Full Body", "Cardio", "Coordination"],
    difficulty: 1,
    steps: [
      "Stand in boxing stance — hands up, chin down",
      "Throw combinations: jab-cross, jab-jab-cross, jab-cross-hook",
      "Move around — forward, backward, lateral steps",
      "Visualize an opponent in front of you",
      "Include defense — slips, rolls, and blocks between combos",
      "Keep moving your feet — never stand still"
    ],
    tips: ["Focus on form, not speed at first", "Practice in front of a mirror to check form", "Start with 2-punch combos, build up to 5+"],
    mistakes: ["Standing flat-footed", "Not moving head", "Forgetting defense between attacks"],
    breathing: "Exhale with each punch",
    animation: "combo",
  },

  // ─── YOGA ───
  "Downward Dog": {
    muscles: ["Hamstrings", "Shoulders", "Calves", "Back"],
    difficulty: 1,
    steps: [
      "Start on hands and knees (tabletop position)",
      "Spread fingers wide, press palms firmly into the floor",
      "Tuck toes and lift knees off the floor",
      "Push hips up and back, forming an inverted V shape",
      "Straighten legs as much as you can (slight bend is OK)",
      "Press heels toward the floor — they don't need to touch",
      "Hold for 30 seconds, breathing deeply"
    ],
    tips: ["Focus on lengthening your spine, not straightening legs", "Rotate upper arms outward to open shoulders", "Bend knees if hamstrings are tight"],
    mistakes: ["Rounding the back", "Hands too close to feet", "Holding breath"],
    breathing: "Deep steady breaths — 4 count in, 4 count out",
    animation: "hold",
  },
  "Warrior I": {
    muscles: ["Quads", "Hip Flexors", "Shoulders"],
    difficulty: 1,
    steps: [
      "Step right foot forward about 3-4 feet",
      "Turn left foot out 45 degrees",
      "Bend right knee to 90° (knee over ankle)",
      "Square hips forward as much as possible",
      "Raise arms overhead, palms facing each other",
      "Look up between your hands",
      "Hold for 30 seconds, then switch sides"
    ],
    tips: ["Press through the outer edge of your back foot", "Keep your hips squared forward", "Shoulders down away from ears"],
    mistakes: ["Back foot lifting off the ground", "Knee going past ankle", "Leaning forward instead of staying upright"],
    breathing: "Deep steady breaths throughout the hold",
    animation: "hold",
  },

  // ─── HIIT ───
  "High Knees": {
    muscles: ["Cardio", "Hip Flexors", "Core"],
    difficulty: 1,
    steps: [
      "Stand tall with feet hip-width apart",
      "Drive right knee up to hip height",
      "As right leg comes down, immediately drive left knee up",
      "Pump arms like you're sprinting",
      "Stay on the balls of your feet",
      "Move as quickly as possible while maintaining form"
    ],
    tips: ["Aim to get knees to hip height every rep", "Pump arms to increase speed", "Keep chest upright — don't lean back"],
    mistakes: ["Leaning backward", "Knees not coming high enough", "Landing on heels"],
    breathing: "Quick rhythmic breaths matching your pace",
    animation: "run",
  },
  "Jumping Jacks": {
    muscles: ["Cardio", "Full Body"],
    difficulty: 1,
    steps: [
      "Stand with feet together, arms at sides",
      "Jump feet out wide while raising arms overhead",
      "Hands should clap or nearly touch above your head",
      "Jump feet back together while lowering arms",
      "Land softly on the balls of your feet",
      "Repeat at a steady, rhythmic pace"
    ],
    tips: ["Land softly to protect joints", "Full range — arms all the way up", "Keep a steady rhythm"],
    mistakes: ["Not fully extending arms", "Landing with stiff legs", "Going too slow to get cardio benefit"],
    breathing: "Breathe naturally with the rhythm",
    animation: "jump",
  },
};

// ══════════════════════════════════════════
// MASTERY PROGRESSION — 10 levels per activity
// ══════════════════════════════════════════

export const MASTERY_LEVELS = {
  boxing: {
    name: "Boxing",
    icon: "🥊",
    levels: [
      { level: 1, name: "White Belt", focus: "Stance & Guard", skills: ["Boxing stance", "Guard position", "Footwork basics", "Jab technique"], sessionsNeeded: 3, desc: "Learn how to stand, protect yourself, and throw your first punch" },
      { level: 2, name: "Yellow Belt", focus: "Basic Punches", skills: ["Jab-Cross combo", "Proper fist formation", "Hip rotation", "Return to guard"], sessionsNeeded: 5, desc: "Master the 1-2 combination — the foundation of boxing" },
      { level: 3, name: "Orange Belt", focus: "The Hook", skills: ["Lead hook", "Rear hook", "Hook to body", "1-2-Hook combo"], sessionsNeeded: 5, desc: "Add the hook to your arsenal — the knockout punch" },
      { level: 4, name: "Green Belt", focus: "Uppercuts & Combos", skills: ["Lead uppercut", "Rear uppercut", "1-2-3-2 combo", "Body-head combinations"], sessionsNeeded: 6, desc: "Complete your punch vocabulary and start combining" },
      { level: 5, name: "Blue Belt", focus: "Defense Basics", skills: ["Slip (inside/outside)", "Roll under", "Parry", "Block"], sessionsNeeded: 6, desc: "You can't just attack — learn to avoid punches" },
      { level: 6, name: "Purple Belt", focus: "Movement", skills: ["Lateral movement", "Pivot", "Cut angles", "In-and-out footwork"], sessionsNeeded: 7, desc: "Control the ring with your footwork" },
      { level: 7, name: "Brown Belt", focus: "Counter Punching", skills: ["Slip-counter", "Catch-and-counter", "Pull counter", "Timing drills"], sessionsNeeded: 8, desc: "Make your opponent pay for every punch they throw" },
      { level: 8, name: "Red Belt", focus: "Advanced Combos", skills: ["5+ punch combinations", "Level changes", "Feints", "Pressure fighting"], sessionsNeeded: 8, desc: "Chain punches like a pro — mix levels, speeds, and angles" },
      { level: 9, name: "Black Belt", focus: "Ring Generalship", skills: ["Ring control", "Fight strategy", "Pace management", "Reading opponents"], sessionsNeeded: 10, desc: "Think like a fighter — control the tempo and space" },
      { level: 10, name: "Master", focus: "Complete Fighter", skills: ["All techniques fluid", "Situational sparring", "Conditioning integration", "Personal style"], sessionsNeeded: 12, desc: "You've mastered the sweet science. Keep training." },
    ],
  },
  kickboxing: {
    name: "Kickboxing",
    icon: "🦵",
    levels: [
      { level: 1, name: "Novice", focus: "Stance & Basics", skills: ["Kickboxing stance", "Basic guard", "Jab", "Front kick"], sessionsNeeded: 3, desc: "Learn to stand and throw your first punches and kicks" },
      { level: 2, name: "Beginner", focus: "Core Strikes", skills: ["Cross", "Roundhouse kick", "Push kick", "Jab-Cross-Kick combo"], sessionsNeeded: 5, desc: "Master the fundamental strikes" },
      { level: 3, name: "Intermediate", focus: "Combinations", skills: ["Hook", "Low kick", "3-punch combos", "Kick-punch transitions"], sessionsNeeded: 6, desc: "Start combining hands and feet seamlessly" },
      { level: 4, name: "Skilled", focus: "Knee & Elbow", skills: ["Knee strikes", "Clinch basics", "Elbow strikes", "Close-range fighting"], sessionsNeeded: 6, desc: "Add close-range weapons to your toolkit" },
      { level: 5, name: "Advanced", focus: "Defense & Movement", skills: ["Check kicks", "Catch kicks", "Lateral movement", "Counter-attacks"], sessionsNeeded: 7, desc: "Defend against kicks and counter effectively" },
      { level: 6, name: "Expert", focus: "Advanced Kicks", skills: ["Spinning back kick", "Switch kicks", "Head kicks", "Kick combos"], sessionsNeeded: 8, desc: "High-level kicking techniques" },
      { level: 7, name: "Elite", focus: "Fight IQ", skills: ["Range management", "Timing", "Feints", "Pressure vs counter"], sessionsNeeded: 9, desc: "Think strategically in exchanges" },
      { level: 8, name: "Master", focus: "Complete Striker", skills: ["All techniques fluid", "Conditioning", "Sparring strategy", "Personal style"], sessionsNeeded: 10, desc: "You're a complete kickboxer" },
    ],
  },
  gym: {
    name: "Gym Training",
    icon: "🏋️",
    levels: [
      { level: 1, name: "Newcomer", focus: "Machine Basics", skills: ["Machine chest press", "Lat pulldown", "Leg press", "Shoulder press machine"], sessionsNeeded: 4, desc: "Learn gym machines — safe and effective starting point" },
      { level: 2, name: "Beginner", focus: "Free Weight Intro", skills: ["Dumbbell press", "Dumbbell rows", "Goblet squats", "Dumbbell curls"], sessionsNeeded: 5, desc: "Graduate to free weights with basic movements" },
      { level: 3, name: "Developing", focus: "Compound Lifts", skills: ["Barbell bench press", "Barbell squat", "Deadlift basics", "Overhead press"], sessionsNeeded: 6, desc: "The big 4 compound lifts — most important exercises" },
      { level: 4, name: "Intermediate", focus: "Push/Pull/Legs", skills: ["PPL split understanding", "Progressive overload", "Isolation exercises", "Mind-muscle connection"], sessionsNeeded: 7, desc: "Train like a real gym-goer with structured splits" },
      { level: 5, name: "Strong", focus: "Strength Focus", skills: ["5×5 programming", "Heavy compounds", "Proper warm-up sets", "Rest periods"], sessionsNeeded: 8, desc: "Build real strength with proven methods" },
      { level: 6, name: "Advanced", focus: "Hypertrophy", skills: ["Volume training", "Drop sets", "Supersets", "Time under tension"], sessionsNeeded: 9, desc: "Train for maximum muscle growth" },
      { level: 7, name: "Elite", focus: "Periodization", skills: ["Strength phases", "Hypertrophy phases", "Deload weeks", "Peak performance"], sessionsNeeded: 10, desc: "Program like a pro — cycle your training intelligently" },
      { level: 8, name: "Master", focus: "Complete Athlete", skills: ["Custom programming", "Weak point training", "Advanced techniques", "Coaching others"], sessionsNeeded: 12, desc: "You've mastered the iron game" },
    ],
  },
  bodyweight: {
    name: "Bodyweight",
    icon: "💪",
    levels: [
      { level: 1, name: "Foundation", focus: "Basic Movements", skills: ["Push-ups (knee OK)", "Bodyweight squats", "Plank (30s)", "Lunges"], sessionsNeeded: 4, desc: "Build the foundation with basic movement patterns" },
      { level: 2, name: "Builder", focus: "Strength Base", skills: ["Full push-ups ×15", "Squats ×25", "Plank 60s", "Dips (bench)"], sessionsNeeded: 5, desc: "Build real strength with your own body" },
      { level: 3, name: "Progressing", focus: "Variations", skills: ["Diamond push-ups", "Jump squats", "Side plank", "Bulgarian split squat"], sessionsNeeded: 6, desc: "Progress to harder variations" },
      { level: 4, name: "Strong", focus: "Advanced Basics", skills: ["Decline push-ups", "Pistol squat progression", "L-sit progression", "Muscle-up progression"], sessionsNeeded: 7, desc: "Work toward advanced calisthenics movements" },
      { level: 5, name: "Advanced", focus: "Skills", skills: ["Handstand hold", "Pistol squats", "Archer push-ups", "Dragon flags"], sessionsNeeded: 8, desc: "Bodyweight skills that impress" },
      { level: 6, name: "Elite", focus: "Mastery", skills: ["Muscle-ups", "Planche progression", "Front lever", "Human flag progression"], sessionsNeeded: 10, desc: "Elite calisthenics movements" },
    ],
  },
  mma: {
    name: "MMA",
    icon: "🤼",
    levels: [
      { level: 1, name: "White Belt", focus: "Stance & Basics", skills: ["MMA stance", "Basic strikes", "Sprawl", "Guard position"], sessionsNeeded: 4, desc: "Learn the unique MMA stance and basic attacks" },
      { level: 2, name: "Beginner", focus: "Striking Fundamentals", skills: ["Jab-Cross", "Leg kicks", "Teep/push kick", "Basic combos"], sessionsNeeded: 5, desc: "Master fundamental striking for MMA" },
      { level: 3, name: "Intermediate", focus: "Takedown Defense", skills: ["Sprawl technique", "Underhooks", "Cage work basics", "Getting back up"], sessionsNeeded: 6, desc: "Stay on your feet when someone tries to take you down" },
      { level: 4, name: "Skilled", focus: "Ground Basics", skills: ["Guard basics", "Mount escapes", "Basic submissions", "Ground and pound"], sessionsNeeded: 7, desc: "Learn to fight on the ground" },
      { level: 5, name: "Advanced", focus: "Transitions", skills: ["Striking to takedown", "Ground to standing", "Clinch work", "Cage control"], sessionsNeeded: 8, desc: "Flow between different phases of MMA" },
      { level: 6, name: "Expert", focus: "Fight Strategy", skills: ["Game planning", "Distance management", "Energy management", "Fight IQ"], sessionsNeeded: 10, desc: "Think like a mixed martial artist" },
    ],
  },
  yoga: {
    name: "Yoga",
    icon: "🧘",
    levels: [
      { level: 1, name: "Beginner", focus: "Foundation Poses", skills: ["Mountain pose", "Downward dog", "Child's pose", "Warrior I"], sessionsNeeded: 4, desc: "Learn the essential yoga poses" },
      { level: 2, name: "Developing", focus: "Sun Salutation", skills: ["Sun Salutation A", "Warrior II", "Triangle pose", "Tree pose"], sessionsNeeded: 5, desc: "Flow through the foundational sequence" },
      { level: 3, name: "Intermediate", focus: "Balance & Flexibility", skills: ["Half moon", "Eagle pose", "Pigeon pose", "Bridge pose"], sessionsNeeded: 6, desc: "Deepen your practice with balance challenges" },
      { level: 4, name: "Advanced", focus: "Inversions & Binds", skills: ["Headstand prep", "Crow pose", "Wheel pose", "Bound poses"], sessionsNeeded: 8, desc: "Advanced poses requiring strength and flexibility" },
      { level: 5, name: "Master", focus: "Complete Practice", skills: ["Full inversions", "Arm balances", "Deep backbends", "Meditation integration"], sessionsNeeded: 10, desc: "A complete yoga practice — body, breath, mind" },
    ],
  },
};

// Get guide for an exercise (fuzzy match)
export function getGuide(exerciseName) {
  const name = exerciseName.trim();
  if (EXERCISE_GUIDES[name]) return EXERCISE_GUIDES[name];
  // Fuzzy match
  const key = Object.keys(EXERCISE_GUIDES).find(k => 
    k.toLowerCase().includes(name.toLowerCase()) || 
    name.toLowerCase().includes(k.toLowerCase())
  );
  return key ? EXERCISE_GUIDES[key] : null;
}

// Default guide for unknown exercises
export const DEFAULT_GUIDE = {
  muscles: ["Target Muscle"],
  difficulty: 1,
  steps: [
    "Get into the starting position as shown",
    "Perform the movement with controlled tempo",
    "Focus on the target muscle throughout",
    "Return to starting position with control",
    "Complete all prescribed reps with good form"
  ],
  tips: ["Start with lighter weight/easier variation", "Focus on form over speed", "Breathe naturally throughout"],
  mistakes: ["Using momentum instead of muscle", "Going too heavy too soon", "Rushing through reps"],
  breathing: "Exhale on effort, inhale on return",
  animation: "generic",
};
