/**
 * localStorage sync helper
 *
 * Some component-level data (PRs, challenge progress, scan history, weekly muscles)
 * was originally stored only in localStorage. This helper keeps a localStorage copy
 * AND mirrors the data into the Zustand store's profile so it syncs to Firestore on save.
 *
 * The profile (loaded from Firestore, kept current by live sync) is the source of
 * truth; the localStorage copy is per account (see localKeys.js) and only used when
 * the profile has no value yet.
 *
 * Usage:
 *   const { get, set } = localSync("ignite-prs", {});
 *   const [prs, setPrs] = useState(get);        // init from the account data
 *   // when updating:  set(newVal, setPrs);      // writes both localStorage + state
 */

import useAppStore from '@/stores/useAppStore';
import { scopedKey } from '@/utils/localKeys';

const PROFILE_KEY_MAP = {
  "ignite-prs": "prRecords",
  "ignite-challenge-progress": "challengeProgress",
  "ignite-scan-history": "scanHistory",
  "ignite-week-muscles": "weekMuscles",
};

const currentUid = () => {
  try { return useAppStore.getState().user?.uid || null; } catch { return null; }
};

export function localSync(storageKey, fallback) {
  const profileKey = PROFILE_KEY_MAP[storageKey];

  return {
    /** Read: account data (Firestore) first, then this account's local copy */
    get() {
      if (profileKey) {
        try {
          const profile = useAppStore.getState().profile;
          if (profile?.[profileKey] !== undefined && profile[profileKey] !== null) return profile[profileKey];
        } catch { /* ignore */ }
      }

      const uid = currentUid();
      if (uid) {
        try {
          const local = JSON.parse(localStorage.getItem(scopedKey(storageKey, uid)));
          if (local !== null && local !== undefined) {
            // Never synced to the account yet → mirror it now (after this render).
            if (profileKey) queueMicrotask(() => {
              if (currentUid() !== uid) return;
              useAppStore.getState().setProfile(prev => (prev?.[profileKey] == null ? { ...prev, [profileKey]: local } : prev));
            });
            return local;
          }
        } catch { /* ignore */ }
      }

      return typeof fallback === "function" ? fallback() : fallback;
    },

    /** Write: update localStorage + mirror to profile for Firestore sync */
    set(value, setStateFn) {
      const uid = currentUid();
      if (uid) {
        try { localStorage.setItem(scopedKey(storageKey, uid), JSON.stringify(value)); } catch { /* ignore */ }
      }

      if (setStateFn) setStateFn(value);

      // Mirror to profile so it syncs to Firestore on next save
      if (profileKey) {
        try {
          useAppStore.getState().setProfile(prev => ({ ...prev, [profileKey]: value }));
        } catch { /* ignore */ }
      }
    },
  };
}

export default localSync;
