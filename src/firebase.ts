import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// Firebase's web config values are not secret - they identify the project,
// but access is controlled entirely by Firestore security rules.
const firebaseConfig = {
  apiKey: "AIzaSyCChRgDcLZenocB3KPbgtYn97jNzKD6A44",
  authDomain: "budget-tool-a6be7.firebaseapp.com",
  projectId: "budget-tool-a6be7",
  storageBucket: "budget-tool-a6be7.firebasestorage.app",
  messagingSenderId: "180296823042",
  appId: "1:180296823042:web:3777938226f4b32c15d21b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Some networks (restrictive proxies, certain corporate/VPN setups) block or
// break Firestore's default streaming connection. Auto-detecting long-polling
// makes sync resilient to that without affecting normal connections.
// persistentLocalCache keeps data and queued writes in IndexedDB, so entries
// made offline survive the app being closed and sync once back online.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Local development against the Firebase emulators (`npm run dev:emulated`),
// so features can be tried without touching real accounts or data.
if (import.meta.env.VITE_USE_EMULATORS === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
