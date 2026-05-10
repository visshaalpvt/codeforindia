import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  // Using only databaseURL since we're using RTDB in test mode
  // The SDK can often infer the projectId from this URL structure: codeforindia-ed656
  projectId: "codeforindia-ed656",
  databaseURL: "https://codeforindia-ed656-default-rtdb.firebaseio.com",
  // Note: For Auth to work, you MUST add your apiKey and authDomain here
  // apiKey: "YOUR_API_KEY",
  // authDomain: "codeforindia-ed656.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
