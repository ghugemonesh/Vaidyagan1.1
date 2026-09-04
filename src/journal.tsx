import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp, Reveal, SectionHead, Chip, SmartImg, Monogram, Stars } from "./lib";
import {
  CATEGORIES, DOSHA_META, KIND_META, PRODUCTS, authorFor, articleHtml, articleToc, withHeadingIds,
  articlePlainText, formatDate, readingTime, kindOf,
  type Article, type Dosha, type Kind,
} from "./data";
import {
  Search, ArrowLeft, Clock, Eye, SealCheck, Book, Play, Pause, WhatsApp, XSocial, LinkedIn,
  Instagram, Copy, Cart, Download,
} from "./icons";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  published: { label: "Published", cls: "bg-[#5f947e]/15 text-[#a9cfbf] border-[#5f947e]/40" },
  draft: { label: "Draft", cls: "bg-forest-800 text-sand-200/60 border-forest-700" },
  scheduled: { label: "Scheduled", cls: "bg-steel-500/15 text-steel-300 border-steel-500/40" },
  review: { label: "In review", cls: "bg-ember-500/15 text-ember-300 border-ember-500/40" },
};

/* --------------------------------- journal --------------------------------- */

export function Journal() {
  const { articles, navigate } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [dosha, setDosha] = useState<Dosha | null>(null);
  const [kind, setKind] = useState<Kind | null>(null);
  const [sort, setSort] = useState<"latest" | "read">("latest");

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = articles.filter(
      (a) =>
        (!cat || a.categoryId === cat) &&
        (!dosha || a.doshas.includes(dosha)) &&
        (!kind || kindOf(a) === kind) &&
        (!needle ||
          a.title.toLowerCase().includes(needle) ||
          a.summary.toLowerCase().includes(needle) ||
          a.symptoms.some((s) => s.toLowerCase().includes(needle)))
    );
    return [...list].sort((a, b) => (sort === "latest" ? b.date.localeCompare(a.date) : b.views - a.views));
  }, [articles, q, cat, dosha, kind, sort]);

  return (
    <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{ background: "radial-gradient(55% 90% at 50% 0%, rgba(214,180,95,0.08), transparent 70%)" }} />
      <div className="relative flex flex-wrap items-end justify-between gap-8">
        <SectionHead
          eyebrow="The clinical journal"
          title={<>Read like a <em className="text-gold-300">vaidya</em> thinks.</>}
          sub={`${articles.length} essays across ${CATEGORIES.length} disciplines — each one cited, dosha-tagged and signed.`}
        />
        <Reveal delay={120} className="relative w-full max-w-sm">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search essays, symptoms…"
            aria-label="Search essays"
            className="w-full rounded-full border border-forest-700 bg-forest-900/80 py-3 pl-11 pr-4 text-sm text-sand-100 placeholder:text-sand-200/35 focus:border-gold-400 focus:outline-none" />
        </Reveal>
      </div>

      <Reveal delay={150} className="relative mt-10 flex flex-wrap items-center gap-2">
        <Chip active={cat === null} onClick={() => setCat(null)}>All disciplines</Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>{c.sanskrit} {c.name}</Chip>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-forest-700 sm:block" />
        {(["vata", "pitta", "kapha"] as Dosha[]).map((d) => (
          <Chip key={d} active={dosha === d} color={DOSHA_META[d].color} onClick={() => setDosha(dosha === d ? null : d)}>{d}</Chip>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-forest-700 sm:block" />
        {(["blog", "case", "research"] as Kind[]).map((k) => (
          <Chip key={k} active={kind === k} color={KIND_META[k].color} onClick={() => setKind(kind === k ? null : k)}>{KIND_META[k].short}</Chip>
        ))}
        <div className="ml-auto">
          <select value={sort} onChange={(e) => setSort(e.target.value as "latest" | "read")} aria-label="Sort essays"
            className="rounded-full border border-forest-700 bg-forest-900 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-sand-200/70 focus:border-gold-400 focus:outline-none">
            <option value="latest">Newest first</option>
            <option value="read">Most read</option>
          </select>
        </div>
      </Reveal>

      <p className="relative mt-6 font-mono text-[10.5px] uppercase tracking-[0.2em] text-sand-200/40">
        {results.length} essay{results.length === 1 ? "" : "s"} · reviewed by registered BAMS vaidyas
      </p>

      <div className="relative mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        {results.map((a, i) => (
          <ArticleCard key={a.id} article={a} delay={(i % 3) * 90} />
        ))}
      </div>

      {results.length === 0 && (
        <Reveal className="relative mt-10 rounded-xl border border-dashed border-forest-700 p-14 text-center">
          <p className="font-display text-2xl text-sand-200/80">Nothing under this lens yet.</p>
          <button onClick={() => { setQ(""); setCat(null); setDosha(null); setKind(null); }}
            className="mt-5 rounded-full border border-gold-500/50 px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">
            Reset the lens
          </button>
        </Reveal>
      )}
    </div>
  );
}

export function ArticleCard({ article, delay = 0 }: { article: Article; delay?: number }) {
  const { navigate } = useApp();
  const author = authorFor(article);
  const kind = kindOf(article);
  return (
    <Reveal delay={delay} as="article" className="group cursor-pointer">
      <div onClick={() => navigate({ name: "article", id: article.id })}
        className="flex h-full flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-900 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-500/50 hover:shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <div className="relative aspect-[16/10] overflow-hidden">
          <SmartImg src={article.cover} alt={article.title} className="h-full w-full object-cover duotone transition-transform duration-700 group-hover:scale-[1.06]" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-forest-950/10" />
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border bg-forest-950/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] backdrop-blur"
              style={{ borderColor: KIND_META[kind].color, color: KIND_META[kind].color }}>{KIND_META[kind].short}</span>
            {article.pdfUrl && (
              <span className="rounded-full border border-ember-400/60 bg-forest-950/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ember-300 backdrop-blur">PDF · as-is</span>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="font-display text-xl font-semibold leading-snug text-sand-100 transition-colors group-hover:text-gold-300">{article.title}</h3>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-sand-200/60">{article.summary}</p>
          <div className="mt-auto flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <Monogram author={author} size={34} />
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-sand-100">{author.name}<SealCheck size={13} className="text-gold-400" /></p>
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

/* ---------------------------------- reader ---------------------------------- */

export function Reader({ id }: { id: string }) {
  const { articles, allArticles, navigate, addToCart, setCartOpen, toast } = useApp();
  const article = allArticles.find((a) => a.id === id);
  const [activeToc, setActiveToc] = useState(-1);
  const [speaking, setSpeaking] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const toc = useMemo(() => (article ? articleToc(article) : []), [article]);
  const bodyHtml = useMemo(() => (article ? withHeadingIds(articleHtml(article)) : ""), [article]);

  /* scroll-spy over the rendered headings */
  useEffect(() => {
    const root = bodyRef.current;
    if (!root || toc.length === 0) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("h2, h3"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = nodes.indexOf(e.target as HTMLElement);
            if (i >= 0) setActiveToc(i);
          }
        });
      },
      { rootMargin: "-25% 0px -60% 0px" }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [toc, bodyHtml]);

  if (!article || article.status !== "published") {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-40 text-center">
        <p className="font-display text-3xl font-semibold text-sand-100">This essay isn't on the shelf.</p>
        <p className="mt-3 text-sand-200/55">It may be a draft, or the link has expired.</p>
        <button onClick={() => navigate({ name: "journal" })} className="mt-6 rounded-full border border-gold-500/50 px-7 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">
          Back to the journal
        </button>
      </div>
    );
  }

  const author = authorFor(article);
  const kind = kindOf(article);
  const shareText = `${article.title} — Vaidyagan`;
  const related = articles.filter((a) => a.id !== article.id && a.categoryId === article.categoryId).slice(0, 3);
  const formulations = PRODUCTS.filter((p) => article.symptoms.some((s) => p.desc.toLowerCase().includes(s) || p.name.toLowerCase().includes(s))).slice(0, 3);

  const jump = (i: number) => {
    const node = bodyRef.current?.querySelectorAll("h2, h3")[i] as HTMLElement | undefined;
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const speak = () => {
    try {
      if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
      const u = new SpeechSynthesisUtterance(articlePlainText(article).slice(0, 3200));
      u.rate = 0.98;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      setSpeaking(true);
    } catch { toast("Narration isn't available in this browser"); }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast("Link copied to clipboard"); }
    catch { toast("Could not copy — long-press the address bar instead"); }
  };

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-32">
      <button onClick={() => navigate({ name: "journal" })} className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-sand-200/50 transition-colors hover:text-gold-300">
        <ArrowLeft size={14} /> Journal · {KIND_META[kind].label}
      </button>

      <div className="mt-8 grid gap-12 lg:grid-cols-[240px_1fr]">
        {/* on this page */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-gold-400">On this page</p>
            {toc.length === 0 ? (
              <p className="mt-3 text-[12.5px] leading-relaxed text-sand-200/45">A short read — no sections.</p>
            ) : (
              <ul className="mt-3 space-y-0.5 border-l border-forest-800">
                {toc.map((t, i) => (
                  <li key={`${t.id}-${i}`}>
                    <button onClick={() => jump(i)}
                      className={`block w-full border-l-2 py-1.5 pr-2 text-left transition-all ${t.level === 3 ? "pl-6" : "pl-3.5"} ${
                        activeToc === i ? "border-gold-400 text-gold-300" : "border-transparent text-sand-200/55 hover:border-gold-500/40 hover:text-sand-100"
                      }`}>
                      <span className={`block truncate ${t.level === 3 ? "text-[12px]" : "text-[13px] font-semibold"}`}>{t.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="gold-rule mt-6" />
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-sand-200/40">
              {readingTime(article)} min read · {(article.views / 1000).toFixed(1)}k reads
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
                style={{ borderColor: KIND_META[kind].color, color: KIND_META[kind].color }}>{KIND_META[kind].label}</span>
              {article.doshas.map((d) => (
                <span key={d} className="rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
                  style={{ borderColor: `${DOSHA_META[d].color}66`, color: DOSHA_META[d].color }}>{d}</span>
              ))}
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] text-sand-100 sm:text-5xl">{article.title}</h1>
            {article.subtitle && <p className="mt-4 font-display text-xl italic text-sand-200/70">{article.subtitle}</p>}

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <Monogram author={author} size={44} />
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-sand-100">{author.name}<SealCheck size={14} className="text-gold-400" /></p>
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/45">{author.qualification} · {formatDate(article.date)}</p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={speak} aria-label={speaking ? "Stop narration" : "Listen to this essay"}
                  className={`grid h-10 w-10 place-items-center rounded-full border transition-all ${speaking ? "border-gold-400 bg-gold-400/15 text-gold-300" : "border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300"}`}>
                  {speaking ? <Pause size={15} /> : <Play size={15} />}
                </button>
                {speaking && (
                  <span className="flex h-10 items-end gap-[3px] px-1" aria-hidden>
                    {[0, 1, 2, 3].map((i) => <i key={i} className="animate-eq w-[3px] rounded-full bg-gold-400" style={{ height: 18, animationDelay: `${i * 0.15}s` }} />)}
                  </span>
                )}
                <a href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + window.location.href)}`} target="_blank" rel="noreferrer" aria-label="Share on WhatsApp" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-all hover:border-[#25D366] hover:text-[#25D366]"><WhatsApp size={16} /></a>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" aria-label="Share on X" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-all hover:border-sand-100 hover:text-sand-100"><XSocial size={15} /></a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" aria-label="Share on LinkedIn" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-all hover:border-[#0A66C2] hover:text-[#0A66C2]"><LinkedIn size={15} /></a>
                <button onClick={copyLink} aria-label="Copy link" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-all hover:border-gold-400 hover:text-gold-300"><Copy size={15} /></button>
              </div>
            </div>
          </header>

          <div className="relative mt-9 overflow-hidden rounded-2xl border border-forest-800">
            <SmartImg src={article.cover} alt={article.title} className="aspect-[16/8] w-full object-cover duotone" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/70 to-transparent" />
          </div>

          {/* structured summaries for case papers & research */}
          {kind === "case" && article.caseMeta && (
            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {([["Presenting", article.caseMeta.presenting], ["History", article.caseMeta.history], ["Examination", article.caseMeta.examination], ["Intervention", article.caseMeta.intervention], ["Outcome", article.caseMeta.outcome]] as const)
                .filter(([, v]) => v.trim())
                .map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-forest-800 bg-forest-900/60 p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold-400">{k}</p>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-sand-200/80">{v}</p>
                  </div>
                ))}
            </div>
          )}
          {kind === "research" && article.researchMeta && (
            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {([["Objective", article.researchMeta.objective], ["Method", article.researchMeta.method], ["Findings", article.researchMeta.findings], ["Conclusion", article.researchMeta.conclusion]] as const)
                .filter(([, v]) => v.trim())
                .map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-forest-800 bg-forest-900/60 p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-steel-300">{k}</p>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-sand-200/80">{v}</p>
                  </div>
                ))}
            </div>
          )}

          {article.pdfUrl ? (
            <div className="mt-9">
              <p className="font-display text-lg italic text-sand-200/70">The original document, published exactly as received:</p>
              <iframe title={article.pdfName ?? "Original document"} src={article.pdfUrl} className="mt-4 h-[70vh] w-full rounded-xl border border-forest-700 bg-forest-900" />
              <a href={article.pdfUrl} download={article.pdfName ?? "document.pdf"} className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold-500/50 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">
                <Download size={15} /> Download original
              </a>
            </div>
          ) : (
            <div ref={bodyRef} className="article-prose mt-9 text-sand-200/85" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          )}

          {/* author card */}
          <div className="mt-12 flex flex-wrap items-center gap-5 rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
            <Monogram author={author} size={64} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-display text-xl font-semibold text-sand-100">{author.name}<SealCheck size={16} className="text-gold-400" /></p>
              <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-gold-400/80">{author.qualification}</p>
              <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-sand-200/60">{author.bio}</p>
            </div>
          </div>

          {/* related + formulations */}
          {related.length > 0 && (
            <div className="mt-12">
              <p className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.26em] text-gold-400"><Book size={15} /> Related clinical cases</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                {related.map((a, i) => <ArticleCard key={a.id} article={a} delay={i * 80} />)}
              </div>
            </div>
          )}
          {formulations.length > 0 && (
            <div className="mt-12 rounded-2xl border border-kapha-500/25 bg-kapha-500/5 p-6">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.26em] text-kapha-300">Recommended formulations</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {formulations.map((p) => (
                  <div key={p.id} className="rounded-xl border border-forest-800 bg-forest-900/80 p-4">
                    <SmartImg src={p.image} alt={p.name} className="aspect-[4/3] w-full rounded-lg object-cover duotone" />
                    <p className="mt-3 text-sm font-semibold text-sand-100">{p.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-display text-lg text-gold-300">₹{p.price}</span>
                      <Stars rating={p.rating} size={11} />
                    </div>
                    <button onClick={() => { addToCart(p.id); setCartOpen(true); toast(`${p.name} added to basket`); }}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-gold-500/50 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">
                      <Cart size={13} /> Add to basket
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
