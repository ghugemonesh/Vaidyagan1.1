import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, Instagram, Check } from "lucide-react";
import { useApp, Reveal, SectionHead } from "./lib";

export function Contact() {
  const { toast } = useApp();
  const [form, setForm] = useState({ name: "", email: "", subject: "General enquiry", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) { toast("Please fill your name, email and message"); return; }
    setSending(true);
    try {
      const res = await fetch("https://formsubmit.co/ajax/vaidyagan@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...form, _subject: `[Vaidyagan] ${form.subject}`, _template: "table" }),
      });
      if (!res.ok) throw new Error("send failed");
      setSent(true);
      toast("Message sent — the desk replies within one working day");
    } catch {
      /* fall back to the visitor's mail client so nothing is lost */
      const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
      window.location.href = `mailto:vaidyagan@gmail.com?subject=${encodeURIComponent(form.subject)}&body=${body}`;
      toast("Opening your email app to finish sending");
    } finally {
      setSending(false);
    }
  };

  const input = "w-full rounded-xl border border-forest-700 bg-forest-900/80 px-4 py-3 text-[14.5px] text-sand-100 placeholder:text-sand-200/35 transition-all focus:border-gold-400 focus:outline-none focus:shadow-[0_0_24px_rgba(214,180,95,0.1)]";

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <SectionHead eyebrow="Write to the desk" title={<>A vaidya reads <em className="text-gold-300">every message</em>.</>}
        sub="Questions about a formulation, an order, or your prakriti — send them over. We reply within one working day." />

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Reveal>
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-kapha-500/40 bg-kapha-500/6 p-12 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-kapha-400 bg-kapha-500/15 text-kapha-300"><Check size={28} /></span>
              <p className="mt-5 font-display text-2xl font-semibold text-sand-100">Message received</p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-sand-200/60">Thank you, {form.name.split(" ")[0] || "friend"} — the desk will write back within one working day.</p>
              <button onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "General enquiry", message: "" }); }} className="mt-6 rounded-full border border-gold-500/50 px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">Send another</button>
            </div>
          ) : (
            <form onSubmit={submit} className="rounded-2xl border border-forest-800 bg-forest-900/60 p-7 sm:p-9">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Your name *</label>
                  <input id="c-name" value={form.name} onChange={set("name")} placeholder="Dr. …" className={input} />
                </div>
                <div>
                  <label htmlFor="c-email" className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Email *</label>
                  <input id="c-email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className={input} />
                </div>
              </div>
              <div className="mt-5">
                <label htmlFor="c-subject" className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Topic</label>
                <select id="c-subject" value={form.subject} onChange={set("subject")} className={input}>
                  <option>General enquiry</option><option>Order help</option><option>Formulation question</option><option>Consultation</option><option>Partnership</option>
                </select>
              </div>
              <div className="mt-5">
                <label htmlFor="c-message" className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Message *</label>
                <textarea id="c-message" value={form.message} onChange={set("message")} rows={6} placeholder="How can the desk help?" className={input} />
              </div>
              <button type="submit" disabled={sending} className="gold-sheen mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 disabled:opacity-60">
                {sending ? <><span className="animate-spin-fast inline-block h-4 w-4 rounded-full border-2 border-forest-950 border-t-transparent" /> Sending…</> : <><Send size={15} /> Send message</>}
              </button>
              <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/35">Delivered to vaidyagan@gmail.com</p>
            </form>
          )}
        </Reveal>

        <div className="space-y-5">
          <Reveal delay={100}>
            <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Reach us directly</p>
              <div className="mt-4 space-y-3.5">
                <a href="mailto:vaidyagan@gmail.com" className="flex items-center gap-3 text-[13.5px] text-sand-200/75 transition-colors hover:text-gold-300"><Mail size={16} className="text-gold-400/70" /> vaidyagan@gmail.com</a>
                <a href="tel:+917768856093" className="flex items-center gap-3 text-[13.5px] text-sand-200/75 transition-colors hover:text-gold-300"><Phone size={16} className="text-gold-400/70" /> +91 77688 56093</a>
                <p className="flex items-center gap-3 text-[13.5px] text-sand-200/75"><MapPin size={16} className="text-gold-400/70" /> Kothrud, Pune, Maharashtra</p>
                <a href="https://instagram.com/vaidyagan" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[13.5px] text-sand-200/75 transition-colors hover:text-gold-300"><Instagram size={16} className="text-gold-400/70" /> @vaidyagan</a>
              </div>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="rounded-2xl border border-gold-500/30 bg-gold-400/5 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Desk hours</p>
              <p className="mt-3 text-[13.5px] leading-relaxed text-sand-200/70">Monday – Saturday<br />10:00 – 19:00 IST</p>
              <p className="mt-3 border-t border-gold-500/20 pt-3 text-[12px] leading-relaxed text-sand-200/50">For urgent medical concerns, please see a registered practitioner in person — this desk is not an emergency service.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
