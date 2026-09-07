import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp, Reveal, SectionHead, Chip, SmartImg, Tilt } from "./lib";
import { DOSHA_META, DOSHA_RESULTS, QUIZ_QUESTIONS, HERBS, type Dosha, type Herb } from "./data";
import { ArrowLeft, ArrowRight, RotateCcw, Check, Flame, Wind, Droplets, type LucideIcon } from "lucide-react";

const DOSHA_ICON: Record<Dosha, LucideIcon> = { vata: Wind, pitta: Flame, kapha: Droplets };

function RadarChart({ scores }: { scores: Record<Dosha, number> }) {
  const order: Dosha[] = ["vata", "pitta", "kapha"];
  const cx = 150, cy = 140, R = 100;
  const angle = (i: number) => (Math.PI * 2 * i) / 3 - Math.PI / 2;
  const pt = (i: number, r: number) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r] as const;
  const poly = order.map((d, i) => pt(i, (scores[d] / 100) * R).join(",")).join(" ");
  return (
    <svg viewBox="0 0 300 280" className="mx-auto w-full max-w-sm">
      {[0.33, 0.66, 1].map((f) => (
        <polygon key={f} points={order.map((_, i) => pt(i, R * f).join(",")).join(" ")} fill="none" stroke="rgba(214,180,95,0.18)" strokeWidth="1" />
      ))}
      {order.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(214,180,95,0.18)" strokeWidth="1" />; })}
      <motion.polygon initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} points={poly} fill="rgba(214,180,95,0.22)" stroke="#d6b45f" strokeWidth="2" strokeLinejoin="round" />
      {order.map((d, i) => {
        const [x, y] = pt(i, (scores[d] / 100) * R);
        const [lx, ly] = pt(i, R + 22);
        const Icon = DOSHA_ICON[d];
        return (
          <g key={d}>
            <circle cx={x} cy={y} r="4.5" fill={DOSHA_META[d].color} />
            <text x={lx} y={ly + 4} textAnchor="middle" fontSize="11" fontFamily="IBM Plex Mono, monospace" fill={DOSHA_META[d].color}>{DOSHA_META[d].name}</text>
            <text x={lx} y={ly + 18} textAnchor="middle" fontSize="10" fontFamily="IBM Plex Mono, monospace" fill="rgba(231,220,191,0.5)">{Math.round(scores[d])}%</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Quiz() {
  const { navigate } = useApp();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Dosha[]>([]);
  const [done, setDone] = useState(false);

  const scores = useMemo(() => {
    const base: Record<Dosha, number> = { vata: 8, pitta: 8, kapha: 8 };
    answers.forEach((d) => { base[d] += 84 / Math.max(1, answers.filter((x) => x === d).length === 0 ? 1 : 1) / answers.filter((x) => x === d).length; });
    return base;
  }, [answers]);

  const pick = (d: Dosha) => {
    const next = [...answers, d];
    setAnswers(next);
    if (step + 1 >= QUIZ_QUESTIONS.length) setDone(true);
    else setStep(step + 1);
  };

  const restart = () => { setStep(0); setAnswers([]); setDone(false); };

  const result = useMemo(() => {
    const order: Dosha[] = ["vata", "pitta", "kapha"];
    const dom = order.reduce((a, b) => (scores[a] >= scores[b] ? a : b));
    return DOSHA_RESULTS[dom];
  }, [scores]);

  if (done) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
        <SectionHead eyebrow="Your prakriti" title={<>{result.headline.split(" ")[0]} leads your <em className="text-gold-300">constitution</em>.</>}
          sub={result.body} />
        <Reveal delay={120} className="mt-10 rounded-2xl border border-forest-800 bg-forest-900/60 p-6">
          <RadarChart scores={scores} />
        </Reveal>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {([["Diet", result.diet], ["Lifestyle", result.lifestyle], ["Herbs to know", result.herbs]] as const).map(([title, items], i) => (
            <Reveal key={title} delay={i * 100} className="rounded-2xl border border-forest-800 bg-forest-900/60 p-5">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">{title}</p>
              <ul className="mt-3 space-y-2">
                {items.map((x) => <li key={x} className="flex gap-2 text-[12.5px] leading-relaxed text-sand-200/70"><Check size={13} className="mt-0.5 shrink-0 text-kapha-400" />{x}</li>)}
              </ul>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={restart} className="flex items-center gap-2 rounded-full border border-forest-700 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-sand-200/70 hover:border-gold-400 hover:text-gold-300"><RotateCcw size={14} /> Retake quiz</button>
          <button onClick={() => navigate({ name: "herbs" })} className="gold-sheen rounded-full bg-gold-400 px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Explore the herb index <ArrowRight size={14} className="ml-1 inline" /></button>
        </div>
      </div>
    );
  }

  const q = QUIZ_QUESTIONS[step];

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <SectionHead eyebrow="Prakriti assessment" title={<>Which dosha <em className="text-gold-300">leads</em> you?</>}
        sub="Twelve short questions. Answer with your lifelong default, not this week." />
      <div className="mt-8">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/45">
          <span>{q.area} · Question {step + 1} of {QUIZ_QUESTIONS.length}</span>
          <span>{Math.round((step / QUIZ_QUESTIONS.length) * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-forest-800">
          <div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all" style={{ width: `${(step / QUIZ_QUESTIONS.length) * 100}%` }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
            <p className="mt-8 font-display text-2xl font-semibold text-sand-100">{q.q}</p>
            <div className="mt-6 space-y-3">
              {q.options.map((o) => (
                <button key={o.text} onClick={() => pick(o.dosha)}
                  className="card-lift block w-full rounded-xl border border-forest-800 bg-forest-900/60 px-5 py-4 text-left text-[14.5px] text-sand-200/80 transition-all hover:border-gold-500/60 hover:text-sand-100">
                  {o.text}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        {step > 0 && (
          <button onClick={() => { setStep(step - 1); setAnswers(answers.slice(0, -1)); }} className="mt-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-sand-200/50 hover:text-gold-300"><ArrowLeft size={14} /> Previous</button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- herbs ----------------------------------- */

export function Herbs() {
  const { herbs } = useApp();
  const [dosha, setDosha] = useState<Dosha | null>(null);
  const [rasa, setRasa] = useState<string | null>(null);
  const [open, setOpen] = useState<Herb | null>(null);

  const allRasa = useMemo(() => Array.from(new Set(herbs.flatMap((h) => h.rasa))), [herbs]);
  const results = herbs.filter((h) => (!dosha || h.doshas.includes(dosha)) && (!rasa || h.rasa.includes(rasa)));

  return (
    <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px]" style={{ background: "radial-gradient(55% 90% at 50% 0%, rgba(130,179,158,0.09), transparent 70%)" }} />
      <SectionHead eyebrow="Dravyaguna · the herb index" title={<>Eight monographs, three <em className="text-gold-300">lenses</em> each.</>}
        sub="Every herb read through rasa (taste), virya (potency) and vipaka (post-digestive effect) — the classical pharmacology that decides where an herb works." />
      <Reveal delay={120} className="relative mt-8 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/40">Pacifies</span>
        {(["vata", "pitta", "kapha"] as Dosha[]).map((d) => <Chip key={d} active={dosha === d} color={DOSHA_META[d].color} onClick={() => setDosha(dosha === d ? null : d)}>{d}</Chip>)}
        <span className="mx-1 hidden h-5 w-px bg-forest-700 sm:block" />
        <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/40">Rasa</span>
        {allRasa.slice(0, 6).map((r) => <Chip key={r} active={rasa === r} onClick={() => setRasa(rasa === r ? null : r)}>{r}</Chip>)}
      </Reveal>
      <div className="relative mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
        {results.map((h, i) => (
          <Reveal key={h.id} delay={(i % 4) * 80}>
            <Tilt className="h-full">
              <button onClick={() => setOpen(h)} className="card-lift group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-forest-800 bg-forest-900/60 text-left hover:border-gold-500/50">
                <div className="tilt-inner relative h-36 overflow-hidden">
                  <SmartImg src={h.image} alt={h.common} className="h-full w-full object-cover duotone transition-transform duration-700 group-hover:scale-105" style={h.duotone ? { filter: h.duotone } : undefined} />
                  <span className="absolute inset-0 bg-gradient-to-t from-forest-950/80 to-transparent" />
                  <span className="absolute bottom-3 left-3 font-display text-2xl italic" style={{ color: h.accent }}>{h.sanskrit}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-display text-lg font-semibold text-sand-100 transition-colors group-hover:text-gold-300">{h.common}</p>
                  <p className="font-mono text-[9px] italic uppercase tracking-[0.08em] text-sand-200/40">{h.botanical}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {h.rasa.map((r) => <span key={r} className="rounded-full border border-forest-700 px-2 py-0.5 font-mono text-[8px] uppercase text-sand-200/55">{r}</span>)}
                    <span className="rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase" style={{ borderColor: `${h.accent}55`, color: h.accent }}>{h.virya}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-sand-200/55">{h.benefits[0]}</p>
                  <span className="mt-auto flex items-center gap-1.5 pt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-gold-400/80 group-hover:text-gold-300">Open monograph <ArrowRight size={12} /></span>
                </div>
              </button>
            </Tilt>
          </Reveal>
        ))}
      </div>
      {results.length === 0 && (
        <Reveal className="relative mt-10 rounded-xl border border-dashed border-forest-700 p-14 text-center">
          <p className="font-display text-2xl text-sand-200/80">No herb carries that combination.</p>
          <button onClick={() => { setDosha(null); setRasa(null); }} className="mt-5 rounded-full border border-gold-500/50 px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">Clear filters</button>
        </Reveal>
      )}

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] grid place-items-center bg-forest-950/80 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }} onClick={(e) => e.stopPropagation()}
              className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-forest-700 bg-forest-900" role="dialog" aria-label={`${open.common} monograph`}>
              <div className="relative h-44 overflow-hidden rounded-t-2xl">
                <SmartImg src={open.image} alt={open.common} className="h-full w-full object-cover duotone" style={open.duotone ? { filter: open.duotone } : undefined} />
                <span className="absolute inset-0 bg-gradient-to-t from-forest-900 to-transparent" />
                <span className="absolute bottom-4 left-6 font-display text-3xl italic" style={{ color: open.accent }}>{open.sanskrit}</span>
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-2xl font-semibold text-sand-100">{open.common}</p>
                    <p className="font-mono text-[10px] italic uppercase tracking-[0.1em] text-sand-200/45">{open.botanical} · {open.part}</p>
                  </div>
                  <span className="rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em]" style={{ borderColor: `${open.accent}55`, color: open.accent }}>{open.virya} virya</span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {([["Rasa", open.rasa.join(", ")], ["Virya", open.virya], ["Vipaka", open.vipaka]] as const).map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-forest-800 bg-forest-850/60 p-3"><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-gold-400/80">{k}</p><p className="mt-1 text-[12.5px] font-semibold text-sand-100">{v}</p></div>
                  ))}
                </div>
                <p className="mt-5 font-display text-base italic leading-relaxed text-sand-200/85">"{open.classical}"</p>
                <div className="mt-5">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">Clinical benefits</p>
                  <ul className="mt-2.5 space-y-2">
                    {open.benefits.map((b) => <li key={b} className="flex gap-2.5 text-[13.5px] leading-relaxed text-sand-200/75"><span className="mt-[8px] h-1.5 w-1.5 shrink-0 rotate-45" style={{ background: open.accent }} />{b}</li>)}
                  </ul>
                </div>
                <div className="mt-5 rounded-xl border border-ember-500/30 bg-ember-500/5 p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ember-300">Cautions</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-sand-200/65">{open.caution}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {open.doshas.map((d) => <span key={d} className="rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em]" style={{ borderColor: `${DOSHA_META[d].color}55`, color: DOSHA_META[d].color }}>Pacifies {d}</span>)}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
