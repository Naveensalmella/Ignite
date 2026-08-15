/**
 * localStorage sync helper
 *
 * Some component-level data (PRs, challenge progress, scan history, weekly muscles)
 * was originally stored only in localStorage. This helper keeps the fast localStorage
 * read/write AND mirrors the data into the Zustand store's profile so it syncs to
 * Firestore on save.
 *
 * Usage:
 *   const { get, set } = localSync("ignite-prs", {});
 *   const [prs, setPrs] = useState(get);        // fast init from localStorage
 *   // when updating:  set(newVal, setPrs);      // writes both localStorage + state
 */

import useAppStore from '@/stores/useAppStore';

const PROFILE_KEY_MAP = {
  "ignite-prs": "prRecords",
  "ignite-challenge-progress": "challengeProgress",
  "ignite-scan-history": "scanHistory",
  "ignite-week-muscles": "weekMuscles",
};

export function localSync(storageKey, fallback) {
  const profileKey = PROFILE_KEY_MAP[storageKey];

  return {
    /** Read: localStorage first (fast), then profile field from store */
    get() {
      try {
        const local = JSON.parse(localStorage.getItem(storageKey));
        if (local !== null && local !== undefined) return local;
      } catch { /* ignore */ }

      // Fall back to Firestore-synced profile data
      if (profileKey) {
        try {
          const profile = useAppStore.getState().profile;
          if (profile?.[profileKey] !== undefined) return profile[profileKey];
        } catch { /* ignore */ }
      }

      return typeof fallback === "function" ? fallback() : fallback;
    },

    /** Write: update localStorage + mirror to profile for Firestore sync */
    set(value, setStateFn) {
      try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* ignore */ }

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
