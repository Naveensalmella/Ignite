import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Firestore-powered storage — syncs across all devices
// All operations are protected with try-catch and retry
const store = {
  // Get user data from Firestore
  async getUserData(userId) {
    if (!userId) return null;
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return docSnap.data();
      return null;
    } catch (e) {
      console.error('Firestore read error:', e);
      // Retry once after 1 second
      try {
        await new Promise(r => setTimeout(r, 1000));
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return docSnap.data();
      } catch (e2) {
        console.error('Firestore read retry failed:', e2);
      }
      return null;
    }
  },

  // Save user data to Firestore (merges with existing — NEVER overwrites)
  async saveUserData(userId, data) {
    if (!userId || !data) return false;
    try {
      // Clean data — remove undefined values that Firestore rejects
      const cleanData = JSON.parse(JSON.stringify(data));
      await setDoc(doc(db, 'users', userId), cleanData, { merge: true });
      return true;
    } catch (e) {
      console.error('Firestore write error:', e);
      // Retry once after 1 second
      try {
        await new Promise(r => setTimeout(r, 1000));
        const cleanData = JSON.parse(JSON.stringify(data));
        await setDoc(doc(db, 'users', userId), cleanData, { merge: true });
        return true;
      } catch (e2) {
        console.error('Firestore write retry failed:', e2);
      }
      return false;
    }
  },
};

export default store;