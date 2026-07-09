import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ═══════════════════════════════════════
// PASTE YOUR FIREBASE CONFIG BELOW
// Get it from: Firebase Console → Project Settings → Your apps → Config
// ═══════════════════════════════════════

const firebaseConfig = {
    apiKey: "AIzaSyC5YCv_7O_VxeQwLdCFMWVpRhHvdULMmOU",
    authDomain: "ignite-app-fbb69.firebaseapp.com",
    projectId: "ignite-app-fbb69",
    storageBucket: "ignite-app-fbb69.firebasestorage.app",
    messagingSenderId: "618449695536",
    appId: "1:618449695536:web:e2c58e57dd26fd49d6cef5"
};

// ═══════════════════════════════════════

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);