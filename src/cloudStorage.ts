import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { BudgetData, Category } from "./types";

const LOCAL_STORAGE_KEY = "budget-app-data";

const EMPTY_DATA: BudgetData = { categories: [], transactions: [], recurring: [], rules: [], goals: [] };

/** Who can see a budget besides its owner. Lives on the budget document, outside BudgetData. */
export interface SharingInfo {
  members: string[];
  memberNames: Record<string, string>;
  ownerName: string;
}

const NO_SHARING: SharingInfo = { members: [], memberNames: {}, ownerName: "" };

function normalize(raw: unknown): BudgetData {
  const r = (raw ?? {}) as Partial<BudgetData>;
  const categories = Array.isArray(r.categories) ? r.categories : [];
  return {
    categories: categories.map(
      (c): Category => ({ ...c, mode: c.mode === "deplete" ? "deplete" : "fill" }),
    ),
    transactions: Array.isArray(r.transactions) ? r.transactions : [],
    recurring: Array.isArray(r.recurring) ? r.recurring : [],
    rules: Array.isArray(r.rules) ? r.rules : [],
    goals: Array.isArray(r.goals) ? r.goals : [],
  };
}

function readSharing(raw: Record<string, unknown>): SharingInfo {
  return {
    members: Array.isArray(raw.members) ? (raw.members as string[]) : [],
    memberNames:
      raw.memberNames && typeof raw.memberNames === "object"
        ? (raw.memberNames as Record<string, string>)
        : {},
    ownerName: typeof raw.ownerName === "string" ? raw.ownerName : "",
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
 * Syncs a budget document in real time, so every device (and anyone the
 * budget is shared with) sees the same data. `ownerUid` is whose budget to
 * open: the signed-in user's own, or a partner's they've joined. On first
 * sign-in for an account with no cloud data yet, seeds it from whatever this
 * browser had in localStorage so existing local data isn't lost.
 */
export function useCloudBudgetData(
  ownerUid: string | null,
  selfUid: string,
  onAccessLost: () => void,
) {
  // Data is tagged with whose budget it came from, so switching between your
  // own and a shared budget can never write one budget's data into the other.
  // `fromServer` marks data that just arrived from Firestore and needs no write.
  const [state, setState] = useState<{ owner: string; data: BudgetData; fromServer: boolean } | null>(null);
  const [sharing, setSharing] = useState<SharingInfo>(NO_SHARING);
  const accessLost = useRef(onAccessLost);
  accessLost.current = onAccessLost;

  useEffect(() => {
    setState(null);
    setSharing(NO_SHARING);
    if (!ownerUid) return;
    const ref = doc(db, "users", ownerUid, "budget", "data");
    const isOwn = ownerUid === selfUid;

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setState({ owner: ownerUid, data: normalize(snap.data()), fromServer: true });
          setSharing(readSharing(snap.data()));
        } else if (!snap.metadata.fromCache && isOwn) {
          // Only seed once the server confirms there's no document. A cache miss
          // while offline would otherwise overwrite real data with an empty one.
          const seed = loadLocalFallback();
          setState({ owner: ownerUid, data: seed, fromServer: true });
          setDoc(ref, seed).catch(() => {});
        }
      },
      (err) => {
        // A partner's budget stops being readable once they remove you.
        if (!isOwn && err.code === "permission-denied") accessLost.current();
      },
    );

    return unsubscribe;
  }, [ownerUid, selfUid]);

  useEffect(() => {
    if (!state || state.fromServer || state.owner !== ownerUid) return;
    const ref = doc(db, "users", state.owner, "budget", "data");
    // Merge so the sharing fields on the same document are left alone.
    setDoc(ref, state.data, { merge: true }).catch(() => {});
  }, [state, ownerUid]);

  function update(updater: (prev: BudgetData) => BudgetData) {
    setState((prev) => {
      if (!prev) return prev;
      const data = updater(prev.data);
      return data === prev.data ? prev : { owner: prev.owner, data, fromServer: false };
    });
  }

  const ready = state !== null && state.owner === ownerUid;
  return { data: ready ? state.data : EMPTY_DATA, loading: !ready, update, sharing };
}
