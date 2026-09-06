import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  PenLine, Eye, Plus, Trash2, Send, BookOpen, Download, Lock, Users, Key, Check,
  X, List, Image as ImageIcon, Bold, Italic, Underline, Strikethrough,
  LayoutGrid, ShoppingCart, Shield, Settings as SettingsIcon, User as UserIcon, Leaf,
  ListTree, Youtube, Maximize2, Minimize2, FileUp, CalendarDays,
} from "lucide-react";
import { useApp, auth, readImageFile, SmartImg, Monogram, type StudioUser, type StudioPerms } from "./lib";
import { CATEGORIES, IMG, KIND_META, articleHtml, authorFor, formatDate, type Article, type Kind } from "./data";
import { DoctorProfileTab, blankProfile, profileFor } from "./doctor-profile";
import { HerbManager } from "./herbs-admin";

/* -------------------------------- login screen ------------------------------ */

function LoginScreen({ onLogin }: { onLogin: (u: StudioUser) => void }) {
  const { toast } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-20">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
        <div className="rounded-2xl border border-forest-700 bg-forest-900/80 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-gold-500/60 bg-gold-400/10 text-gold-300"><Lock size={20} /></span>
            <div>
              <p className="font-display text-2xl font-semibold text-sand-100">Doctor Studio</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-gold-400/80">Publishing desk · members only</p>
            </div>
          </div>
          <p className="mt-5 text-[13px] leading-relaxed text-sand-200/55">This console is reserved for Vaidyagan's publishing team. Sign in to draft essays, case papers and research reviews, schedule releases and push them live to the journal.</p>
          <form onSubmit={submit} className="mt-6 space-y-3.5">
            <div>
              <label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Username</label>
              <input value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} placeholder="e.g. monesh" autoComplete="username"
                className="w-full rounded-xl border border-forest-700 bg-forest-950/70 px-4 py-3 text-[15px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Password</label>
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="••••••••" autoComplete="current-password"
                className="w-full rounded-xl border border-forest-700 bg-forest-950/70 px-4 py-3 text-[15px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
            </div>
            {error && <p className="rounded-lg border border-ember-500/40 bg-ember-500/10 px-4 py-2.5 text-[12.5px] text-ember-300">{error}</p>}
            <button type="submit" className="gold-sheen w-full rounded-xl bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-forest-950 transition-all hover:bg-gold-300 active:scale-[0.98]">Enter the desk</button>
          </form>
          <p className="mt-5 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/35">Superadmin demo — monesh / admin91466</p>
        </div>
      </motion.div>
    </div>
  );
}

/* --------------------------------- members ---------------------------------- */

/** iPhone-style permission switch used in the member profile panel. */
function PermSwitch({ on, onToggle, label, desc, disabled }: { on: boolean; onToggle: (b: boolean) => void; label: string; desc: string; disabled?: boolean }) {
  return (
    <button
      role="switch" aria-checked={on} disabled={disabled}
      onClick={() => onToggle(!on)}
      className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all duration-300 ${disabled ? "cursor-not-allowed opacity-50" : ""} ${
        on ? "border-kapha-500/50 bg-kapha-500/8" : "border-forest-700 bg-forest-950/40 hover:border-forest-600"
      }`}
    >
      <span className="min-w-0">
        <span className={`block text-[12.5px] font-semibold ${on ? "text-sand-100" : "text-sand-200/70"}`}>{label}</span>
        <span className="mt-0.5 block text-[10.5px] leading-snug text-sand-200/45">{desc}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-kapha-500" : "bg-forest-700"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-sand-100 shadow transition-all duration-300 ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function MembersModal({ onClose }: { onClose: () => void }) {
  const { toast, logActivity } = useApp();
  const [, force] = useState(0);
  const refresh = () => force((x) => x + 1);
  const users = auth.list();
  const [form, setForm] = useState({ name: "", username: "", password: "", specialty: "" });
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPass, setNewPass] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [openPerms, setOpenPerms] = useState<string | null>(null);

  /** Grant / revoke one permission for a member (superadmin control). */
  const setPerm = (u: StudioUser, key: keyof StudioPerms, value: boolean, label: string) => {
    auth.setPerms(u.id, { [key]: value } as Partial<StudioPerms>);
    logActivity("member", `${value ? "granted" : "revoked"} "${label}" for ${u.name}`);
    toast(`${u.name} — ${label} ${value ? "granted" : "revoked"}`);
    refresh();
  };

  const add = () => {
    if (!form.name.trim() || !form.username.trim() || form.password.length < 4) { toast("Name, username and a 4+ character password are required"); return; }
    const res = auth.addMember({ name: form.name.trim(), username: form.username, password: form.password, specialty: form.specialty.trim() || "Ayurvedic medicine", role: "doctor" });
    if (!res.ok) { toast(res.error ?? "Could not add member"); return; }
    logActivity("member", `added ${res.user!.name} to the desk`);
    setForm({ name: "", username: "", password: "", specialty: "" });
    toast(`${res.user!.name} can now sign in`);
    refresh();
  };

  const inp = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[66] flex items-end justify-center bg-forest-950/85 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 320 }} onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-forest-700 bg-forest-900 p-6 sm:rounded-2xl sm:p-7" role="dialog" aria-label="Members of the desk">
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
            <div key={u.id} className={`rounded-xl border p-4 transition-colors ${isRoot ? "border-gold-500/40 bg-gold-400/5" : "border-forest-800 bg-forest-850/50"}`}>
            <div className="flex flex-wrap items-center gap-3">
              <Monogram author={{ initials: u.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase(), hue: u.hue }} size={40} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sand-100">
                  {u.name}
                  {u.id === "root" && <span className="rounded-full bg-gold-400/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-gold-300">Superadmin</span>}
                  {!u.active && <span className="rounded-full bg-forest-800 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-sand-200/50">Suspended</span>}
                </p>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/40">@{u.username} · {u.specialty}</p>
              </div>
              <div className="flex items-center gap-2">
                {resetFor === u.id ? (
                  <div className="flex items-center gap-1.5">
                    <input value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New password" className="w-32 rounded-lg border border-forest-700 bg-forest-950/70 px-2.5 py-1.5 font-mono text-[11px] text-sand-100 focus:border-gold-400 focus:outline-none" autoFocus />
                    <button onClick={() => { if (auth.resetPassword(u.id, newPass)) { toast(`Password reset for ${u.name}`); setResetFor(null); setNewPass(""); refresh(); } else toast("Password needs 4+ characters"); }} className="rounded-full bg-gold-400 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase text-forest-950">Set</button>
                    <button onClick={() => setResetFor(null)} className="text-sand-200/40 hover:text-sand-100"><X size={13} /></button>
                  </div>
                ) : (
                  <button onClick={() => { setResetFor(u.id); setNewPass(""); }} title="Reset password" aria-label={`Reset password for ${u.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Key size={13} /></button>
                )}
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
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-gold-500/35 bg-gold-400/5 p-5">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-300">Add a doctor to the desk</p>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className={inp} />
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username (for login)" className={inp} />
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Temporary password" className={inp} />
            <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Specialty" className={inp} />
          </div>
          <button onClick={add} className="gold-sheen mt-3.5 flex items-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Plus size={14} /> Add member</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ----------------------- desk doctors manager (home/footer) ------------------ */

function DeskDoctorsModal({ onClose }: { onClose: () => void }) {
  const { deskDoctors, addDeskDoctor, removeDeskDoctor, toast, logActivity } = useApp();
  const [form, setForm] = useState({ name: "", specialty: "" });
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const add = () => {
    if (!form.name.trim()) { toast("Enter the doctor's name"); return; }
    const name = form.name.trim();
    addDeskDoctor({
      id: `desk-${Date.now()}`, name, initials: name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase(),
      qualification: "BAMS", specialty: form.specialty.trim() || "Ayurvedic medicine", years: 1,
      bio: "Member of the Vaidyagan publishing desk.", quote: "Written from the OPD, checked against the classics.",
      hue: ["#d6b45f", "#82b39e", "#e07f49", "#93b1cf"][deskDoctors.length % 4],
    });
    logActivity("member", `added ${name} to the public desk roster`);
    setForm({ name: "", specialty: "" });
    toast(`${name} now appears on the home page and footer`);
  };

  const inp = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[66] flex items-end justify-center bg-forest-950/85 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 320 }} onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-forest-700 bg-forest-900 p-6 sm:rounded-2xl sm:p-7" role="dialog" aria-label="Publishing desk doctors">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Publishing desk · public roster</p>
            <p className="mt-1 font-display text-2xl font-semibold text-sand-100">{deskDoctors.length} doctor{deskDoctors.length === 1 ? "" : "s"} on the site</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={15} /></button>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-sand-200/55">These are the doctors shown in the home-page Doctor's Corner and the footer. Add or remove to update the public site instantly.</p>

        <div className="mt-6 space-y-3">
          {deskDoctors.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-xl border border-forest-800 bg-forest-850/50 p-4">
              <Monogram author={d} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-sand-100">{d.name}</p>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/40">{d.qualification} · {d.specialty}</p>
              </div>
              {confirmRemove === d.id ? (
                <button onClick={() => { removeDeskDoctor(d.id); logActivity("member", `removed ${d.name} from the public roster`); setConfirmRemove(null); toast(`${d.name} removed from the public site`); }}
                  className="rounded-full bg-ember-500/20 px-3.5 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ember-300 hover:bg-ember-500/35">Confirm</button>
              ) : (
                <button onClick={() => { setConfirmRemove(d.id); window.setTimeout(() => setConfirmRemove((c) => (c === d.id ? null : c)), 3000); }} aria-label={`Remove ${d.name}`}
                  className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200/50 hover:border-ember-400 hover:text-ember-300"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
          {deskDoctors.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-8 text-center text-sm text-sand-200/45">No doctors on the public roster — the Doctor's Corner is hidden.</p>}
        </div>

        <div className="mt-6 rounded-xl border border-gold-500/35 bg-gold-400/5 p-5">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-300">Add a doctor to the site</p>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name — e.g. Dr. A. Deshpande" className={inp} />
            <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Specialty — e.g. Kayachikitsa" className={inp} />
          </div>
          <button onClick={add} className="gold-sheen mt-3.5 flex items-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Plus size={14} /> Add doctor</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------ settings modal ------------------------------ */

function SettingsModal({ onClose }: { onClose: () => void }) {
  const { storeEnabled, setStoreEnabled, profileTabEnabled, setProfileTabEnabled, toast, logActivity } = useApp();
  const Switch = ({ on, onChange, label, desc }: { on: boolean; onChange: (b: boolean) => void; label: string; desc: string }) => (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all ${on ? "border-kapha-500/50 bg-kapha-500/8" : "border-forest-700 bg-forest-950/40 hover:border-forest-600"}`}>
      <span>
        <span className={`block text-[14px] font-semibold ${on ? "text-sand-100" : "text-sand-200/70"}`}>{label}</span>
        <span className="mt-0.5 block text-xs text-sand-200/45">{desc}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-kapha-500" : "bg-forest-700"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-sand-100 shadow transition-all duration-300 ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[66] flex items-center justify-center bg-forest-950/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-forest-700 bg-forest-900 p-7" role="dialog" aria-label="Studio settings">
        <div className="flex items-center justify-between">
          <p className="font-display text-2xl font-semibold text-sand-100">Master switches</p>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={15} /></button>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-sand-200/55">These control what the public sees. Changes apply instantly.</p>
        <div className="mt-5 space-y-3">
          <Switch on={storeEnabled} onChange={(b) => { setStoreEnabled(b); logActivity("system", b ? "enabled the public store" : "disabled the public store"); toast(b ? "Store is live" : "Store hidden from the public site"); }} label="Enable public Store" desc="Turn off to hide the store from the website and show a 'coming soon' screen." />
          <Switch on={profileTabEnabled} onChange={(b) => { setProfileTabEnabled(b); logActivity("system", b ? "showed the My Profile tab" : "hid the My Profile tab"); toast(b ? "My Profile tab visible" : "My Profile tab hidden"); }} label="Show My Profile tab" desc="Turn off to hide the doctor profile tab from the Studio." />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------- the editor -------------------------------- */

interface FmtState { bold: boolean; italic: boolean; underline: boolean; strike: boolean; block: string }

function EditorToolbar({ edRef, sync, insertShloka, onOpenImage, onOpenVideo, refreshFmt, tocCount, outlineOpen, onToggleOutline, focus, onToggleFocus, words, readMin, mode, setMode }: {
  edRef: React.RefObject<HTMLDivElement>; sync: () => void; insertShloka: () => void; onOpenImage: () => void; onOpenVideo: () => void; refreshFmt: () => void;
  tocCount: number; outlineOpen: boolean; onToggleOutline: () => void; focus: boolean; onToggleFocus: () => void;
  words: number; readMin: number; mode: "write" | "preview"; setMode: (m: "write" | "preview") => void;
}) {
  const [fmt, setFmt] = useState<FmtState>({ bold: false, italic: false, underline: false, strike: false, block: "p" });
  /* remember the doctor's selection so toolbar clicks (which steal focus) can put it back */
  const savedRange = useRef<Range | null>(null);

  const refresh = useCallback(() => {
    const ed = edRef.current;
    const sel = window.getSelection();
    if (!ed || !sel || sel.rangeCount === 0 || !sel.anchorNode) return;
    try {
      if (ed.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange();
    } catch { /* ignore */ }
    if (!ed.contains(sel.anchorNode)) return;
    try {
      const raw = (document.queryCommandValue("formatBlock") || "").toLowerCase().replace(/[<>]/g, "");
      const next: FmtState = {
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strike: document.queryCommandState("strikeThrough"),
        block: raw === "div" ? "p" : raw || "p",
      };
      setFmt((prev) => (
        prev.bold === next.bold && prev.italic === next.italic && prev.underline === next.underline &&
        prev.strike === next.strike && prev.block === next.block
      ) ? prev : next);
    } catch { /* older engines */ }
  }, [edRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", refresh);
    return () => document.removeEventListener("selectionchange", refresh);
  }, [refresh]);

  const exec = (cmd: string, val?: string) => {
    const ed = edRef.current;
    if (!ed) return;
    const sel = window.getSelection();
    /* CRITICAL: check the selection BEFORE focusing — focusing collapses it to
       the start, which is why style commands used to apply to nothing. */
    const lost = !sel || sel.rangeCount === 0 || sel.isCollapsed || !sel.anchorNode || !ed.contains(sel.anchorNode);
    if (lost) {
      ed.focus();
      if (savedRange.current) {
        try { const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(savedRange.current); } catch { /* ignore */ }
      }
    }
    try { document.execCommand(cmd, false, val); } catch { /* older engines */ }
    sync();
    refresh();
    refreshFmt();
  };

  const btn = (active?: boolean) =>
    `grid h-9 w-9 place-items-center rounded-lg border transition-all ${
      active
        ? "border-gold-400 bg-gold-400/15 text-gold-300 shadow-[0_0_12px_rgba(214,180,95,0.25)]"
        : "border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300"
    }`;
  const blockLabel: Record<string, string> = { p: "Normal text", h2: "Heading 2", h3: "Heading 3", blockquote: "Quote" };

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-forest-800 bg-forest-850/80 px-3 py-2">
      <select value={["p", "h2", "h3", "blockquote"].includes(fmt.block) ? fmt.block : "p"}
        onChange={(e) => { if (e.target.value) exec("formatBlock", e.target.value); }}
        aria-label="Paragraph style" className="h-9 rounded-lg border border-forest-700 bg-forest-900 px-2 font-mono text-[10.5px] uppercase tracking-wide text-sand-200/75 focus:border-gold-400 focus:outline-none">
        <option value="p">Normal</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="blockquote">Quote</option>
      </select>
      {/* Contents lives on the menu bar so it stays in reach during long drafts */}
      <button onClick={onToggleOutline} aria-pressed={outlineOpen} title="Table of contents" aria-label="Table of contents"
        className={`relative flex h-9 items-center gap-1.5 rounded-lg border px-2.5 transition-all ${outlineOpen ? "border-gold-400 bg-gold-400/15 text-gold-300 shadow-[0_0_12px_rgba(214,180,95,0.25)]" : "border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300"}`}>
        <ListTree size={15} />
        {tocCount > 0 && <span className="rounded-full bg-gold-400 px-1.5 font-mono text-[8.5px] font-bold leading-4 text-forest-950">{tocCount}</span>}
      </button>
      <span className="mx-1 h-5 w-px bg-forest-700" />
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} className={btn(fmt.bold)} title="Bold" aria-label="Bold" aria-pressed={fmt.bold}><Bold size={15} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} className={btn(fmt.italic)} title="Italic" aria-label="Italic" aria-pressed={fmt.italic}><Italic size={15} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} className={btn(fmt.underline)} title="Underline" aria-label="Underline" aria-pressed={fmt.underline}><Underline size={15} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("strikeThrough")} className={btn(fmt.strike)} title="Strikethrough" aria-label="Strikethrough" aria-pressed={fmt.strike}><Strikethrough size={15} /></button>
      <span className="mx-1 h-5 w-px bg-forest-700" />
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} className={btn()} title="Bullet list" aria-label="Bullet list"><List size={15} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={insertShloka} className={btn()} title="Insert shloka quote" aria-label="Insert shloka"><BookOpen size={15} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={onOpenImage} className={btn()} title="Insert image" aria-label="Insert image"><ImageIcon size={15} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={onOpenVideo} className={btn()} title="Embed video (YouTube / Vimeo)" aria-label="Embed video"><Youtube size={15} /></button>
      <span className="mx-1 h-5 w-px bg-forest-700" />
      {/* write / preview */}
      <div className="flex overflow-hidden rounded-lg border border-forest-700">
        <button onClick={() => setMode("write")} aria-pressed={mode === "write"} className={`px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] transition-all ${mode === "write" ? "bg-gold-400 text-forest-950" : "text-sand-200/55 hover:text-sand-100"}`}>Write</button>
        <button onClick={() => setMode("preview")} aria-pressed={mode === "preview"} className={`px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] transition-all ${mode === "preview" ? "bg-gold-400 text-forest-950" : "text-sand-200/55 hover:text-sand-100"}`}>Preview</button>
      </div>
      <button onClick={onToggleFocus} aria-pressed={focus} title={focus ? "Exit focus mode (Esc)" : "Focus mode — hide the side panels"} aria-label="Toggle focus mode" className={btn(focus)}>
        {focus ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      </button>
      {/* live readout — tells the doctor exactly what the cursor sits in */}
      <span className="ml-auto hidden items-center gap-1 rounded-full border border-forest-700 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-gold-300/80 md:flex">
        {words.toLocaleString()} words · {readMin} min
        <span className="text-sand-200/25">·</span>
        {blockLabel[fmt.block] ?? "Normal text"}
        {fmt.bold && " · B"}{fmt.italic && " · I"}{fmt.underline && " · U"}{fmt.strike && " · S"}
      </span>
    </div>
  );
}

function ImageInsertModal({ onInsert, onClose }: { onInsert: (html: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const insert = () => {
    if (!url.trim()) return;
    onInsert(`<img src="${url.trim()}" alt="" style="width:100%;border-radius:10px;margin:1rem 0" />`);
    onClose();
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-forest-950/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900 p-6">
        <p className="font-display text-xl font-semibold text-sand-100">Insert image</p>
        <p className="mt-1.5 text-[12.5px] text-sand-200/50">Paste an image URL, or upload a file from your device.</p>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="mt-4 w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 focus:border-gold-400 focus:outline-none" />
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-forest-600 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">
          <ImageIcon size={14} /> Upload from device
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) readImageFile(f, (u) => setUrl(u), () => setUrl(""));
            e.target.value = "";
          }} />
        </label>
        {url && <img src={url} alt="Preview" className="mt-4 max-h-40 w-full rounded-lg border border-forest-700 object-cover" />}
        <div className="mt-5 flex gap-2.5">
          <button onClick={insert} disabled={!url.trim()} className="gold-sheen flex-1 rounded-full bg-gold-400 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300 disabled:opacity-35">Insert</button>
          <button onClick={onClose} className="rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/60 hover:text-sand-100">Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------- contents drawer + helpers ------------------------- */

function extractToc(html: string): { level: number; text: string }[] {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("h2, h3"))
      .map((n) => ({ level: n.tagName === "H2" ? 2 : 3, text: (n.textContent || "").trim() }))
      .filter((t) => t.text);
  } catch { return []; }
}

function OutlineDrawer({ toc, active, open, onClose, onJump }: {
  toc: { level: number; text: string }[]; active: number; open: boolean; onClose: () => void; onJump: (i: number) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.22 }}
          className="absolute bottom-3 right-3 top-14 z-20 flex w-64 max-w-[75%] flex-col overflow-hidden rounded-xl border border-forest-700/70 bg-forest-950/92 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          role="navigation" aria-label="Table of contents">
          <div className="flex items-center gap-2 border-b border-forest-800 px-4 py-3">
            <ListTree size={13} className="text-gold-400" />
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold-400">Contents</p>
            <span className="rounded-full border border-gold-500/40 bg-gold-400/10 px-2 py-0.5 font-mono text-[8.5px] text-gold-300">{toc.length} heading{toc.length === 1 ? "" : "s"}</span>
            <button onClick={onClose} aria-label="Close contents" className="ml-auto grid h-7 w-7 place-items-center rounded-md border border-forest-700 text-sand-200/60 hover:text-gold-300"><X size={12} /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
            {toc.length === 0 ? (
              <p className="p-4 text-center text-[11.5px] leading-relaxed text-sand-200/50">
                Add <b className="text-sand-200/80">Heading 2</b> or <b className="text-sand-200/80">Heading 3</b> blocks and this outline builds itself — click any entry to jump straight there.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {toc.map((t, i) => (
                  <li key={`${t.text}-${i}`}>
                    <button onClick={() => onJump(i)}
                      className={`flex w-full items-center gap-2 rounded-lg border-l-2 py-1.5 pr-2 text-left transition-all ${t.level === 3 ? "pl-7" : "pl-3"} ${
                        active === i
                          ? "border-gold-400 bg-gold-400/10 text-gold-300 shadow-[inset_0_0_18px_rgba(214,180,95,0.06)]"
                          : "border-transparent text-sand-200/60 hover:border-gold-500/40 hover:bg-forest-850 hover:text-sand-100"
                      }`}>
                      <span className={`h-1 w-1 shrink-0 rotate-45 ${active === i ? "bg-gold-400" : "bg-forest-600"}`} />
                      <span className={`truncate text-[12px] leading-snug ${t.level === 2 ? "font-semibold" : ""}`}>{t.text}</span>
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

/* --------------------------------- video embed -------------------------------- */

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtu")) {
      const id = u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return /^\d+$/.test(id ?? "") ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch { return null; }
}

function VideoInsertModal({ onInsert, onClose }: { onInsert: (html: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const embed = toEmbedUrl(url);
  const insert = () => {
    if (!embed) return;
    onInsert(`<div style="margin:1.5rem 0"><iframe src="${embed}" title="Video" style="width:100%;aspect-ratio:16/9;border:0;border-radius:12px" allowfullscreen></iframe></div><p></p>`);
    onClose();
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-forest-950/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900 p-6" role="dialog" aria-label="Embed video">
        <p className="font-display text-xl font-semibold text-sand-100">Embed a video</p>
        <p className="mt-1.5 text-[12.5px] text-sand-200/50">Paste a YouTube or Vimeo link — it becomes a player inside the essay.</p>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" autoFocus
          className="mt-4 w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
        {url.trim() && !embed && <p className="mt-2 text-[12px] text-ember-300">That doesn't look like a YouTube or Vimeo link yet.</p>}
        {embed && <p className="mt-2 flex items-center gap-1.5 text-[12px] text-kapha-300"><Check size={13} /> Recognised — ready to embed.</p>}
        <div className="mt-5 flex gap-2.5">
          <button onClick={insert} disabled={!embed} className="gold-sheen flex-1 rounded-full bg-gold-400 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300 disabled:opacity-35">Embed video</button>
          <button onClick={onClose} className="rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/60 hover:text-sand-100">Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------- manuscript import ---------------------------- */

interface ParsedManuscript { title: string; html: string; stats: { headings: number; paras: number; words: number } }

async function parseManuscript(file: File): Promise<ParsedManuscript> {
  const fallbackTitle = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Imported manuscript";
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  let html = "";
  if (ext === "docx" || ext === "doc") {
    const mammoth = await import("mammoth");
    const buf = await file.arrayBuffer();
    const res = await mammoth.convertToHtml({ arrayBuffer: buf });
    html = res.value || "";
  } else if (ext === "pdf") {
    const pdfjs: any = await import("pdfjs-dist");
    try {
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    } catch { /* bundled fallback */ }
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const paras: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      try {
        const page = await doc.getPage(i);
        const tc = await page.getTextContent();
        const text = tc.items.map((it: any) => it.str).join(" ").replace(/\s+/g, " ").trim();
        if (text) paras.push(`<p>${text.replace(/</g, "&lt;")}</p>`);
      } catch { /* skip unreadable page */ }
    }
    html = paras.join("\n");
  } else {
    const text = await file.text();
    html = text.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean)
      .map((p) => `<p>${p.replace(/</g, "&lt;")}</p>`).join("\n");
  }
  if (!html.trim()) html = "<p></p>";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const stats = {
    headings: doc.querySelectorAll("h1,h2,h3,h4").length,
    paras: doc.querySelectorAll("p,li").length,
    words: (doc.body.textContent || "").split(/\s+/).filter(Boolean).length,
  };
  const firstHead = doc.querySelector("h1,h2")?.textContent?.trim();
  return { title: firstHead || fallbackTitle, html, stats };
}

function ImportModal({ onCreate, onAsIs, onClose }: {
  onCreate: (p: ParsedManuscript) => void;
  onAsIs: (a: { name: string; dataUrl: string; title: string }) => void;
  onClose: () => void;
}) {
  const { toast } = useApp();
  const [parsed, setParsed] = useState<ParsedManuscript | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (f: File | null) => {
    if (!f) return;
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    if (!["pdf", "docx", "doc", "txt", "md"].includes(ext)) { toast("Use a PDF, Word (.docx), .txt or .md file"); return; }
    setBusy(true);
    setParsed(null);
    setPdfFile(ext === "pdf" ? f : null);
    try {
      setParsed(await parseManuscript(f));
    } catch {
      toast("Couldn't read that file — try exporting it as .docx or .txt");
    }
    setBusy(false);
  };

  const publishAsIs = () => {
    if (!pdfFile) return;
    const r = new FileReader();
    r.onload = () => onAsIs({ name: pdfFile.name, dataUrl: String(r.result), title: parsed?.title || pdfFile.name.replace(/\.pdf$/i, "") });
    r.onerror = () => toast("Couldn't read that PDF");
    r.readAsDataURL(pdfFile);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-forest-950/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-forest-700 bg-forest-900 p-6 sm:p-7" role="dialog" aria-label="Import a manuscript">
        <p className="font-display text-xl font-semibold text-sand-100">Import a manuscript</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-sand-200/50">Drop in a PDF, Word document or text file — Vaidyagan reads it and structures it into an editable draft.</p>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-forest-600 py-9 transition-all hover:border-gold-400 hover:bg-gold-400/4">
          {busy ? (
            <><span className="animate-spin-fast h-6 w-6 rounded-full border-2 border-gold-400 border-t-transparent" /><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300">Reading…</span></>
          ) : (
            <><FileUp size={22} className="text-gold-400/80" /><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/60">Click to choose a file</span><span className="text-[11px] text-sand-200/35">.pdf · .docx · .txt · .md</span></>
          )}
          <input type="file" accept=".pdf,.docx,.doc,.txt,.md" className="hidden" onChange={(e) => { void pick(e.target.files?.[0] ?? null); e.target.value = ""; }} />
        </label>

        {parsed && (
          <div className="mt-5 rounded-xl border border-kapha-500/35 bg-kapha-500/6 p-4">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-kapha-300"><Check size={14} /> “{parsed.title}”</p>
            <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/50">
              {parsed.stats.headings} headings · {parsed.stats.paras} paragraphs · {parsed.stats.words.toLocaleString()} words
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <button onClick={() => onCreate(parsed)} className="gold-sheen flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300"><PenLine size={13} /> Open as editable draft</button>
              {pdfFile && (
                <button onClick={publishAsIs} className="flex items-center gap-2 rounded-full border border-gold-500/50 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gold-300 hover:bg-gold-400 hover:text-forest-950"><FileUp size={13} /> Publish PDF as-is</button>
              )}
            </div>
            {pdfFile && <p className="mt-2 text-[11px] leading-relaxed text-sand-200/45">“As-is” attaches the original file untouched — readers view and download the exact document.</p>}
          </div>
        )}

        <button onClick={onClose} className="mt-5 w-full rounded-full border border-forest-700 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/60 hover:text-sand-100">Close</button>
      </motion.div>
    </motion.div>
  );
}

/* ---------------------------------- studio ---------------------------------- */

type TabKey = "essays" | "blogs" | "herbs" | "store" | "review" | "profile";

export function Studio() {
  const { allArticles, saveDraft, publishArticle, deleteArticle, userPosts, products, navigate, toast, logActivity, profileTabEnabled, activity } = useApp();
  const [member, setMember] = useState<StudioUser | null>(() => auth.session());
  const [tab, setTab] = useState<TabKey>("essays");
  const [membersOpen, setMembersOpen] = useState(false);
  const [deskOpen, setDeskOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftKind, setDraftKind] = useState<Kind>("blog");
  const [armedDelete, setArmedDelete] = useState<string | null>(null);

  /* article fields */
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryId, setCategoryId] = useState("dravyaguna");
  const [doshas, setDoshas] = useState<Article["doshas"]>(["vata"]);
  const [symptoms, setSymptoms] = useState("");
  const [kind, setKind] = useState<Kind>("blog");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const edRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState("");
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [cover, setCover] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [pdfAttachment, setPdfAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
  const [activeHeading, setActiveHeading] = useState(-1);

  /* Esc exits focus mode */
  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFocus(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  const toc = useMemo(() => extractToc(html), [html]);
  const words = useMemo(() => html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length, [html]);
  const readMin = Math.max(1, Math.round(words / 210));

  const trackHeading = useCallback(() => {
    const box = scrollRef.current;
    if (!box) return;
    const heads = Array.from(box.querySelectorAll("h2, h3")) as HTMLElement[];
    let idx = -1;
    heads.forEach((h, i) => { if (h.getBoundingClientRect().top < window.innerHeight * 0.55) idx = i; });
    setActiveHeading((prev) => (prev === idx ? prev : idx));
  }, []);

  const jumpToHeading = useCallback((i: number) => {
    const heads = scrollRef.current?.querySelectorAll("h2, h3");
    heads?.[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveHeading(i);
  }, []);

  const isSuper = member?.role === "superadmin";
  const myArticles = useMemo(() => {
    if (!member) return [];
    const mine = isSuper ? allArticles : allArticles.filter((a) => a.authorId === member.id);
    return [...mine].sort((a, b) => b.date.localeCompare(a.date));
  }, [allArticles, member, isSuper]);

  const selected = myArticles.find((a) => a.id === selectedId) ?? null;
  const reviewQueue = useMemo(() => allArticles.filter((a) => a.status === "review"), [allArticles]);

  const sync = () => setHtml(edRef.current?.innerHTML ?? "");

  /* hydrate editor when a post is selected */
  useEffect(() => {
    if (!selected || hydratedFor === selected.id) return;
    setTitle(selected.title);
    setSubtitle(selected.subtitle);
    setSummary(selected.summary);
    setCategoryId(selected.categoryId);
    setDoshas(selected.doshas);
    setSymptoms(selected.symptoms.join(", "));
    setKind(selected.kind);
    setCover(selected.cover ?? "");
    setPdfAttachment(selected.pdfUrl ? { name: selected.pdfName ?? "Original document.pdf", dataUrl: selected.pdfUrl } : null);
    setScheduleDate(selected.status === "scheduled" ? selected.date : "");
    const body = selected.html && selected.html.trim() ? selected.html : articleHtml(selected);
    setHtml(body);
    setMode("write");
    if (edRef.current) edRef.current.innerHTML = body;
    setHydratedFor(selected.id);
  }, [selected, hydratedFor]);

  const selectPost = (id: string) => { setSelectedId(id); setTab("essays"); };

  const buildArticle = (status: Article["status"]): Article => ({
    id: selected?.id ?? `user-${Date.now()}`,
    slug: (selected?.slug) || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "new-draft",
    title: title || "Untitled",
    subtitle, summary,
    cover: cover || selected?.cover || "",
    categoryId, doshas, symptoms: symptoms.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
    authorId: selected?.authorId ?? member?.id ?? "root",
    date: selected?.date ?? new Date().toISOString().slice(0, 10),
    views: selected?.views ?? 0, kind, blocks: [], html, status,
    pdfUrl: pdfAttachment?.dataUrl ?? selected?.pdfUrl,
    pdfName: pdfAttachment?.name ?? selected?.pdfName,
    caseMeta: selected?.caseMeta, researchMeta: selected?.researchMeta,
  });

  const onSave = () => {
    const a = buildArticle(selected?.status === "published" ? "published" : "draft");
    saveDraft(a);
    setSelectedId(a.id);
    logActivity("edit", `saved "${a.title}"`, a.title);
    toast(selected?.status === "published" ? "Live article updated in place" : "Draft saved");
  };
  const onPublish = () => {
    if (!title.trim()) { toast("Give the publication a title first"); return; }
    const a = buildArticle("published");
    saveDraft(a);
    publishArticle(a);
    setSelectedId(a.id);
    logActivity("publish", `published "${a.title}"`, a.title);
    toast(`${KIND_META[kind].label} published — it is live`);
  };
  const onSubmitReview = () => {
    if (!title.trim()) { toast("Give the publication a title first"); return; }
    const a = buildArticle("review");
    saveDraft(a);
    setSelectedId(a.id);
    logActivity("submit", `submitted "${a.title}" for review`, a.title);
    toast("Submitted — a superadmin will review it");
  };
  const onSchedule = () => {
    if (!scheduleDate) { toast("Pick a release date on the right first"); return; }
    if (!title.trim()) { toast("Give the publication a title first"); return; }
    const a = buildArticle("scheduled");
    a.date = scheduleDate;
    saveDraft(a);
    setSelectedId(a.id);
    logActivity("publish", `scheduled "${a.title}" for ${scheduleDate}`, a.title);
    toast(`Scheduled for ${formatDate(scheduleDate)}`);
  };
  const createFromImport = (p: ParsedManuscript) => {
    const a: Article = {
      id: `user-${Date.now()}`,
      slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "imported",
      title: p.title, subtitle: "Imported manuscript",
      summary: p.html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180),
      cover: cover || "", categoryId, doshas, authorId: member?.id ?? "root",
      date: new Date().toISOString().slice(0, 10), views: 0, symptoms: [], kind: "blog",
      blocks: [], html: p.html, status: "draft",
    };
    saveDraft(a);
    setSelectedId(a.id);
    setHydratedFor(null);
    setImportOpen(false);
    setTab("essays");
    toast(`Imported — ${p.stats.headings} headings and ${p.stats.words.toLocaleString()} words structured into a draft`);
  };
  const createFromAsIs = (x: { name: string; dataUrl: string; title: string }) => {
    const a: Article = {
      id: `user-${Date.now()}`,
      slug: x.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "document",
      title: x.title, subtitle: "Published as-is — the original, unedited document",
      summary: `${x.name} — shared exactly as received. Nothing was altered or reformatted.`,
      cover: cover || "", categoryId, doshas, authorId: member?.id ?? "root",
      date: new Date().toISOString().slice(0, 10), views: 0, symptoms: [], kind: "blog",
      blocks: [], html: `<p><em>This document is published exactly as received — read the original below, or download it.</em></p>`,
      pdfUrl: x.dataUrl, pdfName: x.name, status: "draft",
    };
    saveDraft(a);
    setSelectedId(a.id);
    setHydratedFor(null);
    setImportOpen(false);
    setTab("essays");
    toast("PDF attached as-is — nothing was altered. Publish when ready.");
  };
  const newDraft = () => {
    const a: Article = {
      id: `user-${Date.now()}`, slug: "new-draft", title: "", subtitle: "", summary: "", cover: "",
      categoryId: "dravyaguna", doshas: ["vata"], authorId: member?.id ?? "root",
      date: new Date().toISOString().slice(0, 10), views: 0, symptoms: [], kind: draftKind,
      blocks: [], html: "", status: "draft",
    };
    saveDraft(a);
    setSelectedId(a.id);
    setTab("essays");
    toast(`New ${KIND_META[draftKind].label.toLowerCase()} draft opened`);
  };
  const onDelete = (id: string) => {
    deleteArticle(id);
    logActivity("edit", "deleted an article");
    if (selectedId === id) { setSelectedId(null); setHydratedFor(null); setTitle(""); setSubtitle(""); setSummary(""); setHtml(""); if (edRef.current) edRef.current.innerHTML = ""; }
    setArmedDelete(null);
    toast("Article deleted");
  };

  const insertShloka = () => {
    const ed = edRef.current;
    if (!ed) return;
    try {
      ed.focus();
      document.execCommand("insertHTML", false, `<blockquote class="shloka"><p class="sa">संस्कृत श्लोक</p><p class="tr">English translation</p><cite>Classical source</cite></blockquote><p></p>`);
    } catch { /* ignore */ }
    sync();
  };

  const statusPill = (s: Article["status"]) => {
    const map = {
      draft: "border-forest-600 text-sand-200/60",
      published: "border-kapha-500/50 text-kapha-300",
      review: "border-ember-500/50 text-ember-300",
      scheduled: "border-steel-400/50 text-steel-300",
    } as const;
    return <span className={`rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] ${map[s]}`}>{s}</span>;
  };

  if (!member) return <LoginScreen onLogin={setMember} />;

  const tabs: { key: TabKey; label: string; icon: any; badge?: number; show: boolean }[] = [
    { key: "essays", label: "Blogging space", icon: PenLine, show: true },
    { key: "blogs", label: "My Blogs", icon: LayoutGrid, show: true },
    { key: "herbs", label: "Herb Index", icon: Leaf, show: true },
    { key: "store", label: "Store", icon: ShoppingCart, show: isSuper || member.storeAccess },
    { key: "review", label: "Needs review", icon: Shield, badge: reviewQueue.length, show: isSuper },
    { key: "profile", label: "My Profile", icon: UserIcon, show: profileTabEnabled },
  ];
  const visibleTabs = tabs.filter((t) => t.show);

  return (
    <div className="min-h-screen pb-20 pt-24">
      {/* header */}
      <header className="sticky top-[72px] z-40 border-b border-forest-800 bg-forest-950/90 backdrop-blur-md lg:top-[80px]">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Monogram author={{ initials: member.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase(), hue: member.hue }} size={40} />
            <div>
              <p className="font-display text-lg font-semibold leading-none text-sand-100">{member.name}</p>
              <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.2em] text-gold-400/80">{isSuper ? "Superadmin" : "Doctor"} · publishing desk</p>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2.5">
            {isSuper && (
              <>
                <button onClick={() => navigate({ name: "console" })} title="Open the full Admin Console"
                  className="gold-sheen flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">
                  <Shield size={14} /> Admin Console
                </button>
                <button onClick={() => setDeskOpen(true)} title="Manage the public desk roster" className="flex items-center gap-2 rounded-full border border-kapha-500/50 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-kapha-300 hover:bg-kapha-500/10"><Users size={14} /> Desk doctors</button>
                <button onClick={() => setMembersOpen(true)} className="flex items-center gap-2 rounded-full border border-gold-500/60 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gold-300 hover:bg-gold-400 hover:text-forest-950"><Users size={14} /> Members</button>
                <button onClick={() => setSettingsOpen(true)} title="Master switches" aria-label="Studio settings" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-all duration-300 hover:rotate-45 hover:border-gold-400 hover:text-gold-300"><SettingsIcon size={16} /></button>
              </>
            )}
            <button onClick={() => { auth.logout(); setMember(null); toast("Signed out of the desk"); }}
              className="rounded-full border border-forest-700 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/60 hover:border-ember-400 hover:text-ember-300">Sign out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 pt-6 lg:px-8">
        {/* tabs */}
        <div className="no-scrollbar flex items-end gap-2 overflow-x-auto">
          {visibleTabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-2 rounded-t-xl border border-b-0 px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-all ${tab === t.key ? "border-gold-500/50 bg-forest-900 text-gold-300" : "border-forest-800 bg-forest-900/40 text-sand-200/50 hover:text-sand-100"}`}>
              <t.icon size={15} /> {t.label}
              {!!t.badge && t.badge > 0 && <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-ember-400 px-1 font-mono text-[9px] font-bold text-forest-950">{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* review queue */}
        {tab === "review" && isSuper && (
          <div className="rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/70 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Needs review · {reviewQueue.length} submission{reviewQueue.length === 1 ? "" : "s"}</p>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-sand-200/55">Doctors without direct-publish rights send work here. Approve to push it live, or send it back to drafts.</p>
            <div className="mt-5 space-y-3">
              {reviewQueue.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-10 text-center text-sm text-sand-200/45">The queue is clear — nothing waiting.</p>}
              {reviewQueue.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-forest-800 bg-forest-850/50 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-sand-100">{a.title}</p>
                    <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/40">by {authorFor(a).name} · {formatDate(a.date)} · {KIND_META[a.kind].short}</p>
                  </div>
                  <button onClick={() => selectPost(a.id)} className="rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">Open</button>
                  <button onClick={() => { saveDraft({ ...a, status: "draft" }); logActivity("reject", `sent "${a.title}" back to drafts`, a.title); toast("Sent back to the author's drafts"); }} className="rounded-full border border-ember-500/50 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ember-300 hover:bg-ember-500/10">Send back</button>
                  <button onClick={() => { publishArticle(a); logActivity("approve", `approved & published "${a.title}"`, a.title); toast(`"${a.title}" is now live`); }} className="gold-sheen flex items-center gap-2 rounded-full bg-kapha-500 px-4 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-forest-950 hover:brightness-110"><Check size={13} /> Approve & publish</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* my blogs grid */}
        {tab === "blogs" && (
          <div className="rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">My Blogs · {myArticles.length} article{myArticles.length === 1 ? "" : "s"}</p>
              <button onClick={newDraft} className="gold-sheen flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300"><Plus size={13} /> New draft</button>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {myArticles.map((a) => (
                <div key={a.id} className="card-lift group relative overflow-hidden rounded-xl border border-forest-800 bg-forest-850/50 hover:border-gold-500/50">
                  <button onClick={() => selectPost(a.id)} className="block w-full text-left">
                    {a.cover ? <SmartImg src={a.cover} alt={a.title} className="aspect-[16/9] w-full object-cover duotone" /> : <div className="leaf-field grid aspect-[16/9] w-full place-items-center bg-forest-850"><span className="font-display text-4xl italic text-gold-500/25">वै</span></div>}
                    <div className="p-4">
                      <div className="flex items-center gap-2">{statusPill(a.status)}<span className="font-mono text-[9px] uppercase tracking-[0.1em] text-sand-200/35">{formatDate(a.date)}</span></div>
                      <p className="mt-2 line-clamp-2 text-[14px] font-semibold leading-snug text-sand-100 group-hover:text-gold-300">{a.title || "Untitled"}</p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/40">by {authorFor(a).name}</p>
                    </div>
                  </button>
                  {armedDelete === a.id ? (
                    <button onClick={() => onDelete(a.id)} onMouseLeave={() => setArmedDelete(null)} title="Click again to confirm"
                      className="absolute right-2 top-2 z-10 flex h-8 items-center gap-1 rounded-lg bg-ember-400 px-2 font-mono text-[8.5px] font-bold uppercase tracking-[0.08em] text-forest-950 shadow-[0_4px_16px_rgba(201,100,48,0.45)]"><Trash2 size={12} /> Sure?</button>
                  ) : (
                    <button onClick={() => { setArmedDelete(a.id); window.setTimeout(() => setArmedDelete((x) => (x === a.id ? null : x)), 3000); }} aria-label={`Delete ${a.title || "untitled article"}`} title="Delete article"
                      className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-lg border border-forest-700/70 bg-forest-950/70 text-sand-200/70 backdrop-blur-sm transition-all hover:scale-105 hover:border-ember-400 hover:bg-ember-500/20 hover:text-ember-300"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
              {myArticles.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-forest-700 p-12 text-center text-sm text-sand-200/45">No articles yet — open a fresh draft to begin.</p>}
            </div>
          </div>
        )}

        {/* herbs */}
        {tab === "herbs" && <div className="rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/70 p-6"><HerbManager /></div>}

        {/* store quick view */}
        {tab === "store" && (
          <div className="rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Store · {products.length} product{products.length === 1 ? "" : "s"}</p>
              <button onClick={() => navigate({ name: "console" })} className="flex items-center gap-2 rounded-full border border-gold-500/60 px-5 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-300 hover:bg-gold-400 hover:text-forest-950"><Shield size={13} /> Full store management in the Admin Console</button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <div key={p.id} className="flex gap-3 rounded-xl border border-forest-800 bg-forest-850/50 p-3.5">
                  <SmartImg src={p.image} alt={p.name} className="h-16 w-16 shrink-0 rounded-lg object-cover duotone" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-sand-100">{p.name}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-gold-300">₹{p.price} · {p.stock} in stock</p>
                    <p className={`mt-1 font-mono text-[8.5px] uppercase tracking-[0.12em] ${p.visible !== false ? "text-kapha-300" : "text-sand-200/40"}`}>{p.visible !== false ? "Live in store" : "Hidden"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* profile */}
        {tab === "profile" && profileTabEnabled && (
          <div className="rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/40 p-5 sm:p-6">
            <DoctorProfileTab member={member} />
          </div>
        )}

        {/* blogging space */}
        {tab === "essays" && (
          <div className={`grid gap-6 rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/40 p-4 transition-all duration-300 lg:p-6 ${focus ? "lg:grid-cols-1" : "lg:grid-cols-[290px_minmax(0,1fr)_280px]"}`}>
            {/* left — article list (hidden in focus mode) */}
            {!focus && (
            <aside className="flex max-h-[44vh] flex-col rounded-xl border border-forest-800 bg-forest-900/70 lg:max-h-[calc(100vh-220px)]">
              <div className="flex items-center justify-between gap-2 border-b border-forest-800 px-4 py-3">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400">{isSuper ? "All articles" : "Your articles"}</p>
                <button onClick={() => setImportOpen(true)} title="Import a PDF / Word manuscript" aria-label="Import manuscript"
                  className="flex items-center gap-1.5 rounded-full border border-forest-700 px-3 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-sand-200/60 transition-all hover:border-gold-400 hover:text-gold-300">
                  <FileUp size={12} /> Import
                </button>
              </div>
              <div className="border-b border-forest-800 px-4 py-2.5">
                <p className="mb-1.5 font-mono text-[7.5px] uppercase tracking-[0.16em] text-sand-200/30">New draft type</p>
                <div className="flex gap-1.5">
                  {(["blog", "case", "research"] as Kind[]).map((k) => (
                    <button key={k} onClick={() => setDraftKind(k)} aria-pressed={draftKind === k} title={`Next "New" draft will be a ${KIND_META[k].label}`}
                      className={`flex-1 rounded-lg border py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] transition-all ${draftKind === k ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/50 hover:border-forest-600 hover:text-sand-100"}`}>
                      {KIND_META[k].short}
                    </button>
                  ))}
                </div>
                <button onClick={newDraft} className="gold-sheen mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gold-400 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-forest-950 hover:bg-gold-300"><Plus size={11} /> New</button>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {myArticles.map((p) => (
                  <div key={p.id} className={`group overflow-hidden rounded-lg border transition-all ${selectedId === p.id ? "border-gold-500/60 bg-gold-400/8" : "border-forest-800 bg-forest-850/50 hover:border-forest-600"}`}>
                    <button onClick={() => selectPost(p.id)} className="block w-full p-3 text-left">
                      <div className="flex items-center gap-2">{statusPill(p.status)}</div>
                      <p className={`mt-1.5 truncate text-[13px] font-semibold ${selectedId === p.id ? "text-gold-300" : "text-sand-100"}`}>{p.title || "Untitled"}</p>
                      {isSuper && <p className="mt-0.5 truncate font-mono text-[8px] uppercase tracking-[0.12em] text-sand-200/35">by {authorFor(p).name}</p>}
                    </button>
                    {/* footer row — date on the left, delete on the right: they can never collide */}
                    <div className="flex items-center justify-between gap-2 border-t border-forest-800/60 px-3 py-1.5">
                      <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-sand-200/40">{formatDate(p.date)}</span>
                      {armedDelete === p.id ? (
                        <button onClick={() => onDelete(p.id)} onMouseLeave={() => setArmedDelete(null)} title="Click again to confirm"
                          className="animate-rise flex h-7 items-center gap-1 rounded-md bg-ember-400 px-2 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-forest-950 shadow-[0_4px_14px_rgba(201,100,48,0.45)]">
                          <Trash2 size={11} /> Sure?
                        </button>
                      ) : (
                        <button onClick={() => { setArmedDelete(p.id); window.setTimeout(() => setArmedDelete((x) => (x === p.id ? null : x)), 3000); }}
                          aria-label={`Delete ${p.title || "untitled article"}`} title="Delete article"
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-forest-700/70 text-sand-200/60 transition-all hover:scale-105 hover:border-ember-400 hover:bg-ember-500/15 hover:text-ember-300">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {myArticles.length === 0 && <p className="p-4 text-center text-[12px] text-sand-200/40">No posts yet — open a fresh draft.</p>}
              </div>
            </aside>
            )}

            {/* centre — editor */}
            <div className="relative flex max-h-[calc(100vh-190px)] min-h-[540px] flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-900/80">
              <EditorToolbar edRef={edRef} sync={sync} insertShloka={insertShloka}
                onOpenImage={() => setImgOpen(true)} onOpenVideo={() => setVideoOpen(true)} refreshFmt={trackHeading}
                tocCount={toc.length} outlineOpen={outlineOpen} onToggleOutline={() => setOutlineOpen(!outlineOpen)}
                focus={focus} onToggleFocus={() => setFocus(!focus)}
                words={words} readMin={readMin} mode={mode} setMode={setMode} />
              <OutlineDrawer toc={toc} active={activeHeading} open={outlineOpen} onClose={() => setOutlineOpen(false)} onJump={jumpToHeading} />
              <div ref={scrollRef} onScroll={trackHeading} className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                {pdfAttachment && (
                  <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-gold-500/40 bg-gold-400/6 px-4 py-3">
                    <FileUp size={16} className="shrink-0 text-gold-300" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-sand-100">{pdfAttachment.name}</p>
                      <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-gold-400/80">Original attached — will publish as-is</p>
                    </div>
                    <button onClick={() => setPdfAttachment(null)} className="shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/50 transition-colors hover:text-ember-300">Remove</button>
                  </div>
                )}
                {mode === "preview" ? (
                  <div className="article-prose mx-auto max-w-2xl text-sand-200/85">
                    <h1 className="font-display text-4xl font-semibold leading-tight text-sand-100">{title || "Untitled"}</h1>
                    {subtitle && <p className="mt-2 font-display text-lg italic text-sand-200/60">{subtitle}</p>}
                    <div className="gold-rule my-6" />
                    {summary && <p className="border-l-2 border-forest-700 pl-5 text-[16px] italic leading-relaxed text-sand-200/70">{summary}</p>}
                    <div className="mt-6" dangerouslySetInnerHTML={{ __html: html || "<p><em>Nothing to preview yet — switch to Write.</em></p>" }} />
                  </div>
                ) : (
                  <>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Essay title…" className="w-full bg-transparent font-display text-3xl font-semibold text-sand-100 placeholder:text-sand-200/25 focus:outline-none sm:text-4xl" />
                    <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="A one-line subtitle…" className="mt-2 w-full bg-transparent font-display text-lg italic text-sand-200/60 placeholder:text-sand-200/20 focus:outline-none" />
                    <div className="gold-rule my-5" />
                    <div ref={edRef} contentEditable data-placeholder="Begin writing… use the toolbar for headings, shlokas, lists and images."
                      onInput={() => { sync(); trackHeading(); }} className="editor-surface min-h-[340px] text-[15.5px] leading-[1.9] text-sand-200/90" />
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2.5 border-t border-forest-800 bg-forest-850/80 px-4 py-3.5">
                <button onClick={onSave} className="flex items-center gap-2 rounded-full border border-forest-600 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200 transition-all hover:border-gold-400 hover:text-gold-300"><Download size={14} /> {selected?.status === "published" ? "Save changes" : "Save draft"}</button>
                {selected?.status === "published" && (
                  <button onClick={() => navigate({ name: "article", id: selected.id })} className="flex items-center gap-2 rounded-full border border-kapha-500/50 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-kapha-300 transition-all hover:bg-kapha-500/15"><Eye size={14} /> View live</button>
                )}
                {member.canPublishDirect ? (
                  <button onClick={onPublish} className="gold-sheen ml-auto flex items-center gap-2 rounded-full bg-kapha-500 px-6 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:brightness-110 active:scale-95"><Send size={14} /> {selected?.status === "published" ? "Update live" : "One-click publish"}</button>
                ) : (
                  <button onClick={onSubmitReview} className="ml-auto flex items-center gap-2 rounded-full bg-ember-400 px-6 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-ember-300 active:scale-95"><Send size={14} /> Submit for review</button>
                )}
              </div>
            </div>

            {/* right — article settings (hidden in focus mode) */}
            {!focus && (
            <aside className="max-h-[46vh] space-y-5 overflow-y-auto rounded-xl border border-forest-800 bg-forest-900/70 p-5 lg:max-h-[calc(100vh-220px)]">
              <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400"><SettingsIcon size={13} /> Article settings</p>
              <div>
                <label className="mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/45">Content type</label>
                <div className="flex gap-1.5">
                  {(["blog", "case", "research"] as Kind[]).map((k) => (
                    <button key={k} onClick={() => setKind(k)} className={`flex-1 rounded-lg border py-2 font-mono text-[8.5px] uppercase tracking-[0.1em] transition-all ${kind === k ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/50 hover:text-sand-100"}`}>{KIND_META[k].short}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/45">Summary</label>
                <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="A two-sentence summary for cards…" className="w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3 py-2.5 text-[13px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/45">Category</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3 py-2.5 text-[13px] text-sand-100 focus:border-gold-400 focus:outline-none">
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/45">Target doshas</label>
                <div className="flex gap-1.5">
                  {(["vata", "pitta", "kapha"] as const).map((d) => (
                    <button key={d} onClick={() => setDoshas(doshas.includes(d) ? doshas.filter((x) => x !== d) : [...doshas, d])}
                      className={`flex-1 rounded-lg border py-2 font-mono text-[9px] uppercase tracking-[0.1em] transition-all ${doshas.includes(d) ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/50"}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/45">Symptom tags (comma-separated)</label>
                <input value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="sleep, anxiety, fatigue" className="w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3 py-2.5 text-[13px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/45">Cover image</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.values(IMG).slice(0, 6).map((src) => (
                    <button key={src} onClick={() => setCover(src)} aria-label="Choose this cover"
                      className={`overflow-hidden rounded-lg border-2 transition-all ${cover === src ? "border-gold-400 shadow-[0_0_14px_rgba(214,180,95,0.3)]" : "border-transparent opacity-70 hover:opacity-100"}`}>
                      <SmartImg src={src} alt="" className="aspect-[16/10] w-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input value={cover.startsWith("data:") ? "(uploaded image)" : cover} onChange={(e) => setCover(e.target.value)} placeholder="…or paste an image URL"
                    className="min-w-0 flex-1 rounded-lg border border-forest-700 bg-forest-950/60 px-3 py-2 text-[12px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
                  {cover && <button onClick={() => setCover("")} className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-sand-200/50 transition-colors hover:text-ember-300">No cover</button>}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/45">Schedule release</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-forest-700 bg-forest-950/60 px-3 py-2 text-[12px] text-sand-100 focus:border-gold-400 focus:outline-none" />
                  <button onClick={onSchedule} title="Save this article as scheduled"
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-steel-400/50 px-3 py-2 font-mono text-[8.5px] uppercase tracking-[0.1em] text-steel-300 transition-all hover:bg-steel-400/10">
                    <CalendarDays size={12} /> Schedule
                  </button>
                </div>
              </div>
              <div className="rounded-lg border border-forest-800 bg-forest-850/50 p-3.5">
                <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/45">Status</p>
                <div className="mt-1.5 flex items-center gap-2">{selected ? statusPill(selected.status) : <span className="font-mono text-[9px] text-sand-200/40">unsaved draft</span>}</div>
              </div>
            </aside>
            )}
          </div>
        )}
      </main>

      <AnimatePresence>
        {membersOpen && isSuper && <MembersModal onClose={() => setMembersOpen(false)} />}
        {deskOpen && isSuper && <DeskDoctorsModal onClose={() => setDeskOpen(false)} />}
        {settingsOpen && isSuper && <SettingsModal onClose={() => setSettingsOpen(false)} />}
        {imgOpen && <ImageInsertModal onInsert={(h) => { try { edRef.current?.focus(); document.execCommand("insertHTML", false, h); } catch { /* ignore */ } sync(); }} onClose={() => setImgOpen(false)} />}
        {videoOpen && <VideoInsertModal onInsert={(h) => { try { edRef.current?.focus(); document.execCommand("insertHTML", false, h); } catch { /* ignore */ } sync(); }} onClose={() => setVideoOpen(false)} />}
        {importOpen && <ImportModal onCreate={createFromImport} onAsIs={createFromAsIs} onClose={() => setImportOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
