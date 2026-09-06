import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp, Monogram, SmartImg, type View } from "./lib";
import { BRAND_LOGO_URL, CATEGORIES, FREE_SHIP_AT, type Order } from "./data";
import { isDoctorListed } from "./doctor-profile";
import { validateDiscount, getConsoleSettings } from "./console/db";
import { AUTHORS } from "./data";
import {
  Leaf, Cart, Menu, Close, ArrowRight, ArrowLeft, Check, Lock, Instagram, Plus, Minus, Trash, Send, RefreshIcon,
} from "./icons";
import { ChevronLeft, ShoppingBag } from "lucide-react";

const NAV_LINKS: { label: string; view: View }[] = [
  { label: "Journal", view: { name: "journal" } },
  { label: "Herb Index", view: { name: "herbs" } },
  { label: "Dosha Quiz", view: { name: "quiz" } },
  { label: "Store", view: { name: "store" } },
  { label: "Contact", view: { name: "contact" } },
];

export function Logo({ onClick, compact = false }: { onClick?: () => void; compact?: boolean }) {
  const [err, setErr] = useState(false);
  return (
    <button onClick={onClick} className="group flex items-center gap-3" aria-label="Vaidyagan home">
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-gold-500/60 bg-[#f7efdc] transition-all group-hover:shadow-[0_0_24px_rgba(214,180,95,0.35)]">
        {err || !BRAND_LOGO_URL
          ? <Leaf size={22} className="text-gold-500" />
          : <img src={BRAND_LOGO_URL} alt="Vaidyagan" className="h-full w-full scale-[1.6] object-cover" onError={() => setErr(true)} />}
      </span>
      {!compact && (
        <span className="text-left">
          <span className="block font-display text-lg font-semibold leading-none text-sand-100">Vaidyagan</span>
          <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.24em] text-gold-400/80">Ayurveda · Verified</span>
        </span>
      )}
    </button>
  );
}

export function Nav() {
  const { view, navigate, cart, setCartOpen, storeEnabled, customer, setAccountAuthOpen } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const count = cart.reduce((s, l) => s + l.qty, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (v: View) => view.name === v.name || (v.name === "journal" && view.name === "article") || (v.name === "store" && view.name === "product");
  const links = NAV_LINKS.filter((l) => !(l.view.name === "store" && !storeEnabled));

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "border-b border-forest-800 bg-forest-950/90 backdrop-blur" : "bg-transparent"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
          <Logo onClick={() => navigate({ name: "home" })} />
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <button key={l.label} onClick={() => navigate(l.view)}
                className={`rounded-full px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-all ${isActive(l.view) ? "text-gold-300" : "text-sand-200/60 hover:text-sand-100"}`}>
                {l.label}
              </button>
            ))}
            {storeEnabled && (
              <button onClick={() => navigate({ name: "studio" })} className="ml-1 rounded-full px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-sand-200/60 transition-all hover:text-sand-100">Studio</button>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => (customer ? navigate({ name: "account" }) : setAccountAuthOpen(true))}
              className="hidden h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-all hover:border-gold-400 hover:text-gold-300 sm:grid"
              aria-label="My account">
              {customer
                ? <span className="font-display text-[12px] font-semibold text-gold-300">{customer.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}</span>
                : <Lock size={16} />}
            </button>
            {storeEnabled && (
              <button onClick={() => setCartOpen(true)} className="relative grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-all hover:border-gold-400 hover:text-gold-300" aria-label="Open basket">
                <Cart size={17} />
                {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[18px] place-items-center rounded-full bg-gold-400 px-1 font-mono text-[9px] font-bold text-forest-950">{count}</span>}
              </button>
            )}
            <button onClick={() => setMobile(true)} className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 lg:hidden" aria-label="Open menu"><Menu size={17} /></button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-forest-950/95 backdrop-blur lg:hidden" onClick={() => setMobile(false)}>
            <div className="flex items-center justify-between px-5 py-4">
              <Logo onClick={() => { setMobile(false); navigate({ name: "home" }); }} />
              <button onClick={() => setMobile(false)} className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200" aria-label="Close menu"><Close size={17} /></button>
            </div>
            <nav className="mt-6 space-y-1 px-6">
              {links.map((l) => (
                <button key={l.label} onClick={() => { setMobile(false); navigate(l.view); }}
                  className="block w-full rounded-xl px-4 py-3.5 text-left font-display text-2xl text-sand-100 transition-colors hover:bg-forest-850 hover:text-gold-300">{l.label}</button>
              ))}
              <button onClick={() => { setMobile(false); navigate({ name: "studio" }); }}
                className="block w-full rounded-xl px-4 py-3.5 text-left font-display text-2xl text-sand-100 transition-colors hover:bg-forest-850 hover:text-gold-300">Studio</button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* --------------------------------- cart ------------------------------------- */

interface CartLineView { id: string; qty: number; product?: { name: string; price: number; image: string; stock: number } }

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, changeQty, removeLine, products, customer } = useApp();
  const [checkout, setCheckout] = useState(false);

  const lines: CartLineView[] = cart.map((l) => ({ ...l, product: products.find((p) => p.id === l.id) })).filter((l) => l.product);
  const subtotal = lines.reduce((s, l) => s + (l.product!.price * l.qty), 0);

  useEffect(() => { if (!cartOpen) setCheckout(false); }, [cartOpen]);

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[62] bg-forest-950/70 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[63] flex w-full flex-col border-l border-forest-800 bg-forest-900 sm:max-w-md" role="dialog" aria-label="Shopping basket">
            {!checkout ? (
              <>
                <div className="flex items-center justify-between border-b border-forest-800 px-6 py-5">
                  <p className="font-display text-xl font-semibold">Your basket</p>
                  <button onClick={() => setCartOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300" aria-label="Close basket"><Close size={15} /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {lines.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <ShoppingBag size={36} className="text-forest-700" />
                      <p className="mt-4 font-display text-lg text-sand-200/70">Your basket is empty</p>
                      <p className="mt-1 text-sm text-sand-200/45">Formulations from the shelf will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lines.map((l) => (
                        <div key={l.id} className="flex gap-3.5 rounded-xl border border-forest-800 bg-forest-850/60 p-3">
                          <SmartImg src={l.product!.image} alt={l.product!.name} className="h-16 w-16 shrink-0 rounded-lg border border-forest-800 object-cover duotone" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-sand-100">{l.product!.name}</p>
                            <p className="mt-0.5 font-mono text-[10px] text-gold-300">₹{l.product!.price.toLocaleString("en-IN")}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-2 rounded-full border border-forest-700 px-1 py-0.5">
                                <button onClick={() => changeQty(l.id, -1)} aria-label="Decrease" className="grid h-6 w-6 place-items-center text-sand-200/70 hover:text-gold-300"><Minus size={12} /></button>
                                <span className="w-5 text-center font-mono text-[12px]">{l.qty}</span>
                                <button onClick={() => changeQty(l.id, 1)} aria-label="Increase" className="grid h-6 w-6 place-items-center text-sand-200/70 hover:text-gold-300"><Plus size={12} /></button>
                              </div>
                              <button onClick={() => removeLine(l.id)} className="text-sand-200/35 hover:text-ember-300" aria-label="Remove"><Trash size={15} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-forest-800 px-6 py-5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/45">{subtotal >= FREE_SHIP_AT ? "Free shipping unlocked" : `Add ₹${(FREE_SHIP_AT - subtotal).toLocaleString("en-IN")} more for free shipping`}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-forest-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all" style={{ width: `${Math.min(100, (subtotal / FREE_SHIP_AT) * 100)}%` }} />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-sand-200/60">Subtotal</span>
                    <span className="font-display text-2xl font-semibold text-sand-100">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <button onClick={() => setCheckout(true)} disabled={lines.length === 0}
                    className="gold-sheen mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 disabled:opacity-35">
                    {customer ? "Proceed to checkout" : (<><Lock size={14} /> Sign in to checkout</>)} <ArrowRight size={15} />
                  </button>
                  {!customer && <p className="mt-2.5 text-center font-mono text-[8.5px] uppercase tracking-[0.16em] text-sand-200/35">OTP, Google or email — your basket stays safe</p>}
                </div>
              </>
            ) : (
              <CheckoutFlow subtotal={subtotal} lines={lines} onDone={() => { setCheckout(false); setCartOpen(false); }} />
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function CheckoutFlow({ subtotal, lines, onDone }: { subtotal: number; lines: CartLineView[]; onDone: () => void }) {
  const { placeOrder, toast, customer, saveAddress, navigate, loginOtp, loginGoogle, loginEmail, registerEmail } = useApp();
  const startedSignedIn = useRef(!!customer);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(customer ? 1 : 0);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [processing, setProcessing] = useState(false);
  const [authTab, setAuthTab] = useState<"otp" | "google" | "email">("otp");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [form, setForm] = useState({ name: customer?.name ?? "", phone: customer?.phone ?? "", address: "", city: "", pin: "" });
  const [saveAddr, setSaveAddr] = useState(true);
  const [pay, setPay] = useState("UPI");
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState<{ code: string; amount: number } | null>(null);
  const [promoErr, setPromoErr] = useState("");
  const settings = getConsoleSettings();
  const shipFee = subtotal >= settings.freeShipAt ? 0 : settings.shippingFee;
  const discount = applied?.amount ?? 0;
  const grand = Math.max(0, subtotal - discount) + shipFee;

  useEffect(() => { if (customer && step === 0 && !processing) setStep(1); }, [customer, step, processing]);

  if (lines.length === 0 && step < 3) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <ShoppingBag size={36} className="text-forest-700" />
        <p className="mt-4 font-display text-lg text-sand-200/70">Your basket emptied</p>
        <button onClick={onDone} className="mt-4 rounded-full border border-gold-500/50 px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">Back to store</button>
      </div>
    );
  }

  const sendOtp = () => {
    if (phone.replace(/\D/g, "").length < 10) { setAuthErr("Enter a valid 10-digit mobile number"); return; }
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setOtpCode(code); setAuthErr("");
    toast(`Demo OTP: ${code}`);
  };
  const verifyOtp = () => {
    if (otpInput !== otpCode) { setAuthErr("That code doesn't match — try again"); return; }
    loginOtp(phone);
    setStep(1);
  };

  const finish = () => {
    if (processing || !customer) return;
    setProcessing(true);
    window.setTimeout(() => {
      const order = placeOrder(form, pay, { discountCode: applied?.code, discountAmount: discount || undefined, shippingFee: shipFee || undefined });
      if (saveAddr && form.address.trim()) {
        saveAddress({ id: `addr-${Date.now()}`, label: "Home", name: form.name, phone: form.phone, line1: form.address, city: form.city, state: "", pin: form.pin, isDefault: (customer.addresses ?? []).length === 0 });
      }
      setPlaced(order);
      setStep(3);
      setProcessing(false);
      toast(`Order ${order.id} placed — the desk has been notified`);
    }, 1100);
  };

  const input = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/30 focus:border-gold-400 focus:outline-none";
  const stepLabels = startedSignedIn.current ? ["Delivery", "Payment"] : ["Sign in", "Delivery", "Payment"];
  const offset = startedSignedIn.current ? 1 : 0;

  const applyPromo = () => {
    if (!promo.trim()) return;
    const res = validateDiscount(promo, subtotal);
    if (res.ok && res.discount && res.amount > 0) {
      setApplied({ code: res.discount.code, amount: res.amount }); setPromoErr("");
      toast(`Code ${res.discount.code} applied — you save ₹${res.amount.toLocaleString("en-IN")}`);
    } else {
      setApplied(null);
      setPromoErr(res.reason ?? "That code didn't work");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-forest-800 px-6 py-4">
        <p className="font-display text-lg font-semibold leading-none">{step === 3 ? "Confirmed" : "Checkout"}</p>
        <div className="flex items-center gap-2">
          {stepLabels.map((label, i) => {
            const done = step > i + offset;
            const active = step === i + offset;
            return (
              <React.Fragment key={label}>
                {i > 0 && <span className={`h-px w-4 ${done || active ? "bg-gold-500" : "bg-forest-700"}`} />}
                <span className={`flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] ${done ? "text-gold-300" : active ? "text-sand-100" : "text-sand-200/35"}`}>
                  <span className={`grid h-4 w-4 place-items-center rounded-full border text-[7px] ${done ? "border-gold-400 bg-gold-400 text-forest-950" : active ? "border-gold-400 text-gold-300" : "border-forest-600"}`}>{done ? <Check size={8} /> : i + 1}</span>
                  {label}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* STEP 0 · sign in */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {([["otp", "OTP"], ["google", "Google"], ["email", "Email"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => { setAuthTab(k); setAuthErr(""); }}
                  className={`flex-1 rounded-lg border py-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-all ${authTab === k ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55"}`}>{l}</button>
              ))}
            </div>
            {authTab === "otp" && (
              <div className="space-y-3">
                {!otpCode ? (
                  <>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number" className={input} />
                    <button onClick={sendOtp} className="w-full rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Send OTP</button>
                  </>
                ) : (
                  <>
                    <p className="text-[12px] text-sand-200/55">Demo OTP: <b className="font-mono text-gold-300">{otpCode}</b></p>
                    <input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder="Enter 4-digit OTP" className={input} />
                    <button onClick={verifyOtp} className="w-full rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Verify & continue</button>
                  </>
                )}
              </div>
            )}
            {authTab === "google" && (
              <button onClick={() => loginGoogle("guest@vaidyagan.in", "Ayurveda Friend")} className="flex w-full items-center justify-center gap-2 rounded-full border border-forest-700 py-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-sand-100 hover:border-gold-400 hover:text-gold-300">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.7 0 3.22.59 4.42 1.73l3.29-3.29A11.94 11.94 0 0 0 12 0 12 12 0 0 0 .96 6.49l3.84 2.98A7.2 7.2 0 0 1 12 5.04Z"/><path fill="#4285F4" d="M23.49 12.27c0-.85-.08-1.46-.24-2.1H12v4h6.47c-.13 1.08-.83 2.7-2.39 3.79l3.72 2.88c2.23-2.06 3.69-5.09 3.69-8.57Z"/><path fill="#FBBC05" d="M4.8 14.53a7.2 7.2 0 0 1 0-4.59L.96 6.49a12 12 0 0 0 0 11.02l3.84-2.98Z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.72-2.88c-1 .69-2.34 1.17-4.22 1.17a7.2 7.2 0 0 1-7.2-4.86l-3.84 2.98A12 12 0 0 0 12 24Z"/></svg>
                Continue with Google
              </button>
            )}
            {authTab === "email" && (
              <div className="space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (new accounts)" className={input} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={input} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={input} />
                <button onClick={() => {
                  const existing = loginEmail(email, password);
                  if (existing) { setStep(1); return; }
                  const created = name.trim() ? registerEmail(name.trim(), email, password) : null;
                  if (created) { setStep(1); toast("Account created — welcome"); }
                  else setAuthErr("Email already exists — sign in instead, or check the password.");
                }} className="w-full rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Sign in / Create account</button>
              </div>
            )}
            {authErr && <p className="rounded-lg border border-ember-500/40 bg-ember-500/8 px-4 py-2.5 text-[12px] text-ember-300">{authErr}</p>}
          </div>
        )}

        {/* STEP 1 · delivery */}
        {step === 1 && customer && (
          <div className="space-y-3.5">
            {(customer.addresses ?? []).length > 0 && (
              <div className="space-y-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/45">Saved addresses</p>
                {customer.addresses.map((a) => (
                  <button key={a.id} onClick={() => setForm({ name: a.name, phone: a.phone, address: a.line1, city: a.city, pin: a.pin })}
                    className="block w-full rounded-lg border border-forest-700 px-4 py-3 text-left text-[12.5px] text-sand-200/70 hover:border-gold-400">
                    <b className="text-sand-100">{a.label}</b> — {a.line1}, {a.city} {a.pin}
                  </button>
                ))}
              </div>
            )}
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className={input} />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className={input} />
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className={input} />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className={input} />
              <input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} placeholder="PIN code" className={input} />
            </div>
            <label className="flex items-center gap-2 text-[12px] text-sand-200/60">
              <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="accent-[#d6b45f]" /> Save this address to my account
            </label>
            <button onClick={() => setStep(2)} disabled={Object.values(form).some((v) => !v.trim())}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 disabled:opacity-35">
              Continue to payment <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* STEP 2 · payment */}
        {step === 2 && customer && (
          <div className="space-y-4">
            <div className="space-y-2.5">
              {lines.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-[12.5px] text-sand-200/70">
                  <span className="truncate">{l.product!.name} × {l.qty}</span>
                  <span className="font-mono">₹{(l.product!.price * l.qty).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/45">Promo code</p>
              <div className="flex gap-2">
                <input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder="e.g. WELCOME10" className={input} />
                <button onClick={applyPromo} className="shrink-0 rounded-full border border-gold-500/50 px-5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">Apply</button>
              </div>
              {promoErr && <p className="mt-1.5 text-[11.5px] text-ember-300">{promoErr}</p>}
            </div>
            <div className="space-y-2">
              {([["UPI", settings.paymentUPI], ["Card", settings.paymentCard], ["Cash on delivery", settings.paymentCOD]] as const)
                .filter(([, on]) => on)
                .map(([m]) => (
                  <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all ${pay === m ? "border-gold-400 bg-gold-400/8" : "border-forest-700"}`}>
                    <input type="radio" name="pay" checked={pay === m} onChange={() => setPay(m)} className="accent-[#d6b45f]" />
                    <span className="text-[13px] text-sand-100">{m}</span>
                  </label>
                ))}
            </div>
            <div className="rounded-xl border border-forest-800 bg-forest-850/60 p-4">
              <div className="flex justify-between text-[12.5px] text-sand-200/60"><span>Items</span><span className="font-mono">₹{subtotal.toLocaleString("en-IN")}</span></div>
              {discount > 0 && <div className="flex justify-between text-[12.5px] text-kapha-300"><span>Discount ({applied!.code})</span><span className="font-mono">−₹{discount.toLocaleString("en-IN")}</span></div>}
              <div className="flex justify-between text-[12.5px] text-sand-200/60"><span>Shipping</span><span className="font-mono">{shipFee === 0 ? "Free" : `₹${shipFee}`}</span></div>
              <div className="mt-2 flex justify-between border-t border-forest-700 pt-2 text-[14px] font-semibold text-sand-100"><span>To pay</span><span className="font-mono text-gold-300">₹{grand.toLocaleString("en-IN")}</span></div>
            </div>
            <button onClick={finish} disabled={processing}
              className="gold-sheen flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 disabled:opacity-70">
              {processing ? (<><RefreshIcon size={14} className="animate-spin-fast" /> Processing payment…</>) : (<>Confirm & place order · ₹{grand.toLocaleString("en-IN")}</>)}
            </button>
          </div>
        )}

        {/* STEP 3 · confirmed */}
        {step === 3 && placed && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-kapha-400 bg-kapha-500/15 text-kapha-300"><Check size={28} /></span>
            <p className="mt-5 font-display text-2xl font-semibold">Order {placed.id} placed</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-sand-200/60">
              ₹{placed.total.toLocaleString("en-IN")} via {placed.paymentMethod}. The desk has been notified and it will ship shortly.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => { onDone(); navigate({ name: "account" }); }} className="rounded-full border border-gold-500/50 px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">Track my order</button>
              <button onClick={onDone} className="rounded-full border border-forest-700 px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/60 hover:text-sand-100">Keep shopping</button>
            </div>
          </div>
        )}
      </div>

      {step > 0 && step < 3 && !processing && (
        <div className="border-t border-forest-800 px-6 py-3">
          <button onClick={() => (step === 1 ? (startedSignedIn.current ? onDone() : setStep(0)) : setStep(1))}
            className="flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/50 hover:text-gold-300" aria-label="Go back">
            <ChevronLeft size={13} /> Back
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- account auth ------------------------------- */

export function AccountAuthModal() {
  const { accountAuthOpen, setAccountAuthOpen, loginOtp, loginGoogle, loginEmail, registerEmail, toast, navigate } = useApp();
  const [tab, setTab] = useState<"otp" | "google" | "email">("otp");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const input = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/30 focus:border-gold-400 focus:outline-none";

  return (
    <AnimatePresence>
      {accountAuthOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] grid place-items-center bg-forest-950/80 p-4 backdrop-blur-sm" onClick={() => setAccountAuthOpen(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-forest-700 bg-forest-900 p-6" role="dialog" aria-label="Sign in">
            <div className="flex items-center justify-between">
              <p className="font-display text-xl font-semibold">Sign in</p>
              <button onClick={() => setAccountAuthOpen(false)} className="grid h-8 w-8 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300" aria-label="Close"><Close size={14} /></button>
            </div>
            <div className="mt-4 flex gap-2">
              {([["otp", "OTP"], ["google", "Google"], ["email", "Email"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => { setTab(k); setErr(""); }}
                  className={`flex-1 rounded-lg border py-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-all ${tab === k ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55"}`}>{l}</button>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {tab === "otp" && (!otpCode ? (
                <>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number" className={input} />
                  <button onClick={() => { if (phone.replace(/\D/g, "").length < 10) { setErr("Enter a valid 10-digit number"); return; } const c = String(Math.floor(1000 + Math.random() * 9000)); setOtpCode(c); setErr(""); toast(`Demo OTP: ${c}`); }}
                    className="w-full rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Send OTP</button>
                </>
              ) : (
                <>
                  <p className="text-[12px] text-sand-200/55">Demo OTP: <b className="font-mono text-gold-300">{otpCode}</b></p>
                  <input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder="Enter OTP" className={input} />
                  <button onClick={() => { if (otpInput !== otpCode) { setErr("Code doesn't match"); return; } loginOtp(phone); setAccountAuthOpen(false); navigate({ name: "account" }); }}
                    className="w-full rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Verify</button>
                </>
              ))}
              {tab === "google" && (
                <button onClick={() => { loginGoogle("guest@vaidyagan.in", "Ayurveda Friend"); setAccountAuthOpen(false); navigate({ name: "account" }); }}
                  className="w-full rounded-full border border-forest-700 py-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-sand-100 hover:border-gold-400 hover:text-gold-300">Continue with Google</button>
              )}
              {tab === "email" && (
                <>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (new accounts)" className={input} />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={input} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={input} />
                  <button onClick={() => {
                    if (loginEmail(email, password)) { setAccountAuthOpen(false); navigate({ name: "account" }); return; }
                    if (name.trim() && registerEmail(name.trim(), email, password)) { setAccountAuthOpen(false); navigate({ name: "account" }); return; }
                    setErr("Email exists — sign in, or add a name to create an account.");
                  }} className="w-full rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Sign in / Create</button>
                </>
              )}
              {err && <p className="rounded-lg border border-ember-500/40 bg-ember-500/8 px-4 py-2.5 text-[12px] text-ember-300">{err}</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------- footer ----------------------------------- */

export function Footer() {
  const { navigate } = useApp();
  return (
    <footer className="relative border-t border-forest-800 bg-forest-900/40">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo onClick={() => navigate({ name: "home" })} />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-sand-200/55">
              Classical protocols and herb monographs written from the OPD by registered BAMS vaidyas. Knowledge is medicine.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {AUTHORS.filter((a) => isDoctorListed(a.id)).map((a) => (
                <span key={a.id} className="flex items-center gap-2 rounded-full border border-forest-800 bg-forest-850/60 py-1 pl-1 pr-3">
                  <Monogram author={a} size={24} />
                  <span className="text-[11px] text-sand-200/70">{a.name}</span>
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">Explore</p>
            <div className="mt-3.5 space-y-2">
              {NAV_LINKS.map((l) => (
                <button key={l.label} onClick={() => navigate(l.view)} className="block text-[13px] text-sand-200/60 transition-colors hover:text-gold-300">{l.label}</button>
              ))}
              <button onClick={() => navigate({ name: "studio" })} className="block text-[13px] text-sand-200/60 transition-colors hover:text-gold-300">Doctor Studio</button>
            </div>
          </div>
          <div>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">The desk</p>
            <div className="mt-3.5 space-y-2 text-[13px] text-sand-200/60">
              <a href="mailto:vaidyagan@gmail.com" className="block transition-colors hover:text-gold-300">vaidyagan@gmail.com</a>
              <a href="https://instagram.com/vaidyagan" target="_blank" rel="noreferrer" className="flex items-center gap-2 transition-colors hover:text-gold-300"><Instagram size={14} /> @vaidyagan</a>
              <p>Kothrud, Pune, Maharashtra</p>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-forest-800 pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-sand-200/35">© 2026 Vaidyagan · Ayurveda, clinically verified</p>
          <p className="max-w-md text-[10.5px] leading-relaxed text-sand-200/30">This is educational content, not a substitute for consultation. See a registered practitioner for personal care.</p>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------- toasts ---------------------------------- */

export function ToastHost() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[90] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="flex items-center gap-2.5 rounded-full border border-gold-500/40 bg-forest-900/95 px-5 py-3 text-sm text-sand-100 shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-400 text-forest-950"><Check size={11} /></span>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------- scroll progress & back-to-top ---------------------- */

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${p})`;
        barRef.current.style.opacity = p > 0.01 && p < 0.995 ? "1" : "0";
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div ref={barRef} className="scroll-progress w-full" style={{ transform: "scaleX(0)", opacity: 0 }} aria-hidden />;
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button key="btt" initial={{ opacity: 0, y: 16, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.92 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top"
          className="fixed bottom-6 right-6 z-[70] grid h-11 w-11 place-items-center rounded-full border border-gold-500/50 bg-forest-900/90 text-gold-300 shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur transition-colors hover:bg-gold-400 hover:text-forest-950">
          <ArrowLeft size={17} className="rotate-90" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export { Send };
