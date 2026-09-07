/* =============================================================================
   Vaidyagan — Doctor Profile & Practice Management (Studio tab)
   A 5-step, forgiving profile builder for non-technical vaidyas, plus the
   "show me on the site / accepting patients" master switches that drive the
   public Doctor's Corner.
   ========================================================================== */

import React, { useEffect, useRef, useState } from "react";
import { useApp, readImageFile, SmartImg, auth, type StudioUser } from "./lib";
import { Check, Close, Pen, Upload, Camera, Help, Plus, Trash, Leaf, Lock } from "./icons";

export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export interface TimeSlot { from: string; to: string }
export interface DaySchedule { enabled: boolean; slots: TimeSlot[] }
export interface Degree { id: string; degree: string; university: string; year: string }

export interface DoctorProfile {
  userId: string;
  photo: string; prefix: string; fullName: string;
  countryCode: string; mobile: string; mobileVerified: boolean;
  whatsappSame: boolean; whatsapp: string; email: string; languages: string[];
  registrationNumber: string; council: string; certificateName: string; certificateData: string;
  degrees: Degree[]; specialty: string; subSpecialties: string[]; experienceYears: string;
  verificationStatus: "pending" | "verified" | "rejected";
  clinicName: string; street: string; city: string; state: string; zip: string; mapsUrl: string;
  modes: { video: boolean; audio: boolean; clinic: boolean };
  fees: { video: string; audio: string; clinic: string };
  schedule: Record<Day, DaySchedule>;
  bioHtml: string; signature: string;
  socials: { youtube: string; instagram: string; linkedin: string; website: string };
  bankName: string; accountName: string; accountNumber: string; ifsc: string; upi: string;
  listed: boolean; available: boolean;
  updatedAt: string;
}

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LANGUAGES = ["Hindi", "English", "Sanskrit", "Marathi", "Gujarati", "Kannada", "Tamil", "Telugu", "Bengali", "Malayalam"];
const COUNCILS = ["NCISM", "CCIM (legacy)", "Maharashtra State Ayurvedic Board", "Karnataka Ayurvedic Board", "Gujarat Board of Indian Medicine", "Uttar Pradesh Ayurvedic Council", "Kerala Ayurveda Council", "Other State Board"];
const SPECIALTIES = ["Kayachikitsa (General Medicine)", "Panchakarma (Detox)", "Shalya Tantra (Surgery)", "Shalakya Tantra (ENT & Eyes)", "Stri Roga (Gynaecology)", "Kaumarbhritya (Paediatrics)", "Agada Tantra (Toxicology)", "Rasayana (Rejuvenation)", "Swasthavritta (Preventive)"];
const SUB_SPECIALTIES = ["Joint Care", "Skin Disorders", "Gut Health", "Nadi Pariksha", "Women's Health", "Diabetes (Prameha)", "Sleep Disorders", "Hair & Scalp", "Respiratory Care", "Stress & Mind", "Infertility", "Post-partum Care", "Liver Disorders"];
const DEGREES = ["BAMS", "MD (Ayu)", "MS (Ayu)", "MPH", "PhD (Ayurveda)", "Diploma in Panchakarma", "Diploma in Ksharasutra"];

const PROFILES_KEY = "vaidyagan_doctor_profiles_v1";

function defaultSchedule(): Record<Day, DaySchedule> {
  const mk = (on: boolean): DaySchedule => ({ enabled: on, slots: [{ from: "10:00", to: "14:00" }, { from: "17:00", to: "20:00" }] });
  return { Mon: mk(true), Tue: mk(true), Wed: mk(true), Thu: mk(true), Fri: mk(true), Sat: mk(true), Sun: mk(false) };
}

function blankProfile(u: StudioUser): DoctorProfile {
  return {
    userId: u.id, photo: "", prefix: "Dr.", fullName: u.name, countryCode: "+91", mobile: "", mobileVerified: false,
    whatsappSame: true, whatsapp: "", email: `${u.username}@vaidyagan.in`, languages: ["Hindi", "English"],
    registrationNumber: "", council: "", certificateName: "", certificateData: "", degrees: [],
    specialty: "", subSpecialties: [], experienceYears: "", verificationStatus: "pending",
    clinicName: "", street: "", city: "", state: "", zip: "", mapsUrl: "",
    modes: { video: true, audio: true, clinic: true }, fees: { video: "700", audio: "500", clinic: "600" },
    schedule: defaultSchedule(), bioHtml: "", signature: "",
    socials: { youtube: "", instagram: "", linkedin: "", website: "" },
    bankName: "", accountName: u.name, accountNumber: "", ifsc: "", upi: "",
    listed: true, available: true, updatedAt: new Date().toISOString(),
  };
}

export function profileFor(userId: string): DoctorProfile | null {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, DoctorProfile>;
    return map[userId] ?? null;
  } catch { return null; }
}

/** Public visibility — used by the home Doctor's Corner and footer. */
export function isDoctorListed(userId: string): boolean {
  const p = profileFor(userId);
  // Check profile listing first
  if (p && !p.listed) return false;
  // Check Studio permission for footer visibility
  try {
    const user = auth.get(userId);
    if (user && user.showInFooter === false) return false;
  } catch {
    // If auth not available, default to showing
  }
  return true;
}

function saveProfile(p: DoctorProfile) {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, DoctorProfile>) : {};
    map[p.userId] = { ...p, updatedAt: new Date().toISOString() };
    localStorage.setItem(PROFILES_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

const TABS = [
  { key: "identity", label: "Identity & Contact" },
  { key: "verify", label: "Verification" },
  { key: "clinic", label: "Clinic & Tele" },
  { key: "bio", label: "Bio & Brand" },
  { key: "payouts", label: "Payouts" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const inp = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
const lbl = "mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.18em] text-gold-400/80";

function Hint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex" tabIndex={0}>
      <Help size={13} className="cursor-help text-sand-200/35 hover:text-gold-300" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-52 -translate-x-1/2 rounded-lg border border-gold-500/40 bg-forest-950 px-3 py-2 text-[11px] leading-snug text-sand-200/90 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100">{text}</span>
    </span>
  );
}

function SignaturePad({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = 640 * dpr; c.height = 200 * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#f1e9d6";
    ctx.fillStyle = "#0d1a12"; ctx.fillRect(0, 0, 640, 200);
    if (value) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, 640, 200); img.src = value; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 640, y: ((e.clientY - r.top) / r.height) * 200 };
  };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = e.currentTarget.getContext("2d"); const p = pos(e);
    ctx?.beginPath(); ctx?.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d"); const p = pos(e);
    ctx?.lineTo(p.x, p.y); ctx?.stroke();
  };
  const up = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(e.currentTarget.toDataURL("image/png"));
  };
  const clear = () => {
    const c = ref.current; const ctx = c?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0d1a12"; ctx.fillRect(0, 0, 640, 200);
    onChange("");
  };
  return (
    <div>
      <canvas ref={ref} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        className="w-full cursor-crosshair touch-none rounded-xl border border-dashed border-forest-600 bg-forest-900" style={{ aspectRatio: "640 / 200" }} aria-label="Signature pad" />
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <button onClick={clear} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-ember-400 hover:text-ember-300"><Close size={11} /> Clear</button>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">
          <Upload size={11} /> Upload image
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => onChange(String(r.result));
            r.readAsDataURL(f);
            e.target.value = "";
          }} />
        </label>
        <span className="ml-auto font-mono text-[8.5px] uppercase tracking-[0.12em] text-sand-200/35">{value ? "Saved ✓" : "Draw with mouse or finger"}</span>
      </div>
    </div>
  );
}

function SchedulePicker({ schedule, onChange }: { schedule: Record<Day, DaySchedule>; onChange: (s: Record<Day, DaySchedule>) => void }) {
  const set = (d: Day, patch: Partial<DaySchedule>) => onChange({ ...schedule, [d]: { ...schedule[d], ...patch } });
  return (
    <div className="space-y-2.5">
      {DAYS.map((d) => {
        const day = schedule[d];
        return (
          <div key={d} className={`rounded-xl border p-3.5 ${day.enabled ? "border-gold-500/30 bg-gold-400/4" : "border-forest-800 opacity-70"}`}>
            <div className="flex items-center justify-between gap-3">
              <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${day.enabled ? "text-gold-300" : "text-sand-200/40"}`}>{d} · {day.enabled ? "Consulting" : "Closed"}</span>
              <button role="switch" aria-checked={day.enabled} onClick={() => set(d, { enabled: !day.enabled })}
                className={`relative h-6 w-11 rounded-full transition-colors ${day.enabled ? "bg-[#5f947e]" : "bg-forest-700"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-sand-100 transition-all ${day.enabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
            {day.enabled && (
              <div className="mt-3 space-y-2">
                {day.slots.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select value={s.from} onChange={(e) => { const slots = [...day.slots]; slots[i] = { ...s, from: e.target.value }; set(d, { slots }); }} className={inp} aria-label={`${d} start`}>
                      {["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <span className="text-sand-200/40">→</span>
                    <select value={s.to} onChange={(e) => { const slots = [...day.slots]; slots[i] = { ...s, to: e.target.value }; set(d, { slots }); }} className={inp} aria-label={`${d} end`}>
                      {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                    {day.slots.length > 1 && <button onClick={() => set(d, { slots: day.slots.filter((_, x) => x !== i) })} aria-label="Remove slot" className="grid h-7 w-7 place-items-center rounded-full border border-forest-700 text-sand-200/50 hover:border-ember-400 hover:text-ember-300"><Trash size={12} /></button>}
                  </div>
                ))}
                {day.slots.length < 3 && <button onClick={() => set(d, { slots: [...day.slots, { from: "17:00", to: "20:00" }] })} className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-gold-400/80 hover:text-gold-300"><Plus size={11} /> Add slot</button>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DoctorProfileTab({ member }: { member: StudioUser }) {
  const { toast } = useApp();
  const [profile, setProfile] = useState<DoctorProfile>(() => profileFor(member.id) ?? blankProfile(member));
  const [tab, setTab] = useState<TabKey>("identity");
  const [bioText, setBioText] = useState(profile.bioHtml);
  const bioRef = useRef<HTMLDivElement>(null);
  const [otpSent, setOtpSent] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState("");

  const patch = (p: Partial<DoctorProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...p };
      saveProfile(next);
      return next;
    });
  };

  useEffect(() => {
    if (bioRef.current && bioRef.current.innerHTML !== bioText) bioRef.current.innerHTML = bioText;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const pct = (() => {
    const checks = [
      !!profile.photo, !!profile.mobileVerified, profile.languages.length > 0,
      !!profile.registrationNumber, !!profile.council, !!profile.certificateData, profile.degrees.length > 0,
      !!profile.specialty, !!profile.experienceYears, !!profile.clinicName && !!profile.city,
      bioText.replace(/<[^>]*>/g, "").length >= 100, !!profile.signature,
      (!!profile.accountNumber && !!profile.ifsc) || !!profile.upi,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  })();

  const sendOtp = () => {
    if (profile.mobile.replace(/\D/g, "").length < 10) { toast("Enter a valid mobile number first"); return; }
    const c = String(Math.floor(1000 + Math.random() * 9000));
    setOtpSent(c); setOtpInput("");
    toast(`Demo OTP: ${c}`);
  };

  const maskedAccount = profile.accountNumber ? `${"•".repeat(Math.max(0, profile.accountNumber.length - 4))} ${profile.accountNumber.slice(-4)}` : "";

  return (
    <div className="space-y-5">
      {/* completion meter + master switches */}
      <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold">Your profile is {pct}% complete</p>
            <p className="mt-0.5 text-[12px] text-sand-200/50">{pct >= 80 ? "Almost ready for public booking." : "Add your registration number & photo to activate your public page."}</p>
          </div>
          <span className={`rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] ${profile.verificationStatus === "verified" ? "border-kapha-500/50 bg-kapha-500/10 text-kapha-300" : "border-gold-500/50 bg-gold-400/10 text-gold-300"}`}>
            {profile.verificationStatus === "verified" ? "Clinically verified" : "Verification pending"}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-forest-800">
          <div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button role="switch" aria-checked={profile.listed} onClick={() => { patch({ listed: !profile.listed }); toast(profile.listed ? "Hidden from the public site" : "Visible on the public site"); }}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left ${profile.listed ? "border-[#5f947e]/50 bg-[#5f947e]/8" : "border-forest-700"}`}>
            <span><span className="block text-[13px] font-semibold">Show me on the website</span><span className="text-[11px] text-sand-200/45">Appears in the Doctor's Corner</span></span>
            <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${profile.listed ? "bg-[#5f947e]" : "bg-forest-700"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-sand-100 transition-all ${profile.listed ? "left-6" : "left-1"}`} /></span>
          </button>
          <button role="switch" aria-checked={profile.available} onClick={() => { patch({ available: !profile.available }); toast(profile.available ? "Bookings paused" : "Accepting patients again"); }}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left ${profile.available ? "border-[#5f947e]/50 bg-[#5f947e]/8" : "border-forest-700"}`}>
            <span><span className="block text-[13px] font-semibold">Accepting new patients</span><span className="text-[11px] text-sand-200/45">Pause to stop bookings</span></span>
            <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${profile.available ? "bg-[#5f947e]" : "bg-forest-700"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-sand-100 transition-all ${profile.available ? "left-6" : "left-1"}`} /></span>
          </button>
        </div>
      </div>

      {/* tab stepper */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full border px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-all ${tab === t.key ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55 hover:text-sand-100"}`}>{t.label}</button>
        ))}
      </div>

      <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-6">
        {tab === "identity" && (
          <div className="grid gap-5 lg:grid-cols-[200px_1fr]">
            <div>
              <label className={lbl}>Profile photo <Hint text="A clear, professional photo. We auto-crop to a circle." /></label>
              <label className="relative block cursor-pointer">
                {profile.photo ? (
                  <SmartImg src={profile.photo} alt="Profile" className="aspect-square w-full rounded-2xl border border-forest-700 object-cover" />
                ) : (
                  <span className="grid aspect-square w-full place-items-center rounded-2xl border border-dashed border-forest-600 text-sand-200/40"><Camera size={26} /></span>
                )}
                <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-gold-400 text-forest-950"><Upload size={14} /></span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) readImageFile(f, (u) => { patch({ photo: u }); toast("Photo attached"); }, (m) => toast(m));
                  e.target.value = "";
                }} />
              </label>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-[90px_1fr] gap-3">
                <div><label className={lbl}>Title</label><select value={profile.prefix} onChange={(e) => patch({ prefix: e.target.value })} className={inp}>{["Dr.", "Vaidya", "Prof."].map((p) => <option key={p}>{p}</option>)}</select></div>
                <div><label className={lbl}>Full name</label><input value={profile.fullName} onChange={(e) => patch({ fullName: e.target.value })} className={inp} /></div>
              </div>
              <div className="grid grid-cols-[90px_1fr_auto] items-end gap-3">
                <div><label className={lbl}>Code</label><select value={profile.countryCode} onChange={(e) => patch({ countryCode: e.target.value, mobileVerified: false })} className={inp}>{["+91", "+971", "+44", "+1"].map((c) => <option key={c}>{c}</option>)}</select></div>
                <div><label className={lbl}>Mobile *</label><input value={profile.mobile} onChange={(e) => patch({ mobile: e.target.value, mobileVerified: false })} placeholder="98220 12345" className={inp} /></div>
                {profile.mobileVerified ? (
                  <span className="flex items-center gap-1.5 rounded-lg border border-kapha-500/50 bg-kapha-500/10 px-3 py-2.5 font-mono text-[9px] uppercase text-kapha-300"><Check size={12} /> Verified</span>
                ) : otpSent ? (
                  <div className="flex items-center gap-2">
                    <input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder={otpSent} className={`${inp} w-20`} />
                    <button onClick={() => { if (otpInput === otpSent) { patch({ mobileVerified: true }); setOtpSent(null); toast("Mobile verified"); } else toast("Code doesn't match"); }} className="rounded-lg bg-gold-400 px-3 py-2.5 font-mono text-[9px] font-semibold uppercase text-forest-950">Verify</button>
                  </div>
                ) : (
                  <button onClick={sendOtp} className="rounded-lg border border-gold-500/50 px-3 py-2.5 font-mono text-[9px] uppercase text-gold-300 hover:bg-gold-400 hover:text-forest-950">Send OTP</button>
                )}
              </div>
              <div><label className={lbl}>Email (verified)</label><div className="flex items-center gap-2 rounded-lg border border-forest-800 bg-forest-950/40 px-3 py-2.5 text-sm text-sand-200/50">{profile.email} <Lock size={12} /></div></div>
              <div>
                <label className={lbl}>Languages spoken</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => (
                    <button key={l} onClick={() => patch({ languages: profile.languages.includes(l) ? profile.languages.filter((x) => x !== l) : [...profile.languages, l] })}
                      className={`rounded-full border px-3 py-1.5 text-[11.5px] transition-all ${profile.languages.includes(l) ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55"}`}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "verify" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={lbl}>Registration number *</label><input value={profile.registrationNumber} onChange={(e) => patch({ registrationNumber: e.target.value })} placeholder="MAH-AYU-14-008821" className={inp} /></div>
              <div><label className={lbl}>Registration council *</label><select value={profile.council} onChange={(e) => patch({ council: e.target.value })} className={inp}><option value="">Select…</option>{COUNCILS.map((c) => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div>
              <label className={lbl}>Registration certificate <Hint text="PDF or photo. Reviewed privately by the Vaidyagan admin team." /></label>
              {profile.certificateData ? (
                <div className="flex items-center gap-3 rounded-xl border border-kapha-500/40 bg-kapha-500/8 px-4 py-3">
                  <Check size={16} className="text-kapha-300" /><span className="flex-1 text-[13px] text-sand-100">{profile.certificateName}</span>
                  <button onClick={() => patch({ certificateName: "", certificateData: "" })} className="font-mono text-[9px] uppercase text-sand-200/50 hover:text-ember-300">Replace</button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-forest-600 py-6 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">
                  <Upload size={14} /> Upload PDF / image
                  <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => { patch({ certificateName: f.name, certificateData: String(r.result), verificationStatus: "pending" }); toast("Certificate attached — sent for review"); };
                    r.readAsDataURL(f);
                    e.target.value = "";
                  }} />
                </label>
              )}
            </div>
            <div>
              <label className={lbl}>Degrees</label>
              <div className="space-y-2.5">
                {profile.degrees.map((d) => (
                  <div key={d.id} className="grid grid-cols-[110px_1fr_90px_auto] gap-2">
                    <select value={d.degree} onChange={(e) => patch({ degrees: profile.degrees.map((x) => x.id === d.id ? { ...x, degree: e.target.value } : x) })} className={inp}>{DEGREES.map((x) => <option key={x}>{x}</option>)}</select>
                    <input value={d.university} onChange={(e) => patch({ degrees: profile.degrees.map((x) => x.id === d.id ? { ...x, university: e.target.value } : x) })} placeholder="University" className={inp} />
                    <input value={d.year} onChange={(e) => patch({ degrees: profile.degrees.map((x) => x.id === d.id ? { ...x, year: e.target.value } : x) })} placeholder="Year" className={inp} />
                    <button onClick={() => patch({ degrees: profile.degrees.filter((x) => x.id !== d.id) })} aria-label="Remove degree" className="grid h-10 w-10 place-items-center rounded-lg border border-forest-700 text-sand-200/50 hover:border-ember-400 hover:text-ember-300"><Trash size={14} /></button>
                  </div>
                ))}
                <button onClick={() => patch({ degrees: [...profile.degrees, { id: `deg-${Date.now()}`, degree: "BAMS", university: "", year: "" }] })}
                  className="flex items-center gap-1.5 rounded-full border border-dashed border-gold-500/50 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-gold-300 hover:bg-gold-400/10"><Plus size={12} /> Add degree</button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className={lbl}>Primary specialty *</label><select value={profile.specialty} onChange={(e) => patch({ specialty: e.target.value })} className={inp}><option value="">Select…</option>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label className={lbl}>Experience (years)</label><input value={profile.experienceYears} onChange={(e) => patch({ experienceYears: e.target.value.replace(/\D/g, "") })} className={inp} /></div>
            </div>
            <div>
              <label className={lbl}>Sub-specialties</label>
              <div className="flex flex-wrap gap-2">
                {SUB_SPECIALTIES.map((s) => (
                  <button key={s} onClick={() => patch({ subSpecialties: profile.subSpecialties.includes(s) ? profile.subSpecialties.filter((x) => x !== s) : [...profile.subSpecialties, s] })}
                    className={`rounded-full border px-3 py-1.5 text-[11.5px] transition-all ${profile.subSpecialties.includes(s) ? "border-kapha-400 bg-kapha-500/12 text-kapha-300" : "border-forest-700 text-sand-200/55"}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "clinic" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={lbl}>Clinic name</label><input value={profile.clinicName} onChange={(e) => patch({ clinicName: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Google Maps URL</label><input value={profile.mapsUrl} onChange={(e) => patch({ mapsUrl: e.target.value })} placeholder="https://maps.app.goo.gl/…" className={inp} /></div>
              <div className="sm:col-span-2"><label className={lbl}>Street address</label><input value={profile.street} onChange={(e) => patch({ street: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>City</label><input value={profile.city} onChange={(e) => patch({ city: e.target.value })} className={inp} /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className={lbl}>State</label><input value={profile.state} onChange={(e) => patch({ state: e.target.value })} className={inp} /></div><div><label className={lbl}>ZIP</label><input value={profile.zip} onChange={(e) => patch({ zip: e.target.value })} className={inp} /></div></div>
            </div>
            <div>
              <label className={lbl}>Consultation modes & fees</label>
              <div className="grid gap-3 sm:grid-cols-3">
                {([["video", "Video call"], ["audio", "Audio call"], ["clinic", "In-clinic"]] as const).map(([k, l]) => (
                  <div key={k} className={`rounded-xl border p-3.5 ${profile.modes[k] ? "border-gold-500/30 bg-gold-400/4" : "border-forest-800 opacity-70"}`}>
                    <button role="switch" aria-checked={profile.modes[k]} onClick={() => patch({ modes: { ...profile.modes, [k]: !profile.modes[k] } })}
                      className={`font-mono text-[9.5px] uppercase tracking-[0.12em] ${profile.modes[k] ? "text-gold-300" : "text-sand-200/45"}`}>{l} · {profile.modes[k] ? "on" : "off"}</button>
                    {profile.modes[k] && <input value={profile.fees[k]} onChange={(e) => patch({ fees: { ...profile.fees, [k]: e.target.value.replace(/\D/g, "") } })} placeholder="Fee ₹" className={`${inp} mt-2`} />}
                  </div>
                ))}
              </div>
            </div>
            <div><label className={lbl}>Weekly availability</label><SchedulePicker schedule={profile.schedule} onChange={(s) => patch({ schedule: s })} /></div>
          </div>
        )}

        {tab === "bio" && (
          <div className="space-y-4">
            <div>
              <label className={lbl}>About you <Hint text="Tell patients about your clinical experience, lineage (parampara) and approach." /></label>
              <div className="rounded-xl border border-forest-700 bg-forest-950/50 focus-within:border-gold-400">
                <div className="flex items-center gap-1.5 border-b border-forest-800 px-3 py-2">
                  <button onMouseDown={(e) => { e.preventDefault(); document.execCommand("bold"); setBioText(bioRef.current?.innerHTML ?? ""); }} className="grid h-8 w-8 place-items-center rounded-md border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300" title="Bold"><b className="text-xs">B</b></button>
                  <button onMouseDown={(e) => { e.preventDefault(); document.execCommand("italic"); setBioText(bioRef.current?.innerHTML ?? ""); }} className="grid h-8 w-8 place-items-center rounded-md border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300" title="Italic"><i className="text-xs">I</i></button>
                  <button onMouseDown={(e) => { e.preventDefault(); document.execCommand("insertUnorderedList"); setBioText(bioRef.current?.innerHTML ?? ""); }} className="grid h-8 w-8 place-items-center rounded-md border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300" title="Bullets"><span className="text-xs">•≡</span></button>
                  <span className={`ml-auto font-mono text-[8.5px] ${bioText.replace(/<[^>]*>/g, "").length >= 100 ? "text-kapha-300" : "text-sand-200/35"}`}>{bioText.replace(/<[^>]*>/g, "").length} / 100 chars</span>
                </div>
                <div ref={bioRef} contentEditable data-placeholder="Your healing philosophy, lineage and approach…"
                  onInput={() => { setBioText(bioRef.current?.innerHTML ?? ""); patch({ bioHtml: bioRef.current?.innerHTML ?? "" }); }}
                  className="editor-surface min-h-[140px] p-4 text-[14px] leading-relaxed text-sand-200/90" />
              </div>
            </div>
            <div><label className={lbl}>Digital signature <Hint text="Used on generated prescriptions." /></label><SignaturePad value={profile.signature} onChange={(d) => patch({ signature: d })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={lbl}>YouTube</label><input value={profile.socials.youtube} onChange={(e) => patch({ socials: { ...profile.socials, youtube: e.target.value } })} className={inp} /></div>
              <div><label className={lbl}>Instagram</label><input value={profile.socials.instagram} onChange={(e) => patch({ socials: { ...profile.socials, instagram: e.target.value } })} className={inp} /></div>
              <div><label className={lbl}>LinkedIn</label><input value={profile.socials.linkedin} onChange={(e) => patch({ socials: { ...profile.socials, linkedin: e.target.value } })} className={inp} /></div>
              <div><label className={lbl}>Website</label><input value={profile.socials.website} onChange={(e) => patch({ socials: { ...profile.socials, website: e.target.value } })} className={inp} /></div>
            </div>
          </div>
        )}

        {tab === "payouts" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={lbl}>Bank account name</label><input value={profile.accountName} onChange={(e) => patch({ accountName: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Account number <Hint text="Masked after entry for security." /></label><input value={profile.accountNumber} onChange={(e) => patch({ accountNumber: e.target.value.replace(/\D/g, "") })} placeholder={maskedAccount || "XXXXXXXXXXXX1234"} className={inp} /></div>
              <div><label className={lbl}>IFSC code</label><input value={profile.ifsc} onChange={(e) => patch({ ifsc: e.target.value.toUpperCase() })} placeholder="SBIN0001234" className={inp} /></div>
              <div><label className={lbl}>UPI ID (quick payouts)</label><input value={profile.upi} onChange={(e) => patch({ upi: e.target.value })} placeholder="yourname@upi" className={inp} /></div>
            </div>
            {profile.ifsc && <p className="rounded-lg border border-kapha-500/40 bg-kapha-500/8 px-4 py-3 text-[12px] text-kapha-300">IFSC accepted — branch will be verified at first payout. <span className="font-mono">{profile.bankName || profile.ifsc}</span></p>}
          </div>
        )}
      </div>
      <span className="hidden"><Pen size={0} /><Leaf size={0} /></span>
    </div>
  );
}
