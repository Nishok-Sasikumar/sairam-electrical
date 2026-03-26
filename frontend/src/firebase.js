// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBHEifiVQdUG9Pddwd2A421qFdcK8x4w-4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sairam-69513.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sairam-69513",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sairam-69513.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "138312958922",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:138312958922:web:ef764aef8d097211034533",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5XQ09W9C4E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

export { app, analytics, auth, storage, db };
