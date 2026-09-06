/* =============================================================================
   Vaidyagan Admin Console — data layer (demo twin of Firestore)
   -----------------------------------------------------------------------------
   Everything here persists in browser storage and shares keys with the public
   site, so the Console and the storefront never disagree. When you connect
   Firebase (Settings → Connect Database) the SAME console runs against
   Firestore via `firebase-db.ts` — nothing in the UI changes except the badge.
   Every read/write is wrapped in try/catch: the console must never crash.
   ========================================================================== */

/* ------------------------------ storage keys ------------------------------- */

export const FB_CONFIG_KEY = "vaidyagan_firebase_config_v1";
export const CONSOLE_MODE_KEY = "vaidyagan_console_mode_v1";
export const SETTINGS_KEY = "vaidyagan_console_settings_v1";
export const DISCOUNTS_KEY = "vaidyagan_discounts_v1";
export const NOTIFS_KEY = "vaidyagan_notifications_v1";
export const PAGEVIEWS_KEY = "vaidyagan_pageviews_v1";
export const MAINT_KEY = "vaidyagan_maintenance_v1";
export const HIDDEN_REVIEWS_KEY = "vaidyagan_hidden_reviews_v1";

/* keys owned by the public site (shared on purpose) */
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

/* --------------------------------- helpers --------------------------------- */

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------ firebase config ----------------------------- */

export interface FirebaseConfig {
  apiKey: string; authDomain: string; projectId: string;
  storageBucket: string; messagingSenderId: string; appId: string;
}
export const EMPTY_CONFIG: FirebaseConfig = {
  apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "",
};

export function getFirebaseConfig(): FirebaseConfig {
  return { ...EMPTY_CONFIG, ...readJson<Partial<FirebaseConfig>>(FB_CONFIG_KEY, {}) };
}
export function saveFirebaseConfig(cfg: FirebaseConfig) {
  writeJson(FB_CONFIG_KEY, cfg);
}
export function clearFirebaseConfig() {
  try { localStorage.removeItem(FB_CONFIG_KEY); } catch { /* ignore */ }
}
export function hasFirebaseConfig(): boolean {
  const c = getFirebaseConfig();
  return Boolean(c.apiKey && c.projectId && c.appId);
}

export type ConsoleMode = "demo" | "live";
export function getConsoleMode(): ConsoleMode {
  try {
    return localStorage.getItem(CONSOLE_MODE_KEY) === "live" ? "live" : "demo";
  } catch {
    return "demo";
  }
}
export function setConsoleMode(m: ConsoleMode) {
  try { localStorage.setItem(CONSOLE_MODE_KEY, m); } catch { /* ignore */ }
}

/* Plain-English validation, run BEFORE we touch Firebase. */
export function validateConfig(cfg: FirebaseConfig): string[] {
  const problems: string[] = [];
  if (!cfg.apiKey.trim()) problems.push("API key is empty — copy it from Project settings → Your apps.");
  else if (cfg.apiKey.length < 20) problems.push("API key looks too short — it's usually a long string starting with 'AIza'.");
  if (!cfg.projectId.trim()) problems.push("Project ID is empty.");
  else if (!/^[a-z][a-z0-9-]{4,29}$/i.test(cfg.projectId.trim()))
    problems.push(`Project ID "${cfg.projectId}" looks wrong — it's lowercase letters, numbers and dashes (e.g. "vaidyagan-admin"). No spaces, no ".firebaseapp.com".`);
  if (!cfg.appId.trim()) problems.push("App ID is empty — it's the long number:letter string in your web app's config.");
  if (!cfg.authDomain.trim()) problems.push("authDomain is empty — it looks like \"your-project.firebaseapp.com\".");
  if (!cfg.storageBucket.trim()) problems.push("storageBucket is empty — it looks like \"your-project.appspot.com\".");
  if (!cfg.messagingSenderId.trim()) problems.push("messagingSenderId is empty — it's a 10–12 digit number.");
  else if (!/^\d+$/.test(cfg.messagingSenderId.trim())) problems.push("messagingSenderId should be numbers only.");
  return problems;
}

/* ------------------------------ console settings ---------------------------- */

export interface ConsoleSettings {
  paymentUPI: boolean; paymentCard: boolean; paymentCOD: boolean;
  freeShipAt: number; shipFee: number;
  invoiceFooter: string;
  contactEmail: string;
  moderateReviews: boolean;
}
export const DEFAULT_SETTINGS: ConsoleSettings = {
  paymentUPI: true, paymentCard: true, paymentCOD: true,
  freeShipAt: 999, shipFee: 49,
  invoiceFooter: "Thank you for trusting classical Ayurveda. This is a computer-generated invoice — no signature required.",
  contactEmail: "vaidyagan@gmail.com",
  moderateReviews: false,
};

export function getConsoleSettings(): ConsoleSettings {
  return { ...DEFAULT_SETTINGS, ...readJson<Partial<ConsoleSettings>>(SETTINGS_KEY, {}) };
}
export function saveConsoleSettings(patch: Partial<ConsoleSettings>) {
  writeJson(SETTINGS_KEY, { ...getConsoleSettings(), ...patch });
}

/* ------------------------------ maintenance mode ---------------------------- */

export function isMaintenanceOn(): boolean {
  try { return localStorage.getItem(MAINT_KEY) === "1"; } catch { return false; }
}
export function setMaintenance(on: boolean) {
  try {
    if (on) localStorage.setItem(MAINT_KEY, "1");
    else localStorage.removeItem(MAINT_KEY);
    window.dispatchEvent(new Event("storage"));
  } catch { /* ignore */ }
}

/* --------------------------------- discounts -------------------------------- */

export interface Discount {
  id: string; code: string; type: "percent" | "flat"; value: number;
  minOrder: number; expires: string; active: boolean; createdAt: string;
}
export function listDiscounts(): Discount[] {
  return readJson<Discount[]>(DISCOUNTS_KEY, []);
}
export function saveDiscount(d: Discount) {
  const list = listDiscounts();
  const next = list.some((x) => x.id === d.id) ? list.map((x) => (x.id === d.id ? d : x)) : [d, ...list];
  writeJson(DISCOUNTS_KEY, next);
}
export function deleteDiscount(id: string) {
  writeJson(DISCOUNTS_KEY, listDiscounts().filter((x) => x.id !== id));
}

export type DiscountResult =
  | { ok: true; discount: Discount; amount: number }
  | { ok: false; reason: string };

export function validateDiscount(code: string, subtotal: number): DiscountResult {
  const clean = code.trim().toUpperCase();
  if (!clean) return { ok: false, reason: "Enter a code first." };
  const d = listDiscounts().find((x) => x.code.toUpperCase() === clean);
  if (!d) return { ok: false, reason: `"${clean}" isn't a valid code.` };
  if (!d.active) return { ok: false, reason: `"${d.code}" is switched off right now.` };
  if (d.expires && new Date(d.expires + "T23:59:59").getTime() < Date.now())
    return { ok: false, reason: `"${d.code}" expired on ${d.expires}.` };
  if (subtotal < d.minOrder)
    return { ok: false, reason: `"${d.code}" needs a minimum order of ₹${d.minOrder.toLocaleString("en-IN")}.` };
  const amount = d.type === "percent" ? Math.round((subtotal * d.value) / 100) : Math.min(d.value, subtotal);
  return { ok: true, discount: d, amount };
}

/* ------------------------------- notifications ------------------------------ */

export interface ConsoleNotification {
  id: string; title: string; body: string; read: boolean; at: string;
  icon?: "order" | "stock" | "review" | "member" | "system";
}
export function listNotifications(): ConsoleNotification[] {
  return readJson<ConsoleNotification[]>(NOTIFS_KEY, []);
}
export function pushNotification(n: Omit<ConsoleNotification, "id" | "read" | "at">) {
  const entry: ConsoleNotification = { ...n, id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, read: false, at: new Date().toISOString() };
  writeJson(NOTIFS_KEY, [entry, ...listNotifications()].slice(0, 60));
}
export function markAllNotificationsRead() {
  writeJson(NOTIFS_KEY, listNotifications().map((n) => ({ ...n, read: true })));
}
export function unreadNotificationCount(): number {
  return listNotifications().filter((n) => !n.read).length;
}

/* --------------------------------- analytics -------------------------------- */

export interface PageView { page: string; at: string }

export function trackPageView(page: string) {
  try {
    const list = readJson<PageView[]>(PAGEVIEWS_KEY, []);
    list.push({ page, at: new Date().toISOString() });
    writeJson(PAGEVIEWS_KEY, list.slice(-800));
  } catch { /* never let tracking break the site */ }
}
export function listPageViews(): PageView[] {
  return readJson<PageView[]>(PAGEVIEWS_KEY, []);
}
/** Plausible 14-day history so charts feel alive before real traffic exists. */
export function seedDemoAnalytics() {
  if (listPageViews().length > 0) return;
  const pages = ["home", "journal", "store", "quiz", "herbs"];
  const out: PageView[] = [];
  for (let d = 13; d >= 0; d--) {
    const day = new Date(Date.now() - d * 86400e3);
    pages.forEach((p, pi) => {
      const n = Math.max(2, Math.round((26 - pi * 4) * (0.6 + Math.random() * 0.8)));
      for (let i = 0; i < n; i++) {
        const at = new Date(day); at.setHours(8 + Math.floor(Math.random() * 13), Math.floor(Math.random() * 60), 0, 0);
        out.push({ page: p, at: at.toISOString() });
      }
    });
  }
  writeJson(PAGEVIEWS_KEY, out);
}

/* --------------------------------- customers -------------------------------- */

export interface CustomerRecord {
  id: string; name: string; email: string; phone: string;
  provider: string; addresses: unknown[]; createdAt: string;
  suspended?: boolean; notes?: string;
  orders: number; spent: number; lastOrderAt?: string;
}

export function listCustomersWithStats(): CustomerRecord[] {
  const customers = readJson<CustomerRecord[]>(SITE_KEYS.customers, []);
  const orders = readJson<{ customerId?: string; total: number; placedAt: string; status: string }[]>(SITE_KEYS.orders, []);
  return customers.map((c) => {
    const theirs = orders.filter((o) => o.customerId === c.id && o.status !== "cancelled");
    return {
      ...c,
      orders: theirs.length,
      spent: theirs.reduce((s, o) => s + (o.total || 0), 0),
      lastOrderAt: theirs[0]?.placedAt,
    };
  });
}
export function updateCustomerFlags(id: string, patch: { suspended?: boolean; notes?: string }): boolean {
  try {
    const list = readJson<(CustomerRecord & Record<string, unknown>)[]>(SITE_KEYS.customers, []);
    writeJson(SITE_KEYS.customers, list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------ doctor profiles ----------------------------- */

export function listDoctorProfiles(): { userId: string; fullName: string; verificationStatus: string }[] {
  try {
    const raw = localStorage.getItem(SITE_KEYS.profiles);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, { userId: string; fullName: string; verificationStatus: string }>;
    return Object.values(map ?? {});
  } catch {
    return [];
  }
}

/* ------------------------------ review moderation --------------------------- */

export function listHiddenReviews(): string[] {
  return readJson<string[]>(HIDDEN_REVIEWS_KEY, []);
}
export function toggleHiddenReview(stableId: string) {
  const list = listHiddenReviews();
  writeJson(HIDDEN_REVIEWS_KEY, list.includes(stableId) ? list.filter((x) => x !== stableId) : [...list, stableId]);
}

/* ------------------------------ backup & restore ---------------------------- */

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
  } catch {
    return { ok: false, error: "Couldn't read that file — is it valid JSON?", keys: 0 };
  }
}
/** Removes generated data so the site re-seeds on next load. Keeps logins. */
export function resetDemoData() {
  try {
    [SITE_KEYS.customers, SITE_KEYS.orders, SITE_KEYS.products, SITE_KEYS.posts, SITE_KEYS.herbs,
     SITE_KEYS.profiles, SITE_KEYS.activity, SETTINGS_KEY, DISCOUNTS_KEY, NOTIFS_KEY, PAGEVIEWS_KEY,
     HIDDEN_REVIEWS_KEY, MAINT_KEY].forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

/* ----------------------------------- files ---------------------------------- */

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
