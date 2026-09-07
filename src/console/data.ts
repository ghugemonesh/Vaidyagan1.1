/* =============================================================================
   Vaidyagan Admin Console — single data interface (Demo ⇄ Firestore)
   This is the ONE interface the console imports. Every function checks the
   current mode and delegates to the localStorage demo layer or the Firestore
   twin. In Live Mode writes are dual-written so the Doctor Studio and the
   Console never disagree while you transition. Switching Demo → Live changes
   nothing visual; every call is try/catch-guarded and falls back gracefully.
   ========================================================================== */

import * as fb from "./firebase-db";
import {
  getConsoleMode, hasFirebaseConfig, SITE_KEYS, readJson, writeJson,
  listCustomersWithStats, updateCustomerFlags,
  type Discount, type ConsoleSettings, type ConsoleNotification, type PageView, type CustomerRecord,
} from "./db";
import {
  ARTICLES, ORDER_META, PRODUCTS, SEED_ORDERS,
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
    consoleRole: u.consoleRole ?? "viewer",
    createdAt: u.createdAt,
  };
}

export async function loadStaff(): Promise<StaffRecord[]> {
  if (isLive()) {
    try {
      const live = await fb.listStaff();
      if (live.length > 0) return live as unknown as StaffRecord[];
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
  try { return await fb.seedFounder(); } catch { return false; }
}

/* ================================= activity ================================= */

export interface ActivityRecord { id: string; actor: string; kind: string; action: string; target?: string; at: string }

export async function loadActivity(): Promise<ActivityRecord[]> {
  if (isLive()) {
    try {
      const live = await fb.listActivity();
      if (live.length > 0) return live as unknown as ActivityRecord[];
    } catch { /* fall through */ }
  }
  try {
    const raw = localStorage.getItem(SITE_KEYS.activity);
    if (!raw) return [];
    const list = JSON.parse(raw) as ActivityRecord[];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

export async function logActivityLive(actor: string, kind: string, action: string, target?: string): Promise<void> {
  if (isLive()) { try { await fb.logActivity(actor, kind, action, target); } catch { /* demo records via lib */ } }
}

/* ================================== orders ================================== */

/** Self-healing loader: legacy/partial records are normalized instead of
 *  crashing the Orders page (unknown status → "new", missing customer → stub). */
function demoOrders(): Order[] {
  const raw = readJson<Order[]>(SITE_KEYS.orders, SEED_ORDERS);
  if (!Array.isArray(raw)) return SEED_ORDERS;
  return raw
    .filter((o) => o && typeof o === "object")
    .map((o) => ({
      ...o,
      id: o.id || `VG-${Math.floor(1000 + Math.random() * 9000)}`,
      status: (ORDER_META as Record<string, unknown>)[o.status as string] ? o.status : ("new" as OrderStatus),
      customer:
        o.customer && typeof o.customer.name === "string"
          ? { name: o.customer.name, phone: o.customer.phone ?? "", address: o.customer.address ?? "", city: o.customer.city ?? "", pin: o.customer.pin ?? "" }
          : { name: "Unknown customer", phone: "", address: "", city: "", pin: "" },
      items: Array.isArray(o.items) ? o.items : [],
      total: typeof o.total === "number" && Number.isFinite(o.total) ? o.total : 0,
      placedAt: typeof o.placedAt === "string" ? o.placedAt : new Date().toISOString(),
    }));
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
  const list = demoOrders().map((o) => (o.id === id ? { ...o, ...patch } : o));
  writeJson(SITE_KEYS.orders, list);
  if (isLive()) { try { await fb.saveOrder(id, patch as Record<string, unknown>); } catch { /* demo saved */ } }
}

export async function cancelOrderRestockF(id: string): Promise<void> {
  const list = demoOrders();
  const target = list.find((o) => o.id === id);
  if (target) {
    const prods = readJson<Product[]>(SITE_KEYS.products, PRODUCTS);
    writeJson(SITE_KEYS.products, prods.map((p) => {
      const line = target.items.find((i) => i.productId === p.id);
      return line ? { ...p, stock: p.stock + line.qty } : p;
    }));
  }
  await saveOrderF(id, { status: "cancelled" });
}

export async function bulkShipOrders(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => saveOrderF(id, { status: "shipped" as OrderStatus })));
}

/* ================================= products ================================= */

export async function loadProducts(): Promise<Product[]> {
  if (isLive()) {
    try {
      const live = await fb.listProducts();
      if (live.length > 0) return live as unknown as Product[];
    } catch { /* fall through */ }
  }
  return readJson<Product[]>(SITE_KEYS.products, PRODUCTS);
}
export async function saveProductF(p: Product): Promise<void> {
  const list = readJson<Product[]>(SITE_KEYS.products, PRODUCTS);
  writeJson(SITE_KEYS.products, list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p]);
  if (isLive()) { try { await fb.saveProduct(p as unknown as Record<string, unknown>); } catch { /* demo saved */ } }
}
export async function deleteProductF(id: string): Promise<void> {
  writeJson(SITE_KEYS.products, readJson<Product[]>(SITE_KEYS.products, PRODUCTS).filter((p) => p.id !== id));
  if (isLive()) { try { await fb.deleteProduct(id); } catch { /* demo saved */ } }
}

/* ================================= customers ================================ */

export async function loadCustomers(): Promise<CustomerRecord[]> {
  if (isLive()) {
    try {
      const live = await fb.listCustomers();
      if (live.length > 0) return live as unknown as CustomerRecord[];
    } catch { /* fall through */ }
  }
  return listCustomersWithStats();
}
export async function updateCustomerFlagsF(id: string, patch: { suspended?: boolean; notes?: string }): Promise<void> {
  updateCustomerFlags(id, patch);
  if (isLive()) { try { await fb.saveCustomerFlags(id, patch as Record<string, unknown>); } catch { /* demo saved */ } }
}

/* =================================== posts ================================== */

export async function loadPosts(): Promise<Article[]> {
  if (isLive()) {
    try {
      const live = await fb.listPosts();
      if (live.length > 0) return live as unknown as Article[];
    } catch { /* fall through */ }
  }
  const desk = readJson<Article[]>(SITE_KEYS.posts, []);
  const deleted = readJson<string[]>("vaidyagan_deleted_posts_v1", []);
  const ids = new Set(desk.map((p) => p.id));
  const out = [...desk];
  for (const a of ARTICLES) {
    if (deleted.includes(a.id) || ids.has(a.id)) continue;
    out.push(a);
  }
  return out;
}
export async function savePostStatusF(id: string, status: Article["status"]): Promise<void> {
  const desk = readJson<Article[]>(SITE_KEYS.posts, []);
  const src = desk.find((p) => p.id === id) ?? ARTICLES.find((a) => a.id === id);
  if (src) {
    const updated = { ...src, status };
    writeJson(SITE_KEYS.posts, desk.some((p) => p.id === id) ? desk.map((p) => (p.id === id ? updated : p)) : [updated, ...desk]);
  }
  if (isLive()) { try { await fb.savePostStatus(id, status); } catch { /* demo saved */ } }
}
export async function deletePostF(id: string): Promise<void> {
  const desk = readJson<Article[]>(SITE_KEYS.posts, []);
  writeJson(SITE_KEYS.posts, desk.filter((p) => p.id !== id));
  if (ARTICLES.some((a) => a.id === id)) {
    const deleted = readJson<string[]>("vaidyagan_deleted_posts_v1", []);
    if (!deleted.includes(id)) writeJson("vaidyagan_deleted_posts_v1", [...deleted, id]);
  }
  if (isLive()) { try { await fb.deletePost(id); } catch { /* demo saved */ } }
}

/* =================================== herbs ================================== */

export async function loadHerbsF(): Promise<Herb[]> {
  if (isLive()) {
    try {
      const live = await fb.listHerbs();
      if (live.length > 0) return live as unknown as Herb[];
    } catch { /* fall through */ }
  }
  return readJson<Herb[]>(SITE_KEYS.herbs, []);
}
export async function saveHerbF(h: Herb): Promise<void> {
  if (isLive()) { try { await fb.saveHerb(h as unknown as Record<string, unknown>); } catch { /* demo saved */ } }
}
export async function deleteHerbF(id: string): Promise<void> {
  if (isLive()) { try { await fb.deleteHerb(id); } catch { /* demo saved */ } }
}

/* ================================= discounts ================================ */

export async function loadDiscountsF(): Promise<Discount[]> {
  if (isLive()) {
    try {
      const live = await fb.listDiscounts();
      if (live.length > 0) return live as unknown as Discount[];
    } catch { /* fall through */ }
  }
  return readJson<Discount[]>("vaidyagan_discounts_v1", []);
}
export async function saveDiscountF(d: Discount): Promise<void> {
  if (isLive()) { try { await fb.saveDiscount(d as unknown as Record<string, unknown>); } catch { /* demo saved */ } }
}
export async function deleteDiscountF(id: string): Promise<void> {
  if (isLive()) { try { await fb.saveDiscount({ id, active: false, code: "", type: "percent", value: 0, minOrder: 0, expires: "", createdAt: "" }); } catch { /* ignore */ } }
}

/* ================================ notifications ============================== */

export async function listNotificationsF(): Promise<ConsoleNotification[]> {
  if (isLive()) {
    try {
      const live = await fb.listNotifications();
      if (live.length > 0) return live as unknown as ConsoleNotification[];
    } catch { /* fall through */ }
  }
  return readJson<ConsoleNotification[]>("vaidyagan_notifications_v1", []);
}
export async function pushNotificationF(n: { title: string; body: string; icon: string }): Promise<void> {
  if (isLive()) { try { await fb.pushNotification(n); } catch { /* demo notified */ } }
}
export async function markAllReadF(): Promise<void> {
  if (isLive()) { try { await fb.markAllRead(); } catch { /* demo marked */ } }
}

/* ================================= analytics ================================ */

export async function loadPageViewsF(): Promise<PageView[]> {
  if (isLive()) {
    try {
      const live = await fb.listPageViews();
      if (live.length > 0) return live as unknown as PageView[];
    } catch { /* fall through */ }
  }
  return readJson<PageView[]>("vaidyagan_pageviews_v1", []);
}

/* ================================ global search ============================== */

export interface SearchIndex {
  orders: { id: string; name: string; sub: string }[];
  products: { id: string; name: string; sub: string }[];
  customers: { id: string; name: string; sub: string }[];
  posts: { id: string; name: string; sub: string }[];
}

export async function loadSearchIndex(): Promise<SearchIndex> {
  const [orders, products, customers, posts] = await Promise.all([loadOrders(), loadProducts(), loadCustomers(), loadPosts()]);
  return {
    orders: orders.map((o) => ({ id: o.id, name: o.id, sub: `${o.customer?.name ?? ""} · ₹${o.total.toLocaleString("en-IN")}` })),
    products: products.map((p) => ({ id: p.id, name: p.name, sub: `₹${p.price.toLocaleString("en-IN")} · ${p.stock} in stock` })),
    customers: customers.map((c) => ({ id: c.id, name: c.name, sub: `${c.orders} orders · ₹${c.spent.toLocaleString("en-IN")}` })),
    posts: posts.map((p) => ({ id: p.id, name: p.title, sub: p.status })),
  };
}

/* re-export shared settings types for pages */
export type { Discount, ConsoleSettings, ConsoleNotification, PageView, CustomerRecord };
