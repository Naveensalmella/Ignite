// XP milestones (celebrated with an overlay). Kept tiny: the store imports it.
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

