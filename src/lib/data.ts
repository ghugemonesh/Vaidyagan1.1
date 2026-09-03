/* =============================================================================
   Vaidyagan — demo data layer (the localStorage twin of Firestore)
   -----------------------------------------------------------------------------
   Every entity the Admin Console manages lives here. Reads/writes go to
   localStorage under namespaced keys, and a tiny pub/sub notifies React via
   useSyncExternalStore, so any mutation re-renders every open console page.
   The Firestore twin exposes the SAME function names (async) — see lib/firebase.
   ========================================================================== */

import { useSyncExternalStore } from "react";

/* ------------------------------ reactivity -------------------------------- */

let version = 0;
const listeners = new Set<() => void>();
function emit(): void {
  version += 1;
  listeners.forEach((l) => l());
}
export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function getVersion(): number {
  return version;
}
/** Re-render a component whenever any demo-store collection changes. */
export function useDb(): number {
  return useSyncExternalStore(subscribe, getVersion);
}

/* --------------------------------- helpers -------------------------------- */

const NS = "vaidyagan_";
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function persist(key: string, value: unknown): void {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    /* quota / unavailable — keep running in memory */
  }
}

const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number, hour = 11) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, (n * 17) % 60, 0, 0);
  return iso(d);
};
const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/* ---------------------------------- types --------------------------------- */

export type OrderStatus = "new" | "processing" | "shipped" | "out-for-delivery" | "delivered" | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  accent: string;
  qty: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  address: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sanskrit: string;
  category: string;
  price: number;
  mrp: number;
  stock: number;
  accent: string;
  dosage: string;
  ingredients: string[];
  description: string;
  highlights: string[];
  directions: string;
  safetyNotes: string;
  isVisible: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  provider: "otp" | "google" | "email";
  addresses: string[];
  ordersCount: number;
  totalSpent: number;
  joinedAt: string;
  suspended: boolean;
  notes: string;
}

export type StaffRole = "superadmin" | "editor" | "viewer";
export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  hasAccess: boolean;
  lastLogin: string;
  hue: string;
}

export type PostStatus = "published" | "in-review" | "draft" | "scheduled";
export interface Post {
  id: string;
  title: string;
  author: string;
  status: PostStatus;
  category: string;
  doshas: string[];
  updatedAt: string;
}

export interface Review {
  id: string;
  product: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  approved: boolean;
}

export interface Discount {
  id: string;
  code: string;
  type: "percent" | "flat";
  value: number;
  minOrder: number;
  expires: string; // "" = never
  active: boolean;
}

export interface Settings {
  enablePublicStore: boolean;
  showProfileTab: boolean;
  maintenanceMode: boolean;
  paymentUPI: boolean;
  paymentCard: boolean;
  paymentCOD: boolean;
  freeShippingThreshold: number;
  shippingFee: number;
  invoiceFooterText: string;
  contactEmail: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
}

export interface Notif {
  id: string;
  title: string;
  body: string;
  read: boolean;
  at: string;
  icon: "order" | "stock" | "review" | "member" | "system";
}

/* --------------------------------- seeds ---------------------------------- */

const P = (
  id: string, name: string, sanskrit: string, category: string, price: number, mrp: number,
  stock: number, accent: string, dosage: string, ingredients: string[], description: string,
  highlights: string[], directions: string, safetyNotes: string, isVisible = true
): Product => ({ id, name, sanskrit, category, price, mrp, stock, accent, dosage, ingredients, description, highlights, directions, safetyNotes, isVisible });

const SEED_PRODUCTS: Product[] = [
  P("prod_1", "Ashwagandha Root Capsules", "अश्वगन्धा", "Capsules", 699, 849, 42, "#c49c3e",
    "1 capsule (500mg) twice daily after meals", ["Withania somnifera root extract"],
    "A classical adaptogen that steadies the nervous system, supports restful sleep and rebuilds stamina without stimulation.",
    ["Lowers felt stress", "Improves sleep quality", "Supports strength & recovery"],
    "Take with warm milk or water after meals for 8–12 weeks.",
    "Avoid in pregnancy. Consult a physician if on thyroid or sedative medication."),
  P("prod_2", "Triphala Churna, Stone-milled", "त्रिफला", "Churnas", 449, 549, 61, "#5f7f62",
    "3–6g at bedtime with warm water", ["Amla", "Bibhitaki", "Haritaki"],
    "Three fruits in the exact Charaka ratio, stone-milled at low speed to preserve the volatile fractions. Gentle, non-habit-forming bowel regulation.",
    ["Gentle daily detox", "Supports digestion", "Rich in natural vitamin C"],
    "Stir into warm water at bedtime; or ½ tsp with honey before meals for agni.",
    "Not for use during pregnancy or with acute diarrhoea."),
  P("prod_3", "Brahmi Ghrita", "ब्राह्मी", "Ghritas", 1099, 1299, 3, "#93b1cf",
    "1 tsp (5g) in warm milk at night", ["A2 Gir cow ghee", "Bacopa monnieri", "Vacha", "Shankhapushpi"],
    "The classical medhya ghrita — fresh brahmi juice simmered into A2 ghee for memory, focus and a calm mind.",
    ["Enhances memory & focus", "Calms a racing mind", "Traditional medhya rasayana"],
    "Take 1 tsp in warm milk at night, or as directed by a vaidya.",
    "Use with care in high-Kapha conditions; consult a practitioner for children."),
  P("prod_4", "Mahanarayana Abhyanga Oil", "महानारायण", "Oils", 899, 1099, 24, "#e07f49",
    "Warm 10ml; massage 15 min before bath", ["Sesame taila", "60+ classical herbs", "Shatavari", "Dashamoola"],
    "The great vata-pacifying oil of the Sahasrayoga, slow-infused over a wood fire for joints, deep tissue and the tired nervous system.",
    ["Eases joint & muscle stiffness", "Deeply calming abhyanga", "Classic vata pacifier"],
    "Warm gently, massage into the body 15 minutes before a warm bath.",
    "External use only. Patch-test first; avoid on broken skin."),
  P("prod_5", "Immunity Kadha Concentrate", "काढ़ा", "Kadhas", 549, 649, 0, "#7fa07f",
    "10ml in 100ml hot water, morning & evening", ["Tulsi", "Sunthi", "Maricha", "Pippali", "Mulethi"],
    "The household defence decoction reduced to a sugar-free concentrate. Warming kapha-vata pacification for throat, chest and season changes.",
    ["Daily immune support", "Soothes throat & chest", "Warming & comforting"],
    "Dilute 10ml in hot water, morning and evening during seasonal change.",
    "Reduce in high-Pitta or acidity; not for children under 6."),
  P("prod_6", "Shatavari Kalpa Powder", "शतावरी", "Churnas", 649, 749, 33, "#d6b45f",
    "3–6g with warm milk, twice daily", ["Asparagus racemosus root", "Mishri"],
    "Milk-processed shatavari in the classical kalpa form — cooling, unctuous and the pitta-type's best friend through heat, acidity and dryness.",
    ["Cools & nourishes", "Supports hormonal balance", "Soothes acidity"],
    "Take with warm milk after meals; for acidity, before meals.",
    "Consult a practitioner if on diuretics or hormone therapy."),
];

const item = (p: Product, qty: number): OrderItem => ({
  productId: p.id, name: p.name, accent: p.accent, qty, price: p.price, total: p.price * qty,
});
const ship = (sub: number) => (sub >= 999 ? 0 : 49);
const O = (
  id: string, cust: [string, string, string], its: OrderItem[], status: OrderStatus,
  createdAt: string, paymentMethod: string, address: string, discount = 0
): Order => {
  const subtotal = its.reduce((s, i) => s + i.total, 0);
  const shipping = ship(subtotal);
  return {
    id, customerName: cust[0], customerEmail: cust[1], customerPhone: cust[2], items: its,
    subtotal, shipping, discount, total: Math.max(0, subtotal + shipping - discount),
    status, paymentMethod, address, createdAt,
  };
};

const SEED_ORDERS: Order[] = [
  O("VG-1042", ["Aarav Mehta", "aarav@gmail.com", "+91 98200 11223"], [item(SEED_PRODUCTS[0], 2), item(SEED_PRODUCTS[1], 1)], "new", daysAgo(0, 10), "UPI", "B-704, Palm Grove, Andheri W, Mumbai 400053"),
  O("VG-1041", ["Sanya Kulkarni", "sanya.k@gmail.com", "+91 98600 44556"], [item(SEED_PRODUCTS[3], 1)], "new", daysAgo(0, 9), "Card", "12, Model Colony, Pune 411016"),
  O("VG-1040", ["Rohan Iyer", "rohan.iyer@gmail.com", "+91 99400 77889"], [item(SEED_PRODUCTS[1], 2), item(SEED_PRODUCTS[4], 1)], "processing", daysAgo(1, 15), "UPI", "45, Besant Nagar, Chennai 600090"),
  O("VG-1039", ["Meera Nair", "meera.n@gmail.com", "+91 98950 12121"], [item(SEED_PRODUCTS[2], 1), item(SEED_PRODUCTS[5], 1)], "processing", daysAgo(2, 12), "COD", "TC 24/1854, Kowdiar, Thiruvananthapuram 695003"),
  O("VG-1038", ["Vikram Singh", "vikram.s@gmail.com", "+91 98110 90909"], [item(SEED_PRODUCTS[0], 1)], "shipped", daysAgo(4, 17), "UPI", "C-21, Defence Colony, New Delhi 110024"),
  O("VG-1037", ["Ananya Rao", "ananya.r@gmail.com", "+91 99000 31313"], [item(SEED_PRODUCTS[3], 1), item(SEED_PRODUCTS[1], 1)], "out-for-delivery", daysAgo(5, 10), "Card", "158, 9th Main, Jayanagar, Bengaluru 560011"),
  O("VG-1036", ["Kabir Shah", "kabir.shah@gmail.com", "+91 98250 51515"], [item(SEED_PRODUCTS[5], 2)], "delivered", daysAgo(6, 14), "UPI", "7, Gurukrupa Society, Ahmedabad 380006"),
  O("VG-1035", ["Ishita Bose", "ishita.b@gmail.com", "+91 98300 71717"], [item(SEED_PRODUCTS[0], 1), item(SEED_PRODUCTS[2], 1)], "delivered", daysAgo(7, 11), "Card", "22B, Ballygunge Place, Kolkata 700019"),
  O("VG-1034", ["Arjun Patel", "arjun.p@gmail.com", "+91 99250 91919"], [item(SEED_PRODUCTS[1], 3)], "delivered", daysAgo(9, 16), "UPI", "3, Vrundavan Society, Surat 395007"),
  O("VG-1033", ["Diya Sharma", "diya.s@gmail.com", "+91 98100 21212"], [item(SEED_PRODUCTS[4], 2), item(SEED_PRODUCTS[0], 1)], "delivered", daysAgo(11, 13), "COD", "H-56, Lajpat Nagar, New Delhi 110024"),
  O("VG-1032", ["Aditya Joshi", "aditya.j@gmail.com", "+91 98810 41414"], [item(SEED_PRODUCTS[3], 1)], "delivered", daysAgo(12, 10), "UPI", "9, Aundh Road, Pune 411007"),
  O("VG-1031", ["Nisha Reddy", "nisha.r@gmail.com", "+91 99850 61616"], [item(SEED_PRODUCTS[2], 1)], "cancelled", daysAgo(13, 12), "Card", "Plot 34, Jubilee Hills, Hyderabad 500033"),
];

const SEED_CUSTOMERS: Customer[] = [
  { id: "cust_1", name: "Aarav Mehta", email: "aarav@gmail.com", phone: "+91 98200 11223", provider: "google", addresses: ["B-704, Palm Grove, Andheri W, Mumbai 400053"], ordersCount: 4, totalSpent: 5240, joinedAt: daysAgo(60), suspended: false, notes: "" },
  { id: "cust_2", name: "Sanya Kulkarni", email: "sanya.k@gmail.com", phone: "+91 98600 44556", provider: "otp", addresses: ["12, Model Colony, Pune 411016"], ordersCount: 2, totalSpent: 1798, joinedAt: daysAgo(40), suspended: false, notes: "" },
  { id: "cust_3", name: "Rohan Iyer", email: "rohan.iyer@gmail.com", phone: "+91 99400 77889", provider: "email", addresses: ["45, Besant Nagar, Chennai 600090"], ordersCount: 3, totalSpent: 3145, joinedAt: daysAgo(90), suspended: false, notes: "" },
  { id: "cust_4", name: "Meera Nair", email: "meera.n@gmail.com", phone: "+91 98950 12121", provider: "google", addresses: ["TC 24/1854, Kowdiar, Thiruvananthapuram 695003"], ordersCount: 1, totalSpent: 1748, joinedAt: daysAgo(12), suspended: false, notes: "Prefers COD." },
  { id: "cust_5", name: "Vikram Singh", email: "vikram.s@gmail.com", phone: "+91 98110 90909", provider: "otp", addresses: ["C-21, Defence Colony, New Delhi 110024"], ordersCount: 1, totalSpent: 699, joinedAt: daysAgo(6), suspended: false, notes: "" },
];

const SEED_STAFF: StaffUser[] = [
  { id: "root", name: "Monesh", email: "monesh@vaidyagan.in", role: "superadmin", hasAccess: true, lastLogin: daysAgo(0, 8), hue: "#d6b45f" },
  { id: "stf_2", name: "Dr. Shruti Choudhary", email: "shruti@vaidyagan.in", role: "editor", hasAccess: true, lastLogin: daysAgo(1, 14), hue: "#7fa07f" },
  { id: "stf_3", name: "Dr. Bhagyesh Karale", email: "bhagyesh@vaidyagan.in", role: "editor", hasAccess: true, lastLogin: daysAgo(3, 10), hue: "#e07f49" },
  { id: "stf_4", name: "Dr. Shivani Kadam", email: "shivani@vaidyagan.in", role: "viewer", hasAccess: true, lastLogin: daysAgo(5, 16), hue: "#93b1cf" },
  { id: "stf_5", name: "Front Desk", email: "frontdesk@vaidyagan.in", role: "viewer", hasAccess: false, lastLogin: daysAgo(20, 9), hue: "#c96430" },
];

const SEED_POSTS: Post[] = [
  { id: "post_1", title: "Ashwagandha: the adaptogen examined", author: "Dr. Shruti Choudhary", status: "published", category: "Dravyaguna", doshas: ["Vata"], updatedAt: daysAgo(2) },
  { id: "post_2", title: "A classical Panchakarma protocol for winter", author: "Dr. Bhagyesh Karale", status: "published", category: "Panchakarma", doshas: ["Vata", "Kapha"], updatedAt: daysAgo(4) },
  { id: "post_3", title: "Triphala: separating myth from monograph", author: "Dr. Shivani Kadam", status: "in-review", category: "Dravyaguna", doshas: ["Kapha", "Pitta"], updatedAt: daysAgo(1) },
  { id: "post_4", title: "Dinacharya for the modern workday", author: "Dr. Shruti Choudhary", status: "in-review", category: "Lifestyle", doshas: ["Vata"], updatedAt: daysAgo(0, 9) },
  { id: "post_5", title: "Brahmi ghrita: a medhya rasayana case series", author: "Dr. Bhagyesh Karale", status: "draft", category: "Chikitsa", doshas: ["Vata", "Pitta"], updatedAt: daysAgo(3) },
  { id: "post_6", title: "Monsoon ahara: eating with the season", author: "Dr. Shivani Kadam", status: "scheduled", category: "Ahara", doshas: ["Kapha"], updatedAt: daysAgo(5) },
];

const SEED_REVIEWS: Review[] = [
  { id: "rev_1", product: "Ashwagandha Root Capsules", author: "Aarav M.", rating: 5, text: "Sleep has genuinely improved in three weeks. No grogginess.", date: daysAgo(2), approved: true },
  { id: "rev_2", product: "Triphala Churna, Stone-milled", author: "Kabir S.", rating: 4, text: "Gentle and effective. Taste is strong but that's the point.", date: daysAgo(3), approved: true },
  { id: "rev_3", product: "Brahmi Ghrita", author: "Ishita B.", rating: 5, text: "My focus during study sessions is noticeably steadier.", date: daysAgo(1), approved: false },
  { id: "rev_4", product: "Mahanarayana Abhyanga Oil", author: "Aditya J.", rating: 5, text: "Warm, fragrant, and my knees thank me every morning.", date: daysAgo(0, 10), approved: false },
];

const SEED_DISCOUNTS: Discount[] = [
  { id: "disc_1", code: "WELCOME10", type: "percent", value: 10, minOrder: 499, expires: "", active: true },
  { id: "disc_2", code: "DOSHA100", type: "flat", value: 100, minOrder: 999, expires: daysAgo(-30).slice(0, 10), active: true },
  { id: "disc_3", code: "MONSOON15", type: "percent", value: 15, minOrder: 799, expires: daysAgo(5).slice(0, 10), active: false },
];

const SEED_SETTINGS: Settings = {
  enablePublicStore: true,
  showProfileTab: true,
  maintenanceMode: false,
  paymentUPI: true,
  paymentCard: true,
  paymentCOD: true,
  freeShippingThreshold: 999,
  shippingFee: 49,
  invoiceFooterText: "Thank you for trusting classical Ayurveda. This is a computer-generated invoice — no signature required.",
  contactEmail: "vaidyagan@gmail.com",
};

const SEED_AUDIT: AuditEvent[] = [
  { id: uid("aud"), timestamp: daysAgo(0, 9), actor: "Dr. Shruti Choudhary", action: "submitted “Dinacharya for the modern workday” for review" },
  { id: uid("aud"), timestamp: daysAgo(0, 10), actor: "System", action: "order VG-1042 placed (₹1,897)" },
  { id: uid("aud"), timestamp: daysAgo(1, 14), actor: "Monesh", action: "approved “A classical Panchakarma protocol for winter”" },
  { id: uid("aud"), timestamp: daysAgo(2, 12), actor: "Monesh", action: "changed Dr. Shivani Kadam's role to Viewer" },
  { id: uid("aud"), timestamp: daysAgo(3, 10), actor: "System", action: "low stock alert — Brahmi Ghrita (3 left)" },
];

const SEED_NOTIFS: Notif[] = [
  { id: uid("ntf"), title: "New order VG-1042", body: "Aarav Mehta · ₹1,897 · UPI", read: false, at: daysAgo(0, 10), icon: "order" },
  { id: uid("ntf"), title: "New order VG-1041", body: "Sanya Kulkarni · ₹948 · Card", read: false, at: daysAgo(0, 9), icon: "order" },
  { id: uid("ntf"), title: "Low stock alert", body: "Brahmi Ghrita is down to 3 units.", read: false, at: daysAgo(3, 10), icon: "stock" },
  { id: uid("ntf"), title: "Review awaiting approval", body: "“Triphala: separating myth from monograph”", read: true, at: daysAgo(1, 15), icon: "review" },
];

/* ---------------------------------- store --------------------------------- */

const K = {
  orders: "orders", products: "products", customers: "customers", staff: "admin_users",
  posts: "posts", reviews: "reviews", discounts: "discounts", settings: "settings",
  audit: "audit_log", notifs: "notifications", pageviews: "pageviews",
};

let orders = load<Order[]>(K.orders, SEED_ORDERS);
let products = load<Product[]>(K.products, SEED_PRODUCTS);
let customers = load<Customer[]>(K.customers, SEED_CUSTOMERS);
let staff = load<StaffUser[]>(K.staff, SEED_STAFF);
let posts = load<Post[]>(K.posts, SEED_POSTS);
let reviews = load<Review[]>(K.reviews, SEED_REVIEWS);
let discounts = load<Discount[]>(K.discounts, SEED_DISCOUNTS);
let settings = load<Settings>(K.settings, SEED_SETTINGS);
let audit = load<AuditEvent[]>(K.audit, SEED_AUDIT);
let notifs = load<Notif[]>(K.notifs, SEED_NOTIFS);

/* --------------------------------- reads ---------------------------------- */

export const listOrders = (): Order[] => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
export const listProducts = (): Product[] => [...products];
export const listCustomers = (): Customer[] => [...customers].sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
export const listStaff = (): StaffUser[] => [...staff];
export const listPosts = (): Post[] => [...posts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
export const listReviews = (): Review[] => [...reviews].sort((a, b) => b.date.localeCompare(a.date));
export const listDiscounts = (): Discount[] => [...discounts];
export const getSettings = (): Settings => ({ ...settings });
export const listAudit = (): AuditEvent[] => [...audit].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
export const listNotifs = (): Notif[] => [...notifs].sort((a, b) => b.at.localeCompare(a.at));
export const unreadNotifs = (): number => notifs.filter((n) => !n.read).length;
export const getProduct = (id: string): Product | undefined => products.find((p) => p.id === id);

/* ------------------------------ audit + notifs ----------------------------- */

export function logAudit(actor: string, action: string): void {
  audit = [{ id: uid("aud"), timestamp: iso(new Date()), actor, action }, ...audit].slice(0, 200);
  persist(K.audit, audit);
}

export function pushNotif(title: string, body: string, icon: Notif["icon"]): void {
  notifs = [{ id: uid("ntf"), title, body, read: false, at: iso(new Date()), icon }, ...notifs].slice(0, 60);
  persist(K.notifs, notifs);
}

export function markAllNotifsRead(): void {
  notifs = notifs.map((n) => ({ ...n, read: true }));
  persist(K.notifs, notifs);
  emit();
}

/* -------------------------------- mutations -------------------------------- */

const ACTOR = () => {
  try {
    const s = localStorage.getItem(NS + "admin_session");
    return s ? (JSON.parse(s).name as string) : "Monesh";
  } catch {
    return "Monesh";
  }
};

export function updateOrderStatus(id: string, status: OrderStatus): void {
  orders = orders.map((o) => (o.id === id ? { ...o, status } : o));
  persist(K.orders, orders);
  logAudit(ACTOR(), `moved order ${id} to “${status.replace(/-/g, " ")}”`);
  pushNotif(`Order ${id} updated`, `Status → ${status.replace(/-/g, " ")}`, "order");
  emit();
}

export function bulkOrderStatus(ids: string[], status: OrderStatus): void {
  orders = orders.map((o) => (ids.includes(o.id) ? { ...o, status } : o));
  persist(K.orders, orders);
  logAudit(ACTOR(), `marked ${ids.length} order(s) as “${status.replace(/-/g, " ")}”`);
  emit();
}

export function cancelAndRestock(id: string): void {
  const o = orders.find((x) => x.id === id);
  if (o) {
    // Return stock for each line item.
    products = products.map((p) => {
      const line = o.items.find((i) => i.productId === p.id);
      return line ? { ...p, stock: p.stock + line.qty } : p;
    });
    persist(K.products, products);
  }
  orders = orders.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x));
  persist(K.orders, orders);
  logAudit(ACTOR(), `cancelled order ${id} and restocked items`);
  pushNotif(`Order ${id} cancelled`, "Items were returned to stock.", "order");
  emit();
}

export function saveProduct(p: Product): void {
  const exists = products.some((x) => x.id === p.id);
  products = exists ? products.map((x) => (x.id === p.id ? p : x)) : [p, ...products];
  persist(K.products, products);
  logAudit(ACTOR(), `${exists ? "updated" : "created"} product “${p.name}”`);
  if (p.stock > 0 && p.stock < 5) pushNotif("Low stock alert", `${p.name} is down to ${p.stock} units.`, "stock");
  emit();
}

export function deleteProduct(id: string): void {
  const p = products.find((x) => x.id === id);
  products = products.filter((x) => x.id !== id);
  persist(K.products, products);
  logAudit(ACTOR(), `deleted product “${p?.name ?? id}”`);
  emit();
}

export function setProductVisible(id: string, isVisible: boolean): void {
  products = products.map((x) => (x.id === id ? { ...x, isVisible } : x));
  persist(K.products, products);
  emit();
}

export function setProductStock(id: string, stock: number): void {
  products = products.map((x) => (x.id === id ? { ...x, stock: Math.max(0, stock) } : x));
  persist(K.products, products);
  const p = products.find((x) => x.id === id);
  if (p && p.stock > 0 && p.stock < 5) pushNotif("Low stock alert", `${p.name} is down to ${p.stock} units.`, "stock");
  emit();
}

export function updateCustomer(id: string, patch: Partial<Customer>): void {
  customers = customers.map((c) => (c.id === id ? { ...c, ...patch } : c));
  persist(K.customers, customers);
  const c = customers.find((x) => x.id === id);
  if (patch.suspended !== undefined && c) {
    logAudit(ACTOR(), `${patch.suspended ? "suspended" : "reactivated"} customer ${c.name}`);
    pushNotif(`Customer ${patch.suspended ? "suspended" : "reactivated"}`, c.name, "member");
  }
  emit();
}

export function updateStaffRole(id: string, role: StaffRole): { ok: boolean; error?: string } {
  const target = staff.find((s) => s.id === id);
  if (!target) return { ok: false, error: "Staff member not found." };
  if (target.role === "superadmin" && role !== "superadmin") {
    const remaining = staff.filter((s) => s.role === "superadmin" && s.id !== id && s.hasAccess);
    if (remaining.length === 0) return { ok: false, error: "At least one active superadmin must remain." };
  }
  staff = staff.map((s) => (s.id === id ? { ...s, role } : s));
  persist(K.staff, staff);
  logAudit(ACTOR(), `changed ${target.name}'s role to ${role}`);
  pushNotif("Staff role changed", `${target.name} is now ${role}`, "member");
  emit();
  return { ok: true };
}

export function updateStaffAccess(id: string, hasAccess: boolean): { ok: boolean; error?: string } {
  const target = staff.find((s) => s.id === id);
  if (!target) return { ok: false, error: "Staff member not found." };
  if (target.id === "root") return { ok: false, error: "You can't revoke your own dashboard access." };
  if (!hasAccess && target.role === "superadmin") {
    const remaining = staff.filter((s) => s.role === "superadmin" && s.id !== id && s.hasAccess);
    if (remaining.length === 0) return { ok: false, error: "The last active superadmin can't be locked out." };
  }
  staff = staff.map((s) => (s.id === id ? { ...s, hasAccess } : s));
  persist(K.staff, staff);
  logAudit(ACTOR(), `${hasAccess ? "granted" : "revoked"} dashboard access for ${target.name}`);
  emit();
  return { ok: true };
}

export function inviteStaff(name: string, email: string, role: StaffRole): { ok: boolean; error?: string } {
  if (!name.trim() || !email.trim()) return { ok: false, error: "Name and email are required." };
  if (staff.some((s) => s.email.toLowerCase() === email.trim().toLowerCase()))
    return { ok: false, error: "That email is already on the desk." };
  const hues = ["#7fa07f", "#93b1cf", "#e07f49", "#c49c3e", "#b7cbde"];
  staff = [...staff, { id: uid("stf"), name: name.trim(), email: email.trim(), role, hasAccess: true, lastLogin: iso(new Date()), hue: hues[staff.length % hues.length] }];
  persist(K.staff, staff);
  logAudit(ACTOR(), `invited ${name.trim()} as ${role}`);
  pushNotif("Staff invited", `${name.trim()} joined as ${role}`, "member");
  emit();
  return { ok: true };
}

export function updatePostStatus(id: string, status: PostStatus): void {
  posts = posts.map((p) => (p.id === id ? { ...p, status, updatedAt: iso(new Date()) } : p));
  persist(K.posts, posts);
  const p = posts.find((x) => x.id === id);
  logAudit(ACTOR(), `${status === "published" ? "approved" : status === "draft" ? "sent back" : "moved"} “${p?.title ?? id}” → ${status}`);
  if (status === "published" && p) pushNotif("Post published", p.title, "system");
  emit();
}

export function deletePost(id: string): void {
  const p = posts.find((x) => x.id === id);
  posts = posts.filter((x) => x.id !== id);
  persist(K.posts, posts);
  logAudit(ACTOR(), `deleted post “${p?.title ?? id}”`);
  emit();
}

export function setReviewApproved(id: string, approved: boolean): void {
  reviews = reviews.map((r) => (r.id === id ? { ...r, approved } : r));
  persist(K.reviews, reviews);
  const r = reviews.find((x) => x.id === id);
  logAudit(ACTOR(), `${approved ? "approved" : "hid"} review on ${r?.product ?? "a product"}`);
  emit();
}

export function saveDiscount(d: Discount): void {
  const exists = discounts.some((x) => x.id === d.id);
  discounts = exists ? discounts.map((x) => (x.id === d.id ? d : x)) : [d, ...discounts];
  persist(K.discounts, discounts);
  logAudit(ACTOR(), `${exists ? "updated" : "created"} discount code ${d.code}`);
  emit();
}

export function deleteDiscount(id: string): void {
  const d = discounts.find((x) => x.id === id);
  discounts = discounts.filter((x) => x.id !== id);
  persist(K.discounts, discounts);
  logAudit(ACTOR(), `deleted discount code ${d?.code ?? id}`);
  emit();
}

export function saveSettings(patch: Partial<Settings>): void {
  settings = { ...settings, ...patch };
  persist(K.settings, settings);
  logAudit(ACTOR(), "updated store settings");
  emit();
}

/* -------------------------------- analytics -------------------------------- */

export interface DayPoint {
  day: string; // "dd MMM"
  revenue: number;
  orders: number;
}

export function revenueSeries(days = 14): DayPoint[] {
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayOrders = orders.filter((o) => o.createdAt.slice(0, 10) === key && o.status !== "cancelled");
    out.push({
      day: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    });
  }
  return out;
}

export function topProducts(n = 5): { name: string; revenue: number }[] {
  const map = new Map<string, number>();
  orders.forEach((o) => {
    if (o.status === "cancelled") return;
    o.items.forEach((i) => map.set(i.name, (map.get(i.name) ?? 0) + i.total));
  });
  return [...map.entries()].map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, n);
}

export function trackPageView(page: string): void {
  try {
    const pv = load<Record<string, number>>(K.pageviews, {});
    pv[page] = (pv[page] ?? 0) + 1;
    persist(K.pageviews, pv);
  } catch {
    /* never let tracking break the console */
  }
}

export function pageViews(): { page: string; views: number }[] {
  const pv = load<Record<string, number>>(K.pageviews, {});
  return Object.entries(pv).map(([page, views]) => ({ page, views })).sort((a, b) => b.views - a.views);
}

/* ------------------------------ backup / restore --------------------------- */

export function exportAllData(): string {
  const dump = {
    orders, products, customers, staff, posts, reviews, discounts, settings, audit,
    exportedAt: iso(new Date()), app: "vaidyagan",
  };
  return JSON.stringify(dump, null, 2);
}

export function importAllData(json: string): { ok: boolean; error?: string } {
  try {
    const d = JSON.parse(json);
    if (!d || typeof d !== "object") return { ok: false, error: "That file doesn't look like a Vaidyagan backup." };
    if (Array.isArray(d.orders)) { orders = d.orders; persist(K.orders, orders); }
    if (Array.isArray(d.products)) { products = d.products; persist(K.products, products); }
    if (Array.isArray(d.customers)) { customers = d.customers; persist(K.customers, customers); }
    if (Array.isArray(d.staff)) { staff = d.staff; persist(K.staff, staff); }
    if (Array.isArray(d.posts)) { posts = d.posts; persist(K.posts, posts); }
    if (Array.isArray(d.reviews)) { reviews = d.reviews; persist(K.reviews, reviews); }
    if (Array.isArray(d.discounts)) { discounts = d.discounts; persist(K.discounts, discounts); }
    if (d.settings) { settings = { ...settings, ...d.settings }; persist(K.settings, settings); }
    logAudit(ACTOR(), "restored data from a backup file");
    emit();
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't read that file — is it valid JSON?" };
  }
}

export function resetDemoData(): void {
  orders = SEED_ORDERS; products = SEED_PRODUCTS; customers = SEED_CUSTOMERS; staff = SEED_STAFF;
  posts = SEED_POSTS; reviews = SEED_REVIEWS; discounts = SEED_DISCOUNTS; settings = SEED_SETTINGS;
  audit = SEED_AUDIT; notifs = SEED_NOTIFS;
  Object.entries({ [K.orders]: orders, [K.products]: products, [K.customers]: customers, [K.staff]: staff, [K.posts]: posts, [K.reviews]: reviews, [K.discounts]: discounts, [K.settings]: settings, [K.audit]: audit, [K.notifs]: notifs })
    .forEach(([k, v]) => persist(k, v));
  logAudit(ACTOR(), "reset demo data to seed values");
  emit();
}

/* ---------------------------------- session -------------------------------- */

export function loginAdmin(username: string, password: string): { ok: boolean; error?: string } {
  if (username.trim().toLowerCase() === "monesh" && password === "admin91466") {
    const s = staff.find((x) => x.id === "root") ?? SEED_STAFF[0];
    try {
      localStorage.setItem(NS + "admin_session", JSON.stringify({ id: s.id, name: s.name, role: s.role }));
    } catch { /* ignore */ }
    logAudit(s.name, "signed in to the Admin Console");
    emit();
    return { ok: true };
  }
  return { ok: false, error: username.trim().toLowerCase() !== "monesh" ? "No account found with that username." : "Incorrect password — please try again." };
}

export function currentAdmin(): { id: string; name: string; role: StaffRole } | null {
  try {
    const raw = localStorage.getItem(NS + "admin_session");
    return raw ? (JSON.parse(raw) as { id: string; name: string; role: StaffRole }) : null;
  } catch {
    return null;
  }
}

export function logoutAdmin(): void {
  try {
    localStorage.removeItem(NS + "admin_session");
  } catch { /* ignore */ }
  emit();
}

export function downloadFile(name: string, content: string, mime = "text/plain"): void {
  try {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch { /* ignore */ }
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

export const inr = (n: number): string => `₹${Math.round(n).toLocaleString("en-IN")}`;
