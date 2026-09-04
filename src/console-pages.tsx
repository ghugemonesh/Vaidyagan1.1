import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useApp, auth, readImageFile, SmartImg, type StudioUser } from "./lib";
import {
  PRODUCTS, ORDER_META, ORDER_FLOW, CATEGORIES, authorFor, formatDate, kindOf, KIND_META,
  type Article, type Order, type OrderStatus, type Product,
} from "./data";
import {
  getConsoleSettings, saveConsoleSettings, getFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig,
  validateConfig, hasFirebaseConfig, getConsoleMode, setConsoleMode,
  listDiscounts, saveDiscount, deleteDiscount, validateDiscount, type Discount,
  listCustomersWithStats, updateCustomerFlags, type CustomerRecord,
  listNotifications, listPageViews, isMaintenanceOn, setMaintenance,
  exportAllData, SITE_KEYS, toggleHiddenReview, listHiddenReviews,
} from "./console/db";
import { HerbManager } from "./herbs-admin";
import {
  Check, Close, Plus, Trash, Download, Upload, Search, Star, Shield, Lock, Users, Eye, Clock, Key, Bell,
} from "./icons";

/* ------------------------------- shared bits -------------------------------- */

export const cInp = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
export const cLbl = "mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80";

export function Switch({ on, onChange, disabled, label, desc }: { on: boolean; onChange: (b: boolean) => void; disabled?: boolean; label: string; desc?: string }) {
  return (
    <button role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all ${disabled ? "cursor-not-allowed opacity-50" : ""} ${on ? "border-[#5f947e]/50 bg-[#5f947e]/8" : "border-forest-700 bg-forest-950/40 hover:border-forest-600"}`}>
      <span className="min-w-0">
        <span className={`block text-[14px] font-semibold ${on ? "text-sand-100" : "text-sand-200/70"}`}>{label}</span>
        {desc && <span className="mt-0.5 block text-[12px] leading-snug text-sand-200/45">{desc}</span>}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-[#5f947e]" : "bg-forest-700"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-sand-100 shadow transition-all ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

export function downloadFile(name: string, content: string, type: string) {
  try {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch { /* ignore */ }
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export type CRole = "superadmin" | "editor" | "viewer";
export interface PageProps { role: CRole; refresh: () => void }

/* --------------------------------- customers -------------------------------- */

export function CustomersPage({ role }: PageProps) {
  const { orders, toast } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "repeat" | "new">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [, force] = useState(0);

  const customers = useMemo(() => {
    const all = listCustomersWithStats();
    const needle = q.trim().toLowerCase();
    return all
      .filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle) || c.phone.includes(needle))
      .filter((c) => filter === "all" || (filter === "repeat" ? c.orders > 1 : Date.now() - new Date(c.createdAt).getTime() < 30 * 86400e3))
      .sort((a, b) => b.spent - a.spent);
  }, [q, filter, orders.length]);

  const open = customers.find((c) => c.id === openId) ?? null;
  const openOrders = open ? orders.filter((o) => o.customerId === open.id) : [];
  const [notes, setNotes] = useState("");
  const lastOpened = useRef<string | null>(null);
  if (open && lastOpened.current !== open.id) { lastOpened.current = open.id; setNotes(open.notes ?? ""); }

  const exportCsv = () => {
    downloadFile("vaidyagan-customers.csv", toCsv([
      ["Name", "Email", "Phone", "Provider", "Orders", "Total spent", "Joined", "Suspended"],
      ...customers.map((c) => [c.name, c.email, c.phone, c.provider, c.orders, c.spent, c.createdAt.slice(0, 10), c.suspended ? "yes" : "no"]),
    ]), "text/csv");
    toast("Customers exported as CSV");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone…" className={`${cInp} pl-10`} />
        </div>
        {(["all", "repeat", "new"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-all ${filter === f ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55 hover:text-sand-100"}`}>
            {f === "all" ? "All" : f === "repeat" ? "Repeat buyers" : "New (30d)"}
          </button>
        ))}
        <button onClick={exportCsv} className="flex items-center gap-2 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Download size={13} /> CSV</button>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-forest-700 p-14 text-center">
          <Users size={28} className="mx-auto text-forest-600" />
          <p className="mt-4 font-display text-xl text-sand-200/70">No customers found</p>
          <p className="mt-2 text-sm text-sand-200/45">Shoppers appear here the moment they sign in at checkout.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-forest-800">
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_1fr] gap-3 border-b border-forest-800 bg-forest-900/80 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/45 md:grid">
            <span>Customer</span><span>Contact</span><span>Provider</span><span>Orders</span><span>Spent</span><span>Joined</span>
          </div>
          {customers.map((c) => (
            <button key={c.id} onClick={() => setOpenId(c.id)}
              className="grid w-full grid-cols-2 items-center gap-3 border-b border-forest-800 bg-forest-900/50 px-5 py-3.5 text-left transition-colors last:border-0 hover:bg-forest-850 md:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_1fr]">
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold-500/40 bg-gold-400/10 font-display text-sm text-gold-300">{c.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 truncate text-sm font-semibold text-sand-100">{c.name}
                    {c.suspended && <span className="rounded-full border border-ember-500/40 bg-ember-500/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-ember-300">Suspended</span>}
                  </span>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/40 md:hidden">{c.email || c.phone}</span>
                </span>
              </span>
              <span className="hidden truncate text-[12.5px] text-sand-200/65 md:block">{c.email || c.phone}</span>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-sand-200/50 md:block">{c.provider}</span>
              <span className="text-sm font-semibold text-sand-100">{c.orders}</span>
              <span className="font-mono text-[12px] text-gold-300">₹{c.spent.toLocaleString("en-IN")}</span>
              <span className="hidden font-mono text-[10px] text-sand-200/45 md:block">{formatDate(c.createdAt)}</span>
            </button>
          ))}
        </div>
      )}

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-forest-950/70 backdrop-blur-sm" onClick={() => setOpenId(null)}>
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()} className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto border-l border-forest-800 bg-forest-900 p-6" role="dialog" aria-label={`Customer ${open.name}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">Customer profile</p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-sand-100">{open.name}</h3>
                <p className="mt-1 text-[12.5px] text-sand-200/55">{open.email || "no email"} · {open.phone || "no phone"} · via {open.provider}</p>
              </div>
              <button onClick={() => setOpenId(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><Close size={15} /></button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {([["Orders", String(open.orders)], ["Spent", `₹${open.spent.toLocaleString("en-IN")}`], ["Joined", formatDate(open.createdAt)]] as [string, string][]).map(([k, v]) => (
                <div key={k} className="rounded-xl border border-forest-800 bg-forest-850/60 p-3 text-center"><p className="font-display text-lg font-semibold text-gold-300">{v}</p><p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-sand-200/40">{k}</p></div>
              ))}
            </div>
            {role !== "viewer" && (
              <div className="mt-5">
                <Switch on={!open.suspended} label={open.suspended ? "Account suspended" : "Account active"} desc={open.suspended ? "They cannot sign in right now. Reactivate to restore access." : "Suspend to block sign-in (orders stay recorded)."}
                  onChange={(b) => { if (updateCustomerFlags(open.id, { suspended: !b })) { toast(b ? `${open.name} reactivated` : `${open.name} suspended`); force((x) => x + 1); } }} />
              </div>
            )}
            <div className="mt-5">
              <p className={cLbl}>Address book</p>
              {open.addresses.length === 0 && <p className="text-[12.5px] text-sand-200/45">No saved addresses.</p>}
              <div className="space-y-2">
                {open.addresses.map((a, i) => {
                  const addr = a as { line1?: string; city?: string; pin?: string; label?: string };
                  return <p key={i} className="rounded-lg border border-forest-800 bg-forest-850/50 px-3.5 py-2.5 text-[12.5px] text-sand-200/70">{addr.label ? <b className="text-sand-200/90">{addr.label}: </b> : null}{addr.line1}, {addr.city} — {addr.pin}</p>;
                })}
              </div>
            </div>
            <div className="mt-5">
              <p className={cLbl}>Order history</p>
              {openOrders.length === 0 && <p className="text-[12.5px] text-sand-200/45">No orders yet.</p>}
              <div className="space-y-2">
                {openOrders.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 rounded-lg border border-forest-800 bg-forest-850/50 px-3.5 py-2.5">
                    <span className="font-mono text-[11px] font-semibold text-gold-300">{o.id}</span>
                    <span className="flex-1 truncate text-[12px] text-sand-200/60">{o.items.map((i) => i.name).join(", ")}</span>
                    <span className="rounded-full px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em]" style={{ color: ORDER_META[o.status].color, background: `${ORDER_META[o.status].color}15` }}>{ORDER_META[o.status].label}</span>
                  </div>
                ))}
              </div>
            </div>
            {role !== "viewer" && (
              <div className="mt-5">
                <p className={cLbl}>Private notes</p>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="e.g. prefers WhatsApp updates…" className={cInp} />
                <button onClick={() => { if (updateCustomerFlags(open.id, { notes })) toast("Notes saved"); }} className="mt-2 rounded-full bg-gold-400 px-5 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300">Save notes</button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </div>
  );
}

/* ---------------------------------- staff ----------------------------------- */

export function StaffPage({ refresh }: PageProps) {
  const { toast, logActivity } = useApp();
  const [, force] = useState(0);
  const users = auth.list();
  const [invite, setInvite] = useState({ name: "", email: "", role: "editor" as "editor" | "viewer" });

  const sendInvite = () => {
    if (!invite.name.trim() || !invite.email.trim()) { toast("Name and email are required"); return; }
    const username = invite.email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase() || `user${Date.now() % 1000}`;
    const res = auth.addMember({ name: invite.name.trim(), username, password: `vg-${Date.now().toString(36).slice(-6)}`, role: "doctor", specialty: "Invited from console", consoleAccess: true, consoleRole: invite.role });
    if (!res.ok) { toast(res.error ?? "Could not invite"); return; }
    logActivity("member", `invited ${res.user!.name} to the console as ${invite.role}`);
    toast(`${res.user!.name} invited — temporary username "${username}"`);
    setInvite({ name: "", email: "", role: "editor" });
    force((x) => x + 1); refresh();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gold-500/35 bg-gold-400/5 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-300">Invite someone to the console</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-sand-200/55">They'll appear in the member list with dashboard access on. Editors can manage orders, products and content; viewers get a read-only overview.</p>
        <div className="mt-3.5 grid gap-3 sm:grid-cols-[1fr_1fr_150px_auto]">
          <input value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} placeholder="Full name" className={cInp} />
          <input value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="Email" className={cInp} />
          <select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value as "editor" | "viewer" })} className={cInp}>
            <option value="editor">Editor</option><option value="viewer">Viewer</option>
          </select>
          <button onClick={sendInvite} className="flex items-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Plus size={13} /> Invite</button>
        </div>
      </div>

      <div className="space-y-3">
        {users.map((u) => {
          const isSuper = u.role === "superadmin";
          const hasAccess = isSuper || u.consoleAccess;
          return (
            <div key={u.id} className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 ${isSuper ? "border-gold-500/40 bg-gold-400/5" : "border-forest-800 bg-forest-850/50"}`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-sm font-semibold" style={{ background: `${u.hue}18`, color: u.hue, border: `1px solid ${u.hue}55` }}>
                {u.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sand-100">
                  {u.name}
                  {isSuper
                    ? <span className="rounded-full border border-gold-500/50 bg-gold-400/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-gold-300">Superadmin</span>
                    : <span className="rounded-full border border-forest-700 bg-forest-800 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-sand-200/55">Member</span>}
                  {!u.active && <span className="rounded-full border border-ember-500/40 bg-ember-500/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-ember-300">Suspended</span>}
                </p>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/40">@{u.username} · {u.specialty} · joined {u.createdAt}</p>
              </div>
              {!isSuper && (
                <select value={u.consoleRole} aria-label={`Console role for ${u.name}`}
                  onChange={(e) => { auth.setPerms(u.id, { consoleRole: e.target.value as "editor" | "viewer" }); logActivity("member", `made ${u.name} a console ${e.target.value}`); toast(`${u.name} is now a console ${e.target.value}`); force((x) => x + 1); refresh(); }}
                  className="rounded-lg border border-forest-700 bg-forest-950/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-sand-200/75 focus:border-gold-400 focus:outline-none">
                  <option value="editor">Editor · can change things</option>
                  <option value="viewer">Viewer · read-only</option>
                </select>
              )}
              <div className="flex items-center gap-2.5">
                <span className={`font-mono text-[8.5px] uppercase tracking-[0.12em] ${hasAccess ? "text-[#a9cfbf]" : "text-sand-200/40"}`}>{hasAccess ? "Access on" : "Access off"}</span>
                <Switch on={hasAccess} disabled={isSuper || u.id === auth.session()?.id} label="" desc=""
                  onChange={(b) => {
                    if (u.id === auth.session()?.id) { toast("You can't revoke your own dashboard access"); return; }
                    auth.setPerms(u.id, { consoleAccess: b });
                    logActivity("member", b ? `granted console access to ${u.name}` : `revoked console access from ${u.name}`);
                    toast(b ? `${u.name} can open the console` : `${u.name} locked out of the console`);
                    force((x) => x + 1); refresh();
                  }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="rounded-xl border border-forest-800 bg-forest-900/60 p-4 text-[12px] leading-relaxed text-sand-200/50">
        <b className="text-sand-200/80">How route protection works:</b> the sidebar hides pages a role can't open, every page re-checks the role when it loads,
        and — once connected — the Firestore rules refuse the underlying data to anyone unauthorised, even if they copied the app.
      </p>
    </div>
  );
}

/* --------------------------------- content ---------------------------------- */

export function ContentPage({ role, refresh }: PageProps) {
  const { allArticles, saveDraft, publishArticle, deleteArticle, products, storeEnabled, setStoreEnabled, profileTabEnabled, setProfileTabEnabled, toast, logActivity, navigate } = useApp();
  const [sub, setSub] = useState<"posts" | "herbs" | "reviews" | "switches">("posts");
  const [status, setStatus] = useState<"all" | Article["status"]>("all");
  const hidden = listHiddenReviews();
  const [, force] = useState(0);

  const posts = useMemo(() => {
    const list = allArticles.filter((a) => status === "all" || a.status === status);
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [allArticles, status]);

  const allReviews = useMemo(() =>
    products.flatMap((p) => (p.reviews ?? []).map((r) => ({ key: `${p.id}:${r.id}`, product: p.name, r }))),
    [products]);

  const canEdit = role !== "viewer";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {([["posts", `Posts · ${allArticles.length}`], ["herbs", "Herb Index"], ["reviews", `Reviews · ${allReviews.length}`], ["switches", "Master switches"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setSub(k)} className={`rounded-full border px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-all ${sub === k ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55 hover:text-sand-100"}`}>{l}</button>
        ))}
      </div>

      {sub === "posts" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "published", "review", "draft", "scheduled"] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={`rounded-full border px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] transition-all ${status === s ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/50"}`}>
                {s === "all" ? `All · ${allArticles.length}` : `${s} · ${allArticles.filter((a) => a.status === s).length}`}
              </button>
            ))}
          </div>
          <div className="space-y-2.5">
            {posts.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-forest-800 bg-forest-850/50 p-3.5">
                <SmartImg src={a.cover} alt="" className="h-12 w-20 rounded-lg border border-forest-800 object-cover duotone" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-sand-100">{a.title || "Untitled"}</p>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.13em] text-sand-200/40">
                    {authorFor(a).name} · {KIND_META[kindOf(a)].short} · {formatDate(a.date)} ·{" "}
                    <span style={{ color: a.status === "published" ? "#a9cfbf" : a.status === "review" ? "#f0a377" : "inherit" }}>{a.status}</span>
                  </p>
                </div>
                {canEdit && (
                  <div className="flex flex-wrap gap-1.5">
                    {a.status === "review" && (
                      <button onClick={() => { const p = { ...a, status: "published" as const }; saveDraft(p); publishArticle(p); logActivity("approve", `approved & published "${a.title}"`, a.title); toast(`"${a.title}" is live`); refresh(); }}
                        className="rounded-full bg-[#5f947e] px-3.5 py-1.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.12em] text-forest-950 hover:bg-[#82b39e]">Approve</button>
                    )}
                    {a.status === "published" && (
                      <button onClick={() => { saveDraft({ ...a, status: "draft" }); logActivity("edit", `unpublished "${a.title}"`, a.title); toast(`"${a.title}" unpublished`); refresh(); }}
                        className="rounded-full border border-forest-700 px-3.5 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">Unpublish</button>
                    )}
                    {(a.status === "draft" || a.status === "scheduled") && (
                      <button onClick={() => { const p = { ...a, status: "published" as const }; saveDraft(p); publishArticle(p); logActivity("publish", `published "${a.title}"`, a.title); toast(`"${a.title}" is live`); refresh(); }}
                        className="rounded-full border border-[#5f947e]/50 px-3.5 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-[#a9cfbf] hover:bg-[#5f947e]/15">Publish</button>
                    )}
                    <button onClick={() => navigate({ name: "studio" })} className="rounded-full border border-forest-700 px-3.5 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">Open in Studio</button>
                    {role === "superadmin" && (
                      <button onClick={() => { deleteArticle(a.id); logActivity("edit", `deleted "${a.title}"`, a.title); toast("Article deleted"); refresh(); }}
                        className="grid h-7 w-7 place-items-center rounded-full border border-forest-700 text-sand-200/40 hover:border-ember-400 hover:text-ember-300" aria-label={`Delete ${a.title}`}><Trash size={12} /></button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {posts.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-10 text-center text-sm text-sand-200/45">Nothing with this status.</p>}
          </div>
        </div>
      )}

      {sub === "herbs" && (canEdit ? <HerbManager /> : <p className="rounded-xl border border-dashed border-forest-700 p-10 text-center text-sm text-sand-200/45">Viewers can't edit the herb index.</p>)}

      {sub === "reviews" && (
        <div className="space-y-2.5">
          <p className="text-[12.5px] leading-relaxed text-sand-200/55">
            Hidden reviews disappear from the public product pages instantly.{" "}
            {getConsoleSettings().moderateReviews ? "Moderation mode is ON in Settings." : "Moderation mode is OFF — all approved reviews show."}
          </p>
          {allReviews.map(({ key, product, r }) => {
            const isHidden = hidden.includes(key);
            return (
              <div key={key} className={`flex flex-wrap items-center gap-3 rounded-xl border p-3.5 ${isHidden ? "border-forest-800 bg-forest-900/40 opacity-60" : "border-forest-800 bg-forest-850/50"}`}>
                <span className="flex items-center gap-1 font-mono text-[11px] text-gold-300"><Star size={11} /> {r.rating}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-sand-200/85"><b className="text-sand-100">{r.name}</b> on {product}: {r.text}</p>
                  <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-sand-200/35">{r.date}{r.verified ? " · verified" : ""}</p>
                </div>
                {canEdit && (
                  <button onClick={() => { toggleHiddenReview(key); force((x) => x + 1); toast(isHidden ? "Review restored" : "Review hidden from the site"); }}
                    className={`rounded-full border px-3.5 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] ${isHidden ? "border-[#5f947e]/50 text-[#a9cfbf] hover:bg-[#5f947e]/15" : "border-forest-700 text-sand-200/60 hover:border-ember-400 hover:text-ember-300"}`}>
                    {isHidden ? "Restore" : "Hide"}
                  </button>
                )}
              </div>
            );
          })}
          {allReviews.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-10 text-center text-sm text-sand-200/45">No reviews yet.</p>}
        </div>
      )}

      {sub === "switches" && (
        role === "superadmin" ? (
          <div className="max-w-xl space-y-2.5">
            <Switch on={storeEnabled} label="Enable Public Store" desc="Turn this off to hide the Store tab from the main website."
              onChange={(b) => { setStoreEnabled(b); logActivity("store", b ? "enabled the public store" : "paused the public store"); toast(b ? "Public store enabled" : "Public store paused"); refresh(); }} />
            <Switch on={profileTabEnabled} label="Show 'My Profile' tab in the Studio" desc="Lets doctors maintain their public profile, clinic and payout details."
              onChange={(b) => { setProfileTabEnabled(b); logActivity("member", b ? "showed the My Profile tab" : "hid the My Profile tab"); toast(b ? "Profile tab visible" : "Profile tab hidden"); refresh(); }} />
            <Switch on={isMaintenanceOn()} label="Maintenance mode" desc="Visitors see a friendly 'under construction' page. Staff can still sign in."
              onChange={(b) => { setMaintenance(b); logActivity("edit", b ? "turned maintenance mode ON" : "turned maintenance mode OFF"); toast(b ? "Maintenance mode ON" : "Maintenance mode off"); force((x) => x + 1); }} />
          </div>
        ) : <p className="rounded-xl border border-dashed border-forest-700 p-10 text-center text-sm text-sand-200/45">Master switches need a Superadmin.</p>
      )}
    </div>
  );
}

/* --------------------------------- marketing -------------------------------- */

export function MarketingPage({ role }: PageProps) {
  const { toast } = useApp();
  const [, force] = useState(0);
  const discounts = listDiscounts();
  const [form, setForm] = useState<Discount | null>(null);
  const [tryCode, setTryCode] = useState("");
  const [tryAmount, setTryAmount] = useState("1200");
  const canEdit = role !== "viewer";

  const testResult = useMemo(() => (tryCode ? validateDiscount(tryCode, parseInt(tryAmount.replace(/\D/g, "") || "0", 10)) : null), [tryCode, tryAmount]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {canEdit && (
          <button onClick={() => setForm({ id: `d-${Date.now()}`, code: "", type: "percent", value: 10, minOrder: 0, expires: "", active: true, createdAt: new Date().toISOString().slice(0, 10) })}
            className="flex items-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">
            <Plus size={13} /> New discount code
          </button>
        )}
        <div className="space-y-2.5">
          {discounts.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-forest-800 bg-forest-850/50 p-4">
              <span className="rounded-lg border border-gold-500/50 bg-gold-400/10 px-3 py-1.5 font-mono text-[12px] font-bold tracking-[0.14em] text-gold-300">{d.code}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-sand-200/80">{d.type === "percent" ? `${d.value}% off` : `₹${d.value} off`}{d.minOrder > 0 && ` · min order ₹${d.minOrder}`}{d.expires && ` · until ${d.expires}`}</p>
                <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-sand-200/35">created {d.createdAt}</p>
              </div>
              {canEdit && (
                <>
                  <Switch on={d.active} label="" desc="" onChange={(b) => { saveDiscount({ ...d, active: b }); toast(b ? `${d.code} switched on` : `${d.code} switched off`); force((x) => x + 1); }} />
                  <button onClick={() => { deleteDiscount(d.id); toast(`${d.code} deleted`); force((x) => x + 1); }} aria-label={`Delete ${d.code}`} className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200/40 hover:border-ember-400 hover:text-ember-300"><Trash size={13} /></button>
                </>
              )}
            </div>
          ))}
          {discounts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-forest-700 p-12 text-center">
              <Star size={26} className="mx-auto text-forest-600" />
              <p className="mt-4 font-display text-xl text-sand-200/70">No discount codes yet</p>
              <p className="mt-2 text-sm text-sand-200/45">Create one like WELCOME10 — checkout applies it automatically.</p>
            </div>
          )}
        </div>
      </div>

      <div className="h-fit rounded-2xl border border-forest-800 bg-forest-900/70 p-5">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">Test a code</p>
        <div className="mt-3 space-y-2.5">
          <input value={tryCode} onChange={(e) => setTryCode(e.target.value)} placeholder="e.g. WELCOME10" className={cInp} />
          <input value={tryAmount} onChange={(e) => setTryAmount(e.target.value)} placeholder="Order amount ₹" className={cInp} />
          {testResult && (
            <div className={`rounded-xl border p-3.5 text-[12.5px] leading-relaxed ${testResult.ok ? "border-[#5f947e]/50 bg-[#5f947e]/8 text-[#a9cfbf]" : "border-ember-500/40 bg-ember-500/8 text-ember-300"}`}>
              {testResult.ok ? <>Shopper saves <b>₹{testResult.amount.toLocaleString("en-IN")}</b> with {testResult.discount.code}.</> : testResult.reason}
            </div>
          )}
        </div>
      </div>

      {form && canEdit && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-forest-950/85 p-4 backdrop-blur-sm" onClick={() => setForm(null)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900 p-6" role="dialog" aria-label="New discount">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">New discount code</p>
              <button onClick={() => setForm(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><Close size={15} /></button>
            </div>
            <div className="mt-4 space-y-3">
              <div><label className={cLbl}>Code *</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} placeholder="WELCOME10" className={`${cInp} font-mono tracking-[0.14em]`} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={cLbl}>Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "flat" })} className={cInp}>
                    <option value="percent">Percent %</option><option value="flat">Flat ₹</option>
                  </select>
                </div>
                <div><label className={cLbl}>Value</label><input value={form.value} onChange={(e) => setForm({ ...form, value: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} className={cInp} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={cLbl}>Min order ₹</label><input value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} className={cInp} /></div>
                <div><label className={cLbl}>Expires (optional)</label><input type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} className={cInp} /></div>
              </div>
              <button onClick={() => {
                if (!form.code.trim()) { toast("Give the code a name"); return; }
                if (form.value <= 0) { toast("The value must be more than zero"); return; }
                saveDiscount(form); toast(`${form.code} created`); setForm(null); force((x) => x + 1);
              }} className="w-full rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Create code</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

/* --------------------------------- analytics -------------------------------- */

export function AnalyticsPage() {
  const { orders, products } = useApp();

  const days = useMemo(() => {
    const out: { label: string; total: number }[] = [];
    for (let d = 13; d >= 0; d--) {
      const day = new Date(Date.now() - d * 86400e3);
      const key = day.toISOString().slice(0, 10);
      const total = orders.filter((o) => o.status !== "cancelled" && o.placedAt.slice(0, 10) === key).reduce((s, o) => s + o.total, 0);
      out.push({ label: day.toLocaleDateString(undefined, { day: "numeric" }), total });
    }
    return out;
  }, [orders]);
  const maxDay = Math.max(1, ...days.map((d) => d.total));

  const statusCounts = ORDER_FLOW.concat(["cancelled" as OrderStatus]).map((s) => ({ s, n: orders.filter((o) => o.status === s).length, color: ORDER_META[s].color }));
  const totalOrders = Math.max(1, orders.length);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; qty: number }>();
    orders.filter((o) => o.status !== "cancelled").forEach((o) => o.items.forEach((i) => {
      const hit = map.get(i.name) ?? { name: i.name, revenue: 0, qty: 0 };
      hit.revenue += i.price * i.qty; hit.qty += i.qty;
      map.set(i.name, hit);
    }));
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);
  const maxTop = Math.max(1, ...topProducts.map((t) => t.revenue));

  const views = useMemo(() => {
    const map = new Map<string, number>();
    listPageViews().forEach((v) => map.set(v.page, (map.get(v.page) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, []);
  const maxView = Math.max(1, ...views.map(([, n]) => n));

  const donut = useMemo(() => {
    let acc = 0;
    const segs = statusCounts.filter((x) => x.n > 0).map((x) => {
      const start = acc / totalOrders; acc += x.n;
      return { ...x, start, frac: x.n / totalOrders };
    });
    return segs;
  }, [orders]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6 lg:col-span-2">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Revenue — last 14 days</p>
          <p className="font-display text-2xl font-semibold text-gold-300">₹{days.reduce((s, d) => s + d.total, 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="mt-5 flex h-40 items-end gap-1.5">
          {days.map((d, i) => (
            <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
              <span className="font-mono text-[8px] text-gold-300 opacity-0 transition-opacity group-hover:opacity-100">₹{d.total}</span>
              <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(3, (d.total / maxDay) * 100)}%` }} transition={{ duration: 0.6, delay: i * 0.03 }}
                className="w-full rounded-t-md bg-gradient-to-t from-gold-600/70 to-gold-300 transition-all group-hover:from-gold-500 group-hover:to-gold-200" />
              <span className="font-mono text-[8px] text-sand-200/35">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Orders by status</p>
        <div className="mt-5 flex items-center gap-7">
          <svg viewBox="0 0 42 42" className="h-36 w-36 -rotate-90">
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="#182a1e" strokeWidth="6" />
            {donut.map((seg) => (
              <circle key={seg.s} cx="21" cy="21" r="15.9" fill="none" stroke={seg.color} strokeWidth="6"
                strokeDasharray={`${seg.frac * 100} ${100 - seg.frac * 100}`} strokeDashoffset={-seg.start * 100} strokeLinecap="butt" />
            ))}
          </svg>
          <ul className="flex-1 space-y-2">
            {statusCounts.filter((x) => x.n > 0).map((x) => (
              <li key={x.s} className="flex items-center gap-2.5 text-[12.5px] text-sand-200/75">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: x.color }} />
                <span className="flex-1">{ORDER_META[x.s].label}</span>
                <span className="font-mono text-[11px] text-sand-100">{x.n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Top products by revenue</p>
        <div className="mt-5 space-y-3.5">
          {topProducts.map((t, i) => (
            <div key={t.name}>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="truncate text-sand-200/80"><b className="text-gold-300">#{i + 1}</b> {t.name} <span className="text-sand-200/40">× {t.qty}</span></span>
                <span className="font-mono text-[11px] text-sand-100">₹{t.revenue.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-forest-800">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(t.revenue / maxTop) * 100}%` }} transition={{ duration: 0.7 }} className="h-full rounded-full bg-moss-400" />
              </div>
            </div>
          ))}
          {topProducts.length === 0 && <p className="text-sm text-sand-200/45">No completed orders yet.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6 lg:col-span-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Visits by page</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {views.map(([page, n]) => (
            <div key={page} className="rounded-xl border border-forest-800 bg-forest-850/60 p-4">
              <p className="font-display text-2xl font-semibold text-sand-100">{n}</p>
              <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/45">{page}</p>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-forest-800">
                <div className="h-full rounded-full bg-steel-400" style={{ width: `${(n / maxView) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/35">Every page visit on the site is recorded automatically.</p>
      </div>
      <span className="hidden"><Eye size={0} /><Clock size={0} /></span>
    </div>
  );
}

/* --------------------------------- settings --------------------------------- */

const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /admin_users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /admin_activity/{docId} {
      allow read, write: if request.auth != null;
    }
    match /{collection}/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}`;

const WIZARD = [
  { title: "Create a Firebase project", body: "console.firebase.google.com → Add project → name it (e.g. vaidyagan-admin) → Continue → Create project." },
  { title: "Register your web app", body: "Project settings (⚙) → General → Your apps → click the </> web icon → nickname \"vaidyagan-console\" → Register app. Copy the six firebaseConfig values into the boxes below." },
  { title: "Enable Google sign-in", body: "Build → Authentication → Get started → Sign-in method tab → Google → flip Enable → Save." },
  { title: "Enable Email/Password", body: "Same Sign-in method screen → Email/Password → Enable → Save." },
  { title: "Create Firestore", body: "Build → Firestore Database → Create database → Start in production mode → pick the nearest region → Enable." },
  { title: "Enable Storage", body: "Build → Storage → Get started → production mode → Done. (Used for certificate & photo uploads.)" },
  { title: "Paste the security rules", body: "In Firestore, open the Rules tab, paste the rules below and click Publish. Then seed the founder: collection admin_users, document id \"root\", field role = \"superadmin\"." },
];

export function SettingsPage({ refresh }: PageProps) {
  const { toast, logActivity } = useApp();
  const [cfg, setCfg] = useState(getFirebaseConfig());
  const [problems, setProblems] = useState<string[]>([]);
  const [testState, setTestState] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [testMsg, setTestMsg] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [s, setS] = useState(getConsoleSettings());
  const fileRef = useRef<HTMLInputElement>(null);
  const [, force] = useState(0);

  const mode = getConsoleMode();

  const testConnection = async () => {
    const issues = validateConfig(cfg);
    setProblems(issues);
    if (issues.length > 0) { setTestState("fail"); setTestMsg("Fix the highlighted fields first — plain-English hints are above each one."); return; }
    setTestState("testing"); setTestMsg("");
    try {
      const { initializeApp, getApps, deleteApp } = await import("firebase/app");
      const { getFirestore } = await import("firebase/firestore");
      const name = `vaidyagan-test-${Date.now()}`;
      const app = getApps().find((a) => a.name === name) ?? initializeApp({ ...cfg }, name);
      getFirestore(app);
      try { await deleteApp(app); } catch { /* ignore */ }
      setTestState("ok");
      setTestMsg(`Connected to project "${cfg.projectId}". Save the config, then switch the badge to Live mode.`);
      logActivity("edit", "tested the Firebase connection successfully");
    } catch (e) {
      setTestState("fail");
      setTestMsg(e instanceof Error ? `Firebase said: ${e.message}` : "Couldn't reach Firebase — check the values and your internet connection.");
    }
  };

  const importBackup = (f: File) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(String(r.result)) as { data?: Record<string, unknown> };
        const data = parsed.data;
        if (!data || typeof data !== "object") throw new Error("bad file");
        Object.entries(data).forEach(([k, v]) => {
          if (!k.startsWith("vaidyagan_")) return;
          try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch { /* ignore */ }
        });
        toast("Backup imported — reloading to apply…");
        logActivity("edit", "restored a data backup");
        window.setTimeout(() => window.location.reload(), 900);
      } catch {
        toast("That file doesn't look like a Vaidyagan backup");
      }
    };
    r.onerror = () => toast("Could not read that file");
    r.readAsText(f);
  };

  const clearDemo = () => {
    try {
      Object.values(SITE_KEYS).forEach((k) => localStorage.removeItem(k));
      [SITE_KEYS.customers, SITE_KEYS.orders, SITE_KEYS.products, SITE_KEYS.posts, SITE_KEYS.herbs, "vaidyagan_discounts_v1", "vaidyagan_notifications_v1", "vaidyagan_pageviews_v1"].forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
    toast("Demo data reset — reloading…");
    window.setTimeout(() => window.location.reload(), 900);
  };

  const fields: [keyof typeof cfg, string, string][] = [
    ["apiKey", "API key", "AIza…"],
    ["authDomain", "authDomain", "your-project.firebaseapp.com"],
    ["projectId", "Project ID", "vaidyagan-admin"],
    ["storageBucket", "storageBucket", "your-project.appspot.com"],
    ["messagingSenderId", "messagingSenderId", "123456789012"],
    ["appId", "App ID", "1:123…:web:abc"],
  ];

  return (
    <div className="space-y-8">
      {/* connect database */}
      <section className="rounded-2xl border border-gold-500/35 bg-forest-900/70 p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Connect database · Firebase</p>
            <h3 className="mt-1.5 font-display text-2xl font-semibold text-sand-100">{hasFirebaseConfig() ? `Project: ${getFirebaseConfig().projectId}` : "Not connected yet"}</h3>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-sand-200/55">
              Paste the six values from your Firebase web app. Until you do, the console runs in <b className="text-gold-300">Demo Mode</b> — everything works, saved in this browser.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.16em] ${mode === "live" && hasFirebaseConfig() ? "border-[#5f947e]/60 bg-[#5f947e]/12 text-[#a9cfbf]" : "border-gold-500/50 bg-gold-400/10 text-gold-300"}`}>
              <span className={`h-2 w-2 rounded-full ${mode === "live" && hasFirebaseConfig() ? "bg-[#82b39e]" : "animate-blink bg-gold-400"}`} />
              {mode === "live" && hasFirebaseConfig() ? "Live mode" : "Demo mode"}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(([k, label, ph]) => (
            <div key={k}>
              <label className={cLbl}>{label}</label>
              <input value={cfg[k]} onChange={(e) => { setCfg({ ...cfg, [k]: e.target.value }); setTestState("idle"); }} placeholder={ph} className={`${cInp} font-mono text-[12px]`} />
            </div>
          ))}
        </div>

        {problems.length > 0 && (
          <ul className="mt-4 space-y-1.5 rounded-xl border border-ember-500/40 bg-ember-500/8 p-4">
            {problems.map((p, i) => <li key={i} className="flex gap-2 text-[12.5px] text-ember-300"><Close size={13} className="mt-0.5 shrink-0" />{p}</li>)}
          </ul>
        )}
        {testMsg && (
          <p className={`mt-4 rounded-xl border p-4 text-[12.5px] leading-relaxed ${testState === "ok" ? "border-[#5f947e]/50 bg-[#5f947e]/8 text-[#a9cfbf]" : "border-ember-500/40 bg-ember-500/8 text-ember-300"}`}>
            {testState === "ok" && <Check size={13} className="mr-1.5 inline" />}{testMsg}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button onClick={testConnection} disabled={testState === "testing"}
            className="flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300 disabled:opacity-60">
            {testState === "testing" ? <><span className="animate-spin-fast h-4 w-4 rounded-full border-2 border-forest-950 border-t-transparent" /> Testing…</> : <><Shield size={14} /> Test connection</>}
          </button>
          <button onClick={() => { saveFirebaseConfig(cfg); toast("Config saved"); logActivity("edit", "saved the Firebase config"); refresh(); }}
            className="rounded-full border border-forest-600 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200 hover:border-gold-400 hover:text-gold-300">Save config</button>
          {hasFirebaseConfig() && (
            <>
              <button onClick={() => { setConsoleMode(mode === "live" ? "demo" : "live"); toast(mode === "live" ? "Switched to Demo Mode" : "Switched to Live Mode — reading Firestore"); force((x) => x + 1); }}
                className="rounded-full border border-[#5f947e]/50 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#a9cfbf] hover:bg-[#5f947e]/15">
                Switch to {mode === "live" ? "Demo" : "Live"} mode
              </button>
              <button onClick={() => { clearFirebaseConfig(); setCfg({ apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" }); setTestState("idle"); toast("Config cleared"); refresh(); }}
                className="rounded-full border border-forest-700 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200/55 hover:border-ember-400 hover:text-ember-300">Clear</button>
            </>
          )}
          <button onClick={() => setShowWizard(!showWizard)} className="ml-auto flex items-center gap-2 rounded-full border border-forest-700 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/60 hover:text-gold-300">
            <Key size={13} /> Where do I find these?
          </button>
        </div>

        {showWizard && (
          <div className="mt-6 space-y-4">
            <ol className="grid gap-3 sm:grid-cols-2">
              {WIZARD.map((w, i) => (
                <li key={i} className="rounded-xl border border-forest-800 bg-forest-850/60 p-4">
                  <p className="flex items-center gap-2.5 font-display text-[15px] font-semibold text-sand-100">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold-500/50 font-mono text-[11px] text-gold-300">{i + 1}</span>{w.title}
                  </p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-sand-200/60">{w.body}</p>
                </li>
              ))}
            </ol>
            <div>
              <div className="flex items-center justify-between">
                <p className={cLbl}>Firestore security rules — copy & paste</p>
                <button onClick={async () => { try { await navigator.clipboard.writeText(FIRESTORE_RULES); toast("Rules copied to clipboard"); } catch { toast("Copy blocked — select the text manually"); } }}
                  className="rounded-full border border-forest-700 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">Copy rules</button>
              </div>
              <pre className="mt-2 overflow-x-auto rounded-xl border border-forest-800 bg-forest-950/80 p-4 font-mono text-[11px] leading-relaxed text-moss-300">{FIRESTORE_RULES}</pre>
            </div>
          </div>
        )}
      </section>

      {/* store settings */}
      <section className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6 sm:p-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Store & checkout settings</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2.5">
            <Switch on={s.paymentUPI} label="Accept UPI" desc="vaidyagan@upi at checkout." onChange={(b) => setS({ ...s, paymentUPI: b })} />
            <Switch on={s.paymentCard} label="Accept cards" desc="Visa, Mastercard, RuPay." onChange={(b) => setS({ ...s, paymentCard: b })} />
            <Switch on={s.paymentCOD} label="Cash on delivery" desc="Collect at the door." onChange={(b) => setS({ ...s, paymentCOD: b })} />
            <Switch on={s.moderateReviews} label="Moderate reviews" desc="New reviews wait for approval before appearing publicly." onChange={(b) => setS({ ...s, moderateReviews: b })} />
          </div>
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={cLbl}>Free shipping at ₹</label><input value={s.freeShipAt} onChange={(e) => setS({ ...s, freeShipAt: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} className={cInp} /></div>
              <div><label className={cLbl}>Shipping fee ₹</label><input value={s.shipFee} onChange={(e) => setS({ ...s, shipFee: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} className={cInp} /></div>
            </div>
            <div><label className={cLbl}>Contact email (Contact page)</label><input value={s.contactEmail} onChange={(e) => setS({ ...s, contactEmail: e.target.value })} className={cInp} /></div>
            <div><label className={cLbl}>Invoice footer text</label><textarea value={s.invoiceFooter} onChange={(e) => setS({ ...s, invoiceFooter: e.target.value })} rows={3} className={cInp} /></div>
            <button onClick={() => { saveConsoleSettings(s); toast("Settings saved"); logActivity("store", "updated store settings"); }} className="rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Save settings</button>
          </div>
        </div>
      </section>

      {/* backup */}
      <section className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6 sm:p-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Backup & restore</p>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-sand-200/55">Everything the console edits — orders, products, posts, customers, herbs, discounts — in one JSON file.</p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button onClick={() => { downloadFile(`vaidyagan-backup-${new Date().toISOString().slice(0, 10)}.json`, exportAllData(), "application/json"); toast("Backup downloaded"); logActivity("edit", "exported a full data backup"); }}
            className="flex items-center gap-2 rounded-full border border-gold-500/50 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold-300 hover:bg-gold-400 hover:text-forest-950"><Download size={14} /> Export all data (JSON)</button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-full border border-forest-600 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200 hover:border-gold-400 hover:text-gold-300"><Upload size={14} /> Import JSON</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value = ""; }} />
        </div>
      </section>

      {/* danger zone */}
      <section className="rounded-2xl border border-ember-500/35 bg-ember-500/5 p-6 sm:p-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ember-300">Danger zone</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button onClick={() => { if (window.confirm("Reset ALL demo data back to the original seed? Your edits, orders and members will be replaced.")) { clearDemo(); } }}
            className="flex items-center gap-2 rounded-full border border-ember-500/50 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ember-300 hover:bg-ember-500/15"><Trash size={14} /> Reset demo data</button>
          <p className="text-[12px] text-sand-200/45">Restores the seed catalogue, posts and sample orders. Firebase config is kept.</p>
        </div>
      </section>
      <span className="hidden"><Lock size={0} /><Bell size={0} /></span>
    </div>
  );
}
