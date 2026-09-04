import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp, Reveal, SectionHead, Tilt, SmartImg, Stars } from "./lib";
import { PRODUCTS, FREE_SHIP_AT, type Product, type ProductReview } from "./data";
import { getConsoleSettings, listHiddenReviews } from "./console/db";
import { Close, Cart, ArrowRight, ArrowLeft, Check, Leaf, Shield, Lock, Star, Plus, Minus } from "./icons";

const CATEGORIES_FILTER = ["All", "Oils", "Churnas", "Capsules", "Ghritas", "Kadhas"] as const;

/** Reviews the console has hidden never render publicly. */
function publicReviews(p: Product): ProductReview[] {
  try {
    if (!getConsoleSettings().moderateReviews) return p.reviews ?? [];
    const hidden = listHiddenReviews();
    return (p.reviews ?? []).filter((r) => !hidden.includes(`${p.id}:${r.id}`));
  } catch {
    return p.reviews ?? [];
  }
}

/* ------------------------------ product detail ------------------------------ */

export function ProductDetail({ id }: { id: string }) {
  const { products, navigate, addToCart, setCartOpen, toast, customer, setAccountAuthOpen, checkoutIntent, setCheckoutIntent, placeOrder, saveProduct } = useApp();
  const product = products.find((p) => p.id === id && p.visible !== false);
  const [imgView, setImgView] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeSec, setActiveSec] = useState(0);
  const [reviewForm, setReviewForm] = useState(false);
  const [revRating, setRevRating] = useState(5);
  const [revText, setRevText] = useState("");
  const [revName, setRevName] = useState(customer?.name ?? "");
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  /* Buy Now → stage the basket, then route through the real checkout (never
     places an order on its own). Guests sign in first and resume. */
  useEffect(() => {
    if (customer && checkoutIntent && product) {
      setCheckoutIntent(false);
      setCartOpen(true);
    }
  }, [customer, checkoutIntent, product, setCheckoutIntent, setCartOpen]);

  /* scroll-spy for the section bar */
  useEffect(() => {
    const nodes = sectionRefs.current.filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          const i = nodes.indexOf(e.target as HTMLElement);
          if (i >= 0) setActiveSec(i);
        }
      }),
      { rootMargin: "-30% 0px -55% 0px" }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [product?.id]);

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-40 text-center">
        <p className="font-display text-3xl font-semibold text-sand-100">This formulation is off the shelf.</p>
        <p className="mt-3 text-sand-200/55">It may be paused by the desk, or the link has expired.</p>
        <button onClick={() => navigate({ name: "store" })} className="mt-6 rounded-full border border-gold-500/50 px-7 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">
          Back to the store
        </button>
      </div>
    );
  }

  const off = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const sections = ["Overview", "Ingredients", "Directions", "Safety", "Reviews"];
  const gallery: { filter?: string; label: string }[] = [
    { label: "Original" },
    { filter: "sepia(0.3) saturate(0.85)", label: "Warm light" },
    { filter: "contrast(1.15) saturate(0.7) brightness(1.05)", label: "Detail" },
  ];
  const jump = (i: number) => sectionRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });

  const buyNow = () => {
    addToCart(product.id, qty);
    if (!customer) {
      setCheckoutIntent(true);
      setAccountAuthOpen(true);
      return;
    }
    setCheckoutIntent(true);
    setCartOpen(true);
  };

  const reviews = publicReviews(product);
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length }));
  const maxCount = Math.max(1, ...dist.map((d) => d.count));
  const input = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/30 focus:border-gold-400 focus:outline-none";

  const submitReview = () => {
    if (!revText.trim()) { toast("Write a few words about your experience"); return; }
    const r: ProductReview = {
      id: `r-${Date.now()}`, name: revName.trim() || "Verified buyer", rating: revRating,
      text: revText.trim(), date: new Date().toISOString().slice(0, 10), verified: true, approved: true,
    };
    saveProduct({ ...product, reviews: [r, ...(product.reviews ?? [])] });
    setReviewForm(false); setRevText("");
    toast(getConsoleSettings().moderateReviews ? "Thank you — your review is with our moderators" : "Thank you — your review is live");
  };

  return (
    <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-32">
      <button onClick={() => navigate({ name: "store" })} className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-sand-200/50 transition-colors hover:text-gold-300">
        <ArrowLeft size={14} /> Store · {product.category}
      </button>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.15fr]">
        {/* gallery */}
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-forest-800 bg-forest-900">
            <SmartImg src={product.image} alt={product.name} className="aspect-square w-full object-cover duotone"
              style={{ filter: [undefined, "sepia(0.3) saturate(0.85)", "contrast(1.15) saturate(0.7) brightness(1.05)"][imgView] }} />
            {product.stock <= 0 && (
              <span className="absolute inset-0 grid place-items-center bg-forest-950/70 backdrop-blur-[2px]">
                <span className="rounded-full border border-ember-400/60 bg-forest-950/80 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ember-300">Out of stock</span>
              </span>
            )}
            {product.badge && (
              <span className="absolute left-4 top-4 rounded-full border border-gold-500/50 bg-forest-950/70 px-3 py-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-gold-300 backdrop-blur">{product.badge}</span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {gallery.map((g, i) => (
              <button key={i} onClick={() => setImgView(i)} aria-label={`View: ${g.label}`}
                className={`overflow-hidden rounded-xl border transition-all ${imgView === i ? "border-gold-400 shadow-[0_0_18px_rgba(214,180,95,0.25)]" : "border-forest-800 hover:border-forest-600"}`}>
                <SmartImg src={product.image} alt={`${product.name} — ${g.label}`} className="aspect-square w-full object-cover duotone" style={{ filter: g.filter }} />
              </button>
            ))}
          </div>
        </div>

        {/* buy panel */}
        <div>
          <p className="font-display text-2xl italic text-gold-400/80">{product.sanskrit}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-sand-100 sm:text-[2.9rem]">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Stars rating={product.rating} size={16} />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-sand-200/55">{product.rating} · {reviews.length} reviews</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-kapha-300"><Check size={12} /> {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}</span>
          </div>
          <div className="mt-6 flex items-end gap-3">
            <span className="font-display text-5xl font-semibold text-gold-300">₹{product.price.toLocaleString("en-IN")}</span>
            {off > 0 && <span className="pb-1.5 font-mono text-sm text-sand-200/40 line-through">₹{product.mrp.toLocaleString("en-IN")}</span>}
            {off > 0 && <span className="mb-1.5 rounded-full bg-kapha-500/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-kapha-300">{off}% off</span>}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-forest-700">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-11 w-11 place-items-center text-sand-200/70 hover:text-gold-300" aria-label="Decrease quantity"><Minus size={14} /></button>
              <span className="w-8 text-center font-mono text-sm text-sand-100">{qty}</span>
              <button onClick={() => setQty(Math.min(Math.max(1, product.stock), qty + 1))} className="grid h-11 w-11 place-items-center text-sand-200/70 hover:text-gold-300" aria-label="Increase quantity"><Plus size={14} /></button>
            </div>
            <button onClick={() => { addToCart(product.id, qty); toast(`${product.name} added to basket`); setCartOpen(true); }} disabled={product.stock <= 0}
              className="flex items-center gap-2 rounded-full border border-gold-500/60 px-7 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gold-300 transition-all hover:bg-gold-400 hover:text-forest-950 disabled:opacity-35">
              <Cart size={16} /> Add to cart
            </button>
            <button onClick={buyNow} disabled={product.stock <= 0}
              className="flex items-center gap-2 rounded-full bg-gold-400 px-7 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 hover:shadow-[0_0_26px_rgba(214,180,95,0.35)] disabled:opacity-35">
              Buy now <ArrowRight size={15} />
            </button>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-3">
            {[
              { Icon: Leaf, label: "100% Ayurvedic", sub: "Classical sourcing" },
              { Icon: Shield, label: "GMP certified", sub: "Batch-tested" },
              { Icon: Lock, label: "Secure payments", sub: "UPI · cards · COD" },
            ].map(({ Icon, label, sub }) => (
              <div key={label} className="rounded-xl border border-forest-800 bg-forest-900/60 p-3.5 text-center transition-colors hover:border-gold-500/40">
                <Icon size={18} className="mx-auto text-gold-400" />
                <p className="mt-2 text-[11.5px] font-semibold text-sand-100">{label}</p>
                <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-sand-200/40">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* section bar */}
      <div className="no-scrollbar sticky top-16 z-30 mt-14 flex gap-2 overflow-x-auto border-y border-forest-800 bg-forest-950/90 py-3 backdrop-blur">
        {sections.map((s, i) => (
          <button key={s} onClick={() => jump(i)}
            className={`shrink-0 rounded-full border px-5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all ${activeSec === i ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55 hover:text-sand-100"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="mt-12 space-y-16">
        {/* overview */}
        <section ref={(el) => { sectionRefs.current[0] = el; }}>
          <h2 className="font-display text-3xl font-semibold text-sand-100">Key highlights</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {(product.highlights.length ? product.highlights : [product.desc]).map((h, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-forest-800 bg-forest-900/60 p-4 text-[14px] leading-relaxed text-sand-200/80">
                <Check size={16} className="mt-0.5 shrink-0 text-gold-400" />{h}
              </li>
            ))}
          </ul>
          {product.classicalSource && (
            <blockquote className="mt-8 rounded-r-xl border-l-2 border-gold-400 bg-forest-900/70 p-6">
              <p className="font-display text-lg italic leading-relaxed text-sand-200/90">{product.classicalSource}</p>
            </blockquote>
          )}
          <div className="mt-8 space-y-4">
            {product.detail.map((d, i) => <p key={i} className="max-w-3xl text-[15px] leading-[1.9] text-sand-200/75">{d}</p>)}
          </div>
        </section>

        {/* ingredients */}
        <section ref={(el) => { sectionRefs.current[1] = el; }}>
          <h2 className="font-display text-3xl font-semibold text-sand-100">Key ingredients</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.ingredientDetails.map((ing, i) => (
              <Reveal key={i} delay={i * 60} className="flex gap-4 rounded-xl border border-forest-800 bg-forest-900/60 p-5 transition-colors hover:border-moss-500/50">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-moss-500/40 bg-moss-500/10 text-moss-300"><Leaf size={18} /></span>
                <div>
                  <p className="font-semibold text-sand-100">{ing.name}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-sand-200/60">{ing.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* directions */}
        <section ref={(el) => { sectionRefs.current[2] = el; }}>
          <h2 className="font-display text-3xl font-semibold text-sand-100">Directions & dosage</h2>
          <ol className="mt-6 max-w-2xl space-y-4">
            {product.steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold-500/50 font-display text-lg text-gold-300">{i + 1}</span>
                <p className="pt-1.5 text-[14.5px] leading-relaxed text-sand-200/80">{s}</p>
              </li>
            ))}
          </ol>
          {product.dosage && (
            <p className="mt-6 inline-flex items-center gap-2.5 rounded-xl border border-gold-500/35 bg-gold-400/6 px-5 py-3.5 text-[13.5px] text-gold-300">
              <Check size={15} /> {product.dosage}
            </p>
          )}
        </section>

        {/* safety */}
        <section ref={(el) => { sectionRefs.current[3] = el; }}>
          <h2 className="font-display text-3xl font-semibold text-sand-100">Safety & precautions</h2>
          <ul className="mt-6 max-w-2xl space-y-3">
            {product.safety.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-ember-500/25 bg-ember-500/5 p-4 text-[14px] leading-relaxed text-sand-200/80">
                <Shield size={16} className="mt-0.5 shrink-0 text-ember-300" />{s}
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-2xl text-[12px] leading-relaxed text-sand-200/40">
            These statements have not been evaluated by a drug regulator. This product is not intended to diagnose, treat, cure or prevent any disease. Consult a registered practitioner before therapeutic use.
          </p>
        </section>

        {/* reviews */}
        <section ref={(el) => { sectionRefs.current[4] = el; }}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-semibold text-sand-100">Customer reviews</h2>
            <button onClick={() => setReviewForm(!reviewForm)} className="rounded-full border border-gold-500/50 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">
              Write a review
            </button>
          </div>
          <AnimatePresence>
            {reviewForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-5 max-w-xl space-y-3 rounded-2xl border border-forest-700 bg-forest-900/70 p-6">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/55">Rating</span>
                    <Stars rating={revRating} size={22} onRate={setRevRating} />
                  </div>
                  <input value={revName} onChange={(e) => setRevName(e.target.value)} placeholder="Your name" className={input} />
                  <textarea value={revText} onChange={(e) => setRevText(e.target.value)} rows={3} placeholder="What did it change for you?" className={input} />
                  <button onClick={submitReview} className="rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Submit review</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
            <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
              <p className="font-display text-5xl font-semibold text-gold-300">{product.rating}</p>
              <Stars rating={product.rating} size={16} />
              <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/45">{reviews.length} verified reviews</p>
              <div className="mt-5 space-y-2">
                {dist.map((d) => (
                  <div key={d.n} className="flex items-center gap-2.5">
                    <span className="flex w-8 items-center gap-1 font-mono text-[10px] text-sand-200/60">{d.n}<Star size={9} className="text-gold-400" /></span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-forest-800">
                      <div className="h-full rounded-full bg-gold-400/80" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {reviews.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-8 text-center text-sm text-sand-200/50">No reviews yet — be the first to share your experience.</p>}
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-forest-800 bg-forest-900/60 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-sand-100">{r.name}</p>
                    {r.verified && <span className="rounded-full border border-kapha-500/40 bg-kapha-500/10 px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-kapha-300">Verified purchase</span>}
                    <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/40">{r.date}</span>
                  </div>
                  <div className="mt-2"><Stars rating={r.rating} size={13} /></div>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-sand-200/75">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* related */}
      <div className="mt-20">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.26em] text-gold-400">From the same shelf</p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.filter((p) => p.id !== product.id && p.visible !== false && p.category === product.category).slice(0, 4).map((p) => (
            <button key={p.id} onClick={() => navigate({ name: "product", id: p.id })}
              className="group overflow-hidden rounded-xl border border-forest-800 bg-forest-900 text-left transition-all hover:-translate-y-1 hover:border-gold-500/50">
              <SmartImg src={p.image} alt={p.name} className="aspect-[4/3] w-full object-cover duotone transition-transform duration-500 group-hover:scale-105" />
              <div className="p-4">
                <p className="text-sm font-semibold text-sand-100 group-hover:text-gold-300">{p.name}</p>
                <p className="mt-1 font-display text-lg text-gold-300">₹{p.price.toLocaleString("en-IN")}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <span className="hidden">{FREE_SHIP_AT ? "" : ""}</span>
    </div>
  );
}

/* --------------------------------- store grid -------------------------------- */

export function Store() {
  const { products, navigate, addToCart, setCartOpen, toast } = useApp();
  const [cat, setCat] = useState<(typeof CATEGORIES_FILTER)[number]>("All");
  const results = useMemo(() => products.filter((p) => p.visible !== false && (cat === "All" || p.category === cat)), [products, cat]);

  return (
    <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{ background: "radial-gradient(55% 90% at 50% 0%, rgba(214,180,95,0.08), transparent 70%)" }} />
      <div className="relative flex flex-wrap items-end justify-between gap-8">
        <SectionHead eyebrow="The formulation store" title={<>Classical remedies, <em className="text-gold-300">batch-tested</em>.</>}
          sub="Every formulation follows a classical reference, is prepared in GMP-certified small batches, and carries its full ingredient story." />
        <Reveal delay={120} className="flex flex-wrap gap-2">
          {CATEGORIES_FILTER.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${cat === c ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/60 hover:text-sand-100"}`}>
              {c}
            </button>
          ))}
        </Reveal>
      </div>
      <p className="relative mt-6 font-mono text-[10.5px] uppercase tracking-[0.2em] text-sand-200/40">
        {results.length} formulation{results.length === 1 ? "" : "s"} · free shipping over ₹{FREE_SHIP_AT}
      </p>
      <div className="relative mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 90}>
            <Tilt className="h-full">
              <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-900 transition-colors hover:border-gold-500/50">
                <button onClick={() => navigate({ name: "product", id: p.id })} className="tilt-inner relative block overflow-hidden text-left">
                  <SmartImg src={p.image} alt={p.name} className="aspect-[4/3] w-full object-cover duotone transition-transform duration-700 group-hover:scale-108" style={p.duotone ? { filter: p.duotone } : undefined} />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-transparent" />
                  {p.badge && <span className="absolute left-4 top-4 rounded-full border border-gold-500/50 bg-forest-950/70 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-gold-300 backdrop-blur">{p.badge}</span>}
                  {p.stock <= 0 ? (
                    <span className="absolute inset-0 grid place-items-center bg-forest-950/70 backdrop-blur-[2px]">
                      <span className="rounded-full border border-ember-400/60 bg-forest-950/80 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ember-300">Out of stock</span>
                    </span>
                  ) : p.stock < 5 ? (
                    <span className="absolute right-4 top-4 rounded-full bg-gold-400 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-forest-950">Only {p.stock} left</span>
                  ) : null}
                  <span className="absolute bottom-3 right-4 font-display text-4xl italic text-sand-100/15">{p.sanskrit.slice(0, 4)}</span>
                </button>
                <div className="flex flex-1 flex-col p-5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-sand-200/40">{p.category}</p>
                  <button onClick={() => navigate({ name: "product", id: p.id })} className="mt-1 text-left font-display text-xl font-semibold leading-snug text-sand-100 transition-colors hover:text-gold-300">{p.name}</button>
                  <div className="mt-2 flex items-center gap-2">
                    <Stars rating={p.rating} size={12} />
                    <span className="font-mono text-[9.5px] text-sand-200/45">{p.rating} · {(p.reviews ?? []).length} reviews</span>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-4">
                    <div>
                      <p className="font-display text-2xl font-semibold text-gold-300">₹{p.price.toLocaleString("en-IN")}</p>
                      {p.mrp > p.price && <p className="font-mono text-[10px] text-sand-200/40 line-through">₹{p.mrp.toLocaleString("en-IN")}</p>}
                    </div>
                    <button onClick={() => { if (p.stock <= 0) { toast(`${p.name} is out of stock right now`); return; } addToCart(p.id); toast(`${p.name} added to basket`); setCartOpen(true); }}
                      disabled={p.stock <= 0}
                      className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] transition-all ${p.stock <= 0 ? "cursor-not-allowed border-forest-700 text-sand-200/35" : "border-gold-500/50 text-gold-300 hover:bg-gold-400 hover:text-forest-950"}`}>
                      <Cart size={13} /> Add
                    </button>
                  </div>
                </div>
              </div>
            </Tilt>
          </Reveal>
        ))}
      </div>
      <span className="hidden"><Close size={0} /></span>
    </div>
  );
}

/* -------------------------------- store locked ------------------------------- */

export function StoreLocked() {
  const { navigate } = useApp();
  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 pb-24 pt-32 text-center">
      <span className="animate-breathe grid h-20 w-20 place-items-center rounded-3xl border border-gold-500/40 bg-gold-400/10 text-gold-300">
        <Lock size={30} />
      </span>
      <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.3em] text-gold-400/80">वैद्यगण · coming soon</p>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-sand-100 sm:text-5xl">Our Ayurvedic store is under construction.</h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-sand-200/60">
        The desk is restocking the shelves with batch-tested classical formulations. Check back soon — or browse the journal meanwhile.
      </p>
      <button onClick={() => navigate({ name: "journal" })} className="mt-8 rounded-full bg-gold-400 px-8 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">
        Read the journal
      </button>
    </div>
  );
}
