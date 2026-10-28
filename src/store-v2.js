import { db } from '@/lib/firebase';
import {
  doc, getDoc, getDocFromServer, setDoc, getDocs, deleteDoc, writeBatch, collection,
  onSnapshot, query, where, documentId, deleteField,
} from 'firebase/firestore';
import { APP_VERSION } from '@/version';
import { toArr } from '@/utils';

// ────────────────────────────────────────────
// LAYOUT
// users/{uid}                     — profile + small scalar stats
// users/{uid}/{subcol}/{date}     — one doc per day for each day-keyed log
// users/{uid}/chatHistory/current — { messages }
// users/{uid}/finances/ledger[-n] — { entries } (split into chunks when large)
// users/{uid}/activityLog/recent  — { entries } (capped)
// users/{uid}/bodyData/photos[-n] — { photos } body-tracker photos (chunked)
// users/{uid}/bodyPhotos/{date}   — one photo per doc
// ────────────────────────────────────────────

// Firestore rejects documents over 1 MiB. Stay well below it (JSON size is a
// slight overestimate of the stored size, so this leaves headroom).
export const MAX_DOC_BYTES = 900_000;

// Sub-collections of non-day documents (chat, finances, activity, tracker photos).
export const DOC_COLLECTIONS = ['chatHistory', 'finances', 'activityLog', 'bodyData'];

// UTF-8 size of a string (what Firestore counts), without allocating a buffer.
export function byteLength(str) {
  let n = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xd800 && c <= 0xdbff) { n += 4; i++; } // surrogate pair
    else n += 3;
  }
  return n;
}

// Lists too big for one document are split across `${base}`, `${base}-1`, `${base}-2`, …
// Chunk 0 holds the OLDEST items, so adding new items only rewrites the last chunk.
export const chunkDocId = (base, i) => (i === 0 ? base : `${base}-${i}`);
export function chunkIndex(base, id) {
  if (id === base) return 0;
  if (!id.startsWith(`${base}-`)) return -1;
  const n = Number(id.slice(base.length + 1));
  return Number.isInteger(n) && n > 0 ? n : -1;
}
// { docId: data } → the full list. `newestFirst` lists (finances) keep newest-first
// order inside each chunk; their newest chunk has the highest index.
export function joinChunks(base, docs, field, newestFirst = false) {
  const parts = Object.entries(docs || {})
    .map(([id, data]) => [chunkIndex(base, id), toArr(data?.[field])])
    .filter(([i]) => i >= 0)
    .sort((a, b) => a[0] - b[0]);
  if (newestFirst) parts.reverse();
  return parts.flatMap(([, list]) => list);
}

// Offline, a write is applied to the local cache at once but its promise only
// settles when the server confirms it. Wait a little for that, then report the
// write as queued instead of hanging the UI.
function settle(promise, ms = 6000) {
  return Promise.race([
    promise.then(() => 'saved'),
    new Promise(resolve => setTimeout(() => resolve('queued'), ms)),
  ]);
}

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

  // Same, but always from the server (throws when offline). Used to catch up
  // before a tab that was in the background writes anything.
  async getUserProfileFromServer(userId) {
    const snap = await getDocFromServer(doc(db, 'users', userId));
    return snap.exists() ? snap.data() : null;
  },

  // Write top-level fields of the main document. Each listed field is replaced
  // as a whole (so removed keys inside e.g. `profile` really disappear), while
  // fields not listed (changed elsewhere, tutorialDone, _migrated, …) are left
  // untouched. Returns the commit promise (see commit() about offline).
  saveUserProfile(userId, data) {
    if (!userId || !data) return Promise.resolve(false);
    try {
      const clean = withMeta(toFirestoreValue(data));
      return setDoc(doc(db, 'users', userId), clean, { mergeFields: Object.keys(clean) }).then(() => true);
    } catch (e) {
      return Promise.reject(e);
    }
  },

  // Delete fields from the main document (legacy copies left by the migration).
  removeUserFields(userId, fields) {
    if (!userId || !fields?.length) return Promise.resolve();
    const patch = {};
    fields.forEach(f => { patch[f] = deleteField(); });
    return setDoc(doc(db, 'users', userId), patch, { merge: true });
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

  // These return null when nothing is stored yet (legacy data may still live in
  // the main document), and throw on read errors.
  async getChatHistory(userId) {
    const data = await readSubDoc(userId, 'chatHistory', 'current');
    return data ? toArr(data.messages) : null;
  },
  async getFinances(userId) {
    const docs = await readSubCollection(userId, 'finances');
    return Object.keys(docs).some(id => chunkIndex('ledger', id) >= 0) ? joinChunks('ledger', docs, 'entries', true) : null;
  },
  async getTrackerPhotos(userId) {
    const docs = await readSubCollection(userId, 'bodyData');
    return Object.keys(docs).some(id => chunkIndex('photos', id) >= 0) ? joinChunks('photos', docs, 'photos') : null;
  },
  async getActivityLog(userId) {
    const data = await readSubDoc(userId, 'activityLog', 'recent');
    return data ? toArr(data.entries) : null;
  },

  // Apply a set of document writes/deletes in batches (≤ 450 ops per batch).
  // `writes`: [{ path: ['workouts', '2026-01-01'], data }] — full replace.
  // `deletes`: [['workouts', '2026-01-01'], ...]
  // All batches are queued at once (in order) and NOT awaited one by one: with the
  // persistent cache a commit is applied locally right away, but its promise only
  // resolves once the server confirms it — which never happens while offline.
  commit(userId, writes, deletes = []) {
    try {
      const ops = [
        ...writes.map(w => ({ type: 'set', path: w.path, data: w.data })),
        ...deletes.map(path => ({ type: 'delete', path })),
      ];
      const commits = [];
      for (let i = 0; i < ops.length; i += 450) {
        const batch = writeBatch(db);
        for (const op of ops.slice(i, i + 450)) {
          const ref = doc(db, 'users', userId, ...op.path);
          if (op.type === 'set') batch.set(ref, toFirestoreValue(op.data));
          else batch.delete(ref);
        }
        commits.push(batch.commit());
      }
      return Promise.all(commits);
    } catch (e) {
      return Promise.reject(e);
    }
  },

  // Live updates for everything the store saves: the main doc, day docs from
  // `dayWindowStart` on (old days are rarely edited on two devices at once, and
  // this keeps listener reads small) and the chat/finance/activity/tracker-photo
  // docs. Returns an unsubscribe function.
  subscribe(userId, dayWindowStart, { onMain, onDays, onDocs, onError }) {
    const unsubs = [onSnapshot(doc(db, 'users', userId), onMain, onError)];
    for (const { subcol } of DAY_COLLECTIONS) {
      const q = query(collection(db, 'users', userId, subcol), where(documentId(), '>=', dayWindowStart));
      unsubs.push(onSnapshot(q, snap => onDays(subcol, snap), onError));
    }
    for (const subcol of DOC_COLLECTIONS) {
      unsubs.push(onSnapshot(collection(db, 'users', userId, subcol), snap => onDocs(subcol, snap), onError));
    }
    return () => unsubs.forEach(u => { try { u(); } catch { /* already closed */ } });
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

  // Resolves 'saved' (server confirmed) or 'queued' (offline — syncs later); throws on failure.
  async saveBodyPhoto(userId, date, photoDataUrl, note, weight) {
    const data = toFirestoreValue({
      photo: photoDataUrl,
      date,
      note: note || '',
      weight: weight || '',
      uploadedAt: new Date().toISOString(),
    });
    if (byteLength(JSON.stringify(data)) > MAX_DOC_BYTES) throw new Error('Photo is too large to save');
    return settle(setDoc(doc(db, 'users', userId, 'bodyPhotos', date), data));
  },

  // Resolves 'saved' or 'queued' like saveBodyPhoto; throws on failure.
  async deleteBodyPhoto(userId, date) {
    return settle(deleteDoc(doc(db, 'users', userId, 'bodyPhotos', date)));
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

    // Mark done. The old main-document copies are deleted on a later load, once
    // the sub-collections are confirmed (see loadUserData).
    await setDoc(doc(db, 'users', userId), {
      _migrated: true,
      _migratedAt: new Date().toISOString(),
      _migratedVersion: APP_VERSION,
    }, { merge: true });
    return { migrated: writes.length };
  },
};

export default storeV2;
