/* =============================================================================
   Vaidyagan Admin Console — the six sub-pages
   (Customers · Staff & Access · Content · Marketing · Analytics · Settings)
   Every list loads through the async facade, so Demo ⇄ Live changes nothing
   visual. All lists have loading / empty / error-with-Retry states.
   ========================================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useApp, auth, readImageFile, SmartImg } from "./lib";
import {
  CATEGORIES, KIND_META, ORDER_META, PRODUCTS, authorFor, formatDate, kindOf,
  type Article, type Order, type Product,
} from "./data";
import {
  EMPTY_CONFIG, getConsoleMode, getConsoleSettings, getFirebaseConfig, hasFirebaseConfig, importAllData, isMaintenanceOn,
  resetDemoData, saveConsoleSettings, setConsoleMode, toCsv, validateConfig, downloadFile, exportAllData,
  type ConsoleSettings, type FirebaseConfig,
} from "./console/db";
import {
  deleteDiscountF, deletePostF, inviteStaff, loadCustomers, loadDiscountsF, loadPageViewsF, loadPosts,
  loadProducts, loadSettingsF, loadStaff, saveCustomerFlagsF, saveDiscountF, savePostF, saveProductF,
  saveSettingsF, saveStaffAccess, saveStaffRole, seedFounder, setMaintenanceF, toggleHiddenReviewF,
  loadHiddenReviewsF, type CustomerRow, type StaffRecord,
} from "./console/data";
import { HerbManager } from "./herbs-admin";
import {
  ConfirmChip, Drawer, EmptyState, ErrorState, ListSkeleton, Switch, cInp, cLbl, timeAgo,
} from "./console/ui";
import {
  AlertTriangle, Ban, Check, ChevronRight, Database, Download, Eye, FileText, Key, Leaf, Megaphone,
  Plus, RefreshCw, Search, Send, ShieldCheck, Star, Trash2, Undo2, Upload, UserRound, Users, Wallet, X, Zap,
} from "lucide-react";

export type CRole = "superadmin" | "editor" | "viewer";
interface PageProps { role: CRole; refresh: () => void }

/* ------------------------------- async loader ------------------------------- */

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{ rows: T | null; loading: boolean; error: boolean }>({ rows: null, loading: true, error: false });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    let on = true;
    setState((s) => ({ ...s, loading: true, error: false }));
    fnRef.current()
      .then((rows) => { if (on) setState({ rows, loading: false, error: false }); })
      .catch(() => { if (on) setState({ rows: null, loading: false, error: true }); });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: useCallback(() => setTick((t) => t + 1), []) };
}

/* --------------------------------- customers -------------------------------- */

export function CustomersPage({ refresh }: PageProps) {
  const { toast, logActivity } = useApp();
  const q = useAsync(() => loadCustomers(), []);
  const [needle, setNeedle] = useState("");
  const [filter, setFilter] = useState<"all" | "repeat" | "new">("all");
  const [open, setOpen] = useState<CustomerRow | null>(null);
  const [notes, setNotes] = useState("");

  const rows = useMemo(() => {
    const n = needle.trim().toLowerCase();
    return (q.rows ?? []).filter((c) => {
      if (filter === "repeat" && c.orders < 2) return false;
      if (filter === "new" && Date.now() - new Date(c.createdAt).getTime() > 30 * 86400e3) return false;
      return !n || c.name.toLowerCase().includes(n) || c.email.toLowerCase().includes(n) || c.phone.includes(n);
    });
  }, [q.rows, needle, filter]);

  const exportCsv = () => {
    const csv = toCsv(
      ["Name", "Email", "Phone", "Provider", "Orders", "Total spent", "Joined"],
      rows.map((c) => [c.name, c.email, c.phone, c.provider, c.orders, c.spent, c.createdAt.slice(0, 10)])
    );
    downloadFile("vaidyagan-customers.csv", csv, "text/csv");
    toast("Customer list downloaded as CSV");
  };

  const saveNotes = () => {
    if (!open) return;
    saveCustomerFlagsF(open.id, { notes }).then(() => {
      toast("Notes saved"); logActivity("edit", `updated private notes for ${open.name}`); q.reload();
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400" />
          <input value={needle} onChange={(e) => setNeedle(e.target.value)} placeholder="Search name, email, phone…" className={`${cInp} pl-10`} aria-label="Search customers" />
        </div>
        <div className="flex gap-2">
          {(["all", "repeat", "new"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full border px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-all ${filter === f ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55 hover:text-sand-100"}`}>
              {f === "all" ? "All" : f === "repeat" ? "Repeat buyers" : "New · 30d"}
            </button>
          ))}
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">
          <Download size={13} /> CSV
        </button>
      </div>

      {q.loading && <ListSkeleton rows={5} />}
      {q.error && <ErrorState onRetry={q.reload} />}
      {!q.loading && !q.error && rows.length === 0 && (
        <EmptyState icon={<UserRound size={22} />} title="No customers match"
          body={needle ? `Nothing matches "${needle}". Try another name or clear the search.` : "Customers appear here the moment someone creates an account at checkout."}
          actionLabel={needle ? "Clear search" : undefined} onAction={needle ? () => setNeedle("") : undefined} />
      )}

      {!q.loading && !q.error && rows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-forest-800">
          <div className="hidden grid-cols-[1.4fr_1.2fr_0.8fr_0.6fr_0.8fr_0.8fr] items-center gap-3 border-b border-forest-800 bg-forest-900/80 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/45 md:grid">
            <span>Customer</span><span>Contact</span><span>Provider</span><span>Orders</span><span>Spent</span><span>Status</span>
          </div>
          {rows.map((c) => (
            <button key={c.id} onClick={() => { setOpen(c); setNotes(c.notes ?? ""); }}
              className="grid w-full grid-cols-2 items-center gap-3 border-b border-forest-800 bg-forest-900/50 px-5 py-3.5 text-left transition-colors last:border-0 hover:bg-forest-850 md:grid-cols-[1.4fr_1.2fr_0.8fr_0.6fr_0.8fr_0.8fr]">
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-forest-700 bg-forest-850 font-display text-[12px] text-gold-300">
                  {c.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-sand-100">{c.name}</span>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-sand-200/40">joined {c.createdAt.slice(0, 10)}</span>
                </span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] text-sand-200/75">{c.email || "—"}</span>
                <span className="block truncate text-[11px] text-sand-200/45">{c.phone || "no phone"}</span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-sand-200/55">{c.provider}</span>
              <span className="font-mono text-[12.5px] text-sand-100">{c.orders}</span>
              <span className="font-mono text-[12.5px] font-semibold text-gold-300">₹{c.spent.toLocaleString("en-IN")}</span>
              <span>
                {c.suspended
                  ? <span className="rounded-full border border-ember-500/40 bg-ember-500/12 px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ember-300">Suspended</span>
                  : <span className="rounded-full border border-kapha-500/40 bg-kapha-500/10 px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-kapha-300">Active</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ""} subtitle="Customer profile">
        {open && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2.5">
              {[["Orders", String(open.orders)], ["Spent", `₹${open.spent.toLocaleString("en-IN")}`], ["Provider", open.provider]].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-forest-800 bg-forest-850/60 p-3 text-center">
                  <p className="font-display text-lg font-semibold text-gold-300">{v}</p>
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-sand-200/45">{k}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-forest-800 bg-forest-850/60 p-4">
              <p className={cLbl}>Contact & addresses</p>
              <p className="text-[13px] text-sand-200/75">{open.email || "no email"} · {open.phone || "no phone"}</p>
              <div className="mt-2.5 space-y-1.5">
                {(open.addresses as { label?: string; line1?: string; city?: string; pin?: string }[]).map((a, i) => (
                  <p key={i} className="rounded-lg border border-forest-800 bg-forest-900/70 px-3 py-2 text-[12px] text-sand-200/65">
                    <b className="text-sand-100">{a.label ?? "Address"}</b> — {a.line1}, {a.city} {a.pin}
                  </p>
                ))}
                {(open.addresses ?? []).length === 0 && <p className="text-[12px] text-sand-200/40">No saved addresses yet.</p>}
              </div>
            </div>
            <div>
              <p className={cLbl}>Private notes (staff only)</p>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="e.g. prefers evening deliveries, allergic to neem…" className={cInp} />
              <button onClick={saveNotes} className="mt-2 rounded-full bg-gold-400 px-5 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300">Save notes</button>
            </div>
            <Switch on={!open.suspended} label={open.suspended ? "Account suspended" : "Account active"}
              desc={open.suspended ? "They cannot sign in or order. Reactivate below." : "Suspend to block sign-in immediately."}
              onChange={(b) => {
                saveCustomerFlagsF(open.id, { suspended: !b }).then(() => {
                  toast(!b ? `${open.name} suspended` : `${open.name} reactivated`);
                  logActivity("member", `${!b ? "suspended customer" : "reactivated customer"} ${open.name}`);
                  setOpen({ ...open, suspended: !b }); q.reload(); refresh();
                });
              }} />
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ------------------------------ staff & access ------------------------------ */

export function StaffPage({ refresh }: PageProps) {
  const { toast, logActivity } = useApp();
  const q = useAsync(() => loadStaff(), []);
  const meId = auth.session()?.id;
  const [invite, setInvite] = useState({ name: "", email: "", role: "editor" as "editor" | "viewer" });

  const sendInvite = () => {
    if (!invite.name.trim() || !invite.email.trim()) { toast("Name and email are required"); return; }
    const username = invite.email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase() || `user${Date.now() % 1000}`;
    inviteStaff({ name: invite.name.trim(), username, password: `vg-${Date.now().toString(36).slice(-6)}`, role: invite.role, specialty: "Invited from console" })
      .then((rec) => {
        if (!rec) { toast("Could not invite — username may be taken"); return; }
        logActivity("member", `invited ${rec.name} to the console as ${invite.role}`);
        toast(`${rec.name} invited — temporary username "${username}"`);
        setInvite({ name: "", email: "", role: "editor" });
        q.reload(); refresh();
      });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gold-500/35 bg-gold-400/5 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-300">Invite someone to the console</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-sand-200/55">They'll appear below with dashboard access on. <b className="text-sand-200/80">Editors</b> can manage orders, products and content. <b className="text-sand-200/80">Viewers</b> get a read-only overview.</p>
        <div className="mt-3.5 grid gap-3 sm:grid-cols-[1fr_1fr_150px_auto]">
          <input value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} placeholder="Full name" className={cInp} aria-label="Invite name" />
          <input value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="Email" className={cInp} aria-label="Invite email" />
          <select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value as "editor" | "viewer" })} className={cInp} aria-label="Invite role">
            <option value="editor">Editor</option><option value="viewer">Viewer</option>
          </select>
          <button onClick={sendInvite} className="flex items-center justify-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Plus size={13} /> Invite</button>
        </div>
      </div>

      {q.loading && <ListSkeleton rows={4} />}
      {q.error && <ErrorState onRetry={q.reload} />}

      {!q.loading && !q.error && (q.rows ?? []).map((u) => {
        const isSuper = u.role === "superadmin";
        const hasAccess = isSuper || u.consoleAccess;
        const self = u.id === meId;
        return (
          <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 ${isSuper ? "border-gold-500/40 bg-gold-400/5" : "border-forest-800 bg-forest-900/60"}`}>
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
              <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/40">@{u.username} · {u.specialty}</p>
            </div>
            {!isSuper && (
              <select value={u.consoleRole} aria-label={`Console role for ${u.name}`}
                onChange={(e) => {
                  const r = e.target.value as "editor" | "viewer";
                  saveStaffRole(u.id, r).then(() => { logActivity("member", `made ${u.name} a console ${r}`); toast(`${u.name} is now a console ${r}`); q.reload(); refresh(); });
                }}
                className="rounded-lg border border-forest-700 bg-forest-950/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-sand-200/75 focus:border-gold-400 focus:outline-none">
                <option value="editor">Editor · can change things</option>
                <option value="viewer">Viewer · read-only</option>
              </select>
            )}
            <div className="flex items-center gap-2.5">
              <span className={`font-mono text-[8.5px] uppercase tracking-[0.12em] ${hasAccess ? "text-kapha-300" : "text-sand-200/40"}`}>{hasAccess ? "Access on" : "Access off"}</span>
              <Switch on={hasAccess} disabled={isSuper || self} label="" desc=""
                onChange={(b) => {
                  if (self) { toast("You can't revoke your own dashboard access"); return; }
                  saveStaffAccess(u.id, b).then(() => {
                    logActivity("member", b ? `granted console access to ${u.name}` : `revoked console access from ${u.name}`);
                    toast(b ? `${u.name} can open the console` : `${u.name} locked out of the console`);
                    q.reload(); refresh();
                  });
                }} />
            </div>
          </motion.div>
        );
      })}

      <p className="rounded-xl border border-forest-800 bg-forest-900/60 p-4 text-[12px] leading-relaxed text-sand-200/50">
        <b className="text-sand-200/80">How protection works:</b> the sidebar hides pages a role can't open, every page re-checks the role on load,
        and — once connected — the Firestore rules refuse the underlying data to anyone unauthorised, even if they copied the app.
      </p>
    </div>
  );
}

/* ---------------------------------- content --------------------------------- */

export function ContentPage({ role, refresh }: PageProps) {
  const { toast, logActivity, herbs } = useApp();
  const posts = useAsync(() => loadPosts(), []);
  const prods = useAsync(() => loadProducts(), []);
  const hidden = useAsync(() => loadHiddenReviewsF(), []);
  const [status, setStatus] = useState<"all" | "published" | "review" | "draft" | "scheduled">("all");
  const [storeOn, setStoreOn] = useState(() => { try { return localStorage.getItem("vaidyagan_store_enabled_v1") !== "0"; } catch { return true; } });
  const [profileTab, setProfileTab] = useState(() => { try { return localStorage.getItem("vaidyagan_profile_tab_v1") !== "0"; } catch { return true; } });
  const [maint, setMaint] = useState(() => isMaintenanceOn());
  const canEdit = role !== "viewer";

  const setSiteFlag = (key: string, on: boolean) => { try { localStorage.setItem(key, on ? "1" : "0"); } catch { /* ignore */ } };

  const changeStatus = (a: Article, next: Article["status"], msg: string) => {
    savePostF({ ...a, status: next }).then(() => {
      toast(msg); logActivity("edit", `${msg.toLowerCase()} — "${a.title}"`); posts.reload(); refresh();
    });
  };

  const rows = (posts.rows ?? []).filter((a) => status === "all" || a.status === status);
  const reviewCount = (posts.rows ?? []).filter((a) => a.status === "review").length;

  /* flatten product reviews with stable ids for moderation */
  const reviews = useMemo(() => {
    const hid = hidden.rows ?? [];
    return (prods.rows ?? []).flatMap((p) => (p.reviews ?? []).map((r, i) => ({ id: `${p.id}#r${i}`, product: p.name, ...r, hidden: hid.includes(`${p.id}#r${i}`) })));
  }, [prods.rows, hidden.rows]);

  return (
    <div className="space-y-8">
      {/* posts */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Journal posts · every author</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {(["all", "published", "review", "draft", "scheduled"] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-all ${status === s ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55 hover:text-sand-100"}`}>
                {s}{s === "review" && reviewCount > 0 ? ` · ${reviewCount}` : ""}
              </button>
            ))}
          </div>
        </div>

        {posts.loading && <div className="mt-4"><ListSkeleton rows={5} /></div>}
        {posts.error && <div className="mt-4"><ErrorState onRetry={posts.reload} /></div>}
        {!posts.loading && !posts.error && rows.length === 0 && (
          <div className="mt-4"><EmptyState icon={<FileText size={22} />} title="Nothing in this bucket" body="Posts written in the Doctor Studio land here — filter by another status or write something new." /></div>
        )}

        <div className="mt-4 space-y-2.5">
          {rows.map((a) => {
            const author = authorFor(a);
            const kind = kindOf(a);
            return (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-forest-800 bg-forest-900/60 p-3.5">
                <SmartImg src={a.cover} alt="" className="hidden h-12 w-16 rounded-lg border border-forest-800 object-cover duotone sm:block" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-sand-100">
                    <span className="truncate">{a.title || "Untitled"}</span>
                    <span className="rounded-full border px-2 py-0.5 font-mono text-[7.5px] uppercase tracking-[0.1em]" style={{ borderColor: `${KIND_META[kind].color}55`, color: KIND_META[kind].color }}>{KIND_META[kind].short}</span>
                    {a.status === "review" && <span className="animate-blink rounded-full border border-ember-500/50 bg-ember-500/12 px-2 py-0.5 font-mono text-[7.5px] uppercase tracking-[0.1em] text-ember-300">Needs review</span>}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/40">{author.name} · {a.status} · {formatDate(a.date)}</p>
                </div>
                {canEdit && (
                  <div className="flex flex-wrap items-center gap-2">
                    {a.status === "review" && (
                      <>
                        <button onClick={() => changeStatus(a, "published", "Approved & published")} className="flex items-center gap-1.5 rounded-full bg-kapha-500 px-3.5 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-forest-950 hover:brightness-110"><Check size={11} /> Approve</button>
                        <button onClick={() => changeStatus(a, "draft", "Sent back to drafts")} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-sand-200/60 hover:text-sand-100"><Undo2 size={11} /> Send back</button>
                      </>
                    )}
                    {a.status === "published" && (
                      <button onClick={() => changeStatus(a, "draft", "Unpublished")} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Eye size={11} /> Unpublish</button>
                    )}
                    <ConfirmChip onConfirm={() => deletePostF(a.id).then(() => { toast(`Deleted "${a.title || "untitled"}"`); logActivity("edit", `deleted post "${a.title}"`); posts.reload(); refresh(); })} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* reviews moderation */}
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Customer reviews · {reviews.filter((r) => r.hidden).length} hidden</p>
        {prods.loading && <div className="mt-4"><ListSkeleton rows={3} /></div>}
        {!prods.loading && !prods.error && reviews.length === 0 && (
          <p className="mt-3 rounded-xl border border-dashed border-forest-700 p-6 text-center text-[13px] text-sand-200/45">No reviews yet — they appear when shoppers rate a formulation.</p>
        )}
        <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
          {reviews.slice(0, 12).map((r) => (
            <div key={r.id} className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all ${r.hidden ? "border-ember-500/30 bg-ember-500/5 opacity-70" : "border-forest-800 bg-forest-900/60"}`}>
              <span className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-gold-300"><Star size={11} className="fill-current" />{r.rating}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-sand-100">{r.name} <span className="font-normal text-sand-200/40">on {r.product}</span></p>
                <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-sand-200/60">{r.text}</p>
              </div>
              {canEdit && (
                <button onClick={() => toggleHiddenReviewF(r.id).then(() => { toast(r.hidden ? "Review restored" : "Review hidden from the store"); hidden.reload(); })}
                  className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.1em] transition-all ${r.hidden ? "border-kapha-500/50 text-kapha-300 hover:bg-kapha-500/10" : "border-forest-700 text-sand-200/55 hover:border-ember-400 hover:text-ember-300"}`}>
                  {r.hidden ? "Restore" : "Hide"}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* herb index */}
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Herb index · {herbs.length} monographs</p>
        <div className="mt-3 rounded-2xl border border-forest-800 bg-forest-900/40 p-4">
          <HerbManager />
        </div>
      </section>

      {/* master switches */}
      <section className="rounded-2xl border border-gold-500/30 bg-gold-400/4 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-300">Master switches · affect the public site instantly</p>
        <div className="mt-4 grid gap-2.5 lg:grid-cols-3">
          <Switch on={storeOn} label="Enable public Store" desc="Off hides the Store tab, footer link and product pages." onChange={(b) => { setStoreOn(b); setSiteFlag("vaidyagan_store_enabled_v1", b); logActivity("store", b ? "turned the public store ON" : "turned the public store OFF"); toast(b ? "Store is live" : "Store hidden from visitors"); }} />
          <Switch on={profileTab} label="Show Profile tab" desc="The doctors' practice-management tab in Studio." onChange={(b) => { setProfileTab(b); setSiteFlag("vaidyagan_profile_tab_v1", b); toast(b ? "Profile tab visible" : "Profile tab hidden"); }} />
          <Switch on={maint} label="Maintenance mode" desc="Visitors see a friendly 'under construction' page." onChange={(b) => { setMaint(b); setMaintenanceF(b).then(() => { logActivity("store", b ? "turned maintenance mode ON" : "turned maintenance mode OFF"); toast(b ? "Maintenance mode ON" : "Site back to normal"); }); }} />
        </div>
      </section>
    </div>
  );
}

/* --------------------------------- marketing -------------------------------- */

export function MarketingPage({ role, refresh }: PageProps) {
  const { toast, logActivity } = useApp();
  const q = useAsync(() => loadDiscountsF(), []);
  const canEdit = role !== "viewer";
  const [form, setForm] = useState({ code: "", type: "percent" as "percent" | "flat", value: "10", minOrder: "0", expires: "" });
  const [tryCode, setTryCode] = useState("");
  const [tryAmount, setTryAmount] = useState("1200");

  const add = () => {
    const code = form.code.trim().toUpperCase();
    if (!code) { toast("Give the code a name"); return; }
    const d = { id: `d-${Date.now()}`, code, type: form.type, value: parseInt(form.value.replace(/\D/g, "") || "0", 10), minOrder: parseInt(form.minOrder.replace(/\D/g, "") || "0", 10), expires: form.expires, active: true, createdAt: new Date().toISOString().slice(0, 10) };
    saveDiscountF(d).then(() => { toast(`Code ${code} created`); logActivity("store", `created discount code ${code}`); setForm({ code: "", type: "percent", value: "10", minOrder: "0", expires: "" }); q.reload(); refresh(); });
  };

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="rounded-2xl border border-gold-500/35 bg-gold-400/5 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-300">Create a discount code</p>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-[1fr_130px_110px_130px_150px_auto]">
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" className={`${cInp} font-mono`} aria-label="Code" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "flat" })} className={cInp} aria-label="Type">
              <option value="percent">Percent %</option><option value="flat">Flat ₹</option>
            </select>
            <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value.replace(/\D/g, "") })} placeholder="10" className={cInp} aria-label="Value" />
            <input value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value.replace(/\D/g, "") })} placeholder="Min ₹" className={cInp} aria-label="Minimum order" />
            <input type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} className={cInp} aria-label="Expiry date" />
            <button onClick={add} className="flex items-center justify-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300"><Plus size={13} /> Create</button>
          </div>
        </div>
      )}

      {q.loading && <ListSkeleton rows={3} />}
      {q.error && <ErrorState onRetry={q.reload} />}
      {!q.loading && !q.error && (q.rows ?? []).length === 0 && (
        <EmptyState icon={<Megaphone size={22} />} title="No discount codes yet" body="Create your first code above — shoppers apply it in the cart and the saving shows as a line before they pay." />
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(q.rows ?? []).map((d) => (
          <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-5 transition-all ${d.active ? "border-gold-500/35 bg-forest-900/70" : "border-forest-800 bg-forest-900/40 opacity-70"}`}>
            <div className="flex items-start justify-between">
              <p className="font-mono text-xl font-bold tracking-[0.08em] text-gold-300">{d.code}</p>
              {canEdit && <ConfirmChip onConfirm={() => deleteDiscountF(d.id).then(() => { toast(`${d.code} deleted`); q.reload(); })} />}
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-sand-100">
              {d.type === "percent" ? `${d.value}% off` : `₹${d.value} off`}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/45">
              min ₹{d.minOrder}{d.expires ? ` · till ${d.expires}` : " · no expiry"}
            </p>
            {canEdit && (
              <button onClick={() => saveDiscountF({ ...d, active: !d.active }).then(() => { toast(d.active ? `${d.code} paused` : `${d.code} active`); q.reload(); })}
                className={`mt-3.5 rounded-full border px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-all ${d.active ? "border-kapha-500/50 text-kapha-300 hover:bg-kapha-500/10" : "border-forest-700 text-sand-200/55 hover:text-sand-100"}`}>
                {d.active ? "Active · pause" : "Paused · activate"}
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Test a code exactly as shoppers will</p>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <input value={tryCode} onChange={(e) => setTryCode(e.target.value)} placeholder="Code" className={`${cInp} w-36 font-mono`} aria-label="Test code" />
          <input value={tryAmount} onChange={(e) => setTryAmount(e.target.value.replace(/\D/g, ""))} placeholder="Cart ₹" className={`${cInp} w-32`} aria-label="Test cart value" />
          <TestResult code={tryCode} amount={tryAmount} codes={q.rows ?? []} />
        </div>
      </div>
    </div>
  );
}

function TestResult({ code, amount, codes }: { code: string; amount: string; codes: { code: string; type: string; value: number; minOrder: number; expires: string; active: boolean }[] }) {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  const d = codes.find((x) => x.code.toUpperCase() === clean);
  const sub = parseInt(amount || "0", 10);
  if (!d) return <span className="rounded-full border border-ember-500/40 bg-ember-500/10 px-4 py-2 text-[12px] text-ember-300">"{clean}" isn't a valid code.</span>;
  if (!d.active) return <span className="rounded-full border border-ember-500/40 bg-ember-500/10 px-4 py-2 text-[12px] text-ember-300">"{d.code}" is switched off right now.</span>;
  if (d.expires && new Date(d.expires + "T23:59:59").getTime() < Date.now()) return <span className="rounded-full border border-ember-500/40 bg-ember-500/10 px-4 py-2 text-[12px] text-ember-300">"{d.code}" expired on {d.expires}.</span>;
  if (sub < d.minOrder) return <span className="rounded-full border border-ember-500/40 bg-ember-500/10 px-4 py-2 text-[12px] text-ember-300">Needs a minimum order of ₹{d.minOrder}.</span>;
  const off = d.type === "percent" ? Math.round((sub * d.value) / 100) : Math.min(d.value, sub);
  return <span className="rounded-full border border-kapha-500/45 bg-kapha-500/10 px-4 py-2 text-[12px] text-kapha-300"><Check size={12} className="mr-1 inline" />Works — saves ₹{off.toLocaleString("en-IN")} on ₹{sub}.</span>;
}

/* --------------------------------- analytics -------------------------------- */

export function AnalyticsPage() {
  const orders = useAsync(() => import("./console/data").then((m) => m.loadOrders()), []);
  const prods = useAsync(() => loadProducts(), []);
  const views = useAsync(() => loadPageViewsF(), []);

  const days = useMemo(() => {
    const out: { label: string; rev: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400e3);
      const key = day.toISOString().slice(0, 10);
      const rev = (orders.rows ?? []).filter((o) => o.status !== "cancelled" && o.placedAt.slice(0, 10) === key).reduce((s, o) => s + o.total, 0);
      out.push({ label: day.toLocaleDateString(undefined, { day: "numeric" }), rev });
    }
    return out;
  }, [orders.rows]);
  const maxRev = Math.max(1, ...days.map((d) => d.rev));

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    (orders.rows ?? []).forEach((o) => { map[o.status] = (map[o.status] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [orders.rows]);
  const totalOrders = Math.max(1, (orders.rows ?? []).length);

  const topProducts = useMemo(() => {
    const rev: Record<string, number> = {};
    (orders.rows ?? []).filter((o) => o.status !== "cancelled").forEach((o) => o.items.forEach((i) => { rev[i.name] = (rev[i.name] ?? 0) + i.price * i.qty; }));
    return Object.entries(rev).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders.rows]);
  const maxTop = Math.max(1, ...topProducts.map(([, v]) => v));

  const pageCounts = useMemo(() => {
    const map: Record<string, number> = {};
    (views.rows ?? []).forEach((v) => { map[v.page] = (map[v.page] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [views.rows]);
  const maxPage = Math.max(1, ...pageCounts.map(([, v]) => v));

  if (orders.loading || prods.loading || views.loading) return <ListSkeleton rows={6} />;
  if (orders.error) return <ErrorState onRetry={orders.reload} />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Revenue · last 14 days</p>
          <p className="font-mono text-[10px] text-sand-200/40">₹{days.reduce((s, d) => s + d.rev, 0).toLocaleString("en-IN")} total</p>
        </div>
        <div className="mt-5 flex h-40 items-end gap-1.5">
          {days.map((d, i) => (
            <div key={i} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.label}: ₹${d.rev.toLocaleString("en-IN")}`}>
              <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(3, (d.rev / maxRev) * 100)}%` }} transition={{ delay: i * 0.03, duration: 0.5, ease: "easeOut" }}
                className="w-full rounded-t-md bg-gradient-to-t from-gold-600/60 to-gold-400 transition-all group-hover:to-gold-300" />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5">
          {days.map((d, i) => <span key={i} className="flex-1 text-center font-mono text-[7.5px] text-sand-200/35">{d.label}</span>)}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Orders by status</p>
          <div className="mt-5 space-y-3">
            {statusCounts.map(([s, n]) => {
              const meta = ORDER_META[s as keyof typeof ORDER_META];
              return (
                <div key={s}>
                  <div className="flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.12em]">
                    <span style={{ color: meta?.color ?? "#a6c0a0" }}>{meta?.label ?? s}</span>
                    <span className="text-sand-200/50">{n}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-forest-800">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(n / totalOrders) * 100}%` }} transition={{ duration: 0.6 }}
                      className="h-full rounded-full" style={{ background: meta?.color ?? "#82b39e" }} />
                  </div>
                </div>
              );
            })}
            {statusCounts.length === 0 && <p className="text-[12.5px] text-sand-200/45">No orders yet.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Top 5 products by revenue</p>
          <div className="mt-5 space-y-3.5">
            {topProducts.map(([name, rev], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-gold-500/40 font-mono text-[10px] text-gold-300">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-sand-100">{name}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-forest-800">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(rev / maxTop) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.05 }} className="h-full rounded-full bg-gold-400" />
                  </div>
                </div>
                <span className="font-mono text-[10.5px] text-gold-300">₹{rev.toLocaleString("en-IN")}</span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-[12.5px] text-sand-200/45">Sales will rank products here.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Visits by page</p>
          <div className="mt-5 space-y-3.5">
            {pageCounts.map(([page, n]) => (
              <div key={page} className="flex items-center gap-3">
                <span className="w-20 shrink-0 font-mono text-[9.5px] uppercase tracking-[0.1em] text-sand-200/60">{page}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-forest-800">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(n / maxPage) * 100}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full bg-moss-400" />
                </div>
                <span className="w-10 text-right font-mono text-[10px] text-sand-200/55">{n}</span>
              </div>
            ))}
            {pageCounts.length === 0 && <p className="text-[12.5px] text-sand-200/45">Page views are tracked on every visit.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------------------------- settings -------------------------------- */

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
  { title: "Register your web app", body: "Project settings (gear) → General → Your apps → click the </> web icon → nickname \"vaidyagan-console\" → Register app. Copy the six firebaseConfig values into the boxes below." },
  { title: "Enable Google sign-in", body: "Build → Authentication → Get started → Sign-in method tab → Google → flip Enable → Save." },
  { title: "Enable Email/Password", body: "Same Sign-in method screen → Email/Password → Enable → Save." },
  { title: "Create Firestore", body: "Build → Firestore Database → Create database → Start in production mode → pick the nearest region → Enable." },
  { title: "Enable Storage", body: "Build → Storage → Get started → production mode → Done. (Used for certificate & photo uploads.)" },
  { title: "Paste the security rules", body: "In Firestore, open the Rules tab, paste the rules below and click Publish. Then click \"Seed founder doc\" so the superadmin document exists." },
];

export function SettingsPage({ refresh }: PageProps) {
  const { toast, logActivity } = useApp();
  const [cfg, setCfg] = useState<FirebaseConfig>(getConsoleSettings() ? getFirebaseConfig() : EMPTY_CONFIG);
  const [problems, setProblems] = useState<string[]>([]);
  const [testState, setTestState] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [testMsg, setTestMsg] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [seedBusy, setSeedBusy] = useState(false);
  const settings = useAsync(() => loadSettingsF(), []);
  const [s, setS] = useState<ConsoleSettings>(getConsoleSettings());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (settings.rows) setS(settings.rows); }, [settings.rows]);
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

  const doSeed = () => {
    setSeedBusy(true);
    seedFounder().then((ok) => {
      setSeedBusy(false);
      toast(ok ? "Founder document seeded in admin_users" : "Seeding failed — save & test the config first");
      if (ok) logActivity("member", "seeded the founder superadmin document");
    });
  };

  const fields: [keyof FirebaseConfig, string, string][] = [
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
          <span className={`flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.16em] ${mode === "live" && hasFirebaseConfig() ? "border-kapha-500/60 bg-kapha-500/12 text-kapha-300" : "border-gold-500/50 bg-gold-400/10 text-gold-300"}`}>
            <span className={`h-2 w-2 rounded-full ${mode === "live" && hasFirebaseConfig() ? "bg-kapha-400" : "animate-blink bg-gold-400"}`} />
            {mode === "live" && hasFirebaseConfig() ? "Live mode" : "Demo mode"}
          </span>
        </div>

        <div className="mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(([k, label, ph]) => (
            <div key={k}>
              <label className={cLbl}>{label}</label>
              <input value={cfg[k]} onChange={(e) => { setCfg({ ...cfg, [k]: e.target.value }); setTestState("idle"); }} placeholder={ph} className={`${cInp} font-mono text-[12px]`} aria-label={label} />
            </div>
          ))}
        </div>

        {problems.length > 0 && (
          <ul className="mt-4 space-y-1.5 rounded-xl border border-ember-500/40 bg-ember-500/8 p-4">
            {problems.map((p, i) => <li key={i} className="flex gap-2 text-[12.5px] text-ember-300"><AlertTriangle size={13} className="mt-0.5 shrink-0" />{p}</li>)}
          </ul>
        )}
        {testMsg && (
          <p className={`mt-4 rounded-xl border p-4 text-[12.5px] leading-relaxed ${testState === "ok" ? "border-kapha-500/50 bg-kapha-500/8 text-kapha-300" : "border-ember-500/40 bg-ember-500/8 text-ember-300"}`}>
            {testState === "ok" && <Check size={13} className="mr-1.5 inline" />}{testMsg}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button onClick={testConnection} disabled={testState === "testing"}
            className="flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300 disabled:opacity-60">
            {testState === "testing" ? <><RefreshCw size={14} className="animate-spin-fast" /> Testing…</> : <><Zap size={14} /> Test connection</>}
          </button>
          <button onClick={() => { saveConsoleSettings({}); try { localStorage.setItem("vaidyagan_firebase_config_v1", JSON.stringify(cfg)); } catch { /* ignore */ } toast("Config saved"); logActivity("edit", "saved the Firebase config"); refresh(); }}
            className="rounded-full border border-forest-600 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200 hover:border-gold-400 hover:text-gold-300">Save config</button>
          {hasFirebaseConfig() && (
            <>
              <button onClick={() => { setConsoleMode(mode === "live" ? "demo" : "live"); toast(mode === "live" ? "Switched to Demo Mode" : "Switched to Live Mode — reading Firestore"); refresh(); }}
                className="rounded-full border border-kapha-500/50 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-kapha-300 hover:bg-kapha-500/15">
                Switch to {mode === "live" ? "Demo" : "Live"} mode
              </button>
              <button onClick={doSeed} disabled={seedBusy}
                className="flex items-center gap-2 rounded-full border border-gold-500/50 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold-300 hover:bg-gold-400 hover:text-forest-950 disabled:opacity-60">
                <Database size={14} /> {seedBusy ? "Seeding…" : "Seed founder doc"}
              </button>
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
              <div><label className={cLbl}>Free shipping at ₹</label><input value={s.freeShipAt} onChange={(e) => setS({ ...s, freeShipAt: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} className={cInp} aria-label="Free shipping threshold" /></div>
              <div><label className={cLbl}>Shipping fee ₹</label><input value={s.shipFee} onChange={(e) => setS({ ...s, shipFee: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} className={cInp} aria-label="Shipping fee" /></div>
            </div>
            <div><label className={cLbl}>Contact email (Contact page)</label><input value={s.contactEmail} onChange={(e) => setS({ ...s, contactEmail: e.target.value })} className={cInp} aria-label="Contact email" /></div>
            <div><label className={cLbl}>Invoice footer text</label><textarea value={s.invoiceFooter} onChange={(e) => setS({ ...s, invoiceFooter: e.target.value })} rows={3} className={cInp} aria-label="Invoice footer" /></div>
            <button onClick={() => saveSettingsF(s).then(() => { toast("Settings saved"); logActivity("store", "updated store settings"); refresh(); })}
              className="rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Save settings</button>
          </div>
        </div>
      </section>

      {/* backup & restore */}
      <section className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6 sm:p-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Backup & restore</p>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-sand-200/55">Export everything (orders, products, customers, posts, settings) as one JSON file — or restore from a previous export.</p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button onClick={() => { downloadFile(`vaidyagan-backup-${new Date().toISOString().slice(0, 10)}.json`, exportAllData(), "application/json"); toast("Backup downloaded"); logActivity("edit", "exported a full data backup"); }}
            className="flex items-center gap-2 rounded-full border border-kapha-500/50 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-kapha-300 hover:bg-kapha-500/15"><Download size={14} /> Export all data</button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-full border border-forest-600 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200 hover:border-gold-400 hover:text-gold-300"><Upload size={14} /> Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-label="Import backup file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = () => {
                const res = importAllData(String(r.result));
                if (res.ok) { toast(`Restored ${res.keys} collections — reloading…`); logActivity("edit", "restored a data backup"); window.setTimeout(() => window.location.reload(), 900); }
                else toast(res.error ?? "Couldn't read that backup");
              };
              r.onerror = () => toast("Could not read that file");
              r.readAsText(f);
              e.target.value = "";
            }} />
        </div>
      </section>

      {/* danger zone */}
      <section className="rounded-2xl border border-ember-500/35 bg-ember-500/5 p-6 sm:p-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ember-300">Danger zone</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-[13px] leading-relaxed text-sand-200/55">Reset generated demo data (orders, products, posts, customers…) back to the seeds. Logins and the Firebase config are kept.</p>
          <ConfirmChip label="Reset demo data" armedLabel="Really reset?" timeout={4000}
            onConfirm={() => { resetDemoData(); logActivity("edit", "reset the demo data"); toast("Demo data reset — reloading…"); window.setTimeout(() => window.location.reload(), 900); }} />
        </div>
      </section>
      <span className="hidden"><Ban size={0} /><Wallet size={0} /><Leaf size={0} /><Send size={0} /><Users size={0} /><ShieldCheck size={0} /><ChevronRight size={0} /><X size={0} /></span>
    </div>
  );
}
