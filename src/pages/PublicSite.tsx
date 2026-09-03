/* =============================================================================
   Vaidyagan — public storefront landing
   A compact, crafted public face for the brand that links into the Admin
   Console. Product data is shared with the console's demo store.
   ========================================================================== */

import React from "react";
import { Link } from "react-router-dom";
import { Leaf, ShieldCheck, ArrowRight, Star, Sparkles, FlaskConical, Truck } from "lucide-react";
import { listProducts, getSettings, inr, useDb } from "../lib/data";
import { ProductTile } from "../components/ui";

const DOSHAS = [
  { name: "Vata", sa: "वात", color: "#93b1cf", note: "air · movement" },
  { name: "Pitta", sa: "पित्त", color: "#e07f49", note: "fire · metabolism" },
  { name: "Kapha", sa: "कफ", color: "#7fa07f", note: "earth · structure" },
];

export default function PublicSite() {
  useDb();
  const products = listProducts().filter((p) => p.isVisible).slice(0, 4);
  const settings = getSettings();

  return (
    <div className="min-h-screen bg-forest-950">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-forest-800 bg-forest-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-gold-500/40 bg-gold-400/10 text-gold-300"><Leaf size={17} /></span>
            <div>
              <p className="font-display text-lg font-semibold leading-none text-sand-100">Vaidyagan</p>
              <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.24em] text-gold-400/70">आयुर्वेद · clinically verified</p>
            </div>
          </div>
          <Link to="/admin"
            className="group flex items-center gap-2 rounded-full bg-gold-400 px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-gold-300 hover:shadow-[0_0_24px_rgba(214,180,95,0.35)]">
            Admin Console <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      {settings.maintenanceMode && (
        <div className="border-b border-ember-500/40 bg-ember-500/8 px-4 py-2.5 text-center text-[12.5px] text-ember-300">
          We're briefly under maintenance — the shelves will be back shortly.
        </div>
      )}

      {/* opening — asymmetric, characteristic */}
      <section className="ops-grid relative overflow-hidden border-b border-forest-800">
        <span aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-gold-500/8 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-48 -left-40 h-[28rem] w-[28rem] rounded-full bg-moss-500/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-gold-400/80">
              <Sparkles size={13} /> Knowledge is medicine
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] text-sand-100 sm:text-5xl lg:text-6xl">
              Classical Ayurveda,
              <span className="block italic text-gold-300">verified like medicine.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-sand-200/60">
              Every formulation is sourced from the classical texts, batch-tested, and signed off by
              registered vaidyas — then managed through a no-code console your whole team can run.
            </p>

            {/* dosha chips */}
            <div className="mt-8 flex flex-wrap gap-3">
              {DOSHAS.map((d) => (
                <div key={d.name} className="flex items-center gap-2.5 rounded-full border border-forest-700 bg-forest-900/70 py-2 pl-2 pr-4 transition-colors hover:border-gold-500/50">
                  <span className="grid h-8 w-8 place-items-center rounded-full font-display text-[13px] font-semibold" style={{ background: `${d.color}16`, color: d.color, border: `1px solid ${d.color}44` }}>{d.sa}</span>
                  <span>
                    <span className="block text-[12.5px] font-semibold leading-none text-sand-100">{d.name}</span>
                    <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.12em] text-sand-200/40">{d.note}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#formulations" className="group flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 hover:shadow-[0_0_28px_rgba(214,180,95,0.35)]">
                Browse formulations <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <Link to="/admin" className="rounded-full border border-forest-600 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-sand-200/70 transition-colors hover:border-gold-400 hover:text-gold-300">
                Run the console
              </Link>
            </div>
          </div>

          {/* trust panel */}
          <div className="rounded-2xl border border-forest-700 bg-forest-900/70 p-6 backdrop-blur">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-gold-400/80">Why Vaidyagan</p>
            <div className="mt-4 space-y-4">
              {[
                { icon: <ShieldCheck size={17} />, t: "Clinically verified", d: "Every batch signed off by a registered BAMS vaidya." },
                { icon: <FlaskConical size={17} />, t: "Classical, not cosmetic", d: "Ratios and processes taken from the source texts." },
                { icon: <Truck size={17} />, t: "Managed without code", d: "Orders, stock and staff run from one visual console." },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold-500/30 bg-gold-400/8 text-gold-300">{f.icon}</span>
                  <div>
                    <p className="text-[14px] font-semibold text-sand-100">{f.t}</p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-sand-200/50">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* formulations */}
      <section id="formulations" className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-gold-400/80">The shelf</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-sand-100">Formulations in store</h2>
          </div>
          <Link to="/admin" className="hidden items-center gap-1.5 text-[12.5px] text-gold-300 hover:underline sm:flex">
            Manage in console <ArrowRight size={13} />
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="rounded-xl border border-dashed border-forest-600 px-6 py-14 text-center text-[13.5px] text-sand-200/45">
            The shelf is empty — add products from the Admin Console.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <div key={p.id} className="group flex flex-col rounded-xl border border-forest-700/70 bg-forest-900/70 p-5 transition-all hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                <div className="flex items-center justify-between">
                  <ProductTile accent={p.accent} name={p.name} size={52} />
                  <span className="flex items-center gap-1 rounded-full border border-forest-600 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-gold-300">
                    <Star size={10} className="fill-current" /> 4.{(p.id.charCodeAt(p.id.length - 1) % 4) + 5}
                  </span>
                </div>
                <p className="mt-3.5 text-[14.5px] font-semibold leading-snug text-sand-100">{p.name}</p>
                <p className="font-display text-[12px] italic text-sand-200/40">{p.sanskrit}</p>
                <p className="mt-2 line-clamp-2 flex-1 text-[12px] leading-relaxed text-sand-200/55">{p.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-forest-800 pt-3.5">
                  <div>
                    <span className="font-display text-lg font-semibold text-gold-300">{inr(p.price)}</span>
                    {p.mrp > p.price && <span className="ml-1.5 text-[11px] text-sand-200/35 line-through">{inr(p.mrp)}</span>}
                  </div>
                  {p.stock === 0 ? <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ember-300">Out of stock</span>
                    : p.stock < 5 ? <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ember-300">Only {p.stock} left</span>
                    : <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-moss-300">In stock</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* footer */}
      <footer className="border-t border-forest-800 bg-forest-900/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:text-left lg:px-8">
          <div>
            <p className="font-display text-lg font-semibold text-sand-100">Vaidyagan</p>
            <p className="mt-0.5 text-[12px] text-sand-200/45">Ayurveda, clinically verified · {settings.contactEmail}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-sand-200/35">Free shipping over {inr(settings.freeShippingThreshold)}</span>
            <Link to="/admin" className="rounded-full border border-forest-600 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/60 transition-colors hover:border-gold-400 hover:text-gold-300">
              Admin Console
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
