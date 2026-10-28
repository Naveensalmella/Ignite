"use client";
import { create } from 'zustand';
import { DEFAULT_HABITS } from '@/data/index';
import { getLevel, getStreakMult, today, addDays, normalizeDayLog, toArr } from '@/utils';
import { checkMilestone } from '@/data/gamingSystem';
import { hasDayWorkout } from '@/lib/workoutHelpers';
import storeV2, { DAY_COLLECTIONS } from '@/store-v2';
import {
  beginSession, endSession, isCurrentSession, markLoaded, saveChanges, startLiveSync, whenSynced,
  readMainFields, withPhotos,
} from '@/stores/sync';
import { claimLocalData, clearLocalData } from '@/utils/localKeys';
import { play, hapticTap } from '@/components/soundEngine';
import { playLevelUp } from '@/sounds';
import { playerRank, availableTrial } from '@/lib/system/ranks';
import { AP_PER_LEVEL } from '@/lib/system/stats';
import { pruneQuestLog } from '@/lib/system/quests';
import { xpMultiplier, goldMultiplier } from '@/lib/system/progression';

// Persistence (document layout, diff-based saves, live sync) lives in ./sync.js.
const MAX_ACTIVITY = 200;
const LOGOUT_SYNC_MS = 4000; // how long logout waits for the server to confirm queued writes

const EMPTY_DATA = {
  profile: {}, workoutLog: {}, foodLog: {}, journal: {}, habits: DEFAULT_HABITS,
  habitLog: {}, tasks: [], finances: [], chatHistory: [], focusLog: {}, pillarProg: {},
  activityLog: [], routineData: null, masteryData: null, bodyData: null,
  challengeData: null, programData: null, freezeData: null, programState: {},
  xpLog: {}, loginData: {}, questChainData: {}, bodyPhotos: {},
  totalXP: 0, streak: 0, lastCheck: '', activeTitle: null,
  system: null, // Solo Leveling "System": rank, ability points, gold, inventory, quests (see lib/system)
};

// Main-document fields that once held data now kept in sub-collections.
const LEGACY_LIST_FIELDS = ['chatHistory', 'finances', 'activityLog'];

// Consecutive days with a workout (or a streak freeze) ending today — or ending
// yesterday when today isn't done yet, so the streak isn't "lost" mid-day.
export function computeStreak(workoutLog, freezeData) {
  const frozen = new Set(toArr(freezeData?.freezesUsed));
  const active = (k) => hasDayWorkout(workoutLog, k) || frozen.has(k);
  let k = today();
  if (!active(k)) k = addDays(-1);
  let streak = 0;
  for (let i = 0; i < 3650 && active(k); i++) {
    streak++;
    k = addDays(-1, k);
  }
  return streak;
}

const useAppStore = create((set, get) => ({
  // ── Auth & UI ──
  user: null,
  loading: true,
  dataReady: false,      // true once the user's data loaded successfully
  loadError: null,       // message when loading failed (saving stays disabled)
  syncStatus: 'idle',    // idle | saving | saved | error | offline
  page: 'status',
  showTutorial: false,

  ...EMPTY_DATA,

  // ── XP & Gamification (transient) ──
  xpEvents: [],
  confetti: 0,
  levelUp: null,
  milestone: null,
  notices: [],           // queue of [SYSTEM] windows

  // ── Setters ──
  setUser: (user) => {
    // Signed out elsewhere, or another account signed in: drop the previous account's data.
    const prev = get().user;
    if (prev?.uid && prev.uid !== user?.uid) {
      endSession();
      set({ ...EMPTY_DATA, dataReady: false, loadError: null, syncStatus: 'idle', xpEvents: [], notices: [] });
    }
    set({ user });
  },
  setLoading: (loading) => set({ loading }),
  setPage: (page) => {
    if (!page || page === get().page) return;
    play("navTap");
    set({ page });
    // Push a history entry so the browser/phone Back button returns to the previous page.
    if (typeof window !== 'undefined' && window.location.hash !== `#${page}`) {
      window.history.pushState({ page }, '', `#${page}`);
    }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  },
  setPageSilent: (page) => set({ page }),
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
  setXpEvents: (v) => set(s => ({ xpEvents: typeof v === 'function' ? v(s.xpEvents) : v })),
  setLevelUp: (levelUp) => set({ levelUp }),
  setMilestone: (milestone) => set({ milestone }),
  setSystem: (v) => set(s => ({ system: typeof v === 'function' ? v(s.system) : v })),

  // ── [SYSTEM] notification windows (shown one at a time) ──
  notify: (notice) => {
    const id = Date.now() + Math.random();
    set(s => ({ notices: [...s.notices, { kind: 'info', ...notice, id }] }));
    play(notice?.kind === 'warning' ? 'warning' : notice?.kind === 'rank' ? 'rankUp' : notice?.kind === 'quest' ? 'questComplete' : 'system');
  },
  dismissNotice: () => set(s => ({ notices: s.notices.slice(1) })),

  // Short-lived toast in the XP feed (also used for info like penalties).
  pushXpEvent: (amount, reason, ms = 1800) => {
    const id = Date.now() + Math.random();
    set(s => ({ xpEvents: [...s.xpEvents, { id, amount, reason }] }));
    setTimeout(() => set(s => ({ xpEvents: s.xpEvents.filter(e => e.id !== id) })), ms);
  },

  // ── Activity logger ──
  logActivity: (type, detail) => {
    const entry = { id: Date.now(), type, detail, date: today(), time: new Date().toLocaleTimeString(), timestamp: Date.now() };
    set(s => ({ activityLog: [entry, ...toArr(s.activityLog)].slice(0, MAX_ACTIVITY) }));
  },

  // ── Add XP (streak multiplier, XP Potion, Penalty halving, gold, ability points, level-up) ──
  addXP: (amount, reason = "") => {
    const { streak, logActivity, pushXpEvent, system, activeTitle } = get();
    const mult = getStreakMult(streak);
    const boosted = (Number(system?.buffs?.xpBoostUntil) || 0) > Date.now();
    const penalized = !!system?.penalty?.active;
    // Skills, equipped title, job class and Shadow Army
    const bonus = system?.awakened ? xpMultiplier(system, activeTitle, reason) : 1;
    const actual = Math.floor((Number(amount) || 0) * mult * bonus * (boosted ? 2 : 1) * (penalized ? 0.5 : 1));
    if (actual <= 0) return;

    const prevXP = get().totalXP || 0;
    const nextXP = prevXP + actual;
    const oldLv = getLevel(prevXP);
    const newLv = getLevel(nextXP);
    set(s => ({ totalXP: nextXP, confetti: s.confetti + 1 }));

    // System rewards: gold for every XP gain, Ability Points for every new level.
    let gainedAP = 0;
    if (system?.awakened) {
      const apLevel = Number(system.apLevel) || oldLv;
      gainedAP = newLv > apLevel ? (newLv - apLevel) * AP_PER_LEVEL : 0;
      const gold = Math.max(1, Math.round((actual / 5) * goldMultiplier(system, activeTitle)));
      set(s => ({
        system: {
          ...s.system,
          gold: (Number(s.system?.gold) || 0) + gold,
          abilityPoints: (Number(s.system?.abilityPoints) || 0) + gainedAP,
          apLevel: Math.max(apLevel, newLv),
        },
      }));
    }

    if (newLv > oldLv) {
      const trialBefore = availableTrial(system, oldLv);
      const trialNow = availableTrial(system, newLv);
      setTimeout(() => {
        set({ levelUp: { level: newLv, rank: playerRank(get().system, newLv), ap: gainedAP } });
        playLevelUp();
      }, 300);
      if (trialNow && !trialBefore) {
        setTimeout(() => get().notify({
          kind: 'rank', title: 'RANK ASSESSMENT UNLOCKED',
          lines: [`You have reached the level required for ${trialNow.name}.`, 'Pass the Rank Assessment to be promoted.'],
          cta: { label: 'View assessment', page: 'quests' },
        }), 5200);
      }
    }
    try {
      const ms = checkMilestone(prevXP, nextXP);
      if (ms) setTimeout(() => set({ milestone: ms }), 800);
    } catch { /* milestone data is optional */ }
    const tags = `${mult > 1 ? ` ×${mult}` : ''}${bonus > 1 ? ` +${Math.round((bonus - 1) * 100)}%` : ''}${boosted ? ' 🧪×2' : ''}${penalized ? ' (penalty ½)' : ''}`;
    pushXpEvent(actual, reason + tags, 1600);
    logActivity("xp", `+${actual} XP: ${reason}`);
    play('xpGain');
    hapticTap();

    // Log XP source for the daily breakdown
    const r = reason || "";
    const cat = /Workout|Training/.test(r) ? "Training"
      : /Food|Nutrition/.test(r) ? "Nutrition"
        : /Quest|Habit/.test(r) ? "Quest"
          : /Focus/.test(r) ? "Focus"
            : /Journal|Mood/.test(r) ? "Wellness"
              : /Login/.test(r) ? "Login"
                : /Combo/.test(r) ? "Combo"
                  : /Challenge/.test(r) ? "Challenge" : "Other";
    const d = today();
    set(s => ({ xpLog: { ...(s.xpLog || {}), [d]: [...toArr((s.xpLog || {})[d]), { amount: actual, category: cat, reason: r, time: Date.now() }] } }));
  },

  // ── Daily check: streak + Penalty Quest for a missed Daily Quest (only after data loaded) ──
  // No permanent XP loss: a missed Daily Quest opens the Penalty Zone instead.
  runDailyCheck: () => {
    const s = get();
    if (!s.dataReady) return;
    const d = today();
    const updates = { streak: computeStreak(s.workoutLog, s.freezeData) };
    if (s.lastCheck !== d) updates.lastCheck = d;

    const sys = s.system;
    if (sys?.awakened && sys.penaltyChecked !== d) {
      const y = addDays(-1, d);
      const shielded = toArr(s.freezeData?.freezesUsed).includes(y);
      const missed = !!sys.awakenedOn && y >= sys.awakenedOn && !sys.questLog?.[y]?.claimed && !shielded && !sys.penalty?.active;
      updates.system = {
        ...sys,
        ...pruneQuestLog(sys, d),
        penaltyChecked: d,
        ...(missed ? { penalty: { active: true, date: d, missed: y } } : {}),
      };
      if (missed) {
        setTimeout(() => get().notify({
          kind: 'warning', title: 'PENALTY QUEST',
          lines: ["Yesterday's Daily Quest was not completed.", 'You have been sent to the Penalty Zone. Until you survive it, XP gains are halved and the Daily Quest is locked.'],
          cta: { label: 'Enter the Penalty Zone', page: 'quests' },
        }), 1200);
      }
    }
    set(updates);
  },

  // ── Load user data from Firestore ──
  loadUserData: async (uid) => {
    // Every await below re-checks that this load still belongs to the signed-in
    // account, so a slow load for one user can never land in another's session.
    const token = beginSession(uid);
    const current = () => isCurrentSession(token, uid) && get().user?.uid === uid;
    set({ dataReady: false, loadError: null });
    try {
      let d = await storeV2.getUserProfile(uid);
      if (!current()) return;

      if (d && !d._migrated) {
        await storeV2.migrateUserData(uid, d);
        if (!current()) return;
        d = { ...d, _migrated: true };
      }

      const [dayLogs, chats, finances, activity, photos, trackerPhotos] = d
        ? await Promise.all([
          storeV2.getDayLogs(uid),
          storeV2.getChatHistory(uid),
          storeV2.getFinances(uid),
          storeV2.getActivityLog(uid),
          storeV2.getBodyPhotos(uid).catch(() => ({})), // photos are optional
          storeV2.getTrackerPhotos(uid),
        ])
        : [{}, null, null, null, {}, null];
      if (!current()) return;

      // Sub-collections are the source of truth once migrated. A legacy main-doc list
      // is only adopted when its sub-document was never written (old migrations could
      // skip it) — then it is written on the first save.
      const main = d || {};
      const legacy = {};
      LEGACY_LIST_FIELDS.forEach((f, i) => {
        if ([chats, finances, activity][i] === null && toArr(main[f]).length) legacy[f] = toArr(main[f]);
      });
      const legacyTracker = trackerPhotos === null && toArr(main.bodyData?.photos).length > 0;
      const legacyPhotos = main.bodyPhotos && typeof main.bodyPhotos === 'object' ? main.bodyPhotos : {};
      const missingPhotos = Object.keys(legacyPhotos).filter(dt => legacyPhotos[dt]?.photo && !photos?.[dt]);

      const fields = readMainFields(main);
      set({
        ...fields,
        bodyData: withPhotos(fields.bodyData, trackerPhotos ?? main.bodyData?.photos),
        showTutorial: !main.tutorialDone,

        workoutLog: dayLogs.workoutLog || {},
        foodLog: normalizeDayLog(dayLogs.foodLog),
        journal: dayLogs.journal || {},
        xpLog: normalizeDayLog(dayLogs.xpLog),
        focusLog: normalizeDayLog(dayLogs.focusLog),
        habitLog: normalizeDayLog(dayLogs.habitLog),
        chatHistory: legacy.chatHistory || toArr(chats),
        finances: legacy.finances || toArr(finances),
        activityLog: legacy.activityLog || toArr(activity),
        bodyPhotos: { ...Object.fromEntries(missingPhotos.map(dt => [dt, { date: dt, note: '', weight: '', ...legacyPhotos[dt] }])), ...(photos || {}) },
      });

      if (d) {
        // Baseline = what Firestore already has, so the first save only writes real changes.
        const unsaved = Object.keys(legacy).map(f => `${f}/`);
        if (legacyTracker) unsaved.push('bodyData/', 'main:bodyData');
        markLoaded(get(), key => unsaved.some(p => key.startsWith(p)));

        // Delete main-doc copies of data that now lives in sub-collections: they were
        // dead weight and the old fallback could resurrect deleted entries from them.
        const stale = DAY_COLLECTIONS.map(c => c.field)
          .concat(LEGACY_LIST_FIELDS.filter(f => !legacy[f]))
          .concat(missingPhotos.length ? [] : ['bodyPhotos'])
          .filter(f => f in main);
        if (stale.length) storeV2.removeUserFields(uid, stale).catch(e => console.warn('Legacy cleanup skipped:', e?.code || e));
        missingPhotos.forEach(dt => {
          const p = legacyPhotos[dt];
          storeV2.saveBodyPhoto(uid, dt, p.photo, p.note, p.weight).catch(e => console.warn('Legacy photo copy skipped:', e?.code || e));
        });
      }
      claimLocalData(uid);
      set({ dataReady: true, syncStatus: 'idle' });
      startLiveSync({ get, set });
      get().runDailyCheck();
    } catch (e) {
      if (!current()) return;
      console.error("Load error:", e);
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      set({
        loadError: offline
          ? "You're offline. Connect to the internet to load your data."
          : "We couldn't load your data. Your progress is safe — please try again.",
      });
    }
  },

  // ── Save: queue writes for documents that changed (never waits on the server) ──
  saveData: () => saveChanges({ get, set }),

  // ── Logout ──
  logout: async () => {
    const uid = get().user?.uid;
    // Queue every last edit, then give the server a few seconds to confirm — never hang.
    // Unconfirmed writes stay queued on this device and sync on the next sign-in here.
    try { saveChanges({ get, set }, true); } catch { /* best effort */ }
    const synced = await whenSynced(LOGOUT_SYNC_MS);
    if (!synced && typeof navigator !== 'undefined' && navigator.onLine === false && typeof window !== 'undefined'
      && !window.confirm("You're offline and some changes haven't reached the server yet. They'll sync the next time you sign in on this device. Sign out anyway?")) return;
    endSession();
    const { signOut } = await import('firebase/auth');
    const { auth } = await import('@/lib/firebase');
    try { await signOut(auth); } catch { /* ignore */ }
    // Clear per-user caches so the next account on this device starts clean.
    clearLocalData(uid);
    set({ ...EMPTY_DATA, user: null, dataReady: false, loadError: null, syncStatus: 'idle', page: 'status', xpEvents: [], notices: [] });
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
      questChainData: s.questChainData || {}, system: s.system,
    };
  },
}));

export default useAppStore;

// Dev-only handle for debugging in the browser console (never in production builds).
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  window.__igniteStore = useAppStore;
}
