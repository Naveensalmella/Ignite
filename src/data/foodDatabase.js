// ══════════════════════════════════════════════════
// IGNITE — Food Database + AI Nutrition Lookup
// Local: 137 Indian foods (instant, offline)
// AI: Groq estimates nutrition for ANY food worldwide
// ══════════════════════════════════════════════════

// ── LOCAL DATABASE (per 100g) ──
export const FOOD_DATABASE = [
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

export const FOOD_CATEGORIES = [...new Set(FOOD_DATABASE.map(f => f.category))];

// ── LOCAL SEARCH (instant) ──
export function searchFoods(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  return FOOD_DATABASE.filter(f =>
    f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
  ).slice(0, 20);
}

// ── AI NUTRITION LOOKUP (uses Groq — already configured) ──
let aiCache = {};

export async function searchFoodsAI(query) {
  if (!query || query.length < 3) return [];

  const cacheKey = query.toLowerCase().trim();
  if (aiCache[cacheKey]) return aiCache[cacheKey];

  const groqKey = process.env.REACT_APP_GROQ_API_KEY;
  const geminiKey = process.env.REACT_APP_GEMINI_API_KEY;

  if (!groqKey && !geminiKey) return [];

  try {
    let text = "";

    if (groqKey) {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a nutrition database. Return ONLY a JSON array of foods matching the query. Each item: {\"name\":\"Food Name\",\"cal\":number,\"protein\":number,\"carbs\":number,\"fat\":number,\"fiber\":number}. Values per 100g. Include Indian/regional variations if applicable. Return 3-5 items max. No markdown, no explanation, ONLY the JSON array." },
            { role: "user", content: `Nutrition per 100g for: ${query}` }
          ],
          max_tokens: 500, temperature: 0.3,
        }),
      });
      const d = await r.json();
      text = d.choices?.[0]?.message?.content || "";
    } else if (geminiKey) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `Return ONLY a JSON array of foods matching "${query}". Each item: {"name":"Food Name","cal":number,"protein":number,"carbs":number,"fat":number,"fiber":number}. Values per 100g. 3-5 items. No markdown.` }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.3 },
        }),
      });
      const d = await r.json();
      text = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    // Parse JSON from response
    const clean = text.replace(/```json|```/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const items = JSON.parse(match[0]);
    const results = items.map(item => ({
      name: item.name || query,
      emoji: "🍽️",
      cal: Math.round(item.cal || item.calories || 0),
      protein: Math.round((item.protein || 0) * 10) / 10,
      carbs: Math.round((item.carbs || item.carbohydrates || 0) * 10) / 10,
      fat: Math.round((item.fat || 0) * 10) / 10,
      fiber: Math.round((item.fiber || 0) * 10) / 10,
      category: "AI Lookup",
      source: "ai",
    }));

    aiCache[cacheKey] = results;
    return results;
  } catch (e) {
    console.warn("AI nutrition lookup error:", e);
    return [];
  }
}

// ── COMBINED SEARCH ──
export async function searchFoodsCombined(query) {
  if (!query || query.length < 2) return { local: [], api: [] };
  const local = searchFoods(query);
  if (local.length >= 5 || query.length < 3) return { local, api: [] };

  const api = await searchFoodsAI(query);
  const localNames = new Set(local.map(f => f.name.toLowerCase()));
  const uniqueApi = api.filter(f => !localNames.has(f.name.toLowerCase()));
  return { local, api: uniqueApi };
}

export function getFoodsByCategory(category) {
  return FOOD_DATABASE.filter(f => f.category === category);
}