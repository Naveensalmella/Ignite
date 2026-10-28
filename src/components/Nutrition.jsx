"use client";
import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import {
  Plus, Minus, X, Droplet, Coffee, Salad, UtensilsCrossed, Utensils, Cookie, Camera, ImageUp, PenLine, Search, Clock,
  ChevronLeft, ChevronRight, RefreshCw, CircleCheck, Sparkles, Save, Pencil, Trash2, Shuffle, Scale, Drumstick, Leaf,
  Flame, Soup, Wheat, Beef, Coins, Egg, Award, CalendarDays, ShoppingCart, Zap,
} from 'lucide-react';
import { XP } from '../data';
import { FOOD_DATABASE, FOOD_CATEGORIES, searchFoods, searchFoodsCombined } from '../data/foodDatabase';
import { DIET_TEMPLATES, generateDayPlan, generateWeekPlan, getPlanDayTotals, getShoppingList, getSwapOptions as getMealSwaps } from '../data/mealPlanner';
import { today, dateKey, toArr } from '../utils';
import HistoryPanel from './HistoryPanel';
import { formatNutritionHistory } from '../historyFormatters';
import { localSync } from '@/utils/localSync';
import { Card, Ring, Bar, IconBadge, Pill, ListRow, Tabs, Tile, Check, EmptyState } from '@/components/ui/kit';

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

// Presentation: one line icon + tone per meal, per diet template, per macro.
const MEAL_ICON = { Breakfast: [Coffee, "amber"], Lunch: [Salad, "lime"], Dinner: [UtensilsCrossed, "violet"], Snack: [Cookie, "orange"] };
const TEMPLATE_ICON = {
  balanced_indian: [Scale, "sky"], muscle_nonveg: [Drumstick, "orange"], muscle_veg: [Leaf, "lime"], fat_loss: [Flame, "rose"],
  south_indian: [Soup, "amber"], north_indian: [Wheat, "amber"], high_protein: [Beef, "rose"], budget: [Coins, "teal"], keto: [Egg, "violet"],
};
const C_PROT = "var(--tone-rose)", C_CARB = "var(--tone-amber)", C_FAT = "var(--tone-sky)", C_FIBER = "var(--tone-lime)";
const SM_BTN = "icon-btn w-9 h-9 shrink-0";
const macroLine = (f) => `P ${f.protein}g · C ${f.carbs}g · F ${f.fat}g`;

function calcTDEE(profile) {
  const w = parseFloat(profile.weight) || 70, h = parseFloat(profile.height) || 170, age = parseInt(profile.age) || 25, g = profile.gender || "male";
  let bmr = g === "female" ? 10 * w + 6.25 * h - 5 * age - 161 : 10 * w + 6.25 * h - 5 * age + 5;
  const m = profile.fitnessLevel === "beginner" ? 1.375 : profile.fitnessLevel === "advanced" ? 1.725 : 1.55;
  let tdee = Math.round(bmr * m);
  let target = profile.goal === "lose" ? Math.round(tdee * .8) : profile.goal === "muscle" ? Math.round(tdee * 1.2) : tdee;
  return { tdee, target };
}


function getNutritionScore(totals, target, proteinG, carbG, fatG) {
  if (totals.cal === 0) return { grade: "—", color: "var(--text-dim)", desc: "Log food to get your score" };
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

  if (score >= 90) return { grade: "A+", color: "var(--ok)", desc: "Perfect nutrition day!" };
  if (score >= 80) return { grade: "A", color: "var(--ok)", desc: "Excellent — right on target" };
  if (score >= 70) return { grade: "B", color: "var(--tone-sky)", desc: "Good — minor adjustments needed" };
  if (score >= 55) return { grade: "C", color: "var(--warn)", desc: "Fair — watch your macros" };
  if (score >= 40) return { grade: "D", color: "var(--tone-orange)", desc: "Needs improvement" };
  return { grade: "F", color: "var(--danger)", desc: "Way off target — check your portions" };
}

const MEAL_TIMES = {
  Breakfast: { time: "7:00 - 9:00 AM", tip: "Protein + complex carbs for sustained energy" },
  Lunch: { time: "12:00 - 1:30 PM", tip: "Balanced plate: ½ veggies, ¼ protein, ¼ carbs" },
  Dinner: { time: "6:30 - 8:00 PM", tip: "Lighter than lunch, focus on protein + veggies" },
  Snack: { time: "3:00 - 4:30 PM", tip: "150-200 cal max: fruits, nuts, or yogurt" },
};

/** One food line: emoji (content) · name/macros · kcal · optional action. */
function FoodLine({ emoji, name, grams, sub, cal, right, done = false }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="text-[19px] w-7 text-center shrink-0" aria-hidden="true">{emoji || "🍽️"}</span>
      <div className="flex-1 min-w-0">
        <div className={`text-[13.5px] font-medium truncate ${done ? "line-through" : ""}`} style={{ color: "var(--text-primary)" }}>
          {name}{grams ? <span className="font-normal" style={{ color: "var(--text-dim)" }}> · {grams}g</span> : null}
        </div>
        {sub && <div className="text-[11.5px] num" style={{ color: "var(--text-dim)" }}>{sub}</div>}
      </div>
      {cal != null && <span className="num text-[13px] font-semibold shrink-0" style={{ color: "var(--text-secondary)" }}>{cal} kcal</span>}
      {right}
    </div>
  );
}

/** Small uppercase-free section label inside a card. */
function SubHead({ children, right }) {
  return (
    <div className="flex items-center justify-between mt-3 mb-1">
      <span className="text-[12.5px] font-bold" style={{ color: "var(--text-secondary)" }}>{children}</span>
      {right}
    </div>
  );
}

function MacroSplit({ p, c, f }) {
  return (
    <div className="flex gap-2.5 mt-1 text-[11.5px] font-semibold num">
      <span style={{ color: C_PROT }}>P {p}</span>
      <span style={{ color: C_CARB }}>C {c}</span>
      <span style={{ color: C_FAT }}>F {f}</span>
    </div>
  );
}

export default function Nutrition({ foodLog = {}, setFoodLog = () => { }, addXP = () => { }, profile = {} }) {
  const d = today();
  const todayLog = toArr(foodLog[d]).filter(f => f && typeof f === 'object' && f.name);
  const rawWater = foodLog[`water_${d}`];
  const todayWater = Number(typeof rawWater === 'object' && rawWater ? (rawWater.entries ?? rawWater.data) : rawWater) || 0;
  const [tab, setTab] = useState("log"); // log | add | plan | weekly | scan
  const [insightTab, setInsightTab] = useState("week"); // week | history
  const [selMeal, setSelMeal] = useState("Breakfast");
  const [search, setSearch] = useState("");
  const [selFood, setSelFood] = useState(null);
  const [grams, setGrams] = useState(100);
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ name: "", cal: "", protein: "", carbs: "", fat: "", fiber: "" });
  const [selCat, setSelCat] = useState("All");
  const [apiResults, setApiResults] = useState(null);
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
      const ds = dateKey(dt);
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

  // Log an entry whose macros are already for its portion (meal-plan items, recent foods).
  const logPortion = (food, meal = selMeal) => {
    const entry = { ...food, meal, cal: Math.round(Number(food.cal) || 0), protein: Number(food.protein) || 0, carbs: Number(food.carbs) || 0, fat: Number(food.fat) || 0, fiber: Number(food.fiber) || 0, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setFoodLog(p => ({ ...p, [d]: [...toArr(p[d]), entry] }));
    addXP(XP.food, "Food logged");
  };

  const addCustomFood = () => {
    if (!custom.name.trim() || !custom.cal) return;
    addFood({ name: custom.name.trim(), emoji: "🍽️", cal: parseInt(custom.cal) || 0, protein: parseFloat(custom.protein) || 0, carbs: parseFloat(custom.carbs) || 0, fat: parseFloat(custom.fat) || 0, fiber: parseFloat(custom.fiber) || 0, category: "Custom" }, 100, selMeal);
    setCustom({ name: "", cal: "", protein: "", carbs: "", fat: "", fiber: "" }); setShowCustom(false);
  };

  const removeFood = (idx) => setFoodLog(p => ({ ...p, [d]: toArr(p[d]).filter((_, i) => i !== idx) }));
  const addWater = () => setFoodLog(p => ({ ...p, [`water_${d}`]: (Number(p[`water_${d}`]) || 0) + 1 }));
  const removeWater = () => setFoodLog(p => ({ ...p, [`water_${d}`]: Math.max(0, (Number(p[`water_${d}`]) || 0) - 1) }));

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

  const analyzeText = async (desc) => {
    if (!desc.trim()) return;
    analyzeWithAI(`Analyze this meal and estimate nutrition for each food item separately: "${desc}". Use standard Indian serving sizes. Be specific with calories — don't round to nearest 100.`);
  };
  useEffect(() => () => stopCam(), []);
  useEffect(() => { shSync.set(scanHistory); }, [scanHistory, shSync]);

  // API search (debounced — fires 500ms after typing stops; stale responses are ignored)
  useEffect(() => {
    if (!search || search.length < 3) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setApiSearching(true);
      let api = [];
      try { ({ api } = await searchFoodsCombined(search)); } catch { api = []; }
      if (!cancelled) { setApiResults({ query: search, items: toArr(api) }); setApiSearching(false); }
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search]);
  const apiItems = search.length >= 3 && apiResults?.query === search ? apiResults.items : [];

  // ── Save/Load Plans ──
  const savePlan = () => {
    if (!planName.trim()) return;
    const plan = { id: editingPlan?.id || Date.now(), name: planName.trim(), type: planType.id, items: planItems, createdAt: editingPlan?.createdAt || d };
    const newPlans = editingPlan ? savedPlans.map(p => p.id === editingPlan.id ? plan : p) : [...savedPlans, plan];
    setSavedPlans(newPlans);
    setFoodLog(p => ({ ...p, _savedPlans: newPlans }));
    setPlanName(""); setEditingPlan(null);
  };

  const loadPlan = (plan) => { setPlanItems(plan.items); setEditingPlan(plan); setPlanName(plan.name) };
  const deletePlan = (id) => { if (!window.confirm("Delete this plan?")) return; const np = savedPlans.filter(p => p.id !== id); setSavedPlans(np); setFoodLog(p => ({ ...p, _savedPlans: np })) };
  const addToPlan = (food, meal) => { setPlanItems(p => ({ ...p, [meal]: [...(p[meal] || []), { ...food, grams: 100 }] })) };
  const removeFromPlan = (meal, idx) => { setPlanItems(p => ({ ...p, [meal]: (p[meal] || []).filter((_, i) => i !== idx) })) };

  // Scanner entry points (presentation helpers — open the scanner view in the right mode)
  const openScanCamera = () => { setScanError(null); setTab("scan"); setScanMode("camera"); setTimeout(startCam, 100) };
  const openScanText = () => { setTab("scan"); setScanMode("text") };
  const onPickFile = (e) => { setScanMode("choose"); setTab("scan"); handleFile(e) };

  const accentFrame = { border: "2px solid color-mix(in srgb, var(--accent) 30%, transparent)", background: "var(--ghost-bg)" };

  // ══ SCAN VIEW ══
  if (tab === "scan") {
    const backToAdd = () => { stopCam(); setTab("add"); setScanResults(null); setScanPhoto(null); setScanError(null); setScanMode("choose") };
    return (<div className="page fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <button type="button" className="icon-btn shrink-0" aria-label="Back to Add food" onClick={backToAdd}><ChevronLeft size={20} /></button>
          <div className="flex-1 min-w-0">
            <div className="text-[18px] font-extrabold" style={{ color: "var(--text-primary)" }}>AI food scanner</div>
            <div className="text-[13px]" style={{ color: "var(--text-dim)" }}>Camera, photo, or describe your meal</div>
          </div>
          <IconBadge icon={Sparkles} tone="violet" size={38} />
        </div>
      </Card>

      {/* Mode selector */}
      {scanMode === "choose" && !scanning && !scanResults && (<>
        <div className="tile-grid">
          <Tile icon={Camera} tone="sky" label="Camera" sub="Point at food" onClick={() => { setScanMode("camera"); setTimeout(startCam, 100) }} />
          <Tile icon={ImageUp} tone="teal" label="Upload" sub="From gallery" onClick={() => fileRef.current?.click()} />
          <Tile icon={PenLine} tone="violet" label="Describe" sub="Type your meal" onClick={() => setScanMode("text")} />
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

        {/* Recent scans */}
        {scanHistory.length > 0 && (
          <Card title="Recent scans" sub={`Adds to ${selMeal}`}>
            {scanHistory.slice(0, 5).map((scan, i) => (
              <div key={i} className={i ? "border-t" : ""} style={{ borderColor: "var(--line)" }}>
                <FoodLine emoji={scan.emoji} name={scan.name} sub={macroLine(scan)}
                  right={<button type="button" className="bg px-3 py-1.5 text-[12.5px] shrink-0" onClick={() => logPortion(scan, selMeal)}><Plus size={14} />Add</button>} />
              </div>
            ))}
          </Card>
        )}
      </>)}

      {/* Camera mode */}
      {scanMode === "camera" && !scanPhoto && !scanning && (
        <Card>
          <div className="w-full max-w-[400px] aspect-square rounded-2xl overflow-hidden mx-auto mb-4 relative" style={accentFrame}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute top-[20%] left-[20%] right-[20%] bottom-[20%] rounded-lg pointer-events-none" style={{ border: "1px dashed color-mix(in srgb, var(--accent) 50%, transparent)" }} />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-2.5 max-w-[400px] mx-auto">
            <button type="button" className="icon-btn w-12 h-12 shrink-0" aria-label="Back" onClick={() => setScanMode("choose")}><ChevronLeft size={20} /></button>
            <button type="button" className="bp flex-1 text-[15px]" onClick={capture}><Camera size={18} />Capture</button>
          </div>
          {scanError && <div className="text-center text-[13px] mt-3" style={{ color: "var(--danger)" }}>{scanError}</div>}
        </Card>
      )}

      {/* Text describe mode */}
      {scanMode === "text" && !scanning && !scanResults && (
        <Card title="Describe what you ate" className="fade-in">
          <textarea className="inp resize-none w-full text-sm p-3" value={textDesc} onChange={e => setTextDesc(e.target.value)}
            placeholder="Example: 2 rotis with dal and chicken curry, a bowl of rice, and buttermilk"
            rows={3} />
          <div className="text-[12px] mt-3 mb-1.5" style={{ color: "var(--text-dim)" }}>Try an example</div>
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {["2 idli with sambar and chutney", "Chicken biryani with raita", "1 plate poha with peanuts", "Paneer butter masala with 3 rotis", "Oats with banana and milk"].map(ex => (
              <button type="button" key={ex} className="chip chip-i text-[12px]" onClick={() => setTextDesc(ex)}>{ex}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className="icon-btn w-11 h-11 shrink-0" aria-label="Back" onClick={() => setScanMode("choose")}><ChevronLeft size={20} /></button>
            <button type="button" className="bp flex-1" onClick={() => analyzeText(textDesc)} disabled={!textDesc.trim()}><Sparkles size={17} />Analyze food</button>
          </div>
        </Card>
      )}

      {/* Photo preview with error/retry (when Vision analysis done but no results) */}
      {scanMode === "camera" && scanPhoto && !scanning && !scanResults && (
        <Card className="text-center">
          <div className="w-[200px] h-[200px] rounded-2xl overflow-hidden mx-auto mb-4" style={{ border: "1px solid var(--line)" }}>
            <img src={scanPhoto} alt="Food" className="w-full h-full object-cover" />
          </div>
          {scanError && <div className="text-[13px] mb-3 px-3" style={{ color: "var(--warn)" }}>{scanError}</div>}
          <div className="flex gap-2 justify-center flex-wrap">
            <button type="button" className="bp" onClick={() => analyzeImage(scanPhoto)}><RefreshCw size={16} />Retry analysis</button>
            <button type="button" className="bg" onClick={() => { setScanMode("text"); setTextDesc(""); }}><PenLine size={16} />Describe instead</button>
            <button type="button" className="icon-btn w-11 h-11" aria-label="Close" onClick={() => { setScanMode("choose"); setScanPhoto(null); setScanError(null); }}><X size={18} /></button>
          </div>
        </Card>
      )}

      {/* Scanning animation */}
      {scanning && (
        <Card className="text-center py-8">
          {scanPhoto && <div className="w-[160px] h-[160px] rounded-2xl overflow-hidden mx-auto mb-5" style={accentFrame}><img src={scanPhoto} alt="" className="w-full h-full object-cover" /></div>}
          <div className="flex gap-1.5 justify-center mb-3">
            {[0, 1, 2].map(i => <div key={i} className="w-[10px] h-[10px] rounded-full" style={{ background: "var(--accent)", animation: `dotPulse 1.2s ${i * .2}s infinite` }} />)}
          </div>
          <div className="text-sm font-semibold" style={{ color: "var(--accent)" }}>Analyzing your food with AI...</div>
          <div className="text-[12px] mt-1" style={{ color: "var(--text-dim)" }}>Estimating calories, protein, carbs, fat</div>
        </Card>
      )}

      {/* Scan results */}
      {scanResults && (
        <Card className="fade-in">
          {scanPhoto && <div className="w-[120px] h-[120px] rounded-xl overflow-hidden mx-auto mb-3"><img src={scanPhoto} alt="" className="w-full h-full object-cover" /></div>}
          <div className="text-center mb-3">
            <div className="text-[17px] font-bold inline-flex items-center gap-1.5" style={{ color: "var(--ok)" }}><CircleCheck size={19} />{scanResults.length} item{scanResults.length > 1 ? "s" : ""} identified</div>
            <div className="text-[12.5px] num" style={{ color: "var(--text-dim)" }}>Total: {scanResults.reduce((s, f) => s + (f.cal || 0), 0)} kcal</div>
          </div>
          <Tabs tabs={MEALS.map(m => [m, m])} value={selMeal} onChange={setSelMeal} label="Meal" className="mb-3" />

          {scanResults.map((f, i) => (
            <div key={i} className={i ? "border-t" : ""} style={{ borderColor: "var(--line)" }}>
              <FoodLine emoji={f.emoji} name={f.name} sub={`${f.serving || "1 serving"} · ${macroLine(f)} · Fb ${f.fiber || 0}g`} cal={f.cal}
                right={<button type="button" className="bg px-3 py-1.5 text-[12.5px] shrink-0" onClick={() => { addFood({ ...f, fiber: f.fiber || 0, category: "AI Scanned" }, 100, selMeal); setScanHistory(p => [f, ...p.filter(x => x.name !== f.name)].slice(0, 20)); }}><Plus size={14} />Add</button>} />
            </div>
          ))}

          <div className="flex gap-2.5 mt-4">
            <button type="button" className="bp flex-1" onClick={() => { scanResults.forEach(f => { addFood({ ...f, fiber: f.fiber || 0, category: "AI Scanned" }, 100, selMeal); setScanHistory(p => [f, ...p.filter(x => x.name !== f.name)].slice(0, 20)); }); stopCam(); setScanResults(null); setScanPhoto(null); setScanMode("choose"); setTab("log") }}><CircleCheck size={17} />Add all & done</button>
            <button type="button" className="bg" onClick={() => { setScanResults(null); setScanPhoto(null); setScanMode("choose") }}><RefreshCw size={16} />Rescan</button>
          </div>
        </Card>
      )}
    </div>);
  }

  const calPct = target > 0 ? totals.cal / target : 0;
  const over = totals.cal > target;

  return (<div className="page fade-in">
    <Tabs tabs={[["log", "Today"], ["add", "Add food"], ["plan", "Plans"], ["weekly", "Insights"]]} value={tab} onChange={setTab} label="Nutrition sections" />

    {/* ════ TODAY ════ */}
    {tab === "log" && (<>
      {/* Hero: calories ring + macro bars */}
      <Card hero>
        <div className="flex items-center gap-4">
          <Ring value={calPct} size={116} stroke={9} color="var(--text-primary)">
            <b className="text-[28px] font-extrabold leading-none num">{Math.abs(remaining)}</b>
            <small className="text-[12px] mt-1" style={{ color: "var(--text-secondary)" }}>{remaining >= 0 ? "kcal left" : "kcal over"}</small>
          </Ring>
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              <span className="text-[17px] font-extrabold num" style={{ color: "var(--text-primary)" }}>{totals.cal}</span> of {target} kcal
            </div>
            {[["Protein", totals.protein, proteinG], ["Carbs", totals.carbs, carbG], ["Fat", totals.fat, fatG]].map(([l, v, t]) => (
              <div key={l}>
                <div className="flex justify-between text-[12px] mb-1" style={{ color: "var(--text-secondary)" }}>
                  <span className="font-semibold">{l}</span><span className="num">{Math.round(v)} / {t} g</span>
                </div>
                <Bar value={t > 0 ? v / t : 0} color="var(--text-primary)" height={5} label={`${l} ${Math.round(v)} of ${t} grams`} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-3.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
          <span className="num">Fiber {Math.round(totals.fiber)} / 25 g</span>
          {over ? <Pill>Over target</Pill> : <span>{Math.round(calPct * 100)}% of goal</span>}
        </div>
      </Card>

      {/* Water */}
      <Card>
        <div className="flex items-center gap-3">
          <IconBadge icon={Droplet} tone="sky" size={40} />
          <div className="flex-1 min-w-0">
            <div className="row-title">Water</div>
            <div className="row-sub num" style={todayWater >= WATER_GOAL ? { color: "var(--ok)" } : undefined}>{todayWater} / {WATER_GOAL} glasses{todayWater >= WATER_GOAL ? " · Goal reached" : ""}</div>
          </div>
          <button type="button" className="icon-btn shrink-0" aria-label="Remove a glass" onClick={removeWater}><Minus size={18} /></button>
          <button type="button" className="icon-btn shrink-0" style={{ background: "var(--accent)", color: "var(--accent-ink)", borderColor: "transparent" }} aria-label="Add a glass" onClick={addWater}><Plus size={18} /></button>
        </div>
        <div className="flex gap-1 mt-2">
          {Array.from({ length: WATER_GOAL }, (_, i) => (
            <button type="button" key={i} aria-label={`Set water to ${i + 1} glass${i ? "es" : ""}`} onClick={() => setFoodLog(p => ({ ...p, [`water_${d}`]: i + 1 }))} className="flex-1 h-8 flex items-center">
              <span className="block w-full h-2 rounded-full transition-colors duration-300" style={{ background: i < todayWater ? (todayWater >= WATER_GOAL ? "var(--ok)" : "var(--tone-sky)") : "var(--track)" }} />
            </button>
          ))}
        </div>
      </Card>

      {/* Meals */}
      <Card title="Today's meals" sub={todayLog.length > 0 ? `${todayLog.length} item${todayLog.length > 1 ? "s" : ""} · ${totals.cal} kcal` : "Nothing logged yet"}>
        <div>
          {MEALS.map(meal => {
            const items = todayLog.map((f, i) => ({ ...f, _idx: i })).filter(f => f.meal === meal);
            const mealCal = items.reduce((s, f) => s + (f.cal || 0), 0);
            const [MIcon, mTone] = MEAL_ICON[meal];
            return (<Fragment key={meal}>
              <ListRow icon={MIcon} tone={mTone} title={meal}
                sub={items.length > 0 ? `${mealCal} kcal · ${items.length} item${items.length > 1 ? "s" : ""}` : MEAL_TIMES[meal].time}
                right={<button type="button" className={SM_BTN} aria-label={`Add food to ${meal}`} onClick={() => { setSelMeal(meal); setTab("add"); }}><Plus size={18} /></button>} />
              {items.length > 0 && (
                <div className="pl-[50px] pb-2">
                  {items.map(f => (
                    <FoodLine key={f._idx} emoji={f.emoji} name={f.name} grams={f.grams && f.grams !== 100 ? f.grams : null} sub={macroLine(f)} cal={f.cal}
                      right={<button type="button" className={SM_BTN} aria-label={`Remove ${f.name}`} onClick={() => removeFood(f._idx)}><X size={16} /></button>} />
                  ))}
                </div>
              )}
            </Fragment>);
          })}
        </div>
        <button type="button" className="bp w-full mt-3" onClick={() => setTab("add")}><Plus size={18} />Add food</button>
      </Card>
    </>)}

    {/* ════ ADD FOOD ════ */}
    {tab === "add" && (<>
      {/* Which meal */}
      <Card title="Add to" sub={MEAL_TIMES[selMeal]?.time}>
        <Tabs tabs={MEALS.map(m => [m, m])} value={selMeal} onChange={setSelMeal} label="Meal" />
        <div className="flex items-start gap-2 mt-3 text-[12.5px]" style={{ color: "var(--text-dim)" }}>
          <Clock size={15} className="mt-[2px] shrink-0" style={{ color: "var(--accent)" }} aria-hidden="true" />
          <span>{MEAL_TIMES[selMeal]?.tip}</span>
        </div>
      </Card>

      {/* Food quantity picker */}
      {selFood && (<Card className="fade-in" tone="sky">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[30px]" aria-hidden="true">{selFood.emoji}</span>
          <div className="flex-1 min-w-0"><div className="text-[16px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{selFood.name}</div><div className="text-[12px]" style={{ color: "var(--text-dim)" }}>{selFood.category} · Nutrition per 100g</div></div>
          <button type="button" className={SM_BTN} aria-label="Cancel" onClick={() => { setSelFood(null); setGrams(100) }}><X size={16} /></button>
        </div>
        <div className="text-[12px] mb-1.5" style={{ color: "var(--text-dim)" }}>Weight in grams</div>
        <div className="flex gap-2 items-center">
          <input className="inp w-24 text-center text-[18px] font-bold" type="number" aria-label="Grams" value={grams} onChange={e => setGrams(Math.max(1, parseInt(e.target.value) || 0))} />
          <span className="text-sm" style={{ color: "var(--text-dim)" }}>grams</span>
        </div>
        <div className="chip-row mt-2">{GRAM_PRESETS.map(g => <button type="button" key={g} className={`chip ${grams === g ? "chip-a" : "chip-i"} flex-1 justify-center`} onClick={() => setGrams(g)}>{g}g</button>)}</div>
        <div className="grid grid-cols-5 gap-1 my-3 text-center p-2.5 rounded-xl" style={{ background: "var(--ghost-bg)" }}>
          {[["Cal", Math.round(selFood.cal * grams / 100), "var(--tone-amber)"], ["Protein", Math.round(selFood.protein * grams / 100 * 10) / 10, C_PROT], ["Carbs", Math.round(selFood.carbs * grams / 100 * 10) / 10, C_CARB], ["Fat", Math.round(selFood.fat * grams / 100 * 10) / 10, C_FAT], ["Fiber", Math.round(selFood.fiber * grams / 100 * 10) / 10, C_FIBER]].map(([l, v, c]) => (
            <div key={l} className="min-w-0"><div className="text-[15px] font-bold num" style={{ color: c }}>{v}{l === "Cal" ? "" : "g"}</div><div className="text-[11px]" style={{ color: "var(--text-dim)" }}>{l}</div></div>
          ))}
        </div>
        <button type="button" className="bp w-full" onClick={() => addFood(selFood, grams, selMeal)}><Plus size={17} />Add {grams}g to {selMeal}</button>
      </Card>)}

      {!selFood && <>
        {/* AI scanner shortcuts */}
        <div className="tile-grid">
          <Tile icon={Camera} tone="sky" label="Scan" sub="Camera" onClick={openScanCamera} />
          <Tile icon={ImageUp} tone="teal" label="Photo" sub="From gallery" onClick={() => fileRef.current?.click()} />
          <Tile icon={PenLine} tone="violet" label="Describe" sub="AI estimate" onClick={openScanText} />
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
        {scanHistory.length > 0 && (
          <button type="button" className="link-btn self-start px-1" onClick={() => { setScanMode("choose"); setTab("scan"); }}>Recent AI scans ({scanHistory.length})<ChevronRight size={15} /></button>
        )}

        {/* Quick Add — Recent Foods */}
        {recentFoods.length > 0 && (
          <Card title="Quick add" sub="Recent foods">
            <div className="chip-row">
              {recentFoods.filter(f => f && f.name).slice(0, 8).map((f, i) => (
                <button type="button" key={f.name + i} title={`Add ${f.name} to ${selMeal}`} onClick={() => logPortion(f, selMeal)} className="shrink-0 px-3 py-2 rounded-2xl text-center min-w-[78px]" style={{ background: "var(--ghost-bg)" }}>
                  <div className="text-[19px]" aria-hidden="true">{f.emoji || "🍽️"}</div>
                  <div className="text-[11.5px] font-medium mt-0.5" style={{ color: "var(--text-primary)" }}>{f.name.length > 10 ? f.name.slice(0, 10) + "…" : f.name}</div>
                  <div className="text-[11px] num" style={{ color: "var(--text-dim)" }}>{f.cal || 0} kcal</div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Search + Category filter */}
        <Card title="Food database" sub="per 100g">
          <div className="relative mb-2.5">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-dim)" }} aria-hidden="true" />
            <input className="inp pl-10" placeholder="Search 199 foods... (biryani, idli, paneer, dal...)" aria-label="Search foods" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="chip-row mb-3">
            <button type="button" className={`chip ${selCat === "All" ? "chip-a" : "chip-i"} shrink-0`} onClick={() => setSelCat("All")}>All</button>
            {FOOD_CATEGORIES.map(c => <button type="button" key={c} className={`chip ${selCat === c ? "chip-a" : "chip-i"} shrink-0`} onClick={() => setSelCat(c)}>{c}</button>)}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2 max-h-[320px] overflow-y-auto">
            {filtered.slice(0, 36).map((f, i) => (<button type="button" key={f.name + i} className="fc" onClick={() => { setSelFood(f); setGrams(100) }}><div className="text-xl" aria-hidden="true">{f.emoji}</div><div className="text-[11.5px] font-medium mt-[3px]" style={{ color: "var(--text-primary)" }}>{f.name}</div><div className="text-[11px] num" style={{ color: "var(--text-dim)" }}>{f.cal} kcal</div></button>))}
          </div>
          {filtered.length === 0 && search && !apiSearching && apiItems.length === 0 && <div className="text-center py-3 text-[13px]" style={{ color: "var(--text-dim)" }}>No food found for &quot;{search}&quot;</div>}
          {apiSearching && <div className="text-center py-2 text-[12.5px]" style={{ color: "var(--accent)" }}>Searching global database...</div>}
          {apiItems.length > 0 && (<div className="mt-3"><SubHead>More from global database ({apiItems.length})</SubHead><div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2 max-h-[200px] overflow-y-auto">{apiItems.map((f, i) => (<button type="button" key={"api" + i} className="fc" onClick={() => { setSelFood(f); setGrams(100); }}><div className="text-xl" aria-hidden="true">{f.emoji}</div><div className="text-[11.5px] font-medium mt-[3px]" style={{ color: "var(--text-primary)" }}>{f.name}</div><div className="text-[11px] num" style={{ color: "var(--accent)" }}>{f.cal} kcal</div></button>))}</div></div>)}
          <div className="mt-3.5">
            <button type="button" onClick={() => setShowCustom(!showCustom)} className="link-btn">{showCustom ? <><X size={15} />Cancel custom food</> : <><Plus size={15} />Add custom food</>}</button>
          </div>
          {showCustom && (<div className="fade-in mt-3 p-3 rounded-2xl" style={{ background: "var(--ghost-bg)" }}>
            <input className="inp mb-2" placeholder="Food name" aria-label="Food name" value={custom.name} onChange={e => setCustom(p => ({ ...p, name: e.target.value }))} />
            <div className="text-[11.5px] mb-1" style={{ color: "var(--text-dim)" }}>Nutrition per 100g</div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] gap-1.5 mb-2.5">
              {[["Calories*", "cal"], ["Protein(g)", "protein"], ["Carbs(g)", "carbs"], ["Fat(g)", "fat"], ["Fiber(g)", "fiber"]].map(([l, k]) => (<label key={k} className="block"><span className="text-[11px]" style={{ color: "var(--text-dim)" }}>{l}</span><input className="inp p-2 text-center" type="number" placeholder="0" value={custom[k]} onChange={e => setCustom(p => ({ ...p, [k]: e.target.value }))} /></label>))}
            </div>
            <button type="button" className="bp w-full" onClick={addCustomFood} disabled={!custom.name.trim() || !custom.cal}><Plus size={17} />Add to {selMeal}</button>
          </div>)}
        </Card>
      </>}
    </>)}

    {/* ════ INSIGHTS ════ */}
    {tab === "weekly" && (<>
      <Tabs tabs={[["week", "This week"], ["history", "History"]]} value={insightTab} onChange={setInsightTab} label="Insights" />

      {insightTab === "week" && (<>
        {/* Diet score */}
        <Card>
          <div className="flex items-center gap-3">
            <IconBadge icon={Award} tone="amber" size={40} />
            <div className="flex-1 min-w-0">
              <div className="row-title">Today&apos;s diet score</div>
              <div className="row-sub">{nutScore.desc}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[20px] font-extrabold shrink-0" style={{ color: nutScore.color, background: `color-mix(in srgb, ${nutScore.color} 14%, transparent)` }}>{nutScore.grade}</div>
          </div>
        </Card>

        {/* 7-day calorie chart */}
        <Card title="Calories this week" sub={`Target ${target}`}>
          <div className="flex gap-1.5 items-end h-[110px] mb-2">
            {weeklyData.map((day, i) => {
              const pct = target > 0 ? Math.min(120, (day.cal / target) * 100) : 0;
              const over = day.cal > target;
              return (
                <div key={i} className="flex-1 flex flex-col items-center min-w-0">
                  <div className="text-[10.5px] font-semibold mb-0.5 num" style={{ color: day.cal > 0 ? (over ? "var(--danger)" : "var(--text-secondary)") : "var(--text-dim)" }}>{day.cal > 0 ? day.cal : ""}</div>
                  <div className="w-full rounded-md transition-[height] duration-500" style={{ background: over ? "color-mix(in srgb, var(--danger) 45%, transparent)" : day.isToday ? "var(--accent)" : day.cal > 0 ? "color-mix(in srgb, var(--accent) 35%, transparent)" : "var(--track)", height: `${Math.max(4, pct * 0.7)}px` }} />
                  <div className={`text-[11px] mt-1 ${day.isToday ? "font-bold" : ""}`} style={{ color: day.isToday ? "var(--accent)" : "var(--text-dim)" }}>{day.label}</div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[12px] num" style={{ color: "var(--text-dim)" }}>
            <span>Target: {target} kcal/day</span>
            <span>Avg: {Math.round(weeklyData.reduce((s, d) => s + d.cal, 0) / Math.max(1, weeklyData.filter(d => d.cal > 0).length))} kcal/day</span>
          </div>
        </Card>

        {/* Weekly Macros */}
        <Card title="Average macros" sub="Days with food logged">
          {(() => {
            const activeDays = weeklyData.filter(d => d.cal > 0);
            const n = Math.max(1, activeDays.length);
            const avg = { protein: Math.round(activeDays.reduce((s, d) => s + d.protein, 0) / n), carbs: Math.round(activeDays.reduce((s, d) => s + d.carbs, 0) / n), fat: Math.round(activeDays.reduce((s, d) => s + d.fat, 0) / n) };
            return (
              <div className="flex justify-around gap-3">
                {[["Protein", avg.protein, proteinG, C_PROT], ["Carbs", avg.carbs, carbG, C_CARB], ["Fat", avg.fat, fatG, C_FAT]].map(([l, v, t, color]) => (
                  <div key={l} className="flex flex-col items-center">
                    <Ring value={t > 0 ? v / t : 0} color={color} size={68} stroke={6}>
                      <b className="text-[14px] font-bold num" style={{ color: "var(--text-primary)" }}>{v}g</b>
                    </Ring>
                    <div className="text-[12.5px] font-semibold mt-1.5" style={{ color: "var(--text-secondary)" }}>{l}</div>
                    <div className="text-[11.5px] num" style={{ color: "var(--text-dim)" }}>Goal {t}g</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </Card>

        {/* Today's Macro by Meal */}
        {todayLog.length > 0 && (
          <Card title="Today by meal">
            {MEALS.map(meal => {
              const m = mealMacros[meal];
              if (!m || m.cal === 0) return null;
              const pct = target > 0 ? Math.round((m.cal / target) * 100) : 0;
              return (
                <div key={meal} className="mb-3 last:mb-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>{meal}</span>
                    <span className="text-[12.5px] num" style={{ color: "var(--text-secondary)" }}>{m.cal} kcal ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "var(--track)" }}>
                    <div className="h-full flex">
                      <div className="transition-[width] duration-500" style={{ background: C_PROT, width: `${m.protein > 0 ? Math.max(5, (m.protein / (m.protein + m.carbs + m.fat)) * 100) : 0}%` }} />
                      <div className="transition-[width] duration-500" style={{ background: C_CARB, width: `${m.carbs > 0 ? Math.max(5, (m.carbs / (m.protein + m.carbs + m.fat)) * 100) : 0}%` }} />
                      <div className="transition-[width] duration-500" style={{ background: C_FAT, width: `${m.fat > 0 ? Math.max(5, (m.fat / (m.protein + m.carbs + m.fat)) * 100) : 0}%` }} />
                    </div>
                  </div>
                  <MacroSplit p={`${Math.round(m.protein)}g`} c={`${Math.round(m.carbs)}g`} f={`${Math.round(m.fat)}g`} />
                </div>
              );
            })}
          </Card>
        )}
      </>)}

      {insightTab === "history" && <HistoryPanel entries={formatNutritionHistory(foodLog)} title="Nutrition History" emptyText="Start logging food to see history" />}
    </>)}

    {/* ════ PLANS ════ */}
    {tab === "plan" && (<>
      <Card>
        <div className="flex items-center gap-3">
          <IconBadge icon={Zap} tone="lime" size={40} />
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px]" style={{ color: "var(--text-dim)" }}>Your daily target</div>
            <div className="text-[20px] font-extrabold num" style={{ color: "var(--text-primary)" }}>{target} kcal</div>
          </div>
          <MacroSplit p={`${proteinG}g`} c={`${carbG}g`} f={`${fatG}g`} />
        </div>
      </Card>

      <Tabs tabs={[["templates", "Auto"], ["weekly", "Week"], ["shopping", "Shopping"], ["create", "My plans"]]} value={planTab} onChange={setPlanTab} label="Plan sections" />

      {/* ── AUTO PLAN ── */}
      {planTab === "templates" && (<>
        {/* Template cards */}
        {!selTemplate && (
          <Card title="Choose a diet style">
            <div>
              {DIET_TEMPLATES.map(t => {
                const [TIcon, tTone] = TEMPLATE_ICON[t.id] || [Utensils, "sky"];
                return (
                  <ListRow key={t.id} icon={TIcon} tone={tTone} title={t.name} sub={t.desc}
                    onClick={() => { setSelTemplate(t); const plan = generateDayPlan(t, target); setGeneratedPlan(plan); }}
                    right={<ChevronRight size={18} style={{ color: "var(--text-dim)" }} />}>
                    <MacroSplit p={`${Math.round(t.protPct * 100)}%`} c={`${Math.round(t.carbPct * 100)}%`} f={`${Math.round(t.fatPct * 100)}%`} />
                  </ListRow>
                );
              })}
            </div>
          </Card>
        )}

        {/* Generated plan view */}
        {selTemplate && generatedPlan && (() => {
          const totals = getPlanDayTotals(generatedPlan);
          const [TIcon, tTone] = TEMPLATE_ICON[selTemplate.id] || [Utensils, "sky"];
          return (
            <Card className="fade-in">
              <div className="flex items-center gap-3 mb-1">
                <button type="button" className="icon-btn shrink-0" aria-label="Back to diet styles" onClick={() => { setSelTemplate(null); setGeneratedPlan(null); }}><ChevronLeft size={20} /></button>
                <IconBadge icon={TIcon} tone={tTone} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{selTemplate.name}</div>
                  <div className="text-[12px] num" style={{ color: "var(--text-dim)" }}>{totals.cal} kcal · P {Math.round(totals.protein)}g · C {Math.round(totals.carbs)}g · F {Math.round(totals.fat)}g</div>
                </div>
              </div>

              {["Breakfast", "Lunch", "Dinner", "Snack"].map(meal => {
                const items = generatedPlan[meal] || [];
                if (items.length === 0) return null;
                const mealCal = items.reduce((s, f) => s + (f.cal || 0), 0);
                return (
                  <div key={meal}>
                    <SubHead right={<span className="text-[12px] num" style={{ color: "var(--text-dim)" }}>{mealCal} kcal</span>}>{meal}</SubHead>
                    {items.map((f, i) => (
                      <FoodLine key={i} emoji={f.emoji} name={f.name} grams={f.grams} sub={macroLine(f)} cal={f.cal}
                        right={<button type="button" className={SM_BTN} aria-label={`Swap ${f.name}`} title="Swap for a similar food"
                          onClick={() => { const swaps = getMealSwaps(f, meal, selTemplate); if (swaps.length > 0) { const swap = swaps[Math.floor(Math.random() * swaps.length)]; const newPlan = { ...generatedPlan }; const ratio = (f.grams || 100) / 100; newPlan[meal] = [...newPlan[meal]]; newPlan[meal][i] = { ...swap, grams: f.grams || 100, cal: Math.round(swap.cal * ratio), protein: Math.round(swap.protein * ratio * 10) / 10, carbs: Math.round(swap.carbs * ratio * 10) / 10, fat: Math.round(swap.fat * ratio * 10) / 10, fiber: Math.round(swap.fiber * ratio * 10) / 10, meal }; setGeneratedPlan(newPlan); } }}><Shuffle size={15} /></button>} />
                    ))}
                  </div>
                );
              })}

              <div className="flex gap-2 mt-4">
                <button type="button" className="bp flex-1" onClick={() => { Object.entries(generatedPlan).forEach(([meal, items]) => toArr(items).forEach(f => logPortion(f, meal))); setTab("log"); }}><CircleCheck size={17} />Log this plan today</button>
                <button type="button" className="icon-btn w-11 h-11 shrink-0" aria-label="Regenerate plan" title="Regenerate" onClick={() => { const plan = generateDayPlan(selTemplate, target); setGeneratedPlan(plan); }}><RefreshCw size={17} /></button>
              </div>
              <button type="button" className="bg w-full mt-2" onClick={() => { const wp = generateWeekPlan(selTemplate, target); setWeekPlan(wp); setShoppingList(getShoppingList(wp)); setPlanTab("weekly"); }}><CalendarDays size={16} />Generate full week plan</button>
            </Card>
          );
        })()}
      </>)}

      {/* ── WEEKLY PLAN ── */}
      {planTab === "weekly" && (
        <Card>
          {!weekPlan ? (
            <EmptyState icon={CalendarDays} title="No week plan yet" action={<button type="button" className="bg" onClick={() => setPlanTab("templates")}>Pick a diet style</button>}>Generate a plan from the Auto tab first.</EmptyState>
          ) : (
            <div>
              <div className="chip-row mb-3">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                  <button type="button" key={day} className={`chip ${selWeekDay === day ? "chip-a" : "chip-i"} shrink-0`} onClick={() => setSelWeekDay(day)}>{day.slice(0, 3)}</button>
                ))}
              </div>

              {weekPlan[selWeekDay] && (() => {
                const dayTotals = getPlanDayTotals(weekPlan[selWeekDay]);
                return (
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[20px] font-extrabold num" style={{ color: "var(--text-primary)" }}>{dayTotals.cal} kcal</span>
                      <span className="text-[12px] num" style={{ color: "var(--text-dim)" }}>P {Math.round(dayTotals.protein)}g · C {Math.round(dayTotals.carbs)}g · F {Math.round(dayTotals.fat)}g</span>
                    </div>
                    {["Breakfast", "Lunch", "Dinner", "Snack"].map(meal => {
                      const items = weekPlan[selWeekDay][meal] || [];
                      if (items.length === 0) return null;
                      return (
                        <div key={meal}>
                          <SubHead>{meal}</SubHead>
                          {items.map((f, i) => <FoodLine key={i} emoji={f.emoji} name={f.name} grams={f.grams} cal={f.cal} />)}
                        </div>
                      );
                    })}
                    <button type="button" className="bp w-full mt-4" onClick={() => { Object.entries(weekPlan[selWeekDay]).forEach(([meal, items]) => toArr(items).forEach(f => logPortion(f, meal))); setTab("log"); }}><CircleCheck size={17} />Log {selWeekDay}&apos;s plan</button>
                  </div>
                );
              })()}
            </div>
          )}
        </Card>
      )}

      {/* ── SHOPPING LIST ── */}
      {planTab === "shopping" && (
        shoppingList.length === 0 ? (
          <Card><EmptyState icon={ShoppingCart} title="No shopping list yet">Generate a weekly plan first to see your shopping list.</EmptyState></Card>
        ) : (
          <Card title="Weekly shopping list" sub={`${Object.values(checkedShop).filter(Boolean).length}/${shoppingList.length} checked`}>
            {shoppingList.map((item, i) => (
              <button type="button" key={i} onClick={() => setCheckedShop(p => ({ ...p, [item.name]: !p[item.name] }))} aria-pressed={!!checkedShop[item.name]}
                className={`flex items-center gap-3 w-full text-left py-1.5 ${i ? "border-t" : ""}`} style={{ borderColor: "var(--line)", opacity: checkedShop[item.name] ? 0.5 : 1 }}>
                <Check on={!!checkedShop[item.name]} />
                <div className="flex-1 min-w-0">
                  <FoodLine emoji={item.emoji} name={item.name} done={!!checkedShop[item.name]} sub={`${item.grams}g total · Used ${item.count}× this week`} />
                </div>
              </button>
            ))}
          </Card>
        )
      )}

      {/* ── MY PLANS (manual) ── */}
      {planTab === "create" && (<>
        {savedPlans.length > 0 && (
          <Card title="Saved plans" sub={`${savedPlans.length}`}>
            {savedPlans.map((plan, i) => (
              <div key={plan.id} className={`flex items-center gap-2 py-2.5 ${i ? "border-t" : ""}`} style={{ borderColor: "var(--line)" }}>
                <div className="flex-1 min-w-0">
                  <div className="row-title truncate">{plan.name}</div>
                  <div className="row-sub">{MEALS.map(m => `${(plan.items[m] || []).length} ${m.toLowerCase()}`).join(" · ")}</div>
                </div>
                <button type="button" className={SM_BTN} aria-label={`Edit ${plan.name}`} onClick={() => loadPlan(plan)}><Pencil size={15} /></button>
                <button type="button" className="bg px-3.5 py-2 text-[12.5px] shrink-0" onClick={() => { MEALS.forEach(meal => { (plan.items[meal] || []).forEach(f => { addFood(f, f.grams || 100, meal) }) }); setTab("log"); }}>Log</button>
                <button type="button" className={SM_BTN} style={{ color: "var(--danger)" }} aria-label={`Delete ${plan.name}`} onClick={() => deletePlan(plan.id)}><Trash2 size={15} /></button>
              </div>
            ))}
          </Card>
        )}

        <Card title={editingPlan ? "Edit plan" : "Create a plan"}>
          <input className="inp" placeholder="Plan name..." aria-label="Plan name" value={planName} onChange={e => setPlanName(e.target.value)} />
          {MEALS.map(meal => (<div key={meal}>
            <SubHead>{meal}</SubHead>
            {(planItems[meal] || []).map((f, i) => (
              <FoodLine key={i} emoji={f.emoji} name={f.name} grams={f.grams || 100} cal={Math.round(f.cal * (f.grams || 100) / 100)}
                right={<button type="button" className={SM_BTN} aria-label={`Remove ${f.name}`} onClick={() => removeFromPlan(meal, i)}><X size={15} /></button>} />
            ))}
            {(planItems[meal] || []).length === 0 && <div className="text-[12.5px] py-1" style={{ color: "var(--text-dim)" }}>No items</div>}
          </div>))}
          <div className="relative mt-4 mb-2">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-dim)" }} aria-hidden="true" />
            <input className="inp pl-10" placeholder="Search food to add..." aria-label="Search food to add to plan" value={planSearch} onChange={e => setPlanSearch(e.target.value)} />
          </div>
          {planSearch.length >= 2 && <div className="max-h-[220px] overflow-y-auto mb-2">
            {searchFoods(planSearch).slice(0, 12).map((f, i) => (
              <FoodLine key={f.name + i} emoji={f.emoji} name={f.name} sub={`${f.cal} kcal / 100g`}
                right={<div className="flex gap-1 shrink-0">{MEALS.map(m => <button type="button" key={m} onClick={() => addToPlan(f, m)} aria-label={`Add ${f.name} to ${m}`} title={m} className="chip chip-a w-9 h-9 justify-center p-0">{m[0]}</button>)}</div>} />
            ))}
          </div>}
          <div className="flex gap-2 mt-3">
            <button type="button" className="bp flex-1" onClick={savePlan} disabled={!planName.trim()}><Save size={17} />Save</button>
            {editingPlan && <button type="button" className="bg" onClick={() => { setEditingPlan(null); setPlanName(""); setPlanItems({ Breakfast: [], Lunch: [], Dinner: [], Snack: [] }) }}>Cancel</button>}
          </div>
        </Card>
      </>)}
    </>)}
  </div>);
}
