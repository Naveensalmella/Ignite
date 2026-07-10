import { useState, useEffect, useRef, useMemo } from 'react';
import { getLevel, calcBMI, bmiCat, bmiCol, today } from '../utils';
import { GATES, XP } from '../data';
import { generateWorkout, EXERCISES, FIGHTING } from '../data/exercises';
import ExerciseDetail from './ExerciseDetail';

const ANIM_ICONS = { push: "💪", squat: "🦵", punch: "👊", kick: "🦶", plank: "🧘", burpee: "🔥" };
const REST_OPTIONS = [15, 30, 45, 60, 90];

function parseReps(reps) {
  if (!reps) return { sets: 1, value: 0, type: "reps", label: String(reps) };
  const s = String(reps);
  const tm = s.match(/(\d+)×(\d+)(s|min)/i);
  if (tm) return { sets: parseInt(tm[1]), value: parseInt(tm[2]) * (tm[3] === "min" ? 60 : 1), type: "timed", label: s };
  const rm = s.match(/(\d+)×(\d+)/);
  if (rm) return { sets: parseInt(rm[1]), value: parseInt(rm[2]), type: "reps", label: s };
  return { sets: 1, value: parseInt(reps) || 0, type: "reps", label: s };
}

const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function TrainingPage({ totalXP, addXP, workoutLog, setWorkoutLog, profile }) {
  const lv = getLevel(totalXP);
  const d = today();
  const todayW = workoutLog[d];
  const bmi = calcBMI(parseFloat(profile.weight), parseFloat(profile.height));

  const [mode, setMode] = useState("plan"); // plan | session | gates | complete | done
  const [workout, setWorkout] = useState(null);
  const [phase, setPhase] = useState("warmup"); // warmup | main | combat | cooldown
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeGate, setActiveGate] = useState(null);
  const [expandedEx, setExpandedEx] = useState(null);

  const timerRef = useRef(null); const restRef = useRef(null); const exRef = useRef(null);

  // Generate today's workout
  const todaysWorkout = useMemo(() => generateWorkout(profile || {}), [profile]);

  // Timers
  useEffect(() => { if (sessionRunning) { timerRef.current = setInterval(() => setSessionTimer(t => t + 1), 1000); return () => clearInterval(timerRef.current) } return () => clearInterval(timerRef.current) }, [sessionRunning]);
  useEffect(() => { if (resting && restTime > 0) { restRef.current = setInterval(() => setRestTime(t => { if (t <= 1) { setResting(false); return 0 } return t - 1 }), 1000); return () => clearInterval(restRef.current) } return () => clearInterval(restRef.current) }, [resting, restTime]);
  useEffect(() => { if (exTimerRunning && exTimer > 0) { exRef.current = setInterval(() => setExTimer(t => { if (t <= 1) { setExTimerRunning(false); return 0 } return t - 1 }), 1000); return () => clearInterval(exRef.current) } return () => clearInterval(exRef.current) }, [exTimerRunning, exTimer]);

  const startWorkout = () => {
    setWorkout(todaysWorkout); setMode("session"); setPhase("warmup");
    setCurrentIdx(0); setCompletedSets({}); setSessionTimer(0);
    setSessionRunning(true); setCalBurned(0);
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

    const parsed = ex.sets ? { sets: ex.sets, value: ex.reps, type: ex.timed ? "timed" : "reps" } : parseReps(ex.reps);
    const doneSets = Array.from({ length: parsed.sets }, (_, i) => newCompleted[`${phase}_${exIdx}_${i}`]).filter(Boolean).length;

    if (doneSets >= parsed.sets) {
      setCalBurned(c => c + (ex.cal || 5));
      // Move to next exercise or next phase
      if (exIdx < currentExercises.length - 1) {
        if (phase !== "warmup" && phase !== "cooldown") startRest();
        setTimeout(() => setCurrentIdx(exIdx + 1), 100);
      } else {
        advancePhase();
      }
    } else {
      if (phase !== "warmup" && phase !== "cooldown") startRest();
    }
  };

  const advancePhase = () => {
    if (phase === "warmup") { setPhase("main"); setCurrentIdx(0) }
    else if (phase === "main") {
      if (workout.fighting.length > 0) { setPhase("combat"); setCurrentIdx(0) }
      else { setPhase("cooldown"); setCurrentIdx(0) }
    }
    else if (phase === "combat") { setPhase("cooldown"); setCurrentIdx(0) }
    else {
      // Complete!
      setSessionRunning(false); setMode("complete");
      const combatCount = workout.fighting.length;
      addXP(XP.workout + combatCount * XP.combat, "Daily training");
      setWorkoutLog(p => ({
        ...p, [d]: {
          type: "smart", splitName: workout.splitName, bodyParts: workout.bodyParts,
          calBurned, duration: sessionTimer, exerciseCount: workout.exercises.length + workout.fighting.length,
          completedAt: new Date().toLocaleTimeString(), equipment: workout.equipment, level: workout.level,
        }
      }));
    }
  };

  const startRest = () => { setResting(true); setRestTime(restDuration) };
  const skipRest = () => { setResting(false); setRestTime(0) };
  const isSetDone = (exIdx, setIdx) => completedSets[`${phase}_${exIdx}_${setIdx}`];
  const isExDone = (exIdx) => {
    const ex = currentExercises[exIdx]; if (!ex) return false;
    const sets = ex.sets || 1;
    return Array.from({ length: sets }, (_, i) => isSetDone(exIdx, i)).every(Boolean);
  };

  const getCalendarDays = () => {
    const now = new Date(); const year = now.getFullYear(); const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++)days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ day: i, date: ds, workout: workoutLog[ds] });
    } return days;
  };

  const phaseLabel = { warmup: "🔥 Warm-up", main: "💪 Main Workout", combat: "⚔️ Combat", cooldown: "🧘 Cool-down" };
  const phaseColor = { warmup: "#f59e0b", main: "#10b981", combat: "#a78bfa", cooldown: "#06b6d4" };

  // ═══ ALREADY DONE TODAY ═══
  if (todayW && mode === "plan") {
    return (<div>
      <div className="gs" style={{ textAlign: "center", marginBottom: 20, border: "1px solid rgba(34,197,94,.2)" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
        <div style={{ fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 18, color: "#22c55e", letterSpacing: 1 }}>TODAY'S TRAINING COMPLETE</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{todayW.splitName || `Gate ${todayW.gate}`} · {todayW.calBurned} cal · {formatTime(todayW.duration)}</div>
      </div>
      {/* Calendar */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div onClick={() => setShowCalendar(!showCalendar)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
          <div className="sl" style={{ margin: 0 }}>{new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}</div>
          <span style={{ color: "#6b7280", fontSize: 14 }}>{showCalendar ? "▾" : "▸"}</span>
        </div>
        {showCalendar && <div className="fade-in" style={{ marginTop: 12 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, textAlign: "center" }}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d} style={{ fontSize: 10, color: "#6b7280", padding: 4, fontWeight: 600 }}>{d}</div>)}
          {getCalendarDays().map((day, i) => <div key={i} style={{ padding: 6, borderRadius: 6, fontSize: 12, fontWeight: 600, background: day?.workout ? "rgba(16,185,129,.15)" : "transparent", color: day?.workout ? "#22c55e" : day ? "#6b7280" : "transparent" }}>{day?.day || ""}{day?.workout && <div style={{ width: 4, height: 4, borderRadius: 2, background: "#22c55e", margin: "2px auto 0" }} />}</div>)}
        </div></div>}
      </div>
      {/* History */}
      <div className="sl">History</div>
      {Object.entries(workoutLog).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10).map(([date, w]) => (
        <div key={date} className="ex-card" style={{ cursor: "default" }}><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontWeight: 600 }}>{w.splitName || `Gate ${w.gate} — ${w.gateName}`}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div></div><div style={{ display: "flex", gap: 10, fontSize: 12, alignItems: "center" }}><span style={{ color: "#ef4444" }}>{w.calBurned}cal</span><span style={{ color: "#6b7280" }}>{formatTime(w.duration)}</span></div></div></div>
      ))}
    </div>);
  }

  // ═══ SESSION COMPLETE ═══
  if (mode === "complete") {
    return (<div style={{ textAlign: "center", padding: "40px 0" }} className="fade-in">
      <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
      <h2 style={{ fontFamily: "Rajdhani,sans-serif", fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>TRAINING COMPLETE</h2>
      <div style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>{workout?.splitName}</div>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
        {[["⏱", formatTime(sessionTimer), "Duration"], ["🔥", calBurned, "Calories"], ["💪", workout?.exercises.length || 0, "Exercises"], ["⚔️", workout?.fighting.length || 0, "Combat"], ["⚡", `+${XP.workout}`, "XP"]].map(([icon, val, label]) => (
          <div key={label} className="gs" style={{ padding: 16, minWidth: 80 }}><div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div><div style={{ fontSize: 20, fontWeight: 800, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{val}</div><div style={{ fontSize: 10, color: "#6b7280" }}>{label}</div></div>
        ))}
      </div>
      <button className="bp" onClick={() => setMode("plan")} style={{ marginTop: 24, padding: "14px 40px", letterSpacing: 2 }}>DONE</button>
    </div>);
  }

  // ═══ ACTIVE SESSION ═══
  if (mode === "session" && workout) {
    const totalPhases = ["warmup", "main", workout.fighting.length > 0 ? "combat" : null, "cooldown"].filter(Boolean);
    const phaseIdx = totalPhases.indexOf(phase);
    const doneInPhase = currentExercises.filter((_, i) => isExDone(i)).length;

    return (<div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "Rajdhani,sans-serif", fontWeight: 700, color: phaseColor[phase], letterSpacing: 1, fontSize: 13 }}>{phaseLabel[phase]}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{workout.splitName} · {doneInPhase}/{currentExercises.length}</div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#10b981", fontFamily: "Rajdhani,sans-serif", fontVariantNumeric: "tabular-nums" }}>{formatTime(sessionTimer)}</div>
      </div>

      {/* Phase progress */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {totalPhases.map((p, i) => (
          <div key={p} style={{ flex: 1, height: 4, borderRadius: 2, background: i < phaseIdx ? "#10b981" : i === phaseIdx ? `${phaseColor[p]}80` : "rgba(255,255,255,.06)", transition: "background .3s" }} />
        ))}
      </div>

      {/* Exercise progress dots */}
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 14 }}>
        {currentExercises.map((_, i) => (
          <div key={i} onClick={() => !isExDone(i) && setCurrentIdx(i)} style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, fontFamily: "Rajdhani,sans-serif", cursor: isExDone(i) ? "default" : "pointer", background: isExDone(i) ? `${phaseColor[phase]}20` : i === currentIdx ? `${phaseColor[phase]}15` : "rgba(255,255,255,.03)", border: i === currentIdx ? `1px solid ${phaseColor[phase]}50` : "1px solid rgba(255,255,255,.04)", color: isExDone(i) ? phaseColor[phase] : i === currentIdx ? phaseColor[phase] : "#6b7280" }}>{isExDone(i) ? "✓" : i + 1}</div>
        ))}
      </div>

      {/* Rest Timer */}
      {resting && (<div className="gs fade-in" style={{ marginBottom: 16, textAlign: "center", border: "1px solid rgba(16,185,129,.2)", padding: 20 }}>
        <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 2, marginBottom: 6 }}>REST</div>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#10b981", fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{restTime}</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 10 }}>{REST_OPTIONS.map(r => <span key={r} className={`chip ${restDuration === r ? "chip-a" : "chip-i"}`} onClick={() => { setRestDuration(r); setRestTime(r) }} style={{ fontSize: 11 }}>{r}s</span>)}</div>
        <button className="bp" onClick={skipRest} style={{ marginTop: 12, padding: "8px 28px" }}>Skip →</button>
      </div>)}

      {/* Current Exercise */}
      {!resting && currentEx && (<div className="gs fade-in" style={{ border: `1px solid ${phaseColor[phase]}20` }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: `${phaseColor[phase]}15`, color: phaseColor[phase], fontWeight: 700, fontFamily: "Rajdhani,sans-serif" }}>{phaseLabel[phase]}</span>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: "rgba(255,255,255,.03)", color: "#6b7280" }}>{currentIdx + 1}/{currentExercises.length}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div className={`anim-figure anim-${currentEx.anim || "push"}`}>{ANIM_ICONS[currentEx.anim] || "💪"}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>{currentEx.name}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{currentEx.sets}×{currentEx.reps} {currentEx.muscle ? `· ${currentEx.muscle}` : ""} · ~{currentEx.cal}cal</div>
          </div>
        </div>

        {/* Set Tracker */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1, marginBottom: 8 }}>
            SETS · {Array.from({ length: currentEx.sets || 1 }, (_, i) => isSetDone(currentIdx, i)).filter(Boolean).length}/{currentEx.sets || 1}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Array.from({ length: currentEx.sets || 1 }, (_, setIdx) => {
              const done = isSetDone(currentIdx, setIdx);
              return (<div key={setIdx} style={{ flex: "1 1 0", minWidth: 55 }}>
                <div onClick={() => { if (!done) { if (currentEx.timed && !exTimerRunning && exTimer === 0) { setExTimer(currentEx.reps); setExTimerRunning(true) } else if (!currentEx.timed) { completeSet(currentIdx, setIdx) } } }}
                  style={{ padding: "10px 6px", borderRadius: 10, textAlign: "center", cursor: done ? "default" : "pointer", background: done ? `${phaseColor[phase]}12` : "rgba(255,255,255,.02)", border: done ? `1px solid ${phaseColor[phase]}30` : "1px solid rgba(255,255,255,.04)", transition: "all .2s" }}>
                  <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "Rajdhani,sans-serif" }}>SET {setIdx + 1}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: done ? "#22c55e" : "#e5e7eb", fontFamily: "Rajdhani,sans-serif" }}>{done ? "✓" : currentEx.timed ? `${currentEx.reps}s` : `×${currentEx.reps}`}</div>
                </div>
              </div>);
            })}
          </div>
        </div>

        {/* Exercise Timer */}
        {currentEx.timed && exTimerRunning && (<div style={{ textAlign: "center", marginBottom: 14, padding: 14, background: `${phaseColor[phase]}08`, borderRadius: 10, border: `1px solid ${phaseColor[phase]}15` }}>
          <div style={{ fontSize: 11, color: phaseColor[phase], fontFamily: "Rajdhani,sans-serif", letterSpacing: 2 }}>HOLD</div>
          <div style={{ fontSize: 44, fontWeight: 900, color: exTimer <= 5 ? "#ef4444" : phaseColor[phase], fontFamily: "Rajdhani,sans-serif", lineHeight: 1, transition: "color .3s" }}>{exTimer}</div>
        </div>)}

        {/* Auto-complete timed set */}
        {currentEx.timed && !exTimerRunning && exTimer === 0 && (() => {
          const nextSet = Array.from({ length: currentEx.sets || 1 }, (_, i) => i).find(i => !isSetDone(currentIdx, i));
          if (nextSet !== undefined && !isSetDone(currentIdx, nextSet)) {
            const anyDone = Object.keys(completedSets).some(k => k.startsWith(`${phase}_${currentIdx}_`));
            if (anyDone) setTimeout(() => completeSet(currentIdx, nextSet), 200);
          }
          return null;
        })()}

        {/* Instructions */}
        {currentEx.steps && (<div style={{ marginTop: 12, padding: 12, background: "rgba(0,0,0,.2)", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: phaseColor[phase], fontFamily: "Rajdhani,sans-serif", letterSpacing: 1, marginBottom: 6 }}>HOW TO</div>
          {currentEx.steps.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#d1d5db", marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${phaseColor[phase]}20` }}>{s}</div>)}
          {currentEx.tips && currentEx.tips.map((t, i) => <div key={i} style={{ fontSize: 12, color: "#6b7280", marginTop: 4, paddingLeft: 8 }}>💡 {t}</div>)}
        </div>)}
      </div>)}
    </div>);
  }

  // ═══ WORKOUT PLAN (Home) ═══
  return (<div>
    {/* Today's Smart Workout */}
    <div className="gs" style={{ marginBottom: 20, border: "1px solid rgba(16,185,129,.12)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#10b981,#06b6d4)" }} />
      <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 2, marginBottom: 4 }}>TODAY'S WORKOUT</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>{todaysWorkout.splitName}</div>

      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        {[["⏱", `~${todaysWorkout.estTime} min`, "Time"], ["🔥", `~${todaysWorkout.estCal}`, "Calories"], ["💪", todaysWorkout.exercises.length, "Exercises"], ["⚔️", todaysWorkout.fighting.length, "Combat"]].map(([icon, val, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(255,255,255,.03)", borderRadius: 8, fontSize: 12 }}>
            <span>{icon}</span><span style={{ color: "#e5e7eb", fontWeight: 600 }}>{val}</span><span style={{ color: "#6b7280" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Body parts */}
      <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
        {todaysWorkout.bodyParts.map(p => <span key={p} className="chip chip-a" style={{ textTransform: "capitalize" }}>{p}</span>)}
        <span className="chip chip-i">{todaysWorkout.equipment === "gym" ? "🏋️ Gym" : "🤸 Bodyweight"}</span>
        <span className="chip chip-i">{todaysWorkout.level}</span>
      </div>

      <button className="bp" onClick={startWorkout} style={{ width: "100%", marginTop: 16, padding: 16, fontSize: 16, letterSpacing: 2 }}>⚔️ START WORKOUT</button>
    </div>

    {/* Preview exercises */}
    <div className="gs" style={{ marginBottom: 16 }}>
      <div className="sl" style={{ color: "#10b981" }}>💪 Exercises ({todaysWorkout.exercises.length})</div>
      {todaysWorkout.exercises.map((e, i) => (
        <div key={i} className="ex-card" onClick={() => setExpandedEx(expandedEx === `m${i}` ? null : `m${i}`)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className={`anim-figure anim-${e.anim || "push"}`} style={{ width: 36, height: 36, fontSize: 18, borderRadius: 8 }}>{ANIM_ICONS[e.anim] || "💪"}</div>
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{e.sets}×{e.reps} · {e.muscle} · ~{e.cal}cal</div></div>
            </div>
            <span style={{ color: "#4b5563", fontSize: 14 }}>{expandedEx === `m${i}` ? "▾" : "▸"}</span>
          </div>
          {expandedEx === `m${i}` && <ExerciseDetail ex={e} color="#10b981" showComplete={false} />}
        </div>
      ))}
    </div>

    {todaysWorkout.fighting.length > 0 && (
      <div className="gs" style={{ marginBottom: 16 }}>
        <div className="sl" style={{ color: "#a78bfa" }}>⚔️ Combat ({todaysWorkout.fighting.length})</div>
        {todaysWorkout.fighting.map((e, i) => (
          <div key={i} className="ex-card" onClick={() => setExpandedEx(expandedEx === `f${i}` ? null : `f${i}`)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{e.sets}×{e.reps} · ~{e.cal}cal</div></div>
              <span style={{ color: "#4b5563", fontSize: 14 }}>{expandedEx === `f${i}` ? "▾" : "▸"}</span>
            </div>
            {expandedEx === `f${i}` && <ExerciseDetail ex={e} color="#a78bfa" showComplete={false} />}
          </div>
        ))}
      </div>
    )}

    {/* Rest Preference */}
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 14 }}>
      <span style={{ fontSize: 11, color: "#6b7280" }}>Rest between sets:</span>
      {REST_OPTIONS.map(r => <span key={r} className={`chip ${restDuration === r ? "chip-a" : "chip-i"}`} onClick={() => setRestDuration(r)} style={{ padding: "4px 10px", fontSize: 11 }}>{r}s</span>)}
    </div>

    {/* Gate Training (legacy) */}
    <div className="gs">
      <div onClick={() => setMode(mode === "gates" ? "plan" : "gates")} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
        <div className="sl" style={{ margin: 0 }}>Gate Training (Progression System)</div>
        <span style={{ color: "#6b7280", fontSize: 14 }}>{mode === "gates" ? "▾" : "▸"}</span>
      </div>
      {mode === "gates" && (<div className="fade-in" style={{ marginTop: 12 }}>
        {GATES.map(g => {
          const unlocked = lv >= g.unlock; return (
            <div key={g.gate} className={`${unlocked ? "" : "gate-locked"}`} style={{ marginBottom: 10, padding: 12, borderRadius: 10, background: "rgba(255,255,255,.02)", border: `1px solid ${unlocked ? g.color + "15" : "rgba(255,255,255,.03)"}`, cursor: unlocked ? "pointer" : "default" }} onClick={() => unlocked && setActiveGate(activeGate === g.gate ? null : g.gate)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "Rajdhani,sans-serif", fontWeight: 800, fontSize: 16, color: unlocked ? g.color : "#4b5563" }}>G{g.gate}</span>
                  <div><div style={{ fontWeight: 600, fontSize: 14, color: unlocked ? g.color : "#4b5563" }}>{g.name}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{unlocked ? `${g.exercises.length + g.combat.length} drills` : `🔒 Lv.${g.unlock}`}</div></div>
                </div>
                {unlocked && <span style={{ color: g.color, fontSize: 14 }}>{activeGate === g.gate ? "▾" : "▸"}</span>}
              </div>
              {activeGate === g.gate && unlocked && <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>Gate training is available via the full gate system. These exercises are also included in your smart daily workouts based on your level.</div>}
            </div>
          )
        })}
      </div>)}
    </div>
  </div>);
}