import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ARTICLES, HERBS, PRODUCTS, SEED_ORDERS,
  type Article, type Dosha, type Herb, type Order, type OrderCustomer, type OrderStatus, type Product,
} from "./data";
import { pushNotification } from "./console/db";

/* ----------------------------------- views ---------------------------------- */

export type View =
  | { name: "home" | "journal" | "quiz" | "herbs" | "store" | "studio" | "account" | "contact" | "console" }
  | { name: "article"; id: string }
  | { name: "product"; id: string };

/* =============================== studio auth ================================ */

export interface StudioPerms {
  canPublishDirect: boolean;
  canEditPublished: boolean;
  canDeletePublished: boolean;
  storeAccess: boolean;
  herbAccess: boolean;
  /** Opens the standalone Admin Console (superadmin-grade dashboard). */
  consoleAccess: boolean;
  /** Console granularity for non-superadmins: editor can change things, viewer is read-only. */
  consoleRole: "editor" | "viewer";
}
export interface StudioUser extends StudioPerms {
  id: string; name: string; role: "superadmin" | "doctor";
  username: string; password: string; specialty?: string;
  hue: string; active: boolean; createdAt: string;
}

export const DEFAULT_PERMS: StudioPerms = {
  canPublishDirect: true,
  canEditPublished: true,
  canDeletePublished: false,
  storeAccess: false,
  herbAccess: true,
  consoleAccess: true,
  consoleRole: "editor",
};

function normalizeUser(u: StudioUser): StudioUser {
  return { ...DEFAULT_PERMS, ...u };
}

const USERS_KEY = "vaidyagan_studio_users_v1";
const SESSION_KEY = "vaidyagan_studio_session_v1";

const SUPERADMIN: StudioUser = {
  ...DEFAULT_PERMS,
  id: "root", name: "Monesh", role: "superadmin", username: "monesh", password: "admin91466",
  specialty: "Founder · Vaidyagan", hue: "#d6b45f", active: true, createdAt: "2024-01-01",
  storeAccess: true,
};
const SEED_DOCTORS: StudioUser[] = [
  { ...DEFAULT_PERMS, id: "u-shruti", name: "Dr. Shruti Choudhary", role: "doctor", username: "shruti", password: "shruti123", specialty: "Dravyaguna · Clinical herbology", hue: "#82b39e", active: true, createdAt: "2025-03-12", canPublishDirect: false },
  { ...DEFAULT_PERMS, id: "u-bhagyesh", name: "Dr. Bhagyesh Karale", role: "doctor", username: "bhagyesh", password: "bhagyesh123", specialty: "Panchakarma · Detox protocols", hue: "#e07f49", active: true, createdAt: "2025-04-02", canPublishDirect: false },
  { ...DEFAULT_PERMS, id: "u-shivani", name: "Dr. Shivani Kadam", role: "doctor", username: "shivani", password: "shivani123", specialty: "Stri Roga · Women's health", hue: "#93b1cf", active: true, createdAt: "2025-05-18", canPublishDirect: false },
];

function loadUsers(): StudioUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StudioUser[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeUser);
    }
  } catch { /* seeds */ }
  return [SUPERADMIN, ...SEED_DOCTORS];
}
function persistUsers(users: StudioUser[]) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch { /* ignore */ }
}

export const auth = {
  list(): StudioUser[] { return loadUsers(); },
  login(username: string, password: string): StudioUser | null {
    const u = loadUsers().find((x) => x.username.toLowerCase() === username.trim().toLowerCase() && x.password === password);
    if (!u || !u.active) return null;
    try { localStorage.setItem(SESSION_KEY, u.id); } catch { /* ignore */ }
    return u;
  },
  session(): StudioUser | null {
    try {
      const id = localStorage.getItem(SESSION_KEY);
      if (!id) return null;
      return loadUsers().find((u) => u.id === id) ?? null;
    } catch { return null; }
  },
  logout() { try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } },
  get(id: string): StudioUser | null {
    return loadUsers().find((u) => u.id === id) ?? null;
  },
  addMember(
    input: Omit<StudioUser, "id" | "active" | "createdAt" | "hue" | keyof StudioPerms> & Partial<StudioPerms> & { hue?: string }
  ): { ok: boolean; error?: string; user?: StudioUser } {
    const users = loadUsers();
    if (users.some((u) => u.username.toLowerCase() === input.username.trim().toLowerCase())) {
      return { ok: false, error: "That username is already taken — pick another." };
    }
    const user: StudioUser = {
      ...DEFAULT_PERMS, ...input, username: input.username.trim(),
      role: input.role ?? "doctor",
      id: `u-${Date.now()}`, active: true,
      hue: input.hue || "#82b39e", createdAt: new Date().toISOString().slice(0, 10),
    };
    persistUsers([...users, user]);
    return { ok: true, user };
  },
  setMemberStatus(id: string, active: boolean) {
    if (id === "root") return;
    persistUsers(loadUsers().map((u) => (u.id === id ? { ...u, active } : u)));
  },
  setRole(id: string, role: "superadmin" | "doctor"): { ok: boolean; error?: string } {
    if (id === "root" && role !== "superadmin") return { ok: false, error: "The founder account cannot be demoted." };
    const users = loadUsers();
    const target = users.find((u) => u.id === id);
    if (!target) return { ok: false, error: "Member not found." };
    if (role === "doctor" && target.role === "superadmin") {
      const remaining = users.filter((u) => u.role === "superadmin" && u.id !== id && u.active);
      if (remaining.length === 0) return { ok: false, error: "At least one active superadmin must remain on the desk." };
    }
    persistUsers(users.map((u) => (u.id === id ? { ...u, role, ...(role === "superadmin" ? { storeAccess: true } : {}) } : u)));
    return { ok: true };
  },
  setPerms(id: string, patch: Partial<StudioPerms>): boolean {
    try {
      persistUsers(loadUsers().map((u) => (u.id === id ? { ...u, ...patch } : u)));
      return true;
    } catch { return false; }
  },
  resetPassword(id: string, newPassword: string): boolean {
    if (!newPassword || newPassword.length < 4) return false;
    persistUsers(loadUsers().map((u) => (u.id === id ? { ...u, password: newPassword } : u)));
    return true;
  },
  removeMember(id: string): boolean {
    if (id === "root") return false;
    const users = loadUsers();
    const target = users.find((u) => u.id === id);
    if (target?.role === "superadmin" && users.filter((u) => u.role === "superadmin" && u.id !== id && u.active).length === 0) return false;
    persistUsers(users.filter((u) => u.id !== id));
    return true;
  },
};

/* ------------------------------ activity ledger ----------------------------- */

export type ActivityKind = "publish" | "approve" | "reject" | "member" | "store" | "edit" | "submit";
export interface ActivityEntry { id: string; actor: string; kind: ActivityKind; action: string; target?: string; at: string }

const ACTIVITY_KEY = "vaidyagan_activity_v1";
function loadActivity(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ActivityEntry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* fresh */ }
  return [];
}
function persistActivity(list: ActivityEntry[]) {
  try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

/* ============================ shopper accounts (store) ======================= */

export interface Address {
  id: string; label: "Home" | "Work" | "Other"; name: string; phone: string;
  line1: string; city: string; state: string; pin: string; isDefault: boolean;
}
export interface Customer {
  id: string; name: string; phone: string; email: string; password?: string;
  provider: "otp" | "google" | "email"; addresses: Address[]; createdAt: string;
  /** Console-managed flag: suspended accounts cannot sign in. */
  suspended?: boolean;
}

const CUSTOMERS_KEY = "vaidyagan_customers_v1";
const CUSTOMER_SESSION_KEY = "vaidyagan_customer_session_v1";

function loadCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Customer[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* fresh */ }
  return [];
}
function persistCustomers(list: Customer[]) {
  try { localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

/* ================================ persistence =============================== */

const POSTS_KEY = "vaidyagan_desk_posts_v1";
const HERBS_KEY = "vaidyagan_herbs_v1";
const PRODUCTS_KEY = "vaidyagan_store_products_v1";
const ORDERS_KEY = "vaidyagan_orders_v1";
const STORE_FLAG_KEY = "vaidyagan_store_enabled_v1";
const PROFILE_TAB_KEY = "vaidyagan_profile_tab_v1";

function loadPosts(): Article[] {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Article[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* fresh */ }
  return [];
}
function persistPosts(list: Article[]) {
  try { localStorage.setItem(POSTS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

function loadHerbs(): Herb[] {
  try {
    const raw = localStorage.getItem(HERBS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Herb[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* seeds */ }
  return HERBS;
}
function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Product[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* seeds */ }
  return PRODUCTS;
}
function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Order[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* seeds */ }
  return SEED_ORDERS;
}
function loadStoreFlag(): boolean {
  try {
    const raw = localStorage.getItem(STORE_FLAG_KEY);
    if (raw !== null) return raw === "1";
  } catch { /* default */ }
  return true;
}
function loadProfileTabFlag(): boolean {
  try {
    const raw = localStorage.getItem(PROFILE_TAB_KEY);
    if (raw !== null) return raw === "1";
  } catch { /* default */ }
  return true;
}

function buildSampleOrders(c: Customer): Order[] {
  const p1 = PRODUCTS[1], p2 = PRODUCTS[0], p3 = PRODUCTS[4];
  const name = c.name || "you";
  const addr = { name, phone: c.phone || "+91 98000 00000", address: "Vaidyagan House, 12 Salunkhe Vihar Road", city: "Pune", pin: "411048" };
  return [
    {
      id: `VG-${2100 + Math.floor(Math.random() * 80)}`, customer: addr,
      items: [{ name: p2.name, qty: 1, price: p2.price, productId: p2.id, image: p2.image }],
      total: p2.price, status: "shipped", placedAt: new Date(Date.now() - 3 * 86400e3).toISOString(),
      customerId: c.id, paymentMethod: "UPI",
    },
    {
      id: `VG-${2000 + Math.floor(Math.random() * 80)}`, customer: addr,
      items: [
        { name: p1.name, qty: 2, price: p1.price, productId: p1.id, image: p1.image },
        { name: p3.name, qty: 1, price: p3.price, productId: p3.id, image: p3.image },
      ],
      total: p1.price * 2 + p3.price, status: "delivered", placedAt: new Date(Date.now() - 12 * 86400e3).toISOString(),
      customerId: c.id, paymentMethod: "Card",
    },
  ];
}

/* ================================== context ================================= */

interface CartLine { id: string; qty: number }
interface Toast { id: number; msg: string }

interface AppCtx {
  view: View; navigate: (v: View) => void;
  articles: Article[]; allArticles: Article[];
  userPosts: Article[]; saveDraft: (a: Article) => void;
  publishArticle: (a: Article) => void; deleteUserPost: (id: string) => void;
  deleteArticle: (id: string) => void;
  herbs: Herb[]; saveHerb: (h: Herb) => void; deleteHerb: (id: string) => void; resetHerbs: () => void;
  products: Product[]; saveProduct: (p: Product) => void; deleteProduct: (id: string) => void;
  orders: Order[]; placeOrder: (c: OrderCustomer, paymentMethod?: string, discount?: { code: string; amount: number }) => Order;
  updateOrderStatus: (id: string, s: OrderStatus) => void; cancelOrder: (id: string) => void;
  cancelAndRestock: (id: string) => void;
  storeEnabled: boolean; setStoreEnabled: (b: boolean) => void;
  profileTabEnabled: boolean; setProfileTabEnabled: (b: boolean) => void;
  cart: CartLine[]; addToCart: (id: string, qty?: number) => void;
  changeQty: (id: string, d: number) => void; removeLine: (id: string) => void;
  cartOpen: boolean; setCartOpen: (b: boolean) => void;
  checkoutIntent: boolean; setCheckoutIntent: (b: boolean) => void;
  customer: Customer | null;
  loginOtp: (phone: string, name?: string) => Customer;
  loginGoogle: (email: string, name: string) => Customer;
  loginEmail: (email: string, password: string) => Customer | null;
  registerEmail: (name: string, email: string, password: string) => Customer | null;
  logoutCustomer: () => void;
  updateCustomer: (patch: Partial<Pick<Customer, "name" | "phone" | "email">>) => void;
  saveAddress: (a: Address) => void; deleteAddress: (id: string) => void;
  myOrders: Order[];
  accountAuthOpen: boolean; setAccountAuthOpen: (b: boolean) => void;
  activity: ActivityEntry[];
  logActivity: (kind: ActivityKind, action: string, target?: string) => void;
  toasts: Toast[]; toast: (msg: string) => void;
}

const Ctx = createContext<AppCtx | null>(null);
export function useApp(): AppCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside provider");
  return v;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<View>({ name: "home" });
  const [userPosts, setUserPosts] = useState<Article[]>(loadPosts);
  const [herbs, setHerbs] = useState<Herb[]>(loadHerbs);
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [orders, setOrders] = useState<Order[]>(loadOrders);
  const [storeEnabled, setStoreEnabledState] = useState<boolean>(loadStoreFlag);
  const [profileTabEnabled, setProfileTabState] = useState<boolean>(loadProfileTabFlag);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutIntent, setCheckoutIntent] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(() => {
    try {
      const id = localStorage.getItem(CUSTOMER_SESSION_KEY);
      if (!id) return null;
      return loadCustomers().find((c) => c.id === id) ?? null;
    } catch { return null; }
  });
  const [accountAuthOpen, setAccountAuthOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [activity, setActivity] = useState<ActivityEntry[]>(loadActivity);
  const logActivity = useCallback((kind: ActivityKind, action: string, target?: string) => {
    setActivity((list) => {
      const entry: ActivityEntry = {
        id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actor: auth.session()?.name ?? "System",
        kind, action, target, at: new Date().toISOString(),
      };
      const next = [entry, ...list].slice(0, 120);
      persistActivity(next);
      return next;
    });
  }, []);

  const navigate = useCallback((v: View) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  const allArticles = useMemo(() => {
    const ids = new Set(userPosts.map((p) => p.id));
    const merged = [...userPosts];
    for (const a of ARTICLES) if (!ids.has(a.id)) merged.push(a);
    return merged;
  }, [userPosts]);

  const articles = useMemo(() => allArticles.filter((a) => a.status === "published"), [allArticles]);

  const saveDraft = useCallback((a: Article) => {
    setUserPosts((list) => {
      const next = list.some((x) => x.id === a.id) ? list.map((x) => (x.id === a.id ? a : x)) : [a, ...list];
      persistPosts(next);
      return next;
    });
  }, []);

  const publishArticle = useCallback((a: Article) => {
    setUserPosts((list) => {
      const published = { ...a, status: "published" as const };
      const next = list.some((x) => x.id === a.id) ? list.map((x) => (x.id === a.id ? published : x)) : [published, ...list];
      persistPosts(next);
      return next;
    });
  }, []);

  const deleteUserPost = useCallback((id: string) => {
    setUserPosts((list) => {
      const next = list.filter((x) => x.id !== id);
      persistPosts(next);
      return next;
    });
  }, []);

  const deleteArticle = useCallback((id: string) => {
    const src = ARTICLES.find((a) => a.id === id);
    if (src) {
      const tomb = { ...src, status: "draft" as const };
      setUserPosts((list) => {
        const next = list.some((x) => x.id === id) ? list.map((x) => (x.id === id ? tomb : x)) : [tomb, ...list];
        persistPosts(next);
        return next;
      });
      return;
    }
    deleteUserPost(id);
  }, [deleteUserPost]);

  const saveHerb = useCallback((h: Herb) => {
    setHerbs((list) => {
      const next = list.some((x) => x.id === h.id) ? list.map((x) => (x.id === h.id ? h : x)) : [...list, h];
      try { localStorage.setItem(HERBS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);
  const deleteHerb = useCallback((id: string) => {
    setHerbs((list) => {
      const next = list.filter((x) => x.id !== id);
      try { localStorage.setItem(HERBS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);
  const resetHerbs = useCallback(() => {
    setHerbs(HERBS);
    try { localStorage.removeItem(HERBS_KEY); } catch { /* ignore */ }
  }, []);

  const saveProduct = useCallback((p: Product) => {
    setProducts((list) => {
      const next = list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p];
      try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);
  const deleteProduct = useCallback((id: string) => {
    setProducts((list) => {
      const next = list.filter((x) => x.id !== id);
      try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const placeOrder = useCallback((cust: OrderCustomer, paymentMethod?: string, discount?: { code: string; amount: number }): Order => {
    const items = cart.map((l) => {
      const p = products.find((x) => x.id === l.id);
      return { name: p?.name ?? "Formulation", qty: l.qty, price: p?.price ?? 0, productId: p?.id, image: p?.image };
    });
    const gross = items.reduce((s, i) => s + i.price * i.qty, 0);
    const off = discount ? Math.min(discount.amount, gross) : 0;
    const order: Order = {
      id: `VG-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: cust, items, total: gross - off, status: "new",
      placedAt: new Date().toISOString(),
      customerId: customer?.id, paymentMethod,
      discount: off > 0 ? off : undefined,
      discountCode: off > 0 ? discount?.code : undefined,
    };
    setOrders((o) => {
      const next = [order, ...o];
      try { localStorage.setItem(ORDERS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    const lowStock: string[] = [];
    setProducts((list) => {
      const next = list.map((p) => {
        const line = cart.find((l) => l.id === p.id);
        if (!line) return p;
        const stock = Math.max(0, p.stock - line.qty);
        if (stock > 0 && stock < 5) lowStock.push(p.name);
        return { ...p, stock };
      });
      try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    /* notify the console bell — never let this break checkout */
    try {
      pushNotification({ title: `New order ${order.id}`, body: `${cust.name} · ₹${order.total.toLocaleString("en-IN")}`, icon: "order" });
      lowStock.forEach((n) => pushNotification({ title: "Low stock alert", body: `${n} is down to fewer than 5 units.`, icon: "stock" }));
    } catch { /* ignore */ }
    setCart([]);
    return order;
  }, [cart, products, customer]);

  const updateOrderStatus = useCallback((id: string, s: OrderStatus) => {
    setOrders((o) => {
      const next = o.map((x) => (x.id === id ? { ...x, status: s } : x));
      try { localStorage.setItem(ORDERS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const cancelOrder = useCallback((id: string) => {
    setOrders((o) => {
      const next = o.map((x) => (x.id === id && (x.status === "new" || x.status === "processing") ? { ...x, status: "cancelled" as const } : x));
      try { localStorage.setItem(ORDERS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  /** Desk-side cancellation: marks the order cancelled AND returns every unit to stock. */
  const cancelAndRestock = useCallback((id: string) => {
    const target = orders.find((x) => x.id === id);
    if (!target || target.status === "cancelled" || target.status === "delivered") return;
    setOrders((o) => {
      const next = o.map((x) => (x.id === id ? { ...x, status: "cancelled" as const } : x));
      try { localStorage.setItem(ORDERS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setProducts((list) => {
      const next = list.map((p) => {
        const line = target.items.find((i) => i.productId === p.id);
        return line ? { ...p, stock: p.stock + line.qty } : p;
      });
      try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [orders]);

  const setStoreEnabled = useCallback((b: boolean) => {
    setStoreEnabledState(b);
    try { localStorage.setItem(STORE_FLAG_KEY, b ? "1" : "0"); } catch { /* ignore */ }
  }, []);
  const setProfileTabEnabled = useCallback((b: boolean) => {
    setProfileTabState(b);
    try { localStorage.setItem(PROFILE_TAB_KEY, b ? "1" : "0"); } catch { /* ignore */ }
  }, []);

  const addToCart = useCallback((id: string, qty = 1) => {
    setCart((c) => {
      const hit = c.find((l) => l.id === id);
      return hit ? c.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l)) : [...c, { id, qty }];
    });
  }, []);
  const changeQty = useCallback((id: string, d: number) => {
    setCart((c) => c.map((l) => (l.id === id ? { ...l, qty: Math.max(1, l.qty + d) } : l)));
  }, []);
  const removeLine = useCallback((id: string) => {
    setCart((c) => c.filter((l) => l.id !== id));
  }, []);

  const commitCustomers = useCallback((list: Customer[]) => { persistCustomers(list); }, []);
  const startSession = useCallback((c: Customer) => {
    setCustomer(c);
    try { localStorage.setItem(CUSTOMER_SESSION_KEY, c.id); } catch { /* ignore */ }
  }, []);
  const seedSampleOrders = useCallback((c: Customer) => {
    setOrders((o) => {
      const next = [...buildSampleOrders(c), ...o];
      try { localStorage.setItem(ORDERS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const loginOtp = useCallback((phone: string, name?: string): Customer => {
    const list = loadCustomers();
    const existing = list.find((c) => c.phone === phone);
    if (existing) { startSession(existing); return existing; }
    const fresh: Customer = { id: `c-${Date.now()}`, name: name || "Ayurveda friend", phone, email: "", provider: "otp", addresses: [], createdAt: new Date().toISOString() };
    commitCustomers([...list, fresh]);
    seedSampleOrders(fresh);
    startSession(fresh);
    return fresh;
  }, [commitCustomers, seedSampleOrders, startSession]);

  const loginGoogle = useCallback((email: string, name: string): Customer => {
    const list = loadCustomers();
    const existing = list.find((c) => c.email.toLowerCase() === email.toLowerCase());
    if (existing) { startSession(existing); return existing; }
    const fresh: Customer = { id: `c-${Date.now()}`, name, phone: "", email, provider: "google", addresses: [], createdAt: new Date().toISOString() };
    commitCustomers([...list, fresh]);
    seedSampleOrders(fresh);
    startSession(fresh);
    return fresh;
  }, [commitCustomers, seedSampleOrders, startSession]);

  const registerEmail = useCallback((name: string, email: string, password: string): Customer | null => {
    const list = loadCustomers();
    if (list.some((x) => x.email.toLowerCase() === email.toLowerCase())) return null;
    const fresh: Customer = { id: `c-${Date.now()}`, name, phone: "", email, password, provider: "email", addresses: [], createdAt: new Date().toISOString() };
    commitCustomers([...list, fresh]);
    seedSampleOrders(fresh);
    startSession(fresh);
    return fresh;
  }, [commitCustomers, seedSampleOrders, startSession]);

  const loginEmail = useCallback((email: string, password: string): Customer | null => {
    const c = loadCustomers().find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
    if (!c) return null;
    startSession(c);
    return c;
  }, [startSession]);

  const logoutCustomer = useCallback(() => {
    setCustomer(null);
    try { localStorage.removeItem(CUSTOMER_SESSION_KEY); } catch { /* ignore */ }
  }, []);

  const updateCustomer = useCallback((patch: Partial<Pick<Customer, "name" | "phone" | "email">>) => {
    setCustomer((c) => {
      if (!c) return c;
      const next = { ...c, ...patch };
      commitCustomers(loadCustomers().map((x) => (x.id === c.id ? next : x)));
      return next;
    });
  }, [commitCustomers]);

  const saveAddress = useCallback((a: Address) => {
    if (!customer) return;
    setCustomer((c) => {
      if (!c) return c;
      let addresses = c.addresses.some((x) => x.id === a.id)
        ? c.addresses.map((x) => (x.id === a.id ? a : x))
        : [...c.addresses, a];
      if (a.isDefault) addresses = addresses.map((x) => ({ ...x, isDefault: x.id === a.id }));
      const next = { ...c, addresses };
      commitCustomers(loadCustomers().map((x) => (x.id === c.id ? next : x)));
      return next;
    });
  }, [customer, commitCustomers]);

  const deleteAddress = useCallback((id: string) => {
    setCustomer((c) => {
      if (!c) return c;
      let addresses = c.addresses.filter((x) => x.id !== id);
      if (addresses.length && !addresses.some((x) => x.isDefault)) addresses = addresses.map((x, i) => ({ ...x, isDefault: i === 0 }));
      const next = { ...c, addresses };
      commitCustomers(loadCustomers().map((x) => (x.id === c.id ? next : x)));
      return next;
    });
  }, [commitCustomers]);

  const myOrders = useMemo(
    () => (customer ? orders.filter((o) => o.customerId === customer.id) : []),
    [orders, customer]
  );

  const value: AppCtx = {
    view, navigate, articles, allArticles, userPosts, saveDraft, publishArticle, deleteUserPost, deleteArticle,
    herbs, saveHerb, deleteHerb, resetHerbs,
    products, saveProduct, deleteProduct,
    orders, placeOrder, updateOrderStatus, cancelOrder, cancelAndRestock,
    storeEnabled, setStoreEnabled, profileTabEnabled, setProfileTabEnabled,
    cart, addToCart, changeQty, removeLine, cartOpen, setCartOpen, checkoutIntent, setCheckoutIntent,
    customer, loginOtp, loginGoogle, loginEmail, registerEmail, logoutCustomer,
    updateCustomer, saveAddress, deleteAddress, myOrders, accountAuthOpen, setAccountAuthOpen,
    activity, logActivity,
    toasts, toast,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ================================ UI primitives ================================ */

export function readImageFile(file: File, cb: (dataUrl: string) => void, err: (msg: string) => void) {
  if (!file.type.startsWith("image/")) { err("That isn't an image file"); return; }
  if (file.size > 1.8 * 1024 * 1024) { err("Keep images under 1.8 MB for the demo"); return; }
  const r = new FileReader();
  r.onload = () => cb(String(r.result));
  r.onerror = () => err("Could not read that file");
  r.readAsDataURL(file);
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Reveal({
  children, className = "", delay = 0, as: Tag = "div",
}: { children: React.ReactNode; className?: string; delay?: number; as?: any }) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (reducedMotion()) { setSeen(true); return; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }),
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${seen ? "revealed" : ""} ${className}`} style={{ "--rv-delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </Tag>
  );
}

export function ScrambleText({ text, className = "" }: { text: string; className?: string }) {
  const [out, setOut] = useState(text);
  const done = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reducedMotion() || done.current) return;
    const el = ref.current;
    if (!el) return;
    const glyphs = "अआइउकखगचछजझञटठडढणतथदधनपफबभमयरलवशषसह";
    let frame = 0;
    const total = 26;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting || done.current) return;
        done.current = true;
        io.disconnect();
        const id = window.setInterval(() => {
          frame++;
          const locked = Math.floor((frame / total) * text.length);
          setOut(text.split("").map((ch, i) => (i < locked || ch === " " ? ch : glyphs[Math.floor(Math.random() * glyphs.length)])).join(""));
          if (frame >= total) { setOut(text); window.clearInterval(id); }
        }, 42);
      });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [text]);
  return <span ref={ref} className={className}>{out}</span>;
}

export function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  return (
    <Reveal className="max-w-2xl">
      <p className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.3em] text-gold-400">
        <span className="h-px w-10 bg-gold-500/60" /> {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-sand-100 sm:text-[2.6rem] sm:leading-[1.08]">
        {title}
      </h2>
      {sub && <p className="mt-4 text-[15px] leading-relaxed text-sand-200/60">{sub}</p>}
    </Reveal>
  );
}

export function Chip({ children, active, onClick, color }: { children: React.ReactNode; active?: boolean; onClick?: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-all duration-300 ${
        active ? "text-forest-950" : "text-sand-200/60 hover:text-sand-100"
      }`}
      style={active ? { background: color ?? "#d6b45f", borderColor: color ?? "#d6b45f" } : { borderColor: "var(--color-forest-700)" }}
    >
      {children}
    </button>
  );
}

export function Ticker({ items }: { items: { en: string; sa: string }[] }) {
  const row = items.map((it, i) => (
    <span key={i} className="mx-6 flex items-center gap-3">
      <span className="font-display text-lg italic text-gold-400/70">{it.sa}</span>
      <span className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-sand-200/35">{it.en}</span>
      <span className="text-gold-500/40">✦</span>
    </span>
  ));
  return (
    <div className="relative overflow-hidden border-y border-forest-800 bg-forest-900/60 py-3">
      <div className="animate-marquee flex w-max items-center whitespace-nowrap">
        <div className="flex items-center">{row}</div>
        <div className="flex items-center" aria-hidden>{row}</div>
      </div>
    </div>
  );
}

export function DoshaDots({ doshas }: { doshas: Dosha[] }) {
  const map: Record<Dosha, string> = { vata: "#93b1cf", pitta: "#e07f49", kapha: "#82b39e" };
  return (
    <span className="flex items-center gap-1.5">
      {doshas.map((d) => (
        <span key={d} className="h-2 w-2 rounded-full" style={{ background: map[d], boxShadow: `0 0 8px ${map[d]}66` }} title={d} />
      ))}
    </span>
  );
}

export function Monogram({ author, size = 40 }: { author: { initials: string; hue: string }; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-display font-semibold"
      style={{ width: size, height: size, background: `${author.hue}18`, color: author.hue, border: `1px solid ${author.hue}55`, fontSize: size * 0.36 }}
    >
      {author.initials}
    </span>
  );
}

export function GoldButton({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all duration-300 hover:bg-gold-300 hover:shadow-[0_0_28px_rgba(214,180,95,0.35)] active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

export function SmartImg({ src, alt, className = "", style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div className={`leaf-field grid place-items-center bg-forest-850 ${className}`} style={style}>
        <span className="font-display text-4xl italic text-gold-500/30">वै</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={className} style={style} onError={() => setErr(true)} />;
}

export function Tilt({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    if (reducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 10;
    const y = -((e.clientY - r.top) / r.height - 0.5) * 10;
    el.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ""; };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`tilt-3d ${className}`}>
      {children}
    </div>
  );
}

export function Stars({ rating, size = 13, onRate }: { rating: number; size?: number; onRate?: (n: number) => void }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          disabled={!onRate}
          onClick={() => onRate?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={onRate ? "transition-transform hover:scale-125" : "cursor-default"}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill={n <= Math.round(rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6"
            className={n <= Math.round(rating) ? "text-gold-400" : "text-forest-600"}>
            <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3Z" />
          </svg>
        </button>
      ))}
    </span>
  );
}
