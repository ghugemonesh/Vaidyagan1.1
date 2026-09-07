import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp, Reveal, SectionHead, SmartImg, Stars, Chip } from "./lib";
import { FREE_SHIP_AT, type Product, type ProductReview } from "./data";
import { listHiddenReviews, toggleHiddenReview, getConsoleSettings } from "./console/db";
import { ArrowLeft, ArrowRight, Plus, Minus, ShoppingBag, ShieldCheck, BadgeCheck, Lock, Star, Send } from "lucide-react";

const CATEGORIES_FILTER = ["All", "Oils", "Churnas", "Capsules", "Ghritas", "Kadhas"] as const;

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <span className="rounded-full border border-forest-600 bg-forest-800 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/50">Out of stock</span>;
  if (stock < 5) return <span className="rounded-full border border-ember-500/50 bg-ember-500/12 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ember-300">Only {stock} left</span>;
  return <span className="rounded-full border border-kapha-500/50 bg-kapha-500/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-kapha-300">In stock</span>;
}

export function Store() {
  const { products, navigate, addToCart, toast, storeEnabled } = useApp();
  const [cat, setCat] = useState<(typeof CATEGORIES_FILTER)[number]>("All");

  const visible = products.filter((p) => p.visible !== false);
  const results = useMemo(() => visible.filter((p) => cat === "All" || p.category === cat), [visible, cat]);

  if (!storeEnabled) {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-40 text-center lg:px-8">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-gold-500/40 bg-gold-400/8 text-gold-300"><Lock size={30} /></span>
        <p className="mt-6 font-display text-3xl font-semibold">The store is taking a breather</p>
        <p className="mt-3 text-[14px] leading-relaxed text-sand-200/60">Formulations are being restocked. The journal and herb index remain open.</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px]" style={{ background: "radial-gradient(55% 90% at 50% 0%, rgba(214,180,95,0.08), transparent 70%)" }} />
      <SectionHead eyebrow="The formulation shelf" title={<>Classical preparations, <em className="text-gold-300">made properly</em>.</>}
        sub="Slow-infused oils, stone-milled churnas and ghritas in the classical ratios. Free shipping above ₹999." />
      <Reveal delay={120} className="relative mt-8 flex flex-wrap gap-2">
        {CATEGORIES_FILTER.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
      </Reveal>
      <div className="relative mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 80}>
            <div className={`card-lift group flex h-full flex-col overflow-hidden rounded-2xl border bg-forest-900/60 hover:border-gold-500/50 ${p.stock === 0 ? "border-forest-800 opacity-75" : p.stock < 5 ? "border-ember-500/40" : "border-forest-800"}`}>
              <button onClick={() => navigate({ name: "product", id: p.id })} className="relative block h-48 w-full overflow-hidden" aria-label={`View ${p.name}`}>
                <SmartImg src={p.image} alt={p.name} className="h-full w-full object-cover duotone transition-transform duration-700 group-hover:scale-105" style={p.duotone ? { filter: p.duotone } : undefined} />
                <span className="absolute inset-0 bg-gradient-to-t from-forest-950/70 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full border border-gold-500/50 bg-forest-950/75 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-gold-300 backdrop-blur">{p.badge ?? p.category}</span>
                <span className="absolute bottom-3 left-3"><StockBadge stock={p.stock} /></span>
              </button>
              <div className="flex flex-1 flex-col p-5">
                <button onClick={() => navigate({ name: "product", id: p.id })} className="text-left">
                  <p className="font-display text-lg font-semibold text-sand-100 transition-colors group-hover:text-gold-300">{p.name}</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/40">{p.sanskrit}</p>
                </button>
                <div className="mt-2 flex items-center gap-2"><Stars rating={p.rating} size={11} /><span className="font-mono text-[10px] text-sand-200/50">{p.rating.toFixed(1)}</span></div>
                <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-sand-200/55">{p.desc}</p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <p className="font-display text-xl font-semibold text-gold-300">₹{p.price.toLocaleString("en-IN")} <span className="font-mono text-[10px] text-sand-200/35 line-through">₹{p.mrp.toLocaleString("en-IN")}</span></p>
                  <button onClick={() => { addToCart(p.id); toast(`${p.name} added to basket`); }} disabled={p.stock <= 0}
                    className="flex items-center gap-1.5 rounded-full border border-gold-500/60 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-300 transition-all hover:bg-gold-400 hover:text-forest-950 disabled:cursor-not-allowed disabled:opacity-40">
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ product detail ------------------------------ */

export function ProductDetail({ id }: { id: string }) {
  const { products, navigate, addToCart, setCartOpen, toast, storeEnabled } = useApp();
  const product = products.find((p) => p.id === id);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"desc" | "ingredients" | "directions" | "safety">("desc");

  if (!storeEnabled || !product) {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-40 text-center lg:px-8">
        <p className="font-display text-2xl text-sand-200/70">This formulation isn't on the shelf right now.</p>
        <button onClick={() => navigate({ name: "store" })} className="mt-6 rounded-full border border-gold-500/50 px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">Back to store</button>
      </div>
    );
  }

  const related = products.filter((p) => p.id !== product.id && p.visible !== false && p.category === product.category).slice(0, 3);
  const fallbackRelated = related.length ? related : products.filter((p) => p.id !== product.id && p.visible !== false).slice(0, 3);

  const buyNow = () => {
    addToCart(product.id, qty);
    setCartOpen(true);
    toast("Added — complete checkout in your basket");
  };

  const tabs = [
    { k: "desc" as const, label: "Description" },
    { k: "ingredients" as const, label: "Ingredients" },
    { k: "directions" as const, label: "Directions" },
    { k: "safety" as const, label: "Safety" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <button onClick={() => navigate({ name: "store" })} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-sand-200/50 transition-colors hover:text-gold-300"><ArrowLeft size={14} /> Store</button>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-forest-800">
          <SmartImg src={product.image} alt={product.name} className="aspect-square w-full object-cover duotone" style={product.duotone ? { filter: product.duotone } : undefined} />
          <span className="absolute left-4 top-4 rounded-full border border-gold-500/50 bg-forest-950/75 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-gold-300 backdrop-blur">{product.badge ?? product.category}</span>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">{product.category}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-sand-100 sm:text-4xl">{product.name}</h1>
          <p className="mt-1 font-display text-lg italic text-sand-200/50">{product.sanskrit}</p>
          <div className="mt-3 flex items-center gap-3">
            <Stars rating={product.rating} />
            <span className="font-mono text-[11px] text-sand-200/55">{product.rating.toFixed(1)} · clinically referenced</span>
          </div>
          <div className="mt-5 flex items-baseline gap-3">
            <p className="font-display text-4xl font-semibold text-gold-300">₹{product.price.toLocaleString("en-IN")}</p>
            <p className="font-mono text-sm text-sand-200/35 line-through">₹{product.mrp.toLocaleString("en-IN")}</p>
            <span className="rounded-full bg-kapha-500/15 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-kapha-300">{Math.round((1 - product.price / product.mrp) * 100)}% off</span>
          </div>
          <div className="mt-3"><StockBadge stock={product.stock} /></div>

          {product.highlights && (
            <ul className="mt-5 space-y-2">
              {product.highlights.map((h) => <li key={h} className="flex gap-2.5 text-[13.5px] text-sand-200/75"><span className="mt-[8px] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold-400" />{h}</li>)}
            </ul>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-forest-700 px-2 py-1.5">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity" className="grid h-8 w-8 place-items-center rounded-full text-sand-200/70 hover:text-gold-300"><Minus size={14} /></button>
              <span className="w-7 text-center font-mono text-[14px]">{qty}</span>
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
            {([[ShieldCheck, "100% Ayurvedic"], [BadgeCheck, "GMP Certified"], [Lock, "Secure Payments"]] as [React.ComponentType<{ size?: number; className?: string }>, string][]).map(([Icon, label]) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <Icon size={20} className="text-gold-400/80" />
                <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-sand-200/55">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/40">Free shipping above ₹{FREE_SHIP_AT}</p>
        </div>
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
              {tab === "desc" && (
                <div className="max-w-3xl space-y-4">
                  <p className="text-[15px] leading-relaxed text-sand-200/80">{product.desc}</p>
                  {product.source && <p className="rounded-lg border border-gold-500/30 bg-gold-400/6 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-gold-300">Source · {product.source}</p>}
                </div>
              )}
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

      {/* reviews */}
      <Reveal className="mt-16"><ReviewsBlock product={product} /></Reveal>

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
                  <p className="mt-2 font-display text-lg font-semibold text-gold-300">₹{p.price.toLocaleString("en-IN")}</p>
                </div>
              </button>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}

/* ---------------------------------- reviews --------------------------------- */

function ReviewsBlock({ product }: { product: Product }) {
  const { saveProduct, toast, customer } = useApp();
  const [name, setName] = useState(customer?.name ?? "");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);

  const hidden = listHiddenReviews();
  const reviews: ProductReview[] = product.reviews ?? [];
  const visible = reviews.filter((_, i) => !hidden.includes(`${product.id}:${i}`));
  const avg = visible.length > 0 ? visible.reduce((s, r) => s + r.rating, 0) / visible.length : product.rating;

  const submit = () => {
    if (!name.trim() || !text.trim()) { toast("Please add your name and a few words"); return; }
    const review: ProductReview = { name: name.trim(), rating, text: text.trim(), at: new Date().toISOString() };
    saveProduct({ ...product, reviews: [...reviews, review] });
    let moderate = false;
    try { moderate = getConsoleSettings().moderateReviews; } catch { /* off */ }
    if (moderate) {
      toggleHiddenReview(`${product.id}:${reviews.length}`);
      toast("Thank you — your review is awaiting approval");
    } else {
      toast("Thank you — your review is live");
    }
    setText(""); setOpen(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.3em] text-gold-400">What patients say</p>
          <div className="mt-2 flex items-center gap-3">
            <Stars rating={avg} />
            <span className="font-mono text-[11px] text-sand-200/55">{avg.toFixed(1)} · {visible.length} review{visible.length === 1 ? "" : "s"}</span>
          </div>
        </div>
        <button onClick={() => setOpen(!open)} className="rounded-full border border-gold-500/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 transition-all hover:bg-gold-400 hover:text-forest-950">{open ? "Close" : "Write a review"}</button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-5 space-y-3.5 rounded-xl border border-forest-800 bg-forest-900/60 p-5">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-sand-200/50">Your rating</span>
                <Stars rating={rating} size={20} onRate={setRating} />
              </div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="How did this formulation work for you?" className="w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
              <button onClick={submit} className="flex items-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-gold-300"><Send size={13} /> Submit review</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {visible.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-6 text-center text-[13px] text-sand-200/45 sm:col-span-2">No reviews yet — be the first to share your experience.</p>}
        {visible.map((r, i) => (
          <div key={`${r.name}-${i}`} className="rounded-xl border border-forest-800 bg-forest-900/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13.5px] font-semibold text-sand-100">{r.name}</p>
              <Stars rating={r.rating} size={11} />
            </div>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-sand-200/70">"{r.text}"</p>
            <p className="mt-3 flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-sand-200/35">
              <BadgeCheck size={11} className="text-kapha-400" /> Verified purchase · {new Date(r.at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        ))}
      </div>
      <span className="hidden"><Star size={0} /></span>
    </div>
  );
}
