import { RANKS, STREAK_MULT } from '@/data/index';

/**
 * Normalize a day-keyed log object from Firestore.
 * Firestore sometimes stores arrays as objects with numeric keys.
 * This converts { "2025-01-01": {0: {...}, 1: {...}} } back to
 *               { "2025-01-01": [{...}, {...}] }
 */
/**
 * Safely convert a value to an array.
 * Firestore stores JS arrays as objects with numeric keys — this handles that.
 */
export function toArr(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') return Object.values(v);
  return [];
}

export function normalizeDayLog(log) {
  if (!log || typeof log !== 'object') return {};
  const out = {};
  for (const key of Object.keys(log)) {
    let val = log[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      // Unwrap Firestore wrapper objects created during save
      // e.g. { entries: [...] }, { data: [...] }, { entry: "..." }, { events: [...] }, { sessions: [...] }
      const objKeys = Object.keys(val);
      if (objKeys.length === 1) {
        const wrapper = objKeys[0];
        if (['entries', 'data', 'events', 'sessions'].includes(wrapper)) {
          val = val[wrapper];
        }
      }
    }
    if (Array.isArray(val)) {
      out[key] = val;
    } else if (val && typeof val === 'object') {
      // Check if it looks like a Firestore-mangled array (numeric keys)
      const keys = Object.keys(val);
      if (keys.length > 0 && keys.every(k => !isNaN(k))) {
        out[key] = Object.values(val);
      } else {
        out[key] = val; // genuine object (e.g. workoutLog day entry)
      }
    } else {
      out[key] = val;
    }
  }
  return out;
}

// XP curve: gets progressively harder but never caps
export function xpForLevel(n) {
  if (n <= 1) return 0;
  if (n <= 50) return Math.floor(22 * Math.pow(n, 1.65));
  if (n <= 100) return Math.floor(30 * Math.pow(n, 1.7));
  if (n <= 200) return Math.floor(40 * Math.pow(n, 1.75));
  return Math.floor(50 * Math.pow(n, 1.8)); // keeps scaling forever
}

export function totalXpFor(lv) {
  let t = 0;
  for (let i = 2; i <= lv; i++) t += xpForLevel(i);
  return t;
}

// No level cap — infinite progression
export function getLevel(xp) {
  let lv = 1, used = 0;
  while (true) {
    const need = xpForLevel(lv + 1);
    if (need === 0 || used + need > xp) break;
    used += need;
    lv++;
    if (lv > 10000) break; // safety
  }
  return lv;
}

export function getLevelProg(xp) {
  const lv = getLevel(xp);
  const at = totalXpFor(lv);
  const need = xpForLevel(lv + 1);
  if (need === 0) return 1;
  return (xp - at) / need;
}

export function getRank(lv) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (lv >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
}

export function xpToNext(xp) {
  const lv = getLevel(xp);
  return xpForLevel(lv + 1) - (xp - totalXpFor(lv));
}

export function getStreakMult(s) {
  let m = 1;
  Object.entries(STREAK_MULT).forEach(([d, mult]) => {
    if (s >= parseInt(d)) m = mult;
  });
  return m;
}

export function calcBMI(w, h) {
  if (!w || !h) return null;
  return Math.round(w / ((h / 100) ** 2) * 10) / 10;
}

export function bmiCat(b) {
  if (!b) return "";
  if (b < 18.5) return "Underweight";
  if (b < 25) return "Normal";
  if (b < 30) return "Overweight";
  return "Obese";
}

export function bmiCol(b) {
  if (!b) return "#6b7280";
  if (b < 18.5) return "#60a5fa";
  if (b < 25) return "#22c55e";
  if (b < 30) return "#f59e0b";
  return "#ef4444";
}

export const today = () => new Date().toISOString().split("T")[0];
