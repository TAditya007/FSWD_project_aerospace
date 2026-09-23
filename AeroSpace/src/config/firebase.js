// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

// Your web app's Firebase configuration
// Configured to pull from Vite environment variables (VITE_FIREBASE_*)
// with AeroSpace project configuration defaults as fallbacks
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCTzWdB0axWCFDlXAKDHvutUmSuifPyU7k",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aerospec-440.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aerospec-440",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aerospec-440.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "423210614886",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:423210614886:web:6ed21337adcdcbfca66da7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-579VYE260R"
};

// Initialize Firebase App (idempotent across Vite HMR)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore Database
export const db = getFirestore(app);

// Initialize Cloud Storage
export const storage = getStorage(app);

// Initialize Firebase Analytics safely (guards against SSR & environments without IndexedDB/window)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn("Firebase Analytics could not be initialized:", err);
  });
}

// Configure Google Authentication Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Helper Functions for Common Operations
export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const logoutFirebase = async () => {
  return await signOut(auth);
};

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  ref,
  uploadBytes,
  getDownloadURL
};

export default app;
