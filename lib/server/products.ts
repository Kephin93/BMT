import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { Product } from "@/interfaces";

export async function getProduct(id: string) {
  if (!id || id.includes("/") || id === "." || id === "..") return null;

  const snap = await adminDb.collection("product").doc(id).get();
  if (!snap.exists) return null;

  return { ...(snap.data() as Product), id: snap.id };
}

export async function listProducts() {
  const snap = await adminDb
    .collection("product")
    .orderBy("recommended", "desc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createProduct(input: any) {
  const ref = await adminDb.collection("product").add({
    ...input,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}
