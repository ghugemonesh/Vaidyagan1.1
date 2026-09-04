import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp, auth, SmartImg, type StudioUser } from "./lib";
import { BRAND_LOGO_URL, PRODUCTS, ORDER_META, ORDER_FLOW, formatDate, type Order, type OrderStatus, type Product } from "./data";
import {
  getConsoleMode, hasFirebaseConfig, listNotifications, markAllNotificationsRead, pushNotification,
  seedDemoAnalytics, unreadNotificationCount, listCustomersWithStats, listDiscounts, saveDiscount,
} from "./console/db";
import {
  CustomersPage, StaffPage, ContentPage, MarketingPage, AnalyticsPage, SettingsPage,
  Switch, downloadFile, cInp, cLbl, timeAgo, type CRole,
} from "./console-pages";
import { loadActivity } from "./console/data";
import {
  Leaf, Gear, Cart, Users, Book, Mortar, Star, Search, Close, Check, Plus, Trash, Download,
  Shield, Lock, Eye, ChevronDown, Activity, Bell, Menu, LayoutGrid, Person, Send,
} from "./icons";

type Page = "home" | "orders" | "products" | "customers" | "staff" | "content" | "marketing" | "analytics" | "settings";

const PAGES: { key: Page; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { key: "home", label: "Home", Icon: LayoutGrid },
  { key: "orders", label: "Orders", Icon: Cart },
  { key: "products", label: "Products", Icon: Mortar },
  { key: "customers", label: "Customers", Icon: Users },
  { key: "staff", label: "Staff & Access", Icon: Shield },
  { key: "content", label: "Content", Icon: Book },
  { key: "marketing", label: "Marketing", Icon: Star },
  { key: "analytics", label: "Analytics", Icon: Activity },
  { key: "settings", label: "Settings", Icon: Gear },
];

const PAGE_ACCESS: Record<Page, CRole[]> = {
  home: ["superadmin", "editor", "viewer"],
  orders: ["superadmin", "editor"],
  products: ["superadmin", "editor"],
  customers: ["superadmin", "editor"],
  staff: ["superadmin"],
  content: ["superadmin", "editor"],
  marketing: ["superadmin", "editor"],
  analytics: ["superadmin", "editor", "viewer"],
  settings: ["superadmin"],
};

/* --------------------------------- shell ----------------------------------- */

export function AdminConsole() {
  const { toast, navigate } = useApp();
  const [session, setSession] = useState<StudioUser | null>(() => auth.session());
  const [page, setPage] = useState<Page>("home");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, setTick] = useState(0);
  const refresh = () => setTick((x) => x + 1);

  /* seed demo analytics, a welcome notification and a starter discount once */
  useEffect(() => {
    try {
      seedDemoAnalytics();
      if (listNotifications().length === 0) {
        pushNotification({ title: "Welcome to the Admin Console", body: "Everything here edits the live site — changes save instantly.", icon: "system" });
      }
      if (listDiscounts().length === 0) {
        saveDiscount({ id: "d-welcome", code: "WELCOME10", type: "percent", value: 10, minOrder: 499, expires: "", active: true, createdAt: new Date().toISOString().slice(0, 10) });
      }
    } catch { /* ignore */ }
  }, []);

  const me = session ? auth.get(session.id) ?? session : null;
  const isSuper = me?.role === "superadmin";
  const role: CRole = isSuper ? "superadmin" : me?.consoleRole ?? "viewer";
  const canOpen = !!me && (isSuper || me.consoleAccess);

  /* page guard — never render a page the role can't open */
  useEffect(() => {
    if (!PAGE_ACCESS[page].includes(role)) setPage("home");
  }, [page, role]);

  /* global search index */
  const { orders, products, allArticles } = useApp();
  const customers = useMemo(() => listCustomersWithStats(), [orders.length, session]);
  const searchResults = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (needle.length < 2) return [];
    const out: { page: Page; kind: string; label: string; sub: string; id: string }[] = [];
    orders.forEach((o) => { if (o.id.toLowerCase().includes(needle) || o.customer.name.toLowerCase().includes(needle)) out.push({ page: "orders", kind: "Order", label: o.id, sub: `${o.customer.name} · ₹${o.total}`, id: o.id }); });
    products.forEach((p) => { if (p.name.toLowerCase().includes(needle)) out.push({ page: "products", kind: "Product", label: p.name, sub: `₹${p.price} · ${p.stock} in stock`, id: p.id }); });
    customers.forEach((c) => { if (c.name.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle)) out.push({ page: "customers", kind: "Customer", label: c.name, sub: `${c.orders} orders · ₹${c.spent}`, id: c.id }); });
    allArticles.forEach((a) => { if (a.title.toLowerCase().includes(needle)) out.push({ page: "content", kind: "Post", label: a.title, sub: a.status, id: a.id }); });
    return out.slice(0, 8);
  }, [search, orders, products, customers, allArticles]);

  const goTo = (p: Page, q = "") => {
    setPage(p); setQuery(q); setSearch(q); setSearchOpen(false); setMobileNav(false);
  };

  if (!me || !canOpen) {
    return (
      <div className="ops-grid relative flex min-h-screen items-center justify-center bg-forest-950 px-5">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 40% at 50% 20%, rgba(214,180,95,0.09), transparent 70%)" }} />
        <div className="relative w-full max-w-md rounded-3xl border border-forest-700 bg-forest-900/85 p-9 text-center backdrop-blur">
          <span className="animate-breathe mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold-500/50 bg-gold-400/10 text-gold-300"><Lock size={26} /></span>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold-400">Admin Console</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-sand-100">
            {me ? "This account has no console access" : "Sign in to the Studio first"}
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-sand-200/55">
            {me
              ? "A superadmin can switch your dashboard access on from Staff & Access. Until then, this door stays closed."
              : "The console lives behind the Doctor Studio login — superadmins and members with dashboard access can enter."}
          </p>
          <button onClick={() => navigate({ name: "studio" })} className="mt-7 inline-flex items-center gap-2 rounded-full bg-gold-400 px-8 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 hover:shadow-[0_0_28px_rgba(214,180,95,0.35)]">
            <Shield size={15} /> Go to Studio sign-in
          </button>
        </div>
      </div>
    );
  }

  const unread = unreadNotificationCount();
  const notifications = listNotifications();
  const mode = hasFirebaseConfig() && getConsoleMode() === "live" ? "Live" : "Demo";
  const visiblePages = PAGES.filter((p) => PAGE_ACCESS[p.key].includes(role));

  return (
    <div className="relative flex min-h-screen bg-forest-950">
      <div aria-hidden className="ops-grid pointer-events-none fixed inset-0 opacity-50" />

      {/* sidebar */}
      <aside className={`relative z-30 hidden shrink-0 flex-col border-r border-forest-800 bg-forest-900/70 backdrop-blur transition-all duration-300 lg:flex ${collapsed ? "w-[76px]" : "w-[240px]"}`}>
        <div className={`flex items-center gap-3 border-b border-forest-800 px-4 py-5 ${collapsed ? "justify-center px-2" : ""}`}>
          <img src={BRAND_LOGO_URL} alt="Vaidyagan" className="h-10 w-10 shrink-0 rounded-xl border border-gold-500/60 object-cover" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold leading-none text-sand-100">Vaidyagan</p>
              <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.22em] text-gold-400/80">Admin Console</p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visiblePages.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => goTo(key)} title={label}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left font-mono text-[10.5px] uppercase tracking-[0.14em] transition-all ${collapsed ? "justify-center px-0" : ""} ${
                page === key ? "bg-gold-400/12 text-gold-300 shadow-[inset_0_0_0_1px_rgba(214,180,95,0.35)]" : "text-sand-200/55 hover:bg-forest-850 hover:text-sand-100"
              }`}>
              <Icon size={17} />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && key === "orders" && orders.filter((o) => o.status === "new").length > 0 && (
                <span className="ml-auto grid h-5 min-w-[20px] place-items-center rounded-full bg-ember-400 px-1 font-mono text-[9px] font-bold text-forest-950">{orders.filter((o) => o.status === "new").length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-forest-800 p-3">
          <button onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label="Toggle sidebar"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-forest-800 py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/45 transition-colors hover:border-gold-500/40 hover:text-gold-300">
            <ChevronDown size={13} className={`transition-transform ${collapsed ? "-rotate-90" : "rotate-90"}`} />
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {/* mobile nav drawer */}
      <AnimatePresence>
        {mobileNav && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-forest-950/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileNav(false)}>
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 32, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} className="flex h-full w-[260px] flex-col border-r border-forest-800 bg-forest-900 p-4">
              <div className="flex items-center gap-3 border-b border-forest-800 pb-4">
                <img src={BRAND_LOGO_URL} alt="Vaidyagan" className="h-10 w-10 rounded-xl border border-gold-500/60 object-cover" />
                <div><p className="font-display text-lg font-semibold leading-none text-sand-100">Vaidyagan</p><p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.2em] text-gold-400/80">Admin Console</p></div>
              </div>
              <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
                {visiblePages.map(({ key, label, Icon }) => (
                  <button key={key} onClick={() => goTo(key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] ${page === key ? "bg-gold-400/12 text-gold-300" : "text-sand-200/55"}`}>
                    <Icon size={17} /> {label}
                  </button>
                ))}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* main column */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="sticky top-0 z-30 border-b border-forest-800 bg-forest-950/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3.5 lg:px-7">
            <button onClick={() => setMobileNav(true)} aria-label="Open navigation" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 lg:hidden"><Menu size={17} /></button>
            <div>
              <h1 className="font-display text-xl font-semibold leading-none text-sand-100">{PAGES.find((p) => p.key === page)?.label}</h1>
              <p className="mt-1 hidden font-mono text-[8.5px] uppercase tracking-[0.2em] text-sand-200/40 sm:block">Signed in as {me.name} · {role}</p>
            </div>
            <span className={`ml-2 flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.16em] ${mode === "Live" ? "border-[#5f947e]/60 bg-[#5f947e]/12 text-[#a9cfbf]" : "border-gold-500/50 bg-gold-400/10 text-gold-300"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${mode === "Live" ? "bg-[#82b39e]" : "animate-blink bg-gold-400"}`} /> {mode}
            </span>

            {/* global search */}
            <div className="relative ml-auto hidden w-full max-w-xs md:block">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)}
                onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
                placeholder="Search orders, products, customers…" className={`${cInp} pl-10`} aria-label="Global search" />
              {searchOpen && search.trim().length >= 2 && (
                <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-forest-700 bg-forest-900 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
                  {searchResults.length === 0 && <p className="px-4 py-3 text-[12.5px] text-sand-200/50">Nothing matches "{search}".</p>}
                  {searchResults.map((r) => (
                    <button key={`${r.kind}-${r.id}`} onMouseDown={(e) => { e.preventDefault(); goTo(r.page, r.label); }}
                      className="flex w-full items-center gap-3 border-b border-forest-800 px-4 py-3 text-left last:border-0 hover:bg-forest-850">
                      <span className="rounded-full border border-forest-700 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-gold-300">{r.kind}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-sand-100">{r.label}</span>
                        <span className="block truncate font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/40">{r.sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* notifications */}
            <div className="relative">
              <button onClick={() => { setBellOpen(!bellOpen); setAvatarOpen(false); }} aria-label="Notifications"
                className="relative grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-colors hover:border-gold-400 hover:text-gold-300">
                <Bell size={17} />
                {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[18px] place-items-center rounded-full bg-ember-400 px-1 font-mono text-[9px] font-bold text-forest-950">{unread}</span>}
              </button>
              <AnimatePresence>
                {bellOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-full z-40 mt-2 w-[320px] overflow-hidden rounded-xl border border-forest-700 bg-forest-900 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
                    <div className="flex items-center justify-between border-b border-forest-800 px-4 py-3">
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400">Notifications</p>
                      <button onClick={() => { markAllNotificationsRead(); refresh(); }} className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-sand-200/45 hover:text-gold-300">Mark all read</button>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {notifications.length === 0 && <p className="px-4 py-6 text-center text-[12.5px] text-sand-200/45">All quiet.</p>}
                      {notifications.slice(0, 12).map((n) => (
                        <div key={n.id} className={`border-b border-forest-800 px-4 py-3 last:border-0 ${n.read ? "opacity-55" : ""}`}>
                          <p className="flex items-center gap-2 text-[12.5px] font-semibold text-sand-100">{!n.read && <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />}{n.title}</p>
                          <p className="mt-0.5 text-[11.5px] leading-relaxed text-sand-200/55">{n.body}</p>
                          <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-sand-200/35">{timeAgo(n.at)}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* avatar */}
            <div className="relative">
              <button onClick={() => { setAvatarOpen(!avatarOpen); setBellOpen(false); }} aria-label="Account menu"
                className="grid h-10 w-10 place-items-center rounded-full border border-gold-500/50 bg-gold-400/10 font-display text-sm font-semibold text-gold-300 transition-all hover:bg-gold-400/20">
                {me.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </button>
              <AnimatePresence>
                {avatarOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-full z-40 mt-2 w-[220px] overflow-hidden rounded-xl border border-forest-700 bg-forest-900 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
                    <div className="border-b border-forest-800 px-4 py-3">
                      <p className="truncate text-[13px] font-semibold text-sand-100">{me.name}</p>
                      <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-gold-400/80">{role} · {mode} mode</p>
                    </div>
                    <button onClick={() => navigate({ name: "studio" })} className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[12.5px] text-sand-200/70 hover:bg-forest-850 hover:text-gold-300"><Leaf size={14} /> Open Doctor Studio</button>
                    <button onClick={() => navigate({ name: "home" })} className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[12.5px] text-sand-200/70 hover:bg-forest-850 hover:text-gold-300"><Eye size={14} /> View website</button>
                    <button onClick={() => { auth.logout(); setSession(null); toast("Signed out of the console"); }} className="flex w-full items-center gap-2.5 border-t border-forest-800 px-4 py-3 text-left text-[12.5px] text-ember-300 hover:bg-ember-500/10"><Lock size={14} /> Sign out</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* page */}
        <main className="flex-1 px-4 py-7 lg:px-7">
          <motion.div key={page} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {page === "home" && <HomePage role={role} refresh={refresh} goTo={goTo} />}
            {page === "orders" && <OrdersPage role={role} refresh={refresh} />}
            {page === "products" && <ProductsPage role={role} refresh={refresh} />}
            {page === "customers" && <CustomersPage role={role} refresh={refresh} />}
            {page === "staff" && role === "superadmin" && <StaffPage role={role} refresh={refresh} />}
            {page === "content" && <ContentPage role={role} refresh={refresh} />}
            {page === "marketing" && <MarketingPage role={role} refresh={refresh} />}
            {page === "analytics" && <AnalyticsPage />}
            {page === "settings" && role === "superadmin" && <SettingsPage role={role} refresh={refresh} />}
          </motion.div>
          <span className="hidden"><Person size={0} /><Send size={0} /></span>
        </main>
      </div>
    </div>
  );
}

/* ---------------------------------- home ------------------------------------ */

function HomePage({ role, refresh, goTo }: { role: CRole; refresh: () => void; goTo: (p: Page) => void }) {
  const { orders, products, allArticles } = useApp();
  const customers = useMemo(() => listCustomersWithStats(), [orders.length]);

  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const revToday = orders.filter((o) => o.status !== "cancelled" && o.placedAt.slice(0, 10) === today).reduce((s, o) => s + o.total, 0);
  const revMonth = orders.filter((o) => o.status !== "cancelled" && o.placedAt.slice(0, 7) === month).reduce((s, o) => s + o.total, 0);
  const newOrders = orders.filter((o) => o.status === "new").length;
  const lowStock = products.filter((p) => p.stock < 5).length;
  const newCustomers = customers.filter((c) => Date.now() - new Date(c.createdAt).getTime() < 30 * 86400e3).length;
  const pendingReviews = allArticles.filter((a) => a.status === "review").length;

  const attention: { label: string; page: Page; tone: "ember" | "gold" | "moss" }[] = [
    ...(newOrders > 0 ? [{ label: `${newOrders} new order${newOrders > 1 ? "s" : ""} to pack`, page: "orders" as Page, tone: "ember" as const }] : []),
    ...(lowStock > 0 ? [{ label: `${lowStock} product${lowStock > 1 ? "s" : ""} low on stock`, page: "products" as Page, tone: "ember" as const }] : []),
    ...(pendingReviews > 0 && role === "superadmin" ? [{ label: `${pendingReviews} submission${pendingReviews > 1 ? "s" : ""} awaiting review`, page: "content" as Page, tone: "gold" as const }] : []),
    ...(newCustomers > 0 ? [{ label: `${newCustomers} new customer${newCustomers > 1 ? "s" : ""} this month`, page: "customers" as Page, tone: "moss" as const }] : []),
  ];

  const [activity, setActivity] = useState<{ id: string; actor: string; action: string; at: string }[]>([]);
  useEffect(() => {
    let on = true;
    loadActivity()
      .then((a) => { if (on) setActivity(a.slice(0, 10) as { id: string; actor: string; action: string; at: string }[]); })
      .catch(() => { if (on) setActivity([]); });
    return () => { on = false; };
  }, [orders.length, products.length]);

  const kpis: { label: string; value: string; sub: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { label: "Revenue today", value: `₹${revToday.toLocaleString("en-IN")}`, sub: `₹${revMonth.toLocaleString("en-IN")} this month`, Icon: Star },
    { label: "Orders", value: String(orders.length), sub: `${newOrders} new to pack`, Icon: Cart },
    { label: "Low stock", value: String(lowStock), sub: "below 5 units", Icon: Mortar },
    { label: "New customers", value: String(newCustomers), sub: "last 30 days", Icon: Users },
  ];

  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, sub, Icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="group rounded-2xl border border-forest-800 bg-forest-900/70 p-5 transition-all hover:-translate-y-0.5 hover:border-gold-500/40">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-sand-200/45">{label}</p>
              <Icon size={16} className="text-gold-400/70 transition-transform group-hover:scale-110" />
            </div>
            <p className={`mt-3 font-display text-[2.1rem] font-semibold leading-none ${label === "Low stock" && lowStock > 0 ? "text-ember-300" : "text-sand-100"}`}>{value}</p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/40">{sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Needs attention</p>
          <div className="mt-4 space-y-2.5">
            {attention.length === 0 && (
              <p className="flex items-center gap-2.5 rounded-xl border border-[#5f947e]/40 bg-[#5f947e]/8 px-4 py-3.5 text-[13px] text-[#a9cfbf]"><Check size={15} /> All clear — nothing waiting on you.</p>
            )}
            {attention.map((a) => (
              <button key={a.label} onClick={() => goTo(a.page)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 ${
                  a.tone === "ember" ? "border-ember-500/40 bg-ember-500/6 text-ember-300" : a.tone === "gold" ? "border-gold-500/40 bg-gold-400/6 text-gold-300" : "border-moss-500/40 bg-moss-500/6 text-moss-300"
                }`}>
                <span className="text-[13px] font-semibold">{a.label}</span>
                <ChevronDown size={14} className="-rotate-90" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Recent activity</p>
          <div className="mt-4 space-y-2.5">
            {activity.length === 0 && <p className="text-[13px] text-sand-200/45">Actions on the desk and in the console land here.</p>}
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl border border-forest-800 bg-forest-850/50 px-4 py-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-relaxed text-sand-200/80"><b className="text-sand-100">{a.actor}</b> {a.action}</p>
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-sand-200/35">{timeAgo(a.at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- orders ----------------------------------- */

function OrdersPage({ role, refresh }: { role: CRole; refresh: () => void }) {
  const { orders, updateOrderStatus, cancelAndRestock, logActivity, toast } = useApp();
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "value">("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = orders.filter((o) => (status === "all" || o.status === status) &&
      (!needle || o.id.toLowerCase().includes(needle) || o.customer.name.toLowerCase().includes(needle) || o.customer.phone.includes(needle)));
    out = [...out].sort((a, b) => sort === "newest" ? b.placedAt.localeCompare(a.placedAt) : sort === "oldest" ? a.placedAt.localeCompare(b.placedAt) : b.total - a.total);
    return out;
  }, [orders, status, q, sort]);

  const open = orders.find((o) => o.id === openId) ?? null;
  const canEdit = role !== "viewer";

  const advance = (o: Order) => {
    const i = ORDER_FLOW.indexOf(o.status);
    const next = ORDER_FLOW[i + 1];
    if (!next) return;
    updateOrderStatus(o.id, next);
    logActivity("store", `moved order ${o.id} to ${ORDER_META[next].label}`, o.id);
    pushNotification({ title: `Order ${o.id} → ${ORDER_META[next].label}`, body: `${o.customer.name}'s order moved forward.`, icon: "order" });
    toast(`Order ${o.id} → ${ORDER_META[next].label}`);
    refresh();
  };

  const bulkShip = () => {
    const targets = orders.filter((o) => selected.has(o.id) && (o.status === "new" || o.status === "processing"));
    targets.forEach((o) => updateOrderStatus(o.id, "shipped"));
    logActivity("store", `marked ${targets.length} orders as shipped`);
    toast(`${targets.length} order${targets.length === 1 ? "" : "s"} marked shipped`);
    setSelected(new Set());
    refresh();
  };

  const toggleSel = (id: string) => {
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const printInvoice = (o: Order) => {
    try {
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(`<html><head><title>Invoice ${o.id}</title><style>body{font-family:Georgia,serif;color:#22271f;padding:40px;max-width:720px;margin:0 auto}h1{margin:0}small{color:#777;font-family:monospace}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border-bottom:1px solid #e2ddcf;padding:9px 8px;text-align:left;font-size:14px}th{font-family:monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a37e2a}.amt{text-align:right}.tot td{font-weight:bold;border:none}</style></head><body>
      <div style="display:flex;gap:14px;align-items:center;border-bottom:3px solid #c49c3e;padding-bottom:14px"><img src="${BRAND_LOGO_URL}" style="width:52px;height:52px;border-radius:12px;object-fit:cover"/><div><h1>Vaidyagan</h1><small>Clinically verified Ayurveda</small></div><div style="margin-left:auto;text-align:right"><small>TAX INVOICE</small><br><b>${o.id}</b><br><small>${formatDate(o.placedAt)}</small></div></div>
      <p style="margin-top:18px"><small>BILL TO</small><br><b>${o.customer.name}</b><br>${o.customer.address}, ${o.customer.city} — ${o.customer.pin}<br>${o.customer.phone}</p>
      <table><tr><th>Item</th><th>Qty</th><th class="amt">Amount</th></tr>${o.items.map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td><td class="amt">₹${(i.price * i.qty).toLocaleString("en-IN")}</td></tr>`).join("")}
      <tr class="tot"><td colspan="2">Total</td><td class="amt">₹${o.total.toLocaleString("en-IN")}</td></tr></table>
      <p style="margin-top:28px;font-size:11px;color:#888">Thank you for trusting classical Ayurveda. Computer-generated invoice — no signature required.</p></body></html>`);
      w.document.close(); w.focus(); w.print();
    } catch { toast("Pop-up blocked — allow pop-ups to print"); }
  };

  return (
    <div className="space-y-5">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {(["all", ...ORDER_FLOW, "cancelled"] as ("all" | OrderStatus)[]).map((s) => {
          const n = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
          return (
            <button key={s} onClick={() => setStatus(s)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-all ${status === s ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55 hover:text-sand-100"}`}>
              {s !== "all" && <span className="h-1.5 w-1.5 rounded-full" style={{ background: ORDER_META[s as OrderStatus].color }} />}
              {s === "all" ? "All" : ORDER_META[s as OrderStatus].label} · {n}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order id, customer, phone…" className={`${cInp} pl-10`} />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as "newest" | "oldest" | "value")} className={`${cInp} w-auto`} aria-label="Sort orders">
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="value">Highest value</option>
        </select>
        {canEdit && selected.size > 0 && (
          <button onClick={bulkShip} className="flex items-center gap-2 rounded-full bg-[#5f947e] px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-[#82b39e]">
            <Send size={13} /> Mark {selected.size} shipped
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-forest-800">
        <div className="hidden grid-cols-[40px_1fr_1.2fr_0.7fr_0.8fr_1fr_120px] items-center gap-3 border-b border-forest-800 bg-forest-900/80 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/45 md:grid">
          <span />
          <span>Order</span><span>Customer</span><span>Items</span><span>Total</span><span>Status</span><span />
        </div>
        {list.map((o) => (
          <div key={o.id} className="grid grid-cols-2 items-center gap-3 border-b border-forest-800 bg-forest-900/50 px-5 py-3.5 transition-colors last:border-0 hover:bg-forest-850 md:grid-cols-[40px_1fr_1.2fr_0.7fr_0.8fr_1fr_120px]">
            {canEdit ? (
              <button onClick={() => toggleSel(o.id)} aria-label={`Select ${o.id}`}
                className={`hidden h-5 w-5 place-items-center rounded-md border transition-all md:grid ${selected.has(o.id) ? "border-gold-400 bg-gold-400 text-forest-950" : "border-forest-600"}`}>
                {selected.has(o.id) && <Check size={12} />}
              </button>
            ) : <span />}
            <button onClick={() => setOpenId(o.id)} className="text-left">
              <p className="font-mono text-[12px] font-semibold text-gold-300">{o.id}</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/40">{formatDate(o.placedAt)}</p>
            </button>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-sand-100">{o.customer.name}</p>
              <p className="truncate text-[11px] text-sand-200/45">{o.customer.city} · {o.customer.phone}</p>
            </div>
            <p className="text-[12.5px] text-sand-200/70">{o.items.reduce((s, i) => s + i.qty, 0)}</p>
            <p className="font-mono text-[12.5px] font-semibold text-sand-100">₹{o.total.toLocaleString("en-IN")}</p>
            <span className="w-fit rounded-full px-3 py-1 font-mono text-[8.5px] uppercase tracking-[0.12em]" style={{ color: ORDER_META[o.status].color, background: `${ORDER_META[o.status].color}15`, border: `1px solid ${ORDER_META[o.status].color}40` }}>
              {ORDER_META[o.status].label}
            </span>
            <button onClick={() => setOpenId(o.id)} className="col-span-2 w-fit rounded-full border border-forest-700 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/65 hover:border-gold-400 hover:text-gold-300 md:col-span-1">
              Open
            </button>
          </div>
        ))}
        {list.length === 0 && (
          <div className="p-14 text-center">
            <Cart size={28} className="mx-auto text-forest-600" />
            <p className="mt-4 font-display text-xl text-sand-200/70">No orders here</p>
            <p className="mt-2 text-sm text-sand-200/45">New orders appear the moment a shopper checks out.</p>
          </div>
        )}
      </div>

      {/* order drawer */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-forest-950/70 backdrop-blur-sm" onClick={() => setOpenId(null)}>
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto border-l border-forest-800 bg-forest-900 p-6" role="dialog" aria-label={`Order ${open.id}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">Order</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-sand-100">{open.id}</h3>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/45">{formatDate(open.placedAt)} · {open.paymentMethod ?? "—"}</p>
                </div>
                <button onClick={() => setOpenId(null)} aria-label="Close order" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><Close size={15} /></button>
              </div>

              {/* timeline */}
              <div className="mt-6">
                {open.status === "cancelled" ? (
                  <p className="rounded-xl border border-ember-500/40 bg-ember-500/8 px-4 py-3 text-[12.5px] text-ember-300">Cancelled — stock was returned to the shelf.</p>
                ) : (
                  <ol className="flex items-start">
                    {ORDER_FLOW.map((s, i) => {
                      const idx = ORDER_FLOW.indexOf(open.status);
                      const done = i <= idx;
                      return (
                        <li key={s} className="relative flex-1 text-center">
                          <span className={`mx-auto grid h-7 w-7 place-items-center rounded-full border-2 ${done ? "border-[#5f947e] bg-[#5f947e]/20 text-[#a9cfbf]" : "border-forest-700 text-sand-200/30"}`}>
                            {done ? <Check size={12} /> : <span className="font-mono text-[9px]">{i + 1}</span>}
                          </span>
                          {i < ORDER_FLOW.length - 1 && <span className={`absolute left-[calc(50%+16px)] top-3.5 h-0.5 w-[calc(100%-32px)] ${i < idx ? "bg-[#5f947e]" : "bg-forest-700"}`} />}
                          <p className={`mt-1.5 font-mono text-[7px] uppercase leading-tight tracking-[0.08em] ${done ? "text-[#a9cfbf]" : "text-sand-200/35"}`}>{ORDER_META[s].label}</p>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              <div className="mt-6 rounded-xl border border-forest-800 bg-forest-850/60 p-4">
                <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-gold-400/80">Ship to</p>
                <p className="mt-1.5 text-sm font-semibold text-sand-100">{open.customer.name}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-sand-200/65">{open.customer.address}, {open.customer.city} — {open.customer.pin}</p>
                <p className="mt-1 font-mono text-[11px] text-sand-200/50">{open.customer.phone}</p>
              </div>

              <div className="mt-4 space-y-2.5">
                {open.items.map((i, x) => (
                  <div key={x} className="flex items-center gap-3 rounded-xl border border-forest-800 bg-forest-850/50 p-3">
                    {i.image ? <SmartImg src={i.image} alt={i.name} className="h-12 w-12 rounded-lg border border-forest-800 object-cover duotone" /> : <span className="grid h-12 w-12 place-items-center rounded-lg border border-forest-800 bg-forest-850 font-display text-gold-500/40">वै</span>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-sand-100">{i.name}</p>
                      <p className="font-mono text-[9.5px] text-sand-200/45">₹{i.price} × {i.qty}</p>
                    </div>
                    <span className="font-mono text-[12px] text-sand-100">₹{(i.price * i.qty).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-xl border border-gold-500/35 bg-gold-400/6 px-4 py-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold-400">Total</span>
                  <span className="font-display text-xl font-semibold text-gold-300">₹{open.total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {canEdit && open.status !== "cancelled" && open.status !== "delivered" && (
                <div className="mt-5 space-y-2.5">
                  {ORDER_FLOW.indexOf(open.status) < ORDER_FLOW.length - 1 && (
                    <button onClick={() => { advance(open); setOpenId(null); }}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#5f947e] py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-[#82b39e]">
                      <Send size={14} /> Mark as {ORDER_META[ORDER_FLOW[ORDER_FLOW.indexOf(open.status) + 1]].label}
                    </button>
                  )}
                  <button onClick={() => { cancelAndRestock(open.id); logActivity("store", `cancelled order ${open.id} & restocked`, open.id); toast(`Order ${open.id} cancelled — stock returned`); setOpenId(null); refresh(); }}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-ember-500/50 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ember-300 hover:bg-ember-500/10">
                    <Trash size={14} /> Cancel & restock
                  </button>
                </div>
              )}
              <button onClick={() => printInvoice(open)} className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border border-gold-500/50 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">
                <Download size={14} /> Print invoice
              </button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------- products ---------------------------------- */

const PRODUCT_CATS = ["All", "Oils", "Churnas", "Capsules", "Ghritas", "Kadhas"] as const;

function ProductsPage({ role, refresh }: { role: CRole; refresh: () => void }) {
  const { products, saveProduct, logActivity, toast } = useApp();
  const [view, setView] = useState<"cards" | "table">("cards");
  const [cat, setCat] = useState<(typeof PRODUCT_CATS)[number]>("All");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const canEdit = role !== "viewer";

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => (cat === "All" || p.category === cat) && (!needle || p.name.toLowerCase().includes(needle) || p.sanskrit.includes(needle)));
  }, [products, cat, q]);

  const exportCsv = () => {
    downloadFile("vaidyagan-products.csv", [
      ["Name", "Sanskrit", "Category", "Price", "MRP", "Stock", "Visible"].join(","),
      ...list.map((p) => [`"${p.name}"`, `"${p.sanskrit}"`, p.category, p.price, p.mrp, p.stock, p.visible === false ? "hidden" : "visible"].join(",")),
    ].join("\n"), "text/csv");
    toast("Products exported as CSV");
  };

  const quickStock = (p: Product, stock: number) => {
    saveProduct({ ...p, stock: Math.max(0, stock) });
    if (stock < 5) pushNotification({ title: `Low stock — ${p.name}`, body: `Only ${stock} unit${stock === 1 ? "" : "s"} left.`, icon: "stock" });
    refresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className={`${cInp} pl-10`} />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {PRODUCT_CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full border px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-all ${cat === c ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55 hover:text-sand-100"}`}>{c}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView(view === "cards" ? "table" : "cards")} className="rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">{view === "cards" ? "Table" : "Cards"}</button>
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Download size={13} /> CSV</button>
          {canEdit && <button onClick={() => setEditing({ id: `prod-${Date.now()}`, name: "", sanskrit: "", price: 499, mrp: 599, image: "", category: "Churnas", stock: 20, rating: 4.5, dosage: "", ingredients: [], desc: "", highlights: [], detail: [], classicalSource: "", ingredientDetails: [], steps: [], safety: [], reviews: [], visible: true })}
            className="flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300"><Plus size={13} /> Add product</button>}
        </div>
      </div>

      {view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <div key={p.id} className={`flex flex-col overflow-hidden rounded-xl border bg-forest-900/60 transition-all hover:border-gold-500/40 ${p.stock <= 0 ? "border-ember-500/40" : p.stock < 5 ? "border-ember-500/25" : "border-forest-800"}`}>
              <button onClick={() => canEdit && setEditing(p)} className="relative block overflow-hidden text-left">
                <SmartImg src={p.image} alt={p.name} className="aspect-[16/9] w-full object-cover duotone transition-transform duration-500 hover:scale-[1.04]" />
                {p.stock <= 0 && <span className="absolute inset-0 grid place-items-center bg-forest-950/60 font-mono text-[10px] uppercase tracking-[0.18em] text-ember-300">Out of stock</span>}
                {p.stock > 0 && p.stock < 5 && <span className="absolute right-3 top-3 rounded-full bg-ember-400 px-2.5 py-1 font-mono text-[8.5px] font-bold uppercase tracking-[0.1em] text-forest-950">Low · {p.stock}</span>}
                {p.visible === false && <span className="absolute left-3 top-3 rounded-full bg-forest-950/80 px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-sand-200/60">Hidden</span>}
              </button>
              <div className="flex flex-1 flex-col p-4">
                <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/40">{p.category}</p>
                <button onClick={() => canEdit && setEditing(p)} className="mt-1 text-left font-display text-[16px] font-semibold leading-snug text-sand-100 hover:text-gold-300">{p.name}</button>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <div>
                    <p className="font-display text-lg font-semibold text-gold-300">₹{p.price.toLocaleString("en-IN")}</p>
                    <div className="mt-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-sand-200/40">Stock</span>
                      <button onClick={() => canEdit && quickStock(p, p.stock - 1)} disabled={!canEdit} aria-label="Decrease stock" className="grid h-6 w-6 place-items-center rounded-md border border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300 disabled:opacity-40">−</button>
                      <span className={`w-7 text-center font-mono text-[12px] font-semibold ${p.stock < 5 ? "text-ember-300" : "text-sand-100"}`}>{p.stock}</span>
                      <button onClick={() => canEdit && quickStock(p, p.stock + 1)} disabled={!canEdit} aria-label="Increase stock" className="grid h-6 w-6 place-items-center rounded-md border border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300 disabled:opacity-40">+</button>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex flex-col items-end gap-2">
                      <Switch on={p.visible !== false} label="" desc="" onChange={(b) => { saveProduct({ ...p, visible: b }); logActivity("store", b ? `showed "${p.name}"` : `hid "${p.name}"`, p.name); toast(b ? `${p.name} visible` : `${p.name} hidden`); refresh(); }} />
                      <button onClick={() => setEditing(p)} className="rounded-full border border-forest-700 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/70 hover:border-gold-400 hover:text-gold-300">Edit</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-forest-800">
          <div className="hidden grid-cols-[1.5fr_0.8fr_0.7fr_0.7fr_0.9fr_0.8fr] gap-3 border-b border-forest-800 bg-forest-900/80 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/45 md:grid">
            <span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Status</span><span />
          </div>
          {list.map((p) => (
            <div key={p.id} className="grid grid-cols-2 items-center gap-3 border-b border-forest-800 bg-forest-900/50 px-5 py-3 last:border-0 hover:bg-forest-850 md:grid-cols-[1.5fr_0.8fr_0.7fr_0.7fr_0.9fr_0.8fr]">
              <button onClick={() => canEdit && setEditing(p)} className="flex min-w-0 items-center gap-3 text-left">
                <SmartImg src={p.image} alt="" className="h-10 w-14 shrink-0 rounded-lg border border-forest-800 object-cover duotone" />
                <span className="truncate text-[13px] font-semibold text-sand-100">{p.name}</span>
              </button>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-sand-200/50 md:block">{p.category}</span>
              <span className="font-mono text-[12px] text-sand-100">₹{p.price}</span>
              <span className={`font-mono text-[12px] font-semibold ${p.stock <= 0 ? "text-ember-300" : p.stock < 5 ? "text-ember-300" : "text-sand-100"}`}>{p.stock <= 0 ? "Out" : p.stock}</span>
              <span className={`w-fit rounded-full px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] ${p.visible === false ? "bg-forest-800 text-sand-200/50" : "bg-[#5f947e]/15 text-[#a9cfbf]"}`}>{p.visible === false ? "Hidden" : "Visible"}</span>
              <button onClick={() => canEdit && setEditing(p)} className="w-fit rounded-full border border-forest-700 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/65 hover:border-gold-400 hover:text-gold-300">Edit</button>
            </div>
          ))}
        </div>
      )}
      {list.length === 0 && (
        <div className="rounded-2xl border border-dashed border-forest-700 p-14 text-center">
          <Mortar size={28} className="mx-auto text-forest-600" />
          <p className="mt-4 font-display text-xl text-sand-200/70">No products match</p>
        </div>
      )}

      {editing && canEdit && (
        <ProductEditor product={editing} isNew={!products.some((x) => x.id === editing.id)} onClose={() => setEditing(null)}
          onSave={(p) => { saveProduct(p); logActivity("store", `saved product "${p.name}"`, p.name); toast(`${p.name} saved`); setEditing(null); refresh(); }} />
      )}
    </div>
  );
}

function ProductEditor({ product, isNew, onClose, onSave }: { product: Product; isNew: boolean; onClose: () => void; onSave: (p: Product) => void }) {
  const { toast } = useApp();
  const [f, setF] = useState<Product>({ ...product, highlights: [...product.highlights], detail: [...product.detail], steps: [...product.steps], safety: [...product.safety], ingredients: [...product.ingredients], ingredientDetails: product.ingredientDetails.map((x) => ({ ...x })), reviews: [...product.reviews] });
  const lines = (a: string[]) => a.join("\n");
  const setLines = (v: string) => v.split("\n");

  const save = () => {
    if (!f.name.trim()) { toast("Give the product a name"); return; }
    onSave({
      ...f,
      highlights: f.highlights.map((x) => x.trim()).filter(Boolean),
      detail: f.detail.map((x) => x.trim()).filter(Boolean),
      steps: f.steps.map((x) => x.trim()).filter(Boolean),
      safety: f.safety.map((x) => x.trim()).filter(Boolean),
      ingredients: f.ingredients.map((x) => x.trim()).filter(Boolean),
      ingredientDetails: f.ingredientDetails.filter((x) => x.name.trim()),
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-end justify-center bg-forest-950/85 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-forest-700 bg-forest-900 p-6 sm:rounded-2xl sm:p-7" role="dialog" aria-label="Product editor">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">{isNew ? "Add new product" : `Editing · ${product.name}`}</p>
          <button onClick={onClose} aria-label="Close editor" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><Close size={15} /></button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={cLbl}>Product name *</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={cInp} /></div>
          <div><label className={cLbl}>Sanskrit</label><input value={f.sanskrit} onChange={(e) => setF({ ...f, sanskrit: e.target.value })} className={cInp} /></div>
          <div><label className={cLbl}>Category</label>
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Product["category"] })} className={cInp}>
              {PRODUCT_CATS.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label className={cLbl}>Price ₹</label><input value={f.price} onChange={(e) => setF({ ...f, price: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} className={cInp} /></div>
          <div><label className={cLbl}>MRP ₹</label><input value={f.mrp} onChange={(e) => setF({ ...f, mrp: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} className={cInp} /></div>
          <div><label className={cLbl}>Quantity in stock</label><input value={f.stock} onChange={(e) => setF({ ...f, stock: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} className={cInp} /></div>
          <div><label className={cLbl}>Badge (optional)</label><input value={f.badge ?? ""} onChange={(e) => setF({ ...f, badge: e.target.value })} placeholder="Bestseller" className={cInp} /></div>
          <div className="sm:col-span-2">
            <label className={cLbl}>Photo — URL or upload</label>
            <div className="flex flex-wrap items-center gap-3">
              <input value={f.image.startsWith("data:") ? "(uploaded)" : f.image} onChange={(e) => setF({ ...f, image: e.target.value })} placeholder="https://…" className={`${cInp} max-w-sm`} />
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-forest-600 px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">
                <Plus size={13} /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onload = () => setF({ ...f, image: String(r.result) }); r.readAsDataURL(file); } e.target.value = ""; }} />
              </label>
              {f.image && <SmartImg src={f.image} alt="Preview" className="h-12 w-16 rounded-lg border border-forest-700 object-cover" />}
            </div>
          </div>
          <div className="sm:col-span-2"><label className={cLbl}>Card description</label><textarea value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} rows={2} className={cInp} /></div>
          <div className="sm:col-span-2"><label className={cLbl}>Highlights — one per line</label><textarea value={lines(f.highlights)} onChange={(e) => setF({ ...f, highlights: setLines(e.target.value) })} rows={3} className={cInp} /></div>
          <div className="sm:col-span-2"><label className={cLbl}>Detailed description — one paragraph per line</label><textarea value={lines(f.detail)} onChange={(e) => setF({ ...f, detail: setLines(e.target.value) })} rows={3} className={cInp} /></div>
          <div className="sm:col-span-2"><label className={cLbl}>Classical source quote</label><input value={f.classicalSource} onChange={(e) => setF({ ...f, classicalSource: e.target.value })} className={cInp} /></div>
          <div className="sm:col-span-2"><label className={cLbl}>Directions — one step per line</label><textarea value={lines(f.steps)} onChange={(e) => setF({ ...f, steps: setLines(e.target.value) })} rows={3} className={cInp} /></div>
          <div className="sm:col-span-2"><label className={cLbl}>Dosage line</label><input value={f.dosage} onChange={(e) => setF({ ...f, dosage: e.target.value })} className={cInp} /></div>
          <div className="sm:col-span-2"><label className={cLbl}>Safety notes — one per line</label><textarea value={lines(f.safety)} onChange={(e) => setF({ ...f, safety: setLines(e.target.value) })} rows={2} className={cInp} /></div>
          <div className="sm:col-span-2">
            <label className={cLbl}>Key ingredients (name — what it does, one per line)</label>
            <textarea value={f.ingredientDetails.map((x) => `${x.name} — ${x.note}`).join("\n")}
              onChange={(e) => setF({ ...f, ingredientDetails: setLines(e.target.value).map((l) => { const [name, ...rest] = l.split("—"); return { name: (name ?? "").trim(), note: rest.join("—").trim() }; }) })}
              rows={3} placeholder={"Ashwagandha — steadies cortisol\nBrahmi — sharpens recall"} className={cInp} />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Switch on={f.visible !== false} label="Visible in store" desc="Hidden products disappear from the public shelf instantly." onChange={(b) => setF({ ...f, visible: b })} />
        </div>
        <div className="mt-5 flex gap-2.5">
          <button onClick={save} className="flex items-center gap-2 rounded-full bg-gold-400 px-7 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Check size={14} /> Save product</button>
          <button onClick={onClose} className="rounded-full border border-forest-700 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200/60 hover:text-sand-100">Discard</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
