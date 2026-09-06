/* =============================================================================
   Vaidyagan Admin Console — single data interface (Demo ⇄ Firestore)
   -----------------------------------------------------------------------------
   This is the ONE interface the console imports. Every function checks the
   current mode and delegates to either the localStorage demo layer (./db.ts +
   lib) or the Firestore twin (./firebase-db.ts). In Live Mode writes are
   dual-written (demo AND Firestore) so the Doctor Studio and the Console never
   disagree while you transition. Switching Demo → Live changes nothing visual;
   every call is try/catch-guarded and falls back gracefully.
   ========================================================================== */

import * as fb from "./firebase-db";
import {
  getConsoleMode, hasFirebaseConfig, SITE_KEYS, readJson, writeJson,
  listCustomersWithStats, updateCustomerFlags,
  type Discount, type ConsoleSettings, type ConsoleNotification, type PageView, type CustomerRecord,
} from "./db";
import {
  ARTICLES, PRODUCTS,
  type Article, type Herb, type Order, type OrderStatus, type Product,
} from "../data";
import { auth, type StudioUser } from "../lib";

/* ---------------------------------- mode ------------------------------------ */

export function isLive(): boolean {
  try { return hasFirebaseConfig() && getConsoleMode() === "live"; } catch { return false; }
}

/* ================================== staff =================================== */

export interface StaffRecord {
  id: string; name: string; role: "superadmin" | "doctor";
  username: string; specialty?: string; hue: string; active: boolean;
  consoleAccess: boolean; consoleRole: "editor" | "viewer"; createdAt: string;
}

function fromStudio(u: StudioUser): StaffRecord {
  return {
    id: u.id, name: u.name, role: u.role, username: u.username, specialty: u.specialty,
    hue: u.hue, active: u.active, consoleAccess: u.consoleAccess,
    consoleRole: u.consoleRole === "superadmin" ? "editor" : u.consoleRole,
    createdAt: u.createdAt,
  };
}

export async function loadStaff(): Promise<StaffRecord[]> {
  if (isLive()) {
    try {
      const live = await fb.listStaff();
      if (live.length > 0) return live;
    } catch { /* fall through to demo */ }
  }
  return auth.list().map(fromStudio);
}

export async function saveStaffRole(id: string, role: "editor" | "viewer"): Promise<void> {
  auth.setPerms(id, { consoleRole: role });
  if (isLive()) { try { await fb.saveStaff(id, { consoleRole: role }); } catch { /* demo saved */ } }
}

export async function saveStaffAccess(id: string, access: boolean): Promise<void> {
  auth.setPerms(id, { consoleAccess: access });
  if (isLive()) { try { await fb.saveStaff(id, { consoleAccess: access }); } catch { /* demo saved */ } }
}

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
    } catch { /* demo saved */ }
  }
  return fromStudio(res.user);
}

export async function seedFounder(): Promise<boolean> {
  return fb.seedFounder();
}

/* ================================= activity ================================= */

export interface ActivityRecord {
  id: string; actor: string; kind: string; action: string; target?: string; at: string;
}

export async function loadActivity(): Promise<ActivityRecord[]> {
  if (isLive()) {
    try {
      const live = await fb.listActivity();
      if (live.length > 0) return live;
    } catch { /* fall through */ }
  }
  try {
    const raw = localStorage.getItem(SITE_KEYS.activity);
    if (!raw) return [];
    const list = JSON.parse(raw) as ActivityRecord[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function logActivityLive(actor: string, kind: string, action: string, target?: string): Promise<void> {
  if (isLive()) { try { await fb.logActivity(actor, kind, action, target); } catch { /* demo records via lib */ } }
}

/* ================================== orders ================================== */

function demoOrders(): Order[] {
  return readJson<Order[]>(SITE_KEYS.orders, []);
}

export async function loadOrders(): Promise<Order[]> {
  if (isLive()) {
    try {
      const live = await fb.listOrders();
      if (live.length > 0) return live as unknown as Order[];
    } catch { /* fall through */ }
  }
  return demoOrders();
}

/** Dual-write an order change (status) — demo stays authoritative for the site. */
export async function saveOrderF(id: string, patch: Partial<Order>): Promise<void> {
  const list = demoOrders();
  const next = list.map((o) => (o.id === id ? { ...o, ...patch } : o));
  writeJson(SITE_KEYS.orders, next);
  if (isLive()) { try { await fb.saveOrder(id, { ...patch }); } catch { /* demo saved */ } }
}

export async function cancelOrderRestockF(id: string): Promise<void> {
  const order = demoOrders().find((o) => o.id === id);
  if (!order) return;
  const products = readJson<Product[]>(SITE_KEYS.products, PRODUCTS);
  const restocked = products.map((p) => {
    const line = order.items.find((i) => i.productId === p.id);
    return line ? { ...p, stock: p.stock + line.qty } : p;
  });
  writeJson(SITE_KEYS.products, restocked);
  await saveOrderF(id, { status: "cancelled" as OrderStatus });
}

/* ================================= products ================================= */

function demoProducts(): Product[] {
  return readJson<Product[]>(SITE_KEYS.products, PRODUCTS);
}

export async function loadProducts(): Promise<Product[]> {
  if (isLive()) {
    try {
      const live = await fb.listProducts();
      if (live.length > 0) return live as unknown as Product[];
    } catch { /* fall through */ }
  }
  return demoProducts();
}

export async function saveProductF(p: Product): Promise<void> {
  const list = demoProducts();
  const next = list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p];
  writeJson(SITE_KEYS.products, next);
  if (isLive()) { try { await fb.saveProduct(p.id, { ...p }); } catch { /* demo saved */ } }
}

export async function deleteProductF(id: string): Promise<void> {
  writeJson(SITE_KEYS.products, demoProducts().filter((x) => x.id !== id));
  if (isLive()) { try { await fb.deleteProduct(id); } catch { /* demo saved */ } }
}

/* ================================= customers ================================ */

export type CustomerRow = CustomerRecord;

export async function loadCustomers(): Promise<CustomerRow[]> {
  const base = listCustomersWithStats();
  if (isLive()) {
    try {
      const live = await fb.listCustomers();
      if (live.length > 0) {
        /* merge: live flags win, demo-computed order stats stay */
        return base.map((c) => {
          const l = live.find((x) => (x as { id?: string }).id === c.id) as (CustomerRow & Record<string, unknown>) | undefined;
          return l ? { ...c, suspended: Boolean(l.suspended), notes: typeof l.notes === "string" ? l.notes : c.notes } : c;
        });
      }
    } catch { /* fall through */ }
  }
  return base;
}

export async function saveCustomerFlagsF(id: string, patch: { suspended?: boolean; notes?: string }): Promise<void> {
  updateCustomerFlags(id, patch);
  if (isLive()) { try { await fb.saveCustomer(id, { ...patch }); } catch { /* demo saved */ } }
}

/* =================================== posts ================================== */

function demoDeskPosts(): Article[] {
  return readJson<Article[]>(SITE_KEYS.posts, []);
}

/** All articles: desk posts (any status) merged over the seed library. */
export async function loadPosts(): Promise<Article[]> {
  const desk = demoDeskPosts();
  const ids = new Set(desk.map((p) => p.id));
  const merged = [...desk];
  for (const a of ARTICLES) if (!ids.has(a.id)) merged.push(a);
  if (isLive()) {
    try {
      const live = await fb.listPosts();
      if (live.length > 0) {
        const seen = new Set(merged.map((m) => m.id));
        for (const l of live as unknown as Article[]) if (!seen.has(l.id)) merged.push(l);
      }
    } catch { /* fall through */ }
  }
  return merged;
}

export async function savePostF(a: Article): Promise<void> {
  const list = demoDeskPosts();
  const next = list.some((x) => x.id === a.id) ? list.map((x) => (x.id === a.id ? a : x)) : [a, ...list];
  writeJson(SITE_KEYS.posts, next);
  if (isLive()) { try { await fb.savePost(a.id, { ...a }); } catch { /* demo saved */ } }
}

export async function deletePostF(id: string): Promise<void> {
  /* classics become a draft tombstone so the public reader 404s gracefully */
  const src = ARTICLES.find((a) => a.id === id);
  if (src) {
    const tomb: Article = { ...src, status: "draft" };
    const list = demoDeskPosts();
    const next = list.some((x) => x.id === id) ? list.map((x) => (x.id === id ? tomb : x)) : [tomb, ...list];
    writeJson(SITE_KEYS.posts, next);
  } else {
    writeJson(SITE_KEYS.posts, demoDeskPosts().filter((x) => x.id !== id));
  }
  if (isLive()) { try { await fb.deletePost(id); } catch { /* demo saved */ } }
}

/* =================================== herbs ================================== */

export async function loadHerbsF(): Promise<Herb[]> {
  const demo = readJson<Herb[]>(SITE_KEYS.herbs, []);
  if (isLive()) {
    try {
      const live = await fb.listHerbs();
      if (live.length > 0) return live as unknown as Herb[];
    } catch { /* fall through */ }
  }
  return demo;
}
export async function saveHerbF(h: Herb): Promise<void> {
  if (isLive()) { try { await fb.saveHerb(h.id, { ...h }); } catch { /* demo owns herbs in the lib */ } }
}
export async function deleteHerbF(id: string): Promise<void> {
  if (isLive()) { try { await fb.deleteHerb(id); } catch { /* demo owns herbs in the lib */ } }
}

/* ================================= discounts ================================ */

export async function loadDiscountsF(): Promise<Discount[]> {
  const demo = readJson<Discount[]>("vaidyagan_discounts_v1", []);
  if (isLive()) {
    try {
      const live = await fb.listDiscounts();
      if (live.length > 0) return live;
    } catch { /* fall through */ }
  }
  return demo;
}
export async function saveDiscountF(d: Discount): Promise<void> {
  const list = readJson<Discount[]>("vaidyagan_discounts_v1", []);
  const next = list.some((x) => x.id === d.id) ? list.map((x) => (x.id === d.id ? d : x)) : [d, ...list];
  writeJson("vaidyagan_discounts_v1", next);
  if (isLive()) { try { await fb.saveDiscount(d); } catch { /* demo saved */ } }
}
export async function deleteDiscountF(id: string): Promise<void> {
  writeJson("vaidyagan_discounts_v1", readJson<Discount[]>("vaidyagan_discounts_v1", []).filter((x) => x.id !== id));
  if (isLive()) { try { await fb.deleteDiscount(id); } catch { /* demo saved */ } }
}

/* ================================ notifications ============================== */

export async function listNotificationsF(): Promise<ConsoleNotification[]> {
  const demo = readJson<ConsoleNotification[]>("vaidyagan_notifications_v1", []);
  if (isLive()) {
    try {
      const live = await fb.listNotifications();
      if (live.length > 0) return live;
    } catch { /* fall through */ }
  }
  return demo;
}
export async function markAllReadF(): Promise<void> {
  writeJson("vaidyagan_notifications_v1", readJson<ConsoleNotification[]>("vaidyagan_notifications_v1", []).map((n) => ({ ...n, read: true })));
  if (isLive()) { try { await fb.markAllNotificationsRead(); } catch { /* demo saved */ } }
}
export async function pushNotificationF(n: Omit<ConsoleNotification, "id" | "read" | "at">): Promise<void> {
  const entry: ConsoleNotification = { ...n, id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, read: false, at: new Date().toISOString() };
  writeJson("vaidyagan_notifications_v1", [entry, ...readJson<ConsoleNotification[]>("vaidyagan_notifications_v1", [])].slice(0, 60));
  if (isLive()) { try { await fb.pushNotification(n); } catch { /* demo saved */ } }
}

/* ================================= analytics ================================ */

export async function loadPageViewsF(): Promise<PageView[]> {
  const demo = readJson<PageView[]>("vaidyagan_pageviews_v1", []);
  if (isLive()) {
    try {
      const live = await fb.listPageViews();
      if (live.length > 0) return [...demo, ...live];
    } catch { /* fall through */ }
  }
  return demo;
}

/* ================================== settings ================================ */

export async function loadSettingsF(): Promise<ConsoleSettings> {
  const demo = readJson<Partial<ConsoleSettings>>("vaidyagan_console_settings_v1", {});
  let merged: ConsoleSettings = {
    paymentUPI: true, paymentCard: true, paymentCOD: true,
    freeShipAt: 999, shipFee: 49,
    invoiceFooter: "Thank you for trusting classical Ayurveda. This is a computer-generated invoice — no signature required.",
    contactEmail: "vaidyagan@gmail.com",
    moderateReviews: false,
    ...demo,
  };
  if (isLive()) {
    try {
      const live = await fb.getSettings();
      if (live) merged = { ...merged, ...live };
    } catch { /* fall through */ }
  }
  return merged;
}
export async function saveSettingsF(patch: Partial<ConsoleSettings>): Promise<void> {
  writeJson("vaidyagan_console_settings_v1", { ...readJson<ConsoleSettings>("vaidyagan_console_settings_v1", {} as ConsoleSettings), ...patch });
  if (isLive()) { try { await fb.saveSettings(patch); } catch { /* demo saved */ } }
}

export async function setMaintenanceF(on: boolean): Promise<void> {
  try {
    if (on) localStorage.setItem("vaidyagan_maintenance_v1", "1");
    else localStorage.removeItem("vaidyagan_maintenance_v1");
    window.dispatchEvent(new Event("storage"));
  } catch { /* ignore */ }
  if (isLive()) { try { await fb.setMaintenance(on); } catch { /* demo saved */ } }
}

export async function loadHiddenReviewsF(): Promise<string[]> {
  const demo = readJson<string[]>("vaidyagan_hidden_reviews_v1", []);
  if (isLive()) {
    try {
      const live = await fb.listHiddenReviews();
      if (live.length > 0) return live;
    } catch { /* fall through */ }
  }
  return demo;
}
export async function toggleHiddenReviewF(stableId: string): Promise<void> {
  const list = readJson<string[]>("vaidyagan_hidden_reviews_v1", []);
  writeJson("vaidyagan_hidden_reviews_v1", list.includes(stableId) ? list.filter((x) => x !== stableId) : [...list, stableId]);
  if (isLive()) { try { await fb.toggleHiddenReview(stableId); } catch { /* demo saved */ } }
}

/* ================================ global search ============================== */

export interface SearchIndex {
  orders: { id: string; name: string; sub: string }[];
  products: { id: string; name: string; sub: string }[];
  customers: { id: string; name: string; sub: string }[];
  posts: { id: string; name: string; sub: string }[];
}

export async function loadSearchIndex(): Promise<SearchIndex> {
  const [orders, products, customers, posts] = await Promise.all([
    loadOrders(), loadProducts(), loadCustomers(), loadPosts(),
  ]);
  return {
    orders: orders.map((o) => ({ id: o.id, name: o.id, sub: `${o.customer?.name ?? "customer"} · ₹${(o.total ?? 0).toLocaleString("en-IN")}` })),
    products: products.map((p) => ({ id: p.id, name: p.name, sub: `₹${p.price} · ${p.stock} in stock` })),
    customers: customers.map((c) => ({ id: c.id, name: c.name, sub: `${c.orders} orders · ₹${c.spent.toLocaleString("en-IN")}` })),
    posts: posts.map((a) => ({ id: a.id, name: a.title || "Untitled", sub: a.status })),
  };
}
