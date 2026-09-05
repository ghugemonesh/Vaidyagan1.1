import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { User, Package, MapPin, LogOut, Printer, X, Check, Truck, ChevronRight } from "lucide-react";
import { useApp, SmartImg, type Address } from "./lib";
import { BRAND_LOGO_URL, ORDER_META, ORDER_FLOW, formatDate, type Order } from "./data";

/* --------------------------------- invoice ---------------------------------- */

function InvoiceModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 999 ? 0 : 49;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-forest-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-sand-100 p-8 text-forest-900 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
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
            <p className="font-mono text-[10px] text-forest-700">{formatDate(order.placedAt)}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-forest-700">Bill to</p>
          <p className="mt-1 text-[13.5px] font-semibold">{order.customer.name}</p>
          <p className="text-[12px] text-forest-700">{order.customer.address}, {order.customer.city} — {order.customer.pin}</p>
          <p className="text-[12px] text-forest-700">{order.customer.phone}</p>
        </div>
        <table className="mt-5 w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-forest-300 font-mono text-[9px] uppercase tracking-[0.14em] text-forest-700">
              <th className="py-2 text-left">Item</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i, idx) => (
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
          <div className="flex justify-between text-forest-700"><span>Shipping</span><span>{shipping === 0 ? "Free" : `₹${shipping}`}</span></div>
          <div className="flex justify-between border-t-2 border-gold-500 pt-2 font-display text-base font-semibold"><span>Grand total</span><span>₹{(subtotal + shipping).toLocaleString("en-IN")}</span></div>
        </div>
        <p className="mt-5 border-t border-forest-300 pt-3 text-center font-mono text-[8.5px] uppercase tracking-[0.14em] text-forest-700">Payment: {order.paymentMethod ?? "—"} · vaidyagan@gmail.com · Thank you</p>
        <div className="mt-5 flex justify-center gap-3 print:hidden">
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-full bg-gold-500 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-400"><Printer size={14} /> Print</button>
          <button onClick={onClose} className="flex items-center gap-2 rounded-full border border-forest-400 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-forest-800 hover:bg-forest-200"><X size={14} /> Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------ tracking timeline ----------------------------- */

function TrackTimeline({ order }: { order: Order }) {
  const idx = ORDER_FLOW.indexOf(order.status as any);
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
                {active ? <Check size={14} /> : <Truck size={13} />}
              </span>
              <span className={`mt-1.5 w-16 text-center font-mono text-[8px] uppercase tracking-[0.08em] leading-tight ${active ? "text-gold-300" : "text-sand-200/35"}`}>{m.label}</span>
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
  const { customer, logoutCustomer, myOrders, navigate, toast, saveAddress, deleteAddress, updateCustomer } = useApp();
  const [tab, setTab] = useState<"orders" | "profile" | "addresses">("orders");
  const [invoice, setInvoice] = useState<Order | null>(null);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);

  if (!customer) {
    return (
      <div className="mx-auto max-w-xl px-5 pb-24 pt-40 text-center lg:px-8">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-gold-500/40 bg-gold-400/8 text-gold-300"><User size={30} /></span>
        <h1 className="mt-8 font-display text-4xl font-semibold text-sand-100">Sign in to your account</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-sand-200/60">Place an order in the store and you'll be signed in automatically — then track parcels, save addresses and reorder in one tap.</p>
        <button onClick={() => navigate({ name: "store" })} className="gold-sheen mt-8 inline-flex items-center gap-2 rounded-full bg-gold-400 px-7 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">Browse the store <ChevronRight size={15} /></button>
      </div>
    );
  }

  const totalSpent = myOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-gold-500/50 bg-gold-400/10 font-display text-2xl font-semibold text-gold-300">
            {customer.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </span>
          <div>
            <h1 className="font-display text-3xl font-semibold text-sand-100">{customer.name}</h1>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/45">{customer.email || customer.phone} · via {customer.provider}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-forest-800 bg-forest-900/70 px-5 py-3 text-center">
            <p className="font-display text-xl font-semibold text-gold-300">₹{totalSpent.toLocaleString("en-IN")}</p>
            <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-sand-200/40">lifetime</p>
          </div>
          <button onClick={() => { logoutCustomer(); toast("Signed out"); navigate({ name: "home" }); }} className="flex items-center gap-2 rounded-full border border-forest-700 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-ember-400 hover:text-ember-300"><LogOut size={14} /> Sign out</button>
        </div>
      </div>

      {/* tabs */}
      <div className="mt-10 flex flex-wrap gap-2 border-b border-forest-800">
        {([["orders", "My Orders", Package], ["profile", "Profile", User], ["addresses", "Addresses", MapPin]] as const).map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center gap-2 rounded-t-xl border border-b-0 px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-all ${tab === k ? "border-gold-500/50 bg-forest-900 text-gold-300" : "border-forest-800 bg-forest-900/40 text-sand-200/50 hover:text-sand-100"}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="rounded-b-xl rounded-tr-xl border border-forest-800 bg-forest-900/60 p-6 sm:p-8">
        {tab === "orders" && (
          <div className="space-y-5">
            {myOrders.length === 0 && (
              <div className="py-14 text-center">
                <Package size={36} className="mx-auto text-forest-700" />
                <p className="mt-4 font-display text-xl text-sand-200/70">No orders yet</p>
                <p className="mt-2 text-sm text-sand-200/45">Your parcels and invoices will appear here.</p>
                <button onClick={() => navigate({ name: "store" })} className="gold-sheen mt-6 inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Shop formulations <ChevronRight size={14} /></button>
              </div>
            )}
            {myOrders.map((o) => {
              const m = ORDER_META[o.status];
              return (
                <div key={o.id} className="rounded-xl border border-forest-800 bg-forest-850/50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[13px] font-semibold text-gold-300">{o.id}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/40">{formatDate(o.placedAt)}</p>
                    </div>
                    <span className={`rounded-full border px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] ${m.cls}`}>{m.label}</span>
                  </div>
                  {(o.status === "new" || o.status === "processing" || o.status === "shipped" || o.status === "out") && (
                    <div className="mt-5"><TrackTimeline order={o} /></div>
                  )}
                  <div className="mt-4 space-y-2 border-t border-forest-800 pt-4">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {i.image ? <SmartImg src={i.image} alt={i.name} className="h-11 w-11 rounded-lg object-cover duotone" /> : <span className="grid h-11 w-11 place-items-center rounded-lg border border-forest-800 bg-forest-850 font-display text-gold-500/40">वै</span>}
                        <p className="min-w-0 flex-1 truncate text-[13px] text-sand-200/75">{i.name} <span className="text-sand-200/40">× {i.qty}</span></p>
                        <p className="font-mono text-[12px] text-sand-100">₹{(i.price * i.qty).toLocaleString("en-IN")}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-forest-800 pt-4">
                    <p className="font-display text-lg font-semibold text-sand-100">Total ₹{o.total.toLocaleString("en-IN")}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setInvoice(o)} className="flex items-center gap-2 rounded-full border border-gold-500/50 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-300 hover:bg-gold-400 hover:text-forest-950"><Printer size={13} /> Invoice</button>
                      {o.status === "delivered" && (
                        <button onClick={() => { o.items.forEach((i) => { if (i.productId) { /* re-add via store */ } }); toast("Reorder — items restocked in the store"); navigate({ name: "store" }); }} className="flex items-center gap-2 rounded-full border border-forest-700 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-200/60 hover:border-kapha-400 hover:text-kapha-300"><Package size={13} /> Reorder</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "profile" && (
          <div className="max-w-md space-y-4">
            <div>
              <label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Full name</label>
              <input defaultValue={customer.name} onBlur={(e) => { if (e.target.value.trim() && e.target.value !== customer.name) { updateCustomer({ name: e.target.value.trim() }); toast("Name updated"); } }} className="w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 focus:border-gold-400 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Phone</label>
              <input defaultValue={customer.phone} onBlur={(e) => { if (e.target.value !== customer.phone) { updateCustomer({ phone: e.target.value }); toast("Phone updated"); } }} className="w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 focus:border-gold-400 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Email</label>
              <div className="flex items-center gap-2.5 rounded-lg border border-forest-800 bg-forest-950/40 px-3.5 py-2.5">
                <span className="flex-1 text-sm text-sand-200/60">{customer.email || "—"}</span>
                <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-kapha-300">verified</span>
              </div>
            </div>
            <p className="pt-2 text-[12px] text-sand-200/40">Member since {formatDate(customer.createdAt)} · provider: {customer.provider}</p>
          </div>
        )}

        {tab === "addresses" && (
          <div>
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">{customer.addresses.length} saved address{customer.addresses.length === 1 ? "" : "es"}</p>
              <button onClick={() => setEditingAddr({ id: `addr-${Date.now()}`, label: "Home", name: customer.name, phone: customer.phone, line1: "", city: "", state: "", pin: "", isDefault: customer.addresses.length === 0 })} className="gold-sheen flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300">+ Add address</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {customer.addresses.map((a) => (
                <div key={a.id} className="rounded-xl border border-forest-800 bg-forest-850/50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-gold-500/40 bg-gold-400/10 px-3 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-gold-300">{a.label}{a.isDefault ? " · default" : ""}</span>
                    <button onClick={() => { deleteAddress(a.id); toast("Address removed"); }} aria-label="Delete address" className="text-sand-200/35 hover:text-ember-400"><X size={15} /></button>
                  </div>
                  <p className="mt-3 text-[13.5px] font-semibold text-sand-100">{a.name}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-sand-200/65">{a.line1}, {a.city}{a.state ? `, ${a.state}` : ""} — {a.pin}</p>
                  <p className="mt-1 text-[12px] text-sand-200/45">{a.phone}</p>
                </div>
              ))}
              {customer.addresses.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-forest-700 p-10 text-center text-sm text-sand-200/45">No saved addresses — add one for faster checkout.</p>}
            </div>
          </div>
        )}
      </div>

      {/* address editor */}
      <AnimatePresence>
        {editingAddr && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-forest-950/80 p-4 backdrop-blur-sm" onClick={() => setEditingAddr(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-forest-700 bg-forest-900 p-6">
              <div className="flex items-center justify-between">
                <p className="font-display text-xl font-semibold text-sand-100">New address</p>
                <button onClick={() => setEditingAddr(null)} aria-label="Close" className="text-sand-200/50 hover:text-gold-300"><X size={17} /></button>
              </div>
              <div className="mt-4 space-y-3">
                <input value={editingAddr.label} onChange={(e) => setEditingAddr({ ...editingAddr, label: e.target.value as Address["label"] })} placeholder="Label (Home / Work)" className="w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 focus:border-gold-400 focus:outline-none" />
                <input value={editingAddr.line1} onChange={(e) => setEditingAddr({ ...editingAddr, line1: e.target.value })} placeholder="Flat, street, landmark" className="w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 focus:border-gold-400 focus:outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={editingAddr.city} onChange={(e) => setEditingAddr({ ...editingAddr, city: e.target.value })} placeholder="City" className="rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 focus:border-gold-400 focus:outline-none" />
                  <input value={editingAddr.pin} onChange={(e) => setEditingAddr({ ...editingAddr, pin: e.target.value })} placeholder="PIN" className="rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 focus:border-gold-400 focus:outline-none" />
                </div>
                <input value={editingAddr.phone} onChange={(e) => setEditingAddr({ ...editingAddr, phone: e.target.value })} placeholder="Phone" className="w-full rounded-lg border border-forest-700 bg-forest-950/60 px-3.5 py-2.5 text-sm text-sand-100 focus:border-gold-400 focus:outline-none" />
                <button onClick={() => { if (!editingAddr.line1.trim()) { toast("Add a street address"); return; } saveAddress(editingAddr); setEditingAddr(null); toast("Address saved"); }} className="gold-sheen w-full rounded-full bg-gold-400 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest-950 hover:bg-gold-300">Save address</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{invoice && <InvoiceModal order={invoice} onClose={() => setInvoice(null)} />}</AnimatePresence>
    </div>
  );
}
