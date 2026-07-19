import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { today } from '../utils';
import MuscleMap, { getMusclesForExercise } from './MuscleMap';
import { getFormTip, getSwapOptions, WARMUP, COOLDOWN } from '../data/exerciseMeta';
import { GYM_PROGRAMS, COMBAT_PROGRAMS, getTodayWorkout } from '../data/trainingPrograms';
import { FITNESS_PROGRAMS, PROGRAM_TAGS, getRecommendedPrograms, adjustForProfile } from '../data/fitnessPrograms';

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
  const [prRecords, setPrRecords] = useState(() => JSON.parse(localStorage.getItem("ignite-prs") || "{}"));
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
        setPrRecords(prev => { const u = { ...prev, [ex.name]: w }; localStorage.setItem("ignite-prs", JSON.stringify(u)); return u });
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
    const weekMuscles = JSON.parse(localStorage.getItem("ignite-week-muscles") || "{}");
    weekMuscles[d] = musclesWorked; localStorage.setItem("ignite-week-muscles", JSON.stringify(weekMuscles));
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
    const data = JSON.parse(localStorage.getItem("ignite-week-muscles") || "{}");
    const all = []; for (let i = 6; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); const ds = dt.toISOString().split("T")[0]; if (data[ds]) all.push(...data[ds]) }
    return [...new Set(all)];
  }, [workoutLog]);

  // ══════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════
  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>

      {/* ══ PROGRAM SETUP (no program selected) ══ */}
      {phase === "home" && !activeId && (
        <div className="fade-in">
          {setupStep === 0 && (<div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>⚔️</div>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "Rajdhani,sans-serif", color: "#f3f4f6" }}>Choose Your Path</div>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>Select your training type. Your program will be structured like a real coach — progressive, weekly, and designed for results.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="gc" onClick={() => { setSetupType("gym"); setSetupStep(1) }} style={{ padding: 24, textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🏋️</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>GYM / HOME</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Build muscle, lose fat, get stronger</div>
              </div>
              <div className="gc" onClick={() => { setSetupType("combat"); setSetupStep(2) }} style={{ padding: 24, textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🥊</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#ef4444", fontFamily: "Rajdhani,sans-serif" }}>COMBAT SKILLS</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Learn a fighting art from scratch</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginTop: 12 }}>
              {[
                { id: "yoga", icon: "🧘", name: "Yoga", color: "#8b5cf6", step: 3 },
                { id: "run", icon: "🏃", name: "Running", color: "#06b6d4", step: 4 },
                { id: "hiit", icon: "⚡", name: "HIIT", color: "#ec4899", step: 3 },
                { id: "flex", icon: "🤸", name: "Flexibility", color: "#14b8a6", step: 3 },
                { id: "cali", icon: "💪", name: "Calisthenics", color: "#f97316", step: 3 },
                { id: "posture", icon: "🧑‍💻", name: "Posture Fix", color: "#3b82f6", step: 3 },
                { id: "meditate", icon: "🧘", name: "Meditation", color: "#a855f7", step: 3 },
                { id: "stamina", icon: "🫀", name: "Stamina", color: "#ef4444", step: 3 },
              ].map(cat => (
                <div key={cat.id} className="gc" onClick={() => {
                  const map = { yoga: "yoga", run: "couch_to_5k", hiit: "hiit_burner", flex: "flexibility", cali: "calisthenics", posture: "posture_fix", meditate: "meditation", stamina: "stamina" };
                  if (cat.id === "run") { setSetupStep(4) }
                  else { selectProgram(map[cat.id]) }
                }} style={{ padding: "12px 10px", textAlign: "center", cursor: "pointer" }}>
                  <div style={{ fontSize: 24 }}>{cat.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cat.color, marginTop: 4 }}>{cat.name}</div>
                </div>
              ))}
            </div>
            {profile.gender === "female" && (
              <div className="gc" onClick={() => selectProgram("womens_tone")} style={{ marginTop: 10, padding: 14, textAlign: "center", cursor: "pointer" }}>
                <span style={{ fontSize: 22 }}>🍑</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ec4899", marginLeft: 8 }}>Glute & Tone (Women's Program)</span>
              </div>
            )}
            {parseInt(profile.age) >= 50 && (
              <div className="gc" onClick={() => selectProgram("senior_fit")} style={{ marginTop: 8, padding: 14, textAlign: "center", cursor: "pointer" }}>
                <span style={{ fontSize: 22 }}>🧓</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#06b6d4", marginLeft: 8 }}>Active & Strong (50+ Program)</span>
              </div>
            )}
          </div>)}

          {/* Gym goal selection */}
          {setupStep === 1 && (
            <div className="slide-up">
              <div style={{ fontSize: 12, color: "#6b7280", cursor: "pointer", marginBottom: 16 }} onClick={() => setSetupStep(0)}>← Back</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 16 }}>Select Your Program</div>
              {Object.values(GYM_PROGRAMS).map(p => (
                <div key={p.id} className="gs" onClick={() => selectProgram(p.id)} style={{ marginBottom: 10, padding: 16, cursor: "pointer", border: "1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{p.desc}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 100, background: "rgba(16,185,129,.08)", color: "#10b981" }}>{p.daysPerWeek} days/week</span>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 100, background: "rgba(6,182,212,.08)", color: "#06b6d4" }}>{p.duration}</span>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 100, background: "rgba(245,158,11,.08)", color: "#f59e0b" }}>{p.level}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 20, color: "#4b5563" }}>→</span>
                  </div>
                </div>
              ))}
            </div>)}

          {/* Running program selection */}
          {setupStep === 4 && (
            <div className="slide-up">
              <div style={{ fontSize: 12, color: "#6b7280", cursor: "pointer", marginBottom: 16 }} onClick={() => setSetupStep(0)}>← Back</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 16 }}>Choose Your Running Program</div>
              {[{ id: "couch_to_5k", name: "Couch to 5K", desc: "Zero to 5K in 8 weeks. Perfect for beginners.", icon: "🏃", tag: "Beginner" }, { id: "run_10k", name: "10K Training", desc: "Already run 5K? Train for 10K with speed work and long runs.", icon: "🏃", tag: "Intermediate" }].map(p => (
                <div key={p.id} className="gs" onClick={() => selectProgram(p.id)} style={{ marginBottom: 10, padding: 16, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 32 }}>{p.icon}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{p.desc}</div>
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 100, background: "rgba(6,182,212,.08)", color: "#06b6d4", marginTop: 4, display: "inline-block" }}>{p.tag}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>)}

          {/* Combat art selection */}
          {setupStep === 2 && (
            <div className="slide-up">
              <div style={{ fontSize: 12, color: "#6b7280", cursor: "pointer", marginBottom: 16 }} onClick={() => setSetupStep(0)}>← Back</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 4 }}>Choose Your Fighting Art</div>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Each art has a structured curriculum that teaches you from zero to competent fighter.</p>
              {Object.values(COMBAT_PROGRAMS).map(p => (
                <div key={p.id} className="gs" onClick={() => selectProgram(p.id)} style={{ marginBottom: 10, padding: 16, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ fontSize: 36 }}>{p.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{p.desc}</div>
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 100, background: "rgba(239,68,68,.08)", color: "#ef4444", marginTop: 6, display: "inline-block" }}>{p.duration} · {p.daysPerWeek} days/week</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>)}
        </div>)}

      {/* ══ HOME — PROGRAM ACTIVE ══ */}
      {phase === "home" && activeId && (
        <div className="fade-in">
          {/* Program header */}
          <div className="gs" style={{ marginBottom: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#10b981,#06b6d4)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Active Program</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{activeProgram?.icon || "🏋️"} {activeProgram?.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Week {(activeProgram?.curriculum ? combatWeek : currentWeek) + 1} of {totalWeeksInProgram} · {progressPct}% complete</div>
              </div>
              <button className="bg" onClick={() => { updatePS({ activeProgram: null, startDate: null }); setPhase("home") }} style={{ padding: "6px 12px", fontSize: 10, color: "#ef4444" }}>Change</button>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 3, marginTop: 12, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg,#10b981,#06b6d4)", borderRadius: 3, transition: "width .5s" }} />
            </div>
          </div>

          {/* Weekly Calendar */}
          {activeProgram?.schedule && (
            <div className="gs" style={{ marginBottom: 12, padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => {
                  const isScheduled = activeProgram.schedule.includes(day);
                  const isToday = day === todayName;
                  const isDone = isToday && todayW;
                  return (
                    <div key={day} style={{ flex: 1, textAlign: "center", padding: "6px 2px" }}>
                      <div style={{ fontSize: 10, color: isToday ? "#10b981" : "#6b7280", fontWeight: isToday ? 700 : 400 }}>{day}</div>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", margin: "4px auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                        background: isDone ? "rgba(34,197,94,.15)" : isToday ? "rgba(16,185,129,.08)" : "transparent",
                        border: isToday ? "1.5px solid #10b981" : isScheduled ? "1px solid rgba(255,255,255,.1)" : "1px solid rgba(255,255,255,.03)",
                        color: isDone ? "#22c55e" : isScheduled ? "#d1d5db" : "#4b5563",
                      }}>{isDone ? "✓" : isScheduled ? "•" : "—"}</div>
                      <div style={{ fontSize: 8, color: isScheduled ? "#6b7280" : "#4b5563", marginTop: 2 }}>{isScheduled ? "Train" : "Rest"}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
            {[["today", "📋 Today"], ["progress", "📈 Progress"], ["heatmap", "🫁 Muscles"], ["history", "📊 History"]].map(([k, l]) => (
              <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ flexShrink: 0 }}>{l}</span>
            ))}
          </div>

          {/* ── TODAY TAB ── */}
          {tab === "today" && (
            <div>
              {/* Already trained today */}
              {todayW && (
                <div className="gs" style={{ marginBottom: 16, border: "1px solid rgba(34,197,94,.15)", background: "rgba(34,197,94,.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 28 }}>✅</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#22c55e", fontFamily: "Rajdhani,sans-serif" }}>Today's Training Complete!</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{todayW.splitName} · {todayW.calBurned || 0}cal · {Math.floor((todayW.duration || 0) / 60)}min</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rest Day */}
              {isRestDay && !todayW && (
                <div className="gs" style={{ textAlign: "center", padding: 30, marginBottom: 16 }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🧘</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#8b5cf6", fontFamily: "Rajdhani,sans-serif" }}>Rest Day</div>
                  <p style={{ fontSize: 13, color: "#6b7280", marginTop: 8, maxWidth: 300, margin: "8px auto 0" }}>Recovery is when your muscles grow. Stretch, hydrate, eat well, and sleep. You've earned this.</p>
                  {activeProgram?.tips && <div style={{ fontSize: 11, color: "#10b981", marginTop: 16, fontStyle: "italic" }}>💡 {activeProgram.tips}</div>}
                </div>
              )}

              {/* GYM: Today's workout */}
              {!isRestDay && todaysTraining?.type === "gym" && !todayW && (
                <div>
                  <div className="gs" style={{ marginBottom: 12 }}>
                    {todaysTraining.isDeload && <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 8, padding: "4px 10px", borderRadius: 100, background: "rgba(245,158,11,.08)", display: "inline-block" }}>🔄 DELOAD WEEK — Reduced volume for recovery</div>}
                    <div style={{ fontSize: 12, color: "#06b6d4", fontWeight: 600 }}>Phase: {todaysTraining.phase}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginTop: 4 }}>{todaysTraining.day?.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{todaysTraining.focus}</div>
                  </div>

                  {/* Exercise preview */}
                  {todaysTraining.day?.exercises.map((ex, i) => {
                    const suggested = getSuggestedWeight(ex.name);
                    return (
                      <div key={i} className="gc" style={{ marginBottom: 6, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14, color: "#6b7280", width: 20, textAlign: "center", fontWeight: 700 }}>{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#f3f4f6" }}>{ex.name}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{ex.sets}×{ex.reps} · Rest {ex.rest}s{suggested > 0 ? ` · Aim: ${suggested}kg` : ""}</div>
                        </div>
                        <div style={{ fontSize: 10, color: "#10b981" }}>{ex.progression}</div>
                      </div>)
                  })}

                  <button className="bp" onClick={() => startGymWorkout(todaysTraining.day, todaysTraining.isDeload)} style={{ width: "100%", padding: 16, fontSize: 18, fontWeight: 800, fontFamily: "Rajdhani,sans-serif", letterSpacing: 2, marginTop: 12 }}>
                    ⚔️ START {todaysTraining.day?.name?.toUpperCase()}
                  </button>
                </div>
              )}

              {/* COMBAT: This week's lesson */}
              {!isRestDay && todaysTraining?.type === "combat" && !todayW && (
                <div>
                  <div className="gs" style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>WEEK {todaysTraining.weekNum} of {todaysTraining.totalWeeks}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginTop: 4 }}>{todaysTraining.week.title}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{todaysTraining.week.focus}</div>
                  </div>

                  {/* Skills to learn */}
                  <div className="gs" style={{ marginBottom: 12 }}>
                    <div className="sl">📖 Skills This Week</div>
                    {todaysTraining.week.skills.map((s, i) => (
                      <div key={i} style={{ padding: "8px 0", borderBottom: i < todaysTraining.week.skills.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none", fontSize: 13, color: "#d1d5db" }}>
                        <span style={{ color: "#10b981", marginRight: 8 }}>•</span>{s}
                      </div>
                    ))}
                  </div>

                  {/* Drills preview */}
                  <div className="gs" style={{ marginBottom: 12 }}>
                    <div className="sl">🥊 Today's Drills</div>
                    {todaysTraining.week.drills.map((dr, i) => (
                      <div key={i} style={{ padding: "8px 0", borderBottom: i < todaysTraining.week.drills.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#f3f4f6" }}>{dr.name} <span style={{ fontSize: 11, color: "#f59e0b" }}>({dr.duration})</span></div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{dr.desc}</div>
                      </div>
                    ))}
                  </div>

                  <button className="bp" onClick={() => startCombatSession(todaysTraining.week)} style={{ width: "100%", padding: 16, fontSize: 18, fontWeight: 800, fontFamily: "Rajdhani,sans-serif", letterSpacing: 2 }}>
                    🥊 START TRAINING
                  </button>
                </div>
              )}

              {/* Coach tip */}
              {activeProgram?.tips && !todayW && !isRestDay && (
                <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,.04)", border: "1px solid rgba(16,185,129,.1)", fontSize: 12, color: "#10b981" }}>
                  🧠 <strong>Coach Tip:</strong> {activeProgram.tips}
                </div>
              )}

              {/* Repeat Week / Advance Week */}
              {activeProgram?.curriculum && !isRestDay && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  {combatWeek > 0 && <button className="bg" onClick={() => updatePS({ combatWeek: Math.max(0, combatWeek - 1) })} style={{ flex: 1, padding: 10, fontSize: 11 }}>← Repeat Previous Week</button>}
                  {combatWeek < (activeProgram.curriculum.length - 1) && <button className="bg" onClick={() => updatePS({ combatWeek: combatWeek + 1 })} style={{ flex: 1, padding: 10, fontSize: 11 }}>Skip to Next Week →</button>}
                </div>
              )}

              {/* Program Complete */}
              {isProgramComplete && (
                <div className="gs slide-up" style={{ marginTop: 16, textAlign: "center", padding: 24, border: "1px solid rgba(16,185,129,.2)", background: "rgba(16,185,129,.04)" }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
                  <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "Rajdhani,sans-serif", color: "#10b981" }}>PROGRAM COMPLETE!</div>
                  <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>You've finished {activeProgram.name}. Incredible discipline!</p>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
                    <button className="bp" onClick={() => { updatePS({ combatWeek: 0, startDate: d, completedDays: [] }) }} style={{ padding: "10px 20px" }}>🔄 Restart Program</button>
                    <button className="bg" onClick={() => { updatePS({ activeProgram: null, startDate: null }) }} style={{ padding: "10px 20px" }}>🔄 New Program</button>
                  </div>
                </div>
              )}

              {/* Running Timer (for running programs) */}
              {(activeId === "couch_to_5k" || activeId === "run_10k" || activeId === "stamina") && !todayW && !isRestDay && (
                <div className="gs" style={{ marginTop: 12, textAlign: "center", padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 10 }}>🏃 Run Timer</div>
                  {runTimerActive ? (
                    <div>
                      <div style={{ fontSize: 48, fontWeight: 900, fontFamily: "Rajdhani,sans-serif", color: runElapsed >= runTarget && runTarget > 0 ? "#22c55e" : "#f3f4f6" }}>{fmtTime(runElapsed)}</div>
                      {runTarget > 0 && <div style={{ fontSize: 12, color: "#6b7280" }}>Target: {fmtTime(runTarget)}</div>}
                      {runTarget > 0 && (
                        <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, (runElapsed / runTarget) * 100)}%`, background: runElapsed >= runTarget ? "#22c55e" : "linear-gradient(90deg,#10b981,#06b6d4)", borderRadius: 3, transition: "width 1s" }} />
                        </div>
                      )}
                      <button className="bg" onClick={stopRunTimer} style={{ marginTop: 12, padding: "10px 24px" }}>⏹ Stop Run</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                      {[5, 10, 15, 20, 25, 30].map(m => (
                        <button key={m} className="chip chip-i" onClick={() => startRunTimer(m)} style={{ padding: "8px 14px" }}>{m} min</button>
                      ))}
                      <button className="chip chip-a" onClick={() => startRunTimer(0)} style={{ padding: "8px 14px" }}>Free Run</button>
                    </div>
                  )}
                </div>
              )}
            </div>)}

          {/* ── PROGRESS TAB ── */}
          {tab === "progress" && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 12 }}>📈 Weight Progression</div>
              {Object.keys(exerciseWeights).length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: "#6b7280", fontSize: 13 }}>Complete workouts with weights to see your progress chart here.</div>
              ) : (
                <div>
                  {Object.entries(exerciseWeights).slice(0, 10).map(([exName, currentW]) => {
                    // Build history from workoutLog
                    const history = Object.entries(workoutLog).filter(([k, v]) => v.exercises?.some(e => e.name === exName && e.sets?.some(s => s.weight > 0))).sort((a, b) => a[0].localeCompare(b[0])).slice(-8).map(([date, v]) => {
                      const ex = v.exercises.find(e => e.name === exName);
                      const maxW = Math.max(0, ...(ex?.sets || []).map(s => s.weight || 0));
                      return { date: date.slice(5), weight: maxW };
                    });
                    if (history.length < 1) return null;
                    const maxVal = Math.max(...history.map(h => h.weight), 1);
                    const firstW = history[0]?.weight || 0;
                    const gain = currentW - firstW;
                    return (
                      <div key={exName} className="gs" style={{ marginBottom: 10, padding: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6" }}>{exName}</div>
                          <div style={{ fontSize: 13, color: gain > 0 ? "#22c55e" : gain < 0 ? "#ef4444" : "#6b7280", fontWeight: 600 }}>{currentW}kg {gain > 0 ? `↑+${gain}kg` : gain < 0 ? `↓${gain}kg` : ""}</div>
                        </div>
                        {/* Mini bar chart */}
                        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 50 }}>
                          {history.map((h, i) => (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <div style={{ width: "100%", background: i === history.length - 1 ? "#10b981" : "rgba(16,185,129,.3)", borderRadius: "3px 3px 0 0", height: `${Math.max(8, (h.weight / maxVal) * 45)}px`, transition: "height .5s" }} />
                              <div style={{ fontSize: 8, color: "#6b7280", marginTop: 2 }}>{h.date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                  {Object.entries(exerciseWeights).length > 10 && <div style={{ fontSize: 11, color: "#6b7280", textAlign: "center" }}>Showing top 10 exercises</div>}
                </div>
              )}

              {/* PR Records */}
              {Object.keys(prRecords).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 12 }}>🏆 Personal Records</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 8 }}>
                    {Object.entries(prRecords).sort((a, b) => b[1] - a[1]).map(([name, weight]) => (
                      <div key={name} className="gc" style={{ padding: 10, textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#f59e0b", fontFamily: "Rajdhani,sans-serif" }}>{weight}kg</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── HEATMAP TAB ── */}
          {tab === "heatmap" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>This Week's Muscle Coverage</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{weekMuscleData.length} muscle groups trained</div>
              </div>
              <div className="gs" style={{ padding: 16, display: "flex", justifyContent: "center" }}>
                <MuscleMap muscles={weekMuscleData} size={220} showLabels />
              </div>
            </div>)}

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
                      <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600 }}>{w.calBurned || 0}cal</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{Math.floor((w.duration || 0) / 60)}m</div>
                      {w.difficulty > 0 && <div style={{ fontSize: 10 }}>{"😌😊😤🥵💀"[w.difficulty - 1]}</div>}
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(workoutLog).length === 0 && <div style={{ textAlign: "center", padding: 30, color: "#6b7280", fontSize: 13 }}>No workouts logged yet.</div>}
            </div>)}
        </div>)}

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
                <div style={{ fontSize: 22, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{v}</div>
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
                  <div style={{ fontSize: 9, color: difficultyRating === dd.v ? dd.c : "#6b7280", fontWeight: 600, marginTop: 2 }}>{dd.l}</div>
                </div>
              ))}
            </div>
          </div>

          <button className="bp" onClick={() => { setPhase("home"); setTab("today") }} style={{ width: "100%", padding: 14, fontSize: 16 }}>Done ✓</button>
        </div>)}
    </div>);
}