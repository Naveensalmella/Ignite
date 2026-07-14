import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getLevel, today } from '../utils';
import { XP } from '../data';
import { generateWorkout, ACTIVITY_TYPES, BODY_PARTS, TIME_OPTIONS, RUNNING, YOGA, HIIT, FIGHTING } from '../data/exercises';
import ExerciseDetail from './ExerciseDetail';
import HistoryPanel from './HistoryPanel';
import { formatTrainingHistory } from '../historyFormatters';

const REST_OPTIONS = [15, 30, 45, 60, 90];
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const ytURL = name => `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " exercise tutorial proper form")}`;

// ── Persist session across page switches ──
let _session = null;

export default function TrainingPage({ totalXP, addXP, workoutLog, setWorkoutLog, profile }) {
  const lv = getLevel(totalXP), d = today(), todayW = workoutLog[d];

  const [dayActivity, setDayActivity] = useState(_session?.dayActivity || profile.trainingType || "bodyweight");
  const [dayFocus, setDayFocus] = useState(_session?.dayFocus || "full");
  const [dayTime, setDayTime] = useState(_session?.dayTime || parseInt(profile.dailyTime) || 45);
  const [workout, setWorkout] = useState(_session?.workout || null);
  const [mode, setMode] = useState(_session?.mode || (todayW ? "done" : "config"));
  const [currentIdx, setCurrentIdx] = useState(_session?.currentIdx || 0);
  const [completedEx, setCompletedEx] = useState(_session?.completedEx || []);
  const [calBurned, setCalBurned] = useState(_session?.calBurned || 0);
  const [expandedEx, setExpandedEx] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [tab, setTab] = useState("workout");

  // ── Background-safe timers using timestamps ──
  const [sessionStartTime, setSessionStartTime] = useState(_session?.sessionStartTime || null);
  const [pausedElapsed, setPausedElapsed] = useState(_session?.pausedElapsed || 0);
  const [running, setRunning] = useState(_session?.running || false);
  const [sessionTimer, setSessionTimer] = useState(0);

  const [restEndTime, setRestEndTime] = useState(null);
  const [restDur, setRestDur] = useState(45);
  const [resting, setResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);

  // Photo proof
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState(null);
  const videoRef = useRef(null), canvasRef = useRef(null), streamRef = useRef(null);
  const tickRef = useRef(null);

  // ── Save session cache ──
  useEffect(() => {
    _session = { dayActivity, dayFocus, dayTime, workout, mode, currentIdx, completedEx, calBurned, running, sessionStartTime, pausedElapsed };
  }, [dayActivity, dayFocus, dayTime, workout, mode, currentIdx, completedEx, calBurned, running, sessionStartTime, pausedElapsed]);

  // ── Master tick — runs every 500ms, calculates from timestamps (background-safe) ──
  useEffect(() => {
    tickRef.current = setInterval(() => {
      // Session timer
      if (running && sessionStartTime) {
        const elapsed = pausedElapsed + Math.floor((Date.now() - sessionStartTime) / 1000);
        setSessionTimer(elapsed);
      }
      // Rest timer
      if (resting && restEndTime) {
        const remaining = Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000));
        setRestRemaining(remaining);
        if (remaining <= 0) setResting(false);
      }
    }, 500);
    return () => clearInterval(tickRef.current);
  }, [running, sessionStartTime, pausedElapsed, resting, restEndTime]);

  // ── Recalculate on visibility change (when user comes back from background) ──
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        if (running && sessionStartTime) {
          setSessionTimer(pausedElapsed + Math.floor((Date.now() - sessionStartTime) / 1000));
        }
        if (resting && restEndTime) {
          const r = Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000));
          setRestRemaining(r);
          if (r <= 0) setResting(false);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [running, sessionStartTime, pausedElapsed, resting, restEndTime]);

  // Smart suggestions
  const suggestions = useMemo(() => {
    const logs = Object.values(workoutLog || {});
    const actCounts = {}; logs.forEach(w => { actCounts[w.activity] = (actCounts[w.activity] || 0) + 1 });
    const fav = Object.entries(actCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const lastFocus = logs[logs.length - 1]?.focus;
    const suggest = lastFocus === "chest" ? "back" : lastFocus === "back" ? "legs" : lastFocus === "legs" ? "shoulders" : lastFocus === "shoulders" ? "arms" : lastFocus === "arms" ? "core" : "full";
    return { fav, lastFocus, suggest, total: logs.length };
  }, [workoutLog]);

  const generateDaily = () => {
    const config = { ...profile, trainingType: dayActivity, dailyTime: String(dayTime), focusAreas: [dayFocus] };
    let w = generateWorkout(config);
    if (dayActivity === "running") { w.exercises = (RUNNING[profile.fitnessLevel === "beginner" ? "easy" : "moderate"] || RUNNING.easy).slice(0, Math.max(1, Math.floor(dayTime / 15))); w.fighting = []; w.splitName = "Running Session"; }
    else if (dayActivity === "yoga") { w.exercises = [...YOGA].sort(() => Math.random() - .5).slice(0, Math.max(3, Math.floor(dayTime / 5))); w.fighting = []; w.splitName = "Yoga & Flexibility"; }
    else if (dayActivity === "hiit") { w.exercises = [...HIIT].sort(() => Math.random() - .5).slice(0, Math.max(2, Math.floor(dayTime / 8))); w.fighting = []; w.splitName = "HIIT Session"; }
    else if (["boxing", "kickboxing", "mma", "martial_arts"].includes(dayActivity)) { w.fighting = [...(FIGHTING[dayActivity] || [])].sort(() => Math.random() - .5).slice(0, Math.max(3, Math.floor(dayTime / 5))); w.splitName = `${ACTIVITY_TYPES.find(a => a.id === dayActivity)?.label} Training`; }
    w.estTime = dayTime;
    w.allExercises = [...w.warmup.map(e => ({ ...e, phase: "warmup" })), ...w.exercises.map(e => ({ ...e, phase: "main" })), ...w.fighting.map(e => ({ ...e, phase: "combat" })), ...w.cooldown.map(e => ({ ...e, phase: "cooldown" }))];
    setWorkout(w); setMode("preview");
  };

  const startSession = () => { setMode("session"); setCurrentIdx(0); setCompletedEx([]); setCalBurned(0); setSessionStartTime(Date.now()); setPausedElapsed(0); setRunning(true); setSessionTimer(0) };

  const completeExercise = (idx) => {
    if (completedEx.includes(idx)) return;
    const ex = workout.allExercises[idx];
    const nc = [...completedEx, idx];
    setCompletedEx(nc);
    setCalBurned(c => c + (ex.cal || 3) * (ex.sets || 1));
    if (nc.length >= workout.allExercises.length) { requestPhoto() }
    else { const next = workout.allExercises.findIndex((_, i) => !nc.includes(i) && i > idx); if (next >= 0) { setShowVideo(false); setVideoId(null); if (ex.phase === "main" || ex.phase === "combat") { setResting(true); setRestEndTime(Date.now() + restDur * 1000); setRestRemaining(restDur) } setCurrentIdx(next) } else { requestPhoto() } }
  };

  const skipRest = () => { setResting(false); setRestEndTime(null); setRestRemaining(0) };
  const swapExercise = (idx) => { if (!workout) return; const ex = workout.allExercises[idx]; const pool = workout.exercises.filter(e => e.name !== ex.name && e.bodyPart === ex.bodyPart); if (pool.length === 0) return; const na = [...workout.allExercises]; na[idx] = { ...pool[Math.floor(Math.random() * pool.length)], phase: ex.phase }; setWorkout(w => ({ ...w, allExercises: na })) };

  // Photo proof
  const requestPhoto = () => { setRunning(false); setPausedElapsed(sessionTimer); setShowCamera(true); startCam() };
  const finishWorkout = (proofPhoto) => { setMode("done"); _session = null; addXP(XP.workout + (workout.fighting.length > 0 ? workout.fighting.length * XP.combat : 0), "Training complete"); setWorkoutLog(p => ({ ...p, [d]: { type: "smart", splitName: workout.splitName, bodyParts: workout.bodyParts || [], calBurned, duration: sessionTimer, exerciseCount: workout.exercises.length + workout.fighting.length, activity: dayActivity, focus: dayFocus, completedAt: new Date().toLocaleTimeString(), exercises: workout.exercises.map(e => e.name), fighting: workout.fighting.map(e => e.name), photo: proofPhoto || null, verified: !!proofPhoto } })) };
  const startCam = async () => { try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 480 } } }); streamRef.current = s; if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play() } } catch (e) { finishWorkout(null) } };
  const stopCam = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null } };
  const capture = () => { if (!videoRef.current || !canvasRef.current) return; const c = canvasRef.current, v = videoRef.current; c.width = 240; c.height = 240; const ctx = c.getContext("2d"); const sz = Math.min(v.videoWidth, v.videoHeight); ctx.drawImage(v, (v.videoWidth - sz) / 2, (v.videoHeight - sz) / 2, sz, sz, 0, 0, 240, 240); ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 215, 240, 25); ctx.fillStyle = "#10b981"; ctx.font = "bold 10px Rajdhani,sans-serif"; ctx.fillText(`IGNITE · ${new Date().toLocaleDateString()} · ${fmt(sessionTimer)}`, 6, 232); setPhoto(c.toDataURL("image/jpeg", .6)); stopCam() };
  const confirmPhoto = () => { setShowCamera(false); finishWorkout(photo); setPhoto(null) };
  const skipPhoto = () => { stopCam(); setShowCamera(false); finishWorkout(null); setPhoto(null) };
  useEffect(() => () => stopCam(), []);

  const phaseColor = { warmup: "#f59e0b", main: "#10b981", combat: "#a78bfa", cooldown: "#06b6d4" };
  const phaseIcon = { warmup: "🔥", main: "💪", combat: "⚔️", cooldown: "🧘" };
  const diffLabel = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };
  const diffColor = { 1: "#22c55e", 2: "#f59e0b", 3: "#ef4444" };

  // ══ PHOTO ══
  if (showCamera) { return (<div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#060a0c", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}><div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 16 }}>Victory Photo 📸</div>{!photo ? (<div style={{ width: "100%", maxWidth: 300 }}><div style={{ width: "100%", aspectRatio: "1", borderRadius: 16, overflow: "hidden", border: "2px solid rgba(16,185,129,.3)", marginBottom: 16, background: "#111" }}><video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} /></div><canvas ref={canvasRef} style={{ display: "none" }} /><button className="bp" onClick={capture} style={{ width: "100%", padding: 16, fontSize: 18 }}>📸 CAPTURE</button><button onClick={skipPhoto} style={{ width: "100%", marginTop: 10, padding: 10, background: "transparent", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, color: "#6b7280", fontSize: 12, cursor: "pointer" }}>Skip</button></div>) : (<div style={{ width: "100%", maxWidth: 300 }}><div style={{ width: "100%", aspectRatio: "1", borderRadius: 16, overflow: "hidden", border: "2px solid rgba(16,185,129,.3)", marginBottom: 16 }}><img src={photo} alt="proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div><div style={{ display: "flex", gap: 10 }}><button className="bp" onClick={confirmPhoto} style={{ flex: 1, padding: 14 }}>✓ Use</button><button className="bg" onClick={() => { setPhoto(null); startCam() }} style={{ flex: 1, padding: 14 }}>🔄 Retake</button></div></div>)}</div>) }

  // ══ COMPLETE ══
  if (mode === "done" || mode === "complete") { const wData = workoutLog[d]; return (<div className="fade-in" style={{ textAlign: "center", padding: "20px 0" }}><div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div><h2 style={{ fontFamily: "Rajdhani,sans-serif", fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>TRAINING COMPLETE</h2><div style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>{wData?.splitName || workout?.splitName}</div>{wData?.verified && <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, padding: "3px 10px", borderRadius: 100, background: "rgba(34,197,94,.1)", color: "#22c55e" }}>✓ Verified</span>}{wData?.photo && <div style={{ width: 100, height: 100, borderRadius: 12, overflow: "hidden", margin: "12px auto" }}><img src={wData.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}<div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginTop: 16, maxWidth: 320, margin: "16px auto" }}>{[["⏱", fmt(wData?.duration || sessionTimer), "Duration"], ["🔥", wData?.calBurned || calBurned, "Calories"], ["💪", wData?.exerciseCount || (workout?.exercises.length || 0), "Exercises"], ["⚡", `+${XP.workout}`, "XP"]].map(([icon, val, label]) => (<div key={label} className="gs" style={{ padding: 14 }}><div style={{ fontSize: 18 }}>{icon}</div><div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{val}</div><div style={{ fontSize: 10, color: "#6b7280" }}>{label}</div></div>))}</div><button className="bp" onClick={() => { setMode("config"); _session = null }} style={{ marginTop: 16, padding: "14px 40px" }}>DONE</button><div style={{ marginTop: 20 }}><HistoryPanel entries={formatTrainingHistory(workoutLog)} title="Past Workouts" emptyText="No history" /></div></div>) }

  // ══ SESSION ══
  if (mode === "session" && workout) {
    const ex = workout.allExercises[currentIdx];
    if (!ex) return <div>Loading...</div>;
    const pct = Math.round((completedEx.length / workout.allExercises.length) * 100);
    return (<div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><div><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: `${phaseColor[ex.phase]}15`, color: phaseColor[ex.phase], fontWeight: 700 }}>{phaseIcon[ex.phase]} {ex.phase.toUpperCase()}</span><span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>{completedEx.length}/{workout.allExercises.length}</span></div><div style={{ fontSize: 26, fontWeight: 800, color: "#10b981", fontFamily: "Rajdhani,sans-serif", fontVariantNumeric: "tabular-nums" }}>{fmt(sessionTimer)}</div></div>
      <div style={{ height: 6, background: "rgba(255,255,255,.04)", borderRadius: 3, marginBottom: 6, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#10b981,#06b6d4)", borderRadius: 3, transition: "width .5s" }} /></div>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 14 }}>{workout.allExercises.map((_, i) => <div key={i} onClick={() => { if (!completedEx.includes(i)) setCurrentIdx(i) }} style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, cursor: "pointer", background: completedEx.includes(i) ? `${phaseColor[workout.allExercises[i].phase]}20` : i === currentIdx ? `${phaseColor[ex.phase]}10` : "rgba(255,255,255,.03)", border: i === currentIdx ? `1.5px solid ${phaseColor[ex.phase]}60` : "1px solid rgba(255,255,255,.04)", color: completedEx.includes(i) ? phaseColor[workout.allExercises[i].phase] : "#4b5563" }}>{completedEx.includes(i) ? "✓" : i + 1}</div>)}</div>

      {resting && <div className="gs fade-in" style={{ marginBottom: 14, textAlign: "center", border: "1px solid rgba(16,185,129,.2)", padding: 16 }}><div style={{ fontSize: 11, color: "#6b7280", letterSpacing: 2 }}>REST</div><div style={{ fontSize: 52, fontWeight: 900, color: "#10b981", fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{restRemaining}</div><div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>{REST_OPTIONS.map(r => <span key={r} className={`chip ${restDur === r ? "chip-a" : "chip-i"}`} onClick={() => { setRestDur(r); setRestEndTime(Date.now() + r * 1000); setRestRemaining(r) }} style={{ fontSize: 11 }}>{r}s</span>)}</div><button className="bp" onClick={skipRest} style={{ marginTop: 10, padding: "8px 24px" }}>Skip →</button></div>}

      {!resting && <div className="gs fade-in" style={{ border: `1px solid ${phaseColor[ex.phase]}15`, padding: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}><div style={{ fontSize: 24, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>{ex.name}</div><div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{ex.sets || 1}×{ex.reps}{ex.timed ? "s" : ""} {ex.muscle ? `· ${ex.muscle}` : ""}</div>{ex.difficulty && <span style={{ display: "inline-block", marginTop: 6, fontSize: 10, padding: "2px 10px", borderRadius: 100, background: `${diffColor[ex.difficulty]}10`, color: diffColor[ex.difficulty], fontWeight: 600 }}>{diffLabel[ex.difficulty]}</span>}</div>
        {/* Video Player */}
        {showVideo ? (
          <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 14, border: "1px solid rgba(255,255,255,.08)", background: "#000", position: "relative" }}>
            {videoId ? (
              <iframe src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`} title={ex.name} width="100%" height="200" frameBorder="0" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture" allowFullScreen style={{ display: "block" }} />
            ) : videoLoading ? (
              <div style={{ width: "100%", height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ display: "flex", gap: 6 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: `dotPulse 1.2s ${i * .2}s infinite` }} />)}</div></div>
            ) : (
              <div style={{ width: "100%", height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><a href={ytURL(ex.name)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#ef4444", textDecoration: "none" }}>▶️ Watch on YouTube →</a></div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "rgba(255,255,255,.03)" }}><button onClick={() => setShowVideo(false)} style={{ fontSize: 11, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>✕ Close</button><a href={ytURL(ex.name)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#ef4444", textDecoration: "none" }}>More →</a></div>
          </div>
        ) : (
          <button onClick={() => { setShowVideo(true); setVideoLoading(true); setVideoId(null); fetch(`/api/youtube-search?q=${encodeURIComponent(ex.name)}`).then(r => r.json()).then(d => { setVideoId(d.videoId || null); setVideoLoading(false) }).catch(() => setVideoLoading(false)) }} style={{ width: "100%", padding: 0, border: "none", borderRadius: 12, cursor: "pointer", overflow: "hidden", marginBottom: 14, background: "transparent" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "linear-gradient(135deg,rgba(239,68,68,.07),rgba(239,68,68,.02))", border: "1px solid rgba(239,68,68,.12)", borderRadius: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 10, background: "rgba(239,68,68,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>▶️</div>
              <div style={{ textAlign: "left" }}><div style={{ fontSize: 14, fontWeight: 600, color: "#f3f4f6" }}>Watch Tutorial</div><div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Learn proper form</div></div>
              <span style={{ marginLeft: "auto", color: "#4b5563", fontSize: 16 }}>→</span>
            </div>
          </button>
        )}
        {ex.steps && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, color: phaseColor[ex.phase], fontFamily: "Rajdhani,sans-serif", letterSpacing: 1.5, marginBottom: 8 }}>HOW TO DO IT</div>{ex.steps.map((s, i) => <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}><span style={{ width: 22, height: 22, borderRadius: 6, background: `${phaseColor[ex.phase]}10`, display: "flex", alignItems: "center", justifyContent: "center", color: phaseColor[ex.phase], fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span><span style={{ fontSize: 14, color: "#d1d5db", lineHeight: 1.6 }}>{s}</span></div>)}</div>}
        {ex.tips && <div style={{ marginBottom: 14 }}>{ex.tips.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#6b7280", marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid rgba(251,191,36,.2)" }}>💡 {t}</div>)}</div>}
        <div style={{ display: "flex", gap: 8 }}><button className="bp" onClick={() => completeExercise(currentIdx)} disabled={completedEx.includes(currentIdx)} style={{ flex: 1, padding: 16, fontSize: 17, letterSpacing: 1 }}>{completedEx.includes(currentIdx) ? "✓ Done" : "✓ COMPLETE"}</button><button className="bg" onClick={() => { const next = workout.allExercises.findIndex((_, i) => !completedEx.includes(i) && i > currentIdx); if (next >= 0) setCurrentIdx(next) }} style={{ padding: "16px 18px" }}>Skip</button>{ex.phase === "main" && <button className="bg" onClick={() => swapExercise(currentIdx)} style={{ padding: "16px 18px" }}>🔄</button>}</div>
      </div>}
      <button onClick={() => requestPhoto()} style={{ width: "100%", marginTop: 14, padding: 10, background: "transparent", border: "1px solid rgba(239,68,68,.12)", borderRadius: 8, color: "#ef4444", fontSize: 12, cursor: "pointer" }}>End Session Early</button>
    </div>);
  }

  // ══ PREVIEW ══
  if (mode === "preview" && workout) {
    return (<div>
      <div className="gs" style={{ marginBottom: 16, position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#10b981,#06b6d4)" }} /><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 2 }}>YOUR WORKOUT</div><div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{workout.splitName}</div></div><button className="bg" onClick={() => { setMode("config"); setWorkout(null) }}>← Change</button></div><div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", fontSize: 12, color: "#d1d5db" }}><span>⏱ ~{workout.estTime}min</span><span>💪 {workout.exercises.length} exercises</span><span>⚔️ {workout.fighting.length} combat</span></div><button className="bp" onClick={startSession} style={{ width: "100%", marginTop: 14, padding: 16, fontSize: 16, letterSpacing: 2 }}>⚔️ START WORKOUT</button></div>
      {[["🔥 Warm-up", workout.warmup, "#f59e0b"], ["💪 Exercises", workout.exercises, "#10b981"], ["⚔️ Combat", workout.fighting, "#a78bfa"], ["🧘 Cool-down", workout.cooldown, "#06b6d4"]].map(([label, list, color]) => list.length > 0 && <div key={label} className="gs" style={{ marginBottom: 10 }}><div className="sl" style={{ color }}>{label} ({list.length})</div>{list.map((e, i) => <div key={i}><div className="ex-card" onClick={() => setExpandedEx(expandedEx === `${label}${i}` ? null : `${label}${i}`)}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ flex: 1 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</span>{e.difficulty && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 100, background: `${diffColor[e.difficulty]}10`, color: diffColor[e.difficulty] }}>{diffLabel[e.difficulty]}</span>}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{e.sets || 1}×{e.reps} {e.muscle ? `· ${e.muscle}` : ""}</div></div><div style={{ display: "flex", gap: 6, alignItems: "center" }}><a href={ytURL(e.name)} target="_blank" rel="noopener noreferrer" onClick={ev => ev.stopPropagation()} style={{ fontSize: 16, textDecoration: "none", padding: "4px 6px", borderRadius: 6, background: "rgba(239,68,68,.06)" }}>▶️</a><span style={{ color: "#4b5563", fontSize: 14 }}>{expandedEx === `${label}${i}` ? "▾" : "▸"}</span></div></div></div>{expandedEx === `${label}${i}` && <ExerciseDetail ex={e} color={color} showComplete={false} />}</div>)}</div>)}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 8 }}><span style={{ fontSize: 11, color: "#6b7280" }}>Rest:</span>{REST_OPTIONS.map(r => <span key={r} className={`chip ${restDur === r ? "chip-a" : "chip-i"}`} onClick={() => setRestDur(r)} style={{ padding: "4px 10px", fontSize: 11 }}>{r}s</span>)}</div>
    </div>)
  }

  // ══ TABS ══
  return (<div>
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>{[["workout", "⚔️ Workout"], ["history", "📅 History"]].map(([k, l]) => <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ padding: "8px 16px" }}>{l}</span>)}</div>
    {tab === "history" && <HistoryPanel entries={formatTrainingHistory(workoutLog)} title="Training History" emptyText="Complete your first workout" />}
    {tab === "workout" && (<div>
      {todayW && mode !== "config2" && (<div><div className="gs" style={{ textAlign: "center", marginBottom: 16, border: "1px solid rgba(34,197,94,.2)" }}><div style={{ fontSize: 48, marginBottom: 8 }}>✅</div><div style={{ fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 18, color: "#22c55e", letterSpacing: 1 }}>TRAINING COMPLETE</div><div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{todayW.splitName} · {todayW.calBurned}cal · {fmt(todayW.duration)}</div>{todayW.photo && <div style={{ width: 70, height: 70, borderRadius: 10, overflow: "hidden", margin: "10px auto" }}><img src={todayW.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}<button className="bg" onClick={() => setMode("config2")} style={{ marginTop: 12 }}>Train Again</button></div></div>)}
      {(!todayW || mode === "config2") && (<div>
        <div style={{ textAlign: "center", marginBottom: 20 }}><div style={{ fontSize: 36, marginBottom: 8 }}>⚔️</div><h2 style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>Plan Your Training</h2>{suggestions.fav && <p style={{ color: "#6b7280", fontSize: 12, marginTop: 6 }}>💡 You mostly train <span style={{ color: "#10b981" }}>{suggestions.fav}</span>. Try <span style={{ color: "#f59e0b" }}>{suggestions.suggest}</span> today?</p>}</div>
        <div className="gs" style={{ marginBottom: 14 }}><div className="sl">Activity Type</div><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>{ACTIVITY_TYPES.map(a => <div key={a.id} onClick={() => setDayActivity(a.id)} style={{ padding: "12px 6px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: dayActivity === a.id ? "rgba(16,185,129,.08)" : "rgba(255,255,255,.02)", border: dayActivity === a.id ? "1px solid rgba(16,185,129,.3)" : "1px solid rgba(255,255,255,.04)" }}><div style={{ fontSize: 22 }}>{a.icon}</div><div style={{ fontSize: 11, fontWeight: 600, color: dayActivity === a.id ? "#10b981" : "#e5e7eb", marginTop: 4 }}>{a.label}</div><div style={{ fontSize: 9, color: "#4b5563" }}>{a.desc}</div></div>)}</div></div>
        {["bodyweight", "gym"].includes(dayActivity) && <div className="gs" style={{ marginBottom: 14 }}><div className="sl">Body Focus</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{BODY_PARTS.map(bp => <span key={bp.id} className={`chip ${dayFocus === bp.id ? "chip-a" : "chip-i"}`} onClick={() => setDayFocus(bp.id)} style={{ padding: "8px 14px" }}>{bp.icon} {bp.label}</span>)}</div></div>}
        <div className="gs" style={{ marginBottom: 20 }}><div className="sl">Time</div><div style={{ display: "flex", gap: 8 }}>{TIME_OPTIONS.map(t => <div key={t} onClick={() => setDayTime(t)} style={{ flex: 1, padding: "12px 4px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: dayTime === t ? "rgba(16,185,129,.08)" : "rgba(255,255,255,.02)", border: dayTime === t ? "1px solid rgba(16,185,129,.3)" : "1px solid rgba(255,255,255,.04)" }}><div style={{ fontSize: 18, fontWeight: 800, color: dayTime === t ? "#10b981" : "#e5e7eb", fontFamily: "Rajdhani,sans-serif" }}>{t}</div><div style={{ fontSize: 10, color: "#6b7280" }}>min</div></div>)}</div></div>
        <button className="bp" onClick={generateDaily} style={{ width: "100%", padding: 16, fontSize: 16, letterSpacing: 2 }}>⚔️ GENERATE WORKOUT</button>
      </div>)}
    </div>)}
  </div>);
}