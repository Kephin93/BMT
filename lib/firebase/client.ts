// lib/firebase/client.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { firebaseConfig, useFirebaseEmulator } from "@/config/public";

export const clientApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);
export const db = getFirestore(clientApp);

// Optional: Firestore Emulator in dev
if (useFirebaseEmulator) {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  } catch {
    // ignore if double-connected during HMR
  }
}
