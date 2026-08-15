"use client";
import { useState, useMemo, useRef, useEffect } from 'react';
import { AnimatedCard, StaggerContainer, StaggerItem } from './PageTransition';
import { XP } from '../data';
import { FOOD_DATABASE, FOOD_CATEGORIES, searchFoods, searchFoodsCombined } from '../data/foodDatabase';
import { DIET_TEMPLATES, generateDayPlan, generateWeekPlan, getPlanDayTotals, getShoppingList, getSwapOptions as getMealSwaps } from '../data/mealPlanner';
import { today, toArr } from '../utils';
import HistoryPanel from './HistoryPanel';
import { formatNutritionHistory } from '../historyFormatters';
import { localSync } from '@/utils/localSync';

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
function Ring({ pct, color, size = 48, stroke = 4, children }) { const p = Number.isFinite(pct) ? pct : 0; const r = (size - stroke) / 2, c = 2 * Math.PI * r; return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, p / 100))} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} /></svg><div className="absolute inset-0 flex items-center justify-center">{children}</div></div>) }

export default function Nutrition({ foodLog = {}, setFoodLog = () => { }, addXP = () => { }, profile = {} }) {
  const d = today();
  const todayLog = toArr(foodLog[d]).filter(f => f && typeof f === 'object' && f.name);
  const rawWater = foodLog[`water_${d}`];
  const todayWater = typeof rawWater === 'number' ? rawWater : (rawWater?.entries ?? rawWater?.data ?? 0);
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
  const shSync = useMemo(() => localSync("ignite-scan-history", []), []);
  const [scanHistory, setScanHistory] = useState(shSync.get);
  const [scanResults, setScanResults] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scanPhoto, setScanPhoto] = useState(null);
  const videoRef = useRef(null), canvasRef = useRef(null), streamRef = useRef(null), fileRef = useRef(null);

  // Diet plan state
  const [planType, setPlanType] = useState(PLAN_TYPES[0]);
  const [savedPlans, setSavedPlans] = useState(toArr(foodLog._savedPlans));
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
    const dates = Object.keys(foodLog).filter(k => !k.startsWith("water_") && !k.startsWith("_") && (Array.isArray(foodLog[k]) || (foodLog[k] && typeof foodLog[k] === 'object')));
    dates.sort().reverse().slice(0, 7).forEach(dt => {
      toArr(foodLog[dt]).filter(f => f && f.name).forEach(f => {
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
      const dayLog = toArr(foodLog[ds]);
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
    setFoodLog(p => ({ ...p, [d]: [...toArr(p[d]), scaled] }));
    addXP(XP.food, "Food logged");
    setSelFood(null); setGrams(100);
  };

  const addCustomFood = () => {
    if (!custom.name.trim() || !custom.cal) return;
    addFood({ name: custom.name.trim(), emoji: "🍽️", cal: parseInt(custom.cal) || 0, protein: parseFloat(custom.protein) || 0, carbs: parseFloat(custom.carbs) || 0, fat: parseFloat(custom.fat) || 0, fiber: parseFloat(custom.fiber) || 0, category: "Custom" }, 100, selMeal);
    setCustom({ name: "", cal: "", protein: "", carbs: "", fat: "", fiber: "" }); setShowCustom(false);
  };

  const removeFood = (idx) => setFoodLog(p => ({ ...p, [d]: toArr(p[d]).filter((_, i) => i !== idx) }));
  const addWater = () => setFoodLog(p => ({ ...p, [`water_${d}`]: (p[`water_${d}`] || 0) + 1 }));
  const removeWater = () => setFoodLog(p => ({ ...p, [`water_${d}`]: Math.max(0, (p[`water_${d}`] || 0) - 1) }));

  // ── Scanner ──
  const startCam = async () => { try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 640 } } }); streamRef.current = s; if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play() } } catch (e) { setScanError("Camera unavailable. Upload a photo instead.") } };
  const stopCam = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null } };
  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const cv = canvasRef.current, v = videoRef.current;
    cv.width = 256; cv.height = 256;
    const ctx = cv.getContext("2d");
    const sz = Math.min(v.videoWidth, v.videoHeight);
    ctx.drawImage(v, (v.videoWidth - sz) / 2, (v.videoHeight - sz) / 2, sz, sz, 0, 0, 256, 256);
    const url = cv.toDataURL("image/jpeg", .8);
    setScanPhoto(url);
    stopCam();
    // Send captured photo to Vision AI
    analyzeImage(url);
  };
  const handleFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      setScanPhoto(ev.target.result);
      // Send image directly to Vision AI for analysis
      analyzeImage(ev.target.result);
    };
    r.readAsDataURL(f);
  };
  // AI Food Analysis — Direct Groq API (no backend needed)
  // Analyze food from photo using Vision AI (Groq Vision / Gemini)
  // Compress image to reduce size before sending to API
  const compressImage = (base64, maxWidth = 256) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = base64;
    });
  };

  const analyzeImage = async (base64Image) => {
    setScanning(true); setScanError(null); setScanResults(null);
    setScanMode("camera");
    // Compress image to avoid large payloads
    const compressed = await compressImage(base64Image, 512);
    try {
      const response = await fetch("/api/food-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressed }),
      });
      const data = await response.json();
      if (data.foods?.length > 0) {
        setScanResults(data.foods);
        setScanError(null);
      } else if (data.error) {
        setScanError(data.error);
      } else {
        setScanError("Could not identify food. Try a clearer photo or use Describe mode.");
      }
    } catch (err) {
      setScanError("Analysis failed. Check your internet connection and try again.");
    }
    setScanning(false);
  };

  const analyzeWithAI = async (prompt) => {
    setScanning(true); setScanError(null); setScanResults(null);
    try {
      const response = await fetch("/api/food-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: prompt }),
      });
      const data = await response.json();
      if (data.foods?.length > 0) {
        setScanResults(data.foods);
      } else if (data.error) {
        setScanError(data.error);
      } else {
        setScanError("Could not identify food. Try describing it differently.");
      }
    } catch (e) {
      setScanError("Analysis failed. Check your internet connection and try again.");
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
  useEffect(() => { shSync.set(scanHistory); }, [scanHistory]);

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
    return (<div className="max-w-full overflow-x-hidden">
      <div className="flex justify-between items-center mb-4">
        <div><div className="text-[18px] font-extrabold text-gray-100 font-heading">🤖 AI Food Scanner</div><div className="text-xs text-gray-500">Camera, photo, or describe your meal</div></div>
        <button className="bg p-[8px_14px]" onClick={() => { stopCam(); setTab("log"); setScanResults(null); setScanPhoto(null); setScanError(null); setScanMode("choose") }}>← Back</button>
      </div>

      {/* Mode selector */}
      {scanMode === "choose" && !scanning && !scanResults && (
        <div>
          <div className="grid grid-cols-3 gap-[10px] mb-4">
            <div className="gc p-5 text-center cursor-pointer" onClick={() => { setScanMode("camera"); setTimeout(startCam, 100) }}>
              <div className="text-[32px] mb-1.5">📸</div>
              <div className="text-[13px] font-bold text-emerald-500">Camera</div>
              <div className="text-[10px] text-gray-500">Point at food</div>
            </div>
            <div className="gc p-5 text-center cursor-pointer" onClick={() => fileRef.current?.click()}>
              <div className="text-[32px] mb-1.5">📁</div>
              <div className="text-[13px] font-bold text-cyan-500">Upload</div>
              <div className="text-[10px] text-gray-500">From gallery</div>
            </div>
            <div className="gc p-5 text-center cursor-pointer" onClick={() => setScanMode("text")}>
              <div className="text-[32px] mb-1.5">✍️</div>
              <div className="text-[13px] font-bold text-violet-500">Describe</div>
              <div className="text-[10px] text-gray-500">Type your meal</div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

          {/* Recent scans */}
          {scanHistory.length > 0 && (
            <div className="gs p-[14px]">
              <div className="sl">Recent Scans</div>
              {scanHistory.slice(0, 5).map((scan, i) => (
                <div key={i} className="flex justify-between items-center py-2" style={{ borderBottom: i < Math.min(4, scanHistory.length - 1) ? "1px solid rgba(255,255,255,.03)" : "none" }}>
                  <div className="flex gap-2 items-center">
                    <span className="text-[16px]">{scan.emoji || "🍽️"}</span>
                    <div>
                      <div className="text-[13px] text-gray-100">{scan.name}</div>
                      <div className="text-[10px] text-gray-500">P:{scan.protein}g C:{scan.carbs}g F:{scan.fat}g</div>
                    </div>
                  </div>
                  <button className="bp px-3 py-1.5 text-[11px]" onClick={() => addFood(scan, 100, selMeal)}>+ Add</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Camera mode */}
      {scanMode === "camera" && !scanPhoto && !scanning && (
        <div>
          <div className="w-full max-w-[400px] aspect-square rounded-2xl overflow-hidden border-2 border-emerald-500/20 mx-auto mb-4 bg-[#111] relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-[3px] border-emerald-500/30 rounded-[14px] pointer-events-none">
              <div className="absolute top-[20%] left-[20%] right-[20%] bottom-[20%] border border-dashed border-emerald-500/40 rounded-lg" />
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-[10px] max-w-[400px] mx-auto">
            <button className="bg p-[14px_16px]" onClick={() => setScanMode("choose")}>←</button>
            <button className="bp flex-1 p-[14px] text-[16px]" onClick={capture}>📸 Capture</button>
          </div>
          {scanError && <div className="text-center text-red-500 text-[13px] mt-3">{scanError}</div>}
        </div>
      )}

      {/* Text describe mode */}
      {scanMode === "text" && !scanning && !scanResults && (
        <div className="fade-in">
          <div className="mb-3">
            <div className="text-sm font-bold text-gray-100 mb-2">✍️ Describe what you ate</div>
            <textarea className="inp resize-none w-full text-sm p-3" value={textDesc} onChange={e => setTextDesc(e.target.value)}
              placeholder="Example: 2 rotis with dal and chicken curry, a bowl of rice, and buttermilk"
              rows={3} />
          </div>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {["2 idli with sambar and chutney", "Chicken biryani with raita", "1 plate poha with peanuts", "Paneer butter masala with 3 rotis", "Oats with banana and milk"].map(ex => (
              <span key={ex} className="chip chip-i text-[10px] cursor-pointer" onClick={() => setTextDesc(ex)}>{ex}</span>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="bg p-[12px_16px]" onClick={() => setScanMode("choose")}>←</button>
            <button className="bp flex-1 p-3 text-sm" onClick={() => analyzeText(textDesc)} disabled={!textDesc.trim()}>🤖 Analyze Food</button>
          </div>
        </div>
      )}

      {/* Photo preview with error/retry (when Vision analysis done but no results) */}
      {scanMode === "camera" && scanPhoto && !scanning && !scanResults && (
        <div className="text-center py-5">
          <div className="w-[200px] h-[200px] rounded-2xl overflow-hidden mx-auto mb-4 border border-white/[.08]">
            <img src={scanPhoto} alt="Food" className="w-full h-full object-cover" />
          </div>
          {scanError && <div className="text-[13px] text-amber-500 mb-3 px-5">{scanError}</div>}
          <div className="flex gap-2 justify-center">
            <button className="bp p-[12px_20px]" onClick={() => analyzeImage(scanPhoto)}>🔄 Retry Analysis</button>
            <button className="bg p-[12px_20px]" onClick={() => { setScanMode("text"); setTextDesc(""); }}>✏️ Describe Instead</button>
            <button className="bg p-[12px_16px]" onClick={() => { setScanMode("choose"); setScanPhoto(null); setScanError(null); }}>✕</button>
          </div>
        </div>
      )}

      {/* Scanning animation */}
      {scanning && (
        <div className="text-center py-10">
          {scanPhoto && <div className="w-[160px] h-[160px] rounded-2xl overflow-hidden mx-auto mb-5 border-2 border-emerald-500/20"><img src={scanPhoto} alt="" className="w-full h-full object-cover" /></div>}
          <div className="flex gap-1.5 justify-center mb-3">
            {[0, 1, 2].map(i => <div key={i} className="w-[10px] h-[10px] rounded-full bg-emerald-500" style={{ animation: `dotPulse 1.2s ${i * .2}s infinite` }} />)}
          </div>
          <div className="text-sm text-emerald-500 font-semibold">Analyzing your food with AI...</div>
          <div className="text-[11px] text-gray-500 mt-1">Estimating calories, protein, carbs, fat</div>
        </div>
      )}

      {/* Scan results */}
      {scanResults && (
        <div className="fade-in">
          {scanPhoto && <div className="w-[120px] h-[120px] rounded-xl overflow-hidden mx-auto mb-3"><img src={scanPhoto} alt="" className="w-full h-full object-cover" /></div>}
          <div className="text-center mb-[14px]">
            <div className="text-[18px] font-bold text-green-500">✓ {scanResults.length} item{scanResults.length > 1 ? "s" : ""} identified</div>
            <div className="text-xs text-gray-500">Total: {scanResults.reduce((s, f) => s + (f.cal || 0), 0)} cal</div>
          </div>
          <div className="flex gap-1.5 mb-3 justify-center">{MEALS.map(m => <span key={m} className={`chip ${selMeal === m ? "chip-a" : "chip-i"}`} onClick={() => setSelMeal(m)}>{m}</span>)}</div>

          {scanResults.map((f, i) => (
            <div key={i} className="gs mb-2 p-3">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-[15px] font-semibold text-gray-100">{f.emoji || "🍽️"} {f.name}</div>
                  <div className="text-[11px] text-gray-500">{f.serving || "1 serving"} · {f.cal}cal</div>
                  <div className="flex gap-[10px] mt-1 text-[10px]">
                    <span className="text-red-500">P: {f.protein}g</span>
                    <span className="text-amber-500">C: {f.carbs}g</span>
                    <span className="text-cyan-500">F: {f.fat}g</span>
                    <span className="text-green-500">Fb: {f.fiber || 0}g</span>
                  </div>
                </div>
                <button className="bp p-[8px_14px] shrink-0" onClick={() => { addFood({ ...f, fiber: f.fiber || 0, category: "AI Scanned" }, 100, selMeal); setScanHistory(p => [f, ...p.filter(x => x.name !== f.name)].slice(0, 20)); }}>+ Add</button>
              </div>
            </div>
          ))}

          <div className="flex gap-[10px] mt-3">
            <button className="bp flex-1 p-3" onClick={() => { scanResults.forEach(f => { addFood({ ...f, fiber: f.fiber || 0, category: "AI Scanned" }, 100, selMeal); setScanHistory(p => [f, ...p.filter(x => x.name !== f.name)].slice(0, 20)); }); stopCam(); setScanResults(null); setScanPhoto(null); setScanMode("choose"); setTab("log") }}>✅ Add All & Done</button>
            <button className="bg p-[12px_16px]" onClick={() => { setScanResults(null); setScanPhoto(null); setScanMode("choose") }}>↻ Rescan</button>
          </div>
        </div>
      )}
    </div>);
  }

  return (<div className="max-w-full overflow-x-hidden">
    {/* Tabs */}
    <div className="flex gap-1.5 justify-center mb-4 flex-wrap">
      {[["log", "🍎 Log"], ["weekly", "📊 Weekly"], ["scan", "📸 Scan"], ["plan", "📋 Plans"], ["history", "📅 History"]].map(([k, l]) => (
        <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"} p-[8px_14px]`} onClick={() => { if (k === "scan") { setTab("scan"); setTimeout(startCam, 100) } else setTab(k) }}>{l}</span>
      ))}
    </div>

    {/* ════ LOG TAB ════ */}
    {tab === "log" && (<div>
      {/* Remaining calories */}
      <div className="gs mb-4 text-center p-5">
        <div className="text-[11px] text-gray-500 font-heading tracking-[2px]">REMAINING TODAY</div>
        <div className={`text-[42px] font-black font-heading leading-[1.1] ${remaining > 0 ? "text-emerald-500" : "text-red-500"}`}>{remaining > 0 ? remaining : 0}</div>
        <div className="text-xs text-gray-500">of {target} cal · Eaten: {totals.cal}</div>
        <div className="inline-flex items-center gap-1.5 mt-2 px-[14px] py-1 rounded-full" style={{ background: nutScore.color + "10", border: "1px solid " + nutScore.color + "25" }}>
          <span className="text-[18px] font-black font-heading" style={{ color: nutScore.color }}>{nutScore.grade}</span>
          <span className="text-[11px]" style={{ color: nutScore.color }}>{nutScore.desc}</span>
        </div>
        <div className="h-2 bg-white/[.04] rounded overflow-hidden mt-[10px]">
          <div className="h-full rounded transition-[width] duration-500" style={{ width: `${Math.min(100, (totals.cal / target) * 100)}%`, background: totals.cal > target ? "#ef4444" : "linear-gradient(90deg,#10b981,#06b6d4)" }} />
        </div>
        <div className="flex justify-center gap-4 mt-3">
          {[["Protein", totals.protein, proteinG, "#ef4444"], ["Carbs", totals.carbs, carbG, "#f59e0b"], ["Fat", totals.fat, fatG, "#06b6d4"], ["Fiber", totals.fiber, 25, "#22c55e"]].map(([l, v, t, c]) => (
            <div key={l} className="text-center"><Ring pct={(v / t) * 100} color={c} size={40} stroke={3}><span className="text-[11px] font-bold" style={{ color: c }}>{Math.round(v)}</span></Ring><div className="text-[11px] text-gray-500 mt-0.5">{l}</div></div>
          ))}
        </div>
      </div>

      {/* Enhanced Water Tracker */}
      <div className="gs mb-[14px] p-[14px]">
        <div className="flex items-center gap-[14px]">
          <div className="relative w-[44px] h-[60px] rounded-[6px_6px_10px_10px] border-2 border-cyan-500/30 overflow-hidden shrink-0">
            <div className="absolute bottom-0 left-0 right-0 rounded-[0_0_8px_8px] transition-[height] duration-500 ease-out" style={{ height: `${Math.min(100, (todayWater / WATER_GOAL) * 100)}%`, background: "linear-gradient(180deg, rgba(6,182,212,.3), rgba(6,182,212,.15))" }} />
            <div className="absolute inset-0 flex items-center justify-center text-[16px]">💧</div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <div>
                <span className={`text-xl font-extrabold font-heading ${todayWater >= WATER_GOAL ? "text-green-500" : "text-cyan-500"}`}>{todayWater}</span>
                <span className="text-[13px] text-gray-500">/{WATER_GOAL} glasses</span>
                {todayWater >= WATER_GOAL && <span className="text-xs text-green-500 ml-1.5">✓ Goal!</span>}
              </div>
              <div className="flex gap-1.5">
                <button className="bg px-3 py-1.5 text-[16px]" onClick={removeWater}>−</button>
                <button className="bp px-[14px] py-1.5 text-[16px]" onClick={addWater}>+</button>
              </div>
            </div>
            <div className="flex gap-[3px] mt-1.5">
              {Array.from({ length: WATER_GOAL }, (_, i) => (
                <div key={i} onClick={() => setFoodLog(p => ({ ...p, [`water_${d}`]: i + 1 }))} className={`flex-1 h-1.5 rounded-[3px] cursor-pointer transition-colors duration-300 ${i < todayWater ? "bg-cyan-500" : "bg-white/[.06]"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Meal selector */}
      <div className="flex gap-1.5 mb-3">{MEALS.map(m => { const mc = todayLog.filter(f => f.meal === m); const cal = mc.reduce((s, f) => s + (f.cal || 0), 0); return <span key={m} className={`chip ${selMeal === m ? "chip-a" : "chip-i"}`} onClick={() => setSelMeal(m)}>{m}{mc.length > 0 ? ` (${cal}cal)` : ""}</span> })}</div>

      {/* Meal timing */}
      <div className="px-3 py-1.5 rounded-lg bg-[rgba(16,185,129,.03)] border border-[rgba(16,185,129,.08)] mb-[10px] flex gap-2 items-center">
        <span className="text-sm">🕐</span>
        <div>
          <span className="text-[11px] text-emerald-500 font-semibold">{MEAL_TIMES[selMeal]?.time}</span>
          <span className="text-[11px] text-gray-500"> — {MEAL_TIMES[selMeal]?.tip}</span>
        </div>
      </div>

      {/* Food quantity picker */}
      {selFood && (<div className="gs fade-in mb-[14px] border border-emerald-500/20">
        <div className="flex items-center gap-3 mb-[10px]">
          <span className="text-[28px]">{selFood.emoji}</span>
          <div className="flex-1"><div className="text-[16px] font-semibold text-gray-100">{selFood.name}</div><div className="text-[11px] text-gray-500">{selFood.category} · Nutrition per 100g</div></div>
        </div>
        <div className="mb-3">
          <div className="text-[11px] text-gray-500 mb-1.5">Weight in grams</div>
          <div className="flex gap-2 items-center">
            <input className="inp w-20 text-center text-[18px] font-bold p-[10px]" type="number" value={grams} onChange={e => setGrams(Math.max(1, parseInt(e.target.value) || 0))} />
            <span className="text-gray-500 text-sm">grams</span>
          </div>
          <div className="flex gap-1.5 mt-2">{GRAM_PRESETS.map(g => <span key={g} className={`chip ${grams === g ? "chip-a" : "chip-i"} flex-1 justify-center py-1.5`} onClick={() => setGrams(g)}>{g}g</span>)}</div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(55px,1fr))] gap-1.5 mb-3 text-center p-[10px] bg-white/[.02] rounded-lg">
          {[["Cal", Math.round(selFood.cal * grams / 100), "#f59e0b"], ["Protein", Math.round(selFood.protein * grams / 100 * 10) / 10, "#ef4444"], ["Carbs", Math.round(selFood.carbs * grams / 100 * 10) / 10, "#f59e0b"], ["Fat", Math.round(selFood.fat * grams / 100 * 10) / 10, "#06b6d4"], ["Fiber", Math.round(selFood.fiber * grams / 100 * 10) / 10, "#22c55e"]].map(([l, v, c]) => (
            <div key={l}><div className="text-[16px] font-bold" style={{ color: c }}>{v}{l === "Cal" ? "" : "g"}</div><div className="text-[11px] text-gray-500">{l}</div></div>
          ))}
        </div>
        <div className="flex gap-2"><button className="bp flex-1 p-3" onClick={() => addFood(selFood, grams, selMeal)}>+ Add {grams}g to {selMeal}</button><button className="bg p-[12px_16px]" onClick={() => { setSelFood(null); setGrams(100) }}>Cancel</button></div>
      </div>)}

      {/* Quick Add — Recent Foods */}
      {!selFood && recentFoods.length > 0 && (
        <div className="mb-3">
          <div className="text-[11px] text-gray-500 font-semibold mb-1.5">⚡ Quick Add — Recent</div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {recentFoods.filter(f => f && f.name).slice(0, 8).map((f, i) => (
              <div key={f.name + i} onClick={() => addFood(f, 100, selMeal)} className="shrink-0 px-3 py-2 rounded-[10px] bg-white/[.02] border border-white/[.06] cursor-pointer text-center min-w-[70px]">
                <div className="text-[18px]">{f.emoji || "🍽️"}</div>
                <div className="text-[10px] text-gray-200 mt-0.5">{f.name.length > 10 ? f.name.slice(0, 10) + "…" : f.name}</div>
                <div className="text-[11px] text-gray-500">{f.cal || 0}cal</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + Category filter */}
      {!selFood && <>
        <input className="inp mb-2" placeholder="Search 199 foods... (biryani, idli, paneer, dal...)" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-1 mb-[10px] overflow-x-auto pb-1">
          <span className={`chip ${selCat === "All" ? "chip-a" : "chip-i"} shrink-0`} onClick={() => setSelCat("All")}>All</span>
          {FOOD_CATEGORIES.map(c => <span key={c} className={`chip ${selCat === c ? "chip-a" : "chip-i"} shrink-0 text-[11px]`} onClick={() => setSelCat(c)}>{c}</span>)}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2 mb-3 max-h-[300px] overflow-y-auto">
          {filtered.slice(0, 36).map((f, i) => (<div key={f.name + i} className="fc" onClick={() => { setSelFood(f); setGrams(100) }}><div className="text-xl">{f.emoji}</div><div className="text-[11px] font-medium text-gray-200 mt-[3px]">{f.name}</div><div className="text-[11px] text-gray-500">{f.cal}cal/100g</div></div>))}
        </div>
        {filtered.length === 0 && search && !apiSearching && apiResults.length === 0 && <div className="text-center text-gray-500 py-3 text-[13px]">No food found for "{search}"</div>}
        {apiSearching && <div className="text-center py-2 text-xs text-cyan-500">Searching global database...</div>}
        {apiResults.length > 0 && (<div className="mt-3"><div className="text-xs text-cyan-500 font-semibold mb-2">More from global database ({apiResults.length})</div><div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2 max-h-[200px] overflow-y-auto">{apiResults.map((f, i) => (<div key={"api" + i} className="fc border-cyan-500/[.15]" onClick={() => { setSelFood(f); setGrams(100); }}><div className="text-xl">{f.emoji}</div><div className="text-[11px] font-medium text-gray-200 mt-[3px]">{f.name}</div><div className="text-[11px] text-cyan-500">{f.cal}cal</div></div>))}</div></div>)}
        <span onClick={() => setShowCustom(!showCustom)} className="text-xs text-emerald-500 cursor-pointer font-semibold">{showCustom ? "Cancel" : "+ Add Custom Food"}</span>
        {showCustom && (<div className="gs fade-in mt-[10px] border border-emerald-500/[.15]">
          <input className="inp mb-2" placeholder="Food name" value={custom.name} onChange={e => setCustom(p => ({ ...p, name: e.target.value }))} />
          <div className="text-[10px] text-gray-500 mb-1">Nutrition per 100g</div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] gap-1.5 mb-2">
            {[["Calories*", "cal"], ["Protein(g)", "protein"], ["Carbs(g)", "carbs"], ["Fat(g)", "fat"], ["Fiber(g)", "fiber"]].map(([l, k]) => (<div key={k}><label className="text-[10px] text-gray-500">{l}</label><input className="inp p-2 text-center" type="number" placeholder="0" value={custom[k]} onChange={e => setCustom(p => ({ ...p, [k]: e.target.value }))} /></div>))}
          </div>
          <button className="bp w-full p-[10px]" onClick={addCustomFood} disabled={!custom.name.trim() || !custom.cal}>+ Add</button>
        </div>)}
      </>}

      {/* Today's log */}
      {todayLog.length > 0 && (<div className="gs mt-[14px]"><div className="sl">Today · {todayLog.length} items · {totals.cal}cal</div>
        {MEALS.map(meal => { const items = todayLog.map((f, i) => ({ ...f, _idx: i })).filter(f => f.meal === meal); if (items.length === 0) return null; return (<div key={meal} className="mb-[10px]"><div className="text-xs text-emerald-500 font-semibold mb-1">{meal} — {items.reduce((s, f) => s + (f.cal || 0), 0)}cal</div>{items.map(f => (<div key={f._idx} className="flex justify-between items-center py-1.5 border-b border-white/[.03]"><div className="flex gap-2 items-center"><span>{f.emoji}</span><div><div className="text-[13px]">{f.name}{f.grams && f.grams !== 100 ? <span className="text-gray-500"> {f.grams}g</span> : ""}</div><div className="text-[10px] text-gray-600">P:{f.protein}g C:{f.carbs}g F:{f.fat}g</div></div></div><div className="flex gap-2 items-center"><span className="text-[13px] font-semibold text-amber-500">{f.cal}cal</span><span onClick={() => removeFood(f._idx)} className="cursor-pointer text-gray-600 text-sm">×</span></div></div>))}</div>); })}
      </div>)}
    </div>)}

    {/* ════ WEEKLY TAB ════ */}
    {tab === "weekly" && (<div>
      {/* 7-day calorie chart */}
      <div className="gs mb-4 p-4">
        <div className="text-sm font-bold text-gray-100 font-heading mb-3">📊 This Week's Calories</div>
        <div className="flex gap-1 items-end h-[100px] mb-2">
          {weeklyData.map((day, i) => {
            const pct = target > 0 ? Math.min(120, (day.cal / target) * 100) : 0;
            const over = day.cal > target;
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className={`text-[11px] font-semibold mb-0.5 ${day.cal > 0 ? (over ? "text-red-500" : "text-emerald-500") : "text-gray-600"}`}>{day.cal > 0 ? day.cal : ""}</div>
                <div className="w-full rounded-t transition-[height] duration-500" style={{ background: over ? "rgba(239,68,68,.3)" : day.isToday ? "#10b981" : "rgba(16,185,129,.25)", height: `${Math.max(4, pct * 0.7)}px` }} />
                <div className={`text-[10px] mt-1 ${day.isToday ? "text-emerald-500 font-bold" : "text-gray-500 font-normal"}`}>{day.label}</div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>Target: {target} cal/day</span>
          <span>Avg: {Math.round(weeklyData.reduce((s, d) => s + d.cal, 0) / Math.max(1, weeklyData.filter(d => d.cal > 0).length))} cal/day</span>
        </div>
      </div>

      {/* Weekly Macros */}
      <div className="gs mb-4 p-4">
        <div className="text-sm font-bold text-gray-100 font-heading mb-3">Weekly Macro Average</div>
        {(() => {
          const activeDays = weeklyData.filter(d => d.cal > 0);
          const n = Math.max(1, activeDays.length);
          const avg = { protein: Math.round(activeDays.reduce((s, d) => s + d.protein, 0) / n), carbs: Math.round(activeDays.reduce((s, d) => s + d.carbs, 0) / n), fat: Math.round(activeDays.reduce((s, d) => s + d.fat, 0) / n) };
          return (
            <div className="flex justify-center gap-5">
              {[["Protein", avg.protein, proteinG, "#ef4444"], ["Carbs", avg.carbs, carbG, "#f59e0b"], ["Fat", avg.fat, fatG, "#06b6d4"]].map(([l, v, t, color]) => (
                <div key={l} className="text-center">
                  <Ring pct={(v / t) * 100} color={color} size={56} stroke={5}>
                    <span className="text-xs font-bold" style={{ color }}>{v}g</span>
                  </Ring>
                  <div className="text-[10px] text-gray-500 mt-1">{l}</div>
                  <div className="text-[11px] text-gray-600">Goal: {t}g</div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Today's Macro by Meal */}
      {todayLog.length > 0 && (
        <div className="gs p-4">
          <div className="text-sm font-bold text-gray-100 font-heading mb-3">🍽️ Today's Breakdown by Meal</div>
          {MEALS.map(meal => {
            const m = mealMacros[meal];
            if (!m || m.cal === 0) return null;
            const pct = target > 0 ? Math.round((m.cal / target) * 100) : 0;
            return (
              <div key={meal} className="mb-[10px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[13px] font-semibold text-gray-100">{meal}</span>
                  <span className="text-xs text-amber-500 font-semibold">{m.cal} cal ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-white/[.04] rounded-[3px] overflow-hidden mb-1">
                  <div className="h-full rounded-[3px] flex">
                    <div className="bg-red-500 transition-[width] duration-500" style={{ width: `${m.protein > 0 ? Math.max(5, (m.protein / (m.protein + m.carbs + m.fat)) * 100) : 0}%` }} />
                    <div className="bg-amber-500 transition-[width] duration-500" style={{ width: `${m.carbs > 0 ? Math.max(5, (m.carbs / (m.protein + m.carbs + m.fat)) * 100) : 0}%` }} />
                    <div className="bg-cyan-500 transition-[width] duration-500" style={{ width: `${m.fat > 0 ? Math.max(5, (m.fat / (m.protein + m.carbs + m.fat)) * 100) : 0}%` }} />
                  </div>
                </div>
                <div className="flex gap-[10px] text-[10px] text-gray-500">
                  <span className="text-red-500">P: {Math.round(m.protein)}g</span>
                  <span className="text-amber-500">C: {Math.round(m.carbs)}g</span>
                  <span className="text-cyan-500">F: {Math.round(m.fat)}g</span>
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
      <div className="flex gap-1.5 mb-[14px] overflow-x-auto">
        {[["templates", "🤖 Auto Plan"], ["weekly", "📅 Weekly"], ["shopping", "🛒 Shopping"], ["create", "✏️ Manual"]].map(([k, l]) => (
          <span key={k} className={`chip ${planTab === k ? "chip-a" : "chip-i"} shrink-0 text-xs`} onClick={() => setPlanTab(k)}>{l}</span>
        ))}
      </div>

      {/* ── AUTO PLAN TAB ── */}
      {planTab === "templates" && (
        <div>
          <div className="text-center mb-[14px]">
            <div className="text-[11px] text-gray-500 tracking-[2px]">YOUR DAILY TARGET</div>
            <div className="text-[32px] font-black text-emerald-500 font-heading">{target} cal</div>
            <div className="text-[11px] text-gray-500">P: {proteinG}g · C: {carbG}g · F: {fatG}g</div>
          </div>

          {/* Template cards */}
          {!selTemplate && (
            <div>
              <div className="sl">Choose a Diet Style</div>
              {DIET_TEMPLATES.map(t => (
                <div key={t.id} className="gc p-[14px] mb-2 cursor-pointer" onClick={() => { setSelTemplate(t); const plan = generateDayPlan(t, target); setGeneratedPlan(plan); }}>
                  <div className="flex items-center gap-3">
                    <span className="text-[28px]">{t.icon}</span>
                    <div className="flex-1">
                      <div className="text-[15px] font-bold text-gray-100 font-heading">{t.name}</div>
                      <div className="text-[11px] text-gray-500">{t.desc}</div>
                      <div className="flex gap-2 mt-1 text-[10px]">
                        <span className="text-red-500">P: {Math.round(t.protPct * 100)}%</span>
                        <span className="text-amber-500">C: {Math.round(t.carbPct * 100)}%</span>
                        <span className="text-cyan-500">F: {Math.round(t.fatPct * 100)}%</span>
                      </div>
                    </div>
                    <span className="text-gray-600 text-[18px]">→</span>
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
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="text-[16px] font-bold text-gray-100 font-heading">{selTemplate.icon} {selTemplate.name}</div>
                    <div className="text-[11px] text-gray-500">{totals.cal} cal · P:{Math.round(totals.protein)}g · C:{Math.round(totals.carbs)}g · F:{Math.round(totals.fat)}g</div>
                  </div>
                  <button className="bg px-3 py-1.5 text-[11px]" onClick={() => { setSelTemplate(null); setGeneratedPlan(null); }}>← Back</button>
                </div>

                {["Breakfast", "Lunch", "Dinner", "Snack"].map(meal => {
                  const items = generatedPlan[meal] || [];
                  if (items.length === 0) return null;
                  const mealCal = items.reduce((s, f) => s + (f.cal || 0), 0);
                  return (
                    <div key={meal} className="gs mb-[10px] p-3">
                      <div className="flex justify-between mb-2">
                        <span className="text-[13px] font-bold text-emerald-500">{meal}</span>
                        <span className="text-xs text-amber-500 font-semibold">{mealCal} cal</span>
                      </div>
                      {items.map((f, i) => (
                        <div key={i} className="flex justify-between items-center py-1.5" style={{ borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,.03)" : "none" }}>
                          <div className="flex gap-2 items-center">
                            <span className="text-[18px]">{f.emoji}</span>
                            <div>
                              <div className="text-[13px] text-gray-100">{f.name} <span className="text-gray-500 text-[11px]">{f.grams}g</span></div>
                              <div className="text-[10px] text-gray-600">P:{f.protein}g C:{f.carbs}g F:{f.fat}g</div>
                            </div>
                          </div>
                          <div className="flex gap-1 items-center">
                            <span className="text-xs text-amber-500 font-semibold">{f.cal}cal</span>
                            <span onClick={() => { const swaps = getMealSwaps(f, meal, selTemplate); if (swaps.length > 0) { const swap = swaps[Math.floor(Math.random() * swaps.length)]; const newPlan = { ...generatedPlan }; const ratio = (f.grams || 100) / 100; newPlan[meal] = [...newPlan[meal]]; newPlan[meal][i] = { ...swap, grams: f.grams || 100, cal: Math.round(swap.cal * ratio), protein: Math.round(swap.protein * ratio * 10) / 10, carbs: Math.round(swap.carbs * ratio * 10) / 10, fat: Math.round(swap.fat * ratio * 10) / 10, fiber: Math.round(swap.fiber * ratio * 10) / 10, meal }; setGeneratedPlan(newPlan); } }}
                              className="cursor-pointer text-xs text-gray-500 px-1.5 py-0.5">🔄</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}

                <div className="flex gap-2 mt-3">
                  <button className="bp flex-1 p-[14px] text-sm" onClick={() => { Object.entries(generatedPlan).forEach(([meal, items]) => items.forEach(f => addFood(f, f.grams || 100, meal))); setTab("log"); }}>✅ Log This Plan Today</button>
                  <button className="bg p-[14px_16px] text-xs" onClick={() => { const plan = generateDayPlan(selTemplate, target); setGeneratedPlan(plan); }}>🔄 Regenerate</button>
                </div>

                <button className="bg w-full mt-2 p-3 text-[13px]" onClick={() => { const wp = generateWeekPlan(selTemplate, target); setWeekPlan(wp); setShoppingList(getShoppingList(wp)); setPlanTab("weekly"); }}>📅 Generate Full Week Plan</button>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── WEEKLY PLAN TAB ── */}
      {planTab === "weekly" && (
        <div>
          {!weekPlan ? (
            <div className="text-center p-[30px] text-gray-500 text-[13px]">Generate a plan from the Auto Plan tab first.</div>
          ) : (
            <div>
              <div className="flex gap-1 mb-3 overflow-x-auto">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                  <span key={day} className={`chip ${selWeekDay === day ? "chip-a" : "chip-i"} shrink-0 text-[11px] px-[10px] py-1.5`} onClick={() => setSelWeekDay(day)}>{day.slice(0, 3)}</span>
                ))}
              </div>

              {weekPlan[selWeekDay] && (() => {
                const dayTotals = getPlanDayTotals(weekPlan[selWeekDay]);
                return (
                  <div>
                    <div className="text-center mb-[10px]">
                      <span className="text-[18px] font-extrabold text-emerald-500 font-heading">{dayTotals.cal} cal</span>
                      <span className="text-[11px] text-gray-500"> · P:{Math.round(dayTotals.protein)}g C:{Math.round(dayTotals.carbs)}g F:{Math.round(dayTotals.fat)}g</span>
                    </div>
                    {["Breakfast", "Lunch", "Dinner", "Snack"].map(meal => {
                      const items = weekPlan[selWeekDay][meal] || [];
                      if (items.length === 0) return null;
                      return (
                        <div key={meal} className="mb-[10px]">
                          <div className="text-xs text-emerald-500 font-semibold mb-1">{meal}</div>
                          {items.map((f, i) => (
                            <div key={i} className="flex justify-between py-1 text-xs">
                              <span>{f.emoji} {f.name} <span className="text-gray-500">{f.grams}g</span></span>
                              <span className="text-amber-500">{f.cal}cal</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    <button className="bp w-full p-3 mt-2" onClick={() => { Object.entries(weekPlan[selWeekDay]).forEach(([meal, items]) => items.forEach(f => addFood(f, f.grams || 100, meal))); setTab("log"); }}>✅ Log {selWeekDay}'s Plan</button>
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
            <div className="text-center p-[30px] text-gray-500 text-[13px]">Generate a weekly plan first to see your shopping list.</div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="text-[16px] font-bold text-gray-100 font-heading">🛒 Weekly Shopping List</div>
                <span className="text-[11px] text-gray-500">{shoppingList.length} items</span>
              </div>
              {shoppingList.map((item, i) => (
                <div key={i} onClick={() => setCheckedShop(p => ({ ...p, [item.name]: !p[item.name] }))}
                  className="flex items-center gap-[10px] py-[10px] border-b border-white/[.03] cursor-pointer" style={{ opacity: checkedShop[item.name] ? 0.4 : 1 }}>
                  <div className={`w-[22px] h-[22px] rounded-md flex items-center justify-center text-xs text-green-500 ${checkedShop[item.name] ? "border border-green-500 bg-green-500/[.15]" : "border border-white/10 bg-transparent"}`}>
                    {checkedShop[item.name] ? "✓" : ""}
                  </div>
                  <span className="text-[16px]">{item.emoji}</span>
                  <div className="flex-1">
                    <div className={`text-[13px] text-gray-100 ${checkedShop[item.name] ? "line-through" : ""}`}>{item.name}</div>
                    <div className="text-[10px] text-gray-500">{item.grams}g total · Used {item.count}× this week</div>
                  </div>
                </div>
              ))}
              <div className="text-center mt-3 text-[11px] text-gray-500">
                {Object.values(checkedShop).filter(Boolean).length}/{shoppingList.length} items checked
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MANUAL CREATE TAB ── */}
      {planTab === "create" && (
        <div>
          {savedPlans.length > 0 && (<div className="gs mb-4">
            <div className="sl">Saved Plans ({savedPlans.length})</div>
            {savedPlans.map(plan => (<div key={plan.id} className="gc p-[14px] mb-2">
              <div className="flex justify-between items-center">
                <div><div className="text-[15px] font-semibold">{plan.name}</div><div className="text-[11px] text-gray-500">{MEALS.map(m => `${(plan.items[m] || []).length} ${m.toLowerCase()}`).join(" · ")}</div></div>
                <div className="flex gap-1.5">
                  <button className="bp px-3 py-1.5 text-[11px]" onClick={() => loadPlan(plan)}>Edit</button>
                  <button className="bg px-3 py-1.5 text-[11px]" onClick={() => { MEALS.forEach(meal => { (plan.items[meal] || []).forEach(f => { addFood(f, f.grams || 100, meal) }) }); setTab("log"); }}>Log</button>
                  <button className="px-1.5 py-1.5 bg-transparent border border-red-500/[.15] rounded-md text-red-500 text-[11px] cursor-pointer" onClick={() => deletePlan(plan.id)}>✕</button>
                </div>
              </div>
            </div>))}
          </div>)}

          <div className="gs mb-4">
            <div className="sl">{editingPlan ? "Edit Plan" : "Create New Plan"}</div>
            <input className="inp mb-[10px]" placeholder="Plan name..." value={planName} onChange={e => setPlanName(e.target.value)} />
            {MEALS.map(meal => (<div key={meal} className="mb-3">
              <div className="text-[13px] font-semibold text-emerald-500 mb-1.5">{meal}</div>
              {(planItems[meal] || []).map((f, i) => (<div key={i} className="flex justify-between items-center py-1 border-b border-white/[.03]">
                <span className="text-[13px]">{f.emoji} {f.name} <span className="text-gray-500">{f.grams || 100}g</span></span>
                <div className="flex gap-1.5 items-center"><span className="text-[11px] text-amber-500">{Math.round(f.cal * (f.grams || 100) / 100)}cal</span><span onClick={() => removeFromPlan(meal, i)} className="cursor-pointer text-gray-600">×</span></div>
              </div>))}
              {(planItems[meal] || []).length === 0 && <div className="text-xs text-gray-600 py-1">No items</div>}
            </div>))}
            <input className="inp mb-2" placeholder="Search food to add..." value={planSearch} onChange={e => setPlanSearch(e.target.value)} />
            {planSearch.length >= 2 && <div className="max-h-[180px] overflow-y-auto mb-[10px]">
              {searchFoods(planSearch).slice(0, 12).map((f, i) => (<div key={f.name + i} className="flex justify-between items-center py-1.5 border-b border-white/[.03] cursor-pointer">
                <span className="text-[13px]">{f.emoji} {f.name} <span className="text-gray-500">{f.cal}cal/100g</span></span>
                <div className="flex gap-1">{MEALS.map(m => <span key={m} onClick={() => addToPlan(f, m)} className="text-[10px] px-2 py-[3px] rounded-md bg-[rgba(16,185,129,.06)] text-emerald-500 cursor-pointer border border-emerald-500/[.15]">{m[0]}</span>)}</div>
              </div>))}
            </div>}
            <div className="flex gap-2 mt-[10px]">
              <button className="bp flex-1 p-3" onClick={savePlan} disabled={!planName.trim()}>💾 Save</button>
              {editingPlan && <button className="bg p-[12px_16px]" onClick={() => { setEditingPlan(null); setPlanName(""); setPlanItems({ Breakfast: [], Lunch: [], Dinner: [], Snack: [] }) }}>Cancel</button>}
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
