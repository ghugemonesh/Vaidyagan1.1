/* ============================== Vaidyagan data ============================== */

export type Dosha = "vata" | "pitta" | "kapha";

export const DOSHA_META: Record<Dosha, { name: string; sa: string; elements: string; color: string }> = {
  vata: { name: "Vata", sa: "वात", elements: "Air + Ether", color: "#93b1cf" },
  pitta: { name: "Pitta", sa: "पित्त", elements: "Fire + Water", color: "#e07f49" },
  kapha: { name: "Kapha", sa: "कफ", elements: "Earth + Water", color: "#82b39e" },
};

export interface Category { id: string; name: string; sanskrit: string; slug: string; description: string }
export const CATEGORIES: Category[] = [
  { id: "dravyaguna", name: "Herbs & Dravyaguna", sanskrit: "द्रव्यगुण", slug: "dravyaguna", description: "Herb monographs — rasa, virya, vipaka and clinical use." },
  { id: "chikitsa", name: "Disease Protocols", sanskrit: "चिकित्सा", slug: "chikitsa", description: "Nidana and chikitsa for common presentations." },
  { id: "panchakarma", name: "Panchakarma & Detox", sanskrit: "पञ्चकर्म", slug: "panchakarma", description: "Classical shodhana, done safely and tracked." },
  { id: "dinacharya", name: "Lifestyle & Dinacharya", sanskrit: "दिनचर्या", slug: "dinacharya", description: "Daily and seasonal rhythm for the doshas." },
  { id: "ahara", name: "Dietetics & Ahara", sanskrit: "आहार", slug: "ahara", description: "Food as the first medicine." },
];

export type Kind = "blog" | "case" | "research";
export const KIND_META: Record<Kind, { label: string; short: string; color: string }> = {
  blog: { label: "Clinical essay", short: "Essay", color: "#d6b45f" },
  case: { label: "Case paper", short: "Case", color: "#e07f49" },
  research: { label: "Research review", short: "Review", color: "#93b1cf" },
};

/* ------------------------------ content blocks ------------------------------ */

export type Block =
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "shloka"; sa: string; tr: string; cite: string }
  | { t: "callout"; tone: "gold" | "pitta"; title: string; body: string }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "image"; src: string; caption?: string };

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

export function blockToHtml(b: Block): string {
  switch (b.t) {
    case "h2": return `<h2 id="${slug(b.text)}">${b.text}</h2>`;
    case "h3": return `<h3 id="${slug(b.text)}">${b.text}</h3>`;
    case "p": return `<p>${b.text}</p>`;
    case "ul": return `<ul>${b.items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
    case "shloka": return `<blockquote class="shloka"><p class="sa">${b.sa}</p><p class="tr">${b.tr}</p><cite>${b.cite}</cite></blockquote>`;
    case "callout": return `<div class="callout callout-${b.tone}"><p class="callout-title">${b.title}</p><p>${b.body}</p></div>`;
    case "table": return `<table><thead><tr>${b.head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    case "image": return `<figure><img src="${b.src}" alt="${b.caption ?? ""}" loading="lazy" />${b.caption ? `<figcaption>${b.caption}</figcaption>` : ""}</figure>`;
    default: return "";
  }
}

/* ------------------------------- authors (BAMS) ----------------------------- */

export interface Author {
  id: string; name: string; initials: string; qualification: string; specialty: string;
  years: number; bio: string; quote: string; hue: string;
}

export const AUTHORS: Author[] = [
  {
    id: "monesh", name: "Dr. Monesh L Ghuge", initials: "MG", qualification: "BAMS",
    specialty: "Kayachikitsa · General medicine", years: 16,
    bio: "Sixteen years of OPD practice rooted in classical Kayachikitsa — with the patience of the texts and the rigour of modern records.",
    quote: "A prescription is a promise. Write it only when you can keep it.", hue: "#d6b45f",
  },
  {
    id: "bhagyesh", name: "Dr. Bhagyesh Karale", initials: "BK", qualification: "BAMS",
    specialty: "Panchakarma · Detox protocols", years: 12,
    bio: "Trained in Kerala's classical shodhana tradition; runs structured detox programmes with full pre- and post-marker tracking.",
    quote: "Detox is not punishment for the body — it is returning what was never meant to stay.", hue: "#e07f49",
  },
  {
    id: "shruti", name: "Dr. Shruti Choudhary", initials: "SC", qualification: "BAMS",
    specialty: "Dravyaguna · Clinical herbology", years: 9,
    bio: "Herb-obsessed in the best sense — every monograph she writes is checked against the rasa–virya–vipaka logic of the classics.",
    quote: "Know the drug's temperament before you ask about the disease's.", hue: "#82b39e",
  },
  {
    id: "shivani", name: "Dr. Shivani Kadam", initials: "SK", qualification: "BAMS",
    specialty: "Stri Roga · Women's health", years: 8,
    bio: "Focuses on PCOS, cycle disorders and post-partum recovery — where classical Stri Roga meets modern lab work.",
    quote: "The cycle is a monthly case-history. Read it.", hue: "#93b1cf",
  },
];

/** Resolve the visible author of an article (desk members fall back to the founder). */
export function authorFor(a: Article): Author {
  const known = AUTHORS.find((x) => x.id === a.authorId);
  if (known) return known;
  try {
    const raw = localStorage.getItem("vaidyagan_studio_users_v1");
    if (raw) {
      const users = JSON.parse(raw) as { id: string; name: string; specialty?: string; hue: string }[];
      const m = users.find((u) => u.id === a.authorId);
      if (m) {
        return {
          id: m.id, name: m.name,
          initials: m.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase(),
          qualification: "BAMS", specialty: m.specialty ?? "Ayurvedic medicine",
          years: 1, bio: "Verified member of the Vaidyagan publishing desk.",
          quote: "Written from the OPD, checked against the classics.", hue: m.hue,
        };
      }
    }
  } catch { /* fall through */ }
  return AUTHORS[0];
}

/* --------------------------------- articles --------------------------------- */

export interface CaseMeta { age: string; sex: string; prakriti: string; presenting: string; duration: string }
export interface ResearchMeta { question: string; design: string; n: string; finding: string; grade: string }

export interface Article {
  id: string; slug: string; title: string; subtitle: string; summary: string;
  cover: string; categoryId: string; doshas: Dosha[]; authorId: string;
  date: string; views: number; symptoms: string[]; kind: Kind;
  blocks: Block[]; html?: string; featured?: boolean;
  pdfUrl?: string; pdfName?: string;
  caseMeta?: CaseMeta; researchMeta?: ResearchMeta;
  status: "draft" | "published" | "scheduled" | "review";
}

export const IMG = {
  coverPanchakarma: "https://image.qwenlm.ai/public_source/87f5f789-1a2d-420e-b04a-05e599480854/17e6514d0-5d4c-440b-bb3e-8a1588a33a45.png",
  coverGoldenMilk: "https://image.qwenlm.ai/public_source/87f5f789-1a2d-420e-b04a-05e599480854/1e62b09d1-737b-495f-a3e1-1237d1864244.png",
  coverBrahmi: "https://image.qwenlm.ai/public_source/87f5f789-1a2d-420e-b04a-05e599480854/16e250692-0b71-4d22-895a-31a000a199f1.png",
  coverDinacharya: "https://image.qwenlm.ai/public_source/87f5f789-1a2d-420e-b04a-05e599480854/14e250692-e0b3-400f-b8f9-182c48f72b4a.png",
  coverTriphala: "https://image.qwenlm.ai/public_source/87f5f789-1a2d-420e-b04a-05e599480854/1ae250692-e0b3-400f-b8f9-182c48f72b4a.png",
  coverKadha: "https://image.qwenlm.ai/public_source/87f5f789-1a2d-420e-b04a-05e599480854/1ce250692-e0b3-400f-b8f9-182c48f72b4a.png",
  coverOil: "https://image.qwenlm.ai/public_source/87f5f789-1a2d-420e-b04a-05e599480854/1ee250692-e0b3-400f-b8f9-182c48f72b4a.png",
};

export const BRAND_LOGO_URL = "https://i.ibb.co/BVkhGLBM/20260816-122320-0000.png";

export const COVER_CHOICES = [
  { src: IMG.coverPanchakarma }, { src: IMG.coverGoldenMilk }, { src: IMG.coverBrahmi },
  { src: IMG.coverDinacharya }, { src: IMG.coverTriphala }, { src: IMG.coverKadha }, { src: IMG.coverOil },
];

export const ARTICLES: Article[] = [
  {
    id: "ashwagandha-anxiety", slug: "ashwagandha-anxiety", featured: true,
    title: "Ashwagandha for the Anxious Mind — What the OPD Actually Shows",
    subtitle: "A dravyaguna monograph with clinical guard-rails",
    summary: "Ashwagandha is the most prescribed herb on our desk and the most misunderstood. Here is how we actually use it: dose, duration, who it helps, and who it agitates.",
    cover: IMG.coverBrahmi, categoryId: "dravyaguna", doshas: ["vata", "kapha"], authorId: "shruti",
    date: "2026-02-12", views: 12400, symptoms: ["anxiety", "stress", "sleep", "fatigue"], kind: "blog", status: "published",
    blocks: [
      { t: "shloka", sa: "अश्वगन्धा रसायनी वृष्या च बलदा स्मृतिदा", tr: "Ashwagandha is a rasayana — it is aphrodisiac, strength-giving and memory-enhancing.", cite: "Bhavaprakasha Nighantu" },
      { t: "h2", text: "The temperament of the drug" },
      { t: "p", text: "Ashwagandha is madhura-tikta in rasa, ushna in virya and madhura in vipaka. That warmth is the whole story: it pacifies vata and kapha, and — importantly — can aggravate a sensitive pitta if given hot, fast and unbuffered." },
      { t: "h3", text: "Who responds best" },
      { t: "ul", items: ["Vata-dominant anxiety with cold hands, racing thoughts and light sleep", "Fatigue with a 'wired but tired' quality", "Post-illness debility where appetite is returning but strength is not"] },
      { t: "h2", text: "How we dose it" },
      { t: "table", head: ["Preparation", "Dose", "Anupana", "Notes"], rows: [
        ["Churna (root powder)", "3–6 g at night", "Warm milk + a pinch of nutmeg", "Start at 3 g, titrate weekly"],
        ["Kshirapaka (milk decoction)", "60 ml", "As prepared", "Gentler for pitta"],
        ["Extract (5% withanolides)", "300 mg BD", "After food", "Check for GI upset"] ] },
      { t: "callout", tone: "pitta", title: "When to hold back", body: "Avoid in hyperthyroidism, during acute fever, and in pitta patients reporting heat or irritability on the herb. Pregnancy is a firm contra-indication." },
      { t: "h2", text: "The evidence, plainly" },
      { t: "p", text: "Randomised trials consistently show reductions in perceived-stress scores and evening cortisol at 240–600 mg of standardised extract over 60 days. That is a real signal — but it is a signal about stress physiology, not a cure for clinical anxiety disorders, which deserve proper diagnosis and, where indicated, conventional care alongside." },
    ],
  },
  {
    id: "triphala-gut", slug: "triphala-gut", featured: false,
    title: "Triphala Is Not a Laxative — It Is a Bowel Teacher",
    subtitle: "Rasa logic behind the most famous formula",
    summary: "Everyone knows triphala for constipation. Fewer know it is really about restoring the bowel's own rhythm — and that the dose and timing decide which effect you get.",
    cover: IMG.coverTriphala, categoryId: "dravyaguna", doshas: ["vata", "pitta", "kapha"], authorId: "monesh",
    date: "2026-02-02", views: 9800, symptoms: ["constipation", "digestion", "detox", "gut"], kind: "blog", status: "published",
    blocks: [
      { t: "shloka", sa: "त्रिफला त्रिदोषघ्नी रसायनी च", tr: "Triphala pacifies the three doshas and is a rasayana.", cite: "Ashtanga Hridaya" },
      { t: "h2", text: "Three fruits, one conversation" },
      { t: "p", text: "Amla feeds and cools, bibhitaki clears accumulation, haritaki moves. Together they span the whole rasa spectrum except the sharp, which is precisely why the formula corrects rather than forces." },
      { t: "h2", text: "Timing decides the effect" },
      { t: "table", head: ["Goal", "Dose", "Timing", "Vehicle"], rows: [
        ["Gentle regularity", "3 g", "Bedtime", "Warm water"],
        ["Rasayana (rejuvenation)", "1–2 g", "Morning, empty stomach", "Honey or warm milk"],
        ["Eye health (traditional)", "1 g", "Morning", "Ghee"] ] },
      { t: "callout", tone: "gold", title: "Our rule of thumb", body: "If a patient needs more than 6 g nightly for more than three weeks, the problem is not the dose — it is the routine. We then address sleep, fibre and movement before raising the dose." },
    ],
  },
  {
    id: "panchakarma-when", slug: "panchakarma-when", featured: false,
    title: "When Panchakarma Helps — and When It Harms",
    subtitle: "A detox protocol is a surgery of the subtle body. Treat it like one.",
    summary: "Panchakarma is powerful precisely because it is not gentle. Dr. Karale lays out the pre-oleation rules, the contra-indications he never bends, and how he tracks response.",
    cover: IMG.coverPanchakarma, categoryId: "panchakarma", doshas: ["vata", "kapha"], authorId: "bhagyesh",
    date: "2026-01-25", views: 8600, symptoms: ["detox", "joint pain", "skin", "energy"], kind: "blog", status: "published",
    blocks: [
      { t: "h2", text: "Shodhana is not a spa package" },
      { t: "p", text: "The classical texts insist on snehana (oleation) and swedana (sudation) before any elimination. Skip these and you move toxins without preparing the channels — the patient feels worse, and rightly so." },
      { t: "h3", text: "Our standard sequence" },
      { t: "ul", items: ["5–7 days internal + external oleation", "3 days of controlled sudation", "The chosen shodhana (vastis for vata, virechana for pitta, vamana for kapha)", "A graded samsarjana diet back to normal food"] },
      { t: "h2", text: "Never bend these rules" },
      { t: "ul", items: ["No shodhana in pregnancy, acute infection, or uncontrolled hypertension", "No vamana in cardiac disease", "Full blood work before and after any 5-day protocol"] },
      { t: "callout", tone: "pitta", title: "The marketing problem", body: "Weekend 'detox' packages that promise transformation are the opposite of classical practice. Real shodhana is slow, supervised and individual — and it works because of that." },
    ],
  },
  {
    id: "golden-milk", slug: "golden-milk", featured: false,
    title: "Golden Milk, Rebuilt from the Classical Ground Up",
    subtitle: "Haldi-doodh is a dosha formula, not a latte",
    summary: "Turmeric milk went global as a wellness trend and lost its logic on the way. Here is the ahara reasoning — fat for absorption, black pepper for bioavailability, timing for effect.",
    cover: IMG.coverGoldenMilk, categoryId: "ahara", doshas: ["vata", "kapha"], authorId: "monesh",
    date: "2026-01-18", views: 15200, symptoms: ["immunity", "sleep", "inflammation", "cold"], kind: "blog", status: "published",
    blocks: [
      { t: "h2", text: "Why the fat matters" },
      { t: "p", text: "Curcumin is fat-soluble. Turmeric stirred into water is mostly theatre. In milk — or with a spoon of ghee — and with a crack of black pepper, absorption changes by an order of magnitude." },
      { t: "h2", text: "A working recipe" },
      { t: "ul", items: ["200 ml whole milk (or oat milk + 1 tsp ghee)", "1/2 tsp turmeric, gently warmed, never boiled hard", "A pinch of black pepper", "For vata: a pinch of nutmeg at night. For kapha: dry ginger instead."] },
      { t: "callout", tone: "gold", title: "Timing", body: "Take it 30 minutes before bed for sleep, or mid-morning on an empty stomach as a gentle daily rasayana. Not both — pick the goal." },
    ],
  },
  {
    id: "brahmi-memory", slug: "brahmi-memory", featured: false,
    title: "Brahmi and the Slow Art of Memory",
    subtitle: "A medhya rasayana that rewards patience",
    summary: "Brahmi will not make you memorise faster this week. It does something more interesting over three months — and Dr. Choudhary explains the classical logic and the modern trials.",
    cover: IMG.coverBrahmi, categoryId: "dravyaguna", doshas: ["pitta", "vata"], authorId: "shruti",
    date: "2026-01-10", views: 6400, symptoms: ["memory", "focus", "stress", "sleep"], kind: "blog", status: "published",
    blocks: [
      { t: "h2", text: "Cooling the seat of memory" },
      { t: "p", text: "Brahmi is tikta-kashaya, sheeta in virya. In classical terms it cools the pitta that 'burns' retention. In modern terms its bacosides support synaptic repair — both framings agree on one thing: this is slow, steady work." },
      { t: "h2", text: "The honest timeline" },
      { t: "ul", items: ["Weeks 1–2: usually nothing — do not stop", "Weeks 4–6: sleep deepens, mental chatter settles", "Month 3: retention and recall measurably improve in trials"] },
      { t: "callout", tone: "pitta", title: "Best pairing", body: "Give brahmi in ghee, not water. The ghrita is the vehicle that carries a cold, dry herb to a cold-dry mind — vata and pitta both." },
    ],
  },
  {
    id: "dinacharya-morning", slug: "dinacharya-morning", featured: false,
    title: "The First Ninety Minutes — A Working Dinacharya",
    subtitle: "Morning routine, stripped to what actually moves the doshas",
    summary: "Dinacharya texts list dozens of steps. Most people need five. Dr. Ghuge compresses the morning into a sequence that fits a real life and still does the work.",
    cover: IMG.coverDinacharya, categoryId: "dinacharya", doshas: ["vata", "kapha"], authorId: "monesh",
    date: "2026-01-03", views: 11300, symptoms: ["routine", "energy", "sleep", "digestion"], kind: "blog", status: "published",
    blocks: [
      { t: "h2", text: "Why the morning decides the day" },
      { t: "p", text: "Vata governs motion and kapha governs inertia; the early hours are a vata-kapha battleground. A fixed, warm, rhythmic start settles both — and the whole day inherits that steadiness." },
      { t: "h2", text: "The five-step core" },
      { t: "ul", items: ["Wake before 6 a.m., same time daily", "Warm water first — before anything else enters", "Tongue scraping, then oil pulling if time allows", "Ten minutes of movement — walk, yoga, anything rhythmic", "A warm, cooked breakfast within an hour of waking"] },
      { t: "callout", tone: "gold", title: "The non-negotiable", body: "Wake time is the lever. Change nothing else for two weeks but fix the hour you rise, and most patients report better sleep, appetite and mood — the doshas keep their own clock." },
    ],
  },
];

/* ---------------------------------- herbs ----------------------------------- */

export interface Herb {
  id: string; sanskrit: string; common: string; botanical: string; part: string;
  rasa: string[]; virya: "Hot" | "Cold"; vipaka: string; doshas: Dosha[];
  benefits: string[]; classical: string; caution: string; treats: string[];
  image: string; duotone?: string; accent: string;
}

export const HERBS: Herb[] = [
  { id: "ashwagandha", sanskrit: "अश्वगन्धा", common: "Ashwagandha", botanical: "Withania somnifera", part: "Root", rasa: ["Madhura", "Tikta"], virya: "Hot", vipaka: "Madhura", doshas: ["vata", "kapha"], benefits: ["Adaptogenic — steadies stress physiology", "Improves sleep quality and strength", "Supports male vitality in classical use"], classical: "Ashwagandha imparts the vigour of a stallion.", caution: "Avoid in pregnancy, hyperthyroidism and acute fever.", treats: ["stress", "anxiety", "sleep", "fatigue"], image: IMG.coverBrahmi, duotone: "sepia(0.3) hue-rotate(-15deg)", accent: "#d6b45f" },
  { id: "brahmi", sanskrit: "ब्राह्मी", common: "Brahmi", botanical: "Bacopa monnieri", part: "Whole plant", rasa: ["Tikta", "Kashaya"], virya: "Cold", vipaka: "Madhura", doshas: ["pitta", "vata"], benefits: ["Medhya rasayana — supports memory and focus", "Calms mental chatter and pitta heat", "Traditionally used for skin and scalp"], classical: "The herb of the creator's mind.", caution: "Take with ghee; may cause mild GI upset on empty stomach.", treats: ["memory", "focus", "stress", "skin"], image: IMG.coverBrahmi, accent: "#82b39e" },
  { id: "triphala", sanskrit: "त्रिफला", common: "Triphala", botanical: "Amla · Bibhitaki · Haritaki", part: "Fruit", rasa: ["Madhura", "Amla", "Tikta", "Katu", "Kashaya"], virya: "Hot", vipaka: "Madhura", doshas: ["vata", "pitta", "kapha"], benefits: ["Restores bowel rhythm without dependence", "Gentle tridoshic rasayana", "Traditional support for eye health"], classical: "No house without triphala.", caution: "Avoid in severe diarrhoea; separate from iron supplements.", treats: ["constipation", "digestion", "detox", "gut"], image: IMG.coverTriphala, duotone: "sepia(0.25)", accent: "#e07f49" },
  { id: "tulsi", sanskrit: "तुलसी", common: "Tulsi", botanical: "Ocimum sanctum", part: "Leaf", rasa: ["Katu", "Tikta"], virya: "Hot", vipaka: "Katu", doshas: ["vata", "kapha"], benefits: ["Daily immunomodulator in traditional use", "Eases cough, cold and chest congestion", "Calms the mind — the 'queen of herbs'"], classical: "Where tulsi grows, there is no disease.", caution: "Use in moderation in pitta excess.", treats: ["immunity", "cold", "cough", "stress"], image: IMG.coverKadha, duotone: "sepia(0.2) hue-rotate(20deg)", accent: "#82b39e" },
  { id: "shatavari", sanskrit: "शतावरी", common: "Shatavari", botanical: "Asparagus racemosus", part: "Root", rasa: ["Madhura", "Tikta"], virya: "Cold", vipaka: "Madhura", doshas: ["pitta", "vata"], benefits: ["The classical women's rasayana", "Cooling — soothes acidity and heat", "Nourishing in debility and recovery"], classical: "She who possesses a hundred husbands.", caution: "Avoid with oestrogen-sensitive conditions; consult in pregnancy.", treats: ["women's health", "acidity", "hormones", "energy"], image: IMG.coverGoldenMilk, duotone: "sepia(0.25) hue-rotate(-10deg)", accent: "#93b1cf" },
  { id: "turmeric", sanskrit: "हरिद्रा", common: "Turmeric", botanical: "Curcuma longa", part: "Rhizome", rasa: ["Tikta", "Katu"], virya: "Hot", vipaka: "Katu", doshas: ["kapha", "pitta"], benefits: ["Broad anti-inflammatory in modern research", "Traditional blood and skin purifier", "Kitchen medicine for colds and joints"], classical: "The golden healer of a thousand uses.", caution: "High doses may aggravate pitta; take with fat and pepper.", treats: ["inflammation", "immunity", "skin", "joint pain"], image: IMG.coverGoldenMilk, duotone: "sepia(0.4) saturate(1.2)", accent: "#d6b45f" },
  { id: "guduchi", sanskrit: "गुडूची", common: "Guduchi", botanical: "Tinospora cordifolia", part: "Stem", rasa: ["Tikta", "Kashaya", "Madhura"], virya: "Hot", vipaka: "Madhura", doshas: ["vata", "pitta", "kapha"], benefits: ["Tridoshic immunomodulator", "Traditional fever and recovery herb", "Supports healthy blood sugar"], classical: "The one that protects the body.", caution: "Caution in autoimmune conditions — discuss with your vaidya.", treats: ["immunity", "fever", "detox", "energy"], image: IMG.coverDinacharya, duotone: "sepia(0.2) hue-rotate(15deg)", accent: "#e07f49" },
  { id: "arjuna", sanskrit: "अर्जुन", common: "Arjuna", botanical: "Terminalia arjuna", part: "Bark", rasa: ["Kashaya", "Madhura"], virya: "Cold", vipaka: "Katu", doshas: ["pitta", "kapha"], benefits: ["The classical cardiotonic", "Traditional support for healthy blood pressure", "Astringent, strengthening for the heart muscle"], classical: "The tree that gave a hero his strength.", caution: "Do not combine with cardiac medication without medical supervision.", treats: ["heart", "blood pressure", "cholesterol"], image: IMG.coverPanchakarma, duotone: "sepia(0.25) hue-rotate(-10deg)", accent: "#e07f49" },
];

/* --------------------------------- products --------------------------------- */

export interface ProductReview { name: string; rating: number; text: string; at: string }
export interface Product {
  id: string; name: string; sanskrit: string; price: number; mrp: number;
  image: string; duotone?: string; badge?: string;
  category: "Oils" | "Churnas" | "Capsules" | "Ghritas" | "Kadhas";
  stock: number; rating: number; dosage: string; ingredients: string[]; desc: string;
  highlights?: string[]; source?: string; directions?: string; safety?: string; visible?: boolean;
  reviews?: ProductReview[];
}

export const PRODUCTS: Product[] = [
  { id: "mahanarayana-oil", name: "Mahanarayana Abhyanga Oil", sanskrit: "महानारायण तैल", price: 899, mrp: 1099, image: IMG.coverOil, badge: "Classical · Sahasrayoga", category: "Oils", stock: 24, rating: 4.8, dosage: "Warm 10 ml; massage 15 min before bath, 4–5 days a week.", ingredients: ["Sesame taila base", "60+ classical herbs", "Shatavari", "Ashwagandha", "Bala", "Dashamoola"], desc: "The great vata-pacifying oil of the Sahasrayoga — slow-infused over wood fire. For joints, deep-tissue abhyanga and a tired nervous system.", highlights: ["Slow-infused over 21 days on wood fire", "60+ herbs in the classical ratio", "Deeply warming for vata joints"], source: "Sahasrayoga, Mahanarayana taila", directions: "Warm gently, massage along the grain of the hair and the length of the limbs, rest 15 minutes, then bathe.", safety: "For external use. Patch-test first. Avoid on broken skin.",
    reviews: [
      { name: "Rohini D.", rating: 5, text: "My knee stiffness has visibly eased in three weeks of evening abhyanga. The warmth lingers beautifully.", at: "2026-02-11" },
      { name: "Amit K.", rating: 4, text: "Rich and authentic-smelling. A little goes a long way — the 200ml bottle lasts me two months.", at: "2026-02-03" },
    ] },
  { id: "triphala-churna", name: "Triphala Churna, Stone-milled", sanskrit: "त्रिफला चूर्ण", price: 449, mrp: 549, image: IMG.coverTriphala, badge: "Bestseller", category: "Churnas", stock: 61, rating: 4.9, dosage: "3–6 g at bedtime with warm water.", ingredients: ["Amla (Emblica officinalis)", "Bibhitaki", "Haritaki", "Equal-part classical ratio"], desc: "Three fruits in the exact Charaka ratio, stone-milled at low speed to preserve volatile fractions. Gentle, non-habit-forming bowel regulation.", highlights: ["Exact 1:1:1 classical ratio", "Stone-milled below 40°C", "Non-habit-forming"], source: "Charaka Samhita, Ashtanga Hridaya", directions: "Stir into warm water at bedtime. For rasayana use, take in the morning with honey.", safety: "Avoid in severe diarrhoea. Keep out of reach of children." },
  { id: "ashwagandha-caps", name: "Ashwagandha Root Capsules", sanskrit: "अश्वगन्धा वटिका", price: 699, mrp: 799, image: IMG.coverBrahmi, badge: "2.5% withanolides", category: "Capsules", stock: 42, rating: 4.7, dosage: "1 capsule (500 mg) twice daily after meals.", ingredients: ["Withania somnifera root extract", "Standardised to 2.5% withanolides", "Vegetable capsule"], desc: "Root-only extract — no leaf filler — standardised for the cortisol and sleep endpoints studied in trials. 60-day supply.", highlights: ["Root-only, no leaf filler", "Standardised 2.5% withanolides", "60-day supply"], source: "Bhavaprakasha Nighantu", directions: "One capsule after each main meal with warm milk or water.", safety: "Avoid in pregnancy and hyperthyroidism. Consult a physician if on thyroid medication." },
  { id: "brahmi-ghrita", name: "Brahmi Ghrita", sanskrit: "ब्राह्मी घृत", price: 1099, mrp: 1299, image: IMG.coverGoldenMilk, badge: "A2 Gir cow ghee", category: "Ghritas", stock: 15, rating: 4.6, dosage: "1 tsp (5 g) in warm milk at night.", ingredients: ["A2 Gir cow ghee", "Fresh Bacopa monnieri juice", "Vacha", "Shankhapushpi", "Kushtha kalka"], desc: "Classical medhya ghrita — fresh brahmi juice simmered into A2 ghee the traditional way. The memory formulation of the paediatric texts.", highlights: ["Fresh brahmi juice, not powder", "A2 Gir cow ghee", "Classical medhya combination"], source: "Ashtanga Hridaya, Uttara Sthana", directions: "One teaspoon in warm milk at night, or as directed for nasya by a vaidya.", safety: "Avoid in acute fever and high cholesterol without supervision." },
  { id: "kadha-concentrate", name: "Immunity Kadha Concentrate", sanskrit: "काढ़ा", price: 549, mrp: 649, image: IMG.coverKadha, badge: "30 servings", category: "Kadhas", stock: 50, rating: 4.8, dosage: "10 ml in 100 ml hot water, morning and evening.", ingredients: ["Tulsi", "Sunthi (dry ginger)", "Maricha", "Pippali", "Dalchini", "Mulethi"], desc: "The household defence decoction, reduced to a sugar-free concentrate. Warming kapha-vata pacification for throat, chest and seasonal transitions.", highlights: ["Sugar-free concentrate", "Six classical warming herbs", "30 servings per bottle"], source: "Household classical tradition", directions: "Dilute 10 ml in hot water. Take warm, morning and evening during seasonal change.", safety: "Not for children under 5. Consult a physician if fever persists beyond 48 hours." },
  { id: "shatavari-kalpa", name: "Shatavari Kalpa Powder", sanskrit: "शतावरी कल्प", price: 649, mrp: 749, image: IMG.coverGoldenMilk, badge: "Wild-harvest certified", category: "Churnas", stock: 33, rating: 4.7, dosage: "3–6 g with warm milk, twice daily.", ingredients: ["Asparagus racemosus root", "Milk-processed (kshira samskara)", "Mishri (rock sugar)"], desc: "Milk-processed shatavari root in the classical kalpa form — cooling, unctuous, and the pitta-type's best friend through heat, acidity and dryness.", highlights: ["Milk-processed (kshira samskara)", "Wild-harvest certified root", "Cooling and nourishing"], source: "Charaka Samhita", directions: "3–6 g with warm milk. Before meals for acidity; after meals for nourishment.", safety: "Avoid with oestrogen-sensitive conditions. Discuss use in pregnancy with your physician." },
];

/* ---------------------------------- orders ---------------------------------- */

export type OrderStatus = "new" | "processing" | "shipped" | "out" | "delivered" | "cancelled";
export const ORDER_META: Record<OrderStatus, { label: string; color: string; cls: string }> = {
  new: { label: "New", color: "#d6b45f", cls: "bg-gold-400/15 text-gold-300 border-gold-400/40" },
  processing: { label: "Processing", color: "#93b1cf", cls: "bg-steel-400/15 text-steel-300 border-steel-400/40" },
  shipped: { label: "Shipped", color: "#e8cf8b", cls: "bg-gold-300/15 text-gold-300 border-gold-300/40" },
  out: { label: "Out for delivery", color: "#e07f49", cls: "bg-ember-400/15 text-ember-300 border-ember-400/40" },
  delivered: { label: "Delivered", color: "#82b39e", cls: "bg-kapha-400/15 text-kapha-300 border-kapha-400/40" },
  cancelled: { label: "Cancelled", color: "#c96430", cls: "bg-ember-500/15 text-ember-300 border-ember-500/40" },
};
export const ORDER_FLOW: OrderStatus[] = ["new", "processing", "shipped", "out", "delivered"];

export interface OrderCustomer { name: string; phone: string; address: string; city: string; pin: string }
export interface Order {
  id: string; customer: OrderCustomer;
  items: { name: string; qty: number; price: number; productId?: string; image?: string }[];
  total: number; status: OrderStatus; placedAt: string; customerId?: string; paymentMethod?: string;
  discountCode?: string; discountAmount?: number; shippingFee?: number;
}

export const SEED_ORDERS: Order[] = [
  { id: "VG-1042", customer: { name: "Rohini Deshmukh", phone: "+91 98220 11111", address: "14 Shivaji Nagar", city: "Pune", pin: "411005" }, items: [{ name: "Triphala Churna, Stone-milled", qty: 2, price: 449, productId: "triphala-churna", image: IMG.coverTriphala }], total: 898, status: "new", placedAt: new Date(Date.now() - 6 * 3600e3).toISOString(), customerId: "c-1", paymentMethod: "UPI" },
  { id: "VG-1041", customer: { name: "Amit Kulkarni", phone: "+91 98500 22222", address: "3 FC Road", city: "Pune", pin: "411004" }, items: [{ name: "Mahanarayana Abhyanga Oil", qty: 1, price: 899, productId: "mahanarayana-oil", image: IMG.coverOil }, { name: "Immunity Kadha Concentrate", qty: 1, price: 549, productId: "kadha-concentrate", image: IMG.coverKadha }], total: 1448, status: "processing", placedAt: new Date(Date.now() - 26 * 3600e3).toISOString(), customerId: "c-2", paymentMethod: "Card" },
  { id: "VG-1040", customer: { name: "Sneha Patil", phone: "+91 99700 33333", address: "22 Kothrud", city: "Pune", pin: "411038" }, items: [{ name: "Brahmi Ghrita", qty: 1, price: 1099, productId: "brahmi-ghrita", image: IMG.coverGoldenMilk }], total: 1099, status: "shipped", placedAt: new Date(Date.now() - 2 * 86400e3).toISOString(), customerId: "c-3", paymentMethod: "UPI" },
  { id: "VG-1039", customer: { name: "Vikram Joshi", phone: "+91 98900 44444", address: "8 Baner", city: "Pune", pin: "411045" }, items: [{ name: "Ashwagandha Root Capsules", qty: 2, price: 699, productId: "ashwagandha-caps", image: IMG.coverBrahmi }], total: 1398, status: "delivered", placedAt: new Date(Date.now() - 5 * 86400e3).toISOString(), customerId: "c-4", paymentMethod: "COD" },
];

/* ----------------------------------- quiz ----------------------------------- */

export interface QuizQuestion { area: string; q: string; options: { text: string; dosha: Dosha }[] }
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { area: "Frame", q: "How would you describe your natural body frame?", options: [{ text: "Lean, slender — I find it hard to gain weight", dosha: "vata" }, { text: "Medium, athletic — muscle comes fairly easily", dosha: "pitta" }, { text: "Broad, solid — I gain weight easily and lose it slowly", dosha: "kapha" }] },
  { area: "Skin", q: "Your skin typically feels…", options: [{ text: "Dry, thin, cool — it cracks in winter", dosha: "vata" }, { text: "Warm, oily in patches — flushes and freckles easily", dosha: "pitta" }, { text: "Smooth, thick, naturally moisturised", dosha: "kapha" }] },
  { area: "Sleep", q: "Which sleep pattern is most you?", options: [{ text: "Light and interrupted — my mind races at 3 a.m.", dosha: "vata" }, { text: "Short but deep — I can function on less than most", dosha: "pitta" }, { text: "Long and heavy — waking up is the hardest part", dosha: "kapha" }] },
  { area: "Appetite", q: "Your appetite and digestion…", options: [{ text: "Irregular — I forget meals, then bloat afterward", dosha: "vata" }, { text: "Sharp — I get 'hangry' and need to eat on time", dosha: "pitta" }, { text: "Steady but slow — I could comfortably skip a meal", dosha: "kapha" }] },
  { area: "Temperature", q: "In extreme weather you prefer…", options: [{ text: "Warmth, always — cold hands, cold feet", dosha: "vata" }, { text: "Coolness — I overheat and sweat quickly", dosha: "pitta" }, { text: "Warm, dry days — damp cold settles in my chest", dosha: "kapha" }] },
  { area: "Mind", q: "Under pressure, your mind tends to…", options: [{ text: "Scatter — anxiety, overthinking, spiralling lists", dosha: "vata" }, { text: "Sharpen into irritation — critical, impatient, driven", dosha: "pitta" }, { text: "Withdraw — inertia, resistance, comfort-seeking", dosha: "kapha" }] },
  { area: "Speech", q: "Friends would describe your speech as…", options: [{ text: "Fast — I talk in tangents and finish others' sentences", dosha: "vata" }, { text: "Precise — persuasive, sometimes blunt", dosha: "pitta" }, { text: "Measured — slow, melodic, I choose words carefully", dosha: "kapha" }] },
  { area: "Memory", q: "Your memory works like…", options: [{ text: "Quick to learn, quick to forget", dosha: "vata" }, { text: "Sharp and focused — I rarely forget a slight or a fact", dosha: "pitta" }, { text: "Slow to learn, near-permanent retention", dosha: "kapha" }] },
  { area: "Energy", q: "Your energy through the day…", options: [{ text: "Comes in bursts — I sprint, then crash", dosha: "vata" }, { text: "Consistent and competitive — I pace to win", dosha: "pitta" }, { text: "A slow-burning reserve — steady all day", dosha: "kapha" }] },
  { area: "Joints", q: "Your joints and muscles…", options: [{ text: "Crack and creak — stiffness after sitting", dosha: "vata" }, { text: "Tolerant of strain — but I inflame and overheat", dosha: "pitta" }, { text: "Well-padded, stable — heavy rather than stiff", dosha: "kapha" }] },
  { area: "Stool", q: "Elimination is usually…", options: [{ text: "Irregular — dry, constipation creeps in when stressed", dosha: "vata" }, { text: "Regular — but loose or urgent when overheated", dosha: "pitta" }, { text: "Slow, smooth, unhurried — sometimes sluggish for days", dosha: "kapha" }] },
  { area: "Money", q: "With money and plans you are…", options: [{ text: "Impulsive — I earn in flashes and spend in gusts", dosha: "vata" }, { text: "Strategic — I invest with a spreadsheet and opinions", dosha: "pitta" }, { text: "A saver — steady accumulation, reluctant to part with it", dosha: "kapha" }] },
];

export interface DoshaResult { dosha: Dosha; headline: string; body: string; diet: string[]; lifestyle: string[]; herbs: string[] }
export const DOSHA_RESULTS: Record<Dosha, DoshaResult> = {
  vata: { dosha: "vata", headline: "Vata leads your constitution", body: "Air and ether govern your movement — quick mind, quick body, quick to exhaust. Your gift is creativity and speed; your tax is dryness, anxiety and irregularity. Everything warm, oily, rhythmic and grounded is medicine for you.", diet: ["Favour warm, moist, well-cooked meals; minimise raw and cold", "Ghee and sesame oil are your daily medicine — inside and outside", "Sweet-sour-salty balance; bitter and astringent in moderation", "Regular meal times matter more than the menu itself"], lifestyle: ["Fixed wake and sleep times — vata heals inside routine", "Daily abhyanga with warm sesame oil, even 5 minutes", "Slow exercise: walking, yin yoga, tai chi over HIIT", "Digital sunset one hour before bed"], herbs: ["Ashwagandha", "Jatamansi", "Brahmi (with ghee)", "Dashamoola"] },
  pitta: { dosha: "pitta", headline: "Pitta leads your constitution", body: "Fire and water run your metabolism — sharp digestion, sharper mind, a body that overheats easily. Your gift is focus and leadership; your tax is inflammation, acidity and impatience. Coolness, sweetness and un-scheduled time are your prescription.", diet: ["Sweet, bitter and astringent as the base of your plate", "Cool, not iced; coconut, coriander, fennel, amla daily", "Limit fermented foods, chilli, excess coffee and alcohol", "Never skip meals — an empty pitta gut turns on itself"], lifestyle: ["Exercise in the cool hours; swimming is your ideal sport", "10 minutes of non-doing daily — moonlit walks, not more lists", "Protect midday heat; your skin and temper both thank you", "Sleep before 11 p.m. — the pitta hour amplifies what it touches"], herbs: ["Shatavari", "Brahmi", "Amla", "Mulethi (licorice)"] },
  kapha: { dosha: "kapha", headline: "Kapha leads your constitution", body: "Earth and water give you structure — steady strength, deep sleep, legendary patience. Your gift is endurance and calm; your tax is heaviness, congestion and inertia. Warmth, lightness, spice and motion keep your earth from settling.", diet: ["Light, warm, dry preparations; roasted over fried", "Pungent, bitter, astringent lead — ginger, pepper, honey", "Reduce dairy, heavy sweets and daytime napping", "Smaller dinners; your agni is weakest after sunset"], lifestyle: ["Early rising is your single best intervention — before 6 a.m.", "Vigorous daily exercise; you are the dosha built for intensity", "Dry brushing and stimulating massage over oil-heavy abhyanga", "Novelty on a schedule — new routes, new skills, cold exposure"], herbs: ["Trikatu", "Guduchi", "Tulsi", "Triphala"] },
};

/* --------------------------------- helpers ---------------------------------- */

export function categoryName(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? "Journal";
}

export function kindOf(a: Article): Kind {
  return a.kind ?? "blog";
}

export function articleHtml(a: Article): string {
  if (a.html && a.html.trim()) return a.html;
  return a.blocks.map(blockToHtml).join("\n");
}

export function withHeadingIds(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("h2, h3").forEach((h) => {
      if (!h.id) h.id = slug(h.textContent ?? "");
    });
    return doc.body.innerHTML;
  } catch { return html; }
}

export function articlePlainText(a: Article): string {
  const html = articleHtml(a);
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent ?? "";
  } catch { return html.replace(/<[^>]*>/g, " "); }
}

export function readingTime(a: Article): number {
  const words = articlePlainText(a).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 210));
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

/* ------------------------- symptom search index ----------------------------- */

export interface SymptomHit { term: string; context: string; target: { kind: "article" | "herb"; id: string } }
export function buildSymptomIndex(articles: Article[], herbTerms: { id: string; term: string; label: string }[]): SymptomHit[] {
  const hits: SymptomHit[] = [];
  articles.forEach((a) => a.symptoms.forEach((s) => hits.push({ term: s, context: a.title, target: { kind: "article", id: a.id } })));
  herbTerms.forEach((h) => hits.push({ term: h.term, context: `Herb — ${h.label}`, target: { kind: "herb", id: h.id } }));
  return hits;
}

export const FREE_SHIP_AT = 999;
