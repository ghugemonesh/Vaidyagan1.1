import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Leaf, ShoppingBag, Menu, X, ArrowRight, Check, Instagram, Plus, Minus, Trash2,
  Mail, Phone, MapPin, User, LogOut, Send, ChevronDown, Star, Lock,
} from "lucide-react";
import { useApp, Monogram, SmartImg, type View } from "./lib";
import { AUTHORS, BRAND_LOGO_URL, FREE_SHIP_AT, type Order } from "./data";

const NAV_LINKS: { label: string; view: View }[] = [
  { label: "Journal", view: { name: "journal" } },
  { label: "Herb Index", view: { name: "herbs" } },
  { label: "Dosha Quiz", view: { name: "quiz" } },
  { label: "Store", view: { name: "store" } },
  { label: "Studio", view: { name: "studio" } },
  { label: "Contact", view: { name: "contact" } },
];

/* ----------------------------------- logo ----------------------------------- */

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick} className="group flex items-center gap-3 text-left" aria-label="Vaidyagan — back to home">
      <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[14px] border-2 border-gold-400/70 bg-forest-850 transition-all duration-500 group-hover:border-gold-300 group-hover:shadow-[0_0_24px_rgba(214,180,95,0.4)]">
        <SmartImg src={BRAND_LOGO_URL} alt="Vaidyagan" className="h-full w-full object-cover" />
      </span>
      <span>
        <span className="block font-display text-xl font-semibold leading-none tracking-wide text-sand-100">Vaidyagan</span>
        <span className="mt-1 block font-mono text-[8.5px] uppercase tracking-[0.34em] text-gold-400/80">वैद्यगण · आयुर्वेद</span>
      </span>
    </button>
  );
}

/* ----------------------------------- nav ------------------------------------ */

export function Nav() {
  const { view, navigate, cart, setCartOpen, storeEnabled, customer, logoutCustomer } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  const links = NAV_LINKS.filter((l) => (l.view.name === "store" ? storeEnabled : true));

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

  const isActive = (l: { view: View }) =>
    view.name === l.view.name || (l.view.name === "journal" && view.name === "article");

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "border-b border-forest-800 bg-forest-950/85 backdrop-blur-md" : "bg-transparent"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
          <Logo onClick={() => navigate({ name: "home" })} />
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <button key={l.label} onClick={() => navigate(l.view)}
                className={`relative rounded-full px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-all duration-300 ${isActive(l) ? "text-gold-300" : "text-sand-200/60 hover:text-sand-100"}`}>
                {l.label}
                {l.label === "Studio" && <Lock size={10} className="ml-1.5 inline -translate-y-px" />}
                {isActive(l) && <motion.span layoutId="nav-dot" className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold-400" />}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href="https://instagram.com/vaidyagan" target="_blank" rel="noreferrer" aria-label="Vaidyagan on Instagram"
              className="hidden h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/70 transition-all duration-300 hover:border-gold-400 hover:text-gold-300 sm:grid">
              <Instagram size={17} />
            </a>

            {/* account */}
            <div className="relative">
              <button onClick={() => setUserOpen(!userOpen)} aria-label="Account"
                className="flex h-10 items-center gap-2 rounded-full border border-forest-700 px-3 text-sand-200/80 transition-all duration-300 hover:border-gold-400 hover:text-gold-300">
                <User size={16} />
                <ChevronDown size={13} className={`transition-transform ${userOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {userOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-forest-700 bg-forest-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    {customer ? (
                      <>
                        <button onClick={() => { navigate({ name: "account" }); setUserOpen(false); }} className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-sand-100 hover:bg-forest-850">
                          <User size={15} className="text-gold-400" /> My Account
                        </button>
                        <button onClick={() => { logoutCustomer(); setUserOpen(false); }} className="flex w-full items-center gap-2.5 border-t border-forest-800 px-4 py-3 text-left text-sm text-sand-200/70 hover:bg-forest-850 hover:text-ember-300">
                          <LogOut size={15} /> Sign out
                        </button>
                      </>
                    ) : (
                      <button onClick={() => { navigate({ name: "account" }); setUserOpen(false); }} className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-sand-100 hover:bg-forest-850">
                        <User size={15} className="text-gold-400" /> Sign in / My Account
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => setCartOpen(true)} aria-label="Open cart"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/80 transition-all duration-300 hover:border-gold-400 hover:text-gold-300">
              <ShoppingBag size={18} />
              {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-gold-400 font-mono text-[10px] font-bold text-forest-950">{count}</span>}
            </button>
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu"
              className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/80 lg:hidden">
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-forest-950/97 backdrop-blur-lg lg:hidden">
            <div className="flex items-center justify-between px-5 py-5">
              <Logo onClick={() => { setMenuOpen(false); navigate({ name: "home" }); }} />
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200">
                <X size={18} />
              </button>
            </div>
            <nav className="mt-10 flex flex-col gap-2 px-8">
              {links.map((l, i) => (
                <motion.button key={l.label} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                  onClick={() => { setMenuOpen(false); navigate(l.view); }}
                  className="flex items-center justify-between border-b border-forest-800 py-4 text-left font-display text-3xl font-semibold text-sand-100 transition-colors hover:text-gold-300">
                  {l.label}
                  <ArrowRight size={20} className="text-gold-500/60" />
                </motion.button>
              ))}
            </nav>
            <p className="mt-10 px-8 font-mono text-[10px] uppercase tracking-[0.3em] text-sand-200/40">@vaidyagan · clinically verified</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------------------------- cart ------------------------------------ */

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, changeQty, removeLine, products, storeEnabled } = useApp();
  const [checkout, setCheckout] = useState(false);
  const lines = cart.map((l) => ({ ...l, product: products.find((p) => p.id === l.id) })).filter((l) => l.product);
  const subtotal = lines.reduce((s, l) => s + (l.product?.price ?? 0) * l.qty, 0);
  const progress = Math.min(100, (subtotal / FREE_SHIP_AT) * 100);

  useEffect(() => { if (!cartOpen) setCheckout(false); }, [cartOpen]);

  return (
    <AnimatePresence>
      {cartOpen && storeEnabled && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-forest-950/70 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col border-l border-forest-800 bg-forest-900" role="dialog" aria-label="Shopping cart">
            {!checkout ? (
              <>
                <div className="flex items-center justify-between border-b border-forest-800 px-6 py-5">
                  <p className="font-display text-2xl font-semibold text-sand-100">Your basket</p>
                  <button onClick={() => setCartOpen(false)} aria-label="Close cart" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><X size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {lines.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <ShoppingBag size={40} className="text-forest-700" />
                      <p className="mt-4 font-display text-xl text-sand-200/70">The basket is empty</p>
                      <p className="mt-2 text-sm text-sand-200/45">Classical formulations are waiting in the store.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lines.map((l) => (
                        <div key={l.id} className="flex gap-4 rounded-xl border border-forest-800 bg-forest-850/60 p-3">
                          <SmartImg src={l.product!.image} alt={l.product!.name} className="h-20 w-20 shrink-0 rounded-lg object-cover duotone" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-sand-100">{l.product!.name}</p>
                            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gold-400/80">₹{l.product!.price}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-2 rounded-full border border-forest-700 px-1 py-0.5">
                                <button onClick={() => changeQty(l.id, -1)} aria-label="Decrease" className="grid h-6 w-6 place-items-center text-sand-200/70 hover:text-gold-300"><Minus size={12} /></button>
                                <span className="w-5 text-center font-mono text-xs text-sand-100">{l.qty}</span>
                                <button onClick={() => changeQty(l.id, 1)} aria-label="Increase" className="grid h-6 w-6 place-items-center text-sand-200/70 hover:text-gold-300"><Plus size={12} /></button>
                              </div>
                              <button onClick={() => removeLine(l.id)} aria-label="Remove item" className="text-sand-200/35 transition-colors hover:text-ember-400"><Trash2 size={15} /></button>
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
                  <button onClick={() => setCheckout(true)} disabled={lines.length === 0}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 disabled:opacity-35">
                    Proceed to checkout <ArrowRight size={15} />
                  </button>
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
    return { name: customer?.name ?? "", phone: d?.phone || customer?.phone || "", address: d?.line1 ?? "", city: d?.city ?? "", pin: d?.pin ?? "" };
  });

  const finish = () => {
    const order = placeOrder(form, pay);
    if (customer && saveAddr && form.address.trim()) {
      saveAddress({ id: `addr-${Date.now()}`, label: "Home", name: form.name, phone: form.phone, line1: form.address, city: form.city, state: "", pin: form.pin, isDefault: customer.addresses.length === 0 });
    }
    setPlaced(order);
    setStep(2);
    toast(`Order ${order.id} placed — the desk has been notified`);
  };

  const input = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/30 focus:border-gold-400 focus:outline-none";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-forest-800 px-6 py-5">
        <p className="font-display text-2xl font-semibold text-sand-100">{step === 0 ? "Delivery" : step === 1 ? "Payment" : "Confirmed"}</p>
        {step < 2 && (
          <button onClick={() => (step === 0 ? onDone() : setStep(0))} className="font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/50 hover:text-gold-300">Back</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {step === 0 && (
          <div className="space-y-3.5">
            {([["Full name", "name", "Dr. …"], ["Phone", "phone", "+91 …"], ["Address", "address", "Flat, street, landmark"], ["City", "city", "Pune"], ["PIN code", "pin", "411001"]] as [string, keyof typeof form, string][]).map(([label, key, ph]) => (
              <div key={key}>
                <label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.18em] text-gold-400/80">{label}</label>
                <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={ph} className={input} />
              </div>
            ))}
            <button onClick={() => setStep(1)} disabled={Object.values(form).some((v) => !v.trim())}
              className="mt-2 w-full rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300 disabled:opacity-35">
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
              <p className="mt-2 text-xs leading-relaxed text-sand-200/50">Demo checkout — no money moves. In production this step opens Razorpay (UPI, cards, net-banking).</p>
            </div>
            <div className="mt-5 space-y-2.5">
              {["UPI — vaidyagan@upi", "Card — sandbox 4242…", "Cash on delivery"].map((m, i) => (
                <label key={m} className="flex cursor-pointer items-center gap-3 rounded-lg border border-forest-700 px-4 py-3 transition-all hover:border-gold-400">
                  <input type="radio" name="pay" checked={pay === m.split(" ")[0]} onChange={() => setPay(m.split(" ")[0])} className="accent-[#d6b45f]" />
                  <span className="text-sm text-sand-100">{m}</span>
                </label>
              ))}
            </div>
            {customer && (
              <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-sand-200/70">
                <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="accent-[#d6b45f]" />
                Save this address to my account
              </label>
            )}
            <button onClick={finish} className="mt-6 w-full rounded-full bg-gold-400 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-all hover:bg-gold-300">
              Place order · ₹{subtotal.toLocaleString("en-IN")}
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full border-2 border-kapha-400 bg-kapha-500/15 text-kapha-300"><Check size={34} /></span>
            <p className="mt-6 font-display text-2xl font-semibold text-sand-100">Order {placed?.id ?? "VG-0000"}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-sand-200/60">Your formulations are being batch-checked and will ship within 48 hours. A vaidya's note travels with every parcel.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => { onDone(); navigate({ name: "account" }); }} className="rounded-full border border-gold-500/50 px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">Track my order</button>
              <button onClick={onDone} className="rounded-full border border-forest-700 px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/60 hover:text-sand-100">Keep browsing</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- toasts ----------------------------------- */

export function ToastHost() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[90] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}
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
          <ArrowRight size={17} className="-rotate-90" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------- footer ----------------------------------- */

export function Footer() {
  const { navigate, storeEnabled, deskDoctors } = useApp();
  const links: [string, View][] = [
    ["Clinical Journal", { name: "journal" }], ["Herb Index", { name: "herbs" }], ["Prakriti Quiz", { name: "quiz" }],
    ...(storeEnabled ? ([["Formulation Store", { name: "store" }]] as [string, View][]) : []),
    ["Doctor Studio", { name: "studio" }], ["Contact", { name: "contact" }], ["My Account", { name: "account" }],
  ];
  return (
    <footer className="relative overflow-hidden border-t border-forest-800 bg-forest-900/50">
      <span aria-hidden className="pointer-events-none absolute -bottom-14 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[11rem] font-semibold italic leading-none text-gold-400/[0.04]">वैद्यगण</span>
      <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo onClick={() => navigate({ name: "home" })} />
            <p className="mt-5 max-w-xs font-display text-lg italic leading-snug text-sand-200/80">"Knowledge is medicine. Everything else is a delivery system."</p>
            <div className="mt-6 flex items-center gap-2.5">
              <a href="https://instagram.com/vaidyagan" target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full border border-forest-700 text-sand-200/60 transition-all hover:border-gold-400 hover:text-gold-300"><Instagram size={16} /></a>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-sand-200/40">@vaidyagan</span>
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-400">Explore</p>
            <div className="mt-4 flex flex-col items-start gap-2.5">
              {links.map(([label, v]) => (
                <button key={label} onClick={() => navigate(v)} className="text-sm text-sand-200/60 transition-colors hover:text-gold-300">{label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-400">The publishing desk</p>
            <div className="mt-4 space-y-3">
              {deskDoctors.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <Monogram author={a} size={36} />
                  <div>
                    <p className="text-[13px] font-semibold text-sand-100">{a.name}</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/40">{a.qualification} · {a.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-1.5 text-[12.5px] text-sand-200/55">
              <p className="flex items-center gap-2"><Mail size={13} className="text-gold-400/70" /> vaidyagan@gmail.com</p>
              <p className="flex items-center gap-2"><Phone size={13} className="text-gold-400/70" /> +91 77688 56093</p>
              <p className="flex items-center gap-2"><MapPin size={13} className="text-gold-400/70" /> Pune, Maharashtra</p>
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-forest-800 pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sand-200/40">© 2026 Vaidyagan · Knowledge is medicine</p>
          <p className="max-w-md text-[11px] leading-relaxed text-sand-200/35">This platform shares classical Ayurvedic knowledge. It is not a substitute for examination — for persistent symptoms, consult a registered practitioner in person.</p>
        </div>
      </div>
    </footer>
  );
}
