/* =============================================================================
   Vaidyagan Admin Console — FIRESTORE data layer (async twin of ./db.ts)
   -----------------------------------------------------------------------------
   Every function mirrors its demo counterpart by name. Firebase is imported
   lazily and initialized ONLY from the config the superadmin pasted in
   Settings → Connect Database (stored at "vaidyagan_firebase_config_v1"). If
   there is no config, or any call fails, the function resolves with a safe
   fallback — the console never throws, never blanks, never logs red.
   ========================================================================== */

import type { Firestore } from "firebase/firestore";
import { getFirebaseConfig, hasFirebaseConfig, type Discount, type ConsoleSettings, type ConsoleNotification, type PageView } from "./db";

/* -------------------------------- connection -------------------------------- */

let dbPromise: Promise<Firestore | null> | null = null;

/** Lazy, memoized, safe. Returns null (never throws) when unconfigured. */
export function getDb(): Promise<Firestore | null> {
  if (!hasFirebaseConfig()) return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const { initializeApp, getApps } = await import("firebase/app");
        const { getFirestore } = await import("firebase/firestore");
        const cfg = getFirebaseConfig();
        const app = getApps().find((a) => a.name === "vaidyagan-console") ?? initializeApp({ ...cfg }, "vaidyagan-console");
        return getFirestore(app);
      } catch {
        return null;
      }
    })();
  }
  return dbPromise;
}

/** Forget the connection (used after the config is cleared or changed). */
export function resetDb() {
  dbPromise = null;
}

/* --------------------------------- generics --------------------------------- */

async function readCol<T extends Record<string, unknown>>(name: string): Promise<T[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const snap = await getDocs(collection(db, name));
    return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
  } catch {
    return [];
  }
}

async function writeDoc(name: string, id: string, payload: Record<string, unknown>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, name, id), payload, { merge: true });
    return true;
  } catch {
    return false;
  }
}

async function addDocSafe(name: string, payload: Record<string, unknown>): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const { addDoc, collection } = await import("firebase/firestore");
    const ref = await addDoc(collection(db, name), payload);
    return ref.id;
  } catch {
    return null;
  }
}

async function removeDoc(name: string, id: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const { deleteDoc, doc } = await import("firebase/firestore");
    await deleteDoc(doc(db, name, id));
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------ staff (admin_users) ------------------------- */

export interface StaffDoc {
  id: string; name: string; role: "superadmin" | "doctor";
  username: string; specialty?: string; hue: string; active: boolean;
  consoleAccess: boolean; consoleRole: "editor" | "viewer";
  createdAt: string;
}

export async function listStaff(): Promise<StaffDoc[]> {
  return readCol<StaffDoc & Record<string, unknown>>("admin_users") as Promise<StaffDoc[]>;
}
export async function saveStaff(id: string, patch: Record<string, unknown>): Promise<boolean> {
  return writeDoc("admin_users", id, patch);
}
export async function addStaff(s: Omit<StaffDoc, "id"> & { id?: string }): Promise<boolean> {
  if (s.id) return writeDoc("admin_users", s.id, { ...s });
  return (await addDocSafe("admin_users", { ...s })) !== null;
}

/** Seeds the founder document: admin_users / root → role "superadmin". */
export async function seedFounder(): Promise<boolean> {
  return writeDoc("admin_users", "root", {
    name: "Monesh", email: "monesh@vaidyagan.in", provider: "google",
    role: "superadmin", access: true, consoleAccess: true, consoleRole: "editor",
    hue: "#d6b45f", active: true, createdAt: new Date().toISOString(),
    seededBy: "vaidyagan-console",
  });
}

/* --------------------------------- activity --------------------------------- */

export interface ActivityDoc {
  id: string; actor: string; kind: string; action: string; target?: string; at: string;
}
export async function logActivity(actor: string, kind: string, action: string, target?: string): Promise<boolean> {
  return (await addDocSafe("admin_activity", { actor, kind, action, target: target ?? "", at: new Date().toISOString() })) !== null;
}
export async function listActivity(): Promise<ActivityDoc[]> {
  return readCol<ActivityDoc & Record<string, unknown>>("admin_activity") as Promise<ActivityDoc[]>;
}

/* -------------------------------- site mirrors ------------------------------- */

export async function listOrders(): Promise<Record<string, unknown>[]> { return readCol("orders"); }
export async function saveOrder(id: string, payload: Record<string, unknown>): Promise<boolean> { return writeDoc("orders", id, payload); }
export async function listProducts(): Promise<Record<string, unknown>[]> { return readCol("products"); }
export async function saveProduct(id: string, payload: Record<string, unknown>): Promise<boolean> { return writeDoc("products", id, payload); }
export async function deleteProduct(id: string): Promise<boolean> { return removeDoc("products", id); }
export async function listCustomers(): Promise<Record<string, unknown>[]> { return readCol("customers"); }
export async function saveCustomer(id: string, payload: Record<string, unknown>): Promise<boolean> { return writeDoc("customers", id, payload); }
export async function listPosts(): Promise<Record<string, unknown>[]> { return readCol("posts"); }
export async function savePost(id: string, payload: Record<string, unknown>): Promise<boolean> { return writeDoc("posts", id, payload); }
export async function deletePost(id: string): Promise<boolean> { return removeDoc("posts", id); }
export async function listHerbs(): Promise<Record<string, unknown>[]> { return readCol("herbs"); }
export async function saveHerb(id: string, payload: Record<string, unknown>): Promise<boolean> { return writeDoc("herbs", id, payload); }
export async function deleteHerb(id: string): Promise<boolean> { return removeDoc("herbs", id); }

/* --------------------------------- discounts -------------------------------- */

export async function listDiscounts(): Promise<Discount[]> {
  return readCol<Discount & Record<string, unknown>>("discounts") as Promise<Discount[]>;
}
export async function saveDiscount(d: Discount): Promise<boolean> {
  return writeDoc("discounts", d.id, { ...d });
}
export async function deleteDiscount(id: string): Promise<boolean> { return removeDoc("discounts", id); }

/* ------------------------------- notifications ------------------------------ */

export async function listNotifications(): Promise<ConsoleNotification[]> {
  return readCol<ConsoleNotification & Record<string, unknown>>("notifications") as Promise<ConsoleNotification[]>;
}
export async function pushNotification(n: Omit<ConsoleNotification, "id" | "read" | "at">): Promise<boolean> {
  return (await addDocSafe("notifications", { ...n, read: false, at: new Date().toISOString() })) !== null;
}
export async function markAllNotificationsRead(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const { collection, getDocs, doc, updateDoc } = await import("firebase/firestore");
    const snap = await getDocs(collection(db, "notifications"));
    await Promise.all(snap.docs.map((d) => updateDoc(doc(db, "notifications", d.id), { read: true }).catch(() => null)));
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------- analytics -------------------------------- */

export async function listPageViews(): Promise<PageView[]> {
  return readCol<PageView & Record<string, unknown>>("pageviews") as Promise<PageView[]>;
}
export async function trackPageView(page: string): Promise<boolean> {
  return (await addDocSafe("pageviews", { page, at: new Date().toISOString() })) !== null;
}

/* --------------------------------- settings --------------------------------- */

export async function getSettings(): Promise<ConsoleSettings | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, "settings", "console"));
    return snap.exists() ? (snap.data() as ConsoleSettings) : null;
  } catch {
    return null;
  }
}
export async function saveSettings(payload: Partial<ConsoleSettings>): Promise<boolean> {
  return writeDoc("settings", "console", { ...payload });
}

/* -------------------------------- maintenance ------------------------------- */

export async function getMaintenance(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, "settings", "flags"));
    return Boolean(snap.exists() && (snap.data() as { maintenance?: boolean }).maintenance);
  } catch {
    return false;
  }
}
export async function setMaintenance(on: boolean): Promise<boolean> {
  return writeDoc("settings", "flags", { maintenance: on });
}

/* ------------------------------ hidden reviews ------------------------------ */

export async function listHiddenReviews(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, "settings", "hiddenReviews"));
    const list = snap.exists() ? (snap.data() as { ids?: string[] }).ids : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
export async function toggleHiddenReview(stableId: string): Promise<boolean> {
  const current = await listHiddenReviews();
  const next = current.includes(stableId) ? current.filter((x) => x !== stableId) : [...current, stableId];
  return writeDoc("settings", "hiddenReviews", { ids: next });
}
