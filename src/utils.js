import { RANKS, STREAK_MULT } from './data';

export function xpForLevel(n) { return n <= 1 ? 0 : Math.floor(22 * Math.pow(n, 1.65)); }
export function totalXpFor(lv) { let t = 0; for (let i = 2; i <= lv; i++) t += xpForLevel(i); return t; }
export function getLevel(xp) { let lv = 1, used = 0; while (lv < 100) { const need = xpForLevel(lv + 1); if (used + need > xp) break; used += need; lv++; } return lv; }
export function getLevelProg(xp) { const lv = getLevel(xp); if (lv >= 100) return 1; const at = totalXpFor(lv); return (xp - at) / xpForLevel(lv + 1); }
export function getRank(lv) { for (let i = RANKS.length - 1; i >= 0; i--) if (lv >= RANKS[i].min) return RANKS[i]; return RANKS[0]; }
export function xpToNext(xp) { const lv = getLevel(xp); if (lv >= 100) return 0; return xpForLevel(lv + 1) - (xp - totalXpFor(lv)); }
export function getStreakMult(s) { let m = 1; Object.entries(STREAK_MULT).forEach(([d, mult]) => { if (s >= parseInt(d)) m = mult; }); return m; }
export function calcBMI(w, h) { if (!w || !h) return null; return Math.round(w / ((h / 100) ** 2) * 10) / 10; }
export function bmiCat(b) { if (!b) return ""; if (b < 18.5) return "Underweight"; if (b < 25) return "Normal"; if (b < 30) return "Overweight"; return "Obese"; }
export function bmiCol(b) { if (!b) return "#6b7280"; if (b < 18.5) return "#60a5fa"; if (b < 25) return "#22c55e"; if (b < 30) return "#f59e0b"; return "#ef4444"; }
export const today = () => new Date().toISOString().split("T")[0];
