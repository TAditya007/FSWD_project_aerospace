// Firebase configuration for Firebase Hosting & optional client services
// Configured to pull from Vite environment variables (VITE_FIREBASE_*)
// with AeroSpace project configuration defaults as fallbacks
import { initializeApp, getApps, getApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCTzWdB0axWCFDlXAKDHvutUmSuifPyU7k",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aerospec-440.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aerospec-440",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aerospec-440.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "423210614886",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:423210614886:web:6ed21337adcdcbfca66da7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-579VYE260R"
};

// Lazy initialization helpers - ensures Firebase is NOT initialized merely because a file or page is rendered
let _app = null;

export const getFirebaseApp = () => {
  if (typeof window === "undefined") return null;
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return _app;
};

export default firebaseConfig;
