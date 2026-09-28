// Security rules tests. Run with `npm run test:rules` (starts the Firestore emulator; needs Java).
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  Timestamp,
  arrayRemove,
  arrayUnion,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const env = await initializeTestEnvironment({
  projectId: "demo-budget",
  firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8080 },
});

let pass = 0;
let fail = 0;
async function check(name, fn) {
  try {
    await fn();
    pass++;
    console.log("  ok  ", name);
  } catch (e) {
    fail++;
    console.log("  FAIL", name, "-", e.message.split("\n")[0]);
  }
}

const owner = env.authenticatedContext("owner").firestore();
const partner = env.authenticatedContext("partner").firestore();
const stranger = env.authenticatedContext("stranger").firestore();
const anon = env.unauthenticatedContext().firestore();
const budget = (db, uid = "owner") => doc(db, "users", uid, "budget", "data");
const seed = { categories: [{ id: "c1", name: "Food", budget: 100, mode: "fill" }], transactions: [], recurring: [], rules: [], goals: [] };
const futureTs = () => Timestamp.fromMillis(Date.now() + 48 * 3600e3);

console.log("Owner basics");
await check("owner creates own budget", () => assertSucceeds(setDoc(budget(owner), seed)));
await check("owner reads own budget", () => assertSucceeds(getDoc(budget(owner))));
await check("owner merge-writes budget", () => assertSucceeds(setDoc(budget(owner), { ...seed, goals: [{ id: "g", name: "Trip", target: 5, saved: 0 }] }, { merge: true })));
await check("owner can't create with members pre-filled", () => assertFails(setDoc(budget(owner, "owner"), { ...seed, members: ["x"] })));
await check("owner can't add junk field", () => assertFails(setDoc(budget(owner), { hacked: true }, { merge: true })));
await check("owner can't write a string where a list goes", () => assertFails(setDoc(budget(owner), { transactions: "nope" }, { merge: true })));
await check("owner can't add a member directly", () => assertFails(updateDoc(budget(owner), { members: arrayUnion("stranger") })));
await check("owner can't delete budget doc", () => assertFails(deleteDoc(budget(owner))));

console.log("Outsiders");
await check("signed-out user can't read", () => assertFails(getDoc(budget(anon))));
await check("stranger can't read", () => assertFails(getDoc(budget(stranger))));
await check("stranger can't write content", () => assertFails(setDoc(budget(stranger), seed, { merge: true })));
await check("stranger can't create another's budget", () => assertFails(setDoc(budget(stranger, "someoneelse"), seed)));

console.log("Invites");
await check("owner creates invite", () =>
  assertSucceeds(setDoc(doc(owner, "invites", "ABCD2345"), { ownerUid: "owner", createdAt: serverTimestamp(), expiresAt: futureTs() })));
await check("can't create invite for someone else", () =>
  assertFails(setDoc(doc(stranger, "invites", "ZZZZ2345"), { ownerUid: "owner", createdAt: serverTimestamp(), expiresAt: futureTs() })));
await check("can't create invite lasting > 7 days", () =>
  assertFails(setDoc(doc(owner, "invites", "LONG2345"), { ownerUid: "owner", createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + 30 * 86400e3) })));
await check("can't create invite with extra fields", () =>
  assertFails(setDoc(doc(owner, "invites", "XTRA2345"), { ownerUid: "owner", createdAt: serverTimestamp(), expiresAt: futureTs(), role: "admin" })));
await check("can't list invites", () => assertFails(getDocs(collection(stranger, "invites"))));
await check("signed-out can't read invite", () => assertFails(getDoc(doc(anon, "invites", "ABCD2345"))));
await check("signed-in can read invite by code", () => assertSucceeds(getDoc(doc(partner, "invites", "ABCD2345"))));
await check("can't update invite", () => assertFails(updateDoc(doc(owner, "invites", "ABCD2345"), { ownerUid: "owner" })));

console.log("Joining");
const join = (db, uid, code, extra = {}) =>
  updateDoc(budget(db), { members: arrayUnion(uid), [`memberNames.${uid}`]: "Pat", joinCode: code, ...extra });
await check("owner can't join own budget", () => assertFails(join(owner, "owner", "ABCD2345")));
await check("join with wrong code fails", () => assertFails(join(partner, "partner", "WRNG2345")));
await check("join that also edits content fails", () => assertFails(join(partner, "partner", "ABCD2345", { transactions: [] , categories: [] })));
await check("join adding someone else fails", () =>
  assertFails(updateDoc(budget(partner), { members: arrayUnion("partner", "stranger"), "memberNames.partner": "Pat", joinCode: "ABCD2345" })));
await check("partner joins with valid code", () => assertSucceeds(join(partner, "partner", "ABCD2345")));
await check("partner deletes used invite", () => assertSucceeds(deleteDoc(doc(partner, "invites", "ABCD2345"))));
await check("stranger can't join with the used code", () => assertFails(join(stranger, "stranger", "ABCD2345")));
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "invites", "OLDD2345"), { ownerUid: "owner", createdAt: Timestamp.now(), expiresAt: Timestamp.fromMillis(Date.now() - 1000) });
});
await check("stranger can't join with an expired code", () => assertFails(join(stranger, "stranger", "OLDD2345")));
await check("stranger can't delete someone else's invite", () => assertFails(deleteDoc(doc(stranger, "invites", "OLDD2345"))));

console.log("Member access");
await check("partner reads shared budget", () => assertSucceeds(getDoc(budget(partner))));
await check("partner edits content", () => assertSucceeds(setDoc(budget(partner), { ...seed, transactions: [{ id: "t", amount: 5 }] }, { merge: true })));
await check("partner can't change ownerName", () => assertFails(updateDoc(budget(partner), { ownerName: "Me now" })));
await check("partner can't add a member", () => assertFails(updateDoc(budget(partner), { members: arrayUnion("partner", "stranger") })));
await check("partner can't rename another member", () => assertFails(updateDoc(budget(partner), { "memberNames.owner": "x" })));
await check("partner can't delete budget", () => assertFails(deleteDoc(budget(partner))));
await check("partner can't read owner's sharing pointer", () => assertFails(getDoc(doc(partner, "users", "owner", "profile", "sharing"))));
await check("stranger still can't read", () => assertFails(getDoc(budget(stranger))));

console.log("Sharing pointer");
await check("partner writes own pointer", () => assertSucceeds(setDoc(doc(partner, "users", "partner", "profile", "sharing"), { budgetOwner: "owner" })));
await check("pointer with junk field fails", () => assertFails(setDoc(doc(partner, "users", "partner", "profile", "sharing"), { budgetOwner: "owner", admin: true })));
await check("can't write someone else's pointer", () => assertFails(setDoc(doc(stranger, "users", "partner", "profile", "sharing"), { budgetOwner: "stranger" })));
await check("unrelated paths denied", () => assertFails(setDoc(doc(owner, "users", "owner", "other", "x"), { a: 1 })));

console.log("Leaving / removing");
await env.withSecurityRulesDisabled(async (ctx) => {
  await updateDoc(budget(ctx.firestore()), { members: arrayUnion("third"), "memberNames.third": "Third" });
});
await check("partner can't remove another member", () =>
  assertFails(updateDoc(budget(partner), { members: arrayRemove("third"), "memberNames.third": deleteField() })));
await check("partner leaves", () =>
  assertSucceeds(updateDoc(budget(partner), { members: arrayRemove("partner"), "memberNames.partner": deleteField() })));
await check("partner can't read after leaving", () => assertFails(getDoc(budget(partner))));
await check("owner removes a member", () =>
  assertSucceeds(updateDoc(budget(owner), { members: arrayRemove("third"), "memberNames.third": deleteField() })));
const third = env.authenticatedContext("third").firestore();
await check("removed member can't read", () => assertFails(getDoc(budget(third))));

console.log(`\n${pass} passed, ${fail} failed`);
await env.cleanup();
process.exit(fail ? 1 : 0);
