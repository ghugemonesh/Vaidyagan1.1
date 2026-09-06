import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { readImageFile, SmartImg } from "./lib";
import { Quote, ImageIcon, Video, Eye, Pen, Monitor, Phone, Expand, Compress, List, Close, Check, Upload } from "./icons";

export interface FmtState { bold: boolean; italic: boolean; underline: boolean; strike: boolean; center: boolean; full: boolean; block: string }

/** Parse H2/H3 headings out of the editor HTML — same logic the public TOC uses. */
export function extractToc(html: string): { level: 2 | 3; text: string }[] {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("h2, h3"))
      .map((n) => ({ level: (n.tagName === "H2" ? 2 : 3) as 2 | 3, text: n.textContent ?? "" }))
      .filter((t) => t.text.trim());
  } catch {
    return [];
  }
}

/* ------------------------------ editor toolbar ------------------------------ */

export function EditorToolbar({ edRef, sync, insertShloka, onOpenImage, onOpenVideo, words, readMin, fmt, mode, setMode, device, setDevice, focus, onToggleFocus, restoreSelection, refreshFmt, outlineOpen, onToggleOutline, tocCount }: {
  edRef: React.RefObject<HTMLDivElement | null>;
  sync: () => void;
  insertShloka: () => void;
  onOpenImage: () => void;
  onOpenVideo: () => void;
  words: number; readMin: number;
  fmt: FmtState;
  mode: "write" | "preview"; setMode: (m: "write" | "preview") => void;
  device: "desktop" | "mobile"; setDevice: (d: "desktop" | "mobile") => void;
  focus: boolean; onToggleFocus: () => void;
  restoreSelection: () => void;
  refreshFmt: () => void;
  outlineOpen: boolean; onToggleOutline: () => void; tocCount: number;
}) {
  const keepSel = (e: React.MouseEvent) => e.preventDefault();
  const exec = (cmd: string, val?: string) => {
    const ed = edRef.current;
    if (!ed) return;
    const sel = window.getSelection();
    /* CRITICAL: check the selection BEFORE focusing — focusing a contentEditable
       collapses the selection to the start, which makes formatting apply to nothing. */
    const lost = !sel || sel.rangeCount === 0 || sel.isCollapsed || !sel.anchorNode || !ed.contains(sel.anchorNode);
    if (lost) { ed.focus(); restoreSelection(); }
    try { document.execCommand(cmd, false, val); } catch { /* older engines */ }
    sync();
    refreshFmt();
  };

  const btn = "grid h-9 w-9 place-items-center rounded-lg border border-forest-700 text-sand-200/70 transition-all hover:border-gold-400 hover:text-gold-300";
  const activeBtn = "border-gold-400 bg-gold-400/15 text-gold-300";
  const blockLabel: Record<string, string> = { p: "Normal text", h1: "Heading 1", h2: "Heading 2", h3: "Heading 3", div: "Normal text" };

  return (
    <div className="shrink-0 border-b border-forest-800 bg-forest-850/80">
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5">
        <button onClick={onToggleOutline} aria-pressed={outlineOpen} aria-label="Table of contents"
          title={outlineOpen ? "Close table of contents" : "Open table of contents"}
          className={`relative grid h-9 w-9 place-items-center rounded-lg border transition-all ${outlineOpen ? "border-gold-400 bg-gold-400/15 text-gold-300" : "border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300"}`}>
          <List size={15} />
          {tocCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold-400 px-1 font-mono text-[8.5px] font-bold leading-none text-forest-950">{tocCount}</span>
          )}
        </button>
        <span className="mx-1 h-5 w-px bg-forest-700" />
        <select
          value={["p", "h1", "h2", "h3"].includes(fmt.block) ? fmt.block : "p"}
          aria-label="Paragraph style"
          onChange={(e) => { const v = e.currentTarget.value; if (v) exec("formatBlock", `<${v}>`); }}
          className="h-9 rounded-lg border border-forest-700 bg-forest-900 px-2 font-mono text-[10.5px] uppercase tracking-wide text-sand-200/75 focus:border-gold-400 focus:outline-none">
          <option value="p">Normal text</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option>
        </select>
        <span className="mx-1 h-5 w-px bg-forest-700" />
        <span onMouseDown={keepSel} className="flex items-center gap-1.5">
          <button onClick={() => exec("bold")} className={`${btn} ${fmt.bold ? activeBtn : ""}`} title="Bold" aria-pressed={fmt.bold}><b className="text-xs">B</b></button>
          <button onClick={() => exec("italic")} className={`${btn} ${fmt.italic ? activeBtn : ""}`} title="Italic" aria-pressed={fmt.italic}><i className="text-xs">I</i></button>
          <button onClick={() => exec("underline")} className={`${btn} ${fmt.underline ? activeBtn : ""}`} title="Underline" aria-pressed={fmt.underline}><u className="text-xs">U</u></button>
          <button onClick={() => exec("strikeThrough")} className={`${btn} ${fmt.strike ? activeBtn : ""}`} title="Strikethrough" aria-pressed={fmt.strike}><s className="text-xs">S</s></button>
        </span>
        <span className="mx-1 h-5 w-px bg-forest-700" />
        <span onMouseDown={keepSel} className="flex items-center gap-1.5">
          <button onClick={() => exec("insertUnorderedList")} className={btn} title="Bullet list"><span className="text-xs leading-none">•≡</span></button>
          <button onClick={() => exec("insertOrderedList")} className={btn} title="Numbered list"><span className="text-xs leading-none">1≡</span></button>
          <button onClick={() => exec("formatBlock", "<blockquote>")} className={btn} title="Quote"><Quote size={14} /></button>
        </span>
        <span className="mx-1 h-5 w-px bg-forest-700" />
        <span onMouseDown={keepSel} className="flex items-center gap-1.5">
          <button onClick={() => exec("justifyLeft")} className={`${btn} ${!fmt.center && !fmt.full ? activeBtn : ""}`} title="Align left" aria-label="Align left"><span className="leading-none">⬅</span></button>
          <button onClick={() => exec("justifyCenter")} className={`${btn} ${fmt.center ? activeBtn : ""}`} title="Align centre" aria-pressed={fmt.center}><span className="leading-none">⬌</span></button>
          <button onClick={() => exec("justifyFull")} className={`${btn} ${fmt.full ? activeBtn : ""}`} title="Justify" aria-pressed={fmt.full}><span className="leading-none">☰</span></button>
        </span>
        <span className="mx-1 h-5 w-px bg-forest-700" />
        <span onMouseDown={keepSel} className="flex items-center gap-1.5">
          <button onClick={insertShloka} className="flex h-9 items-center gap-1.5 rounded-lg border border-gold-500/50 px-3 font-mono text-[9px] uppercase tracking-[0.12em] text-gold-300 transition-all hover:bg-gold-400 hover:text-forest-950" title="Insert Sanskrit shloka block">श्लोक Shloka</button>
          <button onClick={onOpenImage} className="flex h-9 items-center gap-1.5 rounded-lg border border-forest-700 px-3 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/70 transition-all hover:border-gold-400 hover:text-gold-300" title="Insert image"><ImageIcon size={13} /> Image</button>
          <button onClick={onOpenVideo} className="flex h-9 items-center gap-1.5 rounded-lg border border-forest-700 px-3 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/70 transition-all hover:border-gold-400 hover:text-gold-300" title="Embed YouTube/Vimeo video"><Video size={13} /> Video</button>
        </span>
        <div className="ml-auto flex items-center gap-1.5" onMouseDown={keepSel}>
          <span className="hidden items-center gap-1 rounded-full border border-forest-700 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-gold-300/80 lg:flex" title="Live word count & reading time">
            {words.toLocaleString()} words · {readMin} min
          </span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/40 md:block">
            {fmt.block !== "p" ? blockLabel[fmt.block] : "Normal"}
            {fmt.bold && " · B"}{fmt.italic && " · I"}{fmt.underline && " · U"}{fmt.strike && " · S"}
            {fmt.center && " · centred"}{fmt.full && " · justified"}
          </span>
          <span className="mx-1 h-5 w-px bg-forest-700" />
          <button onClick={() => { setMode("write"); }} className={`${btn} ${mode === "write" ? activeBtn : ""}`} title="Write"><Pen size={14} /></button>
          <button onClick={() => setMode("preview")} className={`${btn} ${mode === "preview" ? activeBtn : ""}`} title="Preview"><Eye size={14} /></button>
          {mode === "preview" && (
            <>
              <button onClick={() => setDevice("desktop")} className={`${btn} ${device === "desktop" ? activeBtn : ""}`} title="Desktop preview"><Monitor size={14} /></button>
              <button onClick={() => setDevice("mobile")} className={`${btn} ${device === "mobile" ? activeBtn : ""}`} title="Mobile preview"><Phone size={14} /></button>
            </>
          )}
          <button onClick={onToggleFocus} className={`${btn} ${focus ? activeBtn : ""}`} title={focus ? "Exit focus mode" : "Focus mode — hide sidebars"} aria-pressed={focus}>
            {focus ? <Compress size={14} /> : <Expand size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ outline drawer ------------------------------ */

export function OutlineDrawer({ toc, active, open, pinned, onOpenChange, onPin, onJump }: {
  toc: { level: 2 | 3; text: string }[];
  active: number;
  open: boolean;
  pinned: boolean;
  onOpenChange: (b: boolean) => void;
  onPin: () => void;
  onJump: (i: number) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside key="toc-drawer" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          className="absolute bottom-3 right-3 top-3 z-30 flex w-[280px] max-w-[85%] flex-col overflow-hidden rounded-2xl border border-forest-700/60 bg-forest-950/85 shadow-[0_28px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          role="navigation" aria-label="Table of contents">
          <div className="flex items-center gap-2.5 border-b border-forest-800/80 px-4 py-3.5">
            <List size={16} className="text-gold-400" />
            <p className="font-display text-[15px] font-semibold leading-none text-sand-100">Table of Contents</p>
            <span className="rounded-full border border-gold-500/40 bg-gold-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-gold-300">
              {toc.length} heading{toc.length === 1 ? "" : "s"}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={onPin} aria-pressed={pinned}
                title={pinned ? "Unpin — drawer will overlay the page" : "Pin open — page reflows around the drawer"}
                className={`grid h-8 w-8 place-items-center rounded-lg border transition-all ${pinned ? "border-gold-400 bg-gold-400/15 text-gold-300" : "border-forest-700 text-sand-200/50 hover:border-gold-400 hover:text-gold-300"}`}>
                <Pen size={13} className={pinned ? "" : "-rotate-45"} />
              </button>
              <button onClick={() => onOpenChange(false)} aria-label="Close table of contents"
                className="grid h-8 w-8 place-items-center rounded-lg border border-forest-700 text-sand-200/50 transition-all hover:border-ember-400 hover:text-ember-300">
                <Close size={13} />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3">
            {toc.length === 0 ? (
              <div className="mx-1 rounded-xl border border-dashed border-forest-700 p-5 text-center">
                <List size={20} className="mx-auto text-forest-600" />
                <p className="mt-3 text-[12.5px] leading-relaxed text-sand-200/55">
                  Add <b className="text-sand-200/80">H2</b> or <b className="text-sand-200/80">H3</b> headings to your article to generate an outline.
                </p>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/35">Use the ¶ Style menu in the toolbar</p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {toc.map((t, i) => {
                  const isActive = active === i;
                  const isH3 = t.level === 3;
                  return (
                    <li key={`${t.text}-${i}`}>
                      <button onClick={() => onJump(i)} aria-current={isActive ? "true" : undefined}
                        className={`group flex w-full items-start gap-2.5 rounded-lg border-l-2 py-2 pr-3 text-left transition-all duration-200 ${isH3 ? "pl-7" : "pl-3.5"} ${
                          isActive ? "border-gold-400 bg-gold-400/10 shadow-[inset_0_0_24px_rgba(214,180,95,0.06)]" : "border-transparent hover:border-gold-500/40 hover:bg-forest-850/80"
                        }`}>
                        <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 transition-all duration-200 ${isActive ? "scale-125 bg-gold-400 shadow-[0_0_8px_rgba(214,180,95,0.8)]" : "bg-forest-600 group-hover:bg-gold-500/70"}`} />
                        <span className="min-w-0 flex-1">
                          <span className={`block leading-snug ${isH3 ? "text-[12.5px] text-moss-300/85 group-hover:text-moss-300" : "text-[13.5px] font-semibold text-sand-100"} ${isActive ? "!text-gold-300" : ""}`}>{t.text}</span>
                          <span className={`mt-0.5 block font-mono text-[8px] uppercase tracking-[0.18em] ${isActive ? "text-gold-400/80" : "text-sand-200/30"}`}>H{t.level}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {toc.length > 0 && (
            <div className="border-t border-forest-800/80 px-4 py-2.5">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/35">
                {pinned ? "Pinned — page reflows around this panel" : "Click a heading to jump to it"}
              </p>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ media modals ------------------------------- */

export function ImageInsertModal({ onInsert, onClose }: { onInsert: (html: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [size, setSize] = useState<"s" | "m" | "l">("m");
  const width = size === "s" ? "max-width:46%" : size === "m" ? "max-width:78%" : "max-width:100%";

  const insert = () => {
    if (!url.trim()) return;
    const html = caption.trim()
      ? `<figure style="${width};margin:1.2rem auto"><img src="${url}" alt="${caption}" style="width:100%;border-radius:10px" /><figcaption>${caption}</figcaption></figure>`
      : `<img src="${url}" alt="" style="${width};display:block;margin:1.2rem auto;border-radius:10px" />`;
    onInsert(html);
    onClose();
  };

  const input = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[66] flex items-center justify-center bg-forest-950/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900 p-6" role="dialog" aria-label="Insert image">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Insert image</p>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><Close size={15} /></button>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Image URL or upload</label>
            <div className="flex gap-2">
              <input value={url.startsWith("data:") ? "(uploaded)" : url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={input} />
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-forest-600 px-3 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">
                <Upload size={12} /> File
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) readImageFile(f, (u) => setUrl(u), () => setUrl(""));
                  e.target.value = "";
                }} />
              </label>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Caption (optional)</label>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. Fig 1 — tongue coating, day 3" className={input} />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Size on page</label>
            <div className="flex gap-2">
              {([["s", "Small"], ["m", "Medium"], ["l", "Full width"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setSize(k)} className={`flex-1 rounded-lg border py-2 font-mono text-[10px] uppercase tracking-wide transition-all ${size === k ? "border-gold-400 bg-gold-400/10 text-gold-300" : "border-forest-700 text-sand-200/55 hover:text-sand-100"}`}>{l}</button>
              ))}
            </div>
          </div>
          {url && <SmartImg src={url} alt="Preview" className="max-h-40 w-full rounded-lg border border-forest-700 object-cover" />}
          <button onClick={insert} disabled={!url.trim()} className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300 disabled:opacity-35">
            <Check size={14} /> Insert into article
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function VideoInsertModal({ onInsert, onClose }: { onInsert: (html: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");

  const embed = (() => {
    const u = url.trim();
    if (!u) return null;
    const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vm = u.match(/vimeo\.com\/(\d{6,})/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
    return null;
  })();

  const insert = () => {
    if (!embed) return;
    const html = `<figure style="margin:1.4rem auto"><div style="position:relative;padding-top:56.25%;border-radius:12px;overflow:hidden;border:1px solid #20392a"><iframe src="${embed}" title="${caption || "Video"}" style="position:absolute;inset:0;width:100%;height:100%" allowfullscreen></iframe></div>${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
    onInsert(html);
    onClose();
  };

  const input = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[66] flex items-center justify-center bg-forest-950/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900 p-6" role="dialog" aria-label="Embed video">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Embed video</p>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><Close size={15} /></button>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">YouTube or Vimeo link</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" className={input} />
            {url.trim() && !embed && <p className="mt-1.5 text-[11.5px] text-ember-300">That doesn't look like a YouTube or Vimeo link yet.</p>}
            {embed && <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-kapha-300"><Check size={12} /> Video recognised — ready to embed.</p>}
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Caption (optional)</label>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. Dr. Karale demonstrates nasya" className={input} />
          </div>
          <button onClick={insert} disabled={!embed} className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300 disabled:opacity-35">
            <Video size={14} /> Embed into article
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
