// Offline "describe your meal" reader: turns text like
//   "2 rotis, 1 katori dal and a plate of rice with curd"
// into foods from our own database with gram amounts — no AI, no network.
import { searchFoods, normalizeWords } from "@/data/foodDatabase";

const NUMBER_WORDS = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, couple: 2, few: 3, dozen: 12, half: 0.5, quarter: 0.25,
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, aadha: 0.5, adha: 0.5,
};

// Generic size of each unit in grams (used when the food has no serving of that unit).
const UNITS = {
  g: { g: 1, weight: true }, gm: { g: 1, weight: true }, gms: { g: 1, weight: true }, gram: { g: 1, weight: true }, grams: { g: 1, weight: true },
  kg: { g: 1000, weight: true }, ml: { g: 1, weight: true }, l: { g: 1000, weight: true }, litre: { g: 1000, weight: true }, liter: { g: 1000, weight: true },
  cup: { g: 200 }, cups: { g: 200, as: "cup" }, katori: { g: 150 }, katoris: { g: 150, as: "katori" }, bowl: { g: 200 }, bowls: { g: 200, as: "bowl" },
  plate: { g: 250 }, plates: { g: 250, as: "plate" }, glass: { g: 250 }, glasses: { g: 250, as: "glass" }, mug: { g: 250, as: "glass" },
  tbsp: { g: 15 }, tablespoon: { g: 15, as: "tbsp" }, tablespoons: { g: 15, as: "tbsp" }, spoon: { g: 10, as: "tbsp" }, spoons: { g: 10, as: "tbsp" },
  tsp: { g: 5 }, teaspoon: { g: 5, as: "tsp" }, teaspoons: { g: 5, as: "tsp" },
  scoop: { g: 30 }, scoops: { g: 30, as: "scoop" }, slice: { g: 30 }, slices: { g: 30, as: "slice" },
  piece: { g: 0, as: "piece" }, pieces: { g: 0, as: "piece" }, pc: { g: 0, as: "piece" }, pcs: { g: 0, as: "piece" }, nos: { g: 0, as: "piece" },
  handful: { g: 30 }, handfuls: { g: 30, as: "handful" }, can: { g: 330 }, pack: { g: 50 }, packet: { g: 50, as: "pack" },
  serving: { g: 0, as: "serving" }, servings: { g: 0, as: "serving" }, portion: { g: 0, as: "serving" }, cube: { g: 20 }, cubes: { g: 20, as: "cube" },
};
const SIZES = { small: 0.7, medium: 1, large: 1.4, big: 1.4, mini: 0.5, full: 1, regular: 1 };
const FILLER = new Set(["of", "some", "little", "bit", "my", "the", "had", "ate", "i", "eaten", "drank", "having", "for", "breakfast", "lunch", "dinner", "snack", "today", "homemade", "home", "made"]);

// A sensible serving for foods that don't list one (mostly the generic USDA foods).
const CATEGORY_SERVING = {
  Fruits: ["piece", 150], Vegetables: ["cup", 100], Nuts: ["handful", 30], Dairy: ["cup", 240], Drinks: ["glass", 250], Grains: ["cup", 180],
  Legumes: ["cup", 170], "Fish & Seafood": ["piece", 100], "Non-Veg": ["piece", 100], Protein: ["piece", 50], "Fats, Sweets & Sauces": ["tbsp", 15],
  "Bakery & Snacks": ["piece", 50],
};
export const servingOf = (food) => (food.unit && food.unitG ? [food.unit, food.unitG] : CATEGORY_SERVING[food.category] || ["serving", 100]);

const num = (t) => {
  if (/^\d+(\.\d+)?$/.test(t)) return parseFloat(t);
  if (/^\d+\/\d+$/.test(t)) { const [a, b] = t.split("/").map(Number); return b ? a / b : null; }
  if (/^\d+(\.\d+)?x$/.test(t)) return parseFloat(t);
  return NUMBER_WORDS[t] ?? null;
};

function clean(text) {
  return String(text || "").toLowerCase()
    .replace(/½/g, " 0.5 ").replace(/¼/g, " 0.25 ").replace(/¾/g, " 0.75 ")
    .replace(/(\d)\s*(g|gm|gms|kg|ml|l)\b/g, "$1 $2")          // "200g" → "200 g"
    .replace(/(\d)\s*x\b/g, "$1x")
    .replace(/[^a-z0-9./%\s,;+&-]/g, " ");
}

const SPLIT = /\s*(?:,|;|\n|\+|&|\band\b|\bwith\b|\bplus\b|\balong with\b|\balso\b|\bthen\b)\s*/;

// A match must cover enough of the food's own name ("sauce" alone is not "Pasta (White Sauce)"),
// or be one of its other names ("roti" → Wheat Roti, "coke" → Soft Drink).
// Words too general to pick a dish on their own ("xyz sauce" must not become Marinara Sauce).
const WEAK = new Set(["sauce", "curry", "masala", "fry", "fried", "soup", "juice", "salad", "shake", "chip", "cake", "roll", "special", "plain", "green", "white", "red", "black", "sweet", "veg", "mix", "mixed", "dry"]);
function covers(food, phraseWords) {
  const has = (w) => phraseWords.some(p => p === w || (p.length >= 4 && w.startsWith(p)));
  if ((food.aka || []).some(a => { const aw = normalizeWords(a); return aw.length && aw.every(has); })) return true;
  const core = normalizeWords(food.name.replace(/\([^)]*\)/g, " "));
  const hit = core.filter(has);
  if (!core.length || hit.length * 2 < core.length) return false;
  return hit.length === core.length || hit.some(w => !WEAK.has(w));
}

/** Best food for a phrase: the longest run of words that matches something, so extra words are ignored. */
function matchFood(words) {
  for (let len = words.length; len >= 1; len--) {
    for (let start = 0; start + len <= words.length; start++) {
      const phrase = words.slice(start, start + len).join(" ");
      if (phrase.length < 2) continue;
      const pw = normalizeWords(phrase);
      const hits = searchFoods(phrase, 5).filter(f => covers(f, pw));
      if (hits.length) return { food: hits[0], alts: hits.slice(1, 3), used: phrase };
    }
  }
  return null;
}

function parseSegment(seg) {
  const tokens = seg.split(/\s+/).filter(Boolean);
  let qty = null, unit = null, size = 1;
  const rest = [];
  for (const t of tokens) {
    const n = num(t);
    if (n != null && qty == null && !(t === "a" && rest.length)) { qty = n; continue; }
    if (n != null && qty != null && n < 1 && Number.isInteger(qty)) { qty += n; continue; } // "1 1/2"
    if (UNITS[t] && !unit) { unit = UNITS[t].as || t; continue; }
    if (SIZES[t] && !unit) { size = SIZES[t]; continue; }
    if (FILLER.has(t) || t.length < 2) continue;
    rest.push(t);
  }
  const words = rest.join(" ").trim();
  if (!words) return null;
  const m = matchFood(rest);
  if (!m) return { unknown: seg.trim() };

  const food = m.food;
  const amount = qty ?? 1;
  const [servingUnit, servingG] = servingOf(food);
  let grams;
  const u = unit && UNITS[unit];
  if (u?.weight) grams = amount * u.g;                                   // "200 g rice"
  else if (!unit || unit === servingUnit || unit === "serving" || (unit === "piece" && servingUnit !== "g")) grams = amount * servingG * size;
  else grams = amount * (u?.g || servingG) * size;                         // "1 bowl rice" when rice is measured in cups
  grams = Math.max(1, Math.round(grams));
  return { food, grams, alts: m.alts, said: seg.trim(), unit: unit || servingUnit, qty: amount };
}

/** Parse a meal description. Returns { items, unknown } — items carry the food and grams eaten. */
export function parseMeal(text) {
  const items = [], unknown = [];
  for (const seg of clean(text).split(SPLIT)) {
    if (!seg || !seg.trim()) continue;
    const r = parseSegment(seg.trim());
    if (!r) continue;
    if (r.unknown) unknown.push(r.unknown);
    else items.push(r);
  }
  return { items, unknown };
}

/** A parsed item as a loggable food entry (nutrition scaled to the grams eaten). */
export function toEntry({ food, grams, qty, unit }) {
  const k = grams / 100;
  const r1 = (v) => Math.round((Number(v) || 0) * k * 10) / 10;
  const qtyLabel = qty && unit && !["g", "ml", "kg", "l"].includes(unit) ? `${+qty.toFixed(2)} ${unit}${qty > 1 && !unit.endsWith("s") ? "s" : ""}` : `${grams} ${["ml", "l"].includes(unit) ? "ml" : "g"}`;
  return {
    name: food.name, emoji: food.emoji || "🍽️", category: food.category, grams,
    cal: Math.round(food.cal * k), protein: r1(food.protein), carbs: r1(food.carbs), fat: r1(food.fat), fiber: r1(food.fiber),
    serving: qtyLabel, source: food.source === "USDA" ? "USDA" : "IGNITE",
  };
}

// Exposed for tests.
export const _internal = { clean, normalizeWords };
