// Daily login bonus: escalating XP for consecutive days (claimed on Home).
import { today, addDays } from '@/utils';

export function getLoginBonus(loginData) {
    const d = today();
    if (loginData?.lastClaim === d) return { claimed: true, streak: loginData.streak || 1, reward: 0 };

    const yd = addDays(-1, d);
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

