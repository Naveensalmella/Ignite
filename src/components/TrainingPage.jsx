"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { requestWakeLock, releaseWakeLock } from './wakeLock';
import { today } from '@/utils';
import { AnimatedCard, StaggerContainer, StaggerItem } from './PageTransition';
import { useState as useStateLocal } from 'react';
let Body3D = null;
try { Body3D = require('./Body3D').default; } catch { }
import MuscleMap, { getMusclesForExercise } from './MuscleMap';
import { getFormTip, getSwapOptions, WARMUP, COOLDOWN } from '../data/exerciseMeta';
import { localSync } from '@/utils/localSync';
import { GYM_PROGRAMS, COMBAT_PROGRAMS, getTodayWorkout } from '../data/trainingPrograms';
import { FITNESS_PROGRAMS, PROGRAM_TAGS, getRecommendedPrograms, adjustForProfile } from '../data/fitnessPrograms';
import TrainingHome from './TrainingHome';

// ── YouTube Map ──
const YT = {
  "Push Ups": "IODxDxX7oi4", "Wide Push Ups": "pfPvBWSIBcQ", "Diamond Push Ups": "J0DnG1_S3lg", "Pull Ups": "eGo4IYlbE5g", "Chin Ups": "brhRXlOhWAM", "Squats": "aclHkVaku9U", "Jump Squats": "A-cFYGvaxi8", "Lunges": "QOVaHwm-Q6U", "Plank": "ASdvN_XEl_c", "Crunches": "Xyd_fa5zoEU", "Burpees": "JZQA08SlJnM", "Mountain Climbers": "nmwgirgXLYM", "Bicycle Crunches": "9FGilxCbdz8", "Leg Raises": "JB2oyawG9KI", "Russian Twist": "wkD8rjkodUI", "Shoulder Press": "qEwKCR5JCog", "Lateral Raise": "3VcKaXpzqRo", "Deadlift": "op9kVnSso6Q", "Bench Press": "rT7DgCr-3pg", "Glute Bridge": "8bbE64NuDni", "Shadow Boxing": "LqHO0P9P60k", "Jumping Jacks": "c4DAnQ6DtF8", "High Knees": "OAJ_J3EZkdY", "Wall Sit": "y-wV4Venusw", "Superman": "z6PJMT2y8GQ", "Dumbbell Row": "pYcpY20QaE8", "Tricep Dips": "0326dy_-CzM", "Hammer Curls": "zC3nLlEkdGo", "Calf Raises": "gwLzBJYoWlI", "Flutter Kicks": "ANVdMDaYRts", "Romanian Deadlift": "jEy_czb3RKA", "Hip Thrust": "SEdqd1n0icg", "Bent Over Row": "FWJR5Ve8bnQ", "Lat Pulldown": "CAwf7n6Luuc", "Dumbbell Press": "VmB1G1K7v94", "Tricep Extension": "nRiJVZDpdL0", "Bicep Curls": "ykJmrZ5v0Ou", "Pike Push Ups": "sposDXWEB0A", "Bulgarian Split Squat": "2C-uNgKwPLE", "Skull Crushers": "d_KZxkY_0cM", "Arnold Press": "6Z15_WdXmVw",
};


const YOGA_YT = {
  "Sun Salutation A": "73sjOu0g58M", "Sun Salutation B": "IEwQkwJh5rk", "Downward Dog": "EC7RGJ975iM", "Warrior I": "k4qaVoAbeHM", "Warrior II": "QdN7JBfMVLw", "Triangle Pose": "S6gB0QHbWFE", "Tree Pose": "wdln9qWYloU", "Eagle Pose": "JEVLkn7yO7Q", "Chair Pose": "pZ77IHiV0WM", "Pigeon Pose": "_9tP1W4wx2c", "Child's Pose": "eqVMAPM00DM", "Cobra Stretch": "JDcdhTuycOI", "Bridge Pose": "OhDrMyOJxSc", "Cat-Cow Stretch": "kqnua4rHVVA", "Seated Twist": "NFYZ5-TyBdg", "Happy Baby Pose": "JRGhTPbhVzA", "Camel Pose": "dp4sZ2Oav7I", "Boat Pose": "QsM-IeC5kPA", "Forward Fold": "g7Uhp5tphAs", "Plank": "ASdvN_XEl_c", "Mountain Pose": "2HTvZp5rPrg",
  "Hip Flexor Stretch": "YQmpO9DPcjY", "Hamstring Stretch": "FDwpOxHkBCk", "Quad Stretch": "2NgrkkRl1cg", "Calf Stretch": "wjx6gYR5FkE", "Shoulder Stretch": "QzVJMnbCqPo", "Chest Stretch": "6oUNRSfJvKo", "Frog Stretch": "0SuC36FGdK4", "Pigeon Pose": "_9tP1W4wx2c", "Butterfly Stretch": "iLEt9Z9tDqo",
  "Wall Angels": "M_ooIhKYs7c", "Chin Tucks": "wQylqaCl8Zo", "Bird Dog": "wiFNA3sqjCA", "Dead Bug": "I5xbsAIGfkQ", "Thoracic Extension": "SxQkjGkBM9o",
};
Object.assign(YT, YOGA_YT);

// ── Timer Ring ──
function TimerRing({ seconds, total, size = 120, color = "#10b981" }) { const r = (size - 10) / 2, c = 2 * Math.PI * r, pct = total > 0 ? seconds / total : 0; return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8" /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" style={{ transition: "stroke-dashoffset .3s" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 36, fontWeight: 900, fontFamily: "Rajdhani,sans-serif", color: "#f3f4f6" }}>{seconds}</div><div style={{ fontSize: 11, color: "#6b7280" }}>seconds</div></div></div>) }

// ── Audio ──
function beep(f = 800, d = .12) { try { const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.value = .3; g.gain.exponentialRampToValueAtTime(.001, c.currentTime + d); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + d) } catch { } }
function victorySound() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, .2), i * 120)) }

// ── Set Logger ──
function SetLogger({ onLog, setNum, targetReps, prevWeight }) {
  const [r, setR] = useState(targetReps?.toString().replace(/[^\d]/g, "") || "12"); const [w, setW] = useState(prevWeight?.toString() || "0"); return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
      <span style={{ fontSize: 11, color: "#6b7280", width: 36, flexShrink: 0 }}>Set {setNum}</span>
      <input className="inp" type="number" value={r} onChange={e => setR(e.target.value)} placeholder="Reps" style={{ flex: 1, padding: 8, fontSize: 14, textAlign: "center" }} />
      <span style={{ fontSize: 10, color: "#4b5563" }}>×</span>
      <input className="inp" type="number" value={w} onChange={e => setW(e.target.value)} placeholder="kg" style={{ flex: 1, padding: 8, fontSize: 14, textAlign: "center" }} />
      <button className="bp" onClick={() => { onLog(r, w); setR(targetReps?.toString().replace(/[^\d]/g, "") || "12") }} style={{ padding: "8px 14px", fontSize: 12, flexShrink: 0 }}>✓</button>
    </div>)
}

// ══════════════════════════════════════
// MAIN TRAINING PAGE
// ══════════════════════════════════════
export default function TrainingPage({ totalXP = 0, addXP = () => { }, workoutLog = {}, setWorkoutLog = () => { }, profile = {}, masteryData = {}, setMasteryData = () => { }, programState = {}, setProgramState = () => { } }) {
  const d = today();
  const todayW = workoutLog[d];
  // Program state (persisted)
  const ps = programState || {};
  const activeId = ps.activeProgram || null;
  const startDate = ps.startDate || null;
  const completedDays = ps.completedDays || [];
  const exerciseWeights = ps.exerciseWeights || {};
  const combatWeek = ps.combatWeek || 0;

  // Local UI state
  const [phase, setPhase] = useState("home");
  const [exercises, setExercises] = useState([]);
  const [exIdx, setExIdx] = useState(0);
  const [setData, setSetData] = useState({});
  const [restTime, setRestTime] = useState(0);
  const [restTotal, setRestTotal] = useState(30);
  const [workoutStart, setWorkoutStart] = useState(null);
  const [workoutDone, setWorkoutDone] = useState(null);
  const [showMuscleMap, setShowMuscleMap] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [phaseExIdx, setPhaseExIdx] = useState(0);
  const [phaseTimer, setPhaseTimer] = useState(0);
  const prSync = useMemo(() => localSync("ignite-prs", {}), []);
  const [prRecords, setPrRecords] = useState(prSync.get);
  const [newPRs, setNewPRs] = useState([]);
  const [difficultyRating, setDifficultyRating] = useState(0);
  const [timedActive, setTimedActive] = useState(false);
  const [timedSeconds, setTimedSeconds] = useState(0);
  const [timedTotal, setTimedTotal] = useState(0);
  const [tab, setTab] = useState("today");
  const [runTimerActive, setRunTimerActive] = useState(false);
  const [runElapsed, setRunElapsed] = useState(0);
  const [runTarget, setRunTarget] = useState(0);
  const runRef = useRef(null);
  const [setupStep, setSetupStep] = useState(0);
  const [setupGoal, setSetupGoal] = useState("");
  const [setupLevel, setSetupLevel] = useState("");
  const [setupType, setSetupType] = useState("");
  const [combatArt, setCombatArt] = useState("");
  const timerRef = useRef(null);
  const phaseTimerRef = useRef(null);
  const timedRef = useRef(null);

  // ── Running Timer ──
  useEffect(() => {
    if (!runTimerActive) return;
    if (runRef.current) clearInterval(runRef.current);
    runRef.current = setInterval(() => setRunElapsed(p => p + 1), 1000);
    return () => clearInterval(runRef.current);
  }, [runTimerActive]);

  const startRunTimer = (targetMin) => { setRunTarget(targetMin * 60); setRunElapsed(0); setRunTimerActive(true) };
  const stopRunTimer = () => { setRunTimerActive(false); clearInterval(runRef.current) };
  const fmtTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Derived program data ──
  const activeProgram = useMemo(() => {
    if (!activeId) return null;
    return GYM_PROGRAMS[activeId] || COMBAT_PROGRAMS[activeId] || FITNESS_PROGRAMS[activeId] || null;
  }, [activeId]);

  const currentWeek = useMemo(() => {
    if (!startDate) return 0;
    const diff = Math.floor((new Date() - new Date(startDate)) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(0, diff);
  }, [startDate]);

  const currentDayInWeek = useMemo(() => {
    return new Date().getDay(); // 0=Sun
  }, []);

  // ── Program Completion Check ──
  const isProgramComplete = activeProgram && (activeProgram.curriculum ? (combatWeek >= activeProgram.curriculum.length - 1 && completedDays.length >= activeProgram.curriculum.length * activeProgram.daysPerWeek) : (currentWeek >= parseInt((activeProgram.phases?.[activeProgram.phases.length - 1]?.weeks || "1-12").split("-")[1] || 12)));

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // ── Wake Lock (screen stays on during workout) ──
  useEffect(() => {
    if (activeProgram && !todayW) { requestWakeLock(); }
    return () => releaseWakeLock();
  }, [activeProgram, todayW]);
  const todayName = dayNames[currentDayInWeek];

  const isRestDay = useMemo(() => {
    if (!activeProgram) return false;
    if (activeProgram.restDays) return activeProgram.restDays.includes(todayName);
    if (activeProgram.schedule) return !activeProgram.schedule.includes(todayName);
    return false;
  }, [activeProgram, todayName]);

  const todaysTraining = useMemo(() => {
    if (!activeProgram) return null;
    if (activeProgram.curriculum) {
      const wk = Math.min(combatWeek, activeProgram.curriculum.length - 1);
      return { type: "combat", week: activeProgram.curriculum[wk], weekNum: wk + 1, totalWeeks: activeProgram.curriculum.length };
    }
    const scheduleDays = activeProgram.schedule || [];
    const dayIdx = scheduleDays.indexOf(todayName);
    if (dayIdx < 0) return null;
    const phase = activeProgram.phases.find(p => { const m = p.weeks.match(/(\d+)-(\d+)/); return m && currentWeek >= (parseInt(m[1]) - 1) && currentWeek <= (parseInt(m[2]) - 1) }) || activeProgram.phases[0];
    if (!phase) return null;
    // Alternate pattern across weeks
    const totalDaysSoFar = currentWeek * scheduleDays.length + dayIdx;
    const patternIdx = totalDaysSoFar % phase.weekPattern.length;
    const dayKey = phase.weekPattern[patternIdx];
    const isDeload = activeProgram.deloadEvery && (currentWeek + 1) % activeProgram.deloadEvery === 0;
    return { type: "gym", phase: phase.name, focus: phase.focus, day: phase.days[dayKey], isDeload, dayKey, weekNum: currentWeek + 1 };
  }, [activeProgram, currentWeek, todayName, combatWeek]);

  // ── Progressive Overload: get suggested weight ──
  const getSuggestedWeight = (exName) => {
    const last = exerciseWeights[exName];
    if (!last) return 0;
    // Find progression rule from program
    if (todaysTraining?.day?.exercises) {
      const ex = todaysTraining.day.exercises.find(e => e.name === exName);
      if (ex?.progression) {
        const match = ex.progression.match(/\+(\d+\.?\d*)/);
        if (match) return Math.round((last + parseFloat(match[1])) * 10) / 10;
      }
    }
    return last;
  };

  // ── Save program state ──
  const updatePS = (updates) => setProgramState(prev => ({ ...prev, ...updates }));

  // ── Select Program ──
  const selectProgram = (id) => {
    const isCombat = !!COMBAT_PROGRAMS[id];
    updatePS({ activeProgram: id, startDate: d, completedDays: [], exerciseWeights: {}, combatWeek: 0 });
    setSetupStep(0);
    setPhase("home");
    setTab("today");
  };

  // ── Start Today's Gym Workout ──
  const startGymWorkout = (dayData, isDeload) => {
    const exList = dayData.exercises.map(ex => ({
      name: ex.name,
      sets: isDeload ? Math.max(2, ex.sets - 1) : ex.sets,
      reps: ex.reps,
      rest: ex.rest,
      progression: ex.progression,
      suggestedWeight: getSuggestedWeight(ex.name),
    }));
    setExercises(exList);
    setExIdx(0); setSetData({}); setWorkoutStart(Date.now()); setWorkoutDone(null); setNewPRs([]);
    setPhase("warmup"); setPhaseExIdx(0); setPhaseTimer(WARMUP[0]?.duration || 30);
  };

  // ── Start Combat Drill Session ──
  const startCombatSession = (weekData) => {
    const drills = weekData.drills.map(dr => ({ name: dr.name, reps: dr.duration || "3 min", sets: 1, rest: 30, desc: dr.desc }));
    const cond = weekData.conditioning.map(c => ({ name: c.name, reps: c.reps, sets: c.sets, rest: c.rest }));
    setExercises([...drills, ...cond]);
    setExIdx(0); setSetData({}); setWorkoutStart(Date.now()); setWorkoutDone(null); setNewPRs([]);
    setPhase("warmup"); setPhaseExIdx(0); setPhaseTimer(WARMUP[0]?.duration || 30);
  };

  // ── Phase Timer ──
  useEffect(() => {
    if (phase !== "warmup" && phase !== "cooldown") return;
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    const items = phase === "warmup" ? WARMUP : COOLDOWN;
    phaseTimerRef.current = setInterval(() => {
      setPhaseTimer(prev => {
        if (prev <= 1) { beep(880, .15); if (phaseExIdx < items.length - 1) { setPhaseExIdx(pi => pi + 1); return items[phaseExIdx + 1]?.duration || 30 } else { clearInterval(phaseTimerRef.current); if (phase === "warmup") setPhase("workout"); else finishWorkout(); return 0 } }
        if (prev <= 4) beep(600, .08); return prev - 1;
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
        if (prev <= 1) { clearInterval(timerRef.current); beep(880, .2); setTimeout(() => beep(1100, .3), 200); setPhase("workout"); return 0 }
        if (prev <= 4) beep(600, .08); return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // ── Timed Exercise Timer ──
  useEffect(() => {
    if (!timedActive) return;
    if (timedRef.current) clearInterval(timedRef.current);
    timedRef.current = setInterval(() => {
      setTimedSeconds(prev => {
        if (prev <= 1) { clearInterval(timedRef.current); setTimedActive(false); beep(880, .2); setTimeout(() => beep(1100, .3), 200); logSet(timedTotal, 0); return 0 }
        if (prev <= 4) beep(600, .08); return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timedRef.current);
  }, [timedActive]);

  const isTimedEx = (ex) => { if (!ex) return false; const n = ex.name.toLowerCase(), r = (ex.reps || "").toString(); return r.includes("s") || r.includes("min") || n.includes("plank") || n.includes("wall sit") || n.includes("hold") || n.includes("stretch") };
  const getTimedDur = (ex) => { if (!ex) return 30; const r = (ex.reps || "").toString(); const m = r.match(/(\d+)/); return m ? parseInt(m[1]) : 30 };

  // ── Log Set ──
  const logSet = (reps, weight = 0) => {
    const key = exIdx;
    const w = parseFloat(weight) || 0;
    setSetData(prev => ({ ...prev, [key]: [...(prev[key] || []), { reps: parseInt(reps) || 0, weight: w, done: true }] }));
    beep(660, .1);
    const ex = exercises[exIdx];
    if (ex && w > 0) {
      updatePS({ exerciseWeights: { ...exerciseWeights, [ex.name]: w } });
      const currentPR = prRecords[ex.name] || 0;
      if (w > currentPR) {
        setPrRecords(prev => { const u = { ...prev, [ex.name]: w }; prSync.set(u); return u });
        setNewPRs(prev => [...prev, { exercise: ex.name, weight: w, oldPR: currentPR }]);
        victorySound();
      }
    }
    const setsNow = (setData[key]?.length || 0) + 1;
    if (setsNow >= (ex?.sets || 3) && exIdx < exercises.length - 1) {
      setRestTime(ex?.rest || 30); setRestTotal(ex?.rest || 30); setPhase("rest"); setExIdx(prev => prev + 1);
    }
  };

  // ── Swap Exercise ──
  const swapExercise = (newName) => { setExercises(prev => { const u = [...prev]; u[exIdx] = { ...u[exIdx], name: newName }; return u }); setShowSwap(false) };

  // ── Finish Workout ──
  const finishWorkout = () => {
    const duration = Math.round((Date.now() - workoutStart) / 1000);
    const totalSets = Object.values(setData).reduce((s, a) => s + a.length, 0);
    const totalReps = Object.values(setData).flat().reduce((s, st) => s + (st.reps || 0), 0);
    const maxWeight = Math.max(0, ...Object.values(setData).flat().map(st => st.weight || 0));
    const calBurned = Math.round(duration * .15);
    const musclesWorked = [...new Set(exercises.flatMap(ex => getMusclesForExercise(ex.name)))];
    const xpEarned = Math.max(20, totalSets * 5 + Math.floor(duration / 60) * 3);
    const splitName = todaysTraining?.day?.name || todaysTraining?.week?.title || "Training";
    const summary = { duration, totalSets, totalReps, maxWeight, calBurned, musclesWorked, exercises: exercises.map((ex, i) => ({ name: ex.name, sets: setData[i] || [] })), xpEarned, splitName, date: d, difficulty: difficultyRating };
    setWorkoutDone(summary);
    setWorkoutLog(prev => ({ ...prev, [d]: { ...summary } }));
    addXP(xpEarned, "Workout Complete");
    updatePS({ completedDays: [...completedDays, d] });
    // Combat: advance week after 3 sessions
    if (activeProgram?.curriculum) {
      const thisWeekSessions = completedDays.filter(cd => { const diff = Math.floor((new Date(d) - new Date(cd)) / (24 * 60 * 60 * 1000)); return diff < 7 && diff >= 0 }).length + 1;
      if (thisWeekSessions >= activeProgram.daysPerWeek && combatWeek < activeProgram.curriculum.length - 1) {
        updatePS({ combatWeek: combatWeek + 1 });
      }
    }
    const wmSync = localSync("ignite-week-muscles", {});
    const weekMuscles = wmSync.get();
    weekMuscles[d] = musclesWorked; wmSync.set(weekMuscles);
    setPhase("summary"); victorySound();
  };

  // ── Derived ──
  const curEx = exercises[exIdx];
  const curMuscles = curEx ? getMusclesForExercise(curEx.name) : [];
  const curTip = curEx ? getFormTip(curEx.name) : null;
  const curSwaps = curEx ? getSwapOptions(curEx.name) : [];
  const curSets = setData[exIdx] || [];
  const totalWeeksInProgram = activeProgram?.curriculum?.length || 12;
  const progressPct = activeProgram ? Math.round(((activeProgram.curriculum ? combatWeek : currentWeek) / totalWeeksInProgram) * 100) : 0;

  // Weekly muscle data
  const weekMuscleData = useMemo(() => {
    const data = localSync("ignite-week-muscles", {}).get();
    const all = []; for (let i = 6; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); const ds = dt.toISOString().split("T")[0]; if (data[ds]) all.push(...data[ds]) }
    return [...new Set(all)];
  }, [workoutLog]);

  // ══════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════
  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>

      {/* ══ TRAINING HOME (v4) ══ */}
      {phase === "home" && (
        <TrainingHome
          workoutLog={workoutLog}
          setWorkoutLog={setWorkoutLog}
          addXP={addXP}
          profile={profile}
          onStartChallenge={(ch) => {
            console.log("Start challenge:", ch.id);
          }}
        />
      )}

      {/* ══ WARM-UP ══ */}
      {phase === "warmup" && (
        <div className="slide-up" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>🔥 WARM-UP</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{WARMUP[phaseExIdx]?.icon} {WARMUP[phaseExIdx]?.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>{phaseExIdx + 1}/{WARMUP.length}</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><TimerRing seconds={phaseTimer} total={WARMUP[phaseExIdx]?.duration || 30} color="#f59e0b" /></div>
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 20 }}>{WARMUP.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= phaseExIdx ? "#f59e0b" : "rgba(255,255,255,.08)" }} />)}</div>
          <button className="bg" onClick={() => setPhase("workout")} style={{ padding: "10px 24px" }}>Skip Warm-up →</button>
        </div>)}

      {/* ══ ACTIVE WORKOUT ══ */}
      {phase === "workout" && curEx && (
        <div className="slide-up">
          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${((exIdx + 1) / exercises.length) * 100}%`, background: "linear-gradient(90deg,#10b981,#06b6d4)", borderRadius: 2, transition: "width .5s" }} />
            </div>
            <span style={{ fontSize: 11, color: "#6b7280", flexShrink: 0 }}>{exIdx + 1}/{exercises.length}</span>
          </div>

          <div className="gs" style={{ padding: 16, marginBottom: 12, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#10b981,#06b6d4)" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{curEx.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{curEx.sets} sets × {curEx.reps}{curEx.desc ? ` · ${curEx.desc}` : ""} · Rest {curEx.rest}s</div>
                {curEx.suggestedWeight > 0 && <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 2 }}>📈 Suggested: {curEx.suggestedWeight}kg (+{curEx.progression})</div>}
              </div>
              {curSwaps.length > 0 && <button onClick={() => setShowSwap(!showSwap)} style={{ background: "none", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: "6px 10px", color: "#6b7280", fontSize: 11, cursor: "pointer" }}>🔄</button>}
            </div>

            {showSwap && <div className="fade-in" style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>{curSwaps.map(s => <span key={s} onClick={() => swapExercise(s)} className="chip chip-i" style={{ cursor: "pointer", fontSize: 11 }}>{s}</span>)}</div>}

            {YT[curEx.name] && <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 12, aspectRatio: "16/9", background: "#111" }}><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${YT[curEx.name]}?rel=0`} frameBorder="0" allowFullScreen style={{ border: "none" }} title={curEx.name} /></div>}

            <div onClick={() => setShowMuscleMap(!showMuscleMap)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(16,185,129,.04)", border: "1px solid rgba(16,185,129,.1)", cursor: "pointer", marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>🫁</span>
              <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>Muscles: {curMuscles.join(", ")}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "#6b7280" }}>{showMuscleMap ? "▾" : "▸"}</span>
            </div>
            {showMuscleMap && <div className="fade-in" style={{ marginBottom: 12 }}><MuscleMap muscles={curMuscles} size={160} /></div>}

            {curTip && <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(245,158,11,.04)", border: "1px solid rgba(245,158,11,.1)", marginBottom: 12, fontSize: 12, color: "#fbbf24" }}>💡 <strong>Form:</strong> {curTip}</div>}

            {/* Set Logger */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f3f4f6", marginBottom: 8, fontFamily: "Rajdhani,sans-serif" }}>LOG SETS</div>
              {curSets.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0", fontSize: 12, color: "#22c55e" }}>
                  <span style={{ width: 20 }}>✓</span><span>Set {i + 1}: {s.reps} reps{s.weight > 0 ? ` × ${s.weight}kg` : ""}</span>
                </div>
              ))}
              {isTimedEx(curEx) && (
                <div style={{ marginTop: 8 }}>
                  {timedActive ? (<div style={{ textAlign: "center" }}><TimerRing seconds={timedSeconds} total={timedTotal} size={100} color="#f59e0b" /><button className="bg" onClick={() => { clearInterval(timedRef.current); setTimedActive(false) }} style={{ marginTop: 8, padding: "6px 16px", fontSize: 11 }}>Stop</button></div>
                  ) : (<button className="bp" onClick={() => { setTimedTotal(getTimedDur(curEx)); setTimedSeconds(getTimedDur(curEx)); setTimedActive(true) }} style={{ width: "100%", padding: 12, fontSize: 14 }}>⏱ Start {getTimedDur(curEx)}s Timer</button>)}
                </div>
              )}
              {curSets.length < (curEx.sets || 3) && !isTimedEx(curEx) && (
                <SetLogger onLog={logSet} setNum={curSets.length + 1} targetReps={curEx.reps} prevWeight={curEx.suggestedWeight || curSets[curSets.length - 1]?.weight || 0} />
              )}
              {curSets.length >= (curEx.sets || 3) && <div style={{ textAlign: "center", padding: 8, color: "#22c55e", fontSize: 13, fontWeight: 600 }}>✅ All sets complete!</div>}
            </div>
          </div>

          {/* Exercise dots */}
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 12, flexWrap: "wrap" }}>
            {exercises.map((_, i) => <div key={i} onClick={() => { setExIdx(i); setShowSwap(false) }} style={{ width: i === exIdx ? 20 : 8, height: 8, borderRadius: 4, background: i < exIdx ? "#22c55e" : i === exIdx ? "#10b981" : "rgba(255,255,255,.08)", cursor: "pointer", transition: "all .3s" }} />)}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {exIdx > 0 && <button className="bg" onClick={() => { setExIdx(exIdx - 1); setShowSwap(false) }} style={{ padding: "12px 16px" }}>← Prev</button>}
            {exIdx < exercises.length - 1 ? (
              <button className="bp" onClick={() => { setRestTime(curEx.rest || 30); setRestTotal(curEx.rest || 30); setPhase("rest"); setExIdx(exIdx + 1) }} style={{ flex: 1, padding: 14, fontSize: 15 }}>Next →</button>
            ) : (
              <button className="bp" onClick={() => { setPhase("cooldown"); setPhaseExIdx(0); setPhaseTimer(COOLDOWN[0]?.duration || 30) }} style={{ flex: 1, padding: 14, fontSize: 15, background: "linear-gradient(135deg,#22c55e,#10b981)" }}>🏁 Finish → Cool Down</button>
            )}
          </div>
        </div>)}

      {/* ══ REST ══ */}
      {phase === "rest" && (
        <div className="fade-in" style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: 2, marginBottom: 8 }}>REST</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><TimerRing seconds={restTime} total={restTotal} /></div>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 6 }}>Next:</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 20 }}>{exercises[exIdx]?.name}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="bg" onClick={() => setRestTime(r => Math.max(0, r - 10))} style={{ padding: "8px 16px" }}>-10s</button>
            <button className="bp" onClick={() => { clearInterval(timerRef.current); setPhase("workout") }} style={{ padding: "8px 24px" }}>Skip</button>
            <button className="bg" onClick={() => setRestTime(r => r + 10)} style={{ padding: "8px 16px" }}>+10s</button>
          </div>
        </div>)}

      {/* ══ COOL-DOWN ══ */}
      {phase === "cooldown" && (
        <div className="slide-up" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#8b5cf6", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>🧘 COOL DOWN</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{COOLDOWN[phaseExIdx]?.icon} {COOLDOWN[phaseExIdx]?.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>{phaseExIdx + 1}/{COOLDOWN.length}</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><TimerRing seconds={phaseTimer} total={COOLDOWN[phaseExIdx]?.duration || 30} color="#8b5cf6" /></div>
          <button className="bg" onClick={() => finishWorkout()} style={{ padding: "10px 24px" }}>Skip → Finish</button>
        </div>)}

      {/* ══ SUMMARY ══ */}
      {phase === "summary" && workoutDone && (
        <div className="slide-up" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "Rajdhani,sans-serif", background: "linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>WORKOUT COMPLETE!</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>{workoutDone.splitName}</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
            {[["⏱", `${Math.floor(workoutDone.duration / 60)}m ${workoutDone.duration % 60}s`, "Duration"], ["🔥", `${workoutDone.calBurned}`, "Calories"], ["💪", `${workoutDone.totalSets}`, "Sets"], ["🔄", `${workoutDone.totalReps}`, "Reps"], ["⚡", `+${workoutDone.xpEarned}`, "XP"], ["🏋️", workoutDone.maxWeight > 0 ? workoutDone.maxWeight + "kg" : "—", "Max Weight"]].map(([ic, v, l]) => (
              <div key={l} className="gc" style={{ padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{ic}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 0.5 }}>{v}</div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>{l}</div>
              </div>
            ))}
          </div>

          {newPRs.length > 0 && (
            <div className="gs" style={{ marginBottom: 16, border: "1px solid rgba(245,158,11,.2)", background: "rgba(245,158,11,.04)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>🏆 New Personal Records!</div>
              {newPRs.map((pr, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 4 }}>{pr.exercise}: {pr.weight}kg {pr.oldPR > 0 ? `(was ${pr.oldPR}kg)` : "(first PR!)"}</div>)}
            </div>
          )}

          <div className="gs" style={{ marginBottom: 16, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", marginBottom: 10, fontFamily: "Rajdhani,sans-serif" }}>MUSCLES WORKED</div>
            <MuscleMap muscles={workoutDone.musclesWorked} size={180} showLabels />
          </div>

          {/* Difficulty */}
          <div className="gs" style={{ marginBottom: 16, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", marginBottom: 10, fontFamily: "Rajdhani,sans-serif" }}>HOW HARD WAS THAT?</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
              {[{ v: 1, l: "Easy", e: "😌", c: "#22c55e" }, { v: 2, l: "Moderate", e: "😊", c: "#06b6d4" }, { v: 3, l: "Challenging", e: "😤", c: "#f59e0b" }, { v: 4, l: "Hard", e: "🥵", c: "#f97316" }, { v: 5, l: "Brutal", e: "💀", c: "#ef4444" }].map(dd => (
                <div key={dd.v} onClick={() => setDifficultyRating(dd.v)} style={{ flex: 1, textAlign: "center", padding: "10px 4px", borderRadius: 10, cursor: "pointer", background: difficultyRating === dd.v ? dd.c + "15" : "rgba(255,255,255,.02)", border: difficultyRating === dd.v ? `1px solid ${dd.c}30` : "1px solid rgba(255,255,255,.04)", transition: "all .2s" }}>
                  <div style={{ fontSize: 22 }}>{dd.e}</div>
                  <div style={{ fontSize: 11, color: difficultyRating === dd.v ? dd.c : "#6b7280", fontWeight: 600, marginTop: 2 }}>{dd.l}</div>
                </div>
              ))}
            </div>
          </div>

          <button className="bp" onClick={() => { setPhase("home"); setTab("today") }} style={{ width: "100%", padding: 14, fontSize: 16 }}>Done ✓</button>
        </div>)}
    </div>);
}