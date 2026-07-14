import { useState, useEffect, useRef, useMemo } from 'react';
import { getLevel, today } from '../utils';
import { XP } from '../data';
import { generateWorkout, ACTIVITY_TYPES, BODY_PARTS, TIME_OPTIONS, RUNNING, YOGA, HIIT, FIGHTING } from '../data/exercises';
import ExerciseDetail from './ExerciseDetail';
import HistoryPanel from './HistoryPanel';
import { formatTrainingHistory } from '../historyFormatters';

const REST_OPTIONS = [15, 30, 45, 60, 90];
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// ── Persist session across page switches ──
let _session = null;

export default function TrainingPage({ totalXP, addXP, workoutLog, setWorkoutLog, profile }) {
  const lv = getLevel(totalXP), d = today(), todayW = workoutLog[d];

  // Restore session from module-level cache
  const [dayActivity, setDayActivity] = useState(_session?.dayActivity || profile.trainingType || "bodyweight");
  const [dayFocus, setDayFocus] = useState(_session?.dayFocus || "full");
  const [dayTime, setDayTime] = useState(_session?.dayTime || parseInt(profile.dailyTime) || 45);
  const [workout, setWorkout] = useState(_session?.workout || null);
  const [mode, setMode] = useState(_session?.mode || (todayW ? "done" : "config"));
  const [currentIdx, setCurrentIdx] = useState(_session?.currentIdx || 0);
  const [completedEx, setCompletedEx] = useState(_session?.completedEx || []);
  const [sessionTimer, setSessionTimer] = useState(_session?.sessionTimer || 0);
  const [running, setRunning] = useState(_session?.running || false);
  const [resting, setResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [restDur, setRestDur] = useState(45);
  const [calBurned, setCalBurned] = useState(_session?.calBurned || 0);
  const [expandedEx, setExpandedEx] = useState(null);
  const [showVideo, setShowVideo] = useState(null);
  const [tab, setTab] = useState("workout"); // workout | history
  const timerRef = useRef(null), restRef = useRef(null);

  // Photo proof
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState(null);
  const videoRef = useRef(null), canvasRef = useRef(null), streamRef = useRef(null);

  // ── Save session to module cache on every state change ──
  useEffect(() => {
    _session = { dayActivity, dayFocus, dayTime, workout, mode, currentIdx, completedEx, sessionTimer, running, calBurned };
  }, [dayActivity, dayFocus, dayTime, workout, mode, currentIdx, completedEx, sessionTimer, running, calBurned]);

  // Timers
  useEffect(() => { if (running) { timerRef.current = setInterval(() => setSessionTimer(t => t + 1), 1000); return () => clearInterval(timerRef.current) } return () => clearInterval(timerRef.current) }, [running]);
  useEffect(() => { if (resting && restTime > 0) { restRef.current = setInterval(() => setRestTime(t => { if (t <= 1) { setResting(false); return 0 } return t - 1 }), 1000); return () => clearInterval(restRef.current) } return () => clearInterval(restRef.current) }, [resting, restTime]);

  // ── Smart suggestions from past workouts ──
  const suggestions = useMemo(() => {
    const logs = Object.values(workoutLog || {});
    const lastActivity = logs[logs.length - 1]?.activity;
    const lastFocus = logs[logs.length - 1]?.focus;
    const activityCounts = {};
    logs.forEach(w => { activityCounts[w.activity] = (activityCounts[w.activity] || 0) + 1 });
    const favorite = Object.entries(activityCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    // Suggest different body part than last time
    const focusSuggestion = lastFocus === "chest" ? "back" : lastFocus === "back" ? "legs" : lastFocus === "legs" ? "shoulders" : lastFocus === "shoulders" ? "arms" : lastFocus === "arms" ? "core" : "full";
    return { lastActivity, lastFocus, favorite, focusSuggestion, totalWorkouts: logs.length };
  }, [workoutLog]);

  // ── YouTube URL generator ──
  const getYouTubeURL = (name) => `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " exercise tutorial proper form")}`;

  const generateDaily = () => {
    const config = { ...profile, trainingType: dayActivity, dailyTime: String(dayTime), focusAreas: [dayFocus] };
    let w = generateWorkout(config);
    if (dayActivity === "running") { const pool = RUNNING[profile.fitnessLevel === "beginner" ? "easy" : "moderate"] || RUNNING.easy; w.exercises = pool.slice(0, Math.max(1, Math.floor(dayTime / 15))); w.fighting = []; w.splitName = "Running Session"; }
    else if (dayActivity === "yoga") { w.exercises = [...YOGA].sort(() => Math.random() - .5).slice(0, Math.max(3, Math.floor(dayTime / 5))); w.fighting = []; w.splitName = "Yoga & Flexibility"; }
    else if (dayActivity === "hiit") { w.exercises = [...HIIT].sort(() => Math.random() - .5).slice(0, Math.max(2, Math.floor(dayTime / 8))); w.fighting = []; w.splitName = "HIIT Session"; }
    else if (["boxing", "kickboxing", "mma", "martial_arts"].includes(dayActivity)) { const fp = FIGHTING[dayActivity] || []; w.fighting = [...fp].sort(() => Math.random() - .5).slice(0, Math.max(3, Math.floor(dayTime / 5))); w.splitName = `${ACTIVITY_TYPES.find(a => a.id === dayActivity)?.label} Training`; }
    w.estTime = dayTime;
    w.allExercises = [...w.warmup.map(e => ({ ...e, phase: "warmup" })), ...w.exercises.map(e => ({ ...e, phase: "main" })), ...w.fighting.map(e => ({ ...e, phase: "combat" })), ...w.cooldown.map(e => ({ ...e, phase: "cooldown" }))];
    setWorkout(w); setMode("preview");
  };

  const startSession = () => { setMode("session"); setCurrentIdx(0); setCompletedEx([]); setSessionTimer(0); setRunning(true); setCalBurned(0) };

  const completeExercise = (idx) => {
    if (completedEx.includes(idx)) return;
    const ex = workout.allExercises[idx];
    const nc = [...completedEx, idx];
    setCompletedEx(nc);
    setCalBurned(c => c + (ex.cal || 3) * (ex.sets || 1));
    if (nc.length >= workout.allExercises.length) { requestPhoto(nc.length) }
    else { const next = workout.allExercises.findIndex((_, i) => !nc.includes(i) && i > idx); if (next >= 0) { if (ex.phase === "main" || ex.phase === "combat") { setResting(true); setRestTime(restDur) } setCurrentIdx(next) } else { requestPhoto(nc.length) } }
  };

  const requestPhoto = (count) => { setRunning(false); setShowCamera(true); startCam() };
  const finishWorkout = (proofPhoto) => {
    setMode("done"); _session = null;
    addXP(XP.workout + (workout.fighting.length > 0 ? workout.fighting.length * XP.combat : 0), "Training complete");
    setWorkoutLog(p => ({ ...p, [d]: { type: "smart", splitName: workout.splitName, bodyParts: workout.bodyParts || [], calBurned, duration: sessionTimer, exerciseCount: workout.exercises.length + workout.fighting.length, activity: dayActivity, focus: dayFocus, completedAt: new Date().toLocaleTimeString(), exercises: workout.exercises.map(e => e.name), fighting: workout.fighting.map(e => e.name), photo: proofPhoto || null, verified: !!proofPhoto } }));
  };

  const swapExercise = (idx) => { if (!workout) return; const ex = workout.allExercises[idx]; const pool = workout.exercises.filter(e => e.name !== ex.name && e.bodyPart === ex.bodyPart); if (pool.length === 0) return; const rep = pool[Math.floor(Math.random() * pool.length)]; const na = [...workout.allExercises]; na[idx] = { ...rep, phase: ex.phase }; setWorkout(w => ({ ...w, allExercises: na })) };

  // Camera
  const startCam = async () => { try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 480 } } }); streamRef.current = s; if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play() } } catch (e) { finishWorkout(null) } };
  const stopCam = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null } };
  const capture = () => { if (!videoRef.current || !canvasRef.current) return; const c = canvasRef.current, v = videoRef.current; c.width = 240; c.height = 240; const ctx = c.getContext("2d"); const sz = Math.min(v.videoWidth, v.videoHeight); ctx.drawImage(v, (v.videoWidth - sz) / 2, (v.videoHeight - sz) / 2, sz, sz, 0, 0, 240, 240); ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 215, 240, 25); ctx.fillStyle = "#10b981"; ctx.font = "bold 10px Rajdhani,sans-serif"; ctx.fillText(`IGNITE · ${new Date().toLocaleDateString()} · ${fmt(sessionTimer)}`, 6, 232); const url = c.toDataURL("image/jpeg", .6); setPhoto(url); stopCam() };
  const confirmPhoto = () => { setShowCamera(false); finishWorkout(photo); setPhoto(null) };
  const skipPhoto = () => { stopCam(); setShowCamera(false); finishWorkout(null); setPhoto(null) };
  useEffect(() => () => stopCam(), []);

  const phaseColor = { warmup: "#f59e0b", main: "#10b981", combat: "#a78bfa", cooldown: "#06b6d4" };
  const phaseIcon = { warmup: "🔥", main: "💪", combat: "⚔️", cooldown: "🧘" };
  const diffLabel = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };
  const diffColor = { 1: "#22c55e", 2: "#f59e0b", 3: "#ef4444" };

  // ══ PHOTO MODAL ══
  if (showCamera) {
    return (<div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#060a0c", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 4 }}>Victory Photo 📸</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Show that post-workout energy!</div>
      {!photo ? (<div style={{ width: "100%", maxWidth: 300 }}><div style={{ width: "100%", aspectRatio: "1", borderRadius: 16, overflow: "hidden", border: "2px solid rgba(16,185,129,.3)", marginBottom: 16, background: "#111" }}><video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} /></div><canvas ref={canvasRef} style={{ display: "none" }} /><button className="bp" onClick={capture} style={{ width: "100%", padding: 16, fontSize: 18 }}>📸 CAPTURE</button><button onClick={skipPhoto} style={{ width: "100%", marginTop: 10, padding: 10, background: "transparent", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, color: "#6b7280", fontSize: 12, cursor: "pointer" }}>Skip photo</button></div>)
        : (<div style={{ width: "100%", maxWidth: 300 }}><div style={{ width: "100%", aspectRatio: "1", borderRadius: 16, overflow: "hidden", border: "2px solid rgba(16,185,129,.3)", marginBottom: 16 }}><img src={photo} alt="proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div><div style={{ display: "flex", gap: 10 }}><button className="bp" onClick={confirmPhoto} style={{ flex: 1, padding: 14 }}>✓ Use</button><button className="bg" onClick={() => { setPhoto(null); startCam() }} style={{ flex: 1, padding: 14 }}>🔄 Retake</button></div></div>)}
    </div>)
  }

  // ══ COMPLETION ══
  if (mode === "done" || mode === "complete") {
    const wData = workoutLog[d];
    return (<div className="fade-in" style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
      <h2 style={{ fontFamily: "Rajdhani,sans-serif", fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>TRAINING COMPLETE</h2>
      <div style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>{wData?.splitName || workout?.splitName}</div>
      {wData?.verified && <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, padding: "3px 10px", borderRadius: 100, background: "rgba(34,197,94,.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,.2)" }}>✓ Photo Verified</span>}
      {wData?.photo && <div style={{ width: 100, height: 100, borderRadius: 12, overflow: "hidden", margin: "12px auto", border: "2px solid rgba(16,185,129,.2)" }}><img src={wData.photo} alt="proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginTop: 16, maxWidth: 320, margin: "16px auto" }}>
        {[["⏱", fmt(wData?.duration || sessionTimer), "Duration"], ["🔥", wData?.calBurned || calBurned, "Calories"], ["💪", wData?.exerciseCount || (workout?.exercises.length || 0), "Exercises"], ["⚡", `+${XP.workout}`, "XP"]].map(([icon, val, label]) => (<div key={label} className="gs" style={{ padding: 14 }}><div style={{ fontSize: 18 }}>{icon}</div><div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{val}</div><div style={{ fontSize: 10, color: "#6b7280" }}>{label}</div></div>))}
      </div>
      <button className="bp" onClick={() => { setMode("config"); _session = null }} style={{ marginTop: 16, padding: "14px 40px", letterSpacing: 2 }}>DONE</button>
      <div style={{ marginTop: 20 }}><HistoryPanel entries={formatTrainingHistory(workoutLog)} title="Past Workouts" emptyText="No history yet" /></div>
    </div>);
  }

  // ══ ACTIVE SESSION ══
  if (mode === "session" && workout) {
    const ex = workout.allExercises[currentIdx];
    if (!ex) return <div>Loading...</div>;
    const pct = Math.round((completedEx.length / workout.allExercises.length) * 100);
    const isDone = completedEx.includes(currentIdx);

    return (<div>
      {/* Session header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: `${phaseColor[ex.phase]}15`, color: phaseColor[ex.phase], fontWeight: 700 }}>{phaseIcon[ex.phase]} {ex.phase.toUpperCase()}</span><span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>{completedEx.length}/{workout.allExercises.length}</span></div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#10b981", fontFamily: "Rajdhani,sans-serif", fontVariantNumeric: "tabular-nums" }}>{fmt(sessionTimer)}</div>
      </div>

      {/* Progress */}
      <div style={{ height: 6, background: "rgba(255,255,255,.04)", borderRadius: 3, marginBottom: 6, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#10b981,#06b6d4)", borderRadius: 3, transition: "width .5s" }} /></div>

      {/* Exercise dots */}
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 14 }}>{workout.allExercises.map((_, i) => <div key={i} onClick={() => { if (!completedEx.includes(i)) setCurrentIdx(i) }} style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, cursor: "pointer", background: completedEx.includes(i) ? `${phaseColor[workout.allExercises[i].phase]}20` : i === currentIdx ? `${phaseColor[ex.phase]}10` : "rgba(255,255,255,.03)", border: i === currentIdx ? `1.5px solid ${phaseColor[ex.phase]}60` : "1px solid rgba(255,255,255,.04)", color: completedEx.includes(i) ? phaseColor[workout.allExercises[i].phase] : "#4b5563" }}>{completedEx.includes(i) ? "✓" : i + 1}</div>)}</div>

      {/* Rest Timer */}
      {resting && <div className="gs fade-in" style={{ marginBottom: 14, textAlign: "center", border: "1px solid rgba(16,185,129,.2)", padding: 16 }}><div style={{ fontSize: 11, color: "#6b7280", letterSpacing: 2 }}>REST</div><div style={{ fontSize: 52, fontWeight: 900, color: "#10b981", fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{restTime}</div><div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>{REST_OPTIONS.map(r => <span key={r} className={`chip ${restDur === r ? "chip-a" : "chip-i"}`} onClick={() => { setRestDur(r); setRestTime(r) }} style={{ fontSize: 11 }}>{r}s</span>)}</div><button className="bp" onClick={() => { setResting(false); setRestTime(0) }} style={{ marginTop: 10, padding: "8px 24px" }}>Skip →</button></div>}

      {/* Current Exercise */}
      {!resting && <div className="gs fade-in" style={{ border: `1px solid ${phaseColor[ex.phase]}15`, padding: 20 }}>
        {/* Exercise name + difficulty */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>{ex.name}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{ex.sets || 1} × {ex.reps}{ex.timed ? " sec" : ""} {ex.muscle ? `· ${ex.muscle}` : ""}</div>
          {ex.difficulty && <span style={{ display: "inline-block", marginTop: 6, fontSize: 10, padding: "2px 10px", borderRadius: 100, background: `${diffColor[ex.difficulty]}12`, color: diffColor[ex.difficulty], fontWeight: 600 }}>{diffLabel[ex.difficulty]}</span>}
        </div>

        {/* YouTube Video Button */}
        <a href={getYouTubeURL(ex.name)} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.15)", color: "#ef4444", textDecoration: "none", fontSize: 14, fontWeight: 600, marginBottom: 14, transition: "all .2s" }}>
          <span style={{ fontSize: 20 }}>▶️</span> Watch Tutorial on YouTube
        </a>

        {/* Steps */}
        {ex.steps && ex.steps.length > 0 && <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: phaseColor[ex.phase], fontFamily: "Rajdhani,sans-serif", letterSpacing: 1.5, marginBottom: 8 }}>HOW TO DO IT</div>
          {ex.steps.map((s, i) => <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}><span style={{ width: 22, height: 22, borderRadius: 6, background: `${phaseColor[ex.phase]}10`, display: "flex", alignItems: "center", justifyContent: "center", color: phaseColor[ex.phase], fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span><span style={{ fontSize: 14, color: "#d1d5db", lineHeight: 1.6 }}>{s}</span></div>)}
        </div>}

        {/* Tips */}
        {ex.tips && ex.tips.length > 0 && <div style={{ marginBottom: 14 }}>
          {ex.tips.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#6b7280", marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid rgba(251,191,36,.2)" }}>💡 {t}</div>)}
        </div>}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="bp" onClick={() => completeExercise(currentIdx)} disabled={isDone} style={{ flex: 1, padding: 16, fontSize: 17, letterSpacing: 1 }}>{isDone ? "✓ Done" : "✓ COMPLETE"}</button>
          <button className="bg" onClick={() => { const next = workout.allExercises.findIndex((_, i) => !completedEx.includes(i) && i > currentIdx); if (next >= 0) setCurrentIdx(next) }} style={{ padding: "16px 18px", fontSize: 14 }}>Skip</button>
          {ex.phase === "main" && <button className="bg" onClick={() => swapExercise(currentIdx)} style={{ padding: "16px 18px", fontSize: 14 }}>🔄</button>}
        </div>
      </div>}

      {/* End early */}
      <button onClick={() => requestPhoto(completedEx.length)} style={{ width: "100%", marginTop: 14, padding: 10, background: "transparent", border: "1px solid rgba(239,68,68,.12)", borderRadius: 8, color: "#ef4444", fontSize: 12, cursor: "pointer" }}>End Session Early</button>
    </div>);
  }

  // ══ PREVIEW ══
  if (mode === "preview" && workout) {
    return (<div>
      <div className="gs" style={{ marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#10b981,#06b6d4)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 2 }}>YOUR WORKOUT</div><div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{workout.splitName}</div></div><button className="bg" onClick={() => { setMode("config"); setWorkout(null) }} style={{ fontSize: 12 }}>← Change</button></div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", fontSize: 12, color: "#d1d5db" }}><span>⏱ ~{workout.estTime}min</span><span>💪 {workout.exercises.length} exercises</span><span>⚔️ {workout.fighting.length} combat</span></div>
        <button className="bp" onClick={startSession} style={{ width: "100%", marginTop: 14, padding: 16, fontSize: 16, letterSpacing: 2 }}>⚔️ START WORKOUT</button>
      </div>

      {/* Exercise list with YouTube links */}
      {[["🔥 Warm-up", workout.warmup, "#f59e0b"], ["💪 Exercises", workout.exercises, "#10b981"], ["⚔️ Combat", workout.fighting, "#a78bfa"], ["🧘 Cool-down", workout.cooldown, "#06b6d4"]].map(([label, list, color]) => list.length > 0 && <div key={label} className="gs" style={{ marginBottom: 10 }}>
        <div className="sl" style={{ color }}>{label} ({list.length})</div>
        {list.map((e, i) => <div key={i} style={{ marginBottom: 6 }}>
          <div className="ex-card" onClick={() => setExpandedEx(expandedEx === `${label}${i}` ? null : `${label}${i}`)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</span>
                  {e.difficulty && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 100, background: `${diffColor[e.difficulty]}10`, color: diffColor[e.difficulty] }}>{diffLabel[e.difficulty]}</span>}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{e.sets || 1}×{e.reps} {e.muscle ? `· ${e.muscle}` : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <a href={getYouTubeURL(e.name)} target="_blank" rel="noopener noreferrer" onClick={ev => ev.stopPropagation()} style={{ fontSize: 16, textDecoration: "none", padding: "4px 6px", borderRadius: 6, background: "rgba(239,68,68,.06)" }}>▶️</a>
                <span style={{ color: "#4b5563", fontSize: 14 }}>{expandedEx === `${label}${i}` ? "▾" : "▸"}</span>
              </div>
            </div>
          </div>
          {expandedEx === `${label}${i}` && <div className="fade-in" style={{ padding: "10px 14px", background: "rgba(255,255,255,.01)", borderRadius: 8, marginTop: 2 }}>
            <a href={getYouTubeURL(e.name)} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.12)", color: "#ef4444", textDecoration: "none", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>▶️ Watch "{e.name}" Tutorial on YouTube</a>
            {e.steps && e.steps.map((s, j) => <div key={j} style={{ fontSize: 13, color: "#d1d5db", marginBottom: 6, paddingLeft: 10, borderLeft: `2px solid ${color}20` }}>{s}</div>)}
            {e.tips && e.tips.map((t, j) => <div key={j} style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, paddingLeft: 10 }}>💡 {t}</div>)}
          </div>}
        </div>)}
      </div>)}

      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 8 }}><span style={{ fontSize: 11, color: "#6b7280" }}>Rest between sets:</span>{REST_OPTIONS.map(r => <span key={r} className={`chip ${restDur === r ? "chip-a" : "chip-i"}`} onClick={() => setRestDur(r)} style={{ padding: "4px 10px", fontSize: 11 }}>{r}s</span>)}</div>
    </div>);
  }

  // ══ TABS (for config/done modes) ══
  return (<div>
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
      {[["workout", "⚔️ Workout"], ["history", "📅 History"]].map(([k, l]) => <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ padding: "8px 16px" }}>{l}</span>)}
    </div>

    {/* ══ HISTORY TAB ══ */}
    {tab === "history" && <HistoryPanel entries={formatTrainingHistory(workoutLog)} title="Training History" emptyText="Complete your first workout" />}

    {/* ══ WORKOUT TAB ══ */}
    {tab === "workout" && (<div>
      {/* Already done today */}
      {todayW && mode !== "config2" && (<div>
        <div className="gs" style={{ textAlign: "center", marginBottom: 16, border: "1px solid rgba(34,197,94,.2)" }}><div style={{ fontSize: 48, marginBottom: 8 }}>✅</div><div style={{ fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 18, color: "#22c55e", letterSpacing: 1 }}>TRAINING COMPLETE</div><div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{todayW.splitName} · {todayW.calBurned}cal · {fmt(todayW.duration)}</div>
          {todayW.photo && <div style={{ width: 70, height: 70, borderRadius: 10, overflow: "hidden", margin: "10px auto" }}><img src={todayW.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
          <button className="bg" onClick={() => setMode("config2")} style={{ marginTop: 12 }}>Train Again</button>
        </div>
      </div>)}

      {/* Configurator */}
      {(!todayW || mode === "config2") && (<div>
        <div style={{ textAlign: "center", marginBottom: 20 }}><div style={{ fontSize: 36, marginBottom: 8 }}>⚔️</div><h2 style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>Plan Your Training</h2>
          {suggestions.favorite && <p style={{ color: "#6b7280", fontSize: 12, marginTop: 6 }}>💡 You mostly train <span style={{ color: "#10b981" }}>{suggestions.favorite}</span>. Last focus: <span style={{ color: "#06b6d4" }}>{suggestions.lastFocus || "full body"}</span>. Try <span style={{ color: "#f59e0b" }}>{suggestions.focusSuggestion}</span> today?</p>}
        </div>

        <div className="gs" style={{ marginBottom: 14 }}><div className="sl">What do you want to train?</div><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>{ACTIVITY_TYPES.map(a => <div key={a.id} onClick={() => setDayActivity(a.id)} style={{ padding: "12px 6px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: dayActivity === a.id ? "rgba(16,185,129,.08)" : "rgba(255,255,255,.02)", border: dayActivity === a.id ? "1px solid rgba(16,185,129,.3)" : "1px solid rgba(255,255,255,.04)" }}><div style={{ fontSize: 22 }}>{a.icon}</div><div style={{ fontSize: 11, fontWeight: 600, color: dayActivity === a.id ? "#10b981" : "#e5e7eb", marginTop: 4 }}>{a.label}</div><div style={{ fontSize: 9, color: "#4b5563" }}>{a.desc}</div></div>)}</div></div>

        {["bodyweight", "gym"].includes(dayActivity) && <div className="gs" style={{ marginBottom: 14 }}><div className="sl">Body Focus {suggestions.focusSuggestion && <span style={{ color: "#f59e0b", fontWeight: 400, letterSpacing: 0 }}> · Try {suggestions.focusSuggestion}?</span>}</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{BODY_PARTS.map(bp => <span key={bp.id} className={`chip ${dayFocus === bp.id ? "chip-a" : "chip-i"}`} onClick={() => setDayFocus(bp.id)} style={{ padding: "8px 14px" }}>{bp.icon} {bp.label}</span>)}</div></div>}

        <div className="gs" style={{ marginBottom: 20 }}><div className="sl">Time Available</div><div style={{ display: "flex", gap: 8 }}>{TIME_OPTIONS.map(t => <div key={t} onClick={() => setDayTime(t)} style={{ flex: 1, padding: "12px 4px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: dayTime === t ? "rgba(16,185,129,.08)" : "rgba(255,255,255,.02)", border: dayTime === t ? "1px solid rgba(16,185,129,.3)" : "1px solid rgba(255,255,255,.04)" }}><div style={{ fontSize: 18, fontWeight: 800, color: dayTime === t ? "#10b981" : "#e5e7eb", fontFamily: "Rajdhani,sans-serif" }}>{t}</div><div style={{ fontSize: 10, color: "#6b7280" }}>min</div></div>)}</div></div>

        <button className="bp" onClick={generateDaily} style={{ width: "100%", padding: 16, fontSize: 16, letterSpacing: 2 }}>⚔️ GENERATE WORKOUT</button>
      </div>)}
    </div>)}
  </div>);
}