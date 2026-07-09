import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Firestore-powered storage — syncs across all devices
const store = {
  // Get user data from Firestore
  async getUserData(userId) {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return docSnap.data();
      return null;
    } catch (e) {
      console.error('Firestore read error:', e);
      return null;
    }
  },

  // Save user data to Firestore (merges with existing)
  async saveUserData(userId, data) {
    try {
      await setDoc(doc(db, 'users', userId), data, { merge: true });
      return true;
    } catch (e) {
      console.error('Firestore write error:', e);
      return false;
    }
  },
};

export default store;