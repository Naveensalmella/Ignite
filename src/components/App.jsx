"use client";
import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { today } from '@/utils';
import useAppStore, { computeStreak } from '@/stores/useAppStore';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import store from '@/store';
import { registerSW, startNotifScheduler, stopNotifScheduler } from '@/notifications';
import { applyAccent } from '@/lib/accent';

// ── Lazy-loaded screens (code splitting; the pages themselves are in PageRoutes) ──
const AuthPage = lazy(() => import('./AuthPage'));
const IntroPage = lazy(() => import('./IntroPage'));
const OnboardingPage = lazy(() => import('./OnboardingPage'));
const OnboardingTutorial = lazy(() => import('./OnboardingTutorial'));
const Awakening = lazy(() => import('./system/Awakening'));

// ── Eagerly loaded (always visible) ──
import PageRoute from './PageRoutes';
import XPToast from './XPToast';
import Celebrations from './Celebrations';
import HeaderXPBar from './HeaderXPBar';
import BottomNav, { SideNav, resolvePage, pageTitle } from './BottomNav';
import SystemNotices from './system/SystemNotices';
import { IconBadge } from './ui/kit';
import { Settings, WifiOff } from 'lucide-react';
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
            <div className="card max-w-[380px] w-full text-center !p-7">
                <div className="flex justify-center mb-4"><IconBadge icon={icon} tone="sky" size={56} /></div>
                <div className="text-xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>{title}</div>
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

// Header level chip: subscribes to XP/streak/penalty on its own.
function HeaderLevel() {
    const { totalXP, streak, system } = useAppStore(useShallow(s => ({ totalXP: s.totalXP, streak: s.streak, system: s.system })));
    return <HeaderXPBar totalXP={totalXP} streak={streak} system={system} />;
}

export default function App() {
    // Only what the shell itself needs — pages subscribe to their own data (PageRoutes).
    const {
        user, loading, dataReady, loadError, syncStatus, page, setPage, setPageSilent,
        showTutorial, setShowTutorial, onboarded, awakened, setProfile, loadUserData, logout,
    } = useAppStore(useShallow(s => ({
        user: s.user, loading: s.loading, dataReady: s.dataReady, loadError: s.loadError, syncStatus: s.syncStatus,
        page: s.page, setPage: s.setPage, setPageSilent: s.setPageSilent, showTutorial: s.showTutorial,
        setShowTutorial: s.setShowTutorial, onboarded: !!s.profile?.onboardingComplete, awakened: !!s.system?.awakened,
        setProfile: s.setProfile, loadUserData: s.loadUserData, logout: s.logout,
    })));

    const saveTimer = useRef(null);
    const [awakenLater, setAwakenLater] = useState(false);
    const [awakenOpen, setAwakenOpen] = useState(false); // keeps the "Player Awakened" summary up after accepting
    const [showIntro, setShowIntro] = useState(() => {
        try { return typeof window !== 'undefined' && !localStorage.getItem("ignite_visited"); } catch { return false; }
    });

    // ── One-time browser setup ──
    useEffect(() => {
        // Colours are locked to the B6 palette (globals.css); clear any old custom accent.
        applyAccent('system');
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

    // ── Skills, titles and Shadow Army power follow your progress (debounced) ──
    useEffect(() => {
        const WATCH = ['workoutLog', 'foodLog', 'focusLog', 'journal', 'habitLog', 'habits', 'tasks', 'finances', 'streak', 'system', 'dataReady'];
        let t = null;
        const run = () => { t = null; import('@/lib/system/actions').then(m => m.checkUnlocks()).catch(() => { /* optional */ }); };
        const unsub = useAppStore.subscribe((cur, prev) => {
            if (!cur.dataReady || !cur.system?.awakened) return;
            if (WATCH.some(k => cur[k] !== prev[k])) { if (t) clearTimeout(t); t = setTimeout(run, 1200); }
        });
        return () => { unsub(); if (t) clearTimeout(t); };
    }, []);

    // Retry a failed save after a short pause.
    useEffect(() => {
        if (syncStatus !== 'error') return;
        const t = setTimeout(() => useAppStore.getState().saveData(), 10000);
        return () => clearTimeout(t);
    }, [syncStatus]);

    // ── Keep the streak in sync with logged workouts / freezes ──
    useEffect(() => {
        const sync = (st) => {
            if (!st.dataReady) return;
            const next = computeStreak(st.workoutLog, st.freezeData);
            if (next !== st.streak) st.setStreak(next);
        };
        sync(useAppStore.getState());
        return useAppStore.subscribe((cur, prev) => {
            if (cur.dataReady !== prev.dataReady || cur.workoutLog !== prev.workoutLog || cur.freezeData !== prev.freezeData) sync(cur);
        });
    }, []);

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
            <FullScreenMessage icon={Settings} title="Setup needed">
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
            <FullScreenMessage icon={WifiOff} title="Couldn't load your data">
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
    if (!onboarded) {
        const handleOnboardingComplete = (profileData) => {
            setProfile(p => ({ ...p, ...profileData, onboardingComplete: true }));
            useAppStore.getState().saveData();
        };
        // The sign-up form already asked for a name (Firebase displayName) — don't ask twice.
        const knownName = auth?.currentUser?.displayName || "";
        return <Suspense fallback={<SplashScreen />}><OnboardingPage initialName={knownName} onComplete={handleOnboardingComplete} /></Suspense>;
    }

    const handleTutorialComplete = async () => {
        setShowTutorial(false);
        await store.saveUserData(user.uid, { tutorialDone: true });
    };

    // Old page keys (bookmarks, AI navigation) open the feature's new home.
    const current = resolvePage(page) || 'status';

    const fallback = current === "status" ? <DashboardSkeleton /> : current === "training" ? <TrainingSkeleton /> : current === "nutrition" ? <NutritionSkeleton /> : <SkeletonPage />;

    return (
        <div className="app-shell">
            <XPToast />
            <SystemNotices />
            <Celebrations />
            {showTutorial && <Suspense fallback={null}><OnboardingTutorial onComplete={handleTutorialComplete} /></Suspense>}
            {!showTutorial && ((!awakened && !awakenLater) || awakenOpen) && (
                <Suspense fallback={null}>
                    <Awakening onAccept={() => setAwakenOpen(true)} onClose={() => { setAwakenOpen(false); setAwakenLater(true); }} />
                </Suspense>
            )}

            <SideNav active={current} setPage={setPage} />

            <header className="app-header">
                <div className="app-header-inner">
                    <h1 className="page-title">{current === 'status' ? <span className="text-accent-grad tracking-[2px]">IGNITE</span> : pageTitle(current)}</h1>
                    <SyncBadge status={syncStatus} />
                    <div className="app-header-xp">
                        <HeaderLevel />
                    </div>
                </div>
            </header>

            <main className="app-main">
                <div className="app-content">
                    {/* Keyed per page: a crash resets on navigation and the entrance fade replays. */}
                    <ErrorBoundary key={current}>
                        <PageTransition>
                            <Suspense fallback={fallback}>
                                <PageRoute current={current} page={page} />
                            </Suspense>
                        </PageTransition>
                    </ErrorBoundary>
                </div>
            </main>

            <BottomNav active={current} setPage={setPage} />
        </div>
    );
}
