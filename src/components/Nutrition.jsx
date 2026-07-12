import { useState, useMemo, useRef, useEffect } from 'react';
import { XP, FOOD_DB } from '../data';
import { today } from '../utils';

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];
const WATER_GOAL = 8;
const QTY_OPTIONS = [0.5, 1, 1.5, 2, 3];

const PLAN_TYPES = [
  { id: "balanced", label: "Balanced", icon: "⚖️", desc: "Even macros for general fitness", protPct: .25, carbPct: .45, fatPct: .30 },
  { id: "highprotein", label: "High Protein", icon: "🥩", desc: "Muscle building & recovery", protPct: .35, carbPct: .35, fatPct: .30 },
  { id: "lowcarb", label: "Low Carb", icon: "🥑", desc: "Fat loss & ketogenic style", protPct: .30, carbPct: .20, fatPct: .50 },
  { id: "vegetarian", label: "Vegetarian", icon: "🌱", desc: "Plant-based focus", protPct: .20, carbPct: .50, fatPct: .30 },
  { id: "bulking", label: "Bulk / Surplus", icon: "💪", desc: "Maximum muscle gain (+25%)", protPct: .30, carbPct: .45, fatPct: .25 },
];

function generatePlan(profile, planType, seed) {
  const w = parseFloat(profile.weight) || 70, h = parseFloat(profile.height) || 170;
  const age = parseInt(profile.age) || 25, gender = profile.gender || "male", goal = profile.goal || "fit";
  let bmr = gender === "female" ? 10 * w + 6.25 * h - 5 * age - 161 : 10 * w + 6.25 * h - 5 * age + 5;
  const actMult = profile.fitnessLevel === "beginner" ? 1.375 : profile.fitnessLevel === "advanced" ? 1.725 : 1.55;
  let tdee = Math.round(bmr * actMult);
  let targetCal = goal === "lose" ? Math.round(tdee * 0.8) : (goal === "muscle" || planType.id === "bulking") ? Math.round(tdee * 1.25) : tdee;
  const proteinG = Math.round((targetCal * planType.protPct) / 4);
  const carbG = Math.round((targetCal * planType.carbPct) / 4);
  const fatG = Math.round((targetCal * planType.fatPct) / 9);
  const mealSplit = { Breakfast: 0.25, Lunch: 0.35, Dinner: 0.30, Snack: 0.10 };
  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(((seed * (i + 1) * 9301 + 49297) % 233280) / 233280 * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (cats, n) => { let pool = FOOD_DB.filter(f => cats.includes(f.category)); if (planType.id === "vegetarian") pool = pool.filter(f => !["Chicken Breast", "Salmon"].includes(f.name)); return shuffle(pool).slice(0, n); };
  const meals = {};
  MEALS.forEach(meal => {
    const calTarget = Math.round(targetCal * mealSplit[meal]);
    let items;
    if (meal === "Breakfast") items = pick(["Grains", "Dairy", "Fruits"], 3);
    else if (meal === "Lunch" || meal === "Dinner") items = [pick(["Protein"], 1)[0], pick(["Grains"], 1)[0], pick(["Vegetables"], 1)[0]].filter(Boolean);
    else items = pick(["Fruits", "Nuts", "Dairy"], 2);
    meals[meal] = { calTarget, items };
  });
  return { tdee, targetCal, proteinG, carbG, fatG, meals, planType };
}

function Ring({ pct, color, size = 52, stroke = 5, children }) { const r = (size - stroke) / 2, c = 2 * Math.PI * r; return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div></div>) }

export default function Nutrition({ foodLog, setFoodLog, addXP, profile }) {
  const d = today();
  const todayLog = foodLog[d] || [];
  const todayWater = foodLog[`water_${d}`] || 0;

  const [tab, setTab] = useState("log");
  const [selMeal, setSelMeal] = useState("Breakfast");
  const [search, setSearch] = useState("");
  const [selFood, setSelFood] = useState(null);
  const [qty, setQty] = useState(1);
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ name: "", cal: "", protein: "", carbs: "", fat: "", fiber: "" });
  const [planType, setPlanType] = useState(PLAN_TYPES[0]);
  const [planSeed, setPlanSeed] = useState(Date.now());
  const [expandedDate, setExpandedDate] = useState(null);

  // AI Food Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scanPhoto, setScanPhoto] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  const plan = useMemo(() => generatePlan(profile || {}, planType, planSeed), [profile, planType, planSeed]);

  const totals = useMemo(() => ({
    cal: todayLog.reduce((s, f) => s + (f.cal || 0), 0),
    protein: todayLog.reduce((s, f) => s + (f.protein || 0), 0),
    carbs: todayLog.reduce((s, f) => s + (f.carbs || 0), 0),
    fat: todayLog.reduce((s, f) => s + (f.fat || 0), 0),
    fiber: todayLog.reduce((s, f) => s + (f.fiber || 0), 0),
  }), [todayLog]);

  const filtered = search ? FOOD_DB.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase())) : FOOD_DB;

  const addFood = (food, quantity = 1, meal = selMeal) => {
    const scaled = { ...food, meal, cal: Math.round(food.cal * quantity), protein: Math.round((food.protein || 0) * quantity * 10) / 10, carbs: Math.round((food.carbs || 0) * quantity * 10) / 10, fat: Math.round((food.fat || 0) * quantity * 10) / 10, fiber: Math.round((food.fiber || 0) * quantity * 10) / 10, qty: quantity, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setFoodLog(p => ({ ...p, [d]: [...(p[d] || []), scaled] }));
    addXP(XP.food, "Food logged");
    setSelFood(null); setQty(1);
  };

  const addCustomFood = () => {
    if (!custom.name.trim() || !custom.cal) return;
    addFood({ name: custom.name.trim(), emoji: "🍽️", cal: parseInt(custom.cal) || 0, protein: parseFloat(custom.protein) || 0, carbs: parseFloat(custom.carbs) || 0, fat: parseFloat(custom.fat) || 0, fiber: parseFloat(custom.fiber) || 0, category: "Custom" }, 1, selMeal);
    setCustom({ name: "", cal: "", protein: "", carbs: "", fat: "", fiber: "" }); setShowCustom(false);
  };

  const removeFood = (idx) => setFoodLog(p => ({ ...p, [d]: (p[d] || []).filter((_, i) => i !== idx) }));
  const addWater = () => setFoodLog(p => ({ ...p, [`water_${d}`]: (p[`water_${d}`] || 0) + 1 }));
  const removeWater = () => setFoodLog(p => ({ ...p, [`water_${d}`]: Math.max(0, (p[`water_${d}`] || 0) - 1) }));

  // ═══ AI SCANNER ═══
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 640 } } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch (err) {
      setScanError("Camera not available. Use the upload button instead.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  const openScanner = () => {
    setShowScanner(true); setScanResults(null); setScanError(null); setScanPhoto(null);
    setTimeout(() => startCamera(), 100);
  };

  const closeScanner = () => { stopCamera(); setShowScanner(false); setScanResults(null); setScanError(null); setScanPhoto(null); };

  useEffect(() => () => stopCamera(), []);

  const captureAndAnalyze = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current, video = videoRef.current;
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2, sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 512, 512);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setScanPhoto(dataUrl);
    stopCamera();
    analyzeImage(dataUrl.split(",")[1]);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setScanPhoto(dataUrl);
      stopCamera();
      analyzeImage(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64) => {
    setScanning(true); setScanError(null); setScanResults(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "food_analyze", imageBase64: base64 }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Analysis failed"); }
      const data = await res.json();
      if (data.foods && data.foods.length > 0) {
        setScanResults(data.foods);
      } else {
        setScanError(data.error || "Could not identify food in the image. Try a clearer photo.");
      }
    } catch (err) {
      setScanError(err.message || "Analysis failed. Make sure GEMINI_API_KEY is set in Vercel.");
    }
    setScanning(false);
  };

  const addScannedFood = (food) => {
    addFood({ name: food.name, emoji: food.emoji || "🍽️", cal: food.cal || 0, protein: food.protein || 0, carbs: food.carbs || 0, fat: food.fat || 0, fiber: food.fiber || 0, category: "AI Scanned", serving: food.serving }, 1, selMeal);
  };

  const historyDates = Object.keys(foodLog).filter(k => !k.startsWith("water_") && Array.isArray(foodLog[k]) && foodLog[k].length > 0).sort((a, b) => b.localeCompare(a));

  // ═══ SCANNER MODAL ═══
  if (showScanner) {
    return (<div style={{ minHeight: "100vh", background: "#060a0c", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>📸 AI Food Scanner</div><div style={{ fontSize: 12, color: "#6b7280" }}>Take a photo or upload an image of your food</div></div>
        <button className="bg" onClick={closeScanner} style={{ padding: "8px 14px" }}>✕ Close</button>
      </div>

      {/* Camera / Upload */}
      {!scanPhoto && !scanning && (<div>
        <div style={{ width: "100%", maxWidth: 400, aspectRatio: "1", borderRadius: 16, overflow: "hidden", border: "2px solid rgba(16,185,129,.2)", marginBottom: 16, background: "#111", margin: "0 auto 16px" }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div style={{ display: "flex", gap: 10, maxWidth: 400, margin: "0 auto" }}>
          <button className="bp" onClick={captureAndAnalyze} style={{ flex: 1, padding: 14, fontSize: 15 }}>📸 Capture & Analyze</button>
          <button className="bg" onClick={() => fileRef.current?.click()} style={{ padding: "14px 16px" }}>📁 Upload</button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
        </div>
        {scanError && <div style={{ textAlign: "center", color: "#ef4444", fontSize: 13, marginTop: 12 }}>⚠️ {scanError}</div>}
      </div>)}

      {/* Analyzing */}
      {scanning && (<div style={{ textAlign: "center", padding: "40px 0" }}>
        {scanPhoto && <div style={{ width: 200, height: 200, borderRadius: 16, overflow: "hidden", margin: "0 auto 20px", border: "2px solid rgba(16,185,129,.2)" }}><img src={scanPhoto} alt="food" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 12 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", animation: `dotPulse 1.2s ${i * .2}s infinite` }} />)}
        </div>
        <div style={{ fontSize: 14, color: "#10b981", fontWeight: 600 }}>Analyzing your food...</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>AI is identifying items and calculating nutrition</div>
      </div>)}

      {/* Results */}
      {scanResults && (<div className="fade-in">
        {scanPhoto && <div style={{ width: 160, height: 160, borderRadius: 12, overflow: "hidden", margin: "0 auto 16px", border: "2px solid rgba(16,185,129,.2)" }}><img src={scanPhoto} alt="food" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>✓ {scanResults.length} item{scanResults.length > 1 ? "s" : ""} identified</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Total: {scanResults.reduce((s, f) => s + (f.cal || 0), 0)} cal · Tap + to add any item</div>
        </div>

        {/* Meal selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, justifyContent: "center" }}>
          {MEALS.map(m => <span key={m} className={`chip ${selMeal === m ? "chip-a" : "chip-i"}`} onClick={() => setSelMeal(m)}>{m}</span>)}
        </div>

        {scanResults.map((food, i) => (
          <div key={i} className="gs" style={{ marginBottom: 10, border: "1px solid rgba(16,185,129,.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{food.emoji || "🍽️"}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#f3f4f6" }}>{food.name}</div>
                    {food.serving && <div style={{ fontSize: 11, color: "#6b7280" }}>{food.serving}</div>}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginTop: 10, textAlign: "center" }}>
                  {[["Cal", food.cal, "#f59e0b"], ["Protein", food.protein, "#ef4444"], ["Carbs", food.carbs, "#f59e0b"], ["Fat", food.fat, "#06b6d4"], ["Fiber", food.fiber, "#22c55e"]].map(([l, v, c]) => (
                    <div key={l}><div style={{ fontSize: 14, fontWeight: 700, color: c }}>{Math.round(v || 0)}{l === "Cal" ? "" : "g"}</div><div style={{ fontSize: 9, color: "#6b7280" }}>{l}</div></div>
                  ))}
                </div>
                {food.confidence && <div style={{ marginTop: 6 }}><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: food.confidence === "high" ? "rgba(34,197,94,.1)" : food.confidence === "medium" ? "rgba(245,158,11,.1)" : "rgba(239,68,68,.1)", color: food.confidence === "high" ? "#22c55e" : food.confidence === "medium" ? "#f59e0b" : "#ef4444" }}>Confidence: {food.confidence}</span></div>}
              </div>
              <button className="bp" onClick={() => addScannedFood(food)} style={{ padding: "10px 16px", marginLeft: 10, flexShrink: 0 }}>+ Add</button>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button className="bp" onClick={() => { scanResults.forEach(f => addScannedFood(f)); closeScanner(); }} style={{ flex: 1, padding: 12 }}>+ Add All ({scanResults.length})</button>
          <button className="bg" onClick={() => { setScanResults(null); setScanPhoto(null); startCamera(); }} style={{ padding: "12px 16px" }}>🔄 Rescan</button>
        </div>
      </div>)}

      {scanError && !scanning && scanPhoto && (<div style={{ textAlign: "center", marginTop: 16 }}>
        <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>⚠️ {scanError}</div>
        <button className="bg" onClick={() => { setScanError(null); setScanPhoto(null); startCamera(); }} style={{ padding: "10px 20px" }}>Try Again</button>
      </div>)}
    </div>);
  }

  return (<div>
    {/* Tabs */}
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
      {[["log", "🍎 Log"], ["scan", "📸 Scan"], ["plan", "📋 Plans"], ["history", "📅 History"]].map(([k, l]) => (
        <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`}
          onClick={() => { if (k === "scan") { openScanner(); } else setTab(k); }} style={{ padding: "8px 14px" }}>{l}</span>
      ))}
    </div>

    {/* ════ LOG TAB ════ */}
    {tab === "log" && (<div>
      <div className="gs" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div className="sl" style={{ margin: 0 }}>Today's Nutrition</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: totals.cal > plan.targetCal ? "#ef4444" : "#10b981" }}>{totals.cal} / {plan.targetCal} cal</span>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,.04)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ height: "100%", width: `${Math.min(100, (totals.cal / plan.targetCal) * 100)}%`, background: totals.cal > plan.targetCal ? "#ef4444" : "linear-gradient(90deg,#10b981,#06b6d4)", borderRadius: 4, transition: "width .5s" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {[["Protein", totals.protein, plan.proteinG, "#ef4444"], ["Carbs", totals.carbs, plan.carbG, "#f59e0b"], ["Fat", totals.fat, plan.fatG, "#06b6d4"], ["Fiber", totals.fiber, 25, "#22c55e"]].map(([l, v, t, c]) => (
            <div key={l} style={{ textAlign: "center" }}><Ring pct={(v / t) * 100} color={c} size={44} stroke={4}><span style={{ fontSize: 10, fontWeight: 700, color: c }}>{Math.round(v)}</span></Ring><div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{l}</div><div style={{ fontSize: 9, color: "#4b5563" }}>/{t}g</div></div>
          ))}
        </div>
      </div>

      {/* Quick Scan Button */}
      <button className="bp" onClick={openScanner} style={{ width: "100%", padding: 14, marginBottom: 16, background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", boxShadow: "0 4px 16px rgba(139,92,250,.2)", fontSize: 15, letterSpacing: 1 }}>
        📸 Scan Food with AI
      </button>

      {/* Water */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><span style={{ fontSize: 16, marginRight: 6 }}>💧</span><span style={{ fontWeight: 600 }}>{todayWater}/{WATER_GOAL} glasses</span></div>
          <div style={{ display: "flex", gap: 6 }}><button className="bg" onClick={removeWater} style={{ padding: "6px 12px" }}>−</button><button className="bp" onClick={addWater} style={{ padding: "6px 14px" }}>+</button></div>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 8 }}>{Array.from({ length: WATER_GOAL }, (_, i) => <div key={i} style={{ flex: 1, height: 22, borderRadius: 4, background: i < todayWater ? "rgba(6,182,212,.2)" : "rgba(255,255,255,.03)", border: i < todayWater ? "1px solid rgba(6,182,212,.3)" : "1px solid rgba(255,255,255,.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: i < todayWater ? "#06b6d4" : "#4b5563" }}>{i < todayWater ? "💧" : ""}</div>)}</div>
      </div>

      {/* Meal Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>{MEALS.map(m => { const c = todayLog.filter(f => f.meal === m).length; const cal = todayLog.filter(f => f.meal === m).reduce((s, f) => s + (f.cal || 0), 0); return <span key={m} className={`chip ${selMeal === m ? "chip-a" : "chip-i"}`} onClick={() => setSelMeal(m)}>{m}{c > 0 ? <span style={{ fontSize: 10, opacity: .7 }}> ({cal}cal)</span> : ""}</span>; })}</div>

      {/* Food Qty Picker */}
      {selFood && (<div className="gs fade-in" style={{ marginBottom: 14, border: "1px solid rgba(16,185,129,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>{selFood.emoji}</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 600, color: "#f3f4f6" }}>{selFood.name}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{selFood.category}</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 12, textAlign: "center" }}>
          {[["Cal", Math.round(selFood.cal * qty), "#f59e0b"], ["Protein", Math.round(selFood.protein * qty * 10) / 10, "#ef4444"], ["Carbs", Math.round(selFood.carbs * qty * 10) / 10, "#f59e0b"], ["Fat", Math.round(selFood.fat * qty * 10) / 10, "#06b6d4"], ["Fiber", Math.round((selFood.fiber || 0) * qty * 10) / 10, "#22c55e"]].map(([l, v, c]) => (<div key={l}><div style={{ fontSize: 16, fontWeight: 700, color: c }}>{v}{l === "Cal" ? "" : "g"}</div><div style={{ fontSize: 9, color: "#6b7280" }}>{l}</div></div>))}
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Quantity</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>{QTY_OPTIONS.map(q => <span key={q} className={`chip ${qty === q ? "chip-a" : "chip-i"}`} onClick={() => setQty(q)} style={{ flex: 1, justifyContent: "center", padding: "8px 0" }}>{q}×</span>)}</div>
        <input type="range" min="0.25" max="5" step="0.25" value={qty} onChange={e => setQty(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#10b981" }} />
        <div style={{ textAlign: "center", fontSize: 12, color: "#10b981", fontWeight: 700, marginTop: 2, marginBottom: 10 }}>{qty} serving{qty !== 1 ? "s" : ""}</div>
        <div style={{ display: "flex", gap: 8 }}><button className="bp" onClick={() => addFood(selFood, qty)} style={{ flex: 1, padding: 12 }}>+ Add to {selMeal}</button><button className="bg" onClick={() => { setSelFood(null); setQty(1) }} style={{ padding: "12px 16px" }}>Cancel</button></div>
      </div>)}

      {/* Search + Grid */}
      {!selFood && <>
        <input className="inp" placeholder="Search foods..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 10 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(100px,1fr))", gap: 8, marginBottom: 12, maxHeight: 280, overflowY: "auto" }}>
          {filtered.slice(0, 30).map(f => (<div key={f.id} className="fc" onClick={() => { setSelFood(f); setQty(1) }}><div style={{ fontSize: 22 }}>{f.emoji}</div><div style={{ fontSize: 11, fontWeight: 500, color: "#e5e7eb", marginTop: 4 }}>{f.name}</div><div style={{ fontSize: 10, color: "#6b7280" }}>{f.cal}cal</div><div style={{ fontSize: 9, color: "#4b5563" }}>P:{f.protein} C:{f.carbs} F:{f.fat}</div></div>))}
        </div>
        <span onClick={() => setShowCustom(!showCustom)} style={{ fontSize: 12, color: "#10b981", cursor: "pointer", fontWeight: 600 }}>{showCustom ? "Cancel" : "+ Custom Food"}</span>
        {showCustom && (<div className="gs fade-in" style={{ marginTop: 10, border: "1px solid rgba(16,185,129,.15)" }}>
          <input className="inp" placeholder="Food name" value={custom.name} onChange={e => setCustom(p => ({ ...p, name: e.target.value }))} style={{ marginBottom: 8 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 8 }}>
            {[["Calories*", "cal"], ["Protein(g)", "protein"], ["Carbs(g)", "carbs"], ["Fat(g)", "fat"], ["Fiber(g)", "fiber"]].map(([l, k]) => (<div key={k}><label style={{ fontSize: 10, color: "#6b7280", display: "block", marginBottom: 2 }}>{l}</label><input className="inp" type="number" placeholder="0" value={custom[k]} onChange={e => setCustom(p => ({ ...p, [k]: e.target.value }))} style={{ padding: 8, textAlign: "center" }} /></div>))}
          </div>
          <button className="bp" onClick={addCustomFood} disabled={!custom.name.trim() || !custom.cal} style={{ width: "100%", padding: 12 }}>+ Add to {selMeal}</button>
        </div>)}
      </>}

      {/* Logged */}
      {todayLog.length > 0 && (<div className="gs" style={{ marginTop: 14 }}><div className="sl">Today · {todayLog.length} items · {totals.cal}cal</div>
        {MEALS.map(meal => { const items = todayLog.map((f, i) => ({ ...f, _idx: i })).filter(f => f.meal === meal); if (items.length === 0) return null; return (<div key={meal} style={{ marginBottom: 10 }}><div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginBottom: 4 }}>{meal} — {items.reduce((s, f) => s + (f.cal || 0), 0)}cal</div>{items.map(f => (<div key={f._idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><span>{f.emoji}</span><div><div style={{ fontSize: 13 }}>{f.name}{f.qty && f.qty !== 1 ? <span style={{ color: "#6b7280" }}> ×{f.qty}</span> : ""}</div><div style={{ fontSize: 10, color: "#4b5563" }}>P:{f.protein}g C:{f.carbs}g F:{f.fat}g{f.fiber ? ` Fb:${f.fiber}g` : ""}</div></div></div><div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>{f.cal}cal</span><span onClick={() => removeFood(f._idx)} style={{ cursor: "pointer", color: "#4b5563", fontSize: 14 }}>×</span></div></div>))}</div>); })}
      </div>)}
    </div>)}

    {/* ════ DIET PLANS TAB ════ */}
    {tab === "plan" && (<div>
      <div className="gs" style={{ marginBottom: 16, textAlign: "center" }}><div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 2 }}>DAILY TARGET</div><div style={{ fontSize: 40, fontWeight: 900, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{plan.targetCal} cal</div><div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>TDEE: {plan.tdee} · {profile.goal === "lose" ? "Deficit (-20%)" : profile.goal === "muscle" ? "Surplus (+25%)" : "Maintenance"}</div><div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12 }}>{[["Protein", plan.proteinG, "#ef4444"], ["Carbs", plan.carbG, "#f59e0b"], ["Fat", plan.fatG, "#06b6d4"]].map(([l, v, c]) => (<div key={l}><div style={{ fontSize: 20, fontWeight: 800, color: c }}>{v}g</div><div style={{ fontSize: 10, color: "#6b7280" }}>{l}</div></div>))}</div></div>
      <div className="gs" style={{ marginBottom: 16 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><div className="sl" style={{ margin: 0 }}>Diet Style</div><span onClick={() => setPlanSeed(Date.now())} style={{ fontSize: 12, color: "#10b981", cursor: "pointer", fontWeight: 600 }}>🔄 New Plan</span></div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{PLAN_TYPES.map(pt => (<span key={pt.id} className={`chip ${planType.id === pt.id ? "chip-a" : "chip-i"}`} onClick={() => { setPlanType(pt); setPlanSeed(Date.now()) }} style={{ padding: "8px 12px" }}>{pt.icon} {pt.label}</span>))}</div><div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>{planType.desc}</div></div>
      {MEALS.map(meal => { const mp = plan.meals[meal]; return (<div key={meal} className="gs" style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><div className="sl" style={{ margin: 0 }}>{meal}</div><span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>~{mp.calTarget}cal</span></div>{mp.items.map((f, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}><div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ fontSize: 20 }}>{f.emoji}</span><div><div style={{ fontSize: 14, fontWeight: 500 }}>{f.name}</div><div style={{ fontSize: 11, color: "#6b7280" }}>P:{f.protein}g C:{f.carbs}g F:{f.fat}g</div></div></div><div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>{f.cal}cal</span><button className="bg" onClick={() => { addFood(f, 1, meal); setTab("log") }} style={{ padding: "4px 10px", fontSize: 11 }}>+ Log</button></div></div>))}</div>); })}
      <button className="bg" onClick={() => setPlanSeed(Date.now())} style={{ width: "100%", padding: 12, marginTop: 8 }}>🔄 Generate Different Plan</button>
    </div>)}

    {/* ════ HISTORY TAB ════ */}
    {tab === "history" && (<div>
      <div className="gs" style={{ marginBottom: 16, textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{historyDates.length} Days Tracked</div>{historyDates.length > 0 && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Avg: {Math.round(historyDates.reduce((s, ds) => s + (foodLog[ds] || []).reduce((s2, f) => s2 + (f.cal || 0), 0), 0) / historyDates.length)} cal/day</div>}</div>
      {historyDates.length === 0 && <div style={{ textAlign: "center", color: "#6b7280", padding: "20px 0" }}>No history yet.</div>}
      {historyDates.slice(0, 30).map(date => { const items = foodLog[date] || []; const cal = items.reduce((s, f) => s + (f.cal || 0), 0); const prot = items.reduce((s, f) => s + (f.protein || 0), 0); const water = foodLog[`water_${date}`] || 0; const isExp = expandedDate === date; return (<div key={date} className="gc" style={{ marginBottom: 8, padding: 14, cursor: "pointer" }} onClick={() => setExpandedDate(isExp ? null : date)}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontWeight: 600, fontSize: 14 }}>{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{items.length} items · P:{Math.round(prot)}g · 💧{water}</div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b", fontFamily: "Rajdhani,sans-serif" }}>{cal}cal</div><span style={{ color: "#4b5563", fontSize: 12 }}>{isExp ? "▾" : "▸"}</span></div></div>{isExp && (<div className="fade-in" style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,.04)", paddingTop: 8 }}>{items.map((f, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", color: "#d1d5db" }}><span>{f.emoji} {f.name}{f.qty && f.qty !== 1 ? ` ×${f.qty}` : ""}</span><span style={{ color: "#6b7280" }}>{f.cal}cal · {f.meal}</span></div>))}</div>)}</div>); })}
    </div>)}
  </div>);
}