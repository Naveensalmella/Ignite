// ══════════════════════════════════════════════════════
// IGNITE Meal Planner — Smart diet plan generator
// Uses FOOD_DATABASE to build plans hitting macro targets
// ══════════════════════════════════════════════════════

import { FOOD_DATABASE } from './foodDatabase';

// ── Diet Templates ──
export const DIET_TEMPLATES = [
    {
        id: "balanced_indian", name: "Balanced Indian Diet", icon: "🇮🇳", desc: "Traditional Indian meals, balanced macros",
        preference: "all", protPct: .25, carbPct: .45, fatPct: .30,
        breakfast: ["Idli", "Poha", "Upma", "Dosa", "Paratha", "Oats Porridge", "Bread Omelette"],
        lunch: ["Rice", "Roti", "Dal", "Rajma", "Chole", "Chicken Curry", "Paneer Butter Masala", "Sambar", "Curd Rice"],
        dinner: ["Roti", "Dal", "Palak Paneer", "Chicken Curry", "Fish Curry", "Mixed Veg", "Egg Curry"],
        snack: ["Banana", "Apple", "Sprouts", "Peanuts", "Buttermilk", "Green Tea", "Roasted Chana"],
    },
    {
        id: "muscle_nonveg", name: "Muscle Building (Non-Veg)", icon: "💪", desc: "High protein for muscle growth. Chicken, eggs, fish.",
        preference: "nonveg", protPct: .35, carbPct: .40, fatPct: .25,
        breakfast: ["Bread Omelette", "Egg Bhurji", "Oats Porridge", "Banana", "Boiled Eggs"],
        lunch: ["Rice", "Chicken Curry", "Chicken Biryani", "Dal", "Curd"],
        dinner: ["Roti", "Grilled Chicken", "Fish Curry", "Egg Curry", "Dal"],
        snack: ["Boiled Eggs", "Peanuts", "Banana", "Protein Shake", "Almonds", "Milk"],
    },
    {
        id: "muscle_veg", name: "Muscle Building (Vegetarian)", icon: "🌱💪", desc: "High protein vegetarian. Paneer, dal, soy.",
        preference: "veg", protPct: .30, carbPct: .45, fatPct: .25,
        breakfast: ["Paneer Paratha", "Moong Dal Chilla", "Poha", "Oats Porridge", "Sprouts"],
        lunch: ["Rice", "Rajma", "Chole", "Paneer Butter Masala", "Dal", "Curd"],
        dinner: ["Roti", "Palak Paneer", "Dal Makhani", "Mixed Veg", "Paneer Tikka"],
        snack: ["Peanuts", "Sprouts", "Paneer", "Almonds", "Milk", "Lassi", "Banana"],
    },
    {
        id: "fat_loss", name: "Fat Loss Diet", icon: "🔥", desc: "Caloric deficit, high protein, low carb. Burns fat.",
        preference: "all", protPct: .35, carbPct: .30, fatPct: .35,
        breakfast: ["Egg Bhurji", "Moong Dal Chilla", "Oats Porridge", "Sprouts", "Boiled Eggs"],
        lunch: ["Brown Rice", "Grilled Chicken", "Dal", "Salad", "Curd", "Chicken Soup"],
        dinner: ["Roti", "Dal", "Palak Paneer", "Fish Curry", "Salad", "Soup"],
        snack: ["Green Tea", "Almonds", "Cucumber", "Buttermilk", "Apple", "Sprouts"],
    },
    {
        id: "south_indian", name: "South Indian Diet", icon: "🍛", desc: "Authentic South Indian meals. Rice, sambar, dosa.",
        preference: "all", protPct: .20, carbPct: .50, fatPct: .30,
        breakfast: ["Idli", "Dosa", "Upma", "Pongal", "Medu Vada", "Pesarattu"],
        lunch: ["Rice", "Sambar", "Rasam", "Curd Rice", "Chicken Curry", "Avial", "Kootu"],
        dinner: ["Dosa", "Idli", "Appam", "Rice", "Sambar", "Rasam"],
        snack: ["Banana", "Coconut", "Buttermilk", "Murukku", "Filter Coffee", "Sundal"],
    },
    {
        id: "north_indian", name: "North Indian Diet", icon: "🫓", desc: "Roti, dal, sabzi — classic North Indian nutrition.",
        preference: "all", protPct: .22, carbPct: .48, fatPct: .30,
        breakfast: ["Paratha", "Poha", "Bread Omelette", "Chole Bhature", "Aloo Paratha"],
        lunch: ["Roti", "Rice", "Dal", "Rajma", "Chole", "Chicken Curry", "Paneer", "Raita"],
        dinner: ["Roti", "Dal", "Mixed Veg", "Palak Paneer", "Egg Curry", "Chicken"],
        snack: ["Lassi", "Chaat", "Samosa", "Peanuts", "Chai", "Banana"],
    },
    {
        id: "high_protein", name: "High Protein (Any Diet)", icon: "🥩", desc: "Maximum protein for recovery and growth.",
        preference: "all", protPct: .40, carbPct: .30, fatPct: .30,
        breakfast: ["Boiled Eggs", "Egg Bhurji", "Paneer Paratha", "Moong Dal Chilla", "Oats Porridge"],
        lunch: ["Chicken Biryani", "Rajma", "Dal", "Grilled Chicken", "Paneer", "Curd"],
        dinner: ["Fish Curry", "Chicken Curry", "Egg Curry", "Dal", "Paneer Tikka"],
        snack: ["Boiled Eggs", "Peanuts", "Paneer", "Almonds", "Protein Shake", "Sprouts"],
    },
    {
        id: "budget", name: "Student Budget Diet", icon: "💰", desc: "Affordable, nutritious meals for students. Under ₹200/day.",
        preference: "all", protPct: .22, carbPct: .50, fatPct: .28,
        breakfast: ["Poha", "Upma", "Bread Omelette", "Banana", "Oats Porridge", "Idli"],
        lunch: ["Rice", "Dal", "Curd", "Egg Curry", "Rajma", "Sabzi"],
        dinner: ["Roti", "Dal", "Rice", "Mixed Veg", "Egg Curry"],
        snack: ["Banana", "Peanuts", "Roasted Chana", "Chai", "Buttermilk"],
    },
    {
        id: "keto", name: "Low Carb / Keto", icon: "🥑", desc: "Very low carbs, high fat. Switches body to fat burning.",
        preference: "all", protPct: .25, carbPct: .10, fatPct: .65,
        breakfast: ["Egg Bhurji", "Boiled Eggs", "Paneer", "Almonds", "Coconut"],
        lunch: ["Grilled Chicken", "Paneer Tikka", "Salad", "Fish Curry", "Curd"],
        dinner: ["Chicken Curry", "Fish Curry", "Paneer", "Egg Curry", "Salad"],
        snack: ["Almonds", "Peanuts", "Coconut", "Cheese", "Walnuts", "Cashews"],
    },
];

// ── Find food in database by name (fuzzy match) ──
function findFood(name) {
    const lower = name.toLowerCase();
    return FOOD_DATABASE.find(f => f.name.toLowerCase() === lower) ||
        FOOD_DATABASE.find(f => f.name.toLowerCase().includes(lower)) ||
        FOOD_DATABASE.find(f => lower.includes(f.name.toLowerCase())) ||
        null;
}

// ── Generate a day's meal plan ──
export function generateDayPlan(template, targetCal, usedFoods = []) {
    const mealCalSplit = { Breakfast: 0.25, Lunch: 0.35, Dinner: 0.30, Snack: 0.10 };
    const plan = { Breakfast: [], Lunch: [], Dinner: [], Snack: [] };
    const usedNames = new Set(usedFoods);

    const meals = ["Breakfast", "Lunch", "Dinner", "Snack"];
    meals.forEach(meal => {
        const mealTarget = Math.round(targetCal * mealCalSplit[meal]);
        const pool = (template[meal.toLowerCase()] || [])
            .map(name => findFood(name))
            .filter(f => f && !usedNames.has(f.name));

        if (pool.length === 0) return;

        let currentCal = 0;
        const shuffled = [...pool].sort(() => Math.random() - 0.5);

        for (const food of shuffled) {
            if (currentCal >= mealTarget) break;
            // Calculate grams needed to fill remaining calories
            const remaining = mealTarget - currentCal;
            let grams = Math.round((remaining / food.cal) * 100);
            grams = Math.max(50, Math.min(300, Math.round(grams / 25) * 25)); // Round to nearest 25g, min 50, max 300

            const ratio = grams / 100;
            const scaled = {
                ...food,
                grams,
                cal: Math.round(food.cal * ratio),
                protein: Math.round(food.protein * ratio * 10) / 10,
                carbs: Math.round(food.carbs * ratio * 10) / 10,
                fat: Math.round(food.fat * ratio * 10) / 10,
                fiber: Math.round(food.fiber * ratio * 10) / 10,
                meal,
            };

            plan[meal].push(scaled);
            usedNames.add(food.name);
            currentCal += scaled.cal;

            if (plan[meal].length >= (meal === "Snack" ? 2 : 3)) break;
        }
    });

    return plan;
}

// ── Generate a weekly meal plan (7 days) ──
export function generateWeekPlan(template, targetCal) {
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const week = {};
    const usedThisWeek = [];

    dayNames.forEach(day => {
        const dayPlan = generateDayPlan(template, targetCal, usedThisWeek.slice(-10));
        week[day] = dayPlan;
        // Track used foods for variety
        Object.values(dayPlan).flat().forEach(f => usedThisWeek.push(f.name));
    });

    return week;
}

// ── Get plan totals ──
export function getPlanDayTotals(dayPlan) {
    const all = Object.values(dayPlan).flat();
    return {
        cal: all.reduce((s, f) => s + (f.cal || 0), 0),
        protein: all.reduce((s, f) => s + (f.protein || 0), 0),
        carbs: all.reduce((s, f) => s + (f.carbs || 0), 0),
        fat: all.reduce((s, f) => s + (f.fat || 0), 0),
        fiber: all.reduce((s, f) => s + (f.fiber || 0), 0),
        items: all.length,
    };
}

// ── Generate shopping list from week plan ──
export function getShoppingList(weekPlan) {
    const items = {};
    Object.values(weekPlan).forEach(dayPlan => {
        Object.values(dayPlan).flat().forEach(food => {
            const key = food.name;
            if (items[key]) {
                items[key].grams += food.grams || 100;
                items[key].count += 1;
            } else {
                items[key] = { name: food.name, emoji: food.emoji, grams: food.grams || 100, count: 1, category: food.category };
            }
        });
    });
    return Object.values(items).sort((a, b) => b.count - a.count);
}

// ── Get swap alternatives (same meal, similar calories) ──
export function getSwapOptions(food, mealType, template) {
    const pool = (template[mealType.toLowerCase()] || [])
        .map(name => findFood(name))
        .filter(f => f && f.name !== food.name);

    return pool
        .map(f => ({
            ...f,
            calDiff: Math.abs(f.cal - food.cal),
        }))
        .sort((a, b) => a.calDiff - b.calDiff)
        .slice(0, 4);
}