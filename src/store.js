// Storage utility — works in both Claude artifacts and deployed websites
const memStore = {};

const store = {
  async get(k) {
    // Try Claude's window.storage first
    if (typeof window !== 'undefined' && window.storage) {
      try {
        const r = await window.storage.get(k);
        if (r && r.value) return JSON.parse(r.value);
        return null;
      } catch { /* fall through */ }
    }
    // Fallback to localStorage for deployed version
    try {
      const v = localStorage.getItem(`ignite_${k}`);
      return v ? JSON.parse(v) : null;
    } catch {
      return memStore[k] || null;
    }
  },

  async set(k, v) {
    memStore[k] = v;
    // Try Claude's window.storage first
    if (typeof window !== 'undefined' && window.storage) {
      try { await window.storage.set(k, JSON.stringify(v)); return true; } catch { /* fall through */ }
    }
    // Fallback to localStorage
    try {
      localStorage.setItem(`ignite_${k}`, JSON.stringify(v));
      return true;
    } catch { return true; }
  }
};

export default store;
