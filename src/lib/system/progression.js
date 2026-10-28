// Skills, titles, job classes, the Shadow Army — and the XP/Gold bonuses they grant.
import { toArr, habitDoneIds, today, addDays } from "@/utils";

// ── Bonus categories (from the reason passed to addXP) ──
export function bonusCategory(reason = "") {
    const r = String(reason);
    if (/Gate|Dungeon/i.test(r)) return "gate";
    if (/Daily Quest/i.test(r)) return "quest";
    if (/Workout|Training/i.test(r)) return "training";
    if (/Focus|Mission/i.test(r)) return "mind";
    if (/Quest completed|Habit|Journal|Mood|Meditation|Sleep|Gratitude/i.test(r)) return "spirit";
    if (/Food|Meal|Water|Nutrition/i.test(r)) return "nutrition";
    return "other";
}
const CAT_LABEL = { gate: "Gates", quest: "Daily Quests", training: "workouts", mind: "focus & missions", spirit: "habits, journal & meditation", nutrition: "meals", all: "everything" };

// ── Skills: unlocked by stat totals ──
export const SKILLS = [
    { id: "bloodlust", name: "Bloodlust", icon: "🩸", req: { str: 20 }, effect: { xp: { training: 0.1 } } },
    { id: "sprint", name: "Sprint", icon: "💨", req: { agi: 20 }, effect: { xp: { gate: 0.1 } } },
    { id: "tenacity", name: "Tenacity", icon: "🛡️", req: { vit: 20 }, effect: { penaltyCut: 120 }, desc: "Penalty Zone lasts 2 minutes less." },
    { id: "mana_sense", name: "Mana Sense", icon: "🔮", req: { int: 20 }, effect: { xp: { mind: 0.1 } } },
    { id: "detection", name: "Detection", icon: "👁️", req: { per: 20 }, effect: { gold: 0.1 } },
    { id: "stealth", name: "Stealth", icon: "🌑", req: { agi: 35 }, effect: { boxChance: 0.15 }, desc: "+15% Random Box chance from Daily Quests." },
    { id: "iron_body", name: "Iron Body", icon: "🗿", req: { str: 30, vit: 35 }, effect: { xp: { quest: 0.1 } } },
    { id: "inner_peace", name: "Inner Peace", icon: "🪷", req: { per: 35 }, effect: { xp: { spirit: 0.1 } } },
    { id: "vital_strike", name: "Vital Strike", icon: "🗡️", req: { str: 50, agi: 40 }, effect: { gateGold: 0.25 }, desc: "+25% Gold from Gates." },
    { id: "rulers_authority", name: "Ruler's Authority", icon: "✋", req: { int: 40, per: 40 }, effect: { xp: { all: 0.05 } } },
];

// ── Titles: earned once, kept forever; the equipped one grants its bonus ──
export const TITLES = [
    { id: "wolf_slayer", name: "Wolf Slayer", how: "Clear 5 Gates", test: c => c.gates >= 5, effect: { xp: { gate: 0.05 } } },
    { id: "overcame", name: "One Who Overcame Adversity", how: "Survive the Penalty Zone", test: c => c.penalties >= 1, effect: { xp: { quest: 0.05 } } },
    { id: "rising", name: "Rising Hunter", how: "Be promoted to C-Rank", test: c => c.rankTier >= 3, effect: { gold: 0.05 } },
    { id: "diligent", name: "The Diligent", how: "Clear 30 Daily Quests", test: c => c.quests >= 30, effect: { gold: 0.1 } },
    { id: "unbreakable", name: "Unbreakable", how: "Reach a 30-day streak", test: c => c.streak >= 30, effect: { xp: { training: 0.05 } } },
    { id: "giant_slayer", name: "Giant Slayer", how: "Clear an A-Rank Gate", test: c => c.gateTier >= 5, effect: { xp: { gate: 0.1 } } },
    { id: "shadow_commander", name: "Commander of Shadows", how: "Raise 5 shadows", test: c => c.shadows >= 5, effect: { xp: { spirit: 0.1 } } },
    { id: "dungeon_breaker", name: "Dungeon Breaker", how: "Clear 50 Gates", test: c => c.gates >= 50, effect: { xp: { gate: 0.15 } } },
    { id: "changed_fate", name: "The One Who Changed Fate", how: "Complete the Job Change", test: c => c.job, effect: { xp: { all: 0.03 } } },
    { id: "s_rank", name: "S-Rank Hunter", how: "Be promoted to S-Rank", test: c => c.rankTier >= 6, effect: { xp: { all: 0.05 } } },
];

// ── Job classes (Job Change at Lv 40) ──
export const JOB_LEVEL = 40;
export const JOB_DAYS = 7;
export const CLASSES = [
    { id: "fighter", name: "Fighter", stat: "str", icon: "⚔️", effect: { xp: { training: 0.15, gate: 0.15 } } },
    { id: "assassin", name: "Assassin", stat: "agi", icon: "🗡️", effect: { xp: { gate: 0.15 }, gold: 0.1 } },
    { id: "tank", name: "Tank", stat: "vit", icon: "🛡️", effect: { xp: { quest: 0.15, nutrition: 0.15 }, penaltyCut: 120 } },
    { id: "mage", name: "Mage-Scholar", stat: "int", icon: "🔮", effect: { xp: { mind: 0.2 } } },
    { id: "ranger", name: "Ranger-Monk", stat: "per", icon: "🏹", effect: { xp: { spirit: 0.2 } } },
    { id: "monarch", name: "Shadow Monarch", stat: null, icon: "👑", hidden: true, effect: { xp: { all: 0.1 }, armyMult: 2 } },
];
export const classById = (id) => CLASSES.find(c => c.id === id) || null;
/** Hidden class: 3+ shadows and every stat at 40+. */
export const monarchEligible = (sheet, system) => toArr(system?.shadows).length >= 3 && sheet.every(s => s.total >= 40);

/** Human-readable effect, e.g. "+10% XP from Gates". */
export function describeEffect(e = {}, fallback) {
    if (fallback) return fallback;
    const parts = [];
    for (const [cat, v] of Object.entries(e.xp || {})) parts.push(`+${Math.round(v * 100)}% XP from ${CAT_LABEL[cat] || cat}`);
    if (e.gold) parts.push(`+${Math.round(e.gold * 100)}% Gold`);
    if (e.gateGold) parts.push(`+${Math.round(e.gateGold * 100)}% Gold from Gates`);
    if (e.boxChance) parts.push(`+${Math.round(e.boxChance * 100)}% Random Box chance`);
    if (e.penaltyCut) parts.push(`Penalty Zone ${e.penaltyCut / 60} min shorter`);
    if (e.armyMult) parts.push("Shadow Army power ×2");
    return parts.join(" · ");
}

/** Every effect active right now: unlocked skills + equipped title + job class. */
export function activeEffects(system, activeTitle) {
    const out = [];
    const skills = new Set(toArr(system?.skills));
    SKILLS.forEach(s => { if (skills.has(s.id)) out.push(s.effect); });
    const title = TITLES.find(t => t.name === activeTitle && toArr(system?.titles).includes(t.id));
    if (title) out.push(title.effect);
    const job = classById(system?.job?.id);
    if (job) out.push(job.effect);
    return out;
}

export function xpMultiplier(system, activeTitle, reason) {
    const cat = bonusCategory(reason);
    let add = Number(system?.armyBonus) || 0;
    for (const e of activeEffects(system, activeTitle)) add += (e.xp?.[cat] || 0) + (e.xp?.all || 0);
    return 1 + Math.min(0.75, add);
}

export function goldMultiplier(system, activeTitle, { gate = false } = {}) {
    let add = 0;
    for (const e of activeEffects(system, activeTitle)) add += (e.gold || 0) + (gate ? e.gateGold || 0 : 0);
    return 1 + Math.min(1, add);
}

export function effectSum(system, activeTitle, key) {
    return activeEffects(system, activeTitle).reduce((a, e) => a + (Number(e[key]) || 0), 0);
}

// ── Shadow Army ──
export const SHADOW_RANKS = [
    { name: "Soldier", min: 14, power: 0.01 },
    { name: "Knight", min: 30, power: 0.02 },
    { name: "Elite Knight", min: 60, power: 0.03 },
    { name: "Commander", min: 100, power: 0.04 },
    { name: "Marshal", min: 180, power: 0.05 },
    { name: "Grand Marshal", min: 365, power: 0.06 },
];
export const ARISE_DAYS = 14;
export const SHADOW_NAMES = ["Igris", "Iron", "Tank", "Tusk", "Beru", "Bellion", "Kaisel", "Greed", "Jima", "Kamish", "Fangs", "Cerberus", "Ashborn"];

export const shadowRank = (days) => [...SHADOW_RANKS].reverse().find(r => days >= r.min) || SHADOW_RANKS[0];

/** Current and best consecutive-day run for one habit. Today may still be pending. */
export function habitRuns(habitLog, habitId) {
    const days = new Set(Object.keys(habitLog || {}).filter(d => habitDoneIds(habitLog[d]).includes(habitId)));
    let k = today();
    if (!days.has(k)) k = addDays(-1, k);
    let current = 0;
    for (let i = 0; i < 3650 && days.has(k); i++) { current++; k = addDays(-1, k); }
    let best = 0, run = 0, prev = null;
    for (const d of [...days].sort()) {
        run = prev && addDays(1, prev) === d ? run + 1 : 1;
        best = Math.max(best, run);
        prev = d;
    }
    return { current, best };
}

/** The army: arisen shadows with rank and state, and habits ready to ARISE. */
export function armyState(system, habits, habitLog) {
    const list = toArr(habits).filter(h => h && h.id != null && h.id !== "h1");
    const arisen = toArr(system?.shadows);
    const shadows = arisen.map(sh => {
        const habit = list.find(h => String(h.id) === String(sh.habitId));
        const runs = habitRuns(habitLog, sh.habitId);
        // Power follows the CURRENT run: a shadow is never lost, but it weakens when the habit breaks.
        const rank = shadowRank(Math.max(runs.current, ARISE_DAYS));
        return { ...sh, habit, ...runs, rank, active: runs.current > 0 && !!habit };
    });
    const mult = classById(system?.job?.id)?.effect.armyMult || 1;
    const power = Math.min(0.25 * mult, shadows.filter(s => s.active).reduce((a, s) => a + s.rank.power, 0) * mult);
    const taken = new Set(arisen.map(s => String(s.habitId)));
    const candidates = list.filter(h => !taken.has(String(h.id))).map(h => ({ habit: h, ...habitRuns(habitLog, h.id) }));
    return { shadows, power, candidates };
}

/** Counters used by title conditions. */
export function titleCounters(system, streak) {
    return {
        gates: Number(system?.gateStats?.cleared) || 0,
        gateTier: Number(system?.gateStats?.highestTier) || 0,
        penalties: Number(system?.penaltiesSurvived) || 0,
        quests: Object.values(system?.questLog || {}).filter(q => q?.claimed).length + (Number(system?.questArchive) || 0),
        streak: Number(streak) || 0,
        shadows: toArr(system?.shadows).length,
        rankTier: ["E", "D", "C", "B", "A", "S", "N"].indexOf(system?.rank || "E") + 1,
        job: !!system?.job?.id,
    };
}

/** Job Change Quest progress: 7 days in a row of Daily Quest + a workout. */
export function jobQuestProgress(system, workoutDone) {
    const start = system?.job?.questStart;
    if (!start) return null;
    const d = today();
    let done = 0, failed = false;
    for (let k = start, i = 0; k <= d && i < 30; k = addDays(1, k), i++) {
        const ok = !!system?.questLog?.[k]?.claimed && workoutDone(k);
        if (ok) done++;
        else if (k < d) { failed = true; break; }
    }
    return { done: Math.min(JOB_DAYS, done), failed, complete: done >= JOB_DAYS };
}
