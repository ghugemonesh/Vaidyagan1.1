import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Upload, Check, Plus, Trash2, Mail, Globe, Youtube, Instagram, Linkedin, HelpCircle } from "lucide-react";
import { useApp, readImageFile, type StudioUser } from "./lib";

/* =============================================================================
   Doctor profile & practice management — a "My Profile" tab in the Studio.
   Each member has a profile doc; the `listed` + `available` switches control
   whether they appear on the public site (home + footer).
   ========================================================================== */

export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export interface TimeSlot { from: string; to: string }
export interface DaySchedule { enabled: boolean; slots: TimeSlot[] }
export interface Degree { id: string; degree: string; university: string; year: string }

export interface DoctorProfile {
  userId: string;
  photo: string;
  prefix: "Dr." | "Vaidya" | "Prof.";
  fullName: string;
  countryCode: string;
  mobile: string;
  mobileVerified: boolean;
  whatsappSame: boolean;
  whatsapp: string;
  email: string;
  languages: string[];
  registrationNumber: string;
  council: string;
  certificateName: string;
  degrees: Degree[];
  specialty: string;
  subSpecialties: string[];
  experienceYears: string;
  verificationStatus: "pending" | "verified" | "rejected";
  clinicName: string;
  city: string;
  state: string;
  zip: string;
  modes: { video: boolean; audio: boolean; clinic: boolean };
  fees: { video: string; audio: string; clinic: string };
  schedule: Record<Day, DaySchedule>;
  bioHtml: string;
  signature: string;
  socials: { youtube: string; instagram: string; linkedin: string; website: string };
  bankAccountName: string;
  accountNumber: string;
  ifsc: string;
  upi: string;
  listed: boolean;
  available: boolean;
  updatedAt: string;
}

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LANGUAGES = ["Hindi", "English", "Sanskrit", "Marathi", "Gujarati", "Kannada", "Tamil", "Telugu", "Bengali", "Malayalam", "Punjabi"];
const COUNCILS = ["NCISM — National Commission for Indian System of Medicine", "CCIM (legacy registration)", "Maharashtra State Ayurvedic Board", "Karnataka Ayurvedic & Unani Board", "Gujarat Board of Indian Medicine", "Uttar Pradesh Ayurvedic Council", "Kerala Ayurveda Council", "Other State Board"];
const SPECIALTIES = ["Kayachikitsa (General Medicine)", "Panchakarma (Detox & Purification)", "Shalya Tantra (Surgery)", "Shalakya Tantra (ENT & Ophthalmology)", "Stri Roga & Prasuti Tantra (Gynaecology)", "Kaumarbhritya (Paediatrics)", "Agada Tantra (Toxicology)", "Rasayana & Vajikarana (Rejuvenation)", "Swasthavritta (Preventive Medicine)"];
const SUB_SPECIALTIES = ["Joint Care", "Skin Disorders", "Gut Health", "Nadi Pariksha", "Women's Health", "Diabetes (Prameha)", "Sleep Disorders", "Hair & Scalp", "Respiratory Care", "Stress & Mind", "Infertility", "Post-partum Care", "Geriatric Care", "Sports Injuries", "Liver Disorders"];
const DEGREE_OPTIONS = ["BAMS", "MD (Ayu)", "MS (Ayu)", "MPH", "PhD (Ayurveda)", "Diploma in Panchakarma", "Diploma in Ksharasutra"];

const STORE_KEY = "vaidyagan_doctor_profiles_v1";

function loadAll(): Record<string, DoctorProfile> {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, DoctorProfile>;
  } catch { /* fresh */ }
  return {};
}
function persistAll(map: Record<string, DoctorProfile>) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

function defaultSchedule(): Record<Day, DaySchedule> {
  const s = {} as Record<Day, DaySchedule>;
  DAYS.forEach((d) => { s[d] = { enabled: d !== "Sun", slots: [{ from: "10:00", to: "14:00" }, { from: "17:00", to: "20:00" }] }; });
  return s;
}

export function blankProfile(u: StudioUser): DoctorProfile {
  return {
    userId: u.id, photo: "", prefix: "Dr.", fullName: u.name, countryCode: "+91", mobile: "", mobileVerified: false,
    whatsappSame: true, whatsapp: "", email: `${u.username}@vaidyagan.in`, languages: ["Hindi", "English"],
    registrationNumber: "", council: "", certificateName: "", degrees: [], specialty: "", subSpecialties: [],
    experienceYears: "", verificationStatus: "pending", clinicName: "", city: "", state: "", zip: "",
    modes: { video: true, audio: true, clinic: true }, fees: { video: "700", audio: "500", clinic: "600" },
    schedule: defaultSchedule(), bioHtml: "", signature: "",
    socials: { youtube: "", instagram: "", linkedin: "", website: "" },
    bankAccountName: u.name, accountNumber: "", ifsc: "", upi: "",
    listed: true, available: true, updatedAt: new Date().toISOString(),
  };
}

export function profileFor(userId: string): DoctorProfile | null {
  return loadAll()[userId] ?? null;
}
export function isDoctorListed(userId: string): boolean {
  const p = profileFor(userId);
  return p ? p.listed : true;
}
export function saveProfile(p: DoctorProfile) {
  const map = loadAll();
  map[p.userId] = { ...p, updatedAt: new Date().toISOString() };
  persistAll(map);
}

/* ============================== shared fragments ============================= */

const inp = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
const lbl = "mb-1.5 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/85";

function Hint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex" tabIndex={0} aria-label={text}>
      <HelpCircle size={13} className="cursor-help text-sand-200/35 transition-colors group-hover:text-gold-300" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-56 -translate-x-1/2 rounded-lg border border-gold-500/40 bg-forest-950 px-3.5 py-2.5 text-[11.5px] font-body normal-case leading-snug tracking-normal text-sand-200/90 opacity-0 shadow-[0_14px_40px_rgba(0,0,0,0.5)] transition-all duration-200 group-hover:opacity-100">
        {text}
        <span className="absolute left-1/2 top-full -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-gold-500/40 bg-forest-950" />
      </span>
    </span>
  );
}

function L({ label, hint, req, ok, children }: { label: string; hint?: string; req?: boolean; ok?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <span className={lbl}>
        {label}{req && <span className="text-ember-400">*</span>}{hint && <Hint text={hint} />}
        {ok && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto grid h-4 w-4 place-items-center rounded-full bg-kapha-500/25 text-kapha-300"><Check size={10} /></motion.span>}
      </span>
      {children}
    </div>
  );
}

function SectionCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-forest-800 bg-forest-900/70 p-6 sm:p-7">
      <p className="font-display text-xl font-semibold text-sand-100">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-sand-200/50">{sub}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Switch({ on, onChange, label, desc, disabled }: { on: boolean; onChange: (b: boolean) => void; label: string; desc?: string; disabled?: boolean }) {
  return (
    <button role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all duration-300 ${disabled ? "cursor-not-allowed opacity-50" : ""} ${on ? "border-kapha-500/50 bg-kapha-500/8" : "border-forest-700 bg-forest-950/40 hover:border-forest-600"}`}>
      <span>
        <span className={`block text-[14px] font-semibold ${on ? "text-sand-100" : "text-sand-200/70"}`}>{label}</span>
        {desc && <span className="mt-0.5 block text-xs text-sand-200/45">{desc}</span>}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-kapha-500" : "bg-forest-700"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-sand-100 shadow transition-all duration-300 ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

/* ------------------------------ signature pad ------------------------------ */

function SignaturePad({ value, onChange }: { value: string; onChange: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = 640 * dpr; c.height = 200 * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#f1e9d6";
    ctx.fillStyle = "#0f1a13";
    ctx.fillRect(0, 0, 640, 200);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, 640, 200);
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 640, y: ((e.clientY - r.top) / r.height) * 200 };
  };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = e.currentTarget.getContext("2d");
    const { x, y } = pos(e);
    ctx?.beginPath(); ctx?.moveTo(x, y);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d");
    const { x, y } = pos(e);
    ctx?.lineTo(x, y); ctx?.stroke();
  };
  const up = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(e.currentTarget.toDataURL("image/png"));
  };

  return (
    <div>
      <canvas ref={canvasRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        className="w-full cursor-crosshair touch-none rounded-xl border border-dashed border-forest-600 bg-forest-900"
        style={{ aspectRatio: "640 / 200" }} aria-label="Signature pad — draw with your mouse or finger" />
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <button onClick={() => onChange("")} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-ember-400 hover:text-ember-300"><Trash2 size={12} /> Clear</button>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 transition-all hover:border-gold-400 hover:text-gold-300">
          <Upload size={12} /> Upload signature image
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              const r = new FileReader();
              r.onload = () => onChange(String(r.result));
              r.readAsDataURL(f);
            }
            e.target.value = "";
          }} />
        </label>
        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/35">{value ? "Signature saved ✓" : "Draw with mouse or finger"}</span>
      </div>
    </div>
  );
}

/* ---------------------------- weekly availability --------------------------- */

function SchedulePicker({ schedule, onChange }: { schedule: Record<Day, DaySchedule>; onChange: (s: Record<Day, DaySchedule>) => void }) {
  const set = (d: Day, patch: Partial<DaySchedule>) => onChange({ ...schedule, [d]: { ...schedule[d], ...patch } });
  return (
    <div className="space-y-2.5">
      {DAYS.map((d) => {
        const day = schedule[d];
        return (
          <div key={d} className={`rounded-xl border transition-all duration-300 ${day.enabled ? "border-gold-500/35 bg-gold-400/4" : "border-forest-800 bg-forest-950/40 opacity-70"}`}>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className={`w-12 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] ${day.enabled ? "text-gold-300" : "text-sand-200/40"}`}>{d}</span>
              <Switch on={day.enabled} onChange={(b) => set(d, { enabled: b })} label={day.enabled ? "Consulting" : "Closed"} />
            </div>
            {day.enabled && (
              <div className="space-y-2 border-t border-forest-800/70 px-4 py-3">
                {day.slots.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select value={s.from} onChange={(e) => { const slots = [...day.slots]; slots[i] = { ...s, from: e.target.value }; set(d, { slots }); }} className="rounded-lg border border-forest-700 bg-forest-950/70 px-3 py-2 font-mono text-xs text-sand-100 focus:border-gold-400 focus:outline-none" aria-label={`${d} slot ${i + 1} start`}>
                      {Array.from({ length: 33 }, (_, h) => `${String(Math.floor(h / 2) + 6).padStart(2, "0")}:${h % 2 ? "30" : "00"}`).map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="text-sand-200/40">→</span>
                    <select value={s.to} onChange={(e) => { const slots = [...day.slots]; slots[i] = { ...s, to: e.target.value }; set(d, { slots }); }} className="rounded-lg border border-forest-700 bg-forest-950/70 px-3 py-2 font-mono text-xs text-sand-100 focus:border-gold-400 focus:outline-none" aria-label={`${d} slot ${i + 1} end`}>
                      {Array.from({ length: 33 }, (_, h) => `${String(Math.floor(h / 2) + 6).padStart(2, "0")}:${h % 2 ? "30" : "00"}`).map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {day.slots.length > 1 && (
                      <button onClick={() => set(d, { slots: day.slots.filter((_, x) => x !== i) })} aria-label={`Remove ${d} slot ${i + 1}`} className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200/40 hover:border-ember-400 hover:text-ember-300"><Trash2 size={13} /></button>
                    )}
                  </div>
                ))}
                {day.slots.length < 3 && (
                  <button onClick={() => set(d, { slots: [...day.slots, { from: "17:00", to: "20:00" }] })} className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-400/80 hover:text-gold-300"><Plus size={12} /> Add another time slot</button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ================================ main tab ================================ */

const TABS = [
  { label: "Identity & Contact", hint: "Photo, mobile, languages" },
  { label: "Verification", hint: "Registration & degrees" },
  { label: "Clinic & Tele", hint: "Practice, fees, schedule" },
  { label: "Bio & Brand", hint: "Your story & signature" },
  { label: "Payouts", hint: "Banking & UPI" },
];

export function DoctorProfileTab({ member }: { member: StudioUser }) {
  const { toast } = useApp();
  const [profile, setProfile] = useState<DoctorProfile>(() => profileFor(member.id) ?? blankProfile(member));
  const [tab, setTab] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showAccount, setShowAccount] = useState(false);
  const bioRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<number>(0);

  const patch = useCallback((part: Partial<DoctorProfile>) => {
    setProfile((p) => ({ ...p, ...part }));
    setDirty(true);
  }, []);

  const doSave = useCallback((silent = false) => {
    saveProfile(profile);
    setDirty(false);
    setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    if (!silent) toast("Profile saved");
  }, [profile, toast]);

  useEffect(() => {
    if (!dirty) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveProfile(profile);
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 1400);
    return () => window.clearTimeout(saveTimer.current);
  }, [profile, dirty]);

  useEffect(() => {
    if (bioRef.current && bioRef.current.innerHTML !== profile.bioHtml) bioRef.current.innerHTML = profile.bioHtml;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  const bioText = profile.bioHtml.replace(/<[^>]*>/g, "");
  const words = bioText.trim().split(/\s+/).filter(Boolean).length;
  const masked = profile.accountNumber ? `${"•".repeat(Math.max(0, profile.accountNumber.length - 4))} ${profile.accountNumber.slice(-4)}` : "";

  const uploadPhoto = (f: File | null) => {
    if (!f) return;
    readImageFile(f, (u) => { patch({ photo: u }); toast("Photo attached"); }, (m) => toast(m));
  };

  return (
    <div>
      {/* visibility switches */}
      <div className="mb-6 grid gap-3 rounded-xl border border-gold-500/30 bg-gold-400/5 p-5 lg:grid-cols-2">
        <Switch on={profile.listed} onChange={(b) => { patch({ listed: b }); toast(b ? "You are visible on the public site" : "You are hidden from the public site"); }}
          label="Show me on the Vaidyagan website"
          desc={profile.listed ? "Your card appears in the home-page Doctor's Corner and the footer." : "You are hidden from the public site right now."} />
        <Switch on={profile.available} onChange={(b) => { patch({ available: b }); toast(b ? "Accepting new patients" : "Bookings paused"); }}
          label="Accepting new patients"
          desc={profile.available ? "New consultations can be booked with you." : "Bookings are paused — switch back on whenever you're ready."} />
      </div>

      {/* tab stepper */}
      <div className="no-scrollbar flex items-end gap-2 overflow-x-auto">
        {TABS.map((t, i) => (
          <button key={t.label} onClick={() => setTab(i)}
            className={`shrink-0 rounded-t-xl border border-b-0 px-4 py-3 text-left transition-all ${tab === i ? "border-gold-500/50 bg-forest-900" : "border-forest-800 bg-forest-900/40 hover:bg-forest-900/70"}`}>
            <span className={`block font-mono text-[10px] uppercase tracking-[0.14em] ${tab === i ? "text-gold-300" : "text-sand-200/60"}`}>{i + 1}. {t.label}</span>
            <span className="mt-0.5 hidden text-[10px] text-sand-200/40 md:block">{t.hint}</span>
          </button>
        ))}
      </div>

      <div className="space-y-5 rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/40 p-5 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-5">
            {tab === 0 && (
              <SectionCard title="Photo & identity" sub="This is how patients recognise you across the journal, doctor's corner and booking pages.">
                <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                  <label className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-forest-600 transition-all hover:border-gold-400">
                    {profile.photo ? (
                      <>
                        <img src={profile.photo} alt="Profile" className="absolute inset-0 h-full w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-forest-950/80 py-2 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-gold-300 backdrop-blur">Drop a new photo to replace</span>
                      </>
                    ) : (
                      <><Camera size={26} className="text-gold-400/70" /><p className="mt-2 px-4 text-center font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/50">Click to upload photo</p></>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadPhoto(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                  </label>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
                      <L label="Title" ok={!!profile.prefix}>
                        <select value={profile.prefix} onChange={(e) => patch({ prefix: e.target.value as DoctorProfile["prefix"] })} className={inp}>
                          <option value="Dr.">Dr.</option><option value="Vaidya">Vaidya</option><option value="Prof.">Prof.</option>
                        </select>
                      </L>
                      <L label="Full name" ok={!!profile.fullName}><input value={profile.fullName} onChange={(e) => patch({ fullName: e.target.value })} className={inp} /></L>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
                      <L label="Code"><select value={profile.countryCode} onChange={(e) => patch({ countryCode: e.target.value, mobileVerified: false })} className={inp}>{["+91", "+971", "+44", "+1", "+61", "+65"].map((c) => <option key={c} value={c}>{c}</option>)}</select></L>
                      <L label="Mobile number" req ok={profile.mobileVerified} hint="Used for booking alerts. In production this is OTP-verified."><input value={profile.mobile} onChange={(e) => patch({ mobile: e.target.value.replace(/[^\d ]/g, ""), mobileVerified: false })} placeholder="98220 12345" inputMode="tel" className={inp} /></L>
                    </div>
                    <Switch on={profile.whatsappSame} onChange={(b) => patch({ whatsappSame: b, whatsapp: b ? profile.mobile : profile.whatsapp })} label="WhatsApp is the same as my mobile number" desc="Patients may reach you on WhatsApp for reports and follow-ups." />
                    {!profile.whatsappSame && <L label="WhatsApp number"><input value={profile.whatsapp} onChange={(e) => patch({ whatsapp: e.target.value })} placeholder="+91 …" className={inp} /></L>}
                    <L label="Email" hint="Your verified login email — contact support to change it.">
                      <div className="flex items-center gap-2.5 rounded-lg border border-forest-800 bg-forest-950/40 px-3.5 py-2.5">
                        <span className="flex-1 text-sm text-sand-200/60">{profile.email}</span>
                        <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-kapha-300">Read-only · verified</span>
                      </div>
                    </L>
                    <L label="Languages you consult in" ok={profile.languages.length > 0} hint="Tap to toggle — patients filter doctors by language.">
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map((l) => {
                          const on = profile.languages.includes(l);
                          return (
                            <button key={l} onClick={() => patch({ languages: on ? profile.languages.filter((x) => x !== l) : [...profile.languages, l] })}
                              className={`rounded-full border px-4 py-2 text-[13px] transition-all duration-200 ${on ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55 hover:border-forest-500 hover:text-sand-100"}`}>
                              {on && <Check size={12} className="mr-1.5 inline" />}{l}
                            </button>
                          );
                        })}
                      </div>
                    </L>
                  </div>
                </div>
              </SectionCard>
            )}

            {tab === 1 && (
              <SectionCard title="Clinical verification" sub="Vaidyagan's promise is 'Clinically Verified'. These details are reviewed by our team before the badge appears on your public page.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <L label="Registration number" req ok={!!profile.registrationNumber.trim()} hint="NCISM or State Board registration number, exactly as printed."><input value={profile.registrationNumber} onChange={(e) => patch({ registrationNumber: e.target.value.toUpperCase() })} placeholder="e.g. MAH-AYU-14-008821" className={inp} /></L>
                  <L label="Registration council" req ok={!!profile.council}>
                    <select value={profile.council} onChange={(e) => patch({ council: e.target.value })} className={inp}>
                      <option value="">Select council…</option>
                      {COUNCILS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </L>
                </div>
                <div className="mt-5">
                  <L label="Degrees & qualifications" ok={profile.degrees.length > 0} hint="Add every degree — BAMS, MD, MS, PhD, diplomas.">
                    <div className="space-y-2.5">
                      {profile.degrees.map((d) => (
                        <div key={d.id} className="grid gap-2 rounded-xl border border-forest-800 bg-forest-950/40 p-3 sm:grid-cols-[150px_1fr_110px_auto]">
                          <select value={d.degree} onChange={(e) => patch({ degrees: profile.degrees.map((x) => x.id === d.id ? { ...x, degree: e.target.value } : x) })} className={inp}>{DEGREE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                          <input value={d.university} onChange={(e) => patch({ degrees: profile.degrees.map((x) => x.id === d.id ? { ...x, university: e.target.value } : x) })} placeholder="University / college" className={inp} />
                          <input value={d.year} onChange={(e) => patch({ degrees: profile.degrees.map((x) => x.id === d.id ? { ...x, year: e.target.value.replace(/\D/g, "").slice(0, 4) } : x) })} placeholder="Year" inputMode="numeric" className={inp} />
                          <button onClick={() => patch({ degrees: profile.degrees.filter((x) => x.id !== d.id) })} aria-label="Remove degree" className="grid h-11 w-11 place-items-center justify-self-start rounded-lg border border-forest-700 text-sand-200/40 hover:border-ember-400 hover:text-ember-300 sm:justify-self-auto"><Trash2 size={15} /></button>
                        </div>
                      ))}
                      <button onClick={() => patch({ degrees: [...profile.degrees, { id: `d${Date.now()}`, degree: "BAMS", university: "", year: "" }] })} className="flex items-center gap-2 rounded-xl border border-dashed border-gold-500/50 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 transition-all hover:bg-gold-400/10"><Plus size={14} /> Add degree</button>
                    </div>
                  </L>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <L label="Primary specialty" req ok={!!profile.specialty}>
                    <select value={profile.specialty} onChange={(e) => patch({ specialty: e.target.value })} className={inp}>
                      <option value="">Select…</option>
                      {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </L>
                  <L label="Years of experience" req ok={!!profile.experienceYears}><input value={profile.experienceYears} onChange={(e) => patch({ experienceYears: e.target.value.replace(/\D/g, "").slice(0, 2) })} placeholder="e.g. 12" inputMode="numeric" className={inp} /></L>
                  <div>
                    <span className={lbl}>Sub-specialties <Hint text="Tap all that apply — these power the symptom-to-doctor matching." /></span>
                    <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-forest-800 bg-forest-950/40 p-2.5">
                      {SUB_SPECIALTIES.map((s) => {
                        const on = profile.subSpecialties.includes(s);
                        return (
                          <button key={s} onClick={() => patch({ subSpecialties: on ? profile.subSpecialties.filter((x) => x !== s) : [...profile.subSpecialties, s] })}
                            className={`rounded-full border px-3 py-1.5 text-[11.5px] transition-all ${on ? "border-kapha-400 bg-kapha-500/15 text-kapha-300" : "border-forest-700 text-sand-200/50 hover:text-sand-100"}`}>
                            {on && <Check size={10} className="mr-1 inline" />}{s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className={`mt-6 rounded-xl border p-5 ${profile.verificationStatus === "verified" ? "border-kapha-500/50 bg-kapha-500/8" : profile.verificationStatus === "rejected" ? "border-ember-500/50 bg-ember-500/8" : "border-gold-500/40 bg-gold-400/5"}`}>
                  <p className={`font-mono text-[9.5px] uppercase tracking-[0.22em] ${profile.verificationStatus === "verified" ? "text-kapha-300" : profile.verificationStatus === "rejected" ? "text-ember-300" : "text-gold-300"}`}>
                    {profile.verificationStatus === "verified" ? "Status: verified — the badge is live on your page" : profile.verificationStatus === "rejected" ? "Status: rejected — re-upload a clearer certificate to reapply" : "Status: pending admin review (usually within 48 hours)"}
                  </p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-sand-200/55">
                    {profile.verificationStatus === "verified" ? "Patients see the 'Clinically Verified' seal beside your name on every essay and the booking page." : "Complete registration number and council to enter the review queue."}
                  </p>
                </div>
              </SectionCard>
            )}

            {tab === 2 && (
              <>
                <SectionCard title="Clinic & tele-consultation" sub="Where patients can meet you — in person or online — and what each consultation costs.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <L label="Clinic name" ok={!!profile.clinicName.trim()}><input value={profile.clinicName} onChange={(e) => patch({ clinicName: e.target.value })} placeholder="e.g. Vaidyagan Clinic, Kothrud" className={inp} /></L>
                    <div className="grid grid-cols-3 gap-3">
                      <L label="City" ok={!!profile.city.trim()}><input value={profile.city} onChange={(e) => patch({ city: e.target.value })} placeholder="Pune" className={inp} /></L>
                      <L label="State"><input value={profile.state} onChange={(e) => patch({ state: e.target.value })} placeholder="Maharashtra" className={inp} /></L>
                      <L label="PIN"><input value={profile.zip} onChange={(e) => patch({ zip: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="411038" inputMode="numeric" className={inp} /></L>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {([["video", "Video consultation", "45-min video call with prescription"], ["audio", "Audio call", "20-min phone consultation"], ["clinic", "In-clinic visit", "Walk-in or booked slot at your clinic"]] as const).map(([key, label, desc]) => (
                      <div key={key} className={`rounded-xl border p-4 transition-all ${profile.modes[key] ? "border-gold-500/35 bg-gold-400/4" : "border-forest-800"}`}>
                        <Switch on={profile.modes[key]} onChange={(b) => patch({ modes: { ...profile.modes, [key]: b } })} label={label} desc={desc} />
                        {profile.modes[key] && (
                          <div className="mt-3 flex items-center gap-3 pl-1">
                            <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/50">Fee</span>
                            <span className="text-sand-200/40">₹</span>
                            <input value={profile.fees[key]} onChange={(e) => patch({ fees: { ...profile.fees, [key]: e.target.value.replace(/\D/g, "").slice(0, 5) } })} inputMode="numeric" placeholder="700" className="w-28 rounded-lg border border-forest-700 bg-forest-950/70 px-3 py-2 font-mono text-sm text-sand-100 focus:border-gold-400 focus:outline-none" />
                            <span className="text-xs text-sand-200/40">per consultation</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>
                <SectionCard title="Weekly availability" sub="Tap a day on or off, then set your time slots. Patients can only book inside these windows.">
                  <SchedulePicker schedule={profile.schedule} onChange={(s) => patch({ schedule: s })} />
                </SectionCard>
              </>
            )}

            {tab === 3 && (
              <>
                <SectionCard title="Your public bio" sub="Tell patients about your clinical experience and healing approach.">
                  <L label="About you" hint="Your parampara (lineage), philosophy, and what patients can expect." ok={words >= 100}>
                    <div className="rounded-xl border border-forest-700 bg-forest-950/50 transition-colors focus-within:border-gold-400">
                      <div className="flex items-center gap-1.5 border-b border-forest-800 px-3 py-2" onMouseDown={(e) => e.preventDefault()}>
                        <button onClick={() => { try { bioRef.current?.focus(); document.execCommand("bold"); } catch { /* ignore */ } patch({ bioHtml: bioRef.current?.innerHTML ?? "" }); }} className="grid h-8 w-8 place-items-center rounded-md border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300" title="Bold"><b className="text-xs">B</b></button>
                        <button onClick={() => { try { bioRef.current?.focus(); document.execCommand("italic"); } catch { /* ignore */ } patch({ bioHtml: bioRef.current?.innerHTML ?? "" }); }} className="grid h-8 w-8 place-items-center rounded-md border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300" title="Italic"><i className="text-xs">I</i></button>
                        <button onClick={() => { try { bioRef.current?.focus(); document.execCommand("insertUnorderedList"); } catch { /* ignore */ } patch({ bioHtml: bioRef.current?.innerHTML ?? "" }); }} className="grid h-8 w-8 place-items-center rounded-md border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300" title="Bullets"><span className="text-xs leading-none">•≡</span></button>
                        <span className={`ml-auto font-mono text-[9px] uppercase tracking-[0.14em] ${words >= 100 ? "text-kapha-300" : "text-sand-200/35"}`}>{words} / 100+ words</span>
                      </div>
                      <div ref={bioRef} contentEditable data-placeholder="e.g. Third-generation vaidya trained in the Koteshwar shastra tradition…" onInput={() => patch({ bioHtml: bioRef.current?.innerHTML ?? "" })} className="editor-surface min-h-[140px] p-4 text-[15px] leading-[1.85] text-sand-200/90" />
                    </div>
                  </L>
                </SectionCard>
                <SectionCard title="Digital signature" sub="Sign once — it appears on every prescription and advice note generated for your patients.">
                  <L label="Draw or upload your signature" ok={!!profile.signature} hint="Use your mouse, a stylus or your finger."><SignaturePad value={profile.signature} onChange={(d) => patch({ signature: d })} /></L>
                </SectionCard>
                <SectionCard title="Social & web presence" sub="Optional — link your channels so patients can follow your work.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {([["youtube", "YouTube channel", "https://youtube.com/@…", Youtube], ["instagram", "Instagram", "https://instagram.com/…", Instagram], ["linkedin", "LinkedIn", "https://linkedin.com/in/…", Linkedin], ["website", "Personal website", "https://…", Globe]] as const).map(([key, label, ph, Icon]) => (
                      <L key={key} label={label} ok={!!profile.socials[key]}>
                        <div className="relative">
                          <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400/70" />
                          <input value={profile.socials[key]} onChange={(e) => patch({ socials: { ...profile.socials, [key]: e.target.value } })} placeholder={ph} className={`${inp} pl-10`} />
                        </div>
                      </L>
                    ))}
                  </div>
                </SectionCard>
              </>
            )}

            {tab === 4 && (
              <SectionCard title="Payouts & banking" sub="Where consultation fees and royalties land. Stored encrypted in production; masked here after entry.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <L label="Account holder name" ok={!!profile.bankAccountName.trim()}><input value={profile.bankAccountName} onChange={(e) => patch({ bankAccountName: e.target.value })} placeholder="As per bank records" className={inp} /></L>
                  <L label="Account number" ok={!!profile.accountNumber} hint="Masked after you type it — only the last 4 digits stay visible.">
                    <div className="relative">
                      <input value={showAccount ? profile.accountNumber : masked} onFocus={() => setShowAccount(true)} onBlur={() => setShowAccount(false)}
                        onChange={(e) => { if (!showAccount) setShowAccount(true); patch({ accountNumber: e.target.value.replace(/\D/g, "").slice(0, 18) }); }}
                        placeholder="XXXXXXXXXXXX1234" inputMode="numeric" className={`${inp} font-mono`} />
                      <button onClick={() => setShowAccount(!showAccount)} className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/45 hover:text-gold-300">{showAccount ? "Hide" : "Show"}</button>
                    </div>
                  </L>
                  <L label="IFSC code" ok={!!profile.ifsc}><input value={profile.ifsc} onChange={(e) => patch({ ifsc: e.target.value.toUpperCase().slice(0, 11) })} placeholder="SBIN0001234" className={`${inp} font-mono`} /></L>
                  <L label="UPI ID (for instant payouts)" ok={!!profile.upi}><input value={profile.upi} onChange={(e) => patch({ upi: e.target.value })} placeholder="yourname@upi" className={inp} /></L>
                </div>
                <p className="mt-4 text-[12px] leading-relaxed text-sand-200/45">Banking details are used only for payouts and are never shown on your public profile. Payouts settle every Monday.</p>
              </SectionCard>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* sticky save bar */}
      <div className="sticky bottom-4 z-30 mt-6">
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 ${dirty ? "border-gold-400/70 bg-forest-900/95 shadow-[0_0_30px_rgba(214,180,95,0.18)]" : "border-forest-700 bg-forest-900/85"}`}>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/50">
            {dirty ? <span className="text-gold-300">● Unsaved changes — auto-saving…</span> : savedAt ? <span className="text-kapha-300">✓ All changes saved · {savedAt}</span> : "Everything saved"}
          </p>
          <button onClick={() => doSave()} className={`flex items-center gap-2 rounded-full px-6 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] transition-all active:scale-95 ${dirty ? "bg-gold-400 text-forest-950 hover:bg-gold-300" : "border border-forest-600 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"}`}>
            <Check size={14} /> Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
