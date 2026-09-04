import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal, SectionHead, useApp } from "./lib";
import { getConsoleSettings } from "./console/db";
import { Check, Leaf, Send, Instagram, Mail, Clock } from "./icons";

/* Single public inbox. The form POSTs here (FormSubmit); if that ever fails we
   open the visitor's mail client pre-addressed, so nothing is silently lost. */
const DEFAULT_EMAIL = "vaidyagan@gmail.com";

const input =
  "w-full rounded-xl border border-forest-700 bg-forest-950/60 px-4 py-3 text-[14.5px] text-sand-100 placeholder:text-sand-200/30 transition-colors focus:border-gold-400 focus:outline-none";
const label = "mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80";

export function Contact() {
  const { toast } = useApp();
  const email = (() => { try { return getConsoleSettings().contactEmail || DEFAULT_EMAIL; } catch { return DEFAULT_EMAIL; } })();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const mailtoHref = () => {
    const body = [`Name: ${form.name}`, `Email: ${form.email}`, `Phone: ${form.phone}`, "", form.message].join("\n");
    return `mailto:${email}?subject=${encodeURIComponent(form.subject || "Enquiry — Vaidyagan")}&body=${encodeURIComponent(body)}`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast("Please fill your name, email and message");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone, subject: form.subject, message: form.message,
          _subject: `[Vaidyagan] ${form.subject || "New enquiry"}`, _template: "table",
        }),
      });
      if (!res.ok) throw new Error("send failed");
      setSent(true);
      toast("Message sent — the desk replies within one working day");
    } catch {
      window.location.href = mailtoHref();
      toast("Opening your email app to finish sending");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{ background: "radial-gradient(55% 90% at 50% 0%, rgba(214,180,95,0.08), transparent 70%)" }} />
      <SectionHead eyebrow="Write to the desk" title={<>A vaidya reads <em className="text-gold-300">every message</em>.</>}
        sub="Questions about a formulation, an order, or your prakriti — send them over. We reply within one working day." />

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <div className="rounded-3xl border border-forest-800 bg-forest-900/70 p-7 sm:p-9">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-10 text-center">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-kapha-400 bg-kapha-500/15 text-kapha-300"><Check size={28} /></span>
                  <p className="mt-5 font-display text-2xl font-semibold text-sand-100">Message received</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-sand-200/60">Thank you, {form.name.split(" ")[0] || "friend"} — the desk will write back to {form.email} within one working day.</p>
                  <button onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}
                    className="mt-6 rounded-full border border-gold-500/50 px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">
                    Send another
                  </button>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={submit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className={label} htmlFor="c-name">Your name *</label><input id="c-name" value={form.name} onChange={set("name")} placeholder="Dr. …" className={input} /></div>
                    <div><label className={label} htmlFor="c-email">Email *</label><input id="c-email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className={input} /></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className={label} htmlFor="c-phone">Phone (optional)</label><input id="c-phone" value={form.phone} onChange={set("phone")} placeholder="+91 …" className={input} /></div>
                    <div>
                      <label className={label} htmlFor="c-subject">Topic</label>
                      <select id="c-subject" value={form.subject} onChange={set("subject")} className={input}>
                        <option value="">General enquiry</option>
                        <option value="Order help">Order help</option>
                        <option value="Formulation question">Formulation question</option>
                        <option value="Consultation">Consultation</option>
                        <option value="Partnership">Partnership</option>
                      </select>
                    </div>
                  </div>
                  <div><label className={label} htmlFor="c-message">Message *</label><textarea id="c-message" value={form.message} onChange={set("message")} rows={5} placeholder="How can the desk help?" className={input} /></div>
                  <button type="submit" disabled={sending}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 disabled:opacity-60">
                    {sending ? (<><span className="animate-spin-fast inline-block h-4 w-4 rounded-full border-2 border-forest-950 border-t-transparent" /> Sending…</>) : (<><Send size={15} /> Send message</>)}
                  </button>
                  <p className="text-center font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/35">Delivered to {email}</p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        <div className="space-y-4">
          <Reveal delay={80}>
            <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
              <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400"><Mail size={15} /> Email</p>
              <a href={`mailto:${email}`} className="mt-2 block break-all font-display text-2xl font-semibold text-sand-100 transition-colors hover:text-gold-300">{email}</a>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
              <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400"><Clock size={15} /> Desk hours</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-sand-200/70">Monday – Saturday<br />10:00 – 19:00 IST</p>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
              <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400"><Instagram size={15} /> Community</p>
              <a href="https://instagram.com/vaidyagan" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 font-display text-xl font-semibold text-sand-100 transition-colors hover:text-gold-300">@vaidyagan</a>
              <p className="mt-1 text-[12.5px] text-sand-200/55">Daily shlokas, OPD stories and myth-busting.</p>
            </div>
          </Reveal>
        </div>
      </div>
      <span className="hidden"><Leaf size={0} /></span>
    </div>
  );
}
