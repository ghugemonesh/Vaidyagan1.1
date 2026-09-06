import React from "react";

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.7,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    ...rest,
  };
}

export const Leaf = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 19C5 10.5 11 5 19.5 4.5c.4 8.5-4.6 14-13 14.3" />
    <path d="M5 19c2.5-5 6-8.6 10.5-10.8" />
  </svg>
);
export const Wind = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 8.5h10.5a2.6 2.6 0 1 0-2.6-2.6" />
    <path d="M3 12.5h15a2.8 2.8 0 1 1-2.8 2.8" />
    <path d="M3 16.5h7a2.2 2.2 0 1 1-2.2 2.2" />
  </svg>
);
export const Flame = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5c1 3-3.5 4.8-3.5 9a5.5 5.5 0 0 0 11 0c0-2.4-1.2-4-2.5-5.4-.2 1.5-.8 2.4-2 2.9.3-2.3-.5-4.7-3-6.5Z" />
    <path d="M10 16.5a2.3 2.3 0 0 0 4.4.8" />
  </svg>
);
export const Drop = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5S6 10 6 14.2a6 6 0 0 0 12 0C18 10 12 3.5 12 3.5Z" />
    <path d="M9.5 14.5a2.6 2.6 0 0 0 2 2.6" />
  </svg>
);
export const Search = (p: IconProps) => (
  <svg {...base(p)}><circle cx="10.5" cy="10.5" r="6" /><path d="m15.2 15.2 5 5" /></svg>
);
export const Cart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 4h2l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.3a1.6 1.6 0 0 0 1.6-1.2L20.5 8H6" />
    <circle cx="9.6" cy="20" r="1.3" /><circle cx="17.4" cy="20" r="1.3" />
  </svg>
);
export const Menu = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h10" /></svg>
);
export const Close = (p: IconProps) => (
  <svg {...base(p)}><path d="m6 6 12 12M18 6 6 18" /></svg>
);
export const ArrowRight = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 12h15M13.5 5.5 20 12l-6.5 6.5" /></svg>
);
export const ArrowLeft = (p: IconProps) => (
  <svg {...base(p)}><path d="M20 12H5M10.5 5.5 4 12l6.5 6.5" /></svg>
);
export const ChevronDown = (p: IconProps) => (
  <svg {...base(p)}><path d="m5 9 7 7 7-7" /></svg>
);
export const Play = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M8 5.5v13l11-6.5-11-6.5Z" /></svg>
);
export const Pause = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <rect x="6.5" y="5" width="3.4" height="14" rx="1" /><rect x="14" y="5" width="3.4" height="14" rx="1" />
  </svg>
);
export const Check = (p: IconProps) => (
  <svg {...base(p)}><path d="m4.5 12.5 5 5 10-11" /></svg>
);
export const SealCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2.8 14 4.6l2.6-.4.7 2.6 2.4 1.2-.7 2.6 1.5 2.2-1.5 2.2.7 2.6-2.4 1.2-.7 2.6-2.6-.4-2 1.8-2-1.8-2.6.4-.7-2.6-2.4-1.2.7-2.6L3.5 12 5 9.8l-.7-2.6L6.7 6l.7-2.6L10 3.8 12 2.8Z" />
    <path d="m8.7 12.2 2.2 2.2 4.4-4.6" />
  </svg>
);
export const Quote = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M5 13.5c0-4 2.4-6.8 6-8l.8 1.6c-2.2 1-3.4 2.5-3.6 4.2.3-.1.7-.2 1.1-.2 1.8 0 3 1.3 3 3.1s-1.4 3.3-3.3 3.3c-2.4 0-4-1.6-4-4Zm9 0c0-4 2.4-6.8 6-8l.8 1.6c-2.2 1-3.4 2.5-3.6 4.2.3-.1.7-.2 1.1-.2 1.8 0 3 1.3 3 3.1s-1.4 3.3-3.3 3.3c-2.4 0-4-1.6-4-4Z" />
  </svg>
);
export const WhatsApp = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5Z" />
    <path d="M9 8.7c-.4 2.6 3.6 6.6 6.2 6.2l.3-1.4-1.9-.8-.9.9c-1-.4-2-1.4-2.4-2.4l.9-.9-.8-1.9L9 8.7Z" />
  </svg>
);
export const XSocial = (p: IconProps) => (
  <svg {...base(p)}><path d="m4.5 4.5 15 15M19.5 4.5l-15 15" /></svg>
);
export const LinkedIn = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
    <path d="M7.5 10.5V16.5M7.5 7.6v.1M11.5 16.5v-6c0-1.5 1.1-2.4 2.5-2.4s2.5.9 2.5 2.4v6" />
  </svg>
);
export const Instagram = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);
export const Copy = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
    <path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
  </svg>
);
export const Book = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
    <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    <path d="M9 8h7M9 11.5h5" />
  </svg>
);
export const Mortar = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 10h16a8 8 0 0 1-4.5 6.9L16 20H8l.5-3.1A8 8 0 0 1 4 10Z" />
    <path d="m13 9.5 6.5-6.5a1.4 1.4 0 0 1 2 2L15 11.5" />
  </svg>
);
export const Spark = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.8 5.8l2.6 2.6M15.6 15.6l2.6 2.6M18.2 5.8l-2.6 2.6M8.4 15.6l-2.6 2.6" />
  </svg>
);
export const Pen = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m4 20 .8-3.6L15.6 5.6a2 2 0 0 1 2.8 2.8L7.6 19.2 4 20Z" />
    <path d="m13.5 7.7 2.8 2.8" />
  </svg>
);
export const Eye = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const Plus = (p: IconProps) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>);
export const Minus = (p: IconProps) => (<svg {...base(p)}><path d="M5 12h14" /></svg>);
export const Trash = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 6.5h15M9.5 6V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V6M7 6.5l.8 12.4a1.6 1.6 0 0 0 1.6 1.5h5.2a1.6 1.6 0 0 0 1.6-1.5L17 6.5M10.2 10.5v6M13.8 10.5v6" />
  </svg>
);
export const Clock = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.2 2" /></svg>
);
export const Star = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3Z" />
  </svg>
);
export const Monitor = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="4.5" width="18" height="12.5" rx="2" /><path d="M9 20.5h6M12 17v3.5" /></svg>
);
export const Phone = (p: IconProps) => (
  <svg {...base(p)}><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></svg>
);
export const Send = (p: IconProps) => (
  <svg {...base(p)}><path d="M20.5 3.5 3.5 10l7 2.5 2.5 7 7.5-16Z" /><path d="m10.5 12.5 4.5-4.5" /></svg>
);
export const Mail = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7.5 8 6 8-6" />
  </svg>
);
export const Download = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5V15m0 0 4-4m-4 4-4-4M4 18.5v1a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19.5v-1" />
  </svg>
);
export const Users = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M3 20c.5-3.6 2.8-5.7 6-5.7s5.5 2.1 6 5.7" />
    <path d="M15.5 5.4a3.5 3.5 0 0 1 0 6.2M17.8 14.6c1.7.8 2.9 2.5 3.2 5.4" />
  </svg>
);
export const Lock = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    <circle cx="12" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);
export const Key = (p: IconProps) => (
  <svg {...base(p)}><circle cx="8" cy="12" r="4" /><path d="M12 12h8.5M18 12v3M15.5 12v2.2" /></svg>
);
export const Bell = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2.5h-15L6 16Z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </svg>
);
export const Gear = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
  </svg>
);
export const LayoutGrid = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </svg>
);
export const Person = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4.5 20c.8-4 3.7-6 7.5-6s6.7 2 7.5 6" /></svg>
);
export const Bank = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m3 9 9-5.5L21 9H3ZM5 9v8M9.7 9v8M14.3 9v8M19 9v8M3 17h18M2.5 20h19" />
  </svg>
);
export const Globe = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c-2.4 2.3-3.6 5.1-3.6 8.5s1.2 6.2 3.6 8.5c2.4-2.3 3.6-5.1 3.6-8.5s-1.2-6.2-3.6-8.5Z" />
  </svg>
);
export const Youtube = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2.5" y="6" width="19" height="12.5" rx="3.5" />
    <path d="m10.2 9.5 4.5 2.7-4.5 2.7v-5.4Z" fill="currentColor" stroke="none" />
  </svg>
);
export const Video = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="13" height="12" rx="2.5" />
    <path d="m16 10.5 5-3v9l-5-3" />
  </svg>
);
export const Help = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-.9.7-.9 1.4" />
    <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);
export const Camera = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 8.5h3l1.5-2.5h7L17 8.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </svg>
);
export const Expand = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" /></svg>
);
export const Compress = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5" /></svg>
);
export const List = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);
export const ImageIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="m5 18 4.5-4.5 3 3L16 13l4.5 4.5" />
  </svg>
);
export const Upload = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 15V4m0 0-4 4m4-4 4 4M4 18.5v1A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-1" />
  </svg>
);
export const RefreshIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5V8h-4.5" /></svg>
);
export const Shield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 5 5.8v5.4c0 4.6 3 8 7 9.8 4-1.8 7-5.2 7-9.8V5.8L12 3Z" />
    <path d="m8.8 11.8 2.3 2.3 4.1-4.4" />
  </svg>
);
export const Activity = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 12h4l2.5-6.5L14 18l2.5-6H21" /></svg>
);
export const AlignLeft = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 6h16M4 10h10M4 14h16M4 18h10" /></svg>
);
export const AlignCenter = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 6h16M7 10h10M4 14h16M7 18h10" /></svg>
);
export const AlignJustify = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
);
export const Diamond = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 5l6 7-6 7-6-7 6-7Z" /></svg>
);
