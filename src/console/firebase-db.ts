/* =============================================================================
   Vaidyagan Admin Console — FIRESTORE data layer (async twin of ./db.ts)
   -----------------------------------------------------------------------------
   Every function here mirrors a function in ./db.ts by NAME, so the console can
   swap Demo → Live without changing a single screen. Reads/writes go to
   Firestore collections; every call is wrapped in try/catch and falls back
   gracefully, so a missing config or a network blip never crashes the console.

   Collections:
     admin_users      staff & roles          (doc "root" = founder superadmin)
     admin_activity   audit trail
     orders, products, customers, posts, herbs,
     discounts, notifications, pageviews, settings, maintenance, hidden_reviews

   The config is read ONLY from the pasted values stored under
   "vaidyagan_firebase_config_v1" (Settings → Connect Database). If it is absent
   this module returns empty/no-op results and the console stays in Demo Mode.
   ========================================================================== */

import type {
  ConsoleNotification, ConsoleSettings, Discount, FirebaseConfig, PageView,
} from "./db";
import { getFirebaseConfig, hasFirebaseConfig } from "./db";

type Firestore = import("firebase/firestore").Firestore;

/* ------------------------------ lazy connection ----------------------------- */

let dbPromise: Promise<Firestore | null> | null = null;

/** Returns a Firestore handle, or null when unconfigured/unreachable. Never throws. */
export function getDb(): Promise<Firestore | null> {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    try {
      if (!hasFirebaseConfig()) return null;
      const cfg: FirebaseConfig = getFirebaseConfig();
      const { getApps, initializeApp } = await import("firebase/app");
      const { getFirestore } = await import("firebase/firestore");
      const name = "vaidyagan-console";
      const app = getApps().find((a) => a.name === name) ?? initializeApp({ ...cfg }, name);
      return getFirestore(app);
    } catch {
      return null;
    }
  })();
  return dbPromise;
}

/* --------------------------------- helpers ---------------------------------- */

async function readCol<T>(name: string): Promise<T[]> {
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

async function writeDoc(name: string, id: string, data: Record<string, unknown>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, name, id), data, { merge: true });
    return true;
  } catch {
    return false;
  }
}

async function addDoc(name: string, data: Record<string, unknown>): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const { addDoc: fsAdd, collection } = await import("firebase/firestore");
    const ref = await fsAdd(collection(db, name), data);
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
  return readCol<StaffDoc>("admin_users");
}
export async function saveStaff(id: string, patch: Record<string, unknown>): Promise<boolean> {
  return writeDoc("admin_users", id, patch);
}
export async function addStaff(data: StaffDoc): Promise<boolean> {
  const { id, ...rest } = data;
  return writeDoc("admin_users", id, rest as unknown as Record<string, unknown>);
}

/** Creates the founder document once: admin_users / root / role=superadmin. */
export async function seedFounder(): Promise<boolean> {
  return writeDoc("admin_users", "root", {
    name: "Monesh", role: "superadmin", username: "monesh",
    specialty: "Founder · Vaidyagan", hue: "#d6b45f", active: true,
    consoleAccess: true, consoleRole: "editor",
    createdAt: new Date().toISOString(),
  });
}

/* ----------------------------- activity (audit trail) ----------------------- */

export interface ActivityDoc {
  id: string; actor: string; kind: string; action: string; target?: string; at: string;
}
export async function logActivity(actor: string, kind: string, action: string, target?: string): Promise<boolean> {
  const id = await addDoc("admin_activity", { actor, kind, action, target: target ?? "", at: new Date().toISOString() });
  return id !== null;
}
export async function listActivity(): Promise<ActivityDoc[]> {
  const list = await readCol<ActivityDoc>("admin_activity");
  return list.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "")).slice(0, 120);
}

/* ------------------------------- store collections -------------------------- */

export async function listOrders(): Promise<Record<string, unknown>[]> { return readCol("orders"); }
export async function listProducts(): Promise<Record<string, unknown>[]> { return readCol("products"); }
export async function listCustomers(): Promise<Record<string, unknown>[]> { return readCol("customers"); }
export async function listPosts(): Promise<Record<string, unknown>[]> { return readCol("posts"); }
export async function listHerbs(): Promise<Record<string, unknown>[]> { return readCol("herbs"); }
export async function saveProduct(id: string, data: Record<string, unknown>): Promise<boolean> { return writeDoc("products", id, data); }
export async function savePost(id: string, data: Record<string, unknown>): Promise<boolean> { return writeDoc("posts", id, data); }
export async function saveHerb(id: string, data: Record<string, unknown>): Promise<boolean> { return writeDoc("herbs", id, data); }

/* --------------------------------- discounts -------------------------------- */

export async function listDiscounts(): Promise<Discount[]> { return readCol<Discount>("discounts"); }
export async function saveDiscount(d: Discount): Promise<boolean> {
  const { id, ...rest } = d;
  return writeDoc("discounts", id, rest as unknown as Record<string, unknown>);
}
export async function deleteDiscount(id: string): Promise<boolean> { return removeDoc("discounts", id); }

/* ------------------------------- notifications ------------------------------ */

export async function listNotifications(): Promise<ConsoleNotification[]> {
  const list = await readCol<ConsoleNotification>("notifications");
  return list.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "")).slice(0, 60);
}
export async function pushNotification(n: Omit<ConsoleNotification, "id" | "read" | "at">): Promise<boolean> {
  const id = await addDoc("notifications", { ...n, read: false, at: new Date().toISOString() });
  return id !== null;
}
export async function markAllNotificationsRead(): Promise<boolean> {
  const list = await readCol<ConsoleNotification>("notifications");
  let ok = true;
  for (const n of list) if (!n.read) ok = (await writeDoc("notifications", n.id, { read: true })) && ok;
  return ok;
}

/* --------------------------------- analytics -------------------------------- */

export async function listPageViews(): Promise<PageView[]> { return readCol<PageView>("pageviews"); }
export async function trackPageView(page: string): Promise<boolean> {
  const id = await addDoc("pageviews", { page, at: new Date().toISOString() });
  return id !== null;
}

/* --------------------------------- settings --------------------------------- */

export async function getSettings(): Promise<ConsoleSettings | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, "settings", "store"));
    return snap.exists() ? (snap.data() as ConsoleSettings) : null;
  } catch {
    return null;
  }
}
export async function saveSettings(patch: Partial<ConsoleSettings>): Promise<boolean> {
  return writeDoc("settings", "store", patch as unknown as Record<string, unknown>);
}

/* ------------------------------ maintenance flag ----------------------------- */

export async function getMaintenance(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, "settings", "maintenance"));
    return snap.exists() ? Boolean((snap.data() as { on?: boolean }).on) : false;
  } catch {
    return false;
  }
}
export async function setMaintenance(on: boolean): Promise<boolean> {
  return writeDoc("settings", "maintenance", { on });
}

/* ------------------------------ hidden reviews ------------------------------ */

export async function listHiddenReviews(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, "settings", "hidden_reviews"));
    return snap.exists() ? ((snap.data() as { ids?: string[] }).ids ?? []) : [];
  } catch {
    return [];
  }
}
export async function toggleHiddenReview(stableId: string): Promise<boolean> {
  const current = await listHiddenReviews();
  const next = current.includes(stableId) ? current.filter((x) => x !== stableId) : [...current, stableId];
  return writeDoc("settings", "hidden_reviews", { ids: next });
}
