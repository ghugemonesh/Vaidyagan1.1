/* =============================================================================
   Vaidyagan — Admin Console shell
   A Wix/Shopify-style no-code dashboard for the Superadmin: collapsible
   sidebar, header with global search + notifications + avatar, and role-based
   pages. Demo data runs instantly; Firebase connects from Settings, no code.
   ========================================================================== */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, Package, Users, UserCog, FileText, Megaphone,
  BarChart3, Settings, Search, Bell, Menu, X, LogOut, ChevronLeft, ChevronRight,
  Leaf, IndianRupee, TrendingUp, AlertTriangle, CheckCircle2, Clock, Star,
  Wifi, WifiOff, Inbox, PackageSearch, User, Database,
} from "lucide-react";

import {
  useDb, listOrders, listProducts, listCustomers, listPosts, listReviews,
  listAudit, listNotifs, unreadNotifs, markAllNotifsRead, revenueSeries,
  loginAdmin, currentAdmin, logoutAdmin, trackPageView, inr, getSettings,
} from "../lib/data";
import { getConsoleMode, hasFirebaseConfig, setConsoleMode } from "../lib/firebase";
import { Badge, StatCard, EmptyState, useToast } from "../components/ui";
import { LogoTile } from "../components/brand";
import { OrdersPage, ProductsPage, CustomersPage, StaffPage, ContentPage, MarketingPage, AnalyticsPage, SettingsPage } from "./ConsolePages";

type PageId = "home" | "orders" | "products" | "customers" | "staff" | "content" | "marketing" | "analytics" | "settings";

const NAV: { id: PageId; label: string; icon: React.ComponentType<{ size?: number | string }>; roles: string[] }[] = [
  { id: "home", label: "Home", icon: LayoutDashboard, roles: ["superadmin", "editor", "viewer"] },
  { id: "orders", label: "Orders", icon: ShoppingCart, roles: ["superadmin", "editor"] },
  { id: "products", label: "Products", icon: Package, roles: ["superadmin", "editor"] },
  { id: "customers", label: "Customers", icon: Users, roles: ["superadmin", "editor"] },
  { id: "staff", label: "Staff & Access", icon: UserCog, roles: ["superadmin"] },
  { id: "content", label: "Content", icon: FileText, roles: ["superadmin", "editor"] },
  { id: "marketing", label: "Marketing", icon: Megaphone, roles: ["superadmin", "editor"] },
  { id: "analytics", label: "Analytics", icon: BarChart3, roles: ["superadmin", "editor", "viewer"] },
  { id: "settings", label: "Settings", icon: Settings, roles: ["superadmin"] },
];

/* ---------------------------------- Login ---------------------------------- */

function LoginScreen() {
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    window.setTimeout(() => {
      const r = loginAdmin(username, password);
      setBusy(false);
      if (!r.ok) { setError(r.error ?? "Sign-in failed."); return; }
      toast("Welcome back, Monesh");
    }, 350);
  };

  return (
    <div className="ops-grid relative flex min-h-screen items-center justify-center overflow-hidden bg-forest-950 px-4">
      <span aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gold-500/8 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-moss-500/10 blur-3xl" />
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900/85 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="flex items-center gap-3.5">
          <span className="group inline-block"><LogoTile size="sm" /></span>
          <div>
            <p className="font-display text-2xl font-semibold leading-none text-sand-100">Vaidyagan</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.28em] text-gold-400/70">Admin Console</p>
          </div>
        </div>
        <h1 className="mt-7 font-display text-xl font-semibold text-sand-100">Sign in to the desk</h1>
        <p className="mt-1 text-[13px] text-sand-200/50">Superadmin access — manage the whole store without code.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-gold-400/80">Username</span>
            <input value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} autoComplete="username"
              className="w-full rounded-lg border border-forest-600 bg-forest-950/60 px-3.5 py-3 text-[14px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none"
              placeholder="monesh" />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-gold-400/80">Password</span>
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} autoComplete="current-password"
              className="w-full rounded-lg border border-forest-600 bg-forest-950/60 px-3.5 py-3 text-[14px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none"
              placeholder="••••••••••" />
          </label>
          {error && (
            <p className="flex items-start gap-2 rounded-lg border border-ember-500/40 bg-ember-500/8 px-3.5 py-2.5 text-[12.5px] text-ember-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />{error}
            </p>
          )}
          <button type="submit" disabled={busy}
            className="w-full rounded-lg bg-gold-400 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-forest-950 transition-all hover:bg-gold-300 active:scale-[0.99] disabled:opacity-60">
            {busy ? "Checking…" : "Enter console"}
          </button>
        </form>
        <button onClick={() => { setUsername("monesh"); setPassword("admin91466"); setError(""); }}
          className="mt-4 w-full text-center font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/35 transition-colors hover:text-gold-300">
          Use demo superadmin (monesh / admin91466)
        </button>
      </motion.div>
    </div>
  );
}

/* ---------------------------------- Home ----------------------------------- */

function HomePage({ go }: { go: (p: PageId) => void }) {
  useDb();
  const orders = listOrders();
  const products = listProducts();
  const customers = listCustomers();
  const posts = listPosts();
  const reviews = listReviews();
  const audit = listAudit().slice(0, 10);

  const series = revenueSeries(30);
  const today = new Date().toISOString().slice(0, 10);
  const revToday = orders.filter((o) => o.createdAt.slice(0, 10) === today && o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const revMonth = series.reduce((s, d) => s + d.revenue, 0);
  const newOrders = orders.filter((o) => o.status === "new").length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 5);
  const outStock = products.filter((p) => p.stock === 0);
  const newCustomers = customers.filter((c) => (Date.now() - new Date(c.joinedAt).getTime()) / 86400e3 < 14).length;
  const pendingPosts = posts.filter((p) => p.status === "in-review").length;
  const pendingReviews = reviews.filter((r) => !r.approved).length;

  const attention: { label: string; count: number; page: string; icon: React.ReactNode; color: string }[] = [
    { label: "New orders to pack", count: newOrders, page: "orders", icon: <ShoppingCart size={15} />, color: "#93b1cf" },
    { label: "Low-stock products", count: lowStock.length, page: "products", icon: <Package size={15} />, color: "#e07f49" },
    { label: "Out-of-stock products", count: outStock.length, page: "products", icon: <PackageSearch size={15} />, color: "#c96430" },
    { label: "Posts awaiting review", count: pendingPosts, page: "content", icon: <FileText size={15} />, color: "#e8cf8b" },
    { label: "Reviews to moderate", count: pendingReviews, page: "content", icon: <Star size={15} />, color: "#d6b45f" },
  ].filter((a) => a.count > 0);

  return (
    <div className="fade-up">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400/70">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-sand-100">Namaste, Monesh</h1>
          <p className="mt-1 text-[13.5px] text-sand-200/50">Here's how the store is doing today.</p>
        </div>
        {getSettings().maintenanceMode && <Badge color="#c96430">Maintenance mode on</Badge>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue · today" value={inr(revToday)} sub={`${inr(revMonth)} this month`} icon={<IndianRupee size={16} />} accent="#d6b45f" onClick={() => go("analytics")} />
        <StatCard label="Orders" value={String(orders.length)} sub={`${newOrders} new to pack`} icon={<ShoppingCart size={16} />} accent="#93b1cf" onClick={() => go("orders")} />
        <StatCard label="Low stock" value={String(lowStock.length + outStock.length)} sub={`${outStock.length} out of stock`} icon={<Package size={16} />} accent="#e07f49" onClick={() => go("products")} />
        <StatCard label="New customers" value={String(newCustomers)} sub="joined in the last 14 days" icon={<Users size={16} />} accent="#7fa07f" onClick={() => go("customers")} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {/* attention */}
        <div className="rounded-xl border border-forest-700/70 bg-forest-900/70 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400/80">Needs attention</p>
            {attention.length === 0 && <CheckCircle2 size={16} className="text-moss-400" />}
          </div>
          {attention.length === 0 ? (
            <p className="text-[13px] text-sand-200/50">All clear — nothing needs you right now. 🌿</p>
          ) : (
            <div className="space-y-2.5">
              {attention.map((a) => (
                <button key={a.label} onClick={() => go(a.page as PageId)} className="group flex w-full items-center gap-3 rounded-lg border border-forest-700 bg-forest-850/60 px-3.5 py-3 text-left transition-all hover:border-gold-500/50">
                  <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ color: a.color, background: `${a.color}14`, border: `1px solid ${a.color}33` }}>{a.icon}</span>
                  <span className="flex-1 text-[13px] font-medium text-sand-100">{a.label}</span>
                  <span className="rounded-full bg-forest-700 px-2.5 py-1 font-mono text-[11px] font-semibold text-sand-100">{a.count}</span>
                  <ChevronRight size={15} className="text-sand-200/30 transition-transform group-hover:translate-x-0.5 group-hover:text-gold-300" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* recent activity */}
        <div className="rounded-xl border border-forest-700/70 bg-forest-900/70 p-5 lg:col-span-3">
          <p className="mb-4 font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400/80">Recent activity</p>
          <div className="space-y-1">
            {audit.map((e) => (
              <div key={e.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-forest-850/60">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold-500/70" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug text-sand-100"><span className="font-semibold">{e.actor}</span> {e.action}</p>
                  <p className="mt-0.5 flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-sand-200/35">
                    <Clock size={10} /> {new Date(e.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Global search ------------------------------ */

function useGlobalSearch(q: string) {
  return useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const out: { type: string; label: string; sub: string; page: PageId }[] = [];
    listOrders().filter((o) => o.id.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s)).slice(0, 3)
      .forEach((o) => out.push({ type: "Order", label: o.id, sub: `${o.customerName} · ${inr(o.total)}`, page: "orders" }));
    listProducts().filter((p) => p.name.toLowerCase().includes(s) || p.sanskrit.includes(q.trim())).slice(0, 3)
      .forEach((p) => out.push({ type: "Product", label: p.name, sub: `${p.category} · ${inr(p.price)}`, page: "products" }));
    listCustomers().filter((c) => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s)).slice(0, 3)
      .forEach((c) => out.push({ type: "Customer", label: c.name, sub: c.email, page: "customers" }));
    listPosts().filter((p) => p.title.toLowerCase().includes(s)).slice(0, 3)
      .forEach((p) => out.push({ type: "Post", label: p.title, sub: p.status, page: "content" }));
    return out.slice(0, 9);
  }, [q]);
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  Order: <ShoppingCart size={14} />, Product: <Package size={14} />, Customer: <User size={14} />, Post: <FileText size={14} />,
};

/* ---------------------------------- Shell ---------------------------------- */

export default function AdminConsole() {
  useDb();
  const toast = useToast();
  const admin = currentAdmin();
  const [page, setPage] = useState<PageId>("home");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const mode = getConsoleMode();
  const role = admin?.role ?? "viewer";
  const allowed = NAV.filter((n) => n.roles.includes(role));
  const results = useGlobalSearch(q);
  const unread = unreadNotifs();
  const notifs = listNotifs().slice(0, 8);

  // Close popovers on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  // Role guard: if the current page isn't allowed, fall back to Home.
  useEffect(() => {
    if (!allowed.some((n) => n.id === page)) setPage("home");
    trackPageView(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, role]);

  if (!admin) return <LoginScreen />;

  const go = (p: string) => { setPage(p as PageId); setMobileNav(false); setSearchOpen(false); setQ(""); };

  const renderPage = () => {
    switch (page) {
      case "home": return <HomePage go={go} />;
      case "orders": return <OrdersPage go={go} />;
      case "products": return <ProductsPage go={go} />;
      case "customers": return <CustomersPage go={go} />;
      case "staff": return <StaffPage go={go} />;
      case "content": return <ContentPage go={go} />;
      case "marketing": return <MarketingPage go={go} />;
      case "analytics": return <AnalyticsPage go={go} />;
      case "settings": return <SettingsPage go={go} />;
      default: return <HomePage go={go} />;
    }
  };

  const modeBadge = (
    <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] ${
      mode === "live" ? "border-moss-500/50 bg-moss-500/10 text-moss-300" : "border-gold-500/50 bg-gold-400/10 text-gold-300"
    }`}>
      {mode === "live" ? <Wifi size={11} /> : <Database size={11} />} {mode === "live" ? "Live" : "Demo"}
    </span>
  );

  return (
    <div className="flex min-h-screen bg-forest-950">
      {/* mobile nav drawer */}
      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-forest-950/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileNav(false)} />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-forest-700 bg-forest-900 lg:hidden">
              <SidebarContent collapsed={false} page={page} go={go} allowed={allowed} onCollapse={() => setMobileNav(false)} isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* desktop sidebar */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-forest-700 bg-forest-900 transition-all duration-300 lg:flex ${collapsed ? "w-[76px]" : "w-60"}`}>
        <SidebarContent collapsed={collapsed} page={page} go={go} allowed={allowed} onCollapse={() => setCollapsed((c) => !c)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-forest-700 bg-forest-950/85 px-4 py-3 backdrop-blur lg:px-6">
          <button onClick={() => setMobileNav(true)} aria-label="Open navigation" className="grid h-10 w-10 place-items-center rounded-lg border border-forest-600 text-sand-200/70 lg:hidden">
            <Menu size={17} />
          </button>
          <div className="hidden items-center gap-2.5 md:flex">
            <span className="font-display text-lg font-semibold text-sand-100">Console</span>
            {modeBadge}
          </div>

          {/* global search */}
          <div ref={searchRef} className="relative ml-auto w-full max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400/70" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)}
              placeholder="Search orders, products, customers, posts…" aria-label="Global search"
              className="w-full rounded-full border border-forest-600 bg-forest-900/70 py-2.5 pl-10 pr-4 text-[13px] text-sand-100 placeholder:text-sand-200/30 focus:border-gold-400 focus:outline-none" />
            <AnimatePresence>
              {searchOpen && q.trim() && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-forest-700 bg-forest-900 shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
                  {results.length === 0 ? (
                    <p className="px-4 py-4 text-[12.5px] text-sand-200/45">No matches for “{q}”.</p>
                  ) : results.map((r, i) => (
                    <button key={`${r.type}-${r.label}-${i}`} onClick={() => go(r.page)}
                      className="flex w-full items-center gap-3 border-b border-forest-800/60 px-4 py-3 text-left last:border-0 hover:bg-forest-850">
                      <span className="grid h-8 w-8 place-items-center rounded-lg border border-forest-600 text-gold-300">{TYPE_ICON[r.type]}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-sand-100">{r.label}</span>
                        <span className="block truncate text-[11px] text-sand-200/45">{r.sub}</span>
                      </span>
                      <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-gold-400/70">{r.type}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* notifications */}
          <div ref={bellRef} className="relative">
            <button onClick={() => setBellOpen((b) => !b)} aria-label={`Notifications, ${unread} unread`}
              className="relative grid h-10 w-10 place-items-center rounded-full border border-forest-600 text-sand-200/70 transition-colors hover:border-gold-400 hover:text-gold-300">
              <Bell size={16} />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-gold-400 px-1 font-mono text-[9px] font-bold text-forest-950">{unread}</span>}
            </button>
            <AnimatePresence>
              {bellOpen && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-forest-700 bg-forest-900 shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
                  <div className="flex items-center justify-between border-b border-forest-800 px-4 py-3">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Notifications</p>
                    <button onClick={() => { markAllNotifsRead(); toast("All marked read"); }} className="text-[11px] text-gold-300 hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 ? <p className="px-4 py-6 text-center text-[12.5px] text-sand-200/45">You're all caught up.</p> :
                      notifs.map((n) => (
                        <div key={n.id} className={`flex items-start gap-3 border-b border-forest-800/60 px-4 py-3 last:border-0 ${n.read ? "opacity-55" : ""}`}>
                          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-forest-600 text-gold-300">
                            {n.icon === "order" ? <ShoppingCart size={14} /> : n.icon === "stock" ? <Package size={14} /> : n.icon === "review" ? <Star size={14} /> : n.icon === "member" ? <User size={14} /> : <Inbox size={14} />}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-semibold text-sand-100">{n.title}</p>
                            <p className="truncate text-[11.5px] text-sand-200/50">{n.body}</p>
                          </div>
                          {!n.read && <span className="ml-auto mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-400" />}
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* avatar */}
          <div ref={menuRef} className="relative">
            <button onClick={() => setMenuOpen((m) => !m)} aria-label="Account menu"
              className="flex items-center gap-2.5 rounded-full border border-forest-600 py-1.5 pl-1.5 pr-3 transition-colors hover:border-gold-400">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-400 font-display text-[13px] font-bold text-forest-950">M</span>
              <span className="hidden text-left sm:block">
                <span className="block text-[12.5px] font-semibold leading-tight text-sand-100">{admin.name}</span>
                <span className="block font-mono text-[8.5px] uppercase tracking-[0.14em] text-gold-400/80">{role}</span>
              </span>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-forest-700 bg-forest-900 shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
                  <div className="border-b border-forest-800 px-4 py-3">
                    <p className="text-[13px] font-semibold text-sand-100">{admin.name}</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-gold-400/70">{role}</p>
                  </div>
                  {hasFirebaseConfig() && (
                    <button onClick={() => { setConsoleMode(mode === "live" ? "demo" : "live"); toast(mode === "live" ? "Switched to Demo Mode" : "Switched to Live Mode"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[12.5px] text-sand-200/70 hover:bg-forest-850">
                      {mode === "live" ? <WifiOff size={14} /> : <Wifi size={14} />} Switch to {mode === "live" ? "Demo" : "Live"} Mode
                    </button>
                  )}
                  <button onClick={() => { logoutAdmin(); toast("Signed out"); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[12.5px] text-ember-300 hover:bg-forest-850">
                    <LogOut size={14} /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------ Sidebar content ---------------------------- */

function SidebarContent({ collapsed, page, go, allowed, onCollapse, isMobile }: {
  collapsed: boolean; page: PageId; go: (p: string) => void;
  allowed: typeof NAV; onCollapse: () => void; isMobile?: boolean;
}) {
  return (
    <>
      <div className={`flex items-center gap-3 border-b border-forest-800 px-4 py-5 ${collapsed && !isMobile ? "justify-center px-2" : ""}`}>
        <span className="group inline-block shrink-0"><LogoTile size="sm" /></span>
        {(!collapsed || isMobile) && (
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold leading-none text-sand-100">Vaidyagan</p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.24em] text-gold-400/70">Admin Console</p>
          </div>
        )}
        {isMobile && (
          <button onClick={onCollapse} aria-label="Close navigation" className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-forest-600 text-sand-200/70">
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {allowed.map((n) => {
          const Icon = n.icon;
          const active = page === n.id;
          return (
            <button key={n.id} onClick={() => go(n.id)} aria-label={n.label} title={n.label}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                active ? "bg-gold-400/12 text-gold-300" : "text-sand-200/60 hover:bg-forest-850 hover:text-sand-100"
              } ${collapsed && !isMobile ? "justify-center px-2" : ""}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${active ? "bg-gold-400 text-forest-950" : "bg-forest-850 text-sand-200/60 group-hover:text-gold-300"}`}>
                <Icon size={16} />
              </span>
              {(!collapsed || isMobile) && <span className="truncate text-[13px] font-medium">{n.label}</span>}
              {active && (!collapsed || isMobile) && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-400" />}
            </button>
          );
        })}
      </nav>

      {!isMobile && (
        <div className="border-t border-forest-800 p-3">
          <button onClick={onCollapse} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[12.5px] text-sand-200/50 transition-colors hover:bg-forest-850 hover:text-sand-100 ${collapsed ? "justify-center px-2" : ""}`}>
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> Collapse</>}
          </button>
        </div>
      )}
    </>
  );
}
