# Vaidyagan Admin Console — Owner's Guide

## The file map (what lives where)

| File | What it holds |
|---|---|
| `src/console.tsx` | The Console itself: access gate, collapsible sidebar, header (global search, notification bell, avatar menu), Home, Orders and Products pages |
| `src/console-pages.tsx` | Customers, Staff & Access, Content, Marketing, Analytics and Settings pages |
| `src/console/db.ts` | The demo data layer (browser storage) — the 1:1 twin of Firestore. Settings, discounts, notifications, page-view analytics, maintenance mode, backup/restore |
| `src/studio.tsx` | Doctor Studio (login, blog editor, approval queue, members) — where the **Admin Console** button lives for superadmins |
| `src/lib.tsx` | Site-wide state: articles, products, orders, customers, auth, cart |

## Non-coder guide — one line per Console page

- **Home** — today's money, new orders, low stock and a "needs attention" checklist that links straight to the work.
- **Orders** — every order with status chips, search, sorting, bulk "mark shipped", a slide-over with a visual timeline, cancel-&-restock, and printable branded invoices.
- **Products** — cards or table view, quick stock +/−, show/hide in the store, low-stock red flags, full product editor (including everything on the public product page), CSV export.
- **Customers** — everyone who has signed in, with orders, spend, addresses, private notes and a suspend switch; CSV export.
- **Staff & Access** — invite people, choose Editor (can change things) or Viewer (read-only), and flip their dashboard access on/off.
- **Content** — approve/reject/unpublish journal posts, manage the Herb Index, hide inappropriate reviews, and flip the master switches (Store, Profile tab, Maintenance).
- **Marketing** — discount codes (a WELCOME10 is pre-created); shoppers apply them at checkout and see the saving live.
- **Analytics** — 14-day revenue chart, orders-by-status donut, top products, and visits per page (tracked automatically).
- **Settings** — connect Firebase (six paste-boxes + a plain-English wizard + ready-to-paste security rules), payment methods, shipping, invoice text, contact email, backup/restore, and the danger zone.

## Connecting Firebase (when you're ready)

The full click-by-click wizard is inside the app: **Console → Settings → "Where do I find these?"** — seven numbered cards plus the copy-paste security rules. Until then the console runs in **Demo Mode**: identical screens, data saved in your browser, and the badge in the header always tells you which mode you're in.

## Testing checklist

**Demo mode, end to end**
- [ ] Sign in to the Studio (`monesh` / `admin91466`) and click the gold **Admin Console** button — the console opens full-screen with the Demo badge.
- [ ] Home shows KPI cards, a needs-attention checklist, and recent activity.
- [ ] Orders: filter by "New", open one, advance it to Processing → Shipped, watch the timeline fill.
- [ ] Orders: select two orders and use "Mark N shipped" bulk action.
- [ ] Orders: Cancel & restock an order — check the product's stock went back up.
- [ ] Orders: Print invoice opens a branded printable page.
- [ ] Products: quick +/− stock below 5 turns the card red and pushes a bell notification.
- [ ] Products: hide a product — the public store no longer shows it.
- [ ] Products: export CSV downloads a file.
- [ ] Customers: open a profile, add a note, suspend the account, export CSV.
- [ ] Staff: invite a member, flip their access off — they see the locked screen.
- [ ] Content: approve an "in review" post — it goes live on the journal.
- [ ] Marketing: WELCOME10 applies at checkout with a visible saving line.
- [ ] Analytics: all four charts render with data.
- [ ] Settings: flip Maintenance mode — visitors see the under-construction page.

**Live mode connection**
- [ ] Paste the six Firebase values → Test connection shows plain-English errors for bad values.
- [ ] With real values, Test connection shows green "Connected".
- [ ] Save config, switch the badge to Live mode, reload — badge stays Live.

**Roles & mobile**
- [ ] Sign in as a doctor (`shruti` / `shruti123`) — no Admin Console button (superadmin grants access from Staff & Access).
- [ ] A Viewer sees only Home and Analytics; no destructive buttons anywhere.
- [ ] On a phone-width screen: sidebar becomes a drawer, tables collapse, no horizontal scroll.

**Stability**
- [ ] Browser console shows zero errors across every page.
- [ ] Export → Import backup restores data after a reset.
