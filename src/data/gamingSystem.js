// ══════════════════════════════════════════════════════
// IGNITE Gaming System — XP Goals, Combos, Challenges,
// Titles, Milestones, Quest Chains, Login Bonus
// ══════════════════════════════════════════════════════

import { today, toArr, addDays, parseDateKey, habitDoneIds } from '@/utils';
import { normalizeDayEntries } from '@/lib/workoutLog';

// ── Date helpers ──
// Day keys are LOCAL calendar dates (see today()/dateKey in utils). Doing the math with
// new Date("YYYY-MM-DD") + toISOString() mixed UTC and local days (off-by-one near midnight / DST).
const shiftDay = (ds, n) => addDays(n, ds);

// habitLog[date] is {habitId: bool} (legacy: array of ids) — count only completed ones.
// toArr() on the object counted unchecked (false) habits too.
const countHabitsDone = (dayVal) => habitDoneIds(dayVal).length;

function dayWorkouts(workoutLog, d) {
    return normalizeDayEntries(workoutLog?.[d]);
}

// ── 1. DAILY XP GOAL ──
export const DEFAULT_XP_GOAL = 100;

export function getDailyXPProgress(xpLog, goal) {
    const d = today();
    const entries = toArr(xpLog?.[d]);
    const todayXP = entries.reduce((s, e) => s + (e?.amount || 0), 0);
    return { earned: todayXP, goal: goal || DEFAULT_XP_GOAL, pct: Math.min(100, Math.round((todayXP / (goal || DEFAULT_XP_GOAL)) * 100)) };
}

// ── 2. XP BREAKDOWN (by source) ──
export function getXPBreakdown(xpLog) {
    const d = today();
    const entries = toArr(xpLog?.[d]);
    const breakdown = {};
    entries.forEach(e => {
        const cat = e?.category || "Other";
        breakdown[cat] = (breakdown[cat] || 0) + (e?.amount || 0);
    });
    return breakdown;
}

export const XP_SOURCES = {
    Training: { icon: "⚔️", color: "#38bdf8" },
    Nutrition: { icon: "🍎", color: "#f59e0b" },
    Quest: { icon: "🎯", color: "#ef4444" },
    Focus: { icon: "⏱", color: "#06b6d4" },
    Wellness: { icon: "💛", color: "#8b5cf6" },
    Streak: { icon: "🔥", color: "#f97316" },
    Challenge: { icon: "🏆", color: "#eab308" },
    Login: { icon: "📅", color: "#3b82f6" },
    Combo: { icon: "💥", color: "#ec4899" },
    Other: { icon: "⚡", color: "#6b7280" },
};

// ── 3. COMBO SYSTEM ──
// Different activity types done today. Display only — combos count toward the weekly
// "Combo King" challenge and the All-Rounder chain; they don't multiply XP.
export function getComboStatus(appState, workoutLog) {
    const d = today();
    const activities = [];
    if (dayWorkouts(workoutLog, d).length > 0) activities.push("Training");
    if (toArr(appState?.foodLog?.[d]).length > 0) activities.push("Nutrition");
    if (countHabitsDone(appState?.habitLog?.[d]) > 0) activities.push("Quests");
    if (toArr(appState?.focusLog?.[d]).length > 0) activities.push("Focus");
    if (appState?.journal?.[d]?.mood || appState?.journal?.[d]?.entry) activities.push("Wellness");

    const count = activities.length;
    const label = count >= 5 ? "🌟 Ultimate combo · 5 activities"
        : count >= 4 ? "🔥 Mega combo · 4 activities"
            : count >= 3 ? "💥 Combo · 3 activities"
                : count >= 2 ? "⚡ Double up · 2 activities" : "";

    return { activities, count, label };
}

// ── 4. DAILY LOGIN BONUS ──
export function getLoginBonus(loginData) {
    const d = today();
    if (loginData?.lastClaim === d) return { claimed: true, streak: loginData.streak || 1, reward: 0 };

    const yd = shiftDay(d, -1);
    const consecutive = loginData?.lastClaim === yd ? (loginData.streak || 0) + 1 : 1;

    // Rewards escalate: Day 1=5, 2=10, 3=15, 4=20, 5=25, 6=35, 7=50 (then resets)
    const rewards = [5, 10, 15, 20, 25, 35, 50];
    const dayIdx = Math.min(consecutive - 1, 6);
    const reward = rewards[dayIdx];

    return { claimed: false, streak: consecutive, reward, dayIdx };
}

export function claimLoginBonus(loginData) {
    const d = today();
    const bonus = getLoginBonus(loginData);
    return { lastClaim: d, streak: bonus.streak };
}

// ── 5. WEEKLY CHALLENGES ──
export function generateWeeklyChallenges(seed) {
    const allChallenges = [
        { id: "w5", title: "5 Workouts", desc: "Complete 5 training sessions", target: 5, type: "workouts", reward: 200, icon: "⚔️" },
        { id: "w7", title: "7-Day Warrior", desc: "Train every day this week", target: 7, type: "workouts", reward: 350, icon: "🔥" },
        { id: "f7", title: "Nutrition Streak", desc: "Log food every day", target: 7, type: "foodDays", reward: 150, icon: "🍎" },
        { id: "c10k", title: "10K Calories", desc: "Burn 10,000 calories total", target: 10000, type: "calBurned", reward: 250, icon: "💪" },
        { id: "q20", title: "Habit Master", desc: "Tick off 20 habits this week", target: 20, type: "quests", reward: 200, icon: "🎯" },
        { id: "fo5", title: "Deep Focus", desc: "Complete 5 focus sessions", target: 5, type: "focusSessions", reward: 150, icon: "⏱" },
        { id: "j5", title: "Journal Journey", desc: "Write journal 5 days", target: 5, type: "journalDays", reward: 150, icon: "📝" },
        { id: "w3a", title: "Water Champion", desc: "Hit water goal 5 days", target: 5, type: "waterDays", reward: 100, icon: "💧" },
        { id: "x500", title: "XP Hunter", desc: "Earn 500 XP this week", target: 500, type: "weeklyXP", reward: 100, icon: "⚡" },
        { id: "combo3", title: "Combo King", desc: "Get 3+ combo 3 times", target: 3, type: "comboDays", reward: 200, icon: "💥" },
    ];

    // Pick 3 pseudo-random challenges per week (deterministic per seed).
    // Hash the full id with the seed — hashing only the first char made many
    // challenges tie and the weekly picks barely changed.
    const hash = (id) => {
        let h = (seed || 0) | 0;
        for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 2654435761);
        h ^= h >>> 15;
        return h >>> 0;
    };
    const shuffled = [...allChallenges].sort((a, b) => hash(a.id) - hash(b.id));
    // Avoid two challenges of the same type in one week (e.g. "5 Workouts" + "7-Day Warrior")
    const picked = [];
    for (const ch of shuffled) {
        if (picked.length >= 3) break;
        if (!picked.some(p => p.type === ch.type)) picked.push(ch);
    }
    return picked;
}

export function getChallengeProgress(challenge, appState, workoutLog, weekStart) {
    const days = [];
    const start = weekStart || getWeekStart();
    for (let i = 0; i < 7; i++) days.push(shiftDay(start, i));
    const st = appState || {};

    switch (challenge.type) {
        case "workouts": return days.filter(d => dayWorkouts(workoutLog, d).length > 0).length;
        case "foodDays": return days.filter(d => toArr(st.foodLog?.[d]).length > 0).length;
        case "calBurned": return days.reduce((s, d) => s + dayWorkouts(workoutLog, d).reduce((ss, e) => ss + (e?.calBurned || 0), 0), 0);
        case "quests": return days.reduce((s, d) => s + countHabitsDone(st.habitLog?.[d]), 0);
        case "focusSessions": return days.reduce((s, d) => s + toArr(st.focusLog?.[d]).length, 0);
        case "journalDays": return days.filter(d => st.journal?.[d]?.entry?.length > 10).length;
        case "waterDays": return days.filter(d => (Number(st.foodLog?.[`water_${d}`]) || 0) >= 8).length;
        case "weeklyXP": return days.reduce((s, d) => s + toArr(st.xpLog?.[d]).reduce((ss, e) => ss + (e?.amount || 0), 0), 0);
        case "comboDays": return days.filter(d => {
            let c = 0;
            if (dayWorkouts(workoutLog, d).length > 0) c++;
            if (toArr(st.foodLog?.[d]).length > 0) c++;
            if (countHabitsDone(st.habitLog?.[d]) > 0) c++;
            if (toArr(st.focusLog?.[d]).length > 0) c++;
            return c >= 3;
        }).length;
        default: return 0;
    }
}

// ── 6. LEVEL-UP REWARDS ──
export const LEVEL_REWARDS = {
    3: { title: "Starter Flame", reward: "🔥 Fire emoji unlocked", type: "cosmetic" },
    5: { title: "Rising Spark", reward: "🌙 Dark theme unlocked", type: "feature" },
    10: { title: "Iron Will", reward: "🎨 Accent colors unlocked", type: "feature" },
    15: { title: "Dedicated", reward: "⚡ Title: 'Dedicated'", type: "title" },
    20: { title: "Warrior Born", reward: "⚔️ Title: 'Warrior Born'", type: "title" },
    25: { title: "Discipline King", reward: "👑 Title: 'Discipline King'", type: "title" },
    30: { title: "Unstoppable", reward: "💎 Title: 'Unstoppable'", type: "title" },
    40: { title: "Legend", reward: "🏆 Title: 'Legend' + Gold badge", type: "title" },
    50: { title: "Mythic", reward: "🌟 Title: 'Mythic' + Crown badge", type: "title" },
    75: { title: "Transcendent", reward: "💀 Title: 'Transcendent'", type: "title" },
    100: { title: "Absolute", reward: "🔱 Title: 'The Absolute' + Diamond frame", type: "title" },
};

export function getLevelReward(level) {
    return LEVEL_REWARDS[level] || null;
}

export function getUnlockedTitles(level) {
    return Object.entries(LEVEL_REWARDS)
        .filter(([lv]) => parseInt(lv) <= level && LEVEL_REWARDS[lv].type === "title")
        .map(([lv, data]) => ({ level: parseInt(lv), ...data }));
}

// ── 7. ACHIEVEMENT TIERS ──
export const BADGE_TIERS = {
    workout_count: [
        { tier: "bronze", name: "Trainee", threshold: 10, icon: "🥉", xp: 50 },
        { tier: "silver", name: "Athlete", threshold: 50, icon: "🥈", xp: 150 },
        { tier: "gold", name: "Champion", threshold: 100, icon: "🥇", xp: 300 },
        { tier: "diamond", name: "Legend", threshold: 500, icon: "💎", xp: 1000 },
    ],
    streak: [
        { tier: "bronze", name: "Consistent", threshold: 7, icon: "🥉", xp: 30 },
        { tier: "silver", name: "Dedicated", threshold: 30, icon: "🥈", xp: 100 },
        { tier: "gold", name: "Relentless", threshold: 100, icon: "🥇", xp: 300 },
        { tier: "diamond", name: "Eternal Flame", threshold: 365, icon: "💎", xp: 1000 },
    ],
    xp_total: [
        { tier: "bronze", name: "Collector", threshold: 1000, icon: "🥉", xp: 50 },
        { tier: "silver", name: "Accumulator", threshold: 5000, icon: "🥈", xp: 150 },
        { tier: "gold", name: "Powerhouse", threshold: 25000, icon: "🥇", xp: 500 },
        { tier: "diamond", name: "XP God", threshold: 100000, icon: "💎", xp: 2000 },
    ],
    food_days: [
        { tier: "bronze", name: "Tracker", threshold: 7, icon: "🥉", xp: 30 },
        { tier: "silver", name: "Mindful Eater", threshold: 30, icon: "🥈", xp: 100 },
        { tier: "gold", name: "Nutrition Master", threshold: 100, icon: "🥇", xp: 300 },
        { tier: "diamond", name: "Diet Guru", threshold: 365, icon: "💎", xp: 1000 },
    ],
    focus_sessions: [
        { tier: "bronze", name: "Focused", threshold: 10, icon: "🥉", xp: 30 },
        { tier: "silver", name: "Deep Worker", threshold: 50, icon: "🥈", xp: 100 },
        { tier: "gold", name: "Flow State", threshold: 200, icon: "🥇", xp: 300 },
        { tier: "diamond", name: "Zen Master", threshold: 500, icon: "💎", xp: 1000 },
    ],
};

export function getCurrentTier(category, value) {
    const tiers = BADGE_TIERS[category];
    if (!tiers) return null;
    let current = null;
    let next = tiers[0];
    for (let i = 0; i < tiers.length; i++) {
        if (value >= tiers[i].threshold) {
            current = tiers[i];
            next = tiers[i + 1] || null;
        } else {
            next = tiers[i];
            break;
        }
    }
    return { current, next, value };
}

// ── 8. TITLES SYSTEM ──
export const EARNED_TITLES = [
    { id: "newcomer", name: "Newcomer", desc: "Started the journey", condition: (s) => s.totalXP > 0 },
    { id: "early_bird", name: "Early Bird", desc: "Trained before 7 AM", condition: (s) => s.earlyWorkout },
    { id: "night_owl", name: "Night Owl", desc: "Trained after 10 PM", condition: (s) => s.lateWorkout },
    { id: "ironman", name: "Iron Man", desc: "30-day streak", condition: (s) => s.streak >= 30 },
    { id: "beast", name: "Beast Mode", desc: "5 workouts in a week", condition: (s) => s.weekWorkouts >= 5 },
    { id: "scholar", name: "Scholar", desc: "50 focus sessions", condition: (s) => s.focusSessions >= 50 },
    { id: "monk", name: "Monk", desc: "Meditated 20 times", condition: (s) => s.meditationCount >= 20 },
    { id: "chef", name: "Master Chef", desc: "Logged 500 meals", condition: (s) => s.mealsLogged >= 500 },
    { id: "writer", name: "Storyteller", desc: "30 journal entries", condition: (s) => s.journalEntries >= 30 },
    { id: "social", name: "Social Butterfly", desc: "Added 5 friends", condition: (s) => s.friends >= 5 },
    { id: "centurion", name: "Centurion", desc: "100 workouts", condition: (s) => s.totalWorkouts >= 100 },
    { id: "marathon", name: "Marathon", desc: "100-day streak", condition: (s) => s.streak >= 100 },
];

// ── 9. QUEST CHAINS ──
export const QUEST_CHAINS = [
    {
        id: "warrior_week", name: "Warrior's Week", icon: "⚔️", totalDays: 7,
        desc: "Train every day for 7 days straight",
        dailyTask: "Complete a training session",
        checkDay: (d, workoutLog) => dayWorkouts(workoutLog, d).length > 0,
        rewards: { partial: 10, completion: 500 },
    },
    {
        id: "nutrition_master", name: "Nutrition Mastery", icon: "🍎", totalDays: 5,
        desc: "Log all 3 meals for 5 consecutive days",
        dailyTask: "Log breakfast, lunch, and dinner",
        checkDay: (d, _, appState) => {
            const foods = toArr(appState?.foodLog?.[d]);
            const meals = new Set(foods.map(f => f?.meal));
            return meals.has("Breakfast") && meals.has("Lunch") && meals.has("Dinner");
        },
        rewards: { partial: 15, completion: 300 },
    },
    {
        id: "focus_marathon", name: "Focus Marathon", icon: "⏱", totalDays: 5,
        desc: "Complete 2+ focus sessions daily for 5 days",
        dailyTask: "Complete 2 focus sessions",
        checkDay: (d, _, appState) => toArr(appState?.focusLog?.[d]).length >= 2,
        rewards: { partial: 10, completion: 250 },
    },
    {
        id: "all_rounder", name: "The All-Rounder", icon: "🌟", totalDays: 3,
        desc: "Complete 4+ activities in a day, 3 days in a row",
        dailyTask: "Get a 4+ combo",
        checkDay: (d, workoutLog, appState) => {
            let c = 0;
            if (dayWorkouts(workoutLog, d).length > 0) c++;
            if (toArr(appState?.foodLog?.[d]).length > 0) c++;
            if (countHabitsDone(appState?.habitLog?.[d]) > 0) c++;
            if (toArr(appState?.focusLog?.[d]).length > 0) c++;
            if (appState?.journal?.[d]?.mood) c++;
            return c >= 4;
        },
        rewards: { partial: 20, completion: 400 },
    },
];

export function getQuestChainProgress(chain, workoutLog, appState, startDate) {
    if (!startDate) return { daysCompleted: 0, active: false, failed: false };
    const td = today();
    const days = [];
    for (let i = 0; i < chain.totalDays; i++) days.push(shiftDay(startDate, i));
    let completed = 0;
    let failed = false;
    for (const d of days) {
        if (d > td) break; // Future day
        if (chain.checkDay(d, workoutLog || {}, appState || {})) completed++;
        else if (d === td) break; // Today isn't over yet — not a failure
        else { failed = true; break; }
    }
    return { daysCompleted: completed, totalDays: chain.totalDays, active: !failed && completed < chain.totalDays, failed, complete: completed >= chain.totalDays };
}

// ── 10. XP HISTORY ──
export function getXPHistory(xpLog, days = 14) {
    const history = [];
    const td = today();
    for (let i = days - 1; i >= 0; i--) {
        const ds = shiftDay(td, -i);
        const dt = parseDateKey(ds);
        const dayXP = toArr(xpLog?.[ds]).reduce((s, e) => s + (e?.amount || 0), 0);
        history.push({ date: ds, label: dt.toLocaleDateString("en", { weekday: "narrow" }), day: dt.getDate(), xp: dayXP });
    }
    return history;
}

// ── 11. MILESTONES ──
export const MILESTONES = [
    { xp: 100, title: "First Steps", emoji: "👣", msg: "Your journey begins!" },
    { xp: 500, title: "Warming Up", emoji: "🔥", msg: "The fire is building!" },
    { xp: 1000, title: "1K Club", emoji: "🏅", msg: "Welcome to the 1K club!" },
    { xp: 2500, title: "Rising Star", emoji: "⭐", msg: "You're becoming unstoppable!" },
    { xp: 5000, title: "5K Warrior", emoji: "⚔️", msg: "A true warrior emerges!" },
    { xp: 10000, title: "10K Legend", emoji: "🏆", msg: "LEGENDARY status achieved!" },
    { xp: 25000, title: "25K Titan", emoji: "💎", msg: "You are a TITAN!" },
    { xp: 50000, title: "50K Mythic", emoji: "🌟", msg: "MYTHIC power unlocked!" },
    { xp: 100000, title: "100K GOD", emoji: "🔱", msg: "YOU ARE A GOD!" },
];

export function checkMilestone(prevXP, newXP) {
    for (const m of MILESTONES) {
        if (prevXP < m.xp && newXP >= m.xp) return m;
    }
    return null;
}

// ── 12. SKILL TREE DATA ──
export const SKILL_TREE = {
    strength: {
        name: "Strength", icon: "💪", color: "#38bdf8",
        nodes: [
            { id: "s1", name: "First Workout", threshold: 1, type: "workouts" },
            { id: "s2", name: "10 Workouts", threshold: 10, type: "workouts" },
            { id: "s3", name: "25 Workouts", threshold: 25, type: "workouts" },
            { id: "s4", name: "50 Workouts", threshold: 50, type: "workouts" },
            { id: "s5", name: "100 Workouts", threshold: 100, type: "workouts" },
        ],
    },
    nutrition: {
        name: "Nutrition", icon: "🍎", color: "#f59e0b",
        nodes: [
            { id: "n1", name: "First Log", threshold: 1, type: "foodDays" },
            { id: "n2", name: "7 Days", threshold: 7, type: "foodDays" },
            { id: "n3", name: "30 Days", threshold: 30, type: "foodDays" },
            { id: "n4", name: "100 Days", threshold: 100, type: "foodDays" },
            { id: "n5", name: "365 Days", threshold: 365, type: "foodDays" },
        ],
    },
    mind: {
        name: "Mind", icon: "🧠", color: "#8b5cf6",
        nodes: [
            { id: "m1", name: "First Focus", threshold: 1, type: "focusSessions" },
            { id: "m2", name: "10 Sessions", threshold: 10, type: "focusSessions" },
            { id: "m3", name: "50 Sessions", threshold: 50, type: "focusSessions" },
            { id: "m4", name: "100 Sessions", threshold: 100, type: "focusSessions" },
            { id: "m5", name: "500 Sessions", threshold: 500, type: "focusSessions" },
        ],
    },
    discipline: {
        name: "Discipline", icon: "🔥", color: "#ef4444",
        nodes: [
            { id: "d1", name: "3-Day Streak", threshold: 3, type: "streak" },
            { id: "d2", name: "7-Day Streak", threshold: 7, type: "streak" },
            { id: "d3", name: "30-Day Streak", threshold: 30, type: "streak" },
            { id: "d4", name: "100-Day Streak", threshold: 100, type: "streak" },
            { id: "d5", name: "365-Day Streak", threshold: 365, type: "streak" },
        ],
    },
};

export function getSkillTreeProgress(branch, stats = {}) {
    const values = { workouts: stats.totalWorkouts || 0, foodDays: stats.foodDays || 0, focusSessions: stats.focusSessions || 0, streak: stats.streak || 0 };
    return branch.nodes.map(node => ({
        ...node,
        unlocked: values[node.type] >= node.threshold,
        progress: Math.min(100, Math.round((values[node.type] / node.threshold) * 100)),
        current: values[node.type],
    }));
}

// ── Week start helper ──
export function getWeekStart() {
    // Monday of the current week, as a local day key (same key space as today())
    const td = today();
    const day = parseDateKey(td).getDay();
    return shiftDay(td, day === 0 ? -6 : 1 - day);
}

// ── Week seed (changes weekly) ──
export function getWeekSeed() {
    const ws = getWeekStart();
    let h = 0;
    for (let i = 0; i < ws.length; i++) h = ((h << 5) - h + ws.charCodeAt(i)) | 0;
    return Math.abs(h);
}