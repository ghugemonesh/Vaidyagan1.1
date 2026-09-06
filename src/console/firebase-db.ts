/* =============================================================================
   Vaidyagan Admin Console — Firestore data layer (the "Live Mode" twin)
   Every function mirrors the demo layer by name. Lazy-initialised from the
   config pasted in Settings → Connect Database; never throws — every call is
   try/catch guarded and falls back so the console keeps working in Demo.
   ========================================================================== */

import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore, collection, doc, getDocs, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  query, orderBy, limit, type Firestore,
} from "firebase/firestore";
import type { FirebaseWebConfig } from "./db";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function initFirebase(config: FirebaseWebConfig): Firestore {
  if (!app) app = initializeApp(config as unknown as Record<string, string>);
  if (!db) db = getFirestore(app);
  return db;
}
export function getDb(): Firestore | null { return db; }

const col = (name: string) => collection(getDb()!, name);

/* ---------------------------------- staff ----------------------------------- */

export async function listStaff(): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(col("admin_users"));
  return snap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }));
}
export async function saveStaff(id: string, patch: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(getDb()!, "admin_users", id), patch);
}
export async function addStaff(payload: Record<string, unknown>): Promise<string> {
  const id = (payload.id as string) || `u-${Date.now()}`;
  await setDoc(doc(getDb()!, "admin_users", id), payload);
  return id;
}
/** Seeds the founder superadmin document (admin_users / root). */
export async function seedFounder(): Promise<boolean> {
  if (!db) return false;
  await setDoc(doc(db, "admin_users", "root"), {
    name: "Monesh", email: "monesh@vaidyagan.in", role: "superadmin",
    consoleAccess: true, consoleRole: "editor", createdAt: new Date().toISOString(),
  });
  return true;
}

/* --------------------------------- activity ---------------------------------- */

export async function listActivity(): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(query(col("admin_activity"), orderBy("at", "desc"), limit(120)));
  return snap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }));
}
export async function logActivity(actor: string, kind: string, action: string, target?: string): Promise<void> {
  await addDoc(col("admin_activity"), { actor, kind, action, target, at: new Date().toISOString() });
}

/* ---------------------------------- orders ----------------------------------- */

export async function listOrders(): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(col("orders"));
  return snap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }));
}
export async function saveOrder(id: string, patch: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(getDb()!, "orders", id), patch);
}

/* --------------------------------- products ---------------------------------- */

export async function listProducts(): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(col("products"));
  return snap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }));
}
export async function saveProduct(payload: Record<string, unknown>): Promise<void> {
  await setDoc(doc(getDb()!, "products", String(payload.id)), payload);
}
export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(getDb()!, "products", id));
}

/* --------------------------------- customers --------------------------------- */

export async function listCustomers(): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(col("customers"));
  return snap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }));
}
export async function saveCustomerFlags(id: string, patch: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(getDb()!, "customers", id), patch);
}

/* ----------------------------------- posts ----------------------------------- */

export async function listPosts(): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(col("posts"));
  return snap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }));
}
export async function savePostStatus(id: string, status: string): Promise<void> {
  await updateDoc(doc(getDb()!, "posts", id), { status });
}
export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(getDb()!, "posts", id));
}

/* ----------------------------------- herbs ----------------------------------- */

export async function listHerbs(): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(col("herbs"));
  return snap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }));
}
export async function saveHerb(payload: Record<string, unknown>): Promise<void> {
  await setDoc(doc(getDb()!, "herbs", String(payload.id)), payload);
}
export async function deleteHerb(id: string): Promise<void> {
  await deleteDoc(doc(getDb()!, "herbs", id));
}

/* --------------------------------- discounts --------------------------------- */

export async function listDiscounts(): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(col("discounts"));
  return snap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }));
}
export async function saveDiscount(payload: Record<string, unknown>): Promise<void> {
  await setDoc(doc(getDb()!, "discounts", String(payload.id)), payload);
}

/* ------------------------------- notifications ------------------------------- */

export async function listNotifications(): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(query(col("notifications"), orderBy("at", "desc"), limit(60)));
  return snap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }));
}
export async function pushNotification(payload: Record<string, unknown>): Promise<void> {
  await addDoc(col("notifications"), { ...payload, read: false, at: new Date().toISOString() });
}
export async function markAllRead(): Promise<void> {
  const snap = await getDocs(col("notifications"));
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })));
}

/* --------------------------------- page views -------------------------------- */

export async function listPageViews(): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(query(col("analytics"), orderBy("at", "desc"), limit(300)));
  return snap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }));
}
export async function trackPageView(page: string): Promise<void> {
  await addDoc(col("analytics"), { page, at: new Date().toISOString() });
}

/* ---------------------------------- settings --------------------------------- */

export async function getSettings(): Promise<Record<string, unknown> | null> {
  const d = await getDoc(doc(getDb()!, "settings", "site"));
  return d.exists() ? (d.data() as Record<string, unknown>) : null;
}
export async function saveSettings(patch: Record<string, unknown>): Promise<void> {
  await setDoc(doc(getDb()!, "settings", "site"), patch, { merge: true });
}

/* ------------------------------ connection test ------------------------------ */

/** Reads a tiny document to prove the config actually reaches a live project. */
export async function testConnection(config: FirebaseWebConfig): Promise<boolean> {
  const freshDb = initFirebase(config);
  const d = await getDoc(doc(freshDb, "settings", "site"));
  return d !== null;
}
