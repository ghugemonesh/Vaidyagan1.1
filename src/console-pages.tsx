/* =============================================================================
   Vaidyagan Admin Console — Customers · Staff · Content · Marketing ·
   Analytics · Settings. All data flows through the async facade.
   ========================================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ConfirmChip, DataTable, Drawer, EmptyState, ErrorState, ListSkeleton, StatCard, StatusBadge, Switch, cInp, cLbl, timeAgo,
} from "./console/ui";
import {
  loadCustomers, updateCustomerFlagsF, type CustomerRecord,
  loadStaff, saveStaffRole, saveStaffAccess, inviteStaff, seedFounder, type StaffRecord,
  loadPosts, savePostStatusF, deletePostF,
  loadDiscountsF, saveDiscountF, deleteDiscountF, type Discount,
  loadPageViewsF, type PageView,
  loadOrders, loadProducts,
} from "./console/data";
import {
  getConsoleSettings, saveConsoleSettings, exportAllData, importAllData, resetDemoData, downloadFile, toCsv,
  validateFirebaseConfig, hasFirebaseConfig, getFirebaseConfig, saveFirebaseConfig, getConsoleMode, setConsoleMode,
  listHiddenReviews, toggleHiddenReview, isMaintenanceOn, setMaintenance, listDoctorProfiles,
} from "./console/db";
import { initFirebase } from "./console/firebase-db";
import { HerbManager } from "./herbs-admin";
import { ARTICLES, KIND_META, type Article } from "./data";
import { useApp, SmartImg } from "./lib";
import { BRAND_LOGO_URL } from "./data";
import {
  Check, Close, Plus, Trash, Download, Upload, Search, Shield, Lock, Users, Eye, Key, Bell, Database, Star,
} from "./icons";

export type CRole = "superadmin" | "editor" | "viewer";
export interface PageProps { role: CRole; refresh: () => void }

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

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* --------------------------------- customers -------------------------------- */

export function CustomersPage({ role, refresh }: PageProps) {
  const { toast } = useApp();
  const q = useAsync(() => loadCustomers(), [refresh]);
  const [needle, setNeedle] = useState("");
  const [filter, setFilter] = useState<"all" | "repeat" | "new">("all");
  const [open, setOpen] = useState<CustomerRecord | null>(null);
  const canEdit = role !== "viewer";

  const list = useMemo(() => {
    const n = needle.trim().toLowerCase();
    return (q.rows ?? []).filter((c) =>
      (!n || c.name.toLowerCase().includes(n) || c.email.toLowerCase().includes(n) || (c.phone ?? "").includes(n)) &&
      (filter === "all" || (filter === "repeat" ? c.orders > 1 : c.orders <= 1)));
  }, [q.rows, needle, filter]);

  const exportCsv = () => {
    downloadFile("vaidyagan-customers.csv", toCsv(
      ["Name", "Email", "Phone", "Provider", "Orders", "Spent", "Joined"],
      list.map((c) => [c.name, c.email, c.phone, c.provider, c.orders, c.spent, new Date(c.joined).toLocaleDateString()]),
    ), "text/csv");
    toast("Customer list downloaded as CSV");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400" />
          <input value={needle} onChange={(e) => setNeedle(e.target.value)} placeholder="Search name, email, phone…" className={`${cInp} pl-10`} aria-label="Search customers" />
        </div>
        <div className="flex gap-2">
          {([["all", "All"], ["repeat", "Repeat buyers"], ["new", "New"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`rounded-full border px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-all ${filter === k ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55 hover:text-sand-100"}`}>{l}</button>
          ))}
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Download size={13} /> CSV</button>
      </div>

      {q.loading && <ListSkeleton rows={6} />}
      {q.error && <ErrorState onRetry={q.reload} />}
      {!q.loading && !q.error && (
        <DataTable
          columns={[
            { key: "name", label: "Customer" },
            { key: "email", label: "Contact", hideOnMobile: true },
            { key: "provider", label: "Signed in via", hideOnMobile: true },
            { key: "orders", label: "Orders", align: "right" },
            { key: "spent", label: "Spent", align: "right" },
            { key: "joined", label: "Joined", hideOnMobile: true },
          ]}
          rows={list}
          rowKey={(c) => c.id}
          onRow={canEdit ? (c) => setOpen(c) : undefined}
          empty={<EmptyState icon={<Users size={22} />} title="No customers match" body={needle || filter !== "all" ? "Try a different search or filter." : "Customers appear the moment someone checks out."} />}
          render={(c, col) => {
            switch (col) {
              case "name": return (
                <span className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold-500/40 bg-gold-400/10 font-display text-[12px] font-semibold text-gold-300">
                    {c.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className={`block truncate text-[13px] font-semibold ${c.suspended ? "text-sand-200/40 line-through" : "text-sand-100"}`}>{c.name}</span>
                    {c.suspended && <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-ember-300">Suspended</span>}
                  </span>
                </span>
              );
              case "email": return <span className="block text-[12px] text-sand-200/65">{c.email || "—"}<span className="block text-sand-200/40">{c.phone}</span></span>;
              case "provider": return <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-sand-200/50">{c.provider}</span>;
              case "orders": return <span className="text-[13px] text-sand-100">{c.orders}</span>;
              case "spent": return <span className="font-mono text-[12.5px] text-gold-300">{inr(c.spent)}</span>;
              default: return <span className="font-mono text-[10.5px] text-sand-200/50">{new Date(c.joined).toLocaleDateString()}</span>;
            }
          }}
        />
      )}

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ""} subtitle="Customer profile">
        {open && (
          <div className="space-y-4">
            <div className="rounded-xl border border-forest-800 bg-forest-850/60 p-4 text-[13px] text-sand-200/70">
              <p>{open.email || "no email"} · {open.phone || "no phone"}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-sand-200/40">Signed in via {open.provider} · joined {new Date(open.joined).toLocaleDateString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Orders" value={String(open.orders)} delay={0} />
              <StatCard label="Lifetime spend" value={inr(open.spent)} delay={0.06} />
            </div>
            {canEdit && (
              <Switch on={!open.suspended} label={open.suspended ? "Account suspended" : "Account active"}
                desc={open.suspended ? "They cannot sign in or order right now." : "Suspend to block sign-in without losing history."}
                onChange={(b) => { updateCustomerFlagsF(open.id, { suspended: !b }); setOpen({ ...open, suspended: !b }); q.reload(); refresh(); toast(b ? `${open.name} reactivated` : `${open.name} suspended`); }} />
            )}
            {canEdit && (
              <div>
                <label className={cLbl}>Private notes</label>
                <textarea key={open.id} defaultValue={open.notes ?? ""} rows={3} placeholder="Only the desk can see this…"
                  className={cInp}
                  onBlur={(e) => { updateCustomerFlagsF(open.id, { notes: e.target.value }); setOpen({ ...open, notes: e.target.value }); toast("Note saved"); }} />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ----------------------------------- staff ----------------------------------- */

export function StaffPage({ role, refresh }: PageProps) {
  const { toast } = useApp();
  const q = useAsync(() => loadStaff(), [refresh]);
  const [invite, setInvite] = useState({ name: "", username: "", password: "", specialty: "", role: "viewer" as "editor" | "viewer" });
  const [seeding, setSeeding] = useState(false);
  const isSuper = role === "superadmin";

  const doInvite = () => {
    if (!invite.name.trim() || !invite.username.trim() || invite.password.length < 4) { toast("Name, username and a 4+ char password are required"); return; }
    inviteStaff(invite).then((u) => {
      if (!u) { toast("That username is already taken"); return; }
      toast(`${u.name} invited — they can sign in to the Studio now`);
      setInvite({ name: "", username: "", password: "", specialty: "", role: "viewer" });
      q.reload(); refresh();
    });
  };

  const doSeedFounder = () => {
    if (!hasFirebaseConfig()) { toast("Connect a database in Settings first"); return; }
    setSeeding(true);
    initFirebase(getFirebaseConfig());
    seedFounder().then((ok) => {
      setSeeding(false);
      toast(ok ? "Founder document created in Firestore (admin_users / root)" : "Couldn't reach Firestore — check the connection in Settings");
    });
  };

  return (
    <div className="space-y-5">
      {q.loading && <ListSkeleton rows={5} />}
      {q.error && <ErrorState onRetry={q.reload} />}
      {!q.loading && !q.error && (
        <div className="space-y-3">
          {(q.rows ?? []).map((u) => (
            <div key={u.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${u.id === "root" ? "border-gold-500/40 bg-gold-400/5" : "border-forest-800 bg-forest-900/60"}`}>
              <span className="grid h-10 w-10 place-items-center rounded-full font-display text-sm font-semibold" style={{ background: `${u.hue}18`, color: u.hue, border: `1px solid ${u.hue}55` }}>
                {u.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sand-100">
                  {u.name}
                  {u.id === "root" && <span className="flex items-center gap-1 rounded-full bg-gold-400/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-gold-300"><Shield size={9} /> Founder</span>}
                  {!u.active && <span className="rounded-full bg-forest-800 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-sand-200/50">Suspended</span>}
                </p>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/40">@{u.username} · {u.specialty}</p>
              </div>
              {isSuper && u.id !== "root" && (
                <div className="flex flex-wrap items-center gap-2">
                  <select value={u.consoleRole} onChange={(e) => { saveStaffRole(u.id, e.target.value as "editor" | "viewer"); toast(`${u.name} is now ${e.target.value === "editor" ? "an Editor" : "a Viewer"}`); q.reload(); refresh(); }}
                    className={`${cInp} w-auto py-2`} aria-label={`Console role for ${u.name}`}>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Switch on={u.consoleAccess} label="Dashboard access" desc={u.consoleAccess ? "Can open the Admin Console" : "Locked out — sees a locked screen"}
                    onChange={(b) => { saveStaffAccess(u.id, b); toast(b ? `${u.name} can open the console` : `${u.name} locked out of the console`); q.reload(); refresh(); }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isSuper && (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl border border-gold-500/35 bg-gold-400/5 p-5">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-300">Invite a teammate</p>
            <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
              <input value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} placeholder="Full name" className={cInp} />
              <input value={invite.username} onChange={(e) => setInvite({ ...invite, username: e.target.value })} placeholder="Username (for login)" className={cInp} />
              <input value={invite.password} onChange={(e) => setInvite({ ...invite, password: e.target.value })} placeholder="Temporary password" className={cInp} />
              <input value={invite.specialty} onChange={(e) => setInvite({ ...invite, specialty: e.target.value })} placeholder="Specialty" className={cInp} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value as "editor" | "viewer" })} className={`${cInp} w-auto`} aria-label="Invite role">
                <option value="viewer">Viewer — read-only</option>
                <option value="editor">Editor — can make changes</option>
              </select>
              <button onClick={doInvite} className="flex items-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Plus size={14} /> Invite</button>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-sand-200/45">
              <b className="text-sand-200/70">Editor</b> can edit products, orders, posts and codes. <b className="text-sand-200/70">Viewer</b> sees everything but can change nothing. Both sign in from the Doctor Studio with the username + password you set here.
            </p>
          </div>

          <div className="rounded-xl border border-forest-800 bg-forest-900/60 p-5">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">Firestore founder document</p>
            <p className="mt-2 text-[12px] leading-relaxed text-sand-200/50">
              In Live Mode the superadmin lives at <span className="font-mono text-gold-300">admin_users / root</span>. Create it once after connecting your database.
            </p>
            <button onClick={doSeedFounder} disabled={seeding}
              className="mt-4 flex items-center gap-2 rounded-full border border-kapha-500/50 px-5 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-kapha-300 transition-all hover:bg-kapha-500/10 disabled:opacity-50">
              <Database size={13} /> {seeding ? "Creating…" : "Seed founder doc"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- content ---------------------------------- */

export function ContentPage({ role, refresh }: PageProps) {
  const { toast } = useApp();
  const q = useAsync(() => loadPosts(), [refresh]);
  const [status, setStatus] = useState<"all" | Article["status"]>("all");
  const [hiddenReviews, setHiddenReviews] = useState<string[]>(listHiddenReviews());
  const canEdit = role !== "viewer";

  const list = useMemo(() => (q.rows ?? []).filter((p) => status === "all" || p.status === status), [q.rows, status]);
  const counts = useMemo(() => {
    const all = q.rows ?? [];
    return { all: all.length, published: all.filter((p) => p.status === "published").length, review: all.filter((p) => p.status === "review").length, draft: all.filter((p) => p.status === "draft").length, scheduled: all.filter((p) => p.status === "scheduled").length };
  }, [q.rows]);

  return (
    <div className="space-y-6">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {([["all", "All"], ["published", "Published"], ["review", "In review"], ["draft", "Drafts"], ["scheduled", "Scheduled"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setStatus(k)}
            className={`shrink-0 rounded-full border px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-all ${status === k ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55 hover:text-sand-100"}`}>
            {l} · {counts[k]}
          </button>
        ))}
      </div>

      {q.loading && <ListSkeleton rows={6} />}
      {q.error && <ErrorState onRetry={q.reload} />}
      {!q.loading && !q.error && list.length === 0 && (
        <EmptyState icon={<Eye size={22} />} title="Nothing here" body="Posts appear as the desk writes and submits them from the Blogging space." />
      )}
      {!q.loading && !q.error && list.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-forest-800 bg-forest-900/60 p-4">
          <SmartImg src={p.cover} alt="" className="h-14 w-20 shrink-0 rounded-lg border border-forest-800 object-cover duotone" />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 truncate text-[13.5px] font-semibold text-sand-100">
              {p.title || "Untitled"}
              <span className="rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em]" style={{ borderColor: `${KIND_META[p.kind].color}55`, color: KIND_META[p.kind].color }}>{KIND_META[p.kind].short}</span>
              <span className={`rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] ${
                p.status === "published" ? "border-kapha-500/50 bg-kapha-500/10 text-kapha-300" :
                p.status === "review" ? "border-ember-400/50 bg-ember-400/10 text-ember-300" :
                p.status === "scheduled" ? "border-steel-400/50 bg-steel-400/10 text-steel-300" :
                "border-forest-700 text-sand-200/50"}`}>{p.status}</span>
            </p>
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/40">{p.views.toLocaleString()} views · {p.date}</p>
          </div>
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              {p.status === "review" && (
                <button onClick={() => { savePostStatusF(p.id, "published"); toast(`"${p.title}" approved & published`); q.reload(); refresh(); }}
                  className="flex items-center gap-1.5 rounded-full bg-kapha-500 px-4 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-forest-950 hover:brightness-110"><Check size={12} /> Approve</button>
              )}
              {p.status === "published" && (
                <button onClick={() => { savePostStatusF(p.id, "draft"); toast(`"${p.title}" unpublished (back to drafts)`); q.reload(); refresh(); }}
                  className="rounded-full border border-steel-400/50 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-steel-300 hover:bg-steel-400/10">Unpublish</button>
              )}
              {p.status === "draft" && (
                <button onClick={() => { savePostStatusF(p.id, "published"); toast(`"${p.title}" published`); q.reload(); refresh(); }}
                  className="rounded-full border border-kapha-500/50 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-kapha-300 hover:bg-kapha-500/10">Publish</button>
              )}
              <ConfirmChip onConfirm={() => { deletePostF(p.id); toast(`"${p.title}" deleted`); q.reload(); refresh(); }} />
            </div>
          )}
        </div>
      ))}

      <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Herb Index</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-sand-200/50">Add, edit and remove the public herb monographs. Changes appear on the site instantly.</p>
        <div className="mt-4"><HerbManager /></div>
      </div>
    </div>
  );
}

/* --------------------------------- marketing --------------------------------- */

export function MarketingPage({ role, refresh }: PageProps) {
  const { toast } = useApp();
  const q = useAsync(() => loadDiscountsF(), [refresh]);
  const [form, setForm] = useState({ code: "", type: "percent" as "percent" | "flat", value: "", minOrder: "", expires: "" });
  const [testCode, setTestCode] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const canEdit = role !== "viewer";

  const create = () => {
    const value = parseFloat(form.value);
    if (!form.code.trim() || !Number.isFinite(value) || value <= 0) { toast("Give the code a name and a positive value"); return; }
    const d: Discount = {
      id: `d-${Date.now()}`, code: form.code.trim().toUpperCase(), type: form.type, value,
      minOrder: parseFloat(form.minOrder) || 0, expires: form.expires, active: true, createdAt: new Date().toISOString().slice(0, 10),
    };
    saveDiscountF(d).then(() => { toast(`Code ${d.code} created`); setForm({ code: "", type: "percent", value: "", minOrder: "", expires: "" }); q.reload(); refresh(); });
  };

  const runTest = () => {
    import("./console/db").then(({ validateDiscount }) => {
      const res = validateDiscount(testCode, 1200);
      setTestResult(res.ok ? `✓ ${res.discount!.code} works on a ₹1,200 order — saves ${inr(res.amount)}.` : `✗ ${res.reason}`);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-4">
        {q.loading && <ListSkeleton rows={3} />}
        {!q.loading && (q.rows ?? []).length === 0 && (
          <EmptyState icon={<Star size={22} />} title="No discount codes yet" body="Create your first code — shoppers apply it at the payment step." />
        )}
        {(q.rows ?? []).map((d) => (
          <div key={d.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${d.active ? "border-forest-800 bg-forest-900/60" : "border-forest-800 bg-forest-900/30 opacity-60"}`}>
            <span className="rounded-lg border border-gold-500/40 bg-gold-400/10 px-3 py-1.5 font-mono text-[12px] font-semibold tracking-[0.1em] text-gold-300">{d.code}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] text-sand-200/75">{d.type === "percent" ? `${d.value}% off` : `${inr(d.value)} off`}{d.minOrder > 0 && <span className="text-sand-200/45"> · min {inr(d.minOrder)}</span>}{d.expires && <span className="text-sand-200/45"> · until {d.expires}</span>}</p>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                <Switch on={d.active} label={d.active ? "Active" : "Paused"} onChange={(b) => { saveDiscountF({ ...d, active: b }); q.reload(); refresh(); }} />
                <ConfirmChip onConfirm={() => { deleteDiscountF(d.id); toast(`${d.code} deleted`); q.reload(); refresh(); }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {canEdit && (
          <div className="rounded-xl border border-gold-500/35 bg-gold-400/5 p-5">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-300">New discount code</p>
            <div className="mt-3.5 space-y-3">
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="Code, e.g. WELCOME10" className={cInp} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "flat" })} className={cInp} aria-label="Discount type">
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat ₹</option>
                </select>
                <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === "percent" ? "10" : "100"} className={cInp} />
              </div>
              <input value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} placeholder="Minimum order ₹ (optional)" className={cInp} />
              <input type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} className={cInp} aria-label="Expiry date" />
              <button onClick={create} className="flex items-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Plus size={14} /> Create code</button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-forest-800 bg-forest-900/60 p-5">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">Test a code</p>
          <div className="mt-3 flex gap-2">
            <input value={testCode} onChange={(e) => setTestCode(e.target.value.toUpperCase())} placeholder="Enter a code" className={cInp} />
            <button onClick={runTest} className="shrink-0 rounded-full border border-gold-500/50 px-5 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">Test</button>
          </div>
          {testResult && <p className={`mt-3 text-[12.5px] ${testResult.startsWith("✓") ? "text-kapha-300" : "text-ember-300"}`}>{testResult}</p>}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- analytics --------------------------------- */

export function AnalyticsPage() {
  const orders = useAsync(() => loadOrders(), []);
  const views = useAsync(() => loadPageViewsF(), []);

  const days = useMemo(() => {
    const out: { label: string; rev: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400e3);
      const key = day.toISOString().slice(0, 10);
      const rev = (orders.rows ?? []).filter((o) => o.status !== "cancelled" && (o.placedAt ?? "").slice(0, 10) === key).reduce((s, o) => s + o.total, 0);
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
    (orders.rows ?? []).filter((o) => o.status !== "cancelled").forEach((o) => (o.items ?? []).forEach((i) => { rev[i.name] = (rev[i.name] ?? 0) + i.price * i.qty; }));
    return Object.entries(rev).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders.rows]);
  const maxTop = Math.max(1, ...topProducts.map(([, v]) => v));

  const pageCounts = useMemo(() => {
    const map: Record<string, number> = {};
    (views.rows ?? []).forEach((v) => { map[v.page] = (map[v.page] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [views.rows]);
  const maxPage = Math.max(1, ...pageCounts.map(([, v]) => v));

  if (orders.loading || views.loading) return <ListSkeleton rows={6} />;
  if (orders.error) return <ErrorState onRetry={orders.reload} />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Revenue · last 14 days</p>
        <div className="mt-5 flex h-40 items-end gap-1.5">
          {days.map((d, i) => (
            <div key={i} className="group relative flex flex-1 flex-col items-center gap-2">
              <span className="pointer-events-none absolute -top-7 hidden whitespace-nowrap rounded-md bg-forest-800 px-2 py-1 font-mono text-[9px] text-gold-300 group-hover:block">{inr(d.rev)}</span>
              <div className="w-full rounded-t-md bg-gradient-to-t from-gold-600/60 to-gold-400 transition-all group-hover:from-gold-500 group-hover:to-gold-300" style={{ height: `${Math.max(3, (d.rev / maxRev) * 100)}%` }} />
              <span className="font-mono text-[8px] text-sand-200/35">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Orders by status</p>
          <div className="mt-4 space-y-3">
            {statusCounts.map(([s, n]) => (
              <div key={s}>
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-sand-200/55"><StatusBadge status={s as never} /><span>{n}</span></div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-forest-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400" style={{ width: `${(n / totalOrders) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Top products</p>
          <div className="mt-4 space-y-3">
            {topProducts.length === 0 && <p className="text-[12.5px] text-sand-200/45">No sales yet.</p>}
            {topProducts.map(([name, rev]) => (
              <div key={name}>
                <div className="flex items-center justify-between"><span className="truncate text-[12px] text-sand-200/75">{name}</span><span className="font-mono text-[11px] text-gold-300">{inr(rev)}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-forest-800">
                  <div className="h-full rounded-full bg-kapha-400" style={{ width: `${(rev / maxTop) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Visits by page</p>
          <div className="mt-4 space-y-3">
            {pageCounts.length === 0 && <p className="text-[12.5px] text-sand-200/45">Browse the site to generate visits.</p>}
            {pageCounts.map(([page, n]) => (
              <div key={page}>
                <div className="flex items-center justify-between"><span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-sand-200/70">{page}</span><span className="font-mono text-[11px] text-sand-100">{n}</span></div>
                <div className="mt-1 h-2 flex-1 overflow-hidden rounded-full bg-forest-800">
                  <div className="h-full rounded-full bg-steel-400" style={{ width: `${(n / maxPage) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- settings --------------------------------- */

const WIZARD = [
  { title: "Create a Firebase project", body: "console.firebase.google.com → Add project → name it (e.g. vaidyagan) → Continue. Analytics is optional." },
  { title: "Add a web app", body: "Project settings → Your apps → click the </> icon → nickname it → Register. This reveals your six config values." },
  { title: "Copy the config below", body: "Paste apiKey, authDomain, projectId, storageBucket, messagingSenderId and appId into the boxes. Nothing is sent anywhere until you press Test." },
  { title: "Enable Google sign-in", body: "Build → Authentication → Get started → Sign-in method → Google → Enable → save." },
  { title: "Enable Email/Password", body: "Same Sign-in method screen → Email/Password → Enable → save." },
  { title: "Create Firestore", body: "Build → Firestore Database → Create database → Production mode → pick a region → Enable." },
  { title: "Paste security rules", body: "Firestore → Rules → paste the rules shown here → Publish. Then press Test connection, and flip to Live mode." },
];

const RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /admin_users/{uid} {
      allow read, write: if request.auth != null;
    }
    match /{collection}/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}`;

export function SettingsPage({ role, refresh }: PageProps) {
  const { toast } = useApp();
  const [settings, setSettings] = useState(getConsoleSettings());
  const [config, setConfig] = useState(getFirebaseConfig());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const patch = (p: Partial<typeof settings>) => {
    const next = { ...settings, ...p };
    setSettings(next);
    saveConsoleSettings(p);
  };

  const doTest = () => {
    const err = validateFirebaseConfig(config);
    if (err) { setTestResult({ ok: false, msg: err }); return; }
    setTesting(true);
    saveFirebaseConfig(config);
    initFirebase(config);
    import("./console/firebase-db").then((fb) => fb.testConnection(config))
      .then(() => { setTestResult({ ok: true, msg: "Connected — your config reaches a live project. You can switch to Live mode." }); setTesting(false); refresh(); })
      .catch((e) => { setTestResult({ ok: false, msg: `Couldn't connect — ${e?.code === "permission-denied" ? "your security rules are blocking reads. Publish the rules from the wizard, then try again." : "check the config values and that Firestore is created."}` }); setTesting(false); });
  };

  const doExport = () => { downloadFile("vaidyagan-backup.json", exportAllData(), "application/json"); toast("Backup downloaded"); };
  const doImport = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      const res = importAllData(String(r.result));
      toast(res.ok ? `Restored ${res.keys} data keys — reload the page to see them` : (res.error ?? "Import failed"));
    };
    r.readAsText(file);
  };

  const input = cInp;
  const label = cLbl;

  return (
    <div className="space-y-6">
      {/* Connect database */}
      <div className="rounded-2xl border border-gold-500/35 bg-gold-400/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-300">Connect database</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-sand-200/55">Paste your Firebase web config to go live. Until then the console runs on the built-in demo data.</p>
          </div>
          <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] ${getConsoleMode() === "live" ? "border-kapha-500/60 bg-kapha-500/12 text-kapha-300" : "border-gold-500/50 bg-gold-400/10 text-gold-300"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${getConsoleMode() === "live" ? "bg-kapha-400" : "animate-blink bg-gold-400"}`} />
            {getConsoleMode() === "live" ? "Live mode" : "Demo mode"}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {([["apiKey", "API key"], ["authDomain", "Auth domain"], ["projectId", "Project ID"], ["storageBucket", "Storage bucket"], ["messagingSenderId", "Messaging sender ID"], ["appId", "App ID"]] as const).map(([key, lbl]) => (
            <div key={key}>
              <label className={label}>{lbl}</label>
              <input value={config[key]} onChange={(e) => setConfig({ ...config, [key]: e.target.value })} placeholder={key === "authDomain" ? "vaidyagan.firebaseapp.com" : "paste from Firebase"} className={`${input} font-mono text-[12px]`} />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={doTest} disabled={testing}
            className="flex items-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300 disabled:opacity-60">
            {testing ? <span className="animate-spin-fast inline-block h-4 w-4 rounded-full border-2 border-forest-950 border-t-transparent" /> : <Database size={14} />}
            {testing ? "Testing…" : "Test connection"}
          </button>
          <button onClick={() => { saveFirebaseConfig(config); setConsoleMode("live"); toast("Switched to Live mode"); refresh(); }} disabled={!hasFirebaseConfig()}
            className="rounded-full border border-kapha-500/50 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-kapha-300 hover:bg-kapha-500/10 disabled:opacity-40">Go Live</button>
          <button onClick={() => { setConsoleMode("demo"); toast("Switched to Demo mode"); refresh(); }}
            className="rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/60 hover:text-sand-100">Back to Demo</button>
          <button onClick={() => setShowWizard(!showWizard)} className="rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">Setup wizard</button>
        </div>

        {testResult && (
          <p className={`mt-4 flex items-start gap-2 rounded-xl border p-4 text-[13px] ${testResult.ok ? "border-kapha-500/40 bg-kapha-500/8 text-kapha-300" : "border-ember-500/40 bg-ember-500/8 text-ember-300"}`}>
            {testResult.ok ? <Check size={16} className="mt-0.5 shrink-0" /> : <Close size={16} className="mt-0.5 shrink-0" />}
            {testResult.msg}
          </p>
        )}

        {showWizard && (
          <div className="mt-5 space-y-3">
            {WIZARD.map((w, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-forest-800 bg-forest-900/60 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-400/15 font-mono text-[12px] font-bold text-gold-300">{i + 1}</span>
                <div><p className="text-[13.5px] font-semibold text-sand-100">{w.title}</p><p className="mt-1 text-[12.5px] leading-relaxed text-sand-200/55">{w.body}</p></div>
              </div>
            ))}
            <button onClick={() => setShowRules(!showRules)} className="rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">{showRules ? "Hide" : "Show"} security rules</button>
            {showRules && <pre className="overflow-x-auto rounded-xl border border-forest-800 bg-forest-950 p-4 font-mono text-[11px] leading-relaxed text-moss-300">{RULES}</pre>}
          </div>
        )}
      </div>

      {/* Store settings */}
      <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Payments & shipping</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Switch on={settings.paymentUPI} label="UPI" desc="Google Pay, PhonePe…" onChange={(b) => patch({ paymentUPI: b })} />
          <Switch on={settings.paymentCard} label="Card" desc="Credit / debit" onChange={(b) => patch({ paymentCard: b })} />
          <Switch on={settings.paymentCOD} label="Cash on delivery" desc="Pay at the door" onChange={(b) => patch({ paymentCOD: b })} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div><label className={label}>Free shipping above ₹</label><input type="number" value={settings.freeShipAt} onChange={(e) => patch({ freeShipAt: parseInt(e.target.value || "0", 10) })} className={input} /></div>
          <div><label className={label}>Shipping fee ₹</label><input type="number" value={settings.shippingFee} onChange={(e) => patch({ shippingFee: parseInt(e.target.value || "0", 10) })} className={input} /></div>
          <div><label className={label}>Invoice footer text</label><input value={settings.invoiceFooter} onChange={(e) => patch({ invoiceFooter: e.target.value })} className={input} /></div>
          <div><label className={label}>Public contact email</label><input value={settings.contactEmail} onChange={(e) => patch({ contactEmail: e.target.value })} className={input} /></div>
        </div>
        <div className="mt-4">
          <Switch on={settings.moderateReviews} label="Moderate customer reviews" desc="New product reviews wait for approval before appearing publicly." onChange={(b) => patch({ moderateReviews: b })} />
        </div>
      </div>

      {/* Backup & danger */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Backup & restore</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-sand-200/50">Download everything as JSON, or restore from a previous backup file.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={doExport} className="flex items-center gap-2 rounded-full border border-gold-500/50 px-5 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-300 hover:bg-gold-400 hover:text-forest-950"><Download size={13} /> Export all data</button>
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Upload size={13} /> Import JSON</button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = ""; }} />
          </div>
        </div>

        <div className="rounded-2xl border border-ember-500/35 bg-ember-500/5 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ember-300">Danger zone</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-sand-200/50">Wipe generated demo data (orders, customers, posts, herbs) so the site re-seeds. Logins are kept.</p>
          {confirmReset ? (
            <div className="mt-4 flex gap-3">
              <button onClick={() => { resetDemoData(); setConfirmReset(false); toast("Demo data cleared — reload to re-seed"); }} className="rounded-full bg-ember-400 px-6 py-2.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-forest-950">Yes, clear it</button>
              <button onClick={() => setConfirmReset(false)} className="rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="mt-4 flex items-center gap-2 rounded-full border border-ember-500/50 px-5 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ember-300 hover:bg-ember-500/10"><Trash size={13} /> Reset demo data</button>
          )}
        </div>
      </div>
    </div>
  );
}

export { BRAND_LOGO_URL };
