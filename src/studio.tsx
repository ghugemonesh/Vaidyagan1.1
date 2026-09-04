import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp, auth, readImageFile, Monogram, SmartImg, type StudioUser, type ActivityEntry } from "./lib";
import {
  CATEGORIES, DOSHA_META, KIND_META, articleHtml, authorFor, formatDate,
  type Article, type CaseMeta, type Dosha, type Kind, type ResearchMeta,
} from "./data";
import { COVER_CHOICES } from "./covers";
import { isMaintenanceOn, setMaintenance } from "./console/db";
import { DoctorProfileTab } from "./doctor-profile";
import { HerbManager, HerbArticleWriter } from "./herbs-admin";
import { EditorToolbar, OutlineDrawer, ImageInsertModal, VideoInsertModal, extractToc, type FmtState } from "./studio-editor";
import {
  Pen, Eye, Plus, Trash, SealCheck, Send, Book, Download, Clock, Lock, Users, Key, Check,
  Close, RefreshIcon, Mortar, Leaf, LayoutGrid, Cart, Gear, Shield, Activity, ArrowLeft, ChevronDown, Search,
} from "./icons";

const inp = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
const lbl = "mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80";

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* --------------------------------- login ----------------------------------- */

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
    <div className="leaf-field relative mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col justify-center px-5">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(55% 45% at 50% 10%, rgba(214,180,95,0.1), transparent 70%)" }} />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative rounded-3xl border border-forest-700 bg-forest-900/85 p-8 backdrop-blur">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold-500/50 bg-gold-400/10 text-gold-300"><Lock size={26} /></span>
        <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-gold-400">Doctor Studio</p>
        <h1 className="mt-2 text-center font-display text-3xl font-semibold text-sand-100">The publishing desk</h1>
        <p className="mt-2.5 text-center text-[13px] leading-relaxed text-sand-200/55">
          This console is reserved for Vaidyagan's publishing team. Sign in to draft essays, case papers and research reviews, schedule releases and push them live to the journal.
        </p>
        <form onSubmit={submit} className="mt-7 space-y-3.5">
          <div><label className={lbl} htmlFor="su-user">Username</label><input id="su-user" value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} placeholder="e.g. monesh" autoComplete="username" className={inp} /></div>
          <div><label className={lbl} htmlFor="su-pass">Password</label><input id="su-pass" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="••••••••" autoComplete="current-password" className={inp} /></div>
          {error && <p className="rounded-lg border border-ember-500/40 bg-ember-500/10 px-4 py-2.5 text-[12.5px] text-ember-300">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-forest-950 transition-all hover:bg-gold-300 hover:shadow-[0_0_28px_rgba(214,180,95,0.35)]">Enter the desk</button>
        </form>
        <button onClick={() => setShowDemo(!showDemo)} className="mt-4 flex w-full items-center justify-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-sand-200/40 hover:text-gold-300">
          Demo logins for testing <ChevronDown size={12} className={`transition-transform ${showDemo ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {showDemo && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-3 space-y-1.5 rounded-xl border border-forest-800 bg-forest-950/60 p-4 font-mono text-[11px] text-sand-200/60">
                <p><b className="text-gold-300">monesh</b> / admin91466 — superadmin</p>
                <p><b className="text-moss-300">shruti</b> / shruti123 · <b className="text-moss-300">bhagyesh</b> / bhagyesh123 · <b className="text-moss-300">shivani</b> / shivani123</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ------------------------------ members modal ------------------------------ */

function MembersModal({ onClose }: { onClose: () => void }) {
  const { toast, logActivity } = useApp();
  const [, force] = useState(0);
  const refresh = () => force((x) => x + 1);
  const users = auth.list();
  const [form, setForm] = useState({ name: "", username: "", password: "", specialty: "" });
  const [error, setError] = useState("");
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPass, setNewPass] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const addMember = () => {
    if (!form.name.trim() || !form.username.trim() || form.password.length < 4) { setError("Name, username and a password of 4+ characters are required."); return; }
    const res = auth.addMember({ name: form.name.trim(), username: form.username, password: form.password, role: "doctor", specialty: form.specialty.trim() || "Ayurvedic medicine" });
    if (!res.ok) { setError(res.error ?? "Could not add member"); return; }
    logActivity("member", `added ${res.user!.name} to the desk`);
    setForm({ name: "", username: "", password: "", specialty: "" }); setError("");
    toast(`${res.user!.name} can now sign in to the Studio`);
    refresh();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[66] flex items-end justify-center bg-forest-950/85 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-forest-700 bg-forest-900 p-6 sm:rounded-2xl sm:p-7" role="dialog" aria-label="Members of the desk">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Members of the desk</p>
            <h3 className="mt-1 font-display text-2xl font-semibold text-sand-100">{users.length} people · {users.filter((u) => u.active).length} active</h3>
          </div>
          <button onClick={onClose} aria-label="Close members" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><Close size={15} /></button>
        </div>

        <div className="mt-6 rounded-xl border border-gold-500/35 bg-gold-400/5 p-5">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-300">Invite a doctor to the desk</p>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(""); }} placeholder="Full name" className={inp} />
            <input value={form.username} onChange={(e) => { setForm({ ...form, username: e.target.value }); setError(""); }} placeholder="Username (for login)" className={inp} />
            <input value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(""); }} placeholder="Temporary password (4+)" className={inp} />
            <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Specialty (optional)" className={inp} />
          </div>
          {error && <p className="mt-2.5 rounded-lg border border-ember-500/40 bg-ember-500/10 px-3.5 py-2 text-[12px] text-ember-300">{error}</p>}
          <button onClick={addMember} className="mt-3.5 flex items-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Plus size={13} /> Add member</button>
        </div>

        <div className="mt-6 space-y-3">
          {users.map((u) => (
            <div key={u.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${u.id === "root" ? "border-gold-500/40 bg-gold-400/5" : "border-forest-800 bg-forest-850/50"}`}>
              <Monogram author={{ initials: u.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase(), hue: u.hue }} size={40} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sand-100">
                  {u.name}
                  {u.role === "superadmin"
                    ? <span className="rounded-full border border-gold-500/50 bg-gold-400/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-gold-300">Superadmin</span>
                    : <span className="rounded-full border border-forest-700 bg-forest-800 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-sand-200/55">Doctor</span>}
                  {!u.active && <span className="rounded-full border border-ember-500/40 bg-ember-500/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-ember-300">Suspended</span>}
                </p>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/40">@{u.username} · {u.specialty}</p>
              </div>
              <div className="flex items-center gap-2">
                {resetFor === u.id ? (
                  <div className="flex items-center gap-1.5">
                    <input value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New password" autoFocus className="w-32 rounded-lg border border-forest-700 bg-forest-950/70 px-2.5 py-1.5 font-mono text-[11px] text-sand-100 focus:border-gold-400 focus:outline-none" />
                    <button onClick={() => { if (auth.resetPassword(u.id, newPass)) { logActivity("member", `reset the password of ${u.name}`); toast(`Password reset for ${u.name}`); setResetFor(null); setNewPass(""); refresh(); } else toast("Password needs 4+ characters"); }} className="rounded-full bg-gold-400 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase text-forest-950">Set</button>
                    <button onClick={() => setResetFor(null)} aria-label="Cancel password reset" className="text-sand-200/40 hover:text-sand-100"><Close size={13} /></button>
                  </div>
                ) : (
                  <button onClick={() => { setResetFor(u.id); setNewPass(""); }} title="Reset password" aria-label={`Reset password for ${u.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Key size={13} /></button>
                )}
                {u.id !== "root" && (
                  <>
                    <button onClick={() => { auth.setMemberStatus(u.id, !u.active); logActivity("member", u.active ? `suspended ${u.name}` : `reactivated ${u.name}`); toast(u.active ? `${u.name} suspended — login disabled` : `${u.name} reactivated`); refresh(); }}
                      className={`rounded-full border px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-all ${u.active ? "border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300" : "border-[#5f947e]/50 text-[#a9cfbf] hover:bg-[#5f947e]/15"}`}>
                      {u.active ? "Suspend" : "Reactivate"}
                    </button>
                    {confirmRemove === u.id ? (
                      <button onClick={() => { if (!auth.removeMember(u.id)) { toast("The desk needs at least one active superadmin"); setConfirmRemove(null); return; } logActivity("member", `removed ${u.name} from the desk`); setConfirmRemove(null); toast(`${u.name} removed from the desk`); refresh(); }}
                        className="rounded-full bg-ember-500/20 px-3.5 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ember-300 hover:bg-ember-500/35"><Trash size={11} className="mr-1 inline" />Confirm</button>
                    ) : (
                      <button onClick={() => { setConfirmRemove(u.id); window.setTimeout(() => setConfirmRemove((c) => (c === u.id ? null : c)), 3500); }} aria-label={`Remove ${u.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200/40 hover:border-ember-400 hover:text-ember-300"><Trash size={13} /></button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------ settings modal ------------------------------ */

function SettingsModal({ onClose }: { onClose: () => void }) {
  const { storeEnabled, setStoreEnabled, profileTabEnabled, setProfileTabEnabled, toast, logActivity } = useApp();
  const [maint, setMaint] = useState(() => isMaintenanceOn());

  const Switch = ({ on, onChange, label, desc }: { on: boolean; onChange: (b: boolean) => void; label: string; desc: string }) => (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all ${on ? "border-[#5f947e]/50 bg-[#5f947e]/8" : "border-forest-700 bg-forest-950/40 hover:border-forest-600"}`}>
      <span><span className={`block text-[14px] font-semibold ${on ? "text-sand-100" : "text-sand-200/70"}`}>{label}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-sand-200/45">{desc}</span></span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-[#5f947e]" : "bg-forest-700"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-sand-100 shadow transition-all ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[66] flex items-center justify-center bg-forest-950/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-forest-700 bg-forest-900 p-6 sm:p-7" role="dialog" aria-label="Studio settings">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400"><Gear size={15} /> Master switches</p>
          <button onClick={onClose} aria-label="Close settings" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><Close size={15} /></button>
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-sand-200/50">Superadmin only — these affect the public website immediately. The same switches live in the Admin Console.</p>
        <div className="mt-5 space-y-2.5">
          <Switch on={storeEnabled} onChange={(b) => { setStoreEnabled(b); logActivity("store", b ? "enabled the public store" : "paused the public store"); toast(b ? "Public store enabled" : "Public store paused — the tab is hidden"); }}
            label="Enable Public Store" desc="Turn this off to hide the Store tab from the main website." />
          <Switch on={profileTabEnabled} onChange={(b) => { setProfileTabEnabled(b); logActivity("member", b ? "showed the My Profile tab" : "hid the My Profile tab"); toast(b ? "My Profile tab visible in the Studio" : "My Profile tab hidden"); }}
            label="Show 'My Profile' tab" desc="Lets doctors maintain their public profile, clinic and payout details." />
          <Switch on={maint} onChange={(b) => { setMaint(b); setMaintenance(b); logActivity("edit", b ? "turned maintenance mode ON" : "turned maintenance mode OFF"); toast(b ? "Maintenance mode ON — visitors see the notice" : "Maintenance mode off — site is live"); }}
            label="Maintenance mode" desc="Shows visitors a friendly 'under construction' page. Staff can still sign in." />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------ activity drawer ----------------------------- */

function ActivityDrawer({ entries, onClose }: { entries: ActivityEntry[]; onClose: () => void }) {
  const kindColor: Record<string, string> = { publish: "#82b39e", approve: "#82b39e", reject: "#e07f49", member: "#d6b45f", store: "#93b1cf", edit: "#e7dcbf", submit: "#f0a377" };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[66] bg-forest-950/70 backdrop-blur-sm" onClick={onClose}>
      <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()} className="fixed inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-forest-800 bg-forest-900" role="dialog" aria-label="Activity log">
        <div className="flex items-center justify-between border-b border-forest-800 px-6 py-5">
          <p className="flex items-center gap-2 font-display text-xl font-semibold text-sand-100"><Activity size={18} className="text-gold-400" /> Activity log</p>
          <button onClick={onClose} aria-label="Close activity" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><Close size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {entries.length === 0 && <p className="py-10 text-center text-sm text-sand-200/45">No activity yet — actions on the desk land here.</p>}
          <ul className="space-y-3">
            {entries.slice(0, 40).map((a) => (
              <li key={a.id} className="flex gap-3 rounded-xl border border-forest-800 bg-forest-850/50 p-3.5">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: kindColor[a.kind] ?? "#d6b45f" }} />
                <div className="min-w-0">
                  <p className="text-[13px] leading-relaxed text-sand-200/85"><b className="text-sand-100">{a.actor}</b> {a.action}</p>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/35">{timeAgo(a.at)} · {a.kind}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </motion.aside>
    </motion.div>
  );
}

/* ------------------------------- importer ---------------------------------- */

interface ImportResult { title: string; bodyHtml: string; isPdf: boolean; fileName: string; pdfDataUrl?: string; stats: { headings: number; words: number } }

function ImportModal({ onCreate, onAsIs, onClose }: { onCreate: (r: ImportResult) => void; onAsIs: (r: ImportResult) => void; onClose: () => void }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const headingToH = (raw: string): string => {
    try {
      const doc = new DOMParser().parseFromString(raw, "text/html");
      doc.querySelectorAll("p, span, div").forEach((el) => {
        const fs = parseFloat(window.getComputedStyle(el as HTMLElement).fontSize);
        const bold = el.querySelector("b, strong") !== null || parseInt(window.getComputedStyle(el as HTMLElement).fontWeight, 10) >= 700;
        if (fs >= 23) { const h = doc.createElement("h2"); h.innerHTML = el.innerHTML; el.replaceWith(h); }
        else if (fs >= 17 && bold) { const h = doc.createElement("h3"); h.innerHTML = el.innerHTML; el.replaceWith(h); }
      });
      return doc.body.innerHTML;
    } catch { return raw; }
  };

  const handleFile = async (f: File) => {
    setBusy(true);
    try {
      const lower = f.name.toLowerCase();
      if (lower.endsWith(".pdf")) {
        const buf = await f.arrayBuffer();
        const pdfjs = await import("pdfjs-dist");
        try {
          const { default: workerUrl } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
          pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        } catch { /* bundled worker fallback */ }
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        let text = "";
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n\n";
        }
        const title = f.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim() || "Imported document";
        const bodyHtml = text.trim().split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("\n");
        const r = new FileReader();
        const pdfDataUrl: string = await new Promise((res) => { r.onload = () => res(String(r.result)); r.readAsDataURL(f); });
        setResult({ title, bodyHtml, isPdf: true, fileName: f.name, pdfDataUrl, stats: { headings: 0, words: text.split(/\s+/).filter(Boolean).length } });
      } else if (lower.endsWith(".docx")) {
        const buf = await f.arrayBuffer();
        const mammoth = (await import("mammoth")).default;
        const out = await mammoth.convertToHtml({ arrayBuffer: buf });
        const bodyHtml = headingToH(out.value);
        const doc = new DOMParser().parseFromString(bodyHtml, "text/html");
        const firstH = doc.querySelector("h1, h2, h3");
        setResult({
          title: firstH?.textContent?.trim() || f.name.replace(/\.docx$/i, ""),
          bodyHtml, isPdf: false, fileName: f.name,
          stats: { headings: doc.querySelectorAll("h2, h3").length, words: (doc.body.textContent ?? "").split(/\s+/).filter(Boolean).length },
        });
      } else {
        const text = await f.text();
        const bodyHtml = text.split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("\n");
        setResult({ title: f.name.replace(/\.[^.]+$/, ""), bodyHtml, isPdf: false, fileName: f.name, stats: { headings: 0, words: text.split(/\s+/).filter(Boolean).length } });
      }
    } catch {
      toast("Couldn't read that file — try a standard PDF or DOCX");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[66] flex items-center justify-center bg-forest-950/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-forest-700 bg-forest-900 p-6 sm:p-7" role="dialog" aria-label="Import manuscript">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Import a manuscript</p>
          <button onClick={onClose} aria-label="Close importer" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><Close size={15} /></button>
        </div>
        {!result ? (
          <label className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all ${busy ? "border-gold-400 bg-gold-400/5" : "border-forest-600 hover:border-gold-400"}`}>
            {busy ? <span className="animate-spin-fast h-8 w-8 rounded-full border-2 border-gold-400 border-t-transparent" /> : <Download size={26} className="text-gold-400/80" />}
            <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-sand-200/60">{busy ? "Reading your file…" : "Drop a PDF, Word, or text file"}</span>
            <span className="text-[12px] text-sand-200/40">Word files are structured automatically; big font sizes become headings.</span>
            <input type="file" accept=".pdf,.docx,.txt,.md" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          </label>
        ) : (
          <div className="mt-5">
            <div className="rounded-xl border border-forest-800 bg-forest-850/60 p-4">
              <p className="font-display text-lg font-semibold text-sand-100">{result.title}</p>
              <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/45">
                {result.fileName} · {result.stats.words.toLocaleString()} words{result.stats.headings > 0 && ` · ${result.stats.headings} headings detected`}
              </p>
            </div>
            {result.isPdf ? (
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <button onClick={() => onAsIs(result)} className="rounded-xl border border-gold-500/50 bg-gold-400/8 p-4 text-left transition-all hover:bg-gold-400/15">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-gold-300">Publish exactly as-is</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-sand-200/60">The original PDF appears on the page untouched — readable and downloadable.</p>
                </button>
                <button onClick={() => onCreate(result)} className="rounded-xl border border-forest-700 p-4 text-left transition-all hover:border-moss-400">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-moss-300">Convert to editable draft</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-sand-200/60">Extract the text into the editor so you can polish and reformat.</p>
                </button>
              </div>
            ) : (
              <button onClick={() => onCreate(result)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">
                <Check size={14} /> Open as editable draft
              </button>
            )}
            <button onClick={() => setResult(null)} className="mt-3 w-full text-center font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/45 hover:text-sand-100">Choose a different file</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------- main studio ------------------------------- */

const DEFAULT_CASE: CaseMeta = { presenting: "", history: "", examination: "", intervention: "", outcome: "" };
const DEFAULT_RESEARCH: ResearchMeta = { objective: "", method: "", findings: "", conclusion: "", citations: "" };

type StudioTab = "essays" | "review" | "blogs" | "herbs" | "store" | "profile";

export function Studio() {
  const {
    allArticles, saveDraft, publishArticle, deleteArticle, herbs, products, orders,
    navigate, toast, logActivity, activity, storeEnabled, profileTabEnabled,
  } = useApp();
  const [member, setMember] = useState<StudioUser | null>(() => auth.session());
  const [membersOpen, setMembersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [tab, setTab] = useState<StudioTab>("essays");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydrateNonce, setHydrateNonce] = useState(0);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [summary, setSummary] = useState("");
  const [kind, setKind] = useState<Kind>("blog");
  const [categoryId, setCategoryId] = useState("dravyaguna");
  const [customCategory, setCustomCategory] = useState("");
  const [doshas, setDoshas] = useState<Dosha[]>(["vata"]);
  const [symptoms, setSymptoms] = useState("");
  const [cover, setCover] = useState(COVER_CHOICES[0].src);
  const [scheduleDate, setScheduleDate] = useState("");
  const [caseMeta, setCaseMeta] = useState<CaseMeta>(DEFAULT_CASE);
  const [researchMeta, setResearchMeta] = useState<ResearchMeta>(DEFAULT_RESEARCH);
  const [pdfAttachment, setPdfAttachment] = useState<{ name: string; dataUrl: string } | null>(null);

  const [mode, setMode] = useState<"write" | "preview">("write");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [focus, setFocus] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [outlinePinned, setOutlinePinned] = useState(false);
  const [activeHeading, setActiveHeading] = useState(-1);
  const [imgOpen, setImgOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [html, setHtml] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const edRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);

  /* live re-read so permission revocations apply immediately */
  const me = member ? auth.get(member.id) ?? member : null;
  const isSuper = me?.role === "superadmin";
  const authorId = me?.id ?? "";

  const myArticles = useMemo(() => {
    const list = isSuper ? allArticles : allArticles.filter((a) => a.authorId === authorId);
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [allArticles, isSuper, authorId]);

  const reviewQueue = useMemo(() => allArticles.filter((a) => a.status === "review"), [allArticles]);
  const selected = allArticles.find((a) => a.id === selectedId) ?? null;

  /* auto-select the most recent post once signed in */
  useEffect(() => {
    if (!selectedId && myArticles.length > 0) setSelectedId(myArticles[0].id);
  }, [selectedId, myArticles]);

  const openPost = (id: string) => {
    setSelectedId(id);
    setHydrateNonce((n) => n + 1);
    setMode("write");
    setTab("essays");
  };

  /* hydrate fields + editor body whenever the target article or nonce changes */
  useEffect(() => {
    const a = allArticles.find((x) => x.id === selectedId);
    if (!a) return;
    setTitle(a.title); setSubtitle(a.subtitle); setSummary(a.summary);
    setKind(a.kind ?? "blog"); setCategoryId(a.categoryId); setCustomCategory(a.customCategory ?? "");
    setDoshas(a.doshas); setSymptoms(a.symptoms.join(", ")); setCover(a.cover);
    setScheduleDate(a.status === "scheduled" ? a.date : "");
    setCaseMeta(a.caseMeta ?? DEFAULT_CASE); setResearchMeta(a.researchMeta ?? DEFAULT_RESEARCH);
    setPdfAttachment(a.pdfUrl ? { name: a.pdfName ?? "Original document.pdf", dataUrl: a.pdfUrl } : null);
    /* desk posts carry raw HTML; seeded classics carry structured blocks */
    setHtml(a.html && a.html.trim() ? a.html : articleHtml(a));
  }, [selectedId, hydrateNonce, allArticles]);

  /* flush html into the (possibly remounted) editor node */
  useEffect(() => {
    const ed = edRef.current;
    if (!ed || !selectedId) return;
    if (ed.dataset.aid === selectedId && ed.innerHTML === html) return;
    ed.innerHTML = html;
    ed.dataset.aid = selectedId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, hydrateNonce, html, mode]);

  const sync = () => setHtml(edRef.current?.innerHTML ?? "");
  const words = useMemo(() => html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length, [html]);
  const readMin = Math.max(1, Math.round(words / 210));
  const toc = useMemo(() => extractToc(html), [html]);

  const jumpToHeading = (index: number) => {
    const nodes = scrollRef.current?.querySelectorAll("h2, h3");
    const node = nodes?.[index] as HTMLElement | undefined;
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* selection memory + live formatting readout */
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
      setFmt((prev) => (
        prev.bold === next.bold && prev.italic === next.italic && prev.underline === next.underline &&
        prev.strike === next.strike && prev.center === next.center && prev.full === next.full && prev.block === next.block
      ) ? prev : next);
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

  /* scroll-spy for the outline drawer */
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || mode !== "write" || toc.length === 0) return;
    const nodes = Array.from(root.querySelectorAll("h2, h3"));
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { const i = nodes.indexOf(e.target as HTMLElement); if (i >= 0) setActiveHeading(i); }
    }), { root, rootMargin: "-20% 0px -60% 0px" });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [toc, mode, html]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFocus(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const exec = (cmd: string, val?: string) => {
    const ed = edRef.current;
    if (!ed) return;
    const sel = window.getSelection();
    const lost = !sel || sel.rangeCount === 0 || sel.isCollapsed || !sel.anchorNode || !ed.contains(sel.anchorNode);
    if (lost) { ed.focus(); restoreSelection(); }
    try { document.execCommand(cmd, false, val); } catch { /* ignore */ }
    sync(); refreshFmt();
  };

  const insertShloka = () => exec("insertHTML", `<blockquote class="shloka"><p class="sa">संस्कृत श्लोकः</p><p class="tr">Translation of the verse…</p><cite>Charaka Samhita, Sutra 1.1</cite></blockquote><p></p>`);

  const buildArticle = (status: Article["status"]): Article => ({
    id: selected?.id ?? `user-${Date.now()}`,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled",
    title: title.trim() || "Untitled essay",
    subtitle: subtitle.trim(),
    summary: summary.trim() || html.replace(/<[^>]*>/g, " ").trim().slice(0, 170),
    cover,
    categoryId: categoryId === "__custom" ? "custom" : categoryId,
    customCategory: categoryId === "__custom" ? customCategory.trim() : undefined,
    doshas,
    authorId,
    date: status === "scheduled" && scheduleDate ? scheduleDate : new Date().toISOString().slice(0, 10),
    views: selected?.views ?? 0,
    symptoms: symptoms.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
    kind,
    caseMeta: kind === "case" ? caseMeta : undefined,
    researchMeta: kind === "research" ? researchMeta : undefined,
    blocks: [],
    html,
    pdfUrl: pdfAttachment?.dataUrl,
    pdfName: pdfAttachment?.name,
    status,
  });

  const onSave = () => {
    if (!selected && !title.trim()) { toast("Give the draft a title first"); return; }
    const status = selected?.status === "published" ? "published" : selected?.status === "review" ? "review" : selected?.status === "scheduled" ? "scheduled" : "draft";
    const a = buildArticle(status);
    saveDraft(a);
    if (!selectedId) setSelectedId(a.id);
    logActivity("edit", `saved "${a.title}" as a ${status}`, a.title);
    toast(status === "published" ? "Live article updated in place — readers see the changes immediately" : `Saved — "${a.title}" updated in place`);
  };
  const onSchedule = () => {
    if (!scheduleDate) { toast("Pick a date to schedule the release"); return; }
    saveDraft(buildArticle("scheduled"));
    logActivity("publish", `scheduled "${title || "Untitled"}" for ${scheduleDate}`, title);
    toast(`Scheduled for ${scheduleDate}`);
  };
  const onPublish = () => {
    if (!title.trim()) { toast("Give the publication a title first"); return; }
    if (words < 20 && !pdfAttachment) { toast("Write at least a few sentences before going live"); return; }
    const a = buildArticle("published");
    saveDraft(a); publishArticle(a);
    logActivity("publish", `published "${a.title}" directly`, a.title);
    setMode("preview");
    toast(`${KIND_META[kind].label} published under ${me?.name ?? "the desk"} — it is live`);
  };
  const onSubmitReview = () => {
    if (!title.trim()) { toast("Give the publication a title first"); return; }
    if (words < 20 && !pdfAttachment) { toast("Write at least a few sentences before submitting"); return; }
    const a = buildArticle("review");
    saveDraft(a);
    logActivity("submit", `submitted "${a.title}" for review`, a.title);
    toast("Submitted — a superadmin will review it before it goes live");
  };
  const onWithdraw = () => {
    if (!selected) return;
    saveDraft({ ...selected, status: "draft" });
    logActivity("submit", `withdrew "${selected.title}" back to drafts`, selected.title);
    toast("Moved back to your drafts");
  };
  const onDelete = (id: string) => {
    const target = allArticles.find((p) => p.id === id);
    if (target && target.status === "published" && !isSuper && !me?.canDeletePublished) {
      toast("Deleting published posts is disabled for your account"); return;
    }
    deleteArticle(id);
    logActivity("edit", `deleted "${target?.title ?? "an article"}"`, target?.title);
    if (selectedId === id) {
      const next = myArticles.find((p) => p.id !== id) ?? null;
      if (next) openPost(next.id); else setSelectedId(null);
    }
    toast("Article deleted from the desk");
  };

  const newDraft = (k: Kind = "blog") => {
    const a: Article = {
      id: `user-${Date.now()}`, slug: "new-draft", title: "", subtitle: "", summary: "",
      cover: COVER_CHOICES[0].src, categoryId: "dravyaguna", doshas: ["vata"], authorId,
      date: new Date().toISOString().slice(0, 10), views: 0, symptoms: [], kind: k,
      blocks: [], html: "", status: "draft",
    };
    saveDraft(a);
    openPost(a.id);
    setImportOpen(false);
    toast(k === "blog" ? "Fresh draft opened — the page is yours" : k === "case" ? "Case paper opened — structured summary included" : "Research review opened — structured abstract included");
  };

  if (!me) return <LoginScreen onLogin={(u) => setMember(u)} />;

  const canPublishDirect = isSuper || me.canPublishDirect;
  const locked = !!selected && selected.status === "published" && !isSuper && !me.canEditPublished;

  const tabDefs: { key: StudioTab; label: string; Icon: React.ComponentType<{ size?: number }>; badge?: number }[] = [
    { key: "essays", label: "Blogging space", Icon: Pen },
    ...(isSuper ? [{ key: "review" as StudioTab, label: "Needs review", Icon: SealCheck, badge: reviewQueue.length }] : []),
    { key: "blogs", label: "My Blogs", Icon: LayoutGrid },
    ...((isSuper || me.herbAccess) ? [{ key: "herbs" as StudioTab, label: "Herb Index", Icon: Mortar }] : []),
    ...((isSuper || me.storeAccess) ? [{ key: "store" as StudioTab, label: "Store", Icon: Cart }] : []),
    ...(profileTabEnabled ? [{ key: "profile" as StudioTab, label: "My Profile", Icon: Leaf }] : []),
  ];

  const statusPill = (s: Article["status"]) => {
    const map: Record<Article["status"], { label: string; cls: string }> = {
      published: { label: "Live", cls: "bg-[#5f947e]/15 text-[#a9cfbf] border-[#5f947e]/40" },
      draft: { label: "Draft", cls: "bg-forest-800 text-sand-200/60 border-forest-700" },
      scheduled: { label: "Scheduled", cls: "bg-steel-500/15 text-steel-300 border-steel-500/40" },
      review: { label: "In review", cls: "bg-ember-500/15 text-ember-300 border-ember-500/40" },
    };
    const m = map[s];
    return <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] ${m.cls}`}>{m.label}</span>;
  };

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="ops-grid pointer-events-none fixed inset-0 opacity-60" />

      {/* header */}
      <header className="relative border-b border-forest-800 bg-forest-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-5 py-4 lg:px-8">
          <button onClick={() => navigate({ name: "home" })} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/50 hover:text-gold-300">
            <ArrowLeft size={13} /> Site
          </button>
          <span className="h-5 w-px bg-forest-700" />
          <div>
            <p className="flex items-center gap-2 font-display text-xl font-semibold leading-none text-sand-100">
              Doctor Studio
              {isSuper && <span className="rounded-full border border-gold-500/50 bg-gold-400/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-gold-300">Superadmin</span>}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-sand-200/40">Namaste, {me.name}</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2.5">
            {isSuper && (
              <>
                <button onClick={() => navigate({ name: "console" })} title="Open the full Admin Console"
                  className="flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-gold-300 hover:shadow-[0_0_24px_rgba(214,180,95,0.35)]">
                  <Shield size={14} /> Admin Console
                </button>
                <button onClick={() => setSettingsOpen(true)} title="Master switches (superadmin only)" aria-label="Studio settings"
                  className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-all duration-300 hover:rotate-45 hover:border-gold-400 hover:text-gold-300"><Gear size={16} /></button>
                <button onClick={() => setMembersOpen(true)} className="flex items-center gap-2 rounded-full border border-gold-500/60 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 transition-all hover:bg-gold-400 hover:text-forest-950"><Users size={14} /> Members</button>
                <button onClick={() => setActivityOpen(true)} title="Activity log" aria-label="Activity log"
                  className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300"><Activity size={16} /></button>
              </>
            )}
            <button onClick={() => { auth.logout(); setMember(null); toast("Signed out of the desk"); }}
              className="rounded-full border border-forest-700 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/60 hover:border-ember-400 hover:text-ember-300">Sign out</button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1500px] px-5 pb-16 pt-8 lg:px-8">
        {/* tabs */}
        <div className="no-scrollbar flex items-end gap-2 overflow-x-auto">
          {tabDefs.map(({ key, label, Icon, badge }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex shrink-0 items-center gap-2 rounded-t-xl border border-b-0 px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-all ${tab === key ? "border-gold-500/50 bg-forest-900 text-gold-300" : "border-forest-800 bg-forest-900/40 text-sand-200/50 hover:text-sand-100"}`}>
              <Icon size={15} /> {label}
              {!!badge && badge > 0 && <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-ember-400 px-1 font-mono text-[9px] font-bold text-forest-950">{badge}</span>}
            </button>
          ))}
        </div>

        {/* tab content */}
        {tab === "review" && isSuper ? (
          <div className="rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/70 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Needs review · {reviewQueue.length} submission{reviewQueue.length === 1 ? "" : "s"}</p>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-sand-200/55">Doctors without direct-publish rights send work here. Approve to push it live, or send it back for another pass.</p>
            <div className="mt-5 space-y-3">
              {reviewQueue.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-10 text-center text-sm text-sand-200/45">The queue is clear — nothing waiting.</p>}
              {reviewQueue.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-forest-800 bg-forest-850/60 p-4">
                  <SmartImg src={a.cover} alt="" className="h-16 w-24 rounded-lg border border-forest-800 object-cover duotone" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-semibold text-sand-100">{a.title}</p>
                    <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/45">
                      by {authorFor(a).name} · submitted {formatDate(a.date)} · {articleHtml(a).replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length} words
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openPost(a.id)} className="rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/70 hover:border-gold-400 hover:text-gold-300">Read</button>
                    <button onClick={() => { saveDraft({ ...a, status: "draft" }); logActivity("reject", `sent "${a.title}" back to drafts`, a.title); toast("Returned to the author's drafts"); }}
                      className="rounded-full border border-ember-500/50 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ember-300 hover:bg-ember-500/10">Send back</button>
                    <button onClick={() => { const p = { ...a, status: "published" as const }; saveDraft(p); publishArticle(p); logActivity("approve", `approved & published "${a.title}"`, a.title); toast(`"${a.title}" is now live`); }}
                      className="flex items-center gap-1.5 rounded-full bg-[#5f947e] px-4 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-[#82b39e]"><SealCheck size={13} /> Approve & publish</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : tab === "blogs" ? (
          <div className="rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">My Blogs · {myArticles.length} article{myArticles.length === 1 ? "" : "s"}</p>
                <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-sand-200/55">
                  {isSuper ? "God mode — every article on the platform. Flip the green switch to publish or hide anything instantly." : "Click any card to edit. The green switch publishes or hides instantly."}
                </p>
              </div>
              <button onClick={() => newDraft()} className="flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Plus size={13} /> New article</button>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {myArticles.map((a) => {
                const live = a.status === "published";
                const canDelete = isSuper || me.canDeletePublished || a.status !== "published";
                return (
                  <div key={a.id} className="group flex flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-850/60 transition-all hover:border-gold-500/40">
                    <button onClick={() => openPost(a.id)} className="relative block overflow-hidden text-left">
                      <SmartImg src={a.cover} alt="" className="aspect-[16/9] w-full object-cover duotone transition-transform duration-500 group-hover:scale-[1.04]" />
                      <span className="absolute left-3 top-3">{statusPill(a.status)}</span>
                      <span className="absolute right-3 top-3 rounded-full border bg-forest-950/70 px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] backdrop-blur" style={{ borderColor: KIND_META[a.kind ?? "blog"].color, color: KIND_META[a.kind ?? "blog"].color }}>
                        {KIND_META[a.kind ?? "blog"].short}
                      </span>
                    </button>
                    <div className="flex flex-1 flex-col p-4">
                      <button onClick={() => openPost(a.id)} className="text-left font-display text-[16px] font-semibold leading-snug text-sand-100 hover:text-gold-300">{a.title || "Untitled"}</button>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/40">
                        {isSuper ? `${authorFor(a).name} · ` : ""}{formatDate(a.date)} · {KIND_META[a.kind ?? "blog"].label}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                        <Toggle on={live} label={false} onToggle={() => {
                          if (live) { saveDraft({ ...a, status: "draft" }); logActivity("edit", `unpublished "${a.title}"`, a.title); toast(`"${a.title}" hidden from the site`); }
                          else { const p = { ...a, status: "published" as const }; saveDraft(p); publishArticle(p); logActivity("publish", `published "${a.title}"`, a.title); toast(`"${a.title}" is live`); }
                        }} />
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openPost(a.id)} className="rounded-full border border-forest-700 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/70 hover:border-gold-400 hover:text-gold-300">Edit</button>
                          {live && <button onClick={() => navigate({ name: "article", id: a.id })} aria-label="View live" className="grid h-7 w-7 place-items-center rounded-full border border-forest-700 text-sand-200/50 hover:border-kapha-400 hover:text-kapha-300"><Eye size={12} /></button>}
                          {canDelete && (
                            confirmDeleteId === a.id ? (
                              <button onClick={() => { onDelete(a.id); setConfirmDeleteId(null); }} className="rounded-full bg-ember-500/20 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase text-ember-300">Sure?</button>
                            ) : (
                              <button onClick={() => { setConfirmDeleteId(a.id); window.setTimeout(() => setConfirmDeleteId((c) => (c === a.id ? null : c)), 3000); }} aria-label={`Delete ${a.title}`} className="grid h-7 w-7 place-items-center rounded-full border border-forest-700 text-sand-200/40 hover:border-ember-400 hover:text-ember-300"><Trash size={12} /></button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {myArticles.length === 0 && (
                <div className="rounded-xl border border-dashed border-forest-700 p-12 text-center sm:col-span-2 xl:col-span-3">
                  <Pen size={26} className="mx-auto text-forest-600" />
                  <p className="mt-4 font-display text-xl text-sand-200/70">Nothing on the desk yet</p>
                  <button onClick={() => newDraft()} className="mt-5 rounded-full bg-gold-400 px-7 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Start your first article</button>
                </div>
              )}
            </div>
          </div>
        ) : tab === "herbs" ? (
          <div className="rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/70 p-6">
            <HerbManager />
            <HerbArticleWriter authorId={authorId} />
          </div>
        ) : tab === "store" ? (
          <StoreOps isSuper={!!isSuper} onOpenConsole={() => navigate({ name: "console" })} />
        ) : tab === "profile" ? (
          <div className="rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/70 p-6">
            <DoctorProfileTab member={me} onHideTab={() => navigate({ name: "studio" })} />
          </div>
        ) : (
          /* ------------------------------ essays workspace ------------------------------ */
          <div className={`grid gap-6 rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/40 p-4 lg:p-6 ${focus ? "lg:grid-cols-1" : "lg:grid-cols-[290px_1fr]"}`}>
            {!focus && (
              <aside className="flex max-h-[calc(100vh-220px)] flex-col rounded-xl border border-forest-800 bg-forest-900/70">
                <div className="flex items-center justify-between border-b border-forest-800 px-4 py-3.5">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400">{isSuper ? "All articles" : "Your articles"}</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => newDraft("case")} title="New case paper" className="rounded-full border border-forest-700 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-sand-200/60 hover:border-ember-400 hover:text-ember-300">Case</button>
                    <button onClick={() => newDraft("research")} title="New research review" className="rounded-full border border-forest-700 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-sand-200/60 hover:border-steel-400 hover:text-steel-300">Research</button>
                    <button onClick={() => newDraft()} title="New blog" className="rounded-full bg-gold-400 px-2.5 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-forest-950 hover:bg-gold-300"><Plus size={10} className="inline" /> Blog</button>
                  </div>
                </div>
                <button onClick={() => setImportOpen(true)} className="mx-3 mt-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-forest-600 py-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/55 hover:border-gold-400 hover:text-gold-300">
                  <Download size={13} /> Import PDF / Word
                </button>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                  {myArticles.map((p) => (
                    <button key={p.id} onClick={() => openPost(p.id)}
                      className={`block w-full rounded-lg border p-3 text-left transition-all ${selectedId === p.id ? "border-gold-500/60 bg-gold-400/8" : "border-forest-800 bg-forest-850/50 hover:border-forest-600"}`}>
                      <div className="flex items-center gap-2">
                        {statusPill(p.status)}
                        <span className="ml-auto font-mono text-[8px] uppercase tracking-[0.1em] text-sand-200/35">{formatDate(p.date)}</span>
                      </div>
                      <p className={`mt-1.5 truncate text-[13px] font-semibold ${selectedId === p.id ? "text-gold-300" : "text-sand-100"}`}>{p.title || "Untitled"}</p>
                      {isSuper && <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-sand-200/35">by {authorFor(p).name}</p>}
                    </button>
                  ))}
                  {myArticles.length === 0 && <p className="p-4 text-center text-[12px] text-sand-200/40">No posts yet — open a fresh draft.</p>}
                </div>
              </aside>
            )}

            {/* editor column */}
            <div className="relative flex max-h-[calc(100vh-190px)] min-h-[540px] flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-900/80">
              {mode === "write" ? (
                <>
                  <EditorToolbar edRef={edRef} sync={sync} insertShloka={insertShloka}
                    onOpenImage={() => setImgOpen(true)} onOpenVideo={() => setVideoOpen(true)}
                    words={words} readMin={readMin} fmt={fmt} mode={mode} setMode={setMode} device={device} setDevice={setDevice}
                    focus={focus} onToggleFocus={() => setFocus(!focus)} restoreSelection={restoreSelection} refreshFmt={refreshFmt}
                    outlineOpen={outlineOpen} onToggleOutline={() => setOutlineOpen(!outlineOpen)} tocCount={toc.length} />

                  <div ref={scrollRef} className={`relative min-h-0 flex-1 overflow-y-auto ${outlineOpen && outlinePinned ? "xl:pr-[296px]" : ""} ${locked ? "opacity-60" : ""}`}>
                    <div className="mx-auto max-w-3xl px-6 py-7">
                      {pdfAttachment && (
                        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-ember-500/35 bg-ember-500/6 px-4 py-3">
                          <Book size={16} className="text-ember-300" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-sand-100">{pdfAttachment.name}</p>
                            <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-ember-300/80">Attached — will publish as the original, unaltered PDF</p>
                          </div>
                          <a href={pdfAttachment.dataUrl} target="_blank" rel="noreferrer" className="rounded-full border border-forest-700 px-3 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">Preview</a>
                          <button onClick={() => setPdfAttachment(null)} aria-label="Remove attachment" className="grid h-7 w-7 place-items-center rounded-full border border-forest-700 text-sand-200/40 hover:border-ember-400 hover:text-ember-300"><Close size={12} /></button>
                        </div>
                      )}
                      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Essay title…"
                        className="w-full bg-transparent font-display text-3xl font-semibold text-sand-100 placeholder:text-sand-200/20 focus:outline-none sm:text-4xl" />
                      <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle (optional)…"
                        className="mt-2 w-full bg-transparent font-display text-lg italic text-sand-200/60 placeholder:text-sand-200/20 focus:outline-none" />
                      <div className="gold-rule my-5" />
                      <div
                        ref={edRef}
                        contentEditable={!locked}
                        suppressContentEditableWarning
                        data-placeholder="Begin writing… use the ¶ Style menu for headings — they appear in the Table of Contents."
                        onInput={sync}
                        className={`editor-surface text-[15.5px] text-sand-200/90 ${locked ? "pointer-events-none" : ""}`}
                      />
                    </div>
                  </div>

                  {mode === "write" && (
                    <OutlineDrawer toc={toc} active={activeHeading} open={outlineOpen} pinned={outlinePinned}
                      onOpenChange={setOutlineOpen} onPin={() => setOutlinePinned(!outlinePinned)} onJump={jumpToHeading} />
                  )}
                </>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex shrink-0 items-center justify-between border-b border-forest-800 bg-forest-850/80 px-4 py-2.5">
                    <EditorToolbar edRef={edRef} sync={sync} insertShloka={insertShloka}
                      onOpenImage={() => setImgOpen(true)} onOpenVideo={() => setVideoOpen(true)}
                      words={words} readMin={readMin} fmt={fmt} mode={mode} setMode={setMode} device={device} setDevice={setDevice}
                      focus={focus} onToggleFocus={() => setFocus(!focus)} restoreSelection={restoreSelection} refreshFmt={refreshFmt}
                      outlineOpen={outlineOpen} onToggleOutline={() => setOutlineOpen(!outlineOpen)} tocCount={toc.length} />
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto bg-forest-950/60 p-6">
                    <div className={`article-prose mx-auto rounded-xl border border-forest-800 bg-forest-900 p-8 ${device === "mobile" ? "max-w-[380px]" : "max-w-3xl"}`}>
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold-400">{KIND_META[kind].label} · preview</p>
                      <h1 className="mt-2 font-display text-3xl font-semibold text-sand-100">{title || "Untitled"}</h1>
                      {subtitle && <p className="mt-2 font-display text-lg italic text-sand-200/60">{subtitle}</p>}
                      {cover ? <SmartImg src={cover} alt="" className="mt-5 aspect-[16/9] w-full rounded-xl border border-forest-800 object-cover duotone" /> : <div className="leaf-field mt-5 grid aspect-[16/9] w-full place-items-center rounded-xl border border-forest-800 bg-forest-850"><span className="font-display text-5xl italic text-gold-500/25">वै</span></div>}
                      <div className="mt-6" dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
                  </div>
                </div>
              )}

              {/* action bar */}
              <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-t border-forest-800 bg-forest-850/80 px-4 py-3.5">
                {locked && <span className="flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-400/8 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-300"><Lock size={13} /> Live & locked — editing disabled for you</span>}
                <button onClick={onSave} disabled={locked} className="flex items-center gap-2 rounded-full border border-forest-600 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200 transition-all hover:border-gold-400 hover:text-gold-300 disabled:cursor-not-allowed disabled:opacity-40">
                  <Download size={14} /> {selected?.status === "published" ? "Save changes" : "Save draft"}
                </button>
                {!locked && selected?.status !== "review" && (
                  <button onClick={onSchedule} className="flex items-center gap-2 rounded-full border border-steel-500/50 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-steel-300 transition-all hover:bg-steel-500/10"><Clock size={14} /> Schedule</button>
                )}
                {selected?.status === "review" ? (
                  isSuper ? (
                    <>
                      <button onClick={onWithdraw} className="ml-auto flex items-center gap-2 rounded-full border border-ember-500/50 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ember-300 hover:bg-ember-500/10"><Close size={13} /> Send back</button>
                      <button onClick={() => { const a = buildArticle("published"); saveDraft(a); publishArticle(a); logActivity("approve", `approved & published "${a.title}"`, a.title); setMode("preview"); toast(`"${a.title}" is now live`); }}
                        className="flex items-center gap-2 rounded-full bg-[#5f947e] px-6 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-[#82b39e]"><SealCheck size={14} /> Approve & publish</button>
                    </>
                  ) : (
                    <>
                      <span className="ml-auto flex items-center gap-2 rounded-full border border-ember-500/40 bg-ember-500/10 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ember-300"><Clock size={13} /> Awaiting superadmin review</span>
                      <button onClick={onWithdraw} className="flex items-center gap-2 rounded-full border border-forest-600 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200 hover:border-gold-400 hover:text-gold-300"><ArrowLeft size={13} /> Withdraw</button>
                    </>
                  )
                ) : canPublishDirect ? (
                  <button onClick={onPublish} className="ml-auto flex items-center gap-2 rounded-full bg-[#5f947e] px-6 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-[#82b39e] active:scale-95">
                    <Send size={14} /> {selected?.status === "published" ? "Update live" : "One-click publish"}
                  </button>
                ) : (
                  <button onClick={onSubmitReview} className="ml-auto flex items-center gap-2 rounded-full bg-ember-400 px-6 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-ember-300 active:scale-95">
                    <Send size={14} /> Submit for review
                  </button>
                )}
                {selected?.status === "published" && (
                  <button onClick={() => navigate({ name: "article", id: selected.id })} className="flex items-center gap-2 rounded-full border border-kapha-500/50 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-kapha-300 transition-all hover:bg-kapha-500/15"><Eye size={14} /> View live</button>
                )}
              </div>
            </div>

            {/* metadata rail */}
            {!focus && (
              <aside className="max-h-[calc(100vh-220px)] space-y-5 overflow-y-auto rounded-xl border border-forest-800 bg-forest-900/70 p-5">
                <div>
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400">Article settings</p>
                </div>
                <div>
                  <label className={lbl}>Content type</label>
                  <div className="flex gap-1.5">
                    {(["blog", "case", "research"] as Kind[]).map((k) => (
                      <button key={k} onClick={() => setKind(k)} className={`flex-1 rounded-lg border py-2 font-mono text-[8.5px] uppercase tracking-[0.1em] transition-all ${kind === k ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55"}`}>{KIND_META[k].short}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lbl}>Summary</label>
                  <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="One or two lines shown on cards…" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Category</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inp}>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.sanskrit} {c.name}</option>)}
                    <option value="__custom">Custom…</option>
                    <option value="none">No category</option>
                  </select>
                  {categoryId === "__custom" && <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Type your category…" className={`${inp} mt-2`} />}
                </div>
                <div>
                  <label className={lbl}>Dosha tags</label>
                  <div className="flex gap-1.5">
                    {(["vata", "pitta", "kapha"] as Dosha[]).map((d) => {
                      const on = doshas.includes(d);
                      return (
                        <button key={d} onClick={() => setDoshas(on ? doshas.filter((x) => x !== d) : [...doshas, d])}
                          className="flex-1 rounded-lg border py-2 font-mono text-[8.5px] uppercase tracking-[0.1em] transition-all"
                          style={{ borderColor: on ? DOSHA_META[d].color : "var(--color-forest-700)", color: on ? DOSHA_META[d].color : "rgba(231,220,191,0.55)", background: on ? `${DOSHA_META[d].color}14` : "transparent" }}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className={lbl}>Symptom tags (comma separated)</label>
                  <input value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="sleep, anxiety, digestion" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Cover image</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {COVER_CHOICES.map((c) => (
                      <button key={c.src} onClick={() => setCover(c.src)} title={c.label} className={`overflow-hidden rounded-lg border-2 transition-all ${cover === c.src ? "border-gold-400" : "border-transparent opacity-70 hover:opacity-100"}`}>
                        <SmartImg src={c.src} alt={c.label} className="aspect-[4/3] w-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-forest-600 py-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/55 hover:border-gold-400 hover:text-gold-300">
                    <Plus size={12} /> Upload cover
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readImageFile(f, (u) => setCover(u), (m) => toast(m)); e.target.value = ""; }} />
                  </label>
                </div>
                <div>
                  <label className={lbl}>Attach original PDF (publish as-is)</label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-forest-600 py-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/55 hover:border-gold-400 hover:text-gold-300">
                    <Book size={12} /> Choose PDF
                    <input type="file" accept=".pdf" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 4 * 1024 * 1024) { toast("Keep PDFs under 4 MB for the demo"); return; }
                      const r = new FileReader();
                      r.onload = () => { setPdfAttachment({ name: f.name, dataUrl: String(r.result) }); toast(`${f.name} attached — it will publish unaltered`); };
                      r.onerror = () => toast("Could not read that PDF");
                      r.readAsDataURL(f);
                      e.target.value = "";
                    }} />
                  </label>
                </div>
                <div>
                  <label className={lbl}>Schedule date</label>
                  <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className={inp} />
                </div>
                {kind === "case" && (
                  <div className="space-y-2.5 border-t border-forest-800 pt-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ember-300">Structured case summary</p>
                    {([["presenting", "Presenting complaint"], ["history", "History"], ["examination", "Examination (nadi, tongue…)"], ["intervention", "Intervention"], ["outcome", "Outcome"]] as const).map(([k, l]) => (
                      <div key={k}><label className={lbl}>{l}</label><textarea value={caseMeta[k]} onChange={(e) => setCaseMeta({ ...caseMeta, [k]: e.target.value })} rows={2} className={inp} /></div>
                    ))}
                  </div>
                )}
                {kind === "research" && (
                  <div className="space-y-2.5 border-t border-forest-800 pt-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-steel-300">Structured abstract</p>
                    {([["objective", "Objective"], ["method", "Method"], ["findings", "Findings"], ["conclusion", "Conclusion"], ["citations", "Key citations"]] as const).map(([k, l]) => (
                      <div key={k}><label className={lbl}>{l}</label><textarea value={researchMeta[k]} onChange={(e) => setResearchMeta({ ...researchMeta, [k]: e.target.value })} rows={2} className={inp} /></div>
                    ))}
                  </div>
                )}
                <div className="border-t border-forest-800 pt-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/40">{words.toLocaleString()} words · ~{readMin} min read</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/40">{toc.length} outline heading{toc.length === 1 ? "" : "s"}</p>
                </div>
              </aside>
            )}
          </div>
        )}
      </main>

      <AnimatePresence>
        {membersOpen && isSuper && <MembersModal onClose={() => setMembersOpen(false)} />}
        {settingsOpen && isSuper && <SettingsModal onClose={() => setSettingsOpen(false)} />}
        {activityOpen && <ActivityDrawer entries={activity} onClose={() => setActivityOpen(false)} />}
        {imgOpen && <ImageInsertModal onInsert={(h) => exec("insertHTML", h)} onClose={() => setImgOpen(false)} />}
        {videoOpen && <VideoInsertModal onInsert={(h) => exec("insertHTML", h)} onClose={() => setVideoOpen(false)} />}
        {importOpen && <ImportModal onClose={() => setImportOpen(false)}
          onCreate={(r) => {
            const a: Article = {
              id: `user-${Date.now()}`, slug: r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48) || "imported",
              title: r.title, subtitle: "Imported manuscript", summary: r.bodyHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180),
              cover: COVER_CHOICES[0].src, categoryId: "dravyaguna", doshas: ["vata"], authorId,
              date: new Date().toISOString().slice(0, 10), views: 0, symptoms: [], kind: "blog", blocks: [],
              html: r.bodyHtml, status: "draft",
            };
            saveDraft(a); openPost(a.id); setImportOpen(false);
            toast(`Imported — ${r.stats.words} words structured into a draft`);
          }}
          onAsIs={(r) => {
            const a: Article = {
              id: `user-${Date.now()}`, slug: r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48) || "imported-pdf",
              title: r.title, subtitle: "Imported manuscript", summary: `${r.fileName} — shared exactly as received.`,
              cover: COVER_CHOICES[0].src, categoryId: "dravyaguna", doshas: ["vata"], authorId,
              date: new Date().toISOString().slice(0, 10), views: 0, symptoms: [], kind: "blog", blocks: [],
              html: `<p><em>This document is published exactly as received — no edits, no alterations.</em></p>`,
              pdfUrl: r.pdfDataUrl, pdfName: r.fileName, status: "draft",
            };
            saveDraft(a); openPost(a.id); setImportOpen(false);
            toast("PDF attached as-is — add a note above if you like, then publish");
          }} />}
      </AnimatePresence>
      <span className="hidden"><Search size={0} /><RefreshIcon size={0} /></span>
    </div>
  );
}

/* ------------------------------ store operations ----------------------------- */

function Toggle({ on, onToggle, label = true }: { on: boolean; onToggle: () => void; label?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {label && <span className={`font-mono text-[8.5px] uppercase tracking-[0.12em] ${on ? "text-[#a9cfbf]" : "text-sand-200/40"}`}>{on ? "Live" : "Hidden"}</span>}
      <button role="switch" aria-checked={on} onClick={onToggle}
        className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-[#5f947e]" : "bg-forest-700"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-sand-100 shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function StoreOps({ isSuper, onOpenConsole }: { isSuper: boolean; onOpenConsole: () => void }) {
  const { products, saveProduct, orders, toast, logActivity } = useApp();
  const lowStock = products.filter((p) => p.stock < 5).length;
  const newOrders = orders.filter((o) => o.status === "new").length;
  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  return (
    <div className="rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Store · quick controls</p>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-sand-200/55">
            Flip visibility and watch stock here. The full order pipeline, invoices and product editor live in the Admin Console.
          </p>
        </div>
        <button onClick={onOpenConsole} className="flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">
          <Shield size={14} /> Open Store Operations
        </button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {([["Revenue", `₹${revenue.toLocaleString("en-IN")}`, false], ["New orders", String(newOrders), newOrders > 0], ["Low stock", String(lowStock), lowStock > 0], ["Products", String(products.length), false]] as [string, string, boolean][]).map(([k, v, warn]) => (
          <div key={k} className={`rounded-xl border p-4 ${warn ? "border-ember-500/50 bg-ember-500/8" : "border-forest-800 bg-forest-850/60"}`}>
            <p className={`font-display text-2xl font-semibold ${warn ? "text-ember-300" : "text-gold-300"}`}>{v}</p>
            <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/45">{k}{warn ? " ⚠" : ""}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-3">
        {products.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-forest-800 bg-forest-850/50 p-3.5">
            <SmartImg src={p.image} alt={p.name} className="h-12 w-16 rounded-lg border border-forest-800 object-cover duotone" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sand-100">{p.name}</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/40">₹{p.price} · {p.stock} in stock{p.stock < 5 && p.stock > 0 ? " · low" : ""}{p.stock <= 0 ? " · out" : ""}</p>
            </div>
            <Toggle on={p.visible !== false} onToggle={() => {
              const next = { ...p, visible: p.visible === false };
              saveProduct(next);
              logActivity("store", next.visible ? `showed "${p.name}" in the store` : `hid "${p.name}" from the store`, p.name);
              toast(next.visible ? `${p.name} visible in store` : `${p.name} hidden from store`);
            }} />
          </div>
        ))}
      </div>
      {!isSuper && <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/35">Full order management needs the Admin Console (superadmin).</p>}
    </div>
  );
}
