// Gates & Dungeons: three daily Gates (workouts) matched to the player's rank, each ending in a boss.
import { RANKS } from "@/data/index";
import { rankIndex } from "./ranks";

const TIMED = new Set(["Plank Hold", "Wall Sit", "Mountain Climbers", "High Knees", "Jumping Jacks", "Sprint in Place", "Shadow Boxing", "Jab-Cross Combo", "MMA Shadow Fighting", "Superman Hold", "Flutter Kicks", "Mountain Climber Blitz", "Tabata Burpees", "Horse Stance Hold"]);

export const GATE_THEMES = [
    { id: "goblin", name: "Goblin Den", icon: "🕳️", focus: "Full body", pool: ["Bodyweight Squats", "Standard Push-ups", "Lunges", "Glute Bridges", "Mountain Climbers", "Plank Hold"], boss: { name: "Hobgoblin Chieftain", ex: "Burpees" } },
    { id: "lycan", name: "Steel-Fanged Lycan Forest", icon: "🐺", focus: "Cardio & legs", pool: ["High Knees", "Jump Squats", "Jumping Jacks", "Lunges", "Sprint in Place", "Bulgarian Split Squats"], boss: { name: "Alpha Lycan", ex: "Tuck Jumps" } },
    { id: "orc", name: "High Orc Fortress", icon: "🏰", focus: "Upper body", pool: ["Standard Push-ups", "Pike Push-ups", "Inverted Rows (table/bar)", "Tricep Dips (chair)", "Diamond Push-ups", "Shoulder Taps"], boss: { name: "Orc Warlord", ex: "Archer Push-ups" } },
    { id: "ice", name: "Ice Elf Glacier", icon: "❄️", focus: "Core", pool: ["Crunches", "Leg Raises", "Russian Twists", "Plank Hold", "Superman Hold", "Flutter Kicks"], boss: { name: "Ice Elf Chief Baruka", ex: "Mountain Climber Blitz" } },
    { id: "ant", name: "Ant Island", icon: "🐜", focus: "HIIT", pool: ["Burpees", "Jump Squats", "High Knees", "Mountain Climbers", "Sprawl Drill", "Jumping Jacks"], boss: { name: "Ant King", ex: "Tabata Burpees" } },
    { id: "temple", name: "Double Dungeon", icon: "🗿", focus: "Combat", pool: ["Shadow Boxing", "Jab-Cross Combo", "Front Kick (Teep)", "Roundhouse Kick", "Knee Strikes", "Sprawl Drill"], boss: { name: "Statue of God", ex: "MMA Shadow Fighting" } },
    { id: "castle", name: "Demon Castle", icon: "🏯", focus: "Strength endurance", pool: ["Bulgarian Split Squats", "Standard Push-ups", "Glute Bridges", "Pike Push-ups", "Wall Sit", "Lunges"], boss: { name: "Demon Monarch Baran", ex: "Jump Squat + Push-up Combo" } },
];

function rng(seed) {
    let h = 2166136261;
    for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

const ex = (name, tier, sets, boss = false) => TIMED.has(name)
    ? { name, sets, duration: (boss ? 45 : 20) + 5 * tier, rest: boss ? 60 : 30 }
    : { name, sets, reps: (boss ? 14 : 8) + 2 * tier, rest: boss ? 75 : 45 };

/** One Gate of a given rank tier (1 = E … 7 = National). */
export function buildGate(theme, tier, id) {
    const rank = RANKS[tier - 1];
    const waves = Math.min(6, 2 + Math.ceil(tier / 2));
    const sets = tier <= 2 ? 2 : tier <= 5 ? 3 : 4;
    const exercises = [...theme.pool.slice(0, waves).map(n => ex(n, tier, sets)), { ...ex(theme.boss.ex, tier, 1, true), boss: theme.boss.name }];
    return { id, theme: theme.id, name: theme.name, icon: theme.icon, focus: theme.focus, boss: theme.boss.name, rank: rank.id, tier, exercises, rewards: gateRewards(tier) };
}

export function gateRewards(tier) {
    return { xp: 40 + 25 * tier, gold: 60 * tier, dropChance: Math.min(0.6, 0.25 + 0.05 * tier) };
}

/** Today's three Gates: one below your rank, one at it, and a Red Gate one rank above (needs a Gate Key).
 *  Ids include the rank (a mid-day rank-up brings new Gates); `date` ties a clear to the Gate's own day. */
export function dailyGates(dateKey, rankId) {
    const r = rankIndex(rankId) + 1;
    const rand = rng(`${dateKey}:${rankId}`);
    const themes = [...GATE_THEMES].sort(() => rand() - 0.5);
    const tiers = [Math.max(1, r - 1), r, Math.min(RANKS.length, r + 1)];
    return tiers.map((t, i) => ({ ...buildGate(themes[i], t, `${dateKey}_${rankId}_${i}`), date: dateKey, red: i === 2 && t > r }));
}

/** Loot after a clear. */
export function rollGateDrop(tier, r = Math.random()) {
    if (r >= gateRewards(tier).dropChance) return null;
    const pick = Math.random();
    return pick < 0.4 ? "box" : pick < 0.65 ? "potion" : pick < 0.85 ? "key" : pick < 0.95 ? "shield" : "pardon";
}

/** A Gate counts as cleared when at least 60% of its sets were finished. */
export const GATE_CLEAR_RATIO = 0.6;

/** Share of the Gate's ORIGINAL sets that were really finished. Measured against `gate.exercises`, so removing
 *  sets, swapping exercises or cutting a set to a token amount (< half the reps/time) doesn't count. */
export function gateClearRatio(gate, log) {
    const need = new Map();
    for (const e of gate?.exercises || []) {
        const n = need.get(e.name) || { sets: 0, reps: 0, duration: 0 };
        need.set(e.name, { sets: n.sets + (Number(e.sets) || 1), reps: Math.max(n.reps, Number(e.reps) || 0), duration: Math.max(n.duration, Number(e.duration) || 0) });
    }
    const total = [...need.values()].reduce((a, n) => a + n.sets, 0);
    if (!total) return 0;
    const done = new Map();
    for (const e of Array.isArray(log) ? log : []) {
        const n = need.get(e?.name);
        if (!n) continue;
        // Sets are logged as reps or seconds (the player may show a rep exercise as timed).
        const full = (s) => (Number(s.duration) > 0 ? Number(s.duration) : Number(s.reps) || 0) >= (n.duration || n.reps) / 2;
        const ok = (Array.isArray(e.sets) ? e.sets : []).filter(s => s?.done && full(s)).length;
        done.set(e.name, (done.get(e.name) || 0) + ok);
    }
    return [...need.entries()].reduce((a, [name, n]) => a + Math.min(n.sets, done.get(name) || 0), 0) / total;
}
