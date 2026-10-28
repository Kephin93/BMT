import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { Product } from "@/interfaces";
import { productSchema } from "@/schemas/product";

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

export async function createProduct(input: unknown) {
  const product = productSchema.parse(input);
  const ref = await adminDb.collection("product").add({
    ...product,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

export async function updateProduct(id: string, input: unknown) {
  if (!id || id.includes("/") || id === "." || id === "..") return null;
  const product = productSchema.parse(input);
  try {
    await adminDb.collection("product").doc(id).update({
      ...product,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 5) return null;
    throw error;
  }
  return { id };
}
