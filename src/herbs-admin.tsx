import React, { useState } from "react";
import { Plus, Trash2, RotateCcw, Pencil, Upload, X, Check } from "lucide-react";
import { useApp, readImageFile, SmartImg } from "./lib";
import { HERBS, DOSHA_META, type Herb, type Dosha } from "./data";

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
    else {
      setForm(h);
      setRasaText(h.rasa.join(", "));
      setBenefitsText(h.benefits.join("\n"));
      setTreatsText(h.treats.join(", "));
    }
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
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Public herb index · {herbs.length} monograph{herbs.length === 1 ? "" : "s"}</p>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-sand-200/55">Everything saved here appears instantly on the public Herb Index page and in the homepage symptom finder.</p>
        </div>
        <div className="flex gap-2.5">
          {confirmReset ? (
            <>
              <button onClick={() => { resetHerbs(); setConfirmReset(false); setEditing(null); toast("Herb index restored to the classical eight"); }} className="rounded-full bg-ember-500/25 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ember-300 hover:bg-ember-500/40">Yes, restore</button>
              <button onClick={() => setConfirmReset(false)} className="rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/60">Cancel</button>
            </>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="flex items-center gap-2 rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/60 transition-colors hover:border-gold-400 hover:text-gold-300"><RotateCcw size={13} /> Restore classics</button>
          )}
          <button onClick={() => openHerb("new")} className="gold-sheen flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300"><Plus size={13} /> New herb</button>
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
                      style={{ borderColor: on ? DOSHA_META[d].color : "var(--color-forest-700)", color: on ? DOSHA_META[d].color : "rgba(231,220,191,0.55)", background: on ? `${DOSHA_META[d].color}14` : "transparent" }}>{d}</button>
                  );
                })}
              </div>
            </div>
            <div className="sm:col-span-2"><label className={label}>Clinical benefits — one per line</label><textarea value={benefitsText} onChange={(e) => setBenefitsText(e.target.value)} rows={3} placeholder={"Adaptogenic — steadies stress…\nImproves sleep quality…"} className={input} /></div>
            <div><label className={label}>Classical line</label><textarea value={form.classical} onChange={(e) => setForm({ ...form, classical: e.target.value })} rows={2} className={input} /></div>
            <div><label className={label}>Cautions</label><textarea value={form.caution} onChange={(e) => setForm({ ...form, caution: e.target.value })} rows={2} className={input} /></div>
            <div><label className={label}>Symptom tags (comma separated)</label><input value={treatsText} onChange={(e) => setTreatsText(e.target.value)} placeholder="stress, sleep, fatigue" className={input} /></div>
            <div className="sm:col-span-2">
              <label className={label}>Monograph image — URL or upload</label>
              <div className="flex flex-wrap items-center gap-3">
                <input value={form.image.startsWith("data:") ? "(uploaded from device)" : form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" disabled={form.image.startsWith("data:")} className={`${input} max-w-sm`} />
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-forest-600 px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 transition-all hover:border-gold-400 hover:text-gold-300">
                  <Upload size={13} /> Upload picture
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) readImageFile(f, (u) => setForm({ ...form, image: u }), (m) => toast(m));
                    e.target.value = "";
                  }} />
                </label>
                {form.image && <button onClick={() => setForm({ ...form, image: "" })} className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/45 hover:text-ember-300"><X size={12} /> Clear</button>}
                {form.image && <SmartImg src={form.image} alt="Preview" className="h-14 w-20 rounded-lg border border-forest-700 object-cover" />}
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <button onClick={save} className="gold-sheen flex items-center gap-2 rounded-full bg-gold-400 px-7 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Check size={14} /> Save to the index</button>
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
              <button onClick={() => openHerb(h)} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/70 transition-colors hover:border-gold-400 hover:text-gold-300"><Pencil size={12} /> Edit</button>
              {confirmDelete === h.id ? (
                <button onClick={() => { deleteHerb(h.id); setConfirmDelete(null); toast(`${h.common} removed from the index`); }} className="flex items-center gap-1.5 rounded-full bg-ember-500/25 px-4 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ember-300 hover:bg-ember-500/40">Confirm</button>
              ) : (
                <button onClick={() => { setConfirmDelete(h.id); window.setTimeout(() => setConfirmDelete((c) => (c === h.id ? null : c)), 3500); }} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/45 transition-colors hover:border-ember-400 hover:text-ember-300"><Trash2 size={12} /> Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
