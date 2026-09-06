import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp, Reveal, SectionHead, Chip, Ticker, DoshaDots, Monogram, GoldButton, SmartImg, ScrambleText } from "./lib";
import { AUTHORS, CATEGORIES, DOSHA_META, KIND_META, buildSymptomIndex, formatDate, readingTime, kindOf, categoryName, authorFor, type Article, type Dosha } from "./data";
import { isDoctorListed } from "./doctor-profile";
import { HERBS } from "./data";
import { Search, ArrowRight, Clock, Eye, SealCheck, Instagram, Send, Book, Mortar, Spark, Wind, Flame, Drop } from "./icons";

/* ------------------------------- tridosha wheel ------------------------------ */

const DOSHA_ICON: Record<Dosha, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = { vata: Wind, pitta: Flame, kapha: Drop };

function DoshaWheel({ onPick, onCore }: { onPick: (d: Dosha) => void; onCore: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pausedRef = useRef(false);
  const [hovered, setHovered] = useState<Dosha | null>(null);

  const rings: { dosha: Dosha; pct: number; speed: number; z: number; start: number; sats: number[] }[] = [
    { dosha: "vata", pct: 52, speed: 0.0032, z: 34, start: Math.PI * 0.5, sats: [38, 158, 272] },
    { dosha: "pitta", pct: 74, speed: -0.0022, z: 78, start: Math.PI * 1.17, sats: [12, 128, 214, 318] },
    { dosha: "kapha", pct: 96, speed: 0.0015, z: 122, start: Math.PI * 1.76, sats: [66, 184, 298] },
  ];

  useEffect(() => { pausedRef.current = hovered !== null; }, [hovered]);

  useEffect(() => {
    const applyStatic = () => {
      rings.forEach((r, i) => {
        if (ringRefs.current[i]) ringRefs.current[i]!.style.transform = `translateZ(${r.z}px) rotate(${r.start}rad)`;
        if (nodeRefs.current[i]) nodeRefs.current[i]!.style.transform = `rotate(${-r.start}rad)`;
      });
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { applyStatic(); return; }
    const tilt = { rx: 0, ry: 0, tx: 0, ty: 0 };
    const vels = rings.map(() => 0);
    const angles = rings.map((r) => r.start);
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
      rings.forEach((r, i) => {
        vels[i] += (r.speed * (pausedRef.current ? 0 : 1) - vels[i]) * 0.055;
        angles[i] += vels[i];
        if (ringRefs.current[i]) ringRefs.current[i]!.style.transform = `translateZ(${r.z}px) rotate(${angles[i]}rad)`;
        if (nodeRefs.current[i]) nodeRefs.current[i]!.style.transform = `rotate(${-angles[i]}rad)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const wrapEl = wrapRef.current;
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      wrapEl?.removeEventListener("mouseleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[560px]" style={{ perspective: "1150px" }}>
      <div aria-hidden className="absolute left-1/2 top-1/2 h-[125%] w-[125%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(214,180,95,0.10) 0%, rgba(214,180,95,0.03) 42%, transparent 68%)" }} />
      <div ref={tiltRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {rings.map((r, i) => {
          const m = DOSHA_META[r.dosha];
          const Icon = DOSHA_ICON[r.dosha];
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
                      style={{ borderColor: isHover ? m.color : `${m.color}80`, background: `radial-gradient(circle at 32% 28%, ${m.color}40, rgba(13,26,18,0.92) 74%)`,
                        boxShadow: isHover ? `0 0 46px -6px ${m.color}bb, inset 0 0 20px ${m.color}33` : "0 12px 32px rgba(0,0,0,0.5)" }}>
                      <span className="grid place-items-center gap-1">
                        <Icon size={18} style={{ color: m.color }} />
                        <span className="font-mono text-[8px] uppercase tracking-[0.24em]" style={{ color: m.color }}>{m.name}</span>
                      </span>
                    </span>
                    <span className="absolute top-full mt-2.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em]"
                      style={{ borderColor: isHover ? `${m.color}88` : `${m.color}3d`, color: isHover ? m.color : `${m.color}b3`, background: "rgba(8,17,12,0.88)" }}>
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
              style={{ background: "radial-gradient(circle at 36% 30%, rgba(214,180,95,0.22), rgba(13,26,18,0.94) 70%)", boxShadow: "0 0 60px rgba(214,180,95,0.22)" }}>
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

/* ------------------------------ article card --------------------------------- */

export function ArticleCard({ article, delay = 0, big = false }: { article: Article; delay?: number; big?: boolean }) {
  const { navigate } = useApp();
  const author = authorFor(article);
  const kind = kindOf(article);
  return (
    <Reveal delay={delay} className={big ? "sm:col-span-2" : ""}>
      <button onClick={() => navigate({ name: "article", id: article.id })}
        className={`card-lift group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-forest-800 bg-forest-900/60 text-left hover:border-gold-500/50 ${big ? "sm:flex-row" : ""}`}>
        <div className={`relative overflow-hidden ${big ? "sm:w-1/2" : ""}`}>
          <SmartImg src={article.cover} alt={article.title} className={`w-full object-cover duotone transition-transform duration-700 group-hover:scale-105 ${big ? "aspect-[16/9] sm:h-full" : "aspect-[16/9]"}`} />
          <span className="absolute left-3 top-3 flex gap-1.5">
            <span className="rounded-full border border-gold-500/50 bg-forest-950/75 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] backdrop-blur" style={{ color: KIND_META[kind].color, borderColor: `${KIND_META[kind].color}55` }}>{KIND_META[kind].short}</span>
            <span className="rounded-full border border-forest-700 bg-forest-950/75 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-gold-300 backdrop-blur">{categoryName(article)}</span>
          </span>
        </div>
        <div className={`flex flex-1 flex-col p-5 ${big ? "sm:p-7" : ""}`}>
          <p className="font-display text-lg font-semibold leading-snug text-sand-100 transition-colors group-hover:text-gold-300 sm:text-xl">{article.title}</p>
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-sand-200/55">{article.summary}</p>
          <div className="mt-auto flex items-center justify-between pt-4">
            <div className="flex items-center gap-2.5">
              <Monogram author={author} size={30} />
              <div>
                <p className="flex items-center gap-1 text-[11.5px] font-semibold text-sand-100">{author.name}<SealCheck size={11} className="text-gold-400" /></p>
                <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-sand-200/40">{formatDate(article.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DoshaDots doshas={article.doshas} />
              <span className="flex items-center gap-1 font-mono text-[9px] text-sand-200/45"><Clock size={11} />{readingTime(article)}m</span>
            </div>
          </div>
        </div>
      </button>
    </Reveal>
  );
}

/* --------------------------------- home page --------------------------------- */

export function Home() {
  const { articles, navigate, herbs } = useApp();
  const [cat, setCat] = useState<string | null>(null);
  const [dosha, setDosha] = useState<Dosha | null>(null);
  const [query, setQuery] = useState("");
  const [focusQ, setFocusQ] = useState(false);

  const published = articles;
  const filtered = published.filter((a) => (!cat || a.categoryId === cat) && (!dosha || a.doshas.includes(dosha)));
  const featured = filtered[0];
  const rest = filtered.slice(1, 7);

  const index = useMemo(() => buildSymptomIndex(published, herbs.flatMap((h) => h.treats.map((t) => ({ id: h.id, term: t, label: h.common })))), [published, herbs]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return index.filter((i) => i.term.includes(q)).slice(0, 6);
  }, [query, index]);

  const listedDoctors = AUTHORS.filter((a) => isDoctorListed(a.id));

  return (
    <div>
      {/* hero — the tridosha wheel opens the page */}
      <section className="relative overflow-hidden pt-28 lg:pt-36">
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(62% 58% at 72% 42%, rgba(214,180,95,0.12), transparent 66%), radial-gradient(46% 42% at 16% 78%, rgba(130,179,158,0.09), transparent 70%)" }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pb-24">
          <div>
            <p className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.3em] text-gold-400">
              <span className="h-px w-10 bg-gold-500/60" /> <ScrambleText text="Clinically verified Ayurveda" />
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] text-sand-100 sm:text-6xl sm:leading-[1.02]">
              <span className="line-mask"><span style={{ "--lm-delay": "0ms" } as React.CSSProperties}>The classics,</span></span>
              <span className="line-mask"><span style={{ "--lm-delay": "120ms" } as React.CSSProperties}>read from</span></span>
              <span className="line-mask"><span style={{ "--lm-delay": "240ms" } as React.CSSProperties} className="italic text-gold-300">the OPD.</span></span>
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-sand-200/60">
              Disease protocols and herb monographs written by registered BAMS vaidyas — every claim tied to a classical verse or a citable trial. No miracle language.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <GoldButton onClick={() => navigate({ name: "journal" })}>Read the journal <ArrowRight size={15} /></GoldButton>
              <button onClick={() => navigate({ name: "quiz" })} className="rounded-full border border-forest-700 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-sand-200/70 transition-all hover:border-gold-400 hover:text-gold-300">Find your dosha</button>
            </div>
          </div>
          <DoshaWheel onPick={() => navigate({ name: "quiz" })} onCore={() => navigate({ name: "quiz" })} />
        </div>
        <Ticker items={[
          { en: "Materia medica", sa: "द्रव्यगुण" }, { en: "Five actions", sa: "पञ्चकर्म" }, { en: "Daily routine", sa: "दिनचर्या" },
          { en: "Rejuvenation", sa: "रसायन" }, { en: "Dietetics", sa: "आहार" }, { en: "Diagnosis", sa: "निदान" },
          { en: "Constitution", sa: "प्रकृति" }, { en: "Digestive fire", sa: "अग्नि" },
        ]} />
      </section>

      {/* symptom finder */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <SectionHead eyebrow="Find your medicine" title={<>Start from the <em className="text-gold-300">symptom</em>, not the shelf.</>}
          sub="Type what troubles you — we match it to verified essays and herb monographs." />
        <Reveal delay={120} className="relative mt-8 max-w-2xl">
          <div className={`flex items-center gap-3 rounded-2xl border bg-forest-900/70 px-5 py-4 transition-all ${focusQ ? "border-gold-400 shadow-[0_0_30px_rgba(214,180,95,0.12)]" : "border-forest-700"}`}>
            <Search size={18} className="shrink-0 text-gold-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setFocusQ(true)} onBlur={() => window.setTimeout(() => setFocusQ(false), 150)}
              placeholder="Search a symptom — sleep, acidity, memory, stress…" className="w-full bg-transparent text-[15px] text-sand-100 placeholder:text-sand-200/35 focus:outline-none" aria-label="Search symptoms" />
          </div>
          {matches.length > 0 && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-forest-700 bg-forest-900 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
              {matches.map((m, i) => (
                <button key={`${m.target.kind}-${m.target.id}-${m.term}-${i}`}
                  onMouseDown={() => { if (m.target.kind === "article") navigate({ name: "article", id: m.target.id }); else navigate({ name: "herbs" }); }}
                  className="flex w-full items-center gap-3 border-b border-forest-800 px-4 py-3 text-left last:border-0 hover:bg-forest-850">
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-gold-300">{m.target.kind === "article" ? <Book size={14} /> : <Mortar size={14} />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold capitalize text-sand-100">{m.term}</span>
                    <span className="block truncate text-[11px] text-sand-200/45">{m.context}</span>
                  </span>
                  <ArrowRight size={13} className="text-sand-200/30" />
                </button>
              ))}
            </div>
          )}
        </Reveal>
      </section>

      {/* journal preview */}
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead eyebrow="From the clinical journal" title={<>Essays with a <em className="text-gold-300">pulse</em>, not a template.</>} />
          <button onClick={() => navigate({ name: "journal" })} className="rounded-full border border-gold-500/50 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-gold-300 transition-all hover:bg-gold-400 hover:text-forest-950">All essays <ArrowRight size={14} className="ml-1 inline" /></button>
        </div>
        <Reveal delay={120} className="mt-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => <Chip key={c.id} active={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>{c.sanskrit} {c.name}</Chip>)}
          <span className="mx-1 hidden w-px self-stretch bg-forest-700 sm:block" />
          {(["vata", "pitta", "kapha"] as Dosha[]).map((d) => <Chip key={d} active={dosha === d} color={DOSHA_META[d].color} onClick={() => setDosha(dosha === d ? null : d)}>{d}</Chip>)}
        </Reveal>
        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {featured && <ArticleCard article={featured} big />}
          {rest.map((a, i) => <ArticleCard key={a.id} article={a} delay={80 * (i + 1)} />)}
        </div>
      </section>

      {/* doctor's corner */}
      {listedDoctors.length > 0 && (
        <section className="relative border-y border-forest-800 bg-forest-900/50">
          <div className="ops-grid absolute inset-0 opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <SectionHead eyebrow="Doctor's corner" title={<>The vaidyas behind <em className="text-gold-300">every word</em>.</>}
              sub="No ghostwriters, no aggregators. Registered practitioners, accountable by name." />
            <div className="no-scrollbar mt-10 flex gap-5 overflow-x-auto pb-2">
              {listedDoctors.map((a, i) => (
                <Reveal key={a.id} delay={i * 90} className="w-[300px] shrink-0">
                  <div className="card-lift h-full rounded-2xl border border-forest-800 bg-forest-900/70 p-6 hover:border-gold-500/50">
                    <div className="flex items-center justify-between">
                      <Monogram author={a} size={52} />
                      <span className="flex items-center gap-1.5 rounded-full border border-gold-500/40 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-gold-300"><SealCheck size={12} /> Verified BAMS</span>
                    </div>
                    <p className="mt-5 font-display text-lg italic leading-snug text-sand-200/90">"{a.quote}"</p>
                    <div className="mt-5 border-t border-forest-800 pt-4">
                      <p className="font-semibold text-sand-100">{a.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold-400/80">{a.qualification}</p>
                      <p className="mt-1 text-xs text-sand-200/55">{a.specialty} · {a.years} yrs in practice</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* community + newsletter */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <SectionHead eyebrow="The community" title={<><span className="text-gold-300">@vaidyagan</span> — 42,000 curious minds.</>}
            sub="Daily shlokas, OPD stories and myth-busting reels." />
          <Reveal delay={150} className="flex items-end justify-start lg:justify-end">
            <a href="https://instagram.com/vaidyagan" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gold-500/50 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-gold-300 transition-all hover:bg-gold-400 hover:text-forest-950">
              <Instagram size={16} /> Follow the family
            </a>
          </Reveal>
        </div>
      </section>

      <NewsletterBand />
    </div>
  );
}

function NewsletterBand() {
  const { toast } = useApp();
  const [email, setEmail] = useState("");
  return (
    <section className="relative overflow-hidden border-t border-forest-800 bg-forest-900/60">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 120% at 50% 0%, rgba(214,180,95,0.1), transparent 65%)" }} />
      <div className="relative mx-auto max-w-3xl px-5 py-16 text-center lg:py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold-400">The Sunday Sutra</p>
        <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-sand-100 sm:text-4xl">One classical verse. One clinical reading. <em className="text-gold-300">Every Sunday.</em></h2>
        <form className="mx-auto mt-8 flex max-w-md gap-2" onSubmit={(e) => { e.preventDefault(); if (!email.includes("@")) return; setEmail(""); toast("You're on the list — first sutra arrives Sunday"); }}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@clinic.in"
            className="min-w-0 flex-1 rounded-full border border-forest-700 bg-forest-950/80 px-5 py-3 text-sm text-sand-100 placeholder:text-sand-200/30 focus:border-gold-400 focus:outline-none" />
          <button type="submit" className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-gold-400 text-forest-950 transition-transform hover:scale-105 active:scale-95" aria-label="Subscribe"><Send size={18} /></button>
        </form>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-sand-200/40">6,200 readers · unsubscribe anytime</p>
        <span className="hidden"><Eye size={0} /><Spark size={0} /></span>
      </div>
    </section>
  );
}
