import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowLeft, Clock, Eye, Play, Pause, Copy, Check, Share2, BookOpen } from "lucide-react";
import { useApp, Reveal, SectionHead, Chip, Monogram, SmartImg } from "./lib";
import { CATEGORIES, KIND_META, authorFor, articleHtml, withHeadingIds, formatDate, readingTime, kindOf, type Article, type Dosha } from "./data";
import { ArticleCard } from "./home";

/* --------------------------------- listing ---------------------------------- */

export function Journal() {
  const { articles } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [dosha, setDosha] = useState<Dosha | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [sort, setSort] = useState<"latest" | "read">("latest");

  const published = articles.filter((a) => a.status === "published");
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = published.filter(
      (a) => (!cat || a.categoryId === cat) && (!dosha || a.doshas.includes(dosha)) && (!kind || kindOf(a) === kind) &&
        (!needle || a.title.toLowerCase().includes(needle) || a.summary.toLowerCase().includes(needle) || a.symptoms.some((s) => s.toLowerCase().includes(needle)))
    );
    list = [...list].sort((a, b) => (sort === "latest" ? b.date.localeCompare(a.date) : b.views - a.views));
    return list;
  }, [published, q, cat, dosha, kind, sort]);

  const kindChips = Object.entries(KIND_META).map(([k, m]) => ({ k, label: m.short, color: m.color }));

  return (
    <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px]" style={{ background: "radial-gradient(55% 90% at 50% 0%, rgba(214,180,95,0.07), transparent 70%)" }} />
      <div className="relative flex flex-wrap items-end justify-between gap-8">
        <SectionHead eyebrow="The clinical journal" title={<>Read like a <em className="text-gold-300">vaidya</em> thinks.</>}
          sub={`${published.length} essays across ${CATEGORIES.length} disciplines — each one cited, dosha-tagged and signed.`} />
        <Reveal delay={120} className="relative w-full max-w-sm">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search essays, symptoms…" aria-label="Search essays"
            className="w-full rounded-full border border-forest-700 bg-forest-900/80 py-3 pl-11 pr-4 text-sm text-sand-100 placeholder:text-sand-200/35 focus:border-gold-400 focus:outline-none" />
        </Reveal>
      </div>

      <Reveal delay={150} className="relative mt-10 flex flex-wrap items-center gap-2">
        <Chip active={cat === null} onClick={() => setCat(null)}>All disciplines</Chip>
        {CATEGORIES.map((c) => <Chip key={c.slug} active={cat === c.slug} onClick={() => setCat(cat === c.slug ? null : c.slug)}>{c.sanskrit} {c.name}</Chip>)}
        <span className="mx-1 hidden h-5 w-px bg-forest-700 sm:block" />
        {kindChips.map((k) => <Chip key={k.k} active={kind === k.k} color={k.color} onClick={() => setKind(kind === k.k ? null : k.k)}>{k.label}</Chip>)}
        <div className="ml-auto">
          <select value={sort} onChange={(e) => setSort(e.target.value as "latest" | "read")} aria-label="Sort essays"
            className="rounded-full border border-forest-700 bg-forest-900 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-sand-200/70 focus:border-gold-400 focus:outline-none">
            <option value="latest">Newest first</option>
            <option value="read">Most read</option>
          </select>
        </div>
      </Reveal>

      <p className="relative mt-6 font-mono text-[10.5px] uppercase tracking-[0.2em] text-sand-200/40">{results.length} essay{results.length === 1 ? "" : "s"} · reviewed by registered BAMS vaidyas</p>

      <div className="relative mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        {results.map((a, i) => <ArticleCard key={a.id} article={a} delay={(i % 3) * 90} />)}
      </div>

      {results.length === 0 && (
        <Reveal className="relative mt-10 rounded-xl border border-dashed border-forest-700 p-14 text-center">
          <p className="font-display text-2xl text-sand-200/80">Nothing under this lens yet.</p>
          <p className="mt-2 text-sm text-sand-200/50">Our vaidyas publish weekly — try clearing a filter or two.</p>
          <button onClick={() => { setQ(""); setCat(null); setDosha(null); setKind(null); }} className="mt-5 rounded-full border border-gold-500/50 px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">Reset the lens</button>
        </Reveal>
      )}
    </div>
  );
}

/* ---------------------------------- reader ---------------------------------- */

export function Reader({ id }: { id: string }) {
  const { articles, navigate, toast } = useApp();
  const article = articles.find((a) => a.id === id && a.status === "published");
  const [activeToc, setActiveToc] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const toc = useMemo(() => {
    if (!article) return [];
    try {
      const doc = new DOMParser().parseFromString(articleHtml(article), "text/html");
      return Array.from(doc.querySelectorAll("h2, h3")).map((n) => ({ level: (n.tagName === "H2" ? 2 : 3) as 2 | 3, text: n.textContent ?? "", id: n.id || (n.textContent ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-") }));
    } catch { return []; }
  }, [article]);

  const bodyHtml = useMemo(() => (article ? withHeadingIds(articleHtml(article)) : ""), [article]);

  /* scroll-spy */
  useEffect(() => {
    if (!bodyRef.current || toc.length === 0) return;
    const heads = Array.from(bodyRef.current.querySelectorAll("h2, h3"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const idx = heads.indexOf(e.target as HTMLElement);
          if (idx >= 0) setActiveToc(idx);
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    heads.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [toc, bodyHtml]);

  useEffect(() => () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); setSpeaking(false); }, []);

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-40 text-center lg:px-8">
        <BookOpen size={40} className="mx-auto text-forest-700" />
        <p className="mt-5 font-display text-2xl text-sand-200/80">This essay isn't published (yet).</p>
        <button onClick={() => navigate({ name: "journal" })} className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold-500/50 px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-gold-300 hover:bg-gold-400 hover:text-forest-950"><ArrowLeft size={14} /> Back to the journal</button>
      </div>
    );
  }

  const author = authorFor(article);
  const kind = kindOf(article);

  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) { toast("Narration isn't supported in this browser"); return; }
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const text = bodyRef.current?.textContent ?? article.summary;
    const u = new SpeechSynthesisUtterance(text.slice(0, 4000));
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); toast("Link copied"); window.setTimeout(() => setCopied(false), 1600); }
    catch { toast("Couldn't copy — select the address bar instead"); }
  };

  const share = (network: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(article.title);
    const targets: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    if (targets[network]) window.open(targets[network], "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <button onClick={() => navigate({ name: "journal" })} className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-sand-200/50 transition-colors hover:text-gold-300"><ArrowLeft size={14} /> The journal</button>

      <div className="mt-8 grid gap-10 lg:grid-cols-[260px_1fr]">
        {/* TOC + meta sidebar */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <div className="rounded-xl border border-forest-800 bg-forest-900/70 p-5">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">On this page</p>
              {toc.length === 0 ? (
                <p className="mt-3 text-[12.5px] text-sand-200/45">No sub-sections in this essay.</p>
              ) : (
                <ul className="mt-3 space-y-1 border-l border-forest-800">
                  {toc.map((t, i) => (
                    <li key={i}>
                      <button onClick={() => { const el = bodyRef.current?.querySelector(`#${t.id}`); el?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                        className={`-ml-px block w-full border-l-2 py-1.5 text-left text-[13px] leading-snug transition-all ${t.level === 3 ? "pl-7 text-[12px]" : "pl-4"} ${activeToc === i ? "border-gold-400 text-gold-300" : "border-transparent text-sand-200/55 hover:text-sand-100"}`}>
                        {t.text}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 rounded-xl border border-forest-800 bg-forest-900/70 p-5">
              <div className="flex items-center gap-3">
                <Monogram author={author} size={44} />
                <div>
                  <p className="text-[13.5px] font-semibold text-sand-100">{author.name}</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-gold-400/80">{author.qualification}</p>
                </div>
              </div>
              <p className="mt-3 text-[12px] italic leading-relaxed text-sand-200/60">"{author.quote}"</p>
              <div className="mt-4 flex flex-wrap gap-3 border-t border-forest-800 pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/50">
                <span className="flex items-center gap-1.5"><Clock size={12} /> {readingTime(article)} min read</span>
                <span className="flex items-center gap-1.5"><Eye size={12} /> {(article.views / 1000).toFixed(1)}k</span>
              </div>
              <button onClick={toggleSpeech} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-vata-500/50 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-vata-300 transition-all hover:bg-vata-500/10">
                {speaking ? <Pause size={13} /> : <Play size={13} />} {speaking ? "Stop narration" : "Listen to this essay"}
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => share("whatsapp")} aria-label="Share on WhatsApp" className="grid h-10 flex-1 place-items-center rounded-full border border-forest-700 text-sand-200/60 transition-all hover:border-kapha-400 hover:text-kapha-300"><Share2 size={15} /></button>
              <button onClick={() => share("x")} aria-label="Share on X" className="grid h-10 flex-1 place-items-center rounded-full border border-forest-700 font-display text-sm text-sand-200/60 transition-all hover:border-gold-400 hover:text-gold-300">𝕏</button>
              <button onClick={() => share("linkedin")} aria-label="Share on LinkedIn" className="grid h-10 flex-1 place-items-center rounded-full border border-forest-700 font-display text-sm text-sand-200/60 transition-all hover:border-steel-400 hover:text-steel-300">in</button>
              <button onClick={copyLink} aria-label="Copy link" className="grid h-10 flex-1 place-items-center rounded-full border border-forest-700 text-sand-200/60 transition-all hover:border-gold-400 hover:text-gold-300">{copied ? <Check size={15} /> : <Copy size={15} />}</button>
            </div>
          </Reveal>
        </aside>

        {/* article body */}
        <div>
          <Reveal>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ borderColor: KIND_META[kind].color, color: KIND_META[kind].color }}>{KIND_META[kind].short}</span>
              <span className="rounded-full border border-forest-700 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/55">{formatDate(article.date)}</span>
            </div>
            <h1 className="mt-5 font-display text-3xl font-semibold leading-tight text-sand-100 sm:text-5xl sm:leading-[1.08]">{article.title}</h1>
            <p className="mt-4 font-display text-lg italic text-sand-200/60">{article.subtitle}</p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 overflow-hidden rounded-2xl border border-forest-800">
              <div className="animate-kenburns">
                <SmartImg src={article.cover} alt={article.title} className="aspect-[16/8] w-full object-cover duotone" />
              </div>
            </div>
          </Reveal>

          {/* structured case / review details */}
          {article.caseMeta && (
            <Reveal delay={160}>
              <div className="mt-8 rounded-2xl border border-ember-500/30 bg-ember-500/5 p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-ember-300">Case presentation</p>
                <div className="mt-3.5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                  {([["Age", article.caseMeta.age], ["Sex", article.caseMeta.sex], ["Prakriti", article.caseMeta.prakriti], ["Duration", article.caseMeta.duration]] as [string, string][])
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k}><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-sand-200/40">{k}</p><p className="mt-1 text-[13.5px] font-medium text-sand-100">{v}</p></div>
                    ))}
                </div>
                {article.caseMeta.presenting && (
                  <div className="mt-3.5"><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-sand-200/40">Presenting complaint</p><p className="mt-1 text-[13.5px] leading-relaxed text-sand-100">{article.caseMeta.presenting}</p></div>
                )}
              </div>
            </Reveal>
          )}
          {article.researchMeta && (
            <Reveal delay={160}>
              <div className="mt-8 rounded-2xl border border-steel-400/30 bg-steel-400/5 p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-steel-300">Review at a glance</p>
                <div className="mt-3.5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                  {([["Design", article.researchMeta.design], ["Sample size", article.researchMeta.n], ["Evidence grade", article.researchMeta.grade]] as [string, string][])
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k}><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-sand-200/40">{k}</p><p className="mt-1 text-[13.5px] font-medium text-sand-100">{v}</p></div>
                    ))}
                </div>
                {article.researchMeta.question && (
                  <div className="mt-3.5"><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-sand-200/40">Research question</p><p className="mt-1 font-display text-[15px] italic leading-relaxed text-sand-100">{article.researchMeta.question}</p></div>
                )}
                {article.researchMeta.finding && (
                  <div className="mt-3.5"><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-sand-200/40">Key finding</p><p className="mt-1 text-[13.5px] leading-relaxed text-sand-100">{article.researchMeta.finding}</p></div>
                )}
              </div>
            </Reveal>
          )}

          <Reveal delay={200}>
            {article.pdfUrl && (
              <div className="mt-9 overflow-hidden rounded-xl border border-gold-500/35">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold-500/25 bg-gold-400/6 px-4 py-2.5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold-300">Original document · published as-is</p>
                  <a href={article.pdfUrl} download={article.pdfName ?? "document.pdf"} className="font-mono text-[9px] uppercase tracking-[0.14em] text-gold-300 underline-offset-4 hover:underline">Download</a>
                </div>
                <iframe src={article.pdfUrl} title={article.pdfName ?? "Original document"} className="h-[70vh] w-full bg-white" />
              </div>
            )}
            <div ref={bodyRef} className="article-prose dropcap mt-9 text-sand-200/85" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          </Reveal>

          {/* disclaimer + related */}
          <Reveal className="mt-12">
            <div className="rounded-xl border border-ember-500/30 bg-ember-500/5 p-5">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ember-300">A note before you self-prescribe</p>
              <p className="mt-2 text-[13px] leading-relaxed text-sand-200/60">This essay is education, not a prescription. Classical doses vary with prakriti, age and co-morbidity — consult a registered vaidya before starting any herb, especially alongside modern medication.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
