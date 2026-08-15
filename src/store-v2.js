import { db } from '@/lib/firebase';
import {
  doc, getDoc, setDoc, getDocs, deleteDoc, writeBatch,
  collection, query, orderBy, limit as firestoreLimit
} from 'firebase/firestore';
import { APP_VERSION } from '@/version';

// ────────────────────────────────────────────
// SUBCOLLECTION HELPERS
// ────────────────────────────────────────────

// Generic: write one doc to a subcollection
async function writeSubDoc(userId, subcol, docId, data) {
  try {
    const clean = JSON.parse(JSON.stringify(data)); // strip undefined
    await setDoc(doc(db, 'users', userId, subcol, docId), clean, { merge: true });
    return true;
  } catch (e) {
    console.error(`Firestore write ${subcol}/${docId}:`, e);
    return false;
  }
}

// Generic: read one doc from a subcollection
async function readSubDoc(userId, subcol, docId) {
  try {
    const snap = await getDoc(doc(db, 'users', userId, subcol, docId));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error(`Firestore read ${subcol}/${docId}:`, e);
    return null;
  }
}

// Generic: read ALL docs from a subcollection (returns { docId: data })
async function readSubCollection(userId, subcol) {
  try {
    const snap = await getDocs(collection(db, 'users', userId, subcol));
    const result = {};
    snap.forEach(d => { result[d.id] = d.data(); });
    return result;
  } catch (e) {
    console.error(`Firestore readAll ${subcol}:`, e);
    return {};
  }
}

// Generic: delete one doc from a subcollection
async function deleteSubDoc(userId, subcol, docId) {
  try {
    await deleteDoc(doc(db, 'users', userId, subcol, docId));
    return true;
  } catch (e) {
    console.error(`Firestore delete ${subcol}/${docId}:`, e);
    return false;
  }
}

// ────────────────────────────────────────────
// CORE PROFILE (small data — stays in main doc)
// ────────────────────────────────────────────

const storeV2 = {
  // Read the main user document (profile + scalar stats)
  async getUserProfile(userId) {
    if (!userId) return null;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      console.error('Profile read error:', e);
      return null;
    }
  },

  // Save profile + scalar data to main document
  async saveUserProfile(userId, data) {
    if (!userId || !data) return false;
    try {
      const clean = JSON.parse(JSON.stringify(data));
      clean._appVersion = APP_VERSION;
      clean._lastUpdated = new Date().toISOString();
      await setDoc(doc(db, 'users', userId), clean, { merge: true });
      return true;
    } catch (e) {
      console.error('Profile write error:', e);
      return false;
    }
  },

  // ────────────────────────────────────────
  // WORKOUTS — users/{uid}/workouts/{date}
  // ────────────────────────────────────────
  async getWorkouts(userId) {
    return readSubCollection(userId, 'workouts');
  },
  async saveWorkout(userId, date, data) {
    return writeSubDoc(userId, 'workouts', date, data);
  },

  // ────────────────────────────────────────
  // FOOD LOG — users/{uid}/foodLog/{date}
  // ────────────────────────────────────────
  async getFoodLog(userId) {
    return readSubCollection(userId, 'foodLog');
  },
  async saveFoodEntry(userId, date, data) {
    return writeSubDoc(userId, 'foodLog', date, data);
  },

  // ────────────────────────────────────────
  // JOURNAL — users/{uid}/journal/{date}
  // ────────────────────────────────────────
  async getJournal(userId) {
    return readSubCollection(userId, 'journal');
  },
  async saveJournalEntry(userId, date, data) {
    return writeSubDoc(userId, 'journal', date, data);
  },

  // ────────────────────────────────────────
  // XP LOG — users/{uid}/xpLog/{date}
  // ────────────────────────────────────────
  async getXpLog(userId) {
    return readSubCollection(userId, 'xpLog');
  },
  async saveXpEntry(userId, date, data) {
    return writeSubDoc(userId, 'xpLog', date, data);
  },

  // ────────────────────────────────────────
  // FOCUS LOG — users/{uid}/focusLog/{date}
  // ────────────────────────────────────────
  async getFocusLog(userId) {
    return readSubCollection(userId, 'focusLog');
  },
  async saveFocusEntry(userId, date, data) {
    return writeSubDoc(userId, 'focusLog', date, data);
  },

  // ────────────────────────────────────────
  // HABIT LOG — users/{uid}/habitLog/{date}
  // ────────────────────────────────────────
  async getHabitLog(userId) {
    return readSubCollection(userId, 'habitLog');
  },
  async saveHabitEntry(userId, date, data) {
    return writeSubDoc(userId, 'habitLog', date, data);
  },

  // ────────────────────────────────────────
  // CHAT HISTORY — users/{uid}/chatHistory/current
  // ────────────────────────────────────────
  async getChatHistory(userId) {
    const data = await readSubDoc(userId, 'chatHistory', 'current');
    return data?.messages || [];
  },
  async saveChatHistory(userId, messages) {
    return writeSubDoc(userId, 'chatHistory', 'current', { messages, updatedAt: new Date().toISOString() });
  },

  // ────────────────────────────────────────
  // FINANCES — users/{uid}/finances/ledger
  // ────────────────────────────────────────
  async getFinances(userId) {
    const data = await readSubDoc(userId, 'finances', 'ledger');
    return data?.entries || [];
  },
  async saveFinances(userId, entries) {
    return writeSubDoc(userId, 'finances', 'ledger', { entries, updatedAt: new Date().toISOString() });
  },

  // ────────────────────────────────────────
  // ACTIVITY LOG — users/{uid}/activityLog/recent
  // ────────────────────────────────────────
  async getActivityLog(userId) {
    const data = await readSubDoc(userId, 'activityLog', 'recent');
    return data?.entries || [];
  },
  async saveActivityLog(userId, entries) {
    // Cap at 200 entries
    const capped = (entries || []).slice(0, 200);
    return writeSubDoc(userId, 'activityLog', 'recent', { entries: capped, updatedAt: new Date().toISOString() });
  },

  // ────────────────────────────────────────
  // BODY PHOTOS — Firebase Storage + subcollection
  // users/{uid}/bodyPhotos/{date} → { photoUrl, note, weight }
  // Storage: users/{uid}/bodyPhotos/{date}.jpg
  // ────────────────────────────────────────
  async getBodyPhotos(userId) {
    const photos = await readSubCollection(userId, 'bodyPhotos');
    // Convert subcollection format to app format (compatible with old { photo, note, weight } shape)
    const result = {};
    for (const [date, data] of Object.entries(photos)) {
      result[date] = {
        photo: data.photoUrl || data.photo || '', // photoUrl = Storage URL, photo = legacy base64
        date: data.date || date,
        note: data.note || '',
        weight: data.weight || '',
      };
    }
    return result;
  },

  async saveBodyPhoto(userId, date, photoDataUrl, note, weight) {
    try {
      // Save base64 photo in its own subcollection document
      // Each photo is a separate doc — avoids hitting the 1MB main-doc limit
      await writeSubDoc(userId, 'bodyPhotos', date, {
        photo: photoDataUrl,
        date,
        note: note || '',
        weight: weight || '',
        uploadedAt: new Date().toISOString(),
      });
      return photoDataUrl;
    } catch (e) {
      console.error('Body photo save error:', e);
      return null;
    }
  },

  async deleteBodyPhoto(userId, date) {
    try {
      await deleteSubDoc(userId, 'bodyPhotos', date);
      return true;
    } catch (e) {
      console.error('Body photo delete error:', e);
      return false;
    }
  },

  // ────────────────────────────────────────
  // MIGRATION — one-time copy from single doc to subcollections
  // ────────────────────────────────────────
  async migrateUserData(userId) {
    try {
      const mainDoc = await this.getUserProfile(userId);
      if (!mainDoc || mainDoc._migrated) return { alreadyDone: true };

      console.log('[Migration] Starting for user:', userId);
      const results = { success: [], failed: [] };

      // Helper: migrate a date-keyed object to a subcollection
      const migrateDateKeyed = async (field, subcol) => {
        const data = mainDoc[field];
        if (!data || typeof data !== 'object') return;
        const entries = Object.entries(data);
        if (entries.length === 0) return;

        // Firestore batches max 500 ops — split into chunks
        const chunks = [];
        for (let i = 0; i < entries.length; i += 400) {
          chunks.push(entries.slice(i, i + 400));
        }

        for (const chunk of chunks) {
          const batch = writeBatch(db);
          for (const [key, value] of chunk) {
            if (value !== null && value !== undefined) {
              const clean = JSON.parse(JSON.stringify(value));
              batch.set(doc(db, 'users', userId, subcol, key),
                typeof clean === 'object' && !Array.isArray(clean) ? clean : { data: clean },
                { merge: true }
              );
            }
          }
          await batch.commit();
        }
        results.success.push(`${field} → ${subcol} (${entries.length} docs)`);
      };

      // 1. Migrate date-keyed collections
      await migrateDateKeyed('workoutLog', 'workouts');
      await migrateDateKeyed('foodLog', 'foodLog');
      await migrateDateKeyed('journal', 'journal');
      await migrateDateKeyed('xpLog', 'xpLog');
      await migrateDateKeyed('focusLog', 'focusLog');
      await migrateDateKeyed('habitLog', 'habitLog');

      // 2. Migrate chat history
      if (mainDoc.chatHistory && Array.isArray(mainDoc.chatHistory) && mainDoc.chatHistory.length > 0) {
        await writeSubDoc(userId, 'chatHistory', 'current', {
          messages: mainDoc.chatHistory,
          migratedAt: new Date().toISOString(),
        });
        results.success.push(`chatHistory → chatHistory/current (${mainDoc.chatHistory.length} messages)`);
      }

      // 3. Migrate finances
      if (mainDoc.finances && Array.isArray(mainDoc.finances) && mainDoc.finances.length > 0) {
        await writeSubDoc(userId, 'finances', 'ledger', {
          entries: mainDoc.finances,
          migratedAt: new Date().toISOString(),
        });
        results.success.push(`finances → finances/ledger (${mainDoc.finances.length} entries)`);
      }

      // 4. Migrate activity log
      if (mainDoc.activityLog && Array.isArray(mainDoc.activityLog)) {
        await writeSubDoc(userId, 'activityLog', 'recent', {
          entries: mainDoc.activityLog.slice(0, 200),
          migratedAt: new Date().toISOString(),
        });
        results.success.push(`activityLog → activityLog/recent`);
      }

      // 5. Migrate body photos to subcollection (each photo gets its own doc)
      if (mainDoc.bodyPhotos && typeof mainDoc.bodyPhotos === 'object') {
        for (const [date, entry] of Object.entries(mainDoc.bodyPhotos)) {
          try {
            if (entry) {
              await writeSubDoc(userId, 'bodyPhotos', date, {
                photo: entry.photo || '',
                date,
                note: entry.note || '',
                weight: entry.weight || '',
              });
              results.success.push(`bodyPhoto ${date} → subcollection`);
            }
          } catch (e) {
            console.error(`[Migration] Body photo ${date} failed:`, e);
            results.failed.push(`bodyPhoto ${date}: ${e.message}`);
          }
        }
      }

      // 6. Set migration flag (DON'T delete old data)
      await setDoc(doc(db, 'users', userId), {
        _migrated: true,
        _migratedAt: new Date().toISOString(),
        _migratedVersion: APP_VERSION,
        _appVersion: APP_VERSION,
      }, { merge: true });

      console.log('[Migration] Complete:', results);
      return results;
    } catch (e) {
      console.error('[Migration] Fatal error:', e);
      return { error: e.message };
    }
  },

  // Check if user data has been migrated
  async isMigrated(userId) {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      return snap.exists() && snap.data()?._migrated === true;
    } catch {
      return false;
    }
  },
};

export default storeV2;
