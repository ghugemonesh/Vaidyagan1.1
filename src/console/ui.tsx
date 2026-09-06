/* =============================================================================
   Vaidyagan Admin Console — shared component kit
   Skeleton · EmptyState · ErrorState · StatCard · StatusBadge · Switch ·
   ConfirmChip · Drawer (portal-ized) · DataTable
   ========================================================================== */

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { ORDER_META, type OrderStatus } from "../data";
import { Check, Close, RefreshIcon, Search, Trash } from "../icons";

/* --------------------------------- skeleton --------------------------------- */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-forest-800/80 ${className}`} aria-hidden />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-label="Loading" role="status">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-forest-800 bg-forest-900/50 p-4">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ empty & error ------------------------------- */

export function EmptyState({ icon, title, body, actionLabel, onAction }: {
  icon?: React.ReactNode; title: string; body: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-forest-700 p-12 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-forest-700 bg-forest-900 text-gold-400/60">
        {icon ?? <Search size={22} />}
      </span>
      <p className="mt-4 font-display text-xl text-sand-200/80">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-sand-200/45">{body}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-5 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-gold-300">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ body, onRetry }: { body?: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-ember-500/35 bg-ember-500/6 p-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-ember-500/40 text-ember-300"><Close size={20} /></span>
      <p className="mt-4 font-display text-lg text-sand-100">Something didn't load</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-sand-200/55">{body ?? "The connection hiccuped. Your data is safe — try again."}</p>
      <button onClick={onRetry} className="mt-5 inline-flex items-center gap-2 rounded-full border border-ember-500/50 px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ember-300 transition-all hover:bg-ember-500/15">
        <RefreshIcon size={13} /> Retry
      </button>
    </div>
  );
}

/* --------------------------------- stat card -------------------------------- */

export function StatCard({ label, value, sub, icon, tone, delay = 0 }: {
  label: string; value: string; sub?: string; icon?: React.ReactNode;
  tone?: "gold" | "ember" | "moss"; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-forest-800 bg-forest-900/70 p-5 transition-all hover:-translate-y-0.5 hover:border-gold-500/40">
      <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.06] transition-opacity group-hover:opacity-[0.12]"
        style={{ background: tone === "ember" ? "#e07f49" : tone === "moss" ? "#82b39e" : "#d6b45f" }} />
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-sand-200/45">{label}</p>
        {icon && <span className="text-gold-400/70 transition-transform group-hover:scale-110">{icon}</span>}
      </div>
      <p className={`mt-3 font-display text-[2.1rem] font-semibold leading-none ${tone === "ember" ? "text-ember-300" : "text-sand-100"}`}>{value}</p>
      {sub && <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/40">{sub}</p>}
    </motion.div>
  );
}

/* -------------------------------- status badge ------------------------------ */

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m = (ORDER_META as Record<string, { label: string; color: string }>)[status];
  if (!m) return <span className="rounded-full border border-steel-400/40 bg-steel-400/10 px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-steel-300">Unknown</span>;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.12em]"
      style={{ borderColor: `${m.color}55`, color: m.color, background: `${m.color}12` }}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  );
}

/* ---------------------------------- switch ---------------------------------- */

export function Switch({ on, onChange, disabled, label, desc }: {
  on: boolean; onChange: (b: boolean) => void; disabled?: boolean; label: string; desc?: string;
}) {
  return (
    <button role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-3.5 text-left transition-all duration-300 ${disabled ? "cursor-not-allowed opacity-50" : ""} ${
        on ? "border-[#5f947e]/50 bg-[#5f947e]/8" : "border-forest-700 bg-forest-950/40 hover:border-forest-600"
      }`}>
      <span className="min-w-0">
        <span className={`block text-[13.5px] font-semibold ${on ? "text-sand-100" : "text-sand-200/70"}`}>{label}</span>
        {desc && <span className="mt-0.5 block text-[11.5px] leading-snug text-sand-200/45">{desc}</span>}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-[#5f947e]" : "bg-forest-700"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-sand-100 shadow transition-all duration-300 ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

/* -------------------------------- confirm chip ------------------------------ */

/** Two-tap destructive control: first tap arms "Sure?", second tap fires. */
export function ConfirmChip({ onConfirm, label = "Delete", armedLabel = "Sure?", timeout = 3200 }: {
  onConfirm: () => void; label?: string; armedLabel?: string; timeout?: number;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), timeout);
    return () => window.clearTimeout(t);
  }, [armed, timeout]);
  return armed ? (
    <button onClick={() => { setArmed(false); onConfirm(); }}
      className="animate-rise flex items-center gap-1.5 rounded-full bg-ember-400 px-3.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-forest-950 shadow-[0_4px_16px_rgba(224,127,73,0.4)]">
      <Trash size={11} /> {armedLabel}
    </button>
  ) : (
    <button onClick={() => setArmed(true)} aria-label={label}
      className="flex items-center gap-1.5 rounded-full border border-forest-700 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/55 transition-all hover:border-ember-400 hover:text-ember-300">
      <Trash size={11} /> {label}
    </button>
  );
}

/* ---------------------------------- drawer ---------------------------------- */

/** Slide-over panel. Portaled to <body> so no ancestor transform/filter can
 *  misplace it — it always docks to the viewport edge. */
export function Drawer({ open, onClose, title, subtitle, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-forest-950/70 backdrop-blur-sm" onClick={onClose}>
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}
            className={`fixed inset-y-0 right-0 flex w-full flex-col overflow-y-auto border-l border-forest-800 bg-forest-900 p-6 ${wide ? "sm:max-w-xl" : "sm:max-w-md"}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">{subtitle ?? "Details"}</p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-sand-100">{title}</h3>
              </div>
              <button onClick={onClose} aria-label="Close panel" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 transition-colors hover:text-gold-300"><Close size={15} /></button>
            </div>
            <div className="mt-5">{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* --------------------------------- data table ------------------------------- */

/** Responsive table: real table on md+, stacked cards on mobile. */
export function DataTable<T>({ columns, rows, rowKey, render, onRow, empty }: {
  columns: { key: string; label: string; align?: "left" | "right"; hideOnMobile?: boolean }[];
  rows: T[];
  rowKey: (r: T) => string;
  render: (r: T, col: string) => React.ReactNode;
  onRow?: (r: T) => void;
  empty?: React.ReactNode;
}) {
  if (rows.length === 0) return <>{empty ?? <EmptyState title="Nothing here yet" body="Items will appear as soon as there is activity." />}</>;
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-forest-800 md:block">
        <div className="grid items-center gap-3 border-b border-forest-800 bg-forest-900/80 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/45"
          style={{ gridTemplateColumns: columns.map((c) => (c.align === "right" ? "0.6fr" : "1fr")).join(" ") }}>
          {columns.map((c) => <span key={c.key} className={c.align === "right" ? "text-right" : ""}>{c.label}</span>)}
        </div>
        {rows.map((r) => (
          <div key={rowKey(r)} onClick={() => onRow?.(r)}
            className={`grid items-center gap-3 border-b border-forest-800 bg-forest-900/50 px-5 py-3.5 transition-colors last:border-0 hover:bg-forest-850 ${onRow ? "cursor-pointer" : ""}`}
            style={{ gridTemplateColumns: columns.map((c) => (c.align === "right" ? "0.6fr" : "1fr")).join(" ") }}>
            {columns.map((c) => <div key={c.key} className={`min-w-0 ${c.align === "right" ? "text-right" : ""}`}>{render(r, c.key)}</div>)}
          </div>
        ))}
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <button key={rowKey(r)} onClick={() => onRow?.(r)} className="block w-full rounded-2xl border border-forest-800 bg-forest-900/60 p-4 text-left transition-colors hover:border-gold-500/40">
            {columns.filter((c) => !c.hideOnMobile).map((c) => (
              <div key={c.key} className="mb-2 last:mb-0">{render(r, c.key)}</div>
            ))}
          </button>
        ))}
      </div>
    </>
  );
}

/* --------------------------------- misc bits -------------------------------- */

export const cInp = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
export const cLbl = "mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80";

export function timeAgo(iso: string): string {
  try {
    const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch { return "—"; }
}

export { Check };
