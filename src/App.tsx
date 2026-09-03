import React, { useEffect, type ReactNode } from "react";
import { AppProvider, useApp } from "./lib";
import { Nav, Footer, CartDrawer, ToastHost, AccountAuthModal } from "./chrome";
import { Home } from "./home";
import { Journal, Reader } from "./journal";
import { Quiz, Herbs } from "./tools";
import { Store, ProductDetail, StoreLocked } from "./store";
import { Studio } from "./studio";
import { Account } from "./account";
import { Contact } from "./contact";
import { AdminConsole } from "./console";
import { isMaintenanceOn } from "./console/db";
import { Leaf } from "./icons";

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

/** Route protection: if the store is paused, the store page shows the lock screen. */
function StoreGate() {
  const { storeEnabled } = useApp();
  return storeEnabled ? <Store /> : <StoreLocked />;
}

/** Friendly "under construction" page shown while Maintenance Mode is on. */
function MaintenanceScreen() {
  return (
    <div className="leaf-field relative flex min-h-screen items-center justify-center bg-forest-950 px-5">
      <div className="w-full max-w-lg rounded-3xl border border-forest-700 bg-forest-900/80 p-10 text-center backdrop-blur">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold-400/40 bg-gold-400/10 text-gold-300">
          <Leaf size={26} />
        </span>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-gold-400/70">वैद्यगण · Vaidyagan</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-sand-100">We're polishing the shelves</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-sand-200/60">
          The site is briefly under maintenance while we make it better. Please check back in a little while — the formulations will be worth the wait.
        </p>
      </div>
    </div>
  );
}

function Shell() {
  const { view } = useApp();
  const maintenance = isMaintenanceOn();

  useEffect(() => {
    document.title = TITLES[view.name] ?? TITLES.home;
  }, [view]);

  /* The console is a full-screen app of its own — no site nav/footer around it. */
  if (view.name === "console") {
    return (
      <div className="min-h-screen bg-forest-950 font-body text-sand-100">
        <AdminConsole />
        <ToastHost />
      </div>
    );
  }

  /* Maintenance mode hides every public page except the Studio (so staff can still get in). */
  if (maintenance && view.name !== "studio") {
    return (
      <div className="min-h-screen bg-forest-950 font-body text-sand-100">
        <MaintenanceScreen />
        <ToastHost />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest-950 font-body text-sand-100">
      <div className="noise-overlay" aria-hidden>
        <svg>
          <filter id="vgn-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#vgn-noise)" />
        </svg>
      </div>
      <Nav />
      <main>
        {view.name === "home" && <Home />}
        {view.name === "journal" && <Journal />}
        {view.name === "article" && <Reader id={view.id} />}
        {view.name === "quiz" && <Quiz />}
        {view.name === "herbs" && <Herbs />}
        {view.name === "store" && <StoreGate />}
        {view.name === "product" && <ProductDetail id={view.id} />}
        {view.name === "studio" && <Studio />}
        {view.name === "account" && <Account />}
        {view.name === "contact" && <Contact />}
      </main>
      <Footer />
      <CartDrawer />
      <AccountAuthModal />
      <ToastHost />
    </div>
  );
}

/** Graceful fallback so one broken screen never leaves you staring at a blank page. */
class ErrorBoundary extends React.Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-[#0a130e] px-6 text-center">
          <div className="max-w-md">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d6b45f]">वैद्यगण · Vaidyagan</p>
            <h1 className="mt-4 font-serif text-3xl font-semibold text-[#f1e9d6]">Something needs attention.</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#e7dcbf]/70">
              The page hit an unexpected error. A quick reload usually fixes it. If it keeps happening, the detail below helps pinpoint it.
            </p>
            <p className="mt-4 break-words rounded-lg border border-[#20392a] bg-[#0f1a13] p-3 text-left font-mono text-[11px] text-[#e07f49]">
              {this.state.error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full bg-[#d6b45f] px-7 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0a130e] transition hover:bg-[#e8cf8b]"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
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
