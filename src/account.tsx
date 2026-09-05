import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp, SmartImg, Stars, type Address } from "./lib";
import { BRAND_LOGO_URL, ORDER_META, ORDER_FLOW, PRODUCTS, formatDate, type Order } from "./data";
import { Check, Close, Plus, Trash, Download, Cart, Person } from "./icons";

type Tab = "profile" | "addresses" | "orders";

function inrWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number): string => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`);
  const three = (n: number): string => `${n >= 100 ? ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " : "") : ""}${two(n % 100)}`.trim();
  let n = Math.round(num);
  if (n === 0) return "Zero Rupees Only";
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const thousand = Math.floor(n / 1e3); n %= 1e3;
  const parts: string[] = [];
  if (crore) parts.push(`${two(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (n) parts.push(three(n));
  return `${parts.join(" ")} Rupees Only`;
}

function TrackingTimeline({ order }: { order: Order }) {
  const idx = order.status === "cancelled" ? -1 : ORDER_FLOW.indexOf(order.status);
  if (order.status === "cancelled") {
    return (
      <p className="rounded-xl border border-ember-500/35 bg-ember-500/8 px-4 py-3 text-[13px] text-ember-300">
        This order was cancelled. Any payment is being returned to its source.
      </p>
    );
  }
  return (
    <ol className="flex items-start">
      {ORDER_FLOW.map((s, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <li key={s} className="relative flex-1 text-center">
            <span className={`mx-auto grid h-8 w-8 place-items-center rounded-full border-2 transition-all ${done ? "border-[#5f947e] bg-[#5f947e]/20 text-[#a9cfbf]" : "border-forest-700 text-sand-200/30"} ${active ? "shadow-[0_0_18px_rgba(130,179,158,0.4)]" : ""}`}>
              {done ? <Check size={14} /> : <span className="font-mono text-[10px]">{i + 1}</span>}
            </span>
            {i < ORDER_FLOW.length - 1 && (
              <span className={`absolute left-[calc(50%+18px)] top-4 h-0.5 w-[calc(100%-36px)] ${i < idx ? "bg-[#5f947e]" : "bg-forest-700"}`} />
            )}
            <p className={`mt-2 font-mono text-[8px] uppercase leading-tight tracking-[0.1em] ${done ? "text-[#a9cfbf]" : "text-sand-200/35"}`}>{ORDER_META[s].label}</p>
          </li>
        );
      })}
    </ol>
  );
}

function InvoiceModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 999 ? 0 : 49;
  const grand = order.total > 0 ? order.total + (order.total === subtotal ? shipping : 0) : subtotal + shipping;

  const print = () => {
    try {
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(`
        <html><head><title>Invoice ${order.id}</title>
        <style>
          body{font-family:Georgia,serif;color:#22271f;padding:40px;max-width:760px;margin:0 auto}
          .hd{display:flex;align-items:center;gap:16px;border-bottom:3px solid #c49c3e;padding-bottom:16px}
          .hd img{width:56px;height:56px;border-radius:12px;object-fit:cover}
          h1{margin:0;font-size:26px} small{color:#777;font-family:monospace}
          .grid{display:flex;justify-content:space-between;margin:22px 0;gap:24px}
          table{width:100%;border-collapse:collapse;margin-top:8px}
          th,td{border-bottom:1px solid #e2ddcf;padding:9px 8px;text-align:left;font-size:14px}
          th{font-family:monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a37e2a}
          .tot td{font-weight:bold;border-bottom:none} .amt{text-align:right}
          .words{font-style:italic;color:#666;font-size:12px;margin-top:14px}
          .ft{margin-top:34px;padding-top:14px;border-top:1px solid #e2ddcf;font-size:11px;color:#888}
        </style></head><body>
        <div class="hd">
          <img src="${BRAND_LOGO_URL}" alt="Vaidyagan" onerror="this.style.display='none'"/>
          <div><h1>Vaidyagan</h1><small>Clinically verified Ayurveda · vaidyagan@gmail.com</small></div>
          <div style="margin-left:auto;text-align:right"><small>TAX INVOICE</small><br/><b>${order.id}</b><br/><small>${formatDate(order.placedAt)}</small></div>
        </div>
        <div class="grid">
          <div><small>BILL TO</small><br/><b>${order.customer.name}</b><br/>${order.customer.address}, ${order.customer.city} — ${order.customer.pin}<br/>${order.customer.phone}</div>
          <div style="text-align:right"><small>PAYMENT</small><br/>${order.paymentMethod ?? "—"}</div>
        </div>
        <table>
          <tr><th>Item</th><th>Qty</th><th class="amt">Rate</th><th class="amt">Amount</th></tr>
          ${order.items.map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td><td class="amt">₹${i.price.toLocaleString("en-IN")}</td><td class="amt">₹${(i.price * i.qty).toLocaleString("en-IN")}</td></tr>`).join("")}
          <tr><td colspan="3">Shipping</td><td class="amt">${shipping === 0 ? "Free" : `₹${shipping}`}</td></tr>
          <tr class="tot"><td colspan="3">Grand total</td><td class="amt">₹${grand.toLocaleString("en-IN")}</td></tr>
        </table>
        <p class="words">Amount in words: ${inrWords(grand)}</p>
        <p class="ft">Thank you for trusting classical Ayurveda. This is a computer-generated invoice — no signature required.<br/>Vaidyagan · Pune, Maharashtra · This is a demo invoice.</p>
        </body></html>`);
      w.document.close();
      w.focus();
      w.print();
    } catch { /* popup blocked */ }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[66] flex items-center justify-center bg-forest-950/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900 p-6" role="dialog" aria-label={`Invoice ${order.id}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SmartImg src={BRAND_LOGO_URL} alt="Vaidyagan" className="h-14 w-14 rounded-[14px] border-2 border-gold-500/70 object-cover" />
            <div>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-gold-400">Tax invoice</p>
              <p className="font-display text-2xl font-semibold text-sand-100">{order.id}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close invoice" className="grid h-9 w-9 place-items-center rounded-full border border-forest-700 text-sand-200 hover:text-gold-300"><Close size={15} /></button>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-sand-200/60">
          {order.customer.name} · {order.customer.address}, {order.customer.city} — {order.customer.pin} · {formatDate(order.placedAt)}
        </p>
        <div className="mt-4 space-y-2">
          {order.items.map((i, x) => (
            <div key={x} className="flex items-center justify-between border-b border-forest-800 py-2 text-sm">
              <span className="text-sand-200/80">{i.name} <span className="text-sand-200/40">× {i.qty}</span></span>
              <span className="font-mono text-sand-100">₹{(i.price * i.qty).toLocaleString("en-IN")}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-sand-200/60">Shipping</span>
            <span className="font-mono text-sand-100">{shipping === 0 ? "Free" : `₹${shipping}`}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-gold-400">Grand total</span>
            <span className="font-display text-xl font-semibold text-gold-300">₹{grand.toLocaleString("en-IN")}</span>
          </div>
          <p className="pt-1 text-right font-display text-[11.5px] italic text-sand-200/45">{inrWords(grand)}</p>
        </div>
        <button onClick={print} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">
          <Download size={14} /> Print / save PDF
        </button>
      </motion.div>
    </motion.div>
  );
}

export function Account() {
  const { customer, logoutCustomer, updateCustomer, saveAddress, deleteAddress, myOrders, navigate, addToCart, toast, cancelOrder, setCartOpen, setAccountAuthOpen } = useApp();
  const [tab, setTab] = useState<Tab>("orders");
  const [invoice, setInvoice] = useState<Order | null>(null);
  const [addrForm, setAddrForm] = useState<Address | null>(null);
  const [profile, setProfile] = useState({ name: customer?.name ?? "", phone: customer?.phone ?? "", email: customer?.email ?? "" });

  if (!customer) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 pb-24 pt-32 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-gold-500/40 bg-gold-400/10 text-gold-300"><Person size={26} /></span>
        <h1 className="mt-6 font-display text-3xl font-semibold text-sand-100">Sign in to see your account</h1>
        <p className="mt-3 text-sm leading-relaxed text-sand-200/55">Orders, addresses and prescriptions live here.</p>
        <button onClick={() => setAccountAuthOpen(true)} className="mt-7 rounded-full bg-gold-400 px-8 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Sign in</button>
      </div>
    );
  }

  const input = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/30 focus:border-gold-400 focus:outline-none";

  const reorder = (o: Order) => {
    let added = 0;
    o.items.forEach((i) => {
      if (!i.productId) return;
      const p = PRODUCTS.find((x) => x.id === i.productId);
      if (p && p.stock > 0) { addToCart(i.productId, i.qty); added++; }
    });
    if (added > 0) { toast(`${added} item${added > 1 ? "s" : ""} added back to your basket`); setCartOpen(true); }
    else toast("Those items are out of stock right now");
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 lg:px-8 lg:pt-32">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-gold-500/50 bg-gold-400/10 font-display text-xl font-semibold text-gold-300">
          {customer.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold text-sand-100">Namaste, {customer.name.split(" ")[0]}</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sand-200/45">Member since {formatDate(customer.createdAt)}</p>
        </div>
        <button onClick={() => { logoutCustomer(); toast("Signed out — see you soon"); navigate({ name: "home" }); }}
          className="ml-auto rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/60 hover:border-ember-400 hover:text-ember-300">
          Sign out
        </button>
      </div>

      <div className="mt-9 grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col">
          {([["orders", "My Orders"], ["addresses", "Manage Addresses"], ["profile", "Profile Information"]] as [Tab, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`shrink-0 rounded-xl border px-5 py-3 text-left font-mono text-[10.5px] uppercase tracking-[0.16em] transition-all ${tab === k ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-800 text-sand-200/55 hover:text-sand-100"}`}>
              {label}
            </button>
          ))}
        </nav>

        <div>
          {tab === "profile" && (
            <div className="max-w-lg space-y-4 rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Profile information</p>
              <div><label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-sand-200/50">Full name</label><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={input} /></div>
              <div><label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-sand-200/50">Phone</label><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className={input} /></div>
              <div><label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-sand-200/50">Email</label><input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className={input} disabled={customer.provider === "google"} /></div>
              <button onClick={() => { updateCustomer({ name: profile.name, phone: profile.phone, email: profile.email }); toast("Profile updated"); }}
                className="rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">
                Save changes
              </button>
            </div>
          )}

          {tab === "addresses" && (
            <div>
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Your addresses</p>
                <button onClick={() => setAddrForm({ id: `addr-${Date.now()}`, label: "Home", name: customer.name, phone: customer.phone, line1: "", city: "", state: "", pin: "", isDefault: customer.addresses.length === 0 })}
                  className="flex items-center gap-1.5 rounded-full border border-gold-500/50 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-300 hover:bg-gold-400 hover:text-forest-950">
                  <Plus size={13} /> Add address
                </button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {customer.addresses.length === 0 && <p className="rounded-xl border border-dashed border-forest-700 p-8 text-center text-sm text-sand-200/50 sm:col-span-2">No saved addresses yet — add one for faster checkout.</p>}
                {customer.addresses.map((a) => (
                  <div key={a.id} className="rounded-xl border border-forest-800 bg-forest-900/70 p-5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-moss-500/40 bg-moss-500/10 px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-moss-300">{a.label}</span>
                      {a.isDefault && <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-gold-400">Default</span>}
                      <button onClick={() => { deleteAddress(a.id); toast("Address removed"); }} aria-label="Delete address" className="ml-auto text-sand-200/35 hover:text-ember-300"><Trash size={14} /></button>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-sand-100">{a.name}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-sand-200/65">{a.line1}, {a.city}{a.state ? `, ${a.state}` : ""} — {a.pin}</p>
                    <p className="mt-1 font-mono text-[11px] text-sand-200/45">{a.phone}</p>
                  </div>
                ))}
              </div>
              <AnimatePresence>
                {addrForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-5 grid gap-3 rounded-2xl border border-forest-700 bg-forest-900/80 p-6 sm:grid-cols-2">
                      <input value={addrForm.name} onChange={(e) => setAddrForm({ ...addrForm, name: e.target.value })} placeholder="Receiver name" className={input} />
                      <input value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} placeholder="Phone" className={input} />
                      <input value={addrForm.line1} onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })} placeholder="Flat, street, landmark" className={`${input} sm:col-span-2`} />
                      <input value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} placeholder="City" className={input} />
                      <div className="grid grid-cols-2 gap-3">
                        <input value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} placeholder="State" className={input} />
                        <input value={addrForm.pin} onChange={(e) => setAddrForm({ ...addrForm, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="PIN" className={input} />
                      </div>
                      <div className="flex gap-2 sm:col-span-2">
                        <button onClick={() => { if (!addrForm.line1.trim() || !addrForm.city.trim()) { toast("Add at least the street and city"); return; } saveAddress(addrForm); setAddrForm(null); toast("Address saved"); }}
                          className="rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Save address</button>
                        <button onClick={() => setAddrForm(null)} className="rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/60">Cancel</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {tab === "orders" && (
            <div className="space-y-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Your orders · {myOrders.length}</p>
              {myOrders.length === 0 && (
                <div className="rounded-2xl border border-dashed border-forest-700 p-12 text-center">
                  <Cart size={30} className="mx-auto text-forest-600" />
                  <p className="mt-4 font-display text-xl text-sand-200/70">No orders yet</p>
                  <button onClick={() => navigate({ name: "store" })} className="mt-5 rounded-full bg-gold-400 px-7 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Browse the store</button>
                </div>
              )}
              {myOrders.map((o) => (
                <div key={o.id} className="rounded-2xl border border-forest-800 bg-forest-900/70 p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <p className="font-display text-xl font-semibold text-sand-100">{o.id}</p>
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand-200/45">{formatDate(o.placedAt)} · {o.paymentMethod ?? "—"}</p>
                    </div>
                    <span className="rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em]"
                      style={{ borderColor: `${ORDER_META[o.status].color}66`, color: ORDER_META[o.status].color, background: `${ORDER_META[o.status].color}12` }}>
                      {ORDER_META[o.status].label}
                    </span>
                    <span className="ml-auto font-display text-2xl font-semibold text-gold-300">₹{o.total.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="mt-5"><TrackingTimeline order={o} /></div>
                  <div className="mt-5 space-y-2.5 border-t border-forest-800 pt-4">
                    {o.items.map((i, x) => (
                      <div key={x} className="flex items-center gap-3">
                        {i.image ? <SmartImg src={i.image} alt={i.name} className="h-12 w-12 rounded-lg border border-forest-800 object-cover duotone" /> : <span className="grid h-12 w-12 place-items-center rounded-lg border border-forest-800 bg-forest-850 font-display text-gold-500/40">वै</span>}
                        <p className="flex-1 text-[13.5px] text-sand-200/80">{i.name} <span className="text-sand-200/40">× {i.qty}</span></p>
                        <span className="font-mono text-[12px] text-sand-100">₹{(i.price * i.qty).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <button onClick={() => setInvoice(o)} className="flex items-center gap-1.5 rounded-full border border-gold-500/50 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-300 hover:bg-gold-400 hover:text-forest-950"><Download size={13} /> Invoice</button>
                    <button onClick={() => reorder(o)} className="flex items-center gap-1.5 rounded-full border border-moss-500/50 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-moss-300 hover:bg-moss-500/15"><Cart size={13} /> Reorder</button>
                    {(o.status === "new" || o.status === "processing") && (
                      <button onClick={() => { cancelOrder(o.id); toast(`Order ${o.id} cancelled — the desk has been informed`); }}
                        className="flex items-center gap-1.5 rounded-full border border-ember-500/50 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ember-300 hover:bg-ember-500/15">
                        <Close size={12} /> Cancel order
                      </button>
                    )}
                    {o.items[0]?.productId && (
                      <button onClick={() => navigate({ name: "product", id: o.items[0].productId as string })}
                        className="ml-auto rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/55 hover:text-gold-300">
                        View item
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <span className="hidden"><Stars rating={0} size={0} /></span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>{invoice && <InvoiceModal order={invoice} onClose={() => setInvoice(null)} />}</AnimatePresence>
    </div>
  );
}
