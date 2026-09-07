import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp, SmartImg, type Address } from "./lib";
import { ORDER_FLOW, ORDER_META, BRAND_LOGO_URL, formatDate, type Order } from "./data";
import { Check, X as Close, Printer, Package, MapPin, ChevronRight, LogOut, Star } from "lucide-react";

/* --------------------------------- invoice ---------------------------------- */

function InvoiceModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const subtotal = (order.items ?? []).reduce((s, i) => s + i.price * i.qty, 0);
  const discount = order.discountAmount ?? 0;
  const shipping = order.shippingFee ?? (subtotal >= 999 ? 0 : 49);
  const grand = order.total || subtotal - discount + shipping;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-forest-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        className="print-area max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-sand-100 p-8 text-forest-900 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between border-b-2 border-gold-500 pb-4">
          <div className="flex items-center gap-3">
            <SmartImg src={BRAND_LOGO_URL} alt="Vaidyagan" className="h-12 w-12 rounded-xl object-cover" />
            <div>
              <p className="font-display text-xl font-semibold">Vaidyagan</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-forest-700">Clinically verified Ayurveda</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-forest-700">Tax invoice</p>
            <p className="font-display text-lg font-semibold text-gold-600">{order.id}</p>
            <p className="font-mono text-[10px] text-forest-700">{formatDate(order.placedAt ?? "")}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-forest-700">Bill to</p>
          <p className="mt-1 text-[13.5px] font-semibold">{order.customer?.name}</p>
          <p className="text-[12px] text-forest-700">{order.customer?.address}, {order.customer?.city} — {order.customer?.pin}</p>
          <p className="text-[12px] text-forest-700">{order.customer?.phone}</p>
        </div>
        <table className="mt-5 w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-forest-300 font-mono text-[9px] uppercase tracking-[0.14em] text-forest-700">
              <th className="py-2 text-left">Item</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(order.items ?? []).map((i, idx) => (
              <tr key={idx} className="border-b border-forest-200">
                <td className="py-2.5">{i.name}</td>
                <td className="py-2.5 text-center">{i.qty}</td>
                <td className="py-2.5 text-right font-semibold">₹{(i.price * i.qty).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 ml-auto w-56 space-y-1.5 text-[12.5px]">
          <div className="flex justify-between text-forest-700"><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
          {discount > 0 && <div className="flex justify-between text-kapha-600"><span>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</span><span>−₹{discount.toLocaleString("en-IN")}</span></div>}
          <div className="flex justify-between text-forest-700"><span>Shipping</span><span>{shipping === 0 ? "Free" : `₹${shipping.toLocaleString("en-IN")}`}</span></div>
          <div className="flex justify-between border-t-2 border-gold-500 pt-2 font-display text-base font-semibold"><span>Grand total</span><span>₹{grand.toLocaleString("en-IN")}</span></div>
        </div>
        <p className="mt-5 border-t border-forest-300 pt-3 text-center font-mono text-[8.5px] uppercase tracking-[0.14em] text-forest-700">Payment: {order.paymentMethod ?? "—"} · vaidyagan@gmail.com · Thank you</p>
        <div className="mt-5 flex justify-center gap-3 print:hidden">
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-full bg-gold-500 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-400"><Printer size={14} /> Print</button>
          <button onClick={onClose} className="flex items-center gap-2 rounded-full border border-forest-400 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-forest-800 hover:bg-forest-200"><Close size={14} /> Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------ tracking timeline ----------------------------- */

function TrackTimeline({ order }: { order: Order }) {
  const idx = ORDER_FLOW.indexOf(order.status as (typeof ORDER_FLOW)[number]);
  const cancelled = order.status === "cancelled";
  return (
    <div className="flex items-center">
      {ORDER_FLOW.map((s, i) => {
        const active = !cancelled && idx >= i;
        const m = ORDER_META[s];
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <span className={`grid h-8 w-8 place-items-center rounded-full border-2 transition-all ${active ? "border-gold-400 bg-gold-400 text-forest-950" : "border-forest-700 bg-forest-900 text-sand-200/40"}`}>
                {active ? <Check size={14} /> : <Package size={13} />}
              </span>
              <span className={`mt-1.5 w-16 text-center font-mono text-[8px] uppercase leading-tight tracking-[0.08em] ${active ? "text-gold-300" : "text-sand-200/35"}`}>{m.label}</span>
            </div>
            {i < ORDER_FLOW.length - 1 && <span className={`mx-1 mb-5 h-0.5 flex-1 rounded ${!cancelled && idx > i ? "bg-gold-400" : "bg-forest-800"}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ---------------------------------- account ---------------------------------- */

export function Account() {
  const { customer, logoutCustomer, myOrders, navigate, toast, saveAddress, deleteAddress, updateCustomer, addToCart, setCartOpen } = useApp();
  const [invoice, setInvoice] = useState<Order | null>(null);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [form, setForm] = useState({ name: customer?.name ?? "", phone: customer?.phone ?? "", email: customer?.email ?? "" });
  const [addrForm, setAddrForm] = useState({ label: "Home" as "Home" | "Work" | "Other", name: "", phone: "", line1: "", city: "", pin: "" });

  if (!customer) {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-40 text-center lg:px-8">
        <p className="font-display text-2xl text-sand-200/70">Sign in to track your orders and save addresses.</p>
        <button onClick={() => navigate({ name: "store" })} className="gold-sheen mt-8 inline-flex items-center gap-2 rounded-full bg-gold-400 px-7 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Browse the store <ChevronRight size={15} /></button>
      </div>
    );
  }

  const reorder = (o: Order) => {
    let added = 0;
    (o.items ?? []).forEach((i) => { if (i.productId) { addToCart(i.productId, i.qty); added += i.qty; } });
    if (added > 0) { setCartOpen(true); toast(`${added} item${added === 1 ? "" : "s"} added back to your basket`); }
    else toast("Those items are no longer on the shelf");
  };

  const input = "w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 placeholder:text-sand-200/25 focus:border-gold-400 focus:outline-none";
  const label = "mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.18em] text-gold-400/80";

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">My account</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-sand-100">Namaste, {customer.name.split(" ")[0]}</h1>
        </div>
        <button onClick={() => { logoutCustomer(); toast("Signed out"); navigate({ name: "home" }); }} className="flex items-center gap-2 rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/60 hover:border-ember-400 hover:text-ember-300"><LogOut size={14} /> Sign out</button>
      </div>

      {/* profile */}
      <div className="mt-10 rounded-2xl border border-forest-800 bg-forest-900/60 p-6">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">Profile</p>
          <button onClick={() => setEditingProfile(!editingProfile)} className="font-mono text-[9px] uppercase tracking-[0.14em] text-sand-200/50 hover:text-gold-300">{editingProfile ? "Close" : "Edit"}</button>
        </div>
        {editingProfile ? (
          <div className="mt-4 space-y-3.5">
            <div className="grid gap-3.5 sm:grid-cols-3">
              <div><label className={label}>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} /></div>
              <div><label className={label}>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} /></div>
              <div><label className={label}>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} /></div>
            </div>
            <button onClick={() => { updateCustomer(form); setEditingProfile(false); toast("Profile updated"); }} className="rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Save</button>
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-sand-200/70">{customer.name} · {customer.phone || "no phone"} · {customer.email || "no email"} <span className="ml-2 font-mono text-[9px] uppercase text-sand-200/40">via {customer.provider}</span></p>
        )}
      </div>

      {/* addresses */}
      <div className="mt-8 rounded-2xl border border-forest-800 bg-forest-900/60 p-6">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">Saved addresses</p>
          <button onClick={() => setEditingAddr({ id: `addr-${Date.now()}`, label: "Home", name: customer.name, phone: customer.phone, line1: "", city: "", state: "", pin: "", isDefault: (customer.addresses ?? []).length === 0 })}
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-gold-300 hover:text-gold-400">+ Add address</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(customer.addresses ?? []).map((a) => (
            <div key={a.id} className="rounded-xl border border-forest-800 bg-forest-850/60 p-4">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-sand-100"><MapPin size={14} className="text-gold-400" /> {a.label}{a.isDefault && <span className="rounded-full bg-gold-400/15 px-2 py-0.5 font-mono text-[8px] uppercase text-gold-300">Default</span>}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-sand-200/65">{a.line1}, {a.city} — {a.pin}</p>
              <button onClick={() => { deleteAddress(a.id); toast("Address removed"); }} className="mt-2 font-mono text-[8.5px] uppercase tracking-[0.12em] text-sand-200/40 hover:text-ember-300">Remove</button>
            </div>
          ))}
          {(customer.addresses ?? []).length === 0 && <p className="text-[13px] text-sand-200/45 sm:col-span-2">No saved addresses yet.</p>}
        </div>
      </div>

      {/* orders */}
      <div className="mt-8">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-gold-400">Your orders</p>
        {myOrders.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-forest-700 p-10 text-center">
            <Package size={30} className="mx-auto text-forest-700" />
            <p className="mt-4 text-sm text-sand-200/45">Your parcels and invoices will appear here.</p>
            <button onClick={() => navigate({ name: "store" })} className="gold-sheen mt-6 inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Shop formulations <ChevronRight size={14} /></button>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {myOrders.map((o) => (
              <div key={o.id} className="rounded-2xl border border-forest-800 bg-forest-900/60 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[13px] font-semibold text-gold-300">{o.id}</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/40">{formatDate(o.placedAt ?? "")} · {(o.items ?? []).reduce((s, i) => s + i.qty, 0)} items · ₹{o.total.toLocaleString("en-IN")}</p>
                  </div>
                  <span className="rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em]" style={{ borderColor: `${ORDER_META[o.status as keyof typeof ORDER_META]?.color ?? "#888"}55`, color: ORDER_META[o.status as keyof typeof ORDER_META]?.color ?? "#888" }}>{ORDER_META[o.status as keyof typeof ORDER_META]?.label ?? o.status}</span>
                </div>
                {o.status !== "cancelled" && <div className="mt-5"><TrackTimeline order={o} /></div>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => setInvoice(o)} className="flex items-center gap-2 rounded-full border border-gold-500/50 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-300 hover:bg-gold-400 hover:text-forest-950"><Printer size={13} /> Invoice</button>
                  {o.status === "delivered" && (
                    <button onClick={() => reorder(o)} className="flex items-center gap-2 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-kapha-400 hover:text-kapha-300"><Package size={13} /> Reorder</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* add address modal */}
      <AnimatePresence>
        {editingAddr && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] grid place-items-center bg-forest-950/80 p-4 backdrop-blur-sm" onClick={() => setEditingAddr(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900 p-6" role="dialog" aria-label="Add address">
              <p className="font-display text-xl font-semibold">New address</p>
              <div className="mt-4 space-y-3.5">
                <div><label className={label}>Label</label><select value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value as "Home" | "Work" | "Other" })} className={input}>{["Home", "Work", "Other"].map((l) => <option key={l}>{l}</option>)}</select></div>
                <div><label className={label}>Recipient</label><input value={addrForm.name} onChange={(e) => setAddrForm({ ...addrForm, name: e.target.value })} className={input} /></div>
                <div><label className={label}>Phone</label><input value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} className={input} /></div>
                <div><label className={label}>Address line</label><input value={addrForm.line1} onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })} className={input} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={label}>City</label><input value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} className={input} /></div>
                  <div><label className={label}>PIN</label><input value={addrForm.pin} onChange={(e) => setAddrForm({ ...addrForm, pin: e.target.value })} className={input} /></div>
                </div>
                <button onClick={() => { if (!addrForm.line1.trim() || !addrForm.city.trim()) { toast("Add at least an address line and city"); return; } saveAddress({ id: editingAddr?.id ?? `addr-${Date.now()}`, state: "", isDefault: false, ...addrForm }); setEditingAddr(null); toast("Address saved"); }}
                  className="w-full rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Save address</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{invoice && <InvoiceModal order={invoice} onClose={() => setInvoice(null)} />}</AnimatePresence>
      <span className="hidden"><Star size={0} /></span>
    </div>
  );
}
