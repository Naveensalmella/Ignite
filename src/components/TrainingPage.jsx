import { useState, useEffect, useRef, useMemo } from 'react';
import { getLevel, today } from '../utils';
import { GATES, XP } from '../data';
import { generateWorkout, ACTIVITY_TYPES, BODY_PARTS, TIME_OPTIONS, RUNNING, YOGA, HIIT, FIGHTING } from '../data/exercises';
import ExerciseDetail from './ExerciseDetail';
import ExerciseVisual from './ExerciseVisual';

const REST_OPTIONS = [15, 30, 45, 60, 90];
const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function TrainingPage({ totalXP, addXP, workoutLog, setWorkoutLog, profile }) {
  const lv = getLevel(totalXP);
  const d = today();
  const todayW = workoutLog[d];

  // Daily configurator state
  const [showConfig, setShowConfig] = useState(!todayW);
  const [dayActivity, setDayActivity] = useState(profile.trainingType || "bodyweight");
  const [dayFocus, setDayFocus] = useState("full");
  const [dayTime, setDayTime] = useState(parseInt(profile.dailyTime) || 45);

  // Session state
  const [workout, setWorkout] = useState(null);
  const [mode, setMode] = useState("config"); // config | preview | session | complete
  const [phase, setPhase] = useState("warmup");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedSets, setCompletedSets] = useState({});
  const [sessionTimer, setSessionTimer] = useState(0);
  const [sessionRunning, setSessionRunning] = useState(false);
  const [resting, setResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [restDuration, setRestDuration] = useState(45);
  const [exTimer, setExTimer] = useState(0);
  const [exTimerRunning, setExTimerRunning] = useState(false);
  const [calBurned, setCalBurned] = useState(0);
  const [expandedEx, setExpandedEx] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const timerRef = useRef(null), restRef = useRef(null), exRef = useRef(null);

  // Timers
  useEffect(() => { if (sessionRunning) { timerRef.current = setInterval(() => setSessionTimer(t => t + 1), 1000); return () => clearInterval(timerRef.current); } return () => clearInterval(timerRef.current); }, [sessionRunning]);
  useEffect(() => { if (resting && restTime > 0) { restRef.current = setInterval(() => setRestTime(t => { if (t <= 1) { setResting(false); return 0; } return t - 1; }), 1000); return () => clearInterval(restRef.current); } return () => clearInterval(restRef.current); }, [resting, restTime]);
  useEffect(() => { if (exTimerRunning && exTimer > 0) { exRef.current = setInterval(() => setExTimer(t => { if (t <= 1) { setExTimerRunning(false); return 0; } return t - 1; }), 1000); return () => clearInterval(exRef.current); } return () => clearInterval(exRef.current); }, [exTimerRunning, exTimer]);

  // Generate workout based on daily config
  const generateDaily = () => {
    const config = { ...profile, trainingType: dayActivity, dailyTime: String(dayTime), focusAreas: [dayFocus] };

    // Handle special activity types
    let w = generateWorkout(config);

    // Override with specific activity types
    if (dayActivity === "running") {
      const level = profile.fitnessLevel || "intermediate";
      const pool = level === "beginner" ? RUNNING.easy : level === "advanced" ? [...RUNNING.moderate, ...RUNNING.advanced] : RUNNING.moderate;
      w.exercises = pool.slice(0, Math.floor(dayTime / 15) || 1).map(e => ({ ...e, category: "strength" }));
      w.fighting = [];
      w.splitName = "Running Session";
    } else if (dayActivity === "yoga") {
      const count = Math.floor(dayTime / 5) || 4;
      const shuffled = [...YOGA].sort(() => Math.random() - 0.5);
      w.exercises = shuffled.slice(0, count).map(e => ({ ...e, category: "strength" }));
      w.fighting = [];
      w.splitName = "Yoga & Flexibility";
    } else if (dayActivity === "hiit") {
      const count = Math.max(2, Math.floor(dayTime / 8));
      const shuffled = [...HIIT].sort(() => Math.random() - 0.5);
      w.exercises = shuffled.slice(0, count).map(e => ({ ...e, category: "strength" }));
      w.fighting = [];
      w.splitName = "HIIT Session";
    } else if (["boxing", "kickboxing", "mma", "martial_arts"].includes(dayActivity)) {
      const fightPool = FIGHTING[dayActivity] || [];
      const count = Math.max(3, Math.floor(dayTime / 5));
      const shuffled = [...fightPool].sort(() => Math.random() - 0.5);
      w.fighting = shuffled.slice(0, count).map(e => ({ ...e, category: "combat" }));
      w.splitName = `${ACTIVITY_TYPES.find(a => a.id === dayActivity)?.label || dayActivity} Training`;
    }

    w.estTime = dayTime;
    setWorkout(w);
    setMode("preview");
  };

  const startSession = () => {
    setMode("session"); setPhase("warmup"); setCurrentIdx(0);
    setCompletedSets({}); setSessionTimer(0); setSessionRunning(true); setCalBurned(0);
  };

  // Swap an exercise for another
  const swapExercise = (idx) => {
    if (!workout) return;
    const allPool = [...(workout._pool || workout.exercises)];
    const current = workout.exercises[idx];
    const alternatives = allPool.filter(e => e.name !== current.name && e.bodyPart === current.bodyPart);
    if (alternatives.length === 0) return;
    const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
    const newExercises = [...workout.exercises];
    newExercises[idx] = { ...replacement, category: current.category };
    setWorkout(w => ({ ...w, exercises: newExercises }));
  };

  const getCurrentExercises = () => {
    if (!workout) return [];
    if (phase === "warmup") return workout.warmup;
    if (phase === "main") return workout.exercises;
    if (phase === "combat") return workout.fighting;
    if (phase === "cooldown") return workout.cooldown;
    return [];
  };

  const currentExercises = getCurrentExercises();
  const currentEx = currentExercises[currentIdx];

  const completeSet = (exIdx, setIdx) => {
    const key = `${phase}_${exIdx}_${setIdx}`;
    const ex = currentExercises[exIdx];
    const newCompleted = { ...completedSets, [key]: true };
    setCompletedSets(newCompleted);
    const sets = ex.sets || 1;
    const doneSets = Array.from({ length: sets }, (_, i) => newCompleted[`${phase}_${exIdx}_${i}`]).filter(Boolean).length;
    if (doneSets >= sets) {
      setCalBurned(c => c + (ex.cal || 5));
      if (exIdx < currentExercises.length - 1) {
        if (phase !== "warmup" && phase !== "cooldown") startRest();
        setTimeout(() => setCurrentIdx(exIdx + 1), 100);
      } else { advancePhase(); }
    } else {
      if (phase !== "warmup" && phase !== "cooldown") startRest();
    }
  };

  const advancePhase = () => {
    if (phase === "warmup") { setPhase("main"); setCurrentIdx(0); }
    else if (phase === "main") { if (workout.fighting.length > 0) { setPhase("combat"); setCurrentIdx(0); } else { setPhase("cooldown"); setCurrentIdx(0); } }
    else if (phase === "combat") { setPhase("cooldown"); setCurrentIdx(0); }
    else {
      setSessionRunning(false); setMode("complete");
      addXP(XP.workout + (workout.fighting.length * XP.combat), "Training complete");
      setWorkoutLog(p => ({ ...p, [d]: { type: "smart", splitName: workout.splitName, calBurned, duration: sessionTimer, exerciseCount: workout.exercises.length + workout.fighting.length, activity: dayActivity, focus: dayFocus, completedAt: new Date().toLocaleTimeString() } }));
    }
  };

  const startRest = () => { setResting(true); setRestTime(restDuration); };
  const skipRest = () => { setResting(false); setRestTime(0); };
  const isSetDone = (exIdx, setIdx) => completedSets[`${phase}_${exIdx}_${setIdx}`];
  const isExDone = (exIdx) => { const ex = currentExercises[exIdx]; if (!ex) return false; return Array.from({ length: ex.sets || 1 }, (_, i) => isSetDone(exIdx, i)).every(Boolean); };

  const phaseLabel = { warmup: "🔥 Warm-up", main: "💪 Main", combat: "⚔️ Combat", cooldown: "🧘 Cool-down" };
  const phaseColor = { warmup: "#f59e0b", main: "#10b981", combat: "#a78bfa", cooldown: "#06b6d4" };

  const getCalendarDays = () => { const now = new Date(), y = now.getFullYear(), m = now.getMonth(); const fd = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate(); const days = []; for (let i = 0; i < fd; i++) days.push(null); for (let i = 1; i <= dim; i++) { const ds = `${y}-${String(m + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`; days.push({ day: i, date: ds, workout: workoutLog[ds] }); } return days; };

  // ═══ DONE TODAY ═══
  if (todayW && mode === "config") {
    return (<div>
      <div className="gs" style={{ textAlign: "center", marginBottom: 20, border: "1px solid rgba(34,197,94,.2)" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
        <div style={{ fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 18, color: "#22c55e", letterSpacing: 1 }}>TRAINING COMPLETE</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{todayW.splitName} · {todayW.calBurned} cal · {formatTime(todayW.duration)}</div>
        <button className="bg" onClick={() => { setShowConfig(true); setMode("config"); }} style={{ marginTop: 12 }}>Train Again</button>
      </div>
      <div className="gs" style={{ marginBottom: 16 }}><div onClick={() => setShowCalendar(!showCalendar)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}><div className="sl" style={{ margin: 0 }}>{new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}</div><span style={{ color: "#6b7280", fontSize: 14 }}>{showCalendar ? "▾" : "▸"}</span></div>
        {showCalendar && <div className="fade-in" style={{ marginTop: 12 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, textAlign: "center" }}>{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d} style={{ fontSize: 10, color: "#6b7280", padding: 4, fontWeight: 600 }}>{d}</div>)}{getCalendarDays().map((day, i) => <div key={i} style={{ padding: 6, borderRadius: 6, fontSize: 12, fontWeight: 600, background: day?.workout ? "rgba(16,185,129,.15)" : "transparent", color: day?.workout ? "#22c55e" : day ? "#4b5563" : "transparent" }}>{day?.day || ""}</div>)}</div></div>}
      </div>
      <div className="sl">History</div>
      {Object.entries(workoutLog).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10).map(([date, w]) => (<div key={date} className="ex-card" style={{ cursor: "default" }}><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontWeight: 600 }}>{w.splitName || `Gate ${w.gate}`}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div></div><div style={{ display: "flex", gap: 10, fontSize: 12, alignItems: "center" }}><span style={{ color: "#ef4444" }}>{w.calBurned}cal</span><span style={{ color: "#6b7280" }}>{formatTime(w.duration)}</span></div></div></div>))}
    </div>);
  }

  // ═══ COMPLETE ═══
  if (mode === "complete") {
    return (<div style={{ textAlign: "center", padding: "40px 0" }} className="fade-in">
      <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
      <h2 style={{ fontFamily: "Rajdhani,sans-serif", fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>TRAINING COMPLETE</h2>
      <div style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>{workout?.splitName}</div>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
        {[["⏱", formatTime(sessionTimer), "Duration"], ["🔥", calBurned, "Calories"], ["💪", (workout?.exercises.length || 0) + (workout?.fighting.length || 0), "Exercises"], ["⚡", `+${XP.workout}`, "XP"]].map(([icon, val, label]) => (<div key={label} className="gs" style={{ padding: 16, minWidth: 80 }}><div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div><div style={{ fontSize: 20, fontWeight: 800, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{val}</div><div style={{ fontSize: 10, color: "#6b7280" }}>{label}</div></div>))}
      </div>
      <button className="bp" onClick={() => setMode("config")} style={{ marginTop: 24, padding: "14px 40px", letterSpacing: 2 }}>DONE</button>
    </div>);
  }

  // ═══ SESSION ═══
  if (mode === "session" && workout) {
    const totalPhases = ["warmup", "main", workout.fighting.length > 0 ? "combat" : null, "cooldown"].filter(Boolean);
    const phaseIdx = totalPhases.indexOf(phase);
    return (<div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div><div style={{ fontFamily: "Rajdhani,sans-serif", fontWeight: 700, color: phaseColor[phase], letterSpacing: 1, fontSize: 13 }}>{phaseLabel[phase]}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{workout.splitName}</div></div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#10b981", fontFamily: "Rajdhani,sans-serif", fontVariantNumeric: "tabular-nums" }}>{formatTime(sessionTimer)}</div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>{totalPhases.map((p, i) => <div key={p} style={{ flex: 1, height: 4, borderRadius: 2, background: i < phaseIdx ? "#10b981" : i === phaseIdx ? `${phaseColor[p]}80` : "rgba(255,255,255,.06)" }} />)}</div>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 14 }}>{currentExercises.map((_, i) => <div key={i} onClick={() => !isExDone(i) && setCurrentIdx(i)} style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, cursor: isExDone(i) ? "default" : "pointer", background: isExDone(i) ? `${phaseColor[phase]}20` : i === currentIdx ? `${phaseColor[phase]}15` : "rgba(255,255,255,.03)", border: i === currentIdx ? `1px solid ${phaseColor[phase]}50` : "1px solid rgba(255,255,255,.04)", color: isExDone(i) ? phaseColor[phase] : "#6b7280" }}>{isExDone(i) ? "✓" : i + 1}</div>)}</div>

      {resting && <div className="gs fade-in" style={{ marginBottom: 16, textAlign: "center", border: "1px solid rgba(16,185,129,.2)", padding: 20 }}><div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 2, marginBottom: 6 }}>REST</div><div style={{ fontSize: 48, fontWeight: 900, color: "#10b981", fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{restTime}</div><div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 10 }}>{REST_OPTIONS.map(r => <span key={r} className={`chip ${restDuration === r ? "chip-a" : "chip-i"}`} onClick={() => { setRestDuration(r); setRestTime(r); }} style={{ fontSize: 11 }}>{r}s</span>)}</div><button className="bp" onClick={skipRest} style={{ marginTop: 12, padding: "8px 28px" }}>Skip →</button></div>}

      {!resting && currentEx && <div className="gs fade-in" style={{ border: `1px solid ${phaseColor[phase]}20` }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: `${phaseColor[phase]}15`, color: phaseColor[phase], fontWeight: 700, fontFamily: "Rajdhani,sans-serif" }}>{phaseLabel[phase]}</span>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: "rgba(255,255,255,.03)", color: "#6b7280" }}>{currentIdx + 1}/{currentExercises.length}</span>
        </div>

        {/* Visual Demo */}
        <ExerciseVisual type={currentEx.anim || "push"} bodyPart={currentEx.bodyPart} size="md" />

        <div style={{ textAlign: "center", marginTop: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>{currentEx.name}</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>{currentEx.sets || 1}×{currentEx.reps} {currentEx.muscle ? `· ${currentEx.muscle}` : ""}</div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1, marginBottom: 8 }}>SETS</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Array.from({ length: currentEx.sets || 1 }, (_, setIdx) => {
              const done = isSetDone(currentIdx, setIdx);
              return <div key={setIdx} style={{ flex: "1 1 0", minWidth: 55 }}><div onClick={() => { if (!done) { if (currentEx.timed && !exTimerRunning && exTimer === 0) { setExTimer(currentEx.reps); setExTimerRunning(true); } else if (!currentEx.timed) { completeSet(currentIdx, setIdx); } } }} style={{ padding: "10px 6px", borderRadius: 10, textAlign: "center", cursor: done ? "default" : "pointer", background: done ? `${phaseColor[phase]}12` : "rgba(255,255,255,.02)", border: done ? `1px solid ${phaseColor[phase]}30` : "1px solid rgba(255,255,255,.04)" }}><div style={{ fontSize: 10, color: "#6b7280", fontFamily: "Rajdhani,sans-serif" }}>SET {setIdx + 1}</div><div style={{ fontSize: 16, fontWeight: 800, color: done ? "#22c55e" : "#e5e7eb", fontFamily: "Rajdhani,sans-serif" }}>{done ? "✓" : currentEx.timed ? `${currentEx.reps}s` : `×${currentEx.reps}`}</div></div></div>;
            })}
          </div>
        </div>

        {currentEx.timed && exTimerRunning && <div style={{ textAlign: "center", marginTop: 14, padding: 14, background: `${phaseColor[phase]}08`, borderRadius: 10 }}><div style={{ fontSize: 44, fontWeight: 900, color: exTimer <= 5 ? "#ef4444" : phaseColor[phase], fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{exTimer}</div></div>}
        {currentEx.timed && !exTimerRunning && exTimer === 0 && (() => { const ns = Array.from({ length: currentEx.sets || 1 }, (_, i) => i).find(i => !isSetDone(currentIdx, i)); if (ns !== undefined && !isSetDone(currentIdx, ns) && Object.keys(completedSets).some(k => k.startsWith(`${phase}_${currentIdx}_`))) setTimeout(() => completeSet(currentIdx, ns), 200); return null; })()}

        {currentEx.steps && <div style={{ marginTop: 12, padding: 10, background: "rgba(0,0,0,.2)", borderRadius: 8 }}><div style={{ fontSize: 11, color: phaseColor[phase], fontFamily: "Rajdhani,sans-serif", letterSpacing: 1, marginBottom: 6 }}>HOW TO</div>{currentEx.steps.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#d1d5db", marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${phaseColor[phase]}20` }}>{s}</div>)}{currentEx.tips && currentEx.tips.map((t, i) => <div key={i} style={{ fontSize: 12, color: "#6b7280", marginTop: 4, paddingLeft: 8 }}>💡 {t}</div>)}</div>}
      </div>}
    </div>);
  }

  // ═══ PREVIEW ═══
  if (mode === "preview" && workout) {
    return (<div>
      <div className="gs" style={{ marginBottom: 16, border: "1px solid rgba(16,185,129,.12)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#10b981,#06b6d4)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 2 }}>YOUR WORKOUT</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>{workout.splitName}</div>
          </div>
          <button className="bg" onClick={() => setMode("config")} style={{ fontSize: 12 }}>← Change</button>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          {[["⏱", `~${workout.estTime}min`], ["💪", `${workout.exercises.length} exercises`], ["⚔️", `${workout.fighting.length} combat`]].map(([i, v]) => <span key={v} style={{ fontSize: 12, padding: "4px 10px", background: "rgba(255,255,255,.03)", borderRadius: 6, color: "#d1d5db" }}>{i} {v}</span>)}
        </div>
        <button className="bp" onClick={startSession} style={{ width: "100%", marginTop: 16, padding: 16, fontSize: 16, letterSpacing: 2 }}>⚔️ START WORKOUT</button>
      </div>

      <div className="sl" style={{ color: "#10b981" }}>💪 Exercises</div>
      {workout.exercises.map((e, i) => <div key={i} className="ex-card" onClick={() => setExpandedEx(expandedEx === `m${i}` ? null : `m${i}`)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{e.sets}×{e.reps} {e.muscle ? `· ${e.muscle}` : ""}</div></div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span onClick={(ev) => { ev.stopPropagation(); swapExercise(i); }} style={{ fontSize: 11, color: "#6b7280", cursor: "pointer", padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,.03)" }}>🔄</span>
            <span style={{ color: "#4b5563", fontSize: 14 }}>{expandedEx === `m${i}` ? "▾" : "▸"}</span>
          </div>
        </div>
        {expandedEx === `m${i}` && <ExerciseDetail ex={e} color="#10b981" showComplete={false} />}
      </div>)}

      {workout.fighting.length > 0 && <>
        <div className="sl" style={{ color: "#a78bfa", marginTop: 16 }}>⚔️ Combat</div>
        {workout.fighting.map((e, i) => <div key={i} className="ex-card" onClick={() => setExpandedEx(expandedEx === `f${i}` ? null : `f${i}`)}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{e.sets}×{e.reps}</div></div><span style={{ color: "#4b5563", fontSize: 14 }}>{expandedEx === `f${i}` ? "▾" : "▸"}</span></div>
          {expandedEx === `f${i}` && <ExerciseDetail ex={e} color="#a78bfa" showComplete={false} />}
        </div>)}
      </>}

      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 16 }}>
        <span style={{ fontSize: 11, color: "#6b7280" }}>Rest:</span>
        {REST_OPTIONS.map(r => <span key={r} className={`chip ${restDuration === r ? "chip-a" : "chip-i"}`} onClick={() => setRestDuration(r)} style={{ padding: "4px 10px", fontSize: 11 }}>{r}s</span>)}
      </div>
    </div>);
  }

  // ═══ DAILY CONFIGURATOR ═══
  return (<div>
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>⚔️</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>Plan Today's Training</h2>
      <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Choose your activity, focus, and time</p>
    </div>

    {/* Activity Type */}
    <div className="gs" style={{ marginBottom: 14 }}>
      <div className="sl">What do you want to train?</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {ACTIVITY_TYPES.map(a => (
          <div key={a.id} onClick={() => setDayActivity(a.id)}
            style={{ padding: "12px 8px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: dayActivity === a.id ? "rgba(16,185,129,.08)" : "rgba(255,255,255,.02)", border: dayActivity === a.id ? "1px solid rgba(16,185,129,.3)" : "1px solid rgba(255,255,255,.04)", transition: "all 0.2s" }}>
            <div style={{ fontSize: 24 }}>{a.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: dayActivity === a.id ? "#10b981" : "#e5e7eb", marginTop: 4 }}>{a.label}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Body Focus (only for bodyweight/gym/mixed) */}
    {["bodyweight", "gym"].includes(dayActivity) && (
      <div className="gs" style={{ marginBottom: 14 }}>
        <div className="sl">Body part focus</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {BODY_PARTS.map(bp => (
            <span key={bp.id} className={`chip ${dayFocus === bp.id ? "chip-a" : "chip-i"}`}
              onClick={() => setDayFocus(bp.id)} style={{ padding: "8px 14px" }}>
              {bp.icon} {bp.label}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Time */}
    <div className="gs" style={{ marginBottom: 20 }}>
      <div className="sl">Available time</div>
      <div style={{ display: "flex", gap: 8 }}>
        {TIME_OPTIONS.map(t => (
          <div key={t} onClick={() => setDayTime(t)}
            style={{ flex: 1, padding: "12px 4px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: dayTime === t ? "rgba(16,185,129,.08)" : "rgba(255,255,255,.02)", border: dayTime === t ? "1px solid rgba(16,185,129,.3)" : "1px solid rgba(255,255,255,.04)" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: dayTime === t ? "#10b981" : "#e5e7eb", fontFamily: "Rajdhani,sans-serif" }}>{t}</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>min</div>
          </div>
        ))}
      </div>
    </div>

    <button className="bp" onClick={generateDaily} style={{ width: "100%", padding: 16, fontSize: 16, letterSpacing: 2 }}>
      ⚔️ GENERATE WORKOUT
    </button>
  </div>);
}
