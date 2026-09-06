import React, { useEffect } from "react";
import { AppProvider, useApp } from "./lib";
import { Nav, Footer, CartDrawer, ToastHost, ScrollProgress, BackToTop } from "./chrome";
import { Home } from "./home";
import { Journal, Reader } from "./journal";
import { Quiz, Herbs } from "./tools";
import { Store, ProductDetail } from "./store";
import { Account } from "./account";
import { Contact } from "./contact";
import { Studio } from "./studio";
import { AdminConsole } from "./console";
import { isMaintenanceOn, listDiscounts, saveDiscount } from "./console/db";

const TITLES: Record<string, string> = {
  home: "Vaidyagan — Ayurveda, Clinically Verified",
  journal: "Clinical Journal — Vaidyagan",
  article: "Reading — Vaidyagan",
  quiz: "Prakriti Assessment — Vaidyagan",
  herbs: "Herb Index — Vaidyagan",
  store: "Formulation Store — Vaidyagan",
  product: "Formulation — Vaidyagan",
  studio: "Doctor Studio — Vaidyagan",
  account: "My Account — Vaidyagan",
  contact: "Contact — Vaidyagan",
  console: "Admin Console — Vaidyagan",
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-[#0a130e] px-6 text-center">
          <div className="max-w-md">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d6b45f]">वैद्यगण · Vaidyagan</p>
            <h1 className="mt-4 font-serif text-3xl font-semibold text-[#f1e9d6]">Something needs attention.</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#e7dcbf]/70">The page hit an unexpected error. A quick reload usually fixes it.</p>
            <p className="mt-4 break-words rounded-lg border border-[#20392a] bg-[#0f1a13] p-3 text-left font-mono text-[11px] text-[#e07f49]">{this.state.error.message}</p>
            <button onClick={() => window.location.reload()} className="mt-6 rounded-full bg-[#d6b45f] px-7 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0a130e] transition hover:bg-[#e8cf8b]">Reload page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Shell() {
  const { view } = useApp();

  useEffect(() => {
    document.title = TITLES[view.name] ?? TITLES.home;
  }, [view]);

  /* seed a starter discount once so promo codes are testable without the console */
  useEffect(() => {
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
        <ToastHost />
      </div>
    );
  }

  /* maintenance mode — visitors see a friendly notice; the desk keeps working */
  if (view.name !== "studio" && isMaintenanceOn()) {
    return (
      <div className="ops-grid relative grid min-h-screen place-items-center bg-forest-950 px-6 font-body text-sand-100">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 40% at 50% 18%, rgba(214,180,95,0.10), transparent 70%)" }} />
        <div className="relative w-full max-w-md rounded-3xl border border-forest-700 bg-forest-900/85 p-10 text-center backdrop-blur">
          <span className="animate-breathe mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold-500/50 bg-gold-400/10 font-display text-2xl italic text-gold-300">वै</span>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold-400">Vaidyagan</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Under construction</h1>
          <p className="mt-3 text-sm leading-relaxed text-sand-200/60">
            We're tending the garden — the site will be back shortly. Please check again in a little while.
          </p>
        </div>
        <ToastHost />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest-950 font-body text-sand-100">
      <div className="noise-overlay" aria-hidden>
        <svg>
          <filter id="vgn-noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" /></filter>
          <rect width="100%" height="100%" filter="url(#vgn-noise)" />
        </svg>
      </div>
      <Nav />
      <ScrollProgress />
      <BackToTop />
      <main>
        {view.name === "home" && <Home />}
        {view.name === "journal" && <Journal />}
        {view.name === "article" && <Reader id={view.id} />}
        {view.name === "quiz" && <Quiz />}
        {view.name === "herbs" && <Herbs />}
        {view.name === "store" && <Store />}
        {view.name === "product" && <ProductDetail id={view.id} />}
        {view.name === "account" && <Account />}
        {view.name === "contact" && <Contact />}
        {view.name === "studio" && <Studio />}
      </main>
      <Footer />
      <CartDrawer />
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
