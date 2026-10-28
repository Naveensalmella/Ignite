/**
 * Per-account browser caches.
 *
 * localSync keys are stored as `${key}:${uid}`, so on a shared device one account's
 * cached data is never shown to (or saved into) another account. The device remembers
 * which account used it last; when a different account loads, the previous account's
 * caches are removed.
 */

// Keys handled by localSync (see PROFILE_KEY_MAP there).
export const ACCOUNT_KEYS = ['ignite-prs', 'ignite-challenge-progress', 'ignite-scan-history', 'ignite-week-muscles'];
// Un-namespaced caches some components keep themselves (Oracle chats).
const SHARED_KEYS = ['ignite-oracle-chats', 'ignite-oracle-active'];
const OWNER_KEY = 'ignite-local-owner';

export const scopedKey = (key, uid) => `${key}:${uid}`;

function removeAccount(uid) {
  [...ACCOUNT_KEYS, ...SHARED_KEYS].forEach(k => localStorage.removeItem(k));
  if (uid) ACCOUNT_KEYS.forEach(k => localStorage.removeItem(scopedKey(k, uid)));
}

// Call once an account's data has loaded.
export function claimLocalData(uid) {
  if (!uid) return;
  try {
    const owner = localStorage.getItem(OWNER_KEY);
    if (owner && owner !== uid) {
      removeAccount(owner);
    } else if (!owner) {
      // First run since keys were namespaced: the old shared caches belong to whoever
      // used this device last — hand them to this account (as before) and retire them.
      ACCOUNT_KEYS.forEach(k => {
        const v = localStorage.getItem(k);
        if (v !== null && localStorage.getItem(scopedKey(k, uid)) === null) localStorage.setItem(scopedKey(k, uid), v);
        localStorage.removeItem(k);
      });
    }
    localStorage.setItem(OWNER_KEY, uid);
  } catch { /* storage unavailable */ }
}

// Explicit sign-out: remove this account's caches from the device.
export function clearLocalData(uid) {
  try {
    removeAccount(uid);
    localStorage.removeItem(OWNER_KEY);
  } catch { /* storage unavailable */ }
}
