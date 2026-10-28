"use client";
import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import {
  Plus, Minus, X, Droplet, Coffee, Salad, UtensilsCrossed, Utensils, Cookie, Camera, ImageUp, PenLine, Search, Clock,
  ChevronLeft, ChevronRight, RefreshCw, CircleCheck, Sparkles, Save, Pencil, Trash2, Shuffle, Scale, Drumstick, Leaf,
  Flame, Soup, Wheat, Beef, Coins, Egg, Award, CalendarDays, ShoppingCart, Zap, ScanBarcode, WifiOff,
} from 'lucide-react';
import { XP } from '../data';
import { FOOD_DATABASE, FOOD_CATEGORIES, searchFoods } from '../data/foodDatabase';
import { prepareImage, readFile, scanPhoto as scanPhotoAI, describeMeal, lookupFood, lookupBarcode, getBarcodeDetector } from '@/lib/foodScan';
import { DIET_TEMPLATES, generateDayPlan, generateWeekPlan, getPlanDayTotals, getShoppingList, getSwapOptions as getMealSwaps } from '../data/mealPlanner';
import { today, dateKey, toArr } from '../utils';
import HistoryPanel from './HistoryPanel';
import { formatNutritionHistory } from '../historyFormatters';
import { localSync } from '@/utils/localSync';
import { Card, Ring, Bar, IconBadge, Pill, ListRow, Tabs, Tile, Check, EmptyState } from '@/components/ui/kit';

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];
const WATER_GOAL = 8;
const GRAM_PRESETS = [50, 100, 150, 200, 250, 300];
const PORTIONS = [0.5, 1, 1.5, 2];
const FOOD_XP_PER_DAY = 10; // food XP stops after 10 logs a day, so re-logging can't farm XP

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
  const [aiLookup, setAiLookup] = useState(null); // { query, loading, items, error }

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState("choose"); // choose | camera | text
  const [textDesc, setTextDesc] = useState("");
  const shSync = useMemo(() => localSync("ignite-scan-history", []), []);
  const [scanHistory, setScanHistory] = useState(shSync.get);
  const [scanResults, setScanResults] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scanPhoto, setScanPhoto] = useState(null);
  const [scanAdded, setScanAdded] = useState({}); // result index → true once logged
  const [barcode, setBarcode] = useState({ code: "", busy: false, error: null, live: false });
  const videoRef = useRef(null), streamRef = useRef(null), fileRef = useRef(null), abortRef = useRef(null), detectRef = useRef(null);

  // Diet plan state
  const defaultStyle = profile?.goal === "muscle" ? "bulking" : profile?.goal === "lose" ? "highprotein" : "balanced";
  const planType = PLAN_TYPES.find(p => p.id === (foodLog._macroStyle || defaultStyle)) || PLAN_TYPES[0];
  const setPlanType = (pt) => setFoodLog(p => ({ ...p, _macroStyle: pt.id }));
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

  const { target } = useMemo(() => calcTDEE(profile || {}), [profile]);
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

  // Append entries to today's log in one update; food XP is capped per day.
  const appendEntries = (entries) => {
    if (!entries.length) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let awards = 0;
    setFoodLog(p => {
      const prev = p || {};
      const used = prev._xp?.date === d ? Number(prev._xp.n) || 0 : 0;
      awards = Math.max(0, Math.min(entries.length, FOOD_XP_PER_DAY - used));
      return { ...prev, [d]: [...toArr(prev[d]), ...entries.map(e => ({ ...e, time }))], ...(awards ? { _xp: { date: d, n: used + awards } } : {}) };
    });
    if (awards) addXP(XP.food * awards, entries.length > 1 ? `${entries.length} foods logged` : "Food logged");
  };

  // Food values are per 100 g; scale them to the eaten weight.
  const scaleFood = (food, g = 100, meal = selMeal) => {
    const ratio = g / 100;
    const rest = { ...food };
    delete rest.servingGrams;
    return { ...rest, meal, grams: g, cal: Math.round(food.cal * ratio), protein: Math.round(food.protein * ratio * 10) / 10, carbs: Math.round(food.carbs * ratio * 10) / 10, fat: Math.round(food.fat * ratio * 10) / 10, fiber: Math.round((food.fiber || 0) * ratio * 10) / 10 };
  };
  const addFood = (food, g = 100, meal = selMeal) => {
    appendEntries([scaleFood(food, g, meal)]);
    setSelFood(null); setGrams(100);
  };

  // Log entries whose macros are already for their portion (meal-plan items, recent foods, scans).
  const portionEntry = (food, meal = selMeal) => ({ ...food, meal, cal: Math.round(Number(food.cal) || 0), protein: Number(food.protein) || 0, carbs: Number(food.carbs) || 0, fat: Number(food.fat) || 0, fiber: Number(food.fiber) || 0 });
  const logPortion = (food, meal = selMeal) => appendEntries([portionEntry(food, meal)]);
  const logPlanDay = (plan) => appendEntries(Object.entries(plan || {}).flatMap(([meal, items]) => MEALS.includes(meal) ? toArr(items).map(f => portionEntry(f, meal)) : []));

  const addCustomFood = () => {
    if (!custom.name.trim() || !custom.cal) return;
    const v = (x, max) => Math.min(max, Math.max(0, parseFloat(x) || 0));
    addFood({ name: custom.name.trim().slice(0, 80), emoji: "🍽️", cal: Math.round(v(custom.cal, 900)), protein: v(custom.protein, 100), carbs: v(custom.carbs, 100), fat: v(custom.fat, 100), fiber: v(custom.fiber, 100), category: "Custom" }, 100, selMeal);
    setCustom({ name: "", cal: "", protein: "", carbs: "", fat: "", fiber: "" }); setShowCustom(false);
  };

  const removeFood = (idx) => setFoodLog(p => ({ ...p, [d]: toArr(p[d]).filter((_, i) => i !== idx) }));
  const addWater = () => setFoodLog(p => ({ ...p, [`water_${d}`]: (Number(p[`water_${d}`]) || 0) + 1 }));
  const removeWater = () => setFoodLog(p => ({ ...p, [`water_${d}`]: Math.max(0, (Number(p[`water_${d}`]) || 0) - 1) }));

  // ── Scanner ──
  const stopCam = () => {
    if (detectRef.current) { clearInterval(detectRef.current); detectRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };
  const startCam = async () => {
    stopCam();
    if (!navigator.mediaDevices?.getUserMedia) { setScanError("This browser can't open the camera. Use Upload instead."); return false; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play().catch(() => { }); }
      return true;
    } catch (e) {
      setScanError(e?.name === "NotAllowedError" ? "Camera permission was blocked. Allow camera access in your browser settings, or use Upload instead." : "Camera unavailable. Use Upload instead.");
      return false;
    }
  };
  const cancelScan = () => { abortRef.current?.abort(); abortRef.current = null; setScanning(false); };

  const showResult = (data) => {
    if (data.cancelled) return;
    if (data.foods?.length > 0) { setScanResults(data.foods.map(f => ({ ...f, mult: 1 }))); setScanAdded({}); setScanError(null); }
    else setScanError(data.error || "Couldn't identify the food. Try a clearer photo or describe your meal.");
  };

  const analyzeImage = async (src) => {
    cancelScan();
    setScanMode("camera"); setScanError(null); setScanResults(null); setScanning(true);
    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      const jpeg = await prepareImage(src, 1024);
      setScanPhoto(jpeg);
      showResult(await scanPhotoAI(jpeg, ctrl.signal));
    } catch (e) {
      setScanError(e?.message || "Couldn't read that photo.");
    }
    if (abortRef.current === ctrl) { abortRef.current = null; setScanning(false); }
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) { setScanError("The camera isn't ready yet. Wait a second and try again."); return; }
    const scale = Math.min(1, 1024 / Math.max(v.videoWidth, v.videoHeight));
    const cv = document.createElement("canvas");
    cv.width = Math.round(v.videoWidth * scale); cv.height = Math.round(v.videoHeight * scale);
    cv.getContext("2d").drawImage(v, 0, 0, cv.width, cv.height);
    const url = cv.toDataURL("image/jpeg", .85);
    stopCam();
    setScanPhoto(url);
    analyzeImage(url);
  };
  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // picking the same photo again should still fire
    if (!f) return;
    setTab("scan");
    try { analyzeImage(await readFile(f)); } catch (err) { setScanMode("choose"); setScanError(err.message); }
  };

  const analyzeText = async (desc) => {
    if (!desc.trim()) return;
    cancelScan();
    setScanPhoto(null); setScanError(null); setScanResults(null); setScanning(true);
    const ctrl = new AbortController(); abortRef.current = ctrl;
    showResult(await describeMeal(desc.trim().slice(0, 300), ctrl.signal));
    if (abortRef.current === ctrl) { abortRef.current = null; setScanning(false); }
  };

  const setResultPortion = (i, mult) => setScanResults(r => r.map((f, j) => j === i ? { ...f, mult } : f));
  const scaledResult = (f) => {
    const m = f.mult || 1;
    const rest = { ...f };
    delete rest.mult;
    return { ...rest, emoji: f.emoji || "🍽️", category: "AI Scanned", grams: f.grams ? Math.round(f.grams * m) : undefined, cal: Math.round(f.cal * m), protein: Math.round(f.protein * m * 10) / 10, carbs: Math.round(f.carbs * m * 10) / 10, fat: Math.round(f.fat * m * 10) / 10, fiber: Math.round((f.fiber || 0) * m * 10) / 10, serving: m === 1 ? f.serving : `${m}× ${f.serving || "serving"}` };
  };
  const remember = (foods) => setScanHistory(p => [...foods, ...p.filter(x => !foods.some(f => f.name === x.name))].slice(0, 20));
  const addScanItem = (i) => {
    const f = scaledResult(scanResults[i]);
    appendEntries([portionEntry(f, selMeal)]);
    remember([f]);
    setScanAdded(a => ({ ...a, [i]: true }));
  };
  const addAllScan = () => {
    const items = scanResults.map((f, i) => [scaledResult(f), i]).filter(([, i]) => !scanAdded[i]).map(([f]) => f);
    appendEntries(items.map(f => portionEntry(f, selMeal)));
    remember(items);
    resetScan(); setTab("log");
  };
  const resetScan = () => { cancelScan(); stopCam(); setScanResults(null); setScanPhoto(null); setScanError(null); setScanAdded({}); setScanMode("choose"); };

  // ── Barcode ──
  const pickBarcodeFood = (food) => {
    stopCam();
    setBarcode({ code: "", busy: false, error: null, live: false });
    setSelFood(food); setGrams(food.servingGrams || 100);
    setScanMode("choose"); setTab("add");
  };
  const findBarcode = async (code) => {
    setBarcode(b => ({ ...b, code, busy: true, error: null }));
    const res = await lookupBarcode(code);
    if (res.food) pickBarcodeFood(res.food);
    else setBarcode(b => ({ ...b, busy: false, error: res.error }));
  };
  const startBarcode = async () => {
    setScanError(null); setTab("scan"); setScanMode("barcode");
    setBarcode({ code: "", busy: false, error: null, live: false });
    let detector;
    try { detector = await getBarcodeDetector(); } catch { setBarcode(b => ({ ...b, error: "Live barcode scanning isn't available here. Type the number under the barcode instead." })); return; }
    if (!(await startCam())) return;
    setBarcode(b => ({ ...b, live: true }));
    let busy = false;
    detectRef.current = setInterval(async () => {
      const v = videoRef.current;
      if (busy || !v || !v.videoWidth) return;
      busy = true;
      try {
        const codes = await detector.detect(v);
        const raw = codes.find(c => /^\d{8,14}$/.test(c.rawValue))?.rawValue;
        if (raw) { stopCam(); setBarcode(b => ({ ...b, live: false })); findBarcode(raw); }
      } catch { /* a frame that couldn't be read */ }
      busy = false;
    }, 350);
  };

  useEffect(() => () => { stopCam(); abortRef.current?.abort(); }, []);
  useEffect(() => { shSync.set(scanHistory); }, [scanHistory, shSync]);

  // AI lookup for foods that aren't in the built-in list — only when the user asks,
  // so typing in the search box never spends AI quota.
  const runAiLookup = async (q) => {
    const query = q.trim().slice(0, 60);
    if (query.length < 2) return;
    setAiLookup({ query, loading: true, items: [], error: null });
    const res = await lookupFood(query);
    setAiLookup({ query, loading: false, items: res.foods || [], error: res.foods?.length ? null : (res.error || `Couldn't find nutrition for "${query}".`) });
  };
  const aiItems = aiLookup && aiLookup.query === search.trim().slice(0, 60) ? aiLookup : null;

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

  // Scanner entry points (open the scanner view in the right mode)
  const openScanCamera = () => { resetScan(); setTab("scan"); setScanMode("camera"); setTimeout(startCam, 50) };
  const openScanText = () => { resetScan(); setTab("scan"); setScanMode("text") };
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;

  const accentFrame = { border: "2px solid color-mix(in srgb, var(--accent) 30%, transparent)", background: "var(--ghost-bg)" };

  // ══ SCAN VIEW ══
  if (tab === "scan") {
    const backToAdd = () => { resetScan(); setBarcode({ code: "", busy: false, error: null, live: false }); setTab("add"); };
    const backToChoose = () => { cancelScan(); stopCam(); setScanError(null); setScanMode("choose"); setBarcode({ code: "", busy: false, error: null, live: false }); };
    const visibleResults = scanResults || [];
    const resultTotal = visibleResults.reduce((s, f) => s + Math.round(f.cal * (f.mult || 1)), 0);
    return (<div className="page fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <button type="button" className="icon-btn shrink-0" aria-label="Back to Add food" onClick={backToAdd}><ChevronLeft size={20} /></button>
          <div className="flex-1 min-w-0">
            <div className="text-[18px] font-extrabold" style={{ color: "var(--text-primary)" }}>Food scanner</div>
            <div className="text-[13px]" style={{ color: "var(--text-dim)" }}>Photo, barcode, or describe your meal</div>
          </div>
          <IconBadge icon={Sparkles} tone="violet" size={38} />
        </div>
      </Card>

      {offline && (
        <Card tone="amber">
          <div className="flex items-center gap-3 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            <WifiOff size={18} className="shrink-0" aria-hidden="true" />
            <span>You&apos;re offline. AI scanning needs internet — you can still add foods from the food list or as a custom food.</span>
          </div>
        </Card>
      )}

      {/* Mode selector */}
      {scanMode === "choose" && !scanning && !scanResults && (<>
        <div className="tile-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <Tile icon={Camera} tone="sky" label="Camera" sub="Point at food" onClick={() => { setScanError(null); setScanMode("camera"); setTimeout(startCam, 50) }} />
          <Tile icon={ImageUp} tone="teal" label="Upload" sub="From gallery" onClick={() => fileRef.current?.click()} />
          <Tile icon={ScanBarcode} tone="amber" label="Barcode" sub="Packaged food" onClick={startBarcode} />
          <Tile icon={PenLine} tone="violet" label="Describe" sub="Type your meal" onClick={() => { setScanError(null); setScanMode("text") }} />
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        {scanError && <Card><div className="text-[13px]" style={{ color: "var(--danger)" }}>{scanError}</div></Card>}
        <div className="text-[12px] px-1" style={{ color: "var(--text-dim)" }}>Tip: photograph food from above, in good light, with the whole plate in view.</div>

        {/* Recent scans */}
        {scanHistory.length > 0 && (
          <Card title="Recent scans" sub={`Adds to ${selMeal}`}>
            {scanHistory.slice(0, 6).map((scan, i) => (
              <div key={scan.name + i} className={i ? "border-t" : ""} style={{ borderColor: "var(--line)" }}>
                <FoodLine emoji={scan.emoji} name={scan.name} sub={`${scan.serving ? scan.serving + " · " : ""}${macroLine(scan)}`} cal={scan.cal}
                  right={<button type="button" className="bg px-3 py-1.5 text-[12.5px] shrink-0" onClick={() => logPortion(scan, selMeal)}><Plus size={14} />Add</button>} />
              </div>
            ))}
          </Card>
        )}
      </>)}

      {/* Live camera (photo or barcode) */}
      {(scanMode === "camera" || scanMode === "barcode") && !scanPhoto && !scanning && !scanResults && (
        <Card>
          <div className="w-full max-w-[400px] aspect-square rounded-2xl overflow-hidden mx-auto mb-4 relative" style={accentFrame}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {scanMode === "barcode"
              ? <div className="absolute left-[10%] right-[10%] top-[38%] bottom-[38%] rounded-lg pointer-events-none" style={{ border: "2px solid var(--accent)" }} />
              : <div className="absolute top-[12%] left-[12%] right-[12%] bottom-[12%] rounded-lg pointer-events-none" style={{ border: "1px dashed color-mix(in srgb, var(--accent) 50%, transparent)" }} />}
          </div>
          {scanMode === "camera" ? (
            <div className="flex gap-2.5 max-w-[400px] mx-auto">
              <button type="button" className="icon-btn w-12 h-12 shrink-0" aria-label="Back" onClick={backToChoose}><ChevronLeft size={20} /></button>
              <button type="button" className="bp flex-1 text-[15px]" onClick={capture}><Camera size={18} />Capture</button>
            </div>
          ) : (
            <div className="max-w-[400px] mx-auto">
              <div className="text-center text-[13px] mb-3" style={{ color: "var(--text-secondary)" }}>
                {barcode.busy ? "Looking up product…" : barcode.live ? "Hold the barcode inside the box" : "Or type the number under the barcode"}
              </div>
              <form className="flex gap-2" onSubmit={e => { e.preventDefault(); findBarcode(barcode.code); }}>
                <button type="button" className="icon-btn w-11 h-11 shrink-0" aria-label="Back" onClick={backToChoose}><ChevronLeft size={20} /></button>
                <input className="inp flex-1 text-center num" inputMode="numeric" placeholder="e.g. 8901058000290" aria-label="Barcode number" value={barcode.code} onChange={e => setBarcode(b => ({ ...b, code: e.target.value.replace(/\D/g, "").slice(0, 14) }))} />
                <button type="submit" className="bp shrink-0" disabled={barcode.busy || barcode.code.length < 8}>Find</button>
              </form>
              {barcode.error && (
                <div className="text-center text-[13px] mt-3" style={{ color: "var(--warn)" }}>
                  {barcode.error}
                  <div className="flex gap-2 justify-center mt-2">
                    {!barcode.live && <button type="button" className="bg text-[12.5px]" onClick={startBarcode}><RefreshCw size={14} />Scan again</button>}
                    <button type="button" className="bg text-[12.5px]" onClick={() => { backToAdd(); setShowCustom(true); }}><Plus size={14} />Custom food</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {scanError && <div className="text-center text-[13px] mt-3" style={{ color: "var(--danger)" }}>{scanError}</div>}
        </Card>
      )}

      {/* Text describe mode */}
      {scanMode === "text" && !scanning && !scanResults && (
        <Card title="Describe what you ate" className="fade-in">
          <textarea className="inp resize-none w-full text-sm p-3" value={textDesc} maxLength={300} onChange={e => setTextDesc(e.target.value)}
            placeholder="Example: 2 rotis with dal and chicken curry, a bowl of rice, and buttermilk"
            rows={3} />
          <div className="text-[12px] mt-3 mb-1.5" style={{ color: "var(--text-dim)" }}>Try an example</div>
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {["2 idli with sambar and chutney", "Chicken biryani with raita", "1 plate poha with peanuts", "Paneer butter masala with 3 rotis", "Oats with banana and milk"].map(ex => (
              <button type="button" key={ex} className="chip chip-i text-[12px]" onClick={() => setTextDesc(ex)}>{ex}</button>
            ))}
          </div>
          {scanError && <div className="text-[13px] mb-3" style={{ color: "var(--warn)" }}>{scanError}</div>}
          <div className="flex gap-2">
            <button type="button" className="icon-btn w-11 h-11 shrink-0" aria-label="Back" onClick={backToChoose}><ChevronLeft size={20} /></button>
            <button type="button" className="bp flex-1" onClick={() => analyzeText(textDesc)} disabled={!textDesc.trim() || offline}><Sparkles size={17} />Analyze food</button>
          </div>
        </Card>
      )}

      {/* Photo preview with error/retry (analysis finished without results) */}
      {scanMode === "camera" && scanPhoto && !scanning && !scanResults && (
        <Card className="text-center">
          <div className="w-[200px] h-[200px] rounded-2xl overflow-hidden mx-auto mb-4" style={{ border: "1px solid var(--line)" }}>
            <img src={scanPhoto} alt="Your food" className="w-full h-full object-cover" />
          </div>
          {scanError && <div className="text-[13px] mb-3 px-3" style={{ color: "var(--warn)" }}>{scanError}</div>}
          <div className="flex gap-2 justify-center flex-wrap">
            <button type="button" className="bp" onClick={() => analyzeImage(scanPhoto)} disabled={offline}><RefreshCw size={16} />Try again</button>
            <button type="button" className="bg" onClick={() => { setScanPhoto(null); setScanError(null); setScanMode("text"); }}><PenLine size={16} />Describe instead</button>
            <button type="button" className="icon-btn w-11 h-11" aria-label="Close" onClick={backToChoose}><X size={18} /></button>
          </div>
        </Card>
      )}

      {/* Analysing */}
      {scanning && (
        <Card className="text-center py-8">
          {scanPhoto && <div className="w-[160px] h-[160px] rounded-2xl overflow-hidden mx-auto mb-5" style={accentFrame}><img src={scanPhoto} alt="" className="w-full h-full object-cover" /></div>}
          <div className="flex gap-1.5 justify-center mb-3" aria-hidden="true">
            {[0, 1, 2].map(i => <div key={i} className="w-[10px] h-[10px] rounded-full" style={{ background: "var(--accent)", animation: `dotPulse 1.2s ${i * .2}s infinite` }} />)}
          </div>
          <div className="text-sm font-semibold" role="status" style={{ color: "var(--accent)" }}>Analyzing your food…</div>
          <div className="text-[12px] mt-1" style={{ color: "var(--text-dim)" }}>Estimating calories, protein, carbs and fat</div>
          <button type="button" className="bg mt-4" onClick={() => { cancelScan(); setScanError(null); }}><X size={15} />Cancel</button>
        </Card>
      )}

      {/* Results */}
      {scanResults && (
        <Card className="fade-in">
          {scanPhoto && <div className="w-[120px] h-[120px] rounded-xl overflow-hidden mx-auto mb-3"><img src={scanPhoto} alt="Your food" className="w-full h-full object-cover" /></div>}
          <div className="text-center mb-3">
            <div className="text-[17px] font-bold inline-flex items-center gap-1.5" style={{ color: "var(--ok)" }}><CircleCheck size={19} />{visibleResults.length} item{visibleResults.length > 1 ? "s" : ""} found</div>
            <div className="text-[12.5px] num" style={{ color: "var(--text-dim)" }}>Total: {resultTotal} kcal · AI estimate — adjust the portion if needed</div>
          </div>
          <Tabs tabs={MEALS.map(m => [m, m])} value={selMeal} onChange={setSelMeal} label="Meal" className="mb-3" />

          {visibleResults.map((f, i) => {
            const sf = scaledResult(f);
            return (
              <div key={i} className={`py-1 ${i ? "border-t" : ""}`} style={{ borderColor: "var(--line)", opacity: scanAdded[i] ? 0.55 : 1 }}>
                <FoodLine emoji={f.emoji} name={f.name} sub={`${sf.serving || "1 serving"}${sf.grams ? ` (~${sf.grams} g)` : ""} · ${macroLine(sf)}`} cal={sf.cal}
                  right={scanAdded[i]
                    ? <span className="text-[12.5px] font-semibold shrink-0 inline-flex items-center gap-1" style={{ color: "var(--ok)" }}><CircleCheck size={14} />Added</span>
                    : <button type="button" className="bg px-3 py-1.5 text-[12.5px] shrink-0" onClick={() => addScanItem(i)}><Plus size={14} />Add</button>} />
                {!scanAdded[i] && (
                  <div className="flex gap-1 pl-9 pb-1" role="group" aria-label={`Portion of ${f.name}`}>
                    {PORTIONS.map(m => <button type="button" key={m} className={`chip ${(f.mult || 1) === m ? "chip-a" : "chip-i"} text-[12px] py-1`} aria-pressed={(f.mult || 1) === m} onClick={() => setResultPortion(i, m)}>{m === 0.5 ? "½" : m === 1.5 ? "1½" : m}×</button>)}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex gap-2.5 mt-4">
            <button type="button" className="bp flex-1" onClick={addAllScan}><CircleCheck size={17} />{Object.keys(scanAdded).length ? "Add the rest & done" : "Add all & done"}</button>
            <button type="button" className="bg" onClick={resetScan}><RefreshCw size={16} />New scan</button>
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
          <input className="inp w-24 text-center text-[18px] font-bold" type="number" aria-label="Grams" value={grams} onChange={e => setGrams(Math.min(3000, Math.max(1, parseInt(e.target.value) || 0)))} />
          <span className="text-sm" style={{ color: "var(--text-dim)" }}>grams</span>
        </div>
        <div className="chip-row mt-2">{selFood.servingGrams && !GRAM_PRESETS.includes(selFood.servingGrams) && <button type="button" className={`chip ${grams === selFood.servingGrams ? "chip-a" : "chip-i"} flex-1 justify-center`} onClick={() => setGrams(selFood.servingGrams)}>1 serving ({selFood.servingGrams}g)</button>}{GRAM_PRESETS.map(g => <button type="button" key={g} className={`chip ${grams === g ? "chip-a" : "chip-i"} flex-1 justify-center`} onClick={() => setGrams(g)}>{g}g</button>)}</div>
        <div className="grid grid-cols-5 gap-1 my-3 text-center p-2.5 rounded-xl" style={{ background: "var(--ghost-bg)" }}>
          {[["Cal", Math.round(selFood.cal * grams / 100), "var(--tone-amber)"], ["Protein", Math.round(selFood.protein * grams / 100 * 10) / 10, C_PROT], ["Carbs", Math.round(selFood.carbs * grams / 100 * 10) / 10, C_CARB], ["Fat", Math.round(selFood.fat * grams / 100 * 10) / 10, C_FAT], ["Fiber", Math.round(selFood.fiber * grams / 100 * 10) / 10, C_FIBER]].map(([l, v, c]) => (
            <div key={l} className="min-w-0"><div className="text-[15px] font-bold num" style={{ color: c }}>{v}{l === "Cal" ? "" : "g"}</div><div className="text-[11px]" style={{ color: "var(--text-dim)" }}>{l}</div></div>
          ))}
        </div>
        <button type="button" className="bp w-full" onClick={() => addFood(selFood, grams, selMeal)}><Plus size={17} />Add {grams}g to {selMeal}</button>
      </Card>)}

      {!selFood && <>
        {/* AI scanner shortcuts */}
        <div className="tile-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <Tile icon={Camera} tone="sky" label="Scan" sub="Camera" onClick={openScanCamera} />
          <Tile icon={ImageUp} tone="teal" label="Photo" sub="From gallery" onClick={() => { resetScan(); fileRef.current?.click(); }} />
          <Tile icon={ScanBarcode} tone="amber" label="Barcode" sub="Packaged" onClick={() => { resetScan(); startBarcode(); }} />
          <Tile icon={PenLine} tone="violet" label="Describe" sub="AI estimate" onClick={openScanText} />
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        {scanHistory.length > 0 && (
          <button type="button" className="link-btn self-start px-1" onClick={() => { resetScan(); setTab("scan"); }}>Recent AI scans ({scanHistory.length})<ChevronRight size={15} /></button>
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
            <input className="inp pl-10" placeholder={`Search ${FOOD_DATABASE.length} foods… (biryani, idli, paneer, dal)`} aria-label="Search foods" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="chip-row mb-3">
            <button type="button" className={`chip ${selCat === "All" ? "chip-a" : "chip-i"} shrink-0`} onClick={() => setSelCat("All")}>All</button>
            {FOOD_CATEGORIES.map(c => <button type="button" key={c} className={`chip ${selCat === c ? "chip-a" : "chip-i"} shrink-0`} onClick={() => setSelCat(c)}>{c}</button>)}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2 max-h-[320px] overflow-y-auto">
            {filtered.slice(0, 36).map((f, i) => (<button type="button" key={f.name + i} className="fc" onClick={() => { setSelFood(f); setGrams(100) }}><div className="text-xl" aria-hidden="true">{f.emoji}</div><div className="text-[11.5px] font-medium mt-[3px]" style={{ color: "var(--text-primary)" }}>{f.name}</div><div className="text-[11px] num" style={{ color: "var(--text-dim)" }}>{f.cal} kcal</div></button>))}
          </div>
          {filtered.length === 0 && search && <div className="text-center pt-3 text-[13px]" style={{ color: "var(--text-dim)" }}>No match for &quot;{search}&quot; in the food list.</div>}
          {search.trim().length >= 2 && filtered.length < 6 && !aiItems && (
            <button type="button" className="bg w-full mt-3" disabled={offline} onClick={() => runAiLookup(search)}><Sparkles size={15} />Look up &quot;{search.trim().slice(0, 30)}&quot; with AI</button>
          )}
          {aiItems?.loading && <div className="text-center py-2 text-[12.5px]" role="status" style={{ color: "var(--accent)" }}>Looking it up…</div>}
          {aiItems?.error && <div className="text-center py-2 text-[12.5px]" style={{ color: "var(--warn)" }}>{aiItems.error}</div>}
          {aiItems?.items.length > 0 && (<div className="mt-3"><SubHead>AI lookup · per 100g</SubHead><div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2 max-h-[200px] overflow-y-auto">{aiItems.items.map((f, i) => (<button type="button" key={"ai" + i} className="fc" onClick={() => { setSelFood(f); setGrams(100); }}><div className="text-xl" aria-hidden="true">{f.emoji}</div><div className="text-[11.5px] font-medium mt-[3px]" style={{ color: "var(--text-primary)" }}>{f.name}</div><div className="text-[11px] num" style={{ color: "var(--accent)" }}>{f.cal} kcal</div></button>))}</div></div>)}
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
        <div className="text-[12px] mt-3 mb-1.5" style={{ color: "var(--text-dim)" }}>Macro style{!foodLog._macroStyle ? " · picked from your goal" : ""}</div>
        <div className="chip-row" role="group" aria-label="Macro style">
          {PLAN_TYPES.map(pt => <button type="button" key={pt.id} className={`chip ${planType.id === pt.id ? "chip-a" : "chip-i"} shrink-0`} aria-pressed={planType.id === pt.id} onClick={() => setPlanType(pt)}>{pt.label}</button>)}
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
                <button type="button" className="bp flex-1" onClick={() => { logPlanDay(generatedPlan); setTab("log"); }}><CircleCheck size={17} />Log this plan today</button>
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
                    <button type="button" className="bp w-full mt-4" onClick={() => { logPlanDay(weekPlan[selWeekDay]); setTab("log"); }}><CircleCheck size={17} />Log {selWeekDay}&apos;s plan</button>
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
                <button type="button" className="bg px-3.5 py-2 text-[12.5px] shrink-0" onClick={() => { appendEntries(MEALS.flatMap(meal => toArr(plan.items[meal]).map(f => scaleFood(f, f.grams || 100, meal)))); setTab("log"); }}>Log</button>
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
