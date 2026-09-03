/* Vaidyagan content store — articles, herbs, products, quiz, orders. */

export const BRAND_LOGO_URL = "https://i.ibb.co/BVkhGLBM/20260816-122320-0000.png";

export const IMG = {
  coverPanchakarma: "https://image.qwenlm.ai/generated-images/e7fed64b-eda9-4b16-893a-77b0f6fbb664/_result.png",
  coverGoldenMilk: "https://image.qwenlm.ai/generated-images/d8c662f3-ddac-465a-b3a9-440c62b0406f/_result.png",
  coverBrahmi: "https://image.qwenlm.ai/generated-images/b4a92234-5a47-4b46-8321-b4a67be2a9b2/_result.png",
  coverDinacharya: "https://image.qwenlm.ai/generated-images/9fb636fa-1f05-4547-8158-78e69c2499de/_result.png",
  coverTriphala: "https://image.qwenlm.ai/generated-images/046cb60c-a2c5-49e3-ae61-977b7af7d510/_result.png",
  coverKadha: "https://image.qwenlm.ai/generated-images/4b732755-6957-486a-a1f2-80f720e82748/_result.png",
  productOil: "https://image.qwenlm.ai/generated-images/4ff87c76-bafd-42d8-be75-79536e01ea78/_result.png",
};

/* --------------------------------- articles -------------------------------- */

export type Kind = "blog" | "case" | "research";
export const KIND_META: Record<Kind, { label: string; short: string; color: string }> = {
  blog: { label: "Blog essay", short: "Essay", color: "#d6b45f" },
  case: { label: "Case paper", short: "Case", color: "#e07f49" },
  research: { label: "Research review", short: "Research", color: "#93b1cf" },
};

export interface Category { id: string; name: string; sanskrit: string; desc: string }
export const CATEGORIES: Category[] = [
  { id: "dravyaguna", name: "Herbs", sanskrit: "द्रव्यगुण", desc: "Dravyaguna — herb monographs and pharmacology" },
  { id: "chikitsa", name: "Disease protocols", sanskrit: "चिकित्सा", desc: "Chikitsa — disease management protocols" },
  { id: "nidana", name: "Diagnosis", sanskrit: "निदान", desc: "Nidana — reading the body's signals" },
  { id: "panchakarma", name: "Panchakarma", sanskrit: "पञ्चकर्म", desc: "Detox and purification procedures" },
  { id: "ahara", name: "Dietetics", sanskrit: "आहार", desc: "Ahara — food as medicine" },
];
export function categoryName(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? "General";
}

export type Dosha = "vata" | "pitta" | "kapha";
export const DOSHA_META: Record<Dosha, { name: string; sa: string; color: string; elements: string }> = {
  vata: { name: "Vata", sa: "वात", color: "#93b1cf", elements: "Air · Ether" },
  pitta: { name: "Pitta", sa: "पित्त", color: "#e07f49", elements: "Fire · Water" },
  kapha: { name: "Kapha", sa: "कफ", color: "#82b39e", elements: "Earth · Water" },
};

export interface Author {
  id: string; name: string; initials: string; qualification: string; specialty: string;
  years: number; bio: string; quote: string; hue: string;
}
export const AUTHORS: Author[] = [
  {
    id: "monesh", name: "Dr. Monesh L Ghuge", initials: "MG", qualification: "BAMS",
    specialty: "Kayachikitsa · General medicine", years: 16,
    bio: "Sixteen years of OPD practice rooted in classical Kayachikitsa — with the patience of the texts and the rigour of modern records.",
    quote: "A prescription without a diagnosis is a guess wearing a white coat.",
    hue: "#d6b45f",
  },
  {
    id: "bhagyesh", name: "Dr. Bhagyesh Karale", initials: "BK", qualification: "MD (Ayu) — Panchakarma",
    specialty: "Panchakarma · Detox protocols", years: 12,
    bio: "Trained in Kerala's classical shodhana tradition; runs structured detox programmes with full pre- and post-marker tracking.",
    quote: "Detox is not a spa weekend. It is a medical procedure with a before and an after.",
    hue: "#e07f49",
  },
  {
    id: "shruti", name: "Dr. Shruti Choudhary", initials: "SC", qualification: "MD (Ayu) — Dravyaguna",
    specialty: "Dravyaguna · Clinical herbology", years: 9,
    bio: "Herb-obsessed in the best sense — every monograph she writes is checked against the rasa–virya–vipaka logic of the classics.",
    quote: "An herb is a sentence. The dosha is the grammar. Most prescriptions fail on grammar.",
    hue: "#82b39e",
  },
  {
    id: "shivani", name: "Dr. Shivani Kadam", initials: "SK", qualification: "MD (Ayu) — Stri Roga",
    specialty: "Stri Roga · Women's health", years: 8,
    bio: "Focuses on PCOS, cycle disorders and post-partum recovery — where classical Stri Roga meets modern lab work.",
    quote: "The cycle is the body's monthly report card. Read it before you medicate it.",
    hue: "#93b1cf",
  },
];

export type ArticleStatus = "draft" | "published" | "scheduled" | "review";

export interface CaseMeta { presenting: string; history: string; examination: string; intervention: string; outcome: string }
export interface ResearchMeta { objective: string; method: string; findings: string; conclusion: string; citations: string }

export interface Block {
  t: "p" | "h2" | "h3" | "shloka" | "callout" | "list" | "table" | "img";
  text?: string; sa?: string; tr?: string; cite?: string; title?: string; tone?: "gold" | "pitta";
  items?: string[]; head?: string[]; rows?: string[][]; src?: string; caption?: string;
}

export interface Article {
  id: string; slug: string; title: string; subtitle: string; summary: string;
  cover: string; categoryId: string; customCategory?: string; doshas: Dosha[];
  authorId: string; date: string; views: number; symptoms: string[];
  kind?: Kind; caseMeta?: CaseMeta; researchMeta?: ResearchMeta;
  blocks: Block[]; html?: string; pdfUrl?: string; pdfName?: string;
  status: ArticleStatus; featured?: boolean;
}

export function kindOf(a: Article): Kind { return a.kind ?? "blog"; }

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "sec";
}

function blocksToHtml(blocks: Block[]): string {
  return blocks.map((b) => {
    switch (b.t) {
      case "p": return `<p>${b.text}</p>`;
      case "h2": return `<h2>${b.text}</h2>`;
      case "h3": return `<h3>${b.text}</h3>`;
      case "shloka": return `<blockquote class="shloka"><p class="sa">${b.sa}</p><p class="tr">${b.tr}</p><cite>${b.cite}</cite></blockquote>`;
      case "callout": return `<div class="callout callout-${b.tone ?? "gold"}"><p class="callout-title">${b.title}</p><p>${b.text}</p></div>`;
      case "list": return `<ul>${(b.items ?? []).map((i) => `<li>${i}</li>`).join("")}</ul>`;
      case "table": return `<table><thead><tr>${(b.head ?? []).map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${(b.rows ?? []).map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      case "img": return `<figure><img src="${b.src}" alt="${b.caption ?? ""}" /><figcaption>${b.caption ?? ""}</figcaption></figure>`;
      default: return "";
    }
  }).join("\n");
}

export function articleHtml(a: Article): string {
  const fromBlocks = a.blocks.length ? blocksToHtml(a.blocks) : "";
  const fromHtml = a.html ?? "";
  return [fromBlocks, fromHtml].filter(Boolean).join("\n");
}

export function articleToc(a: Article): { id: string; text: string; level: 2 | 3 }[] {
  const doc = new DOMParser().parseFromString(articleHtml(a), "text/html");
  return Array.from(doc.querySelectorAll("h2, h3")).map((n) => ({
    id: n.id || slug(n.textContent ?? ""),
    text: n.textContent ?? "",
    level: (n.tagName === "H2" ? 2 : 3) as 2 | 3,
  })).filter((t) => t.text.trim());
}

export function withHeadingIds(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("h2, h3").forEach((n) => { if (!n.id) n.id = slug(n.textContent ?? ""); });
  return doc.body.innerHTML;
}

export function articlePlainText(a: Article): string {
  const doc = new DOMParser().parseFromString(articleHtml(a), "text/html");
  return doc.body.textContent ?? "";
}

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
          qualification: m.specialty ?? "BAMS", specialty: m.specialty ?? "Ayurvedic medicine",
          years: 1, bio: "Verified member of the Vaidyagan publishing desk.",
          quote: "Written from the OPD, checked against the classics.", hue: m.hue,
        };
      }
    }
  } catch { /* fall through */ }
  return AUTHORS[0];
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

export function readingTime(a: Article): number {
  return Math.max(1, Math.round(articlePlainText(a).split(/\s+/).filter(Boolean).length / 210));
}

export const ARTICLES: Article[] = [
  {
    id: "a-ashwagandha", slug: "ashwagandha-cortisol-clinic", title: "Ashwagandha beyond the hype — a clinician's dosing ledger",
    subtitle: "What the withanolides actually do, and who should skip it",
    summary: "Ashwagandha is the most prescribed adaptogen in the country and the most misunderstood. This is the ledger we keep in the OPD — doses, timelines, and the patients it genuinely helps.",
    cover: IMG.coverBrahmi, categoryId: "dravyaguna", doshas: ["vata", "kapha"], authorId: "monesh",
    date: "2026-03-14", views: 12840, symptoms: ["stress", "anxiety", "sleep", "fatigue"],
    kind: "blog", status: "published",
    blocks: [
      { t: "shloka", sa: "बल्यं वृष्यं रसायनं वृंहणं कफदातुलम्।", tr: "Strength-giving, vitalising, rejuvenating, nourishing — and building of the body's tissues.", cite: "Bhavaprakasha Nighantu" },
      { t: "p", text: "Every week someone arrives holding a bottle of ashwagandha bought online, asking the same question: is this actually doing anything? The honest answer is — sometimes, for the right person, at the right dose, given enough time. This essay is our attempt to write down the ledger we keep in the clinic, so the answer stops being folklore." },
      { t: "h2", text: "What the root actually contains" },
      { t: "p", text: "The working molecules are withanolides — a family of steroidal lactones concentrated in the root. A standardised extract carries 1.5% to 5% of them. Leaf material is far cheaper and far weaker, which is why root-only sourcing matters more than any brand name." },
      { t: "list", items: [
        "Hypothalamic-pituitary-adrenal modulation — the stress axis calms rather than being sedated.",
        "Sleep architecture improves over 4–8 weeks, not overnight.",
        "Strength and recovery markers rise in trained adults given 500–600 mg twice daily.",
        "Thyroid-stimulating in some — a reason to pause in hyperthyroid patients." ] },
      { t: "h2", text: "The dosing ledger we actually use" },
      { t: "table", head: ["Presentation", "Form", "Dose", "Review at"], rows: [
        ["Stress + poor sleep", "Root extract, 2.5% withanolides", "300 mg after lunch, 300 mg after dinner", "4 weeks"],
        ["Vata fatigue, cold intolerance", "Churna with warm milk + ghee", "3–6 g at bedtime", "3 weeks"],
        ["Training recovery", "Extract capsule", "600 mg once, post-workout", "6 weeks"] ] },
      { t: "callout", tone: "pitta", title: "Who should pause", text: "Hyperthyroid disease, autoimmune flares, pregnancy, and anyone on sedatives should speak to a physician before starting. Ashwagandha is medicine — treat it that way." },
      { t: "h3", text: "Why eight weeks, not eight days" },
      { t: "p", text: "Adaptogens do not push the body; they widen its tolerance band. That widening is measurable only after repeated exposure — which is why every serious trial runs 8 to 12 weeks, and why a one-week verdict is meaningless." },
    ],
  },
  {
    id: "a-amla-anxiety", slug: "amlavata-anxiety-vata-loop", title: "Amlavata and the anxiety loop — treating the gut to quiet the mind",
    subtitle: "A classical reading of reflux, worry and the vagus nerve",
    summary: "Anxious patients reflux; refluxing patients anxious-loop. Charaka mapped this circuit centuries ago. Here is how we interrupt it with diet, timing and two herbs.",
    cover: IMG.coverGoldenMilk, categoryId: "chikitsa", doshas: ["pitta", "vata"], authorId: "shivani",
    date: "2026-03-02", views: 9630, symptoms: ["anxiety", "acidity", "stress", "sleep"],
    kind: "blog", status: "published",
    blocks: [
      { t: "p", text: "The most common sentence in our Stri Roga OPD is not about periods. It is: 'Doctor, my stomach burns when I worry, and I worry because my stomach burns.' Charaka described this exact circuit — udavarta, the upward-wandering of vata — and the treatment logic still holds." },
      { t: "h2", text: "The circuit, in modern terms" },
      { t: "list", items: [
        "Stress accelerates gastric emptying irregularity and acid exposure.",
        "Oesophageal irritation signals the brainstem via the vagus — reading as threat.",
        "The threat response tightens the diaphragm and worsens reflux. The loop closes.",
        "Breaking it at any single point weakens the whole circle." ] },
      { t: "h2", text: "How we break it" },
      { t: "p", text: "We rarely start with an acid blocker. The first prescription is a clock: fixed meal times, no food after 8 pm, a ten-minute walk after lunch. Then the plate — amla and mulethi in the morning, ghee-softened meals, bitter greens at lunch." },
      { t: "h3", text: "The two herbs that earn their keep" },
      { t: "list", items: [
        "Amla (Emblica officinalis) — cooling, astringent; steadies acid without flattening digestion.",
        "Mulethi (licorice) — demulcent; coats and calms the irritated lining. Short courses only." ] },
      { t: "callout", tone: "gold", title: "The six-week rule", text: "Diet and timing changes are judged at six weeks, not six days. Patients who stay the course report the anxiety side softening first — the gut follows." },
    ],
  },
  {
    id: "a-brahmi-memory", slug: "brahmi-smriti-clinic", title: "Brahmi and the exam-season mind — what smriti really means",
    subtitle: "Memory in Ayurveda is a whole-body function, not a pill",
    summary: "Every February the OPD fills with students asking for 'a memory tablet'. Brahmi is part of the answer — but the classical answer is bigger than any capsule.",
    cover: IMG.coverBrahmi, categoryId: "dravyaguna", doshas: ["pitta", "vata"], authorId: "shruti",
    date: "2026-02-06", views: 15210, symptoms: ["memory", "focus", "sleep", "stress"],
    kind: "blog", status: "published",
    blocks: [
      { t: "shloka", sa: "मेधायुष्या रसायनी ब्राह्मी शोथहरा परा।", tr: "Brahmi — the intellect-giver, the life-extender, the supreme rejuvenator, the inflammation-queller.", cite: "Dhanvantari Nighantu" },
      { t: "p", text: "Smriti — memory — is never described in the texts as a filing cabinet. It is a property of a well-nourished, calm, sattvic nervous system. That definition changes the prescription entirely: you are not dosing a molecule, you are composing a nervous system." },
      { t: "h2", text: "What the bacosides do" },
      { t: "p", text: "Bacopa's active saponins support dendritic branching — the physical growth of connections between neurons. This is slow, structural work: trials show separation from placebo around week six, widening to week twelve." },
      { t: "h2", text: "The smriti protocol we hand students" },
      { t: "table", head: ["Time", "Practice", "Why"], rows: [
        ["Morning", "Brahmi ghrita, 1 tsp in warm milk", "Medhya rasayana base — fat carries the saponins"],
        ["Midday", "20-minute nap window (before 2 pm)", "Consolidation happens in light sleep"],
        ["Evening", "Screens off 90 min before bed", "Sleep debt erases more memory than stress does"] ] },
      { t: "h3", text: "Why we add ghee, not water" },
      { t: "p", text: "Bacosides are lipophilic. Taken with fat — ghee or milk — absorption rises meaningfully. This is the kind of detail the ghrita formulations encode, centuries before bioavailability was a word." },
    ],
  },
  {
    id: "a-triphala-gut", slug: "triphala-agni-daily", title: "Triphala is not a laxative — it is a timing device for agni",
    subtitle: "Reframing the three fruits around the digestive fire",
    summary: "Sold as a laxative, used as a crutch, Triphala is neither. Placed correctly around meals and sleep, the three fruits become a metronome for the digestive fire.",
    cover: IMG.coverTriphala, categoryId: "ahara", doshas: ["vata", "pitta", "kapha"], authorId: "monesh",
    date: "2026-01-19", views: 18450, symptoms: ["constipation", "digestion", "detox", "acidity"],
    kind: "blog", status: "published", featured: true,
    blocks: [
      { t: "p", text: "Triphala is the most mis-sold substance in Ayurveda — marketed as a laxative, taken like a sleeping pill, judged like a purgative. None of the three descriptions survives contact with the classics. The three fruits are a timing device: they do not force the bowel, they retrain it." },
      { t: "h2", text: "Three fruits, three jobs" },
      { t: "table", head: ["Fruit", "Taste logic", "Job in the formula"], rows: [
        ["Amla", "Sour → cooling, vitamin-dense", "Feeds the lining; the pacifier of pitta"],
        ["Bibhitaki", "Astringent, drying", "Scrapes kapha mucus; firms the channel"],
        ["Haritaki", "Bitter, mildly heating", "Moves vata downward — the peristalsis engine"] ] },
      { t: "h2", text: "Where it sits in the day" },
      { t: "list", items: [
        "Bedtime dose (3–6 g, warm water) trains the morning reflex — the bowel learns the clock.",
        "Half-dose before meals kindles agni in sluggish digesters.",
        "With honey, it turns anupana — a carrier — for other herbs." ] },
      { t: "callout", tone: "gold", title: "The weaning test", text: "The goal of triphala is to stop needing triphala. If regularity returns within six weeks, taper. A lifelong nightly dependence is a failed prescription, not a success." },
      { t: "h3", text: "Who should be cautious" },
      { t: "p", text: "Pregnancy, active diarrhoea, and anyone on anticoagulants should clear it with a physician. The amla component can amplify iron absorption — worth knowing, rarely a problem." },
    ],
  },
  {
    id: "a-dinacharya", slug: "dinacharya-clock-medicine", title: "Dinacharya is clock medicine — and the clock is the prescription",
    subtitle: "Why the sequence matters more than any single practice",
    summary: "Tongue scraping without the wake time is decoration. The power of dinacharya lies in order: the morning sequence is one medicine taken in seven movements.",
    cover: IMG.coverDinacharya, categoryId: "chikitsa", doshas: ["vata", "kapha"], authorId: "bhagyesh",
    date: "2026-01-28", views: 8320, symptoms: ["sleep", "energy", "digestion", "routine"],
    kind: "blog", status: "published",
    blocks: [
      { t: "p", text: "Patients cherry-pick dinacharya — the oil pulling, not the 5:30 alarm. The texts are clear that this fails: the sequence is the medicine. Each movement sets the hormonal and vagal stage for the next." },
      { t: "h2", text: "The sequence, as one prescription" },
      { t: "list", items: [
        "Brahma muhurta waking anchors the cortisol curve before it peaks.",
        "Tongue scraping and tooth care clear the night's ama before swallowing anything.",
        "Warm water on an empty stomach begins peristalsis.",
        "Abhyanga before bath feeds the skin barrier and steadies vata for the day.",
        "Sunlight within the hour sets the circadian clock that sleep depends on." ] },
      { t: "h2", text: "Where patients actually break" },
      { t: "p", text: "Almost everyone breaks at the same place: the first ninety minutes. Fix the wake time and the first three movements, and the rest of the day tends to organise itself. We prescribe dinacharya the way we prescribe a drug — full course, then review." },
      { t: "callout", tone: "gold", title: "The review date", text: "We book a two-week review, not to check compliance but to check the clock: has the morning reflex started arriving on its own?" },
    ],
  },
  {
    id: "a-panchakarma", slug: "vamana-case-protocol", title: "Structured vamana in refractory kapha-type urticaria — a desk case",
    subtitle: "Case paper: 41-year-old, 6-year history, three failed antihistamine courses",
    summary: "A documented course of therapeutic emesis with full pre- and post-marker tracking in a patient whose urticaria had resisted conventional escalation.",
    cover: IMG.coverPanchakarma, categoryId: "panchakarma", doshas: ["kapha", "vata"], authorId: "bhagyesh",
    date: "2026-02-21", views: 6110, symptoms: ["skin", "allergy", "itching", "detox"],
    kind: "case", status: "published",
    caseMeta: {
      presenting: "Recurrent raised wheals with intense pruritus, worse at dawn and after dairy, 6-year history.",
      history: "Three escalating antihistamine courses; partial relief only. Sedentary desk work, heavy kapha diet, morning lethargy.",
      examination: "Kapha-predominant prakriti. Tongue coated, slow pulse at rest, dermatographism positive.",
      intervention: "7-day snehana-swedana preparation, then single-session vamana with madanaphala protocol; 4-day samsarjana diet; kapha-pacifying ahara for 6 weeks.",
      outcome: "Wheal frequency down from daily to twice weekly at 4 weeks; antihistamines discontinued by week 6 under supervision.",
    },
    blocks: [
      { t: "p", text: "This is one of those cases that tests whether classical shodhana still earns its place beside modern dermatology. Six years of escalating antihistamines had produced tolerance, not control. The question in our desk review: is this a histamine problem, or a kapha channel problem wearing a histamine costume?" },
      { t: "h2", text: "Why vamana, and why now" },
      { t: "p", text: "The pattern — dawn flares, dairy sensitivity, coated tongue, slow morning physiology — is textbook kapha accumulation in the upper channels. Charaka places vamana precisely here: not for the rash, but for the terrain producing it." },
      { t: "h3", text: "Preparation is 80% of the procedure" },
      { t: "p", text: "Seven days of internal oleation and fomentation precede a single emetic session. Patients imagine vamana is the event; the event is the week of preparation that makes the session safe and productive." },
      { t: "callout", tone: "pitta", title: "Clinical honesty", text: "One case is a signal, not evidence. We publish it as a desk record with full markers so others can replicate or refute it — that is how the literature is supposed to grow." },
    ],
  },
  {
    id: "a-triphala-research", slug: "triphala-evidence-review", title: "Triphala in functional constipation — a structured evidence review",
    subtitle: "Research review: 11 trials, 842 participants, graded confidence",
    summary: "A desk-led structured review of randomised trials of triphala in functional constipation, with effect sizes, risk-of-bias notes, and honest confidence grading.",
    cover: IMG.coverTriphala, categoryId: "chikitsa", doshas: ["vata"], authorId: "shruti",
    date: "2026-02-11", views: 7440, symptoms: ["constipation", "digestion", "gut"],
    kind: "research", status: "published",
    researchMeta: {
      objective: "To summarise the randomised evidence for triphala in functional constipation and grade its reliability for clinical use.",
      method: "Structured search of PubMed and AYUSH databases 2005–2025; 11 RCTs met inclusion (n = 842); risk of bias assessed per Cochrane domains.",
      findings: "8 of 11 trials reported significant improvement in stool frequency and consistency versus placebo or senna; effect sizes moderate; follow-up rarely beyond 8 weeks.",
      conclusion: "Triphala shows consistent short-term benefit with low reported adverse events. Long-term comparative data remain the missing piece.",
      citations: "11 RCTs · 842 participants · 2005–2025 · PubMed + AYUSH portals",
    },
    blocks: [
      { t: "p", text: "Evidence reviews in Ayurveda tend to fall into two camps: the believers and the dismissers. This desk review aims for the third position — the accountant. We counted what the trials actually measured, how well, and what a clinician can honestly take to the consultation room." },
      { t: "h2", text: "What the trials measured" },
      { t: "table", head: ["Outcome", "Trials reporting benefit", "Typical effect"], rows: [
        ["Stool frequency", "8 of 11", "+1.5 to +2.5 bowel actions / week"],
        ["Stool consistency (Bristol)", "6 of 9", "Shift of 1–2 grades toward normal"],
        ["Straining / incomplete evacuation", "5 of 8", "Moderate symptom score reduction"] ] },
      { t: "h2", text: "Where the evidence is honest — and where it isn't" },
      { t: "list", items: [
        "Blinding is genuinely hard with herbal powders; several trials under-report allocation concealment.",
        "Almost no trial follows patients beyond 8 weeks — durability is assumed, not measured.",
        "Adverse-event reporting is reassuringly boring: mild GI looseness, nothing serious.",
        "Comparator arms are often senna — useful, but it flatters the gentler intervention." ] },
      { t: "callout", tone: "gold", title: "Bottom line for the clinic", text: "For functional constipation, triphala is a defensible first-line with a gentle safety profile. Present it as such — not as a miracle, not as folklore." },
    ],
  },
  {
    id: "a-kadha-immunity", slug: "kadha-respiratory-season", title: "The kadha formula, deconstructed — what each spice is doing",
    subtitle: "A spice-by-spice reading of the household respiratory decoction",
    summary: "Every household kadha is a small pharmacy. This essay pulls the formula apart, assigns each ingredient its classical and modern role, and flags who should dilute.",
    cover: IMG.coverKadha, categoryId: "ahara", doshas: ["kapha", "vata"], authorId: "monesh",
    date: "2026-01-05", views: 21870, symptoms: ["immunity", "cough", "cold", "throat"],
    kind: "blog", status: "published",
    blocks: [
      { t: "p", text: "During every respiratory season the same pot appears on every stove: tulsi, ginger, black pepper, a stick of cinnamon. It is dismissed as grandmothers' medicine or celebrated as magic. It is neither. It is a coherent formula — each ingredient earning its place." },
      { t: "h2", text: "The formula, ingredient by ingredient" },
      { t: "table", head: ["Ingredient", "Classical role", "Modern read"], rows: [
        ["Tulsi", "Kapha-vata pacifier, shwasahara (breath-easing)", "Eugenol — mild bronchodilatory and anti-inflammatory"],
        ["Sunthi (dry ginger)", "Deepana — kindles agni", "Gingerols reduce nausea and throat irritation"],
        ["Maricha (black pepper)", "Yogavahi — the carrier", "Piperine raises bioavailability of the others"],
        ["Dalchini (cinnamon)", "Ushna, balances the formula's heat", "Cinnamaldehyde — gentle antimicrobial"],
        ["Mulethi (licorice)", "Soothing, sweetens without sugar", "Demulcent coating for irritated mucosa"] ] },
      { t: "h2", text: "Who should dilute it" },
      { t: "p", text: "Pitta constitutions and anyone with active reflux should halve the pepper and ginger, and skip the evening dose. A formula that heats a vata winter chest beautifully can scorch a pitta throat." },
      { t: "callout", tone: "gold", title: "The dosing rule", text: "Half a cup, morning and evening, during seasonal change. It is a preventive rhythm, not an emergency medicine — start it before the season, not during the fever." },
    ],
  },
];

/* ------------------------------ symptom index ------------------------------- */

export interface SymptomHit {
  term: string; context: string;
  target: { kind: "article" | "herb"; id: string };
}

export function buildSymptomIndex(articles: Article[], herbHits: { id: string; term: string; label: string }[]): SymptomHit[] {
  const out: SymptomHit[] = [];
  for (const a of articles) {
    for (const s of a.symptoms) {
      out.push({ term: s, context: a.title, target: { kind: "article", id: a.id } });
    }
  }
  for (const h of herbHits) {
    out.push({ term: h.term, context: `Herb — ${h.label}`, target: { kind: "herb", id: h.id } });
  }
  return out;
}

/* ---------------------------------- herbs ---------------------------------- */

export interface Herb {
  id: string; sanskrit: string; common: string; botanical: string; part: string;
  rasa: string[]; virya: "Hot" | "Cold"; vipaka: string; doshas: Dosha[];
  benefits: string[]; classical: string; caution: string; treats: string[];
  image: string; duotone?: string; accent: string;
}

export const HERBS: Herb[] = [
  {
    id: "ashwagandha", sanskrit: "अश्वगन्धा", common: "Ashwagandha", botanical: "Withania somnifera", part: "Root",
    rasa: ["Tikta", "Kashaya"], virya: "Hot", vipaka: "Madhura", doshas: ["vata", "kapha"],
    benefits: [
      "Adaptogenic — steadies the stress axis and cortisol rhythm.",
      "Improves sleep architecture over 4–8 weeks of use.",
      "Supports strength and recovery in trained adults.",
    ],
    classical: "Strength-giving, vitalising, rejuvenating — the classical rasayana of the tired nervous system.",
    caution: "Pause in hyperthyroid disease, autoimmune flares and pregnancy. May amplify sedatives.",
    treats: ["stress", "anxiety", "sleep", "fatigue"], image: IMG.coverBrahmi, duotone: "sepia(0.2) hue-rotate(-12deg)", accent: "#d6b45f",
  },
  {
    id: "brahmi", sanskrit: "ब्राह्मी", common: "Brahmi", botanical: "Bacopa monnieri", part: "Whole plant",
    rasa: ["Tikta", "Madhura"], virya: "Cold", vipaka: "Madhura", doshas: ["pitta", "vata"],
    benefits: [
      "Medhya — supports memory consolidation and dendritic growth.",
      "Calms pitta-driven mental heat and exam-season burnout.",
      "Best absorbed with fat — hence the ghrita preparations.",
    ],
    classical: "The intellect-giver and life-extender — the foremost medhya rasayana.",
    caution: "May cause mild GI upset on an empty stomach; take with food.",
    treats: ["memory", "focus", "stress"], image: IMG.coverBrahmi, accent: "#82b39e",
  },
  {
    id: "triphala", sanskrit: "त्रिफला", common: "Triphala", botanical: "Emblica + Terminalia duo", part: "Three fruits",
    rasa: ["Madhura", "Tikta", "Kashaya"], virya: "Hot", vipaka: "Madhura", doshas: ["vata", "pitta", "kapha"],
    benefits: [
      "Gentle bowel regulator — trains the morning reflex rather than forcing it.",
      "Amla feeds the gut lining; haritaki provides the downward movement.",
      "Tridoshic — one of the few formulas suitable for most constitutions.",
    ],
    classical: "As there is no mountain without the Himalaya, there is no remedy without triphala.",
    caution: "Avoid in pregnancy and active diarrhoea; check with a doctor if on anticoagulants.",
    treats: ["constipation", "digestion", "detox", "acidity"], image: IMG.coverTriphala, accent: "#e07f49",
  },
  {
    id: "tulsi", sanskrit: "तुलसी", common: "Tulsi", botanical: "Ocimum tenuiflorum", part: "Leaf",
    rasa: ["Katu", "Tikta"], virya: "Hot", vipaka: "Katu", doshas: ["kapha", "vata"],
    benefits: [
      "Shwasahara — eases breathing and calms the cough reflex.",
      "The backbone of every household respiratory kadha.",
      "Mild adaptogen; steadies mood under seasonal stress.",
    ],
    classical: "The incomparable one — every home that keeps tulsi keeps a pharmacy.",
    caution: "May lower blood sugar — diabetics on medication should monitor.",
    treats: ["immunity", "cough", "cold", "stress"], image: IMG.coverKadha, accent: "#82b39e",
  },
  {
    id: "amla", sanskrit: "आमलकी", common: "Amla", botanical: "Emblica officinalis", part: "Fruit",
    rasa: ["Amla", "Madhura", "Kashaya"], virya: "Cold", vipaka: "Madhura", doshas: ["pitta"],
    benefits: [
      "Richest natural vitamin-C complex; antioxidant-dense.",
      "Cools pitta — reflux, skin heat, irritability.",
      "Feeds the gut lining and supports iron absorption.",
    ],
    classical: "The nurse among fruits — it feeds every tissue without disturbing agni.",
    caution: "Can amplify iron absorption; separate from iron tablets by two hours.",
    treats: ["acidity", "immunity", "skin", "digestion"], image: IMG.coverGoldenMilk, duotone: "hue-rotate(15deg)", accent: "#d6b45f",
  },
  {
    id: "shatavari", sanskrit: "शतावरी", common: "Shatavari", botanical: "Asparagus racemosus", part: "Root",
    rasa: ["Madhura", "Tikta"], virya: "Cold", vipaka: "Madhura", doshas: ["pitta", "vata"],
    benefits: [
      "The classical women's tonic — cycle support and post-partum recovery.",
      "Cooling and moistening; soothes pitta acidity.",
      "Milk-processed (kshira samskara) for deeper nourishment.",
    ],
    classical: "She who possesses a hundred husbands — the great feminine rejuvenator.",
    caution: "Use under guidance with hormone-sensitive conditions.",
    treats: ["women's health", "acidity", "energy"], image: IMG.coverDinacharya, duotone: "hue-rotate(-25deg) saturate(0.7)", accent: "#93b1cf",
  },
  {
    id: "guggulu", sanskrit: "गुग्गुलु", common: "Guggulu", botanical: "Commiphora wightii", part: "Resin",
    rasa: ["Tikta", "Kashaya", "Katu"], virya: "Hot", vipaka: "Katu", doshas: ["vata", "kapha"],
    benefits: [
      "Scrapes accumulated ama from the channels — the classical detox resin.",
      "Joint and mobility support in kapha-type stiffness.",
      "Traditionally paired with triphala and trikatu carriers.",
    ],
    classical: "No disease is without cure for the one who holds guggulu.",
    caution: "Avoid in pregnancy and with blood thinners; may irritate a hot stomach.",
    treats: ["joints", "cholesterol", "detox", "stiffness"], image: IMG.coverPanchakarma, duotone: "sepia(0.35)", accent: "#e07f49",
  },
  {
    id: "jatamansi", sanskrit: "जटामांसी", common: "Jatamansi", botanical: "Nardostachys jatamansi", part: "Rhizome",
    rasa: ["Tikta", "Madhura", "Kashaya"], virya: "Cold", vipaka: "Madhura", doshas: ["vata", "pitta"],
    benefits: [
      "Deep sleep support without morning grogginess.",
      "Quiets the racing vata mind at 3 a.m.",
      "Classically paired with brahmi for the anxious scholar.",
    ],
    classical: "The mind-steadying root — used on temple floors to calm before prayer.",
    caution: "May enhance sedatives; avoid driving after large doses.",
    treats: ["sleep", "anxiety", "stress"], image: IMG.coverDinacharya, duotone: "sepia(0.15) hue-rotate(20deg)", accent: "#93b1cf",
  },
];

/* --------------------------------- products -------------------------------- */

export interface ProductReview { id: string; name: string; rating: number; text: string; date: string; verified: boolean; approved?: boolean }

export interface Product {
  id: string; name: string; sanskrit: string; price: number; mrp: number;
  image: string; duotone?: string; badge?: string;
  category: "Oils" | "Churnas" | "Capsules" | "Ghritas" | "Kadhas";
  stock: number; rating: number; dosage: string; ingredients: string[]; desc: string;
  /* PDP content — all editable from Studio → Store */
  highlights: string[]; detail: string[]; classicalSource: string;
  ingredientDetails: { name: string; note: string }[];
  steps: string[]; safety: string[]; reviews: ProductReview[];
  visible?: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: "mahanarayana-oil", name: "Mahanarayana Abhyanga Oil", sanskrit: "महानारायण तैल", price: 899, mrp: 1099,
    image: IMG.productOil, badge: "Classical · Sahasrayoga", category: "Oils", stock: 24, rating: 4.8,
    dosage: "Warm 10 ml; massage 15 min before bath, 4–5 days a week. Evening use for vata insomnia.",
    ingredients: ["Sesame taila base", "60+ classical herbs", "Shatavari", "Ashwagandha", "Bala", "Dashamoola"],
    desc: "The great vata-pacifying oil of the Sahasrayoga — slow-infused for 21 days over wood fire. For joints, deep tissue abhyanga and the tired nervous system.",
    highlights: [
      "Slow-infused for 21 days over wood fire, per Sahasrayoga",
      "60+ classical herbs in authentic proportion",
      "Deep-tissue abhyanga for joints and vata stiffness",
      "Evening application supports vata-type sleep",
    ],
    detail: [
      "Mahanarayana taila is one of the most complete vata formulations in the classical repertoire — recorded in the Sahasrayoga with over sixty ingredients working in concert rather than competition.",
      "Our batch follows the traditional method: the herbs are first calcined and decocted, then simmered into sesame oil at low heat for three weeks. This patience is not romance; it is what extracts the lipid-soluble fractions that a quick infusion leaves behind.",
    ],
    classicalSource: "Sahasrayoga — Sataushadhi Kalpa",
    ingredientDetails: [
      { name: "Sesame taila", note: "The classical vata carrier — penetrates deep tissue layers." },
      { name: "Ashwagandha", note: "Strengthens and steadies fatigued muscle." },
      { name: "Shatavari", note: "Cools and nourishes inflamed joints." },
      { name: "Bala", note: "The 'strength-giver' — supports recovery." },
      { name: "Dashamoola", note: "Ten roots for vata pain and stiffness." },
    ],
    steps: [
      "Warm 10 ml in a bowl of hot water — never microwave.",
      "Massage along muscle fibres for 15 minutes.",
      "Rest 10 minutes, then bathe with warm water.",
      "Repeat 4–5 days a week; evening sessions aid sleep.",
    ],
    safety: ["For external use only", "Patch-test on the inner arm first", "Avoid on broken skin or active rashes", "Keep out of reach of children"],
    reviews: [
      { id: "r1", name: "Kavita R.", rating: 5, text: "My mother's knee stiffness has visibly eased after a month of evening abhyanga. The oil smells like a temple, in the best way.", date: "2026-02-14", verified: true },
      { id: "r2", name: "Anand P.", rating: 5, text: "Heavy, warm, slow-absorbing — exactly what a real taila should be. Sleep improved within two weeks.", date: "2026-01-30", verified: true },
      { id: "r3", name: "Meera S.", rating: 4, text: "Excellent oil, slightly slow to absorb. Use it before the evening bath and it's perfect.", date: "2026-01-12", verified: false },
    ],
  },
  {
    id: "triphala-churna", name: "Triphala Churna, Stone-milled", sanskrit: "त्रिफला चूर्ण", price: 449, mrp: 549,
    image: IMG.coverTriphala, badge: "Bestseller", category: "Churnas", stock: 61, rating: 4.9,
    dosage: "3–6 g at bedtime with warm water; or 1/2 tsp with honey before meals for agni.",
    ingredients: ["Amla (Emblica officinalis)", "Bibhitaki", "Haritaki", "Equal-part classical ratio"],
    desc: "Three fruits in the exact Charaka ratio, stone-milled at low speed to preserve volatile fractions. Gentle, non-habit-forming bowel regulation.",
    highlights: [
      "Exact Charaka equal-part ratio of the three fruits",
      "Stone-milled slowly to preserve volatile fractions",
      "Trains the morning reflex — non-habit-forming",
      "Tridoshic: suitable for nearly every constitution",
    ],
    detail: [
      "Triphala is the most prescribed formula in Ayurveda and the most rushed to manufacture. Heat-fast commercial milling destroys the aromatic fractions of haritaki and bibhitaki — which is why most supermarket triphala tastes flat and works weakly.",
      "Ours is milled on stone at low speed, in small batches, and packed within days. Taste it against any mass-market brand: the difference is the medicine.",
    ],
    classicalSource: "Charaka Samhita — Rasayana Adhyaya",
    ingredientDetails: [
      { name: "Amla", note: "Feeds the gut lining; the pitta pacifier of the trio." },
      { name: "Bibhitaki", note: "Scrapes accumulated mucus from the channels." },
      { name: "Haritaki", note: "The downward-mover — restores peristaltic rhythm." },
    ],
    steps: [
      "Take 3–6 g with warm water at bedtime.",
      "For agni support: half a teaspoon with honey before meals.",
      "Expect the bowel to regularise within 2–3 weeks.",
      "Once regular, taper to alternate days — the goal is independence.",
    ],
    safety: ["Avoid in pregnancy", "Skip during active diarrhoea", "Consult a physician if on anticoagulants", "Keep out of reach of children"],
    reviews: [
      { id: "r1", name: "Rohit D.", rating: 5, text: "The taste alone tells you this is the real thing. Regular within three weeks, and I'm already tapering as the label suggests.", date: "2026-02-18", verified: true },
      { id: "r2", name: "Sneha K.", rating: 5, text: "Bought after reading the journal essay on agni. Works exactly as described — gentle, not a laxative.", date: "2026-02-02", verified: true },
    ],
  },
  {
    id: "ashwagandha-caps", name: "Ashwagandha Root Capsules", sanskrit: "अश्वगन्धा वटिका", price: 699, mrp: 799,
    image: IMG.coverTriphala, duotone: "sepia(0.28) hue-rotate(-18deg) saturate(0.9)", badge: "2.5% withanolides", category: "Capsules", stock: 42, rating: 4.7,
    dosage: "1 capsule (500 mg extract) twice daily after meals with warm milk or water.",
    ingredients: ["Withania somnifera root extract", "Standardised to 2.5% withanolides", "Vegetable capsule"],
    desc: "Root-only extract — no leaf filler — standardised for the cortisol and sleep endpoints studied in trials. 60-day supply.",
    highlights: [
      "Root-only extract — zero leaf filler",
      "Standardised to 2.5% withanolides",
      "Matches the dose used in sleep and stress trials",
      "60-day supply, vegetarian capsule",
    ],
    detail: [
      "The clinical literature on ashwagandha is built on root extracts standardised to 2.5–5% withanolides. Leaf material — cheap and common in blends — carries a different chemistry and none of the trial data.",
      "We publish our withanolide assay with every batch, because an adaptogen you cannot measure is a promise you cannot keep.",
    ],
    classicalSource: "Bhavaprakasha Nighantu",
    ingredientDetails: [
      { name: "Withania root extract", note: "500 mg per capsule, 2.5% withanolides." },
      { name: "Vegetable capsule", note: "Hypromellose shell — no gelatine, no additives." },
    ],
    steps: [
      "One capsule after lunch, one after dinner.",
      "Take with warm milk for classical absorption.",
      "Allow 4 weeks before judging effect.",
      "Full course: 8–12 weeks, then review with your vaidya.",
    ],
    safety: ["Avoid in hyperthyroid disease", "Not for pregnancy or autoimmune flares", "May enhance sedatives — check with your doctor", "Keep out of reach of children"],
    reviews: [
      { id: "r1", name: "Dr. Prakash N.", rating: 5, text: "I prescribe these because the assay is published with the batch. That transparency is rare.", date: "2026-02-20", verified: true },
      { id: "r2", name: "Ishaan M.", rating: 4, text: "Sleep deepened noticeably by week three. No morning grogginess, which my previous brand had.", date: "2026-01-25", verified: true },
    ],
  },
  {
    id: "brahmi-ghrita", name: "Brahmi Ghrita", sanskrit: "ब्राह्मी घृत", price: 1099, mrp: 1299,
    image: IMG.coverTriphala, duotone: "hue-rotate(40deg) saturate(0.75) brightness(1.08)", badge: "A2 Gir cow ghee", category: "Ghritas", stock: 15, rating: 4.6,
    dosage: "1 tsp (5 g) in warm milk at night, or as directed for nasya by a vaidya.",
    ingredients: ["A2 Gir cow ghee", "Fresh Bacopa monnieri juice", "Vacha", "Shankhapushpi", "Kushtha kalka"],
    desc: "Classical medhya ghrita — fresh brahmi juice simmered into A2 ghee the traditional 100:12.5:12.5 ratio. The memory formulation of the paediatric texts.",
    highlights: [
      "Fresh brahmi juice, never dried powder",
      "A2 Gir cow ghee, small-churned",
      "Classical 100 : 12.5 : 12.5 snehana ratio",
      "The medhya ghrita of the children's texts",
    ],
    detail: [
      "Bacosides are fat-soluble — which is exactly why the texts insist on ghrita rather than churnas for the mind. The ghee is not a carrier; it is half the medicine.",
      "Each batch simmers fresh brahmi juice with A2 ghee over low flame until all moisture evaporates — the classical snehana-kriya — then is strained and rested before bottling.",
    ],
    classicalSource: "Kashyapa Samhita — Medhya formulations",
    ingredientDetails: [
      { name: "A2 Gir ghee", note: "Lipid carrier that raises bacoside absorption." },
      { name: "Fresh brahmi juice", note: "Pressed same-day; never dried or powdered." },
      { name: "Shankhapushpi", note: "The companion calm — steadies recall under pressure." },
      { name: "Vacha", note: "Classical speech and clarity support, micro-dosed." },
    ],
    steps: [
      "One teaspoon in warm milk at night.",
      "Take on an empty stomach for deepest effect.",
      "Children's dosing is age-weighted — ask your vaidya.",
      "Store refrigerated after opening; use within 3 months.",
    ],
    safety: ["Take with food if stomach is sensitive", "Not a substitute for sleep hygiene", "Consult a physician for children under 5", "Keep out of reach of children"],
    reviews: [
      { id: "r1", name: "Varada T.", rating: 5, text: "My son takes it during exam season. Calmer, and he actually remembers what he studies. The ghee tastes fresh, not stale like shop brands.", date: "2026-02-08", verified: true },
      { id: "r2", name: "Nikhil B.", rating: 4, text: "Rich and effective. Wish it came in a bigger jar — a teaspoon a night goes fast.", date: "2026-01-18", verified: false },
    ],
  },
  {
    id: "kadha-concentrate", name: "Immunity Kadha Concentrate", sanskrit: "काढ़ा", price: 549, mrp: 649,
    image: IMG.coverKadha, badge: "30 servings", category: "Kadhas", stock: 50, rating: 4.8,
    dosage: "10 ml in 100 ml hot water, morning and evening during seasonal change.",
    ingredients: ["Tulsi", "Sunthi (dry ginger)", "Maricha", "Pippali", "Dalchini", "Mulethi"],
    desc: "The household defence decoction, reduced to a sugar-free concentrate. Warming kapha-vata pacification for throat, chest and seasonal transitions.",
    highlights: [
      "The full six-ingredient classical kadha formula",
      "Sugar-free concentrate — 30 servings",
      "Start before the season, not during the fever",
      "Warming kapha-vata pacification",
    ],
    detail: [
      "Every ingredient in this formula earns its place — tulsi for the breath, ginger for the fire, pepper as the bioavailability carrier, cinnamon as the balancer, licorice to soothe. Our journal essay 'The kadha formula, deconstructed' documents each role.",
      "The concentrate is reduced slowly to preserve the volatile oils that boiling a fresh kadha often drives off.",
    ],
    classicalSource: "Household shrama-kalpa tradition",
    ingredientDetails: [
      { name: "Tulsi", note: "Eases breath and calms the cough reflex." },
      { name: "Sunthi", note: "Kindles agni; reduces throat irritation." },
      { name: "Maricha + pippali", note: "The carrier pair — raises absorption of the rest." },
      { name: "Dalchini", note: "Balances the formula's heat." },
      { name: "Mulethi", note: "Coats and soothes irritated mucosa." },
    ],
    steps: [
      "10 ml in 100 ml hot water, morning and evening.",
      "Begin at the start of seasonal change.",
      "Pitta types: halve the dose, skip evenings.",
      "One bottle = 30 servings.",
    ],
    safety: ["Pitta constitutions should halve the dose", "Not for children under 6 without guidance", "Avoid with active fever above 101°F", "Keep out of reach of children"],
    reviews: [
      { id: "r1", name: "Aarti V.", rating: 5, text: "Our whole family takes it from October to February. Two winters without the usual round of colds.", date: "2026-02-16", verified: true },
      { id: "r2", name: "Sameer J.", rating: 5, text: "Tastes like my grandmother's kadha, without the hour of boiling. The essay on the site explains each spice — read it.", date: "2026-01-28", verified: true },
    ],
  },
  {
    id: "shatavari-kalpa", name: "Shatavari Kalpa Powder", sanskrit: "शतावरी कल्प", price: 649, mrp: 749,
    image: IMG.coverTriphala, duotone: "hue-rotate(-30deg) saturate(0.7) brightness(1.1)", badge: "Wild-harvest certified", category: "Churnas", stock: 33, rating: 4.7,
    dosage: "3–6 g with warm milk, twice daily. For pitta acidity: before meals; for nourishment: after.",
    ingredients: ["Asparagus racemosus root", "Milk-processed (kshira samskara)", "Mishri (rock sugar)"],
    desc: "Milk-processed shatavari root in the classical kalpa form — cooling, unctuous, and the pitta-type's best friend through heat, acidity and dryness.",
    highlights: [
      "Wild-harvest certified roots",
      "Kshira samskara — milk-processed per classical method",
      "Cooling and moistening for pitta constitutions",
      "The classical women's tonic, in kalpa form",
    ],
    detail: [
      "Raw shatavari root is drying and heating — the opposite of what it promises. The milk-processing (kshira samskara) is what converts it into the cooling, unctuous tonic the texts describe.",
      "Ours is processed in three rounds of milk simmering, then gently dried and milled with a small measure of mishri as the classical anupana.",
    ],
    classicalSource: "Charaka Samhita — Vajikarana & Stri Roga references",
    ingredientDetails: [
      { name: "Shatavari root", note: "Wild-harvest, 3–5 year mature plants." },
      { name: "Milk processing", note: "Three simmerings — the classical conversion step." },
      { name: "Mishri", note: "Rock sugar carrier; cooling in its own right." },
    ],
    steps: [
      "3–6 g with warm milk, twice daily.",
      "For acidity: before meals. For nourishment: after.",
      "Cycle support: begin on day 1 of the cycle.",
      "Store airtight; use within 4 months.",
    ],
    safety: ["Hormone-sensitive conditions: use under guidance", "Mildly diuretic — hydrate well", "Not a substitute for gynaecological care", "Keep out of reach of children"],
    reviews: [
      { id: "r1", name: "Dr. Shivani K.", rating: 5, text: "I recommend this kalpa over raw powder — the samskara makes the difference patients can feel.", date: "2026-02-12", verified: true },
      { id: "r2", name: "Pooja L.", rating: 4, text: "My reflux has genuinely calmed. Mixes well with warm milk, slightly sweet.", date: "2026-01-22", verified: true },
    ],
  },
];

export const FREE_SHIP_AT = 999;

/* --------------------------------- orders ---------------------------------- */

export type OrderStatus = "new" | "processing" | "shipped" | "outfordelivery" | "delivered" | "cancelled";
export interface OrderItem { name: string; qty: number; price: number; productId?: string; image?: string }
export interface OrderCustomer { name: string; phone: string; address: string; city: string; pin: string }
export interface Order {
  id: string; customer: OrderCustomer; items: OrderItem[]; total: number;
  status: OrderStatus; placedAt: string; customerId?: string; paymentMethod?: string;
  /** Rupees taken off by a discount code (already subtracted from total). */
  discount?: number;
  discountCode?: string;
}

export const ORDER_FLOW: OrderStatus[] = ["new", "processing", "shipped", "outfordelivery", "delivered"];
export const ORDER_META: Record<OrderStatus, { label: string; color: string }> = {
  new: { label: "New order", color: "#e8cf8b" },
  processing: { label: "Processing", color: "#93b1cf" },
  shipped: { label: "Shipped", color: "#d6b45f" },
  outfordelivery: { label: "Out for delivery", color: "#e07f49" },
  delivered: { label: "Delivered", color: "#82b39e" },
  cancelled: { label: "Cancelled", color: "#c96430" },
};

export const SEED_ORDERS: Order[] = [
  {
    id: "VG-1041",
    customer: { name: "Rohit Deshpande", phone: "+91 98220 11041", address: "22, Aundh Road", city: "Pune", pin: "411007" },
    items: [{ name: "Triphala Churna, Stone-milled", qty: 2, price: 449, productId: "triphala-churna", image: IMG.coverTriphala }],
    total: 898, status: "new", placedAt: new Date(Date.now() - 5 * 3600e3).toISOString(), customerId: "c-seed-1", paymentMethod: "UPI",
  },
  {
    id: "VG-1037",
    customer: { name: "Aarti Verma", phone: "+91 99870 22037", address: "B-402, Green Acres", city: "Mumbai", pin: "400053" },
    items: [
      { name: "Immunity Kadha Concentrate", qty: 1, price: 549, productId: "kadha-concentrate", image: IMG.coverKadha },
      { name: "Ashwagandha Root Capsules", qty: 1, price: 699, productId: "ashwagandha-caps", image: IMG.coverTriphala },
    ],
    total: 1248, status: "processing", placedAt: new Date(Date.now() - 26 * 3600e3).toISOString(), customerId: "c-seed-2", paymentMethod: "Card",
  },
  {
    id: "VG-1029",
    customer: { name: "Nikhil Bansal", phone: "+91 90040 33029", address: "14, Civil Lines", city: "Nagpur", pin: "440001" },
    items: [{ name: "Brahmi Ghrita", qty: 1, price: 1099, productId: "brahmi-ghrita", image: IMG.coverTriphala }],
    total: 1099, status: "shipped", placedAt: new Date(Date.now() - 2 * 86400e3).toISOString(), customerId: "c-seed-3", paymentMethod: "UPI",
  },
  {
    id: "VG-1023",
    customer: { name: "Pooja Lakhani", phone: "+91 98600 44023", address: "7, MG Road", city: "Pune", pin: "411001" },
    items: [{ name: "Shatavari Kalpa Powder", qty: 1, price: 649, productId: "shatavari-kalpa", image: IMG.coverTriphala }],
    total: 649, status: "outfordelivery", placedAt: new Date(Date.now() - 4 * 86400e3).toISOString(), customerId: "c-seed-4", paymentMethod: "COD",
  },
  {
    id: "VG-1016",
    customer: { name: "Sameer Joshi", phone: "+91 98900 55016", address: "C-901, Riverside", city: "Nashik", pin: "422011" },
    items: [{ name: "Mahanarayana Abhyanga Oil", qty: 1, price: 899, productId: "mahanarayana-oil", image: IMG.productOil }],
    total: 899, status: "delivered", placedAt: new Date(Date.now() - 9 * 86400e3).toISOString(), customerId: "c-seed-5", paymentMethod: "UPI",
  },
];

/* ---------------------------------- quiz ----------------------------------- */

export interface QuizOption { text: string; dosha: Dosha }
export interface QuizQuestion { area: string; q: string; options: QuizOption[] }

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { area: "Frame", q: "How would you describe your natural body frame?", options: [
    { text: "Lean, slender — I find it hard to gain weight", dosha: "vata" },
    { text: "Medium, athletic — muscle comes fairly easily", dosha: "pitta" },
    { text: "Broad, solid — I gain weight easily and lose it slowly", dosha: "kapha" } ] },
  { area: "Skin", q: "Your skin typically feels…", options: [
    { text: "Dry, thin, cool — it cracks in winter", dosha: "vata" },
    { text: "Warm, oily in patches — flushes and freckles easily", dosha: "pitta" },
    { text: "Smooth, thick, naturally moisturised", dosha: "kapha" } ] },
  { area: "Sleep", q: "Which sleep pattern is most you?", options: [
    { text: "Light and interrupted — my mind races at 3 a.m.", dosha: "vata" },
    { text: "Short but deep — I can function on less than most", dosha: "pitta" },
    { text: "Long and heavy — waking up is the hardest part of the day", dosha: "kapha" } ] },
  { area: "Appetite", q: "Your appetite and digestion…", options: [
    { text: "Irregular — I forget meals, then bloat afterward", dosha: "vata" },
    { text: "Sharp — I get 'hangry' and need to eat on time", dosha: "pitta" },
    { text: "Steady but slow — I could comfortably skip a meal", dosha: "kapha" } ] },
  { area: "Temperature", q: "In extreme weather you prefer…", options: [
    { text: "Warmth, always — cold hands, cold feet", dosha: "vata" },
    { text: "Coolness — I overheat and sweat quickly", dosha: "pitta" },
    { text: "Warm, dry days — damp cold settles in my chest", dosha: "kapha" } ] },
  { area: "Mind", q: "Under pressure, your mind tends to…", options: [
    { text: "Scatter — anxiety, overthinking, spiralling lists", dosha: "vata" },
    { text: "Sharpen into irritation — critical, impatient, driven", dosha: "pitta" },
    { text: "Withdraw — inertia, resistance, comfort-seeking", dosha: "kapha" } ] },
  { area: "Speech", q: "Friends would describe your speech as…", options: [
    { text: "Fast — I talk in tangents and finish others' sentences", dosha: "vata" },
    { text: "Precise — persuasive, sometimes blunt", dosha: "pitta" },
    { text: "Measured — slow, melodic, I choose words carefully", dosha: "kapha" } ] },
  { area: "Memory", q: "Your memory works like…", options: [
    { text: "Quick to learn, quick to forget", dosha: "vata" },
    { text: "Sharp and focused — I rarely forget a slight or a fact", dosha: "pitta" },
    { text: "Slow to learn, near-permanent retention", dosha: "kapha" } ] },
  { area: "Energy", q: "Your energy through the day…", options: [
    { text: "Comes in bursts — I sprint, then crash", dosha: "vata" },
    { text: "Consistent and competitive — I pace to win", dosha: "pitta" },
    { text: "A slow-burning reserve — steady all day, strong endurance", dosha: "kapha" } ] },
  { area: "Joints", q: "Your joints and muscles…", options: [
    { text: "Crack and creak — stiffness after sitting", dosha: "vata" },
    { text: "Tolerant of strain — but I inflame and overheat", dosha: "pitta" },
    { text: "Well-padded, stable — heavy rather than stiff", dosha: "kapha" } ] },
  { area: "Stool", q: "Elimination is usually…", options: [
    { text: "Irregular — dry, and constipation creeps in when stressed", dosha: "vata" },
    { text: "Regular — but loose or urgent when I'm stressed or overheated", dosha: "pitta" },
    { text: "Slow, smooth, unhurried — sometimes sluggish for days", dosha: "kapha" } ] },
  { area: "Wealth habits", q: "With money and plans you are…", options: [
    { text: "Impulsive — I earn in flashes and spend in gusts", dosha: "vata" },
    { text: "Strategic — I invest with a spreadsheet and opinions", dosha: "pitta" },
    { text: "A saver — steady accumulation, reluctant to part with it", dosha: "kapha" } ] },
];

export interface DoshaResult {
  dosha: Dosha; headline: string; body: string;
  diet: string[]; lifestyle: string[]; herbs: string[];
}

export const DOSHA_RESULTS: Record<Dosha, DoshaResult> = {
  vata: {
    dosha: "vata", headline: "Vata leads your constitution",
    body: "Air and ether govern your movement — quick mind, quick body, quick to exhaust. Your gift is creativity and speed; your tax is dryness, anxiety and irregularity. Everything that is warm, oily, rhythmic and grounded is medicine for you.",
    diet: ["Favour warm, moist, well-cooked meals; minimise raw and cold", "Ghee and sesame oil are your daily medicine — inside and outside", "Sweet-sour-salty balance; bitter and astringent in moderation", "Regular meal times matter more than the menu itself"],
    lifestyle: ["Fixed wake and sleep times — vata heals inside routine", "Daily abhyanga with warm sesame oil, even 5 minutes", "Slow exercise: walking, yin yoga, tai chi over HIIT", "Digital sunset one hour before bed"],
    herbs: ["Ashwagandha", "Jatamansi", "Brahmi (with ghee)", "Dashamoola"],
  },
  pitta: {
    dosha: "pitta", headline: "Pitta leads your constitution",
    body: "Fire and water run your metabolism — sharp digestion, sharper mind, a body that overheats easily. Your gift is focus and leadership; your tax is inflammation, acidity and impatience. Coolness, sweetness and un-scheduled time are your prescription.",
    diet: ["Sweet, bitter and astringent as the base of your plate", "Cool, not iced; coconut, coriander, fennel, amla daily", "Limit fermented foods, chilli, excess coffee and alcohol", "Never skip meals — an empty pitta gut turns on itself"],
    lifestyle: ["Exercise in the cool hours; swimming is your ideal sport", "10 minutes of non-doing daily — moonlit walks, not more lists", "Protect midday heat; your skin and temper both thank you", "Sleep before 11 p.m. — the pitta hour amplifies what it touches"],
    herbs: ["Shatavari", "Brahmi", "Amla", "Mulethi (licorice)"],
  },
  kapha: {
    dosha: "kapha", headline: "Kapha leads your constitution",
    body: "Earth and water give you structure — steady strength, deep sleep, legendary patience. Your gift is endurance and calm; your tax is heaviness, congestion and inertia. Warmth, lightness, spice and motion keep your earth from settling.",
    diet: ["Light, warm, dry preparations; roasted over fried", "Pungent, bitter, astringent lead — ginger, pepper, honey", "Reduce dairy, heavy sweets and daytime napping", "Smaller dinners; your agni is weakest after sunset"],
    lifestyle: ["Early rising is your single best intervention — before 6 a.m.", "Vigorous daily exercise; you are the dosha built for intensity", "Dry brushing and stimulating massage over oil-heavy abhyanga", "Novelty on a schedule — new routes, new skills, cold exposure"],
    herbs: ["Trikatu", "Guduchi", "Tulsi", "Triphala"],
  },
};
