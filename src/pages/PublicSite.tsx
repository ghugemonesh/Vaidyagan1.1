/* =============================================================================
   Vaidyagan — the public platform (MAIN website)
   Home · Store · Product Detail · Cart/Checkout · Journal · Reader ·
   Herb Index · Dosha Quiz · Contact · My Account
   ========================================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf, Menu, X, ShoppingCart, User as UserIcon, Search, ArrowRight, ArrowLeft, Check,
  Play, Pause, Copy, Star, Flame, Wind, Droplets, MapPin, Phone, Mail, Instagram, Clock,
  ChevronDown, Plus, Minus, Trash2, BookOpen, ShieldCheck, Truck, Lock, Send, Package,
  Download, BadgeCheck, Sparkles, HeartHandshake,
} from "lucide-react";

import { useDb, listProducts, getSettings, listOrders, getProduct, type Product } from "../lib/data";
import { useToast } from "../components/ui";
import {
  IMG, productImage, pdpFor, publishedArticles, getArticle, articleToc, withHeadingIds,
  readingMinutes, listHerbs, QUIZ_QUESTIONS, DOSHA_RESULTS,
  loadCart, persistCart, validateDiscountCode, placeOrder, inr, formatDate,
  accountSession, loginOtp, loginGoogle, loginEmail, registerEmail, logoutAccount, updateAccount,
  allArticles, listUserArticles,
  type Article, type CartLine, type Account, type AccountAddress, type Herb,
} from "../lib/platform";

/* ================================ primitives ================================ */

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setSeen(true); return; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }), { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${seen ? "revealed" : ""} ${className}`} style={{ "--rv-delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </div>
  );
}

function SmartImg({ src, alt, className = "", style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div className={`leaf-field grid place-items-center bg-forest-850 ${className}`} style={style}>
        <span className="font-display text-4xl italic text-gold-500/30">वै</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={className} style={style} onError={() => setErr(true)} />;
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  return (
    <Reveal className="max-w-2xl">
      <p className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.3em] text-gold-400">
        <span className="h-px w-10 bg-gold-500/60" /> {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-sand-100 sm:text-[2.5rem] sm:leading-[1.1]">{title}</h2>
      {sub && <p className="mt-4 text-[15px] leading-relaxed text-sand-200/60">{sub}</p>}
    </Reveal>
  );
}

function GoldButton({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick}
      className={`group inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all duration-300 hover:bg-gold-300 hover:shadow-[0_0_28px_rgba(214,180,95,0.35)] active:scale-95 ${className}`}>
      {children}
    </button>
  );
}

function DoshaDots({ doshas }: { doshas: ("vata" | "pitta" | "kapha")[] }) {
  const map = { vata: "#93b1cf", pitta: "#e07f49", kapha: "#82b39e" };
  return (
    <span className="flex items-center gap-1.5">
      {doshas.map((d) => <span key={d} className="h-2 w-2 rounded-full" style={{ background: map[d], boxShadow: `0 0 8px ${map[d]}66` }} title={d} />)}
    </span>
  );
}

const DOSHA_META = {
  vata: { sa: "वात", name: "Vata", elements: "Air · Ether", color: "#93b1cf", Icon: Wind },
  pitta: { sa: "पित्त", name: "Pitta", elements: "Fire · Water", color: "#e07f49", Icon: Flame },
  kapha: { sa: "कफ", name: "Kapha", elements: "Earth · Water", color: "#82b39e", Icon: Droplets },
};

/* =============================== Tridosha wheel ============================== */

const RINGS = [
  { dosha: "vata" as const, pct: 52, speed: 0.0032, z: 34, start: Math.PI * 0.5, sats: [38, 158, 272] },
  { dosha: "pitta" as const, pct: 74, speed: -0.0022, z: 78, start: Math.PI * 1.17, sats: [12, 128, 214, 318] },
  { dosha: "kapha" as const, pct: 96, speed: 0.0015, z: 122, start: Math.PI * 1.76, sats: [66, 184, 298] },
];

function TridoshaWheel({ onPick, onCore }: { onPick: (d: "vata" | "pitta" | "kapha") => void; onCore: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pausedRef = useRef(false);
  const [hovered, setHovered] = useState<"vata" | "pitta" | "kapha" | null>(null);

  useEffect(() => { pausedRef.current = hovered !== null; }, [hovered]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tilt = { rx: 0, ry: 0, tx: 0, ty: 0 };
    const vels = RINGS.map(() => 0);
    const angles = RINGS.map((r) => r.start);
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const el = wrapRef.current; if (!el) return;
      const b = el.getBoundingClientRect();
      tilt.tx = Math.min(1, Math.max(-1, ((e.clientX - b.left) / b.width) * 2 - 1));
      tilt.ty = Math.min(1, Math.max(-1, ((e.clientY - b.top) / b.height) * 2 - 1));
    };
    const onLeave = () => { tilt.tx = 0; tilt.ty = 0; };
    window.addEventListener("mousemove", onMove);
    wrapRef.current?.addEventListener("mouseleave", onLeave);
    const tick = () => {
      tilt.rx += (-tilt.ty * 12 - tilt.rx) * 0.06;
      tilt.ry += (tilt.tx * 15 - tilt.ry) * 0.06;
      if (tiltRef.current) tiltRef.current.style.transform = `rotateX(${tilt.rx.toFixed(3)}deg) rotateY(${tilt.ry.toFixed(3)}deg)`;
      RINGS.forEach((r, i) => {
        vels[i] += (r.speed * (pausedRef.current ? 0 : 1) - vels[i]) * 0.055;
        angles[i] += vels[i];
        if (ringRefs.current[i]) ringRefs.current[i]!.style.transform = `translateZ(${r.z}px) rotate(${angles[i]}rad)`;
        if (nodeRefs.current[i]) nodeRefs.current[i]!.style.transform = `rotate(${-angles[i]}rad)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[560px]" style={{ perspective: "1150px" }}>
      <div aria-hidden className="absolute left-1/2 top-1/2 h-[125%] w-[125%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(214,180,95,0.10) 0%, rgba(214,180,95,0.03) 42%, transparent 68%)" }} />
      <div ref={tiltRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {RINGS.map((r, i) => {
          const m = DOSHA_META[r.dosha];
          const Icon = m.Icon;
          const isHover = hovered === r.dosha;
          const dimmed = hovered !== null && !isHover;
          return (
            <div key={r.dosha} ref={(el) => { ringRefs.current[i] = el; }}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{ width: `${r.pct}%`, aspectRatio: "1", marginLeft: `${-r.pct / 2}%`, marginTop: `${-r.pct / 2}%`, transformStyle: "preserve-3d" }}>
              <span aria-hidden className="absolute inset-0 rounded-full border border-dashed transition-all duration-500"
                style={{ borderColor: isHover ? `${m.color}70` : `${m.color}24`, boxShadow: isHover ? `0 0 70px -18px ${m.color}99, inset 0 0 40px -24px ${m.color}55` : "none" }} />
              {r.sats.map((deg) => (
                <span key={deg} aria-hidden className="absolute inset-0" style={{ transform: `rotate(${deg}deg)` }}>
                  <i className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `${m.color}8f`, boxShadow: `0 0 8px ${m.color}66` }} />
                </span>
              ))}
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" style={{ transformStyle: "preserve-3d" }}>
                <div ref={(el) => { nodeRefs.current[i] = el; }} className={`transition-all duration-500 ${dimmed ? "opacity-40 saturate-50" : "opacity-100"}`}>
                  <button onClick={() => onPick(r.dosha)} onMouseEnter={() => setHovered(r.dosha)} onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(r.dosha)} onBlur={() => setHovered(null)}
                    aria-label={`Explore ${m.name} — ${m.elements}`} className="group relative grid place-items-center">
                    <span aria-hidden className="absolute -inset-7 rounded-full blur-2xl transition-opacity duration-500"
                      style={{ background: `radial-gradient(circle, ${m.color}66 0%, transparent 70%)`, opacity: isHover ? 1 : 0 }} />
                    <span className="relative grid h-16 w-16 place-items-center rounded-full border-2 backdrop-blur-sm transition-all duration-500 group-hover:scale-110 sm:h-[78px] sm:w-[78px]"
                      style={{ borderColor: isHover ? m.color : `${m.color}80`, background: `radial-gradient(circle at 32% 28%, ${m.color}40, rgba(15,26,19,0.92) 74%)`, boxShadow: isHover ? `0 0 46px -6px ${m.color}bb, inset 0 0 20px ${m.color}33` : "0 12px 32px rgba(0,0,0,0.5)" }}>
                      <span className="grid place-items-center gap-1">
                        <Icon size={18} style={{ color: m.color }} />
                        <span className="font-mono text-[8px] uppercase tracking-[0.24em]" style={{ color: m.color }}>{m.name}</span>
                      </span>
                    </span>
                    <span className="absolute top-full mt-2.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em]"
                      style={{ borderColor: isHover ? `${m.color}88` : `${m.color}3d`, color: isHover ? m.color : `${m.color}b3`, background: "rgba(10,19,14,0.88)" }}>
                      {m.sa} · {m.elements}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <div className="absolute left-1/2 top-1/2" style={{ transform: "translate(-50%,-50%) translateZ(150px)" }}>
          <button onClick={onCore} aria-label="Take the prakriti assessment" className="group relative grid place-items-center">
            <span aria-hidden className="animate-pulse-ring absolute inset-0 rounded-full border border-gold-500/40" />
            <span aria-hidden className="animate-pulse-ring absolute inset-0 rounded-full border border-gold-500/25" style={{ animationDelay: "1.4s" }} />
            <span className="animate-breathe relative grid h-32 w-32 place-items-center rounded-full border border-gold-500/50 transition-shadow duration-500 group-hover:shadow-[0_0_95px_rgba(214,180,95,0.5)] sm:h-36 sm:w-36"
              style={{ background: "radial-gradient(circle at 36% 30%, rgba(214,180,95,0.22), rgba(15,26,19,0.94) 70%)", boxShadow: "0 0 60px rgba(214,180,95,0.22)" }}>
              <span className="grid place-items-center text-center">
                <span className="font-display text-[27px] italic leading-none text-gold-300 sm:text-3xl">त्रिदोष</span>
                <span className="mt-1 font-mono text-[7.5px] uppercase tracking-[0.34em] text-sand-200/50">Tridosha</span>
                <span className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.26em] text-gold-400/80 transition-colors group-hover:text-gold-300">discover yours</span>
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================ site chrome ================================ */

const NAV = [
  { label: "Journal", to: "/journal" },
  { label: "Herb Index", to: "/herbs" },
  { label: "Dosha Quiz", to: "/quiz" },
  { label: "Store", to: "/store" },
  { label: "Contact", to: "/contact" },
];

function Brand() {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="relative grid h-11 w-11 place-items-center rounded-xl border border-gold-500/60 bg-forest-850 text-gold-400 transition-all duration-500 group-hover:rotate-12 group-hover:shadow-[0_0_24px_rgba(214,180,95,0.35)]">
        <Leaf size={21} />
      </span>
      <span>
        <span className="block font-display text-lg font-semibold leading-none text-sand-100">Vaidyagan</span>
        <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.3em] text-gold-400/80">वैद्यगण · clinically verified</span>
      </span>
    </Link>
  );
}

function SiteNav({ cartCount, onCart, onAccount, account }: { cartCount: number; onCart: () => void; onAccount: () => void; account: Account | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);
  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "border-b border-forest-800 bg-forest-950/85 backdrop-blur-md" : "bg-transparent"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
          <Brand />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-full px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200/60 transition-colors hover:text-gold-300">
                {n.label}
              </Link>
            ))}
            <Link to="/studio" className="ml-1 flex items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200/60 transition-all hover:border-gold-400 hover:text-gold-300">
              <Lock size={11} /> Studio
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={onAccount} aria-label="My account" className="relative grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/80 transition-all hover:border-gold-400 hover:text-gold-300">
              <UserIcon size={17} />
              {account && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-forest-950 bg-gold-400" />}
            </button>
            <button onClick={onCart} aria-label="Open cart" className="relative grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/80 transition-all hover:border-gold-400 hover:text-gold-300">
              <ShoppingCart size={17} />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-gold-400 font-mono text-[10px] font-bold text-forest-950">{cartCount}</span>}
            </button>
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/80 lg:hidden">
              <Menu size={17} />
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-forest-950/97 backdrop-blur-lg lg:hidden">
            <div className="flex items-center justify-between px-5 py-5">
              <Brand />
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200"><X size={17} /></button>
            </div>
            <nav className="mt-8 flex flex-col gap-2 px-8">
              {[...NAV, { label: "Doctor Studio", to: "/studio" }, { label: "My Account", to: "/account" }].map((n, i) => (
                <motion.div key={n.to} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                  <Link to={n.to} onClick={() => setMenuOpen(false)} className="flex items-center justify-between border-b border-forest-800 py-4 font-display text-3xl font-semibold text-sand-100 transition-colors hover:text-gold-300">
                    {n.label} <ArrowRight size={20} className="text-gold-500/60" />
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SiteFooter() {
  const settings = getSettings();
  return (
    <footer className="border-t border-forest-800 bg-forest-900/50">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Brand />
            <p className="mt-5 max-w-xs font-display text-lg italic leading-snug text-sand-200/80">"Knowledge is medicine. Everything else is a delivery system."</p>
            <div className="mt-6 flex items-center gap-2.5">
              <a href="https://instagram.com/vaidyagan" target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/60 transition-all hover:border-gold-400 hover:text-gold-300"><Instagram size={16} /></a>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/40">@vaidyagan</span>
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-400">Explore</p>
            <div className="mt-4 flex flex-col items-start gap-2.5">
              {[...NAV, { label: "Doctor Studio", to: "/studio" }, { label: "My Account", to: "/account" }].map((n) => (
                <Link key={n.to} to={n.to} className="text-sm text-sand-200/60 transition-colors hover:text-gold-300">{n.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-400">The promise</p>
            <ul className="mt-4 space-y-2.5 text-sm text-sand-200/60">
              <li className="flex gap-2.5"><Check size={14} className="mt-1 shrink-0 text-gold-500" /> Every essay signed by a registered BAMS vaidya</li>
              <li className="flex gap-2.5"><Check size={14} className="mt-1 shrink-0 text-gold-500" /> Classical citations checked against source texts</li>
              <li className="flex gap-2.5"><Check size={14} className="mt-1 shrink-0 text-gold-500" /> GMP-certified formulations, batch-tested</li>
            </ul>
            <p className="mt-6 flex items-center gap-2 text-sm text-sand-200/60"><Mail size={14} className="text-gold-500" /> {settings.contactEmail}</p>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-forest-800 pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sand-200/40">© 2026 Vaidyagan · Knowledge is medicine</p>
          <Link to="/admin" className="font-mono text-[10px] uppercase tracking-[0.18em] text-sand-200/30 transition-colors hover:text-gold-400">Admin Console</Link>
        </div>
      </div>
    </footer>
  );
}

/* ================================ home page ================================ */

function HomePage({ onAdd, onCart }: { onAdd: (id: string) => void; onCart: () => void }) {
  useDb();
  const nav = useNavigate();
  const products = listProducts().filter((p) => p.isVisible);
  const articles = publishedArticles().slice(0, 4);
  const herbs = listHerbs().slice(0, 4);

  return (
    <div>
      {/* hero — opens with the wheel, not a headline trio */}
      <section className="relative overflow-hidden pt-24 lg:pt-28">
        <div className="absolute inset-0" aria-hidden style={{ background: "radial-gradient(62% 58% at 72% 40%, rgba(214,180,95,0.12), transparent 66%), radial-gradient(46% 42% at 14% 80%, rgba(130,179,158,0.09), transparent 70%)" }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 lg:grid-cols-[1fr_1.05fr] lg:px-8 lg:pb-24">
          <div>
            <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-gold-400">
              <span className="h-px w-10 bg-gold-500/60" /> वैद्यगण · since the classics
            </p>
            <h1 className="mt-5 font-display text-[2.6rem] font-semibold leading-[1.05] text-sand-100 sm:text-6xl">
              <span className="line-mask"><span>Ayurveda,</span></span>
              <span className="line-mask" style={{ "--lm-delay": "120ms" } as React.CSSProperties}><span className="text-gold-300 italic">clinically verified.</span></span>
            </h1>
            <p className="mt-6 max-w-lg text-[15.5px] leading-relaxed text-sand-200/65">
              Essays written by registered vaidyas, formulations built to classical ratio, and a dosha wheel that reads
              your constitution — hover a dosha to begin.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <GoldButton onClick={() => nav("/quiz")}>Take the dosha quiz <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></GoldButton>
              <button onClick={() => nav("/journal")} className="rounded-full border border-forest-700 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-sand-200/70 transition-all hover:border-gold-400 hover:text-gold-300">
                Read the journal
              </button>
            </div>
            <div className="mt-10 flex flex-wrap gap-8">
              {[["25k+", "readers a month"], ["4", "registered vaidyas"], ["100%", "classical citations"]].map(([v, l]) => (
                <div key={l}>
                  <p className="font-display text-2xl font-semibold text-gold-300">{v}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-sand-200/40">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <TridoshaWheel onPick={() => nav("/quiz")} onCore={() => nav("/quiz")} />
        </div>
      </section>

      {/* marquee */}
      <div className="relative overflow-hidden border-y border-forest-800 bg-forest-900/60 py-3">
        <div className="animate-marquee flex w-max items-center whitespace-nowrap">
          {[0, 1].map((k) => (
            <div key={k} className="flex items-center" aria-hidden={k === 1}>
              {[["Dravyaguna", "द्रव्यगुण"], ["Panchakarma", "पञ्चकर्म"], ["Dinacharya", "दिनचर्या"], ["Rasayana", "रसायन"], ["Ahara", "आहार"], ["Nidana", "निदान"], ["Prakriti", "प्रकृति"], ["Agni", "अग्नि"]].map(([en, sa]) => (
                <span key={en} className="mx-6 flex items-center gap-3">
                  <span className="font-display text-lg italic text-gold-400/70">{sa}</span>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-sand-200/35">{en}</span>
                  <span className="text-gold-500/40">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* featured formulations */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead eyebrow="The dispensary" title={<>Formulations to <em className="text-gold-300">classical ratio</em>.</>} sub="Small-batch, GMP-certified, and honest about what each one does — and doesn't." />
          <Reveal delay={150}><GoldButton onClick={() => nav("/store")}>All formulations <ArrowRight size={14} /></GoldButton></Reveal>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <ProductCard p={p} index={i} onAdd={onAdd} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* doctor's corner / journal preview */}
      <section className="relative border-y border-forest-800 bg-forest-900/60">
        <div className="leaf-field absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead eyebrow="The clinical journal" title={<>Essays with a <em className="text-gold-300">pulse</em>, not a template.</>} sub="Every piece is signed by a registered vaidya and tied to a classical verse or a citable trial." />
            <Reveal delay={150}><GoldButton onClick={() => nav("/journal")}>Browse essays <ArrowRight size={14} /></GoldButton></Reveal>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {articles.map((a, i) => (
              <Reveal key={a.id} delay={i * 90}>
                <Link to={`/article/${a.slug}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-950/70 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-500/50">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <SmartImg src={a.cover} alt={a.title} className="h-full w-full object-cover duotone transition-transform duration-700 group-hover:scale-[1.06]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 to-transparent" />
                    <span className="absolute bottom-3 left-3 flex items-center gap-2"><DoshaDots doshas={a.doshas} /></span>
                    <span className="absolute right-3 top-3 rounded-full border border-gold-500/50 bg-forest-950/70 px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-gold-300 backdrop-blur">{a.category}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg font-semibold leading-snug text-sand-100 transition-colors group-hover:text-gold-300">{a.title}</h3>
                    <p className="mt-2 line-clamp-2 text-[13px] text-sand-200/55">{a.summary}</p>
                    <p className="mt-auto flex items-center gap-2 pt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/40">
                      <span className="grid h-6 w-6 place-items-center rounded-full text-[8px] font-bold" style={{ background: `${a.author.hue}18`, color: a.author.hue }}>{a.author.initials}</span>
                      {a.author.name} · {readingMinutes(a)} min
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* herb index teaser + quiz band */}
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
        <Reveal>
          <div className="flex h-full flex-col rounded-2xl border border-forest-800 bg-forest-900/70 p-8">
            <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-moss-300"><Sparkles size={14} /> Dravyaguna index</p>
            <h3 className="mt-4 font-display text-3xl font-semibold text-sand-100">Eight monographs, <em className="text-gold-300">three lenses</em> each.</h3>
            <p className="mt-3 text-[14.5px] leading-relaxed text-sand-200/60">Every herb read through rasa (taste), virya (potency) and vipaka — the classical pharmacology that decides where an herb actually works.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {herbs.map((h) => (
                <Link key={h.id} to="/herbs" className="group rounded-xl border border-forest-700 bg-forest-950/50 p-4 transition-all hover:border-gold-500/50">
                  <p className="font-display text-lg font-semibold text-sand-100 group-hover:text-gold-300">{h.common}</p>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/40">{h.rasa.join(" · ")} · {h.virya}</p>
                </Link>
              ))}
            </div>
            <button onClick={() => nav("/herbs")} className="mt-6 inline-flex items-center gap-2 self-start font-mono text-[10.5px] uppercase tracking-[0.18em] text-gold-400 transition-colors hover:text-gold-300">
              Open the index <ArrowRight size={13} />
            </button>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gold-500/30 bg-gradient-to-br from-forest-900 to-forest-950 p-8">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl" aria-hidden />
            <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-gold-400"><HeartHandshake size={14} /> Prakriti assessment</p>
            <h3 className="mt-4 font-display text-3xl font-semibold text-sand-100">Twelve questions. <em className="text-gold-300">Three minutes.</em> One constitution.</h3>
            <p className="mt-3 text-[14.5px] leading-relaxed text-sand-200/60">Answer the way you actually are — not the way you wish you were — and get your vata·pitta·kapha proportions with a diet and routine prescription.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {(["vata", "pitta", "kapha"] as const).map((d) => {
                const m = DOSHA_META[d];
                return <span key={d} className="flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em]" style={{ borderColor: `${m.color}55`, color: m.color }}><m.Icon size={12} /> {m.name}</span>;
              })}
            </div>
            <button onClick={() => nav("/quiz")} className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-gold-400 px-7 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 active:scale-95">
              Begin the assessment <ArrowRight size={14} />
            </button>
          </div>
        </Reveal>
      </section>

      {/* community band */}
      <section className="border-t border-forest-800 bg-forest-900/50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-5 py-14 lg:px-8">
          <Reveal className="max-w-xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-400">The community</p>
            <h3 className="mt-3 font-display text-3xl font-semibold text-sand-100"><span className="text-gold-300">@vaidyagan</span> — 42,000 curious minds.</h3>
            <p className="mt-3 text-[14.5px] text-sand-200/60">Daily shlokas, OPD stories and myth-busting reels. The journal goes deeper; the feed keeps you company.</p>
          </Reveal>
          <Reveal delay={120}>
            <a href="https://instagram.com/vaidyagan" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-gold-500/50 px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-gold-300 transition-all hover:bg-gold-400 hover:text-forest-950">
              <Instagram size={16} /> Follow the family
            </a>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function ProductCard({ p, index, onAdd }: { p: Product; index: number; onAdd: (id: string) => void }) {
  const nav = useNavigate();
  const off = Math.round((1 - p.price / p.mrp) * 100);
  const out = p.stock <= 0;
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-900 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-500/50 hover:shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
      <button onClick={() => nav(`/product/${p.id}`)} className="relative block aspect-square overflow-hidden text-left" aria-label={p.name}>
        <SmartImg src={productImage(p, index)} alt={p.name} className="h-full w-full object-cover duotone transition-transform duration-700 group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full border border-gold-500/50 bg-forest-950/70 px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-gold-300 backdrop-blur">{p.category}</span>
        {off > 0 && <span className="absolute right-3 top-3 rounded-full bg-gold-400 px-2.5 py-1 font-mono text-[9px] font-bold text-forest-950">{off}% off</span>}
        {out && (
          <span className="absolute inset-0 grid place-items-center bg-forest-950/60 backdrop-blur-[2px]">
            <span className="rounded-full border border-ember-400/60 bg-forest-950/80 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ember-300">Out of stock</span>
          </span>
        )}
        {!out && p.stock < 5 && <span className="absolute bottom-3 right-3 rounded-full bg-ember-500/90 px-2.5 py-1 font-mono text-[8.5px] font-bold uppercase text-forest-950">Only {p.stock} left</span>}
      </button>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-display text-2xl italic text-gold-400/40">{p.sanskrit}</p>
        <button onClick={() => nav(`/product/${p.id}`)} className="mt-1 text-left font-display text-lg font-semibold leading-snug text-sand-100 transition-colors hover:text-gold-300">{p.name}</button>
        <p className="mt-1 line-clamp-2 text-[13px] text-sand-200/55">{p.description}</p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <div>
            <p className="font-display text-xl font-semibold text-gold-300">{inr(p.price)}</p>
            <p className="font-mono text-[10px] text-sand-200/40 line-through">MRP {inr(p.mrp)}</p>
          </div>
          <button onClick={() => onAdd(p.id)} disabled={out} aria-label={`Add ${p.name} to cart`}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-all active:scale-95 ${out ? "cursor-not-allowed border border-forest-700 text-sand-200/35" : "bg-gold-400 text-forest-950 hover:bg-gold-300"}`}>
            <ShoppingCart size={13} /> {out ? "Sold out" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================ store page ================================ */

function StorePage({ onAdd }: { onAdd: (id: string) => void }) {
  useDb();
  const [cat, setCat] = useState("All");
  const products = listProducts().filter((p) => p.isVisible);
  const cats = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  const shown = products.filter((p) => cat === "All" || p.category === cat);
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px]" aria-hidden style={{ background: "radial-gradient(55% 90% at 50% 0%, rgba(214,180,95,0.07), transparent 70%)" }} />
      <SectionHead eyebrow="The dispensary" title={<>Every jar, <em className="text-gold-300">batch-tested</em>.</>} sub="Classical formulations in small batches. Free shipping above the threshold — the desk packs each parcel with a vaidya's note." />
      <Reveal delay={140} className="mt-8 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${cat === c ? "border-gold-400 bg-gold-400 text-forest-950" : "border-forest-700 text-sand-200/60 hover:text-sand-100"}`}>{c}</button>
        ))}
      </Reveal>
      <p className="relative mt-6 font-mono text-[10.5px] uppercase tracking-[0.2em] text-sand-200/40">{shown.length} formulation{shown.length === 1 ? "" : "s"} · GMP certified</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p, i) => <Reveal key={p.id} delay={(i % 3) * 80}><ProductCard p={p} index={i} onAdd={onAdd} /></Reveal>)}
      </div>
    </div>
  );
}

/* ============================ product detail page ============================ */

function ProductDetailPage({ onAdd, onBuy }: { onAdd: (id: string) => void; onBuy: (id: string) => void }) {
  useDb();
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const products = listProducts();
  const index = products.findIndex((p) => p.id === id);
  const p = products[index];
  const [view, setView] = useState(0);
  const [active, setActive] = useState("overview");
  const wrapRef = useRef<HTMLDivElement>(null);

  const extra = p ? pdpFor(p, index) : null;
  const sections = ["overview", "ingredients", "directions", "safety", "reviews"];

  useEffect(() => {
    const onScroll = () => {
      if (!wrapRef.current) return;
      let current = "overview";
      sections.forEach((s) => {
        const el = document.getElementById(`pdp-${s}`);
        if (el && el.getBoundingClientRect().top < 180) current = s;
      });
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!p || !extra) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-40 text-center">
        <Package size={40} className="mx-auto text-forest-600" />
        <h1 className="mt-6 font-display text-3xl font-semibold text-sand-100">That formulation isn't on the shelf</h1>
        <p className="mt-3 text-sand-200/60">It may have been retired or renamed by the desk.</p>
        <button onClick={() => nav("/store")} className="mt-8 rounded-full bg-gold-400 px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950">Back to the store</button>
      </div>
    );
  }

  const off = Math.round((1 - p.price / p.mrp) * 100);
  const out = p.stock <= 0;
  const avg = extra.reviews.length ? extra.reviews.reduce((s, r) => s + r.rating, 0) / extra.reviews.length : 0;
  const views = [
    { label: "Studio", cls: "duotone" },
    { label: "Warm light", cls: "duotone brightness-110 sepia-[0.2]" },
    { label: "Detail", cls: "duotone object-[50%_30%] scale-125" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-32" ref={wrapRef}>
      <button onClick={() => nav("/store")} className="mb-6 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-sand-200/50 transition-colors hover:text-gold-300"><ArrowLeft size={13} /> Dispensary</button>
      <div className="grid gap-10 lg:grid-cols-2">
        {/* gallery */}
        <Reveal>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-forest-800 bg-forest-900">
            <SmartImg src={productImage(p, index)} alt={p.name} className={`h-full w-full transition-all duration-700 ${views[view].cls}`} />
            <span className="absolute left-4 top-4 rounded-full border border-gold-500/50 bg-forest-950/70 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-gold-300 backdrop-blur">{p.category}</span>
            {off > 0 && <span className="absolute right-4 top-4 rounded-full bg-gold-400 px-3 py-1 font-mono text-[10px] font-bold text-forest-950">{off}% off</span>}
          </div>
          <div className="mt-3 flex gap-3">
            {views.map((v, i) => (
              <button key={v.label} onClick={() => setView(i)} aria-label={`View: ${v.label}`}
                className={`relative h-20 flex-1 overflow-hidden rounded-xl border-2 transition-all ${view === i ? "border-gold-400" : "border-forest-800 opacity-60 hover:opacity-100"}`}>
                <SmartImg src={productImage(p, index)} alt={`${p.name} ${v.label}`} className={`h-full w-full ${v.cls}`} />
              </button>
            ))}
          </div>
        </Reveal>

        {/* buy box */}
        <Reveal delay={120}>
          <p className="font-display text-3xl italic text-gold-400/50">{p.sanskrit}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-sand-100 sm:text-4xl">{p.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {extra.reviews.length > 0 ? (
              <button onClick={() => { document.getElementById("pdp-reviews")?.scrollIntoView({ behavior: "smooth" }); }} className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:text-gold-300">
                <span className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} className={n <= Math.round(avg) ? "fill-gold-400 text-gold-400" : "text-forest-600"} />)}</span>
                {avg.toFixed(1)} · {extra.reviews.length} reviews
              </button>
            ) : (
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-sand-200/40">New batch — no reviews yet</span>
            )}
            <span className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em]" style={{ color: out ? "#e07f49" : "#82b39e" }}>
              <span className={`h-2 w-2 rounded-full ${out ? "bg-ember-400" : "animate-blink bg-kapha-400"}`} /> {out ? "Out of stock" : p.stock < 5 ? `Only ${p.stock} left` : "In stock"}
            </span>
          </div>
          <div className="mt-5 flex items-baseline gap-3">
            <p className="font-display text-4xl font-semibold text-gold-300">{inr(p.price)}</p>
            <p className="font-mono text-sm text-sand-200/40 line-through">MRP {inr(p.mrp)}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-moss-300">incl. all taxes</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => onAdd(p.id)} disabled={out}
              className={`flex items-center gap-2 rounded-full px-7 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] transition-all active:scale-95 ${out ? "cursor-not-allowed border border-forest-700 text-sand-200/35" : "border border-gold-500/60 text-gold-300 hover:bg-gold-400/10"}`}>
              <ShoppingCart size={15} /> Add to cart
            </button>
            <button onClick={() => onBuy(p.id)} disabled={out}
              className={`flex items-center gap-2 rounded-full px-7 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] transition-all active:scale-95 ${out ? "cursor-not-allowed border border-forest-700 text-sand-200/35" : "bg-gold-400 text-forest-950 hover:bg-gold-300 hover:shadow-[0_0_28px_rgba(214,180,95,0.35)]"}`}>
              Buy now <ArrowRight size={14} />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2.5">
            {[["100%", "Ayurvedic"], ["GMP", "Certified"], ["Secure", "Payments"]].map(([t, s], i) => (
              <div key={s} className="flex items-center gap-2 rounded-xl border border-forest-800 bg-forest-900/60 px-3 py-2.5">
                {i === 0 ? <Leaf size={15} className="shrink-0 text-gold-400" /> : i === 1 ? <ShieldCheck size={15} className="shrink-0 text-moss-300" /> : <Lock size={15} className="shrink-0 text-steel-300" />}
                <span><span className="block text-[11.5px] font-semibold text-sand-100">{t}</span><span className="block font-mono text-[8px] uppercase tracking-[0.12em] text-sand-200/40">{s}</span></span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-forest-800 bg-forest-900/60 px-4 py-3 text-[12.5px] text-sand-200/55">
            <Truck size={15} className="shrink-0 text-gold-400" /> Ships in 48h · free above {inr(getSettings().freeShippingThreshold)}
          </div>
        </Reveal>
      </div>

      {/* section nav + body */}
      <div className="sticky top-16 z-30 mt-12 border-y border-forest-800 bg-forest-950/90 backdrop-blur">
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {sections.map((s) => (
            <button key={s} onClick={() => document.getElementById(`pdp-${s}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={`whitespace-nowrap border-b-2 px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-all ${active === s ? "border-gold-400 text-gold-300" : "border-transparent text-sand-200/45 hover:text-sand-100"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 max-w-3xl space-y-14">
        <section id="pdp-overview" className="scroll-mt-36">
          <h2 className="font-display text-2xl font-semibold text-sand-100">Highlights</h2>
          <ul className="mt-4 space-y-2.5">
            {p.highlights.map((h) => <li key={h} className="flex gap-3 text-[15px] text-sand-200/80"><Check size={16} className="mt-1 shrink-0 text-gold-400" />{h}</li>)}
          </ul>
          <blockquote className="mt-6 rounded-r-xl border-l-2 border-gold-400 bg-forest-900/70 p-5 font-display text-lg italic text-gold-300/90">{extra.classicalSource}</blockquote>
          {extra.detail.map((d, i) => <p key={i} className="mt-4 text-[15px] leading-relaxed text-sand-200/75">{d}</p>)}
        </section>

        <section id="pdp-ingredients" className="scroll-mt-36">
          <h2 className="font-display text-2xl font-semibold text-sand-100">Key ingredients</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {extra.ingredientDetails.map((ing) => (
              <div key={ing.name} className="flex gap-3.5 rounded-xl border border-forest-800 bg-forest-900/60 p-4 transition-colors hover:border-gold-500/40">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold-500/40 bg-gold-400/10 text-gold-300"><Leaf size={16} /></span>
                <span><span className="block text-[14px] font-semibold text-sand-100">{ing.name}</span><span className="mt-0.5 block text-[12.5px] leading-snug text-sand-200/55">{ing.note}</span></span>
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/35">Also contains: {p.ingredients.join(" · ")}</p>
        </section>

        <section id="pdp-directions" className="scroll-mt-36">
          <h2 className="font-display text-2xl font-semibold text-sand-100">Directions & dosage</h2>
          <ol className="mt-5 space-y-3">
            {extra.steps.map((s, i) => (
              <li key={i} className="flex gap-4 rounded-xl border border-forest-800 bg-forest-900/60 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-400 font-display text-sm font-bold text-forest-950">{i + 1}</span>
                <span className="text-[14.5px] leading-relaxed text-sand-200/80">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 flex items-center gap-2 text-[13.5px] text-sand-200/55"><Clock size={14} className="text-gold-400" /> Standard dosage: {p.dosage}</p>
        </section>

        <section id="pdp-safety" className="scroll-mt-36">
          <h2 className="font-display text-2xl font-semibold text-sand-100">Safety & precautions</h2>
          <div className="mt-5 rounded-xl border border-ember-500/40 bg-ember-500/5 p-5">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-ember-300">Please read</p>
            <p className="mt-2 text-[14px] leading-relaxed text-sand-200/75">{p.safetyNotes}</p>
          </div>
          <p className="mt-3 text-[12.5px] text-sand-200/45">Keep out of reach of children. This product is not a substitute for medical advice — consult a registered practitioner for persistent symptoms.</p>
        </section>

        <section id="pdp-reviews" className="scroll-mt-36">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold text-sand-100">Patient reviews</h2>
            <button onClick={() => toast("Review form opens after your next order — verified purchases only.", "warn")} className="rounded-full border border-forest-700 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">Write a review</button>
          </div>
          {extra.reviews.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-forest-700 p-6 text-center text-[13.5px] text-sand-200/50">This is a fresh batch — reviews arrive with verified orders.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {extra.reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-forest-800 bg-forest-900/60 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-400/15 font-display text-sm font-semibold text-gold-300">{r.name[0]}</span>
                    <span className="text-[14px] font-semibold text-sand-100">{r.name}</span>
                    {r.verified && <span className="flex items-center gap-1 rounded-full border border-moss-500/40 bg-moss-500/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-moss-300"><BadgeCheck size={10} /> Verified purchase</span>}
                    <span className="ml-auto flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={13} className={n <= r.rating ? "fill-gold-400 text-gold-400" : "text-forest-600"} />)}</span>
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-sand-200/70">{r.text}</p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/35">{formatDate(r.date)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ============================== cart + checkout ============================== */

type CheckoutStage = "cart" | "auth" | "delivery" | "payment" | "done";

function CartDrawer({ open, onClose, onCheckout }: { open: boolean; onClose: () => void; onCheckout: (stage: CheckoutStage) => void }) {
  useDb();
  const toast = useToast();
  const cart = loadCart();
  const lines = cart.map((l) => ({ ...l, p: getProduct(l.productId) })).filter((l) => l.p);
  const subtotal = lines.reduce((s, l) => s + (l.p?.price ?? 0) * l.qty, 0);
  const settings = getSettings();
  const progress = Math.min(100, (subtotal / settings.freeShippingThreshold) * 100);
  const account = accountSession();

  const setQty = (id: string, qty: number) => {
    persistCart(loadCart().map((l) => (l.productId === id ? { ...l, qty: Math.max(1, qty) } : l)));
  };
  const remove = (id: string) => {
    persistCart(loadCart().filter((l) => l.productId !== id));
    toast("Removed from basket");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-forest-950/70 backdrop-blur-sm" onClick={onClose} />
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col border-l border-forest-800 bg-forest-900" role="dialog" aria-label="Shopping cart">
            <div className="flex items-center justify-between border-b border-forest-800 px-6 py-5">
              <p className="font-display text-2xl font-semibold text-sand-100">Your basket</p>
              <button onClick={onClose} aria-label="Close cart" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={15} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingCart size={38} className="text-forest-600" />
                  <p className="mt-4 font-display text-xl text-sand-200/70">The basket is empty</p>
                  <p className="mt-2 text-sm text-sand-200/45">Classical formulations are waiting in the dispensary.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lines.map((l) => (
                    <div key={l.productId} className="flex gap-4 rounded-xl border border-forest-800 bg-forest-850/60 p-3">
                      <SmartImg src={productImage(l.p!, 0)} alt={l.p!.name} className="h-20 w-20 shrink-0 rounded-lg object-cover duotone" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-sand-100">{l.p!.name}</p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-gold-400/80">{inr(l.p!.price)}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded-full border border-forest-700 px-1 py-0.5">
                            <button onClick={() => setQty(l.productId, l.qty - 1)} aria-label="Decrease" className="grid h-6 w-6 place-items-center text-sand-200/70 hover:text-gold-300"><Minus size={12} /></button>
                            <span className="w-5 text-center font-mono text-xs text-sand-100">{l.qty}</span>
                            <button onClick={() => setQty(l.productId, l.qty + 1)} aria-label="Increase" className="grid h-6 w-6 place-items-center text-sand-200/70 hover:text-gold-300"><Plus size={12} /></button>
                          </div>
                          <button onClick={() => remove(l.productId)} aria-label="Remove item" className="text-sand-200/35 transition-colors hover:text-ember-400"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-forest-800 px-6 py-5">
              <div className="mb-4">
                <div className="flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/50">
                  <span>Free shipping at {inr(settings.freeShippingThreshold)}</span>
                  <span>{subtotal >= settings.freeShippingThreshold ? "Unlocked ✓" : `${inr(settings.freeShippingThreshold - subtotal)} away`}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-forest-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300 transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-sand-200/60">Subtotal</span>
                <span className="font-display text-2xl font-semibold text-sand-100">{inr(subtotal)}</span>
              </div>
              <button onClick={() => onCheckout(account ? "delivery" : "auth")} disabled={lines.length === 0}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 active:scale-[0.99] disabled:opacity-35">
                {account ? "Proceed to checkout" : "Sign in to checkout"} <ArrowRight size={14} />
              </button>
              {!account && <p className="mt-2.5 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/35">OTP · Google · Email — your basket stays safe</p>}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ auth modal ------------------------------ */

function AuthModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [tab, setTab] = useState<"otp" | "google" | "email">("otp");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const sendOtp = () => {
    if (phone.replace(/\D/g, "").length < 10) { setError("Enter a 10-digit mobile number."); return; }
    setOtpCode(String(Math.floor(1000 + Math.random() * 9000)));
    setOtpSent(true);
    setError("");
  };
  const verifyOtp = () => {
    if (otp !== otpCode) { setError("That code doesn't match — try again."); return; }
    const acct = loginOtp(phone, name || undefined);
    toast(`Namaste, ${acct.name} — welcome`);
    onDone();
  };
  const doGoogle = () => {
    const acct = loginGoogle(email || "you@gmail.com", name || "Google friend");
    toast(`Namaste, ${acct.name} — signed in with Google`);
    onDone();
  };
  const doEmail = () => {
    if (!name.trim() || !email.includes("@") || password.length < 4) { setError("Fill name, a valid email, and a 4+ character password."); return; }
    const existing = loginEmail(email, password);
    if (existing) { toast(`Welcome back, ${existing.name}`); onDone(); return; }
    const res = registerEmail(name.trim(), email, password);
    if (!res.ok) { setError(res.error ?? "Couldn't create the account."); return; }
    toast(`Account created — welcome, ${res.account!.name}`);
    onDone();
  };

  const inp = "w-full rounded-xl border border-forest-700 bg-forest-950/70 px-4 py-3 text-[14.5px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[64] grid place-items-center bg-forest-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900 p-7 shadow-[0_30px_100px_rgba(0,0,0,0.6)]" role="dialog" aria-label="Sign in">
            <div className="flex items-center justify-between">
              <p className="font-display text-2xl font-semibold text-sand-100">Sign in</p>
              <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={15} /></button>
            </div>
            <p className="mt-1.5 text-[13px] text-sand-200/55">Your basket is saved — sign in to continue.</p>
            <div className="mt-5 flex gap-1.5 rounded-full border border-forest-800 bg-forest-950/60 p-1">
              {(["otp", "google", "email"] as const).map((t) => (
                <button key={t} onClick={() => { setTab(t); setError(""); }} className={`flex-1 rounded-full py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-all ${tab === t ? "bg-gold-400 text-forest-950" : "text-sand-200/50 hover:text-sand-100"}`}>{t}</button>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {tab === "otp" && (
                <>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className={inp} />
                  <div className="flex gap-2">
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number" inputMode="tel" className={inp} />
                    <button onClick={sendOtp} className="shrink-0 rounded-xl border border-gold-500/60 px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">Send OTP</button>
                  </div>
                  {otpSent && (
                    <div className="rounded-xl border border-gold-500/40 bg-gold-400/5 p-3">
                      <p className="text-[12px] text-gold-300">Demo code: <b className="font-mono">{otpCode}</b></p>
                      <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="4-digit code" inputMode="numeric" className={`${inp} mt-2`} />
                    </div>
                  )}
                  {otpSent && <button onClick={verifyOtp} className="w-full rounded-xl bg-gold-400 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Verify & continue</button>}
                </>
              )}
              {tab === "google" && (
                <>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name on your Google account" className={inp} />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" className={inp} />
                  <button onClick={doGoogle} className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-forest-700 bg-forest-950/60 py-3 text-[14px] font-semibold text-sand-100 transition-all hover:border-gold-400">
                    <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.1 1.6l3-3A10.6 10.6 0 0 0 12 1.2 10.8 10.8 0 0 0 2.3 7.1l3.5 2.7A6.4 6.4 0 0 1 12 5.4Z"/><path fill="#4285F4" d="M22.8 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.1a5.2 5.2 0 0 1-2.3 3.4l3.5 2.7c2.1-2 3.5-4.9 3.5-8Z"/><path fill="#FBBC05" d="M5.8 14.2a6.5 6.5 0 0 1 0-4.4L2.3 7.1a10.8 10.8 0 0 0 0 9.8l3.5-2.7Z"/><path fill="#34A853" d="M12 22.8c2.9 0 5.4-1 7.2-2.6l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1a6.4 6.4 0 0 1-6.2-4.4l-3.5 2.7a10.8 10.8 0 0 0 9.7 5.9Z"/></svg>
                    Continue with Google
                  </button>
                </>
              )}
              {tab === "email" && (
                <>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inp} />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inp} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (new accounts: creates one)" className={inp} />
                  <button onClick={doEmail} className="w-full rounded-xl bg-gold-400 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Sign in / create account</button>
                </>
              )}
              {error && <p className="rounded-xl border border-ember-500/40 bg-ember-500/10 px-4 py-2.5 text-[12.5px] text-ember-300">{error}</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ checkout modal ------------------------------ */

function CheckoutModal({ stage, setStage, onClose }: { stage: CheckoutStage; setStage: (s: CheckoutStage) => void; onClose: () => void }) {
  useDb();
  const toast = useToast();
  const settings = getSettings();
  const account = accountSession();
  const cart = loadCart();
  const lines = cart.map((l) => ({ ...l, p: getProduct(l.productId) })).filter((l) => l.p);
  const subtotal = lines.reduce((s, l) => s + (l.p?.price ?? 0) * l.qty, 0);

  const [form, setForm] = useState({ name: account?.name ?? "", phone: account?.phone ?? "", address: "", city: "", pin: "" });
  const [saveAddr, setSaveAddr] = useState(true);
  const [pay, setPay] = useState("UPI");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placedId, setPlacedId] = useState("");

  const shipping = subtotal - (discount?.amount ?? 0) >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
  const total = subtotal - (discount?.amount ?? 0) + shipping;

  const applyCode = () => {
    const res = validateDiscountCode(code, subtotal);
    if (res.ok) { setDiscount({ code: res.code!, amount: res.amount }); setCodeMsg({ ok: true, text: res.message }); }
    else { setDiscount(null); setCodeMsg({ ok: false, text: res.message }); }
  };

  const confirm = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) { toast("Fill your name, phone and address first.", "warn"); return; }
    setPlacing(true);
    window.setTimeout(() => {
      const order = placeOrder({
        name: form.name, email: account?.email ?? "", phone: form.phone,
        address: `${form.address}, ${form.city} ${form.pin}`.replace(/\s+/g, " ").trim(),
        paymentMethod: pay, discount: discount ?? undefined,
      }, loadCart());
      setPlacing(false);
      if (!order) { toast("Couldn't place the order — please retry.", "warn"); return; }
      if (account && saveAddr) {
        updateAccount(account.id, { addresses: [...account.addresses, { id: `addr_${Date.now()}`, label: "Home", line: form.address, city: form.city, pin: form.pin, isDefault: account.addresses.length === 0 }] });
      }
      setPlacedId(order.id);
      setStage("done");
    }, 900);
  };

  const inp = "w-full rounded-xl border border-forest-700 bg-forest-950/70 px-4 py-3 text-[14.5px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
  const label = "mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[65] grid place-items-center bg-forest-950/80 p-4 backdrop-blur-sm">
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-forest-700 bg-forest-900 shadow-[0_30px_100px_rgba(0,0,0,0.65)]" role="dialog" aria-label="Checkout">
        {stage === "auth" ? (
          <div className="p-8 text-center">
            <UserIcon size={32} className="mx-auto text-gold-400" />
            <h3 className="mt-4 font-display text-2xl font-semibold text-sand-100">Sign in to continue</h3>
            <p className="mt-2 text-[13.5px] text-sand-200/55">Your basket is saved. Sign in and we'll take you straight to delivery details.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setStage("delivery")} className="rounded-full bg-gold-400 px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">I'm signed in</button>
              <button onClick={onClose} className="rounded-full border border-forest-700 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-sand-200/60 hover:text-sand-100">Back</button>
            </div>
          </div>
        ) : stage === "delivery" ? (
          <div className="p-7">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-sand-100">Delivery details</h3>
              <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={15} /></button>
            </div>
            <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-sand-200/40">Step 1 of 2 · shipping</p>
            <div className="mt-5 space-y-3.5">
              <div><label className={label}>Full name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} placeholder="As on your ID" /></div>
              <div><label className={label}>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} placeholder="+91 …" inputMode="tel" /></div>
              <div><label className={label}>Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inp} placeholder="Flat, street, landmark" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>City</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inp} placeholder="Pune" /></div>
                <div><label className={label}>PIN</label><input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} className={inp} placeholder="411001" inputMode="numeric" /></div>
              </div>
              {account && (
                <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-sand-200/60">
                  <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="h-4 w-4 accent-[#d6b45f]" />
                  Save this address to my account
                </label>
              )}
            </div>
            <button onClick={() => setStage("payment")} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">
              Continue to payment <ArrowRight size={14} />
            </button>
          </div>
        ) : stage === "payment" ? (
          <div className="p-7">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-sand-100">Payment</h3>
              <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={15} /></button>
            </div>
            <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-sand-200/40">Step 2 of 2 · confirm & pay</p>
            <div className="mt-5 space-y-2.5">
              {[["UPI", "GPay · PhonePe · BHIM"], ["Card", "Visa · Mastercard · RuPay"], ["COD", "Pay on delivery"]].filter(([m]) => (m === "UPI" ? settings.paymentUPI : m === "Card" ? settings.paymentCard : settings.paymentCOD)).map(([m, d]) => (
                <button key={m} onClick={() => setPay(m)} className={`flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${pay === m ? "border-gold-400 bg-gold-400/10" : "border-forest-700 hover:border-forest-600"}`}>
                  <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${pay === m ? "border-gold-400" : "border-forest-600"}`}>{pay === m && <span className="h-2.5 w-2.5 rounded-full bg-gold-400" />}</span>
                  <span><span className="block text-[14px] font-semibold text-sand-100">{m}</span><span className="block text-[11.5px] text-sand-200/45">{d}</span></span>
                </button>
              ))}
            </div>
            <div className="mt-5">
              <label className={label}>Discount code</label>
              <div className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. WELCOME10" className={inp} />
                <button onClick={applyCode} className="shrink-0 rounded-xl border border-gold-500/60 px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">Apply</button>
              </div>
              {codeMsg && <p className={`mt-2 text-[12px] ${codeMsg.ok ? "text-moss-300" : "text-ember-300"}`}>{codeMsg.text}</p>}
            </div>
            <div className="mt-5 space-y-2 rounded-xl border border-forest-800 bg-forest-950/50 p-4 text-[13.5px]">
              <div className="flex justify-between text-sand-200/60"><span>Subtotal ({lines.reduce((s, l) => s + l.qty, 0)} items)</span><span>{inr(subtotal)}</span></div>
              {discount && <div className="flex justify-between text-moss-300"><span>Discount ({discount.code})</span><span>− {inr(discount.amount)}</span></div>}
              <div className="flex justify-between text-sand-200/60"><span>Shipping</span><span>{shipping === 0 ? "Free" : inr(shipping)}</span></div>
              <div className="mt-1 flex justify-between border-t border-forest-800 pt-2 font-display text-lg font-semibold text-gold-300"><span>Total</span><span>{inr(total)}</span></div>
            </div>
            <button onClick={confirm} disabled={placing}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 active:scale-[0.99] disabled:opacity-60">
              {placing ? <><span className="animate-spin-fast h-4 w-4 rounded-full border-2 border-forest-950 border-t-transparent" /> Placing…</> : <><Lock size={14} /> Confirm & place order</>}
            </button>
            <p className="mt-2.5 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/35">Demo checkout — no money moves</p>
          </div>
        ) : (
          <div className="p-8 text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-kapha-400 bg-kapha-500/15 text-kapha-300"><Check size={34} /></span>
            <h3 className="mt-5 font-display text-2xl font-semibold text-sand-100">Order {placedId} confirmed</h3>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-sand-200/55">The desk has been notified. Your formulations are batch-checked and ship within 48 hours — track them in My Account.</p>
            <button onClick={onClose} className="mt-6 rounded-full bg-gold-400 px-7 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Continue browsing</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ================================ journal ================================ */

function JournalPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const articles = publishedArticles();
  const cats = ["All", ...Array.from(new Set(articles.map((a) => a.category)))];
  const shown = articles.filter((a) => (cat === "All" || a.category === cat) && (!q || a.title.toLowerCase().includes(q.toLowerCase()) || a.summary.toLowerCase().includes(q.toLowerCase()) || a.symptoms.some((s) => s.includes(q.toLowerCase()))));
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead eyebrow="The clinical journal" title={<>Read like a <em className="text-gold-300">vaidya</em> thinks.</>} sub={`${articles.length} essays across ${cats.length - 1} disciplines — each one cited, dosha-tagged and signed.`} />
        <Reveal delay={140} className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search essays, symptoms…" aria-label="Search essays"
            className="w-full rounded-full border border-forest-700 bg-forest-900/80 py-3 pl-11 pr-4 text-sm text-sand-100 placeholder:text-sand-200/35 focus:border-gold-400 focus:outline-none" />
        </Reveal>
      </div>
      <Reveal delay={160} className="mt-8 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${cat === c ? "border-gold-400 bg-gold-400 text-forest-950" : "border-forest-700 text-sand-200/60 hover:text-sand-100"}`}>{c}</button>
        ))}
      </Reveal>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((a, i) => (
          <Reveal key={a.id} delay={(i % 3) * 80}>
            <Link to={`/article/${a.slug}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-900 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-500/50">
              <div className="relative aspect-[16/10] overflow-hidden">
                <SmartImg src={a.cover} alt={a.title} className="h-full w-full object-cover duotone transition-transform duration-700 group-hover:scale-[1.06]" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full border border-gold-500/50 bg-forest-950/70 px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-gold-300 backdrop-blur">{a.category} · {a.categorySanskrit}</span>
                <span className="absolute bottom-3 left-3 flex items-center gap-2"><DoshaDots doshas={a.doshas} /><span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-sand-200/60">{a.doshas.join(" · ")}</span></span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-xl font-semibold leading-snug text-sand-100 transition-colors group-hover:text-gold-300">{a.title}</h3>
                <p className="mt-2 line-clamp-3 text-[13.5px] text-sand-200/55">{a.summary}</p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="flex items-center gap-2 text-[12.5px] text-sand-200/60">
                    <span className="grid h-7 w-7 place-items-center rounded-full text-[9px] font-bold" style={{ background: `${a.author.hue}18`, color: a.author.hue }}>{a.author.initials}</span>
                    {a.author.name}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/40"><Clock size={12} /> {readingMinutes(a)} min</span>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
      {shown.length === 0 && (
        <Reveal className="mt-10 rounded-xl border border-dashed border-forest-700 p-14 text-center">
          <p className="font-display text-2xl text-sand-200/80">Nothing under this lens yet.</p>
          <p className="mt-2 text-sm text-sand-200/50">Our vaidyas publish weekly — try clearing a filter.</p>
        </Reveal>
      )}
    </div>
  );
}

function ArticlePage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const article = getArticle(slug ?? "");
  const [activeToc, setActiveToc] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);

  const toc = useMemo(() => (article ? articleToc(article) : []), [article]);
  const body = useMemo(() => (article ? withHeadingIds(article.html) : ""), [article]);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      setProgress(Math.min(1, doc.scrollTop / (doc.scrollHeight - doc.clientHeight || 1)));
      let cur = 0;
      toc.forEach((t, i) => {
        const el = document.getElementById(t.id);
        if (el && el.getBoundingClientRect().top < 200) cur = i;
      });
      setActiveToc(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [toc]);

  const speak = () => {
    try {
      if (!article) return;
      const synth = window.speechSynthesis;
      if (speaking) { synth.cancel(); setSpeaking(false); return; }
      const text = article.html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
      const u = new SpeechSynthesisUtterance(`${article.title}. ${text}`);
      u.rate = 0.95;
      u.onend = () => setSpeaking(false);
      synth.speak(u);
      setSpeaking(true);
    } catch { toast("Narration isn't available in this browser.", "warn"); }
  };

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-40 text-center">
        <BookOpen size={40} className="mx-auto text-forest-600" />
        <h1 className="mt-6 font-display text-3xl font-semibold text-sand-100">This essay isn't on the shelf</h1>
        <p className="mt-3 text-sand-200/60">It may be in review, or the link has aged.</p>
        <button onClick={() => nav("/journal")} className="mt-8 rounded-full bg-gold-400 px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950">Back to the journal</button>
      </div>
    );
  }

  const copy = () => {
    try { navigator.clipboard?.writeText(window.location.href); toast("Link copied"); } catch { toast("Couldn't copy the link.", "warn"); }
  };

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-32">
      <div className="fixed inset-x-0 top-0 z-[55] h-0.5 bg-gold-400" style={{ width: `${progress * 100}%`, transition: "width 0.1s linear" }} aria-hidden />
      <button onClick={() => nav("/journal")} className="mb-6 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-sand-200/50 transition-colors hover:text-gold-300"><ArrowLeft size={13} /> Journal</button>
      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        {/* toc */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-gold-400">On this page</p>
            {toc.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-sand-200/45">A continuous essay — no sections.</p>
            ) : (
              <nav className="mt-3 space-y-1 border-l border-forest-800">
                {toc.map((t, i) => (
                  <button key={t.id} onClick={() => document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className={`block w-full border-l-2 py-1.5 pr-2 text-left text-[13px] transition-all ${t.level === 3 ? "pl-7" : "pl-4"} ${activeToc === i ? "border-gold-400 text-gold-300" : "border-transparent text-sand-200/50 hover:text-sand-100"}`}>
                    {t.text}
                  </button>
                ))}
              </nav>
            )}
          </div>
        </aside>

        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-gold-500/50 bg-gold-400/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-gold-300">{a_kindLabel(article.kind)}</span>
            <span className="rounded-full border border-forest-700 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/50">{a_kindCat(article)}</span>
            <span className="flex items-center gap-1.5"><DoshaDots doshas={article.doshas} /></span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-sand-100 sm:text-[2.6rem] sm:leading-[1.12]">{article.title}</h1>
          <p className="mt-3 font-display text-lg italic text-sand-200/60">{article.subtitle}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-full text-[12px] font-bold" style={{ background: `${article.author.hue}18`, color: article.author.hue, border: `1px solid ${article.author.hue}55` }}>{article.author.initials}</span>
              <span><span className="block text-[13.5px] font-semibold text-sand-100">{article.author.name}</span><span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/40">{article.author.qualification}</span></span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/40">{formatDate(article.date)} · {readingMinutes(article)} min read</span>
            <span className="ml-auto flex gap-2">
              <button onClick={speak} aria-label={speaking ? "Stop narration" : "Listen to this essay"} className={`grid h-9 w-9 place-items-center rounded-full border transition-all ${speaking ? "border-gold-400 bg-gold-400/15 text-gold-300" : "border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"}`}>
                {speaking ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <button onClick={copy} aria-label="Copy link" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200/60 transition-all hover:border-gold-400 hover:text-gold-300"><Copy size={14} /></button>
            </span>
          </div>
          <div className="relative mt-7 aspect-[16/9] overflow-hidden rounded-2xl border border-forest-800">
            <SmartImg src={article.cover} alt={article.title} className="h-full w-full object-cover duotone" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/60 to-transparent" />
          </div>
          <div className="article-prose mt-9 text-sand-200/85" dangerouslySetInnerHTML={{ __html: body }} />
          <div className="gold-rule my-10" />
          <p className="text-[12.5px] leading-relaxed text-sand-200/45">This essay is classical knowledge, not a prescription. For persistent symptoms, consult a registered practitioner in person.</p>
        </div>
      </div>
    </div>
  );
}
const a_kindLabel = (k: Article["kind"]) => (k === "case" ? "Case paper" : k === "research" ? "Research review" : "Clinical essay");
const a_kindCat = (a: Article) => `${a.category} · ${a.categorySanskrit}`;

/* ================================ herb index ================================ */

function HerbsPage() {
  const [q, setQ] = useState("");
  const [dosha, setDosha] = useState<"vata" | "pitta" | "kapha" | null>(null);
  const [open, setOpen] = useState<Herb | null>(null);
  const herbs = listHerbs();
  const shown = herbs.filter((h) => (!dosha || h.doshas.includes(dosha)) && (!q || h.common.toLowerCase().includes(q.toLowerCase()) || h.botanical.toLowerCase().includes(q.toLowerCase()) || h.treats.some((t) => t.includes(q.toLowerCase()))));
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead eyebrow="Dravyaguna index" title={<>The herb shelf, <em className="text-gold-300">read properly</em>.</>} sub="Rasa, virya and vipaka — the three lenses that decide where an herb actually works." />
        <Reveal delay={140} className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search herbs or symptoms…" aria-label="Search herbs"
            className="w-full rounded-full border border-forest-700 bg-forest-900/80 py-3 pl-11 pr-4 text-sm text-sand-100 placeholder:text-sand-200/35 focus:border-gold-400 focus:outline-none" />
        </Reveal>
      </div>
      <Reveal delay={160} className="mt-8 flex flex-wrap gap-2">
        {(["vata", "pitta", "kapha"] as const).map((d) => {
          const m = DOSHA_META[d];
          const on = dosha === d;
          return (
            <button key={d} onClick={() => setDosha(on ? null : d)} className="flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-all"
              style={on ? { borderColor: m.color, color: "#0a130e", background: m.color } : { borderColor: `${m.color}55`, color: m.color }}>
              <m.Icon size={12} /> {m.name}
            </button>
          );
        })}
        <span className="ml-auto self-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-sand-200/40">{shown.length} of {herbs.length} herbs</span>
      </Reveal>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((h, i) => (
          <Reveal key={h.id} delay={(i % 4) * 70}>
            <button onClick={() => setOpen(h)} className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-900 text-left transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-500/50">
              <div className="relative h-28 overflow-hidden" style={{ background: `linear-gradient(135deg, ${h.accent}22, rgba(15,26,19,0.9))` }}>
                <span className="absolute right-3 top-2 font-display text-4xl italic opacity-30" style={{ color: h.accent }}>{h.sanskrit}</span>
                <span className="absolute bottom-3 left-4 flex items-center gap-1.5"><DoshaDots doshas={h.doshas} /></span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="font-display text-xl font-semibold text-sand-100 transition-colors group-hover:text-gold-300">{h.common}</p>
                <p className="mt-0.5 font-mono text-[10px] italic text-sand-200/45">{h.botanical} · {h.part}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {h.rasa.slice(0, 2).map((r) => <span key={r} className="rounded-full border border-forest-700 px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-sand-200/60">{r}</span>)}
                  <span className="flex items-center gap-1 rounded-full border border-forest-700 px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-sand-200/60">{h.virya === "Hot" ? <Flame size={10} className="text-ember-400" /> : <Droplets size={10} className="text-steel-400" />} {h.virya}</span>
                </div>
                <p className="mt-3 line-clamp-2 text-[12.5px] text-sand-200/55">{h.benefits[0]}</p>
                <span className="mt-auto flex items-center gap-2 pt-4 font-mono text-[9.5px] uppercase tracking-[0.16em] text-gold-400 opacity-70 transition-all group-hover:translate-x-1 group-hover:opacity-100">Open monograph <ArrowRight size={12} /></span>
              </div>
            </button>
          </Reveal>
        ))}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[64] grid place-items-center bg-forest-950/80 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-forest-700 bg-forest-900 p-7 shadow-[0_30px_100px_rgba(0,0,0,0.65)]" role="dialog" aria-label={`${open.common} monograph`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-3xl italic" style={{ color: open.accent }}>{open.sanskrit}</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-sand-100">{open.common}</h3>
                  <p className="font-mono text-[10.5px] italic text-sand-200/50">{open.botanical} · {open.part} used</p>
                </div>
                <button onClick={() => setOpen(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={15} /></button>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {[["Rasa", open.rasa.join(", ")], ["Virya", open.virya], ["Vipaka", open.vipaka]].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-forest-800 bg-forest-850 p-3 text-center">
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-gold-400/80">{k}</p>
                    <p className="mt-1 text-[12.5px] font-semibold text-sand-100">{v}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/85">Clinical benefits</p>
              <ul className="mt-2.5 space-y-2">
                {open.benefits.map((b) => <li key={b} className="flex gap-2.5 text-[14px] text-sand-200/80"><span className="mt-[8px] h-1.5 w-1.5 shrink-0 rotate-45" style={{ background: open.accent }} />{b}</li>)}
              </ul>
              <blockquote className="mt-5 rounded-r-xl border-l-2 p-4 font-display text-[15px] italic leading-relaxed text-sand-200/90" style={{ borderColor: open.accent, background: `${open.accent}0d` }}>{open.classical}</blockquote>
              <p className="mt-5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-ember-300">Cautions</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-sand-200/70">{open.caution}</p>
              <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/35">Helps with: {open.treats.join(" · ")}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================ dosha quiz ================================ */

function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<("vata" | "pitta" | "kapha")[]>([]);
  const done = step >= QUIZ_QUESTIONS.length;
  const counts = useMemo(() => {
    const c = { vata: 0, pitta: 0, kapha: 0 };
    answers.forEach((a) => { c[a] += 1; });
    return c;
  }, [answers]);
  const total = Math.max(1, answers.length);
  const dominant = (Object.entries(counts) as ["vata" | "pitta" | "kapha", number][]).sort((a, b) => b[1] - a[1])[0][0];
  const result = DOSHA_RESULTS[dominant];

  const pick = (d: "vata" | "pitta" | "kapha") => {
    setAnswers((a) => [...a, d]);
    setStep((s) => s + 1);
  };
  const back = () => {
    if (step === 0) return;
    setAnswers((a) => a.slice(0, -1));
    setStep((s) => s - 1);
  };

  /* triangle radar for 3 doshas */
  const Radar = () => {
    const pts: Record<string, [number, number]> = { vata: [100, 18], pitta: [172, 148], kapha: [28, 148] };
    const val = (d: "vata" | "pitta" | "kapha") => counts[d] / total;
    const center: [number, number] = [100, 105];
    const point = (d: "vata" | "pitta" | "kapha"): [number, number] => {
      const [x, y] = pts[d];
      const v = Math.max(0.12, val(d));
      return [center[0] + (x - center[0]) * v, center[1] + (y - center[1]) * v];
    };
    const poly = (["vata", "pitta", "kapha"] as const).map((d) => point(d).join(",")).join(" ");
    return (
      <svg viewBox="0 0 200 190" className="mx-auto w-full max-w-[300px]">
        {[0.33, 0.66, 1].map((f) => (
          <polygon key={f} points={(["vata", "pitta", "kapha"] as const).map((d) => `${center[0] + (pts[d][0] - center[0]) * f},${center[1] + (pts[d][1] - center[1]) * f}`).join(" ")} fill="none" stroke="#20392a" strokeWidth="1" />
        ))}
        {(["vata", "pitta", "kapha"] as const).map((d) => <line key={d} x1={center[0]} y1={center[1]} x2={pts[d][0]} y2={pts[d][1]} stroke="#20392a" strokeWidth="1" />)}
        <polygon points={poly} fill="rgba(214,180,95,0.25)" stroke="#d6b45f" strokeWidth="2" strokeLinejoin="round" />
        {(["vata", "pitta", "kapha"] as const).map((d) => {
          const [x, y] = point(d);
          return <circle key={d} cx={x} cy={y} r="4" fill={DOSHA_META[d].color} />;
        })}
        {(["vata", "pitta", "kapha"] as const).map((d) => {
          const [x, y] = pts[d];
          return <text key={d} x={x} y={d === "vata" ? y - 8 : y + 18} textAnchor="middle" fill={DOSHA_META[d].color} fontSize="11" fontFamily="IBM Plex Mono, monospace" letterSpacing="2">{DOSHA_META[d].name.toUpperCase()}</text>;
        })}
      </svg>
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-28 lg:pt-36">
      <SectionHead eyebrow="Prakriti assessment" title={done ? <>Your constitution: <em style={{ color: DOSHA_META[dominant].color }}>{result.headline.toLowerCase().replace(" leads your constitution", "")}</em></> : <>Twelve questions. <em className="text-gold-300">No wrong answers.</em></>} sub={done ? undefined : "Answer the way you actually are — not the way you wish you were."} />
      {!done ? (
        <Reveal key={step} className="mt-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-forest-800">
              <div className="h-full rounded-full bg-gold-400 transition-all duration-500" style={{ width: `${(step / QUIZ_QUESTIONS.length) * 100}%` }} />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sand-200/50">{step + 1} / {QUIZ_QUESTIONS.length}</span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-gold-400">{QUIZ_QUESTIONS[step].area}</p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-sand-100 sm:text-3xl">{QUIZ_QUESTIONS[step].q}</h2>
          <div className="mt-7 space-y-3">
            {QUIZ_QUESTIONS[step].options.map((o) => {
              const m = DOSHA_META[o.dosha];
              return (
                <button key={o.dosha} onClick={() => pick(o.dosha)}
                  className="group flex w-full items-center gap-4 rounded-xl border border-forest-700 bg-forest-900/70 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-500/60 hover:bg-forest-850">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-all group-hover:scale-105" style={{ borderColor: `${m.color}66`, color: m.color, background: `${m.color}12` }}><m.Icon size={19} /></span>
                  <span className="text-[15px] leading-snug text-sand-200/85 group-hover:text-sand-100">{o.text}</span>
                  <ArrowRight size={16} className="ml-auto shrink-0 text-sand-200/25 transition-all group-hover:translate-x-1 group-hover:text-gold-300" />
                </button>
              );
            })}
          </div>
          {step > 0 && <button onClick={back} className="mt-6 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-sand-200/50 hover:text-gold-300"><ArrowLeft size={13} /> Previous</button>}
        </Reveal>
      ) : (
        <Reveal className="mt-10">
          <div className="grid gap-6 rounded-2xl border border-forest-800 bg-forest-900/70 p-7 sm:grid-cols-[1fr_1.2fr]">
            <div>
              <Radar />
              <div className="mt-4 space-y-2.5">
                {(["vata", "pitta", "kapha"] as const).map((d) => {
                  const pct = Math.round((counts[d] / total) * 100);
                  const m = DOSHA_META[d];
                  return (
                    <div key={d}>
                      <div className="flex justify-between font-mono text-[9.5px] uppercase tracking-[0.14em]"><span style={{ color: m.color }}>{m.name}</span><span className="text-sand-200/50">{pct}%</span></div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-forest-800"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full rounded-full" style={{ background: m.color }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="font-display text-2xl font-semibold text-sand-100">{result.headline}</h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-sand-200/70">{result.body}</p>
              <p className="mt-5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400">Favour on the plate</p>
              <ul className="mt-2 space-y-1.5">{result.diet.map((d) => <li key={d} className="flex gap-2.5 text-[13.5px] text-sand-200/75"><Check size={14} className="mt-0.5 shrink-0 text-gold-400" />{d}</li>)}</ul>
              <p className="mt-5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400">Allies from the shelf</p>
              <div className="mt-2 flex flex-wrap gap-2">{result.herbs.map((h) => <span key={h} className="rounded-full border border-moss-500/40 bg-moss-500/10 px-3 py-1 text-[12px] text-moss-300">{h}</span>)}</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <GoldButton onClick={() => { setAnswers([]); setStep(0); }}>Retake the assessment</GoldButton>
            <Link to="/herbs" className="inline-flex items-center gap-2 rounded-full border border-forest-700 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-sand-200/70 transition-all hover:border-gold-400 hover:text-gold-300">Browse the herb index <ArrowRight size={13} /></Link>
          </div>
        </Reveal>
      )}
    </div>
  );
}

/* ================================ contact ================================ */

function ContactPage() {
  const toast = useToast();
  const settings = getSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const to = settings.contactEmail || "vaidyagan@gmail.com";

  const mailtoHref = () => {
    const body = [`Name: ${form.name}`, `Email: ${form.email}`, `Phone: ${form.phone}`, "", form.message].join("\n");
    return `mailto:${to}?subject=${encodeURIComponent(`[Vaidyagan] ${form.subject || "Enquiry"}`)}&body=${encodeURIComponent(body)}`;
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.includes("@") || !form.message.trim()) { toast("Fill your name, email and message.", "warn"); return; }
    setSending(true);
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${to}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...form, _subject: `[Vaidyagan] ${form.subject || "New enquiry"}`, _template: "table" }),
      });
      if (!res.ok) throw new Error("send failed");
      setSent(true);
      toast("Message sent — the desk replies within 48 hours");
    } catch {
      window.location.href = mailtoHref();
      toast("Opening your email app instead…", "warn");
    } finally {
      setSending(false);
    }
  };
  const inp = "w-full rounded-xl border border-forest-700 bg-forest-950/60 px-4 py-3 text-[14.5px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
  const label = "mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80";

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <SectionHead eyebrow="Write to the desk" title={<>A human reads <em className="text-gold-300">every message</em>.</>} sub={`Questions about a formulation, an essay, or your prakriti — reach us at ${to}.`} />
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Reveal>
          {sent ? (
            <div className="rounded-2xl border border-moss-500/40 bg-moss-500/5 p-10 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-moss-400 bg-moss-500/15 text-moss-300"><Check size={28} /></span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-sand-100">Received. Namaste.</h3>
              <p className="mx-auto mt-2 max-w-sm text-[14px] text-sand-200/60">The desk replies within 48 hours — usually sooner. Meanwhile, the journal is worth a wander.</p>
              <Link to="/journal" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Read the journal <ArrowRight size={13} /></Link>
            </div>
          ) : (
            <form onSubmit={submit} className="rounded-2xl border border-forest-800 bg-forest-900/70 p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={label}>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} placeholder="Your name" /></div>
                <div><label className={label}>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} placeholder="you@example.com" /></div>
                <div><label className={label}>Phone (optional)</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} placeholder="+91 …" /></div>
                <div><label className={label}>Subject</label>
                  <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inp}>
                    <option value="">General enquiry</option>
                    <option>Question about a formulation</option>
                    <option>Question about an essay</option>
                    <option>Prakriti / consultation</option>
                    <option>Wholesale / partnership</option>
                  </select>
                </div>
              </div>
              <div className="mt-4"><label className={label}>Message</label><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className={inp} placeholder="Tell us what's on your mind…" /></div>
              <button type="submit" disabled={sending} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 disabled:opacity-60">
                {sending ? <><span className="animate-spin-fast h-4 w-4 rounded-full border-2 border-forest-950 border-t-transparent" /> Sending…</> : <><Send size={14} /> Send message</>}
              </button>
            </form>
          )}
        </Reveal>
        <Reveal delay={120}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
              <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400"><Mail size={14} /> Email</p>
              <a href={`mailto:${to}`} className="mt-2 block break-all font-display text-xl text-sand-100 transition-colors hover:text-gold-300">{to}</a>
            </div>
            <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
              <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400"><Phone size={14} /> Desk hours</p>
              <p className="mt-2 text-[14px] leading-relaxed text-sand-200/70">Mon–Sat · 10 a.m. to 7 p.m. IST<br />Consultation replies within 48 hours</p>
            </div>
            <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
              <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400"><Instagram size={14} /> Community</p>
              <a href="https://instagram.com/vaidyagan" target="_blank" rel="noreferrer" className="mt-2 block font-display text-xl text-sand-100 transition-colors hover:text-gold-300">@vaidyagan</a>
              <p className="mt-1 text-[12.5px] text-sand-200/50">Daily shlokas and OPD stories.</p>
            </div>
            <div className="rounded-2xl border border-gold-500/30 bg-gold-400/5 p-6">
              <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400"><MapPin size={14} /> A gentle note</p>
              <p className="mt-2 text-[13px] leading-relaxed text-sand-200/65">This desk offers knowledge, not emergency care. For urgent symptoms, please see a physician in person.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ================================ account ================================ */

const ORDER_FLOW = ["new", "processing", "shipped", "out-for-delivery", "delivered"] as const;
const ORDER_META: Record<string, { label: string; color: string }> = {
  new: { label: "New order", color: "#e8cf8b" },
  processing: { label: "Processing", color: "#93b1cf" },
  shipped: { label: "Shipped", color: "#d6b45f" },
  "out-for-delivery": { label: "Out for delivery", color: "#e07f49" },
  delivered: { label: "Delivered", color: "#82b39e" },
  cancelled: { label: "Cancelled", color: "#c96430" },
};

function AccountPage({ onRequireAuth }: { onRequireAuth: () => void }) {
  useDb();
  const nav = useNavigate();
  const toast = useToast();
  const account = accountSession();
  const [tab, setTab] = useState<"profile" | "addresses" | "orders">("profile");
  const [name, setName] = useState(account?.name ?? "");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [addr, setAddr] = useState({ label: "Home", line: "", city: "", pin: "" });

  useEffect(() => {
    if (account) { setName(account.name); setPhone(account.phone); }
  }, [account?.id]);

  if (!account) {
    return (
      <div className="mx-auto max-w-md px-5 pb-24 pt-36 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold-500/40 bg-gold-400/10 text-gold-300"><UserIcon size={26} /></span>
        <h1 className="mt-6 font-display text-3xl font-semibold text-sand-100">My Account</h1>
        <p className="mt-3 text-[14px] text-sand-200/60">Sign in to see your orders, addresses and profile.</p>
        <button onClick={onRequireAuth} className="mt-7 rounded-full bg-gold-400 px-7 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Sign in / create account</button>
      </div>
    );
  }

  const myOrders = listOrders().filter((o) => o.customerEmail === account.email || (account.phone && o.customerPhone === account.phone));

  const saveProfile = () => {
    updateAccount(account.id, { name: name.trim() || account.name, phone: phone.trim() });
    toast("Profile saved");
  };
  const addAddress = () => {
    if (!addr.line.trim()) { toast("Add the address line first.", "warn"); return; }
    updateAccount(account.id, { addresses: [...account.addresses, { id: `addr_${Date.now()}`, label: addr.label, line: addr.line, city: addr.city, pin: addr.pin, isDefault: account.addresses.length === 0 }] });
    setAddr({ label: "Home", line: "", city: "", pin: "" });
    toast("Address saved");
  };
  const removeAddress = (id: string) => {
    updateAccount(account.id, { addresses: account.addresses.filter((a) => a.id !== id) });
    toast("Address removed");
  };
  const inp = "w-full rounded-xl border border-forest-700 bg-forest-950/60 px-4 py-3 text-[14.5px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
  const label = "mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80";

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div className="flex flex-wrap items-center gap-5">
        <span className="grid h-16 w-16 place-items-center rounded-2xl font-display text-xl font-semibold" style={{ background: "rgba(214,180,95,0.12)", color: "#d6b45f", border: "1px solid rgba(214,180,95,0.4)" }}>
          {account.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-semibold text-sand-100">{account.name}</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/40">{account.email || account.phone} · via {account.provider}</p>
        </div>
        <button onClick={() => { logoutAccount(); toast("Signed out"); nav("/"); }} className="rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200/60 transition-all hover:border-ember-400 hover:text-ember-300">Sign out</button>
      </div>

      <div className="mt-9 flex gap-2 overflow-x-auto">
        {([["profile", "Profile"], ["addresses", "Addresses"], ["orders", `My orders · ${myOrders.length}`]] as const).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap rounded-full border px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${tab === t ? "border-gold-400 bg-gold-400 text-forest-950" : "border-forest-700 text-sand-200/60 hover:text-sand-100"}`}>{l}</button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "profile" && (
          <div className="max-w-xl rounded-2xl border border-forest-800 bg-forest-900/70 p-7">
            <div className="space-y-4">
              <div><label className={label}>Name</label><input value={name} onChange={(e) => setName(e.target.value)} className={inp} /></div>
              <div><label className={label}>Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} placeholder="+91 …" /></div>
              <div><label className={label}>Email</label><input value={account.email} disabled className={`${inp} opacity-50`} /></div>
            </div>
            <button onClick={saveProfile} className="mt-6 rounded-full bg-gold-400 px-7 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Save changes</button>
          </div>
        )}
        {tab === "addresses" && (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3">
              {account.addresses.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-8 text-center text-[13.5px] text-sand-200/50">No saved addresses yet — add one for faster checkout.</p>}
              {account.addresses.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-4 rounded-xl border border-forest-800 bg-forest-900/70 p-5">
                  <div>
                    <p className="flex items-center gap-2 text-[13px] font-semibold text-gold-300"><MapPin size={14} /> {a.label}{a.isDefault && <span className="rounded-full bg-gold-400/15 px-2 py-0.5 font-mono text-[8px] uppercase text-gold-300">Default</span>}</p>
                    <p className="mt-1.5 text-[14px] text-sand-200/75">{a.line}</p>
                    <p className="text-[12.5px] text-sand-200/50">{a.city} {a.pin}</p>
                  </div>
                  <button onClick={() => removeAddress(a.id)} aria-label="Remove address" className="text-sand-200/35 hover:text-ember-400"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div className="h-fit rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">Add address</p>
              <div className="mt-4 space-y-3">
                <div className="flex gap-2">{["Home", "Work", "Other"].map((l) => <button key={l} onClick={() => setAddr({ ...addr, label: l })} className={`rounded-full border px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-all ${addr.label === l ? "border-gold-400 bg-gold-400 text-forest-950" : "border-forest-700 text-sand-200/55"}`}>{l}</button>)}</div>
                <input value={addr.line} onChange={(e) => setAddr({ ...addr, line: e.target.value })} placeholder="Flat, street, landmark" className={inp} />
                <div className="grid grid-cols-2 gap-3">
                  <input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} placeholder="City" className={inp} />
                  <input value={addr.pin} onChange={(e) => setAddr({ ...addr, pin: e.target.value })} placeholder="PIN" className={inp} />
                </div>
              </div>
              <button onClick={addAddress} className="mt-5 w-full rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Save address</button>
            </div>
          </div>
        )}
        {tab === "orders" && (
          <div className="space-y-4">
            {myOrders.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-10 text-center text-[13.5px] text-sand-200/50">No orders yet — the dispensary awaits.</p>}
            {myOrders.map((o) => {
              const meta = ORDER_META[o.status];
              const stepIdx = ORDER_FLOW.indexOf(o.status as (typeof ORDER_FLOW)[number]);
              return (
                <div key={o.id} className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-display text-xl font-semibold text-sand-100">{o.id}</p>
                    <span className="rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em]" style={{ borderColor: `${meta.color}55`, color: meta.color, background: `${meta.color}12` }}>{meta.label}</span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/40">{formatDate(o.createdAt)}</span>
                    <span className="font-display text-lg font-semibold text-gold-300">{inr(o.total)}</span>
                  </div>
                  {o.status !== "cancelled" && (
                    <div className="mt-5 flex items-center">
                      {ORDER_FLOW.map((s, i) => {
                        const m = ORDER_META[s];
                        const on = i <= stepIdx;
                        return (
                          <React.Fragment key={s}>
                            <div className="flex flex-col items-center gap-1.5">
                              <span className={`grid h-7 w-7 place-items-center rounded-full border-2 transition-all ${on ? "border-transparent" : "border-forest-700"}`} style={on ? { background: m.color } : {}}>
                                {on && <Check size={13} strokeWidth={3} className="text-forest-950" />}
                              </span>
                              <span className="hidden max-w-[70px] text-center font-mono text-[7.5px] uppercase tracking-[0.08em] text-sand-200/40 sm:block">{m.label}</span>
                            </div>
                            {i < ORDER_FLOW.length - 1 && <div className={`mx-1 h-0.5 flex-1 rounded sm:-mt-5 ${i < stepIdx ? "bg-gold-500" : "bg-forest-700"}`} />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-5 space-y-2 border-t border-forest-800 pt-4">
                    {o.items.map((it, i) => (
                      <div key={i} className="flex items-center gap-3 text-[13.5px] text-sand-200/70">
                        <span className="h-2 w-2 rounded-full" style={{ background: it.accent }} />
                        <span className="flex-1">{it.name} × {it.qty}</span>
                        <span className="font-mono text-[12px] text-sand-200/50">{inr(it.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== gates & screens ============================== */

function StoreLocked() {
  const nav = useNavigate();
  return (
    <div className="leaf-field relative flex min-h-screen items-center justify-center bg-forest-950 px-5">
      <div className="w-full max-w-lg rounded-3xl border border-forest-700 bg-forest-900/80 p-10 text-center backdrop-blur">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold-400/40 bg-gold-400/10 text-gold-300"><Lock size={26} /></span>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-gold-400/70">वैद्यगण · Vaidyagan</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-sand-100">The dispensary is being restocked</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-sand-200/60">The store is briefly paused while we prepare the next batch of formulations. The journal and herb index remain open.</p>
        <button onClick={() => nav("/")} className="mt-7 rounded-full bg-gold-400 px-7 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Back home</button>
      </div>
    </div>
  );
}

function MaintenanceScreen() {
  return (
    <div className="leaf-field relative flex min-h-screen items-center justify-center bg-forest-950 px-5">
      <div className="w-full max-w-lg rounded-3xl border border-forest-700 bg-forest-900/80 p-10 text-center backdrop-blur">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold-400/40 bg-gold-400/10 text-gold-300"><Leaf size={26} /></span>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-gold-400/70">वैद्यगण · Vaidyagan</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-sand-100">We're polishing the shelves</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-sand-200/60">The site is briefly under maintenance while we make it better. Please check back in a little while — the formulations will be worth the wait.</p>
      </div>
    </div>
  );
}

/* ================================ site root ================================ */

export default function PublicSite() {
  useDb();
  const nav = useNavigate();
  const toast = useToast();
  const settings = getSettings();
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutStage | null>(null);
  const [account, setAccount] = useState<Account | null>(() => accountSession());

  const cart = loadCart();
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);

  useEffect(() => { setAccount(accountSession()); }, [cartOpen, authOpen, checkout]);

  const addToCart = useCallback((id: string, qty = 1) => {
    const existing = loadCart();
    const hit = existing.find((l) => l.productId === id);
    persistCart(hit ? existing.map((l) => (l.productId === id ? { ...l, qty: l.qty + qty } : l)) : [...existing, { productId: id, qty }]);
    const p = getProduct(id);
    toast(p ? `${p.name} added to basket` : "Added to basket");
    setCartOpen(true);
  }, [toast]);

  const buyNow = useCallback((id: string) => {
    const existing = loadCart();
    if (!existing.some((l) => l.productId === id)) persistCart([...existing, { productId: id, qty: 1 }]);
    setCartOpen(false);
    setCheckout(accountSession() ? "delivery" : "auth");
  }, []);

  const startCheckout = useCallback((stage: CheckoutStage) => {
    setCartOpen(false);
    setCheckout(stage);
  }, []);

  const afterAuth = useCallback(() => {
    setAuthOpen(false);
    setAccount(accountSession());
    setCheckout("delivery");
  }, []);

  /* maintenance mode blocks every public page */
  if (settings.maintenanceMode) return <MaintenanceScreen />;

  const page = window.location.hash.replace(/^#/, "") || "/";
  const isStoreRoute = page.startsWith("/store") || page.startsWith("/product");
  if (isStoreRoute && !settings.enablePublicStore) {
    return (
      <>
        <SiteNav cartCount={cartCount} onCart={() => setCartOpen(true)} onAccount={() => (accountSession() ? nav("/account") : setAuthOpen(true))} account={account} />
        <StoreLocked />
        <SiteFooter />
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={startCheckout} />
      </>
    );
  }

  return (
    <>
      <SiteNav cartCount={cartCount} onCart={() => setCartOpen(true)} onAccount={() => (accountSession() ? nav("/account") : setAuthOpen(true))} account={account} />
      <main>
        {page === "/" && <HomePage onAdd={addToCart} onCart={() => setCartOpen(true)} />}
        {page === "/store" && <StorePage onAdd={addToCart} />}
        {page.startsWith("/product/") && <ProductDetailPage onAdd={addToCart} onBuy={buyNow} />}
        {page === "/journal" && <JournalPage />}
        {page.startsWith("/article/") && <ArticlePage />}
        {page === "/herbs" && <HerbsPage />}
        {page === "/quiz" && <QuizPage />}
        {page === "/contact" && <ContactPage />}
        {page === "/account" && <AccountPage onRequireAuth={() => setAuthOpen(true)} />}
        {(page === "/studio" || page === "/admin") && null}
      </main>
      <SiteFooter />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={startCheckout} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onDone={afterAuth} />
      <AnimatePresence>{checkout && <CheckoutModal stage={checkout} setStage={setCheckout} onClose={() => setCheckout(null)} />}</AnimatePresence>
    </>
  );
}

export { loadCart, persistCart, type CartLine, listUserArticles, allArticles };
