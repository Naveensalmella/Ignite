"use client";
import { useEffect, useRef, lazy, Suspense } from 'react';

import { DEFAULT_HABITS, navItems, DAILY_PENALTY } from '@/data/index';
import { getLevel, getRank, today } from '@/utils';
import store from '@/store';
import storeV2 from '@/store-v2';
import useAppStore from '@/stores/useAppStore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { isDayFrozen } from './StreakFreeze';
import { registerSW, startNotifScheduler } from '@/notifications';
import { applyAccent } from './AccentPicker';
import { play } from './soundEngine';

// ── Lazy-loaded page components (code splitting) ──
const AuthPage = lazy(() => import('./AuthPage'));
const Dashboard = lazy(() => import('./Dashboard'));
const TrainingPage = lazy(() => import('./TrainingPage'));
const Nutrition = lazy(() => import('./Nutrition'));
const DailyQuestPage = lazy(() => import('./DailyQuestPage'));
const MissionsPage = lazy(() => import('./MissionsPage'));
const FocusTimer = lazy(() => import('./FocusTimer'));
const Wellness = lazy(() => import('./Wellness'));
const FinancePage = lazy(() => import('./FinancePage'));
const GrowthPage = lazy(() => import('./GrowthPage'));
const FlameOracle = lazy(() => import('./FlameOracle'));
const ProfilePage = lazy(() => import('./ProfilePage'));
const RoutinePage = lazy(() => import('./RoutinePage'));
const OnboardingPage = lazy(() => import('./OnboardingPage'));
const OnboardingTutorial = lazy(() => import('./OnboardingTutorial'));
const BodyTracker = lazy(() => import('./BodyTracker'));
const ChallengesPage = lazy(() => import('./ChallengesPage'));
const WorkoutPrograms = lazy(() => import('./WorkoutPrograms'));
const SocialPage = lazy(() => import('./SocialPage'));
const BodyProgress = lazy(() => import('./BodyProgress'));
const GamingHub = lazy(() => import('./GamingHub'));
const ShareCard = lazy(() => import('./ShareCard'));

// ── Eagerly loaded (always visible) ──
import XPToast from './XPToast';
import LevelUpOverlay from './LevelUpOverlay';
import HeaderXPBar from './HeaderXPBar';
import { ConfettiBlast, LevelUpCelebration } from './Confetti';
import PullToRefresh from './PullToRefresh';
import { MilestoneOverlay } from './GamingHub';
import BottomNav from './BottomNav';
import PageTransition from './PageTransition';
import ErrorBoundary from './ErrorBoundary';
import { SkeletonPage } from './Loading';
import { DashboardSkeleton, TrainingSkeleton, NutritionSkeleton } from './ui/Skeleton';

// Global error handler
if (typeof window !== 'undefined') {
    const ro = window.onerror;
    window.onerror = (msg, ...args) => {
        if (typeof msg === 'string' && msg.includes('ResizeObserver')) return true;
        return ro ? ro(msg, ...args) : false;
    };
    window.onerror = (msg, src, line, col, err) => { console.error("Global error:", msg, err); return false; };
    window.onunhandledrejection = (e) => { console.error("Unhandled promise:", e.reason); };
}

// ── Loading fallback for lazy components ──
function PageLoader() {
    return <SkeletonPage />;
}

export default function App({ externalUser = null }) {
    // ── Pull state from Zustand store ──
    const {
        user, setUser, loading, setLoading,
        page, setPage, setPageSilent,
        sideOpen, setSideOpen, moreOpen, setMoreOpen,
        isMobile, setIsMobile,
        showExitModal, setShowExitModal,
        showTutorial, setShowTutorial,

        // Data
        profile, setProfile, workoutLog, setWorkoutLog, foodLog, setFoodLog,
        journal, setJournal, habits, setHabits, habitLog, setHabitLog,
        tasks, setTasks, finances, setFinances, chatHistory, setChatHistory,
        focusLog, setFocusLog, pillarProg, setPillarProg,
        activityLog, routineData, setRoutineData,
        masteryData, setMasteryData, bodyData, setBodyData,
        challengeData, setChallengeData, programData, setProgramData,
        freezeData, setFreezeData, programState, setProgramState,
        xpLog, loginData, setLoginData, activeTitle, setActiveTitle,
        questChainData, setQuestChainData, bodyPhotos, setBodyPhotos,

        // XP & Gamification
        totalXP, setTotalXP, streak, setStreak, lastCheck, setLastCheck,
        xpEvents, confetti, levelUp, setLevelUp, levelUpShow, setLevelUpShow,
        milestone, setMilestone, shareCard,
        addXP, getAppState,

        // Actions
        loadUserData, saveData, logout,
    } = useAppStore();

    const saveTimer = useRef(null);

    // Apply saved accent color + register service worker
    useEffect(() => {
        applyAccent(localStorage.getItem('ignite-accent') || 'emerald');
        registerSW();
    }, []);

    // ── URL hash sync: read hash on load ──
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const hash = window.location.hash.replace('#', '');
        if (hash && hash !== page) {
            setPageSilent(hash);
        }
        const onHashChange = () => {
            const h = window.location.hash.replace('#', '');
            if (h) setPageSilent(h);
        };
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    // Start notification scheduler when user is logged in
    useEffect(() => {
        if (!user) return;
        const d = today();
        startNotifScheduler(() => ({
            todayWorkout: !!workoutLog[d],
            streak,
        }));
    }, [user, workoutLog, streak]);

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
                try { await store.saveUserData(firebaseUser.uid, { email: firebaseUser.email }, true); } catch { }
                await loadUserData(u.uid);
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Debounced auto-save
    useEffect(() => {
        if (!user) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => { saveData(); }, 2000);
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, [user, foodLog, habits, habitLog, tasks, journal, finances, profile,
        chatHistory, totalXP, workoutLog, streak, lastCheck, pillarProg,
        activityLog, focusLog, routineData, masteryData, bodyData,
        challengeData, programData, freezeData, programState,
        xpLog, loginData, activeTitle, questChainData]);

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
                const actualMissed = missed - (freezeData?.freezesUsed || []).filter(fd => {
                    const fDate = new Date(fd);
                    return fDate > ck && fDate < td;
                }).length;
                const pen = Math.max(0, actualMissed) * DAILY_PENALTY;
                if (pen <= 0) { setLastCheck(d); return; }
                setTotalXP(p => Math.max(0, p - pen));
                const id = Date.now();
                useAppStore.getState().setXpEvents(p => [...p, { id, amount: -pen, reason: `${missed} day${missed > 1 ? "s" : ""} missed!` }]);
                setTimeout(() => useAppStore.getState().setXpEvents(p => p.filter(e => e.id !== id)), 2500);
            }
        }
        try {
            let s = 0; const dt2 = new Date(); dt2.setDate(dt2.getDate() - 1);
            for (let i = 0; i < 365; i++) {
                const ds = dt2.toISOString().split("T")[0];
                if ((workoutLog || {})[ds] || isDayFrozen(freezeData, ds)) { s++; dt2.setDate(dt2.getDate() - 1); } else break;
            }
            setStreak(s);
        } catch (e) { console.error("Streak calc error:", e); }
        setLastCheck(d);
    }, [user, habitLog, lastCheck]);

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

    // Exit confirmation + save-on-exit
    useEffect(() => {
        window.history.pushState({ ignite: true }, "");
        const handlePopState = () => { setShowExitModal(true); window.history.pushState({ ignite: true }, ""); };
        const handleBeforeUnload = (e) => {
            if (useAppStore.getState().user && saveTimer.current) {
                clearTimeout(saveTimer.current);
                useAppStore.getState().saveData();
            }
            e.preventDefault(); e.returnValue = ""; return "";
        };
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden" && useAppStore.getState().user) {
                if (saveTimer.current) clearTimeout(saveTimer.current);
                useAppStore.getState().saveData();
            }
        };
        window.addEventListener("popstate", handlePopState);
        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => { window.removeEventListener("popstate", handlePopState); window.removeEventListener("beforeunload", handleBeforeUnload); document.removeEventListener("visibilitychange", handleVisibilityChange); };
    }, []);

    // Loading screen
    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-[#060a0c]">
            <div className="text-center">
                <div className="text-[44px] mb-3" style={{ animation: "float 2s ease-in-out infinite", filter: "drop-shadow(0 0 15px rgba(16,185,129,.5))" }}>🔥</div>
                <div className="text-emerald-500 text-[22px] font-black tracking-[6px] font-heading">IGNITE</div>
                <div className="text-gray-500 text-xs mt-2">Loading your data...</div>
            </div>
        </div>
    );

    if (!user) return <Suspense fallback={<PageLoader />}><AuthPage /></Suspense>;

    // Onboarding for new users
    const handleOnboardingComplete = async (profileData) => {
        setProfile(p => ({ ...p, ...profileData }));
        await store.saveUserData(user.uid, { profile: { ...profile, ...profileData } });
    };

    if (!profile.onboardingComplete) {
        return <Suspense fallback={<PageLoader />}><OnboardingPage onComplete={handleOnboardingComplete} /></Suspense>;
    }

    // Tutorial overlay
    const handleTutorialComplete = async () => {
        setShowTutorial(false);
        await store.saveUserData(user.uid, { tutorialDone: true });
    };

    const appState = getAppState();

    const pages = {
        dashboard: <Dashboard appState={appState} setPage={setPage} totalXP={totalXP} streak={streak} workoutLog={workoutLog} foodLog={foodLog} focusLog={focusLog} habitLog={habitLog} freezeData={freezeData} setFreezeData={setFreezeData} addXP={addXP} xpLog={xpLog} loginData={loginData} setLoginData={setLoginData} />,
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
        profile: <ProfilePage profile={profile} setProfile={setProfile} user={user} onLogout={logout} totalXP={totalXP} streak={streak} workoutLog={workoutLog} activityLog={activityLog} appState={appState} freezeData={freezeData} setPage={setPage} />,
        body: <BodyTracker bodyData={bodyData} setBodyData={setBodyData} />,
        challenges: <ChallengesPage challengeData={challengeData} setChallengeData={setChallengeData} addXP={addXP} />,
        share: <ShareCard totalXP={totalXP} streak={streak} workoutLog={workoutLog} profile={profile} />,
        bodyphotos: <BodyProgress bodyPhotos={bodyPhotos} setBodyPhotos={setBodyPhotos} userId={user?.uid} />,
        social: <SocialPage user={user} profile={profile} totalXP={totalXP} streak={streak} workoutLog={workoutLog} addXP={addXP} />,
        gaming: <GamingHub appState={appState} totalXP={totalXP} streak={streak} workoutLog={workoutLog} addXP={addXP} profile={profile} loginData={loginData} setLoginData={setLoginData} xpLog={xpLog} activeTitle={activeTitle} setActiveTitle={setActiveTitle} questChainData={questChainData} setQuestChainData={setQuestChainData} />,
        programs: <WorkoutPrograms programData={programData} setProgramData={setProgramData} addXP={addXP} />,
    };

    const allNavItems = [...navItems.filter(n => !n.submenu), ...(navItems.find(n => n.submenu)?.submenu || [])];
    const currentLabel = allNavItems.find(n => n.key === page)?.label || "IGNITE";

    return (
        <ErrorBoundary>
            <XPToast xpEvents={xpEvents} />
            <MilestoneOverlay milestone={milestone} onClose={() => setMilestone(null)} />
            <BottomNav active={page} setPage={setPage} />
            {levelUp && <LevelUpOverlay level={levelUp.level} rank={levelUp.rank} onClose={() => setLevelUp(null)} />}
            {showTutorial && <Suspense fallback={<PageLoader />}><OnboardingTutorial onComplete={handleTutorialComplete} /></Suspense>}

            <div className="app-shell flex flex-col h-screen bg-[#060a0c] overflow-hidden relative w-full">
                <div className="fixed -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full pointer-events-none z-0" style={{ background: "radial-gradient(circle,rgba(16,185,129,.025),transparent 70%)" }} />

                {/* Main Content */}
                <main className="flex-1 pb-[70px] overflow-auto relative z-[1]">
                    <header className="px-6 py-3 flex justify-between items-center bg-[rgba(6,10,12,.92)] backdrop-blur-[20px] border-b border-emerald-500/5 fixed top-0 left-0 right-0 z-30 gap-3">
                        <div className="app-header">
                            <h2 className="text-base font-bold text-gray-100 font-heading tracking-[1px]">{currentLabel}</h2>
                        </div>
                        <HeaderXPBar totalXP={totalXP} streak={streak} />
                    </header>
                    <div className="px-[min(24px,4vw)] pt-[72px] pb-[70px] max-w-[1120px] mx-auto overflow-x-hidden overflow-y-auto flex-1" style={{ padding: "14px min(24px, 4vw)", paddingTop: 72, paddingBottom: 70 }}>
                        <PullToRefresh onRefresh={async () => { if (user) await loadUserData(user.uid); }}>
                            <PageTransition pageKey={page}>
                                <Suspense fallback={page === "dashboard" ? <DashboardSkeleton /> : page === "training" ? <TrainingSkeleton /> : page === "nutrition" ? <NutritionSkeleton /> : <PageLoader />}>
                                    {pages[page]}
                                </Suspense>
                            </PageTransition>
                        </PullToRefresh>
                    </div>
                </main>

                {/* Overlays */}
                <ConfettiBlast trigger={confetti} />
                {levelUpShow && <LevelUpCelebration level={levelUpShow.level} rank={levelUpShow.rank} onClose={() => setLevelUpShow(null)} />}

                {/* Exit Modal */}
                {showExitModal && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[rgba(3,4,7,.85)] backdrop-blur-lg">
                        <div className="gs fade-in max-w-[360px] w-[90%] text-center p-7 border border-emerald-500/15">
                            <div className="text-[40px] mb-3">🔥</div>
                            <div className="text-xl font-extrabold text-gray-100 font-heading tracking-[1px]">Leave IGNITE?</div>
                            <p className="text-gray-500 text-[13px] mt-2 mb-6">Your progress is saved, but your streak depends on you coming back.</p>
                            <div className="flex gap-[10px]">
                                <button onClick={() => setShowExitModal(false)} className="bp flex-1 p-[14px]">Stay & Train</button>
                                <button onClick={() => { setShowExitModal(false); window.history.go(-2); }} className="bg flex-1 p-[14px] !text-red-500">Leave</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
}
