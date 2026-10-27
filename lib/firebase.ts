// lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "@/config/public";

let app: FirebaseApp;
let db: Firestore;

export function getFirebaseApp() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  }
  return app!;
}

export function getDB() {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}
