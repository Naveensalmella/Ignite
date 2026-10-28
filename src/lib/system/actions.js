// System actions — everything that changes `system` state goes through here.
import useAppStore from "@/stores/useAppStore";
import { getLevel, today, addDays, toArr } from "@/utils";
import { play } from "@/components/soundEngine";
import { levelRank, availableTrial, rankById, TRIALS, trialRewards } from "./ranks";
import { STAT_KEYS, AP_PER_LEVEL, emptyStats } from "./stats";
import { questItems, questDay, questStatus, questRewards, OVERACHIEVE_BONUS, templateTarget } from "./quests";
import { itemById, rollRandomBox, STARTER_REWARDS, REWARD_PREFIX, POTION_MS } from "./items";

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
    const box = Math.random() < r.boxChance;
    patch(x => ({
        gold: (Number(x.gold) || 0) + r.gold,
        abilityPoints: (Number(x.abilityPoints) || 0) + r.ap,
        inventory: box ? addInv(x.inventory, "box") : x.inventory,
    }));
    st().addXP(r.xp, "Daily Quest");
    notify({
        kind: "quest", title: "DAILY QUEST COMPLETE",
        lines: ["Preparations to become powerful — cleared.", `+${r.xp} XP · +${r.gold} Gold · +${r.ap} Ability Point`, ...(box ? ["🎁 Random Box obtained"] : [])],
        cta: s.abilityPoints || r.ap ? { label: "Allocate points", page: "status" } : undefined,
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
    patch(x => ({ penalty: { ...x.penalty, active: false, cleared: "survived", clearedAt: Date.now() } }));
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
