import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCNPvAwROkHgqHzbTGf6up-uAd6HUgax1w",
  authDomain: "attendancetracker-b49a6.firebaseapp.com",
  projectId: "attendancetracker-b49a6",
  storageBucket: "attendancetracker-b49a6.firebasestorage.app",
  messagingSenderId: "1007525131687",
  appId: "1:1007525131687:web:141833d6f1941ecc32b282",
  measurementId: "G-CBF11QFYY4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
