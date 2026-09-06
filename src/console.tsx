/* =============================================================================
   Vaidyagan Admin Console — shell + Home / Orders / Products pages
   Opens as its own route/view from the Studio header. The sidebar hides pages
   a role can't open, and every page re-checks its role on load.
   ========================================================================== */

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, Package, Users, ShieldCheck, FileText, Megaphone, BarChart3, Settings as SettingsIcon,
  Menu, Search, Bell, LogOut, ExternalLink, Check, ChevronDown, Plus, Minus, Printer, Send, Download, RefreshCw, Lock, Database,
  type LucideIcon,
} from "lucide-react";
import { useApp, auth, SmartImg, Monogram, type StudioUser } from "./lib";
import { BRAND_LOGO_URL, CATEGORIES, ORDER_FLOW, ORDER_META, formatDate, type Order, type OrderStatus, type Product } from "./data";
import { getConsoleMode, hasFirebaseConfig, seedDemoAnalytics, toCsv, downloadFile } from "./console/db";
import {
  loadOrders, saveOrderF, cancelOrderRestockF, bulkShipOrders,
  loadProducts, saveProductF, deleteProductF,
  listNotificationsF, markAllReadF, loadActivity, loadSearchIndex, type SearchIndex,
} from "./console/data";
import {
  ConfirmChip, Drawer, EmptyState, ErrorState, ListSkeleton, StatCard, StatusBadge, Switch, cInp, cLbl, timeAgo,
} from "./console/ui";
import { AnalyticsPage, ContentPage, CustomersPage, MarketingPage, SettingsPage, StaffPage, useAsync, type CRole } from "./console-pages";
import { HerbManager } from "./herbs-admin";

type Page = "home" | "orders" | "products" | "customers" | "staff" | "content" | "marketing" | "analytics" | "settings";

const PAGES: { key: Page; label: string; Icon: LucideIcon }[] = [
  { key: "home", label: "Home", Icon: LayoutDashboard },
  { key: "orders", label: "Orders", Icon: ShoppingCart },
  { key: "products", label: "Products", Icon: Package },
  { key: "customers", label: "Customers", Icon: Users },
  { key: "staff", label: "Staff & Access", Icon: ShieldCheck },
  { key: "content", label: "Content", Icon: FileText },
  { key: "marketing", label: "Marketing", Icon: Megaphone },
  { key: "analytics", label: "Analytics", Icon: BarChart3 },
  { key: "settings", label: "Settings", Icon: SettingsIcon },
];

const PAGE_ACCESS: Record<Page, CRole[]> = {
  home: ["superadmin", "editor", "viewer"],
  orders: ["superadmin", "editor", "viewer"],
  products: ["superadmin", "editor", "viewer"],
  customers: ["superadmin", "editor"],
  staff: ["superadmin"],
  content: ["superadmin", "editor"],
  marketing: ["superadmin", "editor"],
  analytics: ["superadmin", "editor", "viewer"],
  settings: ["superadmin"],
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* ---------------------------------- shell ----------------------------------- */

export function AdminConsole() {
  const { toast, navigate } = useApp();
  const [session] = useState<StudioUser | null>(() => auth.session());
  const [page, setPage] = useState<Page>("home");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  useEffect(() => { try { seedDemoAnalytics(); } catch { /* ignore */ } }, []);

  const me = session ? auth.get(session.id) ?? session : null;
  const isSuper = me?.role === "superadmin";
  const role: CRole = isSuper ? "superadmin" : me?.consoleRole === "editor" ? "editor" : "viewer";
  const canOpen = !!me && (isSuper || me.consoleAccess);

  /* route protection — a role can never sit on a page it may not open */
  useEffect(() => {
    if (!PAGE_ACCESS[page].includes(role)) setPage("home");
  }, [page, role]);

  const idx = useAsync<SearchIndex>(() => loadSearchIndex(), [tick]);
  const needle = search.trim().toLowerCase();
  const results = useMemo(() => {
    if (needle.length < 2 || !idx.rows) return [];
    const d = idx.rows;
    const out: { page: Page; kind: string; label: string; sub: string; id: string }[] = [];
    d.orders.forEach((o) => { if (o.id.toLowerCase().includes(needle) || o.name.toLowerCase().includes(needle)) out.push({ page: "orders", kind: "Order", label: o.name, sub: o.sub, id: o.id }); });
    d.products.forEach((p) => { if (p.name.toLowerCase().includes(needle)) out.push({ page: "products", kind: "Product", label: p.name, sub: p.sub, id: p.id }); });
    d.customers.forEach((c) => { if (c.name.toLowerCase().includes(needle)) out.push({ page: "customers", kind: "Customer", label: c.name, sub: c.sub, id: c.id }); });
    d.posts.forEach((p) => { if (p.name.toLowerCase().includes(needle)) out.push({ page: "content", kind: "Post", label: p.name, sub: p.sub, id: p.id }); });
    return out.slice(0, 8);
  }, [needle, idx.rows]);

  const notifs = useAsync(() => listNotificationsF(), [tick, bellOpen]);
  const unread = (notifs.rows ?? []).filter((n) => !n.read).length;

  const mode = getConsoleMode() === "live" && hasFirebaseConfig() ? "Live" : "Demo";
  const visiblePages = PAGES.filter((p) => PAGE_ACCESS[p.key].includes(role));

  /* ------------------------- locked screen (no password) --------------------- */
  if (!me || !canOpen) {
    return (
      <div className="ops-grid relative flex min-h-screen items-center justify-center bg-forest-950 px-5 font-body text-sand-100">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 40% at 50% 18%, rgba(214,180,95,0.10), transparent 70%)" }} />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative w-full max-w-md rounded-3xl border border-forest-700 bg-forest-900/85 p-10 text-center backdrop-blur">
          <span className="animate-breathe mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold-500/50 bg-gold-400/10 text-gold-300"><Lock size={26} /></span>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold-400">Admin Console</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">{me ? "This account has no console access" : "Sign in to the Studio first"}</h1>
          <p className="mt-3 text-sm leading-relaxed text-sand-200/60">
            {me
              ? "A superadmin can switch your dashboard access on from Staff & Access. Until then, this door stays closed."
              : "The console sits behind the Doctor Studio login. Sign in there with your desk account — no separate password needed."}
          </p>
          <button onClick={() => navigate({ name: "studio" })}
            className="gold-sheen mt-7 inline-flex items-center gap-2 rounded-full bg-gold-400 px-8 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">
            <ShieldCheck size={15} /> Go to Studio sign-in
          </button>
        </motion.div>
      </div>
    );
  }

  /* --------------------------------- chrome ---------------------------------- */

  return (
    <div className="relative flex min-h-screen bg-forest-950 font-body text-sand-100">
      <div aria-hidden className="ops-grid pointer-events-none fixed inset-0 opacity-50" />

      {/* sidebar — collapses to an icon rail; mobile uses a slide-in drawer */}
      <aside className={`relative z-30 hidden shrink-0 flex-col border-r border-forest-800 bg-forest-900/70 backdrop-blur transition-all duration-300 lg:flex ${collapsed ? "w-[76px]" : "w-[240px]"}`}>
        <div className={`flex items-center gap-3 border-b border-forest-800 px-4 py-5 ${collapsed ? "justify-center px-2" : ""}`}>
          <img src={BRAND_LOGO_URL} alt="Vaidyagan" className="h-10 w-10 shrink-0 rounded-xl border border-gold-500/60 object-cover" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold leading-none">Vaidyagan</p>
              <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.22em] text-gold-400/80">Admin Console</p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visiblePages.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setPage(key)} title={label} aria-current={page === key ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left font-mono text-[10.5px] uppercase tracking-[0.14em] transition-all ${collapsed ? "justify-center px-0" : ""} ${
                page === key ? "bg-gold-400/12 text-gold-300 shadow-[inset_0_0_0_1px_rgba(214,180,95,0.35)]" : "text-sand-200/55 hover:bg-forest-850 hover:text-sand-100"
              }`}>
              <Icon size={17} />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          ))}
        </nav>
        <div className="border-t border-forest-800 p-3">
          <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-forest-800 py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/45 transition-colors hover:border-gold-500/40 hover:text-gold-300">
            <ChevronDown size={13} className={`transition-transform duration-300 ${collapsed ? "-rotate-90" : "rotate-90"}`} />
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileNav && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-forest-950/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileNav(false)}>
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 32, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} className="flex h-full w-[260px] flex-col border-r border-forest-800 bg-forest-900 p-4" aria-label="Console navigation">
              <div className="flex items-center gap-3 border-b border-forest-800 pb-4">
                <img src={BRAND_LOGO_URL} alt="Vaidyagan" className="h-10 w-10 rounded-xl border border-gold-500/60 object-cover" />
                <div><p className="font-display text-lg font-semibold leading-none">Vaidyagan</p><p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.2em] text-gold-400/80">Admin Console</p></div>
              </div>
              <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
                {visiblePages.map(({ key, label, Icon }) => (
                  <button key={key} onClick={() => { setPage(key); setMobileNav(false); }}
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
        <header className="sticky top-0 z-30 border-b border-forest-800 bg-forest-950/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3.5 lg:px-7">
            <button onClick={() => setMobileNav(true)} aria-label="Open navigation" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 lg:hidden"><Menu size={17} /></button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl font-semibold leading-none">{PAGES.find((p) => p.key === page)?.label}</h1>
              <p className="mt-1 hidden font-mono text-[8.5px] uppercase tracking-[0.2em] text-sand-200/40 sm:block">Signed in as {me.name} · {role}</p>
            </div>
            <span className={`ml-1 flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.16em] ${mode === "Live" ? "border-kapha-500/60 bg-kapha-500/12 text-kapha-300" : "border-gold-500/50 bg-gold-400/10 text-gold-300"}`} title="Which database this console edits">
              <span className={`h-1.5 w-1.5 rounded-full ${mode === "Live" ? "bg-kapha-400" : "animate-blink bg-gold-400"}`} /> {mode}
            </span>

            {/* global search */}
            <div className="relative ml-auto hidden w-full max-w-xs md:block">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)}
                onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
                placeholder="Search orders, products, customers…" className={`${cInp} pl-10`} aria-label="Global search" />
              {searchOpen && needle.length >= 2 && (
                <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-forest-700 bg-forest-900 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
                  {results.length === 0 && <p className="px-4 py-3 text-[12.5px] text-sand-200/50">Nothing matches "{search}".</p>}
                  {results.map((r) => (
                    <button key={`${r.kind}-${r.id}`} onMouseDown={(e) => { e.preventDefault(); setPage(r.page); setSearch(""); setSearchOpen(false); }}
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

            {/* bell */}
            <div className="relative">
              <button onClick={() => { setBellOpen(!bellOpen); setAvatarOpen(false); }} aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
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
                      <button onClick={() => markAllReadF().then(refresh)} className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-sand-200/45 hover:text-gold-300">Mark all read</button>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {(notifs.rows ?? []).length === 0 && <p className="px-4 py-6 text-center text-[12.5px] text-sand-200/45">All quiet.</p>}
                      {(notifs.rows ?? []).slice(0, 12).map((n) => (
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
                      <p className="truncate text-[13px] font-semibold">{me.name}</p>
                      <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-gold-400/80">{role} · {mode} mode</p>
                    </div>
                    <button onClick={() => navigate({ name: "studio" })} className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[12.5px] text-sand-200/70 hover:bg-forest-850 hover:text-gold-300"><FileText size={14} /> Open Doctor Studio</button>
                    <button onClick={() => navigate({ name: "home" })} className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[12.5px] text-sand-200/70 hover:bg-forest-850 hover:text-gold-300"><ExternalLink size={14} /> View website</button>
                    <button onClick={() => { auth.logout(); window.location.reload(); }} className="flex w-full items-center gap-2.5 border-t border-forest-800 px-4 py-3 text-left text-[12.5px] text-ember-300 hover:bg-ember-500/10"><LogOut size={14} /> Sign out</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-7 lg:px-7">
          {/* opacity-only page fade: no transform left behind, so portals & fixed
              elements inside pages anchor to the viewport correctly */}
          <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            {page === "home" && <HomePage role={role} refresh={refresh} goTo={setPage} />}
            {page === "orders" && <OrdersPage role={role} refresh={refresh} />}
            {page === "products" && <ProductsPage role={role} refresh={refresh} />}
            {page === "customers" && <CustomersPage role={role} refresh={refresh} />}
            {page === "staff" && role === "superadmin" && <StaffPage role={role} refresh={refresh} />}
            {page === "content" && <ContentPage role={role} refresh={refresh} />}
            {page === "marketing" && <MarketingPage role={role} refresh={refresh} />}
            {page === "analytics" && <AnalyticsPage />}
            {page === "settings" && role === "superadmin" && <SettingsPage role={role} refresh={refresh} />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

/* ---------------------------------- home ------------------------------------ */

function HomePage({ role, refresh, goTo }: { role: CRole; refresh: () => void; goTo: (p: Page) => void }) {
  const orders = useAsync(() => loadOrders(), [refresh]);
  const products = useAsync(() => loadProducts(), [refresh]);
  const activity = useAsync(() => loadActivity(), [refresh]);

  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const os = orders.rows ?? [];
  const ps = products.rows ?? [];
  const revToday = os.filter((o) => o.status !== "cancelled" && (o.placedAt ?? "").slice(0, 10) === today).reduce((s, o) => s + o.total, 0);
  const revMonth = os.filter((o) => o.status !== "cancelled" && (o.placedAt ?? "").slice(0, 7) === month).reduce((s, o) => s + o.total, 0);
  const newOrders = os.filter((o) => o.status === "new").length;
  const lowStock = ps.filter((p) => p.stock < 5).length;

  const attention: { label: string; page: Page; tone: "ember" | "gold" }[] = [
    ...(newOrders > 0 ? [{ label: `${newOrders} new order${newOrders > 1 ? "s" : ""} to pack`, page: "orders" as Page, tone: "ember" as const }] : []),
    ...(lowStock > 0 ? [{ label: `${lowStock} product${lowStock > 1 ? "s" : ""} low on stock`, page: "products" as Page, tone: "ember" as const }] : []),
  ];

  if (orders.loading || products.loading) return <ListSkeleton rows={6} />;
  if (orders.error) return <ErrorState onRetry={orders.reload} />;

  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue today" value={inr(revToday)} sub={`${inr(revMonth)} this month`} icon={<BarChart3 size={16} />} delay={0} />
        <StatCard label="Orders" value={String(os.length)} sub={`${newOrders} new to pack`} icon={<ShoppingCart size={16} />} delay={0.06} />
        <StatCard label="Low stock" value={String(lowStock)} sub="below 5 units" tone={lowStock > 0 ? "ember" : "moss"} icon={<Package size={16} />} delay={0.12} />
        <StatCard label="Products live" value={String(ps.filter((p) => p.visible !== false).length)} sub={`${ps.length} total in catalogue`} tone="moss" icon={<Database size={16} />} delay={0.18} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Needs attention</p>
          <div className="mt-4 space-y-2.5">
            {attention.length === 0 && (
              <p className="flex items-center gap-2.5 rounded-xl border border-kapha-500/40 bg-kapha-500/8 px-4 py-3.5 text-[13px] text-kapha-300"><Check size={15} /> All clear — nothing waiting on you.</p>
            )}
            {attention.map((a) => (
              <button key={a.label} onClick={() => goTo(a.page)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 ${
                  a.tone === "ember" ? "border-ember-500/40 bg-ember-500/6 text-ember-300" : "border-gold-500/40 bg-gold-400/6 text-gold-300"
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
            {activity.loading && <ListSkeleton rows={4} />}
            {!activity.loading && (activity.rows ?? []).length === 0 && <p className="text-[13px] text-sand-200/45">Actions on the desk and in the console land here.</p>}
            {(activity.rows ?? []).slice(0, 10).map((a) => (
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

/* ---------------------------------- orders ---------------------------------- */

function OrdersPage({ role, refresh }: { role: CRole; refresh: () => void }) {
  const { toast } = useApp();
  const q = useAsync(() => loadOrders(), [refresh]);
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [needle, setNeedle] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "value">("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const canEdit = role !== "viewer";

  const orders = q.rows ?? [];
  const list = useMemo(() => {
    const n = needle.trim().toLowerCase();
    let out = orders.filter((o) => (status === "all" || o.status === status) &&
      (!n || o.id.toLowerCase().includes(n) || (o.customer?.name ?? "").toLowerCase().includes(n) || (o.customer?.phone ?? "").includes(n)));
    out = [...out].sort((a, b) => sort === "newest" ? (b.placedAt ?? "").localeCompare(a.placedAt ?? "") : sort === "oldest" ? (a.placedAt ?? "").localeCompare(b.placedAt ?? "") : b.total - a.total);
    return out;
  }, [orders, status, needle, sort]);

  const open = orders.find((o) => o.id === openId) ?? null;

  const advance = (o: Order) => {
    const next = ORDER_FLOW[ORDER_FLOW.indexOf(o.status) + 1];
    if (!next) return;
    saveOrderF(o.id, { status: next }).then(() => {
      toast(`Order ${o.id} → ${ORDER_META[next].label}`);
      q.reload(); refresh();
    });
  };

  const bulkShip = () => {
    const targets = orders.filter((o) => selected.has(o.id) && (o.status === "new" || o.status === "processing"));
    bulkShipOrders(targets.map((o) => o.id)).then(() => {
      toast(`${targets.length} order${targets.length === 1 ? "" : "s"} marked shipped`);
      setSelected(new Set()); q.reload(); refresh();
    });
  };

  const toggleSel = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const printInvoice = (o: Order) => {
    try {
      const w = window.open("", "_blank");
      if (!w) { toast("Pop-up blocked — allow pop-ups to print"); return; }
      w.document.write(`<html><head><title>Invoice ${o.id}</title><style>body{font-family:Georgia,serif;color:#22271f;padding:40px;max-width:720px;margin:0 auto}h1{margin:0}small{color:#777;font-family:monospace}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border-bottom:1px solid #e2ddcf;padding:9px 8px;text-align:left;font-size:14px}th{font-family:monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a37e2a}.amt{text-align:right}.tot td{font-weight:bold;border:none}</style></head><body>
      <div style="display:flex;gap:14px;align-items:center;border-bottom:3px solid #c49c3e;padding-bottom:14px"><img src="${BRAND_LOGO_URL}" style="width:52px;height:52px;border-radius:12px;object-fit:cover"/><div><h1>Vaidyagan</h1><small>Clinically verified Ayurveda</small></div><div style="margin-left:auto;text-align:right"><small>TAX INVOICE</small><br><b>${o.id}</b><br><small>${formatDate(o.placedAt ?? "")}</small></div></div>
      <p style="margin-top:18px"><small>BILL TO</small><br><b>${o.customer?.name ?? ""}</b><br>${o.customer?.address ?? ""}, ${o.customer?.city ?? ""} — ${o.customer?.pin ?? ""}<br>${o.customer?.phone ?? ""}</p>
      <table><tr><th>Item</th><th>Qty</th><th class="amt">Amount</th></tr>${(o.items ?? []).map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td><td class="amt">${inr(i.price * i.qty)}</td></tr>`).join("")}
      <tr class="tot"><td colspan="2">Total</td><td class="amt">${inr(o.total)}</td></tr></table>
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
          <input value={needle} onChange={(e) => setNeedle(e.target.value)} placeholder="Search order id, customer, phone…" className={`${cInp} pl-10`} aria-label="Search orders" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as "newest" | "oldest" | "value")} className={`${cInp} w-auto`} aria-label="Sort orders">
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="value">Highest value</option>
        </select>
        {canEdit && selected.size > 0 && (
          <button onClick={bulkShip} className="flex items-center gap-2 rounded-full bg-kapha-500 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:brightness-110">
            <Send size={13} /> Mark {selected.size} shipped
          </button>
        )}
      </div>

      {q.loading && <ListSkeleton rows={6} />}
      {q.error && <ErrorState onRetry={q.reload} />}
      {!q.loading && !q.error && list.length === 0 && (
        <EmptyState icon={<ShoppingCart size={22} />} title="No orders here"
          body={needle || status !== "all" ? "Nothing matches this filter — try clearing it." : "New orders appear the moment a shopper checks out."}
          actionLabel={needle || status !== "all" ? "Clear filters" : undefined}
          onAction={() => { setNeedle(""); setStatus("all"); }} />
      )}

      {!q.loading && !q.error && list.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-forest-800">
          <div className="hidden grid-cols-[40px_1fr_1.2fr_0.7fr_0.8fr_1fr_110px] items-center gap-3 border-b border-forest-800 bg-forest-900/80 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/45 md:grid">
            <span /><span>Order</span><span>Customer</span><span>Items</span><span>Total</span><span>Status</span><span />
          </div>
          {list.map((o) => (
            <div key={o.id} className="grid grid-cols-2 items-center gap-3 border-b border-forest-800 bg-forest-900/50 px-5 py-3.5 transition-colors last:border-0 hover:bg-forest-850 md:grid-cols-[40px_1fr_1.2fr_0.7fr_0.8fr_1fr_110px]">
              {canEdit ? (
                <button onClick={() => toggleSel(o.id)} aria-label={`Select ${o.id}`}
                  className={`hidden h-5 w-5 place-items-center rounded-md border transition-all md:grid ${selected.has(o.id) ? "border-gold-400 bg-gold-400 text-forest-950" : "border-forest-600"}`}>
                  {selected.has(o.id) && <Check size={12} />}
                </button>
              ) : <span />}
              <button onClick={() => setOpenId(o.id)} className="text-left">
                <p className="font-mono text-[12px] font-semibold text-gold-300">{o.id}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/40">{formatDate(o.placedAt ?? "")}</p>
              </button>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-sand-100">{o.customer?.name}</p>
                <p className="truncate text-[11px] text-sand-200/45">{o.customer?.city} · {o.customer?.phone ?? "—"}</p>
              </div>
              <p className="text-[12.5px] text-sand-200/70">{(o.items ?? []).reduce((s, i) => s + i.qty, 0)}</p>
              <p className="font-mono text-[12.5px] font-semibold text-sand-100">{inr(o.total)}</p>
              <span className="w-fit"><StatusBadge status={o.status} /></span>
              <button onClick={() => setOpenId(o.id)} className="col-span-2 w-fit rounded-full border border-forest-700 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/65 hover:border-gold-400 hover:text-gold-300 md:col-span-1">
                Open
              </button>
            </div>
          ))}
        </div>
      )}

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.id ?? ""} subtitle={`Placed ${open ? formatDate(open.placedAt ?? "") : ""} · ${open?.paymentMethod ?? "—"}`}>
        {open && (
          <div className="space-y-5">
            {open.status === "cancelled" ? (
              <p className="rounded-xl border border-ember-500/40 bg-ember-500/8 px-4 py-3 text-[12.5px] text-ember-300">Cancelled — stock was returned to the shelf.</p>
            ) : (
              <ol className="flex items-start" aria-label="Order progress">
                {ORDER_FLOW.map((s, i) => {
                  const idx = ORDER_FLOW.indexOf(open.status);
                  const done = i <= idx;
                  return (
                    <li key={s} className="relative flex-1 text-center">
                      <span className={`mx-auto grid h-7 w-7 place-items-center rounded-full border-2 ${done ? "border-kapha-500 bg-kapha-500/20 text-kapha-300" : "border-forest-700 text-sand-200/30"}`}>
                        {done ? <Check size={12} /> : <span className="font-mono text-[9px]">{i + 1}</span>}
                      </span>
                      {i < ORDER_FLOW.length - 1 && <span className={`absolute left-[calc(50%+16px)] top-3.5 h-0.5 w-[calc(100%-32px)] ${i < idx ? "bg-kapha-500" : "bg-forest-700"}`} />}
                      <p className={`mt-1.5 font-mono text-[7px] uppercase leading-tight tracking-[0.08em] ${done ? "text-kapha-300" : "text-sand-200/35"}`}>{ORDER_META[s].label}</p>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="rounded-xl border border-forest-800 bg-forest-850/60 p-4">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-gold-400/80">Ship to</p>
              <p className="mt-1.5 text-sm font-semibold text-sand-100">{open.customer?.name}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-sand-200/65">{open.customer?.address}, {open.customer?.city} — {open.customer?.pin}</p>
              <p className="mt-1 font-mono text-[11px] text-sand-200/50">{open.customer?.phone ?? "no phone"}</p>
            </div>

            <div className="space-y-2.5">
              {(open.items ?? []).map((i, x) => (
                <div key={x} className="flex items-center gap-3 rounded-xl border border-forest-800 bg-forest-850/50 p-3">
                  {i.image ? <SmartImg src={i.image} alt={i.name} className="h-12 w-12 rounded-lg border border-forest-800 object-cover duotone" /> : <span className="grid h-12 w-12 place-items-center rounded-lg border border-forest-800 bg-forest-850 font-display text-gold-500/40">वै</span>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-sand-100">{i.name}</p>
                    <p className="font-mono text-[9.5px] text-sand-200/45">{inr(i.price)} × {i.qty}</p>
                  </div>
                  <span className="font-mono text-[12px] text-sand-100">{inr(i.price * i.qty)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl border border-gold-500/35 bg-gold-400/6 px-4 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold-400">Total</span>
                <span className="font-display text-xl font-semibold text-gold-300">{inr(open.total)}</span>
              </div>
            </div>

            {canEdit && open.status !== "cancelled" && open.status !== "delivered" && (
              <div className="space-y-2.5">
                {ORDER_FLOW.indexOf(open.status) < ORDER_FLOW.length - 1 && (
                  <button onClick={() => advance(open)}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-kapha-500 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:brightness-110">
                    <Send size={14} /> Mark as {ORDER_META[ORDER_FLOW[ORDER_FLOW.indexOf(open.status) + 1]].label}
                  </button>
                )}
                <ConfirmChip label="Cancel & restock" armedLabel="Cancel this order?" timeout={4000}
                  onConfirm={() => cancelOrderRestockF(open.id).then(() => { toast(`Order ${open.id} cancelled — stock returned`); setOpenId(null); q.reload(); refresh(); })} />
              </div>
            )}
            <button onClick={() => printInvoice(open)} className="flex w-full items-center justify-center gap-2 rounded-full border border-gold-500/50 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">
              <Printer size={14} /> Print invoice
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* --------------------------------- products --------------------------------- */

const PRODUCT_CATS = ["All", "Oils", "Churnas", "Capsules", "Ghritas", "Kadhas"] as const;

function ProductsPage({ role, refresh }: { role: CRole; refresh: () => void }) {
  const { toast } = useApp();
  const q = useAsync(() => loadProducts(), [refresh]);
  const canEdit = role !== "viewer";
  const [view, setView] = useState<"cards" | "table">("cards");
  const [cat, setCat] = useState<(typeof PRODUCT_CATS)[number]>("All");
  const [needle, setNeedle] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const products = q.rows ?? [];
  const list = products.filter((p) => (cat === "All" || p.category === cat) && (!needle.trim() || p.name.toLowerCase().includes(needle.trim().toLowerCase())));

  const quickStock = (p: Product, d: number) => {
    const stock = Math.max(0, p.stock + d);
    saveProductF({ ...p, stock }).then(() => q.reload());
  };

  const exportCsv = () => {
    downloadFile("vaidyagan-products.csv", toCsv(
      ["Name", "Sanskrit", "Category", "Price", "MRP", "Stock", "Visible"],
      list.map((p) => [p.name, p.sanskrit, p.category, p.price, p.mrp, p.stock, p.visible === false ? "hidden" : "visible"]),
    ), "text/csv");
    toast("Product list downloaded as CSV");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400" />
          <input value={needle} onChange={(e) => setNeedle(e.target.value)} placeholder="Search products…" className={`${cInp} pl-10`} aria-label="Search products" />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {PRODUCT_CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border px-3.5 py-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-all ${cat === c ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55 hover:text-sand-100"}`}>{c}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-forest-700">
            {(["cards", "table"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} aria-pressed={view === v} aria-label={`${v} view`}
                className={`px-3.5 py-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-all ${view === v ? "bg-gold-400/15 text-gold-300" : "text-sand-200/50 hover:text-sand-100"}`}>{v}</button>
            ))}
          </div>
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Download size={13} /> CSV</button>
          {canEdit && (
            <button onClick={() => setEditing("new")} className="flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300"><Plus size={13} /> Add product</button>
          )}
        </div>
      </div>

      {q.loading && <ListSkeleton rows={6} />}
      {q.error && <ErrorState onRetry={q.reload} />}
      {!q.loading && !q.error && list.length === 0 && (
        <EmptyState icon={<Package size={22} />} title="No products match"
          body={needle || cat !== "All" ? "Nothing fits this search — try clearing it." : "Add your first formulation to open the store shelf."}
          actionLabel={canEdit ? "Add product" : undefined} onAction={canEdit ? () => setEditing("new") : undefined} />
      )}

      {!q.loading && !q.error && view === "cards" && list.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className={`group overflow-hidden rounded-2xl border bg-forest-900/70 transition-all hover:-translate-y-0.5 ${p.stock === 0 ? "border-forest-800 opacity-70" : p.stock < 5 ? "border-ember-500/45" : "border-forest-800 hover:border-gold-500/40"}`}>
              <button onClick={() => canEdit && setEditing(p)} className="relative block h-36 w-full overflow-hidden" aria-label={`Edit ${p.name}`}>
                <SmartImg src={p.image} alt={p.name} className="h-full w-full object-cover duotone transition-transform duration-500 group-hover:scale-105" style={p.duotone ? { filter: p.duotone } : undefined} />
                <span className="absolute left-3 top-3 rounded-full border border-gold-500/50 bg-forest-950/75 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-gold-300 backdrop-blur">{p.category}</span>
                {p.stock === 0 && <span className="absolute inset-0 grid place-items-center bg-forest-950/60 font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/70">Out of stock</span>}
                {p.stock > 0 && p.stock < 5 && <span className="absolute right-3 top-3 rounded-full bg-ember-400 px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-forest-950">{p.stock} left</span>}
                {p.visible === false && <span className="absolute bottom-3 left-3 rounded-full border border-forest-600 bg-forest-950/80 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-sand-200/60">Hidden from store</span>}
              </button>
              <div className="p-4">
                <p className="truncate text-[14px] font-semibold text-sand-100">{p.name}</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/40">{p.sanskrit}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-display text-lg font-semibold text-gold-300">{inr(p.price)} <span className="font-mono text-[10px] text-sand-200/35 line-through">{inr(p.mrp)}</span></p>
                  {canEdit && (
                    <div className="flex items-center gap-1.5" aria-label={`Stock for ${p.name}`}>
                      <button onClick={() => quickStock(p, -1)} aria-label={`Decrease stock of ${p.name}`} className="grid h-7 w-7 place-items-center rounded-full border border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Minus size={12} /></button>
                      <span className={`w-8 text-center font-mono text-[12px] ${p.stock === 0 ? "text-sand-200/40" : p.stock < 5 ? "text-ember-300" : "text-sand-100"}`}>{p.stock}</span>
                      <button onClick={() => quickStock(p, 1)} aria-label={`Increase stock of ${p.name}`} className="grid h-7 w-7 place-items-center rounded-full border border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Plus size={12} /></button>
                    </div>
                  )}
                </div>
                {canEdit && (
                  <div className="mt-3.5 flex items-center gap-2">
                    <button onClick={() => setEditing(p)} className="flex-1 rounded-full border border-forest-700 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/65 hover:border-gold-400 hover:text-gold-300">Edit</button>
                    <ConfirmChip onConfirm={() => deleteProductF(p.id).then(() => { toast(`${p.name} deleted`); q.reload(); refresh(); })} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!q.loading && !q.error && view === "table" && list.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-forest-800">
          <div className="hidden grid-cols-[2fr_1fr_0.8fr_0.8fr_1fr_120px] items-center gap-3 border-b border-forest-800 bg-forest-900/80 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/45 md:grid">
            <span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Visibility</span><span />
          </div>
          {list.map((p) => (
            <div key={p.id} className="grid grid-cols-2 items-center gap-3 border-b border-forest-800 bg-forest-900/50 px-5 py-3 last:border-0 hover:bg-forest-850 md:grid-cols-[2fr_1fr_0.8fr_0.8fr_1fr_120px]">
              <span className="flex items-center gap-3">
                <SmartImg src={p.image} alt="" className="h-10 w-10 rounded-lg border border-forest-800 object-cover duotone" />
                <span className="min-w-0"><span className="block truncate text-[13px] font-semibold text-sand-100">{p.name}</span><span className="block font-mono text-[8.5px] uppercase text-sand-200/40">{p.sanskrit}</span></span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-sand-200/55">{p.category}</span>
              <span className="font-mono text-[12.5px] text-sand-100">{inr(p.price)}</span>
              <span className={`font-mono text-[12.5px] ${p.stock === 0 ? "text-sand-200/40" : p.stock < 5 ? "text-ember-300" : "text-sand-100"}`}>{p.stock}</span>
              <span className="col-span-2 md:col-span-1">
                {p.visible === false
                  ? <span className="rounded-full border border-forest-700 px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-sand-200/50">Hidden</span>
                  : <span className="rounded-full border border-kapha-500/40 bg-kapha-500/10 px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-kapha-300">Visible</span>}
              </span>
              {canEdit && <button onClick={() => setEditing(p)} className="col-span-2 w-fit rounded-full border border-forest-700 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/65 hover:border-gold-400 hover:text-gold-300 md:col-span-1">Edit</button>}
            </div>
          ))}
        </div>
      )}

      {editing && <ProductEditor product={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); q.reload(); refresh(); }} />}
    </div>
  );
}

function ProductEditor({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useApp();
  const blank: Product = {
    id: `p-${Date.now()}`, name: "", sanskrit: "", price: 0, mrp: 0, image: "", category: "Churnas",
    stock: 10, rating: 4.5, dosage: "", ingredients: [], desc: "", highlights: [], source: "", directions: "", safety: "", visible: true,
  };
  const [f, setF] = useState<Product>(product ?? blank);
  const [ingText, setIngText] = useState((product?.ingredients ?? []).join(", "));
  const [hlText, setHlText] = useState((product?.highlights ?? []).join("\n"));
  const [saving, setSaving] = useState(false);

  const save = () => {
    if (!f.name.trim()) { toast("Give the product a name"); return; }
    setSaving(true);
    const next: Product = {
      ...f,
      ingredients: ingText.split(",").map((s) => s.trim()).filter(Boolean),
      highlights: hlText.split("\n").map((s) => s.trim()).filter(Boolean),
      mrp: f.mrp || f.price,
    };
    saveProductF(next).then(() => {
      setSaving(false);
      toast(product ? `${next.name} updated` : `${next.name} added to the shelf`);
      onSaved();
    });
  };

  const input = cInp;
  const label = cLbl;

  return (
    <Drawer open onClose={onClose} title={product ? "Edit product" : "New product"} subtitle={product ? product.name : "Add to the store shelf"} wide>
      <div className="space-y-4">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div><label className={label}>Name *</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={input} /></div>
          <div><label className={label}>Sanskrit</label><input value={f.sanskrit} onChange={(e) => setF({ ...f, sanskrit: e.target.value })} className={input} /></div>
          <div>
            <label className={label}>Category</label>
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Product["category"] })} className={input}>
              {(["Oils", "Churnas", "Capsules", "Ghritas", "Kadhas"] as const).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div><label className={label}>Price ₹</label><input value={f.price || ""} onChange={(e) => setF({ ...f, price: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} className={input} /></div>
            <div><label className={label}>MRP ₹</label><input value={f.mrp || ""} onChange={(e) => setF({ ...f, mrp: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} className={input} /></div>
            <div><label className={label}>Stock</label><input value={f.stock} onChange={(e) => setF({ ...f, stock: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} className={input} /></div>
          </div>
        </div>

        <div>
          <label className={label}>Photo — upload or paste a URL</label>
          <div className="flex flex-wrap items-center gap-3">
            {f.image && <SmartImg src={f.image} alt="Preview" className="h-12 w-16 rounded-lg border border-forest-700 object-cover" />}
            <input value={f.image.startsWith("") ? "(uploaded image)" : f.image} onChange={(e) => setF({ ...f, image: e.target.value })} placeholder="https://…" className={`${input} max-w-[220px]`} />
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-forest-600 px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">
              <Plus size={13} /> Upload image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                import("./lib").then(({ readImageFile }) => {
                  const file = e.target.files?.[0];
                  if (file) readImageFile(file, (u) => setF({ ...f, image: u }), (m) => toast(m));
                });
                e.target.value = "";
              }} />
            </label>
          </div>
        </div>

        <div><label className={label}>Description</label><textarea value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} rows={3} className={input} /></div>
        <div><label className={label}>Highlights — one per line</label><textarea value={hlText} onChange={(e) => setHlText(e.target.value)} rows={3} className={input} placeholder={"Slow-infused over 21 days\n60+ classical herbs"} /></div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div><label className={label}>Ingredients — comma separated</label><textarea value={ingText} onChange={(e) => setIngText(e.target.value)} rows={3} className={input} /></div>
          <div><label className={label}>Classical source</label><input value={f.source ?? ""} onChange={(e) => setF({ ...f, source: e.target.value })} className={input} placeholder="Charaka Samhita…" /></div>
          <div><label className={label}>Directions / dosage</label><textarea value={f.directions ?? ""} onChange={(e) => setF({ ...f, directions: e.target.value })} rows={2} className={input} /></div>
          <div><label className={label}>Safety notes</label><textarea value={f.safety ?? ""} onChange={(e) => setF({ ...f, safety: e.target.value })} rows={2} className={input} /></div>
        </div>

        <Switch on={f.visible !== false} label="Show in Store" desc="Off hides it from shoppers without deleting anything." onChange={(b) => setF({ ...f, visible: b })} />

        <div className="flex flex-wrap gap-2.5 border-t border-forest-800 pt-4">
          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-full bg-gold-400 px-7 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300 disabled:opacity-60">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />} {product ? "Save changes" : "Add product"}
          </button>
          <button onClick={onClose} className="rounded-full border border-forest-700 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200/60 hover:text-sand-100">Cancel</button>
        </div>
      </div>
    </Drawer>
  );
}
