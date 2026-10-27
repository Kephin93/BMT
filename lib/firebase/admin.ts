// lib/firebase/admin.ts
import "server-only";
import { serverConfig } from "@/config/server";
import {
  getApps,
  initializeApp,
  applicationDefault,
  cert,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app =
  getApps()[0] ??
  initializeApp({
    credential: serverConfig.googleApplicationCredentials
      ? applicationDefault()
      : cert(serverConfig.firebase),
  });

export const adminDb = getFirestore(app);
