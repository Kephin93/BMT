"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  type DocumentData,
  type Query,
} from "firebase/firestore";
import { getDB } from "@/lib/firebase";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ---------- One-shot: fetch a single document ----------
export function useDocOnce<T = DocumentData>(
  collectionName: string,
  id: string
) {
  const db = getDB();
  return useQuery({
    queryKey: ["doc", collectionName, id],
    queryFn: async () => {
      const snap = await getDoc(doc(db, collectionName, id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
    },
  });
}

// ---------- One-shot: fetch a collection (with optional Query) ----------
export function useCollectionOnce<T = DocumentData>(
  q: Query<DocumentData> | string
) {
  const db = getDB();

  return useQuery({
    queryKey: Array.isArray(q)
      ? (q as any)
      : ["colOnce", typeof q === "string" ? q : "query"],
    queryFn: async () => {
      const snapshot = await getDocs(
        typeof q === "string" ? collection(db, q) : q
      );
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as T[];
    },
  });
}

// ---------- Live subscription that updates the Query cache ----------
export function useCollectionLive<T = DocumentData>(
  key: (string | number)[],
  q: Query<DocumentData>
) {
  const db = getDB();
  const qc = useQueryClient();

  // Seed the cache so components can read it
  const queryState = useQuery({
    queryKey: key,
    queryFn: async () => {
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as T[];
    },
  });

  // Attach a real-time listener and push changes into the cache
  useEffect(() => {
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as T[];
      qc.setQueryData(key, items);
    });
    return () => unsub();
  }, [qc, q, ...key]);

  return queryState; // shape: { data, isLoading, error, ... }
}

// ---------- Mutations with cache invalidation ----------
export function useAddDoc(
  collectionName: string,
  invalidateKeys: (string | number)[][] = []
) {
  const db = getDB();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: DocumentData) => {
      const ref = await addDoc(collection(db, collectionName), data);
      return ref.id;
    },
    onSuccess: () => {
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    },
  });
}

export function useSetDoc(
  collectionName: string,
  invalidateKeys: (string | number)[][] = []
) {
  const db = getDB();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DocumentData }) => {
      await setDoc(doc(db, collectionName, id), data, { merge: true });
    },
    onSuccess: () => {
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    },
  });
}

export function useUpdateDoc(
  collectionName: string,
  invalidateKeys: (string | number)[][] = []
) {
  const db = getDB();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DocumentData }) => {
      await updateDoc(doc(db, collectionName, id), data);
    },
    onSuccess: () => {
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    },
  });
}

export function useDeleteDoc(
  collectionName: string,
  invalidateKeys: (string | number)[][] = []
) {
  const db = getDB();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, collectionName, id));
    },
    onSuccess: () => {
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    },
  });
}
