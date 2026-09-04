import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, Reveal, ScrambleText, SectionHead, Chip, Ticker, DoshaDots, Monogram, SmartImg } from "./lib";
import {
  CATEGORIES, DOSHA_META, KIND_META, buildSymptomIndex, authorFor, categoryName, formatDate, readingTime, kindOf,
  type Article, type Dosha,
} from "./data";
import { HERBS } from "./data";
import { IMG, BRAND_LOGO_URL } from "./data";
import { isDoctorListed } from "./doctor-profile";
import { AUTHORS } from "./data";
import { Search, ArrowRight, Clock, Eye, SealCheck, Instagram, Send, Book, Mortar, Spark, Wind, Flame, Drop, Person } from "./icons";

/* ------------------------------- article card ------------------------------ */

export function ArticleCard({ article, delay = 0, big = false }: { article: Article; delay?: number; big?: boolean }) {
  const { navigate } = useApp();
  const author = authorFor(article);
  const catName = categoryName(article.categoryId);
  const kind = kindOf(article);
  const go = () => navigate({ name: "article", id: article.id });

  return (
    <Reveal delay={delay} as="article" className={`group cursor-pointer ${big ? "lg:col-span-2 lg:grid lg:grid-cols-[1.15fr_1fr]" : ""}`}>
      <div onClick={go} className="flex h-full flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-900 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-500/50 hover:shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <div className={`relative overflow-hidden ${big ? "aspect-[16/10] lg:aspect-auto lg:h-full" : "aspect-[16/10]"}`}>
          {article.cover ? (
            <SmartImg src={article.cover} alt={article.title} className="h-full w-full object-cover duotone transition-transform duration-700 group-hover:scale-[1.06]" />
          ) : (
            <div className="leaf-field grid h-full w-full place-items-center bg-forest-850">
              <span className="font-display text-6xl italic text-gold-500/25">वै</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-forest-950/10" />
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border bg-forest-950/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] backdrop-blur" style={{ borderColor: KIND_META[kind].color, color: KIND_META[kind].color }}>
              {KIND_META[kind].short}
            </span>
            <span className="rounded-full border border-gold-500/50 bg-forest-950/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 backdrop-blur">
              {catName}
            </span>
            {article.pdfUrl && (
              <span className="rounded-full border border-pitta-400/60 bg-forest-950/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-pitta-300 backdrop-blur">
                PDF · as-is
              </span>
            )}
            {article.featured && (
              <span className="rounded-full bg-gold-400 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950">Featured</span>
            )}
          </div>
          <div className="absolute bottom-3 left-4 flex items-center gap-2 text-sand-200/70">
            <DoshaDots doshas={article.doshas} />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]">{article.doshas.join(" · ")}</span>
          </div>
        </div>
        <div className={`flex flex-1 flex-col p-6 ${big ? "lg:p-8" : ""}`}>
          <h3 className={`font-display font-semibold leading-snug text-sand-100 transition-colors duration-300 group-hover:text-gold-300 ${big ? "text-2xl lg:text-[2rem] lg:leading-[1.15]" : "text-xl"}`}>
            {article.title}
          </h3>
          <p className={`mt-3 line-clamp-3 text-sm leading-relaxed text-sand-200/60 ${big ? "lg:text-[15px]" : ""}`}>{article.summary}</p>
          <div className="mt-auto flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <Monogram author={author} size={36} />
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-sand-100">
                  {author.name} <SealCheck size={13} className="text-gold-400" />
                </p>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/45">{formatDate(article.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-sand-200/50">
              <span className="flex items-center gap-1.5"><Clock size={13} /> {readingTime(article)} min</span>
              <span className="hidden items-center gap-1.5 sm:flex"><Eye size={13} /> {(article.views / 1000).toFixed(1)}k</span>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ------------------------------- tridosha wheel ------------------------------ */

const DOSHA_RING: { dosha: Dosha; pct: number; speed: number; z: number; start: number; sats: number[] }[] = [
  { dosha: "vata", pct: 52, speed: 0.0032, z: 34, start: Math.PI * 0.5, sats: [38, 158, 272] },
  { dosha: "pitta", pct: 74, speed: -0.0022, z: 78, start: Math.PI * 1.17, sats: [12, 128, 214, 318] },
  { dosha: "kapha", pct: 96, speed: 0.0015, z: 122, start: Math.PI * 1.76, sats: [66, 184, 298] },
];

const DUST = [
  { l: 7, t: 16, s: 3, d: 0 }, { l: 89, t: 11, s: 2, d: 1.2 }, { l: 13, t: 79, s: 2, d: 2.1 },
  { l: 84, t: 72, s: 3, d: 0.7 }, { l: 51, t: 3, s: 2, d: 1.6 }, { l: 95, t: 45, s: 2, d: 2.6 },
];

const DOSHA_ICON: Record<Dosha, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  vata: Wind, pitta: Flame, kapha: Drop,
};

function DoshaWheel({ onPick, onCore }: { onPick: (d: Dosha) => void; onCore: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pausedRef = useRef(false);
  const [hovered, setHovered] = useState<Dosha | null>(null);

  useEffect(() => { pausedRef.current = hovered !== null; }, [hovered]);

  useEffect(() => {
    const applyStatic = () => {
      DOSHA_RING.forEach((r, i) => {
        if (ringRefs.current[i]) ringRefs.current[i]!.style.transform = `translateZ(${r.z}px) rotate(${r.start}rad)`;
        if (nodeRefs.current[i]) nodeRefs.current[i]!.style.transform = `rotate(${-r.start}rad)`;
      });
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { applyStatic(); return; }

    const tilt = { rx: 0, ry: 0, tx: 0, ty: 0 };
    const vels = DOSHA_RING.map(() => 0);
    const angles = DOSHA_RING.map((r) => r.start);
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const el = wrapRef.current; if (!el) return;
      const b = el.getBoundingClientRect();
      tilt.tx = Math.min(1, Math.max(-1, ((e.clientX - b.left) / b.width) * 2 - 1));
      tilt.ty = Math.min(1, Math.max(-1, ((e.clientY - b.top) / b.height) * 2 - 1));
    };
    const onLeave = () => { tilt.tx = 0; tilt.ty = 0; };

    window.addEventListener("mousemove", onMove);
    const wrapEl = wrapRef.current;
    wrapEl?.addEventListener("mouseleave", onLeave);

    const tick = () => {
      tilt.rx += (-tilt.ty * 12 - tilt.rx) * 0.06;
      tilt.ry += (tilt.tx * 15 - tilt.ry) * 0.06;
      if (tiltRef.current) tiltRef.current.style.transform = `rotateX(${tilt.rx.toFixed(3)}deg) rotateY(${tilt.ry.toFixed(3)}deg)`;

      DOSHA_RING.forEach((r, i) => {
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
      wrapEl?.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[560px]" style={{ perspective: "1150px" }}>
      <div aria-hidden className="absolute left-1/2 top-1/2 h-[125%] w-[125%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(214,180,95,0.10) 0%, rgba(214,180,95,0.03) 42%, transparent 68%)" }} />
      {DUST.map((p, i) => (
        <span key={i} aria-hidden className="animate-floaty absolute rounded-full bg-gold-400/30"
          style={{ left: `${p.l}%`, top: `${p.t}%`, width: p.s, height: p.s, animationDelay: `${p.d}s`, animationDuration: `${6.5 + p.d}s` }} />
      ))}

      <div ref={tiltRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {DOSHA_RING.map((r, i) => {
          const m = DOSHA_META[r.dosha];
          const Icon = DOSHA_ICON[r.dosha];
          const isHover = hovered === r.dosha;
          const dimmed = hovered !== null && !isHover;
          return (
            <div key={r.dosha}
              ref={(el) => { ringRefs.current[i] = el; }}
              className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
              style={{ width: `${r.pct}%`, aspectRatio: "1", marginLeft: `${-r.pct / 2}%`, marginTop: `${-r.pct / 2}%`, transformStyle: "preserve-3d" }}>
              <span aria-hidden className="absolute inset-0 rounded-full border border-dashed transition-all duration-500"
                style={{ borderColor: isHover ? `${m.color}70` : `${m.color}24`, boxShadow: isHover ? `0 0 70px -18px ${m.color}99, inset 0 0 40px -24px ${m.color}55` : "none" }} />
              {r.sats.map((deg) => (
                <span key={deg} aria-hidden className="absolute inset-0" style={{ transform: `rotate(${deg}deg)` }}>
                  <i className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ background: `${m.color}8f`, boxShadow: `0 0 8px ${m.color}66` }} />
                </span>
              ))}

              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" style={{ transformStyle: "preserve-3d" }}>
                <div ref={(el) => { nodeRefs.current[i] = el; }}
                  className={`transition-all duration-500 ${dimmed ? "opacity-40 saturate-50" : "opacity-100"}`}>
                  <button
                    onClick={() => onPick(r.dosha)}
                    onMouseEnter={() => setHovered(r.dosha)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(r.dosha)}
                    onBlur={() => setHovered(null)}
                    aria-label={`Explore ${m.name} — ${m.elements}`}
                    className="pointer-events-auto group relative grid place-items-center">
                    <span aria-hidden className="absolute -inset-7 rounded-full blur-2xl transition-opacity duration-500"
                      style={{ background: `radial-gradient(circle, ${m.color}66 0%, transparent 70%)`, opacity: isHover ? 1 : 0 }} />
                    <span className="relative grid h-16 w-16 place-items-center rounded-full border-2 backdrop-blur-sm transition-all duration-500 group-hover:scale-110 sm:h-[78px] sm:w-[78px]"
                      style={{
                        borderColor: isHover ? m.color : `${m.color}80`,
                        background: `radial-gradient(circle at 32% 28%, ${m.color}40, rgba(15,26,19,0.92) 74%)`,
                        boxShadow: isHover ? `0 0 46px -6px ${m.color}bb, inset 0 0 20px ${m.color}33` : "0 12px 32px rgba(0,0,0,0.5)",
                      }}>
                      <span className="grid place-items-center gap-1">
                        <Icon size={18} style={{ color: m.color }} />
                        <span className="font-mono text-[8px] uppercase tracking-[0.24em]" style={{ color: m.color }}>{m.name}</span>
                      </span>
                    </span>
                    <span className="absolute top-full mt-2.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] transition-all duration-300"
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

/* ------------------------------ symptom finder ------------------------------ */

function SymptomFinder() {
  const { articles, navigate, toast } = useApp();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<number>(0);

  const index = useMemo(
    () => buildSymptomIndex(articles.filter((a) => a.status === "published"), HERBS.flatMap((h) => h.treats.map((t) => ({ id: h.id, term: t, label: h.common })))),
    [articles]
  );

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const seen = new Set<string>();
    return index
      .filter((h) => h.term.toLowerCase().includes(needle))
      .filter((h) => {
        const key = `${h.target.kind}-${h.target.id}-${h.term}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 7);
  }, [q, index]);

  const pick = (hit: (typeof index)[number]) => {
    setQ(""); setOpen(false);
    if (hit.target.kind === "article") navigate({ name: "article", id: hit.target.id });
    else { navigate({ name: "herbs" }); toast(`Showing ${hit.context} in the herb index`); }
  };

  const popular = ["anxiety", "sleep", "acidity", "memory", "detox", "immunity"];

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-xl border border-forest-700 bg-forest-900/80 px-5 py-4 transition-all duration-300 focus-within:border-gold-400 focus-within:shadow-[0_0_30px_rgba(214,180,95,0.15)]">
        <Search size={19} className="shrink-0 text-gold-400" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => { blurTimer.current = window.setTimeout(() => setOpen(false), 160); }}
          placeholder="Search a symptom — sleep, acidity, memory, stress…"
          className="w-full bg-transparent text-[15px] text-sand-100 placeholder:text-sand-200/35 focus:outline-none"
          aria-label="Search symptoms"
        />
        {matches.length > 0 && (
          <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-gold-400/80 sm:block">
            {matches.length} match{matches.length === 1 ? "" : "es"}
          </span>
        )}
      </div>

      {open && q.trim() && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-forest-700 bg-forest-900 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          {matches.length === 0 ? (
            <p className="px-5 py-4 text-sm text-sand-200/60">No verified match yet — our vaidyas are writing it. Try "anxiety" or "acidity".</p>
          ) : (
            matches.map((m) => (
              <button
                key={`${m.target.kind}-${m.target.id}-${m.term}`}
                onMouseDown={(e) => { e.preventDefault(); window.clearTimeout(blurTimer.current); pick(m); }}
                className="group flex w-full items-center gap-4 border-b border-forest-800 px-5 py-3.5 text-left transition-colors last:border-0 hover:bg-forest-850"
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${m.target.kind === "article" ? "bg-gold-400/12 text-gold-400" : "bg-moss-500/15 text-moss-300"}`}>
                  {m.target.kind === "article" ? <Book size={16} /> : <Mortar size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold capitalize text-sand-100">{m.term}</span>
                  <span className="block truncate text-xs text-sand-200/50">{m.context}</span>
                </span>
                <ArrowRight size={15} className="text-sand-200/30 transition-all group-hover:translate-x-1 group-hover:text-gold-300" />
              </button>
            ))
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/40">Patients search for</span>
        {popular.map((p) => (
          <button key={p} onClick={() => { setQ(p); setOpen(true); }}
            className="rounded-full border border-forest-700 px-3 py-1 text-xs capitalize text-sand-200/70 transition-all hover:border-gold-400 hover:text-gold-300">
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- home page -------------------------------- */

export function Home() {
  const { articles, navigate, toast, customer, setAccountAuthOpen } = useApp();
  const [cat, setCat] = useState<string | null>(null);
  const [dosha, setDosha] = useState<Dosha | null>(null);
  const [igHover, setIgHover] = useState<number | null>(null);
  const [picked, setPicked] = useState<Dosha | null>(null);
  const [email, setEmail] = useState("");

  const published = articles.filter((a) => a.status === "published");
  const filtered = published.filter((a) => (!cat || a.categoryId === cat) && (!dosha || a.doshas.includes(dosha)));
  const featured = filtered.find((a) => a.featured) ?? filtered[0];
  const rest = filtered.filter((a) => a.id !== featured?.id).slice(0, 5);

  const igTiles = [
    { src: IMG.coverGoldenMilk, likes: "4,967" },
    { src: IMG.coverPanchakarma, likes: "3,105" },
    { src: IMG.coverBrahmi, likes: "1,882" },
    { src: IMG.coverDinacharya, likes: "3,441" },
    { src: IMG.productOil, likes: "2,730" },
    { src: IMG.coverKadha, likes: "2,418" },
  ];

  return (
    <div>
      {/* hero — the tridosha wheel opens the page (pt clears the fixed nav) */}
      <section className="relative overflow-hidden pt-32 sm:pt-36 lg:pt-40">
        <div className="absolute inset-0" aria-hidden style={{ background: "radial-gradient(62% 58% at 72% 42%, rgba(214,180,95,0.12), transparent 66%), radial-gradient(46% 42% at 16% 78%, rgba(130,179,158,0.09), transparent 70%), radial-gradient(38% 36% at 86% 12%, rgba(111,146,182,0.07), transparent 70%)" }} />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-8 lg:px-8 lg:pb-28">
          <div>
            <Reveal>
              <p className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.32em] text-gold-400">
                <span className="h-px w-10 bg-gold-500/60" />
                <ScrambleText text="वैद्यगण · clinically verified" />
              </p>
            </Reveal>
            <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.04] text-sand-100 sm:text-6xl lg:text-[4.2rem]">
              <span className="line-mask" style={{ "--lm-delay": "80ms" } as React.CSSProperties}><span>Ayurveda,</span></span>
              <span className="line-mask" style={{ "--lm-delay": "220ms" } as React.CSSProperties}><span>read like a</span></span>
              <span className="line-mask" style={{ "--lm-delay": "360ms" } as React.CSSProperties}><span className="text-gold-300">physician thinks.</span></span>
            </h1>
            <Reveal delay={420}>
              <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-sand-200/65">
                Classical protocols and herb monographs written from the OPD by four registered vaidyas —
                every claim tied to a verse or a trial. Spin the wheel: it is the whole science in three forces.
              </p>
            </Reveal>
            <Reveal delay={540} className="mt-8 flex flex-wrap items-center gap-3.5">
              <button onClick={() => navigate({ name: "journal" })}
                className="group inline-flex items-center gap-2 rounded-full bg-gold-400 px-7 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all duration-300 hover:bg-gold-300 hover:shadow-[0_0_28px_rgba(214,180,95,0.35)] active:scale-95">
                Read the journal <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={() => navigate({ name: "quiz" })}
                className="inline-flex items-center gap-2 rounded-full border border-forest-700 px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-sand-200/75 transition-all duration-300 hover:border-gold-400 hover:text-gold-300">
                Take the dosha quiz
              </button>
            </Reveal>
            <Reveal delay={660} className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[["8", "years publishing"], ["4", "BAMS vaidyas"], ["42k", "instagram family"]].map(([n, l]) => (
                <div key={l} className="border-l border-gold-500/30 pl-4">
                  <p className="font-display text-2xl font-semibold text-gold-300">{n}</p>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/45">{l}</p>
                </div>
              ))}
            </Reveal>
          </div>

          <Reveal delay={250} className="relative">
            <DoshaWheel
              onPick={(d) => { setPicked(d); navigate({ name: "quiz" }); }}
              onCore={() => navigate({ name: "quiz" })}
            />
            <AnimatePresence>
              {picked && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-2 text-center font-mono text-[9.5px] uppercase tracking-[0.24em]"
                  style={{ color: DOSHA_META[picked].color }}
                >
                  {DOSHA_META[picked].name} — {DOSHA_META[picked].elements} · opening the quiz
                </motion.p>
              )}
            </AnimatePresence>
          </Reveal>
        </div>
      </section>

      <Ticker items={[
        { en: "Dravyaguna", sa: "द्रव्यगुण" }, { en: "Panchakarma", sa: "पञ्चकर्म" },
        { en: "Dinacharya", sa: "दिनचर्या" }, { en: "Rasayana", sa: "रसायन" },
        { en: "Ahara", sa: "आहार" }, { en: "Nidana", sa: "निदान" },
        { en: "Prakriti", sa: "प्रकृति" }, { en: "Agni", sa: "अग्नि" },
      ]} />

      {/* journal preview */}
      <section className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            eyebrow="From the clinical journal"
            title={<>Essays with a <em className="text-gold-300">pulse</em>, not a template.</>}
            sub="Disease protocols and herb monographs written from the OPD — every claim tied to a classical verse or a citable trial."
          />
          <Reveal delay={150}>
            <button onClick={() => navigate({ name: "journal" })} className="hidden items-center gap-2 rounded-full border border-gold-500/50 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-gold-300 transition-all hover:bg-gold-400 hover:text-forest-950 sm:inline-flex">
              All essays <ArrowRight size={14} />
            </button>
          </Reveal>
        </div>

        <Reveal delay={120} className="mt-9 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>
              {c.sanskrit} {c.name}
            </Chip>
          ))}
          <span className="mx-1 hidden w-px bg-forest-700 sm:block" />
          {(["vata", "pitta", "kapha"] as Dosha[]).map((d) => (
            <Chip key={d} active={dosha === d} color={DOSHA_META[d].color} onClick={() => setDosha(dosha === d ? null : d)}>
              {d}
            </Chip>
          ))}
        </Reveal>

        <div className="mt-10 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {featured && <ArticleCard article={featured} big delay={0} />}
          {rest.map((a, i) => <ArticleCard key={a.id} article={a} delay={90 * (i + 1)} />)}
        </div>
        {filtered.length === 0 && (
          <Reveal className="mt-10 rounded-xl border border-dashed border-forest-700 p-10 text-center">
            <p className="font-display text-xl text-sand-200/70">No essays under this combination yet.</p>
            <button onClick={() => { setCat(null); setDosha(null); }} className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-gold-400 hover:text-gold-300">Clear filters</button>
          </Reveal>
        )}
      </section>

      {/* doctor's corner — hidden entirely if every vaidya has switched their page off */}
      {AUTHORS.some((a) => isDoctorListed(a.id)) && (
        <section className="relative border-y border-forest-800 bg-forest-900/60">
          <div className="leaf-field absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
            <SectionHead
              eyebrow="Doctor's corner"
              title={<>The vaidyas behind <em className="text-gold-300">every word</em>.</>}
              sub="No ghostwriters, no aggregators. Registered practitioners, decades of OPD between them, accountable by name."
            />
            <div className="no-scrollbar -mx-5 mt-10 flex snap-x gap-5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0">
              {AUTHORS.filter((a) => isDoctorListed(a.id)).map((a, i) => (
                <Reveal key={a.id} delay={i * 90} className="group w-[300px] shrink-0 snap-start rounded-xl border border-forest-800 bg-forest-950/70 p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-500/50 sm:w-[340px]">
                  <div className="flex items-center justify-between">
                    <Monogram author={a} size={52} />
                    <span className="flex items-center gap-1.5 rounded-full border border-gold-500/40 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-gold-300">
                      <SealCheck size={12} /> Verified BAMS
                    </span>
                  </div>
                  <p className="mt-5 font-display text-lg italic leading-snug text-sand-200/90">"{a.quote}"</p>
                  <div className="mt-5 border-t border-forest-800 pt-4">
                    <p className="font-semibold text-sand-100">{a.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold-400/80">{a.qualification}</p>
                    <p className="mt-1 text-xs text-sand-200/55">{a.specialty} · {a.years} yrs in practice</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* symptom finder + tools */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <SectionHead
          eyebrow="Find your medicine"
          title={<>Start from the <em className="text-gold-300">symptom</em>, not the shelf.</>}
          sub="Type what troubles you — the finder matches it to verified essays and herb monographs."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <Reveal delay={100}>
            <SymptomFinder />
            <div className="mt-8 rounded-xl border border-forest-800 bg-forest-900/70 p-6">
              <div className="flex items-center gap-3">
                <Spark size={18} className="text-gold-400" />
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold-400">How matching works</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-sand-200/65">
                Each essay and herb carries a curated symptom taxonomy maintained by our vaidyas —
                Sanskrit nidana terms mapped to how patients actually describe their trouble. One
                query can land you a protocol, a formulation, or both.
              </p>
            </div>
          </Reveal>
          <div className="flex flex-col gap-6">
            <Reveal delay={200}>
              <button onClick={() => navigate({ name: "quiz" })}
                className="group relative w-full overflow-hidden rounded-xl border border-vata-500/40 bg-gradient-to-br from-vata-500/12 to-transparent p-6 text-left transition-all duration-500 hover:-translate-y-1 hover:border-vata-400">
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-vata-300">12 questions · 3 minutes</span>
                <span className="mt-2 block font-display text-2xl font-semibold leading-snug text-sand-100 group-hover:text-vata-300">Prakriti assessment with a live radar readout</span>
                <span className="mt-2 block text-sm text-sand-200/60">Your Vata · Pitta · Kapha proportions, with diet and routine prescriptions.</span>
                <ArrowRight size={18} className="absolute right-6 top-6 text-vata-300 transition-transform group-hover:translate-x-1.5" />
              </button>
            </Reveal>
            <Reveal delay={300}>
              <button onClick={() => navigate({ name: "herbs" })}
                className="group relative w-full overflow-hidden rounded-xl border border-kapha-500/40 bg-gradient-to-br from-kapha-500/12 to-transparent p-6 text-left transition-all duration-500 hover:-translate-y-1 hover:border-kapha-400">
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-kapha-300">8 monographs · rasa–virya–vipaka</span>
                <span className="mt-2 block font-display text-2xl font-semibold leading-snug text-sand-100 group-hover:text-kapha-300">The herb index, in 3-D cards</span>
                <span className="mt-2 block text-sm text-sand-200/60">Ashwagandha to Jatamansi — energetics, doses and cautions. Vaidyas can extend it from the Studio.</span>
                <ArrowRight size={18} className="absolute right-6 top-6 text-kapha-300 transition-transform group-hover:translate-x-1.5" />
              </button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* instagram */}
      <section className="border-t border-forest-800 bg-forest-900/50">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead
              eyebrow="The community"
              title={<><span className="text-gold-300">@vaidyagan</span> — 42,000 curious minds.</>}
              sub="Daily shlokas, OPD stories and myth-busting reels. The journal goes deeper; the feed keeps you company."
            />
            <Reveal delay={150}>
              <a href="https://instagram.com/vaidyagan" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-gold-500/50 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-gold-300 transition-all hover:bg-gold-400 hover:text-forest-950">
                <Instagram size={16} /> Follow the family
              </a>
            </Reveal>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {igTiles.map((t, i) => (
              <Reveal key={i} delay={i * 70} as="a" className="relative block">
                <div className="group relative aspect-square overflow-hidden rounded-lg border border-forest-800"
                  onMouseEnter={() => setIgHover(i)} onMouseLeave={() => setIgHover(null)}>
                  <SmartImg src={t.src} alt={`Vaidyagan post ${i + 1}`} className="h-full w-full object-cover duotone transition-transform duration-700 group-hover:scale-110" />
                  <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-forest-950/70 backdrop-blur-[2px] transition-opacity duration-300 ${igHover === i ? "opacity-100" : "opacity-0"}`}>
                    <Instagram size={20} className="text-gold-300" />
                    <span className="font-mono text-[11px] text-sand-100">♥ {t.likes}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* newsletter */}
      <section className="relative overflow-hidden border-y border-forest-800 bg-forest-900">
        <div className="absolute inset-0" aria-hidden style={{ background: "radial-gradient(60% 120% at 50% 0%, rgba(214,180,95,0.1), transparent 65%)" }} />
        <div className="relative mx-auto max-w-3xl px-5 py-16 text-center lg:py-20">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold-400">The Sunday Sutra</p>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-sand-100 sm:text-4xl">
              One classical verse. One clinical reading. <em className="text-gold-300">Every Sunday.</em>
            </h2>
            <form
              className="mx-auto mt-8 flex max-w-md gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.includes("@")) return;
                setEmail("");
                toast("You're on the list — first sutra arrives Sunday");
              }}
            >
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.in"
                className="min-w-0 flex-1 rounded-full border border-forest-700 bg-forest-950/80 px-5 py-3 text-sm text-sand-100 placeholder:text-sand-200/30 focus:border-gold-400 focus:outline-none"
              />
              <button type="submit" className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-gold-400 text-forest-950 transition-transform hover:scale-105 active:scale-95" aria-label="Subscribe">
                <Send size={18} />
              </button>
            </form>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-sand-200/40">6,200 readers · unsubscribe anytime · no spam, ever</p>
          </Reveal>
        </div>
      </section>

      {/* account nudge */}
      {!customer && (
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <Reveal>
            <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-forest-800 bg-forest-900/70 p-8">
              <div className="flex items-center gap-5">
                <span className="grid h-14 w-14 place-items-center rounded-full border border-gold-500/40 bg-gold-400/10 text-gold-300"><Person size={24} /></span>
                <div>
                  <p className="font-display text-xl font-semibold text-sand-100">One account for orders, tracking and invoices</p>
                  <p className="mt-1 text-sm text-sand-200/55">Sign in with OTP, Google or email — 20 seconds, no password needed.</p>
                </div>
              </div>
              <button onClick={() => setAccountAuthOpen(true)} className="rounded-full bg-gold-400 px-7 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300">
                Create my account
              </button>
            </div>
          </Reveal>
        </section>
      )}
    </div>
  );
}
