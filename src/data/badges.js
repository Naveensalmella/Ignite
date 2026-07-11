// ═══════════════════════════════════════
// IGNITE — Achievement Badge System
// Auto-checks and awards badges based on user data
// ═══════════════════════════════════════

export const BADGES = [
  // ── TRAINING ──
  { id: "first_blood", name: "First Blood", icon: "🩸", desc: "Complete your first workout", category: "Training", rarity: "common" },
  { id: "warrior_10", name: "Warrior", icon: "⚔️", desc: "Complete 10 workouts", category: "Training", rarity: "common" },
  { id: "gladiator_50", name: "Gladiator", icon: "🗡️", desc: "Complete 50 workouts", category: "Training", rarity: "rare" },
  { id: "titan_100", name: "Titan", icon: "🏛️", desc: "Complete 100 workouts", category: "Training", rarity: "epic" },
  { id: "legend_500", name: "Living Legend", icon: "👑", desc: "Complete 500 workouts", category: "Training", rarity: "legendary" },
  { id: "cal_1k", name: "Furnace", icon: "🔥", desc: "Burn 1,000 calories total", category: "Training", rarity: "common" },
  { id: "cal_10k", name: "Inferno", icon: "🌋", desc: "Burn 10,000 calories total", category: "Training", rarity: "rare" },
  { id: "cal_50k", name: "Supernova", icon: "💥", desc: "Burn 50,000 calories total", category: "Training", rarity: "epic" },

  // ── STREAKS ──
  { id: "streak_7", name: "Iron Will", icon: "🔗", desc: "7-day training streak", category: "Streak", rarity: "common" },
  { id: "streak_14", name: "Unshakeable", icon: "⛓️", desc: "14-day training streak", category: "Streak", rarity: "rare" },
  { id: "streak_30", name: "Relentless", icon: "🔥", desc: "30-day training streak", category: "Streak", rarity: "rare" },
  { id: "streak_60", name: "Unstoppable", icon: "⚡", desc: "60-day training streak", category: "Streak", rarity: "epic" },
  { id: "streak_100", name: "Immortal", icon: "♾️", desc: "100-day training streak", category: "Streak", rarity: "legendary" },
  { id: "streak_365", name: "Transcendent", icon: "🌟", desc: "365-day training streak", category: "Streak", rarity: "legendary" },

  // ── LEVELS & RANKS ──
  { id: "lv_10", name: "Awakened", icon: "💫", desc: "Reach Level 10", category: "Level", rarity: "common" },
  { id: "lv_25", name: "Rising Power", icon: "⬆️", desc: "Reach Level 25", category: "Level", rarity: "common" },
  { id: "lv_50", name: "Half Century", icon: "🎯", desc: "Reach Level 50", category: "Level", rarity: "rare" },
  { id: "lv_100", name: "Centurion", icon: "🏆", desc: "Reach Level 100", category: "Level", rarity: "epic" },
  { id: "lv_200", name: "Beyond Mortal", icon: "✨", desc: "Reach Level 200", category: "Level", rarity: "legendary" },
  { id: "rank_shadow", name: "Shadow Walker", icon: "🌑", desc: "Reach Shadow rank", category: "Level", rarity: "common" },
  { id: "rank_phantom", name: "Ghost", icon: "👻", desc: "Reach Phantom rank", category: "Level", rarity: "rare" },
  { id: "rank_dragon", name: "Dragon Born", icon: "🐉", desc: "Reach Dragon rank", category: "Level", rarity: "epic" },
  { id: "rank_sovereign", name: "The Sovereign", icon: "👑", desc: "Reach Sovereign rank", category: "Level", rarity: "legendary" },

  // ── NUTRITION ──
  { id: "fuel_7", name: "Fuel Master", icon: "🍎", desc: "Log food for 7 days", category: "Nutrition", rarity: "common" },
  { id: "fuel_30", name: "Diet Warrior", icon: "🥗", desc: "Log food for 30 days", category: "Nutrition", rarity: "rare" },
  { id: "hydrated", name: "Hydrated", icon: "💧", desc: "Drink 8 glasses in a day", category: "Nutrition", rarity: "common" },

  // ── WELLNESS ──
  { id: "journal_10", name: "Inner Voice", icon: "📝", desc: "Write 10 journal entries", category: "Wellness", rarity: "common" },
  { id: "journal_50", name: "Philosopher", icon: "📜", desc: "Write 50 journal entries", category: "Wellness", rarity: "rare" },
  { id: "grateful_7", name: "Grateful Heart", icon: "🙏", desc: "7-day gratitude streak", category: "Wellness", rarity: "common" },

  // ── FOCUS ──
  { id: "focus_10", name: "Focused", icon: "🎯", desc: "Complete 10 focus sessions", category: "Focus", rarity: "common" },
  { id: "focus_50", name: "Deep Work", icon: "🧠", desc: "Complete 50 focus sessions", category: "Focus", rarity: "rare" },
  { id: "focus_10h", name: "10 Hours", icon: "⏱️", desc: "10 total hours of focus", category: "Focus", rarity: "rare" },

  // ── GROWTH ──
  { id: "mind_t1", name: "Mind Awakened", icon: "⚡", desc: "Complete Mind Tier 1", category: "Growth", rarity: "common" },
  { id: "heart_t1", name: "Open Heart", icon: "💛", desc: "Complete Heart Tier 1", category: "Growth", rarity: "common" },
  { id: "spirit_t1", name: "First Breath", icon: "🌟", desc: "Complete Spirit Tier 1", category: "Growth", rarity: "common" },
  { id: "fortune_t1", name: "First Coin", icon: "💎", desc: "Complete Fortune Tier 1", category: "Growth", rarity: "common" },
  { id: "all_pillars", name: "Balanced Warrior", icon: "⚖️", desc: "Complete Tier 1 in all pillars", category: "Growth", rarity: "epic" },

  // ── SPECIAL ──
  { id: "first_day", name: "Day One", icon: "🌅", desc: "Begin your journey", category: "Special", rarity: "common" },
  { id: "xp_10k", name: "10K Club", icon: "💎", desc: "Earn 10,000 total XP", category: "Special", rarity: "rare" },
  { id: "xp_100k", name: "100K Elite", icon: "💠", desc: "Earn 100,000 total XP", category: "Special", rarity: "epic" },
];

const RARITY_COLORS = {
  common: "#94a3b8",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
};

export function getRarityColor(rarity) {
  return RARITY_COLORS[rarity] || "#94a3b8";
}

// Check which badges the user has earned
export function checkBadges({ totalXP, level, streak, workoutLog, foodLog, journal, focusLog, pillarProg }) {
  const earned = [];
  const totalWorkouts = Object.keys(workoutLog || {}).length;
  const totalCal = Object.values(workoutLog || {}).reduce((s, w) => s + (w.calBurned || 0), 0);

  // Training
  if (totalWorkouts >= 1) earned.push("first_blood");
  if (totalWorkouts >= 10) earned.push("warrior_10");
  if (totalWorkouts >= 50) earned.push("gladiator_50");
  if (totalWorkouts >= 100) earned.push("titan_100");
  if (totalWorkouts >= 500) earned.push("legend_500");
  if (totalCal >= 1000) earned.push("cal_1k");
  if (totalCal >= 10000) earned.push("cal_10k");
  if (totalCal >= 50000) earned.push("cal_50k");

  // Streaks
  if (streak >= 7) earned.push("streak_7");
  if (streak >= 14) earned.push("streak_14");
  if (streak >= 30) earned.push("streak_30");
  if (streak >= 60) earned.push("streak_60");
  if (streak >= 100) earned.push("streak_100");
  if (streak >= 365) earned.push("streak_365");

  // Levels
  if (level >= 10) earned.push("lv_10");
  if (level >= 25) earned.push("lv_25");
  if (level >= 50) earned.push("lv_50");
  if (level >= 100) earned.push("lv_100");
  if (level >= 200) earned.push("lv_200");
  if (level >= 19) earned.push("rank_shadow");
  if (level >= 55) earned.push("rank_phantom");
  if (level >= 71) earned.push("rank_dragon");
  if (level >= 109) earned.push("rank_sovereign");

  // Nutrition
  const foodDays = Object.keys(foodLog || {}).filter(k => !k.startsWith("water_") && Array.isArray(foodLog[k]) && foodLog[k].length > 0).length;
  if (foodDays >= 7) earned.push("fuel_7");
  if (foodDays >= 30) earned.push("fuel_30");
  // Check if any day has 8+ water
  const anyFullWater = Object.keys(foodLog || {}).some(k => k.startsWith("water_") && foodLog[k] >= 8);
  if (anyFullWater) earned.push("hydrated");

  // Wellness
  const journalEntries = Object.values(journal || {}).filter(e => e.entry && e.entry.length > 10).length;
  if (journalEntries >= 10) earned.push("journal_10");
  if (journalEntries >= 50) earned.push("journal_50");
  // Gratitude streak check
  const gratDays = Object.values(journal || {}).filter(e => e.gratitude && e.gratitude.filter(g => g && g.trim()).length >= 3).length;
  if (gratDays >= 7) earned.push("grateful_7");

  // Focus
  const allFocusSessions = Object.values(focusLog || {}).flat();
  const totalFocusSessions = allFocusSessions.length;
  const totalFocusMinutes = allFocusSessions.reduce((s, sess) => s + (sess.duration || 0), 0);
  if (totalFocusSessions >= 10) earned.push("focus_10");
  if (totalFocusSessions >= 50) earned.push("focus_50");
  if (totalFocusMinutes >= 600) earned.push("focus_10h");

  // Growth
  const pp = pillarProg || {};
  const mindT1 = ["m1_1", "m1_2", "m1_3", "m1_4"].every(id => pp[id]);
  const heartT1 = ["h1_1", "h1_2", "h1_3", "h1_4"].every(id => pp[id]);
  const spiritT1 = ["s1_1", "s1_2", "s1_3", "s1_4"].every(id => pp[id]);
  const fortuneT1 = ["f1_1", "f1_2", "f1_3", "f1_4"].every(id => pp[id]);
  if (mindT1) earned.push("mind_t1");
  if (heartT1) earned.push("heart_t1");
  if (spiritT1) earned.push("spirit_t1");
  if (fortuneT1) earned.push("fortune_t1");
  if (mindT1 && heartT1 && spiritT1 && fortuneT1) earned.push("all_pillars");

  // Special
  earned.push("first_day");
  if (totalXP >= 10000) earned.push("xp_10k");
  if (totalXP >= 100000) earned.push("xp_100k");

  return earned;
}
