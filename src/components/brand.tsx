/* =============================================================================
   Vaidyagan brand mark — the real वैद्यगण logo.
   Single source of truth for nav, footer, Studio login and the console.
   If the hosted image ever fails to load, a crafted leaf seal takes its place
   so the brand never appears broken.
   ========================================================================== */

import React, { useState } from "react";
import { Leaf } from "lucide-react";

/** The owner's logo file, hosted on imgbb. */
export const BRAND_LOGO_URL = "https://i.ibb.co/BVkhGLBM/20260816-122320-0000.png";

/** The honey-gold tile that carries the logo (content zoomed for legibility). */
export function LogoTile({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const [err, setErr] = useState(false);
  const dims =
    size === "sm" ? "h-10 w-10 rounded-[12px]" :
    size === "md" ? "h-14 w-14 rounded-[16px]" :
    size === "lg" ? "h-[76px] w-[76px] rounded-[18px]" :
    "h-24 w-24 rounded-[20px]";
  const icon = size === "sm" ? 18 : size === "md" ? 26 : 34;
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden border-2 border-gold-400/70 bg-[#f7ecbe] shadow-[0_0_0_4px_rgba(214,180,95,0.12),0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-500 group-hover:border-gold-300 group-hover:shadow-[0_0_0_4px_rgba(214,180,95,0.2),0_0_34px_rgba(232,207,139,0.5)] ${dims}`}
    >
      {err ? (
        <span className="text-gold-600 transition-transform duration-500 group-hover:rotate-12">
          <Leaf size={icon} />
        </span>
      ) : (
        <img
          src={BRAND_LOGO_URL}
          alt="वैद्यगण — Vaidyagan"
          draggable={false}
          onError={() => setErr(true)}
          className="h-full w-full scale-[1.55] object-cover transition-transform duration-500 group-hover:scale-[1.68]"
        />
      )}
    </span>
  );
}

/** Logo tile + wordmark, as used in the site header, mobile menu and footer. */
export function BrandLockup({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <span className="group flex items-center gap-3.5">
      <LogoTile size={size} />
      <span>
        <span className="block font-display text-xl font-semibold leading-none tracking-wide text-sand-100">Vaidyagan</span>
        <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.34em] text-gold-400/80">वैद्यगण · आयुर्वेद</span>
      </span>
    </span>
  );
}
