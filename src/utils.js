import { RANKS, STREAK_MULT } from '@/data/index';

/**
 * Safely convert a value to an array.
 * Firestore stores JS arrays as objects with numeric keys — this handles that.
 */
export function toArr(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') return Object.values(v);
  return [];
}

// Habit ids completed on a day. habitLog[date] is normally { habitId: true|false },
// but older data stored an array of ids (possibly as a numeric-key object).
export function habitDoneIds(day) {
  if (!day) return [];
  if (Array.isArray(day)) return day.filter(Boolean);
  if (typeof day === 'object') {
    const keys = Object.keys(day);
    if (keys.length > 0 && keys.every(k => !isNaN(k))) return Object.values(day).filter(v => typeof v === 'string');
    return keys.filter(k => day[k] === true);
  }
  return [];
}

/**
 * Normalize a day-keyed log object from Firestore.
 * Firestore sometimes stores arrays as objects with numeric keys.
 * This converts { "2025-01-01": {0: {...}, 1: {...}} } back to
 *               { "2025-01-01": [{...}, {...}] }
 */
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

// XP curve: one smooth formula — gets progressively harder but never caps.
// (It used to switch to steeper formulas at Lv 51/101/201, a +71% jump in one level; levels
// up to 50 cost exactly what they did, higher levels cost less, so nobody loses a level.)
export function xpForLevel(n) {
  if (n <= 1) return 0;
  return Math.floor(22 * Math.pow(n, 1.65));
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

// ── Date keys ──
// All day-keyed logs use the user's LOCAL calendar date (YYYY-MM-DD).
// toISOString() is UTC and shifts the day for anyone not on UTC
// (e.g. 00:00–05:30 in India was logged as "yesterday").
export function dateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Parse a YYYY-MM-DD key as a LOCAL date (new Date("YYYY-MM-DD") parses as UTC).
export function parseDateKey(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(key || "");
  if (!m) return new Date(key);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

// Date key `n` days before/after `from` (negative = past).
export function addDays(n, from = new Date()) {
  const d = from instanceof Date ? new Date(from) : parseDateKey(from);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export const today = () => dateKey();
