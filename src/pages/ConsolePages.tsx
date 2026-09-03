/* =============================================================================
   Vaidyagan Admin Console — feature pages
   Orders · Products · Customers · Staff & Access · Content · Marketing ·
   Analytics · Settings (incl. the no-code Firebase "Connect Database" screen)
   ========================================================================== */

import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Plus, Pencil, Trash2, Search, Download, Upload, Eye, EyeOff, Check, X,
  ChevronDown, ChevronRight, CreditCard, Banknote, Smartphone, Database, Wifi,
  AlertTriangle, CheckCircle2, XCircle, Printer, Copy, HelpCircle,
  FileText, Star, Tag, TrendingUp, Package, IndianRupee, RefreshCw, MapPin,
  Phone, Mail, Shield, ShieldCheck, User, Inbox, Layers,
} from "lucide-react";

import {
  useDb, listOrders, listProducts, listCustomers, listStaff, listPosts, listReviews,
  listDiscounts, getSettings, listAudit, revenueSeries, topProducts, pageViews,
  updateOrderStatus, bulkOrderStatus, cancelAndRestock, saveProduct, deleteProduct,
  setProductVisible, setProductStock, updateCustomer, updateStaffRole, updateStaffAccess,
  inviteStaff, updatePostStatus, deletePost, setReviewApproved, saveDiscount, deleteDiscount,
  saveSettings, exportAllData, importAllData, resetDemoData, downloadFile, toCsv, inr,
  type Order, type OrderStatus, type Product, type Customer, type StaffUser, type StaffRole,
  type Post, type PostStatus, type Review, type Discount,
} from "../lib/data";
import {
  getFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig, validateConfig,
  testConnection, getConsoleMode, setConsoleMode, hasFirebaseConfig,
  type FirebaseConfig, EMPTY_CONFIG,
} from "../lib/firebase";
import {
  Badge, Toggle, Drawer, ConfirmDialog, EmptyState, SectionHead, ProductTile,
  Field, fieldCls, SearchBox, useToast,
} from "../components/ui";

type Go = (page: string) => void;

/* ------------------------------- status meta -------------------------------- */

export const ORDER_FLOW: OrderStatus[] = ["new", "processing", "shipped", "out-for-delivery", "delivered"];
export const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  new: { label: "New", color: "#93b1cf" },
  processing: { label: "Processing", color: "#e8cf8b" },
  shipped: { label: "Shipped", color: "#d6b45f" },
  "out-for-delivery": { label: "Out for delivery", color: "#e07f49" },
  delivered: { label: "Delivered", color: "#7fa07f" },
  cancelled: { label: "Cancelled", color: "#c96430" },
};
const POST_META: Record<PostStatus, { label: string; color: string }> = {
  published: { label: "Published", color: "#7fa07f" },
  "in-review": { label: "In review", color: "#e8cf8b" },
  draft: { label: "Draft", color: "#93b1cf" },
  scheduled: { label: "Scheduled", color: "#b7cbde" },
};
const shortDate = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
  " · " + new Date(s).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

/* ================================== ORDERS ================================== */

export function OrdersPage({ go }: { go: Go }) {
  useDb();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "highest">("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Order | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const orders = listOrders();
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    (Object.keys(STATUS_META) as OrderStatus[]).forEach((s) => (c[s] = orders.filter((o) => o.status === s).length));
    return c;
  }, [orders]);

  const rows = useMemo(() => {
    let r = orders.filter((o) => {
      const matchesQ =
        !q ||
        o.id.toLowerCase().includes(q.toLowerCase()) ||
        o.customerName.toLowerCase().includes(q.toLowerCase()) ||
        o.customerPhone.includes(q);
      return matchesQ && (filter === "all" || o.status === filter);
    });
    if (sort === "newest") r = r.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "oldest") r = r.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (sort === "highest") r = r.sort((a, b) => b.total - a.total);
    return r;
  }, [orders, q, filter, sort]);

  const toggleSel = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const advance = (o: Order) => {
    const i = ORDER_FLOW.indexOf(o.status);
    if (i >= 0 && i < ORDER_FLOW.length - 1) {
      updateOrderStatus(o.id, ORDER_FLOW[i + 1]);
      setActive({ ...o, status: ORDER_FLOW[i + 1] });
      toast(`Order ${o.id} → ${STATUS_META[ORDER_FLOW[i + 1]].label}`);
    }
  };

  const invoice = (o: Order) => {
    const lines = o.items.map((i) => `<tr><td>${i.name}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">${inr(i.price)}</td><td style="text-align:right">${inr(i.total)}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${o.id}</title>
<style>body{font-family:Georgia,serif;background:#0a130e;color:#f1e9d6;padding:40px}
.card{max-width:680px;margin:0 auto;border:1px solid #2c4d38;border-radius:16px;padding:36px;background:#0f1a13}
h1{color:#d6b45f;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:20px}
th,td{padding:8px 6px;border-bottom:1px solid #20392a;font-size:14px}th{color:#d6b45f;text-align:left}
.tot td{border-bottom:none;font-weight:bold}.muted{color:#bdab7d;font-size:12px}</style></head><body>
<div class="card"><h1>Vaidyagan</h1><p class="muted">Ayurveda, clinically verified · ${getSettings().contactEmail}</p>
<p class="muted">Invoice ${o.id} · ${shortDate(o.createdAt)} · ${o.paymentMethod}</p>
<p><strong>${o.customerName}</strong><br/><span class="muted">${o.address}<br/>${o.customerPhone} · ${o.customerEmail}</span></p>
<table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${lines}
<tr class="tot"><td colspan="3">Subtotal</td><td style="text-align:right">${inr(o.subtotal)}</td></tr>
<tr class="tot"><td colspan="3">Shipping</td><td style="text-align:right">${o.shipping === 0 ? "Free" : inr(o.shipping)}</td></tr>
${o.discount ? `<tr class="tot"><td colspan="3">Discount</td><td style="text-align:right">−${inr(o.discount)}</td></tr>` : ""}
<tr class="tot"><td colspan="3">Grand total</td><td style="text-align:right;color:#d6b45f">${inr(o.total)}</td></tr>
</tbody></table><p class="muted" style="margin-top:24px">${getSettings().invoiceFooterText}</p></div></body></html>`;
    downloadFile(`vaidyagan-invoice-${o.id}.html`, html, "text/html");
    toast(`Invoice for ${o.id} downloaded`);
  };

  return (
    <div className="fade-up">
      <SectionHead
        title="Orders"
        sub="Track, advance and fulfil customer orders."
        right={
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={`${fieldCls} w-auto`} aria-label="Sort orders">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest value</option>
          </select>
        }
      />

      {/* status chips */}
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {(["all", ...Object.keys(STATUS_META)] as ("all" | OrderStatus)[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${
              filter === s ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-600 text-sand-200/55 hover:text-sand-100"
            }`}
          >
            {s === "all" ? "All" : STATUS_META[s as OrderStatus].label}
            <span className="rounded-full bg-forest-700 px-1.5 text-[9px] text-sand-200/70">{counts[s]}</span>
          </button>
        ))}
      </div>

      <div className="mb-3 max-w-sm"><SearchBox value={q} onChange={setQ} placeholder="Search by order id, name or phone" /></div>

      {/* bulk bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-3 flex items-center justify-between rounded-xl border border-gold-500/40 bg-gold-400/8 px-4 py-3">
            <span className="text-[12.5px] text-gold-300">{selected.size} order(s) selected</span>
            <div className="flex gap-2">
              <button onClick={() => { bulkOrderStatus([...selected], "shipped"); toast(`${selected.size} order(s) marked shipped`); setSelected(new Set()); }}
                className="rounded-full bg-gold-400 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300">
                Mark shipped
              </button>
              <button onClick={() => setSelected(new Set())} className="rounded-full border border-forest-600 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/60">
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {rows.length === 0 ? (
        <EmptyState icon={<Package size={22} />} title="No orders match" hint="Try a different search or status filter." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-forest-700/70 bg-forest-900/70">
          {/* desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-forest-700 bg-forest-850 font-mono text-[9px] uppercase tracking-[0.18em] text-sand-200/45">
                <tr>
                  <th className="px-4 py-3"><input type="checkbox" aria-label="Select all" checked={selected.size === rows.length && rows.length > 0} onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} className="accent-[#d6b45f]" /></th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Placed</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="cursor-pointer border-b border-forest-800/60 transition-colors last:border-0 hover:bg-forest-850/60" onClick={() => setActive(o)}>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" aria-label={`Select ${o.id}`} checked={selected.has(o.id)} onChange={() => toggleSel(o.id)} className="accent-[#d6b45f]" />
                    </td>
                    <td className="px-4 py-3 font-mono text-[11.5px] text-gold-300">{o.id}</td>
                    <td className="px-4 py-3 text-sand-100">{o.customerName}</td>
                    <td className="px-4 py-3 text-sand-200/60">{o.items.reduce((s, i) => s + i.qty, 0)} item(s)</td>
                    <td className="px-4 py-3 font-semibold text-sand-100">{inr(o.total)}</td>
                    <td className="px-4 py-3"><Badge color={STATUS_META[o.status].color}>{STATUS_META[o.status].label}</Badge></td>
                    <td className="px-4 py-3 text-sand-200/50">{shortDate(o.createdAt)}</td>
                    <td className="px-4 py-3 text-right"><ChevronRight size={15} className="inline text-sand-200/30" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* mobile cards */}
          <div className="md:hidden">
            {rows.map((o) => (
              <button key={o.id} onClick={() => setActive(o)} className="block w-full border-b border-forest-800/60 px-4 py-4 text-left last:border-0 hover:bg-forest-850/60">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-gold-300">{o.id}</span>
                  <Badge color={STATUS_META[o.status].color}>{STATUS_META[o.status].label}</Badge>
                </div>
                <p className="mt-1.5 text-[14px] font-semibold text-sand-100">{o.customerName}</p>
                <div className="mt-1 flex items-center justify-between text-[12px] text-sand-200/50">
                  <span>{o.items.reduce((s, i) => s + i.qty, 0)} item(s) · {shortDate(o.createdAt)}</span>
                  <span className="font-semibold text-sand-100">{inr(o.total)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* order drawer */}
      <Drawer open={!!active} onClose={() => setActive(null)} title={active ? `Order ${active.id}` : ""}>
        {active && (
          <OrderDetail o={active} onAdvance={() => advance(active)} onCancel={() => setCancelId(active.id)} onInvoice={() => invoice(active)} />
        )}
      </Drawer>

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={() => { if (cancelId) { cancelAndRestock(cancelId); toast(`Order ${cancelId} cancelled & restocked`); setActive(null); } }}
        title="Cancel & restock?"
        message="This cancels the order and returns every item to stock. The customer is not charged."
        confirmText="Yes, cancel"
      />
    </div>
  );
}

function OrderDetail({ o, onAdvance, onCancel, onInvoice }: { o: Order; onAdvance: () => void; onCancel: () => void; onInvoice: () => void }) {
  const idx = ORDER_FLOW.indexOf(o.status);
  const cancelled = o.status === "cancelled";
  const canAdvance = idx >= 0 && idx < ORDER_FLOW.length - 1;
  return (
    <div className="space-y-5">
      {/* timeline */}
      <div>
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-gold-400/80">Fulfilment timeline</p>
        <div className="flex items-center">
          {ORDER_FLOW.map((s, i) => {
            const done = !cancelled && idx >= i;
            const current = !cancelled && idx === i;
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center" style={{ width: i === 0 || i === ORDER_FLOW.length - 1 ? "auto" : undefined }}>
                  <span className={`grid h-8 w-8 place-items-center rounded-full border text-[10px] font-bold transition-all ${
                    done ? "border-gold-400 bg-gold-400 text-forest-950" : "border-forest-600 bg-forest-850 text-sand-200/40"
                  } ${current ? "ring-4 ring-gold-400/20" : ""}`}>
                    {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={`mt-1.5 max-w-[64px] text-center font-mono text-[7.5px] uppercase leading-tight tracking-[0.08em] ${done ? "text-gold-300" : "text-sand-200/35"}`}>
                    {STATUS_META[s].label}
                  </span>
                </div>
                {i < ORDER_FLOW.length - 1 && <span className={`mx-1 mb-5 h-0.5 flex-1 rounded ${!cancelled && idx > i ? "bg-gold-400" : "bg-forest-700"}`} />}
              </React.Fragment>
            );
          })}
        </div>
        {cancelled && (
          <p className="mt-3 flex items-center gap-2 rounded-lg border border-ember-500/40 bg-ember-500/8 px-3 py-2 text-[12px] text-ember-300">
            <XCircle size={14} /> This order was cancelled and its items were returned to stock.
          </p>
        )}
      </div>

      {/* customer + ship-to */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-forest-700 bg-forest-850/60 p-4">
          <p className="mb-2 font-mono text-[8.5px] uppercase tracking-[0.2em] text-gold-400/80">Customer</p>
          <p className="text-[14px] font-semibold text-sand-100">{o.customerName}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-sand-200/55"><Mail size={12} /> {o.customerEmail}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-sand-200/55"><Phone size={12} /> {o.customerPhone}</p>
        </div>
        <div className="rounded-xl border border-forest-700 bg-forest-850/60 p-4">
          <p className="mb-2 font-mono text-[8.5px] uppercase tracking-[0.2em] text-gold-400/80">Ship to</p>
          <p className="flex items-start gap-1.5 text-[12px] leading-relaxed text-sand-200/70"><MapPin size={12} className="mt-0.5 shrink-0" /> {o.address}</p>
          <p className="mt-2 text-[12px] text-sand-200/55">Payment · {o.paymentMethod}</p>
        </div>
      </div>

      {/* items */}
      <div className="rounded-xl border border-forest-700 bg-forest-850/60">
        <p className="border-b border-forest-700 px-4 py-3 font-mono text-[8.5px] uppercase tracking-[0.2em] text-gold-400/80">Items</p>
        <div className="divide-y divide-forest-800">
          {o.items.map((i, x) => (
            <div key={x} className="flex items-center gap-3 px-4 py-3">
              <ProductTile accent={i.accent} name={i.name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-sand-100">{i.name}</p>
                <p className="text-[11px] text-sand-200/45">{i.qty} × {inr(i.price)}</p>
              </div>
              <span className="text-[13px] font-semibold text-sand-100">{inr(i.total)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 border-t border-forest-700 px-4 py-3 text-[12.5px]">
          <div className="flex justify-between text-sand-200/60"><span>Subtotal</span><span>{inr(o.subtotal)}</span></div>
          <div className="flex justify-between text-sand-200/60"><span>Shipping</span><span>{o.shipping === 0 ? "Free" : inr(o.shipping)}</span></div>
          {o.discount > 0 && <div className="flex justify-between text-moss-300"><span>Discount</span><span>−{inr(o.discount)}</span></div>}
          <div className="flex justify-between pt-1 text-[15px] font-semibold text-gold-300"><span>Grand total</span><span>{inr(o.total)}</span></div>
        </div>
      </div>

      {/* actions */}
      <div className="flex flex-wrap gap-2.5">
        {canAdvance && (
          <button onClick={onAdvance} className="flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-transform hover:bg-gold-300 active:scale-95">
            <Check size={14} /> Mark as {STATUS_META[ORDER_FLOW[idx + 1]].label}
          </button>
        )}
        <button onClick={onInvoice} className="flex items-center gap-2 rounded-full border border-forest-600 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/70 transition-colors hover:border-gold-400 hover:text-gold-300">
          <Printer size={14} /> Print invoice
        </button>
        {!cancelled && o.status !== "delivered" && (
          <button onClick={onCancel} className="flex items-center gap-2 rounded-full border border-ember-500/50 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ember-300 transition-colors hover:bg-ember-500/10">
            <XCircle size={14} /> Cancel & restock
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================= PRODUCTS ================================= */

const PRODUCT_CATS = ["Capsules", "Churnas", "Ghritas", "Oils", "Kadhas"];
const ACCENTS = ["#c49c3e", "#5f7f62", "#93b1cf", "#e07f49", "#7fa07f", "#d6b45f", "#b7cbde"];

const blankProduct = (): Product => ({
  id: `prod_${Date.now().toString(36)}`, name: "", sanskrit: "", category: "Capsules", price: 0, mrp: 0,
  stock: 0, accent: ACCENTS[0], dosage: "", ingredients: [], description: "", highlights: [],
  directions: "", safetyNotes: "", isVisible: true,
});

export function ProductsPage({ go }: { go: Go }) {
  useDb();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [view, setView] = useState<"table" | "cards">("table");
  const [editing, setEditing] = useState<Product | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  const products = listProducts();
  const rows = products.filter((p) => {
    const mq = !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sanskrit.includes(q);
    return mq && (cat === "all" || p.category === cat);
  });

  const exportCsv = () => {
    const csv = toCsv(
      ["Name", "Sanskrit", "Category", "Price", "MRP", "Stock", "Visible"],
      products.map((p) => [p.name, p.sanskrit, p.category, p.price, p.mrp, p.stock, p.isVisible ? "yes" : "no"])
    );
    downloadFile("vaidyagan-products.csv", csv, "text/csv");
    toast("Products exported to CSV");
  };

  return (
    <div className="fade-up">
      <SectionHead
        title="Products & Inventory"
        sub="Manage formulations, pricing and stock."
        right={
          <>
            <button onClick={exportCsv} className="flex items-center gap-2 rounded-full border border-forest-600 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/70 transition-colors hover:border-gold-400 hover:text-gold-300">
              <Download size={13} /> CSV
            </button>
            <button onClick={() => setEditing(blankProduct())} className="flex items-center gap-2 rounded-full bg-gold-400 px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 transition-transform hover:bg-gold-300 active:scale-95">
              <Plus size={14} /> Add product
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="w-full max-w-xs"><SearchBox value={q} onChange={setQ} placeholder="Search products" /></div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${fieldCls} w-auto`} aria-label="Filter category">
          <option value="all">All categories</option>
          {PRODUCT_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="ml-auto flex overflow-hidden rounded-lg border border-forest-600">
          {(["table", "cards"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} aria-label={`${v} view`}
              className={`px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${view === v ? "bg-gold-400 text-forest-950" : "text-sand-200/55 hover:text-sand-100"}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Layers size={22} />} title="No products found" hint="Add your first formulation or clear the filters."
          action={<button onClick={() => setEditing(blankProduct())} className="rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 hover:bg-gold-300"><Plus size={13} className="mr-1 inline" />Add product</button>} />
      ) : view === "table" ? (
        <div className="overflow-hidden rounded-xl border border-forest-700/70 bg-forest-900/70">
          <div className="hidden md:block">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-forest-700 bg-forest-850 font-mono text-[9px] uppercase tracking-[0.18em] text-sand-200/45">
                <tr>
                  <th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">In store</th><th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className={`border-b border-forest-800/60 transition-colors last:border-0 hover:bg-forest-850/60 ${p.stock === 0 ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductTile accent={p.accent} name={p.name} />
                        <div>
                          <p className="font-medium text-sand-100">{p.name}</p>
                          <p className="font-display text-[11.5px] italic text-sand-200/40">{p.sanskrit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sand-200/60">{p.category}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-sand-100">{inr(p.price)}</span>
                      {p.mrp > p.price && <span className="ml-1.5 text-[11px] text-sand-200/35 line-through">{inr(p.mrp)}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min={0} value={p.stock} aria-label={`Stock for ${p.name}`}
                          onChange={(e) => setProductStock(p.id, parseInt(e.target.value || "0", 10))}
                          className={`w-16 rounded-lg border bg-forest-950/60 px-2 py-1.5 text-center font-mono text-[12px] focus:border-gold-400 focus:outline-none ${
                            p.stock === 0 ? "border-forest-600 text-sand-200/40" : p.stock < 5 ? "border-ember-500/60 text-ember-300" : "border-forest-600 text-sand-100"
                          }`}
                        />
                        {p.stock === 0 ? <Badge color="#c96430">Out</Badge> : p.stock < 5 ? <Badge color="#e07f49">Low</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3"><Toggle on={p.isVisible} onChange={(b) => { setProductVisible(p.id, b); toast(b ? `${p.name} visible in store` : `${p.name} hidden from store`); }} label={`Show ${p.name} in store`} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`} className="grid h-8 w-8 place-items-center rounded-lg border border-forest-600 text-sand-200/60 transition-colors hover:border-gold-400 hover:text-gold-300"><Pencil size={13} /></button>
                        <button onClick={() => setDelId(p.id)} aria-label={`Delete ${p.name}`} className="grid h-8 w-8 place-items-center rounded-lg border border-forest-600 text-sand-200/40 transition-colors hover:border-ember-500 hover:text-ember-300"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* mobile cards */}
          <div className="grid gap-3 p-4 sm:grid-cols-2 md:hidden">
            {rows.map((p) => (
              <div key={p.id} className={`rounded-xl border border-forest-700 bg-forest-850/60 p-4 ${p.stock === 0 ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3">
                  <ProductTile accent={p.accent} name={p.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-sand-100">{p.name}</p>
                    <p className="text-[11px] text-sand-200/40">{p.category} · {inr(p.price)}</p>
                  </div>
                  {p.stock === 0 ? <Badge color="#c96430">Out</Badge> : p.stock < 5 ? <Badge color="#e07f49">Low</Badge> : <Badge color="#7fa07f">{p.stock}</Badge>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Toggle on={p.isVisible} onChange={(b) => setProductVisible(p.id, b)} label={`Show ${p.name}`} />
                  <div className="flex gap-1.5">
                    <button onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`} className="grid h-8 w-8 place-items-center rounded-lg border border-forest-600 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Pencil size={13} /></button>
                    <button onClick={() => setDelId(p.id)} aria-label={`Delete ${p.name}`} className="grid h-8 w-8 place-items-center rounded-lg border border-forest-600 text-sand-200/40 hover:border-ember-500 hover:text-ember-300"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <motion.div key={p.id} whileHover={{ y: -3 }} className={`rounded-xl border border-forest-700/70 bg-forest-900/70 p-5 transition-colors hover:border-gold-500/50 ${p.stock === 0 ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between">
                <ProductTile accent={p.accent} name={p.name} size={52} />
                <div className="flex items-center gap-2">
                  {p.stock === 0 ? <Badge color="#c96430">Out of stock</Badge> : p.stock < 5 ? <Badge color="#e07f49">Low · {p.stock}</Badge> : <Badge color="#7fa07f">{p.stock} in stock</Badge>}
                </div>
              </div>
              <p className="mt-3 text-[15px] font-semibold text-sand-100">{p.name}</p>
              <p className="font-display text-[12.5px] italic text-sand-200/40">{p.sanskrit} · {p.category}</p>
              <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-sand-200/55">{p.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="font-display text-xl font-semibold text-gold-300">{inr(p.price)}</span>
                  {p.mrp > p.price && <span className="ml-1.5 text-[12px] text-sand-200/35 line-through">{inr(p.mrp)}</span>}
                </div>
                <Toggle on={p.isVisible} onChange={(b) => setProductVisible(p.id, b)} label={`Show ${p.name}`} />
              </div>
              <div className="mt-4 flex gap-2 border-t border-forest-800 pt-3">
                <button onClick={() => setEditing(p)} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-forest-600 py-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Pencil size={12} /> Edit</button>
                <button onClick={() => setDelId(p.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-forest-600 py-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/40 hover:border-ember-500 hover:text-ember-300"><Trash2 size={12} /> Delete</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing && products.some((x) => x.id === editing.id) ? "Edit product" : "Add product"}>
        {editing && <ProductForm p={editing} onDone={() => setEditing(null)} />}
      </Drawer>

      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)}
        onConfirm={() => { if (delId) { deleteProduct(delId); toast("Product deleted"); } }}
        title="Delete product?" message="This removes the product from the store and inventory. Existing orders keep their line items." confirmText="Delete" />
    </div>
  );
}

function ProductForm({ p, onDone }: { p: Product; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState<Product>(p);
  const [ing, setIng] = useState(p.ingredients.join(", "));
  const [hl, setHl] = useState(p.highlights.join("\n"));
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = () => {
    if (!f.name.trim()) { toast("Product name is required", "warn"); return; }
    if (f.price <= 0) { toast("Set a price above ₹0", "warn"); return; }
    saveProduct({ ...f, ingredients: ing.split(",").map((s) => s.trim()).filter(Boolean), highlights: hl.split("\n").map((s) => s.trim()).filter(Boolean) });
    toast(`Saved “${f.name}”`);
    onDone();
  };

  return (
    <div className="space-y-4">
      <Field label="Product name *"><input className={fieldCls} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ashwagandha Root Capsules" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Sanskrit"><input className={fieldCls} value={f.sanskrit} onChange={(e) => set("sanskrit", e.target.value)} placeholder="अश्वगन्धा" /></Field>
        <Field label="Category">
          <select className={fieldCls} value={f.category} onChange={(e) => set("category", e.target.value)}>
            {PRODUCT_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Price (₹) *"><input type="number" min={0} className={fieldCls} value={f.price || ""} onChange={(e) => set("price", parseInt(e.target.value || "0", 10))} /></Field>
        <Field label="MRP (₹)"><input type="number" min={0} className={fieldCls} value={f.mrp || ""} onChange={(e) => set("mrp", parseInt(e.target.value || "0", 10))} /></Field>
        <Field label="Stock"><input type="number" min={0} className={fieldCls} value={f.stock || ""} onChange={(e) => set("stock", parseInt(e.target.value || "0", 10))} /></Field>
        <Field label="Accent colour">
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {ACCENTS.map((c) => (
              <button key={c} onClick={() => set("accent", c)} aria-label={`Accent ${c}`} className={`h-7 w-7 rounded-full border-2 transition-transform ${f.accent === c ? "scale-110 border-sand-100" : "border-transparent"}`} style={{ background: c }} />
            ))}
          </div>
        </Field>
      </div>
      <Field label="Dosage"><input className={fieldCls} value={f.dosage} onChange={(e) => set("dosage", e.target.value)} placeholder="1 capsule twice daily after meals" /></Field>
      <Field label="Ingredients (comma separated)"><input className={fieldCls} value={ing} onChange={(e) => setIng(e.target.value)} placeholder="Amla, Bibhitaki, Haritaki" /></Field>
      <Field label="Description"><textarea rows={3} className={fieldCls} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What this formulation is and why it matters…" /></Field>
      <Field label="Highlights (one per line)"><textarea rows={3} className={fieldCls} value={hl} onChange={(e) => setHl(e.target.value)} placeholder={"Gentle daily detox\nSupports digestion"} /></Field>
      <Field label="Directions"><input className={fieldCls} value={f.directions} onChange={(e) => set("directions", e.target.value)} placeholder="How to take it…" /></Field>
      <Field label="Safety notes"><input className={fieldCls} value={f.safetyNotes} onChange={(e) => set("safetyNotes", e.target.value)} placeholder="Contra-indications and cautions…" /></Field>
      <div className="flex items-center justify-between rounded-xl border border-forest-700 bg-forest-850/60 px-4 py-3">
        <div>
          <p className="text-[13px] font-semibold text-sand-100">Show in store</p>
          <p className="text-[11px] text-sand-200/45">Hidden products stay in inventory but leave the storefront.</p>
        </div>
        <Toggle on={f.isVisible} onChange={(b) => set("isVisible", b)} label="Show in store" />
      </div>
      <div className="flex justify-end gap-2.5 border-t border-forest-800 pt-4">
        <button onClick={onDone} className="rounded-full border border-forest-600 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/70 hover:text-sand-100">Cancel</button>
        <button onClick={submit} className="rounded-full bg-gold-400 px-6 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-transform hover:bg-gold-300 active:scale-95">Save product</button>
      </div>
    </div>
  );
}

/* ================================= CUSTOMERS ================================ */

export function CustomersPage({ go }: { go: Go }) {
  useDb();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "repeat" | "new">("all");
  const [active, setActive] = useState<Customer | null>(null);
  const orders = listOrders();

  const rows = listCustomers().filter((c) => {
    const mq = !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q);
    const isNew = (Date.now() - new Date(c.joinedAt).getTime()) / 86400e3 < 14;
    const mf = filter === "all" || (filter === "repeat" ? c.ordersCount > 1 : isNew);
    return mq && mf;
  });

  const exportCsv = () => {
    const csv = toCsv(
      ["Name", "Email", "Phone", "Provider", "Orders", "Total spent", "Joined", "Suspended"],
      listCustomers().map((c) => [c.name, c.email, c.phone, c.provider, c.ordersCount, c.totalSpent, c.joinedAt.slice(0, 10), c.suspended ? "yes" : "no"])
    );
    downloadFile("vaidyagan-customers.csv", csv, "text/csv");
    toast("Customers exported to CSV");
  };

  return (
    <div className="fade-up">
      <SectionHead title="Customers" sub="Everyone who has bought from the store."
        right={<button onClick={exportCsv} className="flex items-center gap-2 rounded-full border border-forest-600 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-200/70 transition-colors hover:border-gold-400 hover:text-gold-300"><Download size={13} /> CSV</button>} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="w-full max-w-xs"><SearchBox value={q} onChange={setQ} placeholder="Search customers" /></div>
        {(["all", "repeat", "new"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${filter === f ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-600 text-sand-200/55 hover:text-sand-100"}`}>
            {f === "all" ? "All" : f === "repeat" ? "Repeat buyers" : "New (14d)"}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<User size={22} />} title="No customers found" hint="Try a different search or filter." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <button key={c.id} onClick={() => setActive(c)} className={`rounded-xl border border-forest-700/70 bg-forest-900/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-gold-500/50 ${c.suspended ? "opacity-55" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full font-display text-[15px] font-semibold" style={{ background: "#d6b45f14", color: "#d6b45f", border: "1px solid #d6b45f44" }}>
                  {c.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-sand-100">{c.name}</p>
                  <p className="truncate text-[11.5px] text-sand-200/45">{c.email || c.phone}</p>
                </div>
                <Badge color={c.provider === "google" ? "#93b1cf" : c.provider === "otp" ? "#7fa07f" : "#e8cf8b"}>{c.provider}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-forest-800 pt-3 text-center">
                <div><p className="font-display text-lg font-semibold text-sand-100">{c.ordersCount}</p><p className="font-mono text-[8px] uppercase tracking-[0.14em] text-sand-200/40">Orders</p></div>
                <div><p className="font-display text-lg font-semibold text-gold-300">{inr(c.totalSpent)}</p><p className="font-mono text-[8px] uppercase tracking-[0.14em] text-sand-200/40">Spent</p></div>
                <div><p className="font-display text-lg font-semibold text-sand-100">{new Date(c.joinedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p><p className="font-mono text-[8px] uppercase tracking-[0.14em] text-sand-200/40">Joined</p></div>
              </div>
              {c.suspended && <p className="mt-2 text-[11px] text-ember-300">Suspended — cannot sign in</p>}
            </button>
          ))}
        </div>
      )}

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.name ?? ""}>
        {active && (() => {
          const c = listCustomers().find((x) => x.id === active.id) ?? active;
          const hist = orders.filter((o) => o.customerEmail === c.email);
          return (
            <div className="space-y-4">
              <div className="rounded-xl border border-forest-700 bg-forest-850/60 p-4">
                <p className="mb-2 font-mono text-[8.5px] uppercase tracking-[0.2em] text-gold-400/80">Contact</p>
                <p className="flex items-center gap-1.5 text-[12.5px] text-sand-200/70"><Mail size={12} /> {c.email || "—"}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-sand-200/70"><Phone size={12} /> {c.phone || "—"}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-sand-200/70"><Shield size={12} /> Signed in via {c.provider}</p>
              </div>
              <div className="rounded-xl border border-forest-700 bg-forest-850/60 p-4">
                <p className="mb-2 font-mono text-[8.5px] uppercase tracking-[0.2em] text-gold-400/80">Address book</p>
                {c.addresses.length === 0 ? <p className="text-[12px] text-sand-200/40">No saved addresses yet.</p> :
                  c.addresses.map((a, i) => <p key={i} className="flex items-start gap-1.5 text-[12.5px] leading-relaxed text-sand-200/70"><MapPin size={12} className="mt-0.5 shrink-0" />{a}</p>)}
              </div>
              <div className="rounded-xl border border-forest-700 bg-forest-850/60">
                <p className="border-b border-forest-700 px-4 py-3 font-mono text-[8.5px] uppercase tracking-[0.2em] text-gold-400/80">Order history</p>
                {hist.length === 0 ? <p className="px-4 py-4 text-[12px] text-sand-200/40">No orders yet.</p> : (
                  <div className="divide-y divide-forest-800">
                    {hist.map((o) => (
                      <div key={o.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="font-mono text-[11px] text-gold-300">{o.id}</p>
                          <p className="text-[11px] text-sand-200/45">{shortDate(o.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-semibold text-sand-100">{inr(o.total)}</p>
                          <Badge color={STATUS_META[o.status].color}>{STATUS_META[o.status].label}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Field label="Private notes">
                <textarea rows={2} className={fieldCls} defaultValue={c.notes} placeholder="e.g. prefers COD, allergic to…"
                  onBlur={(e) => { updateCustomer(c.id, { notes: e.target.value }); toast("Notes saved"); }} />
              </Field>
              <div className="flex items-center justify-between rounded-xl border border-forest-700 bg-forest-850/60 px-4 py-3">
                <div>
                  <p className="text-[13px] font-semibold text-sand-100">{c.suspended ? "Reactivate account" : "Suspend account"}</p>
                  <p className="text-[11px] text-sand-200/45">Suspended customers cannot sign in or order.</p>
                </div>
                <Toggle on={!c.suspended} onChange={(b) => { updateCustomer(c.id, { suspended: !b }); toast(b ? `${c.name} reactivated` : `${c.name} suspended`); setActive({ ...c, suspended: !b }); }} label={`Suspend ${c.name}`} />
              </div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}

/* ================================ STAFF & ACCESS ============================= */

const ROLE_DESC: Record<StaffRole, string> = {
  superadmin: "Full control — roles, access switches, settings, money.",
  editor: "Can manage orders, products, customers and content.",
  viewer: "Read-only overview and analytics. Nothing can be changed.",
};

export function StaffPage({ go }: { go: Go }) {
  useDb();
  const toast = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inv, setInv] = useState({ name: "", email: "", role: "viewer" as StaffRole });
  const staff = listStaff();

  const submitInvite = () => {
    const res = inviteStaff(inv.name, inv.email, inv.role);
    if (!res.ok) { toast(res.error ?? "Couldn't invite", "warn"); return; }
    toast(`Invited ${inv.name} — they'll sign in with Google`);
    setInv({ name: "", email: "", role: "viewer" });
    setInviteOpen(false);
  };

  return (
    <div className="fade-up">
      <SectionHead title="Staff & Access" sub="Everyone who can sign in to this console."
        right={<button onClick={() => setInviteOpen(true)} className="flex items-center gap-2 rounded-full bg-gold-400 px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 transition-transform hover:bg-gold-300 active:scale-95"><Plus size={14} /> Invite staff</button>} />

      <div className="space-y-3">
        {staff.map((s) => (
          <div key={s.id} className={`flex flex-wrap items-center gap-4 rounded-xl border border-forest-700/70 bg-forest-900/70 p-4 ${!s.hasAccess ? "opacity-60" : ""}`}>
            <span className="grid h-11 w-11 place-items-center rounded-full font-display text-[15px] font-semibold" style={{ background: `${s.hue}14`, color: s.hue, border: `1px solid ${s.hue}44` }}>
              {s.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-sand-100">
                {s.name}
                <Badge color={s.role === "superadmin" ? "#d6b45f" : s.role === "editor" ? "#7fa07f" : "#93b1cf"}>{s.role}</Badge>
                {!s.hasAccess && <Badge color="#c96430">Locked out</Badge>}
              </p>
              <p className="text-[11.5px] text-sand-200/45">{s.email} · last login {new Date(s.lastLogin).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
              <p className="mt-0.5 text-[11px] text-sand-200/35">{ROLE_DESC[s.role]}</p>
            </div>
            <select value={s.role} onChange={(e) => { const r = updateStaffRole(s.id, e.target.value as StaffRole); if (!r.ok) toast(r.error ?? "Can't change role", "warn"); }}
              className={`${fieldCls} w-auto`} aria-label={`Role for ${s.name}`}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="superadmin">Superadmin</option>
            </select>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-sand-200/40">Access</span>
              <Toggle on={s.hasAccess} onChange={(b) => { const r = updateStaffAccess(s.id, b); if (!r.ok) toast(r.error ?? "Can't change access", "warn"); }} label={`Dashboard access for ${s.name}`} disabled={s.id === "root"} />
            </div>
          </div>
        ))}
      </div>

      <Drawer open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite staff">
        <div className="space-y-4">
          <Field label="Full name *"><input className={fieldCls} value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} placeholder="Dr. …" /></Field>
          <Field label="Work email *"><input type="email" className={fieldCls} value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} placeholder="name@vaidyagan.in" /></Field>
          <Field label="Role" hint={ROLE_DESC[inv.role]}>
            <select className={fieldCls} value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value as StaffRole })}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </Field>
          <button onClick={submitInvite} className="w-full rounded-full bg-gold-400 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-transform hover:bg-gold-300 active:scale-95">Send invite</button>
        </div>
      </Drawer>
    </div>
  );
}

/* ================================== CONTENT ================================= */

export function ContentPage({ go }: { go: Go }) {
  useDb();
  const toast = useToast();
  const [tab, setTab] = useState<"posts" | "reviews">("posts");
  const [status, setStatus] = useState<"all" | PostStatus>("all");
  const [delPost, setDelPost] = useState<string | null>(null);
  const settings = getSettings();

  const posts = listPosts().filter((p) => status === "all" || p.status === status);
  const reviews = listReviews();

  return (
    <div className="fade-up">
      <SectionHead title="Content" sub="Everything the public site shows — posts, reviews and the master switches." />

      {/* master switches */}
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {([
          { k: "enablePublicStore" as const, label: "Enable public Store", hint: "Off hides the storefront from visitors." },
          { k: "showProfileTab" as const, label: "Show Profile tab", hint: "Lets customers see their account area." },
          { k: "maintenanceMode" as const, label: "Maintenance mode", hint: "Shows an under-construction page to visitors." },
        ]).map((s) => (
          <div key={s.k} className="flex items-center justify-between rounded-xl border border-forest-700/70 bg-forest-900/70 p-4">
            <div>
              <p className="text-[13px] font-semibold text-sand-100">{s.label}</p>
              <p className="text-[11px] text-sand-200/45">{s.hint}</p>
            </div>
            <Toggle on={settings[s.k]} onChange={(b) => { saveSettings({ [s.k]: b } as Partial<typeof settings>); toast(`${s.label} ${b ? "on" : "off"}`); }} label={s.label} />
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["posts", "reviews"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${tab === t ? "border-gold-400 bg-gold-400/12 text-gold-300" : "border-forest-600 text-sand-200/55 hover:text-sand-100"}`}>
            {t === "posts" ? `Posts (${listPosts().length})` : `Reviews (${reviews.length})`}
          </button>
        ))}
        {tab === "posts" && (
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={`${fieldCls} ml-auto w-auto`} aria-label="Filter posts by status">
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="in-review">In review</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
        )}
      </div>

      {tab === "posts" ? (
        posts.length === 0 ? (
          <EmptyState icon={<FileText size={22} />} title="No posts here" hint="Adjust the status filter or publish from the Studio." />
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-forest-700/70 bg-forest-900/70 p-4">
                <FileText size={18} className="shrink-0 text-gold-400/70" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-sand-100">{p.title}</p>
                  <p className="text-[11.5px] text-sand-200/45">{p.author} · {p.category} · {p.doshas.join(", ")} · updated {shortDate(p.updatedAt)}</p>
                </div>
                <Badge color={POST_META[p.status].color}>{POST_META[p.status].label}</Badge>
                <div className="flex flex-wrap gap-1.5">
                  {p.status === "in-review" && (
                    <>
                      <button onClick={() => { updatePostStatus(p.id, "published"); toast("Approved & published"); }} className="flex items-center gap-1 rounded-full bg-moss-500 px-3.5 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-forest-950 hover:opacity-90"><Check size={12} /> Approve</button>
                      <button onClick={() => { updatePostStatus(p.id, "draft"); toast("Sent back to drafts"); }} className="rounded-full border border-forest-600 px-3.5 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:text-sand-100">Send back</button>
                    </>
                  )}
                  {p.status === "published" && (
                    <button onClick={() => { updatePostStatus(p.id, "draft"); toast("Unpublished"); }} className="rounded-full border border-forest-600 px-3.5 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:text-sand-100">Unpublish</button>
                  )}
                  {p.status === "draft" && (
                    <button onClick={() => { updatePostStatus(p.id, "published"); toast("Published"); }} className="flex items-center gap-1 rounded-full bg-gold-400 px-3.5 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-forest-950 hover:bg-gold-300"><Check size={12} /> Publish</button>
                  )}
                  <button onClick={() => setDelPost(p.id)} aria-label={`Delete ${p.title}`} className="grid h-8 w-8 place-items-center rounded-lg border border-forest-600 text-sand-200/40 hover:border-ember-500 hover:text-ember-300"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {reviews.length === 0 ? <EmptyState icon={<Star size={22} />} title="No reviews yet" hint="Customer reviews will land here for moderation." /> :
            reviews.map((r) => (
              <div key={r.id} className={`flex flex-wrap items-center gap-3 rounded-xl border border-forest-700/70 bg-forest-900/70 p-4 ${!r.approved ? "opacity-70" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5 text-gold-400">
                      {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < r.rating ? "fill-current" : "text-forest-600"} />)}
                    </span>
                    <span className="text-[12px] font-semibold text-sand-100">{r.author}</span>
                    <span className="text-[11px] text-sand-200/40">on {r.product}</span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-sand-200/65">“{r.text}”</p>
                </div>
                <Badge color={r.approved ? "#7fa07f" : "#e8cf8b"}>{r.approved ? "Live" : "Hidden"}</Badge>
                <button onClick={() => { setReviewApproved(r.id, !r.approved); toast(r.approved ? "Review hidden" : "Review approved"); }}
                  className={`rounded-full border px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-colors ${r.approved ? "border-forest-600 text-sand-200/60 hover:text-sand-100" : "bg-gold-400 text-forest-950 hover:bg-gold-300"}`}>
                  {r.approved ? "Hide" : "Approve"}
                </button>
              </div>
            ))}
        </div>
      )}

      <ConfirmDialog open={!!delPost} onClose={() => setDelPost(null)} onConfirm={() => { if (delPost) { deletePost(delPost); toast("Post deleted"); } }}
        title="Delete post?" message="This permanently removes the post from the journal." confirmText="Delete" />
    </div>
  );
}

/* ================================= MARKETING ================================ */

const blankDiscount = (): Discount => ({ id: `disc_${Date.now().toString(36)}`, code: "", type: "percent", value: 10, minOrder: 0, expires: "", active: true });

export function MarketingPage({ go }: { go: Go }) {
  useDb();
  const toast = useToast();
  const [editing, setEditing] = useState<Discount | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const discounts = listDiscounts();

  const isExpired = (d: Discount) => !!d.expires && new Date(d.expires + "T23:59:59").getTime() < Date.now();

  return (
    <div className="fade-up">
      <SectionHead title="Marketing" sub="Discount codes applied automatically at checkout."
        right={<button onClick={() => setEditing(blankDiscount())} className="flex items-center gap-2 rounded-full bg-gold-400 px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-950 transition-transform hover:bg-gold-300 active:scale-95"><Plus size={14} /> New code</button>} />

      {discounts.length === 0 ? (
        <EmptyState icon={<Tag size={22} />} title="No discount codes" hint="Create your first code — e.g. WELCOME10 for 10% off." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {discounts.map((d) => {
            const expired = isExpired(d);
            return (
              <div key={d.id} className={`rounded-xl border border-forest-700/70 bg-forest-900/70 p-5 ${!d.active || expired ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-lg font-semibold tracking-[0.08em] text-gold-300">{d.code}</p>
                    <p className="mt-0.5 text-[12px] text-sand-200/50">
                      {d.type === "percent" ? `${d.value}% off` : `${inr(d.value)} off`}{d.minOrder > 0 && ` · min ${inr(d.minOrder)}`}
                    </p>
                  </div>
                  <Badge color={expired ? "#c96430" : d.active ? "#7fa07f" : "#93b1cf"}>{expired ? "Expired" : d.active ? "Active" : "Off"}</Badge>
                </div>
                <p className="mt-2 text-[11px] text-sand-200/40">{d.expires ? `Expires ${new Date(d.expires).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : "Never expires"}</p>
                <div className="mt-4 flex items-center justify-between border-t border-forest-800 pt-3">
                  <Toggle on={d.active && !expired} onChange={(b) => { saveDiscount({ ...d, active: b }); toast(`${d.code} ${b ? "activated" : "deactivated"}`); }} label={`Toggle ${d.code}`} disabled={expired} />
                  <div className="flex gap-1.5">
                    <button onClick={() => setEditing(d)} aria-label={`Edit ${d.code}`} className="grid h-8 w-8 place-items-center rounded-lg border border-forest-600 text-sand-200/60 hover:border-gold-400 hover:text-gold-300"><Pencil size={13} /></button>
                    <button onClick={() => setDelId(d.id)} aria-label={`Delete ${d.code}`} className="grid h-8 w-8 place-items-center rounded-lg border border-forest-600 text-sand-200/40 hover:border-ember-500 hover:text-ember-300"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing && discounts.some((x) => x.id === editing.id) ? "Edit code" : "New discount code"}>
        {editing && <DiscountForm d={editing} onDone={() => setEditing(null)} />}
      </Drawer>
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={() => { if (delId) { deleteDiscount(delId); toast("Code deleted"); } }}
        title="Delete code?" message="Customers will no longer be able to redeem this code." confirmText="Delete" />
    </div>
  );
}

function DiscountForm({ d, onDone }: { d: Discount; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState<Discount>(d);
  const submit = () => {
    if (!f.code.trim()) { toast("Enter a code", "warn"); return; }
    if (f.value <= 0) { toast("Value must be above 0", "warn"); return; }
    saveDiscount({ ...f, code: f.code.trim().toUpperCase() });
    toast(`Saved ${f.code.toUpperCase()}`);
    onDone();
  };
  return (
    <div className="space-y-4">
      <Field label="Code *" hint="Customers type this at checkout."><input className={`${fieldCls} font-mono uppercase`} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <select className={fieldCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Discount["type"] })}>
            <option value="percent">Percent (%)</option>
            <option value="flat">Flat (₹)</option>
          </select>
        </Field>
        <Field label={f.type === "percent" ? "Percent off" : "Amount off (₹)"}>
          <input type="number" min={1} className={fieldCls} value={f.value || ""} onChange={(e) => setF({ ...f, value: parseInt(e.target.value || "0", 10) })} />
        </Field>
        <Field label="Minimum order (₹)"><input type="number" min={0} className={fieldCls} value={f.minOrder || ""} onChange={(e) => setF({ ...f, minOrder: parseInt(e.target.value || "0", 10) })} placeholder="0" /></Field>
        <Field label="Expires (optional)"><input type="date" className={fieldCls} value={f.expires} onChange={(e) => setF({ ...f, expires: e.target.value })} /></Field>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-forest-700 bg-forest-850/60 px-4 py-3">
        <p className="text-[13px] font-semibold text-sand-100">Active</p>
        <Toggle on={f.active} onChange={(b) => setF({ ...f, active: b })} label="Active" />
      </div>
      <button onClick={submit} className="w-full rounded-full bg-gold-400 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-forest-950 transition-transform hover:bg-gold-300 active:scale-95">Save code</button>
    </div>
  );
}

/* ================================= ANALYTICS ================================ */

const tooltipStyle = {
  backgroundColor: "#0f1a13", border: "1px solid #2c4d38", borderRadius: 10,
  fontSize: 12, color: "#f1e9d6",
};

export function AnalyticsPage({ go }: { go: Go }) {
  useDb();
  const series = revenueSeries(14);
  const orders = listOrders();
  const statusData = (Object.keys(STATUS_META) as OrderStatus[]).map((s) => ({ name: STATUS_META[s].label, value: orders.filter((o) => o.status === s).length }));
  const pieColors = ["#93b1cf", "#e8cf8b", "#d6b45f", "#e07f49", "#7fa07f", "#c96430"];
  const tops = topProducts(5);
  const views = pageViews();

  return (
    <div className="fade-up">
      <SectionHead title="Analytics" sub="Revenue, orders, top products and page visits." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-forest-700/70 bg-forest-900/70 p-5">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-gold-400/80">Revenue — last 14 days</p>
          <p className="mb-4 font-display text-2xl font-semibold text-sand-100">{inr(series.reduce((s, d) => s + d.revenue, 0))}</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d6b45f" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#d6b45f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#20392a" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#bdab7d", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#2c4d38" }} interval={2} />
                <YAxis tick={{ fill: "#bdab7d", fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [inr(v), "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#d6b45f" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-forest-700/70 bg-forest-900/70 p-5">
          <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-gold-400/80">Orders by status</p>
          <div className="flex h-56 items-center gap-4">
            <div className="h-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3} stroke="none">
                    {statusData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {statusData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 text-[11.5px] text-sand-200/60">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                  {s.name} <span className="font-semibold text-sand-100">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-forest-700/70 bg-forest-900/70 p-5">
          <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-gold-400/80">Top products by revenue</p>
          {tops.length === 0 ? <p className="text-[12px] text-sand-200/40">No sales yet.</p> : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tops} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid stroke="#20392a" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#bdab7d", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fill: "#e7dcbf", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [inr(v), "Revenue"]} cursor={{ fill: "#182a1e" }} />
                  <Bar dataKey="revenue" fill="#7fa07f" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-forest-700/70 bg-forest-900/70 p-5">
          <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-gold-400/80">Visits by page</p>
          {views.length === 0 ? <p className="text-[12px] text-sand-200/40">Visit the public site to start counting page views.</p> : (
            <div className="space-y-3">
              {views.map((v) => {
                const max = Math.max(...views.map((x) => x.views), 1);
                return (
                  <div key={v.page}>
                    <div className="mb-1 flex justify-between text-[11.5px]"><span className="capitalize text-sand-200/70">{v.page}</span><span className="font-semibold text-sand-100">{v.views}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-forest-800"><div className="h-full rounded-full bg-gold-500" style={{ width: `${(v.views / max) * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ SETTINGS + CONNECT DB ========================== */

const WIZARD = [
  { t: "Create the project", w: "console.firebase.google.com", d: "Click “Add project”, name it vaidyagan, switch Analytics off, click Continue → Create." },
  { t: "Register the web app", w: "Project Settings → General → Your apps", d: "Click the web icon (</>), nickname it vaidyagan-console, click Register app. A block of six values appears." },
  { t: "Copy the config", w: "The firebaseConfig block", d: "Copy apiKey, authDomain, projectId, storageBucket, messagingSenderId and appId into the six boxes on this screen." },
  { t: "Enable Google sign-in", w: "Build → Authentication → Sign-in method", d: "Click Google, flip Enable on, pick your support email, click Save." },
  { t: "Enable Email/Password", w: "Build → Authentication → Sign-in method", d: "Click Email/Password, flip Enable on, click Save." },
  { t: "Create Firestore", w: "Build → Firestore Database", d: "Click Create database, choose “Start in production mode”, pick your region, click Enable." },
  { t: "Enable Storage", w: "Build → Storage", d: "Click Get started, keep production mode, click Done. This holds product photos and certificates." },
  { t: "Paste security rules", w: "Firestore → Rules tab", d: "Paste the rules below, click Publish. Then seed the founder document: collection admin_users, doc id root, role superadmin." },
];

const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /admin_users/{userId}    { allow read, write: if request.auth != null; }
    match /orders/{orderId}        { allow read, write: if request.auth != null; }
    match /products/{productId}    { allow read, write: if request.auth != null; }
    match /customers/{customerId}  { allow read, write: if request.auth != null; }
    match /discounts/{discountId}  { allow read, write: if request.auth != null; }
    match /settings/{docId}        { allow read, write: if request.auth != null; }
    match /analytics/{docId}       { allow read, write: if true; }
  }
}`;

export function SettingsPage({ go }: { go: Go }) {
  useDb();
  const toast = useToast();
  const settings = getSettings();
  const [cfg, setCfg] = useState<FirebaseConfig>(getFirebaseConfig());
  const [testing, setTesting] = useState(false);
  const [verdict, setVerdict] = useState<{ ok: boolean; message: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mode = getConsoleMode();

  const set = (k: keyof FirebaseConfig, v: string) => setCfg((c) => ({ ...c, [k]: v }));
  const problems = validateConfig(cfg);

  const runTest = async () => {
    setTesting(true);
    setVerdict(null);
    const r = await testConnection(cfg);
    setVerdict(r);
    setTesting(false);
  };

  const saveAndGoLive = () => {
    if (problems.length > 0) { toast(problems[0], "warn"); return; }
    saveFirebaseConfig(cfg);
    setConsoleMode("live");
    toast("Saved — console is now in Live Mode");
  };

  const backToDemo = () => {
    setConsoleMode("demo");
    toast("Switched back to Demo Mode");
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = importAllData(String(reader.result ?? ""));
      toast(r.ok ? "Backup restored" : r.error ?? "Import failed", r.ok ? "ok" : "warn");
    };
    reader.onerror = () => toast("Couldn't read that file", "warn");
    reader.readAsText(file);
  };

  return (
    <div className="fade-up space-y-6">
      <SectionHead title="Settings" sub="Database connection, payments, shipping and backups." />

      {/* CONNECT DATABASE */}
      <div className="rounded-xl border border-gold-500/30 bg-forest-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`grid h-11 w-11 place-items-center rounded-xl ${mode === "live" ? "bg-moss-500/15 text-moss-300" : "bg-gold-400/12 text-gold-300"}`}>
              <Database size={20} />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-sand-100">Connect Database</p>
              <p className="text-[12px] text-sand-200/50">Paste your Firebase web config — no code needed.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={mode === "live" ? "#7fa07f" : "#e8cf8b"}>{mode === "live" ? "Live Mode" : "Demo Mode"}</Badge>
            {mode === "live" && (
              <button onClick={backToDemo} className="rounded-full border border-forest-600 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-sand-200/60 hover:text-sand-100">Use demo</button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {([
            ["apiKey", "API Key"], ["authDomain", "Auth Domain"], ["projectId", "Project ID"],
            ["storageBucket", "Storage Bucket"], ["messagingSenderId", "Messaging Sender ID"], ["appId", "App ID"],
          ] as [keyof FirebaseConfig, string][]).map(([k, label]) => (
            <Field key={k} label={label}>
              <input className={`${fieldCls} font-mono text-[12px]`} value={cfg[k]} onChange={(e) => set(k, e.target.value)} placeholder={k === "projectId" ? "vaidyagan-admin" : "…"} />
            </Field>
          ))}
        </div>

        {problems.length > 0 && (cfg.apiKey || cfg.projectId || cfg.appId) && (
          <div className="mt-4 space-y-1.5">
            {problems.map((p) => (
              <p key={p} className="flex items-start gap-2 text-[12px] text-ember-300"><AlertTriangle size={13} className="mt-0.5 shrink-0" />{p}</p>
            ))}
          </div>
        )}

        {verdict && (
          <div className={`mt-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[13px] ${verdict.ok ? "border-moss-500/50 bg-moss-500/8 text-moss-300" : "border-ember-500/50 bg-ember-500/8 text-ember-300"}`}>
            {verdict.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
            {verdict.message}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <button onClick={runTest} disabled={testing} className="flex items-center gap-2 rounded-full border border-gold-500/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-300 transition-colors hover:bg-gold-400/10 disabled:opacity-50">
            {testing ? <RefreshCw size={14} className="animate-spin" /> : <Wifi size={14} />} {testing ? "Testing…" : "Test connection"}
          </button>
          <button onClick={saveAndGoLive} className="flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-transform hover:bg-gold-300 active:scale-95">
            Save & go live
          </button>
          {hasFirebaseConfig() && (
            <button onClick={() => { clearFirebaseConfig(); setCfg({ ...EMPTY_CONFIG }); setVerdict(null); toast("Config cleared — back to Demo Mode"); }}
              className="rounded-full border border-forest-600 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/60 hover:text-sand-100">
              Clear config
            </button>
          )}
          <button onClick={() => setShowHelp((s) => !s)} className="ml-auto flex items-center gap-1.5 text-[12px] text-gold-300 hover:underline">
            <HelpCircle size={14} /> Where do I find these?
          </button>
        </div>

        <AnimatePresence>
          {showHelp && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {WIZARD.map((s, i) => (
                  <div key={s.t} className="rounded-xl border border-forest-700 bg-forest-850/60 p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-400 font-mono text-[11px] font-bold text-forest-950">{i + 1}</span>
                      <p className="text-[13px] font-semibold text-sand-100">{s.t}</p>
                    </div>
                    <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-gold-400/70">{s.w}</p>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-sand-200/60">{s.d}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-forest-700 bg-forest-850/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold-400/80">Firestore security rules</p>
                  <button onClick={() => { try { navigator.clipboard.writeText(FIRESTORE_RULES); toast("Rules copied to clipboard"); } catch { toast("Copy blocked — select the text manually", "warn"); } }}
                    className="flex items-center gap-1.5 rounded-full border border-forest-600 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-200/60 hover:text-gold-300">
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <button onClick={() => setShowRules((r) => !r)} className="mt-2 flex items-center gap-1 text-[12px] text-gold-300 hover:underline">
                  <ChevronDown size={14} className={`transition-transform ${showRules ? "rotate-180" : ""}`} /> {showRules ? "Hide rules" : "Show rules"}
                </button>
                {showRules && <pre className="mt-3 overflow-x-auto rounded-lg bg-forest-950 p-4 font-mono text-[10.5px] leading-relaxed text-moss-300">{FIRESTORE_RULES}</pre>}
                <p className="mt-3 text-[11.5px] text-sand-200/45">
                  Founder seed: in Firestore, create collection <span className="font-mono text-gold-300">admin_users</span>, document id <span className="font-mono text-gold-300">root</span>, field <span className="font-mono text-gold-300">role: "superadmin"</span>.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PAYMENTS & SHIPPING */}
      <div className="rounded-xl border border-forest-700/70 bg-forest-900/70 p-6">
        <p className="mb-4 font-display text-lg font-semibold text-sand-100">Payments & shipping</p>
        <div className="grid gap-3 md:grid-cols-3">
          {([
            { k: "paymentUPI" as const, label: "UPI", icon: <Smartphone size={16} /> },
            { k: "paymentCard" as const, label: "Card", icon: <CreditCard size={16} /> },
            { k: "paymentCOD" as const, label: "Cash on delivery", icon: <Banknote size={16} /> },
          ]).map((p) => (
            <div key={p.k} className="flex items-center justify-between rounded-xl border border-forest-700 bg-forest-850/60 p-4">
              <span className="flex items-center gap-2.5 text-[13px] font-semibold text-sand-100"><span className="text-gold-400">{p.icon}</span>{p.label}</span>
              <Toggle on={settings[p.k]} onChange={(b) => { saveSettings({ [p.k]: b } as Partial<typeof settings>); toast(`${p.label} ${b ? "enabled" : "disabled"}`); }} label={p.label} />
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Free shipping at (₹)"><input type="number" min={0} className={fieldCls} value={settings.freeShippingThreshold} onChange={(e) => saveSettings({ freeShippingThreshold: parseInt(e.target.value || "0", 10) })} /></Field>
          <Field label="Shipping fee (₹)"><input type="number" min={0} className={fieldCls} value={settings.shippingFee} onChange={(e) => saveSettings({ shippingFee: parseInt(e.target.value || "0", 10) })} /></Field>
          <Field label="Contact email"><input type="email" className={fieldCls} value={settings.contactEmail} onChange={(e) => saveSettings({ contactEmail: e.target.value })} /></Field>
        </div>
        <Field label="Invoice footer text">
          <textarea rows={2} className={fieldCls} value={settings.invoiceFooterText} onChange={(e) => saveSettings({ invoiceFooterText: e.target.value })} />
        </Field>
      </div>

      {/* BACKUP & RESTORE */}
      <div className="rounded-xl border border-forest-700/70 bg-forest-900/70 p-6">
        <p className="mb-1 font-display text-lg font-semibold text-sand-100">Backup & restore</p>
        <p className="mb-4 text-[12.5px] text-sand-200/50">Download everything as JSON, or restore from a previous backup.</p>
        <div className="flex flex-wrap gap-2.5">
          <button onClick={() => { downloadFile(`vaidyagan-backup-${new Date().toISOString().slice(0, 10)}.json`, exportAllData(), "application/json"); toast("Backup downloaded"); }}
            className="flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-950 transition-transform hover:bg-gold-300 active:scale-95">
            <Download size={14} /> Export all data
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-full border border-forest-600 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand-200/70 transition-colors hover:border-gold-400 hover:text-gold-300">
            <Upload size={14} /> Import JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-label="Import backup file"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = ""; }} />
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="rounded-xl border border-ember-500/40 bg-ember-500/5 p-6">
        <p className="mb-1 font-display text-lg font-semibold text-ember-300">Danger zone</p>
        <p className="mb-4 text-[12.5px] text-sand-200/50">Reset every collection back to its seed values. Logins are kept.</p>
        <button onClick={() => setConfirmReset(true)} className="flex items-center gap-2 rounded-full border border-ember-500/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ember-300 transition-colors hover:bg-ember-500/10">
          <RefreshCw size={14} /> Reset demo data
        </button>
      </div>

      <ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)} onConfirm={() => { resetDemoData(); toast("Demo data reset to seed values"); }}
        title="Reset all demo data?" message="Orders, products, customers, posts and settings return to their original seed values. This can't be undone." confirmText="Reset" />
    </div>
  );
}

/* keep the tree-shaker honest about icons used only in strings above */
export const __icons = { IndianRupee, TrendingUp, Inbox, ShieldCheck, Eye, EyeOff, Search, X };
