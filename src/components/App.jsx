"use client";
import { useEffect, useRef, useState, lazy, Suspense } from 'react';

import { today } from '@/utils';
import useAppStore, { computeStreak } from '@/stores/useAppStore';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import store from '@/store';
import { registerSW, startNotifScheduler, stopNotifScheduler } from '@/notifications';
import { applyAccent, ACCENT_KEY } from './AccentPicker';

// ── Lazy-loaded page components (code splitting) ──
const AuthPage = lazy(() => import('./AuthPage'));
const IntroPage = lazy(() => import('./IntroPage'));
const StatusPage = lazy(() => import('./system/StatusPage'));
const QuestsPage = lazy(() => import('./system/QuestsPage'));
const InventoryPage = lazy(() => import('./system/InventoryPage'));
const ProgressPage = lazy(() => import('./ProgressPage'));
const TrainingPage = lazy(() => import('./TrainingPage'));
const Nutrition = lazy(() => import('./Nutrition'));
const MissionsPage = lazy(() => import('./MissionsPage'));
const FocusTimer = lazy(() => import('./FocusTimer'));
const Wellness = lazy(() => import('./Wellness'));
const FinancePage = lazy(() => import('./FinancePage'));
const FlameOracle = lazy(() => import('./FlameOracle'));
const ProfilePage = lazy(() => import('./ProfilePage'));
const RoutinePage = lazy(() => import('./RoutinePage'));
const OnboardingPage = lazy(() => import('./OnboardingPage'));
const OnboardingTutorial = lazy(() => import('./OnboardingTutorial'));
const SocialPage = lazy(() => import('./SocialPage'));
const Awakening = lazy(() => import('./system/Awakening'));
const ShareCard = lazy(() => import('./ShareCard'));

// ── Eagerly loaded (always visible) ──
import XPToast from './XPToast';
import LevelUpOverlay from './LevelUpOverlay';
import HeaderXPBar from './HeaderXPBar';
import { ConfettiBlast } from './Confetti';
import { MilestoneOverlay } from './GamingHub';
import BottomNav, { SideNav, resolvePage, pageTitle } from './BottomNav';
import SystemNotices from './system/SystemNotices';
import PageTransition from './PageTransition';
import ErrorBoundary from './ErrorBoundary';
import SplashScreen from './SplashScreen';
import { SkeletonPage } from './Loading';
import { DashboardSkeleton, TrainingSkeleton, NutritionSkeleton } from './ui/Skeleton';

// Store fields that are persisted — any change schedules an auto-save.
const PERSISTED = [
    'profile', 'habits', 'tasks', 'totalXP', 'streak', 'lastCheck', 'pillarProg', 'routineData',
    'masteryData', 'bodyData', 'challengeData', 'programData', 'freezeData', 'programState',
    'loginData', 'activeTitle', 'questChainData', 'workoutLog', 'foodLog', 'journal', 'xpLog',
    'focusLog', 'habitLog', 'chatHistory', 'finances', 'activityLog', 'system',
];
const SAVE_DELAY = 1500;

const hashPage = () => {
    if (typeof window === 'undefined') return null;
    return window.location.hash.replace('#', '') || null;
};

function FullScreenMessage({ icon, title, children }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
            <div className="gs max-w-[380px] w-full text-center p-7">
                <div className="text-[44px] mb-3">{icon}</div>
                <div className="text-xl font-extrabold font-heading tracking-wide mb-2" style={{ color: "var(--text-primary)" }}>{title}</div>
                {children}
            </div>
        </div>
    );
}

function SyncBadge({ status }) {
    const map = {
        saving: { color: "#f59e0b", label: "Saving…" },
        saved: { color: "#22c55e", label: "Saved" },
        error: { color: "#ef4444", label: "Not saved — retrying" },
        offline: { color: "#f59e0b", label: "Offline — will sync" },
    };
    const s = map[status];
    if (!s) return null;
    return (
        <span className="sync-badge" title={s.label} aria-live="polite">
            <span className="sync-dot" style={{ background: s.color }} />
            <span className="sync-label">{s.label}</span>
        </span>
    );
}

export default function App() {
    const {
        user, loading, dataReady, loadError, syncStatus, page, setPage, setPageSilent,
        showTutorial, setShowTutorial,
        profile, setProfile, workoutLog, setWorkoutLog, foodLog, setFoodLog,
        journal, setJournal,
        tasks, setTasks, finances, setFinances, setChatHistory,
        focusLog, setFocusLog,
        activityLog, routineData, setRoutineData,
        bodyData, setBodyData, freezeData, programState, setProgramState,
        bodyPhotos, setBodyPhotos, system,
        totalXP, streak, xpEvents, confetti, levelUp, setLevelUp,
        milestone, setMilestone, addXP, getAppState, loadUserData, logout,
    } = useAppStore();

    const saveTimer = useRef(null);
    const [awakenLater, setAwakenLater] = useState(false);
    const [awakenOpen, setAwakenOpen] = useState(false); // keeps the "Player Awakened" summary up after accepting
    const [showIntro, setShowIntro] = useState(() => {
        try { return typeof window !== 'undefined' && !localStorage.getItem("ignite_visited"); } catch { return false; }
    });

    // ── One-time browser setup ──
    useEffect(() => {
        try { applyAccent(localStorage.getItem(ACCENT_KEY) || 'system'); } catch { /* ignore */ }
        registerSW();
    }, []);

    // ── Firebase auth: the single source of the signed-in user ──
    useEffect(() => {
        if (!isFirebaseConfigured) { useAppStore.getState().setLoading(false); return; }
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            const st = useAppStore.getState();
            if (fbUser) {
                st.setUser({
                    uid: fbUser.uid,
                    email: fbUser.email,
                    name: fbUser.displayName || (fbUser.email || 'Warrior').split('@')[0],
                    username: fbUser.uid,
                });
                st.setLoading(false);
                await st.loadUserData(fbUser.uid);
            } else {
                st.setUser(null);
                st.setLoading(false);
            }
        });
        return () => unsub();
    }, []);

    // ── Navigation: URL hash ⇄ page, with real browser history ──
    useEffect(() => {
        // Note: never replaceState here — this runs before Next.js patches the history
        // API, and an entry without Next's internal state makes Back do a full reload.
        const initial = hashPage();
        if (initial) setPageSilent(initial);
        const onPop = () => setPageSilent(hashPage() || 'status');
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, [setPageSilent]);

    // ── Auto-save: debounce any change to persisted data ──
    useEffect(() => {
        const schedule = () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => { saveTimer.current = null; useAppStore.getState().saveData(); }, SAVE_DELAY);
        };
        const flush = () => {
            if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
            useAppStore.getState().saveData();
        };
        const unsub = useAppStore.subscribe((cur, prev) => {
            if (!cur.user || !cur.dataReady) return;
            if (PERSISTED.some(k => cur[k] !== prev[k])) schedule();
        });
        const onHidden = () => { if (document.visibilityState === 'hidden') flush(); };
        const onVisible = () => { if (document.visibilityState === 'visible') useAppStore.getState().runDailyCheck(); };
        const onOnline = () => flush();
        document.addEventListener('visibilitychange', onHidden);
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('pagehide', flush);
        window.addEventListener('online', onOnline);
        return () => {
            unsub();
            document.removeEventListener('visibilitychange', onHidden);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('pagehide', flush);
            window.removeEventListener('online', onOnline);
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, []);

    // Retry a failed save after a short pause.
    useEffect(() => {
        if (syncStatus !== 'error') return;
        const t = setTimeout(() => useAppStore.getState().saveData(), 10000);
        return () => clearTimeout(t);
    }, [syncStatus]);

    // ── Keep the streak in sync with logged workouts / freezes ──
    useEffect(() => {
        if (!dataReady) return;
        const next = computeStreak(workoutLog, freezeData);
        if (next !== useAppStore.getState().streak) useAppStore.getState().setStreak(next);
    }, [dataReady, workoutLog, freezeData]);

    // ── Publish the public profile once per session so friends can find this user ──
    useEffect(() => {
        if (!user || !dataReady) return;
        const t = setTimeout(() => {
            const st = useAppStore.getState();
            import('./SocialPage')
                .then(m => m.syncPublicProfile?.({ user: st.user, profile: st.profile, totalXP: st.totalXP, streak: st.streak, workoutLog: st.workoutLog, system: st.system }))
                .catch(() => { /* social is optional */ });
        }, 3000);
        return () => clearTimeout(t);
    }, [user, dataReady]);

    // ── Reminder notifications while signed in ──
    useEffect(() => {
        if (!user || !dataReady) return;
        startNotifScheduler(() => {
            const st = useAppStore.getState();
            const d = today();
            const day = st.workoutLog[d];
            return { todayWorkout: Array.isArray(day) ? day.length > 0 : !!day, streak: st.streak };
        });
        return () => stopNotifScheduler();
    }, [user, dataReady]);

    // ════════════════ Gates ════════════════
    if (!isFirebaseConfigured) {
        return (
            <FullScreenMessage icon="⚙️" title="Setup needed">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Firebase isn&apos;t configured for this deployment. Add the <code>NEXT_PUBLIC_FIREBASE_*</code> environment variables (see README) and redeploy.
                </p>
            </FullScreenMessage>
        );
    }

    if (loading) return <SplashScreen />;

    if (!user) {
        if (showIntro) {
            return (
                <Suspense fallback={<SplashScreen />}>
                    <IntroPage onGetStarted={() => { try { localStorage.setItem("ignite_visited", "true"); } catch { /* ignore */ } setShowIntro(false); }} />
                </Suspense>
            );
        }
        return <Suspense fallback={<SplashScreen />}><AuthPage /></Suspense>;
    }

    if (loadError) {
        return (
            <FullScreenMessage icon="📡" title="Couldn't load your data">
                <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>{loadError}</p>
                <div className="flex gap-[10px]">
                    <button type="button" className="bp flex-1" onClick={() => loadUserData(user.uid)}>Try again</button>
                    <button type="button" className="bg flex-1" onClick={logout}>Sign out</button>
                </div>
            </FullScreenMessage>
        );
    }

    if (!dataReady) return <SplashScreen message="Loading your progress…" />;

    // Onboarding for new users
    if (!profile.onboardingComplete) {
        const handleOnboardingComplete = (profileData) => {
            setProfile(p => ({ ...p, ...profileData, onboardingComplete: true }));
            useAppStore.getState().saveData();
        };
        return <Suspense fallback={<SplashScreen />}><OnboardingPage onComplete={handleOnboardingComplete} /></Suspense>;
    }

    const handleTutorialComplete = async () => {
        setShowTutorial(false);
        await store.saveUserData(user.uid, { tutorialDone: true });
    };

    const appState = getAppState();

    // Old page keys (bookmarks, AI navigation) open the feature's new home.
    const current = resolvePage(page) || 'status';

    const renderPage = () => {
        switch (current) {
            case 'quests': return <QuestsPage initialTab={page === 'growth' ? 'long' : page === 'dailyquest' ? 'habits' : 'daily'} />;
            case 'inventory': return <InventoryPage initialTab={page === 'gaming' ? 'achievements' : page === 'shop' ? 'shop' : 'inventory'} />;
            case 'training': return <TrainingPage totalXP={totalXP} addXP={addXP} workoutLog={workoutLog} setWorkoutLog={setWorkoutLog} profile={profile} programState={programState} setProgramState={setProgramState} />;
            case 'nutrition': return <Nutrition foodLog={foodLog} setFoodLog={setFoodLog} addXP={addXP} profile={profile} />;
            case 'missions': return <MissionsPage tasks={tasks} setTasks={setTasks} addXP={addXP} />;
            case 'focus': return <FocusTimer addXP={addXP} focusLog={focusLog} setFocusLog={setFocusLog} />;
            case 'wellness': return <Wellness journal={journal} setJournal={setJournal} addXP={addXP} />;
            case 'finance': return <FinancePage finances={finances} setFinances={setFinances} addXP={addXP} />;
            case 'routine': return <RoutinePage profile={profile} routineData={routineData} setRoutineData={setRoutineData} />;
            case 'oracle': return <FlameOracle appState={appState} addXP={addXP} setFoodLog={setFoodLog} setChatHistory={setChatHistory} setPage={setPage} profile={profile} totalXP={totalXP} streak={streak} workoutLog={workoutLog} />;
            case 'profile': return <ProfilePage profile={profile} setProfile={setProfile} user={user} onLogout={logout} totalXP={totalXP} streak={streak} workoutLog={workoutLog} activityLog={activityLog} appState={appState} freezeData={freezeData} setPage={setPage} />;
            case 'share': return <ShareCard totalXP={totalXP} streak={streak} workoutLog={workoutLog} profile={profile} />;
            case 'bodyphotos': return <ProgressPage bodyPhotos={bodyPhotos} setBodyPhotos={setBodyPhotos} userId={user?.uid} bodyData={bodyData} setBodyData={setBodyData} initialTab={page === 'body' ? 'measurements' : 'photos'} />;
            case 'social': return <SocialPage user={user} profile={profile} totalXP={totalXP} streak={streak} workoutLog={workoutLog} addXP={addXP} />;
            default: return <StatusPage />;
        }
    };

    const fallback = current === "status" ? <DashboardSkeleton /> : current === "training" ? <TrainingSkeleton /> : current === "nutrition" ? <NutritionSkeleton /> : <SkeletonPage />;

    return (
        <div className="app-shell">
            <XPToast xpEvents={xpEvents} />
            <MilestoneOverlay milestone={milestone} onClose={() => setMilestone(null)} />
            {levelUp && <LevelUpOverlay level={levelUp.level} rank={levelUp.rank} ap={levelUp.ap} onClose={() => setLevelUp(null)} />}
            <SystemNotices />
            {showTutorial && <Suspense fallback={null}><OnboardingTutorial onComplete={handleTutorialComplete} /></Suspense>}
            {!showTutorial && ((!system?.awakened && !awakenLater) || awakenOpen) && (
                <Suspense fallback={null}>
                    <Awakening onAccept={() => setAwakenOpen(true)} onClose={() => { setAwakenOpen(false); setAwakenLater(true); }} />
                </Suspense>
            )}

            <SideNav active={current} setPage={setPage} />

            <header className="app-header">
                <div className="app-header-inner">
                    <h1 className="page-title">{pageTitle(current)}</h1>
                    <SyncBadge status={syncStatus} />
                    <div className="app-header-xp">
                        <HeaderXPBar totalXP={totalXP} streak={streak} system={system} />
                    </div>
                </div>
            </header>

            <main className="app-main">
                <div className="app-content">
                    <ErrorBoundary key={current}>
                        <PageTransition pageKey={current}>
                            <Suspense fallback={fallback}>
                                {renderPage()}
                            </Suspense>
                        </PageTransition>
                    </ErrorBoundary>
                </div>
            </main>

            <BottomNav active={current} setPage={setPage} />

            <ConfettiBlast trigger={confetti} />
        </div>
    );
}
