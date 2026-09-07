import React, { Component, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AppProvider, useApp } from "./lib";
import { Nav, Footer, CartDrawer, ToastHost, AccountAuthModal, ScrollProgress, BackToTop } from "./chrome";
import { Home } from "./home";
import { Journal, Reader } from "./journal";
import { Quiz, Herbs } from "./tools";
import { Store, ProductDetail } from "./store";
import { Account } from "./account";
import { Contact } from "./contact";
import { Studio } from "./studio";
import { AdminConsole } from "./console";
import { isMaintenanceOn, listDiscounts, saveDiscount } from "./console/db";
import { Check } from "./icons";

const TITLES: Record<string, string> = {
  home: "Vaidyagan — Ayurveda, Clinically Verified",
  journal: "Clinical Journal — Vaidyagan",
  article: "Reading — Vaidyagan",
  quiz: "Prakriti Assessment — Vaidyagan",
  herbs: "Herb Index — Vaidyagan",
  store: "Formulation Store — Vaidyagan",
  product: "Formulation — Vaidyagan Store",
  account: "My Account — Vaidyagan",
  contact: "Contact the Desk — Vaidyagan",
  studio: "Doctor Studio — Vaidyagan",
  console: "Admin Console — Vaidyagan",
};

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-forest-950 px-6 text-center">
          <div className="max-w-md">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold-400">वैद्यगण · Vaidyagan</p>
            <h1 className="mt-4 font-display text-3xl font-semibold text-sand-100">Something needs attention.</h1>
            <p className="mt-3 text-sm leading-relaxed text-sand-200/60">The page hit an unexpected error. A quick reload usually fixes it.</p>
            <p className="mt-4 break-words rounded-lg border border-forest-700 bg-forest-900 p-3 text-left font-mono text-[11px] text-ember-300">{this.state.error.message}</p>
            <button onClick={() => window.location.reload()}
              className="mt-6 rounded-full bg-gold-400 px-7 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-950 hover:bg-gold-300">
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MaintenanceScreen() {
  return (
    <div className="ops-grid relative grid min-h-screen place-items-center bg-forest-950 px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 40% at 50% 18%, rgba(214,180,95,0.10), transparent 70%)" }} />
      <div className="relative w-full max-w-md rounded-3xl border border-forest-700 bg-forest-900/85 p-10 text-center backdrop-blur">
        <span className="animate-breathe mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold-500/50 bg-gold-400/10 font-display text-2xl italic text-gold-300">वै</span>
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold-400">Vaidyagan</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-sand-100">Under construction</h1>
        <p className="mt-3 text-sm leading-relaxed text-sand-200/60">We're tending the garden — the site will be back shortly. Please check again in a little while.</p>
        <p className="mt-6 flex items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-sand-200/35"><Check size={12} /> The desk keeps working behind the scenes</p>
      </div>
    </div>
  );
}

function Shell() {
  const { view, allArticles, products } = useApp();
  const seeded = useRef(false);

  /* per-view titles + meta description for SEO */
  useEffect(() => {
    let title = TITLES[view.name] ?? TITLES.home;
    let desc = "Vaidyagan — clinically verified Ayurveda. Classical protocols and herb monographs by registered BAMS vaidyas.";
    if (view.name === "article") {
      const a = allArticles.find((x) => x.id === (view as { id?: string }).id);
      if (a) { title = `${a.title} — Vaidyagan`; desc = a.summary || desc; }
    } else if (view.name === "product") {
      const p = products.find((x) => x.id === (view as { id?: string }).id);
      if (p) { title = `${p.name} — Vaidyagan Store`; desc = p.desc || desc; }
    }
    document.title = title;
    try { document.querySelector('meta[name="description"]')?.setAttribute("content", desc); } catch { /* ignore */ }
  }, [view, allArticles, products]);

  /* seed a starter discount once so promo codes are testable without the console */
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    try {
      if (listDiscounts().length === 0) {
        saveDiscount({ id: "d-welcome", code: "WELCOME10", type: "percent", value: 10, minOrder: 499, expires: "", active: true, createdAt: new Date().toISOString().slice(0, 10) });
      }
    } catch { /* seeding must never block the app */ }
  }, []);

  /* the console is a full-screen app of its own — no site nav/footer around it */
  if (view.name === "console") {
    return (
      <div className="min-h-screen bg-forest-950 font-body text-sand-100">
        <AdminConsole />
        <BackToTop />
        <ToastHost />
      </div>
    );
  }

  /* maintenance mode — visitors see a friendly notice; the desk keeps working */
  if (view.name !== "studio" && isMaintenanceOn()) {
    return (
      <>
        <MaintenanceScreen />
        <ToastHost />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-forest-950 font-body text-sand-100">
      <div className="noise-overlay" aria-hidden>
        <svg><filter id="vgn-noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#vgn-noise)" /></svg>
      </div>
      <Nav />
      <ScrollProgress />
      <BackToTop />
      <main>
        {view.name === "home" && <Home />}
        {view.name === "journal" && <Journal />}
        {view.name === "article" && <Reader id={(view as { id: string }).id} />}
        {view.name === "quiz" && <Quiz />}
        {view.name === "herbs" && <Herbs />}
        {view.name === "store" && <Store />}
        {view.name === "product" && <ProductDetail id={(view as { id: string }).id} />}
        {view.name === "account" && <Account />}
        {view.name === "contact" && <Contact />}
        {view.name === "studio" && <Studio />}
      </main>
      <Footer />
      <CartDrawer />
      <AccountAuthModal />
      <ToastHost />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Shell />
      </AppProvider>
    </ErrorBoundary>
  );
}
