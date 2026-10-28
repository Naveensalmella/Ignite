"use client";
import { create } from 'zustand';
import { DEFAULT_HABITS } from '@/data/index';
import { getLevel, getStreakMult, today, addDays, normalizeDayLog, toArr } from '@/utils';
import { checkMilestone } from '@/data/gamingSystem';
import { hasDayWorkout } from '@/lib/workoutHelpers';
import storeV2, { DAY_COLLECTIONS, encodeDayDoc } from '@/store-v2';
import { play, hapticTap } from '@/components/soundEngine';
import { playLevelUp } from '@/sounds';
import { playerRank, availableTrial } from '@/lib/system/ranks';
import { AP_PER_LEVEL } from '@/lib/system/stats';
import { pruneQuestLog } from '@/lib/system/quests';

// Fields stored on the main users/{uid} document.
const PROFILE_FIELDS = [
  'profile', 'habits', 'tasks', 'totalXP', 'streak', 'lastCheck', 'pillarProg',
  'routineData', 'masteryData', 'bodyData', 'challengeData', 'programData',
  'freezeData', 'programState', 'loginData', 'activeTitle', 'questChainData', 'system',
];

// Caps that keep single documents well under Firestore's 1 MB limit.
const MAX_CHATS = 30;
const MAX_MESSAGES_PER_CHAT = 60;
const MAX_ACTIVITY = 200;
const MAX_TRACKER_PHOTO_CHARS = 900_000;

// Body-tracker photos (base64) live in their own document so they can never push
// the main user document past 1 MB. Keep the newest photos that fit.
function capTrackerPhotos(photos) {
  const list = toArr(photos).filter(Boolean);
  const kept = [];
  let size = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    size += JSON.stringify(list[i]).length;
    if (size > MAX_TRACKER_PHOTO_CHARS) break;
    kept.unshift(list[i]);
  }
  return kept;
}

const EMPTY_DATA = {
  profile: {}, workoutLog: {}, foodLog: {}, journal: {}, habits: DEFAULT_HABITS,
  habitLog: {}, tasks: [], finances: [], chatHistory: [], focusLog: {}, pillarProg: {},
  activityLog: [], routineData: null, masteryData: null, bodyData: null,
  challengeData: null, programData: null, freezeData: null, programState: {},
  xpLog: {}, loginData: {}, questChainData: {}, bodyPhotos: {},
  totalXP: 0, streak: 0, lastCheck: '', activeTitle: null,
  system: null, // Solo Leveling "System": rank, ability points, gold, inventory, quests (see lib/system)
};

// Every document the app would write for the current state: path key → { path, data }.
function buildDocs(s) {
  const docs = new Map();
  const main = { email: s.user?.email || null };
  PROFILE_FIELDS.forEach(f => { main[f] = s[f] ?? null; });
  if (main.bodyData && typeof main.bodyData === 'object') {
    const { photos, ...rest } = main.bodyData;
    main.bodyData = rest;
    docs.set('bodyData/photos', { path: ['bodyData', 'photos'], data: { photos: capTrackerPhotos(photos) } });
  }
  docs.set('main', { path: null, data: main });

  for (const { field, subcol } of DAY_COLLECTIONS) {
    for (const [date, value] of Object.entries(s[field] || {})) {
      if (value === null || value === undefined) continue;
      docs.set(`${subcol}/${date}`, { path: [subcol, date], data: encodeDayDoc(value) });
    }
  }

  const chats = toArr(s.chatHistory).slice(0, MAX_CHATS).map(c =>
    c && Array.isArray(c.messages) ? { ...c, messages: c.messages.slice(-MAX_MESSAGES_PER_CHAT) } : c
  );
  docs.set('chatHistory/current', { path: ['chatHistory', 'current'], data: { messages: chats } });
  docs.set('finances/ledger', { path: ['finances', 'ledger'], data: { entries: toArr(s.finances) } });
  docs.set('activityLog/recent', { path: ['activityLog', 'recent'], data: { entries: toArr(s.activityLog).slice(0, MAX_ACTIVITY) } });
  return docs;
}

const isDayDocKey = (key) => DAY_COLLECTIONS.some(c => key.startsWith(`${c.subcol}/`));

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

// Save bookkeeping (module-level: one signed-in user per tab).
let lastSaved = new Map();   // doc key → JSON of what Firestore has
let saving = null;           // in-flight save promise
let saveQueued = false;

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
  setUser: (user) => set({ user }),
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
    const { streak, logActivity, pushXpEvent, system } = get();
    const mult = getStreakMult(streak);
    const boosted = (Number(system?.buffs?.xpBoostUntil) || 0) > Date.now();
    const penalized = !!system?.penalty?.active;
    const actual = Math.floor((Number(amount) || 0) * mult * (boosted ? 2 : 1) * (penalized ? 0.5 : 1));
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
      const gold = Math.max(1, Math.round(actual / 5));
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
    const tags = `${mult > 1 ? ` ×${mult}` : ''}${boosted ? ' 🧪×2' : ''}${penalized ? ' (penalty ½)' : ''}`;
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
    set({ dataReady: false, loadError: null });
    try {
      let d = await storeV2.getUserProfile(uid);

      if (d && !d._migrated) {
        await storeV2.migrateUserData(uid, d);
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
        : [{}, [], [], [], {}, null];

      const main = d || {};
      const pick = (field) => {
        const fromSub = dayLogs[field] || {};
        // Fall back to the legacy main-document copy only if the subcollection is empty.
        return Object.keys(fromSub).length > 0 ? fromSub : (main[field] || {});
      };

      set({
        profile: main.profile || {},
        habits: toArr(main.habits).length ? toArr(main.habits) : DEFAULT_HABITS,
        tasks: toArr(main.tasks),
        pillarProg: main.pillarProg || {},
        routineData: main.routineData || null,
        masteryData: main.masteryData || null,
        bodyData: main.bodyData
          ? { ...main.bodyData, photos: trackerPhotos ?? toArr(main.bodyData.photos) }
          : (trackerPhotos?.length ? { photos: trackerPhotos } : null),
        challengeData: main.challengeData || null,
        programData: main.programData || null,
        freezeData: main.freezeData || null,
        programState: main.programState || {},
        loginData: main.loginData || {},
        activeTitle: main.activeTitle || null,
        questChainData: main.questChainData || {},
        system: main.system && typeof main.system === 'object' ? main.system : null,
        totalXP: Number(main.totalXP) || 0,
        streak: Number(main.streak) || 0,
        lastCheck: main.lastCheck || '',
        showTutorial: !main.tutorialDone,

        workoutLog: pick('workoutLog'),
        foodLog: normalizeDayLog(pick('foodLog')),
        journal: pick('journal'),
        xpLog: normalizeDayLog(pick('xpLog')),
        focusLog: normalizeDayLog(pick('focusLog')),
        habitLog: normalizeDayLog(pick('habitLog')),
        chatHistory: toArr(chats),
        finances: toArr(finances),
        activityLog: toArr(activity),
        bodyPhotos: photos || {},
      });

      // Snapshot what Firestore already has so the first save only writes real changes.
      lastSaved = new Map();
      if (d) {
        for (const [key, { data }] of buildDocs(get())) lastSaved.set(key, JSON.stringify(data));
        // Legacy tracker photos still inside the main doc → move them on the first save.
        if (trackerPhotos === null && toArr(main.bodyData?.photos).length > 0) {
          lastSaved.delete('bodyData/photos');
          lastSaved.delete('main');
        }
      }
      set({ dataReady: true, syncStatus: 'idle' });
      get().runDailyCheck();
    } catch (e) {
      console.error("Load error:", e);
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      set({
        loadError: offline
          ? "You're offline. Connect to the internet to load your data."
          : "We couldn't load your data. Your progress is safe — please try again.",
      });
    }
  },

  // ── Save: write only documents that changed since the last successful save ──
  saveData: async () => {
    if (saving) { saveQueued = true; return saving; }
    const s = get();
    if (!s.user || !s.dataReady) return;
    const uid = s.user.uid;

    const docs = buildDocs(s);
    const writes = [];
    const deletes = [];
    let mainChanged = null;
    for (const [key, { path, data }] of docs) {
      const json = JSON.stringify(data);
      if (lastSaved.get(key) === json) continue;
      if (key === 'main') mainChanged = { data, json };
      else writes.push({ key, path, data, json });
    }
    for (const key of lastSaved.keys()) {
      if (isDayDocKey(key) && !docs.has(key)) deletes.push(key);
    }
    if (!mainChanged && writes.length === 0 && deletes.length === 0) return;

    set({ syncStatus: 'saving' });
    saving = (async () => {
      try {
        // Sub-documents first, so data moved out of the main doc is stored before it's removed there.
        await storeV2.commit(uid, writes, deletes.map(k => k.split('/')));
        writes.forEach(w => lastSaved.set(w.key, w.json));
        deletes.forEach(k => lastSaved.delete(k));
        if (mainChanged) {
          await storeV2.saveUserProfile(uid, mainChanged.data);
          lastSaved.set('main', mainChanged.json);
        }
        set({ syncStatus: 'saved' });
      } catch (e) {
        console.error("Save error:", e);
        const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
        set({ syncStatus: offline ? 'offline' : 'error' });
      } finally {
        saving = null;
        if (saveQueued) { saveQueued = false; setTimeout(() => get().saveData(), 500); }
      }
    })();
    return saving;
  },

  // ── Logout ──
  logout: async () => {
    try { await get().saveData(); } catch { /* best effort */ }
    const { signOut } = await import('firebase/auth');
    const { auth } = await import('@/lib/firebase');
    try { await signOut(auth); } catch { /* ignore */ }
    lastSaved = new Map();
    // Clear per-user caches so the next account on this device starts clean.
    try {
      ['ignite-prs', 'ignite-challenge-progress', 'ignite-scan-history', 'ignite-week-muscles', 'ignite-oracle-chats', 'ignite-oracle-active']
        .forEach(k => localStorage.removeItem(k));
    } catch { /* ignore */ }
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
