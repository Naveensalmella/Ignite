import { useState, useEffect, useCallback, useRef } from 'react';
import './styles.css';
import { DEFAULT_HABITS, navItems, REQUIRED_DAILY, DAILY_PENALTY, XP } from './data';
import { getLevel, getRank, getStreakMult, today } from './utils';
import store from './store';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import TrainingPage from './components/TrainingPage';
import Nutrition from './components/Nutrition';
import DailyQuestPage from './components/DailyQuestPage';
import MissionsPage from './components/MissionsPage';
import FocusTimer from './components/FocusTimer';
import Wellness from './components/Wellness';
import FinancePage from './components/FinancePage';
import GrowthPage from './components/GrowthPage';
import FlameOracle from './components/FlameOracle';
import ProfilePage from './components/ProfilePage';
import XPToast from './components/XPToast';
import LevelUpOverlay from './components/LevelUpOverlay';
import HeaderXPBar from './components/HeaderXPBar';
import RoutinePage from './components/RoutinePage';
import OnboardingPage from './components/OnboardingPage';
import OnboardingTutorial from './components/OnboardingTutorial';
import BodyTracker from './components/BodyTracker';
import ChallengesPage from './components/ChallengesPage';
import { ConfettiBlast, LevelUpCelebration } from './components/Confetti';
import ShareCard from './components/ShareCard';
import WorkoutPrograms from './components/WorkoutPrograms';
import SocialPage from './components/SocialPage';
import StreakFreeze, { isDayFrozen } from './components/StreakFreeze';
import YearHeatmap from './components/YearHeatmap';
import WeeklyReport from './components/WeeklyReport';
import { SkeletonPage } from './components/Loading';
import ErrorBoundary from './components/ErrorBoundary';
import { playXP, playLevelUp, playWorkoutComplete } from './sounds';
import { registerSW, startNotifScheduler } from './notifications';
import { applyAccent } from './components/AccentPicker';
import './transitions.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [foodLog, setFoodLog] = useState({});
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [habitLog, setHabitLog] = useState({});
  const [tasks, setTasks] = useState([]);
  const [journal, setJournal] = useState({});
  const [finances, setFinances] = useState([]);
  const [profile, setProfile] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [totalXP, setTotalXP] = useState(0);
  const [xpEvents, setXpEvents] = useState([]);
  const [levelUp, setLevelUp] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [workoutLog, setWorkoutLog] = useState({});
  const [streak, setStreak] = useState(0);
  const [lastCheck, setLastCheck] = useState("");
  const [pillarProg, setPillarProg] = useState({});
  const [activityLog, setActivityLog] = useState([]);
  const [focusLog, setFocusLog] = useState({});
  const [routineData, setRoutineData] = useState(null);
  const [bodyData, setBodyData] = useState(null);
  const [challengeData, setChallengeData] = useState(null);
  const [confetti, setConfetti] = useState(0);
  const [levelUpShow, setLevelUpShow] = useState(null);
  const [programData, setProgramData] = useState(null);
  const [masteryData, setMasteryData] = useState(null);
  const [freezeData, setFreezeData] = useState(null);
  const [programState, setProgramState] = useState({});
  const [showTutorial, setShowTutorial] = useState(false);
  const saveTimer = useRef(null);

  const logActivity = (type, detail) => {
    const entry = { id: Date.now(), type, detail, date: today(), time: new Date().toLocaleTimeString(), timestamp: Date.now() };
    setActivityLog(p => [entry, ...p].slice(0, 200));
  };

  // Responsive check
  useEffect(() => {
    const ck = () => setIsMobile(window.innerWidth < 768);
    ck(); window.addEventListener("resize", ck);
    return () => window.removeEventListener("resize", ck);
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const u = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          username: firebaseUser.uid,
        };
        setUser(u);
        await loadUserData(u.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load all data from Firestore
  const loadUserData = async (uid) => {
    const d = await store.getUserData(uid);
    if (d) {
      d.foodLog && setFoodLog(d.foodLog);
      d.habits && setHabits(d.habits);
      d.habitLog && setHabitLog(d.habitLog);
      d.tasks && setTasks(d.tasks);
      d.journal && setJournal(d.journal);
      d.finances && setFinances(d.finances);
      d.profile && setProfile(d.profile);
      d.chatHistory && setChatHistory(d.chatHistory);
      d.workoutLog && setWorkoutLog(d.workoutLog);
      d.pillarProg && setPillarProg(d.pillarProg);
      d.activityLog && setActivityLog(d.activityLog);
      d.focusLog && setFocusLog(d.focusLog);
      d.routineData && setRoutineData(d.routineData);
      d.masteryData && setMasteryData(d.masteryData);
      d.bodyData && setBodyData(d.bodyData);
      d.challengeData && setChallengeData(d.challengeData);
      d.programData && setProgramData(d.programData);
      d.freezeData && setFreezeData(d.freezeData);
      d.programState && setProgramState(d.programState);
      if (d.totalXP !== undefined) setTotalXP(d.totalXP);
      if (d.streak !== undefined) setStreak(d.streak);
      if (d.lastCheck) setLastCheck(d.lastCheck);
      // Show tutorial for first-time users
      if (!d.tutorialDone) setShowTutorial(true);
    } else {
      // Brand new user — show tutorial
      setShowTutorial(true);
    }
  };

  // Save to Firestore (debounced)
  const saveData = useCallback(async () => {
    if (!user) return;
    await store.saveUserData(user.uid, {
      foodLog, habits, habitLog, tasks, journal, finances, profile,
      chatHistory, totalXP, workoutLog, streak, lastCheck, pillarProg,
      activityLog, focusLog, routineData, masteryData, bodyData,
      challengeData, programData, freezeData, programState,
      email: user.email,
      lastSaved: new Date().toISOString(),
    });
  }, [user, foodLog, habits, habitLog, tasks, journal, finances, profile,
    chatHistory, totalXP, workoutLog, streak, lastCheck, pillarProg,
    activityLog, focusLog, routineData, masteryData, bodyData,
    challengeData, programData, freezeData, programState]);

  // Debounced auto-save
  useEffect(() => {
    if (!user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { saveData(); }, 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [saveData, user]);

  // Streak & penalty check
  useEffect(() => {
    if (!user) return;
    const d = today();
    if (lastCheck === d) return;
    if (lastCheck && lastCheck !== d) {
      const ck = new Date(lastCheck); const td = new Date(d);
      let missed = 0; const dt = new Date(ck); dt.setDate(dt.getDate() + 1);
      while (dt < td) {
        const ds = dt.toISOString().split("T")[0];
        if (!workoutLog[ds]) missed++;
        dt.setDate(dt.getDate() + 1);
      }
      if (missed > 0) {
        // Don't penalize frozen days
        const actualMissed = missed - (freezeData?.freezesUsed || []).filter(fd => {
          const fDate = new Date(fd);
          return fDate > ck && fDate < td;
        }).length;
        const pen = Math.max(0, actualMissed) * DAILY_PENALTY;
        if (pen <= 0) { setLastCheck(d); return; }
        setTotalXP(p => Math.max(0, p - pen));
        const id = Date.now();
        setXpEvents(p => [...p, { id, amount: -pen, reason: `${missed} day${missed > 1 ? "s" : ""} missed!` }]);
        setTimeout(() => setXpEvents(p => p.filter(e => e.id !== id)), 2500);
      }
    }
    let s = 0; const dt2 = new Date(); dt2.setDate(dt2.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const ds = dt2.toISOString().split("T")[0];
      if (workoutLog[ds] || isDayFrozen(freezeData, ds)) { s++; dt2.setDate(dt2.getDate() - 1); } else break;
    }
    setStreak(s); setLastCheck(d);
  }, [user, habitLog, lastCheck]);

  // Add XP with streak multiplier + confetti
  const addXP = useCallback((amount, reason) => {
    const mult = getStreakMult(streak);
    const actual = Math.floor(amount * mult);
    setConfetti(c => c + 1);
    setTotalXP(prev => {
      const oldLv = getLevel(prev);
      const nxp = prev + actual;
      const nLv = getLevel(nxp);
      if (nLv > oldLv) {
        setTimeout(() => {
          setLevelUp({ level: nLv, rank: getRank(nLv) });
          setLevelUpShow({ level: nLv, rank: getRank(nLv) });
          playLevelUp();
        }, 300);
      }
      return nxp;
    });
    const id = Date.now() + Math.random();
    setXpEvents(p => [...p, { id, amount: actual, reason: reason + (mult > 1 ? ` (×${mult})` : "") }]);
    setTimeout(() => setXpEvents(p => p.filter(e => e.id !== id)), 1600);
    logActivity("xp", `+${actual} XP: ${reason}`);
    playXP();
  }, [streak]);

  // Logout
  const logout = async () => {
    await saveData();
    await signOut(auth);
    setUser(null); setFoodLog({}); setHabits(DEFAULT_HABITS); setHabitLog({});
    setTasks([]); setJournal({}); setFinances([]); setProfile({});
    setChatHistory([]); setTotalXP(0); setWorkoutLog({}); setStreak(0);
    setPillarProg({}); setActivityLog([]); setFocusLog({}); setRoutineData(null);
    setMasteryData(null); setBodyData(null); setChallengeData(null); setProgramData(null); setFreezeData(null);
  };

  // AI action handler
  const handleAI = (a) => {
    if (!a) return;
    try {
      const x = typeof a === "string" ? JSON.parse(a) : a;
      if (x.type === "add_task") setTasks(p => [...p, { id: Date.now(), text: x.text, done: false, priority: x.priority || "medium", created: today() }]);
      if (x.type === "add_habit") setHabits(p => [...p, { id: `h${Date.now()}`, name: x.name, icon: x.icon || "⭐", pillar: x.pillar || "power" }]);
      if (x.type === "navigate") setPage(x.page);
    } catch { }
  };

  // Exit confirmation
  const [showExitModal, setShowExitModal] = useState(false);
  useEffect(() => {
    window.history.pushState({ ignite: true }, "");
    const handlePopState = () => { setShowExitModal(true); window.history.pushState({ ignite: true }, ""); };
    const handleBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ""; return ""; };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => { window.removeEventListener("popstate", handlePopState); window.removeEventListener("beforeunload", handleBeforeUnload); };
  }, []);

  // Loading screen
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#060a0c" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 12, animation: "float 2s ease-in-out infinite", filter: "drop-shadow(0 0 15px rgba(16,185,129,.5))" }}>🔥</div>
        <div style={{ color: "#10b981", fontSize: 22, fontWeight: 900, letterSpacing: 6, fontFamily: "Rajdhani,sans-serif" }}>IGNITE</div>
        <div style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>Loading your data...</div>
      </div>
    </div>
  );

  if (!user) return <AuthPage />;

  // Onboarding for new users
  const handleOnboardingComplete = async (profileData) => {
    setProfile(p => ({ ...p, ...profileData }));
    await store.saveUserData(user.uid, { profile: { ...profile, ...profileData } });
  };

  if (!profile.onboardingComplete) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  // Tutorial overlay for first-time users
  const handleTutorialComplete = async () => {
    setShowTutorial(false);
    await store.saveUserData(user.uid, { tutorialDone: true });
  };

  const appState = { foodLog, habits, habitLog, tasks, journal, finances, profile, user, pillarProg, focusLog, workoutLog, oracleChats: chatHistory, routineData, masteryData, bodyData, challengeData, freezeData, programState };

  const pages = {
    dashboard: <Dashboard appState={appState} setPage={setPage} totalXP={totalXP} streak={streak} workoutLog={workoutLog} foodLog={foodLog} focusLog={focusLog} habitLog={habitLog} freezeData={freezeData} setFreezeData={setFreezeData} addXP={addXP} />,
    training: <TrainingPage totalXP={totalXP} addXP={addXP} workoutLog={workoutLog} setWorkoutLog={setWorkoutLog} profile={profile} masteryData={masteryData} setMasteryData={setMasteryData} programState={programState} setProgramState={setProgramState} />,
    nutrition: <Nutrition foodLog={foodLog} setFoodLog={setFoodLog} addXP={addXP} profile={profile} />,
    dailyquest: <DailyQuestPage habits={habits} setHabits={setHabits} habitLog={habitLog} setHabitLog={setHabitLog} addXP={addXP} workoutLog={workoutLog} />,
    missions: <MissionsPage tasks={tasks} setTasks={setTasks} addXP={addXP} />,
    focus: <FocusTimer addXP={addXP} focusLog={focusLog} setFocusLog={setFocusLog} />,
    wellness: <Wellness journal={journal} setJournal={setJournal} addXP={addXP} />,
    finance: <FinancePage finances={finances} setFinances={setFinances} addXP={addXP} />,
    routine: <RoutinePage profile={profile} routineData={routineData} setRoutineData={setRoutineData} />,
    growth: <GrowthPage pillarProg={pillarProg} setPillarProg={setPillarProg} />,
    oracle: <FlameOracle appState={appState} addXP={addXP} setFoodLog={setFoodLog} setWorkoutLog={setWorkoutLog} setPage={setPage} profile={profile} totalXP={totalXP} streak={streak} workoutLog={workoutLog} routineData={routineData} setRoutineData={setRoutineData} />,
    profile: <ProfilePage profile={profile} setProfile={setProfile} user={user} onLogout={logout} totalXP={totalXP} streak={streak} workoutLog={workoutLog} activityLog={activityLog} appState={appState} freezeData={freezeData} />,
    body: <BodyTracker bodyData={bodyData} setBodyData={setBodyData} />,
    challenges: <ChallengesPage challengeData={challengeData} setChallengeData={setChallengeData} addXP={addXP} />,
    share: <ShareCard totalXP={totalXP} streak={streak} workoutLog={workoutLog} profile={profile} />,
    social: <SocialPage user={user} profile={profile} totalXP={totalXP} streak={streak} workoutLog={workoutLog} />,
    programs: <WorkoutPrograms programData={programData} setProgramData={setProgramData} addXP={addXP} />,
  };

  // Get current page label for header
  const allNavItems = [...navItems.filter(n => !n.submenu), ...(navItems.find(n => n.submenu)?.submenu || [])];
  const currentLabel = allNavItems.find(n => n.key === page)?.label || "IGNITE";

  return (
    <ErrorBoundary>
      <XPToast xpEvents={xpEvents} />
      {levelUp && <LevelUpOverlay level={levelUp.level} rank={levelUp.rank} onClose={() => setLevelUp(null)} />}
      {showTutorial && <OnboardingTutorial onComplete={handleTutorialComplete} />}

      <div style={{ display: "flex", height: "100vh", background: "#060a0c", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "fixed", top: "-20%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,.025),transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        {sideOpen && <div onClick={() => { setSideOpen(false); setMoreOpen(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 45, backdropFilter: "blur(4px)" }} />}

        {/* Sidebar */}
        <nav style={{ width: sideOpen ? 240 : 72, minWidth: sideOpen ? 240 : 72, background: "linear-gradient(180deg,rgba(10,10,18,.99),rgba(8,8,14,.99))", borderRight: "1px solid rgba(16,185,129,.06)", display: "flex", flexDirection: "column", transition: "all .3s", zIndex: 50, position: isMobile ? "fixed" : "relative", height: "100%", left: isMobile && !sideOpen ? -72 : 0 }}>
          {/* Logo */}
          <div onClick={() => setSideOpen(!sideOpen)} style={{ padding: "20px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#10b981,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff", flexShrink: 0, fontFamily: "Rajdhani,sans-serif" }}>I</div>
            {sideOpen && <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "Rajdhani,sans-serif", background: "linear-gradient(135deg,#10b981,#06b6d4,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 4 }}>IGNITE</span>}
          </div>

          {/* Nav Items */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
            {navItems.map(n => {
              if (n.submenu) {
                // "More" button with expandable submenu
                return (
                  <div key={n.key}>
                    <div className={`ni ${moreOpen ? "act" : ""}`} onClick={() => setMoreOpen(!moreOpen)}>
                      <span style={{ fontSize: 18, width: 24, textAlign: "center", flexShrink: 0 }}>{n.icon}</span>
                      {sideOpen && <span>{n.label}</span>}
                      {sideOpen && <span style={{ marginLeft: "auto", fontSize: 10, color: "#4b5563" }}>{moreOpen ? "▾" : "▸"}</span>}
                    </div>
                    {moreOpen && sideOpen && (
                      <div style={{ paddingLeft: 16, background: "rgba(255,255,255,.01)" }}>
                        {n.submenu.map(sub => (
                          <div key={sub.key} className={`ni ${page === sub.key ? "act" : ""}`}
                            onClick={() => { setPage(sub.key); setSideOpen(false); setMoreOpen(false); }}
                            style={{ padding: "8px 12px", fontSize: 13 }}>
                            <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 }}>{sub.icon}</span>
                            <span>{sub.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {moreOpen && !sideOpen && (
                      <div style={{ position: "absolute", left: 72, top: "auto", background: "#0d1117", border: "1px solid rgba(16,185,129,.08)", borderRadius: 12, padding: 8, zIndex: 60, minWidth: 180, boxShadow: "0 8px 30px rgba(0,0,0,.5)" }}>
                        {n.submenu.map(sub => (
                          <div key={sub.key} className={`ni ${page === sub.key ? "act" : ""}`}
                            onClick={() => { setPage(sub.key); setMoreOpen(false); }}
                            style={{ padding: "8px 12px", fontSize: 13, borderRadius: 8 }}>
                            <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{sub.icon}</span>
                            <span>{sub.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              // Regular nav item
              return (
                <div key={n.key} className={`ni ${page === n.key ? "act" : ""}`}
                  onClick={() => { setPage(n.key); setSideOpen(false); setMoreOpen(false); }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: "center", flexShrink: 0 }}>{n.icon}</span>
                  {sideOpen && <span>{n.label}</span>}
                </div>
              );
            })}
          </div>

          {/* Logout */}
          <div className="ni" onClick={logout} style={{ margin: "8px 8px 16px", color: "#ef4444" }}>
            <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>⏻</span>
            {sideOpen && <span>Log Out</span>}
          </div>
        </nav>

        {/* Main Content */}
        <main style={{ flex: 1, overflow: "auto", position: "relative", zIndex: 1 }}>
          <header style={{ padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(6,10,12,.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(16,185,129,.05)", position: "sticky", top: 0, zIndex: 30, gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              {isMobile && <span onClick={() => setSideOpen(true)} style={{ cursor: "pointer", fontSize: 22, color: "#6b7280" }}>☰</span>}
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>{currentLabel}</h2>
            </div>
            <HeaderXPBar totalXP={totalXP} streak={streak} />
            <div onClick={() => setPage("profile")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 10px 4px 14px", borderRadius: 100, background: "rgba(16,185,129,.04)", border: "1px solid rgba(16,185,129,.08)", flexShrink: 0 }}>
              <span className="do" style={{ fontSize: 12, color: "#34d399" }}>{user.name}</span>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>{user.name?.[0]?.toUpperCase() || "U"}</div>
            </div>
          </header>
          <div className="page-enter" key={page} style={{ padding: "14px min(24px, 4vw)", maxWidth: 1120, margin: "0 auto", overflowX: "hidden" }}>
            {pages[page]}
          </div>
        </main>

        {/* Overlays */}
        <ConfettiBlast trigger={confetti} />
        {levelUpShow && <LevelUpCelebration level={levelUpShow.level} rank={levelUpShow.rank} onClose={() => setLevelUpShow(null)} />}

        {/* Exit Modal */}
        {showExitModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(3,4,7,.85)", backdropFilter: "blur(8px)" }}>
            <div className="gs fade-in" style={{ maxWidth: 360, width: "90%", textAlign: "center", padding: 28, border: "1px solid rgba(16,185,129,.15)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔥</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>Leave IGNITE?</div>
              <p style={{ color: "#6b7280", fontSize: 13, marginTop: 8, marginBottom: 24 }}>Your progress is saved, but your streak depends on you coming back.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowExitModal(false)} className="bp" style={{ flex: 1, padding: 14 }}>Stay & Train</button>
                <button onClick={() => { setShowExitModal(false); window.history.go(-2); }} className="bg" style={{ flex: 1, padding: 14, color: "#ef4444" }}>Leave</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}