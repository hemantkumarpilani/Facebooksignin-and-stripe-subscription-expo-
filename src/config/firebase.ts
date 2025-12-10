import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

// Your Firebase configuration
// Replace these with your actual Firebase config values
// You can get these from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyAQ7B3GhcIwOdhmwEyoZEgMElt9yryyWfc",
  authDomain: "facebooksignin-676aa.firebaseapp.com",
  projectId: "facebooksignin-676aa",
  storageBucket: "facebooksignin-676aa.firebasestorage.app",
  messagingSenderId: "86476201066",
  appId: "1:86476201066:web:cd37eec913e9f4859d7e13",
  measurementId: "G-T5SQ8G5H8Y",
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Firebase Auth automatically persists authentication state in React Native
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

export { app, auth };
