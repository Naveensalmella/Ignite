// System shop items, random boxes and starter real-life rewards.

export const SHOP_ITEMS = [
    { id: "shield", name: "Streak Shield", icon: "🛡️", price: 300, desc: "Protects today: keeps your streak and prevents a Penalty Quest if today's Daily Quest is missed." },
    { id: "potion", name: "XP Potion", icon: "🧪", price: 250, desc: "Doubles all XP you earn for the next 60 minutes." },
    { id: "pardon", name: "Penalty Pardon", icon: "📜", price: 500, desc: "Instantly clears an active Penalty Quest." },
    { id: "key", name: "Gate Key", icon: "🗝️", price: 200, desc: "Opens today's Red Gate — a dungeon one rank above yours. Used when you clear it." },
    { id: "box", name: "Random Box", icon: "🎁", price: 150, desc: "Contains gold or an item — and, rarely, an Ability Point." },
    { id: "reset", name: "Stat Reset Scroll", icon: "🌀", price: 400, desc: "Refunds every Ability Point you've allocated so you can rebuild." },
];
export const itemById = (id) => SHOP_ITEMS.find(i => i.id === id);

export const REWARD_PREFIX = "rw_";

export const STARTER_REWARDS = [
    { id: "episode", name: "Watch an episode", icon: "📺", price: 200 },
    { id: "gaming", name: "1 hour of gaming", icon: "🎮", price: 300 },
    { id: "cheat", name: "Cheat meal", icon: "🍕", price: 600 },
];

export const POTION_MS = 60 * 60 * 1000;

/** What a Random Box contains. Its expected value (at shop prices) stays below the 150 Gold price. */
export function rollRandomBox(r = Math.random()) {
    if (r < 0.6) return { kind: "gold", amount: 30 + Math.floor((r / 0.6) * 90) }; // 30–119
    if (r < 0.78) return { kind: "item", id: "potion" };
    if (r < 0.88) return { kind: "item", id: "key" };
    if (r < 0.96) return { kind: "item", id: "shield" };
    if (r < 0.98) return { kind: "item", id: "pardon" };
    return { kind: "ap", amount: 1 };
}
