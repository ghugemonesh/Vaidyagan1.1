import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp, Reveal, SectionHead, Chip, Tilt, SmartImg, DoshaDots } from "./lib";
import { HERBS, DOSHA_META, QUIZ_QUESTIONS, DOSHA_RESULTS, type Dosha, type Herb } from "./data";
import { Close, ArrowRight, ArrowLeft, Wind, Flame, Drop, Check, SealCheck, Book } from "./icons";

/* ---------------------------------- quiz ----------------------------------- */

function Radar({ values }: { values: Record<Dosha, number> }) {
  const cx = 130, cy = 118, R = 86;
  const pts = (scale: number) =>
    (["vata", "pitta", "kapha"] as Dosha[]).map((d, i) => {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
      const r = R * scale * Math.max(0.08, values[d] / 100);
      return `${cx + r * Math.cos(ang)},${cy + r * Math.sin(ang)}`;
    }).join(" ");
  const labelPos = (i: number, extra = 22) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
    return { x: cx + (R + extra) * Math.cos(ang), y: cy + (R + extra) * Math.sin(ang) };
  };
  return (
    <svg viewBox="0 0 260 236" className="w-full max-w-[320px]">
      {[0.33, 0.66, 1].map((s) => (
        <polygon key={s} points={(["vata", "pitta", "kapha"] as Dosha[]).map((_, i) => {
          const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
          return `${cx + R * s * Math.cos(ang)},${cy + R * s * Math.sin(ang)}`;
        }).join(" ")} fill="none" stroke="#20392a" strokeWidth="1" />
      ))}
      {(["vata", "pitta", "kapha"] as Dosha[]).map((_, i) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
        return <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(ang)} y2={cy + R * Math.sin(ang)} stroke="#20392a" strokeWidth="1" />;
      })}
      <motion.polygon initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        points={pts(1)} fill="rgba(214,180,95,0.16)" stroke="#d6b45f" strokeWidth="2" strokeLinejoin="round" />
      {(["vata", "pitta", "kapha"] as Dosha[]).map((d, i) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
        const r = R * Math.max(0.08, values[d] / 100);
        return <circle key={d} cx={cx + r * Math.cos(ang)} cy={cy + r * Math.sin(ang)} r="4" fill={DOSHA_META[d].color} />;
      })}
      {(["vata", "pitta", "kapha"] as Dosha[]).map((d, i) => {
        const p = labelPos(i);
        return (
          <text key={d} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fill={DOSHA_META[d].color} fontSize="11" fontFamily="IBM Plex Mono, monospace" letterSpacing="2">
            {d.toUpperCase()} {Math.round(values[d])}%
          </text>
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

  const totals = useMemo(() => {
    const t: Record<Dosha, number> = { vata: 0, pitta: 0, kapha: 0 };
    answers.forEach((d) => { t[d] += 1; });
    const total = Math.max(1, answers.length);
    return { vata: (t.vata / total) * 100, pitta: (t.pitta / total) * 100, kapha: (t.kapha / total) * 100, raw: t };
  }, [answers]);

  const dominant = useMemo(() => {
    const order = (["vata", "pitta", "kapha"] as Dosha[]).sort((a, b) => totals.raw[b] - totals.raw[a]);
    return order[0];
  }, [totals]);

  const pick = (d: Dosha) => {
    const next = [...answers, d];
    setAnswers(next);
    if (step + 1 >= QUIZ_QUESTIONS.length) { setDone(true); }
    else setStep(step + 1);
  };

  const restart = () => { setAnswers([]); setStep(0); setDone(false); };

  if (done) {
    const r = DOSHA_RESULTS[dominant];
    return (
      <div className="mx-auto max-w-4xl px-5 pb-24 pt-28 lg:pt-36">
        <SectionHead eyebrow="Your prakriti readout" title={<>The balance of your <em className="text-gold-300">three currents</em>.</>} />
        <div className="mt-10 grid gap-8 lg:grid-cols-[340px_1fr]">
          <Reveal className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6 text-center">
            <Radar values={totals} />
            <div className="mt-4 space-y-2.5">
              {(["vata", "pitta", "kapha"] as Dosha[]).map((d) => (
                <div key={d}>
                  <div className="flex justify-between font-mono text-[9.5px] uppercase tracking-[0.18em] text-sand-200/55">
                    <span>{DOSHA_META[d].name} · {DOSHA_META[d].elements}</span><span>{Math.round(totals[d])}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-forest-800">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${totals[d]}%` }} transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full rounded-full" style={{ background: DOSHA_META[d].color }} />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <div className="space-y-6">
            <Reveal delay={100} className="rounded-2xl border p-7" >
              <div className="rounded-2xl border border-gold-500/35 bg-gold-400/6 p-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.26em]" style={{ color: DOSHA_META[dominant].color }}>
                  {DOSHA_META[dominant].sa} · {DOSHA_META[dominant].name} leads
                </p>
                <h3 className="mt-2 font-display text-3xl font-semibold text-sand-100">{r.headline}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-sand-200/75">{r.body}</p>
              </div>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2">
              <Reveal delay={160} className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-kapha-300">Food is medicine</p>
                <ul className="mt-3 space-y-2">
                  {r.diet.map((d, i) => <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-sand-200/70"><Check size={13} className="mt-1 shrink-0 text-gold-400" />{d}</li>)}
                </ul>
              </Reveal>
              <Reveal delay={220} className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-kapha-300">Daily rhythm</p>
                <ul className="mt-3 space-y-2">
                  {r.lifestyle.map((d, i) => <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-sand-200/70"><Check size={13} className="mt-1 shrink-0 text-gold-400" />{d}</li>)}
                </ul>
              </Reveal>
            </div>
            <Reveal delay={280} className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-sand-200/45">Allies from the herb index:</span>
              {r.herbs.map((h) => <span key={h} className="rounded-full border border-moss-500/40 bg-moss-500/10 px-3.5 py-1.5 text-[12.5px] text-moss-300">{h}</span>)}
              <button onClick={() => navigate({ name: "herbs" })} className="ml-auto flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">
                Browse herbs <ArrowRight size={13} />
              </button>
              <button onClick={restart} className="rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/60 hover:text-sand-100">Retake</button>
            </Reveal>
          </div>
        </div>
      </div>
    );
  }

  const q = QUIZ_QUESTIONS[step];
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-28 lg:pt-36">
      <SectionHead eyebrow="Prakriti assessment" title={<>Twelve questions. Three <em className="text-gold-300">currents</em>. One you.</>}
        sub="Answer with your lifelong habit, not this week's mood — prakriti is the constitution you were born with." />
      <div className="mt-8">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/50">
          <span>{q.area}</span><span>{step + 1} / {QUIZ_QUESTIONS.length}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-forest-800">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300"
            animate={{ width: `${((step) / QUIZ_QUESTIONS.length) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 36 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -36 }} transition={{ duration: 0.28 }}>
          <h3 className="mt-8 font-display text-2xl font-semibold leading-snug text-sand-100 sm:text-3xl">{q.q}</h3>
          <div className="mt-7 space-y-3.5">
            {q.options.map((o, i) => {
              const Icon = o.dosha === "vata" ? Wind : o.dosha === "pitta" ? Flame : Drop;
              return (
                <button key={i} onClick={() => pick(o.dosha)}
                  className="group flex w-full items-center gap-4 rounded-xl border border-forest-700 bg-forest-900/60 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-400/70 hover:bg-forest-850 hover:shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors"
                    style={{ borderColor: `${DOSHA_META[o.dosha].color}55`, color: DOSHA_META[o.dosha].color }}>
                    <Icon size={18} />
                  </span>
                  <span className="flex-1 text-[14.5px] leading-relaxed text-sand-200/85 group-hover:text-sand-100">{o.text}</span>
                  <ArrowRight size={16} className="text-sand-200/25 transition-all group-hover:translate-x-1 group-hover:text-gold-300" />
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
      {step > 0 && (
        <button onClick={() => { setAnswers(answers.slice(0, -1)); setStep(step - 1); }}
          className="mt-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-sand-200/50 hover:text-gold-300">
          <ArrowLeft size={13} /> Previous question
        </button>
      )}
    </div>
  );
}

/* --------------------------------- herb index -------------------------------- */

function HerbModal({ herb, onClose }: { herb: Herb; onClose: () => void }) {
  const { articles, navigate } = useApp();
  const related = articles
    .filter((a) => a.symptoms.some((s) => herb.treats.some((t) => s.toLowerCase().includes(t.toLowerCase()))))
    .slice(0, 2);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[65] flex items-end justify-center bg-forest-950/80 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }} onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-forest-700 bg-forest-900 shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:rounded-2xl"
        role="dialog" aria-label={`${herb.common} monograph`}>
        <div className="relative h-44 overflow-hidden">
          <SmartImg src={herb.image} alt={herb.common} className="h-full w-full object-cover duotone" style={herb.duotone ? { filter: herb.duotone } : undefined} />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/40 to-transparent" />
          <button onClick={onClose} aria-label="Close monograph" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-forest-950/70 text-sand-200 backdrop-blur hover:text-gold-300"><Close size={16} /></button>
          <div className="absolute bottom-4 left-6">
            <p className="font-display text-3xl font-semibold text-sand-100">{herb.common}</p>
            <p className="font-mono text-[11px] italic text-sand-200/60">{herb.botanical}</p>
          </div>
          <span className="absolute bottom-3 right-6 font-display text-5xl italic text-sand-100/15">{herb.sanskrit}</span>
        </div>
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([["Rasa", herb.rasa.join(", ")], ["Virya", herb.virya], ["Vipaka", herb.vipaka], ["Part used", herb.part]] as const).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-forest-800 bg-forest-850 p-3.5">
                <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-gold-400/80">{k}</p>
                <p className="mt-1 text-[13px] font-semibold leading-snug text-sand-100">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-sand-200/45">Pacifies</span>
            <DoshaDots doshas={herb.doshas} />
            <span className="text-sm capitalize text-sand-200/70">{herb.doshas.map((d) => DOSHA_META[d].name).join(" · ")}</span>
          </div>
          <h4 className="mt-7 font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Clinical benefits</h4>
          <ul className="mt-3 space-y-2.5">
            {herb.benefits.map((b, i) => (
              <li key={i} className="flex gap-3 text-[14.5px] leading-relaxed text-sand-200/85">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rotate-45" style={{ background: herb.accent }} />{b}
              </li>
            ))}
          </ul>
          {herb.classical && (
            <blockquote className="mt-7 rounded-r-xl border-l-2 border-gold-400 bg-forest-850/80 p-5">
              <p className="font-display text-[15px] italic leading-relaxed text-sand-200/90">{herb.classical}</p>
            </blockquote>
          )}
          {herb.caution && (
            <div className="mt-6 rounded-xl border border-ember-500/30 bg-ember-500/6 p-5">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ember-300">Cautions & contraindications</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-sand-200/75">{herb.caution}</p>
            </div>
          )}
          {related.length > 0 && (
            <div className="mt-8 border-t border-forest-800 pt-6">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Journal essays referencing {herb.common.toLowerCase()}</h4>
              <div className="mt-3 space-y-2">
                {related.map((a) => (
                  <button key={a.id} onClick={() => { onClose(); navigate({ name: "article", id: a.id }); }}
                    className="group flex w-full items-center justify-between gap-3 rounded-lg border border-forest-800 px-4 py-3 text-left transition-colors hover:border-gold-500/50 hover:bg-forest-850">
                    <span className="flex min-w-0 items-center gap-3"><Book size={16} className="shrink-0 text-gold-400" /><span className="truncate text-sm font-semibold text-sand-100">{a.title}</span></span>
                    <ArrowRight size={14} className="shrink-0 text-sand-200/30 transition-transform group-hover:translate-x-1 group-hover:text-gold-300" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Herbs() {
  const { herbs } = useApp();
  const [dosha, setDosha] = useState<Dosha | null>(null);
  const [rasa, setRasa] = useState<string | null>(null);
  const [open, setOpen] = useState<Herb | null>(null);

  const RASA_OPTIONS = ["Madhura", "Tikta", "Kashaya", "Katu"];
  const results = useMemo(
    () => herbs.filter((h) => (!dosha || h.doshas.includes(dosha)) && (!rasa || h.rasa.includes(rasa))),
    [herbs, dosha, rasa]
  );

  return (
    <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[400px]"
        style={{ background: "radial-gradient(50% 85% at 50% 0%, rgba(130,179,158,0.1), transparent 70%)" }} />
      <div className="relative">
        <SectionHead eyebrow="Dravyaguna · the herb index" title={<>Eight monographs, three <em className="text-gold-300">lenses</em> each.</>}
          sub="Every herb read through rasa (taste), virya (potency) and vipaka (post-digestive effect) — the classical pharmacology that decides where an herb actually works." />
        <Reveal delay={140} className="mt-10 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/40">Pacifies</span>
          {(["vata", "pitta", "kapha"] as Dosha[]).map((d) => (
            <Chip key={d} active={dosha === d} color={DOSHA_META[d].color} onClick={() => setDosha(dosha === d ? null : d)}>
              <span className="flex items-center gap-1.5">{d === "vata" ? <Wind size={12} /> : d === "pitta" ? <Flame size={12} /> : <Drop size={12} />}{DOSHA_META[d].name}</span>
            </Chip>
          ))}
          <span className="mx-2 hidden h-5 w-px bg-forest-700 sm:block" />
          <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/40">Rasa</span>
          {RASA_OPTIONS.map((r) => <Chip key={r} active={rasa === r} onClick={() => setRasa(rasa === r ? null : r)}>{r}</Chip>)}
          <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.18em] text-sand-200/40">{results.length} of {herbs.length} herbs</span>
        </Reveal>
        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((h, i) => (
            <Reveal key={h.id} delay={(i % 4) * 90}>
              <Tilt className="h-full">
                <button onClick={() => setOpen(h)}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-forest-800 bg-forest-900 text-left transition-colors duration-300 hover:border-gold-500/60">
                  <div className="tilt-inner relative h-40 overflow-hidden">
                    <SmartImg src={h.image} alt={h.common} className="h-full w-full object-cover duotone transition-transform duration-700 group-hover:scale-110"
                      style={h.duotone ? { filter: h.duotone } : undefined} />
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 to-transparent" />
                    <span className="absolute right-3 top-2 font-display text-4xl italic text-sand-100/20 transition-colors duration-500 group-hover:text-sand-100/40">{h.sanskrit}</span>
                    <span className="absolute bottom-2.5 left-3 flex items-center gap-2"><DoshaDots doshas={h.doshas} /></span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-display text-xl font-semibold leading-tight text-sand-100 transition-colors group-hover:text-gold-300">{h.common}</p>
                    <p className="mt-0.5 font-mono text-[10.5px] italic text-sand-200/45">{h.botanical}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {h.rasa.map((r) => <span key={r} className="rounded-full border border-forest-700 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-sand-200/60">{r}</span>)}
                      <span className="flex items-center gap-1 rounded-full border border-forest-700 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-sand-200/60">
                        {h.virya === "Hot" ? <Flame size={11} className="text-ember-400" /> : <Drop size={11} className="text-steel-400" />} {h.virya}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-[13px] leading-snug text-sand-200/60">{h.benefits[0]}.</p>
                    <span className="mt-auto flex items-center gap-2 pt-4 font-mono text-[9.5px] uppercase tracking-[0.18em] text-gold-400 opacity-70 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                      Open monograph <ArrowRight size={13} />
                    </span>
                  </div>
                </button>
              </Tilt>
            </Reveal>
          ))}
        </div>
        {results.length === 0 && (
          <Reveal className="mt-10 rounded-xl border border-dashed border-forest-700 p-14 text-center">
            <p className="font-display text-2xl text-sand-200/80">No herb carries that exact combination.</p>
            <button onClick={() => { setDosha(null); setRasa(null); }} className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-gold-400 hover:text-gold-300">Clear filters</button>
          </Reveal>
        )}
      </div>
      <span className="hidden"><SealCheck size={0} /></span>
      <AnimatePresence>{open && <HerbModal herb={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}
