import { useState, useEffect, useRef, useMemo } from 'react';
import { getLevel, today } from '../utils';
import { XP } from '../data';
import { generateWorkout, ACTIVITY_TYPES, BODY_PARTS, TIME_OPTIONS, RUNNING, YOGA, HIIT, FIGHTING } from '../data/exercises';
import ExerciseGuideCard from './ExerciseGuideCard';
import MasteryPanel from './MasteryPanel';
import ExerciseAnimation3D from './ExerciseAnimation3D';
import HistoryPanel from './HistoryPanel';
import { formatTrainingHistory } from '../historyFormatters';
import { MASTERY_LEVELS } from '../data/exerciseGuides';
import { getTodayPlan } from '../data/weeklyPlan';

const REST_OPTIONS = [15, 30, 45, 60, 90];
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

let _session = null;

// ── BODY PART VISUAL DATA ──
const BODY_PART_DATA = [
  { id: "chest", label: "Chest", icon: "🫁", color: "#ef4444" },
  { id: "back", label: "Back", icon: "🔙", color: "#3b82f6" },
  { id: "shoulders", label: "Shoulders", icon: "🔱", color: "#f59e0b" },
  { id: "arms", label: "Arms", icon: "💪", color: "#8b5cf6" },
  { id: "legs", label: "Legs", icon: "🦵", color: "#22c55e" },
  { id: "core", label: "Core", icon: "🎯", color: "#06b6d4" },
  { id: "full", label: "Full Body", icon: "⚡", color: "#10b981" },
];

// ── ACTIVITY CARDS ──
const ACTIVITIES = [
  { id: "bodyweight", label: "Bodyweight", icon: "💪", color: "#10b981", desc: "No equipment" },
  { id: "gym", label: "Gym", icon: "🏋️", color: "#3b82f6", desc: "With weights" },
  { id: "boxing", label: "Boxing", icon: "🥊", color: "#ef4444", desc: "Striking" },
  { id: "kickboxing", label: "Kickboxing", icon: "🦶", color: "#f97316", desc: "Kick + Punch" },
  { id: "mma", label: "MMA", icon: "🤼", color: "#8b5cf6", desc: "Mixed martial arts" },
  { id: "yoga", label: "Yoga", icon: "🧘", color: "#a78bfa", desc: "Flexibility" },
  { id: "hiit", label: "HIIT", icon: "🔥", color: "#f59e0b", desc: "High intensity" },
  { id: "running", label: "Running", icon: "🏃", color: "#06b6d4", desc: "Cardio" },
  { id: "martial_arts", label: "Martial Arts", icon: "🥋", color: "#ec4899", desc: "Traditional" },
];

export default function TrainingPage({ totalXP, addXP, workoutLog, setWorkoutLog, profile, masteryData, setMasteryData }) {
  const d = today(), todayW = workoutLog[d];

  const [activity, setActivity] = useState(_session?.activity || profile.trainingType || "bodyweight");
  const [selectedParts, setSelectedParts] = useState(_session?.selectedParts || ["full"]);
  const [duration, setDuration] = useState(_session?.duration || parseInt(profile.dailyTime) || 30);
  const [workout, setWorkout] = useState(_session?.workout || null);
  const [mode, setMode] = useState(_session?.mode || (todayW ? "done" : "config"));
  const [currentIdx, setCurrentIdx] = useState(_session?.currentIdx || 0);
  const [completedEx, setCompletedEx] = useState(_session?.completedEx || []);
  const [calBurned, setCalBurned] = useState(_session?.calBurned || 0);
  const [expandedEx, setExpandedEx] = useState(null);
  const [tab, setTab] = useState("workout");
  const [showGuide, setShowGuide] = useState(false);

  // Timers
  const [sessionStartTime, setSessionStartTime] = useState(_session?.sessionStartTime || null);
  const [pausedElapsed, setPausedElapsed] = useState(_session?.pausedElapsed || 0);
  const [running, setRunning] = useState(_session?.running || false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [restEndTime, setRestEndTime] = useState(null);
  const [restDur, setRestDur] = useState(30);
  const [resting, setResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);

  // Photo
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState(null);
  const videoRef = useRef(null), canvasRef = useRef(null), streamRef = useRef(null);
  const tickRef = useRef(null);

  // Weekly plan
  const weekPlan = useMemo(() => getTodayPlan(profile.goal, activity), [profile.goal, activity]);

  // Cache session
  useEffect(() => {
    _session = { activity, selectedParts, duration, workout, mode, currentIdx, completedEx, calBurned, running, sessionStartTime, pausedElapsed };
  }, [activity, selectedParts, duration, workout, mode, currentIdx, completedEx, calBurned, running, sessionStartTime, pausedElapsed]);

  // Timer tick
  useEffect(() => {
    tickRef.current = setInterval(() => {
      if (running && sessionStartTime) setSessionTimer(pausedElapsed + Math.floor((Date.now() - sessionStartTime) / 1000));
      if (resting && restEndTime) { const r = Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000)); setRestRemaining(r); if (r <= 0) setResting(false); }
    }, 500);
    return () => clearInterval(tickRef.current);
  }, [running, sessionStartTime, pausedElapsed, resting, restEndTime]);

  // Visibility change
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible") { if (running && sessionStartTime) setSessionTimer(pausedElapsed + Math.floor((Date.now() - sessionStartTime) / 1000)); if (resting && restEndTime) { const r = Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000)); setRestRemaining(r); if (r <= 0) setResting(false); } } };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [running, sessionStartTime, pausedElapsed, resting, restEndTime]);

  // Toggle body part (multi-select)
  const togglePart = (id) => {
    if (id === "full") { setSelectedParts(["full"]); return; }
    setSelectedParts(prev => {
      let next = prev.filter(p => p !== "full");
      if (next.includes(id)) next = next.filter(p => p !== id);
      else next = [...next, id];
      return next.length === 0 ? ["full"] : next;
    });
  };

  // Generate workout
  const generateDaily = () => {
    const focus = selectedParts.includes("full") ? "full" : selectedParts[0];
    const config = { ...profile, trainingType: activity, dailyTime: String(duration), focusAreas: selectedParts };
    let w = generateWorkout(config);
    if (activity === "running") { w.exercises = (RUNNING[profile.fitnessLevel === "beginner" ? "easy" : "moderate"] || RUNNING.easy).slice(0, Math.max(1, Math.floor(duration / 15))); w.fighting = []; w.splitName = "Running Session"; }
    else if (activity === "yoga") { w.exercises = [...YOGA].sort(() => Math.random() - .5).slice(0, Math.max(3, Math.floor(duration / 5))); w.fighting = []; w.splitName = "Yoga Flow"; }
    else if (activity === "hiit") { w.exercises = [...HIIT].sort(() => Math.random() - .5).slice(0, Math.max(2, Math.floor(duration / 8))); w.fighting = []; w.splitName = "HIIT Burn"; }
    else if (["boxing", "kickboxing", "mma", "martial_arts"].includes(activity)) { w.fighting = [...(FIGHTING[activity] || [])].sort(() => Math.random() - .5).slice(0, Math.max(3, Math.floor(duration / 5))); w.splitName = `${ACTIVITIES.find(a => a.id === activity)?.label} Training`; }
    w.estTime = duration;
    w.allExercises = [...w.warmup.map(e => ({ ...e, phase: "warmup" })), ...w.exercises.map(e => ({ ...e, phase: "main" })), ...w.fighting.map(e => ({ ...e, phase: "combat" })), ...w.cooldown.map(e => ({ ...e, phase: "cooldown" }))];
    setWorkout(w); setMode("preview");
  };

  const startSession = () => { setMode("session"); setCurrentIdx(0); setCompletedEx([]); setCalBurned(0); setSessionStartTime(Date.now()); setPausedElapsed(0); setRunning(true); setSessionTimer(0); setShowGuide(false); };

  const completeExercise = (idx) => {
    if (completedEx.includes(idx)) return;
    const ex = workout.allExercises[idx];
    const nc = [...completedEx, idx];
    setCompletedEx(nc);
    setCalBurned(c => c + (ex.cal || 3) * (ex.sets || 1));
    setShowGuide(false);
    if (nc.length >= workout.allExercises.length) { requestPhoto(); }
    else { const next = workout.allExercises.findIndex((_, i) => !nc.includes(i) && i > idx); if (next >= 0) { if (ex.phase === "main" || ex.phase === "combat") { setResting(true); setRestEndTime(Date.now() + restDur * 1000); setRestRemaining(restDur); } setCurrentIdx(next); } else { requestPhoto(); } }
  };

  const skipRest = () => { setResting(false); setRestEndTime(null); setRestRemaining(0); };
  const swapExercise = (idx) => { if (!workout) return; const ex = workout.allExercises[idx]; const pool = workout.exercises.filter(e => e.name !== ex.name); if (pool.length === 0) return; const na = [...workout.allExercises]; na[idx] = { ...pool[Math.floor(Math.random() * pool.length)], phase: ex.phase }; setWorkout(w => ({ ...w, allExercises: na })); };

  // Photo
  const requestPhoto = () => { setRunning(false); setPausedElapsed(sessionTimer); setShowCamera(true); startCam(); };
  const updateMastery = () => { if (!MASTERY_LEVELS[activity]) return; const data = masteryData || {}; const a = data[activity] || { level: 1, sessions: 0, history: [] }; const prog = MASTERY_LEVELS[activity]; const cur = prog.levels.find(l => l.level === a.level) || prog.levels[0]; let ns = a.sessions + 1, nl = a.level; if (ns >= cur.sessionsNeeded) { const next = prog.levels.find(l => l.level === a.level + 1); if (next) { nl = next.level; ns = 0; } } setMasteryData({ ...data, [activity]: { level: nl, sessions: ns, history: [...a.history, { date: d, level: nl }] } }); };

  const finishWorkout = (proofPhoto) => {
    setMode("done"); _session = null;
    addXP(XP.workout + (workout.fighting.length > 0 ? workout.fighting.length * XP.combat : 0), "Training complete");
    updateMastery();
    setWorkoutLog(p => ({ ...p, [d]: { type: "smart", splitName: workout.splitName, calBurned, duration: sessionTimer, exerciseCount: workout.exercises.length + workout.fighting.length, activity, focus: selectedParts.join(","), completedAt: new Date().toLocaleTimeString(), exercises: workout.exercises.map(e => e.name), fighting: workout.fighting.map(e => e.name), photo: proofPhoto || null, verified: !!proofPhoto } }));
  };

  const startCam = async () => { try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 480 } } }); streamRef.current = s; if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); } } catch { finishWorkout(null); } };
  const stopCam = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } };
  const capture = () => { if (!videoRef.current || !canvasRef.current) return; const c = canvasRef.current, v = videoRef.current; c.width = 240; c.height = 240; const ctx = c.getContext("2d"); const sz = Math.min(v.videoWidth, v.videoHeight); ctx.drawImage(v, (v.videoWidth - sz) / 2, (v.videoHeight - sz) / 2, sz, sz, 0, 0, 240, 240); ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(0, 215, 240, 25); ctx.fillStyle = "#10b981"; ctx.font = "bold 10px sans-serif"; ctx.fillText(`IGNITE · ${new Date().toLocaleDateString()} · ${fmt(sessionTimer)}`, 6, 232); setPhoto(c.toDataURL("image/jpeg", .6)); stopCam(); };
  const confirmPhoto = () => { setShowCamera(false); finishWorkout(photo); setPhoto(null); };
  const skipPhoto = () => { stopCam(); setShowCamera(false); finishWorkout(null); setPhoto(null); };
  useEffect(() => () => stopCam(), []);

  const pc = { warmup: "#f59e0b", main: "#10b981", combat: "#a78bfa", cooldown: "#06b6d4" };
  const pi = { warmup: "🔥", main: "💪", combat: "⚔️", cooldown: "🧘" };
  const actColor = ACTIVITIES.find(a => a.id === activity)?.color || "#10b981";

  // ══════════════════════════
  // PHOTO SCREEN
  // ══════════════════════════
  if (showCamera) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#060a0c", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 16 }}>Victory Photo 📸</div>
      {!photo ? (<div style={{ width: "100%", maxWidth: 300 }}><div style={{ width: "100%", aspectRatio: "1", borderRadius: 16, overflow: "hidden", border: "2px solid rgba(16,185,129,.3)", marginBottom: 16, background: "#111" }}><video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} /></div><canvas ref={canvasRef} style={{ display: "none" }} /><button className="bp" onClick={capture} style={{ width: "100%", padding: 16, fontSize: 18 }}>📸 CAPTURE</button><button onClick={skipPhoto} style={{ width: "100%", marginTop: 10, padding: 10, background: "transparent", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, color: "#6b7280", fontSize: 12, cursor: "pointer" }}>Skip Photo</button></div>) : (<div style={{ width: "100%", maxWidth: 300 }}><div style={{ width: "100%", aspectRatio: "1", borderRadius: 16, overflow: "hidden", border: "2px solid rgba(16,185,129,.3)", marginBottom: 16 }}><img src={photo} alt="proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div><div style={{ display: "flex", gap: 10 }}><button className="bp" onClick={confirmPhoto} style={{ flex: 1, padding: 14 }}>✓ Use</button><button className="bg" onClick={() => { setPhoto(null); startCam(); }} style={{ flex: 1, padding: 14 }}>🔄 Retake</button></div></div>)}
    </div>
  );

  // ══════════════════════════
  // COMPLETE SCREEN
  // ══════════════════════════
  if (mode === "done" || mode === "complete") {
    const wData = workoutLog[d];
    return (
      <div className="fade-in" style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
        <h2 style={{ fontFamily: "Rajdhani,sans-serif", fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>TRAINING COMPLETE</h2>
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>{wData?.splitName || workout?.splitName}</div>
        {wData?.verified && <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, padding: "3px 10px", borderRadius: 100, background: "rgba(34,197,94,.1)", color: "#22c55e" }}>✓ Verified</span>}
        {wData?.photo && <div style={{ width: 100, height: 100, borderRadius: 12, overflow: "hidden", margin: "12px auto" }}><img src={wData.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginTop: 16, maxWidth: 320, margin: "16px auto" }}>
          {[["⏱", fmt(wData?.duration || sessionTimer), "Duration"], ["🔥", wData?.calBurned || calBurned, "Calories"], ["💪", wData?.exerciseCount || 0, "Exercises"], ["⚡", `+${XP.workout}`, "XP"]].map(([ic, val, lb]) => (
            <div key={lb} className="gs" style={{ padding: 14 }}><div style={{ fontSize: 18 }}>{ic}</div><div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{val}</div><div style={{ fontSize: 10, color: "#6b7280" }}>{lb}</div></div>
          ))}
        </div>
        <button className="bp" onClick={() => { setMode("config"); _session = null; }} style={{ marginTop: 16, padding: "14px 40px" }}>DONE</button>
        <div style={{ marginTop: 20 }}><HistoryPanel entries={formatTrainingHistory(workoutLog)} title="Past Workouts" emptyText="No history" /></div>
      </div>
    );
  }

  // ══════════════════════════
  // SESSION (Home Workout Style)
  // ══════════════════════════
  if (mode === "session" && workout) {
    const ex = workout.allExercises[currentIdx];
    if (!ex) return <div>Loading...</div>;
    const pct = Math.round((completedEx.length / workout.allExercises.length) * 100);
    const nextEx = workout.allExercises.find((_, i) => !completedEx.includes(i) && i > currentIdx);

    return (
      <div>
        {/* Progress bar */}
        <div style={{ height: 4, background: "rgba(255,255,255,.04)", borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${actColor},#06b6d4)`, borderRadius: 2, transition: "width .5s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{completedEx.length}/{workout.allExercises.length} exercises</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: actColor, fontFamily: "Rajdhani,sans-serif", fontVariantNumeric: "tabular-nums" }}>{fmt(sessionTimer)}</span>
        </div>

        {/* REST SCREEN */}
        {resting && (
          <div className="fade-in" style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 14, color: "#6b7280", letterSpacing: 3, marginBottom: 12 }}>REST</div>
            <div style={{ fontSize: 72, fontWeight: 900, color: actColor, fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{restRemaining}</div>
            <div style={{ fontSize: 12, color: "#4b5563", marginTop: 8 }}>seconds</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}>
              {REST_OPTIONS.map(r => <span key={r} className={`chip ${restDur === r ? "chip-a" : "chip-i"}`} onClick={() => { setRestDur(r); setRestEndTime(Date.now() + r * 1000); setRestRemaining(r); }} style={{ fontSize: 12 }}>{r}s</span>)}
            </div>
            {nextEx && <div style={{ marginTop: 24, padding: 14, background: "rgba(255,255,255,.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,.04)" }}><div style={{ fontSize: 11, color: "#4b5563" }}>NEXT UP</div><div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", marginTop: 4 }}>{nextEx.name}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{nextEx.sets || 1}×{nextEx.reps}</div></div>}
            <button className="bp" onClick={skipRest} style={{ marginTop: 16, padding: "12px 32px" }}>Skip Rest →</button>
          </div>
        )}

        {/* EXERCISE SCREEN */}
        {!resting && (
          <div className="fade-in">
            {/* Phase tag */}
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, padding: "3px 12px", borderRadius: 100, background: `${pc[ex.phase]}15`, color: pc[ex.phase], fontWeight: 700 }}>{pi[ex.phase]} {ex.phase.toUpperCase()}</span>
            </div>

            {/* EXERCISE ANIMATION — like home workout app */}
            <div style={{ marginBottom: 16 }}>
              <ExerciseAnimation3D exerciseName={ex.name} color={actColor} size={220} />
            </div>

            {/* Exercise name + info */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>{ex.name}</div>
              <div style={{ fontSize: 22, color: actColor, fontWeight: 800, fontFamily: "Rajdhani,sans-serif", marginTop: 6 }}>
                {ex.timed ? `${ex.reps} seconds` : `${ex.sets || 1} × ${ex.reps}`}
              </div>
              {ex.muscle && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{ex.muscle}</div>}
            </div>

            {/* How to do it button */}
            <div onClick={() => setShowGuide(!showGuide)} style={{ cursor: "pointer", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: "#10b981", fontWeight: 600 }}>📖 How to do this exercise</span>
              <span style={{ color: "#4b5563" }}>{showGuide ? "▾" : "▸"}</span>
            </div>

            {showGuide && (
              <div className="fade-in" style={{ marginBottom: 14 }}>
                <ExerciseGuideCard exerciseName={ex.name} color={actColor} expanded={true} onToggle={() => setShowGuide(false)} />
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button className="bp" onClick={() => completeExercise(currentIdx)} disabled={completedEx.includes(currentIdx)}
                style={{ flex: 1, padding: 18, fontSize: 18, letterSpacing: 1, background: completedEx.includes(currentIdx) ? "rgba(34,197,94,.1)" : undefined, color: completedEx.includes(currentIdx) ? "#22c55e" : undefined }}>
                {completedEx.includes(currentIdx) ? "✓ DONE" : "✓ COMPLETE"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="bg" onClick={() => { const next = workout.allExercises.findIndex((_, i) => !completedEx.includes(i) && i > currentIdx); if (next >= 0) { setCurrentIdx(next); setShowGuide(false); } }} style={{ flex: 1, padding: 12, fontSize: 13 }}>Skip Exercise</button>
              {ex.phase === "main" && <button className="bg" onClick={() => swapExercise(currentIdx)} style={{ flex: 1, padding: 12, fontSize: 13 }}>🔄 Swap Exercise</button>}
            </div>

            {/* Exercise dots navigation */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginTop: 16, padding: "12px 0", borderTop: "1px solid rgba(255,255,255,.04)" }}>
              {workout.allExercises.map((e, i) => (
                <div key={i} onClick={() => { if (!completedEx.includes(i)) { setCurrentIdx(i); setShowGuide(false); } }}
                  style={{
                    width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, cursor: "pointer",
                    background: completedEx.includes(i) ? `${pc[e.phase]}20` : i === currentIdx ? `${pc[ex.phase]}12` : "rgba(255,255,255,.03)",
                    border: i === currentIdx ? `2px solid ${pc[ex.phase]}` : "1px solid rgba(255,255,255,.06)",
                    color: completedEx.includes(i) ? pc[e.phase] : "#4b5563"
                  }}>
                  {completedEx.includes(i) ? "✓" : i + 1}
                </div>
              ))}
            </div>

            {/* End early */}
            <button onClick={requestPhoto} style={{ width: "100%", marginTop: 12, padding: 10, background: "transparent", border: "1px solid rgba(239,68,68,.12)", borderRadius: 8, color: "#ef4444", fontSize: 12, cursor: "pointer" }}>End Session Early</button>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════
  // PREVIEW (exercise list)
  // ══════════════════════════
  if (mode === "preview" && workout) {
    return (
      <div>
        <div className="gs" style={{ marginBottom: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${actColor},#06b6d4)` }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 2 }}>YOUR WORKOUT</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{workout.splitName}</div>
            </div>
            <button className="bg" onClick={() => { setMode("config"); setWorkout(null); }}>← Change</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", fontSize: 12, color: "#d1d5db" }}>
            <span>⏱ ~{workout.estTime}min</span><span>💪 {workout.exercises.length} exercises</span>
            {workout.fighting.length > 0 && <span>⚔️ {workout.fighting.length} combat</span>}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Rest:</span>
            {REST_OPTIONS.map(r => <span key={r} className={`chip ${restDur === r ? "chip-a" : "chip-i"}`} onClick={() => setRestDur(r)} style={{ padding: "4px 10px", fontSize: 11 }}>{r}s</span>)}
          </div>
          <button className="bp" onClick={startSession} style={{ width: "100%", marginTop: 14, padding: 16, fontSize: 16, letterSpacing: 2, background: `linear-gradient(135deg,${actColor},#06b6d4)` }}>⚔️ START WORKOUT</button>
        </div>

        {/* Exercise list — home workout app style */}
        {[["🔥 Warm-up", workout.warmup, "#f59e0b"], ["💪 Exercises", workout.exercises, "#10b981"], ["⚔️ Combat", workout.fighting, "#a78bfa"], ["🧘 Cool-down", workout.cooldown, "#06b6d4"]].map(([label, list, color]) =>
          list.length > 0 && (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 8, fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>{label} ({list.length})</div>
              {list.map((e, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div onClick={() => setExpandedEx(expandedEx === `${label}${i}` ? null : `${label}${i}`)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: expandedEx === `${label}${i}` ? "12px 12px 0 0" : 12, background: "rgba(255,255,255,.02)", border: `1px solid ${expandedEx === `${label}${i}` ? color + "30" : "rgba(255,255,255,.04)"}`, cursor: "pointer", transition: "all .2s" }}>
                    <div style={{ width: 50, height: 50, borderRadius: 10, background: `${color}08`, border: `1px solid ${color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                      <ExerciseAnimation3D exerciseName={e.name} color={color} size={50} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#f3f4f6" }}>{e.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{e.sets || 1}×{e.reps} {e.muscle ? `· ${e.muscle}` : ""}</div>
                    </div>
                    <span style={{ color: "#4b5563", fontSize: 14 }}>{expandedEx === `${label}${i}` ? "▾" : "▸"}</span>
                  </div>
                  {expandedEx === `${label}${i}` && (
                    <div className="fade-in" style={{ padding: 16, background: "rgba(255,255,255,.01)", border: `1px solid ${color}20`, borderTop: "none", borderRadius: "0 0 12px 12px" }}>
                      <ExerciseAnimation3D exerciseName={e.name} color={color} size={200} />
                      <div style={{ marginTop: 12 }}>
                        <ExerciseGuideCard exerciseName={e.name} color={color} expanded={true} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    );
  }

  // ══════════════════════════
  // CONFIG SCREEN (Home Workout App Style)
  // ══════════════════════════
  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
        {[["workout", "⚔️ Workout"], ["history", "📅 History"]].map(([k, l]) => <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ padding: "8px 16px" }}>{l}</span>)}
      </div>

      {tab === "history" && <HistoryPanel entries={formatTrainingHistory(workoutLog)} title="Training History" emptyText="Complete your first workout" />}

      {tab === "workout" && (
        <div>
          {/* Already done today */}
          {todayW && mode !== "config2" && (
            <div className="gs" style={{ textAlign: "center", marginBottom: 16, border: "1px solid rgba(34,197,94,.2)" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
              <div style={{ fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 18, color: "#22c55e", letterSpacing: 1 }}>TRAINING COMPLETE</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{todayW.splitName} · {todayW.calBurned}cal · {fmt(todayW.duration)}</div>
              <button className="bg" onClick={() => setMode("config2")} style={{ marginTop: 12 }}>Train Again</button>
            </div>
          )}

          {(!todayW || mode === "config2") && (
            <div>
              {/* Weekly plan suggestion */}
              {weekPlan.today && weekPlan.today.focus !== "rest" && (
                <div className="gs fade-in" style={{ marginBottom: 16, border: `1px solid ${actColor}15`, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 28 }}>{weekPlan.today.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>TODAY'S PLAN · {weekPlan.dayName.toUpperCase()}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: actColor, fontFamily: "Rajdhani,sans-serif" }}>{weekPlan.today.label}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{weekPlan.plan.name} program</div>
                    </div>
                    <button className="bp" onClick={() => { if (weekPlan.today.focus !== "rest") { const parts = weekPlan.today.muscles.length > 0 ? weekPlan.today.muscles.map(m => m.toLowerCase().replace(/ /g, "")) : ["full"]; setSelectedParts(parts.map(p => BODY_PART_DATA.find(b => b.id === p || b.label.toLowerCase() === p)?.id || "full")); generateDaily(); } }} style={{ padding: "10px 18px", fontSize: 13, background: `linear-gradient(135deg,${actColor},#06b6d4)` }}>
                      Quick Start
                    </button>
                  </div>
                </div>
              )}

              {/* Mastery Panel */}
              <MasteryPanel activity={activity} masteryData={masteryData} setMasteryData={setMasteryData} />

              {/* 1. Activity Type — horizontal scroll */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 10, fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>CHOOSE ACTIVITY</div>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
                  {ACTIVITIES.map(a => (
                    <div key={a.id} onClick={() => setActivity(a.id)}
                      style={{
                        minWidth: 90, padding: "14px 12px", borderRadius: 14, textAlign: "center", cursor: "pointer", flexShrink: 0, transition: "all .2s",
                        background: activity === a.id ? `${a.color}12` : "rgba(255,255,255,.02)",
                        border: activity === a.id ? `2px solid ${a.color}40` : "1px solid rgba(255,255,255,.04)",
                        transform: activity === a.id ? "scale(1.05)" : "scale(1)"
                      }}>
                      <div style={{ fontSize: 28, marginBottom: 4 }}>{a.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: activity === a.id ? a.color : "#e5e7eb" }}>{a.label}</div>
                      <div style={{ fontSize: 9, color: "#4b5563", marginTop: 2 }}>{a.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Body Parts — multi-select grid */}
              {["bodyweight", "gym"].includes(activity) && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 10, fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>SELECT BODY PARTS <span style={{ fontWeight: 400, letterSpacing: 0 }}>(tap multiple)</span></div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                    {BODY_PART_DATA.map(bp => {
                      const sel = selectedParts.includes(bp.id);
                      return (
                        <div key={bp.id} onClick={() => togglePart(bp.id)}
                          style={{
                            padding: "14px 6px", borderRadius: 12, textAlign: "center", cursor: "pointer", transition: "all .2s",
                            background: sel ? `${bp.color}12` : "rgba(255,255,255,.02)",
                            border: sel ? `2px solid ${bp.color}40` : "1px solid rgba(255,255,255,.04)",
                            transform: sel ? "scale(1.05)" : "scale(1)"
                          }}>
                          <div style={{ fontSize: 22 }}>{bp.icon}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: sel ? bp.color : "#d1d5db", marginTop: 4 }}>{bp.label}</div>
                          {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: bp.color, margin: "4px auto 0" }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Duration */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 10, fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>DURATION</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[15, 30, 45, 60, 90].map(t => (
                    <div key={t} onClick={() => setDuration(t)}
                      style={{
                        flex: 1, padding: "14px 4px", borderRadius: 12, textAlign: "center", cursor: "pointer", transition: "all .2s",
                        background: duration === t ? `${actColor}12` : "rgba(255,255,255,.02)",
                        border: duration === t ? `2px solid ${actColor}40` : "1px solid rgba(255,255,255,.04)"
                      }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: duration === t ? actColor : "#e5e7eb", fontFamily: "Rajdhani,sans-serif" }}>{t}</div>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>min</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button className="bp" onClick={generateDaily}
                style={{ width: "100%", padding: 18, fontSize: 17, letterSpacing: 2, background: `linear-gradient(135deg,${actColor},#06b6d4)`, boxShadow: `0 4px 20px ${actColor}30` }}>
                ⚔️ GENERATE WORKOUT
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}