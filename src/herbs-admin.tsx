import React, { useRef, useState } from "react";
import { useApp, readImageFile, SmartImg } from "./lib";
import { HERBS, DOSHA_META, type Article, type Dosha, type Herb } from "./data";
import { COVER_CHOICES } from "./covers";
import { Plus, Trash, RefreshIcon, Pen, Upload, Close, Check, ImageIcon } from "./icons";

const ACCENTS = ["#d6b45f", "#82b39e", "#e07f49", "#93b1cf", "#a9cfbf", "#f0a377"];

export function HerbManager() {
  const { herbs, saveHerb, deleteHerb, resetHerbs, toast } = useApp();
  const [editing, setEditing] = useState<Herb | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const empty: Herb = {
    id: "", sanskrit: "", common: "", botanical: "", part: "Whole plant",
    rasa: [], virya: "Hot", vipaka: "Madhura", doshas: ["vata"],
    benefits: [], classical: "", caution: "", treats: [], image: "", accent: "#d6b45f",
  };
  const [form, setForm] = useState<Herb>(empty);
  const [rasaText, setRasaText] = useState("");
  const [benefitsText, setBenefitsText] = useState("");
  const [treatsText, setTreatsText] = useState("");

  const isSeed = (id: string) => HERBS.some((h) => h.id === id);

  const openHerb = (h: Herb | "new") => {
    setEditing(h);
    if (h === "new") { setForm({ ...empty, id: `herb-${Date.now()}` }); setRasaText(""); setBenefitsText(""); setTreatsText(""); }
    else { setForm(h); setRasaText(h.rasa.join(", ")); setBenefitsText(h.benefits.join("\n")); setTreatsText(h.treats.join(", ")); }
  };

  const save = () => {
    if (!form.common.trim() || !form.botanical.trim()) { toast("Give the herb at least a common and a botanical name"); return; }
    const herb: Herb = {
      ...form,
      sanskrit: form.sanskrit || form.common,
      rasa: rasaText.split(",").map((s) => s.trim()).filter(Boolean),
      benefits: benefitsText.split("\n").map((s) => s.trim()).filter(Boolean),
      treats: treatsText.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
    };
    saveHerb(herb);
    toast(editing === "new" ? `${herb.common} added to the public herb index` : `${herb.common} updated across the site`);
    setEditing(null);
  };

  const input = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
  const label = "mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Public herb index · {herbs.length} monographs</p>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-sand-200/55">
            Everything saved here appears instantly on the public Herb Index page and in the homepage symptom finder.
          </p>
        </div>
        <div className="flex gap-2.5">
          {confirmReset ? (
            <>
              <button onClick={() => { resetHerbs(); setConfirmReset(false); setEditing(null); toast("Herb index restored to the classical eight"); }} className="rounded-full bg-ember-500/25 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ember-300 hover:bg-ember-500/40">Yes, restore</button>
              <button onClick={() => setConfirmReset(false)} className="rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/60">Cancel</button>
            </>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="flex items-center gap-2 rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/60 transition-colors hover:border-gold-400 hover:text-gold-300">
              <RefreshIcon size={13} /> Restore classics
            </button>
          )}
          <button onClick={() => openHerb("new")} className="flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 transition-all hover:bg-gold-300">
            <Plus size={13} /> New herb
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-6 rounded-xl border border-gold-500/35 bg-forest-900 p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">{editing === "new" ? "New monograph" : `Editing · ${form.common || "herb"}`}</p>
            <button onClick={() => setEditing(null)} className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/50 hover:text-gold-300">Close</button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><label className={label}>Common name *</label><input value={form.common} onChange={(e) => setForm({ ...form, common: e.target.value })} placeholder="e.g. Ashwagandha" className={input} /></div>
            <div><label className={label}>Sanskrit (Devanagari)</label><input value={form.sanskrit} onChange={(e) => setForm({ ...form, sanskrit: e.target.value })} placeholder="e.g. अश्वगन्धा" className={input} /></div>
            <div><label className={label}>Botanical name *</label><input value={form.botanical} onChange={(e) => setForm({ ...form, botanical: e.target.value })} placeholder="e.g. Withania somnifera" className={input} /></div>
            <div><label className={label}>Part used</label><input value={form.part} onChange={(e) => setForm({ ...form, part: e.target.value })} placeholder="e.g. Root" className={input} /></div>
            <div><label className={label}>Rasa — tastes (comma separated)</label><input value={rasaText} onChange={(e) => setRasaText(e.target.value)} placeholder="Tikta, Kashaya" className={input} /></div>
            <div><label className={label}>Vipaka (post-digestive)</label><input value={form.vipaka} onChange={(e) => setForm({ ...form, vipaka: e.target.value })} placeholder="e.g. Madhura" className={input} /></div>
            <div>
              <label className={label}>Virya (potency)</label>
              <div className="flex gap-2">
                {(["Hot", "Cold"] as const).map((v) => (
                  <button key={v} onClick={() => setForm({ ...form, virya: v })} className={`flex-1 rounded-lg border py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${form.virya === v ? "border-gold-400 bg-gold-400/10 text-gold-300" : "border-forest-700 text-sand-200/55"}`}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={label}>Pacifies doshas</label>
              <div className="flex gap-2">
                {(["vata", "pitta", "kapha"] as Dosha[]).map((d) => {
                  const on = form.doshas.includes(d);
                  return (
                    <button key={d} onClick={() => setForm({ ...form, doshas: on ? form.doshas.filter((x) => x !== d) : [...form.doshas, d] })}
                      className="flex-1 rounded-lg border py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-all"
                      style={{ borderColor: on ? DOSHA_META[d].color : "var(--color-forest-700)", color: on ? DOSHA_META[d].color : "rgba(231,220,191,0.55)", background: on ? `${DOSHA_META[d].color}14` : "transparent" }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="sm:col-span-2"><label className={label}>Clinical benefits — one per line</label><textarea value={benefitsText} onChange={(e) => setBenefitsText(e.target.value)} rows={3} className={input} placeholder={"Adaptogenic — steadies cortisol…\nSleep architecture improves…"} /></div>
            <div><label className={label}>Classical line</label><textarea value={form.classical} onChange={(e) => setForm({ ...form, classical: e.target.value })} rows={2} className={input} placeholder="The classical description, in your words…" /></div>
            <div><label className={label}>Cautions</label><textarea value={form.caution} onChange={(e) => setForm({ ...form, caution: e.target.value })} rows={2} className={input} placeholder="Who should avoid it…" /></div>
            <div><label className={label}>Symptom tags (comma separated — feeds search)</label><input value={treatsText} onChange={(e) => setTreatsText(e.target.value)} placeholder="stress, sleep, fatigue" className={input} /></div>
            <div>
              <label className={label}>Accent colour</label>
              <div className="flex items-center gap-2 pt-1.5">
                {ACCENTS.map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, accent: c })} aria-label={`Accent ${c}`} className={`h-7 w-7 rounded-full border-2 transition-transform ${form.accent === c ? "scale-110 border-sand-100" : "border-transparent"}`} style={{ background: c }} />
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Monograph image — URL or upload (blank = leaf placeholder)</label>
              <div className="flex flex-wrap items-center gap-3">
                <input value={form.image.startsWith("data:") ? "(uploaded from device)" : form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" className={`${input} max-w-sm`} />
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-forest-600 px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 transition-all hover:border-gold-400 hover:text-gold-300">
                  <Upload size={13} /> Upload picture
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) readImageFile(f, (u) => setForm({ ...form, image: u }), (m) => toast(m));
                    e.target.value = "";
                  }} />
                </label>
                {form.image && <button onClick={() => setForm({ ...form, image: "" })} className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/45 hover:text-ember-300"><Close size={12} /> Clear</button>}
                {form.image && <SmartImg src={form.image} alt="Preview" className="h-14 w-20 rounded-lg border border-forest-700 object-cover" />}
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <button onClick={save} className="flex items-center gap-2 rounded-full bg-gold-400 px-7 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Check size={14} /> Save to the index</button>
            <button onClick={() => setEditing(null)} className="rounded-full border border-forest-700 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200/60 hover:text-sand-100">Discard</button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-3">
        {herbs.map((h) => (
          <div key={h.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-forest-800 bg-forest-850/50 p-4 transition-colors hover:border-forest-600">
            <SmartImg src={h.image} alt={h.common} className="h-14 w-14 shrink-0 rounded-lg border border-forest-800 object-cover duotone" style={h.duotone ? { filter: h.duotone } : undefined} />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sand-100">
                {h.common}
                <span className="font-display text-base italic text-sand-200/50">{h.sanskrit}</span>
                {isSeed(h.id)
                  ? <span className="rounded-full border border-forest-700 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-sand-200/45">Classical</span>
                  : <span className="rounded-full bg-gold-400/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-gold-300">Desk-added</span>}
              </p>
              <p className="mt-0.5 font-mono text-[10px] italic text-sand-200/40">{h.botanical} · {h.rasa.join(", ") || "—"} · {h.virya} virya</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openHerb(h)} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/70 transition-colors hover:border-gold-400 hover:text-gold-300"><Pen size={12} /> Edit</button>
              {confirmDelete === h.id ? (
                <button onClick={() => { deleteHerb(h.id); setConfirmDelete(null); toast(`${h.common} removed from the index`); }} className="flex items-center gap-1.5 rounded-full bg-ember-500/25 px-4 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ember-300 hover:bg-ember-500/40">Confirm</button>
              ) : (
                <button onClick={() => { setConfirmDelete(h.id); window.setTimeout(() => setConfirmDelete((c) => (c === h.id ? null : c)), 3500); }} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/45 transition-colors hover:border-ember-400 hover:text-ember-300"><Trash size={12} /> Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------- herb-linked article writer ------------------------ */

export function HerbArticleWriter({ authorId }: { authorId: string }) {
  const { herbs, saveDraft, publishArticle, toast } = useApp();
  const [herbId, setHerbId] = useState("");
  const [title, setTitle] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const herb = herbs.find((h) => h.id === herbId);

  const publish = (asDraft: boolean) => {
    if (!title.trim()) { toast("Give the article a title first"); return; }
    const html = editorRef.current?.innerHTML ?? "";
    const a: Article = {
      id: `user-${Date.now()}`,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "herb-article",
      title: title.trim(),
      subtitle: herb ? `On ${herb.common} (${herb.botanical})` : "From the Vaidyagan desk",
      summary: (editorRef.current?.textContent ?? "").slice(0, 180) || "A desk article on the herb index.",
      cover: herb?.image || COVER_CHOICES[3].src,
      categoryId: "dravyaguna",
      doshas: herb?.doshas ?? ["vata"],
      authorId,
      date: new Date().toISOString().slice(0, 10),
      views: 0,
      symptoms: herb?.treats ?? [],
      kind: "blog",
      blocks: [],
      html,
      status: asDraft ? "draft" : "published",
    };
    saveDraft(a);
    if (!asDraft) publishArticle(a);
    setTitle("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    toast(asDraft ? "Draft saved to the Blogging space" : "Published to the journal and homepage ✓");
  };

  return (
    <div className="mt-8 rounded-xl border border-kapha-500/30 bg-kapha-500/5 p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-kapha-300">Herb-linked article writer</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-sand-200/55">
        Write a detailed article about a specific herb — it goes to the journal under your name, tagged with the herb's doshas and symptoms.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]">
        <select value={herbId} onChange={(e) => setHerbId(e.target.value)} className="rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 focus:border-gold-400 focus:outline-none">
          <option value="">Link a herb (optional)…</option>
          {herbs.map((h) => <option key={h.id} value={h.id}>{h.common} — {h.sanskrit}</option>)}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title — e.g. 'Kutki: the liver's quiet ally'" className="rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none" />
      </div>
      <div className="mt-3 rounded-xl border border-forest-700 bg-forest-950/50 focus-within:border-gold-400">
        <div className="flex items-center gap-1.5 border-b border-forest-800 px-3 py-2" onMouseDown={(e) => e.preventDefault()}>
          <button onClick={() => { editorRef.current?.focus(); document.execCommand("bold"); }} className="grid h-8 w-8 place-items-center rounded-md border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300" title="Bold"><b className="text-xs">B</b></button>
          <button onClick={() => { editorRef.current?.focus(); document.execCommand("italic"); }} className="grid h-8 w-8 place-items-center rounded-md border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300" title="Italic"><i className="text-xs">I</i></button>
          <button onClick={() => { editorRef.current?.focus(); document.execCommand("insertUnorderedList"); }} className="grid h-8 w-8 place-items-center rounded-md border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300" title="Bullet list"><span className="text-xs leading-none">•≡</span></button>
          <label className="ml-1 flex cursor-pointer items-center gap-1.5 rounded-md border border-forest-700 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300" title="Add image">
            <ImageIcon size={13} /> Image
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readImageFile(f, (u) => { editorRef.current?.focus(); document.execCommand("insertHTML", false, `<img src="${u}" style="max-width:100%;border-radius:10px" />`); }, (m) => toast(m));
              e.target.value = "";
            }} />
          </label>
        </div>
        <div ref={editorRef} contentEditable data-placeholder="Begin the article… bold, italics, bullets and pictures are all available."
          className="editor-surface min-h-[120px] p-4 text-[14.5px] leading-[1.8] text-sand-200/90" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <button onClick={() => publish(false)} className="flex items-center gap-2 rounded-full bg-[#5f947e] px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-all hover:bg-[#82b39e]"><Check size={13} /> Publish now</button>
        <button onClick={() => publish(true)} className="flex items-center gap-2 rounded-full border border-forest-700 px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/60 hover:text-sand-100">Save as draft</button>
      </div>
    </div>
  );
}
