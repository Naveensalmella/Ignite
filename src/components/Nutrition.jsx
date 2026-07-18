import { useState, useMemo, useRef, useEffect } from 'react';
import { XP } from '../data';
import { FOOD_DATABASE, FOOD_CATEGORIES, searchFoods, searchFoodsCombined } from '../data/foodDatabase';
import { DIET_TEMPLATES, generateDayPlan, generateWeekPlan, getPlanDayTotals, getShoppingList, getSwapOptions as getMealSwaps } from '../data/mealPlanner';
import { today } from '../utils';
import HistoryPanel from './HistoryPanel';
import { formatNutritionHistory } from '../historyFormatters';

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];
const WATER_GOAL = 8;
const GRAM_PRESETS = [50, 100, 150, 200, 250, 300];

const PLAN_TYPES = [
  { id: "balanced", label: "Balanced", icon: "⚖️", protPct: .25, carbPct: .45, fatPct: .30 },
  { id: "highprotein", label: "High Protein", icon: "🥩", protPct: .35, carbPct: .35, fatPct: .30 },
  { id: "lowcarb", label: "Low Carb", icon: "🥑", protPct: .30, carbPct: .20, fatPct: .50 },
  { id: "vegetarian", label: "Vegetarian", icon: "🌱", protPct: .20, carbPct: .50, fatPct: .30 },
  { id: "bulking", label: "Bulking", icon: "💪", protPct: .30, carbPct: .45, fatPct: .25 },
];

function calcTDEE(profile) {
  const w = parseFloat(profile.weight) || 70, h = parseFloat(profile.height) || 170, age = parseInt(profile.age) || 25, g = profile.gender || "male";
  let bmr = g === "female" ? 10 * w + 6.25 * h - 5 * age - 161 : 10 * w + 6.25 * h - 5 * age + 5;
  const m = profile.fitnessLevel === "beginner" ? 1.375 : profile.fitnessLevel === "advanced" ? 1.725 : 1.55;
  let tdee = Math.round(bmr * m);
  let target = profile.goal === "lose" ? Math.round(tdee * .8) : profile.goal === "muscle" ? Math.round(tdee * 1.2) : tdee;
  return { tdee, target };
}


function getNutritionScore(totals, target, proteinG, carbG, fatG) {
  if (totals.cal === 0) return { grade: "—", color: "#4b5563", desc: "Log food to get your score" };
  let score = 0;
  // Calorie accuracy (40 points) — within 10% = full marks
  const calPct = Math.abs(totals.cal - target) / target;
  if (calPct <= 0.05) score += 40;
  else if (calPct <= 0.1) score += 35;
  else if (calPct <= 0.2) score += 25;
  else if (calPct <= 0.3) score += 15;
  // Protein (25 points)
  const protPct = proteinG > 0 ? totals.protein / proteinG : 0;
  if (protPct >= 0.9) score += 25;
  else if (protPct >= 0.7) score += 18;
  else if (protPct >= 0.5) score += 10;
  // Carbs (20 points)
  const carbPct = carbG > 0 ? totals.carbs / carbG : 0;
  if (carbPct >= 0.8 && carbPct <= 1.2) score += 20;
  else if (carbPct >= 0.6) score += 12;
  // Fat (15 points)
  const fatPctVal = fatG > 0 ? totals.fat / fatG : 0;
  if (fatPctVal >= 0.7 && fatPctVal <= 1.3) score += 15;
  else if (fatPctVal >= 0.5) score += 8;

  if (score >= 90) return { grade: "A+", color: "#22c55e", desc: "Perfect nutrition day!" };
  if (score >= 80) return { grade: "A", color: "#10b981", desc: "Excellent — right on target" };
  if (score >= 70) return { grade: "B", color: "#06b6d4", desc: "Good — minor adjustments needed" };
  if (score >= 55) return { grade: "C", color: "#f59e0b", desc: "Fair — watch your macros" };
  if (score >= 40) return { grade: "D", color: "#f97316", desc: "Needs improvement" };
  return { grade: "F", color: "#ef4444", desc: "Way off target — check your portions" };
}

const MEAL_TIMES = {
  Breakfast: { time: "7:00 - 9:00 AM", tip: "Protein + complex carbs for sustained energy" },
  Lunch: { time: "12:00 - 1:30 PM", tip: "Balanced plate: ½ veggies, ¼ protein, ¼ carbs" },
  Dinner: { time: "6:30 - 8:00 PM", tip: "Lighter than lunch, focus on protein + veggies" },
  Snack: { time: "3:00 - 4:30 PM", tip: "150-200 cal max: fruits, nuts, or yogurt" },
};
function Ring({ pct, color, size = 48, stroke = 4, children }) { const r = (size - stroke) / 2, c = 2 * Math.PI * r; return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div></div>) }

export default function Nutrition({ foodLog, setFoodLog, addXP, profile }) {
  const d = today();
  const todayLog = foodLog[d] || [];
  const todayWater = foodLog[`water_${d}`] || 0;
  const [tab, setTab] = useState("log");
  const [selMeal, setSelMeal] = useState("Breakfast");
  const [search, setSearch] = useState("");
  const [selFood, setSelFood] = useState(null);
  const [grams, setGrams] = useState(100);
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ name: "", cal: "", protein: "", carbs: "", fat: "", fiber: "" });
  const [selCat, setSelCat] = useState("All");
  const [apiResults, setApiResults] = useState([]);
  const [apiSearching, setApiSearching] = useState(false);

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState("choose"); // choose | camera | text
  const [textDesc, setTextDesc] = useState("");
  const [scanHistory, setScanHistory] = useState(() => JSON.parse(localStorage.getItem("ignite-scan-history") || "[]"));
  const [scanResults, setScanResults] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scanPhoto, setScanPhoto] = useState(null);
  const videoRef = useRef(null), canvasRef = useRef(null), streamRef = useRef(null), fileRef = useRef(null);

  // Diet plan state
  const [planType, setPlanType] = useState(PLAN_TYPES[0]);
  const [savedPlans, setSavedPlans] = useState(foodLog._savedPlans || []);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planName, setPlanName] = useState("");
  const [planItems, setPlanItems] = useState({ Breakfast: [], Lunch: [], Dinner: [], Snack: [] });
  const [planSearch, setPlanSearch] = useState("");
  const [planTab, setPlanTab] = useState("templates"); // templates | create | weekly | shopping
  const [selTemplate, setSelTemplate] = useState(null);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [weekPlan, setWeekPlan] = useState(null);
  const [selWeekDay, setSelWeekDay] = useState("Monday");
  const [shoppingList, setShoppingList] = useState([]);
  const [checkedShop, setCheckedShop] = useState({});
  const [planAdherence, setPlanAdherence] = useState({});

  const { tdee, target } = useMemo(() => calcTDEE(profile || {}), [profile]);
  const proteinG = Math.round((target * planType.protPct) / 4);
  const carbG = Math.round((target * planType.carbPct) / 4);
  const fatG = Math.round((target * planType.fatPct) / 9);

  const totals = useMemo(() => ({
    cal: todayLog.reduce((s, f) => s + (f.cal || 0), 0),
    protein: todayLog.reduce((s, f) => s + (f.protein || 0), 0),
    carbs: todayLog.reduce((s, f) => s + (f.carbs || 0), 0),
    fat: todayLog.reduce((s, f) => s + (f.fat || 0), 0),
    fiber: todayLog.reduce((s, f) => s + (f.fiber || 0), 0),
  }), [todayLog]);

  const remaining = target - totals.cal;
  const nutScore = getNutritionScore(totals, target, proteinG, carbG, fatG);

  // Recent/frequent foods
  const recentFoods = useMemo(() => {
    const all = [];
    const dates = Object.keys(foodLog).filter(k => !k.startsWith("water_") && !k.startsWith("_") && Array.isArray(foodLog[k]));
    dates.sort().reverse().slice(0, 7).forEach(dt => {
      (foodLog[dt] || []).forEach(f => {
        if (!all.find(a => a.name === f.name)) all.push(f);
      });
    });
    return all.slice(0, 12);
  }, [foodLog]);

  // Macro breakdown by meal
  const mealMacros = useMemo(() => {
    const result = {};
    MEALS.forEach(m => {
      const items = todayLog.filter(f => f.meal === m);
      result[m] = {
        cal: items.reduce((s, f) => s + (f.cal || 0), 0),
        protein: items.reduce((s, f) => s + (f.protein || 0), 0),
        carbs: items.reduce((s, f) => s + (f.carbs || 0), 0),
        fat: items.reduce((s, f) => s + (f.fat || 0), 0),
      };
    });
    return result;
  }, [todayLog]);

  // Weekly nutrition data
  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const ds = dt.toISOString().split("T")[0];
      const dayLog = foodLog[ds] || [];
      days.push({
        date: ds,
        label: dt.toLocaleDateString("en", { weekday: "narrow" }),
        cal: dayLog.reduce((s, f) => s + (f.cal || 0), 0),
        protein: dayLog.reduce((s, f) => s + (f.protein || 0), 0),
        carbs: dayLog.reduce((s, f) => s + (f.carbs || 0), 0),
        fat: dayLog.reduce((s, f) => s + (f.fat || 0), 0),
        isToday: ds === d,
      });
    }
    return days;
  }, [foodLog, d]);

  const filtered = useMemo(() => {
    let list = search ? searchFoods(search) : FOOD_DATABASE;
    if (selCat !== "All") list = list.filter(f => f.category === selCat);
    return list;
  }, [search, selCat]);

  // ── Add food with gram-based calculation ──
  const addFood = (food, g = 100, meal = selMeal) => {
    const ratio = g / 100;
    const scaled = { ...food, meal, grams: g, cal: Math.round(food.cal * ratio), protein: Math.round(food.protein * ratio * 10) / 10, carbs: Math.round(food.carbs * ratio * 10) / 10, fat: Math.round(food.fat * ratio * 10) / 10, fiber: Math.round(food.fiber * ratio * 10) / 10, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setFoodLog(p => ({ ...p, [d]: [...(p[d] || []), scaled] }));
    addXP(XP.food, "Food logged");
    setSelFood(null); setGrams(100);
  };

  const addCustomFood = () => {
    if (!custom.name.trim() || !custom.cal) return;
    addFood({ name: custom.name.trim(), emoji: "🍽️", cal: parseInt(custom.cal) || 0, protein: parseFloat(custom.protein) || 0, carbs: parseFloat(custom.carbs) || 0, fat: parseFloat(custom.fat) || 0, fiber: parseFloat(custom.fiber) || 0, category: "Custom" }, 100, selMeal);
    setCustom({ name: "", cal: "", protein: "", carbs: "", fat: "", fiber: "" }); setShowCustom(false);
  };

  const removeFood = (idx) => setFoodLog(p => ({ ...p, [d]: (p[d] || []).filter((_, i) => i !== idx) }));
  const addWater = () => setFoodLog(p => ({ ...p, [`water_${d}`]: (p[`water_${d}`] || 0) + 1 }));
  const removeWater = () => setFoodLog(p => ({ ...p, [`water_${d}`]: Math.max(0, (p[`water_${d}`] || 0) - 1) }));

  // ── Scanner ──
  const startCam = async () => { try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 640 } } }); streamRef.current = s; if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play() } } catch (e) { setScanError("Camera unavailable. Upload a photo instead.") } };
  const stopCam = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null } };
  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const cv = canvasRef.current, v = videoRef.current;
    cv.width = 512; cv.height = 512;
    const ctx = cv.getContext("2d");
    const sz = Math.min(v.videoWidth, v.videoHeight);
    ctx.drawImage(v, (v.videoWidth - sz) / 2, (v.videoHeight - sz) / 2, sz, sz, 0, 0, 512, 512);
    const url = cv.toDataURL("image/jpeg", .8);
    setScanPhoto(url);
    stopCam();
    // Switch to text mode for description since Groq text model can't see images
    setScanMode("text");
    setTextDesc("");
  };
  const handleFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      setScanPhoto(ev.target.result);
      setScanMode("camera");
      stopCam();
      // Since we can't send image to Groq text model, prompt user to describe
      setScanMode("text");
      setTextDesc("");
      setScanError("Photo saved! Now describe what's in the photo for accurate analysis.");
    };
    r.readAsDataURL(f);
  };
  // AI Food Analysis — Direct Groq API (no backend needed)
  const analyzeWithAI = async (prompt) => {
    setScanning(true); setScanError(null); setScanResults(null);
    const groqKey = process.env.REACT_APP_GROQ_API_KEY;
    if (!groqKey) { setScanError("API key missing. Add REACT_APP_GROQ_API_KEY to .env.local"); setScanning(false); return; }
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", max_tokens: 1024, temperature: 0.3,
          messages: [
            { role: "system", content: `You are a nutrition expert. Analyze the food described and return ONLY valid JSON array. Each item: {"name":"Food Name","emoji":"🍛","cal":calories_number,"protein":grams,"carbs":grams,"fat":grams,"fiber":grams,"serving":"portion description"}. Be accurate with Indian food portions. Return ONLY the JSON array, no other text.` },
            { role: "user", content: prompt }
          ],
        }),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.choices?.[0]?.message?.content || "";
      // Parse JSON from response
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        const foods = JSON.parse(jsonMatch[0]);
        if (foods.length > 0) { setScanResults(foods); }
        else { setScanError("Could not identify food. Try describing it differently."); }
      } else { setScanError("AI couldn't parse the food. Try again."); }
    } catch (e) {
      setScanError("Analysis failed: " + e.message);
    }
    setScanning(false);
  };

  const analyze = async (b64) => {
    // For image: describe to AI what to analyze
    analyzeWithAI("Analyze this food photo. The image is a meal photo (base64 provided but you can't see it). Instead, I'll describe: this appears to be an Indian meal. Please estimate nutrition for a typical Indian meal plate with rice, curry, and sides. If you can identify specific foods from context, list them individually.");
  };

  const analyzeText = async (desc) => {
    if (!desc.trim()) return;
    analyzeWithAI(`Analyze this meal and estimate nutrition for each food item separately: "${desc}". Use standard Indian serving sizes. Be specific with calories — don't round to nearest 100.`);
  };
  useEffect(() => () => stopCam(), []);
  useEffect(() => { localStorage.setItem("ignite-scan-history", JSON.stringify(scanHistory)); }, [scanHistory]);

  // API search (debounced — fires 500ms after typing stops)
  useEffect(() => {
    if (!search || search.length < 3) { setApiResults([]); return; }
    const timer = setTimeout(async () => {
      setApiSearching(true);
      try { const { api } = await searchFoodsCombined(search); setApiResults(api); } catch (e) { setApiResults([]); }
      setApiSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Save/Load Plans ──
  const savePlan = () => {
    if (!planName.trim()) return;
    const plan = { id: Date.now(), name: planName.trim(), type: planType.id, items: planItems, createdAt: d };
    const newPlans = [...savedPlans, plan];
    setSavedPlans(newPlans);
    setFoodLog(p => ({ ...p, _savedPlans: newPlans }));
    setPlanName(""); setEditingPlan(null);
  };

  const loadPlan = (plan) => { setPlanItems(plan.items); setEditingPlan(plan); setPlanName(plan.name) };
  const deletePlan = (id) => { const np = savedPlans.filter(p => p.id !== id); setSavedPlans(np); setFoodLog(p => ({ ...p, _savedPlans: np })) };
  const addToPlan = (food, meal) => { setPlanItems(p => ({ ...p, [meal]: [...(p[meal] || []), { ...food, grams: 100 }] })) };
  const removeFromPlan = (meal, idx) => { setPlanItems(p => ({ ...p, [meal]: (p[meal] || []).filter((_, i) => i !== idx) })) };
  const logEntirePlan = () => {
    MEALS.forEach(meal => { (planItems[meal] || []).forEach(f => { addFood(f, f.grams || 100, meal) }) });
    setTab("log");
  };

  // ══ SCAN TAB ══
  if (tab === "scan") {
    return (<div style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>🤖 AI Food Scanner</div><div style={{ fontSize: 12, color: "#6b7280" }}>Camera, photo, or describe your meal</div></div>
        <button className="bg" onClick={() => { stopCam(); setTab("log"); setScanResults(null); setScanPhoto(null); setScanError(null); setScanMode("choose") }} style={{ padding: "8px 14px" }}>← Back</button>
      </div>

      {/* Mode selector */}
      {scanMode === "choose" && !scanning && !scanResults && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div className="gc" onClick={() => { setScanMode("camera"); setTimeout(startCam, 100) }} style={{ padding: 20, textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>📸</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>Camera</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Point at food</div>
            </div>
            <div className="gc" onClick={() => fileRef.current?.click()} style={{ padding: 20, textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>📁</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#06b6d4" }}>Upload</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>From gallery</div>
            </div>
            <div className="gc" onClick={() => setScanMode("text")} style={{ padding: 20, textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>✍️</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#8b5cf6" }}>Describe</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Type your meal</div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

          {/* Recent scans */}
          {scanHistory.length > 0 && (
            <div className="gs" style={{ padding: 14 }}>
              <div className="sl">Recent Scans</div>
              {scanHistory.slice(0, 5).map((scan, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < Math.min(4, scanHistory.length - 1) ? "1px solid rgba(255,255,255,.03)" : "none" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 16 }}>{scan.emoji || "🍽️"}</span>
                    <div>
                      <div style={{ fontSize: 13, color: "#f3f4f6" }}>{scan.name}</div>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>P:{scan.protein}g C:{scan.carbs}g F:{scan.fat}g</div>
                    </div>
                  </div>
                  <button className="bp" onClick={() => addFood(scan, 100, selMeal)} style={{ padding: "6px 12px", fontSize: 11 }}>+ Add</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Camera mode */}
      {scanMode === "camera" && !scanPhoto && !scanning && (
        <div>
          <div style={{ width: "100%", maxWidth: 400, aspectRatio: "1", borderRadius: 16, overflow: "hidden", border: "2px solid rgba(16,185,129,.2)", margin: "0 auto 16px", background: "#111", position: "relative" }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, border: "3px solid rgba(16,185,129,.3)", borderRadius: 14, pointerEvents: "none" }}>
              <div style={{ position: "absolute", top: "20%", left: "20%", right: "20%", bottom: "20%", border: "1px dashed rgba(16,185,129,.4)", borderRadius: 8 }} />
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 10, maxWidth: 400, margin: "0 auto" }}>
            <button className="bg" onClick={() => setScanMode("choose")} style={{ padding: "14px 16px" }}>←</button>
            <button className="bp" onClick={capture} style={{ flex: 1, padding: 14, fontSize: 16 }}>📸 Capture</button>
          </div>
          {scanError && <div style={{ textAlign: "center", color: "#ef4444", fontSize: 13, marginTop: 12 }}>{scanError}</div>}
        </div>
      )}

      {/* Text describe mode */}
      {scanMode === "text" && !scanning && !scanResults && (
        <div className="fade-in">
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", marginBottom: 8 }}>✍️ Describe what you ate</div>
            <textarea className="inp" value={textDesc} onChange={e => setTextDesc(e.target.value)}
              placeholder="Example: 2 rotis with dal and chicken curry, a bowl of rice, and buttermilk"
              rows={3} style={{ resize: "none", width: "100%", fontSize: 14, padding: 12 }} />
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {["2 idli with sambar and chutney", "Chicken biryani with raita", "1 plate poha with peanuts", "Paneer butter masala with 3 rotis", "Oats with banana and milk"].map(ex => (
              <span key={ex} className="chip chip-i" onClick={() => setTextDesc(ex)} style={{ fontSize: 10, cursor: "pointer" }}>{ex}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="bg" onClick={() => setScanMode("choose")} style={{ padding: "12px 16px" }}>←</button>
            <button className="bp" onClick={() => analyzeText(textDesc)} disabled={!textDesc.trim()} style={{ flex: 1, padding: 12, fontSize: 14 }}>🤖 Analyze Food</button>
          </div>
        </div>
      )}

      {/* Scanning animation */}
      {scanning && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          {scanPhoto && <div style={{ width: 160, height: 160, borderRadius: 16, overflow: "hidden", margin: "0 auto 20px", border: "2px solid rgba(16,185,129,.2)" }}><img src={scanPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 12 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", animation: `dotPulse 1.2s ${i * .2}s infinite` }} />)}
          </div>
          <div style={{ fontSize: 14, color: "#10b981", fontWeight: 600 }}>Analyzing your food with AI...</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Estimating calories, protein, carbs, fat</div>
        </div>
      )}

      {/* Scan results */}
      {scanResults && (
        <div className="fade-in">
          {scanPhoto && <div style={{ width: 120, height: 120, borderRadius: 12, overflow: "hidden", margin: "0 auto 12px" }}><img src={scanPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>✓ {scanResults.length} item{scanResults.length > 1 ? "s" : ""} identified</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Total: {scanResults.reduce((s, f) => s + (f.cal || 0), 0)} cal</div>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, justifyContent: "center" }}>{MEALS.map(m => <span key={m} className={`chip ${selMeal === m ? "chip-a" : "chip-i"}`} onClick={() => setSelMeal(m)}>{m}</span>)}</div>

          {scanResults.map((f, i) => (
            <div key={i} className="gs" style={{ marginBottom: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#f3f4f6" }}>{f.emoji || "🍽️"} {f.name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{f.serving || "1 serving"} · {f.cal}cal</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 10 }}>
                    <span style={{ color: "#ef4444" }}>P: {f.protein}g</span>
                    <span style={{ color: "#f59e0b" }}>C: {f.carbs}g</span>
                    <span style={{ color: "#06b6d4" }}>F: {f.fat}g</span>
                    <span style={{ color: "#22c55e" }}>Fb: {f.fiber || 0}g</span>
                  </div>
                </div>
                <button className="bp" onClick={() => { addFood({ ...f, fiber: f.fiber || 0, category: "AI Scanned" }, 100, selMeal); setScanHistory(p => [f, ...p.filter(x => x.name !== f.name)].slice(0, 20)); }} style={{ padding: "8px 14px", flexShrink: 0 }}>+ Add</button>
              </div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button className="bp" onClick={() => { scanResults.forEach(f => { addFood({ ...f, fiber: f.fiber || 0, category: "AI Scanned" }, 100, selMeal); setScanHistory(p => [f, ...p.filter(x => x.name !== f.name)].slice(0, 20)); }); stopCam(); setScanResults(null); setScanPhoto(null); setScanMode("choose"); setTab("log") }}
              style={{ flex: 1, padding: 12 }}>✅ Add All & Done</button>
            <button className="bg" onClick={() => { setScanResults(null); setScanPhoto(null); setScanMode("choose") }} style={{ padding: "12px 16px" }}>↻ Rescan</button>
          </div>
        </div>
      )}
    </div>);
  }

  return (<div style={{ maxWidth: "100%", overflowX: "hidden" }}>
    {/* Tabs */}
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
      {[["log", "🍎 Log"], ["weekly", "📊 Weekly"], ["scan", "📸 Scan"], ["plan", "📋 Plans"], ["history", "📅 History"]].map(([k, l]) => (
        <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => { if (k === "scan") { setTab("scan"); setTimeout(startCam, 100) } else setTab(k) }} style={{ padding: "8px 14px" }}>{l}</span>
      ))}
    </div>

    {/* ════ LOG TAB ════ */}
    {tab === "log" && (<div>
      {/* Remaining calories */}
      <div className="gs" style={{ marginBottom: 16, textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 2 }}>REMAINING TODAY</div>
        <div style={{ fontSize: 42, fontWeight: 900, color: remaining > 0 ? "#10b981" : "#ef4444", fontFamily: "Rajdhani,sans-serif", lineHeight: 1.1 }}>{remaining > 0 ? remaining : 0}</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>of {target} cal · Eaten: {totals.cal}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "4px 14px", borderRadius: 100, background: nutScore.color + "10", border: "1px solid " + nutScore.color + "25" }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: nutScore.color, fontFamily: "Rajdhani,sans-serif" }}>{nutScore.grade}</span>
          <span style={{ fontSize: 11, color: nutScore.color }}>{nutScore.desc}</span>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,.04)", borderRadius: 4, overflow: "hidden", marginTop: 10 }}>
          <div style={{ height: "100%", width: `${Math.min(100, (totals.cal / target) * 100)}%`, background: totals.cal > target ? "#ef4444" : "linear-gradient(90deg,#10b981,#06b6d4)", borderRadius: 4, transition: "width .5s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
          {[["Protein", totals.protein, proteinG, "#ef4444"], ["Carbs", totals.carbs, carbG, "#f59e0b"], ["Fat", totals.fat, fatG, "#06b6d4"], ["Fiber", totals.fiber, 25, "#22c55e"]].map(([l, v, t, c]) => (
            <div key={l} style={{ textAlign: "center" }}><Ring pct={(v / t) * 100} color={c} size={40} stroke={3}><span style={{ fontSize: 9, fontWeight: 700, color: c }}>{Math.round(v)}</span></Ring><div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{l}</div></div>
          ))}
        </div>
      </div>

      {/* Enhanced Water Tracker */}
      <div className="gs" style={{ marginBottom: 14, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", width: 44, height: 60, borderRadius: "6px 6px 10px 10px", border: "2px solid rgba(6,182,212,.3)", overflow: "hidden", flexShrink: 0 }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${Math.min(100, (todayWater / WATER_GOAL) * 100)}%`, background: "linear-gradient(180deg, rgba(6,182,212,.3), rgba(6,182,212,.15))", transition: "height .5s ease", borderRadius: "0 0 8px 8px" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💧</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 20, fontWeight: 800, color: todayWater >= WATER_GOAL ? "#22c55e" : "#06b6d4", fontFamily: "Rajdhani,sans-serif" }}>{todayWater}</span>
                <span style={{ fontSize: 13, color: "#6b7280" }}>/{WATER_GOAL} glasses</span>
                {todayWater >= WATER_GOAL && <span style={{ fontSize: 12, color: "#22c55e", marginLeft: 6 }}>✓ Goal!</span>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="bg" onClick={removeWater} style={{ padding: "6px 12px", fontSize: 16 }}>−</button>
                <button className="bp" onClick={addWater} style={{ padding: "6px 14px", fontSize: 16 }}>+</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
              {Array.from({ length: WATER_GOAL }, (_, i) => (
                <div key={i} onClick={() => setFoodLog(p => ({ ...p, [`water_${d}`]: i + 1 }))} style={{ flex: 1, height: 6, borderRadius: 3, background: i < todayWater ? "#06b6d4" : "rgba(255,255,255,.06)", transition: "background .3s", cursor: "pointer" }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Meal selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>{MEALS.map(m => { const mc = todayLog.filter(f => f.meal === m); const cal = mc.reduce((s, f) => s + (f.cal || 0), 0); return <span key={m} className={`chip ${selMeal === m ? "chip-a" : "chip-i"}`} onClick={() => setSelMeal(m)}>{m}{mc.length > 0 ? ` (${cal}cal)` : ""}</span> })}</div>

      {/* Meal timing */}
      <div style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(16,185,129,.03)", border: "1px solid rgba(16,185,129,.08)", marginBottom: 10, display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 14 }}>🕐</span>
        <div>
          <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>{MEAL_TIMES[selMeal]?.time}</span>
          <span style={{ fontSize: 11, color: "#6b7280" }}> — {MEAL_TIMES[selMeal]?.tip}</span>
        </div>
      </div>

      {/* Food quantity picker */}
      {selFood && (<div className="gs fade-in" style={{ marginBottom: 14, border: "1px solid rgba(16,185,129,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 28 }}>{selFood.emoji}</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 600, color: "#f3f4f6" }}>{selFood.name}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{selFood.category} · Nutrition per 100g</div></div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Weight in grams</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input className="inp" type="number" value={grams} onChange={e => setGrams(Math.max(1, parseInt(e.target.value) || 0))} style={{ width: 80, textAlign: "center", fontSize: 18, fontWeight: 700, padding: 10 }} />
            <span style={{ color: "#6b7280", fontSize: 14 }}>grams</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>{GRAM_PRESETS.map(g => <span key={g} className={`chip ${grams === g ? "chip-a" : "chip-i"}`} onClick={() => setGrams(g)} style={{ flex: 1, justifyContent: "center", padding: "6px 0" }}>{g}g</span>)}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(55px,1fr))", gap: 6, marginBottom: 12, textAlign: "center", padding: 10, background: "rgba(255,255,255,.02)", borderRadius: 8 }}>
          {[["Cal", Math.round(selFood.cal * grams / 100), "#f59e0b"], ["Protein", Math.round(selFood.protein * grams / 100 * 10) / 10, "#ef4444"], ["Carbs", Math.round(selFood.carbs * grams / 100 * 10) / 10, "#f59e0b"], ["Fat", Math.round(selFood.fat * grams / 100 * 10) / 10, "#06b6d4"], ["Fiber", Math.round(selFood.fiber * grams / 100 * 10) / 10, "#22c55e"]].map(([l, v, c]) => (
            <div key={l}><div style={{ fontSize: 16, fontWeight: 700, color: c }}>{v}{l === "Cal" ? "" : "g"}</div><div style={{ fontSize: 9, color: "#6b7280" }}>{l}</div></div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}><button className="bp" onClick={() => addFood(selFood, grams, selMeal)} style={{ flex: 1, padding: 12 }}>+ Add {grams}g to {selMeal}</button><button className="bg" onClick={() => { setSelFood(null); setGrams(100) }} style={{ padding: "12px 16px" }}>Cancel</button></div>
      </div>)}

      {/* Quick Add — Recent Foods */}
      {!selFood && recentFoods.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>⚡ Quick Add — Recent</div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {recentFoods.slice(0, 8).map((f, i) => (
              <div key={f.name + i} onClick={() => addFood(f, 100, selMeal)} style={{ flexShrink: 0, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", cursor: "pointer", textAlign: "center", minWidth: 70 }}>
                <div style={{ fontSize: 18 }}>{f.emoji}</div>
                <div style={{ fontSize: 10, color: "#e5e7eb", marginTop: 2 }}>{f.name.length > 10 ? f.name.slice(0, 10) + "…" : f.name}</div>
                <div style={{ fontSize: 9, color: "#6b7280" }}>{f.cal}cal</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + Category filter */}
      {!selFood && <>
        <input className="inp" placeholder="Search 199 foods... (biryani, idli, paneer, dal...)" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 8 }} />
        <div style={{ display: "flex", gap: 4, marginBottom: 10, overflowX: "auto", paddingBottom: 4 }}>
          <span className={`chip ${selCat === "All" ? "chip-a" : "chip-i"}`} onClick={() => setSelCat("All")} style={{ flexShrink: 0 }}>All</span>
          {FOOD_CATEGORIES.map(c => <span key={c} className={`chip ${selCat === c ? "chip-a" : "chip-i"}`} onClick={() => setSelCat(c)} style={{ flexShrink: 0, fontSize: 11 }}>{c}</span>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(90px,1fr))", gap: 8, marginBottom: 12, maxHeight: 300, overflowY: "auto" }}>
          {filtered.slice(0, 36).map((f, i) => (<div key={f.name + i} className="fc" onClick={() => { setSelFood(f); setGrams(100) }}><div style={{ fontSize: 20 }}>{f.emoji}</div><div style={{ fontSize: 11, fontWeight: 500, color: "#e5e7eb", marginTop: 3 }}>{f.name}</div><div style={{ fontSize: 9, color: "#6b7280" }}>{f.cal}cal/100g</div></div>))}
        </div>
        {filtered.length === 0 && search && !apiSearching && apiResults.length === 0 && <div style={{ textAlign: "center", color: "#6b7280", padding: "12px 0", fontSize: 13 }}>No food found for "{search}"</div>}
        {apiSearching && <div style={{ textAlign: "center", padding: "8px 0", fontSize: 12, color: "#06b6d4" }}>Searching global database...</div>}
        {apiResults.length > 0 && (<div style={{ marginTop: 12 }}><div style={{ fontSize: 12, color: "#06b6d4", fontWeight: 600, marginBottom: 8 }}>More from global database ({apiResults.length})</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(90px,1fr))", gap: 8, maxHeight: 200, overflowY: "auto" }}>{apiResults.map((f, i) => (<div key={"api" + i} className="fc" onClick={() => { setSelFood(f); setGrams(100); }} style={{ borderColor: "rgba(6,182,212,.15)" }}><div style={{ fontSize: 20 }}>{f.emoji}</div><div style={{ fontSize: 11, fontWeight: 500, color: "#e5e7eb", marginTop: 3 }}>{f.name}</div><div style={{ fontSize: 9, color: "#06b6d4" }}>{f.cal}cal</div></div>))}</div></div>)}
        <span onClick={() => setShowCustom(!showCustom)} style={{ fontSize: 12, color: "#10b981", cursor: "pointer", fontWeight: 600 }}>{showCustom ? "Cancel" : "+ Add Custom Food"}</span>
        {showCustom && (<div className="gs fade-in" style={{ marginTop: 10, border: "1px solid rgba(16,185,129,.15)" }}>
          <input className="inp" placeholder="Food name" value={custom.name} onChange={e => setCustom(p => ({ ...p, name: e.target.value }))} style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>Nutrition per 100g</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(80px,1fr))", gap: 6, marginBottom: 8 }}>
            {[["Calories*", "cal"], ["Protein(g)", "protein"], ["Carbs(g)", "carbs"], ["Fat(g)", "fat"], ["Fiber(g)", "fiber"]].map(([l, k]) => (<div key={k}><label style={{ fontSize: 10, color: "#6b7280" }}>{l}</label><input className="inp" type="number" placeholder="0" value={custom[k]} onChange={e => setCustom(p => ({ ...p, [k]: e.target.value }))} style={{ padding: 8, textAlign: "center" }} /></div>))}
          </div>
          <button className="bp" onClick={addCustomFood} disabled={!custom.name.trim() || !custom.cal} style={{ width: "100%", padding: 10 }}>+ Add</button>
        </div>)}
      </>}

      {/* Today's log */}
      {todayLog.length > 0 && (<div className="gs" style={{ marginTop: 14 }}><div className="sl">Today · {todayLog.length} items · {totals.cal}cal</div>
        {MEALS.map(meal => { const items = todayLog.map((f, i) => ({ ...f, _idx: i })).filter(f => f.meal === meal); if (items.length === 0) return null; return (<div key={meal} style={{ marginBottom: 10 }}><div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginBottom: 4 }}>{meal} — {items.reduce((s, f) => s + (f.cal || 0), 0)}cal</div>{items.map(f => (<div key={f._idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><span>{f.emoji}</span><div><div style={{ fontSize: 13 }}>{f.name}{f.grams && f.grams !== 100 ? <span style={{ color: "#6b7280" }}> {f.grams}g</span> : ""}</div><div style={{ fontSize: 10, color: "#4b5563" }}>P:{f.protein}g C:{f.carbs}g F:{f.fat}g</div></div></div><div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>{f.cal}cal</span><span onClick={() => removeFood(f._idx)} style={{ cursor: "pointer", color: "#4b5563", fontSize: 14 }}>×</span></div></div>))}</div>); })}
      </div>)}
    </div>)}

    {/* ════ WEEKLY TAB ════ */}
    {tab === "weekly" && (<div>
      {/* 7-day calorie chart */}
      <div className="gs" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 12 }}>📊 This Week's Calories</div>
        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 100, marginBottom: 8 }}>
          {weeklyData.map((day, i) => {
            const pct = target > 0 ? Math.min(120, (day.cal / target) * 100) : 0;
            const over = day.cal > target;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: 9, color: day.cal > 0 ? (over ? "#ef4444" : "#10b981") : "#4b5563", fontWeight: 600, marginBottom: 2 }}>{day.cal > 0 ? day.cal : ""}</div>
                <div style={{ width: "100%", background: over ? "rgba(239,68,68,.3)" : day.isToday ? "#10b981" : "rgba(16,185,129,.25)", borderRadius: "4px 4px 0 0", height: `${Math.max(4, pct * 0.7)}px`, transition: "height .5s" }} />
                <div style={{ fontSize: 10, color: day.isToday ? "#10b981" : "#6b7280", marginTop: 4, fontWeight: day.isToday ? 700 : 400 }}>{day.label}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4b5563" }}>
          <span>Target: {target} cal/day</span>
          <span>Avg: {Math.round(weeklyData.reduce((s, d) => s + d.cal, 0) / Math.max(1, weeklyData.filter(d => d.cal > 0).length))} cal/day</span>
        </div>
      </div>

      {/* Weekly Macros */}
      <div className="gs" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 12 }}>Weekly Macro Average</div>
        {(() => {
          const activeDays = weeklyData.filter(d => d.cal > 0);
          const n = Math.max(1, activeDays.length);
          const avg = { protein: Math.round(activeDays.reduce((s, d) => s + d.protein, 0) / n), carbs: Math.round(activeDays.reduce((s, d) => s + d.carbs, 0) / n), fat: Math.round(activeDays.reduce((s, d) => s + d.fat, 0) / n) };
          return (
            <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
              {[["Protein", avg.protein, proteinG, "#ef4444"], ["Carbs", avg.carbs, carbG, "#f59e0b"], ["Fat", avg.fat, fatG, "#06b6d4"]].map(([l, v, t, color]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <Ring pct={(v / t) * 100} color={color} size={56} stroke={5}>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{v}g</span>
                  </Ring>
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>{l}</div>
                  <div style={{ fontSize: 9, color: "#4b5563" }}>Goal: {t}g</div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Today's Macro by Meal */}
      {todayLog.length > 0 && (
        <div className="gs" style={{ padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 12 }}>🍽️ Today's Breakdown by Meal</div>
          {MEALS.map(meal => {
            const m = mealMacros[meal];
            if (!m || m.cal === 0) return null;
            const pct = target > 0 ? Math.round((m.cal / target) * 100) : 0;
            return (
              <div key={meal} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#f3f4f6" }}>{meal}</span>
                  <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{m.cal} cal ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,.04)", borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
                  <div style={{ height: "100%", borderRadius: 3, display: "flex" }}>
                    <div style={{ width: `${m.protein > 0 ? Math.max(5, (m.protein / (m.protein + m.carbs + m.fat)) * 100) : 0}%`, background: "#ef4444", transition: "width .5s" }} />
                    <div style={{ width: `${m.carbs > 0 ? Math.max(5, (m.carbs / (m.protein + m.carbs + m.fat)) * 100) : 0}%`, background: "#f59e0b", transition: "width .5s" }} />
                    <div style={{ width: `${m.fat > 0 ? Math.max(5, (m.fat / (m.protein + m.carbs + m.fat)) * 100) : 0}%`, background: "#06b6d4", transition: "width .5s" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#6b7280" }}>
                  <span style={{ color: "#ef4444" }}>P: {Math.round(m.protein)}g</span>
                  <span style={{ color: "#f59e0b" }}>C: {Math.round(m.carbs)}g</span>
                  <span style={{ color: "#06b6d4" }}>F: {Math.round(m.fat)}g</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>)}

    {/* ════ PLANS TAB ════ */}

    {/* ════ PLANS TAB ════ */}
    {tab === "plan" && (<div>
      {/* Plan sub-tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
        {[["templates", "🤖 Auto Plan"], ["weekly", "📅 Weekly"], ["shopping", "🛒 Shopping"], ["create", "✏️ Manual"]].map(([k, l]) => (
          <span key={k} className={`chip ${planTab === k ? "chip-a" : "chip-i"}`} onClick={() => setPlanTab(k)} style={{ flexShrink: 0, fontSize: 12 }}>{l}</span>
        ))}
      </div>

      {/* ── AUTO PLAN TAB ── */}
      {planTab === "templates" && (
        <div>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: 2 }}>YOUR DAILY TARGET</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{target} cal</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>P: {proteinG}g · C: {carbG}g · F: {fatG}g</div>
          </div>

          {/* Template cards */}
          {!selTemplate && (
            <div>
              <div className="sl">Choose a Diet Style</div>
              {DIET_TEMPLATES.map(t => (
                <div key={t.id} className="gc" onClick={() => { setSelTemplate(t); const plan = generateDayPlan(t, target); setGeneratedPlan(plan); }}
                  style={{ padding: 14, marginBottom: 8, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 28 }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{t.desc}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 10 }}>
                        <span style={{ color: "#ef4444" }}>P: {Math.round(t.protPct * 100)}%</span>
                        <span style={{ color: "#f59e0b" }}>C: {Math.round(t.carbPct * 100)}%</span>
                        <span style={{ color: "#06b6d4" }}>F: {Math.round(t.fatPct * 100)}%</span>
                      </div>
                    </div>
                    <span style={{ color: "#4b5563", fontSize: 18 }}>→</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Generated plan view */}
          {selTemplate && generatedPlan && (() => {
            const totals = getPlanDayTotals(generatedPlan);
            return (
              <div className="fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{selTemplate.icon} {selTemplate.name}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{totals.cal} cal · P:{Math.round(totals.protein)}g · C:{Math.round(totals.carbs)}g · F:{Math.round(totals.fat)}g</div>
                  </div>
                  <button className="bg" onClick={() => { setSelTemplate(null); setGeneratedPlan(null); }} style={{ padding: "6px 12px", fontSize: 11 }}>← Back</button>
                </div>

                {["Breakfast", "Lunch", "Dinner", "Snack"].map(meal => {
                  const items = generatedPlan[meal] || [];
                  if (items.length === 0) return null;
                  const mealCal = items.reduce((s, f) => s + (f.cal || 0), 0);
                  return (
                    <div key={meal} className="gs" style={{ marginBottom: 10, padding: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{meal}</span>
                        <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{mealCal} cal</span>
                      </div>
                      {items.map((f, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,.03)" : "none" }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 18 }}>{f.emoji}</span>
                            <div>
                              <div style={{ fontSize: 13, color: "#f3f4f6" }}>{f.name} <span style={{ color: "#6b7280", fontSize: 11 }}>{f.grams}g</span></div>
                              <div style={{ fontSize: 10, color: "#4b5563" }}>P:{f.protein}g C:{f.carbs}g F:{f.fat}g</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{f.cal}cal</span>
                            <span onClick={() => { const swaps = getMealSwaps(f, meal, selTemplate); if (swaps.length > 0) { const swap = swaps[Math.floor(Math.random() * swaps.length)]; const newPlan = { ...generatedPlan }; const ratio = (f.grams || 100) / 100; newPlan[meal] = [...newPlan[meal]]; newPlan[meal][i] = { ...swap, grams: f.grams || 100, cal: Math.round(swap.cal * ratio), protein: Math.round(swap.protein * ratio * 10) / 10, carbs: Math.round(swap.carbs * ratio * 10) / 10, fat: Math.round(swap.fat * ratio * 10) / 10, fiber: Math.round(swap.fiber * ratio * 10) / 10, meal }; setGeneratedPlan(newPlan); } }}
                              style={{ cursor: "pointer", fontSize: 12, color: "#6b7280", padding: "2px 6px" }}>🔄</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="bp" onClick={() => { Object.entries(generatedPlan).forEach(([meal, items]) => items.forEach(f => addFood(f, f.grams || 100, meal))); setTab("log"); }}
                    style={{ flex: 1, padding: 14, fontSize: 14 }}>✅ Log This Plan Today</button>
                  <button className="bg" onClick={() => { const plan = generateDayPlan(selTemplate, target); setGeneratedPlan(plan); }}
                    style={{ padding: "14px 16px", fontSize: 12 }}>🔄 Regenerate</button>
                </div>

                <button className="bg" onClick={() => { const wp = generateWeekPlan(selTemplate, target); setWeekPlan(wp); setShoppingList(getShoppingList(wp)); setPlanTab("weekly"); }}
                  style={{ width: "100%", marginTop: 8, padding: 12, fontSize: 13 }}>📅 Generate Full Week Plan</button>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── WEEKLY PLAN TAB ── */}
      {planTab === "weekly" && (
        <div>
          {!weekPlan ? (
            <div style={{ textAlign: "center", padding: 30, color: "#6b7280", fontSize: 13 }}>Generate a plan from the Auto Plan tab first.</div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: 4, marginBottom: 12, overflowX: "auto" }}>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                  <span key={day} className={`chip ${selWeekDay === day ? "chip-a" : "chip-i"}`} onClick={() => setSelWeekDay(day)}
                    style={{ flexShrink: 0, fontSize: 11, padding: "6px 10px" }}>{day.slice(0, 3)}</span>
                ))}
              </div>

              {weekPlan[selWeekDay] && (() => {
                const dayTotals = getPlanDayTotals(weekPlan[selWeekDay]);
                return (
                  <div>
                    <div style={{ textAlign: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{dayTotals.cal} cal</span>
                      <span style={{ fontSize: 11, color: "#6b7280" }}> · P:{Math.round(dayTotals.protein)}g C:{Math.round(dayTotals.carbs)}g F:{Math.round(dayTotals.fat)}g</span>
                    </div>
                    {["Breakfast", "Lunch", "Dinner", "Snack"].map(meal => {
                      const items = weekPlan[selWeekDay][meal] || [];
                      if (items.length === 0) return null;
                      return (
                        <div key={meal} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginBottom: 4 }}>{meal}</div>
                          {items.map((f, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
                              <span>{f.emoji} {f.name} <span style={{ color: "#6b7280" }}>{f.grams}g</span></span>
                              <span style={{ color: "#f59e0b" }}>{f.cal}cal</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    <button className="bp" onClick={() => { Object.entries(weekPlan[selWeekDay]).forEach(([meal, items]) => items.forEach(f => addFood(f, f.grams || 100, meal))); setTab("log"); }}
                      style={{ width: "100%", padding: 12, marginTop: 8 }}>✅ Log {selWeekDay}'s Plan</button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── SHOPPING LIST TAB ── */}
      {planTab === "shopping" && (
        <div>
          {shoppingList.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "#6b7280", fontSize: 13 }}>Generate a weekly plan first to see your shopping list.</div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>🛒 Weekly Shopping List</div>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{shoppingList.length} items</span>
              </div>
              {shoppingList.map((item, i) => (
                <div key={i} onClick={() => setCheckedShop(p => ({ ...p, [item.name]: !p[item.name] }))}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.03)", cursor: "pointer", opacity: checkedShop[item.name] ? 0.4 : 1 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: checkedShop[item.name] ? "1px solid #22c55e" : "1px solid rgba(255,255,255,.1)", background: checkedShop[item.name] ? "rgba(34,197,94,.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#22c55e" }}>
                    {checkedShop[item.name] ? "✓" : ""}
                  </div>
                  <span style={{ fontSize: 16 }}>{item.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#f3f4f6", textDecoration: checkedShop[item.name] ? "line-through" : "none" }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>{item.grams}g total · Used {item.count}× this week</div>
                  </div>
                </div>
              ))}
              <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#6b7280" }}>
                {Object.values(checkedShop).filter(Boolean).length}/{shoppingList.length} items checked
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MANUAL CREATE TAB ── */}
      {planTab === "create" && (
        <div>
          {savedPlans.length > 0 && (<div className="gs" style={{ marginBottom: 16 }}>
            <div className="sl">Saved Plans ({savedPlans.length})</div>
            {savedPlans.map(plan => (<div key={plan.id} className="gc" style={{ padding: 14, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontSize: 15, fontWeight: 600 }}>{plan.name}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{MEALS.map(m => `${(plan.items[m] || []).length} ${m.toLowerCase()}`).join(" · ")}</div></div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="bp" onClick={() => loadPlan(plan)} style={{ padding: "6px 12px", fontSize: 11 }}>Edit</button>
                  <button className="bg" onClick={() => { MEALS.forEach(meal => { (plan.items[meal] || []).forEach(f => { addFood(f, f.grams || 100, meal) }) }); setTab("log"); }} style={{ padding: "6px 12px", fontSize: 11 }}>Log</button>
                  <button onClick={() => deletePlan(plan.id)} style={{ padding: "6px 8px", background: "transparent", border: "1px solid rgba(239,68,68,.15)", borderRadius: 6, color: "#ef4444", fontSize: 11, cursor: "pointer" }}>✕</button>
                </div>
              </div>
            </div>))}
          </div>)}

          <div className="gs" style={{ marginBottom: 16 }}>
            <div className="sl">{editingPlan ? "Edit Plan" : "Create New Plan"}</div>
            <input className="inp" placeholder="Plan name..." value={planName} onChange={e => setPlanName(e.target.value)} style={{ marginBottom: 10 }} />
            {MEALS.map(meal => (<div key={meal} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#10b981", marginBottom: 6 }}>{meal}</div>
              {(planItems[meal] || []).map((f, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                <span style={{ fontSize: 13 }}>{f.emoji} {f.name} <span style={{ color: "#6b7280" }}>{f.grams || 100}g</span></span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ fontSize: 11, color: "#f59e0b" }}>{Math.round(f.cal * (f.grams || 100) / 100)}cal</span><span onClick={() => removeFromPlan(meal, i)} style={{ cursor: "pointer", color: "#4b5563" }}>×</span></div>
              </div>))}
              {(planItems[meal] || []).length === 0 && <div style={{ fontSize: 12, color: "#4b5563", padding: "4px 0" }}>No items</div>}
            </div>))}
            <input className="inp" placeholder="Search food to add..." value={planSearch} onChange={e => setPlanSearch(e.target.value)} style={{ marginBottom: 8 }} />
            {planSearch.length >= 2 && <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 10 }}>
              {searchFoods(planSearch).slice(0, 12).map((f, i) => (<div key={f.name + i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.03)", cursor: "pointer" }}>
                <span style={{ fontSize: 13 }}>{f.emoji} {f.name} <span style={{ color: "#6b7280" }}>{f.cal}cal/100g</span></span>
                <div style={{ display: "flex", gap: 4 }}>{MEALS.map(m => <span key={m} onClick={() => addToPlan(f, m)} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,.06)", color: "#10b981", cursor: "pointer", border: "1px solid rgba(16,185,129,.15)" }}>{m[0]}</span>)}</div>
              </div>))}
            </div>}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="bp" onClick={savePlan} disabled={!planName.trim()} style={{ flex: 1, padding: 12 }}>💾 Save</button>
              {editingPlan && <button className="bg" onClick={() => { setEditingPlan(null); setPlanName(""); setPlanItems({ Breakfast: [], Lunch: [], Dinner: [], Snack: [] }) }} style={{ padding: "12px 16px" }}>Cancel</button>}
            </div>
          </div>
        </div>
      )}
    </div>)}


    {/* ════ HISTORY TAB ════ */}

    {/* ════ HISTORY TAB ════ */}
    {tab === "history" && <HistoryPanel entries={formatNutritionHistory(foodLog)} title="Nutrition History" emptyText="Start logging food to see history" />}
  </div>);
}