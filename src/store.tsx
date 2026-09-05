import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Plus, Minus, ShoppingBag, Star, ShieldCheck, BadgeCheck, Lock, X, Truck } from "lucide-react";
import { useApp, Reveal, SectionHead, SmartImg, Stars, Chip } from "./lib";
import { FREE_SHIP_AT, type Product } from "./data";

const CATEGORIES_FILTER = ["All", "Oils", "Churnas", "Capsules", "Ghritas", "Kadhas"];

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <span className="rounded-full border border-forest-600 bg-forest-800 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/50">Out of stock</span>;
  if (stock < 5) return <span className="rounded-full border border-ember-500/50 bg-ember-500/12 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ember-300">Only {stock} left</span>;
  return <span className="rounded-full border border-kapha-500/50 bg-kapha-500/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-kapha-300">In stock</span>;
}

/* --------------------------------- listing ---------------------------------- */

export function Store() {
  const { products, navigate, addToCart, toast, storeEnabled } = useApp();
  const [cat, setCat] = useState<string>("All");
  const visible = products.filter((p) => p.visible !== false);
  const results = useMemo(() => visible.filter((p) => cat === "All" || p.category === cat), [visible, cat]);

  if (!storeEnabled) {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-40 text-center lg:px-8">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-gold-500/40 bg-gold-400/8 text-gold-300"><Lock size={30} /></span>
        <h1 className="mt-8 font-display text-4xl font-semibold text-sand-100">Coming soon</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-sand-200/60">Our Ayurvedic store is under construction — the vaidyas are batch-checking every formulation before it reaches your doorstep.</p>
        <button onClick={() => navigate({ name: "home" })} className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold-500/50 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-gold-300 hover:bg-gold-400 hover:text-forest-950"><ArrowLeft size={14} /> Back to home</button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px]" style={{ background: "radial-gradient(55% 90% at 50% 0%, rgba(214,180,95,0.08), transparent 70%)" }} />
      <div className="relative">
        <SectionHead eyebrow="The formulation store" title={<>Classical remedies, <em className="text-gold-300">batch-checked</em>.</>}
          sub="Every product is made to a classical reference, tested per batch, and packed with a vaidya's note. Free shipping over ₹{FREE_SHIP_AT}." />
        <Reveal delay={140} className="mt-10 flex flex-wrap items-center gap-2">
          {CATEGORIES_FILTER.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
          <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.18em] text-sand-200/40">{results.length} formulation{results.length === 1 ? "" : "s"}</span>
        </Reveal>

        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 90}>
              <div className="card-lift group flex h-full flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-900 hover:border-gold-500/50">
                <button onClick={() => navigate({ name: "product", id: p.id })} className="relative block aspect-square w-full overflow-hidden text-left">
                  <div className="gold-sheen h-full w-full">
                    <SmartImg src={p.image} alt={p.name} className="h-full w-full object-cover duotone transition-transform duration-700 group-hover:scale-[1.06]" style={p.duotone ? { filter: p.duotone } : undefined} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-forest-950/10" />
                  <span className="absolute left-4 top-4 rounded-full border border-gold-500/50 bg-forest-950/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 backdrop-blur">{p.badge}</span>
                  <span className="absolute right-4 top-4"><StockBadge stock={p.stock} /></span>
                  <span className="absolute bottom-3 right-4 font-display text-4xl italic text-sand-100/15">{p.sanskrit.slice(0, 4)}</span>
                </button>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <button onClick={() => navigate({ name: "product", id: p.id })} className="text-left">
                      <p className="font-display text-lg font-semibold leading-snug text-sand-100 transition-colors group-hover:text-gold-300">{p.name}</p>
                      <p className="mt-0.5 font-mono text-[10px] italic text-sand-200/45">{p.sanskrit}</p>
                    </button>
                    <Stars rating={p.rating} size={11} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-sand-200/60">{p.desc}</p>
                  <div className="mt-auto flex items-center justify-between pt-5">
                    <div>
                      <p className="font-display text-xl font-semibold text-gold-300">₹{p.price}</p>
                      <p className="font-mono text-[10px] text-sand-200/40 line-through">₹{p.mrp}</p>
                    </div>
                    <button onClick={() => { addToCart(p.id); toast(`${p.name} added to basket`); }} disabled={p.stock <= 0}
                      className="gold-sheen flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-gold-300 disabled:opacity-40">
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        {results.length === 0 && (
          <Reveal className="mt-10 rounded-xl border border-dashed border-forest-700 p-14 text-center">
            <p className="font-display text-2xl text-sand-200/80">Nothing in this shelf yet.</p>
            <button onClick={() => setCat("All")} className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-gold-400 hover:text-gold-300">Show everything</button>
          </Reveal>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- product detail ------------------------------ */

export function ProductDetail({ id }: { id: string }) {
  const { products, navigate, addToCart, setCartOpen, toast, storeEnabled } = useApp();
  const product = products.find((p) => p.id === id);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"desc" | "ingredients" | "directions" | "safety">("desc");

  useEffect(() => setQty(1), [id]);

  if (!storeEnabled || !product) {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-40 text-center lg:px-8">
        <p className="font-display text-2xl text-sand-200/80">This formulation isn't available right now.</p>
        <button onClick={() => navigate({ name: "store" })} className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold-500/50 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-gold-300 hover:bg-gold-400 hover:text-forest-950"><ArrowLeft size={14} /> Back to the store</button>
      </div>
    );
  }

  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const related = products.filter((p) => p.id !== product.id && p.visible !== false && p.category === product.category).slice(0, 3);
  const fallbackRelated = related.length ? related : products.filter((p) => p.id !== product.id && p.visible !== false).slice(0, 3);

  const buyNow = () => {
    addToCart(product.id, qty);
    setCartOpen(true);
    toast("Added — complete checkout in your basket");
  };

  const tabs = [
    { k: "desc", label: "Description" },
    { k: "ingredients", label: "Ingredients" },
    { k: "directions", label: "Directions" },
    { k: "safety", label: "Safety" },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <button onClick={() => navigate({ name: "store" })} className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-sand-200/50 transition-colors hover:text-gold-300"><ArrowLeft size={14} /> The store</button>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1fr]">
        {/* image */}
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-forest-800">
            <div className="animate-kenburns">
              <SmartImg src={product.image} alt={product.name} className="aspect-square w-full object-cover duotone" style={product.duotone ? { filter: product.duotone } : undefined} />
            </div>
            <span className="absolute left-5 top-5 rounded-full border border-gold-500/50 bg-forest-950/70 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 backdrop-blur">{product.badge}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {([["Shelf-tested", "per batch"], ["GMP unit", "certified"], ["Vaidya note", "in every box"]] as [string, string][]).map(([a, b]) => (
              <div key={a} className="rounded-xl border border-forest-800 bg-forest-900/60 p-3 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-gold-300">{a}</p>
                <p className="mt-0.5 text-[11px] text-sand-200/55">{b}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* buy box */}
        <Reveal delay={120}>
          <p className="font-display text-lg italic text-sand-200/50">{product.sanskrit}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-sand-100 sm:text-4xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <Stars rating={product.rating} />
            <span className="font-mono text-[11px] text-sand-200/55">{product.rating.toFixed(1)} · clinically referenced</span>
          </div>
          <div className="mt-5 flex items-baseline gap-3">
            <p className="font-display text-4xl font-semibold text-gold-300">₹{product.price}</p>
            <p className="font-mono text-sm text-sand-200/40 line-through">₹{product.mrp}</p>
            <span className="rounded-full bg-kapha-500/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-kapha-300">{off}% off</span>
          </div>
          <div className="mt-3"><StockBadge stock={product.stock} /></div>

          {product.highlights && product.highlights.length > 0 && (
            <ul className="mt-5 space-y-2">
              {product.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-[13.5px] leading-relaxed text-sand-200/75"><Check size={15} className="mt-0.5 shrink-0 text-kapha-400" />{h}</li>
              ))}
            </ul>
          )}
          {product.source && <p className="mt-4 border-l-2 border-gold-500/50 pl-4 font-display text-[14px] italic text-sand-200/60">Source — {product.source}</p>}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-forest-700 px-2 py-1">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity" className="grid h-8 w-8 place-items-center rounded-full text-sand-200/70 hover:text-gold-300"><Minus size={14} /></button>
              <span className="w-6 text-center font-mono text-sm text-sand-100">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock || 99, qty + 1))} aria-label="Increase quantity" className="grid h-8 w-8 place-items-center rounded-full text-sand-200/70 hover:text-gold-300"><Plus size={14} /></button>
            </div>
            <button onClick={() => { addToCart(product.id, qty); toast(`${product.name} added to basket`); }} disabled={product.stock <= 0}
              className="flex items-center gap-2 rounded-full border border-gold-500/60 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-gold-300 transition-all hover:bg-gold-400/10 disabled:opacity-40">
              <ShoppingBag size={15} /> Add to cart
            </button>
            <button onClick={buyNow} disabled={product.stock <= 0}
              className="gold-sheen flex items-center gap-2 rounded-full bg-gold-400 px-7 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-gold-300 disabled:opacity-40">
              Buy now <ArrowRight size={14} />
            </button>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-forest-800 pt-6">
            {([[ShieldCheck, "100% Ayurvedic"], [BadgeCheck, "GMP Certified"], [Lock, "Secure Payments"]] as [any, string][]).map(([Icon, label]) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <Icon size={20} className="text-gold-400" />
                <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-sand-200/55">{label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* tabbed detail */}
      <Reveal className="mt-16">
        <div className="flex flex-wrap gap-2 border-b border-forest-800">
          {tabs.map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`rounded-t-xl border border-b-0 px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-all ${tab === t.k ? "border-gold-500/50 bg-forest-900 text-gold-300" : "border-forest-800 bg-forest-900/40 text-sand-200/50 hover:text-sand-100"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/60 p-7 sm:p-9">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {tab === "desc" && <p className="max-w-3xl text-[15px] leading-relaxed text-sand-200/80">{product.desc}</p>}
              {tab === "ingredients" && (
                <ul className="grid max-w-3xl gap-3 sm:grid-cols-2">
                  {product.ingredients.map((ing) => <li key={ing} className="flex gap-3 rounded-lg border border-forest-800 bg-forest-850/50 px-4 py-3 text-[13.5px] text-sand-200/75"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold-400" />{ing}</li>)}
                </ul>
              )}
              {tab === "directions" && (
                <div className="max-w-3xl space-y-4">
                  <p className="text-[15px] leading-relaxed text-sand-200/80">{product.directions ?? product.dosage}</p>
                  <p className="rounded-lg border border-steel-400/30 bg-steel-400/6 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-steel-300">Standard dose — {product.dosage}</p>
                </div>
              )}
              {tab === "safety" && (
                <div className="max-w-3xl rounded-xl border border-ember-500/30 bg-ember-500/6 p-5">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ember-300">Safety information</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-sand-200/75">{product.safety ?? "Keep out of reach of children. Consult a physician before use, especially if pregnant, nursing or on medication."}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </Reveal>

      {/* related */}
      {fallbackRelated.length > 0 && (
        <Reveal className="mt-16">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.3em] text-gold-400">From the same shelf</p>
          <div className="mt-6 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {fallbackRelated.map((p) => (
              <button key={p.id} onClick={() => navigate({ name: "product", id: p.id })} className="card-lift group flex gap-4 rounded-xl border border-forest-800 bg-forest-900 p-4 text-left hover:border-gold-500/50">
                <SmartImg src={p.image} alt={p.name} className="h-24 w-24 shrink-0 rounded-lg object-cover duotone" style={p.duotone ? { filter: p.duotone } : undefined} />
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-semibold text-sand-100 group-hover:text-gold-300">{p.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] italic text-sand-200/45">{p.category}</p>
                  <p className="mt-2 font-display text-lg font-semibold text-gold-300">₹{p.price}</p>
                </div>
              </button>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
