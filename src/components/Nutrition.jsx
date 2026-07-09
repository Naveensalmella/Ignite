import { useState, useMemo } from 'react';
import { XP } from '../data';
import { today } from '../utils';
import foodDatabase, { SERVING_PRESETS } from '../data/foodDatabase';

// Smart meal default based on time of day
function defaultMeal() {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 19) return "dinner";
  return "snack";
}

const MEALS = [
  { key: "breakfast", label: "Breakfast", icon: "🌅", time: "6 AM - 11 AM" },
  { key: "lunch", label: "Lunch", icon: "☀️", time: "11 AM - 3 PM" },
  { key: "dinner", label: "Dinner", icon: "🌙", time: "6 PM - 10 PM" },
  { key: "snack", label: "Snack", icon: "🍪", time: "Anytime" },
];

const MACRO_COLORS = { cal: "#ef4444", protein: "#10b981", carbs: "#f59e0b", fat: "#f97316", fiber: "#8b5cf6" };

const CAT_COLORS = {
  Grains: "#f59e0b", Protein: "#ef4444", Fruit: "#22c55e", Vegetable: "#10b981",
  Dairy: "#60a5fa", Lentils: "#f97316", Nuts: "#eab308", Beverage: "#06b6d4",
  Snack: "#f43f5e", Sweet: "#ec4899", Oil: "#fbbf24", Condiment: "#6b7280",
  "Main Dish": "#8b5cf6", Soup: "#14b8a6", Custom: "#6b7280",
};

export default function Nutrition({ foodLog, setFoodLog, addXP, profile }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [grams, setGrams] = useState(100);
  const [customGrams, setCustomGrams] = useState("");
  const [meal, setMeal] = useState(defaultMeal());
  const [showHistory, setShowHistory] = useState(false);
  const [historyDate, setHistoryDate] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState({ name: "", cal: "", protein: "", carbs: "", fat: "", fiber: "", grams: "" });
  const [showWeekly, setShowWeekly] = useState(false);
  const [view, setView] = useState("log"); // log | add

  const d = today();
  const todayLog = foodLog[d] || [];
  const waterKey = `water_${d}`;
  const waterCount = foodLog[waterKey] || 0;

  // ── CALORIE GOAL from profile ──
  const calorieGoal = useMemo(() => {
    const w = parseFloat(profile?.weight);
    const h = parseFloat(profile?.height);
    const age = parseInt(profile?.age) || 22;
    if (!w || !h) return 2000;
    // Mifflin-St Jeor (default male, user can set gender in profile)
    const gender = profile?.gender || "male";
    const bmr = gender === "female"
      ? (10 * w) + (6.25 * h) - (5 * age) - 161
      : (10 * w) + (6.25 * h) - (5 * age) + 5;
    const activity = parseFloat(profile?.activityLevel) || 1.55;
    const tdee = Math.round(bmr * activity);
    const goalAdj = profile?.nutritionGoal === "lose" ? -500 : profile?.nutritionGoal === "gain" ? 300 : 0;
    return Math.round(tdee + goalAdj);
  }, [profile]);

  const macroGoals = useMemo(() => {
    const p = Math.round(calorieGoal * 0.3 / 4);
    const c = Math.round(calorieGoal * 0.45 / 4);
    const f = Math.round(calorieGoal * 0.25 / 9);
    return { cal: calorieGoal, protein: p, carbs: c, fat: f, fiber: 30 };
  }, [calorieGoal]);

  // ── SEARCH ──
  const results = search.length >= 2
    ? foodDatabase.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  // ── FREQUENTLY EATEN ──
  const frequent = useMemo(() => {
    const freq = {};
    Object.values(foodLog).forEach(entries => {
      if (!Array.isArray(entries)) return;
      entries.forEach(f => {
        if (!f.name) return;
        if (!freq[f.name]) freq[f.name] = { count: 0, last: f };
        freq[f.name].count++;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([name, data]) => ({ name, count: data.count, ...data.last }));
  }, [foodLog]);

  // ── CALC HELPERS ──
  const calcNutrition = (food, g) => ({
    cal: Math.round(food.cal * g / 100),
    protein: Math.round(food.protein * g / 100 * 10) / 10,
    carbs: Math.round(food.carbs * g / 100 * 10) / 10,
    fat: Math.round(food.fat * g / 100 * 10) / 10,
    fiber: Math.round(food.fiber * g / 100 * 10) / 10,
  });
  const preview = selected ? calcNutrition(selected, grams) : null;

  const totals = (log) => (Array.isArray(log) ? log : []).reduce((a, f) => ({
    cal: a.cal + (f.cal || 0), protein: a.protein + (f.protein || 0),
    carbs: a.carbs + (f.carbs || 0), fat: a.fat + (f.fat || 0), fiber: a.fiber + (f.fiber || 0),
  }), { cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  const todayTotals = totals(todayLog);
  const calPct = Math.min(100, Math.round((todayTotals.cal / macroGoals.cal) * 100));

  // ── ADD FOOD ──
  const addFood = () => {
    if (!selected) return;
    const nutr = calcNutrition(selected, grams);
    const entry = {
      id: Date.now(), name: selected.name, cat: selected.cat, grams, meal, ...nutr,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      perHundred: { cal: selected.cal, protein: selected.protein, carbs: selected.carbs, fat: selected.fat, fiber: selected.fiber },
    };
    setFoodLog(p => ({ ...p, [d]: [...(p[d] || []), entry] }));
    addXP(XP.food, "Food logged");
    setSelected(null); setSearch(""); setGrams(100); setCustomGrams(""); setView("log");
  };

  const addManual = () => {
    if (!manual.name || !manual.cal) return;
    const entry = {
      id: Date.now(), name: manual.name, cat: "Custom", grams: parseFloat(manual.grams) || 0, meal,
      cal: parseFloat(manual.cal) || 0, protein: parseFloat(manual.protein) || 0, carbs: parseFloat(manual.carbs) || 0,
      fat: parseFloat(manual.fat) || 0, fiber: parseFloat(manual.fiber) || 0,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setFoodLog(p => ({ ...p, [d]: [...(p[d] || []), entry] }));
    addXP(XP.food, "Food logged");
    setManual({ name: "", cal: "", protein: "", carbs: "", fat: "", fiber: "", grams: "" });
    setManualMode(false); setView("log");
  };

  const quickAdd = (f) => {
    const dbFood = foodDatabase.find(db => db.name === f.name);
    if (dbFood) {
      setSelected(dbFood); setGrams(f.grams || 100); setMeal(defaultMeal()); setView("add");
    } else {
      // Re-add from history
      const entry = {
        id: Date.now(), name: f.name, cat: f.cat || "Custom", grams: f.grams || 100, meal: defaultMeal(),
        cal: f.cal || 0, protein: f.protein || 0, carbs: f.carbs || 0, fat: f.fat || 0, fiber: f.fiber || 0,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setFoodLog(p => ({ ...p, [d]: [...(p[d] || []), entry] }));
      addXP(XP.food, "Food logged");
    }
  };

  const removeFood = (id) => setFoodLog(p => ({ ...p, [d]: (p[d] || []).filter(f => f.id !== id) }));

  // ── WATER ──
  const addWater = () => setFoodLog(p => ({ ...p, [waterKey]: (p[waterKey] || 0) + 1 }));
  const removeWater = () => setFoodLog(p => ({ ...p, [waterKey]: Math.max(0, (p[waterKey] || 0) - 1) }));
  const waterGoal = 8;

  // ── WEEKLY DATA ──
  const weekData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const ds = dt.toISOString().split("T")[0];
      const log = foodLog[ds] || [];
      const t = totals(log);
      const label = dt.toLocaleDateString('en', { weekday: 'short' });
      const water = foodLog[`water_${ds}`] || 0;
      days.push({ date: ds, label, ...t, items: log.length, water });
    }
    return days;
  }, [foodLog]);
  const weekMaxCal = Math.max(macroGoals.cal, ...weekData.map(d => d.cal));

  // ── HISTORY ──
  const historyDates = Object.keys(foodLog)
    .filter(k => !k.startsWith("water_") && k !== d && Array.isArray(foodLog[k]) && foodLog[k].length > 0)
    .sort((a, b) => b.localeCompare(a));

  // ── RENDER ──
  return (
    <div>
      {/* ══ DAILY SUMMARY ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          {/* Calorie Ring */}
          <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
            <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={calPct >= 100 ? "#ef4444" : "#10b981"} strokeWidth="8"
                strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - calPct / 100)}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{Math.round(todayTotals.cal)}</div>
              <div style={{ fontSize: 9, color: "#6b7280" }}>/ {macroGoals.cal}</div>
            </div>
          </div>

          {/* Macros */}
          <div style={{ flex: 1, minWidth: 200 }}>
            {[["Protein", "protein", "g"], ["Carbs", "carbs", "g"], ["Fat", "fat", "g"], ["Fiber", "fiber", "g"]].map(([label, key, unit]) => (
              <div key={key} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: MACRO_COLORS[key], fontWeight: 600 }}>{label}</span>
                  <span style={{ color: "#6b7280" }}>{Math.round(todayTotals[key])}{unit} / {macroGoals[key]}{unit}</span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,.04)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (todayTotals[key] / macroGoals[key]) * 100)}%`, background: MACRO_COLORS[key], borderRadius: 3, transition: "width .5s" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Water */}
          <div style={{ textAlign: "center", minWidth: 80 }}>
            <div style={{ fontSize: 9, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1, marginBottom: 4 }}>WATER</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <span onClick={removeWater} style={{ cursor: "pointer", color: "#6b7280", fontSize: 18, userSelect: "none", width: 24, textAlign: "center" }}>−</span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#06b6d4", fontFamily: "Rajdhani,sans-serif" }}>{waterCount}</div>
                <div style={{ fontSize: 9, color: "#4b5563" }}>/ {waterGoal} 🥛</div>
              </div>
              <span onClick={addWater} style={{ cursor: "pointer", color: "#06b6d4", fontSize: 18, userSelect: "none", width: 24, textAlign: "center", fontWeight: 700 }}>+</span>
            </div>
            <div style={{ display: "flex", gap: 2, justifyContent: "center", marginTop: 4 }}>
              {Array.from({ length: waterGoal }).map((_, i) => (
                <div key={i} style={{ width: 6, height: 12, borderRadius: 2, background: i < waterCount ? "#06b6d4" : "rgba(255,255,255,.06)", transition: "background .2s" }} />
              ))}
            </div>
          </div>
        </div>

        {/* Calorie insight */}
        <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280", textAlign: "center" }}>
          {todayTotals.cal === 0 ? "Start logging your meals below" :
            todayTotals.cal < macroGoals.cal * 0.5 ? `${macroGoals.cal - Math.round(todayTotals.cal)} kcal remaining — keep fueling` :
              todayTotals.cal < macroGoals.cal ? `${macroGoals.cal - Math.round(todayTotals.cal)} kcal left for today` :
                "Daily goal reached!"}
        </div>
      </div>

      {/* ══ QUICK ADD (Frequently Eaten) ══ */}
      {frequent.length > 0 && view === "log" && (
        <div style={{ marginBottom: 16 }}>
          <div className="sl">Quick Add · Frequently Eaten</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {frequent.map((f, i) => (
              <div key={i} onClick={() => quickAdd(f)}
                style={{ minWidth: 120, padding: "10px 14px", background: "rgba(10,16,18,.9)", border: "1px solid rgba(255,255,255,.04)", borderRadius: 10, cursor: "pointer", flexShrink: 0, transition: "all .2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(16,185,129,.2)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.04)"}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb", whiteSpace: "nowrap" }}>{f.name}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{f.grams}g · {f.cal}kcal</div>
                <div style={{ fontSize: 10, color: "#4b5563" }}>eaten {f.count}×</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ ADD FOOD BUTTON ══ */}
      {view === "log" && (
        <button className="bp" onClick={() => setView("add")} style={{ width: "100%", padding: 14, fontSize: 15, marginBottom: 16, letterSpacing: 1 }}>
          + Add Food
        </button>
      )}

      {/* ══ ADD FOOD PANEL ══ */}
      {view === "add" && (
        <div className="gs fade-in" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="sl" style={{ margin: 0 }}>Add Food</div>
            <div style={{ display: "flex", gap: 10 }}>
              <span onClick={() => { setManualMode(!manualMode); setSelected(null); }}
                style={{ fontSize: 12, color: "#10b981", cursor: "pointer", fontWeight: 600 }}>
                {manualMode ? "← Search" : "Manual →"}
              </span>
              <span onClick={() => { setView("log"); setSelected(null); setSearch(""); setManualMode(false); }}
                style={{ fontSize: 16, color: "#6b7280", cursor: "pointer" }}>×</span>
            </div>
          </div>

          {/* Meal Picker */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {MEALS.map(m => (
              <div key={m.key} onClick={() => setMeal(m.key)}
                className={`chip ${meal === m.key ? "chip-a" : "chip-i"}`}
                style={{ flex: 1, justifyContent: "center", padding: "8px 4px" }}>
                <span>{m.icon}</span> <span style={{ fontSize: 12 }}>{m.label}</span>
              </div>
            ))}
          </div>

          {!manualMode ? (
            <>
              <input className="inp" placeholder="Search food... (chicken, rice, dal, roti, mango)"
                value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }}
                style={{ marginBottom: results.length > 0 && !selected ? 0 : 12 }} autoFocus />

              {/* Results */}
              {results.length > 0 && !selected && (
                <div style={{ background: "rgba(6,10,12,.95)", border: "1px solid rgba(255,255,255,.06)", borderRadius: "0 0 10px 10px", borderTop: "none", maxHeight: 220, overflowY: "auto", marginBottom: 12 }}>
                  {results.map((f, i) => (
                    <div key={i} onClick={() => { setSelected(f); setSearch(f.name); setGrams(100); }}
                      style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#e5e7eb" }}>{f.name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{f.cal} kcal/100g · {f.protein}g protein</div>
                      </div>
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 100, background: `${CAT_COLORS[f.cat] || "#6b7280"}15`, color: CAT_COLORS[f.cat] || "#6b7280" }}>{f.cat}</span>
                    </div>
                  ))}
                </div>
              )}

              {search.length >= 2 && results.length === 0 && !selected && (
                <div style={{ fontSize: 13, color: "#6b7280", padding: "8px 0", marginBottom: 12 }}>
                  Not found. <span onClick={() => setManualMode(true)} style={{ color: "#10b981", cursor: "pointer" }}>Add manually →</span>
                </div>
              )}

              {/* Selected — Quantity */}
              {selected && (
                <div className="fade-in" style={{ padding: 14, background: "rgba(16,185,129,.03)", borderRadius: 10, border: "1px solid rgba(16,185,129,.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6" }}>{selected.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{selected.cal} kcal/100g · {selected.cat}</div>
                    </div>
                    <span onClick={() => { setSelected(null); setSearch(""); }} style={{ cursor: "pointer", color: "#6b7280", fontSize: 18 }}>×</span>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                    <input className="inp" type="number" value={customGrams || grams}
                      onChange={e => { setCustomGrams(e.target.value); setGrams(parseFloat(e.target.value) || 0); }}
                      style={{ width: 90, textAlign: "center", fontSize: 18, fontWeight: 700, fontFamily: "Rajdhani,sans-serif" }} />
                    <span style={{ color: "#6b7280", fontSize: 14 }}>grams</span>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    {[50, 100, 150, 200, 250, 300].map(g => (
                      <span key={g} className={`chip ${grams === g ? "chip-a" : "chip-i"}`}
                        onClick={() => { setGrams(g); setCustomGrams(""); }}>{g}g</span>
                    ))}
                  </div>

                  {/* Smart servings */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {SERVING_PRESETS.filter(s => {
                      const n = selected.name.toLowerCase();
                      if (n.includes("roti") || n.includes("chapati") || n.includes("paratha")) return s.label.includes("roti");
                      if (n.includes("bread") || n.includes("naan")) return s.label.includes("slice");
                      if (n.includes("egg")) return s.label.includes("egg");
                      if (n.includes("milk") || n.includes("juice") || n.includes("lassi") || n.includes("tea") || n.includes("coffee") || n.includes("shake") || n.includes("buttermilk")) return s.label.includes("glass") || s.label.includes("cup");
                      if (n.includes("rice") || n.includes("dal") || n.includes("curry") || n.includes("biryani") || n.includes("sambar") || n.includes("chole") || n.includes("rajma") || n.includes("paneer") || n.includes("kheer")) return s.label.includes("bowl") || s.label.includes("plate") || s.label.includes("cup");
                      if (n.includes("oil") || n.includes("ghee") || n.includes("butter") || n.includes("honey") || n.includes("sugar") || n.includes("peanut butter")) return s.label.includes("tbsp");
                      if (n.includes("samosa") || n.includes("idli") || n.includes("vada") || n.includes("gulab") || n.includes("ladoo") || n.includes("pakora")) return s.label.includes("piece");
                      return false;
                    }).map(s => (
                      <span key={s.label} className="chip chip-i" onClick={() => { setGrams(s.grams); setCustomGrams(""); }} style={{ fontSize: 11 }}>{s.label}</span>
                    ))}
                  </div>

                  {/* Preview */}
                  {preview && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, textAlign: "center", marginBottom: 12, padding: 8, background: "rgba(0,0,0,.2)", borderRadius: 8 }}>
                      {[["Cal", preview.cal, "kcal", MACRO_COLORS.cal], ["Pro", preview.protein, "g", MACRO_COLORS.protein], ["Carb", preview.carbs, "g", MACRO_COLORS.carbs], ["Fat", preview.fat, "g", MACRO_COLORS.fat], ["Fib", preview.fiber, "g", MACRO_COLORS.fiber]].map(([l, v, u, c]) => (
                        <div key={l}><div style={{ fontSize: 9, color: "#6b7280" }}>{l}</div><div style={{ fontSize: 15, fontWeight: 800, color: c, fontFamily: "Rajdhani,sans-serif" }}>{v}</div><div style={{ fontSize: 9, color: "#4b5563" }}>{u}</div></div>
                      ))}
                    </div>
                  )}

                  <button className="bp" onClick={addFood} style={{ width: "100%", padding: 12, letterSpacing: 1 }}>
                    + Add to {MEALS.find(m => m.key === meal)?.label}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Manual Mode */
            <div className="fade-in">
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>Enter nutrition manually.</div>
              <input className="inp" placeholder="Food name" value={manual.name} onChange={e => setManual(p => ({ ...p, name: e.target.value }))} style={{ marginBottom: 8 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                {[["Calories", "cal", "kcal"], ["Protein", "protein", "g"], ["Carbs", "carbs", "g"]].map(([l, k, u]) => (
                  <div key={k}><label style={{ fontSize: 10, color: "#6b7280" }}>{l}</label><input className="inp" type="number" placeholder={u} value={manual[k]} onChange={e => setManual(p => ({ ...p, [k]: e.target.value }))} /></div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[["Fat", "fat", "g"], ["Fiber", "fiber", "g"], ["Grams", "grams", "g"]].map(([l, k, u]) => (
                  <div key={k}><label style={{ fontSize: 10, color: "#6b7280" }}>{l}</label><input className="inp" type="number" placeholder={u} value={manual[k]} onChange={e => setManual(p => ({ ...p, [k]: e.target.value }))} /></div>
                ))}
              </div>
              <button className="bp" onClick={addManual} disabled={!manual.name || !manual.cal} style={{ width: "100%", padding: 12 }}>+ Add to {MEALS.find(m => m.key === meal)?.label}</button>
            </div>
          )}
        </div>
      )}

      {/* ══ TODAY'S LOG (Grouped by Meal) ══ */}
      {todayLog.length > 0 && (
        <div className="gs" style={{ marginBottom: 16 }}>
          <div className="sl">Today · {todayLog.length} items · {Math.round(todayTotals.cal)} kcal</div>
          {MEALS.map(m => {
            const mealItems = todayLog.filter(f => f.meal === m.key);
            if (mealItems.length === 0) return null;
            const mealTotals = totals(mealItems);
            return (
              <div key={m.key} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb" }}>{m.icon} {m.label}</span>
                  <span style={{ fontSize: 11, color: MACRO_COLORS.cal }}>{Math.round(mealTotals.cal)} kcal</span>
                </div>
                {mealItems.map(f => (
                  <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,.03)", marginLeft: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#d1d5db" }}>{f.name} <span style={{ color: "#4b5563" }}>· {f.grams}g</span></div>
                      <div style={{ fontSize: 11, color: "#6b7280", display: "flex", gap: 8 }}>
                        <span style={{ color: MACRO_COLORS.cal }}>{f.cal}kcal</span>
                        <span style={{ color: MACRO_COLORS.protein }}>P:{f.protein}g</span>
                        <span style={{ color: MACRO_COLORS.carbs }}>C:{f.carbs}g</span>
                        <span style={{ color: MACRO_COLORS.fat }}>F:{f.fat}g</span>
                      </div>
                    </div>
                    <span onClick={() => removeFood(f.id)} style={{ cursor: "pointer", color: "#4b5563", padding: "4px 8px" }}>×</span>
                  </div>
                ))}
              </div>
            );
          })}
          {/* Uncategorized (old entries without meal field) */}
          {todayLog.filter(f => !f.meal).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb", marginBottom: 6 }}>🍽️ Other</div>
              {todayLog.filter(f => !f.meal).map(f => (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,.03)", marginLeft: 8 }}>
                  <div><div style={{ fontSize: 13, color: "#d1d5db" }}>{f.name} · {f.grams}g</div><div style={{ fontSize: 11, color: "#6b7280" }}>{f.cal}kcal · P:{f.protein}g</div></div>
                  <span onClick={() => removeFood(f.id)} style={{ cursor: "pointer", color: "#4b5563", padding: "4px 8px" }}>×</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ WEEKLY SUMMARY ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div onClick={() => setShowWeekly(!showWeekly)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
          <div className="sl" style={{ margin: 0 }}>Weekly Overview</div>
          <span style={{ color: "#6b7280", fontSize: 14 }}>{showWeekly ? "▾" : "▸"}</span>
        </div>
        {showWeekly && (
          <div className="fade-in" style={{ marginTop: 12 }}>
            {weekData.map(day => (
              <div key={day.date} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: day.date === d ? "#10b981" : "#6b7280", fontWeight: day.date === d ? 700 : 400, width: 32, flexShrink: 0 }}>{day.label}</span>
                <div style={{ flex: 1, height: 18, background: "rgba(255,255,255,.03)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                  <div style={{ height: "100%", width: `${weekMaxCal > 0 ? (day.cal / weekMaxCal) * 100 : 0}%`, background: day.cal > macroGoals.cal ? "linear-gradient(90deg,#ef4444,#f97316)" : `linear-gradient(90deg,#10b981,#06b6d4)`, borderRadius: 4, transition: "width .5s" }} />
                  <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#e5e7eb", fontWeight: 600 }}>{day.cal > 0 ? `${day.cal}` : ""}</span>
                </div>
                <span style={{ fontSize: 10, color: "#6b7280", width: 30, textAlign: "right", flexShrink: 0 }}>P:{Math.round(day.protein)}</span>
                <span style={{ fontSize: 10, color: "#06b6d4", width: 16, textAlign: "center", flexShrink: 0 }}>💧{day.water}</span>
              </div>
            ))}
            <div style={{ textAlign: "center", fontSize: 11, color: "#4b5563", marginTop: 6 }}>
              Avg: {Math.round(weekData.reduce((s, d) => s + d.cal, 0) / 7)} kcal/day · {Math.round(weekData.reduce((s, d) => s + d.protein, 0) / 7)}g protein/day
            </div>
          </div>
        )}
      </div>

      {/* ══ HISTORY ══ */}
      <div className="gs">
        <div onClick={() => setShowHistory(!showHistory)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
          <div className="sl" style={{ margin: 0 }}>History · {historyDates.length} days</div>
          <span style={{ color: "#6b7280", fontSize: 14 }}>{showHistory ? "▾" : "▸"}</span>
        </div>
        {showHistory && (
          <div style={{ marginTop: 12 }}>
            {historyDates.length === 0 && <div style={{ fontSize: 13, color: "#6b7280", padding: "12px 0" }}>No history yet.</div>}
            {historyDates.slice(0, 30).map(date => {
              const log = foodLog[date] || [];
              const t = totals(log);
              const isOpen = historyDate === date;
              const label = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
              return (
                <div key={date} style={{ marginBottom: 4 }}>
                  <div onClick={() => setHistoryDate(isOpen ? null : date)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: isOpen ? "rgba(16,185,129,.04)" : "transparent", transition: "all .2s" }}>
                    <div><div style={{ fontSize: 13, fontWeight: 500, color: "#e5e7eb" }}>{label}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{log.length} items</div></div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: MACRO_COLORS.cal }}>{Math.round(t.cal)}</span>
                      <span style={{ fontSize: 11, color: MACRO_COLORS.protein }}>P:{Math.round(t.protein)}g</span>
                      <span style={{ color: "#4b5563", fontSize: 14 }}>{isOpen ? "▾" : "▸"}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="fade-in" style={{ padding: "4px 12px" }}>
                      {MEALS.map(m => {
                        const items = log.filter(f => f.meal === m.key);
                        if (items.length === 0) return null;
                        return (
                          <div key={m.key} style={{ marginBottom: 6 }}>
                            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 2 }}>{m.icon} {m.label}</div>
                            {items.map(f => (
                              <div key={f.id} style={{ fontSize: 12, color: "#d1d5db", padding: "3px 0 3px 12px" }}>{f.name} ({f.grams}g) — {f.cal}kcal</div>
                            ))}
                          </div>
                        );
                      })}
                      {log.filter(f => !f.meal).map(f => (
                        <div key={f.id} style={{ fontSize: 12, color: "#d1d5db", padding: "3px 0" }}>{f.name} ({f.grams}g) — {f.cal}kcal</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}