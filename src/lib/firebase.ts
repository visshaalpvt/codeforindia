import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  // Using only databaseURL since we're using RTDB in test mode
  // The SDK can often infer the projectId from this URL structure: codeforindia-ed656
  projectId: "codeforindia-ed656",
  databaseURL: "https://codeforindia-ed656-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
