import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp, Reveal, SectionHead, Chip, SmartImg, Monogram } from "./lib";
import { CATEGORIES, DOSHA_META, KIND_META, authorFor, articlePlainText, articleToc, articleHtml, withHeadingIds, formatDate, readingTime, kindOf, categoryName, type Article, type Dosha } from "./data";
import { ArrowLeft, Play, Pause, Copy, Check, Linkedin, Twitter, Share2, Printer, BookOpen, Clock } from "lucide-react";
import { WhatsApp } from "./icons";
import { ArticleCard } from "./home";

export function Journal() {
  const { articles } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [dosha, setDosha] = useState<Dosha | null>(null);
  const [sort, setSort] = useState<"latest" | "read">("latest");

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = articles.filter((a) =>
      (!cat || a.categoryId === cat) &&
      (!dosha || a.doshas.includes(dosha)) &&
      (!needle || a.title.toLowerCase().includes(needle) || a.summary.toLowerCase().includes(needle) || a.symptoms.some((s) => s.toLowerCase().includes(needle))));
    return [...list].sort((a, b) => sort === "latest" ? b.date.localeCompare(a.date) : b.views - a.views);
  }, [articles, q, cat, dosha, sort]);

  return (
    <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px]" style={{ background: "radial-gradient(55% 90% at 50% 0%, rgba(214,180,95,0.08), transparent 70%)" }} />
      <div className="flex flex-wrap items-end justify-between gap-8">
        <SectionHead eyebrow="The clinical journal" title={<>Read like a <em className="text-gold-300">vaidya</em> thinks.</>}
          sub={`${articles.length} essays across ${CATEGORIES.length} disciplines — each one cited, dosha-tagged and signed.`} />
        <div className="relative w-full max-w-sm">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search essays, symptoms…"
            className="w-full rounded-full border border-forest-700 bg-forest-900/80 py-3 pl-5 pr-4 text-sm text-sand-100 placeholder:text-sand-200/35 focus:border-gold-400 focus:outline-none" aria-label="Search essays" />
        </div>
      </div>
      <Reveal delay={150} className="relative mt-8 flex flex-wrap items-center gap-2">
        <Chip active={cat === null} onClick={() => setCat(null)}>All disciplines</Chip>
        {CATEGORIES.map((c) => <Chip key={c.id} active={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>{c.sanskrit} {c.name}</Chip>)}
        <span className="mx-1 hidden h-5 w-px bg-forest-700 sm:block" />
        {(["vata", "pitta", "kapha"] as Dosha[]).map((d) => <Chip key={d} active={dosha === d} color={DOSHA_META[d].color} onClick={() => setDosha(dosha === d ? null : d)}>{d}</Chip>)}
        <select value={sort} onChange={(e) => setSort(e.target.value as "latest" | "read")} className="ml-auto rounded-full border border-forest-700 bg-forest-900 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-sand-200/70 focus:border-gold-400 focus:outline-none" aria-label="Sort">
          <option value="latest">Newest first</option><option value="read">Most read</option>
        </select>
      </Reveal>
      <p className="relative mt-6 font-mono text-[10.5px] uppercase tracking-[0.2em] text-sand-200/40">{results.length} essay{results.length === 1 ? "" : "s"} · reviewed by registered BAMS vaidyas</p>
      <div className="relative mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((a, i) => <ArticleCard key={a.id} article={a} delay={(i % 3) * 90} />)}
      </div>
      {results.length === 0 && (
        <Reveal className="relative mt-10 rounded-xl border border-dashed border-forest-700 p-14 text-center">
          <p className="font-display text-2xl text-sand-200/80">Nothing under this lens yet.</p>
          <button onClick={() => { setQ(""); setCat(null); setDosha(null); }} className="mt-5 rounded-full border border-gold-500/50 px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">Reset the lens</button>
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

  const toc = useMemo(() => (article ? articleToc(article) : []), [article]);
  const bodyHtml = useMemo(() => (article ? withHeadingIds(articleHtml(article)) : ""), [article]);

  useEffect(() => {
    if (!article || toc.length === 0) return;
    const box = bodyRef.current;
    if (!box) return;
    const heads = Array.from(box.querySelectorAll("h2, h3"));
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
  }, [article, toc]);

  useEffect(() => () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); }, []);

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-40 text-center lg:px-8">
        <BookOpen size={40} className="mx-auto text-forest-700" />
        <p className="mt-5 font-display text-2xl text-sand-200/80">This essay isn't published (yet).</p>
        <button onClick={() => navigate({ name: "journal" })} className="mt-6 rounded-full border border-gold-500/50 px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">Back to the journal</button>
      </div>
    );
  }

  const author = authorFor(article);
  const kind = kindOf(article);
  const related = articles.filter((a) => a.id !== article.id && a.status === "published" && (a.categoryId === article.categoryId || a.doshas.some((d) => article.doshas.includes(d)))).slice(0, 3);

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

  const shareUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent(article.title);

  const jumpTo = (i: number) => {
    const box = bodyRef.current;
    if (!box) return;
    const heads = Array.from(box.querySelectorAll("h2, h3"));
    heads[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveToc(i);
  };

  return (
    <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <button onClick={() => navigate({ name: "journal" })} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-sand-200/50 transition-colors hover:text-gold-300"><ArrowLeft size={14} /> Journal</button>

      <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
        {/* TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">On this page</p>
            <div className="mt-3 space-y-1 border-l border-forest-800">
              {toc.map((t, i) => (
                <button key={t.id} onClick={() => jumpTo(i)}
                  className={`block w-full border-l-2 py-1.5 pl-4 text-left text-[12.5px] transition-all ${i === activeToc ? "-ml-px border-gold-400 text-gold-300" : "-ml-px border-transparent text-sand-200/50 hover:text-sand-100"} ${t.level === 3 ? "pl-8 text-[11.5px]" : ""}`}>
                  {t.text}
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/40"><Clock size={12} /> {readingTime(article)} min read</div>
          </div>
        </aside>

        {/* article */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ borderColor: `${KIND_META[kind].color}55`, color: KIND_META[kind].color }}>{KIND_META[kind].short}</span>
            <span className="rounded-full border border-forest-700 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300">{categoryName(article)}</span>
            <span className="rounded-full border border-forest-700 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/50">{formatDate(article.date)}</span>
          </div>
          <h1 className="mt-5 font-display text-3xl font-semibold leading-tight text-sand-100 sm:text-5xl sm:leading-[1.08]">{article.title}</h1>
          <p className="mt-4 font-display text-lg italic text-sand-200/60">{article.subtitle}</p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Monogram author={author} size={44} />
              <div>
                <p className="flex items-center gap-1.5 text-[14px] font-semibold text-sand-100">{author.name} <span className="rounded-full bg-gold-400/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-gold-300">Verified</span></p>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/45">{author.qualification} · {author.specialty}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleSpeech} aria-label={speaking ? "Stop narration" : "Listen"}
                className={`grid h-10 w-10 place-items-center rounded-full border transition-all ${speaking ? "border-gold-400 bg-gold-400/15 text-gold-300" : "border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"}`}>
                {speaking ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noreferrer" aria-label="Share on WhatsApp" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/60 transition-all hover:border-kapha-400 hover:text-kapha-300"><WhatsApp size={16} /></a>
              <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noreferrer" aria-label="Share on X" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/60 transition-all hover:border-steel-400 hover:text-steel-300"><Twitter size={16} /></a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noreferrer" aria-label="Share on LinkedIn" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/60 transition-all hover:border-steel-400 hover:text-steel-300"><Linkedin size={16} /></a>
              <button onClick={copyLink} aria-label="Copy link" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/60 transition-all hover:border-gold-400 hover:text-gold-300">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
            </div>
          </div>

          {article.cover && (
            <Reveal delay={120} className="mt-8 overflow-hidden rounded-2xl border border-forest-800">
              <SmartImg src={article.cover} alt={article.title} className="aspect-[16/8] w-full object-cover duotone" />
            </Reveal>
          )}

          {/* case / research structured panels */}
          {kind === "case" && article.caseMeta && (
            <Reveal delay={150} className="mt-8 rounded-2xl border border-ember-400/40 bg-ember-400/6 p-6">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ember-300">Case summary</p>
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {([["Age", article.caseMeta.age], ["Sex", article.caseMeta.sex], ["Prakriti", article.caseMeta.prakriti], ["Presenting", article.caseMeta.presenting], ["Duration", article.caseMeta.duration]] as const).map(([k, v]) => v && (
                  <div key={k}><p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/45">{k}</p><p className="mt-1 text-[13px] font-semibold text-sand-100">{v}</p></div>
                ))}
              </div>
            </Reveal>
          )}
          {kind === "research" && article.researchMeta && (
            <Reveal delay={150} className="mt-8 rounded-2xl border border-steel-400/40 bg-steel-400/6 p-6">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-steel-300">Research abstract</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {([["Question", article.researchMeta.question], ["Design", article.researchMeta.design], ["N", article.researchMeta.n], ["Finding", article.researchMeta.finding], ["Evidence grade", article.researchMeta.grade]] as const).map(([k, v]) => v && (
                  <div key={k}><p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/45">{k}</p><p className="mt-1 text-[13px] text-sand-100">{v}</p></div>
                ))}
              </div>
            </Reveal>
          )}

          {article.pdfUrl && (
            <Reveal delay={180} className="mt-8 overflow-hidden rounded-xl border border-gold-500/35">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold-500/25 bg-gold-400/6 px-4 py-2.5">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold-300">Original document · published as-is</p>
                <a href={article.pdfUrl} download={article.pdfName ?? "document.pdf"} className="font-mono text-[9px] uppercase tracking-[0.14em] text-gold-300 underline-offset-4 hover:underline">Download</a>
              </div>
              <iframe src={article.pdfUrl} title={article.pdfName ?? "Original document"} className="h-[70vh] w-full bg-white" />
            </Reveal>
          )}

          <div ref={bodyRef} className="article-prose dropcap mt-9 text-sand-200/85" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

          {/* disclaimer + related */}
          <Reveal className="mt-12">
            <div className="rounded-xl border border-ember-500/30 bg-ember-500/5 p-5">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ember-300">A note before you self-prescribe</p>
              <p className="mt-2 text-[13px] leading-relaxed text-sand-200/60">This essay is educational. Classical protocols must be individualised by a registered practitioner who has examined you. Please consult a vaidya before starting any herb or regimen.</p>
            </div>
          </Reveal>
          {related.length > 0 && (
            <Reveal className="mt-12">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Related clinical reading</p>
              <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((a, i) => <ArticleCard key={a.id} article={a} delay={i * 80} />)}
              </div>
            </Reveal>
          )}
        </div>
      </div>
      <span className="hidden"><Share2 size={0} /><Printer size={0} /></span>
    </div>
  );
}
