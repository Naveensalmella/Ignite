// ══════════════════════════════════════════════════
// IGNITE — our own food database (per 100 g), searchable offline.
//   • the original 118 Indian foods (below)
//   • ~210 more Indian & everyday dishes (foodsIndian.js, typical home-style values)
//   • ~430 plain foods from USDA FoodData Central SR Legacy (foodsGeneric.json, public domain;
//     taken from the TempoLife dataset, CC-BY-4.0 — see README "Data sources")
// Each food may carry a typical serving (unit + unitG grams) and other names (aka).
// ══════════════════════════════════════════════════
import { INDIAN_EXTRA, BASE_SERVINGS, BASE_ALIASES } from './foodsIndian';
import GENERIC from './foodsGeneric.json';

// ── LOCAL DATABASE (per 100g) ──
const BASE_FOODS = [
  // Rice
  { name: "White Rice (Cooked)", emoji: "🍚", cal: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, category: "Rice" },
  { name: "Brown Rice (Cooked)", emoji: "🍚", cal: 112, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, category: "Rice" },
  { name: "Jeera Rice", emoji: "🍚", cal: 160, protein: 3, carbs: 26, fat: 5, fiber: 0.5, category: "Rice" },
  { name: "Lemon Rice", emoji: "🍋", cal: 170, protein: 3, carbs: 28, fat: 5.5, fiber: 0.6, category: "Rice" },
  { name: "Curd Rice", emoji: "🍚", cal: 140, protein: 4, carbs: 22, fat: 3.5, fiber: 0.3, category: "Rice" },
  { name: "Chicken Biryani", emoji: "🍗", cal: 180, protein: 12, carbs: 20, fat: 6, fiber: 0.5, category: "Rice" },
  { name: "Mutton Biryani", emoji: "🍖", cal: 195, protein: 13, carbs: 18, fat: 8, fiber: 0.5, category: "Rice" },
  { name: "Veg Biryani", emoji: "🥘", cal: 145, protein: 3.5, carbs: 22, fat: 4.5, fiber: 1.2, category: "Rice" },
  { name: "Hyderabadi Biryani", emoji: "🍗", cal: 190, protein: 12, carbs: 20, fat: 7, fiber: 0.5, category: "Rice" },
  { name: "Khichdi", emoji: "🍲", cal: 105, protein: 4, carbs: 18, fat: 1.5, fiber: 1.5, category: "Rice" },
  { name: "Pulao (Veg)", emoji: "🍚", cal: 150, protein: 3.5, carbs: 23, fat: 5, fiber: 1.0, category: "Rice" },
  // Bread
  { name: "Wheat Roti", emoji: "🫓", cal: 264, protein: 8.7, carbs: 50, fat: 3.7, fiber: 4.0, category: "Bread" },
  { name: "Paratha (Plain)", emoji: "🫓", cal: 320, protein: 8, carbs: 45, fat: 12, fiber: 3.5, category: "Bread" },
  { name: "Aloo Paratha", emoji: "🥔", cal: 280, protein: 6, carbs: 40, fat: 10, fiber: 2.5, category: "Bread" },
  { name: "Naan", emoji: "🫓", cal: 290, protein: 8, carbs: 48, fat: 7, fiber: 2.0, category: "Bread" },
  { name: "Garlic Naan", emoji: "🧄", cal: 310, protein: 8, carbs: 48, fat: 9, fiber: 2.0, category: "Bread" },
  { name: "Puri", emoji: "🫓", cal: 350, protein: 7, carbs: 40, fat: 18, fiber: 2.5, category: "Bread" },
  { name: "Bhatura", emoji: "🫓", cal: 380, protein: 7, carbs: 42, fat: 20, fiber: 1.5, category: "Bread" },
  { name: "Bajra Roti", emoji: "🫓", cal: 282, protein: 8.5, carbs: 52, fat: 4.5, fiber: 4.0, category: "Bread" },
  { name: "Jowar Roti", emoji: "🫓", cal: 270, protein: 8, carbs: 53, fat: 3.5, fiber: 4.5, category: "Bread" },
  { name: "Ragi Roti", emoji: "🫓", cal: 260, protein: 7, carbs: 50, fat: 3, fiber: 5.0, category: "Bread" },
  // Dal
  { name: "Toor Dal", emoji: "🍲", cal: 90, protein: 6.5, carbs: 14, fat: 0.5, fiber: 3.0, category: "Dal" },
  { name: "Moong Dal", emoji: "🍲", cal: 85, protein: 7, carbs: 12, fat: 0.4, fiber: 2.5, category: "Dal" },
  { name: "Chana Dal", emoji: "🍲", cal: 100, protein: 7, carbs: 15, fat: 1, fiber: 4.0, category: "Dal" },
  { name: "Masoor Dal", emoji: "🍲", cal: 88, protein: 7, carbs: 13, fat: 0.3, fiber: 3.5, category: "Dal" },
  { name: "Dal Tadka", emoji: "🍲", cal: 110, protein: 6, carbs: 14, fat: 3.5, fiber: 3.0, category: "Dal" },
  { name: "Dal Makhani", emoji: "🍲", cal: 140, protein: 6, carbs: 14, fat: 7, fiber: 3.0, category: "Dal" },
  { name: "Rajma", emoji: "🫘", cal: 105, protein: 7, carbs: 16, fat: 0.8, fiber: 5.0, category: "Dal" },
  { name: "Chole", emoji: "🫘", cal: 115, protein: 7, carbs: 17, fat: 2.5, fiber: 5.5, category: "Dal" },
  { name: "Sambar", emoji: "🍲", cal: 65, protein: 3.5, carbs: 9, fat: 1.5, fiber: 2.5, category: "Dal" },
  // South Indian
  { name: "Plain Dosa", emoji: "🫓", cal: 120, protein: 3, carbs: 18, fat: 3.5, fiber: 0.8, category: "South Indian" },
  { name: "Masala Dosa", emoji: "🫓", cal: 165, protein: 4, carbs: 24, fat: 6, fiber: 1.5, category: "South Indian" },
  { name: "Idli", emoji: "⚪", cal: 130, protein: 4, carbs: 24, fat: 0.5, fiber: 1.0, category: "South Indian" },
  { name: "Medu Vada", emoji: "🍩", cal: 290, protein: 8, carbs: 28, fat: 16, fiber: 2.0, category: "South Indian" },
  { name: "Uttapam", emoji: "🫓", cal: 155, protein: 4, carbs: 22, fat: 5, fiber: 1.5, category: "South Indian" },
  { name: "Upma", emoji: "🍚", cal: 125, protein: 3.5, carbs: 18, fat: 4, fiber: 1.5, category: "South Indian" },
  { name: "Pesarattu", emoji: "🫓", cal: 110, protein: 6, carbs: 14, fat: 3, fiber: 2.5, category: "South Indian" },
  { name: "Pongal", emoji: "🍚", cal: 135, protein: 4, carbs: 18, fat: 5, fiber: 0.8, category: "South Indian" },
  // Curry
  { name: "Palak Paneer", emoji: "🧀", cal: 140, protein: 8, carbs: 5, fat: 10, fiber: 2.0, category: "Curry" },
  { name: "Paneer Butter Masala", emoji: "🧀", cal: 200, protein: 10, carbs: 8, fat: 15, fiber: 1.0, category: "Curry" },
  { name: "Butter Chicken", emoji: "🍗", cal: 175, protein: 14, carbs: 6, fat: 11, fiber: 0.8, category: "Curry" },
  { name: "Chicken Curry", emoji: "🍗", cal: 155, protein: 16, carbs: 5, fat: 8, fiber: 1.0, category: "Curry" },
  { name: "Mutton Curry", emoji: "🍖", cal: 190, protein: 18, carbs: 5, fat: 11, fiber: 0.8, category: "Curry" },
  { name: "Fish Curry", emoji: "🐟", cal: 130, protein: 15, carbs: 4, fat: 6, fiber: 0.5, category: "Curry" },
  { name: "Egg Curry", emoji: "🥚", cal: 140, protein: 10, carbs: 5, fat: 9, fiber: 0.8, category: "Curry" },
  { name: "Aloo Gobi", emoji: "🥔", cal: 90, protein: 2.5, carbs: 12, fat: 3.5, fiber: 2.5, category: "Curry" },
  { name: "Mixed Veg Curry", emoji: "🥕", cal: 80, protein: 2.5, carbs: 10, fat: 3, fiber: 3.0, category: "Curry" },
  { name: "Malai Kofta", emoji: "🧀", cal: 225, protein: 7, carbs: 12, fat: 17, fiber: 1.5, category: "Curry" },
  { name: "Matar Paneer", emoji: "🧀", cal: 165, protein: 9, carbs: 10, fat: 10, fiber: 2.5, category: "Curry" },
  // Protein
  { name: "Chicken Breast", emoji: "🍗", cal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, category: "Protein" },
  { name: "Tandoori Chicken", emoji: "🍗", cal: 148, protein: 25, carbs: 2, fat: 4, fiber: 0.5, category: "Protein" },
  { name: "Egg (Boiled)", emoji: "🥚", cal: 155, protein: 13, carbs: 1, fat: 11, fiber: 0, category: "Protein" },
  { name: "Egg Omelette", emoji: "🍳", cal: 175, protein: 12, carbs: 1.5, fat: 13, fiber: 0, category: "Protein" },
  { name: "Paneer", emoji: "🧀", cal: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0, category: "Protein" },
  { name: "Tofu", emoji: "🧊", cal: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3, category: "Protein" },
  { name: "Fish (Rohu)", emoji: "🐟", cal: 97, protein: 17, carbs: 0, fat: 3, fiber: 0, category: "Protein" },
  { name: "Prawns", emoji: "🦐", cal: 99, protein: 24, carbs: 0, fat: 0.3, fiber: 0, category: "Protein" },
  { name: "Soya Chunks", emoji: "🫘", cal: 345, protein: 52, carbs: 33, fat: 0.5, fiber: 13, category: "Protein" },
  { name: "Whey Protein", emoji: "🥤", cal: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0, category: "Protein" },
  { name: "Grilled Chicken", emoji: "🍗", cal: 150, protein: 28, carbs: 0, fat: 4, fiber: 0, category: "Protein" },
  // Vegetables
  { name: "Spinach", emoji: "🥬", cal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, category: "Vegetables" },
  { name: "Broccoli", emoji: "🥦", cal: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, category: "Vegetables" },
  { name: "Carrot", emoji: "🥕", cal: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, category: "Vegetables" },
  { name: "Tomato", emoji: "🍅", cal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, category: "Vegetables" },
  { name: "Potato (Boiled)", emoji: "🥔", cal: 87, protein: 1.9, carbs: 20, fat: 0.1, fiber: 1.8, category: "Vegetables" },
  { name: "Sweet Potato", emoji: "🍠", cal: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3.0, category: "Vegetables" },
  { name: "Cucumber", emoji: "🥒", cal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, category: "Vegetables" },
  { name: "Beetroot", emoji: "🟣", cal: 43, protein: 1.6, carbs: 10, fat: 0.2, fiber: 2.8, category: "Vegetables" },
  { name: "Cauliflower", emoji: "🥦", cal: 25, protein: 1.9, carbs: 5, fat: 0.3, fiber: 2.0, category: "Vegetables" },
  { name: "Cabbage", emoji: "🥬", cal: 25, protein: 1.3, carbs: 6, fat: 0.1, fiber: 2.5, category: "Vegetables" },
  // Fruits
  { name: "Apple", emoji: "🍎", cal: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, category: "Fruits" },
  { name: "Banana", emoji: "🍌", cal: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, category: "Fruits" },
  { name: "Mango", emoji: "🥭", cal: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, category: "Fruits" },
  { name: "Orange", emoji: "🍊", cal: 43, protein: 0.9, carbs: 9, fat: 0.1, fiber: 2.4, category: "Fruits" },
  { name: "Watermelon", emoji: "🍉", cal: 30, protein: 0.6, carbs: 8, fat: 0.2, fiber: 0.4, category: "Fruits" },
  { name: "Grapes", emoji: "🍇", cal: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9, category: "Fruits" },
  { name: "Pomegranate", emoji: "🔴", cal: 83, protein: 1.7, carbs: 19, fat: 1.2, fiber: 4.0, category: "Fruits" },
  { name: "Guava", emoji: "🟢", cal: 68, protein: 2.6, carbs: 14, fat: 1, fiber: 5.4, category: "Fruits" },
  { name: "Papaya", emoji: "🟠", cal: 43, protein: 0.5, carbs: 11, fat: 0.3, fiber: 1.7, category: "Fruits" },
  { name: "Avocado", emoji: "🥑", cal: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, category: "Fruits" },
  { name: "Dates (Khajur)", emoji: "🟤", cal: 277, protein: 1.8, carbs: 75, fat: 0.2, fiber: 7, category: "Fruits" },
  // Dairy
  { name: "Milk (Full Fat)", emoji: "🥛", cal: 62, protein: 3.2, carbs: 5, fat: 3.3, fiber: 0, category: "Dairy" },
  { name: "Curd (Dahi)", emoji: "🫙", cal: 60, protein: 3.5, carbs: 5, fat: 3, fiber: 0, category: "Dairy" },
  { name: "Buttermilk", emoji: "🥛", cal: 25, protein: 1.5, carbs: 3, fat: 0.8, fiber: 0, category: "Dairy" },
  { name: "Lassi (Sweet)", emoji: "🥛", cal: 90, protein: 3, carbs: 14, fat: 2.5, fiber: 0, category: "Dairy" },
  { name: "Ghee", emoji: "🧈", cal: 900, protein: 0, carbs: 0, fat: 100, fiber: 0, category: "Dairy" },
  { name: "Cheese", emoji: "🧀", cal: 402, protein: 25, carbs: 1.3, fat: 33, fiber: 0, category: "Dairy" },
  // Nuts
  { name: "Almonds", emoji: "🥜", cal: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5, category: "Nuts" },
  { name: "Cashews", emoji: "🥜", cal: 553, protein: 18, carbs: 30, fat: 44, fiber: 3.3, category: "Nuts" },
  { name: "Walnuts", emoji: "🥜", cal: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7, category: "Nuts" },
  { name: "Peanuts", emoji: "🥜", cal: 567, protein: 26, carbs: 16, fat: 49, fiber: 8.5, category: "Nuts" },
  { name: "Peanut Butter", emoji: "🥜", cal: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, category: "Nuts" },
  { name: "Chia Seeds", emoji: "🌰", cal: 486, protein: 17, carbs: 42, fat: 31, fiber: 34, category: "Nuts" },
  // Snacks
  { name: "Samosa", emoji: "🔺", cal: 260, protein: 4, carbs: 28, fat: 14, fiber: 2.0, category: "Snacks" },
  { name: "Vada Pav", emoji: "🍔", cal: 290, protein: 6, carbs: 36, fat: 13, fiber: 2.0, category: "Snacks" },
  { name: "Pav Bhaji", emoji: "🍞", cal: 200, protein: 5, carbs: 28, fat: 8, fiber: 3.0, category: "Snacks" },
  { name: "Pakora", emoji: "🍘", cal: 280, protein: 5, carbs: 24, fat: 18, fiber: 2.0, category: "Snacks" },
  { name: "Poha", emoji: "🍚", cal: 130, protein: 2.5, carbs: 22, fat: 3.5, fiber: 1.0, category: "Snacks" },
  // Drinks
  { name: "Tea (With Milk)", emoji: "☕", cal: 38, protein: 1, carbs: 5, fat: 1.5, fiber: 0, category: "Drinks" },
  { name: "Coffee (With Milk)", emoji: "☕", cal: 45, protein: 1.5, carbs: 5, fat: 2, fiber: 0, category: "Drinks" },
  { name: "Green Tea", emoji: "🍵", cal: 2, protein: 0, carbs: 0.5, fat: 0, fiber: 0, category: "Drinks" },
  { name: "Coconut Water", emoji: "🥥", cal: 19, protein: 0.7, carbs: 4, fat: 0.2, fiber: 1.1, category: "Drinks" },
  { name: "Protein Shake", emoji: "🥤", cal: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0, category: "Drinks" },
  // Sweets
  { name: "Gulab Jamun", emoji: "🟤", cal: 380, protein: 5, carbs: 55, fat: 16, fiber: 0.5, category: "Sweets" },
  { name: "Jalebi", emoji: "🟡", cal: 390, protein: 3, carbs: 60, fat: 15, fiber: 0, category: "Sweets" },
  { name: "Kheer", emoji: "🍚", cal: 140, protein: 4, carbs: 22, fat: 4, fiber: 0.2, category: "Sweets" },
  { name: "Halwa", emoji: "🟠", cal: 300, protein: 4, carbs: 40, fat: 14, fiber: 1, category: "Sweets" },
  // Hyderabadi
  { name: "Haleem", emoji: "🍲", cal: 150, protein: 10, carbs: 14, fat: 6, fiber: 2.5, category: "Hyderabadi" },
  { name: "Irani Chai", emoji: "☕", cal: 80, protein: 2.5, carbs: 10, fat: 3, fiber: 0, category: "Hyderabadi" },
  { name: "Kebab (Seekh)", emoji: "🍢", cal: 210, protein: 18, carbs: 5, fat: 13, fiber: 0.5, category: "Hyderabadi" },
  { name: "Shawarma", emoji: "🌯", cal: 220, protein: 15, carbs: 18, fat: 10, fiber: 1.5, category: "Hyderabadi" },
  { name: "Nihari", emoji: "🍲", cal: 180, protein: 15, carbs: 6, fat: 11, fiber: 0.5, category: "Hyderabadi" },
  // Healthy
  { name: "Oats Porridge", emoji: "🥣", cal: 68, protein: 2.4, carbs: 12, fat: 1.4, fiber: 1.7, category: "Healthy" },
  { name: "Quinoa", emoji: "🍚", cal: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, category: "Healthy" },
  { name: "Greek Yogurt", emoji: "🫙", cal: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, category: "Healthy" },
  { name: "Muesli", emoji: "🥣", cal: 340, protein: 10, carbs: 56, fat: 8, fiber: 8, category: "Healthy" },
  { name: "Honey", emoji: "🍯", cal: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2, category: "Healthy" },
  { name: "Sprouts (Moong)", emoji: "🌱", cal: 30, protein: 3, carbs: 4, fat: 0.2, fiber: 1.8, category: "Healthy" },
];

const withServing = (f) => {
  const [unit, grams] = (BASE_SERVINGS[f.name] || "").split(":");
  return { ...f, ...(unit ? { unit, unitG: Number(grams) } : {}), ...(BASE_ALIASES[f.name] ? { aka: BASE_ALIASES[f.name] } : {}) };
};
const curated = [...BASE_FOODS.map(withServing), ...INDIAN_EXTRA];
const curatedNames = new Set(curated.map(f => f.name.toLowerCase()));
const generic = GENERIC
  .filter(([name]) => !curatedNames.has(name.toLowerCase()))
  .map(([name, emoji, cal, protein, carbs, fat, fiber, category]) => ({ name, emoji, cal, protein, carbs, fat, fiber, category, source: "USDA" }));

// The original foods stay first: meal plans look foods up by name and take the first match.
export const FOOD_DATABASE = [...curated, ...generic];
export const FOOD_COUNT = FOOD_DATABASE.length;

export const FOOD_CATEGORIES = [...new Set(FOOD_DATABASE.map(f => f.category))];

// ── LOCAL SEARCH (instant, offline) ──
// Common Indian/English alternative names, so "chapati", "dahi" or "anda" still match.
const SYNONYMS = {
  chapati: "roti", chapathi: "roti", dahi: "curd", yogurt: "curd", yoghurt: "curd",
  anda: "egg", eggs: "egg", murgh: "chicken", murg: "chicken", chawal: "rice", bhat: "rice", aloo: "potato",
  alu: "potato", gobi: "cauliflower", palak: "spinach", channa: "chole", chana: "chole", chickpea: "chole",
  rajmah: "rajma", daal: "dal", dhal: "dal", lentil: "dal", lentils: "dal", paratha: "paratha", parantha: "paratha",
  doodh: "milk", chai: "tea", kela: "banana", seb: "apple", aam: "mango", moong: "moong", mung: "moong",
  biriyani: "biryani", briyani: "biryani", panner: "paneer", idly: "idli", dosai: "dosa", sambhar: "sambar",
};
const normWord = (w) => SYNONYMS[w] || (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);
const words = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).map(normWord);

export const normalizeWords = words;

// Words of each food's name and other names, computed once.
let INDEX = null;
const index = () => INDEX || (INDEX = FOOD_DATABASE.map(f => ({
  f, name: f.name.toLowerCase(), cat: f.category.toLowerCase(),
  nameWords: words(f.name), akaWords: (f.aka || []).map(a => words(a)),
})));

export function searchFoods(query, max = 30) {
  const qWords = words(query || "");
  if (qWords.length === 0) return [];
  const qPhrase = qWords.join(" ");
  const scored = [];
  for (const it of index()) {
    let score = 0;
    for (const q of qWords) {
      if (it.nameWords.includes(q)) score += 3;
      else if (it.akaWords.some(a => a.includes(q))) score += 3;
      else if (it.nameWords.some(w => w.startsWith(q))) score += 2;
      else if (it.name.includes(q) || it.cat.includes(q)) score += 1;
      else { score = 0; break; } // every word must match something
    }
    if (score === 0) continue;
    if (it.akaWords.some(a => a.join(" ") === qPhrase) || it.nameWords.join(" ") === qPhrase) score += 4; // exact name / other name
    if (it.nameWords[0] === qWords[0]) score += 1;
    score -= it.nameWords.length * 0.05;                  // shorter (more generic) names first
    if (it.f.source === "USDA") score -= 0.5;             // our Indian dishes before generic ones
    scored.push([score, it.f]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, max).map(x => x[1]);
}

export function getFoodsByCategory(category) {
  return FOOD_DATABASE.filter(f => f.category === category);
}