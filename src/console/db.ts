/* =============================================================================
   Vaidyagan Admin Console — demo (localStorage) layer + shared helpers
   Every key is namespaced "vaidyagan_*" and shared with the public site, so
   console edits appear on the storefront instantly.
   ========================================================================== */

import type { Order, OrderCustomer, OrderStatus, Product } from "../data";

export const SITE_KEYS = {
  customers: "vaidyagan_customers_v1",
  orders: "vaidyagan_orders_v1",
  products: "vaidyagan_store_products_v1",
  posts: "vaidyagan_desk_posts_v1",
  herbs: "vaidyagan_herbs_v1",
  profiles: "vaidyagan_doctor_profiles_v1",
  users: "vaidyagan_studio_users_v1",
  activity: "vaidyagan_activity_v1",
  storeEnabled: "vaidyagan_store_enabled_v1",
  profileTab: "vaidyagan_profile_tab_v1",
};

const SETTINGS_KEY = "vaidyagan_console_settings_v1";
const DISCOUNTS_KEY = "vaidyagan_discounts_v1";
const NOTIFS_KEY = "vaidyagan_notifications_v1";
const PAGEVIEWS_KEY = "vaidyagan_pageviews_v1";
const HIDDEN_REVIEWS_KEY = "vaidyagan_hidden_reviews_v1";
const MAINT_KEY = "vaidyagan_maintenance_v1";
const FB_CONFIG_KEY = "vaidyagan_firebase_config";
const FB_MODE_KEY = "vaidyagan_console_mode_v1";

/* --------------------------------- helpers --------------------------------- */

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw) as T;
  } catch { /* fresh */ }
  return fallback;
}
export function writeJson(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

/* ------------------------------ firebase config ------------------------------ */

export interface FirebaseWebConfig {
  apiKey: string; authDomain: string; projectId: string;
  storageBucket: string; messagingSenderId: string; appId: string;
}
const EMPTY_CONFIG: FirebaseWebConfig = { apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" };

export function getFirebaseConfig(): FirebaseWebConfig {
  return readJson<FirebaseWebConfig>(FB_CONFIG_KEY, EMPTY_CONFIG);
}
export function saveFirebaseConfig(c: FirebaseWebConfig) { writeJson(FB_CONFIG_KEY, c); }
export function hasFirebaseConfig(): boolean {
  const c = getFirebaseConfig();
  return Boolean(c.apiKey && c.projectId && c.appId);
}
/** Plain-English validation shown before "Test connection". */
export function validateFirebaseConfig(c: FirebaseWebConfig): string | null {
  if (!c.apiKey.trim()) return "The API key is empty — copy it from Project settings → Your apps.";
  if (!c.projectId.trim()) return "Project ID is missing — it looks like your-project-name (no spaces).";
  if (!/^\S+$/.test(c.projectId.trim())) return "Project ID has no spaces — check you copied the whole value.";
  if (c.projectId && !/[a-z0-9-]/.test(c.projectId)) return "Project ID looks wrong — it should contain letters and numbers.";
  if (!c.appId.trim()) return "The App ID is missing — it's the long value ending in numbers.";
  if (!c.authDomain.trim()) return "Auth domain is missing — it looks like your-project.firebaseapp.com.";
  return null;
}

export function getConsoleMode(): "demo" | "live" {
  try { return localStorage.getItem(FB_MODE_KEY) === "live" && hasFirebaseConfig() ? "live" : "demo"; }
  catch { return "demo"; }
}
export function setConsoleMode(m: "demo" | "live") {
  try { localStorage.setItem(FB_MODE_KEY, m); } catch { /* ignore */ }
}

/* ---------------------------------- settings --------------------------------- */

export interface ConsoleSettings {
  paymentUPI: boolean; paymentCard: boolean; paymentCOD: boolean;
  freeShipAt: number; shippingFee: number; invoiceFooter: string; contactEmail: string;
  moderateReviews: boolean;
}
const DEFAULT_SETTINGS: ConsoleSettings = {
  paymentUPI: true, paymentCard: true, paymentCOD: true,
  freeShipAt: 999, shippingFee: 49,
  invoiceFooter: "Thank you for trusting classical Ayurveda.",
  contactEmail: "vaidyagan@gmail.com",
  moderateReviews: false,
};
export function getConsoleSettings(): ConsoleSettings {
  return { ...DEFAULT_SETTINGS, ...readJson<Partial<ConsoleSettings>>(SETTINGS_KEY, {}) };
}
export function saveConsoleSettings(patch: Partial<ConsoleSettings>) {
  writeJson(SETTINGS_KEY, { ...getConsoleSettings(), ...patch });
}

/* --------------------------------- discounts --------------------------------- */

export interface Discount {
  id: string; code: string; type: "percent" | "flat"; value: number;
  minOrder: number; expires: string; active: boolean; createdAt: string;
}
export function listDiscounts(): Discount[] { return readJson<Discount[]>(DISCOUNTS_KEY, []); }
export function saveDiscount(d: Discount) {
  const list = listDiscounts();
  writeJson(DISCOUNTS_KEY, list.some((x) => x.id === d.id) ? list.map((x) => (x.id === d.id ? d : x)) : [d, ...list]);
}
export function deleteDiscount(id: string) { writeJson(DISCOUNTS_KEY, listDiscounts().filter((x) => x.id !== id)); }

export function validateDiscount(code: string, subtotal: number): { ok: boolean; reason?: string; discount?: Discount; amount: number } {
  const found = listDiscounts().find((x) => x.code.toLowerCase() === code.trim().toLowerCase());
  if (!found) return { ok: false, reason: "That code isn't recognised.", amount: 0 };
  if (!found.active) return { ok: false, reason: "That code is currently switched off.", amount: 0 };
  if (found.expires && new Date(found.expires).getTime() < Date.now()) return { ok: false, reason: "That code has expired.", amount: 0 };
  if (subtotal < found.minOrder) return { ok: false, reason: `Needs a minimum order of ₹${found.minOrder.toLocaleString("en-IN")}.`, amount: 0 };
  const amount = found.type === "percent" ? Math.round((subtotal * found.value) / 100) : Math.min(found.value, subtotal);
  return { ok: true, discount: found, amount };
}

/* ------------------------------- notifications ------------------------------- */

export interface ConsoleNotification { id: string; title: string; body: string; icon: string; read: boolean; at: string }
export function listNotifications(): ConsoleNotification[] { return readJson<ConsoleNotification[]>(NOTIFS_KEY, []); }
export function pushNotification(n: { title: string; body: string; icon: string }) {
  const list = listNotifications();
  list.unshift({ id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...n, read: false, at: new Date().toISOString() });
  writeJson(NOTIFS_KEY, list.slice(0, 60));
}
export function markAllRead() { writeJson(NOTIFS_KEY, listNotifications().map((n) => ({ ...n, read: true }))); }

/* --------------------------------- page views -------------------------------- */

export interface PageView { id: string; page: string; at: string }
export function listPageViews(): PageView[] { return readJson<PageView[]>(PAGEVIEWS_KEY, []); }
export function trackPageView(page: string) {
  const list = listPageViews();
  list.unshift({ id: `pv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, page, at: new Date().toISOString() });
  writeJson(PAGEVIEWS_KEY, list.slice(0, 300));
}

/** Seeds believable analytics so the charts tell a story on day one. */
export function seedDemoAnalytics() {
  try {
    if (localStorage.getItem(PAGEVIEWS_KEY)) return;
    const pages = ["home", "journal", "store", "product", "quiz", "herbs", "article"];
    const out: PageView[] = [];
    for (let i = 0; i < 120; i++) {
      const day = Math.floor(Math.random() * 14);
      out.push({ id: `pv-seed-${i}`, page: pages[Math.floor(Math.random() * pages.length)], at: new Date(Date.now() - day * 86400e3 - Math.random() * 86400e3).toISOString() });
    }
    writeJson(PAGEVIEWS_KEY, out);
  } catch { /* ignore */ }
}

/* ------------------------------ review moderation ---------------------------- */

export function listHiddenReviews(): string[] { return readJson<string[]>(HIDDEN_REVIEWS_KEY, []); }
export function toggleHiddenReview(stableId: string) {
  const list = listHiddenReviews();
  writeJson(HIDDEN_REVIEWS_KEY, list.includes(stableId) ? list.filter((x) => x !== stableId) : [...list, stableId]);
}

/* ------------------------------ maintenance mode ------------------------------ */

export function isMaintenanceOn(): boolean {
  try { return localStorage.getItem(MAINT_KEY) === "1"; } catch { return false; }
}
export function setMaintenance(on: boolean) {
  try { localStorage.setItem(MAINT_KEY, on ? "1" : "0"); } catch { /* ignore */ }
}

/* --------------------------------- customers ---------------------------------- */

export interface CustomerRecord {
  id: string; name: string; email: string; phone: string; provider: string;
  joined: string; orders: number; spent: number; suspended?: boolean; notes?: string;
}
export function listCustomersWithStats(): CustomerRecord[] {
  const customers = readJson<{ id: string; name: string; email: string; phone: string; provider: string; createdAt: string; suspended?: boolean; notes?: string }[]>(SITE_KEYS.customers, []);
  const orders = readJson<Order[]>(SITE_KEYS.orders, []);
  return customers.map((c) => {
    const mine = orders.filter((o) => o.customerId === c.id && o.status !== "cancelled");
    return {
      id: c.id, name: c.name, email: c.email, phone: c.phone, provider: c.provider,
      joined: c.createdAt, orders: mine.length, spent: mine.reduce((s, o) => s + o.total, 0),
      suspended: c.suspended, notes: c.notes,
    };
  });
}
export function updateCustomerFlags(id: string, patch: { suspended?: boolean; notes?: string }): boolean {
  try {
    const list = readJson<Record<string, unknown>[]>(SITE_KEYS.customers, []);
    writeJson(SITE_KEYS.customers, list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    return true;
  } catch { return false; }
}

/* ------------------------------ doctor profiles ------------------------------- */

export function listDoctorProfiles(): { userId: string; fullName: string; verificationStatus: string }[] {
  try {
    const raw = localStorage.getItem(SITE_KEYS.profiles);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, { userId: string; fullName: string; verificationStatus: string }>;
    return Object.values(map ?? {});
  } catch { return []; }
}

/* ------------------------------ backup & restore ------------------------------ */

export function exportAllData(): string {
  const dump: Record<string, unknown> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("vaidyagan_")) continue;
      try { dump[key] = JSON.parse(localStorage.getItem(key) ?? "null"); } catch { dump[key] = localStorage.getItem(key); }
    }
  } catch { /* partial dump is fine */ }
  return JSON.stringify({ app: "vaidyagan", exportedAt: new Date().toISOString(), data: dump }, null, 2);
}

export function importAllData(json: string): { ok: boolean; error?: string; keys: number } {
  try {
    const parsed = JSON.parse(json) as { data?: Record<string, unknown> };
    const data = parsed && typeof parsed === "object" && parsed.data ? parsed.data : (parsed as Record<string, unknown>);
    if (!data || typeof data !== "object") return { ok: false, error: "That file doesn't look like a Vaidyagan backup.", keys: 0 };
    let keys = 0;
    Object.entries(data).forEach(([k, v]) => {
      if (!k.startsWith("vaidyagan_")) return;
      try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); keys++; } catch { /* skip */ }
    });
    if (keys === 0) return { ok: false, error: "No Vaidyagan data found inside that file.", keys: 0 };
    return { ok: true, keys };
  } catch { return { ok: false, error: "Couldn't read that file — is it valid JSON?", keys: 0 }; }
}

/** Removes generated data so the site re-seeds on next load. Keeps logins. */
export function resetDemoData() {
  try {
    [SITE_KEYS.customers, SITE_KEYS.orders, SITE_KEYS.products, SITE_KEYS.posts, SITE_KEYS.herbs,
     SITE_KEYS.profiles, SITE_KEYS.activity, SETTINGS_KEY, DISCOUNTS_KEY, NOTIFS_KEY, PAGEVIEWS_KEY,
     HIDDEN_REVIEWS_KEY, MAINT_KEY, "vaidyagan_deleted_posts_v1"].forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

/* ----------------------------------- files ------------------------------------ */

export function downloadFile(name: string, content: string, mime = "text/plain") {
  try {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch { /* ignore */ }
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /["\,\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

/* silence unused-type warnings for consumers that only need shapes */
export type { Order, OrderCustomer, OrderStatus, Product };
