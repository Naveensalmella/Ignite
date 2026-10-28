"use client";
// ────────────────────────────────────────────
// Firestore persistence for the app store (see useAppStore: loadUserData / saveData / logout).
//
// • Saves are diff-based: the state maps to documents (one key per main-doc field,
//   one per day doc, chat / finance / activity / tracker-photo docs) and only keys
//   whose JSON differs from `session.saved` — what we know Firestore has — are written.
// • Writes are queued without waiting for the server: with the persistent cache a
//   commit is applied locally at once, but its promise only settles when the server
//   confirms it (never, while offline). Server acks are tracked separately for the
//   sync badge and for logout. A rejected write restores the old baseline, so the
//   next save retries it.
// • While signed in, live listeners merge changes made on other devices / tabs into
//   the store: taken as-is when there's no unsaved local change to that key, merged
//   three-way otherwise. Remote data becomes the new baseline, so applying it never
//   triggers a save back.
// ────────────────────────────────────────────
import storeV2, {
  DAY_COLLECTIONS, encodeDayDoc, decodeDayDoc, MAX_DOC_BYTES, byteLength, chunkDocId, joinChunks,
} from '@/store-v2';
import { DEFAULT_HABITS } from '@/data/index';
import { normalizeDayLog, toArr, addDays } from '@/utils';

// Fields stored on the main users/{uid} document.
export const PROFILE_FIELDS = [
  'profile', 'habits', 'tasks', 'totalXP', 'streak', 'lastCheck', 'pillarProg',
  'routineData', 'masteryData', 'bodyData', 'challengeData', 'programData',
  'freezeData', 'programState', 'loginData', 'activeTitle', 'questChainData', 'system',
];

// Caps that keep single documents well under Firestore's 1 MB limit.
const MAX_CHATS = 30;
const MAX_MESSAGES_PER_CHAT = 60;
const MAX_MESSAGE_CHARS = 4000;   // 60 × 4000 chars stays < 1 MB even for non-Latin text
const MAX_ACTIVITY = 200;
const LIVE_DAYS = 60;             // day docs watched for changes made on other devices
const FRESH_TIMEOUT_MS = 8000;    // max wait for the server copy when a tab comes back

const NORMALIZED_DAY_FIELDS = ['foodLog', 'xpLog', 'focusLog', 'habitLog'];
const DAY_FIELD = Object.fromEntries(DAY_COLLECTIONS.map(c => [c.subcol, c.field]));

// List-shaped data kept outside the main document. Chunked lists are split across
// several docs when they outgrow one (see chunkDocId in store-v2).
const GROUPS = [
  { subcol: 'chatHistory', base: 'current', key: 'messages', field: 'chatHistory', single: true, prepend: true },
  { subcol: 'activityLog', base: 'recent', key: 'entries', field: 'activityLog', single: true, prepend: true },
  { subcol: 'finances', base: 'ledger', key: 'entries', field: 'finances', prepend: true },
  { subcol: 'bodyData', base: 'photos', key: 'photos', field: 'bodyData' }, // bodyData.photos
];
const GROUP_BY_SUBCOL = Object.fromEntries(GROUPS.map(g => [g.subcol, g]));

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// JSON with sorted keys and Firestore's value rules (undefined dropped, NaN → null,
// nested arrays → index maps), so equal data always gives the same string whether
// it came from the store or back from Firestore.
function docJson(value) {
  return JSON.stringify(value ?? null, function (k, v) {
    if (Array.isArray(v) && Array.isArray(this)) v = Object.fromEntries(v.map((x, i) => [String(i), x]));
    if (!isObj(v) || v instanceof Date) return v;
    const out = {};
    for (const key of Object.keys(v).sort()) if (typeof v[key] !== 'function') out[key] = v[key];
    return out;
  });
}
const parseJson = (json) => { try { return json === undefined ? undefined : JSON.parse(json); } catch { return undefined; } };
const same = (a, b) => a === b || docJson(a) === docJson(b);

// ── Main document ──
// Main-doc field value as stored: tracker photos live in bodyData/photos*, not here.
function mainValue(field, v) {
  if (field === 'bodyData' && isObj(v)) {
    const rest = { ...v };
    delete rest.photos;
    return rest;
  }
  return v ?? null;
}

export function withPhotos(bodyData, photos) {
  const list = toArr(photos);
  if (isObj(bodyData)) return { ...bodyData, photos: list };
  return list.length ? { photos: list } : null;
}

// Main document → store fields (also used for live updates).
export function readMainFields(main) {
  return {
    profile: main.profile || {},
    habits: toArr(main.habits).length ? toArr(main.habits) : DEFAULT_HABITS,
    tasks: toArr(main.tasks),
    pillarProg: main.pillarProg || {},
    routineData: main.routineData || null,
    masteryData: main.masteryData || null,
    bodyData: isObj(main.bodyData) ? main.bodyData : null,
    challengeData: main.challengeData || null,
    programData: main.programData || null,
    freezeData: main.freezeData || null,
    programState: main.programState || {},
    loginData: main.loginData || {},
    activeTitle: main.activeTitle || null,
    questChainData: main.questChainData || {},
    system: isObj(main.system) ? main.system : null,
    totalXP: Number(main.totalXP) || 0,
    streak: Number(main.streak) || 0,
    lastCheck: main.lastCheck || '',
  };
}

// ── Day documents ──
const dayShape = (v) => (Array.isArray(v) ? { entries: v } : isObj(v) ? v : { data: v }); // = encodeDayDoc, without copying
const dayJson = (v) => docJson(dayShape(v));
function decodeDay(field, data) {
  const v = decodeDayDoc(data);
  return NORMALIZED_DAY_FIELDS.includes(field) ? normalizeDayLog({ v }).v : v;
}

// ── Lists (chat, activity, finances, tracker photos) ──
const trimMessage = (m) => (m && typeof m.text === 'string' && m.text.length > MAX_MESSAGE_CHARS
  ? { ...m, text: `${m.text.slice(0, MAX_MESSAGE_CHARS)}…` } : m);

// Newest 30 conversations, last 60 messages each, long replies trimmed — then drop
// the oldest conversations until the document fits.
function capChats(chats) {
  const list = toArr(chats).filter(c => c && typeof c === 'object').slice(0, MAX_CHATS)
    .map(c => (Array.isArray(c.messages) ? { ...c, messages: c.messages.slice(-MAX_MESSAGES_PER_CHAT).map(trimMessage) } : c));
  let total = 0;
  let n = 0;
  for (; n < list.length; n++) {
    total += byteLength(docJson(list[n])) + 1;
    if (total > MAX_DOC_BYTES) break;
  }
  return list.slice(0, n);
}

// Greedy size-based chunks, filled from the oldest item so appending only touches the
// last chunk. Items too big for any document are returned in `dropped`.
function chunkList(list, newestFirst) {
  const ordered = newestFirst ? list.slice().reverse() : list;
  const chunks = [[]];
  const dropped = [];
  let size = 0;
  for (const item of ordered) {
    const n = byteLength(docJson(item)) + 1;
    if (n > MAX_DOC_BYTES) { dropped.push(item); continue; }
    if (size + n > MAX_DOC_BYTES && chunks[chunks.length - 1].length) { chunks.push([]); size = 0; }
    chunks[chunks.length - 1].push(item);
    size += n;
  }
  return { chunks: newestFirst ? chunks.map(c => c.reverse()) : chunks, dropped };
}

function groupList(g, s) {
  return g.subcol === 'bodyData' ? toArr(s.bodyData?.photos).filter(Boolean) : toArr(s[g.field]);
}
function groupPatch(g, s, list) {
  return g.subcol === 'bodyData' ? { bodyData: withPhotos(mainValue('bodyData', s.bodyData), list) } : { [g.field]: list };
}
// Firestore docs { id: data } of one group → the list.
function readGroup(g, docs) {
  return g.single ? toArr(docs[g.base]?.[g.key]) : joinChunks(g.base, docs, g.key, g.prepend);
}
function groupDocs(g, list) {
  const docs = new Map();
  const add = (id, data) => docs.set(`${g.subcol}/${id}`, { path: [g.subcol, id], json: docJson(data), make: () => data });
  if (g.single) {
    add(g.base, { [g.key]: g.subcol === 'chatHistory' ? capChats(list) : list.slice(0, MAX_ACTIVITY) });
    return { docs, dropped: [] };
  }
  const { chunks, dropped } = chunkList(list, g.prepend);
  chunks.forEach((items, i) => add(chunkDocId(g.base, i), { [g.key]: items }));
  return { docs, dropped };
}

// Every document the app would write for a state: key → { path | field, json, make() }.
// `onDropped(group, items)` hears about list items too big to store at all.
export function buildDocs(s, onDropped) {
  const docs = new Map();
  const email = s.user?.email || null;
  docs.set('main:email', { field: 'email', json: docJson(email), make: () => email });
  for (const field of PROFILE_FIELDS) {
    const v = mainValue(field, s[field]);
    docs.set(`main:${field}`, { field, json: docJson(v), make: () => v });
  }
  for (const { field, subcol } of DAY_COLLECTIONS) {
    for (const [date, value] of Object.entries(s[field] || {})) {
      if (value === null || value === undefined) continue;
      docs.set(`${subcol}/${date}`, { path: [subcol, date], json: dayJson(value), make: () => encodeDayDoc(value) });
    }
  }
  for (const g of GROUPS) {
    const { docs: list, dropped } = groupDocs(g, groupList(g, s));
    list.forEach((e, k) => docs.set(k, e));
    if (dropped.length && onDropped) onDropped(g, dropped);
  }
  return docs;
}

// ── Three-way merge (both this tab and another device changed the same thing) ──
// Each side keeps its own changes relative to `base`; on a direct conflict this tab wins.
export function merge3(base, local, remote) {
  if (same(local, remote)) return local;
  if (same(base, local)) return remote;
  if (same(base, remote)) return local;
  if (isObj(local) && isObj(remote)) {
    const b = isObj(base) ? base : {};
    const out = {};
    for (const k of new Set([...Object.keys(local), ...Object.keys(remote)])) {
      const v = merge3(b[k], local[k], remote[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  if (Array.isArray(local) && Array.isArray(remote)) return mergeList(base, local, remote);
  return local;
}

// Lists: items are matched by `id` (or by value). Remote additions are added, items
// deleted remotely and untouched here are dropped, items changed on both are merged.
const itemId = (x) => (isObj(x) && x.id != null && typeof x.id !== 'object' ? `id:${x.id}` : `v:${docJson(x)}`);
export function mergeList(base, local, remote, prepend = false) {
  const baseBy = new Map(toArr(base).map(x => [itemId(x), x]));
  const remoteBy = new Map(toArr(remote).map(x => [itemId(x), x]));
  const localIds = new Set();
  const kept = [];
  for (const x of toArr(local)) {
    const id = itemId(x);
    localIds.add(id);
    if (!baseBy.has(id)) kept.push(x);
    else if (remoteBy.has(id)) kept.push(merge3(baseBy.get(id), x, remoteBy.get(id)));
    else if (!same(baseBy.get(id), x)) kept.push(x); // deleted remotely but edited here: keep
  }
  const added = toArr(remote).filter(x => !baseBy.has(itemId(x)) && !localIds.has(itemId(x)));
  return prepend ? [...added, ...kept] : [...kept, ...added];
}

// Counters gained on two devices add up instead of one overwriting the other.
function mergeCounter(base, local, remote) {
  if (typeof base !== 'number') return Math.max(num(local), num(remote));
  return Math.max(0, num(remote) + num(local) - base);
}

function mergeSystem(base, local, remote) {
  const out = merge3(base, local, remote);
  if (!isObj(out) || !isObj(local) || !isObj(remote)) return out;
  for (const k of ['gold', 'abilityPoints']) {
    if (typeof local[k] === 'number' || typeof remote[k] === 'number') out[k] = mergeCounter(base?.[k], local[k], remote[k]);
  }
  if (typeof local.apLevel === 'number' || typeof remote.apLevel === 'number') out.apLevel = Math.max(num(local.apLevel), num(remote.apLevel));
  // A Penalty Quest opened by an out-of-date copy is void once the other device
  // shows that day's Daily Quest was completed.
  const pen = out.penalty;
  if (pen?.active && pen.missed && out.questLog?.[pen.missed]?.claimed) {
    out.penalty = { ...pen, active: false, cleared: 'synced', clearedAt: Date.now() };
  }
  return out;
}

function mergeField(field, base, local, remote) {
  if (field === 'totalXP') return mergeCounter(base, local, remote);
  if (field === 'system') return mergeSystem(base, local, remote);
  return merge3(base, local, remote);
}

// ── Session bookkeeping (module-level: one signed-in user per tab) ──
const newSession = (uid, gen) => ({
  uid, gen,
  saved: new Map(),     // doc key → JSON of what Firestore has (or will have once queued writes land)
  inflight: new Map(),  // doc key → number of our writes not yet confirmed
  pending: new Set(),   // ack promises of queued writes
  failed: false,        // a write was rejected since the last save
  hold: null,           // promise: catching up with the server before saving
  holdQueued: false,
  lastMain: null,       // latest main-document snapshot
  stop: null,           // stops live listeners
});
let session = newSession(null, 0);
const warned = new Set();

// Start a new account session (stops the previous one). Returns a token for isCurrentSession.
export function beginSession(uid) {
  endSession();
  session = newSession(uid, session.gen + 1);
  return session.gen;
}
export function endSession() {
  if (session.stop) session.stop();
  session = newSession(null, session.gen + 1);
  warned.clear();
}
export const isCurrentSession = (gen, uid) => session.gen === gen && session.uid === uid;

// After loading: everything the state holds is what Firestore has, except keys
// `isUnsaved(key)` (data that still has to be written, e.g. moved out of legacy fields).
export function markLoaded(s, isUnsaved = () => false) {
  session.saved = new Map();
  for (const [key, e] of buildDocs(s)) if (!isUnsaved(key)) session.saved.set(key, e.json);
}

function refreshStatus(api) {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const status = session.pending.size > 0 ? (offline ? 'offline' : 'saving') : (session.failed ? 'error' : 'saved');
  if (api.get().syncStatus !== status) api.set({ syncStatus: status });
}

function docLabel(key) {
  if (key.startsWith('main:')) return `your ${key.slice(5)} data`;
  const [subcol, id] = key.split('/');
  if (DAY_FIELD[subcol]) return `${DAY_FIELD[subcol]} for ${id}`;
  return { chatHistory: 'Oracle chat history', finances: 'finance ledger', activityLog: 'activity log', bodyData: 'body-tracker photos' }[subcol] || key;
}
function warnOnce(api, id, lines) {
  if (warned.has(id)) return;
  warned.add(id);
  try { api.get().notify({ kind: 'warning', title: 'NOT SAVED', lines }); } catch { /* notices are optional */ }
}

// Queue a write; `entries` are [key, json] pairs it stores (json undefined = delete).
function track(api, promise, entries) {
  const gen = session.gen;
  const prev = entries.map(([key]) => session.saved.get(key));
  for (const [key, json] of entries) {
    if (json === undefined) session.saved.delete(key); else session.saved.set(key, json);
    session.inflight.set(key, (session.inflight.get(key) || 0) + 1);
  }
  let failed = false;
  const ack = Promise.resolve(promise).catch(e => {
    if (gen !== session.gen) return;
    failed = true;
    console.error('Save error:', e);
    // Not stored: put the previous baseline back so the next save retries this change.
    entries.forEach(([key, json], i) => {
      if (session.saved.get(key) !== json) return; // superseded by a newer write or remote data
      if (prev[i] === undefined) session.saved.delete(key); else session.saved.set(key, prev[i]);
    });
  }).finally(() => {
    if (gen !== session.gen) return;
    for (const [key] of entries) {
      const n = (session.inflight.get(key) || 1) - 1;
      if (n > 0) session.inflight.set(key, n); else session.inflight.delete(key);
    }
    session.pending.delete(ack);
    if (failed) {
      session.failed = true;
      // Remote changes that arrived while this write was in flight were skipped — look again.
      if (session.lastMain && entries.some(([k]) => k.startsWith('main:'))) handleMain(api, session.lastMain);
    }
    refreshStatus(api);
  });
  session.pending.add(ack);
  return ack;
}

// ── Save: write only documents that changed since Firestore last had them ──
export function saveChanges(api, force = false) {
  const s = api.get();
  if (!s.user || !s.dataReady || !session.uid || s.user.uid !== session.uid) return Promise.resolve();
  // A tab back from the background first catches up with the server (see onVisibilityChange).
  if (session.hold && !force) { session.holdQueued = true; return session.hold; }
  const uid = session.uid;

  const docs = buildDocs(s, (g, items) => warnOnce(api, `drop:${g.subcol}`, [
    `${items.length} item${items.length === 1 ? '' : 's'} in your ${docLabel(`${g.subcol}/x`)} ${items.length === 1 ? 'is' : 'are'} too large to save.`,
  ]));
  const main = {};
  const mainEntries = [];
  const dayWrites = [];
  const docWrites = [];
  const deletes = [];
  for (const [key, e] of docs) {
    if (session.saved.get(key) === e.json) continue;
    if (byteLength(e.json) > MAX_DOC_BYTES) {
      warnOnce(api, key, [`Your ${docLabel(key)} is too large to save (Firestore's 1 MB document limit).`, 'Everything else is still being saved.']);
      continue;
    }
    if (e.field) { main[e.field] = e.make(); mainEntries.push([key, e.json]); }
    else (DAY_FIELD[e.path[0]] ? dayWrites : docWrites).push({ key, path: e.path, data: e.make(), json: e.json });
  }
  for (const key of session.saved.keys()) {
    if (!key.startsWith('main:') && !docs.has(key)) deletes.push(key);
  }
  if (!mainEntries.length && !dayWrites.length && !docWrites.length && !deletes.length) return Promise.resolve();

  session.failed = false;
  const acks = [];
  // Sub-documents first, so data moved out of the main doc is stored before it's removed
  // there. Day docs share batches; every other document goes on its own, so one bad
  // document can never block the rest.
  if (dayWrites.length || deletes.length) {
    acks.push(track(api, storeV2.commit(uid, dayWrites, deletes.map(k => k.split('/'))),
      [...dayWrites.map(w => [w.key, w.json]), ...deletes.map(k => [k, undefined])]));
  }
  for (const w of docWrites) acks.push(track(api, storeV2.commit(uid, [w]), [[w.key, w.json]]));
  if (mainEntries.length) acks.push(track(api, storeV2.saveUserProfile(uid, main), mainEntries));
  refreshStatus(api);
  return Promise.all(acks);
}

// Resolves true once every queued write is confirmed, or false after `ms`.
export function whenSynced(ms) {
  if (!session.pending.size) return Promise.resolve(true);
  return Promise.race([
    Promise.allSettled([...session.pending]).then(() => true),
    new Promise(resolve => setTimeout(() => resolve(false), ms)),
  ]);
}

// ── Live updates from other devices / tabs ──
// What to do with a remote version of one document key.
function decide(key, remoteJson, localJson) {
  if (session.inflight.has(key)) return 'skip';   // our own write is on its way and wins
  const base = session.saved.get(key);
  if (remoteJson === base) return 'skip';          // nothing new (or the echo of our write)
  if (localJson === remoteJson) return 'same';
  return localJson === base ? 'apply' : 'merge';   // merge: changed here AND there
}

function handleMain(api, raw) {
  if (!isObj(raw)) return;
  session.lastMain = raw;
  const s = api.get();
  if (!s.dataReady) return;
  const remote = readMainFields(raw);
  const patch = {};
  for (const field of PROFILE_FIELDS) {
    const key = `main:${field}`;
    const rv = mainValue(field, remote[field]);
    const lv = mainValue(field, s[field]);
    const remoteJson = docJson(rv);
    const action = decide(key, remoteJson, docJson(lv));
    if (action === 'skip') continue;
    if (action === 'apply') patch[field] = rv;
    else if (action === 'merge') patch[field] = mergeField(field, parseJson(session.saved.get(key)), lv, rv);
    session.saved.set(key, remoteJson);
  }
  if ('bodyData' in patch) patch.bodyData = withPhotos(patch.bodyData, s.bodyData?.photos);
  if (Object.keys(patch).length) api.set(patch);
}

function handleDays(api, subcol, snap) {
  const field = DAY_FIELD[subcol];
  const s = api.get();
  if (!field || !s.dataReady) return;
  const log = s[field] || {};
  let next = null;
  for (const ch of snap.docChanges()) {
    const id = ch.doc.id;
    const key = `${subcol}/${id}`;
    const rv = ch.type === 'removed' ? undefined : decodeDay(field, ch.doc.data());
    const lv = log[id] ?? undefined;
    const remoteJson = rv === undefined ? undefined : dayJson(rv);
    const action = decide(key, remoteJson, lv === undefined ? undefined : dayJson(lv));
    if (action === 'skip') continue;
    if (action !== 'same') {
      const value = action === 'apply' ? rv : merge3(decodeDayDoc(parseJson(session.saved.get(key))), lv, rv);
      next = next || { ...log };
      if (value === undefined || value === null) delete next[id]; else next[id] = value;
    }
    if (remoteJson === undefined) session.saved.delete(key); else session.saved.set(key, remoteJson);
  }
  if (next) api.set({ [field]: next });
}

// Chat / activity / finance / tracker-photo collections: compared and merged as whole lists.
function handleDocs(api, subcol, snap) {
  const g = GROUP_BY_SUBCOL[subcol];
  const s = api.get();
  if (!g || !s.dataReady) return;
  const prefix = `${subcol}/`;
  if ([...session.inflight.keys()].some(k => k.startsWith(prefix))) return;
  const raw = {};
  snap.docs.forEach(d => { raw[d.id] = d.data(); });
  const remoteList = readGroup(g, raw);
  const remote = new Map([...groupDocs(g, remoteList).docs].map(([k, e]) => [k, e.json]));
  const saved = new Map([...session.saved].filter(([k]) => k.startsWith(prefix)));
  const sameAs = (a, b) => a.size === b.size && [...a].every(([k, j]) => b.get(k) === j);
  if (sameAs(remote, saved)) return; // nothing new
  const localList = groupList(g, s);
  const local = new Map([...groupDocs(g, localList).docs].map(([k, e]) => [k, e.json]));
  let list = null;
  if (sameAs(local, remote)) list = null;
  else if (sameAs(local, saved)) list = remoteList;
  else {
    const baseDocs = {};
    saved.forEach((json, k) => { baseDocs[k.slice(prefix.length)] = parseJson(json); });
    list = mergeList(readGroup(g, baseDocs), localList, remoteList, g.prepend);
  }
  saved.forEach((_, k) => session.saved.delete(k));
  remote.forEach((json, k) => session.saved.set(k, json));
  if (list) api.set(groupPatch(g, api.get(), list));
}

// A tab coming back from the background may hold old data (its connection was
// asleep) — and may have just acted on it (e.g. the daily check). Hold saves until
// the server's copy of the main document is merged in, so it can't overwrite newer
// progress from another device.
function releaseHold(api) {
  session.hold = null;
  if (session.holdQueued) { session.holdQueued = false; saveChanges(api); }
}
function onVisibilityChange(api) {
  // Leaving again (maybe closing the tab): never sit on unsaved edits.
  if (document.visibilityState === 'hidden') { if (session.hold) releaseHold(api); return; }
  if (!session.uid || session.hold) return;
  const { uid, gen } = session;
  const hold = Promise.race([
    storeV2.getUserProfileFromServer(uid),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), FRESH_TIMEOUT_MS)),
  ])
    .then(raw => { if (session.gen === gen) handleMain(api, raw); })
    .catch(() => { /* offline or slow: carry on with what we have */ })
    .finally(() => { if (session.gen === gen && session.hold === hold) releaseHold(api); });
  session.hold = hold;
}

export function startLiveSync(api) {
  const { uid, gen } = session;
  if (!uid || typeof window === 'undefined') return;
  const guard = (fn) => (...args) => {
    if (session.gen !== gen) return;
    try { fn(...args); } catch (e) { console.error('Live sync error:', e); }
  };
  const stopListeners = storeV2.subscribe(uid, addDays(-LIVE_DAYS), {
    onMain: guard(snap => handleMain(api, snap.exists() ? snap.data() : null)),
    onDays: guard((subcol, snap) => handleDays(api, subcol, snap)),
    onDocs: guard((subcol, snap) => handleDocs(api, subcol, snap)),
    onError: (e) => console.warn('Live sync stopped:', e?.code || e),
  });
  const onVis = guard(() => onVisibilityChange(api));
  const onNet = guard(() => refreshStatus(api));
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('online', onNet);
  window.addEventListener('offline', onNet);
  session.stop = () => {
    stopListeners();
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('online', onNet);
    window.removeEventListener('offline', onNet);
  };
}

// Dev-only handle for tests (never in production builds).
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  window.__igniteSync = { storeV2, session: () => session, handleMain, handleDays, handleDocs, buildDocs, merge3, mergeList };
}
