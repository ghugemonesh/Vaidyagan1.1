import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp, Monogram, SmartImg, type View } from "./lib";
import { AUTHORS, BRAND_LOGO_URL, FREE_SHIP_AT, type Order } from "./data";
import {
  Leaf, Cart, Menu, Close, Instagram, Plus, Minus, Trash, ArrowRight, Check, Lock, SealCheck,
  Person, Phone, Send, ArrowLeft,
} from "./icons";

const NAV_LINKS: { label: string; view: View }[] = [
  { label: "Journal", view: { name: "journal" } },
  { label: "Herb Index", view: { name: "herbs" } },
  { label: "Dosha Quiz", view: { name: "quiz" } },
  { label: "Store", view: { name: "store" } },
  { label: "Studio", view: { name: "studio" } },
  { label: "Contact", view: { name: "contact" } },
];

export function Logo({ onClick }: { onClick?: () => void }) {
  const [imgError, setImgError] = useState(false);
  return (
    <button onClick={onClick} className="group flex items-center gap-3.5 text-left" aria-label="Vaidyagan — back to home">
      <span className="relative grid h-[64px] w-[64px] shrink-0 place-items-center overflow-hidden rounded-[18px] border-2 border-gold-400/80 bg-[#f7ecbe] shadow-[0_0_0_4px_rgba(214,180,95,0.14),0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-500 group-hover:border-gold-300 group-hover:shadow-[0_0_0_4px_rgba(214,180,95,0.22),0_0_40px_rgba(232,207,139,0.55)] sm:h-[72px] sm:w-[72px]">
        {imgError ? (
          <span className="text-gold-600 transition-transform duration-500 group-hover:rotate-12"><Leaf size={34} /></span>
        ) : (
          <img
            src={BRAND_LOGO_URL} alt="वैद्यगण — Vaidyagan"
            onError={() => setImgError(true)} draggable={false}
            className="h-full w-full scale-[1.6] object-cover transition-transform duration-500 group-hover:scale-[1.72]"
          />
        )}
      </span>
      <span>
        <span className="block font-display text-xl font-semibold leading-none tracking-wide text-sand-100">Vaidyagan</span>
        <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.34em] text-gold-400/80">वैद्यगण · आयुर्वेद</span>
      </span>
    </button>
  );
}

/* ----------------------------------- nav ----------------------------------- */

export function Nav() {
  const { view, navigate, cart, setCartOpen, storeEnabled, customer, setAccountAuthOpen } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  /* Store tab renders only while the master switch is on */
  const links = storeEnabled ? NAV_LINKS : NAV_LINKS.filter((l) => l.label !== "Store");

  const isActive = (v: View) => view.name === v.name || (v.name === "journal" && view.name === "article");

  const accountButton = (
    <button
      onClick={() => (customer ? navigate({ name: "account" }) : setAccountAuthOpen(true))}
      className="flex h-10 items-center gap-2 rounded-full border border-forest-700 px-3 text-sand-200/80 transition-all duration-300 hover:border-gold-400 hover:text-gold-300"
      aria-label="My account"
    >
      {customer ? (
        <>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gold-400/15 font-display text-[11px] font-semibold text-gold-300">
            {customer.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </span>
          <span className="hidden max-w-[90px] truncate font-mono text-[9.5px] uppercase tracking-[0.12em] md:block">
            {customer.name.split(" ")[0]}
          </span>
        </>
      ) : (
        <Person size={17} />
      )}
    </button>
  );

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "border-b border-forest-800 bg-forest-950/85 backdrop-blur-md" : "bg-transparent"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-2.5 lg:px-8">
          <Logo onClick={() => navigate({ name: "home" })} />
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <button
                key={l.label}
                onClick={() => navigate(l.view)}
                className={`relative rounded-full px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-all duration-300 ${
                  isActive(l.view) ? "text-gold-300" : "text-sand-200/60 hover:text-sand-100"
                }`}
              >
                {l.label}
                {l.label === "Studio" && <Lock size={10} className="ml-1.5 inline -translate-y-px" />}
                {isActive(l.view) && (
                  <motion.span layoutId="nav-dot" className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold-400" />
                )}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="https://instagram.com/vaidyagan" target="_blank" rel="noreferrer"
              aria-label="Vaidyagan on Instagram"
              className="hidden h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-all duration-300 hover:border-gold-400 hover:text-gold-300 sm:grid"
            >
              <Instagram size={17} />
            </a>
            {accountButton}
            <button
              onClick={() => setCartOpen(true)}
              className="relative grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/80 transition-all duration-300 hover:border-gold-400 hover:text-gold-300"
              aria-label="Open cart"
            >
              <Cart size={18} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-gold-400 font-mono text-[10px] font-bold text-forest-950">{count}</span>
              )}
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/80 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-forest-950/97 backdrop-blur-lg lg:hidden"
          >
            <div className="flex items-center justify-between px-5 py-5">
              <Logo onClick={() => { setMenuOpen(false); navigate({ name: "home" }); }} />
              <button onClick={() => setMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200" aria-label="Close menu">
                <Close size={18} />
              </button>
            </div>
            <nav className="mt-10 flex flex-col gap-2 px-8">
              {links.map((l, i) => (
                <motion.button
                  key={l.label}
                  initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  onClick={() => { setMenuOpen(false); navigate(l.view); }}
                  className="flex items-center justify-between border-b border-forest-800 py-4 text-left font-display text-3xl font-semibold text-sand-100 transition-colors hover:text-gold-300"
                >
                  {l.label}
                  <ArrowRight size={20} className="text-gold-500/60" />
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                onClick={() => { setMenuOpen(false); customer ? navigate({ name: "account" }) : setAccountAuthOpen(true); }}
                className="flex items-center justify-between border-b border-forest-800 py-4 text-left font-display text-3xl font-semibold text-sand-100 transition-colors hover:text-gold-300"
              >
                {customer ? "My Account" : "Sign in"}
                <ArrowRight size={20} className="text-gold-500/60" />
              </motion.button>
            </nav>
            <p className="mt-10 px-8 font-mono text-[10px] uppercase tracking-[0.3em] text-sand-200/40">@vaidyagan · clinically verified</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* --------------------------------- cart drawer ------------------------------ */

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, changeQty, removeLine, products, customer, setAccountAuthOpen, checkoutIntent, setCheckoutIntent } = useApp();
  const [checkout, setCheckout] = useState(false);

  const lines = cart
    .map((l) => ({ ...l, product: products.find((p) => p.id === l.id) }))
    .filter((l) => l.product && l.product.visible !== false);
  const subtotal = lines.reduce((s, l) => s + (l.product?.price ?? 0) * l.qty, 0);
  const progress = Math.min(100, (subtotal / FREE_SHIP_AT) * 100);

  /* Guests are intercepted by the sign-in popup; the basket is kept safe. */
  const beginCheckout = () => {
    if (!customer) { setCheckoutIntent(true); setAccountAuthOpen(true); return; }
    setCheckout(true);
  };

  useEffect(() => {
    if (customer && checkoutIntent && cartOpen) {
      setCheckoutIntent(false);
      setCheckout(true);
    }
  }, [customer, checkoutIntent, cartOpen]);

  useEffect(() => {
    if (!cartOpen) { setCheckout(false); setCheckoutIntent(false); }
  }, [cartOpen, setCheckoutIntent]);

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-forest-950/70 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col border-l border-forest-800 bg-forest-900"
            role="dialog" aria-label="Shopping cart"
          >
            {!checkout ? (
              <>
                <div className="flex items-center justify-between border-b border-forest-800 px-6 py-5">
                  <p className="font-display text-2xl font-semibold text-sand-100">Your basket</p>
                  <button onClick={() => setCartOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300" aria-label="Close cart">
                    <Close size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {lines.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <Cart size={40} className="text-forest-700" />
                      <p className="mt-4 font-display text-xl text-sand-200/70">The basket is empty</p>
                      <p className="mt-2 text-sm text-sand-200/45">Classical formulations are waiting in the store.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lines.map((l) => (
                        <div key={l.id} className="flex gap-4 rounded-xl border border-forest-800 bg-forest-850/60 p-3">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-forest-800">
                            <SmartImg src={l.product!.image} alt={l.product!.name} className="h-full w-full object-cover duotone" style={l.product!.duotone ? { filter: l.product!.duotone } : undefined} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-sand-100">{l.product!.name}</p>
                            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gold-400/80">₹{l.product!.price}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-2 rounded-full border border-forest-700 px-1 py-0.5">
                                <button onClick={() => changeQty(l.id, -1)} className="grid h-6 w-6 place-items-center text-sand-200/70 hover:text-gold-300" aria-label="Decrease"><Minus size={12} /></button>
                                <span className="w-5 text-center font-mono text-xs text-sand-100">{l.qty}</span>
                                <button onClick={() => changeQty(l.id, 1)} className="grid h-6 w-6 place-items-center text-sand-200/70 hover:text-gold-300" aria-label="Increase"><Plus size={12} /></button>
                              </div>
                              <button onClick={() => removeLine(l.id)} className="text-sand-200/35 transition-colors hover:text-pitta-400" aria-label="Remove item">
                                <Trash size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-forest-800 px-6 py-5">
                  <div className="mb-4">
                    <div className="flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/50">
                      <span>Free shipping at ₹{FREE_SHIP_AT}</span>
                      <span>{subtotal >= FREE_SHIP_AT ? "Unlocked ✓" : `₹${FREE_SHIP_AT - subtotal} away`}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-forest-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300 transition-all duration-700" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-sand-200/60">Subtotal</span>
                    <span className="font-display text-2xl font-semibold text-sand-100">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <button
                    onClick={beginCheckout}
                    disabled={lines.length === 0}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 disabled:opacity-35"
                  >
                    {customer ? "Proceed to checkout" : "Sign in to checkout"} <ArrowRight size={15} />
                  </button>
                  {!customer && (
                    <p className="mt-2.5 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-sand-200/35">
                      OTP, Google or email — your basket stays safe
                    </p>
                  )}
                </div>
              </>
            ) : (
              <CheckoutFlow subtotal={subtotal} onDone={() => { setCheckout(false); setCartOpen(false); }} />
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function CheckoutFlow({ subtotal, onDone }: { subtotal: number; onDone: () => void }) {
  const { placeOrder, toast, customer, saveAddress, navigate, setCartOpen } = useApp();
  const [step, setStep] = useState(0);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [pay, setPay] = useState("UPI");
  const [saveAddr, setSaveAddr] = useState(true);
  const [form, setForm] = useState(() => {
    const d = customer?.addresses.find((a) => a.isDefault) ?? customer?.addresses[0];
    return {
      name: customer?.name ?? "",
      phone: d?.phone || customer?.phone || "",
      address: d?.line1 ?? "",
      city: d?.city ?? "",
      pin: d?.pin ?? "",
    };
  });

  const finish = () => {
    const order = placeOrder(form, pay); // creates order + auto-deducts stock + clears basket
    if (customer && saveAddr && form.address.trim()) {
      saveAddress({
        id: `addr-${Date.now()}`, label: "Home", name: form.name, phone: form.phone,
        line1: form.address, city: form.city, state: "", pin: form.pin,
        isDefault: customer.addresses.length === 0,
      });
    }
    setPlaced(order);
    setStep(2);
    toast(`Order ${order.id} placed — the desk has been notified`);
  };

  const input = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/30 focus:border-gold-400 focus:outline-none";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-forest-800 px-6 py-5">
        <p className="font-display text-2xl font-semibold text-sand-100">
          {step === 0 ? "Delivery" : step === 1 ? "Payment" : "Confirmed"}
        </p>
        {step < 2 && (
          <button onClick={() => (step === 0 ? onDone() : setStep(0))} className="font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/50 hover:text-gold-300">
            Back
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {step === 0 && (
          <div className="space-y-3.5">
            {[
              ["Full name", "name", "Dr. …"],
              ["Phone", "phone", "+91 …"],
              ["Address", "address", "Flat, street, landmark"],
              ["City", "city", "Pune"],
              ["PIN code", "pin", "411001"],
            ].map(([label, key, ph]) => (
              <div key={key}>
                <label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.18em] text-gold-400/80">{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={ph}
                  className={input}
                />
              </div>
            ))}
            {customer && (
              <label className="flex cursor-pointer items-center gap-2.5 text-xs text-sand-200/60">
                <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="accent-[#d6b45f]" />
                Save this address to my account
              </label>
            )}
            <button
              onClick={() => setStep(1)}
              disabled={Object.values(form).some((v) => !v.trim())}
              className="mt-2 w-full rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 disabled:opacity-35"
            >
              Continue to payment
            </button>
          </div>
        )}
        {step === 1 && (
          <div>
            <div className="rounded-xl border border-forest-800 bg-forest-850/60 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sand-200/60">Order total</span>
                <span className="font-display text-2xl font-semibold text-sand-100">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-sand-200/50">
                Demo checkout — no money moves. In production this step opens Razorpay (UPI, cards, net-banking).
              </p>
            </div>
            <div className="mt-5 space-y-2.5">
              {["UPI — vaidyagan@upi", "Card — sandbox 4242…", "Cash on delivery"].map((m) => (
                <label key={m} className="flex cursor-pointer items-center gap-3 rounded-lg border border-forest-700 px-4 py-3 transition-all hover:border-gold-400">
                  <input type="radio" name="pay" checked={pay === m.split(" ")[0]} onChange={() => setPay(m.split(" ")[0])} className="accent-[#d6b45f]" />
                  <span className="text-sm text-sand-100">{m}</span>
                </label>
              ))}
            </div>
            <button
              onClick={finish}
              className="mt-6 w-full rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300"
            >
              Place order · ₹{subtotal.toLocaleString("en-IN")}
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full border-2 border-kapha-400 bg-kapha-500/15 text-kapha-300">
              <Check size={34} />
            </span>
            <p className="mt-6 font-display text-2xl font-semibold text-sand-100">Order {placed?.id ?? "VG-0000"}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-sand-200/60">
              Your formulations are being batch-checked and will ship within 48 hours. A vaidya's note travels with every parcel.
            </p>
            <div className="mt-8 flex gap-3">
              <button onClick={() => { onDone(); navigate({ name: "account" }); setCartOpen(false); }} className="rounded-full border border-gold-500/50 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">
                Track my order
              </button>
              <button onClick={onDone} className="rounded-full border border-forest-700 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-sand-200/60 hover:text-sand-100">
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ account auth modal --------------------------- */

export function AccountAuthModal() {
  const { accountAuthOpen, setAccountAuthOpen, loginOtp, loginGoogle, loginEmail, registerEmail, toast } = useApp();
  const [method, setMethod] = useState<"otp" | "google" | "email">("otp");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState<{ sent: boolean; code: string; input: string }>({ sent: false, code: "", input: "" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accountAuthOpen) {
      setOtp({ sent: false, code: "", input: "" });
      setError("");
    }
  }, [accountAuthOpen]);

  const close = () => setAccountAuthOpen(false);

  const sendOtp = () => {
    if (phone.replace(/\D/g, "").length < 8) { setError("Enter a valid mobile number first."); return; }
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setOtp({ sent: true, code, input: "" });
    setError("");
  };
  const verifyOtp = () => {
    if (otp.input !== otp.code) { setError("That code doesn't match — try again."); return; }
    const c = loginOtp(phone, name.trim() || undefined);
    toast(`Namaste, ${c.name} — signed in with OTP`);
    close();
  };

  const googleAccounts = [
    { email: "ananya.sharma@gmail.com", name: "Ananya Sharma" },
    { email: "vikram.kulkarni@gmail.com", name: "Vikram Kulkarni" },
    { email: "meera.nair@gmail.com", name: "Meera Nair" },
  ];
  const pickGoogle = (g: { email: string; name: string }) => {
    loginGoogle(g.email, g.name);
    toast(`Namaste, ${g.name} — signed in with Google`);
    close();
  };

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 4) { setError("Enter a valid email and a 4+ character password."); return; }
    if (mode === "login") {
      const c = loginEmail(email, password);
      if (!c) { setError("Incorrect email or password."); return; }
      toast(`Namaste, ${c.name} — welcome back`);
      close();
    } else {
      if (!name.trim()) { setError("Tell us your name so we can address you properly."); return; }
      const c = registerEmail(name.trim(), email, password);
      if (!c) { setError("That email already has an account — try signing in."); return; }
      toast(`Account created — namaste, ${c.name}`);
      close();
    }
  };

  const input = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-3 text-sm text-sand-100 placeholder:text-sand-200/30 focus:border-gold-400 focus:outline-none";

  return (
    <AnimatePresence>
      {accountAuthOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[64] flex items-end justify-center bg-forest-950/85 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={close}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-2xl border border-forest-700 bg-forest-900 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:rounded-2xl sm:p-7"
            role="dialog" aria-label="Sign in or create account"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-gold-400">Vaidyagan account</p>
                <p className="mt-1 font-display text-xl font-semibold text-sand-100">Sign in to continue</p>
              </div>
              <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300" aria-label="Close"><Close size={15} /></button>
            </div>

            {/* method tabs */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {([["otp", "Mobile OTP"], ["google", "Google"], ["email", "Email"]] as const).map(([m, label]) => (
                <button
                  key={m} onClick={() => { setMethod(m); setError(""); }}
                  className={`rounded-lg border py-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-all ${method === m ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-700 text-sand-200/55 hover:text-sand-100"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {error && <p className="mt-3 rounded-lg border border-pitta-500/40 bg-pitta-500/10 px-3.5 py-2.5 text-[12px] text-pitta-300">{error}</p>}

            {method === "otp" && (
              <div className="mt-4 space-y-3">
                {!otp.sent ? (
                  <>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className={input} />
                    <div className="flex gap-2">
                      <span className="grid place-items-center rounded-lg border border-forest-700 bg-forest-950/60 px-3 font-mono text-xs text-sand-200/60">+91</span>
                      <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ""))} placeholder="98220 12345" inputMode="tel" className={input} />
                    </div>
                    <button onClick={sendOtp} className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">
                      <Phone size={14} /> Send OTP
                    </button>
                    <p className="text-center text-[11px] text-sand-200/40">Fastest checkout — no password to remember.</p>
                  </>
                ) : (
                  <>
                    <p className="text-[12.5px] text-sand-200/60">
                      Code sent to +91 {phone} — demo code: <b className="font-mono text-gold-300">{otp.code}</b>
                    </p>
                    <input value={otp.input} onChange={(e) => setOtp({ ...otp, input: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="••••" inputMode="numeric" className={`${input} text-center font-mono text-xl tracking-[0.5em]`} autoFocus />
                    <button onClick={verifyOtp} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#5f947e] py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-[#82b39e]">
                      <Check size={14} /> Verify & continue
                    </button>
                    <button onClick={sendOtp} className="w-full text-center font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/45 hover:text-gold-300">Resend code</button>
                  </>
                )}
              </div>
            )}

            {method === "google" && (
              <div className="mt-4 space-y-2.5">
                <p className="text-[12.5px] text-sand-200/55">Demo OAuth — pick the Google account to continue with:</p>
                {googleAccounts.map((g) => (
                  <button key={g.email} onClick={() => pickGoogle(g)} className="flex w-full items-center gap-3 rounded-xl border border-forest-700 bg-forest-950/50 px-4 py-3 text-left transition-all hover:border-gold-400 hover:bg-forest-850">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-sand-100 font-display text-sm font-bold text-forest-900">{g.name[0]}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-sand-100">{g.name}</span>
                      <span className="block truncate font-mono text-[10px] text-sand-200/45">{g.email}</span>
                    </span>
                    <ArrowRight size={15} className="ml-auto text-gold-400/70" />
                  </button>
                ))}
              </div>
            )}

            {method === "email" && (
              <form onSubmit={submitEmail} className="mt-4 space-y-3">
                <div className="flex gap-2">
                  {(["login", "register"] as const).map((m) => (
                    <button type="button" key={m} onClick={() => { setMode(m); setError(""); }}
                      className={`flex-1 rounded-lg border py-2 font-mono text-[9.5px] uppercase tracking-[0.12em] ${mode === m ? "border-kapha-400 bg-kapha-500/12 text-kapha-300" : "border-forest-700 text-sand-200/55"}`}>
                      {m === "login" ? "Sign in" : "Create account"}
                    </button>
                  ))}
                </div>
                {mode === "register" && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={input} />}
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={input} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (4+ characters)" className={input} />
                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">
                  <Send size={14} /> {mode === "login" ? "Sign in" : "Create account"}
                </button>
              </form>
            )}

            <p className="mt-4 text-center text-[10.5px] leading-relaxed text-sand-200/35">
              Your basket and order history stay tied to this account.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------- footer ---------------------------------- */

export function Footer() {
  const { navigate, storeEnabled } = useApp();
  return (
    <footer className="border-t border-forest-800 bg-forest-900/50">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo onClick={() => navigate({ name: "home" })} />
            <p className="mt-5 max-w-xs font-display text-lg italic leading-snug text-sand-200/80">
              "Knowledge is medicine. Everything else is a delivery system."
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              <a href="https://instagram.com/vaidyagan" target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/60 transition-all hover:border-gold-400 hover:text-gold-300">
                <Instagram size={16} />
              </a>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/40">@vaidyagan</span>
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-400">Explore</p>
            <div className="mt-4 flex flex-col items-start gap-2.5">
              {([
                ["Clinical Journal", { name: "journal" } as View],
                ["Herb Index", { name: "herbs" } as View],
                ["Prakriti Quiz", { name: "quiz" } as View],
                ...(storeEnabled ? ([["Formulation Store", { name: "store" } as View]] as [string, View][]) : []),
                ["Doctor Studio", { name: "studio" } as View],
                ["My Account", { name: "account" } as View],
                ["Contact Us", { name: "contact" } as View],
              ] as [string, View][]).map(([label, v]) => (
                <button key={label} onClick={() => navigate(v)} className="text-sm text-sand-200/60 transition-colors hover:text-gold-300">
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-400">The promise</p>
            <ul className="mt-4 space-y-2.5 text-sm text-sand-200/60">
              <li className="flex gap-2.5"><Check size={14} className="mt-1 shrink-0 text-gold-500" /> Every essay signed by a registered BAMS vaidya</li>
              <li className="flex gap-2.5"><Check size={14} className="mt-1 shrink-0 text-gold-500" /> Classical citations checked against source texts</li>
              <li className="flex gap-2.5"><Check size={14} className="mt-1 shrink-0 text-gold-500" /> Modern claims tied to citable trials</li>
              <li className="flex gap-2.5"><Check size={14} className="mt-1 shrink-0 text-gold-500" /> No miracle language. Ever.</li>
            </ul>
          </div>
        </div>

        {/* the desk */}
        <div className="mt-14 border-t border-forest-800 pt-8">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-gold-400/70">The publishing desk</p>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
            {AUTHORS.map((a) => (
              <div key={a.id} className="flex items-center gap-2.5">
                <Monogram author={a} size={30} />
                <div>
                  <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-sand-100">{a.name}<SealCheck size={12} className="text-gold-400" /></p>
                  <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-sand-200/40">{a.qualification}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-forest-800 pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sand-200/40">© 2026 Vaidyagan · Knowledge is medicine</p>
          <p className="max-w-md text-[11px] leading-relaxed text-sand-200/35">
            This platform shares classical Ayurvedic knowledge. It is not a substitute for examination —
            for persistent symptoms, consult a registered practitioner in person.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* --------------------------------- toasts ---------------------------------- */

export function ToastHost() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[90] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="flex items-center gap-2.5 rounded-full border border-gold-500/40 bg-forest-900/95 px-5 py-3 text-sm text-sand-100 shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur"
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-400 text-forest-950"><Check size={11} /></span>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
