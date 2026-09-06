/* =============================================================================
   Vaidyagan — Herb Index manager (Studio + Console)
   Add / edit / remove public herb monographs. Changes persist through the
   shared herbs store so the public Herb Index page updates instantly.
   ========================================================================== */

import React, { useState } from "react";
import { useApp, readImageFile, SmartImg } from "./lib";
import { HERBS, DOSHA_META, type Dosha, type Herb } from "./data";
import { Plus, Trash, RefreshIcon, Pen, Upload, Close, Check, ImageIcon } from "./icons";

const ACCENTS = ["#d6b45f", "#82b39e", "#e07f49", "#93b1cf", "#a9cfbf", "#f0a377"];

const inp = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
const lbl = "mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.18em] text-gold-400/80";

export function HerbManager() {
  const { herbs, saveHerb, deleteHerb, resetHerbs, toast } = useApp();
  const [editing, setEditing] = useState<Herb | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const blank: Herb = {
    id: `herb-${Date.now()}`, sanskrit: "", common: "", botanical: "", part: "",
    rasa: [], virya: "Hot", vipaka: "", doshas: [], benefits: [], classical: "", caution: "",
    treats: [], image: "", accent: "#d6b45f",
  };
  const [form, setForm] = useState<Herb>(blank);
  const [rasaText, setRasaText] = useState("");
  const [benefitsText, setBenefitsText] = useState("");
  const [treatsText, setTreatsText] = useState("");

  const startEdit = (h: Herb | "new") => {
    if (h === "new") {
      setForm({ ...blank, id: `herb-${Date.now()}` });
      setRasaText(""); setBenefitsText(""); setTreatsText("");
    } else {
      setForm(h);
      setRasaText(h.rasa.join(", "));
      setBenefitsText(h.benefits.join("\n"));
      setTreatsText(h.treats.join(", "));
    }
    setEditing(h);
  };

  const save = () => {
    if (!form.common.trim()) { toast("Give the herb at least a common name"); return; }
    saveHerb({
      ...form,
      rasa: rasaText.split(",").map((s) => s.trim()).filter(Boolean),
      benefits: benefitsText.split("\n").map((s) => s.trim()).filter(Boolean),
      treats: treatsText.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
    });
    toast(`${form.common} saved to the Herb Index`);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/45">{herbs.length} monograph{herbs.length === 1 ? "" : "s"}</p>
        <div className="flex gap-2">
          {confirmReset ? (
            <>
              <button onClick={() => { resetHerbs(); setConfirmReset(false); setEditing(null); toast("Herb Index restored to the classical eight"); }}
                className="rounded-full bg-ember-400 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-forest-950">Yes, restore</button>
              <button onClick={() => setConfirmReset(false)} className="rounded-full border border-forest-700 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60">Cancel</button>
            </>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><RefreshIcon size={12} /> Restore classics</button>
          )}
          <button onClick={() => startEdit("new")} className="flex items-center gap-1.5 rounded-full bg-gold-400 px-4 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-forest-950 hover:bg-gold-300"><Plus size={12} /> New herb</button>
        </div>
      </div>

      {editing && (
        <div className="rounded-xl border border-gold-500/40 bg-forest-900 p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-300">{editing === "new" ? "New monograph" : `Edit · ${form.common || "herb"}`}</p>
            <button onClick={() => setEditing(null)} aria-label="Close editor" className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><Close size={14} /></button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className={lbl}>Common name *</label><input value={form.common} onChange={(e) => setForm({ ...form, common: e.target.value })} className={inp} placeholder="Ashwagandha" /></div>
            <div><label className={lbl}>Sanskrit</label><input value={form.sanskrit} onChange={(e) => setForm({ ...form, sanskrit: e.target.value })} className={inp} placeholder="अश्वगन्धा" /></div>
            <div><label className={lbl}>Botanical</label><input value={form.botanical} onChange={(e) => setForm({ ...form, botanical: e.target.value })} className={inp} placeholder="Withania somnifera" /></div>
            <div><label className={lbl}>Part used</label><input value={form.part} onChange={(e) => setForm({ ...form, part: e.target.value })} className={inp} placeholder="Root" /></div>
            <div><label className={lbl}>Rasa (comma-separated)</label><input value={rasaText} onChange={(e) => setRasaText(e.target.value)} className={inp} placeholder="Tikta, Kashaya" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Virya</label>
                <select value={form.virya} onChange={(e) => setForm({ ...form, virya: e.target.value as "Hot" | "Cold" })} className={inp}>
                  <option value="Hot">Hot</option><option value="Cold">Cold</option>
                </select>
              </div>
              <div><label className={lbl}>Vipaka</label><input value={form.vipaka} onChange={(e) => setForm({ ...form, vipaka: e.target.value })} className={inp} placeholder="Madhura" /></div>
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Pacifies</label>
              <div className="flex gap-2">
                {(["vata", "pitta", "kapha"] as Dosha[]).map((d) => (
                  <button key={d} onClick={() => setForm({ ...form, doshas: form.doshas.includes(d) ? form.doshas.filter((x) => x !== d) : [...form.doshas, d] })}
                    className={`flex-1 rounded-lg border py-2 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-all ${form.doshas.includes(d) ? "" : "border-forest-700 text-sand-200/50"}`}
                    style={form.doshas.includes(d) ? { borderColor: DOSHA_META[d].color, color: DOSHA_META[d].color, background: `${DOSHA_META[d].color}14` } : undefined}>{d}</button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2"><label className={lbl}>Benefits (one per line)</label><textarea value={benefitsText} onChange={(e) => setBenefitsText(e.target.value)} rows={3} className={inp} placeholder="Adaptogenic — steadies the stress axis" /></div>
            <div><label className={lbl}>Classical line</label><input value={form.classical} onChange={(e) => setForm({ ...form, classical: e.target.value })} className={inp} /></div>
            <div><label className={lbl}>Caution</label><input value={form.caution} onChange={(e) => setForm({ ...form, caution: e.target.value })} className={inp} /></div>
            <div><label className={lbl}>Symptom tags (comma-separated)</label><input value={treatsText} onChange={(e) => setTreatsText(e.target.value)} className={inp} placeholder="stress, sleep, fatigue" /></div>
            <div>
              <label className={lbl}>Accent</label>
              <div className="flex gap-2 pt-1">
                {ACCENTS.map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, accent: c })} aria-label={`Accent ${c}`}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${form.accent === c ? "scale-110 border-sand-100" : "border-transparent"}`} style={{ background: c }} />
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Image</label>
              <div className="flex flex-wrap items-center gap-3">
                {form.image && <SmartImg src={form.image} alt="" className="h-12 w-16 rounded-lg border border-forest-800 object-cover" />}
                <input value={form.image.startsWith("") ? "(uploaded image)" : form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={`${inp} max-w-[240px]`} placeholder="…or paste an image URL" />
                <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-forest-600 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">
                  <Upload size={12} /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readImageFile(f, (u) => setForm({ ...form, image: u }), (m) => toast(m)); e.target.value = ""; }} />
                </label>
                {form.image && <button onClick={() => setForm({ ...form, image: "" })} className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-sand-200/50 hover:text-ember-300"><Close size={11} /> Clear</button>}
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={save} className="flex items-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300"><Check size={13} /> Save</button>
            <button onClick={() => setEditing(null)} className="rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/60">Discard</button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {herbs.map((h) => (
          <div key={h.id} className="flex items-center gap-3 rounded-xl border border-forest-800 bg-forest-900/60 p-4">
            <SmartImg src={h.image} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-forest-800 object-cover duotone" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-sand-100">{h.common} <span className="font-display text-[12px] italic text-sand-200/40">{h.sanskrit}</span></p>
              <p className="truncate font-mono text-[9px] uppercase tracking-[0.1em] text-sand-200/40">{h.botanical} · {h.virya}</p>
            </div>
            <button onClick={() => startEdit(h)} aria-label={`Edit ${h.common}`} className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Pen size={13} /></button>
            {confirmDelete === h.id ? (
              <button onClick={() => { deleteHerb(h.id); setConfirmDelete(null); toast(`${h.common} removed`); }} className="rounded-full bg-ember-400 px-3 py-1.5 font-mono text-[9px] font-bold uppercase text-forest-950">Sure?</button>
            ) : (
              <button onClick={() => { setConfirmDelete(h.id); window.setTimeout(() => setConfirmDelete((c) => (c === h.id ? null : c)), 3000); }} aria-label={`Delete ${h.common}`} className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200/50 hover:border-ember-400 hover:text-ember-300"><Trash size={13} /></button>
            )}
          </div>
        ))}
      </div>
      <span className="hidden"><ImageIcon size={0} /></span>
    </div>
  );
}
