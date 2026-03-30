import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/setup#config
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "gym-pro-control.firebaseapp.com",
    projectId: "gym-pro-control",
    storageBucket: "gym-pro-control.firebasestorage.app",
    messagingSenderId: "812437149836",
    appId: "1:812437149836:web:1db01ef9046a8ed1b643a9",
    measurementId: "G-QHNZWJ4K6Q"
};

// Initialize Firebase (Prevent duplicate initialization during hot-reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
import { getStorage } from "firebase/storage";
export const storage = getStorage(app);

