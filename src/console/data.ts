/* =============================================================================
   Vaidyagan Admin Console — single data interface (Demo ⇄ Firestore)
   -----------------------------------------------------------------------------
   This is the ONE interface the console imports. Every function checks the
   current mode and delegates to either the localStorage demo layer (./db.ts +
   lib auth) or the Firestore twin (./firebase-db.ts). In Live Mode writes are
   dual-written (demo AND Firestore) so the Doctor Studio and the Console never
   disagree while you transition. Switching Demo → Live changes nothing visual.
   ========================================================================== */

import * as fb from "./firebase-db";
import { getConsoleMode, hasFirebaseConfig } from "./db";
import { auth, type StudioUser } from "../lib";

/* ---------------------------------- mode ------------------------------------ */

export function isLive(): boolean {
  try { return hasFirebaseConfig() && getConsoleMode() === "live"; } catch { return false; }
}

/* --------------------------------- staff ------------------------------------ */

export interface StaffRecord {
  id: string; name: string; role: "superadmin" | "doctor";
  username: string; specialty?: string; hue: string; active: boolean;
  consoleAccess: boolean; consoleRole: "editor" | "viewer"; createdAt: string;
}

function fromStudio(u: StudioUser): StaffRecord {
  return {
    id: u.id, name: u.name, role: u.role, username: u.username, specialty: u.specialty,
    hue: u.hue, active: u.active, consoleAccess: u.consoleAccess, consoleRole: u.consoleRole,
    createdAt: u.createdAt,
  };
}

/** Load staff. Live Mode prefers Firestore, falling back to the demo list. */
export async function loadStaff(): Promise<StaffRecord[]> {
  if (isLive()) {
    try {
      const live = await fb.listStaff();
      if (live.length > 0) return live;
    } catch { /* fall through to demo */ }
  }
  return auth.list().map(fromStudio);
}

/** Change a member's console role (dual-written in Live Mode). */
export async function saveStaffRole(id: string, role: "editor" | "viewer"): Promise<void> {
  auth.setPerms(id, { consoleRole: role });
  if (isLive()) { try { await fb.saveStaff(id, { consoleRole: role }); } catch { /* demo already saved */ } }
}

/** Grant/revoke dashboard access (dual-written in Live Mode). */
export async function saveStaffAccess(id: string, access: boolean): Promise<void> {
  auth.setPerms(id, { consoleAccess: access });
  if (isLive()) { try { await fb.saveStaff(id, { consoleAccess: access }); } catch { /* demo already saved */ } }
}

/** Invite a new member (dual-written in Live Mode). Returns the created record or null. */
export async function inviteStaff(input: { name: string; username: string; password: string; role: "editor" | "viewer"; specialty: string }): Promise<StaffRecord | null> {
  const res = auth.addMember({
    name: input.name, username: input.username, password: input.password,
    role: "doctor", specialty: input.specialty, consoleAccess: true, consoleRole: input.role,
  });
  if (!res.ok || !res.user) return null;
  if (isLive()) {
    try {
      await fb.addStaff({
        id: res.user.id, name: res.user.name, role: "doctor", username: res.user.username,
        specialty: res.user.specialty, hue: res.user.hue, active: true,
        consoleAccess: true, consoleRole: input.role, createdAt: res.user.createdAt,
      });
    } catch { /* demo already saved */ }
  }
  return fromStudio(res.user);
}

/** Seed the founder superadmin document into Firestore (admin_users / root). */
export async function seedFounder(): Promise<boolean> {
  return fb.seedFounder();
}

/* --------------------------------- activity --------------------------------- */

export interface ActivityRecord {
  id: string; actor: string; kind: string; action: string; target?: string; at: string;
}

const ACTIVITY_KEY = "vaidyagan_activity_v1";

/** Load the audit trail. Live Mode prefers Firestore, falling back to the demo log. */
export async function loadActivity(): Promise<ActivityRecord[]> {
  if (isLive()) {
    try {
      const live = await fb.listActivity();
      if (live.length > 0) return live;
    } catch { /* fall through to demo */ }
  }
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as ActivityRecord[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Write an audit entry (dual-written in Live Mode). */
export async function logActivity(actor: string, kind: string, action: string, target?: string): Promise<void> {
  if (isLive()) { try { await fb.logActivity(actor, kind, action, target); } catch { /* demo still records via lib */ } }
}

/* =============================================================================
   Collections — orders, products, customers, posts, herbs, discounts,
   notifications, pageviews, settings, site flags.
   Every read: Live Mode merges Firestore over the demo copy.
   Every write: demo first (the public site reads it), then Firestore.
   ========================================================================== */

import {
  SITE_KEYS,
  type ConsoleSettings, type ConsoleNotification, type PageView, type Discount,
  listDiscounts as demoListDiscounts, saveDiscount as demoSaveDiscount, deleteDiscount as demoDeleteDiscount,
  listNotifications as demoListNotifications, markAllNotificationsRead as demoMarkAllRead,
  pushNotification as demoPushNotification, listPageViews as demoListPageViews,
  getConsoleSettings, saveConsoleSettings, isMaintenanceOn, setMaintenance,
  listHiddenReviews as demoListHiddenReviews, toggleHiddenReview as demoToggleHiddenReview,
  listCustomersWithStats, updateCustomerFlags,
} from "./db";
import {
  ARTICLES, HERBS, PRODUCTS,
  type Article, type Herb, type Order, type OrderStatus, type Product,
} from "../data";

function readKey<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const p = JSON.parse(raw) as T;
    return (Array.isArray(p) || (p !== null && typeof p === "object")) ? p : fallback;
  } catch { return fallback; }
}
function writeKey(key: string, v: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch { return false; }
}
function mergeById<T extends { id: string }>(base: T[], over: T[]): T[] {
  const map = new Map<string, T>();
  base.forEach((x) => map.set(x.id, x));
  over.forEach((x) => map.set(x.id, x));
  return Array.from(map.values());
}

/* ---------------------------------- orders ---------------------------------- */

export async function loadOrders(): Promise<Order[]> {
  const demo = readKey<Order[]>(SITE_KEYS.orders, []);
  if (!isLive()) return demo;
  try {
    const live = (await fb.listOrders()) as unknown as Order[];
    return mergeById(demo, live).sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  } catch { return demo; }
}

export async function advanceOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const list = readKey<Order[]>(SITE_KEYS.orders, []);
  writeKey(SITE_KEYS.orders, list.map((o) => (o.id === id ? { ...o, status } : o)));
  const target = list.find((o) => o.id === id);
  if (isLive() && target) { try { await fb.saveOrder(id, { ...target, status }); } catch { /* demo saved */ } }
}

/** Cancel an order and return its units to stock (both layers). */
export async function cancelOrderRestock(id: string): Promise<void> {
  const orders = readKey<Order[]>(SITE_KEYS.orders, []);
  const target = orders.find((o) => o.id === id);
  if (!target || target.status === "cancelled") return;
  writeKey(SITE_KEYS.orders, orders.map((o) => (o.id === id ? { ...o, status: "cancelled" as const } : o)));
  const products = readKey<Product[]>(SITE_KEYS.products, []);
  const base = products.length > 0 ? products : PRODUCTS;
  const restocked = base.map((p) => {
    const line = target.items.find((i) => i.productId === p.id);
    return line ? { ...p, stock: p.stock + line.qty } : p;
  });
  writeKey(SITE_KEYS.products, restocked);
  if (isLive()) {
    try {
      await fb.saveOrder(id, { ...target, status: "cancelled" });
      for (const p of restocked) {
        if (target.items.some((i) => i.productId === p.id)) await fb.saveProduct(p.id, p as unknown as Record<string, unknown>);
      }
    } catch { /* demo saved */ }
  }
}

/** Bulk: move new/processing orders to shipped. Returns how many moved. */
export async function bulkShipOrders(ids: string[]): Promise<number> {
  const orders = readKey<Order[]>(SITE_KEYS.orders, []);
  const targets = orders.filter((o) => ids.includes(o.id) && (o.status === "new" || o.status === "processing"));
  if (targets.length === 0) return 0;
  writeKey(SITE_KEYS.orders, orders.map((o) => (targets.some((t) => t.id === o.id) ? { ...o, status: "shipped" as const } : o)));
  if (isLive()) {
    try { for (const t of targets) await fb.saveOrder(t.id, { ...t, status: "shipped" }); } catch { /* demo saved */ }
  }
  return targets.length;
}

/* --------------------------------- products --------------------------------- */

export async function loadProducts(): Promise<Product[]> {
  const demo = readKey<Product[]>(SITE_KEYS.products, []);
  const withSeeds = demo.length > 0 ? demo : PRODUCTS;
  if (!isLive()) return withSeeds;
  try {
    const live = (await fb.listProducts()) as unknown as Product[];
    return mergeById(withSeeds, live);
  } catch { return withSeeds; }
}

export async function saveProductF(p: Product): Promise<void> {
  const list = readKey<Product[]>(SITE_KEYS.products, []);
  const base = list.length > 0 ? list : PRODUCTS;
  writeKey(SITE_KEYS.products, base.some((x) => x.id === p.id) ? base.map((x) => (x.id === p.id ? p : x)) : [...base, p]);
  if (isLive()) { try { await fb.saveProduct(p.id, p as unknown as Record<string, unknown>); } catch { /* demo saved */ } }
}

export async function deleteProductF(id: string): Promise<void> {
  const list = readKey<Product[]>(SITE_KEYS.products, []);
  const base = list.length > 0 ? list : PRODUCTS;
  writeKey(SITE_KEYS.products, base.filter((x) => x.id !== id));
  if (isLive()) { try { await fb.deleteProductDoc(id); } catch { /* demo saved */ } }
}

/* --------------------------------- customers -------------------------------- */

export interface CustomerRow {
  id: string; name: string; email: string; phone: string; provider: string;
  addresses: unknown[]; createdAt: string; suspended?: boolean; notes?: string;
  orders: number; spent: number; lastOrderAt?: string;
}

export async function loadCustomers(): Promise<CustomerRow[]> {
  const demo = listCustomersWithStats() as CustomerRow[];
  if (!isLive()) return demo;
  try {
    const live = (await fb.listCustomers()) as unknown as CustomerRow[];
    return mergeById(demo, live);
  } catch { return demo; }
}

export async function updateCustomerFlagsF(id: string, patch: { suspended?: boolean; notes?: string }): Promise<boolean> {
  const ok = updateCustomerFlags(id, patch);
  if (isLive()) { try { await fb.saveCustomer(id, patch as Record<string, unknown>); } catch { /* demo saved */ } }
  return ok;
}

/* ----------------------------------- posts ----------------------------------- */

export async function loadPosts(): Promise<Article[]> {
  const desk = readKey<Article[]>(SITE_KEYS.posts, []);
  let merged = mergeById(ARTICLES, desk);
  if (isLive()) {
    try {
      const live = (await fb.listPosts()) as unknown as Article[];
      merged = mergeById(merged, live);
    } catch { /* demo merge stands */ }
  }
  return merged.sort((a, b) => b.date.localeCompare(a.date));
}

/** Upsert an article (approve / reject / unpublish / edit all flow through here). */
export async function savePostF(a: Article): Promise<void> {
  const desk = readKey<Article[]>(SITE_KEYS.posts, []);
  writeKey(SITE_KEYS.posts, desk.some((x) => x.id === a.id) ? desk.map((x) => (x.id === a.id ? a : x)) : [a, ...desk]);
  if (isLive()) { try { await fb.savePost(a.id, a as unknown as Record<string, unknown>); } catch { /* demo saved */ } }
}

/** Delete an article. Seed classics become draft tombstones so links 404 softly. */
export async function deletePostF(id: string): Promise<void> {
  const seed = ARTICLES.find((a) => a.id === id);
  const desk = readKey<Article[]>(SITE_KEYS.posts, []);
  if (seed) {
    const tomb = { ...seed, status: "draft" as const };
    writeKey(SITE_KEYS.posts, desk.some((x) => x.id === id) ? desk.map((x) => (x.id === id ? tomb : x)) : [tomb, ...desk]);
  } else {
    writeKey(SITE_KEYS.posts, desk.filter((x) => x.id !== id));
  }
  if (isLive()) { try { await fb.deletePostDoc(id); } catch { /* demo saved */ } }
}

/* ----------------------------------- herbs ----------------------------------- */

export async function loadHerbsF(): Promise<Herb[]> {
  const demo = readKey<Herb[]>(SITE_KEYS.herbs, []);
  const withSeeds = demo.length > 0 ? demo : HERBS;
  if (!isLive()) return withSeeds;
  try {
    const live = (await fb.listHerbs()) as unknown as Herb[];
    return mergeById(withSeeds, live);
  } catch { return withSeeds; }
}

export async function saveHerbF(h: Herb): Promise<void> {
  const list = readKey<Herb[]>(SITE_KEYS.herbs, []);
  const base = list.length > 0 ? list : HERBS;
  writeKey(SITE_KEYS.herbs, base.some((x) => x.id === h.id) ? base.map((x) => (x.id === h.id ? h : x)) : [...base, h]);
  if (isLive()) { try { await fb.saveHerb(h.id, h as unknown as Record<string, unknown>); } catch { /* demo saved */ } }
}

export async function deleteHerbF(id: string): Promise<void> {
  const list = readKey<Herb[]>(SITE_KEYS.herbs, []);
  const base = list.length > 0 ? list : HERBS;
  writeKey(SITE_KEYS.herbs, base.filter((x) => x.id !== id));
  if (isLive()) { try { await fb.deleteHerbDoc(id); } catch { /* demo saved */ } }
}

export async function resetHerbsF(): Promise<void> {
  try { localStorage.removeItem(SITE_KEYS.herbs); } catch { /* ignore */ }
  /* Live keeps its own copy — resets apply to the demo twin. */
}

/* --------------------------------- discounts --------------------------------- */

export async function loadDiscountsF(): Promise<Discount[]> {
  const demo = demoListDiscounts();
  if (!isLive()) return demo;
  try {
    const live = await fb.listDiscounts();
    return mergeById(demo, live);
  } catch { return demo; }
}

export async function saveDiscountF(d: Discount): Promise<void> {
  demoSaveDiscount(d);
  if (isLive()) { try { await fb.saveDiscount(d); } catch { /* demo saved */ } }
}

export async function deleteDiscountF(id: string): Promise<void> {
  demoDeleteDiscount(id);
  if (isLive()) { try { await fb.deleteDiscount(id); } catch { /* demo saved */ } }
}

/* ------------------------------- notifications ------------------------------- */

export async function listNotificationsF(): Promise<ConsoleNotification[]> {
  const demo = demoListNotifications();
  if (!isLive()) return demo;
  try {
    const live = await fb.listNotifications();
    return live.length > 0 ? live : demo;
  } catch { return demo; }
}

export async function markAllReadF(): Promise<void> {
  demoMarkAllRead();
  if (isLive()) { try { await fb.markAllNotificationsRead(); } catch { /* demo saved */ } }
}

export async function pushNotificationF(n: Omit<ConsoleNotification, "id" | "read" | "at">): Promise<void> {
  demoPushNotification(n);
  if (isLive()) { try { await fb.pushNotification(n); } catch { /* demo saved */ } }
}

/* --------------------------------- pageviews --------------------------------- */

export async function loadPageViewsF(): Promise<PageView[]> {
  const demo = demoListPageViews();
  if (!isLive()) return demo;
  try {
    const live = await fb.listPageViews();
    return live.length > 0 ? live : demo;
  } catch { return demo; }
}

/* ---------------------------------- settings --------------------------------- */

export async function loadSettingsF(): Promise<ConsoleSettings> {
  const demo = getConsoleSettings();
  if (!isLive()) return demo;
  try {
    const live = await fb.getSettings();
    return live ? { ...demo, ...live } : demo;
  } catch { return demo; }
}

export async function saveSettingsF(patch: Partial<ConsoleSettings>): Promise<void> {
  saveConsoleSettings(patch);
  if (isLive()) { try { await fb.saveSettings(patch); } catch { /* demo saved */ } }
}

/* ------------------------------- hidden reviews ------------------------------ */

export async function listHiddenReviewsF(): Promise<string[]> {
  const demo = demoListHiddenReviews();
  if (!isLive()) return demo;
  try {
    const live = await fb.listHiddenReviews();
    return live.length > 0 ? live : demo;
  } catch { return demo; }
}

export async function toggleHiddenReviewF(stableId: string): Promise<void> {
  demoToggleHiddenReview(stableId);
  if (isLive()) { try { await fb.toggleHiddenReview(stableId); } catch { /* demo saved */ } }
}

/* --------------------------------- site flags -------------------------------- */

export interface SiteFlags { storeEnabled: boolean; profileTab: boolean; maintenance: boolean }

export async function loadSiteFlagsF(): Promise<SiteFlags> {
  let storeEnabled = true;
  let profileTab = true;
  try {
    const s = localStorage.getItem(SITE_KEYS.storeEnabled);
    if (s !== null) storeEnabled = s === "1";
    const p = localStorage.getItem(SITE_KEYS.profileTab);
    if (p !== null) profileTab = p === "1";
  } catch { /* defaults */ }
  const flags: SiteFlags = { storeEnabled, profileTab, maintenance: isMaintenanceOn() };
  if (isLive()) {
    try {
      const live = await fb.getSiteFlags();
      if (live) {
        if (typeof live.storeEnabled === "boolean") flags.storeEnabled = live.storeEnabled;
        if (typeof live.profileTab === "boolean") flags.profileTab = live.profileTab;
      }
      flags.maintenance = await fb.getMaintenance();
    } catch { /* demo flags stand */ }
  }
  return flags;
}

/** Persist master switches to both layers (public site reads the demo keys). */
export async function saveSiteFlagsF(patch: Partial<SiteFlags>): Promise<void> {
  try {
    if (typeof patch.storeEnabled === "boolean") localStorage.setItem(SITE_KEYS.storeEnabled, patch.storeEnabled ? "1" : "0");
    if (typeof patch.profileTab === "boolean") localStorage.setItem(SITE_KEYS.profileTab, patch.profileTab ? "1" : "0");
  } catch { /* ignore */ }
  if (typeof patch.maintenance === "boolean") setMaintenance(patch.maintenance);
  if (isLive()) {
    try {
      const livePatch: Record<string, unknown> = {};
      if (typeof patch.storeEnabled === "boolean") livePatch.storeEnabled = patch.storeEnabled;
      if (typeof patch.profileTab === "boolean") livePatch.profileTab = patch.profileTab;
      if (Object.keys(livePatch).length > 0) await fb.saveSiteFlags(livePatch);
      if (typeof patch.maintenance === "boolean") await fb.setMaintenance(patch.maintenance);
    } catch { /* demo saved */ }
  }
}

/* -------------------------------- search index ------------------------------- */

export interface SearchIndex { orders: Order[]; products: Product[]; posts: Article[]; customers: CustomerRow[] }

/** One round-trip for the header's global search (honours the active mode). */
export async function loadSearchIndex(): Promise<SearchIndex> {
  const [orders, products, posts, customers] = await Promise.all([
    loadOrders(), loadProducts(), loadPosts(), loadCustomers(),
  ]);
  return { orders, products, posts, customers };
}
