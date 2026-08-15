# IGNITE — Firestore Subcollection Migration Plan (Task 1.4)

## The Problem

All user data sits in **one Firestore document** at `users/{userId}`. Firestore has a **1 MB document size limit**. Here's what's growing unbounded:

| Field | Shape | Growth Rate | Size Risk |
|-------|-------|-------------|-----------|
| `bodyPhotos` | `{ "2026-08-01": { photo: "data:image/jpeg;base64,..." } }` | Per photo upload | **CRITICAL** — Each base64 photo is 200KB–1MB+. 2-3 photos = document limit hit |
| `chatHistory` | `[{ role, content }]` | Per AI message | **HIGH** — Long conversations can reach 50KB+ easily |
| `workoutLog` | `{ "2026-08-15": { exercises: [...], cal, duration } }` | Daily | **MEDIUM** — ~1KB/day × 365 = ~365KB/year |
| `foodLog` | `{ "2026-08-15": [{ name, cal, protein, ... }] }` | Daily (multiple entries) | **MEDIUM** — ~2KB/day × 365 = ~730KB/year |
| `journal` | `{ "2026-08-15": { entry: "...", mood: 5 } }` | Daily | **MEDIUM** — depends on entry length |
| `xpLog` | `{ "2026-08-15": [{ amount, category, reason, time }] }` | Multiple per day | **MEDIUM** — ~500B/day |
| `focusLog` | `{ "2026-08-15": [{ duration, type }] }` | Per focus session | LOW-MEDIUM |
| `habitLog` | `{ "2026-08-15": { habitId: true/false } }` | Daily | LOW |
| `finances` | `[{ amount, category, date, note }]` | Per transaction | LOW-MEDIUM |
| `activityLog` | `[{ id, type, detail, date, time }]` | Capped at 200 | LOW (capped) |

**Worst case today**: A user who uploads 2 body photos and uses the app daily for 3 months could already be at 500KB+. Six months of use with photos = document limit exceeded, app breaks silently.

---

## Target Architecture

### What stays in the main document (`users/{userId}`)
Small, scalar, rarely-changing data that's needed on every page load:

```
users/{userId} {
  // Profile & identity
  profile: { name, age, weight, height, gender, goal, fitnessLevel, ... },
  email: "user@example.com",
  
  // Scalar stats (needed everywhere)
  totalXP: 12500,
  streak: 14,
  lastCheck: "2026-08-15",
  activeTitle: "Iron Warrior",
  
  // Small config objects
  freezeData: { ... },
  programState: { ... },
  loginData: { ... },
  
  // Metadata
  _appVersion: "5.0.0",
  _lastUpdated: "2026-08-15T10:30:00Z",
  _migrated: true,
  _migratedAt: "2026-08-15T10:30:00Z",
  tutorialDone: true,
}
```

**Estimated size: 2-5 KB** — will never hit the limit.

### Subcollections

```
users/{userId}/
  ├── workouts/{date}          — one doc per day
  │     { exercises: [...], cal: 450, duration: 3600, split: "Push" }
  │
  ├── foodLog/{date}           — one doc per day
  │     { entries: [{ name, cal, protein, carbs, fat, ... }] }
  │
  ├── journal/{date}           — one doc per day  
  │     { entry: "...", mood: 5, gratitude: "...", timestamp: "..." }
  │
  ├── xpLog/{date}             — one doc per day
  │     { events: [{ amount, category, reason, time }] }
  │
  ├── focusSessions/{date}     — one doc per day
  │     { sessions: [{ duration, type, startTime }] }
  │
  ├── habitLog/{date}          — one doc per day
  │     { habits: { habitId: true/false, ... } }
  │
  ├── finances/{docId}         — one doc per transaction (or batched monthly)
  │     { amount, category, date, note, type }
  │
  ├── chatHistory/{sessionId}  — one doc per chat session
  │     { messages: [{ role, content }], startedAt, topic }
  │
  ├── bodyPhotos/{date}        — one doc per photo
  │     { photoUrl: "gs://...", note: "...", weight: 75 }
  │     (photo moved to Firebase Storage, only URL stored here)
  │
  ├── activityLog/{docId}      — auto-ID, TTL-rotated
  │     { type, detail, date, time, timestamp }
  │
  ├── challenges/{docId}       — challenge state
  │     { ... }
  │
  ├── programs/{docId}         — program data
  │     { ... }
  │
  └── mastery/{docId}          — mastery tracking
        { ... }
```

### Body Photos → Firebase Storage

**This is the single most impactful change.** Base64 images must move to Firebase Storage:

```
Firebase Storage:
  users/{userId}/bodyPhotos/{date}.jpg

Firestore (just the reference):
  users/{userId}/bodyPhotos/{date} → { photoUrl: "https://storage...", note, weight }
```

This alone could reduce document size by 80%+ for users who upload photos.

---

## Migration Strategy

### Principle: **Read both, write new** (zero-downtime, zero-data-loss)

The migration happens in 3 phases over 2 deployments. At no point is data deleted or unavailable.

### Phase A: Add Subcollection Read/Write Layer (v5.0)

1. **Create `src/store-v2.js`** — new store module that reads/writes subcollections
2. **Update `loadUserData`** — reads from BOTH old single-doc AND new subcollections, preferring subcollection data if it exists
3. **Update `saveData`** — writes to BOTH old single-doc AND new subcollections
4. **Deploy** — existing users continue working. New writes go to both places.

```javascript
// store-v2.js — subcollection operations
const storeV2 = {
  // Write workout to subcollection
  async saveWorkout(userId, date, data) {
    await setDoc(doc(db, 'users', userId, 'workouts', date), data, { merge: true });
  },
  
  // Read workouts (date range for performance)
  async getWorkouts(userId, startDate, endDate) {
    const q = query(
      collection(db, 'users', userId, 'workouts'),
      where(documentId(), '>=', startDate),
      where(documentId(), '<=', endDate)
    );
    const snap = await getDocs(q);
    const result = {};
    snap.forEach(doc => { result[doc.id] = doc.data(); });
    return result;
  },
  
  // ... similar for each subcollection
};
```

### Phase B: Background Migration Script (v5.0, runs once per user)

When a user logs in, check if `_migrated` flag exists. If not, run migration:

```javascript
async function migrateUserData(userId) {
  const mainDoc = await store.getUserData(userId);
  if (!mainDoc || mainDoc._migrated) return;
  
  // 1. Copy workoutLog entries to subcollection
  if (mainDoc.workoutLog) {
    const batch = writeBatch(db);
    for (const [date, data] of Object.entries(mainDoc.workoutLog)) {
      batch.set(doc(db, 'users', userId, 'workouts', date), data);
    }
    await batch.commit(); // Batches of max 500
  }
  
  // 2. Copy foodLog entries to subcollection
  // ... same pattern for each field
  
  // 3. Upload body photos to Storage, save URLs to subcollection
  if (mainDoc.bodyPhotos) {
    for (const [date, entry] of Object.entries(mainDoc.bodyPhotos)) {
      if (entry.photo?.startsWith('data:')) {
        const blob = base64ToBlob(entry.photo);
        const ref = storageRef(storage, `users/${userId}/bodyPhotos/${date}.jpg`);
        await uploadBytes(ref, blob);
        const url = await getDownloadURL(ref);
        await setDoc(doc(db, 'users', userId, 'bodyPhotos', date), {
          photoUrl: url, note: entry.note || "", weight: entry.weight
        });
      }
    }
  }
  
  // 4. Set migration flag (DON'T delete old data yet)
  await setDoc(doc(db, 'users', userId), { 
    _migrated: true, 
    _migratedAt: new Date().toISOString() 
  }, { merge: true });
}
```

### Phase C: Clean Up Old Fields (v5.1, weeks later)

Only after confirming all active users have migrated:
1. Remove dual-write from saveData (only write subcollections)
2. Optionally remove old fields from main document to save space
3. Never delete — just stop writing to them

---

## Updated Firestore Security Rules

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // All subcollections inherit the same owner-only rule
      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    match /publicProfiles/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Good news**: The rules we already wrote in the previous patch already include the wildcard subcollection rule (`match /{subcollection}/{docId}`), so no security rule changes are needed!

---

## Updated `store.js` API

The store will expose granular methods instead of one giant get/set:

```javascript
// New API surface
const store = {
  // Core profile (small, always loaded)
  getUserProfile(userId),
  saveUserProfile(userId, data),
  
  // Date-keyed subcollections (loaded by range)
  getWorkouts(userId, startDate, endDate),
  saveWorkout(userId, date, data),
  
  getFoodLog(userId, startDate, endDate),
  saveFoodEntry(userId, date, entries),
  
  getJournal(userId, startDate, endDate),
  saveJournalEntry(userId, date, data),
  
  getXpLog(userId, startDate, endDate),
  saveXpEntry(userId, date, events),
  
  getFocusLog(userId, startDate, endDate),
  saveFocusSession(userId, date, sessions),
  
  getHabitLog(userId, startDate, endDate),
  saveHabitLog(userId, date, data),
  
  // Non-date collections
  getFinances(userId, limit),
  saveFinance(userId, transaction),
  
  getChatHistory(userId, sessionId),
  saveChatMessage(userId, sessionId, messages),
  
  // Body photos (Firebase Storage integration)
  getBodyPhotos(userId),
  saveBodyPhoto(userId, date, file, note),
  deleteBodyPhoto(userId, date),
  
  // Migration
  migrateUserData(userId),
  isMigrated(userId),
};
```

---

## App.jsx Changes

### Current: One giant load, one giant save

```javascript
// Load everything at once
const d = await store.getUserData(uid);
if (d) {
  d.foodLog && setFoodLog(d.foodLog);
  d.workoutLog && setWorkoutLog(d.workoutLog);
  // ... 25 more fields
}

// Save everything at once (debounced 2s)
await store.saveUserData(user.uid, {
  foodLog, habits, habitLog, tasks, journal, finances, profile,
  chatHistory, totalXP, workoutLog, streak, lastCheck, pillarProg,
  activityLog, focusLog, routineData, masteryData, bodyData,
  challengeData, programData, freezeData, programState,
  xpLog, loginData, activeTitle, questChainData, bodyPhotos,
});
```

### After: Granular load + targeted saves

```javascript
// Load core profile first (fast — small document)
const profile = await store.getUserProfile(uid);

// Load recent data in parallel (last 30 days)
const thirtyDaysAgo = getDateNDaysAgo(30);
const today = getTodayDate();

const [workouts, food, journals, xp, focus, habits] = await Promise.all([
  store.getWorkouts(uid, thirtyDaysAgo, today),
  store.getFoodLog(uid, thirtyDaysAgo, today),
  store.getJournal(uid, thirtyDaysAgo, today),
  store.getXpLog(uid, thirtyDaysAgo, today),
  store.getFocusLog(uid, thirtyDaysAgo, today),
  store.getHabitLog(uid, thirtyDaysAgo, today),
]);

// Save only what changed (no more debounced full-doc write)
// Each setter triggers its own targeted save:
const updateWorkout = (date, data) => {
  setWorkoutLog(prev => ({ ...prev, [date]: data }));
  store.saveWorkout(user.uid, date, data);  // immediate, tiny write
};
```

### Benefits:
1. **Faster initial load** — profile loads in <100ms, data streams in parallel
2. **Smaller writes** — saving one workout = writing ~1KB instead of the entire 500KB+ doc
3. **No size limit concern** — each subcollection doc is ~1-5KB max
4. **Lazy loading** — older data loaded on-demand (e.g., viewing history page loads past months)
5. **Lower Firestore costs** — reads/writes are charged per document, but smaller docs = fewer bandwidth charges

---

## Implementation Order (2-3 days)

### Day 1: Store Layer + Body Photos
1. Create `store-v2.js` with all subcollection read/write methods
2. Add Firebase Storage setup for body photos
3. Write the migration function
4. Update `firestore.rules` if needed (already covered!)

### Day 2: App.jsx Integration
1. Update `loadUserData` to use dual-read (old doc + subcollections)
2. Update `saveData` to use granular saves
3. Add migration trigger on login
4. Update `BodyProgress.jsx` to use Storage URLs instead of base64

### Day 3: Testing + Edge Cases
1. Test with fresh user (no migration needed)
2. Test with existing user (migration runs)
3. Test offline → online sync
4. Test large data (many workouts, photos)
5. Verify beforeunload still saves correctly
6. Check that all pages still display data correctly

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Migration fails mid-way | `_migrated` flag only set after ALL data is copied. User retries on next login. |
| Old data format unexpected | Each field migration wrapped in try-catch. Failures logged, don't block other fields. |
| User on old version after deploy | Dual-write ensures old format still updated. Old clients keep working. |
| Body photo upload fails | Keep base64 in old doc as fallback. Only reference Storage URL after confirmed upload. |
| Firestore batch limit (500 ops) | Split large logs into batches of 400 with await between them. |
| Data loss during migration | **We NEVER delete the old document fields.** They stay as backup indefinitely. |

---

## Data Preservation Guarantee

Per the v5 critical rule:
- Old document fields are **NEVER deleted** — they serve as permanent backup
- Migration is additive (copy to subcollections), not destructive (delete from main doc)
- `{ merge: true }` used on every write — existing fields untouched
- `_migrated` and `_migratedAt` timestamps track migration status
- If anything fails, the app falls back to reading from the old single document
