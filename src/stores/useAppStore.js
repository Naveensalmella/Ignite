"use client";
import { create } from 'zustand';
import { DEFAULT_HABITS, DAILY_PENALTY } from '@/data/index';
import { getLevel, getRank, getStreakMult, today, normalizeDayLog } from '@/utils';
import { checkMilestone } from '@/data/gamingSystem';
import storeV2 from '@/store-v2';
import store from '@/store';
import { play, hapticTap } from '@/components/soundEngine';
import { playXP, playLevelUp } from '@/sounds';

// ────────────────────────────────────────
// MAIN APP STORE — replaces App.jsx state
// ────────────────────────────────────────

const useAppStore = create((set, get) => ({
  // ── Auth & UI ──
  user: null,
  loading: true,
  page: 'dashboard',
  isMobile: false,
  sideOpen: false,
  moreOpen: false,
  showExitModal: false,
  showTutorial: false,

  // ── User Data ──
  profile: {},
  workoutLog: {},
  foodLog: {},
  journal: {},
  habits: DEFAULT_HABITS,
  habitLog: {},
  tasks: [],
  finances: [],
  chatHistory: [],
  focusLog: {},
  pillarProg: {},
  activityLog: [],
  routineData: null,
  masteryData: null,
  bodyData: null,
  challengeData: null,
  programData: null,
  freezeData: null,
  programState: {},
  xpLog: {},
  loginData: {},
  questChainData: {},
  bodyPhotos: {},

  // ── XP & Gamification ──
  totalXP: 0,
  streak: 0,
  lastCheck: '',
  xpEvents: [],
  confetti: 0,
  levelUp: null,
  levelUpShow: null,
  milestone: null,
  activeTitle: null,
  shareCard: null,

  // ── Setters (simple) ──
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setPage: (page) => {
    play("navTap");
    set({ page });
    // Sync URL hash
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${page}`);
    }
  },
  setPageSilent: (page) => set({ page }), // no sound, no URL change
  setIsMobile: (isMobile) => set({ isMobile }),
  setSideOpen: (sideOpen) => set({ sideOpen }),
  setMoreOpen: (moreOpen) => set({ moreOpen }),
  setShowExitModal: (showExitModal) => set({ showExitModal }),
  setShowTutorial: (showTutorial) => set({ showTutorial }),

  setProfile: (v) => set(s => ({ profile: typeof v === 'function' ? v(s.profile) : v })),
  setWorkoutLog: (v) => set(s => ({ workoutLog: typeof v === 'function' ? v(s.workoutLog) : v })),
  setFoodLog: (v) => set(s => ({ foodLog: typeof v === 'function' ? v(s.foodLog) : v })),
  setJournal: (v) => set(s => ({ journal: typeof v === 'function' ? v(s.journal) : v })),
  setHabits: (v) => set(s => ({ habits: typeof v === 'function' ? v(s.habits) : v })),
  setHabitLog: (v) => set(s => ({ habitLog: typeof v === 'function' ? v(s.habitLog) : v })),
  setTasks: (v) => set(s => ({ tasks: typeof v === 'function' ? v(s.tasks) : v })),
  setFinances: (v) => set(s => ({ finances: typeof v === 'function' ? v(s.finances) : v })),
  setChatHistory: (v) => set(s => ({ chatHistory: typeof v === 'function' ? v(s.chatHistory) : v })),
  setFocusLog: (v) => set(s => ({ focusLog: typeof v === 'function' ? v(s.focusLog) : v })),
  setPillarProg: (v) => set(s => ({ pillarProg: typeof v === 'function' ? v(s.pillarProg) : v })),
  setActivityLog: (v) => set(s => ({ activityLog: typeof v === 'function' ? v(s.activityLog) : v })),
  setRoutineData: (v) => set(s => ({ routineData: typeof v === 'function' ? v(s.routineData) : v })),
  setMasteryData: (v) => set(s => ({ masteryData: typeof v === 'function' ? v(s.masteryData) : v })),
  setBodyData: (v) => set(s => ({ bodyData: typeof v === 'function' ? v(s.bodyData) : v })),
  setChallengeData: (v) => set(s => ({ challengeData: typeof v === 'function' ? v(s.challengeData) : v })),
  setProgramData: (v) => set(s => ({ programData: typeof v === 'function' ? v(s.programData) : v })),
  setFreezeData: (v) => set(s => ({ freezeData: typeof v === 'function' ? v(s.freezeData) : v })),
  setProgramState: (v) => set(s => ({ programState: typeof v === 'function' ? v(s.programState) : v })),
  setXpLog: (v) => set(s => ({ xpLog: typeof v === 'function' ? v(s.xpLog) : v })),
  setLoginData: (v) => set(s => ({ loginData: typeof v === 'function' ? v(s.loginData) : v })),
  setQuestChainData: (v) => set(s => ({ questChainData: typeof v === 'function' ? v(s.questChainData) : v })),
  setBodyPhotos: (v) => set(s => ({ bodyPhotos: typeof v === 'function' ? v(s.bodyPhotos) : v })),
  setActiveTitle: (activeTitle) => set({ activeTitle }),
  setTotalXP: (v) => set(s => ({ totalXP: typeof v === 'function' ? v(s.totalXP) : v })),
  setStreak: (streak) => set({ streak }),
  setLastCheck: (lastCheck) => set({ lastCheck }),
  setXpEvents: (v) => set(s => ({ xpEvents: typeof v === 'function' ? v(s.xpEvents) : v })),
  setConfetti: (v) => set(s => ({ confetti: typeof v === 'function' ? v(s.confetti) : v })),
  setLevelUp: (levelUp) => set({ levelUp }),
  setLevelUpShow: (levelUpShow) => set({ levelUpShow }),
  setMilestone: (milestone) => set({ milestone }),
  setShareCard: (shareCard) => set({ shareCard }),

  // ── Activity logger ──
  logActivity: (type, detail) => {
    const entry = { id: Date.now(), type, detail, date: today(), time: new Date().toLocaleTimeString(), timestamp: Date.now() };
    set(s => ({ activityLog: [entry, ...s.activityLog].slice(0, 200) }));
  },

  // ── Add XP (with streak multiplier, confetti, level-up) ──
  addXP: (amount, reason) => {
    const { streak, logActivity: log } = get();
    const mult = getStreakMult(streak);
    const actual = Math.floor(amount * mult);

    set(s => ({ confetti: s.confetti + 1 }));

    set(s => {
      const oldLv = getLevel(s.totalXP);
      const nxp = s.totalXP + actual;
      const nLv = getLevel(nxp);

      if (nLv > oldLv) {
        setTimeout(() => {
          set({ levelUp: { level: nLv, rank: getRank(nLv) }, levelUpShow: { level: nLv, rank: getRank(nLv) } });
          playLevelUp();
        }, 300);
      }

      // Check milestones
      try {
        const ms = checkMilestone(s.totalXP, nxp);
        if (ms) setTimeout(() => set({ milestone: ms }), 800);
      } catch { }

      return { totalXP: nxp };
    });

    const id = Date.now() + Math.random();
    set(s => ({ xpEvents: [...s.xpEvents, { id, amount: actual, reason: reason + (mult > 1 ? ` (×${mult})` : "") }] }));
    setTimeout(() => set(s => ({ xpEvents: s.xpEvents.filter(e => e.id !== id) })), 1600);

    log("xp", `+${actual} XP: ${reason}`);
    play('xpGain');
    hapticTap();

    if ((reason || "").includes("Workout")) {
      setTimeout(() => set({ shareCard: { type: "workout", data: { splitName: reason, calBurned: amount * 2, exercises: [], duration: 1800 } } }), 1500);
    }
    playXP();

    // Log XP source for breakdown
    try {
      const xpDate = today();
      const xpCat = (reason || "").includes("Workout") || (reason || "").includes("Training") ? "Training" : (reason || "").includes("Food") || (reason || "").includes("Nutrition") ? "Nutrition" : (reason || "").includes("Quest") || (reason || "").includes("Habit") ? "Quest" : (reason || "").includes("Focus") ? "Focus" : (reason || "").includes("Journal") || (reason || "").includes("Mood") ? "Wellness" : (reason || "").includes("Login") ? "Login" : (reason || "").includes("Combo") ? "Combo" : (reason || "").includes("Challenge") ? "Challenge" : "Other";
      set(s => ({ xpLog: { ...(s.xpLog || {}), [xpDate]: [...((s.xpLog || {})[xpDate] || []), { amount: actual, category: xpCat, reason: reason || "", time: Date.now() }] } }));
    } catch (e) { console.error("XP log error:", e); }
  },

  // ── Load user data from Firestore ──
  loadUserData: async (uid) => {
    try {
      const d = await storeV2.getUserProfile(uid);
      if (!d) { set({ showTutorial: true }); return; }

      // Set profile & scalar fields
      set({
        profile: d.profile || {},
        habits: d.habits || DEFAULT_HABITS,
        tasks: d.tasks || [],
        pillarProg: d.pillarProg || {},
        routineData: d.routineData || null,
        masteryData: d.masteryData || null,
        bodyData: d.bodyData || null,
        challengeData: d.challengeData || null,
        programData: d.programData || null,
        freezeData: d.freezeData || null,
        programState: d.programState || {},
        loginData: d.loginData || {},
        activeTitle: d.activeTitle || null,
        questChainData: d.questChainData || {},
        totalXP: d.totalXP !== undefined ? d.totalXP : 0,
        streak: d.streak !== undefined ? d.streak : 0,
        lastCheck: d.lastCheck || '',
        showTutorial: !d.tutorialDone,
      });

      // Run migration if needed
      if (!d._migrated) {
        console.log('[IGNITE] Running one-time data migration...');
        await storeV2.migrateUserData(uid);
        console.log('[IGNITE] Migration complete');
      }

      // Load subcollections in parallel
      const [workouts, food, journals, xp, focus, habits_log, chats, finances_data, activity, photos] = await Promise.all([
        storeV2.getWorkouts(uid),
        storeV2.getFoodLog(uid),
        storeV2.getJournal(uid),
        storeV2.getXpLog(uid),
        storeV2.getFocusLog(uid),
        storeV2.getHabitLog(uid),
        storeV2.getChatHistory(uid),
        storeV2.getFinances(uid),
        storeV2.getActivityLog(uid),
        storeV2.getBodyPhotos(uid),
      ]);

      // Normalize day-keyed logs — Firestore can store arrays as objects
      set({
        workoutLog: Object.keys(workouts).length > 0 ? workouts : (d.workoutLog || {}),
        foodLog: normalizeDayLog(Object.keys(food).length > 0 ? food : (d.foodLog || {})),
        journal: Object.keys(journals).length > 0 ? journals : (d.journal || {}),
        xpLog: normalizeDayLog(Object.keys(xp).length > 0 ? xp : (d.xpLog || {})),
        focusLog: normalizeDayLog(Object.keys(focus).length > 0 ? focus : (d.focusLog || {})),
        habitLog: normalizeDayLog(Object.keys(habits_log).length > 0 ? habits_log : (d.habitLog || {})),
        chatHistory: Array.isArray(chats) ? chats : Object.values(chats || {}),
        finances: Array.isArray(finances_data) ? finances_data : Object.values(finances_data || {}),
        activityLog: Array.isArray(activity) ? activity : Object.values(activity || {}),
        bodyPhotos: Object.keys(photos).length > 0 ? photos : (d.bodyPhotos || {}),
      });
    } catch (e) { console.error("Load error:", e); set({ showTutorial: true }); }
  },

  // ── Save all data to Firestore ──
  saveData: async () => {
    const s = get();
    if (!s.user) return;
    const uid = s.user.uid;

    try {
      // Save scalar/profile to main doc
      await storeV2.saveUserProfile(uid, {
        profile: s.profile, habits: s.habits, tasks: s.tasks, totalXP: s.totalXP,
        streak: s.streak, lastCheck: s.lastCheck, pillarProg: s.pillarProg,
        routineData: s.routineData, masteryData: s.masteryData, bodyData: s.bodyData,
        challengeData: s.challengeData, programData: s.programData, freezeData: s.freezeData,
        programState: s.programState, loginData: s.loginData, activeTitle: s.activeTitle,
        questChainData: s.questChainData, email: s.user.email,
        lastSaved: new Date().toISOString(),
      });

      // Save subcollections in parallel
      const ops = [];
      if (s.workoutLog) for (const [date, data] of Object.entries(s.workoutLog)) { if (data) ops.push(storeV2.saveWorkout(uid, date, data)); }
      if (s.foodLog) for (const [date, data] of Object.entries(s.foodLog)) { if (data) ops.push(storeV2.saveFoodEntry(uid, date, typeof data === 'object' && !Array.isArray(data) ? data : { entries: data })); }
      if (s.journal) for (const [date, data] of Object.entries(s.journal)) { if (data) ops.push(storeV2.saveJournalEntry(uid, date, typeof data === 'object' ? data : { entry: data })); }
      if (s.xpLog) for (const [date, data] of Object.entries(s.xpLog)) { if (data) ops.push(storeV2.saveXpEntry(uid, date, Array.isArray(data) ? { events: data } : data)); }
      if (s.focusLog) for (const [date, data] of Object.entries(s.focusLog)) { if (data) ops.push(storeV2.saveFocusEntry(uid, date, Array.isArray(data) ? { sessions: data } : data)); }
      if (s.habitLog) for (const [date, data] of Object.entries(s.habitLog)) { if (data) ops.push(storeV2.saveHabitEntry(uid, date, typeof data === 'object' ? data : { data })); }
      if (s.chatHistory?.length > 0) ops.push(storeV2.saveChatHistory(uid, s.chatHistory));
      if (s.finances?.length > 0) ops.push(storeV2.saveFinances(uid, s.finances));
      if (s.activityLog?.length > 0) ops.push(storeV2.saveActivityLog(uid, s.activityLog));
      await Promise.all(ops);
    } catch (e) { console.error("Save error:", e); }
  },

  // ── Logout ──
  logout: async () => {
    const { saveData: save } = get();
    try { await save(); } catch { }
    const { signOut } = await import('firebase/auth');
    const { auth } = await import('@/lib/firebase');
    try { await signOut(auth); } catch { }
    set({
      user: null, foodLog: {}, habits: DEFAULT_HABITS, habitLog: {},
      tasks: [], journal: {}, finances: [], profile: {},
      chatHistory: [], totalXP: 0, workoutLog: {}, streak: 0,
      pillarProg: {}, activityLog: [], focusLog: {}, routineData: null,
      masteryData: null, bodyData: null, xpLog: {}, loginData: {},
      activeTitle: null, questChainData: {}, challengeData: null,
      programData: null, freezeData: null, bodyPhotos: {},
      page: 'dashboard',
    });
  },

  // ── Computed: appState (for components that need the bundle) ──
  getAppState: () => {
    const s = get();
    return {
      foodLog: s.foodLog || {}, habits: s.habits || [], habitLog: s.habitLog || {},
      tasks: s.tasks || [], journal: s.journal || {}, finances: s.finances || [],
      profile: s.profile || {}, user: s.user, pillarProg: s.pillarProg || {},
      focusLog: s.focusLog || {}, workoutLog: s.workoutLog || {},
      oracleChats: s.chatHistory || [], routineData: s.routineData,
      masteryData: s.masteryData, bodyData: s.bodyData,
      challengeData: s.challengeData, freezeData: s.freezeData,
      programState: s.programState || {}, xpLog: s.xpLog || {},
      loginData: s.loginData || {}, activeTitle: s.activeTitle,
      questChainData: s.questChainData || {},
    };
  },
}));

export default useAppStore;
