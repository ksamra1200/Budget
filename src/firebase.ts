import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const db = getFirestore(app);
