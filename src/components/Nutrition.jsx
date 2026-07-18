import { useState, useMemo, useRef, useEffect } from 'react';
import { XP } from '../data';
import { FOOD_DATABASE, FOOD_CATEGORIES, searchFoods, searchFoodsCombined } from '../data/foodDatabase';
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
  const capture = () => { if (!videoRef.current || !canvasRef.current) return; const c = canvasRef.current, v = videoRef.current; c.width = 512; c.height = 512; const ctx = c.getContext("2d"); const sz = Math.min(v.videoWidth, v.videoHeight); ctx.drawImage(v, (v.videoWidth - sz) / 2, (v.videoHeight - sz) / 2, sz, sz, 0, 0, 512, 512); const url = c.toDataURL("image/jpeg", .8); setScanPhoto(url); stopCam(); analyze(url.split(",")[1]) };
  const handleFile = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { setScanPhoto(ev.target.result); stopCam(); analyze(ev.target.result.split(",")[1]) }; r.readAsDataURL(f) };
  const analyze = async (b64) => { setScanning(true); setScanError(null); setScanResults(null); try { const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "food_analyze", imageBase64: b64 }) }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed"); const d = await r.json(); if (d.foods?.length > 0) setScanResults(d.foods); else setScanError("Could not identify food. Try a clearer photo.") } catch (e) { setScanError(e.message) } setScanning(false) };
  useEffect(() => () => stopCam(), []);

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
        <div><div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>📸 Food Scanner</div><div style={{ fontSize: 12, color: "#6b7280" }}>Point camera at your food</div></div>
        <button className="bg" onClick={() => { stopCam(); setTab("log"); setScanResults(null); setScanPhoto(null); setScanError(null) }} style={{ padding: "8px 14px" }}>← Back</button>
      </div>
      {!scanPhoto && !scanning && (<div><div style={{ width: "100%", maxWidth: 400, aspectRatio: "1", borderRadius: 16, overflow: "hidden", border: "2px solid rgba(16,185,129,.2)", margin: "0 auto 16px", background: "#111" }}><video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div><canvas ref={canvasRef} style={{ display: "none" }} /><div style={{ display: "flex", gap: 10, maxWidth: 400, margin: "0 auto" }}><button className="bp" onClick={capture} style={{ flex: 1, padding: 14, fontSize: 15 }}>📸 Capture</button><button className="bg" onClick={() => fileRef.current?.click()} style={{ padding: "14px 16px" }}>📁</button><input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} /></div>{scanError && <div style={{ textAlign: "center", color: "#ef4444", fontSize: 13, marginTop: 12 }}>{scanError}</div>}</div>)}
      {scanning && (<div style={{ textAlign: "center", padding: "40px 0" }}>{scanPhoto && <div style={{ width: 180, height: 180, borderRadius: 16, overflow: "hidden", margin: "0 auto 20px" }}><img src={scanPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}<div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 12 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", animation: `dotPulse 1.2s ${i * .2}s infinite` }} />)}</div><div style={{ fontSize: 14, color: "#10b981", fontWeight: 600 }}>Analyzing food...</div></div>)}
      {scanResults && (<div className="fade-in">{scanPhoto && <div style={{ width: 140, height: 140, borderRadius: 12, overflow: "hidden", margin: "0 auto 16px" }}><img src={scanPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}<div style={{ textAlign: "center", marginBottom: 14 }}><div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>✓ {scanResults.length} item{scanResults.length > 1 ? "s" : ""} found</div></div><div style={{ display: "flex", gap: 6, marginBottom: 12, justifyContent: "center" }}>{MEALS.map(m => <span key={m} className={`chip ${selMeal === m ? "chip-a" : "chip-i"}`} onClick={() => setSelMeal(m)}>{m}</span>)}</div>
        {scanResults.map((f, i) => (<div key={i} className="gs" style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 16, fontWeight: 600 }}>{f.emoji || "🍽️"} {f.name}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{f.serving || "1 serving"} · Cal:{f.cal} P:{f.protein}g C:{f.carbs}g F:{f.fat}g Fb:{f.fiber || 0}g</div></div><button className="bp" onClick={() => { addFood({ ...f, fiber: f.fiber || 0, category: "AI Scanned" }, 100, selMeal) }} style={{ padding: "8px 14px", flexShrink: 0 }}>+ Add</button></div></div>))}
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}><button className="bp" onClick={() => { scanResults.forEach(f => addFood({ ...f, fiber: f.fiber || 0, category: "AI Scanned" }, 100, selMeal)); stopCam(); setScanResults(null); setScanPhoto(null); setTab("log") }} style={{ flex: 1, padding: 12 }}>Add All & Done</button><button className="bg" onClick={() => { setScanResults(null); setScanPhoto(null); startCam() }} style={{ padding: "12px 16px" }}>Rescan</button></div>
      </div>)}
    </div>);
  }

  return (<div style={{ maxWidth: "100%", overflowX: "hidden" }}>
    {/* Tabs */}
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
      {[["log", "🍎 Log"], ["scan", "📸 Scan"], ["plan", "📋 Plans"], ["history", "📅 History"]].map(([k, l]) => (
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
        <div style={{ height: 8, background: "rgba(255,255,255,.04)", borderRadius: 4, overflow: "hidden", marginTop: 10 }}>
          <div style={{ height: "100%", width: `${Math.min(100, (totals.cal / target) * 100)}%`, background: totals.cal > target ? "#ef4444" : "linear-gradient(90deg,#10b981,#06b6d4)", borderRadius: 4, transition: "width .5s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
          {[["Protein", totals.protein, proteinG, "#ef4444"], ["Carbs", totals.carbs, carbG, "#f59e0b"], ["Fat", totals.fat, fatG, "#06b6d4"], ["Fiber", totals.fiber, 25, "#22c55e"]].map(([l, v, t, c]) => (
            <div key={l} style={{ textAlign: "center" }}><Ring pct={(v / t) * 100} color={c} size={40} stroke={3}><span style={{ fontSize: 9, fontWeight: 700, color: c }}>{Math.round(v)}</span></Ring><div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{l}</div></div>
          ))}
        </div>
      </div>

      {/* Water */}
      <div className="gs" style={{ marginBottom: 14, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600 }}>💧 {todayWater}/{WATER_GOAL}</span>
          <div style={{ display: "flex", gap: 6 }}><button className="bg" onClick={removeWater} style={{ padding: "4px 10px" }}>−</button><button className="bp" onClick={addWater} style={{ padding: "4px 12px" }}>+</button></div>
        </div>
        <div style={{ display: "flex", gap: 3, marginTop: 6 }}>{Array.from({ length: WATER_GOAL }, (_, i) => <div key={i} style={{ flex: 1, height: 18, borderRadius: 3, background: i < todayWater ? "rgba(6,182,212,.2)" : "rgba(255,255,255,.03)", border: i < todayWater ? "1px solid rgba(6,182,212,.3)" : "1px solid rgba(255,255,255,.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#06b6d4" }}>{i < todayWater ? "💧" : ""}</div>)}</div>
      </div>

      {/* Meal selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>{MEALS.map(m => { const mc = todayLog.filter(f => f.meal === m); const cal = mc.reduce((s, f) => s + (f.cal || 0), 0); return <span key={m} className={`chip ${selMeal === m ? "chip-a" : "chip-i"}`} onClick={() => setSelMeal(m)}>{m}{mc.length > 0 ? ` (${cal}cal)` : ""}</span> })}</div>

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

    {/* ════ PLANS TAB ════ */}
    {tab === "plan" && (<div>
      <div className="gs" style={{ marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: 2 }}>DAILY TARGET</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{target} cal</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>TDEE: {tdee} · {profile.goal === "lose" ? "Deficit" : "Maintain"}</div>
      </div>

      {savedPlans.length > 0 && (<div className="gs" style={{ marginBottom: 16 }}>
        <div className="sl">Saved Plans ({savedPlans.length})</div>
        {savedPlans.map(plan => (<div key={plan.id} className="gc" style={{ padding: 14, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 15, fontWeight: 600 }}>{plan.name}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{MEALS.map(m => `${(plan.items[m] || []).length} ${m.toLowerCase()}`).join(" · ")}</div></div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="bp" onClick={() => loadPlan(plan)} style={{ padding: "6px 12px", fontSize: 11 }}>Edit</button>
              <button className="bg" onClick={() => {
                MEALS.forEach(meal => { (plan.items[meal] || []).forEach(f => { addFood(f, f.grams || 100, meal) }) }); setTab("log");
              }} style={{ padding: "6px 12px", fontSize: 11 }}>Log All</button>
              <button onClick={() => deletePlan(plan.id)} style={{ padding: "6px 8px", background: "transparent", border: "1px solid rgba(239,68,68,.15)", borderRadius: 6, color: "#ef4444", fontSize: 11, cursor: "pointer" }}>✕</button>
            </div>
          </div>
        </div>))}
      </div>)}

      <div className="gs" style={{ marginBottom: 16 }}>
        <div className="sl">{editingPlan ? "Edit Plan" : "Create New Plan"}</div>
        <input className="inp" placeholder="Plan name (e.g. Weekday Diet, Bulk Plan...)" value={planName} onChange={e => setPlanName(e.target.value)} style={{ marginBottom: 10 }} />

        {MEALS.map(meal => (<div key={meal} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#10b981", marginBottom: 6 }}>{meal}</div>
          {(planItems[meal] || []).map((f, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
            <span style={{ fontSize: 13 }}>{f.emoji} {f.name} <span style={{ color: "#6b7280" }}>{f.grams || 100}g</span></span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ fontSize: 11, color: "#f59e0b" }}>{Math.round(f.cal * (f.grams || 100) / 100)}cal</span><span onClick={() => removeFromPlan(meal, i)} style={{ cursor: "pointer", color: "#4b5563" }}>×</span></div>
          </div>))}
          {(planItems[meal] || []).length === 0 && <div style={{ fontSize: 12, color: "#4b5563", padding: "4px 0" }}>No items yet</div>}
        </div>))}

        <div style={{ marginTop: 10 }}>
          <input className="inp" placeholder="Search food to add..." value={planSearch} onChange={e => setPlanSearch(e.target.value)} style={{ marginBottom: 8 }} />
          {planSearch.length >= 2 && <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 10 }}>
            {searchFoods(planSearch).slice(0, 12).map((f, i) => (<div key={f.name + i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.03)", cursor: "pointer" }}>
              <span style={{ fontSize: 13 }}>{f.emoji} {f.name} <span style={{ color: "#6b7280" }}>{f.cal}cal/100g</span></span>
              <div style={{ display: "flex", gap: 4 }}>{MEALS.map(m => <span key={m} onClick={() => addToPlan(f, m)} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,.06)", color: "#10b981", cursor: "pointer", border: "1px solid rgba(16,185,129,.15)" }}>{m[0]}</span>)}</div>
            </div>))}
          </div>}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button className="bp" onClick={savePlan} disabled={!planName.trim()} style={{ flex: 1, padding: 12 }}>💾 Save Plan</button>
          {editingPlan && <button className="bg" onClick={() => { setEditingPlan(null); setPlanName(""); setPlanItems({ Breakfast: [], Lunch: [], Dinner: [], Snack: [] }) }} style={{ padding: "12px 16px" }}>Cancel</button>}
        </div>
      </div>
    </div>)}

    {/* ════ HISTORY TAB ════ */}
    {tab === "history" && <HistoryPanel entries={formatNutritionHistory(foodLog)} title="Nutrition History" emptyText="Start logging food to see history" />}
  </div>);
}