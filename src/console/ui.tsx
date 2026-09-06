/* =============================================================================
   Vaidyagan Admin Console — shared UI primitives
   (Skeleton, EmptyState, ErrorState, StatCard, StatusBadge, ConfirmChip)
   ========================================================================== */

import React, { useEffect, useState } from "react";
import { ORDER_META, type OrderStatus } from "../data";
import { RefreshIcon, Search, Trash } from "../icons";

/* --------------------------------- skeleton --------------------------------- */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer animate-pulse rounded-lg bg-forest-800/80 ${className}`} aria-hidden />;
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-forest-800 bg-forest-850/40 p-4">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- empty state ------------------------------- */

export function EmptyState({
  title, body, action, onAction,
}: { title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-forest-700 px-6 py-14 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-forest-700 bg-forest-850 text-sand-200/40">
        <Search size={22} />
      </span>
      <p className="mt-4 font-display text-xl font-semibold text-sand-100">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-sand-200/50">{body}</p>
      {action && onAction && (
        <button onClick={onAction} className="mt-5 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-gold-300">
          {action}
        </button>
      )}
    </div>
  );
}

/* -------------------------------- error state ------------------------------- */

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-ember-500/40 bg-ember-500/6 px-6 py-12 text-center" role="alert">
      <p className="font-display text-xl font-semibold text-ember-300">Couldn't reach the database</p>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-sand-200/60">{message}</p>
      <button onClick={onRetry} className="mt-5 inline-flex items-center gap-2 rounded-full border border-ember-500/50 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ember-300 transition-all hover:bg-ember-500/15">
        <RefreshIcon size={13} /> Retry
      </button>
    </div>
  );
}

/* --------------------------------- stat card -------------------------------- */

export function StatCard({
  label, value, sub, Icon, tone = "default", delay = 0,
}: {
  label: string; value: string; sub: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tone?: "default" | "ember" | "moss"; delay?: number;
}) {
  return (
    <div
      className="animate-rise group rounded-2xl border border-forest-800 bg-forest-900/70 p-5 transition-all hover:-translate-y-0.5 hover:border-gold-500/40"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-sand-200/45">{label}</p>
        <Icon size={16} className="text-gold-400/70 transition-transform group-hover:scale-110" />
      </div>
      <p className={`mt-3 font-display text-[2.1rem] font-semibold leading-none ${tone === "ember" ? "text-ember-300" : tone === "moss" ? "text-[#a9cfbf]" : "text-sand-100"}`}>
        {value}
      </p>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/40">{sub}</p>
    </div>
  );
}

/* -------------------------------- status badge ------------------------------ */

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m = ORDER_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.12em]"
      style={{ borderColor: `${m.color}55`, color: m.color, background: `${m.color}12` }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  );
}

/* -------------------------------- confirm chip ------------------------------ */

/** Two-tap destructive confirm: first tap arms it, second tap fires. Auto-disarms. */
export function ConfirmChip({
  onConfirm, label = "Delete", ariaLabel,
}: { onConfirm: () => void; label?: string; ariaLabel?: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 3200);
    return () => window.clearTimeout(t);
  }, [armed]);
  if (armed) {
    return (
      <button
        onClick={() => { setArmed(false); onConfirm(); }}
        onMouseLeave={() => setArmed(false)}
        className="animate-rise flex h-9 items-center gap-1.5 rounded-full bg-ember-400 px-3.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-forest-950 shadow-[0_4px_16px_rgba(201,100,48,0.4)]"
        title="Click again to confirm"
      >
        <Trash size={12} /> Sure?
      </button>
    );
  }
  return (
    <button
      onClick={() => setArmed(true)}
      aria-label={ariaLabel ?? label}
      className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200/55 transition-all hover:scale-105 hover:border-ember-400 hover:bg-ember-500/15 hover:text-ember-300"
    >
      <Trash size={15} />
    </button>
  );
}
