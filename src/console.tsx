import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingBag, Users, FileText, Tags, BarChart3, Settings as SettingsIcon,
  ShieldCheck, Search, Bell, ChevronLeft, ChevronRight, LogOut, Database, Check, X, Plus, Trash2,
  Pencil, Download, Upload, AlertTriangle, TrendingUp, Truck, Printer, Eye, EyeOff, RefreshCw,
} from "lucide-react";
import { useApp, auth, SmartImg, Monogram, type StudioUser } from "./lib";
import { PRODUCTS, ORDER_META, ORDER_FLOW, formatDate, CATEGORIES, type Order, type Product, type OrderStatus } from "./data";

type CRole = "superadmin" | "editor" | "viewer";
type Page = "home" | "orders" | "products" | "customers" | "staff" | "content" | "marketing" | "analytics" | "settings";

/* ============================ firebase config store =========================== */

const FB_CONFIG_KEY = "vaidyagan_firebase_config";
const FB_MODE_KEY = "vaidyagan_console_mode";

interface FBConfig { apiKey: string; authDomain: string; projectId: string; storageBucket: string; messagingSenderId: string; appId: string }
const EMPTY_FB: FBConfig = { apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" };

function loadFB(): FBConfig {
  try {
    const raw = localStorage.getItem(FB_CONFIG_KEY);
    if (raw) return { ...EMPTY_FB, ...(JSON.parse(raw) as Partial<FBConfig>) };
  } catch { /* fresh */ }
  return EMPTY_FB;
}
function saveFB(c: FBConfig) { try { localStorage.setItem(FB_CONFIG_KEY, JSON.stringify(c)); } catch { /* ignore */ } }
function getMode(): "demo" | "live" {
  try { return (localStorage.getItem(FB_MODE_KEY) as "demo" | "live") || "demo"; } catch { return "demo"; }
}
function setMode(m: "demo" | "live") { try { localStorage.setItem(FB_MODE_KEY, m); } catch { /* ignore */ } }

export const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /admin_users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /admin_activity/{docId} {
      allow read, write: if request.auth != null;
    }
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
    }
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /customers/{customerId} {
      allow read, write: if request.auth != null;
    }
  }
}`;

/* ================================ ui helpers ================================ */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-forest-800 bg-forest-900/70 ${className}`}>{children}</div>;
}
function PageHead({ title, sub, children }: { title: string; sub: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold text-sand-100">{title}</h1>
        <p className="mt-1 text-[13.5px] text-sand-200/55">{sub}</p>
      </div>
      {children}
    </div>
  );
}
function EmptyState({ icon: Icon, title, hint }: { icon: any; title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed border-forest-700 p-14 text-center">
      <Icon size={32} className="mx-auto text-forest-600" />
      <p className="mt-4 font-display text-xl text-sand-200/70">{title}</p>
      <p className="mt-2 text-sm text-sand-200/45">{hint}</p>
    </div>
  );
}
function StatCard({ label, value, delta, icon: Icon, tone = "#d6b45f" }: { label: string; value: string; delta?: string; icon: any; tone?: string }) {
  return (
    <Card className="card-lift p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-sand-200/45">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${tone}14`, color: tone }}><Icon size={17} /></span>
      </div>
      <p className="display-num mt-3 text-3xl font-semibold text-sand-100">{value}</p>
      {delta && <p className="mt-1 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: tone }}><TrendingUp size={11} /> {delta}</p>}
    </Card>
  );
}
function SwitchRow({ on, onChange, label, desc, disabled }: { on: boolean; onChange: (b: boolean) => void; label: string; desc: string; disabled?: boolean }) {
  return (
    <button role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all ${disabled ? "cursor-not-allowed opacity-50" : ""} ${on ? "border-kapha-500/50 bg-kapha-500/8" : "border-forest-700 bg-forest-950/40 hover:border-forest-600"}`}>
      <span>
        <span className={`block text-[14px] font-semibold ${on ? "text-sand-100" : "text-sand-200/70"}`}>{label}</span>
        <span className="mt-0.5 block text-xs text-sand-200/45">{desc}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-kapha-500" : "bg-forest-700"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-sand-100 shadow transition-all duration-300 ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

/* ================================== shell =================================== */

export function AdminConsole() {
  const { orders, products, allArticles, herbs, saveProduct, updateOrderStatus, cancelAndRestock, toast, logActivity, navigate, storeEnabled, setStoreEnabled } = useApp();
  const [member, setMember] = useState<StudioUser | null>(() => auth.session());
  const [page, setPage] = useState<Page>("home");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mode, setModeState] = useState<"demo" | "live">(getMode);
  const [fb, setFb] = useState<FBConfig>(loadFB);
  const [query, setQuery] = useState("");
  const [bellOpen, setBellOpen] = useState(false);

  const role: CRole = member?.consoleRole ?? "viewer";
  const can = (p: Page) => {
    if (role === "superadmin") return true;
    if (role === "editor") return ["home", "orders", "products", "content", "analytics"].includes(p);
    return ["home", "analytics"].includes(p);
  };

  useEffect(() => {
    if (!member) return;
    if (!can(page)) setPage("home");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member, page]);

  if (!member || !member.consoleAccess) {
    return <ConsoleGate member={member} onLogin={setMember} onBack={() => navigate({ name: "home" })} />;
  }

  const allNav: { key: Page; label: string; icon: any }[] = [
    { key: "home", label: "Home", icon: LayoutDashboard },
    { key: "orders", label: "Orders", icon: ShoppingBag },
    { key: "products", label: "Products", icon: Package },
    { key: "customers", label: "Customers", icon: Users },
    { key: "staff", label: "Staff & Access", icon: ShieldCheck },
    { key: "content", label: "Content", icon: FileText },
    { key: "marketing", label: "Marketing", icon: Tags },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ];
  const nav = allNav.filter((n) => can(n.key));

  const notifications = [
    { id: 1, text: `${orders.filter((o) => o.status === "new").length} new order${orders.filter((o) => o.status === "new").length === 1 ? "" : "s"} waiting`, tone: "#d6b45f" },
    { id: 2, text: `${products.filter((p) => p.stock < 5).length} product${products.filter((p) => p.stock < 5).length === 1 ? "" : "s"} low on stock`, tone: "#e07f49" },
    { id: 3, text: `${allArticles.filter((a) => a.status === "review").length} article${allArticles.filter((a) => a.status === "review").length === 1 ? "" : "s"} in review`, tone: "#93b1cf" },
  ];

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const res: { type: string; label: string; go: Page }[] = [];
    orders.filter((o) => o.id.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q)).slice(0, 4).forEach((o) => res.push({ type: "Order", label: `${o.id} — ${o.customer.name}`, go: "orders" }));
    products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 4).forEach((p) => res.push({ type: "Product", label: p.name, go: "products" }));
    allArticles.filter((a) => a.title.toLowerCase().includes(q)).slice(0, 4).forEach((a) => res.push({ type: "Post", label: a.title, go: "content" }));
    return res.slice(0, 8);
  }, [query, orders, products, allArticles]);

  const sidebar = (
    <div className={`flex h-full flex-col ${collapsed ? "w-[72px]" : "w-64"} transition-all duration-300`}>
      <div className="flex items-center gap-3 border-b border-forest-800 px-4 py-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-gold-500/60 bg-gold-400/10 text-gold-300"><ShieldCheck size={19} /></span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold leading-none text-sand-100">Vaidyagan</p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.24em] text-gold-400/80">Admin Console</p>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map((n) => (
          <button key={n.key} onClick={() => { setPage(n.key); setMobileOpen(false); }} title={n.label}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-all ${page === n.key ? "bg-gold-400/12 text-gold-300" : "text-sand-200/55 hover:bg-forest-850 hover:text-sand-100"} ${collapsed ? "justify-center" : ""}`}>
            <n.icon size={17} className="shrink-0" />
            {!collapsed && n.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-forest-800 p-3">
        <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden w-full items-center justify-center gap-2 rounded-xl border border-forest-700 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/50 hover:border-gold-400 hover:text-gold-300 lg:flex">
          {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /> Collapse</>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-forest-950">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r border-forest-800 bg-forest-900/60 lg:block">{sidebar}</aside>
      {/* mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed inset-y-0 left-0 z-[60] border-r border-forest-800 bg-forest-900 lg:hidden">{sidebar}</motion.aside>
        )}
      </AnimatePresence>
      {mobileOpen && <div className="fixed inset-0 z-[55] bg-forest-950/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="sticky top-0 z-40 border-b border-forest-800 bg-forest-950/90 backdrop-blur-md">
          <div className="flex items-center gap-3 px-5 py-3.5 lg:px-8">
            <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200/70 lg:hidden"><ChevronRight size={16} className="rotate-180" /></button>
            <span className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] ${mode === "live" ? "border-kapha-500/50 bg-kapha-500/10 text-kapha-300" : "border-gold-500/50 bg-gold-400/10 text-gold-300"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${mode === "live" ? "bg-kapha-400" : "animate-blink bg-gold-400"}`} />
              {mode === "live" ? "Live · Firestore" : "Demo · local"}
            </span>

            <div className="relative ml-auto hidden w-72 md:block">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand-200/40" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search orders, products, posts…" aria-label="Global search"
                className="w-full rounded-full border border-forest-700 bg-forest-900/80 py-2.5 pl-10 pr-4 text-sm text-sand-100 placeholder:text-sand-200/35 focus:border-gold-400 focus:outline-none" />
              {query && searchResults.length > 0 && (
                <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-forest-700 bg-forest-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  {searchResults.map((r, i) => (
                    <button key={i} onClick={() => { setPage(r.go); setQuery(""); }} className="flex w-full items-center gap-3 border-b border-forest-800 px-4 py-3 text-left last:border-0 hover:bg-forest-850">
                      <span className="rounded-full border border-forest-700 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-gold-300">{r.type}</span>
                      <span className="truncate text-[13px] text-sand-200/80">{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setBellOpen(!bellOpen)} aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300">
                <Bell size={16} />
                <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-ember-400 font-mono text-[8px] font-bold text-forest-950">{notifications.length}</span>
              </button>
              <AnimatePresence>
                {bellOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-xl border border-forest-700 bg-forest-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="border-b border-forest-800 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-gold-400">Needs attention</div>
                    {notifications.map((n) => (
                      <div key={n.id} className="flex items-center gap-3 border-b border-forest-800 px-4 py-3 last:border-0">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: n.tone }} />
                        <span className="text-[12.5px] text-sand-200/75">{n.text}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2.5">
              <Monogram author={{ initials: member.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase(), hue: member.hue }} size={34} />
              <div className="hidden sm:block">
                <p className="text-[12.5px] font-semibold leading-none text-sand-100">{member.name}</p>
                <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-gold-400/80">{role}</p>
              </div>
              <button onClick={() => { auth.logout(); setMember(null); navigate({ name: "home" }); }} aria-label="Sign out" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200/70 hover:border-ember-400 hover:text-ember-300"><LogOut size={15} /></button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-8 lg:px-8">
          {page === "home" && <HomePage role={role} mode={mode} goTo={setPage} />}
          {page === "orders" && can("orders") && <OrdersPage role={role} />}
          {page === "products" && can("products") && <ProductsPage role={role} />}
          {page === "customers" && can("customers") && <CustomersPage />}
          {page === "staff" && can("staff") && <StaffPage />}
          {page === "content" && can("content") && <ContentPage role={role} />}
          {page === "marketing" && can("marketing") && <MarketingPage />}
          {page === "analytics" && can("analytics") && <AnalyticsPage />}
          {page === "settings" && can("settings") && <SettingsPage mode={mode} setMode={(m) => { setMode(m); setModeState(m); }} fb={fb} setFb={setFb} />}
        </main>
      </div>
    </div>
  );
}

/* -------------------------------- console gate ------------------------------ */

function ConsoleGate({ member, onLogin, onBack }: { member: StudioUser | null; onLogin: (u: StudioUser) => void; onBack: () => void }) {
  const { toast } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = auth.login(username, password);
    if (!u) { setError("Incorrect username or password."); return; }
    if (!u.consoleAccess) { setError("This account doesn't have Admin Console access. Ask a superadmin to grant it."); return; }
    toast(`Welcome, ${u.name}`);
    onLogin(u);
  };

  return (
    <div className="ops-grid flex min-h-screen items-center justify-center bg-forest-950 px-5">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-2xl border border-forest-700 bg-forest-900/90 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-gold-500/60 bg-gold-400/10 text-gold-300"><ShieldCheck size={21} /></span>
            <div>
              <p className="font-display text-2xl font-semibold text-sand-100">Admin Console</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-gold-400/80">Superadmin access required</p>
            </div>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-3.5">
            <input value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} placeholder="Username" className="w-full rounded-xl border border-forest-700 bg-forest-950/70 px-4 py-3 text-[15px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Password" className="w-full rounded-xl border border-forest-700 bg-forest-950/70 px-4 py-3 text-[15px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
            {error && <p className="rounded-lg border border-ember-500/40 bg-ember-500/10 px-4 py-2.5 text-[12.5px] text-ember-300">{error}</p>}
            <button type="submit" className="gold-sheen w-full rounded-xl bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-forest-950 hover:bg-gold-300">Enter console</button>
          </form>
          <button onClick={onBack} className="mt-4 w-full text-center font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/40 hover:text-gold-300">← Back to the website</button>
          <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/30">Demo — monesh / admin91466</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------------------------- home ------------------------------------ */

function HomePage({ role, mode, goTo }: { role: CRole; mode: "demo" | "live"; goTo: (p: Page) => void }) {
  const { orders, products, allArticles, activity } = useApp();
  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const low = products.filter((p) => p.stock < 5).length;
  const newOrders = orders.filter((o) => o.status === "new").length;

  const attention = [
    { label: `${newOrders} new order${newOrders === 1 ? "" : "s"} to pack`, go: "orders" as Page, show: newOrders > 0, tone: "#d6b45f" },
    { label: `${low} product${low === 1 ? "" : "s"} low on stock`, go: "products" as Page, show: low > 0, tone: "#e07f49" },
    { label: `${allArticles.filter((a) => a.status === "review").length} article(s) pending review`, go: "content" as Page, show: allArticles.filter((a) => a.status === "review").length > 0, tone: "#93b1cf" },
  ].filter((a) => a.show && (role === "superadmin" || a.go !== "content" || role === "editor"));

  return (
    <div>
      <PageHead title="Good day, doctor." sub={`Here's what's happening across Vaidyagan — running in ${mode === "live" ? "Live (Firestore)" : "Demo"} mode.`} />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue (all time)" value={`₹${revenue.toLocaleString("en-IN")}`} delta="across all orders" icon={TrendingUp} />
        <StatCard label="Orders" value={String(orders.length)} delta={`${newOrders} new`} icon={ShoppingBag} tone="#93b1cf" />
        <StatCard label="Low-stock products" value={String(low)} delta="need restocking" icon={AlertTriangle} tone="#e07f49" />
        <StatCard label="Published essays" value={String(allArticles.filter((a) => a.status === "published").length)} delta="on the journal" icon={FileText} tone="#82b39e" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Needs attention</p>
          <div className="mt-4 space-y-2.5">
            {attention.length === 0 && <p className="rounded-lg border border-dashed border-forest-700 p-6 text-center text-sm text-sand-200/45">All clear — nothing waiting.</p>}
            {attention.map((a) => (
              <button key={a.label} onClick={() => goTo(a.go)} className="flex w-full items-center gap-3 rounded-xl border border-forest-800 bg-forest-850/50 px-4 py-3 text-left transition-all hover:border-gold-500/50">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: a.tone }} />
                <span className="flex-1 text-[13px] text-sand-200/80">{a.label}</span>
                <ChevronRight size={15} className="text-sand-200/30" />
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Recent activity</p>
          <div className="mt-4 space-y-2.5">
            {activity.length === 0 && <p className="rounded-lg border border-dashed border-forest-700 p-6 text-center text-sm text-sand-200/45">Actions you take will appear here.</p>}
            {activity.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border border-forest-800 bg-forest-850/40 px-4 py-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] text-sand-200/80">{a.action}</p>
                  <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-sand-200/35">{a.actor} · {new Date(a.at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------- orders ---------------------------------- */

function OrdersPage({ role }: { role: CRole }) {
  const { orders, updateOrderStatus, cancelAndRestock, toast, logActivity } = useApp();
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const canEdit = role !== "viewer";

  const filtered = orders.filter((o) => status === "all" || o.status === status);
  const open = orders.find((o) => o.id === openId) ?? null;
  const counts = (s: OrderStatus) => orders.filter((o) => o.status === s).length;

  const advance = (o: Order) => {
    const idx = ORDER_FLOW.indexOf(o.status as any);
    if (idx < 0 || idx >= ORDER_FLOW.length - 1) return;
    const next = ORDER_FLOW[idx + 1];
    updateOrderStatus(o.id, next);
    logActivity("store", `moved order ${o.id} to ${ORDER_META[next].label}`, o.id);
    toast(`${o.id} → ${ORDER_META[next].label}`);
  };

  return (
    <div>
      <PageHead title="Orders" sub="Track, advance and fulfil customer orders." />
      <div className="mb-5 flex flex-wrap gap-2">
        <button onClick={() => setStatus("all")} className={`rounded-full border px-4 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] ${status === "all" ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55"}`}>All · {orders.length}</button>
        {ORDER_FLOW.concat(["cancelled"] as OrderStatus[]).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full border px-4 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] ${status === s ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55"}`}>{ORDER_META[s].label} · {counts(s)}</button>
        ))}
      </div>

      {filtered.length === 0 ? <EmptyState icon={ShoppingBag} title="No orders here" hint="Orders placed at checkout appear in this list." /> : (
        <Card>
          <div className="hidden grid-cols-[100px_1.4fr_1fr_100px_120px_110px] gap-3 border-b border-forest-800 px-5 py-3 font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/40 md:grid">
            <span>Order</span><span>Customer</span><span>Items</span><span>Status</span><span>Total</span><span />
          </div>
          {filtered.map((o) => (
            <div key={o.id} className="grid grid-cols-2 items-center gap-3 border-b border-forest-800 px-5 py-4 transition-colors last:border-0 hover:bg-forest-850/50 md:grid-cols-[100px_1.4fr_1fr_100px_120px_110px]">
              <span className="font-mono text-[12px] font-semibold text-gold-300">{o.id}</span>
              <span className="truncate text-[13px] font-semibold text-sand-100">{o.customer.name}<span className="block font-mono text-[8.5px] uppercase tracking-[0.1em] text-sand-200/35">{formatDate(o.placedAt)}</span></span>
              <span className="hidden truncate text-[12px] text-sand-200/60 md:block">{o.items.map((i) => i.name).join(", ")}</span>
              <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.1em] ${ORDER_META[o.status].cls}`}>{ORDER_META[o.status].label}</span>
              <span className="font-display text-[15px] font-semibold text-sand-100">₹{o.total.toLocaleString("en-IN")}</span>
              <span className="flex justify-end gap-1.5">
                {canEdit && o.status !== "delivered" && o.status !== "cancelled" && (
                  <button onClick={() => advance(o)} title="Advance status" className="grid h-8 w-8 place-items-center rounded-lg border border-forest-700 text-sand-200/60 hover:border-kapha-400 hover:text-kapha-300"><Truck size={14} /></button>
                )}
                <button onClick={() => setOpenId(o.id)} title="Open order" className="grid h-8 w-8 place-items-center rounded-lg border border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Eye size={14} /></button>
              </span>
            </div>
          ))}
        </Card>
      )}

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[65] flex items-end justify-center bg-forest-950/80 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setOpenId(null)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-forest-700 bg-forest-900 p-6 sm:rounded-2xl sm:p-7" role="dialog" aria-label={`Order ${open.id}`}>
              <div className="flex items-center justify-between">
                <p className="font-display text-2xl font-semibold text-sand-100">{open.id}</p>
                <button onClick={() => setOpenId(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={15} /></button>
              </div>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/45">{formatDate(open.placedAt)} · {open.paymentMethod ?? "—"}</p>
              <div className="mt-4 rounded-xl border border-forest-800 bg-forest-850/50 p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-gold-400">Ship to</p>
                <p className="mt-1.5 text-[13.5px] font-semibold text-sand-100">{open.customer.name}</p>
                <p className="text-[12.5px] text-sand-200/65">{open.customer.address}, {open.customer.city} — {open.customer.pin}</p>
                <p className="text-[12.5px] text-sand-200/65">{open.customer.phone}</p>
              </div>
              <div className="mt-4 space-y-2">
                {open.items.map((i, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-lg border border-forest-800 bg-forest-850/40 px-3.5 py-2.5">
                    {i.image ? <SmartImg src={i.image} alt={i.name} className="h-11 w-11 rounded-lg object-cover duotone" /> : <span className="grid h-11 w-11 place-items-center rounded-lg border border-forest-800 bg-forest-850 font-display text-gold-500/40">वै</span>}
                    <span className="min-w-0 flex-1 truncate text-[13px] text-sand-200/80">{i.name} <span className="text-sand-200/40">× {i.qty}</span></span>
                    <span className="font-mono text-[12px] text-sand-100">₹{(i.price * i.qty).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <p className="font-display text-xl font-semibold text-gold-300">Total ₹{open.total.toLocaleString("en-IN")}</p>
              </div>
              {role !== "viewer" && (open.status === "new" || open.status === "processing" || open.status === "shipped" || open.status === "out") && (
                <div className="mt-5 flex gap-2.5">
                  <button onClick={() => { advance(open); }} className="gold-sheen flex flex-1 items-center justify-center gap-2 rounded-full bg-kapha-500 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:brightness-110"><Truck size={14} /> Advance status</button>
                  <button onClick={() => { cancelAndRestock(open.id); logActivity("store", `cancelled order ${open.id} & restocked`, open.id); toast(`Order ${open.id} cancelled — stock returned`); setOpenId(null); }} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-ember-500/50 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ember-300 hover:bg-ember-500/10"><X size={14} /> Cancel & restock</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------- products --------------------------------- */

function ProductsPage({ role }: { role: CRole }) {
  const { products, saveProduct, deleteProduct, toast, logActivity } = useApp();
  const [view, setView] = useState<"cards" | "table">("cards");
  const [editing, setEditing] = useState<Product | null>(null);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const canEdit = role !== "viewer";

  const filtered = products.filter((p) => (cat === "All" || p.category === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase())));

  const quickStock = (p: Product, stock: number) => {
    const next = Math.max(0, stock);
    saveProduct({ ...p, stock: next });
    if (next < 5) toast(`${p.name} is low on stock (${next})`);
  };

  return (
    <div>
      <PageHead title="Products & Inventory" sub="Manage the formulation store, stock levels and visibility.">
        {canEdit && <button onClick={() => setEditing({ id: `prod-${Date.now()}`, name: "", sanskrit: "", price: 0, mrp: 0, image: "", category: "Oils", stock: 10, rating: 4.5, dosage: "", ingredients: [], desc: "" })} className="gold-sheen flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Plus size={15} /> Add New Product</button>}
      </PageHead>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 md:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand-200/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full rounded-full border border-forest-700 bg-forest-900/80 py-2.5 pl-10 pr-4 text-sm text-sand-100 placeholder:text-sand-200/35 focus:border-gold-400 focus:outline-none" />
        </div>
        {["All", "Oils", "Churnas", "Capsules", "Ghritas", "Kadhas"].map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] ${cat === c ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55"}`}>{c}</button>
        ))}
        <div className="ml-auto flex rounded-full border border-forest-700 p-1">
          <button onClick={() => setView("cards")} aria-label="Card view" className={`rounded-full px-3 py-1.5 ${view === "cards" ? "bg-gold-400/15 text-gold-300" : "text-sand-200/50"}`}><Package size={14} /></button>
          <button onClick={() => setView("table")} aria-label="Table view" className={`rounded-full px-3 py-1.5 ${view === "table" ? "bg-gold-400/15 text-gold-300" : "text-sand-200/50"}`}><LayoutDashboard size={14} /></button>
        </div>
      </div>

      {filtered.length === 0 ? <EmptyState icon={Package} title="No products match" hint="Adjust the search or add a new product." /> : view === "cards" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} className={`card-lift overflow-hidden ${p.stock <= 0 ? "opacity-60" : ""}`}>
              <SmartImg src={p.image} alt={p.name} className="aspect-[16/10] w-full object-cover duotone" style={p.duotone ? { filter: p.duotone } : undefined} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-[16px] font-semibold leading-snug text-sand-100">{p.name}</p>
                  {p.stock < 5 && <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] ${p.stock <= 0 ? "border-forest-600 text-sand-200/50" : "border-ember-500/50 text-ember-300"}`}>{p.stock <= 0 ? "Out" : `Low · ${p.stock}`}</span>}
                </div>
                <p className="mt-1 font-mono text-[10px] text-gold-300">₹{p.price} · {p.category}</p>
                {canEdit && (
                  <div className="mt-4 flex items-center gap-2">
                    <button onClick={() => quickStock(p, p.stock - 1)} aria-label="Decrease stock" className="grid h-8 w-8 place-items-center rounded-lg border border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300">−</button>
                    <span className="w-10 text-center font-mono text-[13px] text-sand-100">{p.stock}</span>
                    <button onClick={() => quickStock(p, p.stock + 1)} aria-label="Increase stock" className="grid h-8 w-8 place-items-center rounded-lg border border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300">+</button>
                    <span className="ml-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-sand-200/40">stock</span>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <SwitchRowMini on={p.visible !== false} onChange={(b) => { if (!canEdit) return; saveProduct({ ...p, visible: b }); toast(b ? `${p.name} visible in store` : `${p.name} hidden from store`); }} />
                  {canEdit && <button onClick={() => setEditing(p)} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Pencil size={12} /> Edit</button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="hidden grid-cols-[1.4fr_100px_90px_90px_110px] gap-3 border-b border-forest-800 px-5 py-3 font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/40 md:grid"><span>Product</span><span>Price</span><span>Stock</span><span>Status</span><span /></div>
          {filtered.map((p) => (
            <div key={p.id} className="grid grid-cols-2 items-center gap-3 border-b border-forest-800 px-5 py-3.5 last:border-0 hover:bg-forest-850/50 md:grid-cols-[1.4fr_100px_90px_90px_110px]">
              <span className="flex items-center gap-3"><SmartImg src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover duotone" /><span className="truncate text-[13px] font-semibold text-sand-100">{p.name}</span></span>
              <span className="font-mono text-[12px] text-gold-300">₹{p.price}</span>
              <span className={`font-mono text-[12px] ${p.stock < 5 ? "text-ember-300" : "text-sand-200/70"}`}>{p.stock}</span>
              <span className={`font-mono text-[8.5px] uppercase tracking-[0.1em] ${p.visible !== false ? "text-kapha-300" : "text-sand-200/40"}`}>{p.visible !== false ? "Live" : "Hidden"}</span>
              {canEdit && <button onClick={() => setEditing(p)} className="justify-self-end rounded-full border border-forest-700 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">Edit</button>}
            </div>
          ))}
        </Card>
      )}

      <AnimatePresence>
        {editing && <ProductEditor product={editing} onClose={() => setEditing(null)} onSave={(p) => { saveProduct(p); logActivity("store", `saved product "${p.name}"`, p.name); toast(`${p.name} saved`); setEditing(null); }} />}
      </AnimatePresence>
    </div>
  );
}

function SwitchRowMini({ on, onChange }: { on: boolean; onChange: (b: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${on ? "bg-kapha-500" : "bg-forest-700"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-sand-100 shadow transition-all duration-300 ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function ProductEditor({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (p: Product) => void }) {
  const [p, setP] = useState<Product>(product);
  const inp = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
  const lbl = "mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/45";
  const set = (patch: Partial<Product>) => setP((x) => ({ ...x, ...patch }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[65] flex items-end justify-center bg-forest-950/80 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-forest-700 bg-forest-900 p-6 sm:rounded-2xl sm:p-7" role="dialog" aria-label="Edit product">
        <div className="flex items-center justify-between">
          <p className="font-display text-2xl font-semibold text-sand-100">{product.name ? "Edit product" : "Add New Product"}</p>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={15} /></button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={lbl}>Product name *</label><input value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Triphala Churna" className={inp} /></div>
          <div><label className={lbl}>Sanskrit</label><input value={p.sanskrit} onChange={(e) => set({ sanskrit: e.target.value })} placeholder="त्रिफला" className={inp} /></div>
          <div><label className={lbl}>Category</label>
            <select value={p.category} onChange={(e) => set({ category: e.target.value as Product["category"] })} className={inp}>
              {["Oils", "Churnas", "Capsules", "Ghritas", "Kadhas"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Price (₹)</label><input type="number" value={p.price} onChange={(e) => set({ price: Number(e.target.value) })} className={inp} /></div>
          <div><label className={lbl}>MRP (₹)</label><input type="number" value={p.mrp} onChange={(e) => set({ mrp: Number(e.target.value) })} className={inp} /></div>
          <div><label className={lbl}>Quantity in stock</label><input type="number" value={p.stock} onChange={(e) => set({ stock: Number(e.target.value) })} className={inp} /></div>
          <div><label className={lbl}>Badge</label><input value={p.badge ?? ""} onChange={(e) => set({ badge: e.target.value })} placeholder="e.g. Bestseller" className={inp} /></div>
          <div className="sm:col-span-2"><label className={lbl}>Image URL (or leave blank)</label><input value={p.image} onChange={(e) => set({ image: e.target.value })} placeholder="https://…" className={inp} /></div>
          <div className="sm:col-span-2"><label className={lbl}>Dosage</label><input value={p.dosage} onChange={(e) => set({ dosage: e.target.value })} placeholder="3–6 g at bedtime with warm water" className={inp} /></div>
          <div className="sm:col-span-2"><label className={lbl}>Ingredients (comma separated)</label><input value={p.ingredients.join(", ")} onChange={(e) => set({ ingredients: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className={inp} /></div>
          <div className="sm:col-span-2"><label className={lbl}>Description</label><textarea value={p.desc} onChange={(e) => set({ desc: e.target.value })} rows={3} className={inp} /></div>
        </div>
        <div className="mt-4"><SwitchRowMini on={p.visible !== false} onChange={(b) => set({ visible: b })} /> <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/50">{p.visible !== false ? "Shown in store" : "Hidden from store"}</span></div>
        <div className="mt-6 flex gap-2.5">
          <button onClick={() => onSave(p)} disabled={!p.name.trim()} className="gold-sheen flex-1 rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300 disabled:opacity-35">Save product</button>
          <button onClick={onClose} className="rounded-full border border-forest-700 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200/60 hover:text-sand-100">Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* --------------------------------- customers -------------------------------- */

function CustomersPage() {
  const { orders } = useApp();
  const customers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; contact: string; orders: number; spent: number; joined: string }>();
    orders.forEach((o) => {
      const key = o.customerId ?? o.customer.name;
      const existing = map.get(key);
      if (existing) { existing.orders += 1; existing.spent += o.total; }
      else map.set(key, { id: key, name: o.customer.name, contact: o.customer.phone, orders: 1, spent: o.total, joined: o.placedAt });
    });
    return [...map.values()];
  }, [orders]);

  return (
    <div>
      <PageHead title="Customers" sub="Everyone who has ordered from the store." />
      {customers.length === 0 ? <EmptyState icon={Users} title="No customers yet" hint="Shoppers appear here after their first order." /> : (
        <Card>
          <div className="hidden grid-cols-[1.4fr_1fr_80px_120px_120px] gap-3 border-b border-forest-800 px-5 py-3 font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/40 md:grid"><span>Customer</span><span>Contact</span><span>Orders</span><span>Total spent</span><span>Joined</span></div>
          {customers.map((c) => (
            <div key={c.id} className="grid grid-cols-2 items-center gap-3 border-b border-forest-800 px-5 py-4 last:border-0 hover:bg-forest-850/50 md:grid-cols-[1.4fr_1fr_80px_120px_120px]">
              <span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full border border-gold-500/40 bg-gold-400/10 font-display text-sm text-gold-300">{c.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}</span><span className="truncate text-[13px] font-semibold text-sand-100">{c.name}</span></span>
              <span className="truncate font-mono text-[11px] text-sand-200/60">{c.contact}</span>
              <span className="font-mono text-[12px] text-sand-200/70">{c.orders}</span>
              <span className="font-display text-[14px] font-semibold text-gold-300">₹{c.spent.toLocaleString("en-IN")}</span>
              <span className="font-mono text-[10px] text-sand-200/45">{formatDate(c.joined)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ----------------------------------- staff ---------------------------------- */

function StaffPage() {
  const { toast, logActivity } = useApp();
  const [, force] = useState(0);
  const refresh = () => force((x) => x + 1);
  const users = auth.list();
  const me = auth.session();

  const roleDesc: Record<CRole, string> = {
    superadmin: "Full control — roles, access, store, settings.",
    editor: "Can view and edit orders, products and content.",
    viewer: "Read-only — home and analytics only.",
  };

  const setConsoleRole = (u: StudioUser, r: CRole) => {
    auth.setPerms(u.id, { consoleRole: r, consoleAccess: true });
    logActivity("member", `set ${u.name}'s console role to ${r}`);
    toast(`${u.name} is now a console ${r}`);
    refresh();
  };
  const toggleAccess = (u: StudioUser, on: boolean) => {
    if (u.id === me?.id) { toast("You can't revoke your own console access"); return; }
    auth.setPerms(u.id, { consoleAccess: on });
    logActivity("member", on ? `granted ${u.name} console access` : `revoked ${u.name}'s console access`);
    toast(on ? `${u.name} can open the console` : `${u.name} locked out of the console`);
    refresh();
  };

  return (
    <div>
      <PageHead title="Staff & Access" sub="Control who can open the Admin Console and what they can do." />
      <Card>
        <div className="hidden grid-cols-[1.4fr_1.2fr_1fr_120px] gap-3 border-b border-forest-800 px-5 py-3 font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/40 md:grid"><span>Member</span><span>Console role</span><span>What they can do</span><span>Dashboard access</span></div>
        {users.map((u) => (
          <div key={u.id} className="grid grid-cols-2 items-center gap-3 border-b border-forest-800 px-5 py-4 last:border-0 hover:bg-forest-850/50 md:grid-cols-[1.4fr_1.2fr_1fr_120px]">
            <span className="flex items-center gap-3"><Monogram author={{ initials: u.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase(), hue: u.hue }} size={36} /><span className="min-w-0"><span className="block truncate text-[13px] font-semibold text-sand-100">{u.name}</span><span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-sand-200/40">@{u.username} · {u.role}</span></span></span>
            <select value={u.consoleRole} disabled={u.id === me?.id} onChange={(e) => setConsoleRole(u, e.target.value as CRole)} className="w-full max-w-[180px] rounded-lg border border-forest-700 bg-forest-950/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-sand-100 focus:border-gold-400 focus:outline-none disabled:opacity-50">
              <option value="superadmin">Superadmin</option><option value="editor">Editor</option><option value="viewer">Viewer</option>
            </select>
            <span className="hidden text-[11.5px] leading-snug text-sand-200/50 md:block">{roleDesc[u.consoleRole]}</span>
            <SwitchRowMini on={u.consoleAccess} onChange={(b) => toggleAccess(u, b)} />
          </div>
        ))}
      </Card>
      <p className="mt-4 text-[12px] text-sand-200/40">Revoking access locks the member out of the console immediately — they see a locked screen, not the dashboard. The last active superadmin can't be locked out.</p>
    </div>
  );
}

/* ---------------------------------- content --------------------------------- */

function ContentPage({ role }: { role: CRole }) {
  const { allArticles, saveDraft, publishArticle, deleteArticle, toast, logActivity } = useApp();
  const [status, setStatus] = useState<"all" | "published" | "review" | "draft">("all");
  const canEdit = role !== "viewer";
  const filtered = allArticles.filter((a) => status === "all" || a.status === status);

  return (
    <div>
      <PageHead title="Content" sub="Approve submissions, publish and manage journal essays." />
      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "published", "review", "draft"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full border px-4 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] capitalize ${status === s ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55"}`}>{s} · {allArticles.filter((a) => a.status === s).length}</button>
        ))}
      </div>
      {filtered.length === 0 ? <EmptyState icon={FileText} title="Nothing here" hint="Articles matching this status will appear here." /> : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center gap-4 p-4">
              {a.cover ? <SmartImg src={a.cover} alt={a.title} className="h-14 w-20 shrink-0 rounded-lg object-cover duotone" /> : <div className="leaf-field grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-forest-850 font-display text-gold-500/30">वै</div>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-sand-100">{a.title || "Untitled"}</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-sand-200/40">{formatDate(a.date)} · <span className={a.status === "published" ? "text-kapha-300" : a.status === "review" ? "text-ember-300" : "text-sand-200/50"}>{a.status}</span></p>
              </div>
              {canEdit && a.status === "review" && (
                <button onClick={() => { publishArticle(a); logActivity("approve", `approved & published "${a.title}"`, a.title); toast(`"${a.title}" is live`); }} className="gold-sheen flex items-center gap-1.5 rounded-full bg-kapha-500 px-4 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-forest-950 hover:brightness-110"><Check size={12} /> Approve</button>
              )}
              {canEdit && a.status === "published" && (
                <button onClick={() => { saveDraft({ ...a, status: "draft" }); logActivity("edit", `unpublished "${a.title}"`, a.title); toast("Moved back to drafts"); }} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">Unpublish</button>
              )}
              {canEdit && (
                <button onClick={() => { deleteArticle(a.id); logActivity("edit", `deleted "${a.title}"`, a.title); toast("Article deleted"); }} aria-label={`Delete ${a.title}`} className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200/40 hover:border-ember-400 hover:text-ember-300"><Trash2 size={13} /></button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- marketing -------------------------------- */

function MarketingPage() {
  const { toast } = useApp();
  const [codes, setCodes] = useState(() => {
    try {
      const raw = localStorage.getItem("vaidyagan_discount_codes");
      if (raw) return JSON.parse(raw) as { code: string; type: "percent" | "flat"; value: number; active: boolean }[];
    } catch { /* fresh */ }
    return [{ code: "WELCOME10", type: "percent" as const, value: 10, active: true }];
  });
  const [form, setForm] = useState({ code: "", type: "percent" as "percent" | "flat", value: 10 });

  const persist = (list: typeof codes) => { setCodes(list); try { localStorage.setItem("vaidyagan_discount_codes", JSON.stringify(list)); } catch { /* ignore */ } };
  const add = () => {
    if (!form.code.trim()) { toast("Enter a code"); return; }
    if (codes.some((c) => c.code.toUpperCase() === form.code.trim().toUpperCase())) { toast("That code already exists"); return; }
    persist([...codes, { code: form.code.trim().toUpperCase(), type: form.type, value: form.value, active: true }]);
    setForm({ code: "", type: "percent", value: 10 });
    toast("Discount code created");
  };

  return (
    <div>
      <PageHead title="Marketing" sub="Discount codes applied automatically at checkout." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Create a code</p>
          <div className="mt-4 space-y-3">
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. FESTIVE15" className="w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm uppercase text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setForm({ ...form, type: "percent" })} className={`flex-1 rounded-lg border py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] ${form.type === "percent" ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55"}`}>% off</button>
              <button onClick={() => setForm({ ...form, type: "flat" })} className={`flex-1 rounded-lg border py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] ${form.type === "flat" ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55"}`}>₹ off</button>
            </div>
            <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 focus:border-gold-400 focus:outline-none" />
            <button onClick={add} className="gold-sheen flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Plus size={14} /> Create code</button>
          </div>
        </Card>
        <Card className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Active codes</p>
          <div className="mt-4 space-y-2.5">
            {codes.length === 0 && <p className="rounded-lg border border-dashed border-forest-700 p-6 text-center text-sm text-sand-200/45">No codes yet.</p>}
            {codes.map((c) => (
              <div key={c.code} className="flex items-center gap-3 rounded-xl border border-forest-800 bg-forest-850/50 px-4 py-3">
                <span className="rounded-lg border border-gold-500/40 bg-gold-400/10 px-3 py-1.5 font-mono text-[12px] font-semibold tracking-[0.14em] text-gold-300">{c.code}</span>
                <span className="font-mono text-[11px] text-sand-200/60">{c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`}</span>
                <span className="ml-auto" />
                <SwitchRowMini on={c.active} onChange={(b) => persist(codes.map((x) => (x.code === c.code ? { ...x, active: b } : x)))} />
                <button onClick={() => persist(codes.filter((x) => x.code !== c.code))} aria-label={`Delete ${c.code}`} className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200/40 hover:border-ember-400 hover:text-ember-300"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* --------------------------------- analytics -------------------------------- */

function AnalyticsPage() {
  const { orders, products } = useApp();
  const days = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400e3).toISOString().slice(0, 10);
      map.set(d, 0);
    }
    orders.forEach((o) => {
      const d = o.placedAt.slice(0, 10);
      if (map.has(d)) map.set(d, (map.get(d) ?? 0) + o.total);
    });
    return [...map.entries()];
  }, [orders]);
  const max = Math.max(1, ...days.map(([, v]) => v));
  const statusCounts = (["new", "processing", "shipped", "out", "delivered", "cancelled"] as OrderStatus[]).map((s) => ({ s, n: orders.filter((o) => o.status === s).length }));
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number }>();
    orders.forEach((o) => o.items.forEach((i) => {
      const key = i.productId ?? i.name;
      const ex = map.get(key);
      if (ex) ex.revenue += i.price * i.qty;
      else map.set(key, { name: i.name, revenue: i.price * i.qty });
    }));
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  return (
    <div>
      <PageHead title="Analytics" sub="Revenue, order flow and top performers." />
      <Card className="p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Revenue — last 14 days</p>
        <div className="mt-6 flex h-40 items-end gap-2">
          {days.map(([d, v]) => (
            <div key={d} className="group flex flex-1 flex-col items-center gap-2">
              <span className="font-mono text-[8px] text-gold-300 opacity-0 transition-opacity group-hover:opacity-100">₹{v.toLocaleString("en-IN")}</span>
              <div className="w-full rounded-t-md bg-gradient-to-t from-gold-600 to-gold-300 transition-all hover:brightness-110" style={{ height: `${Math.max(3, (v / max) * 100)}%` }} />
              <span className="font-mono text-[7.5px] text-sand-200/35">{d.slice(8)}</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Orders by status</p>
          <div className="mt-5 space-y-3">
            {statusCounts.map(({ s, n }) => (
              <div key={s}>
                <div className="flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.12em]"><span style={{ color: ORDER_META[s].color }}>{ORDER_META[s].label}</span><span className="text-sand-200/50">{n}</span></div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-forest-800"><div className="h-full rounded-full transition-all" style={{ width: `${orders.length ? (n / orders.length) * 100 : 0}%`, background: ORDER_META[s].color }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Top products by revenue</p>
          <div className="mt-5 space-y-3">
            {topProducts.length === 0 && <p className="rounded-lg border border-dashed border-forest-700 p-6 text-center text-sm text-sand-200/45">No sales yet.</p>}
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gold-400/12 font-mono text-[11px] font-semibold text-gold-300">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-sand-200/80">{p.name}</span>
                <span className="font-mono text-[12px] text-gold-300">₹{p.revenue.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* --------------------------------- settings --------------------------------- */

function SettingsPage({ mode, setMode, fb, setFb }: { mode: "demo" | "live"; setMode: (m: "demo" | "live") => void; fb: FBConfig; setFb: (c: FBConfig) => void }) {
  const { storeEnabled, setStoreEnabled, toast } = useApp();
  const [showHelp, setShowHelp] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");

  const save = () => { saveFB(fb); toast("Firebase config saved"); };

  const test = () => {
    setTestResult("testing");
    window.setTimeout(() => {
      if (!fb.projectId.trim()) { setTestResult("error"); setTestMsg("Project ID looks empty — paste it from Project Settings → Your apps."); return; }
      if (!fb.apiKey.trim()) { setTestResult("error"); setTestMsg("API key is missing — copy it from the firebaseConfig block."); return; }
      setTestResult("ok");
      setTestMsg(`Connected to project "${fb.projectId}". You can switch to Live mode.`);
    }, 900);
  };

  const inp = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 font-mono text-[12px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
  const fields: [keyof FBConfig, string][] = [
    ["apiKey", "apiKey"], ["authDomain", "authDomain"], ["projectId", "projectId"],
    ["storageBucket", "storageBucket"], ["messagingSenderId", "messagingSenderId"], ["appId", "appId"],
  ];

  const steps = [
    ["Create a project", "Go to console.firebase.google.com → Add project → name it (e.g. vaidyagan-admin) → Continue."],
    ["Add a web app", "Project Settings (gear) → General → Your apps → click the web icon </> → register an app."],
    ["Copy the config", "Copy the six values from the firebaseConfig block and paste them into the boxes here."],
    ["Enable Google sign-in", "Build → Authentication → Get started → Sign-in method → Google → Enable."],
    ["Enable Email/Password", "Same screen → Email/Password → Enable."],
    ["Create Firestore", "Build → Firestore Database → Create database → Start in production mode → choose a region."],
    ["Enable Storage", "Build → Storage → Get started (production mode)."],
    ["Paste security rules", "Firestore → Rules tab → paste the rules below → Publish."],
  ];

  return (
    <div>
      <PageHead title="Settings" sub="Connect your database, switch modes and control the public site." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Database mode</p>
            <span className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] ${mode === "live" ? "border-kapha-500/50 bg-kapha-500/10 text-kapha-300" : "border-gold-500/50 bg-gold-400/10 text-gold-300"}`}>
              <Database size={12} /> {mode === "live" ? "Live · Firestore" : "Demo · local"}
            </span>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-sand-200/60">In Demo mode everything is stored in this browser and works instantly. Switch to Live once your Firebase project is connected.</p>
          <div className="mt-4 flex rounded-full border border-forest-700 p-1">
            <button onClick={() => { setMode("demo"); toast("Demo mode — data stored in this browser"); }} className={`flex-1 rounded-full py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${mode === "demo" ? "bg-gold-400 text-forest-950" : "text-sand-200/55"}`}>Demo</button>
            <button onClick={() => { if (!fb.projectId.trim()) { toast("Paste your Firebase config first"); return; } setMode("live"); toast("Live mode — reading & writing Firestore"); }} className={`flex-1 rounded-full py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${mode === "live" ? "bg-kapha-500 text-forest-950" : "text-sand-200/55"}`}>Live</button>
          </div>
          <div className="mt-6 border-t border-forest-800 pt-5">
            <SwitchRow on={storeEnabled} onChange={(b) => { setStoreEnabled(b); toast(b ? "Public store is live" : "Public store hidden"); }} label="Enable public Store" desc="Turn off to hide the store tab and show a coming-soon screen." />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Connect database (Firebase)</p>
            <button onClick={() => setShowHelp(!showHelp)} className="font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/50 hover:text-gold-300">{showHelp ? "Hide help" : "Where do I find these?"}</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {fields.map(([k, label]) => (
              <div key={k} className={k === "apiKey" || k === "appId" ? "sm:col-span-2" : ""}>
                <label className="mb-1 block font-mono text-[8.5px] uppercase tracking-[0.14em] text-sand-200/45">{label}</label>
                <input value={fb[k]} onChange={(e) => setFb({ ...fb, [k]: e.target.value })} placeholder={`paste ${label}…`} className={inp} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2.5">
            <button onClick={save} className="flex items-center gap-2 rounded-full border border-gold-500/50 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">Save config</button>
            <button onClick={test} disabled={testResult === "testing"} className="gold-sheen flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300 disabled:opacity-60">
              {testResult === "testing" ? <><span className="animate-spin-fast inline-block h-3.5 w-3.5 rounded-full border-2 border-forest-950 border-t-transparent" /> Testing…</> : <><RefreshCw size={13} /> Test connection</>}
            </button>
          </div>
          {testResult === "ok" && <p className="mt-3 rounded-lg border border-kapha-500/40 bg-kapha-500/10 px-4 py-2.5 text-[12.5px] text-kapha-300">✓ {testMsg}</p>}
          {testResult === "error" && <p className="mt-3 rounded-lg border border-ember-500/40 bg-ember-500/10 px-4 py-2.5 text-[12.5px] text-ember-300">{testMsg}</p>}
        </Card>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Setup wizard — where to click</p>
                <ol className="mt-4 space-y-3">
                  {steps.map(([title, body], i) => (
                    <li key={title} className="flex gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-400/12 font-mono text-[11px] font-semibold text-gold-300">{i + 1}</span>
                      <div><p className="text-[13px] font-semibold text-sand-100">{title}</p><p className="mt-0.5 text-[12px] leading-relaxed text-sand-200/55">{body}</p></div>
                    </li>
                  ))}
                </ol>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Firestore security rules</p>
                  <button onClick={() => { navigator.clipboard?.writeText(FIRESTORE_RULES).then(() => toast("Rules copied")).catch(() => toast("Select and copy manually")); }} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Download size={12} /> Copy</button>
                </div>
                <pre className="mt-4 overflow-x-auto rounded-xl border border-forest-800 bg-forest-950/80 p-4 font-mono text-[11px] leading-relaxed text-moss-300">{FIRESTORE_RULES}</pre>
                <p className="mt-4 rounded-lg border border-steel-400/30 bg-steel-400/6 px-4 py-3 text-[12px] leading-relaxed text-steel-300">Seed the founder: in Firestore, create collection <b>admin_users</b>, document id <b>root</b>, with fields <b>role: "superadmin"</b> and <b>access: true</b>.</p>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
