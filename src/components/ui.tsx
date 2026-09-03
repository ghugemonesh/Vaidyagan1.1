/* =============================================================================
   Vaidyagan — shared console UI primitives
   (lucide-react icons · framer-motion transitions · dark forest/gold theme)
   ========================================================================== */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, Inbox, Search, X } from "lucide-react";

/* ---------------------------------- Toasts -------------------------------- */

interface ToastItem { id: number; msg: string; tone: "ok" | "warn" }
const ToastCtx = createContext<(msg: string, tone?: "ok" | "warn") => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((msg: string, tone: "ok" | "warn" = "ok") => {
    const id = Date.now() + Math.random();
    setItems((t) => [...t, { id, msg, tone }]);
    window.setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[90] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              className={`flex items-center gap-2.5 rounded-full border px-5 py-3 text-sm shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur ${
                t.tone === "ok" ? "border-gold-500/40 bg-forest-900/95 text-sand-100" : "border-ember-500/50 bg-forest-900/95 text-ember-300"
              }`}
            >
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${t.tone === "ok" ? "bg-gold-400 text-forest-950" : "bg-ember-500 text-forest-950"}`}>
                {t.tone === "ok" ? <Check size={11} strokeWidth={3} /> : <AlertTriangle size={11} strokeWidth={3} />}
              </span>
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------------------------- Badge --------------------------------- */

export function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em]"
      style={{ borderColor: `${color}55`, color, background: `${color}14` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

/* ---------------------------------- Toggle -------------------------------- */

export function Toggle({ on, onChange, label, disabled }: { on: boolean; onChange: (b: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-gold-500" : "bg-forest-600"} ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-sand-100 shadow transition-all duration-300 ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

/* --------------------------------- StatCard -------------------------------- */

export function StatCard({ label, value, sub, icon, accent = "#d6b45f", onClick }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; accent?: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border border-forest-700/70 bg-forest-900/70 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-500/50 hover:shadow-[0_18px_50px_rgba(0,0,0,0.4)] ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <span className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.07] blur-2xl" style={{ background: accent }} />
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-sand-200/50">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ color: accent, background: `${accent}14`, border: `1px solid ${accent}33` }}>
          {icon}
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold leading-none text-sand-100">{value}</p>
      {sub && <p className="mt-2 text-[11.5px] text-sand-200/45">{sub}</p>}
    </button>
  );
}

/* ---------------------------------- Drawer --------------------------------- */

export function Drawer({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-forest-950/70 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* slide-over on md+, full-screen bottom sheet on mobile */}
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col border-l border-forest-700 bg-forest-900 max-md:inset-x-0 max-md:inset-y-auto max-md:bottom-0 max-md:max-h-[88vh] max-md:max-w-none max-md:rounded-t-2xl max-md:border-t"
            role="dialog" aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-forest-800 px-5 py-4">
              <div className="font-display text-lg font-semibold text-sand-100">{title}</div>
              <button onClick={onClose} aria-label="Close panel" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-colors hover:border-gold-400 hover:text-gold-300">
                <X size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="border-t border-forest-800 px-5 py-4">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------- ConfirmDialog ------------------------------ */

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = "Confirm", danger = true }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText?: string; danger?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-forest-950/75 p-4 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-forest-700 bg-forest-900 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
            role="alertdialog" aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${danger ? "bg-ember-500/15 text-ember-400" : "bg-gold-400/15 text-gold-300"}`}>
                <AlertTriangle size={18} />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-sand-100">{title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-sand-200/60">{message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button onClick={onClose} className="rounded-full border border-forest-600 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/70 transition-colors hover:text-sand-100">
                Cancel
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={`rounded-full px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-transform active:scale-95 ${danger ? "bg-ember-400 hover:bg-ember-300" : "bg-gold-400 hover:bg-gold-300"}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------- EmptyState ------------------------------- */

export function EmptyState({ title, hint, action, icon }: { title: string; hint?: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-forest-600 bg-forest-900/40 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-forest-600 bg-forest-850 text-gold-400/70">
        {icon ?? <Inbox size={22} />}
      </span>
      <p className="mt-4 font-display text-lg font-semibold text-sand-100">{title}</p>
      {hint && <p className="mt-1.5 max-w-sm text-[13px] text-sand-200/50">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* --------------------------------- Skeleton -------------------------------- */

export function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-forest-800/60" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

/* -------------------------------- Form fields ------------------------------ */

export const fieldCls =
  "w-full rounded-lg border border-forest-600 bg-forest-950/60 px-3.5 py-2.5 text-[13.5px] text-sand-100 placeholder:text-sand-200/25 transition-colors focus:border-gold-400 focus:outline-none";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-gold-400/80">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-sand-200/40">{hint}</span>}
    </label>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400/70" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${fieldCls} pl-10`} aria-label={placeholder} />
    </div>
  );
}

/* -------------------------------- ProductTile ------------------------------ */

export function ProductTile({ accent, name, size = 44 }: { accent: string; name: string; size?: number }) {
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <span
      className="grid shrink-0 place-items-center rounded-lg font-display font-semibold text-forest-950"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
        border: `1px solid ${accent}66`,
        fontSize: size * 0.32,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/* -------------------------------- SectionHead ------------------------------ */

export function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold leading-tight text-sand-100">{title}</h1>
        {sub && <p className="mt-1 text-[13px] text-sand-200/50">{sub}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}
