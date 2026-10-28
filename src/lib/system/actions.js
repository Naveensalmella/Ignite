// System actions — everything that changes `system` state goes through here.
import useAppStore from "@/stores/useAppStore";
import { getLevel, today, addDays, toArr } from "@/utils";
import { play } from "@/components/soundEngine";
import { levelRank, availableTrial, rankById, TRIALS, trialRewards } from "./ranks";
import { STAT_KEYS, AP_PER_LEVEL, emptyStats, statSheet } from "./stats";
import { questItems, questDay, questStatus, questRewards, OVERACHIEVE_BONUS, templateTarget } from "./quests";
import { itemById, rollRandomBox, STARTER_REWARDS, REWARD_PREFIX, POTION_MS } from "./items";
import { rollGateDrop, GATE_CLEAR_RATIO } from "./gates";
import { SKILLS, TITLES, CLASSES, ARISE_DAYS, SHADOW_NAMES, JOB_LEVEL, describeEffect, effectSum, goldMultiplier, titleCounters, armyState, habitRuns, monarchEligible } from "./progression";

const st = () => useAppStore.getState();
const sys = () => st().system || {};
const patch = (fn) => st().setSystem(s => ({ ...(s || {}), ...fn(s || {}) }));
const notify = (n) => st().notify(n);
const level = () => getLevel(st().totalXP || 0);

const addInv = (inv, id, n = 1) => {
    const next = { ...(inv || {}) };
    next[id] = Math.max(0, (Number(next[id]) || 0) + n);
    if (!next[id]) delete next[id];
    return next;
};

// ── Awakening: become a Player. Existing progress is converted, nothing is lost. ──
export function awaken() {
    if (sys().awakened) return;
    const lv = level();
    const freezes = Math.max(0, Number(st().freezeData?.freezesAvailable) || 0);
    st().setSystem({
        awakened: true,
        awakenedOn: today(),
        penaltyChecked: today(),
        rank: levelRank(lv).id,
        apLevel: lv,
        abilityPoints: (lv - 1) * AP_PER_LEVEL,
        allocated: emptyStats(),
        gold: 100 + (lv - 1) * 25,
        inventory: { box: 1, shield: 1 + freezes },
        rewards: STARTER_REWARDS,
        quest: null,
        questLog: {},
        questArchive: 0,
        penalty: null,
        trial: null,
        buffs: {},
    });
    // Old streak freezes are now Streak Shields in the inventory.
    if (freezes) st().setFreezeData(f => ({ ...(f || {}), freezesAvailable: 0 }));
    play("rankUp");
}

// ── Ability points ──
export function allocate(stat, n = 1) {
    if (!STAT_KEYS.includes(stat)) return;
    const s = sys();
    const amount = Math.min(n, Number(s.abilityPoints) || 0);
    if (amount <= 0) return;
    patch(x => ({
        abilityPoints: (Number(x.abilityPoints) || 0) - amount,
        allocated: { ...emptyStats(), ...(x.allocated || {}), [stat]: (Number(x.allocated?.[stat]) || 0) + amount },
    }));
    play("tap");
}

// ── Gold ──
export function addGold(n) {
    patch(x => ({ gold: Math.max(0, (Number(x.gold) || 0) + n) }));
}

// ── Daily Quest ──
export function setQuestProgress(itemId, value) {
    const s = sys();
    if (!s.awakened || s.penalty?.active) return;
    const d = today();
    const day = questDay(s, d);
    const items = questItems(s, level()).map(i => (day.claimed && day.targets?.[i.id] ? { ...i, target: day.targets[i.id] } : i));
    const v = Math.max(0, Math.round((Number(value) || 0) * 10) / 10);
    const next = { ...day, progress: { ...(day.progress || {}), [itemId]: v } };
    const status = questStatus(items, next);
    const claim = status.done && !day.claimed;
    const bonus = status.over && (day.claimed || claim) && !day.over;
    if (claim) { next.claimed = true; next.targets = Object.fromEntries(items.map(i => [i.id, i.target])); }
    if (bonus) next.over = true;
    patch(x => ({ questLog: { ...(x.questLog || {}), [d]: next } }));
    if (claim) claimQuest();
    if (bonus) {
        patch(x => ({ gold: (Number(x.gold) || 0) + OVERACHIEVE_BONUS.gold, abilityPoints: (Number(x.abilityPoints) || 0) + OVERACHIEVE_BONUS.ap }));
        setTimeout(() => notify({
            kind: "quest", title: "HIDDEN REWARD",
            lines: ["You doubled every Daily Quest target.", `+${OVERACHIEVE_BONUS.gold} Gold · +${OVERACHIEVE_BONUS.ap} Ability Point`],
        }), claim ? 600 : 0);
    }
}

function claimQuest() {
    const s = sys();
    const r = questRewards(s.rank);
    const box = Math.random() < r.boxChance + effectSum(s, st().activeTitle, "boxChance");
    patch(x => ({
        gold: (Number(x.gold) || 0) + r.gold,
        abilityPoints: (Number(x.abilityPoints) || 0) + r.ap,
        inventory: box ? addInv(x.inventory, "box") : x.inventory,
    }));
    st().addXP(r.xp, "Daily Quest");
    notify({
        kind: "quest", title: "DAILY QUEST COMPLETE",
        lines: ["Preparations to become powerful — cleared.", `+${r.xp} XP · +${r.gold} Gold · +${r.ap} Ability Point`, ...(box ? ["🎁 Random Box obtained"] : [])],
        cta: s.abilityPoints || r.ap ? { label: "Allocate points", page: "status", action: "assign" } : undefined,
    });
}

/** Save an edited quest list (null = back to the System template). */
export function saveQuestItems(items) {
    const clean = items === null ? null : toArr(items)
        .filter(i => i && String(i.name || "").trim())
        .slice(0, 8)
        .map(i => {
            const auto = !!i.auto && templateTarget(i.id, level()) != null;
            return { id: i.id, name: String(i.name).trim().slice(0, 40), unit: String(i.unit || "reps").slice(0, 10), pattern: i.pattern || null, auto, ...(auto ? {} : { target: Math.max(0.5, Number(i.target) || 1) }) };
        });
    patch(() => ({ quest: clean && clean.length ? { items: clean } : null }));
}

// ── Penalty Zone ──
export function survivePenalty() {
    const s = sys();
    if (!s.penalty?.active) return;
    patch(x => ({ penalty: { ...x.penalty, active: false, cleared: "survived", clearedAt: Date.now() }, penaltiesSurvived: (Number(x.penaltiesSurvived) || 0) + 1 }));
    notify({ kind: "quest", title: "PENALTY QUEST CLEARED", lines: ["You survived the Penalty Zone.", "XP gains are back to normal and the Daily Quest is unlocked."] });
}

// ── Rank Assessment ──
export function startTrial() {
    const s = sys();
    const target = availableTrial(s, level());
    if (!target || s.trial || (s.trialCooldown && s.trialCooldown > today())) return;
    const def = TRIALS[target.id];
    const now = Date.now();
    patch(() => ({ trial: { rank: target.id, startedAt: now, deadline: now + def.minutes * 60e3, done: {} } }));
    play("system");
}

export function toggleTrialTask(i) {
    patch(x => x.trial ? { trial: { ...x.trial, done: { ...(x.trial.done || {}), [i]: !x.trial.done?.[i] } } } : {});
}

export function submitTrial() {
    const s = sys();
    const t = s.trial;
    if (!t) return;
    const def = TRIALS[t.rank];
    const allDone = def.tasks.every((_, i) => t.done?.[i]);
    if (!allDone || Date.now() > t.deadline + 60e3) return failTrial(Date.now() > t.deadline ? "Time ran out." : "Not every task was completed.");
    const rank = rankById(t.rank);
    const r = trialRewards(t.rank);
    patch(x => ({
        rank: t.rank, trial: null, trialCooldown: null,
        gold: (Number(x.gold) || 0) + r.gold,
        abilityPoints: (Number(x.abilityPoints) || 0) + r.ap,
    }));
    notify({
        kind: "rank", title: "RANK UP", rank: rank.id,
        lines: [`You have been promoted to ${rank.name}.`, `“${rank.title}”`, `+${r.gold} Gold · +${r.ap} Ability Points`],
    });
}

export function failTrial(reason = "You withdrew from the assessment.") {
    if (!sys().trial) return;
    patch(() => ({ trial: null, trialCooldown: addDays(1) }));
    notify({ kind: "warning", title: "ASSESSMENT FAILED", lines: [reason, "You may retry tomorrow."] });
}

// ── Shop & inventory ──
export function buy(id) {
    const item = itemById(id);
    const s = sys();
    if (!item || (Number(s.gold) || 0) < item.price) { play("error"); return false; }
    patch(x => ({ gold: (Number(x.gold) || 0) - item.price, inventory: addInv(x.inventory, id) }));
    play("coin");
    return true;
}

export function buyReward(reward) {
    const s = sys();
    if (!reward || (Number(s.gold) || 0) < reward.price) { play("error"); return false; }
    patch(x => ({ gold: (Number(x.gold) || 0) - reward.price, inventory: addInv(x.inventory, REWARD_PREFIX + reward.id) }));
    play("coin");
    return true;
}

export function saveRewards(rewards) {
    patch(() => ({ rewards: toArr(rewards).slice(0, 30) }));
}

/** Use one item from the inventory. Returns false when it can't be used right now. */
export function consumeItem(id) {
    const s = sys();
    if (!(Number(s.inventory?.[id]) > 0)) return false;
    const consume = (extra = {}) => patch(x => ({ inventory: addInv(x.inventory, id, -1), ...extra }));

    if (id.startsWith(REWARD_PREFIX)) {
        const r = toArr(s.rewards).find(x => REWARD_PREFIX + x.id === id);
        consume();
        notify({ kind: "quest", title: "REWARD REDEEMED", lines: [`${r?.icon || "🎉"} ${r?.name || "Reward"}`, "You earned this. Enjoy it."] });
        return true;
    }
    switch (id) {
        case "shield": {
            const d = today();
            const used = toArr(st().freezeData?.freezesUsed);
            if (used.includes(d)) return false;
            st().setFreezeData(f => ({ ...(f || {}), freezesUsed: [...toArr(f?.freezesUsed), d] }));
            consume();
            notify({ kind: "info", title: "STREAK SHIELD ACTIVE", lines: ["Today is protected.", "Your streak is safe and missing today's Daily Quest won't trigger a Penalty Quest."] });
            return true;
        }
        case "potion": {
            const until = Math.max(Date.now(), Number(s.buffs?.xpBoostUntil) || 0) + POTION_MS;
            consume({ buffs: { ...(s.buffs || {}), xpBoostUntil: until } });
            notify({ kind: "info", title: "XP POTION", lines: ["All XP is doubled for the next 60 minutes."] });
            return true;
        }
        case "pardon": {
            if (!s.penalty?.active) return false;
            consume({ penalty: { ...s.penalty, active: false, cleared: "pardon", clearedAt: Date.now() } });
            notify({ kind: "info", title: "PENALTY PARDONED", lines: ["The Penalty Quest has been lifted."] });
            return true;
        }
        case "reset": {
            const refunded = Object.values(s.allocated || {}).reduce((a, n) => a + (Number(n) || 0), 0);
            if (!refunded) return false;
            consume({ allocated: emptyStats(), abilityPoints: (Number(s.abilityPoints) || 0) + refunded });
            notify({ kind: "info", title: "STATS RESET", lines: [`${refunded} Ability Points refunded.`] });
            return true;
        }
        case "box": {
            const loot = rollRandomBox();
            if (loot.kind === "gold") consume({ gold: (Number(s.gold) || 0) + loot.amount });
            else if (loot.kind === "ap") consume({ abilityPoints: (Number(s.abilityPoints) || 0) + loot.amount });
            else patch(x => ({ inventory: addInv(addInv(x.inventory, id, -1), loot.id) }));
            const label = loot.kind === "gold" ? `💰 ${loot.amount} Gold` : loot.kind === "ap" ? "✨ 1 Ability Point" : `${itemById(loot.id).icon} ${itemById(loot.id).name}`;
            notify({ kind: "quest", title: "RANDOM BOX OPENED", lines: ["You obtained:", label] });
            return true;
        }
        default: return false;
    }
}

// ── Gates & Dungeons ──
export const gateCleared = (system, gate) => toArr(system?.gateLog?.[today()]).includes(gate.id);

/** Called when a Gate workout ends. `log` is the player's per-exercise set log. */
export function clearGate(gate, log) {
    const s = sys();
    const sets = toArr(log).flatMap(e => toArr(e.sets));
    const ratio = sets.length ? sets.filter(x => x.done).length / sets.length : 0;
    if (ratio < GATE_CLEAR_RATIO) {
        notify({ kind: "warning", title: "GATE FAILED", lines: [`You escaped ${gate.name} before the boss fell.`, `Finish at least ${Math.round(GATE_CLEAR_RATIO * 100)}% of the sets to clear a Gate.`] });
        return;
    }
    if (gateCleared(s, gate)) {
        notify({ kind: "info", title: "GATE ALREADY CLEARED", lines: ["This Gate's rewards were already claimed today. Your workout still counts."] });
        return;
    }
    if (gate.red && !(Number(s.inventory?.key) > 0)) {
        notify({ kind: "warning", title: "NO GATE KEY", lines: ["A Red Gate needs a Gate Key to claim its rewards."] });
        return;
    }
    const d = today();
    const gold = Math.round(gate.rewards.gold * goldMultiplier(s, st().activeTitle, { gate: true }));
    const drop = rollGateDrop(gate.tier);
    patch(x => {
        let inv = gate.red ? addInv(x.inventory, "key", -1) : x.inventory;
        if (drop) inv = addInv(inv, drop);
        const gateLog = Object.fromEntries(Object.entries(x.gateLog || {}).filter(([k]) => k >= addDays(-7, d)));
        gateLog[d] = [...toArr(gateLog[d]), gate.id];
        const gs = x.gateStats || {};
        return {
            inventory: inv, gateLog, gold: (Number(x.gold) || 0) + gold,
            gateStats: { cleared: (Number(gs.cleared) || 0) + 1, highestTier: Math.max(Number(gs.highestTier) || 0, gate.tier) },
        };
    });
    st().addXP(gate.rewards.xp, `Gate Cleared: ${gate.name}`);
    const item = drop && itemById(drop);
    notify({
        kind: "quest", title: "DUNGEON CLEARED",
        lines: [`${gate.icon} [${gate.rank}] ${gate.name}`, `Boss defeated: ${gate.boss}`, `+${gate.rewards.xp} XP · +${gold} Gold`, ...(item ? [`Loot: ${item.icon} ${item.name}`] : [])],
    });
}

// ── Skills, titles and army power (derived from progress; run after data changes) ──
export function checkUnlocks() {
    const state = st();
    const s = state.system;
    if (!s?.awakened) return;
    const sheet = statSheet(state, s);
    const total = Object.fromEntries(sheet.map(x => [x.key, x.total]));
    const skills = SKILLS.filter(sk => Object.entries(sk.req).every(([k, v]) => total[k] >= v)).map(sk => sk.id);
    const counters = titleCounters(s, state.streak);
    const owned = toArr(s.titles);
    const titles = [...owned, ...TITLES.filter(t => !owned.includes(t.id) && t.test(counters)).map(t => t.id)];
    const armyBonus = Math.round(armyState(s, state.habits, state.habitLog).power * 1000) / 1000;

    const newSkills = skills.filter(id => !toArr(s.skills).includes(id));
    const newTitles = titles.filter(id => !owned.includes(id));
    const same = JSON.stringify(skills) === JSON.stringify(toArr(s.skills)) && newTitles.length === 0 && armyBonus === (Number(s.armyBonus) || 0);
    if (same) return;
    patch(() => ({ skills, titles, armyBonus }));
    const lines = [
        ...newSkills.map(id => { const sk = SKILLS.find(x => x.id === id); return `Skill acquired: ${sk.icon} ${sk.name} — ${describeEffect(sk.effect, sk.desc)}`; }),
        ...newTitles.map(id => `Title earned: “${TITLES.find(x => x.id === id).name}”`),
    ];
    if (lines.length) notify({ kind: "quest", title: newSkills.length ? "SKILL ACQUIRED" : "TITLE EARNED", lines, cta: newSkills.length ? { label: "View skills", page: "status", action: "skills" } : { label: "Equip title", page: "inventory", tab: "titles" } });
}

export function equipTitle(name) {
    st().setActiveTitle(st().activeTitle === name ? null : name);
    play("tap");
}

// ── Shadow Army ──
export function arise(habitId) {
    const state = st();
    const s = sys();
    if (toArr(s.shadows).some(x => String(x.habitId) === String(habitId))) return;
    if (habitRuns(state.habitLog, habitId).best < ARISE_DAYS) return;
    const used = new Set(toArr(s.shadows).map(x => x.name));
    const name = SHADOW_NAMES.find(n => !used.has(n)) || `Shadow ${toArr(s.shadows).length + 1}`;
    const habit = toArr(state.habits).find(h => String(h.id) === String(habitId));
    patch(x => ({ shadows: [...toArr(x.shadows), { habitId, name, arisenOn: today() }] }));
    notify({ kind: "rank", title: "ARISE", lines: [`${name} has joined your Shadow Army.`, `Bound to: ${habit?.icon || ""} ${habit?.name || "your habit"}`, "Keep the habit alive and your shadow grows stronger."] });
    setTimeout(checkUnlocks, 300);
}

// ── Job Change ──
export function startJobQuest() {
    if (level() < JOB_LEVEL || sys().job?.id) return;
    patch(() => ({ job: { questStart: today() } }));
    notify({ kind: "rank", title: "JOB CHANGE QUEST", lines: ["For 7 days in a row, clear the Daily Quest and finish a workout or Gate.", "Miss a day and the quest must be restarted."] });
}

export function chooseClass(id) {
    const s = sys();
    const cls = CLASSES.find(c => c.id === id);
    if (!cls || s.job?.id || !s.job?.questStart) return;
    if (cls.hidden && !monarchEligible(statSheet(st(), s), s)) return;
    patch(x => ({ job: { ...x.job, id, since: today() }, abilityPoints: (Number(x.abilityPoints) || 0) + 10 }));
    notify({ kind: "rank", title: "JOB CHANGE COMPLETE", lines: [`Your job is now: ${cls.icon} ${cls.name}`, describeEffect(cls.effect), "+10 Ability Points"] });
    setTimeout(checkUnlocks, 300);
}
