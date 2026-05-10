import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSy_dummy_key_for_build_only",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "codeforindia-ed656.firebaseapp.com",
  projectId: "codeforindia-ed656",
  databaseURL: "https://codeforindia-ed656-default-rtdb.firebaseio.com",
  storageBucket: "codeforindia-ed656.appspot.com",
  messagingSenderId: "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
