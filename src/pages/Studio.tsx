/* =============================================================================
   Vaidyagan — Doctor Studio
   Login gate · Blogging space (rich editor + contents drawer) · My Blogs ·
   Herb Index editor · Store admin (products + orders) · My Profile ·
   Superadmin master switches · link out to the Admin Console
   ========================================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, LogOut, BookOpen, FileText, Leaf, Store as StoreIcon, User as UserIcon, Settings as SettingsIcon,
  LayoutGrid, List, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignJustify,
  ListOrdered, Quote, Image as ImageIcon, Video, Eye, EyeOff, Pencil, Trash2, Plus, X, Check,
  ChevronRight, Package, Truck, Printer, Search, Send, Clock, ShieldCheck, ExternalLink,
  type LucideIcon,
} from "lucide-react";

import { useDb, listProducts, saveProduct, setProductStock, setProductVisible, listOrders, updateOrderStatus, cancelAndRestock, getSettings, saveSettings, downloadFile, inr as inrFmt, type Order, type Product, type OrderStatus } from "../lib/data";
import { useToast } from "../components/ui";
import { LogoTile } from "../components/brand";
import {
  studioLogin, studioSession, studioLogout, AUTHORS, allArticles, saveArticle, deleteArticle, publishArticle,
  articleToc, listHerbs, saveHerb, deleteHerb, resetHerbs, getProfile, saveProfile, blankProfile, productImage,
  IMG, todayStr,
  type StudioUser, type Article, type ArticleStatus, type Herb, type DoctorProfile,
} from "../lib/platform";
import { Toggle } from "../components/ui";

const gold = "#d6b45f";

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em]" style={{ borderColor: `${color}55`, color, background: `${color}14` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

const STATUS_META: Record<ArticleStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "#93b1cf" },
  review: { label: "In review", color: "#e07f49" },
  scheduled: { label: "Scheduled", color: "#b7cbde" },
  published: { label: "Published", color: "#82b39e" },
};

/* --------------------------------- login --------------------------------- */

function LoginGate({ onLogin }: { onLogin: (u: StudioUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = studioLogin(username, password);
    if (!res.ok || !res.user) { setError(res.error ?? "Couldn't sign in."); return; }
    onLogin(res.user);
  };
  const inp = "w-full rounded-xl border border-forest-700 bg-forest-950/70 px-4 py-3 text-[14.5px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-forest-950 px-5">
      <div className="absolute inset-0" aria-hidden style={{ background: "radial-gradient(60% 55% at 50% 0%, rgba(214,180,95,0.10), transparent 65%)" }} />
      <div className="leaf-field absolute inset-0" aria-hidden />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900/80 p-8 backdrop-blur">
        <div className="text-center">
          <span className="group mx-auto inline-block"><LogoTile size="lg" /></span>
          <h1 className="mt-5 font-display text-3xl font-semibold text-sand-100">Doctor Studio</h1>
          <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.26em] text-gold-400/80">वैद्यगण · publishing desk</p>
        </div>
        <form onSubmit={submit} className="mt-7 space-y-3.5">
          <input value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} placeholder="Username" className={inp} autoComplete="username" />
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Password" className={inp} autoComplete="current-password" />
          {error && <p className="rounded-xl border border-ember-500/40 bg-ember-500/10 px-4 py-2.5 text-[12.5px] text-ember-300">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-forest-950 transition-all hover:bg-gold-300 active:scale-[0.99]">Enter the desk</button>
        </form>
        <p className="mt-5 text-center text-[12px] text-sand-200/45">
          Demo: <b className="text-sand-200/70">monesh</b> / <b className="text-sand-200/70">admin91466</b> · doctors: shruti, bhagyesh, shivani (password = name+123)
        </p>
        <p className="mt-3 text-center">
          <Link to="/" className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-sand-200/40 transition-colors hover:text-gold-400">← Back to the site</Link>
        </p>
      </motion.div>
    </div>
  );
}

/* ----------------------------- "On this page" ----------------------------- */

function OutlineDrawer({ toc, active, open, setOpen }: { toc: { id: string; level: 2 | 3; text: string }[]; active: string; open: boolean; setOpen: (b: boolean) => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[58] bg-forest-950/40 xl:hidden" onClick={() => setOpen(false)} />
          <motion.aside initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-[59] flex h-full w-[300px] max-w-[85vw] flex-col border-l border-forest-700 bg-forest-900 shadow-[-30px_0_80px_rgba(0,0,0,0.5)]" role="navigation" aria-label="On this page">
            <div className="flex items-center gap-2.5 border-b border-forest-800 px-5 py-4">
              <List size={16} className="text-gold-400" />
              <p className="font-display text-lg font-semibold text-sand-100">On this page</p>
              <span className="rounded-full border border-gold-500/40 bg-gold-400/10 px-2 py-0.5 font-mono text-[9px] text-gold-300">{toc.length}</span>
              <button onClick={() => setOpen(false)} aria-label="Close outline" className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {toc.length === 0 ? (
                <p className="rounded-xl border border-dashed border-forest-700 p-5 text-center text-[12.5px] leading-relaxed text-sand-200/50">
                  Add a heading (¶ → Heading 2/3) and the outline builds itself here.
                </p>
              ) : (
                toc.map((t) => (
                  <button key={t.id} onClick={() => { document.getElementById(`ed-${t.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); setOpen(false); }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] transition-all ${t.level === 3 ? "pl-7" : "pl-3"} ${active === t.id ? "bg-gold-400/12 text-gold-300" : "text-sand-200/60 hover:bg-forest-850 hover:text-sand-100"}`}>
                    <span className={`h-1.5 w-1.5 shrink-0 rotate-45 ${active === t.id ? "bg-gold-400" : "bg-forest-600"}`} />
                    <span className="flex-1 leading-snug">{t.text}</span>
                    <span className="font-mono text-[8px] uppercase text-sand-200/30">H{t.level}</span>
                  </button>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------- blog editor ------------------------------- */

function BlogEditor({ user, onBack }: { user: StudioUser; onBack: () => void }) {
  const toast = useToast();
  const articles = allArticles().filter((a) => user.role === "superadmin" ? true : a.authorId === user.id);
  const [selectedId, setSelectedId] = useState<string | null>(articles[0]?.id ?? null);
  const selected = articles.find((a) => a.id === selectedId) ?? null;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("Dravyaguna");
  const [customCategory, setCustomCategory] = useState("");
  const [doshas, setDoshas] = useState<("vata" | "pitta" | "kapha")[]>(["vata"]);
  const [cover, setCover] = useState(IMG.ritual);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState("");
  const edRef = useRef<HTMLDivElement>(null);
  const [fmt, setFmt] = useState({ block: "p", bold: false, italic: false, underline: false, strike: false });

  /* hydrate fields when a post is selected */
  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title);
    setSubtitle(selected.subtitle);
    setSummary(selected.summary);
    setCategory(selected.category);
    setCustomCategory("");
    setDoshas(selected.doshas);
    setCover(selected.cover);
    if (edRef.current) edRef.current.innerHTML = selected.html || "";
  }, [selectedId]);

  const toc = useMemo(() => {
    if (!selected) return [];
    try {
      const doc = new DOMParser().parseFromString(edRef.current?.innerHTML ?? "", "text/html");
      return Array.from(doc.querySelectorAll("h2, h3")).map((n, i) => ({ id: n.id || `h-${i}`, level: (n.tagName === "H2" ? 2 : 3) as 2 | 3, text: (n.textContent || "").trim() })).filter((t) => t.text);
    } catch { return []; }
  }, [selectedId, fmt]);

  const refreshFmt = useCallback(() => {
    try {
      const raw = (document.queryCommandValue("formatBlock") || "").toLowerCase().replace(/[<>]/g, "");
      setFmt({
        block: raw || "p",
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strike: document.queryCommandState("strikeThrough"),
      });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const onSel = () => refreshFmt();
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, [refreshFmt]);

  const exec = (cmd: string, val?: string) => {
    edRef.current?.focus();
    try { document.execCommand(cmd, false, val); } catch { /* ignore */ }
    refreshFmt();
  };

  const newPost = () => {
    const a: Article = {
      id: `post_${Date.now().toString(36)}`, slug: `draft-${Date.now().toString(36)}`,
      title: "Untitled essay", subtitle: "", summary: "", cover: IMG.ritual,
      category: "Dravyaguna", categorySanskrit: "द्रव्यगुण", doshas: ["vata"],
      author: AUTHORS[user.id] ?? AUTHORS.monesh, authorId: user.id,
      date: todayStr(), views: 0, symptoms: [], kind: "blog", html: "", status: "draft",
    };
    saveArticle(a);
    setSelectedId(a.id);
    toast("New draft opened");
  };

  const build = (status: ArticleStatus): Article | null => {
    if (!selected) return null;
    return {
      ...selected, title: title.trim() || "Untitled essay", subtitle, summary,
      category: customCategory.trim() || category,
      categorySanskrit: selected.categorySanskrit, doshas, cover,
      html: edRef.current?.innerHTML ?? "", status,
      date: status === "published" && selected.status !== "published" ? todayStr() : selected.date,
    };
  };

  const doSave = () => {
    const a = build(selected && selected.status === "published" ? "published" : "draft");
    if (!a) return;
    saveArticle(a);
    toast(a.status === "published" ? "Live article updated" : "Draft saved");
  };
  const doPublish = () => {
    const a = build("published");
    if (!a) return;
    if (!a.title.trim() || a.title === "Untitled essay") { toast("Give the essay a title first.", "warn"); return; }
    publishArticle(a);
    toast("Published to the journal — it's live on the site");
  };
  const doReview = () => {
    const a = build("review");
    if (!a) return;
    saveArticle(a);
    toast("Submitted for review — a superadmin will approve it");
  };

  const insertImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return;
      if (f.size > 1.8 * 1024 * 1024) { toast("Keep images under 1.8 MB.", "warn"); return; }
      const r = new FileReader();
      r.onload = () => { exec("insertHTML", `<img src="${r.result}" alt="${f.name}" />`); toast("Image inserted"); };
      r.readAsDataURL(f);
    };
    input.click();
  };
  const insertVideo = () => {
    const url = window.prompt("Paste a YouTube or Vimeo URL:");
    if (!url) return;
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    let embed = "";
    if (yt) embed = `https://www.youtube.com/embed/${yt[1]}`;
    else if (vimeo) embed = `https://player.vimeo.com/video/${vimeo[1]}`;
    if (!embed) { toast("That doesn't look like a YouTube or Vimeo link.", "warn"); return; }
    exec("insertHTML", `<iframe src="${embed}" width="100%" height="360" style="border:0;border-radius:12px" allowfullscreen title="Video"></iframe>`);
    toast("Video embedded");
  };

  const btn = (active: boolean) => `grid h-9 w-9 place-items-center rounded-lg border transition-all ${active ? "border-gold-400 bg-gold-400/15 text-gold-300" : "border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300"}`;
  const words = ((edRef.current?.textContent ?? "").trim().split(/\s+/).filter(Boolean).length);
  const canPublishDirect = user.role === "superadmin";

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* post list */}
      <div className="h-fit rounded-2xl border border-forest-800 bg-forest-900/70 p-4 lg:sticky lg:top-24">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400">{user.role === "superadmin" ? "All essays" : "My essays"}</p>
          <button onClick={newPost} aria-label="New draft" className="flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-forest-950 hover:bg-gold-300"><Plus size={12} /> New</button>
        </div>
        <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {articles.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-5 text-center text-[12.5px] text-sand-200/50">Nothing yet — start your first essay.</p>}
          {articles.map((a) => (
            <button key={a.id} onClick={() => setSelectedId(a.id)}
              className={`w-full rounded-xl border p-3.5 text-left transition-all ${selectedId === a.id ? "border-gold-500/60 bg-gold-400/8" : "border-forest-800 bg-forest-950/40 hover:border-forest-600"}`}>
              <p className="truncate text-[13.5px] font-semibold text-sand-100">{a.title}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge color={STATUS_META[a.status].color}>{STATUS_META[a.status].label}</Badge>
                <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-sand-200/35">{a.date}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* editor */}
      <div className="rounded-2xl border border-forest-800 bg-forest-900/70">
        {!selected ? (
          <div className="grid h-72 place-items-center text-center">
            <div>
              <BookOpen size={32} className="mx-auto text-forest-600" />
              <p className="mt-3 text-[14px] text-sand-200/50">Select an essay or start a new one.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-forest-800 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={onBack} className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/45 hover:text-gold-300">← My Blogs</button>
                <Badge color={STATUS_META[selected.status].color}>{STATUS_META[selected.status].label}</Badge>
                <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/35">{words} words · ~{Math.max(1, Math.round(words / 210))} min read</span>
              </div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Essay title" aria-label="Essay title"
                className="mt-3 w-full bg-transparent font-display text-2xl font-semibold text-sand-100 placeholder:text-sand-200/25 focus:outline-none sm:text-3xl" />
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="A one-line subtitle (optional)" aria-label="Subtitle"
                className="mt-1 w-full bg-transparent font-display text-[15px] italic text-sand-200/60 placeholder:text-sand-200/25 focus:outline-none" />
            </div>

            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-forest-800 px-4 py-2.5">
              <button onClick={() => setOutlineOpen(true)} aria-label="Open 'On this page' outline" title="On this page"
                className="relative flex h-9 items-center gap-1.5 rounded-lg border border-gold-500/50 bg-gold-400/8 px-3 font-mono text-[9px] uppercase tracking-[0.12em] text-gold-300 transition-all hover:bg-gold-400/15">
                <List size={14} /> Contents
                {toc.length > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-gold-400 px-1 font-mono text-[8px] font-bold text-forest-950">{toc.length}</span>}
              </button>
              <span className="mx-1 h-5 w-px bg-forest-800" />
              <select value={fmt.block} onChange={(e) => exec("formatBlock", `<${e.target.value}>`)} aria-label="Paragraph style"
                className="h-9 rounded-lg border border-forest-700 bg-forest-900 px-2 font-mono text-[10px] uppercase tracking-wide text-sand-200/75 focus:border-gold-400 focus:outline-none">
                <option value="p">Normal text</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option>
              </select>
              <span className="mx-1 h-5 w-px bg-forest-800" />
              <button onClick={() => exec("bold")} className={btn(fmt.bold)} title="Bold" aria-label="Bold" aria-pressed={fmt.bold}><Bold size={15} /></button>
              <button onClick={() => exec("italic")} className={btn(fmt.italic)} title="Italic" aria-label="Italic" aria-pressed={fmt.italic}><Italic size={15} /></button>
              <button onClick={() => exec("underline")} className={btn(fmt.underline)} title="Underline" aria-label="Underline" aria-pressed={fmt.underline}><Underline size={15} /></button>
              <button onClick={() => exec("strikeThrough")} className={btn(fmt.strike)} title="Strikethrough" aria-label="Strikethrough" aria-pressed={fmt.strike}><Strikethrough size={15} /></button>
              <span className="mx-1 h-5 w-px bg-forest-800" />
              <button onClick={() => exec("insertUnorderedList")} className={btn(false)} title="Bullet list" aria-label="Bullet list"><List size={15} /></button>
              <button onClick={() => exec("insertOrderedList")} className={btn(false)} title="Numbered list" aria-label="Numbered list"><ListOrdered size={15} /></button>
              <button onClick={() => exec("formatBlock", "<blockquote>")} className={btn(false)} title="Quote" aria-label="Quote"><Quote size={15} /></button>
              <span className="mx-1 h-5 w-px bg-forest-800" />
              <button onClick={() => exec("justifyLeft")} className={btn(false)} title="Align left" aria-label="Align left"><AlignLeft size={15} /></button>
              <button onClick={() => exec("justifyCenter")} className={btn(false)} title="Align centre" aria-label="Align centre"><AlignCenter size={15} /></button>
              <button onClick={() => exec("justifyFull")} className={btn(false)} title="Justify" aria-label="Justify"><AlignJustify size={15} /></button>
              <span className="mx-1 h-5 w-px bg-forest-800" />
              <button onClick={insertImage} className={btn(false)} title="Insert image" aria-label="Insert image"><ImageIcon size={15} /></button>
              <button onClick={insertVideo} className={btn(false)} title="Embed video" aria-label="Embed video"><Video size={15} /></button>
              <span className="ml-auto hidden font-mono text-[8.5px] uppercase tracking-[0.12em] text-sand-200/30 sm:block">
                {fmt.block !== "p" ? fmt.block.toUpperCase() : "Normal"}{fmt.bold && " · B"}{fmt.italic && " · I"}{fmt.underline && " · U"}{fmt.strike && " · S"}
              </span>
            </div>

            <div className="p-5 sm:p-7">
              <div ref={edRef} contentEditable data-placeholder="Begin the essay… select text and use the toolbar. Headings build the 'On this page' outline."
                onInput={() => refreshFmt()}
                className="editor-surface min-h-[380px] text-[15.5px] text-sand-200/85" aria-label="Essay body" />
            </div>

            {/* meta */}
            <div className="grid gap-4 border-t border-forest-800 p-5 sm:grid-cols-3">
              <div>
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-gold-400/80">Category</p>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-forest-700 bg-forest-950/60 px-3 py-2.5 text-[13.5px] text-sand-100 focus:border-gold-400 focus:outline-none">
                  {["Dravyaguna", "Chikitsa", "Panchakarma", "Dinacharya", "Ahara", "Research"].map((c) => <option key={c}>{c}</option>)}
                </select>
                <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="…or type a custom category" className="mt-2 w-full rounded-xl border border-forest-700 bg-forest-950/60 px-3 py-2 text-[12.5px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
              </div>
              <div>
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-gold-400/80">Dosha focus</p>
                <div className="flex gap-2">
                  {(["vata", "pitta", "kapha"] as const).map((d) => {
                    const on = doshas.includes(d);
                    return <button key={d} onClick={() => setDoshas(on ? doshas.filter((x) => x !== d) : [...doshas, d])} className={`flex-1 rounded-xl border py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-all ${on ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/50"}`}>{d}</button>;
                  })}
                </div>
              </div>
              <div>
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-gold-400/80">Cover image</p>
                <div className="flex items-center gap-2">
                  {[IMG.ritual, IMG.oil, IMG.triphala, IMG.kadha, IMG.ghee].map((c) => (
                    <button key={c} onClick={() => setCover(c)} aria-label="Choose cover" className={`h-12 w-12 overflow-hidden rounded-lg border-2 transition-all ${cover === c ? "border-gold-400" : "border-forest-700 opacity-60 hover:opacity-100"}`}>
                      <img src={c} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* actions */}
            <div className="flex flex-wrap items-center gap-2.5 border-t border-forest-800 p-5">
              <button onClick={doSave} className="flex items-center gap-2 rounded-full border border-forest-600 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200 transition-all hover:border-gold-400 hover:text-gold-300">Save</button>
              {canPublishDirect ? (
                <button onClick={doPublish} className="ml-auto flex items-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-gold-300 active:scale-95"><Send size={13} /> {selected.status === "published" ? "Update live" : "Publish"}</button>
              ) : (
                <button onClick={doReview} className="ml-auto flex items-center gap-2 rounded-full bg-ember-500 px-6 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-ember-400 active:scale-95"><Clock size={13} /> Submit for review</button>
              )}
              {selected.status === "published" && <Link to={`/article/${selected.slug}`} className="flex items-center gap-2 rounded-full border border-moss-500/50 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-moss-300 hover:bg-moss-500/10"><ExternalLink size={13} /> View live</Link>}
            </div>
          </>
        )}
      </div>
      <OutlineDrawer toc={toc} active={activeHeading} open={outlineOpen} setOpen={(b) => { setOutlineOpen(b); if (b) setActiveHeading(toc[0]?.id ?? ""); }} />
    </div>
  );
}

/* -------------------------------- my blogs -------------------------------- */

function MyBlogs({ user, onEdit }: { user: StudioUser; onEdit: () => void }) {
  const toast = useToast();
  const articles = allArticles().filter((a) => user.role === "superadmin" ? true : a.authorId === user.id);
  const [filter, setFilter] = useState<"all" | ArticleStatus>("all");
  const shown = articles.filter((a) => filter === "all" || a.status === filter);
  const setStatus = (a: Article, status: ArticleStatus) => {
    if (status === "published") publishArticle({ ...a, status });
    else saveArticle({ ...a, status });
    toast(status === "published" ? `"${a.title}" is live` : `"${a.title}" moved to ${STATUS_META[status].label.toLowerCase()}`);
  };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "published", "review", "scheduled", "draft"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${filter === f ? "border-gold-400 bg-gold-400 text-forest-950" : "border-forest-700 text-sand-200/60 hover:text-sand-100"}`}>{f}</button>
        ))}
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/40">{shown.length} essay{shown.length === 1 ? "" : "s"}</span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((a) => (
          <div key={a.id} className="group flex flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-900/70 transition-all hover:border-gold-500/40">
            <div className="relative aspect-[16/9] overflow-hidden">
              <img src={a.cover} alt={a.title} className="h-full w-full object-cover duotone transition-transform duration-500 group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 to-transparent" />
              <span className="absolute left-3 top-3"><Badge color={STATUS_META[a.status].color}>{STATUS_META[a.status].label}</Badge></span>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <p className="font-display text-lg font-semibold leading-snug text-sand-100">{a.title}</p>
              <p className="mt-1 line-clamp-2 text-[12.5px] text-sand-200/50">{a.summary || a.subtitle}</p>
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                <button onClick={onEdit} aria-label={`Edit ${a.title}`} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/70 hover:border-gold-400 hover:text-gold-300"><Pencil size={11} /> Edit</button>
                {a.status === "published" ? (
                  <button onClick={() => setStatus(a, "draft")} aria-label={`Unpublish ${a.title}`} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/70 hover:border-ember-400 hover:text-ember-300"><EyeOff size={11} /> Unpublish</button>
                ) : (
                  <button onClick={() => setStatus(a, "published")} aria-label={`Publish ${a.title}`} className="flex items-center gap-1.5 rounded-full border border-moss-500/50 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-moss-300 hover:bg-moss-500/10"><Eye size={11} /> Publish</button>
                )}
                <button onClick={() => { if (window.confirm(`Delete "${a.title}"? This can't be undone.`)) { deleteArticle(a.id); toast("Essay deleted"); } }} aria-label={`Delete ${a.title}`} className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200/40 hover:border-ember-400 hover:text-ember-300"><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {shown.length === 0 && <p className="mt-8 rounded-xl border border-dashed border-forest-700 p-10 text-center text-[13.5px] text-sand-200/50">No essays in this state.</p>}
    </div>
  );
}

/* ------------------------------- herb editor ------------------------------- */

function HerbEditor() {
  const toast = useToast();
  const herbs = listHerbs();
  const [editing, setEditing] = useState<Herb | null>(null);
  const [form, setForm] = useState<Herb | null>(null);

  const startNew = () => {
    const h: Herb = { id: `herb_${Date.now().toString(36)}`, sanskrit: "", common: "New Herb", botanical: "", part: "Whole plant", rasa: [], virya: "Hot", vipaka: "Madhura", doshas: ["vata"], benefits: [], classical: "", caution: "", treats: [], accent: gold };
    setEditing(h);
    setForm({ ...h });
  };
  const save = () => {
    if (!form) return;
    if (!form.common.trim()) { toast("Give the herb a name.", "warn"); return; }
    saveHerb(form);
    toast(`Saved ${form.common} to the herb index`);
    setEditing(null); setForm(null);
  };
  const inp = "w-full rounded-xl border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-[13.5px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
  const label = "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.18em] text-gold-400/80";

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/45">{herbs.length} monographs · changes appear on the public Herb Index instantly</p>
        <button onClick={startNew} className="flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Plus size={13} /> Add herb</button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {herbs.map((h) => (
          <div key={h.id} className="flex items-center gap-4 rounded-xl border border-forest-800 bg-forest-900/70 p-4 transition-colors hover:border-gold-500/40">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-xl italic" style={{ background: `${h.accent}15`, color: h.accent, border: `1px solid ${h.accent}44` }}>{h.sanskrit[0] ?? "ह"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-semibold text-sand-100">{h.common} <span className="font-display italic text-sand-200/50">{h.sanskrit}</span></p>
              <p className="truncate font-mono text-[9.5px] uppercase tracking-[0.1em] text-sand-200/40">{h.botanical} · {h.rasa.join(", ")} · {h.virya}</p>
            </div>
            <button onClick={() => { setEditing(h); setForm({ ...h }); }} aria-label={`Edit ${h.common}`} className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300"><Pencil size={14} /></button>
            <button onClick={() => { if (window.confirm(`Remove ${h.common} from the index?`)) { deleteHerb(h.id); toast("Herb removed"); } }} aria-label={`Delete ${h.common}`} className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200/40 hover:border-ember-400 hover:text-ember-300"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <button onClick={() => { if (window.confirm("Reset the herb index to the classical eight?")) { resetHerbs(); toast("Herb index reset"); } }} className="mt-5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/35 hover:text-gold-400">Reset to classical eight</button>

      <AnimatePresence>
        {editing && form && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[64] grid place-items-center bg-forest-950/80 p-4 backdrop-blur-sm" onClick={() => { setEditing(null); setForm(null); }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-forest-700 bg-forest-900 p-7" role="dialog" aria-label="Edit herb">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-semibold text-sand-100">{herbs.some((x) => x.id === editing.id) ? "Edit herb" : "New herb"}</h3>
                <button onClick={() => { setEditing(null); setForm(null); }} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={15} /></button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><label className={label}>Common name</label><input value={form.common} onChange={(e) => setForm({ ...form, common: e.target.value })} className={inp} /></div>
                <div><label className={label}>Sanskrit</label><input value={form.sanskrit} onChange={(e) => setForm({ ...form, sanskrit: e.target.value })} className={inp} /></div>
                <div><label className={label}>Botanical</label><input value={form.botanical} onChange={(e) => setForm({ ...form, botanical: e.target.value })} className={inp} /></div>
                <div><label className={label}>Part used</label><input value={form.part} onChange={(e) => setForm({ ...form, part: e.target.value })} className={inp} /></div>
                <div><label className={label}>Rasa (comma separated)</label><input value={form.rasa.join(", ")} onChange={(e) => setForm({ ...form, rasa: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className={inp} /></div>
                <div><label className={label}>Virya</label>
                  <div className="flex gap-2">{(["Hot", "Cold"] as const).map((v) => <button key={v} onClick={() => setForm({ ...form, virya: v })} className={`flex-1 rounded-xl border py-2.5 font-mono text-[10px] uppercase ${form.virya === v ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/50"}`}>{v}</button>)}</div>
                </div>
                <div className="sm:col-span-2"><label className={label}>Doshas</label>
                  <div className="flex gap-2">{(["vata", "pitta", "kapha"] as const).map((d) => <button key={d} onClick={() => setForm({ ...form, doshas: form.doshas.includes(d) ? form.doshas.filter((x) => x !== d) : [...form.doshas, d] })} className={`flex-1 rounded-xl border py-2.5 font-mono text-[10px] uppercase ${form.doshas.includes(d) ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/50"}`}>{d}</button>)}</div>
                </div>
                <div className="sm:col-span-2"><label className={label}>Benefits (one per line)</label><textarea value={form.benefits.join("\n")} onChange={(e) => setForm({ ...form, benefits: e.target.value.split("\n").filter(Boolean) })} rows={3} className={inp} /></div>
                <div className="sm:col-span-2"><label className={label}>Classical line</label><input value={form.classical} onChange={(e) => setForm({ ...form, classical: e.target.value })} className={inp} /></div>
                <div className="sm:col-span-2"><label className={label}>Cautions</label><input value={form.caution} onChange={(e) => setForm({ ...form, caution: e.target.value })} className={inp} /></div>
                <div className="sm:col-span-2"><label className={label}>Symptom tags (comma separated)</label><input value={form.treats.join(", ")} onChange={(e) => setForm({ ...form, treats: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className={inp} /></div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={save} className="rounded-full bg-gold-400 px-7 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Save herb</button>
                <button onClick={() => { setEditing(null); setForm(null); }} className="rounded-full border border-forest-700 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200/60 hover:text-sand-100">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------- store admin ------------------------------- */

const ORDER_FLOW: OrderStatus[] = ["new", "processing", "shipped", "out-for-delivery", "delivered"];
const ORDER_META: Record<OrderStatus, { label: string; color: string }> = {
  new: { label: "New", color: "#e8cf8b" },
  processing: { label: "Processing", color: "#93b1cf" },
  shipped: { label: "Shipped", color: "#d6b45f" },
  "out-for-delivery": { label: "Out for delivery", color: "#e07f49" },
  delivered: { label: "Delivered", color: "#82b39e" },
  cancelled: { label: "Cancelled", color: "#c96430" },
};

function StoreAdmin() {
  useDb();
  const toast = useToast();
  const [tab, setTab] = useState<"products" | "orders">("products");
  const products = listProducts();
  const orders = listOrders();
  const [q, setQ] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Product | null>(null);

  const shownProducts = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()));
  const shownOrders = orders.filter((o) => o.id.toLowerCase().includes(q.toLowerCase()) || o.customerName.toLowerCase().includes(q.toLowerCase()));

  const advance = (o: Order) => {
    const i = ORDER_FLOW.indexOf(o.status);
    if (i < 0 || i >= ORDER_FLOW.length - 1) return;
    updateOrderStatus(o.id, ORDER_FLOW[i + 1]);
    toast(`${o.id} → ${ORDER_META[ORDER_FLOW[i + 1]].label}`);
  };
  const printInvoice = (o: Order) => {
    const rows = o.items.map((it) => `<tr><td>${it.name}</td><td>${it.qty}</td><td>${inrFmt(it.price)}</td><td>${inrFmt(it.total)}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${o.id}</title>
<style>body{font-family:Georgia,serif;color:#1a241c;max-width:720px;margin:40px auto;padding:0 24px}
h1{color:#a37e2a}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}
.tot{font-size:1.2em;font-weight:bold}</style></head><body>
<h1>वैद्यगण · Vaidyagan</h1><p>Invoice <b>${o.id}</b> · ${new Date(o.createdAt).toLocaleDateString()}</p>
<p>Bill to: <b>${o.customerName}</b><br>${o.address}<br>${o.customerPhone} · ${o.customerEmail}</p>
<table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>${rows}</table>
<p>Subtotal: ${inrFmt(o.subtotal)}<br>Shipping: ${o.shipping === 0 ? "Free" : inrFmt(o.shipping)}${o.discount ? `<br>Discount: −${inrFmt(o.discount)}` : ""}</p>
<p class="tot">Total: ${inrFmt(o.total)}</p>
<p style="color:#777">${getSettings().invoiceFooterText}</p></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
    else { downloadFile(`invoice-${o.id}.html`, html, "text/html"); toast("Invoice downloaded"); }
  };

  const saveProd = () => {
    if (!form) return;
    if (!form.name.trim()) { toast("Give the product a name.", "warn"); return; }
    saveProduct(form);
    toast(`Saved ${form.name}`);
    setEditing(null); setForm(null);
  };
  const inp = "w-full rounded-xl border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-[13.5px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
  const label = "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.18em] text-gold-400/80";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {([["products", "Products"], ["orders", `Orders · ${orders.filter((o) => o.status === "new").length} new`]] as const).map(([t, l]) => (
          <button key={t} onClick={() => { setTab(t); setQ(""); }} className={`rounded-full border px-5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${tab === t ? "border-gold-400 bg-gold-400 text-forest-950" : "border-forest-700 text-sand-200/60 hover:text-sand-100"}`}>{l}</button>
        ))}
        <div className="relative ml-auto w-full max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "products" ? "Search products…" : "Search orders…"} aria-label="Search" className="w-full rounded-full border border-forest-700 bg-forest-950/60 py-2.5 pl-9 pr-4 text-[13px] text-sand-100 placeholder:text-sand-200/30 focus:border-gold-400 focus:outline-none" />
        </div>
      </div>

      {tab === "products" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shownProducts.map((p, i) => (
            <div key={p.id} className="group flex flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-900/70 transition-all hover:border-gold-500/40">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={productImage(p, i)} alt={p.name} className="h-full w-full object-cover duotone transition-transform duration-500 group-hover:scale-[1.04]" />
                <span className="absolute left-3 top-3"><Badge color={p.stock === 0 ? "#c96430" : p.stock < 5 ? "#e07f49" : "#82b39e"}>{p.stock === 0 ? "Out of stock" : p.stock < 5 ? `Only ${p.stock} left` : `${p.stock} in stock`}</Badge></span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="font-display text-lg font-semibold text-sand-100">{p.name}</p>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/40">{p.category} · {inrFmt(p.price)} <span className="line-through">{inrFmt(p.mrp)}</span></p>
                <div className="mt-3 flex items-center gap-2.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/45">Visible in store</span>
                  <Toggle on={p.isVisible} onChange={(b) => { setProductVisible(p.id, b); toast(b ? `${p.name} is visible` : `${p.name} hidden from store`); }} label={`Visibility for ${p.name}`} />
                </div>
                <div className="mt-auto flex items-center gap-2 pt-4">
                  <button onClick={() => { setEditing(p); setForm({ ...p }); }} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/70 hover:border-gold-400 hover:text-gold-300"><Pencil size={11} /> Edit</button>
                  <div className="ml-auto flex items-center gap-1 rounded-full border border-forest-700 px-1 py-0.5">
                    <button onClick={() => setProductStock(p.id, Math.max(0, p.stock - 1))} aria-label="Decrease stock" className="grid h-6 w-6 place-items-center text-sand-200/70 hover:text-gold-300"><span className="text-sm">−</span></button>
                    <span className="w-7 text-center font-mono text-[11px] text-sand-100">{p.stock}</span>
                    <button onClick={() => setProductStock(p.id, p.stock + 1)} aria-label="Increase stock" className="grid h-6 w-6 place-items-center text-sand-200/70 hover:text-gold-300"><span className="text-sm">+</span></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {shownOrders.map((o) => {
            const meta = ORDER_META[o.status];
            return (
              <div key={o.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-forest-800 bg-forest-900/70 p-4 transition-colors hover:border-gold-500/40">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-gold-500/30 bg-gold-400/8 text-gold-300"><Package size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-semibold text-sand-100">{o.id} <Badge color={meta.color}>{meta.label}</Badge></p>
                  <p className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-sand-200/40">{o.customerName} · {o.items.length} item{o.items.length === 1 ? "" : "s"} · {new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="font-display text-lg font-semibold text-gold-300">{inrFmt(o.total)}</p>
                <div className="flex items-center gap-2">
                  {o.status !== "delivered" && o.status !== "cancelled" && (
                    <button onClick={() => advance(o)} className="flex items-center gap-1.5 rounded-full border border-gold-500/50 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-gold-300 hover:bg-gold-400 hover:text-forest-950"><ChevronRight size={11} /> Advance</button>
                  )}
                  <button onClick={() => setSelectedOrder(o)} className="rounded-full border border-forest-700 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/70 hover:border-gold-400 hover:text-gold-300">Open</button>
                </div>
              </div>
            );
          })}
          {shownOrders.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-10 text-center text-[13.5px] text-sand-200/50">No orders match.</p>}
        </div>
      )}

      {/* order drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[62] bg-forest-950/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
            <motion.aside initial={{ x: 480, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 480, opacity: 0 }} transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-[63] flex w-full max-w-md flex-col border-l border-forest-700 bg-forest-900" role="dialog" aria-label={`Order ${selectedOrder.id}`}>
              <div className="flex items-center justify-between border-b border-forest-800 px-6 py-5">
                <p className="font-display text-xl font-semibold text-sand-100">{selectedOrder.id}</p>
                <button onClick={() => setSelectedOrder(null)} aria-label="Close order" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={15} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <Badge color={ORDER_META[selectedOrder.status].color}>{ORDER_META[selectedOrder.status].label}</Badge>
                {selectedOrder.status !== "cancelled" && (
                  <div className="mt-5 flex items-center">
                    {ORDER_FLOW.map((s, i) => {
                      const idx = ORDER_FLOW.indexOf(selectedOrder.status);
                      const on = i <= idx;
                      return (
                        <React.Fragment key={s}>
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${on ? "border-transparent" : "border-forest-700"}`} style={on ? { background: ORDER_META[s].color } : {}}>
                            {on && <Check size={11} strokeWidth={3} className="text-forest-950" />}
                          </span>
                          {i < ORDER_FLOW.length - 1 && <span className={`mx-1 h-0.5 flex-1 ${i < idx ? "bg-gold-500" : "bg-forest-700"}`} />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
                <div className="mt-6 rounded-xl border border-forest-800 bg-forest-950/50 p-4 text-[13px] leading-relaxed text-sand-200/70">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gold-400/80">Ship to</p>
                  <p className="mt-1.5 font-semibold text-sand-100">{selectedOrder.customerName}</p>
                  <p>{selectedOrder.address}</p>
                  <p className="mt-1 text-sand-200/50">{selectedOrder.customerPhone} · {selectedOrder.customerEmail}</p>
                </div>
                <div className="mt-5 space-y-2.5">
                  {selectedOrder.items.map((it, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-forest-800 bg-forest-950/40 p-3">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: it.accent }} />
                      <span className="flex-1 text-[13.5px] text-sand-200/80">{it.name} × {it.qty}</span>
                      <span className="font-mono text-[12px] text-sand-200/50">{inrFmt(it.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 space-y-1.5 rounded-xl border border-forest-800 bg-forest-950/50 p-4 text-[13px]">
                  <div className="flex justify-between text-sand-200/60"><span>Subtotal</span><span>{inrFmt(selectedOrder.subtotal)}</span></div>
                  {selectedOrder.discount > 0 && <div className="flex justify-between text-moss-300"><span>Discount</span><span>− {inrFmt(selectedOrder.discount)}</span></div>}
                  <div className="flex justify-between text-sand-200/60"><span>Shipping</span><span>{selectedOrder.shipping === 0 ? "Free" : inrFmt(selectedOrder.shipping)}</span></div>
                  <div className="mt-1 flex justify-between border-t border-forest-800 pt-2 font-display text-lg font-semibold text-gold-300"><span>Total</span><span>{inrFmt(selectedOrder.total)}</span></div>
                  <p className="pt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/35">Paid via {selectedOrder.paymentMethod}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 border-t border-forest-800 p-5">
                {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
                  <button onClick={() => { advance(selectedOrder); setSelectedOrder(null); }} className="flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300"><Truck size={13} /> Advance status</button>
                )}
                <button onClick={() => printInvoice(selectedOrder)} className="flex items-center gap-2 rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/70 hover:border-gold-400 hover:text-gold-300"><Printer size={13} /> Invoice</button>
                {(selectedOrder.status === "new" || selectedOrder.status === "processing") && (
                  <button onClick={() => { if (window.confirm(`Cancel ${selectedOrder.id} and restock its items?`)) { cancelAndRestock(selectedOrder.id); toast("Cancelled & restocked"); setSelectedOrder(null); } }} className="ml-auto rounded-full border border-ember-500/50 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ember-300 hover:bg-ember-500/10">Cancel & restock</button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* product editor */}
      <AnimatePresence>
        {editing && form && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[64] grid place-items-center bg-forest-950/80 p-4 backdrop-blur-sm" onClick={() => { setEditing(null); setForm(null); }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-forest-700 bg-forest-900 p-7" role="dialog" aria-label="Edit product">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-semibold text-sand-100">Edit product</h3>
                <button onClick={() => { setEditing(null); setForm(null); }} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={15} /></button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><label className={label}>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} /></div>
                <div><label className={label}>Price (₹)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className={inp} /></div>
                <div><label className={label}>MRP (₹)</label><input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })} className={inp} /></div>
                <div><label className={label}>Stock</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className={inp} /></div>
                <div><label className={label}>Category</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inp} /></div>
                <div className="sm:col-span-2"><label className={label}>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inp} /></div>
                <div className="sm:col-span-2"><label className={label}>Highlights (one per line)</label><textarea value={form.highlights.join("\n")} onChange={(e) => setForm({ ...form, highlights: e.target.value.split("\n").filter(Boolean) })} rows={3} className={inp} /></div>
                <div className="sm:col-span-2"><label className={label}>Directions</label><textarea value={form.directions} onChange={(e) => setForm({ ...form, directions: e.target.value })} rows={2} className={inp} /></div>
                <div className="sm:col-span-2"><label className={label}>Safety notes</label><textarea value={form.safetyNotes} onChange={(e) => setForm({ ...form, safetyNotes: e.target.value })} rows={2} className={inp} /></div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={saveProd} className="rounded-full bg-gold-400 px-7 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Save product</button>
                <button onClick={() => { setEditing(null); setForm(null); }} className="rounded-full border border-forest-700 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200/60 hover:text-sand-100">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------- my profile ------------------------------- */

function MyProfile({ user }: { user: StudioUser }) {
  const toast = useToast();
  const [profile, setProfile] = useState<DoctorProfile>(() => getProfile(user.id));
  const [autoSaved, setAutoSaved] = useState(false);
  const timer = useRef<number>(0);

  const set = (patch: Partial<DoctorProfile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { saveProfile(next); setAutoSaved(true); window.setTimeout(() => setAutoSaved(false), 1800); }, 900);
  };

  const checks = [
    Boolean(profile.fullName), Boolean(profile.mobile), Boolean(profile.registrationNumber),
    profile.degrees.length > 0, Boolean(profile.specialty), Boolean(profile.clinicName), Boolean(profile.bioHtml),
  ];
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const inp = "w-full rounded-xl border border-forest-700 bg-forest-950/60 px-4 py-3 text-[14px] text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
  const label = "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.18em] text-gold-400/80";
  const author = AUTHORS[user.id] ?? AUTHORS.monesh;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="h-fit rounded-2xl border border-forest-800 bg-forest-900/70 p-6 text-center lg:sticky lg:top-24">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-2xl font-display text-2xl font-semibold" style={{ background: `${author.hue}18`, color: author.hue, border: `1px solid ${author.hue}55` }}>{author.initials}</span>
        <p className="mt-4 font-display text-xl font-semibold text-sand-100">{author.name}</p>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/45">{author.qualification}</p>
        <div className="mt-5">
          <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/45"><span>Profile complete</span><span className="text-gold-300">{pct}%</span></div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-forest-800"><div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300 transition-all duration-700" style={{ width: `${pct}%` }} /></div>
        </div>
        <p className={`mt-4 text-[12px] ${autoSaved ? "text-moss-300" : "text-sand-200/35"}`}>{autoSaved ? "✓ Saved" : "Auto-saves as you type"}</p>
      </div>
      <div className="space-y-5">
        <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400">Identity & contact</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className={label}>Full name</label><input value={profile.fullName} onChange={(e) => set({ fullName: e.target.value })} className={inp} /></div>
            <div><label className={label}>Mobile</label><input value={profile.mobile} onChange={(e) => set({ mobile: e.target.value })} className={inp} placeholder="+91 …" /></div>
            <div><label className={label}>Registration number</label><input value={profile.registrationNumber} onChange={(e) => set({ registrationNumber: e.target.value })} className={inp} placeholder="Maharashtra Council No." /></div>
            <div><label className={label}>Specialty</label><input value={profile.specialty} onChange={(e) => set({ specialty: e.target.value })} className={inp} /></div>
            <div><label className={label}>Clinic / city</label><input value={profile.clinicName} onChange={(e) => set({ clinicName: e.target.value })} className={inp} placeholder="Clinic name, City" /></div>
            <div><label className={label}>Years of experience</label><input value={profile.experienceYears} onChange={(e) => set({ experienceYears: e.target.value })} className={inp} placeholder="e.g. 12" /></div>
          </div>
        </div>
        <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400">Public bio <span className="normal-case tracking-normal text-sand-200/40">— shown on the Doctor's Corner</span></p>
          <textarea value={profile.bioHtml} onChange={(e) => set({ bioHtml: e.target.value })} rows={4} className={`${inp} mt-4`} placeholder="Your approach, your parampara, what patients can expect…" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ super settings ------------------------------ */

function SuperSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  useDb();
  const toast = useToast();
  const settings = getSettings();
  const rows: { key: "enablePublicStore" | "showProfileTab" | "maintenanceMode"; title: string; desc: string }[] = [
    { key: "enablePublicStore", title: "Enable public store", desc: "Off hides the store and product pages behind a locked screen." },
    { key: "showProfileTab", title: "Show 'My Profile' in My Account", desc: "Off hides the profile tab for shoppers." },
    { key: "maintenanceMode", title: "Maintenance mode", desc: "On shows visitors an 'under construction' screen on every page." },
  ];
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[66] grid place-items-center bg-forest-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900 p-7" role="dialog" aria-label="Master switches">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-2xl font-semibold text-sand-100"><ShieldCheck size={20} className="text-gold-400" /> Master switches</h3>
              <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={15} /></button>
            </div>
            <p className="mt-1.5 text-[12.5px] text-sand-200/50">Superadmin only. Changes apply to the public site instantly.</p>
            <div className="mt-5 space-y-3">
              {rows.map((r) => (
                <div key={r.key} className="flex items-center justify-between gap-4 rounded-xl border border-forest-800 bg-forest-950/50 p-4">
                  <div><p className="text-[13.5px] font-semibold text-sand-100">{r.title}</p><p className="mt-0.5 text-[11.5px] text-sand-200/45">{r.desc}</p></div>
                  <Toggle on={settings[r.key]} onChange={(b) => { saveSettings({ [r.key]: b }); toast(`${r.title} ${b ? "on" : "off"}`); }} label={r.title} />
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------- studio --------------------------------- */

export default function Studio() {
  useDb();
  const toast = useToast();
  const [user, setUser] = useState<StudioUser | null>(() => studioSession());
  const [tab, setTab] = useState<"blog" | "blogs" | "herbs" | "store" | "profile">("blog");
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!user) return <LoginGate onLogin={(u) => { setUser(u); toast(`Namaste, ${u.name} — the desk is open`); }} />;

  const isSuper = user.role === "superadmin";
  const tabs: { id: typeof tab; label: string; Icon: LucideIcon }[] = [
    { id: "blog", label: "Blogging space", Icon: BookOpen },
    { id: "blogs", label: "My Blogs", Icon: FileText },
    { id: "herbs", label: "Herb Index", Icon: Leaf },
    { id: "store", label: "Store", Icon: StoreIcon },
    { id: "profile", label: "My Profile", Icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-forest-950">
      <header className="sticky top-0 z-50 border-b border-forest-800 bg-forest-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
          <Link to="/" className="group flex items-center gap-3" aria-label="Back to Vaidyagan">
            <LogoTile size="sm" />
            <span>
              <span className="block font-display text-lg font-semibold leading-none text-sand-100">Doctor Studio</span>
              <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.26em] text-gold-400/80">वैद्यगण · publishing desk</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {isSuper && (
              <>
                <button onClick={() => setSettingsOpen(true)} aria-label="Master switches" title="Master switches" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-all hover:border-gold-400 hover:text-gold-300"><SettingsIcon size={16} /></button>
                <Link to="/admin" className="hidden items-center gap-2 rounded-full border border-gold-500/60 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 transition-all hover:bg-gold-400 hover:text-forest-950 sm:flex">
                  <LayoutGrid size={14} /> Admin Console <ExternalLink size={12} />
                </Link>
              </>
            )}
            <span className="hidden items-center gap-2 rounded-full border border-forest-700 px-3.5 py-2 md:flex">
              <span className="grid h-6 w-6 place-items-center rounded-full text-[9px] font-bold" style={{ background: `${user.hue}18`, color: user.hue }}>{user.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}</span>
              <span className="text-[12.5px] font-semibold text-sand-100">{user.name}</span>
              {isSuper && <Badge color={gold}>Superadmin</Badge>}
            </span>
            <button onClick={() => { studioLogout(); setUser(null); toast("Signed out — the desk is locked"); }} aria-label="Sign out" className="flex items-center gap-2 rounded-full border border-forest-700 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/60 transition-all hover:border-ember-400 hover:text-ember-300"><LogOut size={14} /> <span className="hidden sm:inline">Sign out</span></button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 lg:px-8">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] transition-all ${tab === t.id ? "border-gold-400 text-gold-300" : "border-transparent text-sand-200/45 hover:text-sand-100"}`}>
              <t.Icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        {tab === "blog" && <BlogEditor user={user} onBack={() => setTab("blogs")} />}
        {tab === "blogs" && <MyBlogs user={user} onEdit={() => setTab("blog")} />}
        {tab === "herbs" && <HerbEditor />}
        {tab === "store" && <StoreAdmin />}
        {tab === "profile" && <MyProfile user={user} />}
      </main>

      {isSuper && <SuperSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
