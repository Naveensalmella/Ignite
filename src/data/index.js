// IGNITE — Data & Constants

export const FOOD_DB = [
  { id: 1, name: "Apple", emoji: "🍎", cal: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, category: "Fruits" },
  { id: 2, name: "Banana", emoji: "🍌", cal: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, category: "Fruits" },
  { id: 3, name: "Orange", emoji: "🍊", cal: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1, category: "Fruits" },
  { id: 5, name: "Mango", emoji: "🥭", cal: 99, protein: 1.4, carbs: 25, fat: 0.6, fiber: 2.6, category: "Fruits" },
  { id: 26, name: "Avocado", emoji: "🥑", cal: 234, protein: 2.9, carbs: 12, fat: 21, fiber: 10, category: "Fruits" },
  { id: 7, name: "Chicken Breast", emoji: "🍗", cal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, category: "Protein" },
  { id: 8, name: "Egg", emoji: "🥚", cal: 78, protein: 6, carbs: 0.6, fat: 5, fiber: 0, category: "Protein" },
  { id: 9, name: "Salmon", emoji: "🐟", cal: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, category: "Protein" },
  { id: 10, name: "Paneer", emoji: "🧀", cal: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0, category: "Protein" },
  { id: 25, name: "Dal (1 cup)", emoji: "🍲", cal: 198, protein: 14, carbs: 34, fat: 0.8, fiber: 8, category: "Protein" },
  { id: 12, name: "Rice (1 cup)", emoji: "🍚", cal: 206, protein: 4.3, carbs: 45, fat: 0.4, fiber: 0.6, category: "Grains" },
  { id: 14, name: "Oats (1 cup)", emoji: "🥣", cal: 154, protein: 5, carbs: 27, fat: 2.6, fiber: 4, category: "Grains" },
  { id: 15, name: "Roti (1 pc)", emoji: "🫓", cal: 104, protein: 3, carbs: 18, fat: 3.7, fiber: 2, category: "Grains" },
  { id: 17, name: "Broccoli", emoji: "🥦", cal: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 5.1, category: "Vegetables" },
  { id: 18, name: "Spinach", emoji: "🥬", cal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, category: "Vegetables" },
  { id: 20, name: "Sweet Potato", emoji: "🍠", cal: 103, protein: 2.3, carbs: 24, fat: 0.1, fiber: 3.8, category: "Vegetables" },
  { id: 21, name: "Milk (1 cup)", emoji: "🥛", cal: 149, protein: 8, carbs: 12, fat: 8, fiber: 0, category: "Dairy" },
  { id: 22, name: "Yogurt (1 cup)", emoji: "🫙", cal: 100, protein: 17, carbs: 6, fat: 0.7, fiber: 0, category: "Dairy" },
  { id: 23, name: "Almonds (28g)", emoji: "🥜", cal: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5, category: "Nuts" },
  { id: 24, name: "Peanut Butter", emoji: "🥜", cal: 190, protein: 7, carbs: 7, fat: 16, fiber: 2, category: "Nuts" },
];

export const DEFAULT_HABITS = [
  { id: "h1", name: "Complete Daily Training", icon: "⚔️", pillar: "power", required: true },
  { id: "h2", name: "Log all meals", icon: "🍎", pillar: "power" },
  { id: "h3", name: "Drink 3L water", icon: "💧", pillar: "power" },
  { id: "h4", name: "Read 20 pages", icon: "📖", pillar: "mind" },
  { id: "h5", name: "Journal / Reflect", icon: "📝", pillar: "heart" },
  { id: "h6", name: "Meditate 10 min", icon: "🧘", pillar: "spirit" },
  { id: "h7", name: "Track expenses", icon: "💰", pillar: "fortune" },
];
export const REQUIRED_DAILY = 1;
export const pillars = [
  { key: "power", label: "Power", icon: "🔥", color: "#ef4444", gradient: "linear-gradient(135deg,#ef4444,#dc2626)", desc: "Strength, combat & endurance" },
  { key: "mind", label: "Mind", icon: "⚡", color: "#38bdf8", gradient: "linear-gradient(135deg,#38bdf8,#0284c7)", desc: "Strategy, focus & knowledge" },
  { key: "heart", label: "Heart", icon: "💛", color: "#f59e0b", gradient: "linear-gradient(135deg,#f59e0b,#d97706)", desc: "Mood, bonds & willpower" },
  { key: "spirit", label: "Spirit", icon: "🌟", color: "#7dd3fc", gradient: "linear-gradient(135deg,#7dd3fc,#38bdf8)", desc: "Discipline, recovery & clarity" },
  { key: "fortune", label: "Fortune", icon: "💎", color: "#fbbf24", gradient: "linear-gradient(135deg,#fbbf24,#f59e0b)", desc: "Wealth & resource management" },
];

// Hunter ranks (Solo Leveling). Reaching a rank's level unlocks its Rank Assessment;
// the rank itself is only granted once the assessment is passed (see lib/system).
export const RANKS = [
  { id: "E", name: "E-Rank", min: 1, max: 9, color: "#9ca3af", emoji: "E", tier: 1, title: "The Weakest Hunter" },
  { id: "D", name: "D-Rank", min: 10, max: 19, color: "#4ade80", emoji: "D", tier: 2, title: "Awakened Hunter" },
  { id: "C", name: "C-Rank", min: 20, max: 34, color: "#38bdf8", emoji: "C", tier: 3, title: "Rising Hunter" },
  { id: "B", name: "B-Rank", min: 35, max: 49, color: "#a78bfa", emoji: "B", tier: 4, title: "Elite Hunter" },
  { id: "A", name: "A-Rank", min: 50, max: 69, color: "#f87171", emoji: "A", tier: 5, title: "Guild Ace" },
  { id: "S", name: "S-Rank", min: 70, max: 99, color: "#fbbf24", emoji: "S", tier: 6, title: "Strongest Hunter" },
  { id: "N", name: "National Level", min: 100, max: 999999, color: "#e0f2fe", emoji: "N", tier: 7, title: "Pillar of the Nation" },
];

// ── GATES WITH DETAILED INSTRUCTIONS (Combat Skills — renamed from Fighting) ──
export const GATES = [
  {
    gate: 1, name: "Foundation", unlock: 1, color: "#94a3b8",
    exercises: [
      { name: "Standard Push-ups", reps: "4×15", cal: 8, muscle: "Chest, Triceps, Shoulders", anim: "push", steps: ["Start in plank position, hands shoulder-width apart", "Keep your body in a straight line from head to heels", "Lower chest to the ground by bending elbows", "Push back up explosively, fully extending arms", "Breathe in on the way down, out on the way up"], tips: ["Don't let hips sag or pike up", "Keep core tight throughout", "Elbows at 45° angle, not flared out"] },
      { name: "Bodyweight Squats", reps: "4×20", cal: 10, muscle: "Quads, Glutes, Hamstrings", anim: "squat", steps: ["Stand with feet shoulder-width apart, toes slightly out", "Push hips back and bend knees as if sitting in a chair", "Lower until thighs are parallel to the ground", "Drive through heels to stand back up", "Keep chest up and back straight throughout"], tips: ["Knees should track over toes", "Weight in heels, not toes", "Go as deep as mobility allows"] },
      { name: "Plank Hold", reps: "3×45s", cal: 5, muscle: "Core, Shoulders, Back", anim: "plank", steps: ["Start in forearm plank position, elbows under shoulders", "Create a straight line from head to heels", "Squeeze glutes and brace core", "Hold the position, breathing steadily"], tips: ["Look at a spot between your hands", "If shaking, you're doing it right"] },
      { name: "Burpees", reps: "3×10", cal: 12, muscle: "Full Body, Cardio", anim: "burpee", steps: ["Stand tall, then drop into a squat, hands on floor", "Jump feet back into plank position", "Perform a push-up", "Jump feet forward to hands", "Explode upward into a jump, arms overhead"], tips: ["Move fluidly", "Land softly on the jump"] },
      { name: "Lunges", reps: "3×12 each", cal: 8, muscle: "Quads, Glutes, Balance", anim: "squat", steps: ["Stand tall, take a big step forward", "Lower back knee toward the ground", "Front knee stays over ankle", "Push through front heel to return", "Alternate legs"], tips: ["Keep torso upright", "Control the descent"] },
      { name: "Mountain Climbers", reps: "3×30s", cal: 10, muscle: "Core, Shoulders, Hip Flexors", anim: "burpee", steps: ["Start in push-up position", "Drive right knee toward chest rapidly", "Alternate legs at a fast pace", "Keep hips low and level"], tips: ["The faster, the more cardio benefit", "Keep arms locked"] },
    ],
    combat: [
      { name: "Jab", reps: "3×30 each hand", cal: 8, anim: "punch", steps: ["Stand in fighting stance — lead foot forward, hands up", "Extend lead hand straight forward, rotating fist palm-down", "Snap the punch back to guard immediately", "Keep rear hand protecting chin"], tips: ["Speed over power", "Keep chin tucked behind shoulder"] },
      { name: "Cross (Rear Straight)", reps: "3×30 each hand", cal: 8, anim: "punch", steps: ["From fighting stance, rotate hips and rear foot", "Drive rear hand straight forward", "Full hip rotation generates power", "Pull hand back to guard immediately"], tips: ["Power comes from hips, not arm", "Don't drop lead hand"] },
      { name: "Front Kick (Teep)", reps: "3×15 each leg", cal: 10, anim: "kick", steps: ["Lift lead knee to waist height", "Extend leg forward, pushing with ball of foot", "Retract quickly", "Return to stance"], tips: ["Chamber knee high before extending", "Push through the target"] },
    ]
  },
];

// ── PILLAR GROWTH MISSIONS ──
export const PILLAR_MISSIONS = {
  mind: {
    label: "Mind", icon: "⚡", color: "#06b6d4", tiers: [
      { tier: 1, name: "Awakening", missions: [
        { id: "m1_1", name: "Read 10 Pages Daily for 7 Days", icon: "📖", desc: "Build the reading habit.", how: ["Choose a book that interests you", "Set a fixed reading time", "Track each day in your journal"] },
        { id: "m1_2", name: "Learn 5 New Words Daily for 5 Days", icon: "📝", desc: "Expand vocabulary.", how: ["Use a dictionary app", "Write meaning and create a sentence", "Review yesterday's words"] },
        { id: "m1_3", name: "Solve a Logic Puzzle", icon: "🧩", desc: "Challenge your brain.", how: ["Pick a puzzle type you've never tried", "Spend 15 min without answers"] },
        { id: "m1_4", name: "Write a 500-Word Reflection", icon: "✍️", desc: "Write about something you learned.", how: ["Pick one thing from this week", "Write intro, body, conclusion"] },
      ]},
      { tier: 2, name: "Scholar's Path", missions: [
        { id: "m2_1", name: "Finish an Entire Book", icon: "📚", desc: "Read a complete book.", how: ["Set 20-30 pages/day", "Take notes on key ideas"] },
        { id: "m2_2", name: "Start Learning a New Skill", icon: "🎯", desc: "Begin something new.", how: ["Choose what excites you", "Practice 20 min daily"] },
        { id: "m2_3", name: "Teach Someone Something", icon: "🎓", desc: "Explain a concept to someone.", how: ["Choose a topic you know deeply", "Explain without jargon"] },
        { id: "m2_4", name: "7-Day Social Media Detox", icon: "📵", desc: "No social media for 7 days.", how: ["Delete apps (not accounts)", "Replace scroll time with reading"] },
      ]},
    ]
  },
  heart: {
    label: "Heart", icon: "💛", color: "#f59e0b", tiers: [
      { tier: 1, name: "Open Heart", missions: [
        { id: "h1_1", name: "Journal for 7 Days Straight", icon: "📝", desc: "Write daily for a week.", how: ["5+ sentences each day", "Be honest"] },
        { id: "h1_2", name: "Reach Out to Someone You Miss", icon: "📞", desc: "Call or visit someone.", how: ["Have a real conversation", "Listen more than talk"] },
        { id: "h1_3", name: "Express Gratitude to 3 People", icon: "🙏", desc: "Tell people why you appreciate them.", how: ["Be specific about what they did"] },
      ]},
    ]
  },
  spirit: {
    label: "Spirit", icon: "🌟", color: "#8b5cf6", tiers: [
      { tier: 1, name: "First Breath", missions: [
        { id: "s1_1", name: "Meditate 5 Min Daily for 7 Days", icon: "🧘", desc: "Sit still, focus on breath.", how: ["Focus on sensation of breathing", "When thoughts arise, return to breath"] },
        { id: "s1_2", name: "Practice Box Breathing (5 Sessions)", icon: "🌬️", desc: "Inhale 4s, hold 4s, exhale 4s, hold 4s.", how: ["Sit upright, relax shoulders", "Repeat 5 minutes per session"] },
        { id: "s1_3", name: "30 Minutes in Nature Without Phone", icon: "🌿", desc: "Go outside fully present.", how: ["Leave phone behind", "Walk slowly, notice details"] },
      ]},
    ]
  },
  fortune: {
    label: "Fortune", icon: "💎", color: "#eab308", tiers: [
      { tier: 1, name: "First Coin", missions: [
        { id: "f1_1", name: "Track Every Expense for 7 Days", icon: "📊", desc: "Write down every rupee spent.", how: ["Record EVERYTHING", "Categorize spending"] },
        { id: "f1_2", name: "Create a Monthly Budget", icon: "📋", desc: "Plan income allocation.", how: ["List all income", "Set a savings target"] },
        { id: "f1_3", name: "Save ₹1000 This Month", icon: "💰", desc: "Set aside ₹1000 you don't touch.", how: ["Transfer on day 1", "Cut one unnecessary expense"] },
      ]},
    ]
  },
};

export const XP = { workout: 60, combat: 40, habit: 12, food: 3, journal: 10, mood: 5, focus: 15, finance: 3, gratitude: 8, task_epic: 20, task_rare: 12, task_common: 8 };
export const DAILY_PENALTY = 50;
export const STREAK_MULT = { 7: 1.5, 14: 2, 30: 2.5, 60: 3 };
// Cap on streak × System bonuses × XP Potion combined.
export const MAX_XP_MULT = 2.5;
