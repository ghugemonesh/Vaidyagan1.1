import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowLeft, RotateCcw, Check } from "lucide-react";
import { useApp, Reveal, SectionHead, Tilt, SmartImg, Chip, Monogram } from "./lib";
import { DOSHA_META, QUIZ_QUESTIONS, DOSHA_RESULTS, HERBS, type Dosha, type Herb } from "./data";

/* ------------------------------ dosha radar chart ----------------------------- */

function Radar({ scores }: { scores: Record<Dosha, number> }) {
  const size = 300, cx = size / 2, cy = size / 2, r = 110;
  const doshas: Dosha[] = ["vata", "pitta", "kapha"];
  const angle = (i: number) => (Math.PI * 2 * i) / 3 - Math.PI / 2;
  const pt = (i: number, frac: number) => [cx + Math.cos(angle(i)) * r * frac, cy + Math.sin(angle(i)) * r * frac] as const;

  const poly = doshas.map((d, i) => pt(i, Math.max(0.06, scores[d] / 100)).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[320px]">
      {[0.33, 0.66, 1].map((f) => (
        <polygon key={f} points={doshas.map((_, i) => pt(i, f).join(",")).join(" ")} fill="none" stroke="#20392a" strokeWidth="1" />
      ))}
      {doshas.map((d, i) => {
        const [x, y] = pt(i, 1);
        const [lx, ly] = pt(i, 1.22);
        return (
          <g key={d}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#20392a" strokeWidth="1" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill={DOSHA_META[d].color} fontSize="13" fontFamily="IBM Plex Mono, monospace" letterSpacing="1">
              {DOSHA_META[d].name}
            </text>
            <text x={lx} y={ly + 16} textAnchor="middle" fill={DOSHA_META[d].color} fontSize="15" fontWeight="600" fontFamily="Fraunces, serif">
              {scores[d]}%
            </text>
          </g>
        );
      })}
      <motion.polygon points={poly} fill="rgba(214,180,95,0.18)" stroke="#d6b45f" strokeWidth="2" strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: "easeOut" }} style={{ transformOrigin: "center" }} />
      {doshas.map((d, i) => {
        const [x, y] = pt(i, Math.max(0.06, scores[d] / 100));
        return <motion.circle key={d} cx={x} cy={y} r="5" fill={DOSHA_META[d].color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.12 }} />;
      })}
    </svg>
  );
}

/* ---------------------------------- quiz ------------------------------------- */

export function Quiz() {
  const { navigate } = useApp();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Dosha[]>([]);
  const [done, setDone] = useState(false);

  const scores = useMemo(() => {
    const base: Record<Dosha, number> = { vata: 0, pitta: 0, kapha: 0 };
    answers.forEach((a) => { base[a] += 1; });
    const total = answers.length || 1;
    return { vata: Math.round((base.vata / total) * 100), pitta: Math.round((base.pitta / total) * 100), kapha: Math.round((base.kapha / total) * 100) };
  }, [answers]);

  const dominant = useMemo(() => (Object.entries(scores) as [Dosha, number][]).sort((a, b) => b[1] - a[1])[0][0], [scores]);
  const q = QUIZ_QUESTIONS[step];

  const pick = (d: Dosha) => {
    const next = [...answers, d];
    setAnswers(next);
    if (step < QUIZ_QUESTIONS.length - 1) setStep(step + 1);
    else setDone(true);
  };

  const restart = () => { setStep(0); setAnswers([]); setDone(false); };

  if (done) {
    const res = DOSHA_RESULTS[dominant];
    return (
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
        <SectionHead eyebrow="Your prakriti readout" title={<>{res.headline.split(" ")[0]} <em className="text-gold-300">{res.headline.split(" ").slice(1).join(" ")}</em></>} sub={res.body} />
        <Reveal delay={120} className="mt-10"><Radar scores={scores} /></Reveal>
        <Reveal delay={200} className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-forest-800 bg-forest-900/70 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">On your plate</p>
            <ul className="mt-4 space-y-2.5">{res.diet.map((d) => <li key={d} className="flex gap-3 text-[13.5px] leading-relaxed text-sand-200/75"><span className="mt-[8px] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold-400" />{d}</li>)}</ul>
          </div>
          <div className="rounded-xl border border-forest-800 bg-forest-900/70 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">In your routine</p>
            <ul className="mt-4 space-y-2.5">{res.lifestyle.map((d) => <li key={d} className="flex gap-3 text-[13.5px] leading-relaxed text-sand-200/75"><span className="mt-[8px] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold-400" />{d}</li>)}</ul>
          </div>
        </Reveal>
        <Reveal delay={280} className="mt-6 rounded-xl border border-kapha-500/30 bg-kapha-500/5 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-kapha-300">Herbs your vaidyas reach for</p>
          <div className="mt-3 flex flex-wrap gap-2">{res.herbs.map((h) => <span key={h} className="rounded-full border border-kapha-500/40 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-kapha-300">{h}</span>)}</div>
        </Reveal>
        <Reveal delay={340} className="mt-10 flex flex-wrap gap-3">
          <button onClick={restart} className="flex items-center gap-2 rounded-full border border-forest-700 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-sand-200/70 hover:border-gold-400 hover:text-gold-300"><RotateCcw size={14} /> Retake the quiz</button>
          <button onClick={() => navigate({ name: "herbs" })} className="gold-sheen group flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Explore the herb index <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></button>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <SectionHead eyebrow="Prakriti assessment" title={<>Twelve questions. <em className="text-gold-300">One constitution.</em></>}
        sub="Answer with your lifelong default — not how you've been this week. Your prakriti is the blueprint you were born with." />

      {/* progress */}
      <div className="mt-10">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/50">
          <span>{q.area}</span><span>{step + 1} / {QUIZ_QUESTIONS.length}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-forest-800">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300" animate={{ width: `${((step + 1) / QUIZ_QUESTIONS.length) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
          <p className="mt-10 font-display text-2xl font-semibold leading-snug text-sand-100 sm:text-3xl">{q.q}</p>
          <div className="mt-7 space-y-3">
            {q.options.map((o, i) => (
              <motion.button key={o.text} onClick={() => pick(o.dosha)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
                className="card-lift group flex w-full items-center justify-between gap-4 rounded-xl border border-forest-700 bg-forest-900/70 px-5 py-4 text-left transition-all hover:border-gold-400 hover:bg-forest-850">
                <span className="text-[14.5px] leading-relaxed text-sand-200/85 group-hover:text-sand-100">{o.text}</span>
                <ArrowRight size={16} className="shrink-0 text-sand-200/30 transition-all group-hover:translate-x-1 group-hover:text-gold-300" />
              </motion.button>
            ))}
          </div>
          {step > 0 && (
            <button onClick={() => { setAnswers(answers.slice(0, -1)); setStep(step - 1); }} className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-sand-200/45 hover:text-gold-300"><ArrowLeft size={13} /> Previous</button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------- herb index --------------------------------- */

function HerbCard({ herb, delay, onOpen }: { herb: Herb; delay: number; onOpen: () => void }) {
  const viryaIcon = herb.virya === "Hot" ? "🔥" : "❄";
  return (
    <Reveal delay={delay}>
      <Tilt className="h-full">
        <button onClick={onOpen} className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-900 text-left transition-colors duration-300 hover:border-gold-500/60">
          <div className="tilt-inner relative h-40 overflow-hidden">
            <SmartImg src={herb.image} alt={herb.common} className="h-full w-full object-cover duotone transition-transform duration-700 group-hover:scale-110" style={herb.duotone ? { filter: herb.duotone } : undefined} />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 to-transparent" />
            <span className="absolute right-3 top-2 font-display text-4xl italic text-sand-100/20 transition-colors duration-500 group-hover:text-sand-100/40">{herb.sanskrit}</span>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <p className="font-display text-xl font-semibold leading-tight text-sand-100 transition-colors group-hover:text-gold-300">{herb.common}</p>
            <p className="mt-0.5 font-mono text-[10.5px] italic text-sand-200/45">{herb.botanical}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {herb.rasa.slice(0, 3).map((r) => <span key={r} className="rounded-full border border-forest-700 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-sand-200/60">{r}</span>)}
              <span className="rounded-full border border-forest-700 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-sand-200/60">{viryaIcon} {herb.virya}</span>
            </div>
            <p className="mt-3 line-clamp-2 text-[13px] leading-snug text-sand-200/60">{herb.benefits[0]}.</p>
            <span className="mt-auto flex items-center gap-2 pt-4 font-mono text-[9.5px] uppercase tracking-[0.18em] text-gold-400 opacity-70 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">Open monograph <ArrowRight size={13} /></span>
          </div>
        </button>
      </Tilt>
    </Reveal>
  );
}

export function Herbs() {
  const { herbs } = useApp();
  const [dosha, setDosha] = useState<Dosha | null>(null);
  const [rasa, setRasa] = useState<string | null>(null);
  const [open, setOpen] = useState<Herb | null>(null);

  const results = useMemo(() => herbs.filter((h) => (!dosha || h.doshas.includes(dosha)) && (!rasa || h.rasa.includes(rasa))), [herbs, dosha, rasa]);
  const RASA_OPTIONS = ["Madhura", "Tikta", "Kashaya", "Katu"];

  return (
    <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[400px]" style={{ background: "radial-gradient(50% 85% at 50% 0%, rgba(130,179,158,0.09), transparent 70%)" }} />
      <div className="relative">
        <SectionHead eyebrow="Dravyaguna · the herb index" title={<>Eight monographs, three <em className="text-gold-300">lenses</em> each.</>}
          sub="Every herb read through rasa (taste), virya (potency) and vipaka (post-digestive effect) — the classical pharmacology that decides where an herb actually works." />

        <Reveal delay={140} className="mt-10 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/40">Pacifies</span>
          {(["vata", "pitta", "kapha"] as Dosha[]).map((d) => <Chip key={d} active={dosha === d} color={DOSHA_META[d].color} onClick={() => setDosha(dosha === d ? null : d)}>{DOSHA_META[d].name}</Chip>)}
          <span className="mx-2 hidden h-5 w-px bg-forest-700 sm:block" />
          <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/40">Rasa</span>
          {RASA_OPTIONS.map((r) => <Chip key={r} active={rasa === r} onClick={() => setRasa(rasa === r ? null : r)}>{r}</Chip>)}
          <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.18em] text-sand-200/40">{results.length} of {herbs.length} herbs</span>
        </Reveal>

        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((h, i) => <HerbCard key={h.id} herb={h} delay={(i % 4) * 90} onOpen={() => setOpen(h)} />)}
        </div>
        {results.length === 0 && (
          <Reveal className="mt-10 rounded-xl border border-dashed border-forest-700 p-14 text-center">
            <p className="font-display text-2xl text-sand-200/80">No herb carries that exact combination.</p>
            <button onClick={() => { setDosha(null); setRasa(null); }} className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-gold-400 hover:text-gold-300">Clear filters</button>
          </Reveal>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[65] flex items-end justify-center bg-forest-950/80 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setOpen(null)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${open.common} monograph`}
              className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-forest-700 bg-forest-900 shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:rounded-2xl">
              <div className="relative h-44 overflow-hidden">
                <SmartImg src={open.image} alt={open.common} className="h-full w-full object-cover duotone" style={open.duotone ? { filter: open.duotone } : undefined} />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/40 to-transparent" />
                <button onClick={() => setOpen(null)} aria-label="Close monograph" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-forest-950/70 text-sand-200 backdrop-blur hover:text-gold-300"><ArrowLeft size={0} className="hidden" /><span className="font-display text-xl leading-none">×</span></button>
                <div className="absolute bottom-4 left-6">
                  <p className="font-display text-3xl font-semibold text-sand-100">{open.common}</p>
                  <p className="font-mono text-[11px] italic text-sand-200/60">{open.botanical}</p>
                </div>
                <span className="absolute bottom-3 right-6 font-display text-5xl italic text-sand-100/15">{open.sanskrit}</span>
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {([["Rasa (taste)", open.rasa.join(", ")], ["Virya (potency)", open.virya], ["Vipaka (post-digestive)", open.vipaka], ["Part used", open.part]] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-forest-800 bg-forest-850 p-3.5">
                      <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-gold-400/80">{k}</p>
                      <p className="mt-1 text-[13px] font-semibold leading-snug text-sand-100">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-sand-200/45">Pacifies</span>
                  <span className="flex gap-1.5">{open.doshas.map((d) => <span key={d} className="h-2.5 w-2.5 rounded-full" style={{ background: DOSHA_META[d].color }} title={d} />)}</span>
                  <span className="text-sm capitalize text-sand-200/70">{open.doshas.map((d) => DOSHA_META[d].name).join(" · ")}</span>
                </div>
                <h4 className="mt-7 font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Clinical benefits</h4>
                <ul className="mt-3 space-y-2.5">
                  {open.benefits.map((b, i) => (
                    <li key={i} className="flex gap-3 text-[14.5px] leading-relaxed text-sand-200/85"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rotate-45" style={{ background: open.accent }} />{b}</li>
                  ))}
                </ul>
                <blockquote className="mt-7 rounded-r-xl border-l-2 border-gold-400 bg-forest-850/80 p-5">
                  <p className="font-display text-[15px] italic leading-relaxed text-sand-200/90">{open.classical}</p>
                </blockquote>
                <div className="mt-6 rounded-xl border border-ember-500/30 bg-ember-500/6 p-5">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ember-300">Cautions & contraindications</p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-sand-200/75">{open.caution}</p>
                </div>
                <div className="mt-6 border-t border-forest-800 pt-5">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-sand-200/45">Classical symptom tags</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">{open.treats.map((t) => <span key={t} className="rounded-full border border-forest-700 px-3 py-1 font-mono text-[9.5px] uppercase tracking-[0.12em] capitalize text-sand-200/60">{t}</span>)}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
