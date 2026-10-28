import { db } from '@/lib/firebase';
import {
  doc, getDoc, setDoc, getDocs, deleteDoc, writeBatch, collection,
} from 'firebase/firestore';
import { APP_VERSION } from '@/version';

// ────────────────────────────────────────────
// LAYOUT
// users/{uid}                     — profile + small scalar stats
// users/{uid}/{subcol}/{date}     — one doc per day for each day-keyed log
// users/{uid}/chatHistory/current — { messages }
// users/{uid}/finances/ledger     — { entries }
// users/{uid}/activityLog/recent  — { entries } (capped)
// users/{uid}/bodyPhotos/{date}   — one photo per doc
// ────────────────────────────────────────────

// Store field → Firestore subcollection for day-keyed logs.
export const DAY_COLLECTIONS = [
  { field: 'workoutLog', subcol: 'workouts' },
  { field: 'foodLog', subcol: 'foodLog' },
  { field: 'journal', subcol: 'journal' },
  { field: 'xpLog', subcol: 'xpLog' },
  { field: 'focusLog', subcol: 'focusLog' },
  { field: 'habitLog', subcol: 'habitLog' },
];

// Keys older app versions used to wrap non-object values in a day doc.
const WRAPPER_KEYS = ['entries', 'data', 'events', 'sessions'];
const META_KEYS = ['updatedAt', 'migratedAt', '_v'];

// Firestore can't store `undefined`, NaN, or arrays directly inside arrays.
// Deep-clean a value so a write is never rejected for its shape.
export function toFirestoreValue(value, insideArray = false) {
  if (value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    const arr = value.map(v => toFirestoreValue(v, true));
    // Nested arrays are not allowed — store the inner one as an index-keyed map.
    return insideArray ? Object.fromEntries(arr.map((v, i) => [String(i), v])) : arr;
  }
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (v === undefined || typeof v === 'function') continue;
    out[k] = toFirestoreValue(v, false);
  }
  return out;
}

// In-memory day value → Firestore document (documents must be maps).
export function encodeDayDoc(value) {
  if (Array.isArray(value)) return { entries: toFirestoreValue(value) };
  if (value !== null && typeof value === 'object') return toFirestoreValue(value);
  return { data: toFirestoreValue(value) };
}

// Firestore document → in-memory day value (inverse of encodeDayDoc, plus legacy shapes).
export function decodeDayDoc(data) {
  if (!data || typeof data !== 'object') return data;
  const keys = Object.keys(data).filter(k => !META_KEYS.includes(k));
  if (keys.length === 1 && WRAPPER_KEYS.includes(keys[0])) return data[keys[0]];
  if (keys.length !== Object.keys(data).length) {
    const rest = {};
    keys.forEach(k => { rest[k] = data[k]; });
    return rest;
  }
  return data;
}

function withMeta(data) {
  return { ...data, _appVersion: APP_VERSION, _lastUpdated: new Date().toISOString() };
}

// Read every doc of a subcollection → { docId: data }. Throws on failure so a
// failed load is never mistaken for "no data" (which would later overwrite it).
async function readSubCollection(userId, subcol) {
  const snap = await getDocs(collection(db, 'users', userId, subcol));
  const result = {};
  snap.forEach(d => { result[d.id] = d.data(); });
  return result;
}

async function readSubDoc(userId, subcol, docId) {
  const snap = await getDoc(doc(db, 'users', userId, subcol, docId));
  return snap.exists() ? snap.data() : null;
}

async function writeSubDoc(userId, subcol, docId, data) {
  try {
    await setDoc(doc(db, 'users', userId, subcol, docId), toFirestoreValue(data));
    return true;
  } catch (e) {
    console.error(`Firestore write ${subcol}/${docId}:`, e);
    return false;
  }
}

const storeV2 = {
  // Main user document, or null if the user has none yet. Throws on read errors.
  async getUserProfile(userId) {
    if (!userId) return null;
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? snap.data() : null;
  },

  // Write top-level fields of the main document. Each listed field is replaced
  // as a whole (so removed keys inside e.g. `profile` really disappear), while
  // fields not listed (tutorialDone, _migrated, …) are left untouched.
  async saveUserProfile(userId, data) {
    if (!userId || !data) return false;
    const clean = withMeta(toFirestoreValue(data));
    await setDoc(doc(db, 'users', userId), clean, { mergeFields: Object.keys(clean) });
    return true;
  },

  // Load all day-keyed logs → { workoutLog: {date: value}, foodLog: {...}, ... }
  async getDayLogs(userId) {
    const results = await Promise.all(DAY_COLLECTIONS.map(c => readSubCollection(userId, c.subcol)));
    const out = {};
    DAY_COLLECTIONS.forEach((c, i) => {
      const decoded = {};
      for (const [id, data] of Object.entries(results[i])) decoded[id] = decodeDayDoc(data);
      out[c.field] = decoded;
    });
    return out;
  },

  async getChatHistory(userId) {
    const data = await readSubDoc(userId, 'chatHistory', 'current');
    return data?.messages || [];
  },
  async getFinances(userId) {
    const data = await readSubDoc(userId, 'finances', 'ledger');
    return data?.entries || [];
  },
  // Body-tracker photos: null when the doc doesn't exist yet (legacy data lives in bodyData.photos).
  async getTrackerPhotos(userId) {
    const data = await readSubDoc(userId, 'bodyData', 'photos');
    return data ? (data.photos || []) : null;
  },
  async getActivityLog(userId) {
    const data = await readSubDoc(userId, 'activityLog', 'recent');
    return data?.entries || [];
  },

  // Apply a set of document writes/deletes in batches (≤ 450 ops per batch).
  // `writes`: [{ path: ['workouts', '2026-01-01'], data }] — full replace.
  // `deletes`: [['workouts', '2026-01-01'], ...]
  async commit(userId, writes, deletes = []) {
    const ops = [
      ...writes.map(w => ({ type: 'set', path: w.path, data: w.data })),
      ...deletes.map(path => ({ type: 'delete', path })),
    ];
    for (let i = 0; i < ops.length; i += 450) {
      const batch = writeBatch(db);
      for (const op of ops.slice(i, i + 450)) {
        const ref = doc(db, 'users', userId, ...op.path);
        if (op.type === 'set') batch.set(ref, toFirestoreValue(op.data));
        else batch.delete(ref);
      }
      await batch.commit();
    }
  },

  // ────────────────────────────────────────
  // BODY PHOTOS — users/{uid}/bodyPhotos/{date}
  // Each photo lives in its own doc to stay under the 1 MB document limit.
  // ────────────────────────────────────────
  async getBodyPhotos(userId) {
    const photos = await readSubCollection(userId, 'bodyPhotos');
    const result = {};
    for (const [date, data] of Object.entries(photos)) {
      result[date] = {
        photo: data.photoUrl || data.photo || '',
        date: data.date || date,
        note: data.note || '',
        weight: data.weight || '',
      };
    }
    return result;
  },

  async saveBodyPhoto(userId, date, photoDataUrl, note, weight) {
    const ok = await writeSubDoc(userId, 'bodyPhotos', date, {
      photo: photoDataUrl,
      date,
      note: note || '',
      weight: weight || '',
      uploadedAt: new Date().toISOString(),
    });
    return ok ? photoDataUrl : null;
  },

  async deleteBodyPhoto(userId, date) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'bodyPhotos', date));
      return true;
    } catch (e) {
      console.error('Body photo delete error:', e);
      return false;
    }
  },

  // ────────────────────────────────────────
  // MIGRATION — one-time copy from the old single-document layout
  // ────────────────────────────────────────
  async migrateUserData(userId, mainDoc) {
    if (!mainDoc || mainDoc._migrated) return { alreadyDone: true };
    const writes = [];

    for (const { field, subcol } of DAY_COLLECTIONS) {
      const data = mainDoc[field];
      if (!data || typeof data !== 'object') continue;
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) writes.push({ path: [subcol, key], data: encodeDayDoc(value) });
      }
    }
    if (Array.isArray(mainDoc.chatHistory) && mainDoc.chatHistory.length > 0) {
      writes.push({ path: ['chatHistory', 'current'], data: { messages: mainDoc.chatHistory, migratedAt: new Date().toISOString() } });
    }
    if (Array.isArray(mainDoc.finances) && mainDoc.finances.length > 0) {
      writes.push({ path: ['finances', 'ledger'], data: { entries: mainDoc.finances, migratedAt: new Date().toISOString() } });
    }
    if (Array.isArray(mainDoc.activityLog) && mainDoc.activityLog.length > 0) {
      writes.push({ path: ['activityLog', 'recent'], data: { entries: mainDoc.activityLog.slice(0, 200), migratedAt: new Date().toISOString() } });
    }
    if (mainDoc.bodyPhotos && typeof mainDoc.bodyPhotos === 'object') {
      for (const [date, entry] of Object.entries(mainDoc.bodyPhotos)) {
        if (entry) writes.push({ path: ['bodyPhotos', date], data: { photo: entry.photo || '', date, note: entry.note || '', weight: entry.weight || '' } });
      }
    }

    // Body photos can be large; write them one at a time outside the batch.
    const photoWrites = writes.filter(w => w.path[0] === 'bodyPhotos');
    await this.commit(userId, writes.filter(w => w.path[0] !== 'bodyPhotos'));
    for (const w of photoWrites) await writeSubDoc(userId, w.path[0], w.path[1], w.data);

    // Mark done (old fields are kept, not deleted, as a safety net).
    await setDoc(doc(db, 'users', userId), {
      _migrated: true,
      _migratedAt: new Date().toISOString(),
      _migratedVersion: APP_VERSION,
    }, { merge: true });
    return { migrated: writes.length };
  },
};

export default storeV2;
