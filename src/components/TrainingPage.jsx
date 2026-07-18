import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { today } from '../utils';
import MuscleMap, { getMusclesForExercise } from './MuscleMap';
import { getFormTip, getSwapOptions, WARMUP, COOLDOWN } from '../data/exerciseMeta';

// ── Exercise Database by Activity ──
const ACTIVITIES = [
  { id: "gym", name: "Gym", icon: "🏋️", color: "#10b981" },
  { id: "home", name: "Home", icon: "🏠", color: "#06b6d4" },
  { id: "cardio", name: "Cardio", icon: "🏃", color: "#f59e0b" },
  { id: "yoga", name: "Yoga", icon: "🧘", color: "#8b5cf6" },
  { id: "combat", name: "Combat", icon: "🥊", color: "#ef4444" },
  { id: "calisthenics", name: "Cali", icon: "💪", color: "#f97316" },
  { id: "hiit", name: "HIIT", icon: "⚡", color: "#ec4899" },
  { id: "stretch", name: "Stretch", icon: "🤸", color: "#14b8a6" },
  { id: "swim", name: "Swim", icon: "🏊", color: "#3b82f6" },
];

const BODY_PARTS = [
  { id: "chest", name: "Chest", icon: "💪" },
  { id: "back", name: "Back", icon: "🔙" },
  { id: "shoulders", name: "Shoulders", icon: "🦾" },
  { id: "arms", name: "Arms", icon: "💪" },
  { id: "abs", name: "Core", icon: "🎯" },
  { id: "legs", name: "Legs", icon: "🦵" },
  { id: "full", name: "Full Body", icon: "⚡" },
];

const EXERCISES = {
  chest: ["Push Ups", "Wide Push Ups", "Diamond Push Ups", "Decline Push Ups", "Incline Push Ups", "Chest Dips", "Bench Press", "Dumbbell Press", "Chest Fly", "Cable Crossover"],
  back: ["Pull Ups", "Chin Ups", "Bent Over Row", "Dumbbell Row", "Seated Row", "Lat Pulldown", "Superman", "Back Extension", "Deadlift", "T-Bar Row"],
  shoulders: ["Shoulder Press", "Lateral Raise", "Front Raise", "Arnold Press", "Rear Delt Fly", "Pike Push Ups", "Shrugs", "Upright Row", "Face Pull"],
  arms: ["Bicep Curls", "Hammer Curls", "Tricep Dips", "Tricep Extension", "Tricep Kickback", "Skull Crushers", "Concentration Curl", "Close Grip Push Ups", "Wrist Curls"],
  abs: ["Crunches", "Sit Ups", "Leg Raises", "Plank", "Side Plank", "Mountain Climbers", "Bicycle Crunches", "Russian Twist", "Flutter Kicks", "V-Ups", "Hanging Leg Raise"],
  legs: ["Squats", "Jump Squats", "Lunges", "Walking Lunges", "Bulgarian Split Squat", "Wall Sit", "Calf Raises", "Glute Bridge", "Hip Thrust", "Step Ups", "Romanian Deadlift", "Box Jumps", "Sumo Squat"],
  full: ["Burpees", "Jumping Jacks", "High Knees", "Mountain Climbers", "Bear Crawl", "Inchworm", "Thrusters", "Kettlebell Swing"],
  combat: ["Shadow Boxing", "Jab Cross", "Hook", "Uppercut", "Front Kick", "Roundhouse Kick", "Knee Strike", "Elbow Strike"],
  cardio: ["Jumping Jacks", "High Knees", "Butt Kicks", "Burpees", "Mountain Climbers", "Jump Squats", "Box Jumps"],
  hiit: ["Burpees", "Jump Squats", "Mountain Climbers", "High Knees", "Plank", "Push Ups", "Squats", "Lunges"],
};

const YOUTUBE_MAP = {
  "Push Ups": "IODxDxX7oi4", "Wide Push Ups": "pfPvBWSIBcQ", "Diamond Push Ups": "J0DnG1_S3lg", "Pull Ups": "eGo4IYlbE5g", "Chin Ups": "brhRXlOhWAM", "Squats": "aclHkVaku9U", "Jump Squats": "A-cFYGvaxi8", "Lunges": "QOVaHwm-Q6U", "Plank": "ASdvN_XEl_c", "Crunches": "Xyd_fa5zoEU", "Burpees": "JZQA08SlJnM", "Mountain Climbers": "nmwgirgXLYM", "Bicycle Crunches": "9FGilxCbdz8", "Leg Raises": "JB2oyawG9KI", "Russian Twist": "wkD8rjkodUI", "Shoulder Press": "qEwKCR5JCog", "Bicep Curls": "ykJmrZ5v0Ou", "Lateral Raise": "3VcKaXpzqRo", "Deadlift": "op9kVnSso6Q", "Bench Press": "rT7DgCr-3pg", "Glute Bridge": "8bbE64NuDni", "Hip Thrust": "SEdqd1n0icg", "Shadow Boxing": "LqHO0P9P60k", "Jumping Jacks": "c4DAnQ6DtF8", "High Knees": "OAJ_J3EZkdY", "Wall Sit": "y-wV4Venusw", "Superman": "z6PJMT2y8GQ", "Dumbbell Row": "pYcpY20QaE8", "Tricep Dips": "0326dy_-CzM", "Hammer Curls": "zC3nLlEkdGo", "Calf Raises": "gwLzBJYoWlI", "Flutter Kicks": "ANVdMDaYRts",
};

// ── Ring Timer Component ──
function TimerRing({ seconds, total, size = 120, color = "#10b981" }) {
  const r = (size - 10) / 2, c = 2 * Math.PI * r;
  const pct = total > 0 ? seconds / total : 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .3s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "Rajdhani,sans-serif", color: "#f3f4f6" }}>{seconds}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>seconds</div>
      </div>
    </div>
  );
}

// ── Audio beep ──
function beep(freq = 800, dur = 0.12) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = freq; g.gain.value = 0.3;
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch { }
}

function victorySound() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.2), i * 120));
}

// ══════════════════════════════════════
// MAIN TRAINING PAGE
// ══════════════════════════════════════
export default function TrainingPage({ totalXP, addXP, workoutLog, setWorkoutLog, profile, masteryData, setMasteryData }) {
  const [phase, setPhase] = useState("home"); // home | warmup | workout | cooldown | rest | summary
  const [activity, setActivity] = useState("home");
  const [selParts, setSelParts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [exIdx, setExIdx] = useState(0);
  const [setData, setSetData] = useState({}); // { exIdx: [{ reps, weight, done }] }
  const [restTime, setRestTime] = useState(0);
  const [restTotal, setRestTotal] = useState(30);
  const [workoutStart, setWorkoutStart] = useState(null);
  const [workoutDone, setWorkoutDone] = useState(null);
  const [showMuscleMap, setShowMuscleMap] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [phaseExIdx, setPhaseExIdx] = useState(0); // for warmup/cooldown
  const [phaseTimer, setPhaseTimer] = useState(0);
  const [savedWorkouts, setSavedWorkouts] = useState(() => JSON.parse(localStorage.getItem("ignite-saved-workouts") || "[]"));
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [prRecords, setPrRecords] = useState(() => JSON.parse(localStorage.getItem("ignite-prs") || "{}"));
  const [newPRs, setNewPRs] = useState([]);
  const [tab, setTab] = useState("train"); // train | history | heatmap | saved
  const timerRef = useRef(null);
  const phaseTimerRef = useRef(null);
  const d = today();
  const todayW = workoutLog[d];

  // ── Generate Exercises ──
  const generateWorkout = useCallback((parts, act) => {
    let pool = [];
    if (act === "combat") pool = EXERCISES.combat || [];
    else if (act === "cardio") pool = EXERCISES.cardio || [];
    else if (act === "hiit") pool = EXERCISES.hiit || [];
    else {
      parts.forEach(p => { if (EXERCISES[p]) pool.push(...EXERCISES[p]); });
      if (pool.length === 0) pool = EXERCISES.full;
    }
    // Shuffle and pick 8-12
    const shuffled = [...new Set(pool)].sort(() => Math.random() - 0.5);
    const count = Math.min(shuffled.length, profile.dailyTime >= 45 ? 12 : profile.dailyTime >= 30 ? 10 : 8);
    return shuffled.slice(0, count).map(name => ({
      name, reps: name.includes("Plank") || name.includes("Wall Sit") ? "30s" : `${Math.floor(Math.random() * 5 + 10)}`,
      sets: 3, rest: 30,
    }));
  }, [profile]);

  // ── Start Workout ──
  const startWorkout = (exList) => {
    setExercises(exList || generateWorkout(selParts, activity));
    setExIdx(0);
    setSetData({});
    setWorkoutStart(Date.now());
    setWorkoutDone(null);
    setNewPRs([]);
    setPhase("warmup");
    setPhaseExIdx(0);
    setPhaseTimer(WARMUP[0]?.duration || 30);
  };

  const skipWarmup = () => { setPhase("workout"); };
  const skipCooldown = () => { finishWorkout(); };

  // ── Phase Timer (warmup/cooldown) ──
  useEffect(() => {
    if (phase !== "warmup" && phase !== "cooldown") return;
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    const items = phase === "warmup" ? WARMUP : COOLDOWN;
    phaseTimerRef.current = setInterval(() => {
      setPhaseTimer(prev => {
        if (prev <= 1) {
          beep(880, 0.15);
          if (phaseExIdx < items.length - 1) {
            setPhaseExIdx(pi => pi + 1);
            return items[phaseExIdx + 1]?.duration || 30;
          } else {
            clearInterval(phaseTimerRef.current);
            if (phase === "warmup") setPhase("workout");
            else finishWorkout();
            return 0;
          }
        }
        if (prev <= 4) beep(600, 0.08);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(phaseTimerRef.current);
  }, [phase, phaseExIdx]);

  // ── Rest Timer ──
  useEffect(() => {
    if (phase !== "rest") return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRestTime(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          beep(880, 0.2); setTimeout(() => beep(880, 0.2), 200); setTimeout(() => beep(1100, 0.3), 400);
          setPhase("workout");
          return 0;
        }
        if (prev <= 4) beep(600, 0.08);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // ── Log a Set ──
  const logSet = (reps, weight = 0) => {
    const key = exIdx;
    const newSet = { reps: parseInt(reps) || 0, weight: parseFloat(weight) || 0, done: true, time: Date.now() };
    setSetData(prev => {
      const existing = prev[key] || [];
      return { ...prev, [key]: [...existing, newSet] };
    });
    beep(660, 0.1);

    // Check PR
    const ex = exercises[exIdx];
    if (ex && weight > 0) {
      const prKey = ex.name;
      const currentPR = prRecords[prKey] || 0;
      if (weight > currentPR) {
        setPrRecords(prev => {
          const updated = { ...prev, [prKey]: weight };
          localStorage.setItem("ignite-prs", JSON.stringify(updated));
          return updated;
        });
        setNewPRs(prev => [...prev, { exercise: ex.name, weight, oldPR: currentPR }]);
        victorySound();
      }
    }

    // Auto-rest after completing target sets
    const setsNow = (setData[key]?.length || 0) + 1;
    if (setsNow >= (ex?.sets || 3)) {
      // Move to next exercise after rest
      if (exIdx < exercises.length - 1) {
        setRestTime(ex?.rest || 30);
        setRestTotal(ex?.rest || 30);
        setPhase("rest");
        setExIdx(prev => prev + 1);
      }
    }
  };

  // ── Swap Exercise ──
  const swapExercise = (newName) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[exIdx] = { ...updated[exIdx], name: newName };
      return updated;
    });
    setShowSwap(false);
  };

  // ── Finish Workout ──
  const finishWorkout = () => {
    const duration = Math.round((Date.now() - workoutStart) / 1000);
    const totalSets = Object.values(setData).reduce((s, arr) => s + arr.length, 0);
    const totalReps = Object.values(setData).flat().reduce((s, st) => s + (st.reps || 0), 0);
    const maxWeight = Math.max(0, ...Object.values(setData).flat().map(st => st.weight || 0));
    const calBurned = Math.round(duration * 0.15);
    const musclesWorked = [...new Set(exercises.flatMap(ex => getMusclesForExercise(ex.name)))];
    const xpEarned = Math.max(20, totalSets * 5 + Math.floor(duration / 60) * 3);

    const summary = {
      duration, totalSets, totalReps, maxWeight, calBurned, musclesWorked,
      exercises: exercises.map((ex, i) => ({ name: ex.name, sets: setData[i] || [] })),
      xpEarned, splitName: selParts.join(" + ") || activity, date: d,
    };

    setWorkoutDone(summary);
    setWorkoutLog(prev => ({ ...prev, [d]: { ...summary, calBurned, splitName: summary.splitName, duration } }));
    addXP(xpEarned, "Workout Complete");

    // Update mastery
    const mData = { ...(masteryData || {}) };
    exercises.forEach(ex => {
      const k = ex.name.replace(/\s+/g, "_").toLowerCase();
      mData[k] = (mData[k] || 0) + 1;
    });
    setMasteryData(mData);

    // Update weekly muscle data
    const weekMuscles = JSON.parse(localStorage.getItem("ignite-week-muscles") || "{}");
    weekMuscles[d] = musclesWorked;
    localStorage.setItem("ignite-week-muscles", JSON.stringify(weekMuscles));

    setPhase("summary");
    victorySound();
  };

  // ── Save Workout Template ──
  const saveWorkout = () => {
    if (!saveName.trim()) return;
    const template = { name: saveName, exercises: exercises.map(e => ({ ...e })), activity, parts: selParts, created: d };
    const updated = [...savedWorkouts, template];
    setSavedWorkouts(updated);
    localStorage.setItem("ignite-saved-workouts", JSON.stringify(updated));
    setShowSaveModal(false);
    setSaveName("");
  };

  const deleteTemplate = (idx) => {
    const updated = savedWorkouts.filter((_, i) => i !== idx);
    setSavedWorkouts(updated);
    localStorage.setItem("ignite-saved-workouts", JSON.stringify(updated));
  };

  // ── Weekly Muscle Heatmap Data ──
  const weekMuscleData = useMemo(() => {
    const data = JSON.parse(localStorage.getItem("ignite-week-muscles") || "{}");
    const allMuscles = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const ds = dt.toISOString().split("T")[0];
      if (data[ds]) allMuscles.push(...data[ds]);
    }
    return [...new Set(allMuscles)];
  }, [workoutLog]);

  // ── Previous workout data for progressive overload ──
  const getPrevData = (exName) => {
    const logs = Object.entries(workoutLog).filter(([k]) => k !== d).sort((a, b) => b[0].localeCompare(a[0]));
    for (const [, log] of logs) {
      if (log.exercises) {
        const found = log.exercises.find(e => e.name === exName);
        if (found && found.sets?.length > 0) return found.sets;
      }
    }
    return null;
  };

  const curEx = exercises[exIdx];
  const curMuscles = curEx ? getMusclesForExercise(curEx.name) : [];
  const curTip = curEx ? getFormTip(curEx.name) : null;
  const curSwaps = curEx ? getSwapOptions(curEx.name) : [];
  const curSets = setData[exIdx] || [];
  const prevSets = curEx ? getPrevData(curEx.name) : null;
  const curPR = curEx ? (prRecords[curEx.name] || 0) : 0;

  // ══════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════
  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>

      {/* ══ HOME SCREEN ══ */}
      {phase === "home" && (
        <div className="fade-in">
          {/* Today's status */}
          {todayW && (
            <div className="gs" style={{ marginBottom: 16, border: "1px solid rgba(16,185,129,.15)", background: "rgba(16,185,129,.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>✅</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#22c55e", fontFamily: "Rajdhani,sans-serif" }}>Today's Training Complete</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{todayW.splitName} · {todayW.calBurned || 0} cal · {Math.floor((todayW.duration || 0) / 60)}min</div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
            {[["train", "⚔️ Train"], ["saved", `💾 Saved (${savedWorkouts.length})`], ["heatmap", "🫁 Muscles"], ["history", "📋 History"]].map(([k, l]) => (
              <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ flexShrink: 0 }}>{l}</span>
            ))}
          </div>

          {/* ── TRAIN TAB ── */}
          {tab === "train" && (
            <div>
              {/* Activity selector */}
              <div className="sl">Activity</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
                {ACTIVITIES.map(a => (
                  <div key={a.id} onClick={() => setActivity(a.id)}
                    className={activity === a.id ? "chip chip-a" : "chip chip-i"}
                    style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderColor: activity === a.id ? a.color + "40" : undefined, color: activity === a.id ? a.color : undefined }}>
                    <span>{a.icon}</span> {a.name}
                  </div>
                ))}
              </div>

              {/* Body parts */}
              {!["combat", "cardio", "hiit", "swim", "yoga", "stretch"].includes(activity) && (
                <>
                  <div className="sl">Target Muscles</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(85px, 1fr))", gap: 8, marginBottom: 16 }}>
                    {BODY_PARTS.map(bp => (
                      <div key={bp.id} onClick={() => setSelParts(p => p.includes(bp.id) ? p.filter(x => x !== bp.id) : [...p, bp.id])}
                        className={selParts.includes(bp.id) ? "chip chip-a" : "gc"}
                        style={{ textAlign: "center", padding: 12, cursor: "pointer" }}>
                        <div style={{ fontSize: 22 }}>{bp.icon}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>{bp.name}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Start button */}
              <button className="bp" onClick={() => startWorkout()} disabled={!["combat", "cardio", "hiit", "swim", "yoga", "stretch"].includes(activity) && selParts.length === 0}
                style={{ width: "100%", padding: 16, fontSize: 18, fontWeight: 800, fontFamily: "Rajdhani,sans-serif", letterSpacing: 2, marginBottom: 16 }}>
                ⚔️ START WORKOUT
              </button>
            </div>
          )}

          {/* ── SAVED WORKOUTS TAB ── */}
          {tab === "saved" && (
            <div>
              {savedWorkouts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#6b7280", fontSize: 13 }}>No saved workouts yet. Complete a workout and save it as a template!</div>
              ) : savedWorkouts.map((sw, i) => (
                <div key={i} className="gs" style={{ marginBottom: 8, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{sw.name}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{sw.exercises.length} exercises · {sw.parts?.join(", ") || sw.activity}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="bp" onClick={() => startWorkout(sw.exercises)} style={{ padding: "8px 14px", fontSize: 12 }}>Start</button>
                      <button onClick={() => deleteTemplate(i)} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: 16 }}>×</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── MUSCLE HEATMAP TAB ── */}
          {tab === "heatmap" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>This Week's Muscle Coverage</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{weekMuscleData.length} muscle groups trained</div>
              </div>
              <div className="gs" style={{ padding: 16, display: "flex", justifyContent: "center" }}>
                <MuscleMap muscles={weekMuscleData} size={220} showLabels={true} />
              </div>
              {weekMuscleData.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12, justifyContent: "center" }}>
                  {weekMuscleData.map(m => (
                    <span key={m} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 100, background: "rgba(16,185,129,.08)", color: "#10b981", border: "1px solid rgba(16,185,129,.15)" }}>{m}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {tab === "history" && (
            <div>
              {Object.entries(workoutLog).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 15).map(([date, w]) => (
                <div key={date} className="gs" style={{ marginBottom: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{w.splitName || "Training"}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" })}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600 }}>{w.calBurned || 0} cal</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{Math.floor((w.duration || 0) / 60)}m {(w.duration || 0) % 60}s</div>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(workoutLog).length === 0 && <div style={{ textAlign: "center", padding: 30, color: "#6b7280", fontSize: 13 }}>No workouts logged yet.</div>}
            </div>
          )}
        </div>
      )}

      {/* ══ WARM-UP PHASE ══ */}
      {phase === "warmup" && (
        <div className="slide-up" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>🔥 WARM-UP</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 4 }}>{WARMUP[phaseExIdx]?.icon} {WARMUP[phaseExIdx]?.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>{phaseExIdx + 1} / {WARMUP.length}</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <TimerRing seconds={phaseTimer} total={WARMUP[phaseExIdx]?.duration || 30} color="#f59e0b" />
          </div>
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 20 }}>
            {WARMUP.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= phaseExIdx ? "#f59e0b" : "rgba(255,255,255,.08)" }} />)}
          </div>
          <button className="bg" onClick={skipWarmup} style={{ padding: "10px 24px" }}>Skip Warm-up →</button>
        </div>
      )}

      {/* ══ ACTIVE WORKOUT ══ */}
      {phase === "workout" && curEx && (
        <div className="slide-up">
          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${((exIdx + 1) / exercises.length) * 100}%`, background: "linear-gradient(90deg,#10b981,#06b6d4)", borderRadius: 2, transition: "width .5s" }} />
            </div>
            <span style={{ fontSize: 11, color: "#6b7280", flexShrink: 0 }}>{exIdx + 1}/{exercises.length}</span>
          </div>

          {/* Exercise Card */}
          <div className="gs" style={{ padding: 16, marginBottom: 12, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#10b981,#06b6d4)" }} />

            {/* Title + Swap */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{curEx.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{curEx.sets} sets × {curEx.reps} reps · Rest {curEx.rest}s</div>
              </div>
              {curSwaps.length > 0 && (
                <button onClick={() => setShowSwap(!showSwap)} style={{ background: "none", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: "6px 10px", color: "#6b7280", fontSize: 11, cursor: "pointer" }}>🔄 Swap</button>
              )}
            </div>

            {/* Swap options */}
            {showSwap && (
              <div className="fade-in" style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                {curSwaps.map(s => (
                  <span key={s} onClick={() => swapExercise(s)} className="chip chip-i" style={{ cursor: "pointer", fontSize: 11 }}>{s}</span>
                ))}
              </div>
            )}

            {/* YouTube thumbnail */}
            {YOUTUBE_MAP[curEx.name] && (
              <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 12, aspectRatio: "16/9", background: "#111" }}>
                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${YOUTUBE_MAP[curEx.name]}?rel=0`}
                  frameBorder="0" allowFullScreen style={{ border: "none" }} title={curEx.name} />
              </div>
            )}

            {/* Muscle Map toggle */}
            <div onClick={() => setShowMuscleMap(!showMuscleMap)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(16,185,129,.04)", border: "1px solid rgba(16,185,129,.1)", cursor: "pointer", marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>🫁</span>
              <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>Muscles: {curMuscles.join(", ")}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "#6b7280" }}>{showMuscleMap ? "▾" : "▸"}</span>
            </div>

            {showMuscleMap && (
              <div className="fade-in" style={{ marginBottom: 12 }}>
                <MuscleMap muscles={curMuscles} size={160} />
              </div>
            )}

            {/* Form tip */}
            {curTip && showTip && (
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(245,158,11,.04)", border: "1px solid rgba(245,158,11,.1)", marginBottom: 12, fontSize: 12, color: "#fbbf24" }}>
                💡 <strong>Form:</strong> {curTip}
              </div>
            )}

            {/* Progressive Overload — prev data */}
            {prevSets && (
              <div style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(6,182,212,.04)", border: "1px solid rgba(6,182,212,.1)", marginBottom: 12, fontSize: 11, color: "#06b6d4" }}>
                📈 Last time: {prevSets.map((s, i) => `${s.reps}×${s.weight || 0}kg`).join(" / ")}
                {curPR > 0 && <span style={{ marginLeft: 8, color: "#f59e0b" }}>🏆 PR: {curPR}kg</span>}
              </div>
            )}

            {/* Set Logger */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f3f4f6", marginBottom: 8, fontFamily: "Rajdhani,sans-serif" }}>LOG SETS</div>
              {curSets.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0", fontSize: 12, color: "#22c55e" }}>
                  <span style={{ width: 20 }}>✓</span>
                  <span>Set {i + 1}: {s.reps} reps{s.weight > 0 ? ` × ${s.weight}kg` : ""}</span>
                  {prevSets?.[i] && s.weight > (prevSets[i].weight || 0) && <span style={{ color: "#22c55e" }}>↑</span>}
                  {prevSets?.[i] && s.weight < (prevSets[i].weight || 0) && <span style={{ color: "#ef4444" }}>↓</span>}
                </div>
              ))}

              {curSets.length < (curEx.sets || 3) && (
                <SetLogger onLog={logSet} setNum={curSets.length + 1} targetReps={curEx.reps} prevWeight={prevSets?.[curSets.length]?.weight || curSets[curSets.length - 1]?.weight || 0} />
              )}

              {curSets.length >= (curEx.sets || 3) && (
                <div style={{ textAlign: "center", padding: 8, color: "#22c55e", fontSize: 13, fontWeight: 600 }}>✅ All sets complete!</div>
              )}
            </div>
          </div>

          {/* Exercise dots */}
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 12, flexWrap: "wrap" }}>
            {exercises.map((_, i) => (
              <div key={i} onClick={() => { setExIdx(i); setShowSwap(false); }}
                style={{ width: i === exIdx ? 20 : 8, height: 8, borderRadius: 4, background: i < exIdx ? "#22c55e" : i === exIdx ? "#10b981" : "rgba(255,255,255,.08)", cursor: "pointer", transition: "all .3s" }} />
            ))}
          </div>

          {/* Nav buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {exIdx > 0 && <button className="bg" onClick={() => { setExIdx(exIdx - 1); setShowSwap(false); }} style={{ padding: "12px 16px" }}>← Prev</button>}
            {exIdx < exercises.length - 1 ? (
              <button className="bp" onClick={() => { setRestTime(curEx.rest || 30); setRestTotal(curEx.rest || 30); setPhase("rest"); setExIdx(exIdx + 1); }} style={{ flex: 1, padding: 14, fontSize: 15 }}>
                Next Exercise →
              </button>
            ) : (
              <button className="bp" onClick={() => { setPhase("cooldown"); setPhaseExIdx(0); setPhaseTimer(COOLDOWN[0]?.duration || 30); }}
                style={{ flex: 1, padding: 14, fontSize: 15, background: "linear-gradient(135deg,#22c55e,#10b981)" }}>
                🏁 Finish → Cool Down
              </button>
            )}
          </div>

          {/* Save template button */}
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <span onClick={() => setShowSaveModal(true)} style={{ fontSize: 12, color: "#6b7280", cursor: "pointer" }}>💾 Save as template</span>
          </div>

          {/* Save Modal */}
          {showSaveModal && (
            <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.7)" }}>
              <div className="gs fade-in" style={{ padding: 24, maxWidth: 320, width: "90%" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 12 }}>💾 Save Workout</div>
                <input className="inp" placeholder="Workout name..." value={saveName} onChange={e => setSaveName(e.target.value)} style={{ marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="bp" onClick={saveWorkout} style={{ flex: 1, padding: 12 }}>Save</button>
                  <button className="bg" onClick={() => setShowSaveModal(false)} style={{ padding: "12px 16px" }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ REST TIMER ══ */}
      {phase === "rest" && (
        <div className="fade-in" style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: 2, marginBottom: 8 }}>REST</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <TimerRing seconds={restTime} total={restTotal} />
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 6 }}>Next up:</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 20 }}>{exercises[exIdx]?.name}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="bg" onClick={() => setRestTime(r => Math.max(0, r - 10))} style={{ padding: "8px 16px" }}>-10s</button>
            <button className="bp" onClick={() => { clearInterval(timerRef.current); setPhase("workout"); }} style={{ padding: "8px 24px" }}>Skip Rest</button>
            <button className="bg" onClick={() => setRestTime(r => r + 10)} style={{ padding: "8px 16px" }}>+10s</button>
          </div>
        </div>
      )}

      {/* ══ COOL-DOWN PHASE ══ */}
      {phase === "cooldown" && (
        <div className="slide-up" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#8b5cf6", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>🧘 COOL DOWN</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 4 }}>{COOLDOWN[phaseExIdx]?.icon} {COOLDOWN[phaseExIdx]?.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>{phaseExIdx + 1} / {COOLDOWN.length}</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <TimerRing seconds={phaseTimer} total={COOLDOWN[phaseExIdx]?.duration || 30} color="#8b5cf6" />
          </div>
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 20 }}>
            {COOLDOWN.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= phaseExIdx ? "#8b5cf6" : "rgba(255,255,255,.08)" }} />)}
          </div>
          <button className="bg" onClick={skipCooldown} style={{ padding: "10px 24px" }}>Skip → Finish</button>
        </div>
      )}

      {/* ══ POST-WORKOUT SUMMARY ══ */}
      {phase === "summary" && workoutDone && (
        <div className="slide-up" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "Rajdhani,sans-serif", background: "linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>WORKOUT COMPLETE!</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>{workoutDone.splitName}</div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              ["⏱", `${Math.floor(workoutDone.duration / 60)}m ${workoutDone.duration % 60}s`, "Duration"],
              ["🔥", `${workoutDone.calBurned}`, "Calories"],
              ["💪", `${workoutDone.totalSets}`, "Total Sets"],
              ["🔄", `${workoutDone.totalReps}`, "Total Reps"],
              ["⚡", `+${workoutDone.xpEarned}`, "XP Earned"],
              ["🏋️", `${workoutDone.maxWeight > 0 ? workoutDone.maxWeight + "kg" : "—"}`, "Max Weight"],
            ].map(([icon, val, label]) => (
              <div key={label} className="gc" style={{ padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{icon}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{val}</div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* New PRs */}
          {newPRs.length > 0 && (
            <div className="gs" style={{ marginBottom: 16, border: "1px solid rgba(245,158,11,.2)", background: "rgba(245,158,11,.04)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>🏆 New Personal Records!</div>
              {newPRs.map((pr, i) => (
                <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 4 }}>
                  {pr.exercise}: {pr.weight}kg {pr.oldPR > 0 ? `(was ${pr.oldPR}kg)` : "(first PR!)"}
                </div>
              ))}
            </div>
          )}

          {/* Muscles worked */}
          <div className="gs" style={{ marginBottom: 16, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", marginBottom: 10, fontFamily: "Rajdhani,sans-serif" }}>MUSCLES WORKED</div>
            <MuscleMap muscles={workoutDone.musclesWorked} size={180} showLabels={true} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="bp" onClick={() => { setPhase("home"); setTab("train"); }} style={{ flex: 1, padding: 14 }}>Done</button>
            <button className="bg" onClick={() => setShowSaveModal(true)} style={{ padding: "14px 18px" }}>💾 Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Set Logger Sub-component ──
function SetLogger({ onLog, setNum, targetReps, prevWeight }) {
  const [reps, setReps] = useState(targetReps?.toString().replace("s", "") || "12");
  const [weight, setWeight] = useState(prevWeight?.toString() || "0");

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
      <span style={{ fontSize: 11, color: "#6b7280", width: 36, flexShrink: 0 }}>Set {setNum}</span>
      <input className="inp" type="number" value={reps} onChange={e => setReps(e.target.value)}
        placeholder="Reps" style={{ flex: 1, padding: 8, fontSize: 14, textAlign: "center" }} />
      <span style={{ fontSize: 10, color: "#4b5563" }}>×</span>
      <input className="inp" type="number" value={weight} onChange={e => setWeight(e.target.value)}
        placeholder="kg" style={{ flex: 1, padding: 8, fontSize: 14, textAlign: "center" }} />
      <button className="bp" onClick={() => { onLog(reps, weight); setReps(targetReps?.toString().replace("s", "") || "12"); }}
        style={{ padding: "8px 14px", fontSize: 12, flexShrink: 0 }}>✓</button>
    </div>
  );
}