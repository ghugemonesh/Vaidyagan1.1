/* =============================================================================
   Vaidyagan Doctor Studio
   -----------------------------------------------------------------------------
   Login (no password window behind it) · Blogging space (editor + article
   settings with CUSTOM CATEGORY) · My Blogs (show/hide) · Needs Review queue ·
   Herb Index · Store · My Profile · Members panel (roles + granular
   permissions) · superadmin-only Settings (master switches) · activity log ·
   PDF/Word importer. The Admin Console opens from the header as its own view.
   ========================================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Key, Plus, Trash2, Check, ShieldCheck, Lock, Eye, Pen, Clock, Send, Download,
  Quote, ImageIcon, Video, Monitor, Smartphone, Maximize2, Minimize2, ListTree,
  ChevronRight, FileText, Activity as ActivityIcon, LogOut, Sparkles, CalendarDays, FileUp, Settings as SettingsIcon,
} from "lucide-react";
import { useApp, auth, readImageFile, Monogram, SmartImg, type StudioUser, type StudioPerms } from "./lib";
import {
  CATEGORIES, categoryName, articleHtml, formatDate, IMG, KIND_META, DOSHA_META,
  type Article, type CaseMeta, type Dosha, type Kind, type ResearchMeta,
} from "./data";
import { COVER_CHOICES } from "./covers";
import { HerbManager } from "./herbs-admin";
import { DoctorProfileTab } from "./doctor-profile";
import { getConsoleSettings, setMaintenance, isMaintenanceOn } from "./console/db";
import { AlignLeft, AlignCenter, AlignJustify } from "./icons";

const DEFAULT_CASE: CaseMeta = { age: "", sex: "", prakriti: "", presenting: "", duration: "" };
const DEFAULT_RESEARCH: ResearchMeta = { question: "", design: "", n: "", finding: "", grade: "" };

const inp = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
const lbl = "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.18em] text-gold-400/80";

/* --------------------------------- login ------------------------------------ */

function LoginScreen({ onLogin }: { onLogin: (u: StudioUser) => void }) {
  const { toast } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = auth.login(username, password);
    if (!u) {
      const exists = auth.list().some((x) => x.username.toLowerCase() === username.trim().toLowerCase());
      setError(exists ? "Incorrect password — please try again." : "No account found with that username.");
      return;
    }
    toast(`Namaste, ${u.name} — the desk is open`);
    onLogin(u);
  };

  return (
    <div className="relative mx-auto w-full max-w-md px-5">
      <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-3xl border border-forest-700 bg-forest-900/85 p-8 backdrop-blur sm:p-10">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(214,180,95,0.16), transparent)" }} />
        <span className="animate-breathe mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold-500/50 bg-gold-400/10 font-display text-2xl italic text-gold-300">वै</span>
        <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-gold-400">Doctor Studio</p>
        <h1 className="mt-2 text-center font-display text-3xl font-semibold text-sand-100">The publishing desk</h1>
        <p className="mt-3 text-center text-[13px] leading-relaxed text-sand-200/55">
          Reserved for Vaidyagan's publishing team. Sign in to draft essays, case papers and research reviews, schedule releases and push them live to the journal.
        </p>
        <form onSubmit={submit} className="mt-7 space-y-3.5">
          <div>
            <label className={lbl} htmlFor="su-user">Username</label>
            <input id="su-user" value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} placeholder="e.g. monesh" className={inp} autoFocus />
          </div>
          <div>
            <label className={lbl} htmlFor="su-pass">Password</label>
            <input id="su-pass" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="••••••••" className={inp} />
          </div>
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-lg border border-ember-500/40 bg-ember-500/10 px-4 py-2.5 text-[12.5px] text-ember-300">{error}</motion.p>
            )}
          </AnimatePresence>
          <button type="submit" className="gold-sheen flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300">
            <Lock size={14} /> Enter the Studio
          </button>
        </form>
        <button onClick={() => setShowDemo(!showDemo)} className="mt-5 w-full text-center font-mono text-[9px] uppercase tracking-[0.2em] text-sand-200/40 transition-colors hover:text-gold-300">
          {showDemo ? "Hide demo logins" : "Demo logins for testing"}
        </button>
        <AnimatePresence>
          {showDemo && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-3 space-y-1.5 rounded-xl border border-forest-800 bg-forest-950/50 p-4 font-mono text-[10.5px] text-sand-200/60">
                <p><span className="text-gold-300">monesh</span> / admin91466 — superadmin</p>
                <p><span className="text-moss-300">shruti</span> / shruti123 · <span className="text-moss-300">bhagyesh</span> / bhagyesh123 · <span className="text-moss-300">shivani</span> / shivani123</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ------------------------------ shared fragments ----------------------------- */

function PermSwitch({ on, onToggle, label, desc, disabled, compact }: { on: boolean; onToggle: (b: boolean) => void; label: string; desc: string; disabled?: boolean; compact?: boolean }) {
  if (compact) {
    return (
      <button role="switch" aria-checked={on} disabled={disabled} onClick={() => onToggle(!on)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${disabled ? "cursor-not-allowed opacity-45" : ""} ${on ? "bg-kapha-500" : "bg-forest-700"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-sand-100 shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    );
  }
  return (
    <button role="switch" aria-checked={on} disabled={disabled} onClick={() => onToggle(!on)}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all ${disabled ? "cursor-not-allowed opacity-45" : ""} ${on ? "border-kapha-500/50 bg-kapha-500/8" : "border-forest-700 bg-forest-950/40"}`}>
      <span className="min-w-0">
        <span className={`block text-[12.5px] font-semibold ${on ? "text-sand-100" : "text-sand-200/65"}`}>{label}</span>
        <span className="mt-0.5 block text-[10.5px] leading-snug text-sand-200/40">{desc}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-kapha-500" : "bg-forest-700"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-sand-100 shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

/* ------------------------------ members modal -------------------------------- */

function MembersModal({ onClose }: { onClose: () => void }) {
  const { toast, logActivity } = useApp();
  const [, force] = useState(0);
  const refresh = () => force((x) => x + 1);
  const users = auth.list();
  const me = auth.session();
  const [form, setForm] = useState({ name: "", username: "", password: "", specialty: "" });
  const [inviteRole, setInviteRole] = useState<"doctor" | "superadmin">("doctor");
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPass, setNewPass] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [openPerms, setOpenPerms] = useState<string | null>(null);

  const setPerm = (u: StudioUser, key: keyof StudioPerms, value: boolean, label: string) => {
    auth.setPerms(u.id, { [key]: value } as Partial<StudioPerms>);
    logActivity("member", `${value ? "granted" : "revoked"} "${label}" for ${u.name}`);
    toast(`${u.name} — ${label} ${value ? "granted" : "revoked"}`);
    refresh();
  };

  const changeRole = (u: StudioUser, role: "doctor" | "superadmin") => {
    if (role === u.role) return;
    const res = auth.setRole(u.id, role);
    if (!res.ok) { toast(res.error ?? "Could not change role"); return; }
    logActivity("member", `${role === "superadmin" ? "promoted" : "moved"} ${u.name} to ${role}`);
    toast(role === "superadmin" ? `${u.name} is now a Superadmin — full desk control` : `${u.name} is now a Doctor`);
    refresh();
  };

  const add = () => {
    if (!form.name.trim() || !form.username.trim() || form.password.length < 4) { toast("Name, username and a 4+ character password are required"); return; }
    const res = auth.addMember({
      name: form.name.trim(), username: form.username, password: form.password,
      specialty: form.specialty.trim() || "Ayurvedic medicine", role: inviteRole,
      ...(inviteRole === "superadmin" ? { consoleAccess: true, storeAccess: true } : {}),
    });
    if (!res.ok) { toast(res.error ?? "Could not add member"); return; }
    logActivity("member", `added ${res.user!.name} to the desk as ${inviteRole}`);
    setForm({ name: "", username: "", password: "", specialty: "" });
    setInviteRole("doctor");
    toast(`${res.user!.name} can now sign in${inviteRole === "superadmin" ? " with full superadmin rights" : ""}`);
    refresh();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[66] flex items-end justify-center bg-forest-950/85 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Members of the desk"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-forest-700 bg-forest-900 p-6 sm:rounded-2xl sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Members of the desk</p>
            <p className="mt-1 font-display text-2xl font-semibold text-sand-100">{users.length} account{users.length === 1 ? "" : "s"}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={15} /></button>
        </div>

        <div className="mt-6 space-y-3">
          {users.map((u) => {
            const isRoot = u.id === "root";
            const showPerms = openPerms === u.id;
            return (
              <div key={u.id} className={`rounded-xl border p-4 ${isRoot ? "border-gold-500/40 bg-gold-400/5" : "border-forest-800 bg-forest-850/50"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <Monogram author={{ initials: u.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase(), hue: u.hue }} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sand-100">
                      {u.name}
                      {u.role === "superadmin" && <span className="flex items-center gap-1 rounded-full bg-gold-400/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-gold-300"><ShieldCheck size={9} /> Superadmin</span>}
                      {u.role === "doctor" && <span className="rounded-full bg-forest-800 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-sand-200/55">Doctor</span>}
                      {!u.active && <span className="rounded-full bg-forest-800 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-sand-200/50">Suspended</span>}
                    </p>
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/40">@{u.username} · {u.specialty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {resetFor === u.id ? (
                      <div className="flex items-center gap-1.5">
                        <input value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New password" autoFocus
                          className="w-32 rounded-lg border border-forest-700 bg-forest-950/70 px-2.5 py-1.5 font-mono text-[11px] text-sand-100 focus:border-gold-400 focus:outline-none" />
                        <button onClick={() => { if (auth.resetPassword(u.id, newPass)) { toast(`Password reset for ${u.name}`); setResetFor(null); setNewPass(""); refresh(); } else toast("Password needs 4+ characters"); }}
                          className="rounded-full bg-gold-400 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase text-forest-950">Set</button>
                        <button onClick={() => setResetFor(null)} aria-label="Cancel password reset" className="text-sand-200/40 hover:text-sand-100"><X size={13} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setResetFor(u.id); setNewPass(""); }} title="Reset password" aria-label={`Reset password for ${u.name}`}
                        className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Key size={13} /></button>
                    )}
                    <button onClick={() => setOpenPerms(showPerms ? null : u.id)} aria-pressed={showPerms} title="Role & permissions"
                      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-all ${showPerms ? "border-gold-400 bg-gold-400/15 text-gold-300" : "border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"}`}>
                      <ShieldCheck size={12} /> {showPerms ? "Hide" : "Permissions"}
                    </button>
                    {u.id !== "root" && (
                      <>
                        <button onClick={() => { auth.setMemberStatus(u.id, !u.active); logActivity("member", u.active ? `suspended ${u.name}` : `reactivated ${u.name}`); toast(u.active ? `${u.name} suspended` : `${u.name} reactivated`); refresh(); }}
                          className={`rounded-full border px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-all ${u.active ? "border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300" : "border-kapha-500/50 text-kapha-300 hover:bg-kapha-500/15"}`}>
                          {u.active ? "Suspend" : "Reactivate"}
                        </button>
                        {confirmRemove === u.id ? (
                          <button onClick={() => { auth.removeMember(u.id); logActivity("member", `removed ${u.name}`); setConfirmRemove(null); toast(`${u.name} removed from the desk`); refresh(); }}
                            className="rounded-full bg-ember-500/20 px-3.5 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ember-300 hover:bg-ember-500/35">Confirm</button>
                        ) : (
                          <button onClick={() => { setConfirmRemove(u.id); window.setTimeout(() => setConfirmRemove((c) => (c === u.id ? null : c)), 3000); }} aria-label={`Remove ${u.name}`}
                            className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200/40 hover:border-ember-400 hover:text-ember-300"><Trash2 size={13} /></button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {showPerms && (
                  <div className="mt-3 space-y-2.5 border-t border-forest-800 pt-3">
                    <div className="rounded-xl border border-forest-800 bg-forest-950/40 p-3.5">
                      <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/50">Desk role</p>
                      {isRoot ? (
                        <p className="mt-2 flex items-center gap-2 text-[12.5px] text-gold-300"><ShieldCheck size={14} /> Founder account — always a superadmin.</p>
                      ) : (
                        <div className="mt-2 flex gap-2">
                          {(["doctor", "superadmin"] as const).map((r) => (
                            <button key={r} onClick={() => changeRole(u, r)} aria-pressed={u.role === r}
                              className={`flex-1 rounded-lg border py-2.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-all ${u.role === r ? (r === "superadmin" ? "border-gold-400 bg-gold-400/12 text-gold-300 shadow-[0_0_16px_rgba(214,180,95,0.2)]" : "border-moss-400 bg-moss-500/12 text-moss-300") : "border-forest-700 text-sand-200/50 hover:text-sand-100"}`}>
                              {r === "superadmin" ? "★ Superadmin" : "Doctor"}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-[11px] leading-snug text-sand-200/40">Superadmins manage members, approve posts and control the Admin Console. Doctors write and publish content.</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <PermSwitch on={u.canPublishDirect} disabled={isRoot} label="Publish directly" desc="Off → posts go to the Needs Review queue." onToggle={(b) => setPerm(u, "canPublishDirect", b, "Publish directly")} />
                      <PermSwitch on={u.canEditPublished} disabled={isRoot} label="Edit own published posts" desc="Off → their live articles are locked." onToggle={(b) => setPerm(u, "canEditPublished", b, "Edit published")} />
                      <PermSwitch on={u.canDeletePublished} disabled={isRoot} label="Delete own published posts" desc="Off → no delete button on live work." onToggle={(b) => setPerm(u, "canDeletePublished", b, "Delete published")} />
                      <PermSwitch on={u.storeAccess} disabled={isRoot} label="Store tab in Studio" desc="Products & orders at a glance." onToggle={(b) => setPerm(u, "storeAccess", b, "Store access")} />
                      <PermSwitch on={u.herbAccess} disabled={isRoot} label="Herb Index tab" desc="Add & edit public herb monographs." onToggle={(b) => setPerm(u, "herbAccess", b, "Herb Index access")} />
                      <PermSwitch on={u.consoleAccess} disabled={isRoot} label="Admin Console access" desc="The full Wix/Shopify-style dashboard." onToggle={(b) => setPerm(u, "consoleAccess", b, "Admin Console access")} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-gold-500/35 bg-gold-400/5 p-5">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-300">Add someone to the desk</p>
          <div className="mt-3 flex gap-2">
            {(["doctor", "superadmin"] as const).map((r) => (
              <button key={r} onClick={() => setInviteRole(r)} aria-pressed={inviteRole === r}
                className={`flex-1 rounded-lg border py-2.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-all sm:flex-none sm:px-6 ${inviteRole === r ? (r === "superadmin" ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-moss-400 bg-moss-500/12 text-moss-300") : "border-forest-700 text-sand-200/50 hover:text-sand-100"}`}>
                {r === "superadmin" ? "Invite as Superadmin" : "Invite as Doctor"}
              </button>
            ))}
          </div>
          {inviteRole === "superadmin" && (
            <p className="mt-2 flex items-start gap-2 text-[11px] leading-snug text-gold-300/75"><ShieldCheck size={13} className="mt-0.5 shrink-0" /> Superadmins can manage members, approve posts and open the Admin Console. Grant this only to people you fully trust.</p>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className={inp} />
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username (for login)" className={inp} />
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Temporary password" className={inp} />
            <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Specialty" className={inp} />
          </div>
          <button onClick={add} className="gold-sheen mt-3.5 flex items-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">
            <Plus size={14} /> Add {inviteRole === "superadmin" ? "superadmin" : "member"}
          </button>
        </div>
        <span className="hidden">{me?.name}</span>
      </motion.div>
    </motion.div>
  );
}

/* --------------------------- settings (superadmin) ---------------------------- */

function SettingsModal({ onClose }: { onClose: () => void }) {
  const { toast, setStoreEnabled, storeEnabled, profileTabEnabled, setProfileTabEnabled, logActivity } = useApp();
  const me = auth.session();
  const [maint, setMaint] = useState(isMaintenanceOn());
  if (me?.role !== "superadmin") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[66] grid place-items-center bg-forest-950/85 p-6 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-sm rounded-2xl border border-forest-700 bg-forest-900 p-7 text-center" onClick={(e) => e.stopPropagation()}>
          <Lock size={24} className="mx-auto text-gold-400" />
          <p className="mt-3 font-display text-xl font-semibold text-sand-100">Superadmin only</p>
          <p className="mt-2 text-[12.5px] text-sand-200/55">The master switches are reserved for superadmins.</p>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[66] grid place-items-center bg-forest-950/85 p-6 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        role="dialog" aria-label="Studio settings" className="w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900 p-7">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400"><SettingsIcon size={14} /> Master switches</p>
          <button onClick={onClose} aria-label="Close settings" className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={14} /></button>
        </div>
        <p className="mt-2 text-[12px] text-sand-200/50">These control what the public sees — changes apply instantly.</p>
        <div className="mt-5 space-y-2.5">
          <PermSwitch on={storeEnabled} label="Enable public Store" desc="Off hides the Store from the website entirely." onToggle={(b) => { setStoreEnabled(b); logActivity("edit", b ? "enabled the public store" : "paused the public store"); toast(b ? "Store is live" : "Store hidden from visitors"); }} />
          <PermSwitch on={profileTabEnabled} label="Show 'My Profile' tab" desc="Lets doctors manage their public profile & practice." onToggle={(b) => { setProfileTabEnabled(b); toast(b ? "Profile tab visible in Studio" : "Profile tab hidden"); }} />
          <PermSwitch on={maint} label="Maintenance mode" desc="Visitors see an 'under construction' notice; the desk keeps working." onToggle={(b) => { setMaint(b); setMaintenance(b); logActivity("edit", b ? "turned maintenance mode ON" : "turned maintenance mode OFF"); toast(b ? "Maintenance mode ON" : "Site is live again"); }} />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------- activity ----------------------------------- */

function ActivityModal({ onClose }: { onClose: () => void }) {
  const { activity } = useApp();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[66] flex items-end justify-center bg-forest-950/85 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Activity log"
        className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-forest-700 bg-forest-900 p-6 sm:rounded-2xl sm:p-7">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400"><ActivityIcon size={14} /> Activity log</p>
          <button onClick={onClose} aria-label="Close activity" className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={14} /></button>
        </div>
        <div className="mt-5 space-y-2">
          {activity.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-6 text-center text-[13px] text-sand-200/45">Every publish, approval and permission change lands here.</p>}
          {activity.slice(0, 30).map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-xl border border-forest-800 bg-forest-850/50 px-4 py-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] leading-relaxed text-sand-200/80"><b className="text-sand-100">{a.actor}</b> {a.action}</p>
                <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-sand-200/35">{formatDate(a.at)}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* --------------------------- image & video modals ----------------------------- */

function ImageInsertModal({ onInsert, onClose }: { onInsert: (html: string) => void; onClose: () => void }) {
  const { toast } = useApp();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [size, setSize] = useState<"s" | "m" | "l">("m");
  const insert = () => {
    if (!url) { toast("Add an image first"); return; }
    const w = size === "s" ? "45%" : size === "m" ? "75%" : "100%";
    onInsert(`<figure><img src="${url}" style="width:${w};max-width:100%;border-radius:10px" />${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure><p></p>`);
    onClose();
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[67] grid place-items-center bg-forest-950/85 p-6 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Insert image"
        className="w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900 p-6">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400"><ImageIcon size={14} /> Insert image</p>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={14} /></button>
        </div>
        <div className="mt-4 space-y-3.5">
          <div>
            <label className={lbl}>Upload or paste a URL</label>
            <div className="flex gap-2">
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-forest-600 px-3.5 py-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">
                <FileUp size={12} /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readImageFile(f, (u) => setUrl(u), (m) => toast(m)); e.target.value = ""; }} />
              </label>
              <input value={url.startsWith("") ? "(uploaded image)" : url} onChange={(e) => setUrl(e.target.value)} disabled={url.startsWith("")} placeholder="https://…" className={inp} />
            </div>
          </div>
          <div><label className={lbl}>Caption (optional)</label><input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Fig 1 — …" className={inp} /></div>
          <div>
            <label className={lbl}>Size on page</label>
            <div className="flex gap-2">
              {([["s", "Small"], ["m", "Medium"], ["l", "Full width"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setSize(k)} className={`flex-1 rounded-lg border py-2 font-mono text-[9px] uppercase tracking-[0.12em] ${size === k ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55"}`}>{l}</button>
              ))}
            </div>
          </div>
          {url && <SmartImg src={url} alt="Preview" className="max-h-40 w-full rounded-lg border border-forest-800 object-cover" />}
          <button onClick={insert} className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Check size={14} /> Insert</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function VideoInsertModal({ onInsert, onClose }: { onInsert: (html: string) => void; onClose: () => void }) {
  const { toast } = useApp();
  const [url, setUrl] = useState("");
  const parse = (raw: string): string | null => {
    const yt = raw.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vm = raw.match(/vimeo\.com\/(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
    return null;
  };
  const embed = parse(url);
  const insert = () => {
    if (!embed) { toast("Paste a YouTube or Vimeo link first"); return; }
    onInsert(`<figure><div style="position:relative;padding-top:56.25%;border-radius:10px;overflow:hidden"><iframe src="${embed}" style="position:absolute;inset:0;width:100%;height:100%" frameborder="0" allowfullscreen title="Video"></iframe></div></figure><p></p>`);
    onClose();
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[67] grid place-items-center bg-forest-950/85 p-6 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Embed video"
        className="w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900 p-6">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400"><Video size={14} /> Embed video</p>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={14} /></button>
        </div>
        <div className="mt-4 space-y-3.5">
          <div>
            <label className={lbl}>YouTube or Vimeo link</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" className={inp} />
            {url && !embed && <p className="mt-1.5 text-[11px] text-ember-300">That doesn't look like a YouTube or Vimeo link yet.</p>}
            {embed && <p className="mt-1.5 flex items-center gap-1 text-[11px] text-kapha-300"><Check size={11} /> Recognised — ready to embed.</p>}
          </div>
          <button onClick={insert} className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Check size={14} /> Embed</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------ outline drawer -------------------------------- */

interface FmtState { bold: boolean; italic: boolean; underline: boolean; strike: boolean; center: boolean; full: boolean; block: string }

function OutlineDrawer({ toc, active, open, onClose, onJump }: {
  toc: { level: 2 | 3; text: string }[]; active: number; open: boolean; onClose: () => void; onJump: (i: number) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ type: "spring", damping: 30, stiffness: 320 }}
          className="absolute bottom-3 right-3 top-3 z-30 flex w-[280px] max-w-[85%] flex-col overflow-hidden rounded-2xl border border-forest-700/60 bg-forest-950/85 shadow-[0_28px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          role="navigation" aria-label="Table of contents">
          <div className="flex items-center gap-2.5 border-b border-forest-800/80 px-4 py-3.5">
            <ListTree size={15} className="text-gold-400" />
            <p className="font-display text-[15px] font-semibold leading-none text-sand-100">Table of Contents</p>
            <span className="rounded-full border border-gold-500/40 bg-gold-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-gold-300">{toc.length} heading{toc.length === 1 ? "" : "s"}</span>
            <button onClick={onClose} aria-label="Close contents" className="ml-auto grid h-7 w-7 place-items-center rounded-lg border border-forest-700 text-sand-200/50 hover:text-gold-300"><X size={12} /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3">
            {toc.length === 0 ? (
              <div className="mx-1 rounded-xl border border-dashed border-forest-700 p-5 text-center">
                <ListTree size={18} className="mx-auto text-forest-600" />
                <p className="mt-3 text-[12px] leading-relaxed text-sand-200/55">Add <b className="text-sand-200/80">H2</b> or <b className="text-sand-200/80">H3</b> headings to your article to generate an outline.</p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {toc.map((t, i) => (
                  <li key={`${t.text}-${i}`}>
                    <button onClick={() => onJump(i)} aria-current={active === i ? "true" : undefined}
                      className={`group flex w-full items-start gap-2.5 rounded-lg border-l-2 py-2 pr-3 text-left transition-all ${t.level === 3 ? "pl-7" : "pl-3.5"} ${active === i ? "border-gold-400 bg-gold-400/10" : "border-transparent hover:border-gold-500/40 hover:bg-forest-850/80"}`}>
                      <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 transition-all ${active === i ? "scale-125 bg-gold-400 shadow-[0_0_8px_rgba(214,180,95,0.8)]" : "bg-forest-600 group-hover:bg-gold-500/70"}`} />
                      <span className="min-w-0 flex-1">
                        <span className={`block leading-snug ${t.level === 3 ? "text-[12px] text-moss-300/85" : "text-[13px] font-semibold text-sand-100"} ${active === i ? "!text-gold-300" : ""}`}>{t.text}</span>
                        <span className={`mt-0.5 block font-mono text-[8px] uppercase tracking-[0.18em] ${active === i ? "text-gold-400/80" : "text-sand-200/30"}`}>H{t.level}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------- toolbar ----------------------------------- */

function EditorToolbar({ edRef, sync, fmt, refreshFmt, restoreSelection, words, readMin, mode, setMode, device, setDevice, focus, onToggleFocus, outlineOpen, onToggleOutline, tocCount, onOpenImage, onOpenVideo, insertShloka }: {
  edRef: React.MutableRefObject<HTMLDivElement | null>;
  sync: () => void; fmt: FmtState; refreshFmt: () => void; restoreSelection: () => void;
  words: number; readMin: number;
  mode: "write" | "preview"; setMode: (m: "write" | "preview") => void;
  device: "desktop" | "mobile"; setDevice: (d: "desktop" | "mobile") => void;
  focus: boolean; onToggleFocus: () => void;
  outlineOpen: boolean; onToggleOutline: () => void; tocCount: number;
  onOpenImage: () => void; onOpenVideo: () => void; insertShloka: () => void;
}) {
  const keepSel = (e: React.MouseEvent) => e.preventDefault();
  const exec = (cmd: string, val?: string) => {
    const ed = edRef.current;
    if (!ed) return;
    const sel = window.getSelection();
    const lost = !sel || sel.rangeCount === 0 || sel.isCollapsed || !sel.anchorNode || !ed.contains(sel.anchorNode);
    if (lost) { ed.focus(); restoreSelection(); }
    try { document.execCommand(cmd, false, val); } catch { /* older engines */ }
    sync(); refreshFmt();
  };
  const btn = "grid h-9 w-9 place-items-center rounded-lg border border-forest-700 text-sand-200/70 transition-all hover:border-gold-400 hover:text-gold-300";
  const activeBtn = "border-gold-400 bg-gold-400/15 text-gold-300";
  const blockLabel: Record<string, string> = { p: "Normal", h1: "Heading 1", h2: "Heading 2", h3: "Heading 3" };
  return (
    <div className="border-b border-forest-800 bg-forest-850/80">
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5">
        <button onClick={onToggleOutline} aria-pressed={outlineOpen} aria-label="Table of contents" title="Table of contents"
          className={`relative grid h-9 w-9 place-items-center rounded-lg border transition-all ${outlineOpen ? "border-gold-400 bg-gold-400/15 text-gold-300" : "border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300"}`}>
          <ListTree size={15} />
          {tocCount > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold-400 px-1 font-mono text-[8.5px] font-bold leading-none text-forest-950">{tocCount}</span>}
        </button>
        <span className="mx-1 h-5 w-px bg-forest-700" />
        <select value={["p", "h1", "h2", "h3"].includes(fmt.block) ? fmt.block : "p"} aria-label="Paragraph style"
          onChange={(e) => { const v = e.currentTarget.value; if (v) exec("formatBlock", `<${v}>`); }}
          className="h-9 rounded-lg border border-forest-700 bg-forest-900 px-2 font-mono text-[10.5px] uppercase tracking-wide text-sand-200/75 focus:border-gold-400 focus:outline-none">
          <option value="p">Normal text</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option>
        </select>
        <span onMouseDown={keepSel} className="flex items-center gap-1.5">
          <button onClick={() => exec("bold")} className={`${btn} ${fmt.bold ? activeBtn : ""}`} title="Bold" aria-pressed={fmt.bold}><b className="text-xs">B</b></button>
          <button onClick={() => exec("italic")} className={`${btn} ${fmt.italic ? activeBtn : ""}`} title="Italic" aria-pressed={fmt.italic}><i className="text-xs">I</i></button>
          <button onClick={() => exec("underline")} className={`${btn} ${fmt.underline ? activeBtn : ""}`} title="Underline" aria-pressed={fmt.underline}><u className="text-xs">U</u></button>
          <button onClick={() => exec("strikeThrough")} className={`${btn} ${fmt.strike ? activeBtn : ""}`} title="Strikethrough" aria-pressed={fmt.strike}><s className="text-xs">S</s></button>
          <span className="relative grid h-9 w-9 place-items-center rounded-lg border border-forest-700" title="Text colour">
            <span className="text-xs font-bold text-sand-200/80">A</span>
            <input type="color" aria-label="Text colour" defaultValue="#e8cf8b" onChange={(e) => exec("foreColor", e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
            <span className="absolute bottom-1 left-2 right-2 h-0.5 rounded bg-gold-400" />
          </span>
          <span className="relative grid h-9 w-9 place-items-center rounded-lg border border-forest-700" title="Highlight">
            <span className="rounded bg-gold-400/40 px-1 text-[10px] font-bold text-sand-100">ab</span>
            <input type="color" aria-label="Highlight colour" defaultValue="#c49c3e" onChange={(e) => exec("hiliteColor", e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
          </span>
        </span>
        <span className="mx-1 h-5 w-px bg-forest-700" />
        <span onMouseDown={keepSel} className="flex items-center gap-1.5">
          <button onClick={() => exec("insertUnorderedList")} className={btn} title="Bullet list" aria-label="Bullet list"><span className="text-xs leading-none">•≡</span></button>
          <button onClick={() => exec("insertOrderedList")} className={btn} title="Numbered list" aria-label="Numbered list"><span className="text-xs leading-none">1≡</span></button>
          <button onClick={() => exec("formatBlock", "<blockquote>")} className={btn} title="Quote" aria-label="Quote"><Quote size={14} /></button>
          <button onClick={insertShloka} className={btn} title="Sanskrit shloka block" aria-label="Sanskrit shloka block"><Sparkles size={14} /></button>
          <button onClick={() => exec("justifyLeft")} className={`${btn} ${!fmt.center && !fmt.full ? activeBtn : ""}`} title="Align left" aria-label="Align left" aria-pressed={!fmt.center && !fmt.full}><AlignLeft size={15} /></button>
          <button onClick={() => exec("justifyCenter")} className={`${btn} ${fmt.center ? activeBtn : ""}`} title="Align centre" aria-label="Align centre" aria-pressed={fmt.center}><AlignCenter size={15} /></button>
          <button onClick={() => exec("justifyFull")} className={`${btn} ${fmt.full ? activeBtn : ""}`} title="Justify" aria-label="Justify" aria-pressed={fmt.full}><AlignJustify size={15} /></button>
        </span>
        <span className="mx-1 h-5 w-px bg-forest-700" />
        <span onMouseDown={keepSel} className="flex items-center gap-1.5">
          <button onClick={onOpenImage} className={btn} title="Insert image" aria-label="Insert image"><ImageIcon size={14} /></button>
          <button onClick={onOpenVideo} className={btn} title="Embed video" aria-label="Embed video"><Video size={14} /></button>
        </span>
        <div className="ml-auto flex items-center gap-1.5" onMouseDown={keepSel}>
          <span className="hidden items-center gap-1 rounded-full border border-forest-700 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-gold-300/80 lg:flex" title="Live word count & reading time">
            {words.toLocaleString()} words · {readMin} min
          </span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/40 md:block">
            {blockLabel[fmt.block] ?? "Normal"}{fmt.bold && " · B"}{fmt.italic && " · I"}{fmt.underline && " · U"}{fmt.strike && " · S"}{fmt.center && " · centred"}{fmt.full && " · justified"}
          </span>
          <button onClick={() => setMode(mode === "write" ? "preview" : "write")} aria-pressed={mode === "preview"} title={mode === "write" ? "Preview" : "Write"} aria-label="Toggle preview"
            className={`${btn} ${mode === "preview" ? activeBtn : ""}`}>{mode === "write" ? <Eye size={14} /> : <Pen size={14} />}</button>
          <button onClick={() => setDevice(device === "desktop" ? "mobile" : "desktop")} aria-pressed={device === "mobile"} title="Preview device" aria-label="Toggle preview device" className={btn}>
            {device === "desktop" ? <Monitor size={14} /> : <Smartphone size={14} />}
          </button>
          <button onClick={onToggleFocus} aria-pressed={focus} title={focus ? "Exit focus mode" : "Focus mode"} aria-label="Toggle focus mode" className={`${btn} ${focus ? activeBtn : ""}`}>
            {focus ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- importer ---------------------------------- */

function ImportModal({ onCreateAsIs, onConverted, onClose }: {
  onCreateAsIs: (a: { name: string; dataUrl: string; title: string }) => void;
  onConverted: (html: string, title: string) => void;
  onClose: () => void;
}) {
  const { toast } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const titleFrom = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Imported manuscript";

  const asIs = () => {
    if (!file) { toast("Choose a PDF first"); return; }
    const r = new FileReader();
    r.onload = () => onCreateAsIs({ name: file.name, dataUrl: String(r.result), title: titleFrom(file.name) });
    r.onerror = () => toast("Could not read that file");
    r.readAsDataURL(file);
  };

  const convert = async () => {
    if (!file) { toast("Choose a file first"); return; }
    setBusy(true);
    try {
      let html = "";
      let title = titleFrom(file.name);
      if (/\.pdf$/i.test(file.name)) {
        const pdfjs: any = await import("pdfjs-dist");
        const worker: any = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        try { pdfjs.GlobalWorkerOptions.workerSrc = worker.default; } catch { /* bundled fallback */ }
        const buf = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        const parts: string[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const tc = await page.getTextContent();
          parts.push(tc.items.map((it: any) => it.str).join(" "));
        }
        const text = parts.join("\n\n");
        if (!text.trim()) { toast("That PDF looks scanned (no text layer) — publish it as-is instead"); setBusy(false); return; }
        title = text.split("\n")[0].slice(0, 90) || title;
        html = text.split(/\n{2,}/).map((p: string) => `<p>${p.replace(/</g, "&lt;")}</p>`).join("");
      } else if (/\.(docx?)$/i.test(file.name)) {
        const mammoth: any = await import("mammoth");
        const buf = await file.arrayBuffer();
        const res = await mammoth.convertToHtml({ arrayBuffer: buf });
        html = res.value || "";
        if (!html.trim()) { toast("That document appears empty"); setBusy(false); return; }
      } else {
        const text = await file.text();
        html = text.split(/\n{2,}/).map((p) => `<p>${p.replace(/</g, "&lt;")}</p>`).join("");
      }
      onConverted(html, title);
    } catch {
      toast("Couldn't convert that file — try publishing it as-is");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[67] grid place-items-center bg-forest-950/85 p-6 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Import manuscript"
        className="w-full max-w-lg rounded-2xl border border-forest-700 bg-forest-900 p-7">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400"><FileUp size={14} /> Import a manuscript</p>
          <button onClick={onClose} aria-label="Close importer" className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={14} /></button>
        </div>
        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-forest-600 py-10 transition-all hover:border-gold-400">
          <FileText size={22} className="text-gold-400/70" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/55">{file ? file.name : "Drop a PDF / Word / text file"}</span>
          <span className="text-[11px] text-sand-200/35">Click to browse</span>
          <input type="file" accept=".pdf,.doc,.docx,.txt,.md" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button onClick={asIs} disabled={!file || busy}
            className="rounded-xl border border-gold-500/40 bg-gold-400/6 p-4 text-left transition-all hover:bg-gold-400/12 disabled:opacity-40">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-gold-300">Publish as-is (PDF)</p>
            <p className="mt-1.5 text-[11.5px] leading-snug text-sand-200/55">The original file, unaltered — readers view and download it exactly as received.</p>
          </button>
          <button onClick={convert} disabled={!file || busy}
            className="rounded-xl border border-kapha-500/40 bg-kapha-500/6 p-4 text-left transition-all hover:bg-kapha-500/12 disabled:opacity-40">
            <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-kapha-300">{busy && <span className="animate-spin-fast inline-block h-3 w-3 rounded-full border-2 border-kapha-300 border-t-transparent" />} Convert to editable draft</p>
            <p className="mt-1.5 text-[11.5px] leading-snug text-sand-200/55">Extract the text into the editor so you can polish, add shlokas and structure it.</p>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------ studio store tab ------------------------------ */

function StudioStoreTab() {
  const { products, saveProduct, orders, updateOrderStatus, toast } = useApp();
  const ORDER_FLOW = ["new", "processing", "shipped", "out", "delivered"] as const;
  const next = (s: string) => ORDER_FLOW[ORDER_FLOW.indexOf(s as (typeof ORDER_FLOW)[number]) + 1];
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-forest-800 bg-forest-900/70 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Recent orders</p>
        <div className="mt-3 space-y-2">
          {orders.slice(0, 6).map((o) => (
            <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-forest-800 bg-forest-850/50 px-4 py-2.5">
              <span className="font-mono text-[11px] font-semibold text-gold-300">{o.id}</span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-sand-200/70">{o.customer.name}</span>
              <span className="font-mono text-[11.5px] text-sand-100">₹{o.total.toLocaleString("en-IN")}</span>
              <span className="rounded-full border border-forest-700 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-sand-200/55">{o.status}</span>
              {o.status !== "delivered" && o.status !== "cancelled" && next(o.status) && (
                <button onClick={() => { updateOrderStatus(o.id, next(o.status)!); toast(`${o.id} → ${next(o.status)}`); }}
                  className="rounded-full border border-kapha-500/50 px-3 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-kapha-300 hover:bg-kapha-500/15">
                  → {next(o.status)}
                </button>
              )}
            </div>
          ))}
          {orders.length === 0 && <p className="rounded-lg border border-dashed border-forest-700 p-5 text-center text-[12.5px] text-sand-200/45">No orders yet.</p>}
        </div>
      </div>
      <div className="rounded-xl border border-forest-800 bg-forest-900/70 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">Shelf · stock & visibility</p>
        <div className="mt-3 space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-forest-800 bg-forest-850/50 px-4 py-2.5">
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-sand-100">{p.name}</span>
              <span className={`font-mono text-[11px] ${p.stock === 0 ? "text-sand-200/40" : p.stock < 5 ? "text-ember-300" : "text-sand-100"}`}>{p.stock} in stock</span>
              <PermSwitch on={p.visible !== false} label="" desc="" onToggle={(b) => { saveProduct({ ...p, visible: b }); toast(b ? `${p.name} visible in store` : `${p.name} hidden from store`); }} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-sand-200/40">Full product editing, invoices and analytics live in the Admin Console.</p>
      </div>
    </div>
  );
}

/* ---------------------------------- studio ----------------------------------- */

type Tab = "essays" | "blogs" | "review" | "herbs" | "store" | "profile";

export function Studio() {
  const app = useApp();
  const { allArticles, userPosts, saveDraft, publishArticle, deleteArticle, herbs, toast, logActivity, navigate, profileTabEnabled } = app;
  const [member, setMember] = useState<StudioUser | null>(() => auth.session());
  const [tab, setTab] = useState<Tab>("essays");
  const [membersOpen, setMembersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  if (!member) {
    return (
      <div className="relative flex min-h-[calc(100vh-80px)] items-center overflow-hidden pt-10">
        <div aria-hidden className="ops-grid pointer-events-none absolute inset-0 opacity-60" />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(55% 45% at 50% 0%, rgba(214,180,95,0.09), transparent 70%)" }} />
        <div className="relative w-full py-16"><LoginScreen onLogin={(u) => setMember(u)} /></div>
      </div>
    );
  }

  return <StudioDesk member={member} onSignOut={() => { auth.logout(); setMember(null); }}
    tab={tab} setTab={setTab}
    membersOpen={membersOpen} setMembersOpen={setMembersOpen}
    settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen}
    activityOpen={activityOpen} setActivityOpen={setActivityOpen}
    importOpen={importOpen} setImportOpen={setImportOpen}
    allArticles={allArticles} userPosts={userPosts} saveDraft={saveDraft} publishArticle={publishArticle}
    deleteArticle={deleteArticle} herbsCount={herbs.length} toast={toast} logActivity={logActivity}
    navigate={navigate} profileTabEnabled={profileTabEnabled} />;
}

function StudioDesk(props: {
  member: StudioUser; onSignOut: () => void;
  tab: Tab; setTab: (t: Tab) => void;
  membersOpen: boolean; setMembersOpen: (b: boolean) => void;
  settingsOpen: boolean; setSettingsOpen: (b: boolean) => void;
  activityOpen: boolean; setActivityOpen: (b: boolean) => void;
  importOpen: boolean; setImportOpen: (b: boolean) => void;
  allArticles: Article[]; userPosts: Article[];
  saveDraft: (a: Article) => void; publishArticle: (a: Article) => void; deleteArticle: (id: string) => void;
  herbsCount: number; toast: (m: string) => void;
  logActivity: (kind: "publish" | "approve" | "reject" | "member" | "store" | "edit" | "submit", action: string, target?: string) => void;
  navigate: (v: { name: "home" | "journal" | "quiz" | "herbs" | "store" | "studio" | "account" | "contact" | "console" } | { name: "article"; id: string } | { name: "product"; id: string }) => void;
  profileTabEnabled: boolean;
}) {
  const { member, onSignOut, tab, setTab } = props;
  const { allArticles, saveDraft, publishArticle, deleteArticle, toast, logActivity, navigate, profileTabEnabled, herbsCount } = props;
  const isSuper = member.role === "superadmin";
  const canConsole = isSuper || member.consoleAccess;

  /* ------------------------------ essays state ------------------------------ */
  const myArticles = useMemo(
    () => (isSuper ? allArticles : allArticles.filter((a) => a.authorId === member.id)),
    [allArticles, isSuper, member.id]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const selected = allArticles.find((a) => a.id === selectedId) ?? null;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [summary, setSummary] = useState("");
  const [kind, setKind] = useState<Kind>("blog");
  const [draftKind, setDraftKind] = useState<Kind>("blog");
  const [categoryValue, setCategoryValue] = useState<string>("dravyaguna"); // category id | "custom" | ""
  const [customCategory, setCustomCategory] = useState("");
  const [doshas, setDoshas] = useState<Dosha[]>(["vata"]);
  const [symptomsText, setSymptomsText] = useState("");
  const [cover, setCover] = useState(COVER_CHOICES[0].src);
  const [scheduleDate, setScheduleDate] = useState("");
  const [caseMeta, setCaseMeta] = useState<CaseMeta>(DEFAULT_CASE);
  const [researchMeta, setResearchMeta] = useState<ResearchMeta>(DEFAULT_RESEARCH);
  const [pdfAttachment, setPdfAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
  const [html, setHtml] = useState("");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [focus, setFocus] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [armedDelete, setArmedDelete] = useState<string | null>(null);
  const edRef = useRef<HTMLDivElement | null>(null);
  const savedRange = useRef<Range | null>(null);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      try { sel.removeAllRanges(); sel.addRange(savedRange.current); } catch { /* ignore */ }
    }
  }, []);

  const [fmt, setFmt] = useState<FmtState>({ bold: false, italic: false, underline: false, strike: false, center: false, full: false, block: "p" });
  const refreshFmt = useCallback(() => {
    const ed = edRef.current;
    if (!ed) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.anchorNode || !ed.contains(sel.anchorNode)) return;
    try {
      const raw = (document.queryCommandValue("formatBlock") || "").toLowerCase().replace(/[<>]/g, "");
      const next: FmtState = {
        bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"), strike: document.queryCommandState("strikeThrough"),
        center: document.queryCommandState("justifyCenter"), full: document.queryCommandState("justifyFull"),
        block: raw || "p",
      };
      setFmt((prev) => (prev.bold === next.bold && prev.italic === next.italic && prev.underline === next.underline &&
        prev.strike === next.strike && prev.center === next.center && prev.full === next.full && prev.block === next.block) ? prev : next);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const onSel = () => {
      const ed = edRef.current;
      const sel = window.getSelection();
      try {
        if (ed && sel && sel.rangeCount > 0 && sel.anchorNode && ed.contains(sel.anchorNode)) {
          savedRange.current = sel.getRangeAt(0).cloneRange();
        }
      } catch { /* ignore */ }
      refreshFmt();
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, [refreshFmt]);

  /* hydrate the editor whenever another article is selected */
  useEffect(() => {
    if (!selected || hydratedFor === selected.id) return;
    setTitle(selected.title);
    setSubtitle(selected.subtitle);
    setSummary(selected.summary);
    setKind(selected.kind);
    setCategoryValue(selected.customCategory?.trim() ? "custom" : selected.categoryId);
    setCustomCategory(selected.customCategory ?? "");
    setDoshas(selected.doshas);
    setSymptomsText(selected.symptoms.join(", "));
    setCover(selected.cover ?? "");
    setCaseMeta(selected.caseMeta ?? DEFAULT_CASE);
    setResearchMeta(selected.researchMeta ?? DEFAULT_RESEARCH);
    setPdfAttachment(selected.pdfUrl ? { name: selected.pdfName ?? "Original document.pdf", dataUrl: selected.pdfUrl } : null);
    const body = selected.html?.trim() ? selected.html : articleHtml(selected);
    setHtml(body);
    if (edRef.current) { edRef.current.innerHTML = body; edRef.current.dataset.aid = selected.id; }
    setHydratedFor(selected.id);
  }, [selected, hydratedFor]);

  const selectPost = (id: string) => { setSelectedId(id); setTab("essays"); setMode("write"); };

  const words = useMemo(() => html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length, [html]);
  const readMin = Math.max(1, Math.round(words / 210));

  const toc = useMemo(() => {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return Array.from(doc.querySelectorAll("h2, h3"))
        .map((n) => ({ level: (n.tagName === "H2" ? 2 : 3) as 2 | 3, text: n.textContent ?? "" }))
        .filter((t) => t.text.trim());
    } catch { return []; }
  }, [html]);
  const [activeHeading, setActiveHeading] = useState(-1);

  const sync = () => setHtml(edRef.current?.innerHTML ?? "");
  const trackHeading = () => { /* lightweight: refresh TOC + formatting on input */ sync(); refreshFmt(); };

  const jumpToHeading = (i: number) => {
    const nodes = edRef.current?.querySelectorAll("h2, h3");
    nodes?.[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveHeading(i);
  };

  const insertShloka = () => {
    const ed = edRef.current;
    if (!ed) return;
    ed.focus(); restoreSelection();
    try {
      document.execCommand("insertHTML", false,
        `<blockquote class="shloka"><p class="sa">॥ संस्कृत श्लोकः ॥</p><p class="tr">Translation of the verse…</p><cite>Charaka Samhita</cite></blockquote><p></p>`);
    } catch { /* ignore */ }
    sync();
  };

  const buildArticle = (status: Article["status"]): Article => ({
    ...(selected ?? {}),
    id: selected?.id ?? `user-${Date.now()}`,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled",
    title, subtitle, summary,
    cover: cover || COVER_CHOICES[0].src,
    categoryId: categoryValue === "custom" ? (selected?.categoryId || "chikitsa") : (categoryValue || "chikitsa"),
    customCategory: categoryValue === "custom" ? customCategory.trim() : undefined,
    doshas, symptoms: symptomsText.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
    kind, authorId: member.id,
    date: status === "scheduled" && scheduleDate ? scheduleDate : (selected?.date ?? new Date().toISOString().slice(0, 10)),
    views: selected?.views ?? 0,
    blocks: [], html, status,
    pdfUrl: pdfAttachment?.dataUrl ?? selected?.pdfUrl,
    pdfName: pdfAttachment?.name ?? selected?.pdfName,
    caseMeta: kind === "case" ? caseMeta : undefined,
    researchMeta: kind === "research" ? researchMeta : undefined,
  });

  const newDraft = () => {
    const a: Article = {
      id: `user-${Date.now()}`, slug: "new-draft", title: "", subtitle: "", summary: "",
      cover: COVER_CHOICES[0].src, categoryId: "dravyaguna", doshas: ["vata"], authorId: member.id,
      date: new Date().toISOString().slice(0, 10), views: 0, symptoms: [], kind: draftKind,
      blocks: [], html: "", status: "draft",
    };
    saveDraft(a);
    setHydratedFor(null);
    setSelectedId(a.id);
    setTab("essays");
    toast(draftKind === "blog" ? "Fresh draft opened" : draftKind === "case" ? "Case paper opened" : "Research review opened");
  };

  const onSave = () => {
    if (!selected) { newDraft(); return; }
    saveDraft(buildArticle(selected.status === "published" ? "published" : "draft"));
    logActivity("edit", `saved "${title || "Untitled"}"`);
    toast("Saved");
  };

  const onSchedule = () => {
    if (!scheduleDate) { toast("Pick a date first"); return; }
    saveDraft(buildArticle("scheduled"));
    logActivity("publish", `scheduled "${title || "Untitled"}" for ${scheduleDate}`);
    toast(`Scheduled for ${scheduleDate}`);
  };

  const onPublish = () => {
    if (!title.trim()) { toast("Give the publication a title first"); return; }
    const direct = isSuper || member.canPublishDirect;
    const a = buildArticle(direct ? "published" : "review");
    saveDraft(a);
    if (direct) {
      publishArticle(a);
      setMode("preview");
      logActivity("publish", `published "${a.title}"`, a.title);
      toast(`${KIND_META[kind].label} published — it is live`);
    } else {
      logActivity("submit", `submitted "${a.title}" for review`, a.title);
      toast("Submitted — a superadmin will review it before it goes live");
    }
  };

  const onDelete = (id: string) => {
    const target = allArticles.find((a) => a.id === id);
    if (target && target.status === "published" && !isSuper && !member.canDeletePublished) {
      toast("Deleting published posts is disabled for your account");
      return;
    }
    deleteArticle(id);
    if (selectedId === id) { setSelectedId(null); setHydratedFor(null); setTitle(""); setSubtitle(""); setSummary(""); setHtml(""); if (edRef.current) edRef.current.innerHTML = ""; }
    setArmedDelete(null);
    logActivity("edit", `deleted "${target?.title ?? "an article"}"`);
    toast("Article deleted");
  };

  const reviewQueue = allArticles.filter((a) => a.status === "review");
  const locked = !!selected && selected.status === "published" && !isSuper && !member.canEditPublished;

  const tabDefs: { key: Tab; label: string }[] = [
    { key: "essays", label: "Blogging space" },
    { key: "blogs", label: "My Blogs" },
    ...(isSuper ? [{ key: "review" as Tab, label: `Needs Review${reviewQueue.length ? ` (${reviewQueue.length})` : ""}` }] : []),
    ...(member.herbAccess ? [{ key: "herbs" as Tab, label: "Herb Index" }] : []),
    ...(isSuper || member.storeAccess ? [{ key: "store" as Tab, label: "Store" }] : []),
    ...(profileTabEnabled ? [{ key: "profile" as Tab, label: "My Profile" }] : []),
  ];

  return (
    <div className="relative min-h-screen pt-24 sm:pt-28">
      <div aria-hidden className="ops-grid pointer-events-none fixed inset-0 opacity-40" />
      {/* header */}
      <div className="relative mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-5 lg:px-8">
        <div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-gold-400">Doctor Studio</p>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-none text-sand-100">Namaste, {member.name.split(" ")[0]}</h1>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          {isSuper && (
            <>
              <button onClick={() => props.setActivityOpen(true)} className="grid h-11 w-11 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-all hover:border-gold-400 hover:text-gold-300" aria-label="Activity log" title="Activity log"><ActivityIcon size={16} /></button>
              <button onClick={() => props.setSettingsOpen(true)} className="grid h-11 w-11 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-all hover:rotate-45 hover:border-gold-400 hover:text-gold-300" aria-label="Settings" title="Master switches (superadmin only)"><SettingsIcon size={16} /></button>
              <button onClick={() => props.setMembersOpen(true)} className="flex items-center gap-2 rounded-full border border-gold-500/60 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold-300 transition-all hover:bg-gold-400 hover:text-forest-950"><ShieldCheck size={15} /> Members</button>
            </>
          )}
          {canConsole && (
            <button onClick={() => navigate({ name: "console" })} className="gold-sheen flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-gold-300">
              <Sparkles size={15} /> Admin Console
            </button>
          )}
          <button onClick={onSignOut} className="flex items-center gap-2 rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200/60 transition-all hover:border-ember-400 hover:text-ember-300"><LogOut size={14} /> Sign out</button>
        </div>
      </div>

      {/* tabs */}
      <div className="relative mx-auto mt-8 max-w-[1500px] px-5 lg:px-8">
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-forest-800 pb-px">
          {tabDefs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-t-xl border border-b-0 px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-all ${tab === t.key ? "border-gold-500/50 bg-forest-900 text-gold-300" : "border-forest-800 bg-forest-900/40 text-sand-200/50 hover:text-sand-100"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
        {/* ------------------------------- essays ------------------------------- */}
        {tab === "essays" && (
          <div className={`grid gap-6 ${focus ? "" : "lg:grid-cols-[280px_1fr_300px]"}`}>
            {/* settings rail — right side */}
            <aside className={`max-h-[46vh] space-y-4 overflow-y-auto rounded-xl border border-forest-800 bg-forest-900/70 p-5 lg:col-start-3 lg:row-start-1 lg:max-h-[calc(100vh-215px)] ${focus ? "hidden" : ""} order-3 lg:order-none`}>
              <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400"><SettingsIcon size={13} /> Article settings</p>
              <div>
                <label className={lbl}>Content type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["blog", "case", "research"] as Kind[]).map((k) => (
                    <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k}
                      className={`rounded-lg border py-2 font-mono text-[8.5px] uppercase tracking-[0.1em] transition-all ${kind === k ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/50 hover:text-sand-100"}`}>
                      {KIND_META[k].label}
                    </button>
                  ))}
                </div>
              </div>
              {kind === "case" && (
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-ember-500/30 bg-ember-500/5 p-3">
                  {([["age", "Age"], ["sex", "Sex"], ["prakriti", "Prakriti"], ["duration", "Duration"], ["presenting", "Presenting complaint"]] as [keyof CaseMeta, string][]).map(([k, label]) => (
                    <div key={k} className={k === "presenting" ? "col-span-2" : ""}>
                      <label className="mb-1 block font-mono text-[7.5px] uppercase tracking-[0.14em] text-sand-200/40">{label}</label>
                      <input value={caseMeta[k]} onChange={(e) => setCaseMeta({ ...caseMeta, [k]: e.target.value })} placeholder={k === "presenting" ? "e.g. chronic insomnia, 6 months" : ""}
                        className="w-full rounded-md border border-forest-700 bg-forest-950/60 px-2.5 py-2 text-[12px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
                    </div>
                  ))}
                </div>
              )}
              {kind === "research" && (
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-steel-400/30 bg-steel-400/5 p-3">
                  {([["question", "Research question"], ["design", "Design"], ["n", "N"], ["grade", "Evidence grade"], ["finding", "Key finding"]] as [keyof ResearchMeta, string][]).map(([k, label]) => (
                    <div key={k} className={k === "question" || k === "finding" ? "col-span-2" : ""}>
                      <label className="mb-1 block font-mono text-[7.5px] uppercase tracking-[0.14em] text-sand-200/40">{label}</label>
                      <input value={researchMeta[k]} onChange={(e) => setResearchMeta({ ...researchMeta, [k]: e.target.value })} placeholder={k === "question" ? "e.g. Does Brahmi improve working memory?" : k === "design" ? "e.g. RCT, double-blind" : ""}
                        className="w-full rounded-md border border-forest-700 bg-forest-950/60 px-2.5 py-2 text-[12px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
                    </div>
                  ))}
                </div>
              )}
              <div><label className={lbl}>Summary</label><textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="One or two sentences for cards & search…" className={inp} /></div>

              {/* CATEGORY — with custom option */}
              <div>
                <label className={lbl}>Category</label>
                <select value={categoryValue} onChange={(e) => setCategoryValue(e.target.value)} className={inp}>
                  <option value="">No category</option>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.sanskrit} · {c.name}</option>)}
                  <option value="custom">✎ Custom category…</option>
                </select>
                {categoryValue === "custom" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                    <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Type your own category — e.g. Sleep Science" autoFocus
                      className="mt-2 w-full rounded-lg border border-gold-500/50 bg-gold-400/5 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
                    <p className="mt-1.5 text-[10.5px] leading-snug text-sand-200/40">Shown on the article card and reader — exactly as you type it.</p>
                  </motion.div>
                )}
                {categoryValue !== "custom" && categoryValue !== "" && (
                  <p className="mt-1.5 text-[10.5px] text-sand-200/40">Filed under “{categoryName({ categoryId: categoryValue })}”.</p>
                )}
              </div>

              <div>
                <label className={lbl}>Target doshas</label>
                <div className="flex gap-1.5">
                  {(["vata", "pitta", "kapha"] as Dosha[]).map((d) => (
                    <button key={d} onClick={() => setDoshas(doshas.includes(d) ? doshas.filter((x) => x !== d) : [...doshas, d])} aria-pressed={doshas.includes(d)}
                      className="flex-1 rounded-lg border py-2 font-mono text-[9px] uppercase tracking-[0.1em] transition-all"
                      style={doshas.includes(d) ? { borderColor: DOSHA_META[d].color, color: DOSHA_META[d].color, background: `${DOSHA_META[d].color}14` } : { borderColor: "var(--color-forest-700)", color: "rgba(231,220,191,0.5)" }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className={lbl}>Symptom tags (comma-separated)</label><input value={symptomsText} onChange={(e) => setSymptomsText(e.target.value)} placeholder="anxiety, sleep, digestion" className={inp} /></div>
              <div>
                <label className={lbl}>Cover</label>
                <div className="grid grid-cols-3 gap-2">
                  {COVER_CHOICES.map((c) => (
                    <button key={c.src} onClick={() => setCover(c.src)} aria-pressed={cover === c.src} aria-label={`Cover ${c.label}`}
                      className={`overflow-hidden rounded-lg border-2 transition-all ${cover === c.src ? "border-gold-400 shadow-[0_0_14px_rgba(214,180,95,0.35)]" : "border-forest-700 opacity-70 hover:opacity-100"}`}>
                      <SmartImg src={c.src} alt={c.label} className="h-12 w-full object-cover duotone" />
                    </button>
                  ))}
                </div>
                <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-forest-600 px-3.5 py-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">
                  <FileUp size={12} /> Upload cover (or publish without one)
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readImageFile(f, (u) => { setCover(u); toast("Cover attached"); }, (m) => toast(m)); e.target.value = ""; }} />
                </label>
              </div>
              <div>
                <label className={lbl}>Attach original PDF (optional)</label>
                {pdfAttachment ? (
                  <div className="flex items-center gap-2 rounded-lg border border-forest-700 bg-forest-950/50 px-3 py-2">
                    <FileText size={13} className="text-ember-300" />
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-sand-200/70">{pdfAttachment.name}</span>
                    <button onClick={() => setPdfAttachment(null)} aria-label="Remove PDF" className="text-sand-200/40 hover:text-ember-300"><X size={13} /></button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-forest-600 px-3.5 py-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">
                    <FileUp size={12} /> Attach PDF — published as-is
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = () => { setPdfAttachment({ name: f.name, dataUrl: String(r.result) }); toast("PDF attached"); };
                      r.readAsDataURL(f);
                      e.target.value = "";
                    }} />
                  </label>
                )}
              </div>
              <div>
                <label className={lbl}>Schedule release</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className={inp} />
                  <button onClick={onSchedule} disabled={!selected} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-steel-400/50 px-3 py-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-steel-300 hover:bg-steel-400/10 disabled:opacity-40"><CalendarDays size={13} /> Set</button>
                </div>
              </div>
            </aside>

            {/* article list — left side */}
            <aside className={`flex max-h-[44vh] flex-col rounded-xl border border-forest-800 bg-forest-900/70 lg:col-start-1 lg:row-start-1 lg:min-h-0 lg:max-h-[calc(100vh-215px)] ${focus ? "hidden" : ""} order-1 lg:order-none`}>
              <div className="flex items-center justify-between gap-2 border-b border-forest-800 px-4 py-3.5">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">Your articles</p>
                <button onClick={() => props.setImportOpen(true)} title="Import PDF / Word" aria-label="Import manuscript" className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><FileUp size={13} /></button>
              </div>
              <div className="px-4 py-3">
                <label className={lbl}>New draft type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["blog", "case", "research"] as Kind[]).map((k) => (
                    <button key={k} onClick={() => setDraftKind(k)} aria-pressed={draftKind === k}
                      className={`rounded-lg border py-2 font-mono text-[8.5px] uppercase tracking-[0.08em] transition-all ${draftKind === k ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/50 hover:text-sand-100"}`}>
                      {KIND_META[k].label}
                    </button>
                  ))}
                </div>
                <button onClick={newDraft} className="gold-sheen mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Plus size={13} /> New {KIND_META[draftKind].label}</button>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
                {myArticles.length === 0 && <p className="rounded-lg border border-dashed border-forest-700 p-4 text-center text-[12px] text-sand-200/45">No articles yet — start a fresh draft.</p>}
                {myArticles.map((a) => (
                  <div key={a.id} className={`group relative cursor-pointer rounded-xl border p-3.5 transition-all ${selectedId === a.id ? "border-gold-500/60 bg-gold-400/8" : "border-forest-800 bg-forest-850/50 hover:border-forest-600"}`} onClick={() => selectPost(a.id)}>
                    {(isSuper || a.authorId === member.id || a.status !== "published" || member.canDeletePublished) && (
                      armedDelete === a.id ? (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(a.id); }} title="Click again to confirm" aria-label={`Confirm delete ${a.title || "untitled article"}`}
                          className="absolute right-2 top-2 z-10 flex h-8 items-center gap-1 rounded-lg bg-ember-400 px-2 font-mono text-[8.5px] font-bold uppercase tracking-[0.08em] text-forest-950 shadow-[0_4px_16px_rgba(201,100,48,0.45)]"><Trash2 size={12} /> Sure?</button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); setArmedDelete(a.id); window.setTimeout(() => setArmedDelete((x) => (x === a.id ? null : x)), 3000); }} aria-label={`Delete ${a.title || "untitled article"}`} title="Delete article"
                          className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-lg border border-forest-700/70 bg-forest-950/70 text-sand-200/70 backdrop-blur-sm transition-all hover:scale-105 hover:border-ember-400 hover:bg-ember-500/20 hover:text-ember-300"><Trash2 size={14} /></button>
                      )
                    )}
                    <p className="pr-9 text-[13px] font-semibold leading-snug text-sand-100">{a.title || "Untitled"}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-forest-700 px-2 py-0.5 font-mono text-[7.5px] uppercase tracking-[0.1em] text-sand-200/50">{KIND_META[a.kind].label}</span>
                      <span className={`rounded-full px-2 py-0.5 font-mono text-[7.5px] uppercase tracking-[0.1em] ${a.status === "published" ? "bg-kapha-500/15 text-kapha-300" : a.status === "review" ? "bg-ember-500/15 text-ember-300" : a.status === "scheduled" ? "bg-steel-400/15 text-steel-300" : "bg-forest-800 text-sand-200/50"}`}>{a.status}</span>
                      <span className="font-mono text-[8px] text-sand-200/35">{formatDate(a.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* editor — center */}
            <div className="relative flex max-h-[calc(100vh-190px)] min-h-[540px] flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-900/80 lg:col-start-2 lg:row-start-1 order-2 lg:order-none">
              <EditorToolbar edRef={edRef} sync={sync} fmt={fmt} refreshFmt={refreshFmt} restoreSelection={restoreSelection}
                words={words} readMin={readMin} mode={mode} setMode={setMode} device={device} setDevice={setDevice}
                focus={focus} onToggleFocus={() => setFocus(!focus)} outlineOpen={outlineOpen} onToggleOutline={() => setOutlineOpen(!outlineOpen)}
                tocCount={toc.length} onOpenImage={() => setImgOpen(true)} onOpenVideo={() => setVideoOpen(true)} insertShloka={insertShloka} />
              <div className="min-h-0 flex-1 overflow-y-auto">
                {mode === "write" ? (
                  <div className={`mx-auto px-6 py-8 ${focus ? "max-w-3xl" : "max-w-4xl"}`}>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled essay…" disabled={locked}
                      className="w-full bg-transparent font-display text-3xl font-semibold text-sand-100 placeholder:text-sand-200/20 focus:outline-none sm:text-4xl" />
                    <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="A one-line subtitle…" disabled={locked}
                      className="mt-2 w-full bg-transparent font-display text-lg italic text-sand-200/60 placeholder:text-sand-200/20 focus:outline-none" />
                    <div className="gold-rule my-5" />
                    <div ref={(node) => {
                      edRef.current = node;
                      if (node && selected && node.dataset.aid !== selected.id) {
                        const body = selected.html?.trim() ? selected.html : articleHtml(selected);
                        node.innerHTML = body;
                        node.dataset.aid = selected.id;
                      }
                    }}
                      contentEditable={!locked} suppressContentEditableWarning data-placeholder="Begin writing… use the toolbar for headings, shlokas, lists, images and video."
                      onInput={trackHeading} className={`editor-surface min-h-[340px] text-[15.5px] leading-[1.9] text-sand-200/90 ${locked ? "opacity-60" : ""}`} />
                    {locked && <p className="mt-4 flex items-center gap-2 rounded-lg border border-gold-500/40 bg-gold-400/6 px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-300"><Lock size={13} /> Live article — editing locked for your role</p>}
                  </div>
                ) : (
                  <div className="flex justify-center px-4 py-6">
                    <div className={`rounded-2xl border border-forest-800 bg-forest-950/60 p-8 transition-all ${device === "mobile" ? "w-[380px]" : "w-full max-w-3xl"}`}>
                      <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-sand-200/35">Live preview · {device}</p>
                      <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-sand-100">{title || "Untitled"}</h2>
                      {subtitle && <p className="mt-2 font-display text-lg italic text-sand-200/60">{subtitle}</p>}
                      {summary && <p className="mt-4 border-l-2 border-forest-700 pl-4 text-[15px] italic leading-relaxed text-sand-200/70">{summary}</p>}
                      <div className="article-prose dropcap mt-6 text-sand-200/85" dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
                  </div>
                )}
              </div>
              {/* action bar */}
              <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-t border-forest-800 bg-forest-850/80 px-4 py-3.5">
                <button onClick={onSave} disabled={locked} className="flex items-center gap-2 rounded-full border border-forest-600 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200 transition-all hover:border-gold-400 hover:text-gold-300 disabled:cursor-not-allowed disabled:opacity-40"><Download size={14} /> {selected?.status === "published" ? "Save changes" : "Save draft"}</button>
                {!locked && selected?.status !== "review" && (
                  <button onClick={onSchedule} className="flex items-center gap-2 rounded-full border border-steel-400/50 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-steel-300 transition-all hover:bg-steel-400/10"><CalendarDays size={14} /> Schedule</button>
                )}
                {selected?.status === "review" ? (
                  isSuper ? (
                    <>
                      <button onClick={() => { if (!selected) return; const a = { ...selected, status: "published" as const }; saveDraft(a); publishArticle(a); logActivity("approve", `approved & published "${a.title}"`, a.title); setMode("preview"); toast(`"${a.title}" is now live`); }}
                        className="ml-auto flex items-center gap-2 rounded-full bg-kapha-500 px-6 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:brightness-110"><Check size={14} /> Approve & publish</button>
                      <button onClick={() => { if (!selected) return; saveDraft({ ...selected, status: "draft" }); logActivity("reject", `sent "${selected.title}" back to drafts`, selected.title); toast("Returned to the author's drafts"); }}
                        className="flex items-center gap-2 rounded-full border border-ember-500/50 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ember-300 hover:bg-ember-500/10"><X size={13} /> Send back</button>
                    </>
                  ) : (
                    <>
                      <span className="ml-auto flex items-center gap-2 rounded-full border border-ember-500/40 bg-ember-500/10 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ember-300"><Clock size={13} /> Awaiting superadmin review</span>
                      <button onClick={() => { if (!selected) return; saveDraft({ ...selected, status: "draft" }); toast("Moved back to your drafts"); }} className="flex items-center gap-2 rounded-full border border-forest-600 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200 hover:border-gold-400 hover:text-gold-300"><ChevronRight size={13} className="rotate-180" /> Withdraw</button>
                    </>
                  )
                ) : isSuper || member.canPublishDirect ? (
                  <button onClick={onPublish} className="ml-auto flex items-center gap-2 rounded-full bg-kapha-500 px-6 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:brightness-110 active:scale-95"><Send size={14} /> {selected?.status === "published" ? "Update live" : "One-click publish"}</button>
                ) : (
                  <button onClick={onPublish} className="ml-auto flex items-center gap-2 rounded-full bg-ember-400 px-6 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-ember-300 active:scale-95"><Send size={14} /> Submit for review</button>
                )}
                {selected?.status === "published" && (
                  <button onClick={() => navigate({ name: "article", id: selected.id })} className="flex items-center gap-2 rounded-full border border-kapha-500/50 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-kapha-300 transition-all hover:bg-kapha-500/15"><Eye size={14} /> View live</button>
                )}
              </div>
              <OutlineDrawer toc={toc} active={activeHeading} open={outlineOpen} onClose={() => setOutlineOpen(false)} onJump={jumpToHeading} />
            </div>
          </div>
        )}

        {/* -------------------------------- my blogs -------------------------------- */}
        {tab === "blogs" && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {myArticles.map((a) => (
              <div key={a.id} className="group relative overflow-hidden rounded-xl border border-forest-800 bg-forest-900/70 transition-all hover:-translate-y-0.5 hover:border-gold-500/40">
                <button onClick={() => selectPost(a.id)} className="block w-full text-left" aria-label={`Edit ${a.title || "untitled"}`}>
                  <SmartImg src={a.cover} alt="" className="h-32 w-full object-cover duotone" />
                  <div className="p-4">
                    <p className="truncate text-[14px] font-semibold text-sand-100">{a.title || "Untitled"}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 font-mono text-[7.5px] uppercase tracking-[0.1em] ${a.status === "published" ? "bg-kapha-500/15 text-kapha-300" : a.status === "review" ? "bg-ember-500/15 text-ember-300" : "bg-forest-800 text-sand-200/50"}`}>{a.status}</span>
                      <span className="rounded-full border border-forest-700 px-2 py-0.5 font-mono text-[7.5px] uppercase tracking-[0.1em] text-sand-200/50">{categoryName(a)}</span>
                      <span className="font-mono text-[8px] text-sand-200/35">{formatDate(a.date)}</span>
                    </div>
                  </div>
                </button>
                <div className="flex items-center justify-between border-t border-forest-800 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <PermSwitch compact on={a.status === "published"} label="" desc="" onToggle={(b) => {
                      if (b) { publishArticle({ ...a, status: "published" }); logActivity("publish", `published "${a.title}"`, a.title); toast("Live on the journal"); }
                      else { saveDraft({ ...a, status: "draft" }); toast("Hidden from the journal"); }
                    }} />
                    <span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${a.status === "published" ? "text-kapha-300" : "text-sand-200/40"}`}>
                      {a.status === "published" ? "Live" : "Hidden"}
                    </span>
                  </div>
                  {armedDelete === a.id ? (
                    <button onClick={() => onDelete(a.id)} title="Click again to confirm" aria-label={`Confirm delete ${a.title || "untitled"}`}
                      className="animate-rise flex h-8 items-center gap-1 rounded-md bg-ember-400 px-2.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.08em] text-forest-950 shadow-[0_4px_14px_rgba(201,100,48,0.45)]"><Trash2 size={12} /> Sure?</button>
                  ) : (
                    <button onClick={() => { setArmedDelete(a.id); window.setTimeout(() => setArmedDelete((x) => (x === a.id ? null : x)), 3000); }} aria-label={`Delete ${a.title || "untitled"}`}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-forest-700 text-sand-200/50 hover:border-ember-400 hover:text-ember-300"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            ))}
            {myArticles.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-10 text-center text-[13px] text-sand-200/45 sm:col-span-2 xl:col-span-3">Nothing on the desk yet.</p>}
          </div>
        )}

        {/* ------------------------------- needs review ------------------------------- */}
        {tab === "review" && isSuper && (
          <div className="space-y-3">
            {reviewQueue.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-10 text-center text-[13px] text-sand-200/45">The review queue is clear.</p>}
            {reviewQueue.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-ember-500/35 bg-ember-500/5 p-4">
                <SmartImg src={a.cover} alt="" className="h-14 w-20 rounded-lg border border-forest-800 object-cover duotone" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-sand-100">{a.title}</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/40">{KIND_META[a.kind].label} · {categoryName(a)} · submitted {formatDate(a.date)}</p>
                </div>
                <button onClick={() => selectPost(a.id)} className="rounded-full border border-forest-700 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/65 hover:border-gold-400 hover:text-gold-300">Read</button>
                <button onClick={() => { const b = { ...a, status: "published" as const }; saveDraft(b); publishArticle(b); logActivity("approve", `approved & published "${a.title}"`, a.title); toast(`"${a.title}" is now live`); }}
                  className="rounded-full bg-kapha-500 px-4 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-forest-950 hover:brightness-110">Approve</button>
                <button onClick={() => { saveDraft({ ...a, status: "draft" }); logActivity("reject", `sent "${a.title}" back to drafts`, a.title); toast("Sent back to drafts"); }}
                  className="rounded-full border border-ember-500/50 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ember-300 hover:bg-ember-500/10">Send back</button>
              </div>
            ))}
          </div>
        )}

        {tab === "herbs" && member.herbAccess && <HerbManager />}
        {tab === "store" && (isSuper || member.storeAccess) && <StudioStoreTab />}
        {tab === "profile" && profileTabEnabled && <DoctorProfileTab member={member} />}
      </div>

      <AnimatePresence>
        {props.membersOpen && isSuper && <MembersModal onClose={() => props.setMembersOpen(false)} />}
        {props.settingsOpen && <SettingsModal onClose={() => props.setSettingsOpen(false)} />}
        {props.activityOpen && <ActivityModal onClose={() => props.setActivityOpen(false)} />}
        {imgOpen && <ImageInsertModal onInsert={(h) => { edRef.current?.focus(); restoreSelection(); try { document.execCommand("insertHTML", false, h); } catch { /* ignore */ } sync(); }} onClose={() => setImgOpen(false)} />}
        {videoOpen && <VideoInsertModal onInsert={(h) => { edRef.current?.focus(); restoreSelection(); try { document.execCommand("insertHTML", false, h); } catch { /* ignore */ } sync(); }} onClose={() => setVideoOpen(false)} />}
        {props.importOpen && (
          <ImportModal onClose={() => props.setImportOpen(false)}
            onCreateAsIs={(f) => {
              const a: Article = {
                id: `user-${Date.now()}`, slug: f.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), title: f.title,
                subtitle: "Published as-is — the original, unedited document",
                summary: `${f.name} — shared exactly as received. Nothing was altered.`,
                cover: COVER_CHOICES[0].src, categoryId: "chikitsa", doshas: [], authorId: member.id,
                date: new Date().toISOString().slice(0, 10), views: 0, symptoms: [], kind: "blog",
                blocks: [], html: `<p><em>This document is published exactly as received — read the original below or download it.</em></p>`,
                pdfUrl: f.dataUrl, pdfName: f.name, status: "draft",
              };
              saveDraft(a);
              setHydratedFor(null);
              setSelectedId(a.id);
              props.setImportOpen(false);
              setTab("essays");
              toast("PDF attached as-is — publish when ready");
            }}
            onConverted={(body, t) => {
              const a: Article = {
                id: `user-${Date.now()}`, slug: t.toLowerCase().replace(/[^a-z0-9]+/g, "-"), title: t,
                subtitle: "Imported manuscript", summary: body.replace(/<[^>]*>/g, " ").trim().slice(0, 180),
                cover: COVER_CHOICES[1].src, categoryId: "chikitsa", doshas: [], authorId: member.id,
                date: new Date().toISOString().slice(0, 10), views: 0, symptoms: [], kind: "blog",
                blocks: [], html: body, status: "draft",
              };
              saveDraft(a);
              setHydratedFor(null);
              setSelectedId(a.id);
              props.setImportOpen(false);
              setTab("essays");
              toast("Converted — review and polish the draft");
            }} />
        )}
      </AnimatePresence>
      <span className="hidden">{herbsCount}</span>
    </div>
  );
}
