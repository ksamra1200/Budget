import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { BudgetData } from "./types";

const LOCAL_STORAGE_KEY = "budget-app-data";

const EMPTY_DATA: BudgetData = { categories: [], transactions: [], goals: [] };

function normalize(raw: unknown): BudgetData {
  const r = (raw ?? {}) as Partial<BudgetData>;
  return {
    categories: Array.isArray(r.categories) ? r.categories : [],
    transactions: Array.isArray(r.transactions) ? r.transactions : [],
    goals: Array.isArray(r.goals) ? r.goals : [],
  };
}

function loadLocalFallback(): BudgetData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : EMPTY_DATA;
  } catch {
    return EMPTY_DATA;
  }
}

/**
 * Syncs budget data to a per-user Firestore document in real time, so the
 * same account sees the same data on every device. On first sign-in for an
 * account with no cloud data yet, seeds it from whatever this browser had
 * in localStorage so existing local data isn't lost.
 */
export function useCloudBudgetData(uid: string) {
  const [data, setData] = useState<BudgetData | null>(null);
  const skipNextWrite = useRef(false);

  useEffect(() => {
    setData(null);
    const ref = doc(db, "users", uid, "budget", "data");

    const unsubscribe = onSnapshot(ref, (snap) => {
      skipNextWrite.current = true;
      if (snap.exists()) {
        setData(normalize(snap.data()));
      } else {
        const seed = loadLocalFallback();
        setData(seed);
        setDoc(ref, seed).catch(() => {});
      }
    });

    return unsubscribe;
  }, [uid]);

  useEffect(() => {
    if (data === null) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    const ref = doc(db, "users", uid, "budget", "data");
    setDoc(ref, data).catch(() => {});
  }, [data, uid]);

  function update(updater: (prev: BudgetData) => BudgetData) {
    setData((prev) => updater(prev ?? EMPTY_DATA));
  }

  return { data: data ?? EMPTY_DATA, loading: data === null, update };
}
