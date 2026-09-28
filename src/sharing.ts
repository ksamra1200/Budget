import { useEffect, useState } from "react";
import {
  Timestamp,
  arrayRemove,
  arrayUnion,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";

const INVITE_TTL_MS = 48 * 60 * 60 * 1000;
// No 0/O or 1/I/L, so a code read aloud or retyped from a text can't be misread.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function budgetRef(ownerUid: string) {
  return doc(db, "users", ownerUid, "budget", "data");
}

function pointerRef(uid: string) {
  return doc(db, "users", uid, "profile", "sharing");
}

export function displayNameOf(user: User): string {
  return user.displayName?.trim() || user.email || "Partner";
}

/**
 * Whose budget this user is looking at: their own uid, or the owner of a
 * shared budget they've joined. `null` while it's still loading.
 */
export function useBudgetOwner(uid: string): string | null {
  const [owner, setOwner] = useState<string | null>(null);

  useEffect(() => {
    setOwner(null);
    return onSnapshot(
      pointerRef(uid),
      (snap) => {
        const shared = snap.exists() ? snap.data().budgetOwner : undefined;
        setOwner(typeof shared === "string" && shared ? shared : uid);
      },
      () => setOwner(uid),
    );
  }, [uid]);

  return owner;
}

function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Creates a single-use invite code for the owner's budget, valid for 48 hours. */
export async function createInvite(owner: User): Promise<string> {
  const code = randomCode();
  await setDoc(budgetRef(owner.uid), { ownerName: displayNameOf(owner) }, { merge: true });
  await setDoc(doc(db, "invites", code), {
    ownerUid: owner.uid,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + INVITE_TTL_MS),
  });
  return code;
}

export async function joinBudget(rawCode: string, user: User): Promise<void> {
  const code = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== CODE_LENGTH) throw new Error("Invite codes are 8 characters, like ABCD-2345.");

  let invite;
  try {
    invite = await getDoc(doc(db, "invites", code));
  } catch {
    throw new Error("Couldn't check that code. Make sure you're online and try again.");
  }
  if (!invite.exists()) throw new Error("That code isn't valid. It may have already been used.");

  const { ownerUid, expiresAt } = invite.data() as { ownerUid: string; expiresAt: Timestamp };
  if (ownerUid === user.uid) throw new Error("That's your own invite code. Send it to your partner instead.");
  if (expiresAt.toMillis() < Date.now()) throw new Error("That code has expired. Ask for a new one.");

  try {
    await updateDoc(budgetRef(ownerUid), {
      members: arrayUnion(user.uid),
      [`memberNames.${user.uid}`]: displayNameOf(user),
      joinCode: code,
    });
  } catch {
    throw new Error("Couldn't join that budget. Ask for a new code and try again.");
  }
  await setDoc(pointerRef(user.uid), { budgetOwner: ownerUid });
  // Single use: nobody else can join with it now.
  await deleteDoc(doc(db, "invites", code)).catch(() => {});
}

/** A member leaving a partner's budget; they go back to their own. */
export async function leaveBudget(selfUid: string, ownerUid: string): Promise<void> {
  await updateDoc(budgetRef(ownerUid), {
    members: arrayRemove(selfUid),
    [`memberNames.${selfUid}`]: deleteField(),
  }).catch(() => {});
  await clearSharingPointer(selfUid);
}

/** The owner removing someone from their budget. */
export async function removeMember(ownerUid: string, memberUid: string): Promise<void> {
  await updateDoc(budgetRef(ownerUid), {
    members: arrayRemove(memberUid),
    [`memberNames.${memberUid}`]: deleteField(),
  });
}

export async function clearSharingPointer(uid: string): Promise<void> {
  await deleteDoc(pointerRef(uid)).catch(() => {});
}
