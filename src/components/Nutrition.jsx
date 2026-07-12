import { useState, useMemo } from 'react';
import { XP, FOOD_DB } from '../data';
import { calcBMI, today } from '../utils';

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];
const WATER_GOAL = 8;

// ── DIET PLAN GENERATOR ──
function generateMealPlan(profile) {
  const w = parseFloat(profile.weight) || 70;
  const h = parseFloat(profile.height) || 170;
  const age = parseInt(profile.age) || 25;
  const gender = profile.gender || "male";
  const goal = profile.goal || "fit";

  // BMR (Mifflin-St Jeor)
  let bmr = gender === "female"
    ? 10 * w + 6.25 * h - 5 * age - 161
    : 10 * w + 6.25 * h - 5 * age + 5;

  const actMult = profile.fitnessLevel === "beginner" ? 1.375 : profile.fitnessLevel === "advanced" ? 1.725 : 1.55;
  let tdee = Math.round(bmr * actMult);

  let targetCal = tdee;
  if (goal === "lose") targetCal = Math.round(tdee * 0.8);
  else if (goal === "muscle") targetCal = Math.round(tdee * 1.15);

  // Macro split based on goal
  let proteinPct = goal === "muscle" ? 0.30 : goal === "lose" ? 0.35 : 0.25;
  let carbPct = goal === "lose" ? 0.35 : goal === "muscle" ? 0.40 : 0.45;
  let fatPct = 1 - proteinPct - carbPct;

  const proteinG = Math.round((targetCal * proteinPct) / 4);
  const carbG = Math.round((targetCal * carbPct) / 4);
  const fatG = Math.round((targetCal * fatPct) / 9);

  // Meal distribution
  const mealSplit = { Breakfast: 0.25, Lunch: 0.35, Dinner: 0.30, Snack: 0.10 };

  // Generate meal suggestions from FOOD_DB
  const meals = {};
  MEALS.forEach(meal => {
    const calTarget = Math.round(targetCal * mealSplit[meal]);
    let items = [];
    if (meal === "Breakfast") {
      items = FOOD_DB.filter(f => ["Grains", "Dairy", "Fruits"].includes(f.category)).sort(() => Math.random() - 0.5).slice(0, 3);
    } else if (meal === "Lunch" || meal === "Dinner") {
      const protein = FOOD_DB.filter(f => f.category === "Protein").sort(() => Math.random() - 0.5)[0];
      const grain = FOOD_DB.filter(f => f.category === "Grains").sort(() => Math.random() - 0.5)[0];
      const veg = FOOD_DB.filter(f => f.category === "Vegetables").sort(() => Math.random() - 0.5)[0];
      items = [protein, grain, veg].filter(Boolean);
    } else {
      items = FOOD_DB.filter(f => ["Fruits", "Nuts", "Dairy"].includes(f.category)).sort(() => Math.random() - 0.5).slice(0, 2);
    }
    meals[meal] = { calTarget, items };
  });

  return { tdee, targetCal, proteinG, carbG, fatG, meals, goal };
}

export default function Nutrition({ foodLog, setFoodLog, addXP, profile }) {
  const d = today();
  const todayLog = foodLog[d] || [];
  const todayWater = foodLog[`water_${d}`] || 0;
  const [tab, setTab] = useState("log"); // log | plan | history
  const [selMeal, setSelMeal] = useState("Breakfast");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState("");

  const dietPlan = useMemo(() => generateMealPlan(profile || {}), [profile]);

  const todayCal = todayLog.reduce((s, f) => s + (f.cal || 0), 0);
  const todayProtein = todayLog.reduce((s, f) => s + (f.protein || 0), 0);
  const todayCarbs = todayLog.reduce((s, f) => s + (f.carbs || 0), 0);
  const todayFat = todayLog.reduce((s, f) => s + (f.fat || 0), 0);

  const filtered = FOOD_DB.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase()));
  const categories = [...new Set(FOOD_DB.map(f => f.category))];

  const addFood = (food) => {
    setFoodLog(p => ({ ...p, [d]: [...(p[d] || []), { ...food, meal: selMeal, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }] }));
    addXP(XP.food, "Food logged");
  };

  const addCustomFood = () => {
    if (!customName.trim() || !customCal) return;
    addFood({ name: customName.trim(), emoji: "🍽️", cal: parseInt(customCal), protein: 0, carbs: 0, fat: 0, category: "Custom" });
    setCustomName(""); setCustomCal(""); setShowAdd(false);
  };

  const removeFood = (idx) => setFoodLog(p => ({ ...p, [d]: (p[d] || []).filter((_, i) => i !== idx) }));
  const addWater = () => setFoodLog(p => ({ ...p, [`water_${d}`]: (p[`water_${d}`] || 0) + 1 }));

  // History
  const historyDates = Object.keys(foodLog).filter(k => !k.startsWith("water_") && Array.isArray(foodLog[k]) && foodLog[k].length > 0).sort((a, b) => b.localeCompare(a));

  return (<div>
    {/* Tabs */}
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
      {[["log", "🍎 Log Food"], ["plan", "📋 Diet Plan"], ["history", "📅 History"]].map(([k, l]) => (
        <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ padding: "8px 16px" }}>{l}</span>
      ))}
    </div>

    {/* ══ LOG TAB ══ */}
    {tab === "log" && (<div>
      {/* Today's Summary */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div className="sl" style={{ margin: 0 }}>Today's Nutrition</div>
          <span style={{ fontSize: 12, color: todayCal > 0 ? "#10b981" : "#6b7280", fontWeight: 600 }}>{todayCal} / {dietPlan.targetCal} cal</span>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,.04)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ height: "100%", width: `${Math.min(100, (todayCal / dietPlan.targetCal) * 100)}%`, background: todayCal > dietPlan.targetCal ? "#ef4444" : "linear-gradient(90deg,#10b981,#06b6d4)", borderRadius: 4, transition: "width .5s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", fontSize: 12 }}>
          <div style={{ textAlign: "center" }}><div style={{ fontWeight: 700, color: "#ef4444" }}>{todayProtein}g</div><div style={{ color: "#6b7280", fontSize: 10 }}>Protein</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontWeight: 700, color: "#f59e0b" }}>{todayCarbs}g</div><div style={{ color: "#6b7280", fontSize: 10 }}>Carbs</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontWeight: 700, color: "#06b6d4" }}>{todayFat}g</div><div style={{ color: "#6b7280", fontSize: 10 }}>Fat</div></div>
        </div>
      </div>

      {/* Water */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><span style={{ fontSize: 16, marginRight: 6 }}>💧</span><span style={{ fontWeight: 600 }}>{todayWater}/{WATER_GOAL} glasses</span></div>
          <button className="bg" onClick={addWater} style={{ padding: "6px 16px" }}>+ Water</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>{Array.from({ length: WATER_GOAL }, (_, i) => (<div key={i} style={{ flex: 1, height: 24, borderRadius: 4, background: i < todayWater ? "rgba(6,182,212,.2)" : "rgba(255,255,255,.03)", border: i < todayWater ? "1px solid rgba(6,182,212,.3)" : "1px solid rgba(255,255,255,.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: i < todayWater ? "#06b6d4" : "#4b5563" }}>{i < todayWater ? "💧" : ""}</div>))}</div>
      </div>

      {/* Meal Tabs + Food Picker */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>{MEALS.map(m => { const c = todayLog.filter(f => f.meal === m).length; return <span key={m} className={`chip ${selMeal === m ? "chip-a" : "chip-i"}`} onClick={() => setSelMeal(m)}>{m} {c > 0 ? `(${c})` : ""}</span>; })}</div>

      <input className="inp" placeholder="Search foods..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 10 }} />

      {/* Food Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 12, maxHeight: 250, overflowY: "auto" }}>
        {(search ? filtered : FOOD_DB).slice(0, 24).map(f => (
          <div key={f.id} className="fc" onClick={() => addFood(f)}>
            <div style={{ fontSize: 22 }}>{f.emoji}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#e5e7eb", marginTop: 4 }}>{f.name}</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>{f.cal} cal</div>
          </div>
        ))}
      </div>

      <span onClick={() => setShowAdd(!showAdd)} style={{ fontSize: 12, color: "#10b981", cursor: "pointer" }}>{showAdd ? "Cancel" : "+ Custom food"}</span>
      {showAdd && <div style={{ display: "flex", gap: 8, marginTop: 8 }}><input className="inp" placeholder="Food name" value={customName} onChange={e => setCustomName(e.target.value)} style={{ flex: 1 }} /><input className="inp" type="number" placeholder="Cal" value={customCal} onChange={e => setCustomCal(e.target.value)} style={{ width: 80 }} /><button className="bp" onClick={addCustomFood} style={{ padding: "10px 16px" }}>+</button></div>}

      {/* Today's logged foods */}
      {todayLog.length > 0 && <div className="gs" style={{ marginTop: 14 }}><div className="sl">Logged Today · {todayLog.length} items</div>{todayLog.map((f, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><span>{f.emoji}</span><div><div style={{ fontSize: 13 }}>{f.name}</div><div style={{ fontSize: 10, color: "#6b7280" }}>{f.meal} {f.time ? `· ${f.time}` : ""}</div></div></div><div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontSize: 12, color: "#f59e0b" }}>{f.cal}cal</span><span onClick={() => removeFood(i)} style={{ cursor: "pointer", color: "#4b5563" }}>×</span></div></div>))}</div>}
    </div>)}

    {/* ══ DIET PLAN TAB ══ */}
    {tab === "plan" && (<div>
      <div className="gs" style={{ marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 2 }}>YOUR DAILY TARGET</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{dietPlan.targetCal} cal</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>TDEE: {dietPlan.tdee} cal · Goal: {dietPlan.goal === "lose" ? "Fat Loss (-20%)" : dietPlan.goal === "muscle" ? "Muscle Gain (+15%)" : "Maintain"}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
          <div><div style={{ fontSize: 18, fontWeight: 800, color: "#ef4444" }}>{dietPlan.proteinG}g</div><div style={{ fontSize: 10, color: "#6b7280" }}>Protein</div></div>
          <div><div style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b" }}>{dietPlan.carbG}g</div><div style={{ fontSize: 10, color: "#6b7280" }}>Carbs</div></div>
          <div><div style={{ fontSize: 18, fontWeight: 800, color: "#06b6d4" }}>{dietPlan.fatG}g</div><div style={{ fontSize: 10, color: "#6b7280" }}>Fat</div></div>
        </div>
      </div>

      {MEALS.map(meal => {
        const plan = dietPlan.meals[meal];
        return (<div key={meal} className="gs" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div className="sl" style={{ margin: 0 }}>{meal}</div>
            <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>~{plan.calTarget} cal</span>
          </div>
          {plan.items.map((f, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>{f.emoji}</span>
                <div><div style={{ fontSize: 14, fontWeight: 500 }}>{f.name}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{f.category} · P:{f.protein}g C:{f.carbs}g F:{f.fat}g</div></div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>{f.cal}cal</span>
                <button className="bg" onClick={() => { setSelMeal(meal); addFood(f); setTab("log"); }} style={{ padding: "4px 10px", fontSize: 11 }}>+ Log</button>
              </div>
            </div>
          ))}
        </div>);
      })}
      <p style={{ fontSize: 12, color: "#4b5563", textAlign: "center", marginTop: 8 }}>Suggestions based on your profile. Refresh page for different options.</p>
    </div>)}

    {/* ══ HISTORY TAB ══ */}
    {tab === "history" && (<div>
      <div className="gs" style={{ marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{historyDates.length} Days Logged</div>
      </div>
      {historyDates.length === 0 && <div style={{ textAlign: "center", color: "#6b7280", padding: "20px 0" }}>No food history yet. Start logging today!</div>}
      {historyDates.slice(0, 20).map(date => {
        const items = foodLog[date] || [];
        const cal = items.reduce((s, f) => s + (f.cal || 0), 0);
        const water = foodLog[`water_${date}`] || 0;
        return (<div key={date} className="gc" style={{ marginBottom: 8, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div><div style={{ fontWeight: 600 }}>{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{items.length} items · 💧{water}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>{cal} cal</div></div>
          </div>
        </div>);
      })}
    </div>)}
  </div>);
}
