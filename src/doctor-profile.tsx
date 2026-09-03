import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useApp, readImageFile, type StudioUser } from "./lib";
import { Check, Close, Plus, Trash, Upload, Camera, Help, SealCheck, Clock, Person, Bank, Globe, Youtube, Instagram, LinkedIn, Pen, Lock } from "./icons";

/* --------------------------------- model ----------------------------------- */

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
  certificateData: string;
  degrees: Degree[];
  specialty: string;
  subSpecialties: string[];
  experienceYears: string;
  verificationStatus: "pending" | "verified" | "rejected";
  clinicName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  mapsUrl: string;
  modes: { video: boolean; audio: boolean; clinic: boolean };
  fees: { video: string; audio: string; clinic: string };
  schedule: Record<Day, DaySchedule>;
  bioHtml: string;
  signature: string;
  socials: { youtube: string; instagram: string; linkedin: string; website: string };
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  upi: string;
  listed: boolean;
  available: boolean;
  updatedAt: string;
}

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = (() => {
  const t: string[] = [];
  for (let h = 6; h <= 22; h++) { t.push(`${String(h).padStart(2, "0")}:00`); if (h < 22) t.push(`${String(h).padStart(2, "0")}:30`); }
  return t;
})();

const LANGUAGES = ["Hindi", "English", "Sanskrit", "Marathi", "Gujarati", "Kannada", "Tamil", "Telugu", "Bengali", "Malayalam", "Punjabi"];
const COUNCILS = [
  "NCISM — National Commission for Indian System of Medicine",
  "CCIM (legacy registration)",
  "Maharashtra State Ayurvedic Board",
  "Karnataka Ayurvedic & Unani Board",
  "Gujarat Board of Indian Medicine",
  "Uttar Pradesh Ayurvedic Council",
  "Kerala Ayurveda Council",
  "Rajasthan Ayurved Medical Council",
  "Other State Board",
];
const SPECIALTIES = [
  "Kayachikitsa (General Medicine)", "Panchakarma (Detox & Purification)", "Shalya Tantra (Surgery)",
  "Shalakya Tantra (ENT & Ophthalmology)", "Stri Roga & Prasuti Tantra (Gynaecology)", "Kaumarbhritya (Paediatrics)",
  "Agada Tantra (Toxicology)", "Rasayana & Vajikarana (Rejuvenation)", "Swasthavritta (Preventive Medicine)",
];
const SUB_SPECIALTIES = [
  "Joint Care", "Skin Disorders", "Gut Health", "Nadi Pariksha", "Women's Health", "Diabetes (Prameha)",
  "Sleep Disorders", "Hair & Scalp", "Respiratory Care", "Stress & Mind", "Infertility", "Post-partum Care",
  "Geriatric Care", "Sports Injuries", "Liver Disorders",
];
const DEGREE_OPTIONS = ["BAMS", "MD (Ayu)", "MS (Ayu)", "MPH", "PhD (Ayurveda)", "Diploma in Panchakarma", "Diploma in Ksharasutra"];
const COUNTRY_CODES = ["+91", "+971", "+44", "+1", "+61", "+65"];

function defaultSchedule(): Record<Day, DaySchedule> {
  return {
    Mon: { enabled: true, slots: [{ from: "10:00", to: "14:00" }, { from: "17:00", to: "20:00" }] },
    Tue: { enabled: true, slots: [{ from: "10:00", to: "14:00" }, { from: "17:00", to: "20:00" }] },
    Wed: { enabled: true, slots: [{ from: "10:00", to: "14:00" }, { from: "17:00", to: "20:00" }] },
    Thu: { enabled: true, slots: [{ from: "10:00", to: "14:00" }, { from: "17:00", to: "20:00" }] },
    Fri: { enabled: true, slots: [{ from: "10:00", to: "14:00" }, { from: "17:00", to: "20:00" }] },
    Sat: { enabled: true, slots: [{ from: "10:00", to: "13:00" }] },
    Sun: { enabled: false, slots: [{ from: "10:00", to: "13:00" }] },
  };
}

function blankProfile(u: StudioUser): DoctorProfile {
  return {
    userId: u.id, photo: "", prefix: "Dr.", fullName: u.name, countryCode: "+91", mobile: "", mobileVerified: false,
    whatsappSame: true, whatsapp: "", email: `${u.username}@vaidyagan.in`, languages: ["Hindi", "English"],
    registrationNumber: "", council: "", certificateName: "", certificateData: "",
    degrees: [], specialty: "", subSpecialties: [], experienceYears: "",
    verificationStatus: "pending",
    clinicName: "", street: "", city: "", state: "", zip: "", mapsUrl: "",
    modes: { video: true, audio: true, clinic: true },
    fees: { video: "700", audio: "500", clinic: "600" },
    schedule: defaultSchedule(),
    bioHtml: "", signature: "",
    socials: { youtube: "", instagram: "", linkedin: "", website: "" },
    bankName: "", accountName: u.name, accountNumber: "", ifsc: "", upi: "",
    listed: true, available: true,
    updatedAt: new Date().toISOString(),
  };
}

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

export function profileFor(userId: string): DoctorProfile | null {
  return loadAll()[userId] ?? null;
}

function saveProfileRecord(p: DoctorProfile) {
  const map = loadAll();
  map[p.userId] = { ...p, updatedAt: new Date().toISOString() };
  persistAll(map);
}

export function isDoctorListed(userId: string): boolean {
  const p = profileFor(userId);
  return p ? p.listed : true; // unedited profiles stay visible
}

/* ---------------------------- completion engine ----------------------------- */

interface CheckGroup { id: string; label: string; tab: number; ok: boolean; hint: string }

function computeChecks(p: DoctorProfile): CheckGroup[] {
  const anyMode = p.modes.video || p.modes.audio || p.modes.clinic;
  const feesOk = (!p.modes.video || !!p.fees.video) && (!p.modes.audio || !!p.fees.audio) && (!p.modes.clinic || !!p.fees.clinic);
  const scheduleOk = DAYS.some((d) => p.schedule[d].enabled);
  const bioText = p.bioHtml.replace(/<[^>]*>/g, "").trim();
  return [
    { id: "photo", tab: 0, label: "Profile photo", ok: !!p.photo, hint: "Patients trust a clear, professional photo." },
    { id: "otp", tab: 0, label: "Mobile number verified", ok: p.mobileVerified, hint: "OTP-verify your mobile to receive booking alerts." },
    { id: "lang", tab: 0, label: "Languages selected", ok: p.languages.length > 0, hint: "Pick every language you consult in." },
    { id: "reg", tab: 1, label: "Registration number", ok: !!p.registrationNumber.trim(), hint: "Your NCISM / State Board number — required for the verified badge." },
    { id: "council", tab: 1, label: "Registration council", ok: !!p.council, hint: "The authority that issued your registration." },
    { id: "cert", tab: 1, label: "Certificate uploaded", ok: !!p.certificateData, hint: "PDF or photo of your registration certificate." },
    { id: "deg", tab: 1, label: "At least one degree", ok: p.degrees.length > 0, hint: "Add BAMS first, then post-graduations." },
    { id: "spec", tab: 1, label: "Primary specialty", ok: !!p.specialty, hint: "Your main branch of practice." },
    { id: "exp", tab: 1, label: "Years of experience", ok: !!p.experienceYears, hint: "Total clinical years since BAMS." },
    { id: "clinic", tab: 2, label: "Clinic name & city", ok: !!p.clinicName.trim() && !!p.city.trim(), hint: "Where patients can visit you." },
    { id: "modes", tab: 2, label: "Consultation modes & fees", ok: anyMode && feesOk, hint: "Enable at least one mode and set its fee." },
    { id: "sched", tab: 2, label: "Weekly availability", ok: scheduleOk, hint: "Mark at least one consulting day." },
    { id: "bio", tab: 3, label: "Public bio (100+ characters)", ok: bioText.length >= 100, hint: "Your parampara, philosophy and approach." },
    { id: "sign", tab: 3, label: "Digital signature", ok: !!p.signature, hint: "Used on generated prescriptions." },
    { id: "bank", tab: 4, label: "Payout details", ok: (!!p.accountNumber && !!p.ifsc) || !!p.upi, hint: "Bank + IFSC, or a UPI ID." },
  ];
}

/* ------------------------------ small fragments ----------------------------- */

function Hint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex" tabIndex={0} aria-label={text}>
      <Help size={13} className="cursor-help text-sand-200/35 transition-colors group-hover:text-gold-300 group-focus:text-gold-300" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-56 -translate-x-1/2 rounded-lg border border-gold-500/40 bg-forest-950 px-3.5 py-2.5 text-[11.5px] font-body normal-case leading-snug tracking-normal text-sand-200/90 opacity-0 shadow-[0_14px_40px_rgba(0,0,0,0.5)] transition-all duration-200 group-hover:opacity-100 group-focus:opacity-100">
        {text}
        <span className="absolute left-1/2 top-full -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-gold-500/40 bg-forest-950" />
      </span>
    </span>
  );
}

function L({ label, hint, req, ok, children }: { label: string; hint?: string; req?: boolean; ok?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/85">
        {label}
        {req && <span className="text-pitta-400">*</span>}
        {hint && <Hint text={hint} />}
        {ok && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto grid h-4 w-4 place-items-center rounded-full bg-[#5f947e]/25 text-[#82b39e]">
            <Check size={10} />
          </motion.span>
        )}
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

function Toggle({ on, onChange, label, desc, disabled }: { on: boolean; onChange: (b: boolean) => void; label: string; desc?: string; disabled?: boolean }) {
  return (
    <button role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-3.5 text-left transition-all duration-300 ${disabled ? "cursor-not-allowed opacity-50" : ""} ${
        on ? "border-[#5f947e]/50 bg-[#5f947e]/8" : "border-forest-700 bg-forest-950/40 hover:border-forest-600"
      }`}>
      <span className="min-w-0">
        <span className={`block text-[13.5px] font-semibold ${on ? "text-sand-100" : "text-sand-200/70"}`}>{label}</span>
        {desc && <span className="mt-0.5 block text-[11.5px] leading-snug text-sand-200/45">{desc}</span>}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-[#5f947e]" : "bg-forest-700"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-sand-100 shadow transition-all duration-300 ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

function cropSquare(file: File, cb: (dataUrl: string) => void, err: (m: string) => void) {
  if (!file.type.startsWith("image/")) { err("Please choose an image file (PNG or JPG)"); return; }
  if (file.size > 4 * 1024 * 1024) { err("Keep the photo under 4 MB"); return; }
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
    const c = document.createElement("canvas");
    c.width = 480; c.height = 480;
    const ctx = c.getContext("2d");
    if (!ctx) { err("Could not process the image"); return; }
    ctx.drawImage(img, sx, sy, side, side, 0, 0, 480, 480);
    URL.revokeObjectURL(url);
    cb(c.toDataURL("image/jpeg", 0.85));
  };
  img.onerror = () => err("Could not read that image — try another");
  img.src = url;
}

/* ------------------------------ signature pad ------------------------------- */

function SignaturePad({ value, onChange }: { value: string; onChange: (dataUrl: string) => void }) {
  const { toast } = useApp();
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
    const p = pos(e);
    ctx?.beginPath(); ctx?.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d");
    const p = pos(e);
    ctx?.lineTo(p.x, p.y); ctx?.stroke();
  };
  const up = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(e.currentTarget.toDataURL("image/png"));
  };
  const clear = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.fillStyle = "#0f1a13";
    ctx.fillRect(0, 0, 640, 200);
    onChange("");
  };

  return (
    <div>
      <canvas ref={canvasRef}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        className="w-full cursor-crosshair touch-none rounded-xl border border-dashed border-forest-600 bg-forest-900"
        style={{ aspectRatio: "640 / 200" }}
        aria-label="Signature pad — draw with your mouse or finger" />
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <button onClick={clear} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-pitta-400 hover:text-pitta-300">
          <Close size={12} /> Clear
        </button>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 transition-all hover:border-gold-400 hover:text-gold-300">
          <Upload size={12} /> Upload signature image
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              const r = new FileReader();
              r.onload = () => { onChange(String(r.result)); toast("Signature image attached"); };
              r.readAsDataURL(f);
            }
            e.target.value = "";
          }} />
        </label>
        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/35">
          {value ? "Signature saved ✓" : "Draw with mouse or finger"}
        </span>
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
              <Toggle on={day.enabled} onChange={(b) => set(d, { enabled: b })} label={day.enabled ? "Consulting" : "Closed"} />
            </div>
            {day.enabled && (
              <div className="space-y-2 border-t border-forest-800/70 px-4 py-3">
                {day.slots.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select value={s.from} onChange={(e) => { const slots = [...day.slots]; slots[i] = { ...s, from: e.target.value }; set(d, { slots }); }} className="rounded-lg border border-forest-700 bg-forest-950/70 px-3 py-2 font-mono text-xs text-sand-100 focus:border-gold-400 focus:outline-none" aria-label={`${d} slot ${i + 1} start`}>
                      {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="text-sand-200/40">→</span>
                    <select value={s.to} onChange={(e) => { const slots = [...day.slots]; slots[i] = { ...s, to: e.target.value }; set(d, { slots }); }} className="rounded-lg border border-forest-700 bg-forest-950/70 px-3 py-2 font-mono text-xs text-sand-100 focus:border-gold-400 focus:outline-none" aria-label={`${d} slot ${i + 1} end`}>
                      {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {day.slots.length > 1 && (
                      <button onClick={() => set(d, { slots: day.slots.filter((_, x) => x !== i) })} className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200/40 hover:border-pitta-400 hover:text-pitta-300" aria-label={`Remove ${d} slot ${i + 1}`}>
                        <Trash size={13} />
                      </button>
                    )}
                  </div>
                ))}
                {day.slots.length < 3 && (
                  <button onClick={() => set(d, { slots: [...day.slots, { from: "17:00", to: "20:00" }] })} className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-400/80 hover:text-gold-300">
                    <Plus size={12} /> Add another time slot
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- main dashboard ------------------------------ */

const TABS = [
  { label: "Identity", icon: Person, hint: "Photo, contact & languages" },
  { label: "Verification", icon: SealCheck, hint: "Registration & degrees" },
  { label: "Clinic & Tele", icon: Clock, hint: "Practice setup & fees" },
  { label: "Bio & Brand", icon: Pen, hint: "Your story & signature" },
  { label: "Payouts", icon: Bank, hint: "Banking & UPI" },
];

export function DoctorProfileTab({ member, onHideTab }: { member: StudioUser; onHideTab?: () => void }) {
  const { toast } = useApp();
  const [profile, setProfile] = useState<DoctorProfile>(() => {
    const existing = profileFor(member.id);
    if (existing) return existing;
    const fresh = blankProfile(member);
    if (member.id === "root") {
      Object.assign(fresh, {
        registrationNumber: "MAH-AYU-14-008821",
        council: "Maharashtra State Ayurvedic Board",
        certificateName: "state-board-certificate.pdf",
        certificateData: "seeded",
        degrees: [
          { id: "d1", degree: "BAMS", university: "R.A. Podar Ayurved Medical College, Mumbai", year: "2009" },
          { id: "d2", degree: "MD (Ayu)", university: "Tilak Ayurved Mahavidyalaya, Pune", year: "2014" },
        ],
        specialty: "Kayachikitsa (General Medicine)",
        subSpecialties: ["Gut Health", "Joint Care", "Nadi Pariksha"],
        experienceYears: "16",
        verificationStatus: "verified",
        clinicName: "Vaidyagan Clinic, Kothrud",
        city: "Pune", state: "Maharashtra", zip: "411038",
        bioHtml: "<p>Sixteen years of OPD practice rooted in <b>classical Kayachikitsa</b> — with the patience of the texts and the rigour of modern records.</p>",
      });
    }
    return fresh;
  });
  const [tab, setTab] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [otp, setOtp] = useState<{ sent: boolean; code: string; input: string }>({ sent: false, code: "", input: "" });
  const [dropHot, setDropHot] = useState(false);
  const [blueprint, setBlueprint] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const bioRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<number>(0);

  const patch = useCallback((part: Partial<DoctorProfile>) => {
    setProfile((p) => ({ ...p, ...part }));
    setDirty(true);
  }, []);

  const doSave = useCallback((silent = false) => {
    saveProfileRecord(profile);
    setDirty(false);
    setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    if (!silent) toast("Profile saved");
  }, [profile, toast]);

  /* gentle auto-save */
  useEffect(() => {
    if (!dirty) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveProfileRecord(profile);
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 1400);
    return () => window.clearTimeout(saveTimer.current);
  }, [profile, dirty]);

  useEffect(() => {
    if (bioRef.current && bioRef.current.innerHTML !== profile.bioHtml) {
      bioRef.current.innerHTML = profile.bioHtml;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  const checks = computeChecks(profile);
  const pct = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const nextIncomplete = checks.findIndex((c) => !c.ok);
  const isSuper = member.role === "superadmin";
  const words = Math.max(0, profile.bioHtml.replace(/<[^>]*>/g, " ").trim().length);

  const setFile = (f: File | null) => {
    if (!f) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) { toast("Upload a PDF or image (JPG/PNG)"); return; }
    if (f.size > 1.8 * 1024 * 1024) { toast("Keep the certificate under 1.8 MB for the demo"); return; }
    const r = new FileReader();
    r.onload = () => { patch({ certificateName: f.name, certificateData: String(r.result) }); toast("Certificate attached — sent for admin review"); };
    r.readAsDataURL(f);
  };

  const sendOtp = () => {
    if (profile.mobile.replace(/\D/g, "").length < 8) { toast("Enter your mobile number first"); return; }
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setOtp({ sent: true, code, input: "" });
    toast(`OTP sent to ${profile.countryCode} ${profile.mobile} (demo code: ${code})`);
  };
  const verifyOtp = () => {
    if (otp.input !== otp.code) { toast("That code doesn't match — try again"); return; }
    patch({ mobileVerified: true });
    setOtp({ sent: false, code: "", input: "" });
    toast("Mobile number verified ✓");
  };

  const fetchIfsc = () => {
    const code = profile.ifsc.trim().toUpperCase();
    if (code.length < 4) { toast("Enter the full IFSC code first (e.g. SBIN0001234)"); return; }
    const banks: [string, string][] = [["SBIN", "State Bank of India"], ["HDFC", "HDFC Bank"], ["ICIC", "ICICI Bank"], ["AXIS", "Axis Bank"], ["PUNB", "Punjab National Bank"], ["KKBK", "Kotak Mahindra Bank"]];
    const hit = banks.find(([k]) => code.startsWith(k));
    if (hit) { patch({ bankName: hit[1] }); toast(`Branch found — ${hit[1]}`); }
    else { patch({ bankName: "Verified at payout time" }); toast("IFSC accepted — branch will confirm at payout"); }
  };

  const input = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";

  function setFile2(f: File | null) {
    if (!f) return;
    cropSquare(f, (u) => { patch({ photo: u }); toast("Photo cropped to square & attached"); }, (m) => toast(m));
  }

  return (
    <div>
      {/* header + completion meter */}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Practice management · {profile.prefix} {profile.fullName}</p>
          <h3 className="mt-1.5 font-display text-2xl font-semibold text-sand-100">Your doctor profile & practice</h3>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-sand-200/55">
            Everything patients see and everything payments need — filled in five short steps.
            Changes <b className="text-sand-200/80">save automatically</b> as you type.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] ${
            profile.verificationStatus === "verified" ? "border-[#5f947e]/60 bg-[#5f947e]/12 text-[#a9cfbf]"
            : profile.verificationStatus === "rejected" ? "border-pitta-400/60 bg-pitta-500/10 text-pitta-300"
            : "border-gold-500/50 bg-gold-400/8 text-gold-300"
          }`}>
            {profile.verificationStatus === "verified" ? <><SealCheck size={14} /> Clinically Verified</>
              : profile.verificationStatus === "rejected" ? <><Close size={13} /> Verification rejected</>
              : <><Clock size={13} /> Verification pending</>}
          </div>
          <div className={`flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] ${
            !profile.listed ? "border-forest-600 bg-forest-800/60 text-sand-200/55"
            : profile.available ? "border-[#5f947e]/60 bg-[#5f947e]/12 text-[#a9cfbf]" : "border-gold-500/50 bg-gold-400/8 text-gold-300"
          }`}>
            <span className={`h-2 w-2 rounded-full ${!profile.listed ? "bg-sand-200/40" : profile.available ? "animate-pulse bg-[#82b39e]" : "bg-gold-400"}`} />
            {!profile.listed ? "Hidden from website" : profile.available ? "Live · accepting patients" : "Live · bookings paused"}
          </div>
          {onHideTab && (
            <button onClick={onHideTab} className="rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/55 hover:border-pitta-400 hover:text-pitta-300">
              Hide this tab
            </button>
          )}
        </div>
      </div>

      {/* visibility & availability switches */}
      <div className="mt-5 grid gap-3 rounded-xl border border-forest-800 bg-forest-900/60 p-4 lg:grid-cols-2">
        <Toggle on={profile.listed} onChange={(b) => { patch({ listed: b }); saveProfileRecord({ ...profile, listed: b }); toast(b ? "You are visible on the Vaidyagan website again" : "Your page is hidden from the website"); }}
          label="Show me on the Vaidyagan website"
          desc={profile.listed ? "Your card is visible in the public Doctor's Corner." : "You are hidden from the website right now — patients cannot find you."} />
        <Toggle on={profile.available} onChange={(b) => patch({ available: b })}
          label="Accepting new patients"
          desc={profile.available ? "New consultations can be booked with you." : "Bookings are paused — switch back on whenever you're ready."} />
      </div>

      {/* completion meter */}
      <div className="mt-5 rounded-xl border border-forest-800 bg-forest-900/60 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[13px] font-semibold text-sand-100">
            Profile {pct}% complete
            {pct < 100 && nextIncomplete >= 0 && (
              <span className="ml-2 hidden font-normal text-sand-200/50 sm:inline">· next: {checks[nextIncomplete].label.toLowerCase()}</span>
            )}
            {pct === 100 && <span className="ml-2 font-normal text-[#a9cfbf]">· ready for public booking ✓</span>}
          </p>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/40">{checks.filter((c) => c.ok).length}/{checks.length} steps</span>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-forest-800">
          <div className="h-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-[#82b39e] transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* stepper */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t, i) => {
          const Icon = t.icon;
          const g = checks.filter((c) => c.tab === i);
          const tabOk = g.length > 0 && g.every((c) => c.ok);
          return (
            <button key={t.label} onClick={() => setTab(i)}
              className={`group flex shrink-0 items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-all duration-300 ${tab === i ? "border-gold-500/60 bg-gold-400/10" : "border-forest-800 bg-forest-900/50 hover:border-forest-600"}`}>
              <span className={`grid h-8 w-8 place-items-center rounded-lg ${tab === i ? "bg-gold-400 text-forest-950" : tabOk ? "bg-[#5f947e]/25 text-[#82b39e]" : "bg-forest-800 text-sand-200/60"}`}>
                {tabOk ? <Check size={15} /> : <Icon size={15} />}
              </span>
              <span>
                <span className={`block font-mono text-[10px] uppercase tracking-[0.14em] ${tab === i ? "text-gold-300" : "text-sand-200/70"}`}>{i + 1}. {t.label}</span>
                <span className="hidden text-[10.5px] text-sand-200/40 md:block">{t.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* tab body */}
      <div className="mt-5 space-y-5">
        <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-5">
          {tab === 0 && (
            <SectionCard title="Photo & identity" sub="This is how patients recognise you across the journal, doctor's corner and booking pages.">
              <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDropHot(true); }}
                  onDragLeave={() => setDropHot(false)}
                  onDrop={(e) => { e.preventDefault(); setDropHot(false); setFile2(e.dataTransfer.files?.[0] ?? null); }}
                  className={`relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${dropHot ? "border-gold-300 bg-gold-400/10" : "border-forest-600 bg-forest-950/50"}`}
                >
                  {profile.photo ? (
                    <>
                      <img src={profile.photo} alt="Profile" className="absolute inset-0 h-full w-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-forest-950/80 py-2 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-gold-300 backdrop-blur">Drop a new photo to replace</span>
                    </>
                  ) : (
                    <>
                      <Camera size={26} className="text-gold-400/70" />
                      <p className="mt-2 px-4 text-center font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/50">Drop photo here<br />or</p>
                    </>
                  )}
                  <label className={`${profile.photo ? "absolute inset-0 cursor-pointer" : "mt-2 cursor-pointer rounded-full border border-gold-500/60 px-4 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-300 hover:bg-gold-400 hover:text-forest-950"}`}>
                    {profile.photo ? "" : "Browse files"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { setFile2(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                  </label>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
                    <L label="Title" ok={!!profile.prefix}>
                      <select value={profile.prefix} onChange={(e) => patch({ prefix: e.target.value as DoctorProfile["prefix"] })} className={input}>
                        <option value="Dr.">Dr.</option><option value="Vaidya">Vaidya</option><option value="Prof.">Prof.</option>
                      </select>
                    </L>
                    <L label="Full name" hint="Pre-filled from your login. Edit only to fix a spelling." ok={!!profile.fullName}>
                      <input value={profile.fullName} onChange={(e) => patch({ fullName: e.target.value })} className={input} />
                    </L>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[110px_1fr_auto]">
                    <L label="Code">
                      <select value={profile.countryCode} onChange={(e) => patch({ countryCode: e.target.value, mobileVerified: false })} className={input}>
                        {COUNTRY_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </L>
                    <L label="Mobile number" req ok={profile.mobileVerified} hint="OTP-verified numbers receive booking alerts.">
                      <input value={profile.mobile} onChange={(e) => patch({ mobile: e.target.value.replace(/[^\d ]/g, ""), mobileVerified: false })} placeholder="98220 12345" inputMode="tel" className={input} />
                    </L>
                    <div className="flex items-end">
                      {profile.mobileVerified ? (
                        <span className="flex items-center gap-1.5 rounded-lg border border-[#5f947e]/50 bg-[#5f947e]/10 px-4 py-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#a9cfbf]"><SealCheck size={13} /> Verified</span>
                      ) : (
                        <button onClick={sendOtp} disabled={profile.mobile.trim().length < 8} className="rounded-lg bg-gold-400 px-4 py-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-forest-950 transition-all hover:bg-gold-300 disabled:opacity-35">Send OTP</button>
                      )}
                    </div>
                  </div>
                  {otp.sent && (
                    <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-gold-500/40 bg-gold-400/6 p-3.5">
                      <span className="text-xs text-sand-200/70">Enter the 4-digit code <b className="font-mono text-gold-300">{otp.code}</b> (shown for demo):</span>
                      <input value={otp.input} onChange={(e) => setOtp({ ...otp, input: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="••••" inputMode="numeric" className="w-24 rounded-lg border border-forest-700 bg-forest-950/70 px-3 py-2 text-center font-mono text-lg tracking-[0.4em] text-sand-100 focus:border-gold-400 focus:outline-none" />
                      <button onClick={verifyOtp} className="rounded-lg bg-[#5f947e] px-4 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-[#82b39e]">Verify</button>
                    </div>
                  )}
                  <div className="space-y-3">
                    <Toggle on={profile.whatsappSame} onChange={(b) => patch({ whatsappSame: b, whatsapp: b ? profile.mobile : profile.whatsapp })} label="WhatsApp is the same as my mobile number" desc="Patients may reach you on WhatsApp for reports and follow-ups." />
                    {!profile.whatsappSame && (
                      <L label="WhatsApp number"><input value={profile.whatsapp} onChange={(e) => patch({ whatsapp: e.target.value })} placeholder="+91 …" className={input} /></L>
                    )}
                  </div>
                  <L label="Email" hint="Your verified login email — contact support to change it.">
                    <div className="flex items-center gap-2.5 rounded-lg border border-forest-800 bg-forest-950/40 px-3.5 py-3">
                      <span className="flex-1 text-[15px] text-sand-200/60">{profile.email}</span>
                      <span className="flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#a9cfbf]"><Lock size={11} /> Read-only · verified</span>
                    </div>
                  </L>
                  <L label="Languages you consult in" hint="Tap to toggle — patients filter doctors by language." ok={profile.languages.length > 0}>
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
            <SectionCard title="Clinical verification" sub="Vaidyagan's promise is 'Clinically Verified'. These details are reviewed by our team before the green badge appears on your public page.">
              <div className="grid gap-4 sm:grid-cols-2">
                <L label="Registration number" req ok={!!profile.registrationNumber.trim()} hint="NCISM or State Board registration number, exactly as printed.">
                  <input value={profile.registrationNumber} onChange={(e) => patch({ registrationNumber: e.target.value.toUpperCase() })} placeholder="e.g. MAH-AYU-14-008821" className={input} />
                </L>
                <L label="Registration council" req ok={!!profile.council}>
                  <select value={profile.council} onChange={(e) => patch({ council: e.target.value })} className={input}>
                    <option value="">Select council…</option>
                    {COUNCILS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </L>
              </div>
              <div className="mt-5">
                <L label="Registration certificate" req ok={!!profile.certificateData} hint="PDF or clear photo. Reviewed privately by the admin team — never shown to patients.">
                  {profile.certificateData ? (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#5f947e]/45 bg-[#5f947e]/8 px-4 py-3.5">
                      <SealCheck size={18} className="text-[#82b39e]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-sand-100">{profile.certificateName}</p>
                        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#a9cfbf]">Uploaded · in review queue</p>
                      </div>
                      <button onClick={() => patch({ certificateName: "", certificateData: "" })} className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/50 hover:text-pitta-300">Replace</button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-forest-600 py-8 transition-all hover:border-gold-400">
                      <Upload size={20} className="text-gold-400/70" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/55">Click to upload PDF / JPG</span>
                      <span className="text-[11px] text-sand-200/35">Max 1.8 MB in the demo</span>
                      <input type="file" accept=".pdf,image/jpeg,image/png" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                    </label>
                  )}
                </L>
              </div>
              <div className="mt-5">
                <L label="Degrees & qualifications" req ok={profile.degrees.length > 0} hint="Add every degree — BAMS, MD, MS, PhD, diplomas.">
                  <div className="space-y-2.5">
                    {profile.degrees.map((d) => (
                      <div key={d.id} className="grid gap-2 rounded-xl border border-forest-800 bg-forest-950/40 p-3 sm:grid-cols-[150px_1fr_110px_auto]">
                        <select value={d.degree} onChange={(e) => patch({ degrees: profile.degrees.map((x) => x.id === d.id ? { ...x, degree: e.target.value } : x) })} className={input}>
                          {DEGREE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <input value={d.university} onChange={(e) => patch({ degrees: profile.degrees.map((x) => x.id === d.id ? { ...x, university: e.target.value } : x) })} placeholder="University / college" className={input} />
                        <input value={d.year} onChange={(e) => patch({ degrees: profile.degrees.map((x) => x.id === d.id ? { ...x, year: e.target.value.replace(/\D/g, "").slice(0, 4) } : x) })} placeholder="Year" inputMode="numeric" className={input} />
                        <button onClick={() => patch({ degrees: profile.degrees.filter((x) => x.id !== d.id) })} className="grid h-11 w-11 place-items-center justify-self-start rounded-lg border border-forest-700 text-sand-200/40 hover:border-pitta-400 hover:text-pitta-300 sm:justify-self-auto" aria-label="Remove degree">
                          <Trash size={15} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => patch({ degrees: [...profile.degrees, { id: `d${Date.now()}`, degree: "BAMS", university: "", year: "" }] })}
                      className="flex items-center gap-2 rounded-xl border border-dashed border-gold-500/50 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 transition-all hover:bg-gold-400/10">
                      <Plus size={14} /> Add degree
                    </button>
                  </div>
                </L>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <L label="Primary specialty" req ok={!!profile.specialty} hint="Your main branch of Ayurvedic practice.">
                  <select value={profile.specialty} onChange={(e) => patch({ specialty: e.target.value })} className={input}>
                    <option value="">Select…</option>
                    {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </L>
                <L label="Years of experience" req ok={!!profile.experienceYears}>
                  <input value={profile.experienceYears} onChange={(e) => patch({ experienceYears: e.target.value.replace(/\D/g, "").slice(0, 2) })} placeholder="e.g. 12" inputMode="numeric" className={input} />
                </L>
                <div>
                  <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/85">Sub-specialties <Hint text="Tap all that apply — these power the symptom-to-doctor matching." /></span>
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
              <div className={`mt-6 rounded-xl border p-5 ${profile.verificationStatus === "verified" ? "border-[#5f947e]/50 bg-[#5f947e]/8" : profile.verificationStatus === "rejected" ? "border-pitta-400/50 bg-pitta-500/8" : "border-gold-500/40 bg-gold-400/5"}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={`font-mono text-[9.5px] uppercase tracking-[0.22em] ${profile.verificationStatus === "verified" ? "text-[#a9cfbf]" : profile.verificationStatus === "rejected" ? "text-pitta-300" : "text-gold-300"}`}>
                      {profile.verificationStatus === "verified" ? "Status: verified — the green badge is live on your page"
                        : profile.verificationStatus === "rejected" ? "Status: rejected — re-upload a clearer certificate to reapply"
                        : "Status: pending admin review (usually within 48 hours)"}
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-sand-200/55">
                      {profile.verificationStatus === "verified"
                        ? "Patients see the 'Clinically Verified' seal beside your name on every essay and the booking page."
                        : "Complete registration number, council and certificate to enter the review queue."}
                    </p>
                  </div>
                  {isSuper && profile.verificationStatus !== "verified" && (
                    <div className="flex gap-2">
                      <button onClick={() => { patch({ verificationStatus: "verified" }); toast(`${profile.fullName} marked Clinically Verified ✓`); }} className="flex items-center gap-1.5 rounded-full bg-[#5f947e] px-5 py-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-[#82b39e]">
                        <SealCheck size={13} /> Approve
                      </button>
                      <button onClick={() => { patch({ verificationStatus: "rejected" }); toast("Marked for re-submission"); }} className="rounded-full border border-pitta-400/60 px-5 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-pitta-300 hover:bg-pitta-500/15">Reject</button>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          )}

          {tab === 2 && (
            <>
              <SectionCard title="Clinic & tele-consultation" sub="Where patients can meet you — in person or online — and what each consultation costs.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <L label="Clinic name" ok={!!profile.clinicName.trim()}><input value={profile.clinicName} onChange={(e) => patch({ clinicName: e.target.value })} placeholder="e.g. Vaidyagan Clinic, Kothrud" className={input} /></L>
                  <L label="Google Maps link" hint="Paste your clinic's Maps URL so patients get one-tap directions."><input value={profile.mapsUrl} onChange={(e) => patch({ mapsUrl: e.target.value })} placeholder="https://maps.app.goo.gl/…" className={input} /></L>
                  <div className="sm:col-span-2"><L label="Street address"><input value={profile.street} onChange={(e) => patch({ street: e.target.value })} placeholder="Shop / building, street, landmark" className={input} /></L></div>
                  <div className="grid grid-cols-3 gap-3 sm:col-span-2">
                    <L label="City" ok={!!profile.city.trim()}><input value={profile.city} onChange={(e) => patch({ city: e.target.value })} placeholder="Pune" className={input} /></L>
                    <L label="State"><input value={profile.state} onChange={(e) => patch({ state: e.target.value })} placeholder="Maharashtra" className={input} /></L>
                    <L label="PIN / ZIP"><input value={profile.zip} onChange={(e) => patch({ zip: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="411038" inputMode="numeric" className={input} /></L>
                  </div>
                </div>
              </SectionCard>
              <SectionCard title="Consultation modes & fees" sub="Switch on the ways you consult. Fees appear on your public booking page — leave a fee at ₹0 for free follow-ups.">
                <div className="space-y-3">
                  {([["video", "Video consultation", "45-min video call with prescription"], ["audio", "Audio call", "20-min phone consultation"], ["clinic", "In-clinic visit", "Walk-in or booked slot at your clinic"]] as const).map(([key, label, desc]) => (
                    <div key={key} className={`rounded-xl border p-4 transition-all ${profile.modes[key] ? "border-gold-500/35 bg-gold-400/4" : "border-forest-800"}`}>
                      <Toggle on={profile.modes[key]} onChange={(b) => patch({ modes: { ...profile.modes, [key]: b } })} label={label} desc={desc} />
                      {profile.modes[key] && (
                        <div className="mt-3 flex items-center gap-3 pl-1">
                          <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/50">Fee</span>
                          <span className="text-sand-200/40">₹</span>
                          <input value={profile.fees[key]} onChange={(e) => patch({ fees: { ...profile.fees, [key]: e.target.value.replace(/\D/g, "").slice(0, 5) } })} inputMode="numeric" placeholder="700"
                            className="w-28 rounded-lg border border-forest-700 bg-forest-950/70 px-3 py-2 font-mono text-sm text-sand-100 focus:border-gold-400 focus:outline-none" />
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
                <L label="About you" hint="Your parampara (lineage), philosophy, and what patients can expect. 100+ characters unlocks the completeness step." ok={words >= 100}>
                  <div className="rounded-xl border border-forest-700 bg-forest-950/50 transition-colors focus-within:border-gold-400">
                    <div className="flex items-center gap-1.5 border-b border-forest-800 px-3 py-2" onMouseDown={(e) => e.preventDefault()}>
                      <button onClick={() => { bioRef.current?.focus(); document.execCommand("bold"); patch({ bioHtml: bioRef.current?.innerHTML ?? "" }); }} className="grid h-8 w-8 place-items-center rounded-md border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300" title="Bold"><b className="text-xs">B</b></button>
                      <button onClick={() => { bioRef.current?.focus(); document.execCommand("italic"); patch({ bioHtml: bioRef.current?.innerHTML ?? "" }); }} className="grid h-8 w-8 place-items-center rounded-md border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300" title="Italic"><i className="text-xs">I</i></button>
                      <button onClick={() => { bioRef.current?.focus(); document.execCommand("insertUnorderedList"); patch({ bioHtml: bioRef.current?.innerHTML ?? "" }); }} className="grid h-8 w-8 place-items-center rounded-md border border-forest-700 text-sand-200/70 hover:border-gold-400 hover:text-gold-300" title="Bullets"><span className="text-xs leading-none">•≡</span></button>
                      <span className={`ml-auto font-mono text-[9px] uppercase tracking-[0.14em] ${words >= 100 ? "text-[#a9cfbf]" : "text-sand-200/35"}`}>{words} / 100+ characters</span>
                    </div>
                    <div ref={bioRef} contentEditable data-placeholder="e.g. Third-generation vaidya trained in the Koteshwar shastra tradition…"
                      onInput={() => patch({ bioHtml: bioRef.current?.innerHTML ?? "" })}
                      className="editor-surface min-h-[140px] p-4 text-[15px] leading-[1.85] text-sand-200/90" />
                  </div>
                </L>
              </SectionCard>
              <SectionCard title="Digital signature" sub="Sign once — it appears on every prescription and advice note generated for your patients.">
                <L label="Draw or upload your signature" ok={!!profile.signature} hint="Use your mouse, a stylus or your finger. PNG with dark background — we adapt it for print.">
                  <SignaturePad value={profile.signature} onChange={(d) => patch({ signature: d })} />
                </L>
              </SectionCard>
              <SectionCard title="Social & web presence" sub="Optional — link your channels so patients can follow your work.">
                <div className="grid gap-4 sm:grid-cols-2">
                  {([["youtube", "YouTube channel", "https://youtube.com/@…", Youtube], ["instagram", "Instagram", "https://instagram.com/…", Instagram], ["linkedin", "LinkedIn", "https://linkedin.com/in/…", LinkedIn], ["website", "Personal website", "https://…", Globe]] as const).map(([key, label, ph, Icon]) => (
                    <L key={key} label={label} ok={!!profile.socials[key]}>
                      <div className="relative">
                        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400/70" />
                        <input value={profile.socials[key]} onChange={(e) => patch({ socials: { ...profile.socials, [key]: e.target.value } })} placeholder={ph} className={`${input} pl-10`} />
                      </div>
                    </L>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {tab === 4 && (
            <>
              <SectionCard title="Payouts & banking" sub="Where consultation fees and royalties land. Stored encrypted in production; masked here after entry.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <L label="Account holder name" ok={!!profile.accountName.trim()}><input value={profile.accountName} onChange={(e) => patch({ accountName: e.target.value })} placeholder="As per bank records" className={input} /></L>
                  <L label="Account number" ok={!!profile.accountNumber} hint="Masked after you type it — only the last 4 digits stay visible.">
                    <div className="relative">
                      <input
                        value={showAccount ? profile.accountNumber : profile.accountNumber ? `${"•".repeat(Math.max(0, profile.accountNumber.length - 4))} ${profile.accountNumber.slice(-4)}` : ""}
                        onChange={(e) => { if (!showAccount) setShowAccount(true); patch({ accountNumber: e.target.value.replace(/\D/g, "").slice(0, 18) }); }}
                        onFocus={() => setShowAccount(true)} onBlur={() => setShowAccount(false)}
                        placeholder="XXXXXXXXXXXX1234" inputMode="numeric" className={`${input} font-mono`} />
                      <button onClick={() => setShowAccount(!showAccount)} className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/45 hover:text-gold-300">
                        {showAccount ? "Hide" : "Show"}
                      </button>
                    </div>
                  </L>
                  <L label="IFSC code" ok={!!profile.ifsc} hint="Printed on your cheque book and passbook.">
                    <div className="flex gap-2">
                      <input value={profile.ifsc} onChange={(e) => patch({ ifsc: e.target.value.toUpperCase().slice(0, 11) })} placeholder="SBIN0001234" className={`${input} font-mono`} />
                      <button onClick={fetchIfsc} className="shrink-0 rounded-lg border border-gold-500/60 px-4 font-mono text-[9.5px] uppercase tracking-[0.12em] text-gold-300 transition-all hover:bg-gold-400 hover:text-forest-950">Find bank</button>
                    </div>
                  </L>
                  <L label="Bank / branch" ok={!!profile.bankName}><input value={profile.bankName} onChange={(e) => patch({ bankName: e.target.value })} placeholder="Auto-fetched from IFSC, or type it" className={input} /></L>
                </div>
                <div className="mt-5 rounded-xl border border-vata-500/30 bg-vata-500/5 p-4">
                  <L label="UPI ID (for instant payouts)" ok={!!profile.upi} hint="Used for same-day consultation payouts when available.">
                    <input value={profile.upi} onChange={(e) => patch({ upi: e.target.value })} placeholder="yourname@upi" className={input} />
                  </L>
                </div>
                <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-sand-200/45">
                  <Lock size={14} className="mt-0.5 shrink-0 text-gold-400/70" />
                  Banking details are used only for payouts and are never shown on your public profile. Payouts settle every Monday.
                </p>
              </SectionCard>
              {/* developer blueprint */}
              <div className="rounded-xl border border-forest-800 bg-forest-900/50">
                <button onClick={() => setBlueprint(!blueprint)} className="flex w-full items-center justify-between px-6 py-4 text-left">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-sand-200/60">For your developer — profile schema & API routes</span>
                  <span className={`font-mono text-xs text-gold-400 transition-transform duration-300 ${blueprint ? "rotate-45" : ""}`}><Plus size={15} /></span>
                </button>
                {blueprint && (
                  <div className="space-y-4 border-t border-forest-800 px-6 py-5">
                    <pre className="overflow-x-auto rounded-lg border border-forest-800 bg-forest-950/80 p-4 font-mono text-[10.5px] leading-relaxed text-moss-300">{`CREATE TABLE doctor_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  photo_url TEXT, prefix TEXT, full_name TEXT,
  country_code TEXT, mobile TEXT, mobile_verified BOOLEAN,
  whatsapp TEXT, languages TEXT[],
  registration_number TEXT, council TEXT,
  certificate_url TEXT,            -- stored in a PRIVATE bucket
  degrees JSONB, specialty TEXT, sub_specialties TEXT[],
  experience_years INT,
  verification_status TEXT CHECK (verification_status IN
    ('pending','verified','rejected')) DEFAULT 'pending',
  clinic JSONB, modes JSONB, fees JSONB, schedule JSONB,
  bio_html TEXT, signature_url TEXT, socials JSONB,
  bank JSONB,                      -- encrypted at rest (pgcrypto)
  listed BOOLEAN DEFAULT true, available BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now() );`}</pre>
                    <pre className="overflow-x-auto rounded-lg border border-forest-800 bg-forest-950/80 p-4 font-mono text-[10.5px] leading-relaxed text-moss-300">{`GET    /api/doctor/profile           -- own profile (auth)
PUT    /api/doctor/profile           -- save fields  (auth, row-level security)
POST   /api/doctor/photo             -- 1:1 crop + upload to storage
POST   /api/doctor/certificate       -- private bucket, admin-only read
POST   /api/doctor/otp/send          -- Twilio/MSG91 OTP
POST   /api/doctor/otp/verify
POST   /api/doctor/signature         -- PNG upload
PATCH  /api/admin/verify/:userId     -- approve/reject (superadmin)`}</pre>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* sticky save bar */}
      <div className="sticky bottom-4 z-30 mt-8">
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 ${dirty ? "border-gold-400/70 bg-forest-900/95 shadow-[0_0_30px_rgba(214,180,95,0.18)]" : "border-forest-700 bg-forest-900/85"}`}>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/50">
            {dirty ? <span className="text-gold-300">● Unsaved changes — auto-saving…</span>
              : savedAt ? <span className="text-[#a9cfbf]">✓ All changes saved · {savedAt}</span>
              : "Everything saved"}
          </p>
          <button onClick={() => doSave()}
            className={`flex items-center gap-2 rounded-full px-6 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] transition-all active:scale-95 ${dirty ? "bg-gold-400 text-forest-950 hover:bg-gold-300" : "border border-forest-600 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"}`}>
            <Check size={14} /> Save changes
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-sand-200/60">Security</p>
          {resetOpen ? (
            <div className="flex items-center gap-1.5">
              <input value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New password (4+)" className="w-36 rounded-lg border border-forest-700 bg-forest-950/70 px-2.5 py-1.5 font-mono text-[11px] text-sand-100 focus:border-gold-400 focus:outline-none" autoFocus />
              <button onClick={() => { toast(newPass.length >= 4 ? "Password changed" : "Password needs 4+ characters"); setResetOpen(false); setNewPass(""); }} className="rounded-full bg-gold-400 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase text-forest-950">Set</button>
              <button onClick={() => setResetOpen(false)} className="text-sand-200/40 hover:text-sand-100"><Close size={13} /></button>
            </div>
          ) : (
            <button onClick={() => { setResetOpen(true); setNewPass(""); }} className="flex items-center gap-1.5 rounded-full border border-forest-700 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300">Change Studio password</button>
          )}
        </div>
      </div>

      <p className="mt-4 font-mono text-[8.5px] uppercase tracking-[0.14em] text-sand-200/30">
        {words >= 0 ? `${checks.filter((c) => c.ok).length} of ${checks.length} steps complete` : ""} · profile auto-saves as you type
      </p>
    </div>
  );
}
