/* =============================================================================
   Vaidyagan — content & catalogue data layer
   Seeds live here; everything user-created is overlaid from localStorage by lib.
   ========================================================================== */

/* ---------------------------------- doshas ---------------------------------- */

export type Dosha = "vata" | "pitta" | "kapha";
export const DOSHA_META: Record<Dosha, { name: string; sa: string; elements: string; color: string }> = {
  vata: { name: "Vata", sa: "वात", elements: "Air · Ether", color: "#93b1cf" },
  pitta: { name: "Pitta", sa: "पित्त", elements: "Fire · Water", color: "#e07f49" },
  kapha: { name: "Kapha", sa: "कफ", elements: "Earth · Water", color: "#82b39e" },
};

/* --------------------------------- authors ---------------------------------- */

export interface Author {
  id: string; name: string; initials: string; qualification: string; specialty: string;
  years: number; bio: string; quote: string; hue: string;
}
export const AUTHORS: Author[] = [
  { id: "monesh", name: "Dr. Monesh L Ghuge", initials: "MG", qualification: "BAMS", specialty: "Kayachikitsa · General medicine", years: 16, bio: "Founder of the Vaidyagan desk.", quote: "The classics are not old — they are proven.", hue: "#d6b45f" },
  { id: "bhagyesh", name: "Dr. Bhagyesh Karale", initials: "BK", qualification: "BAMS, MD (Panchakarma)", specialty: "Panchakarma · Detox protocols", years: 12, bio: "Runs the Panchakarma unit.", quote: "Detox is a protocol, not a spa day.", hue: "#e07f49" },
  { id: "shruti", name: "Dr. Shruti Choudhary", initials: "SC", qualification: "BAMS, MD (Dravyaguna)", specialty: "Dravyaguna · Clinical herbology", years: 10, bio: "Leads the herb index.", quote: "Every herb has a personality — rasa, virya, vipaka.", hue: "#82b39e" },
  { id: "shivani", name: "Dr. Shivani Kadam", initials: "SK", qualification: "BAMS, MS (Stri Roga)", specialty: "Stri Roga · Women's health", years: 9, bio: "Leads women's health.", quote: "Shatavari is not a trend — it is a tradition.", hue: "#93b1cf" },
];

/** Resolve an article's visible author — classic desk first, then Studio members. */
export function authorFor(a: { authorId: string }): Author {
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
          qualification: "BAMS", specialty: m.specialty ?? "Ayurvedic medicine", years: 1,
          bio: "Verified member of the Vaidyagan publishing desk.",
          quote: "Written from the OPD, checked against the classics.", hue: m.hue,
        };
      }
    }
  } catch { /* fall through */ }
  return AUTHORS[0];
}

/* -------------------------------- categories -------------------------------- */

export interface Category { id: string; name: string; sanskrit: string; description: string }
export const CATEGORIES: Category[] = [
  { id: "dravyaguna", name: "Herbs & Dravyaguna", sanskrit: "द्रव्यगुण", description: "Herb monographs, energetics and clinical uses." },
  { id: "chikitsa", name: "Disease Protocols", sanskrit: "चिकित्सा", description: "Nidana and chikitsa for common conditions." },
  { id: "panchakarma", name: "Panchakarma & Detox", sanskrit: "पञ्चकर्म", description: "The five actions, done properly." },
  { id: "dinacharya", name: "Lifestyle & Dinacharya", sanskrit: "दिनचर्या", description: "Daily and seasonal routine." },
  { id: "ahara", name: "Dietetics & Ahara", sanskrit: "आहार", description: "Food as the first medicine." },
];

/** Label for an article's category — honours custom categories written in the Studio. */
export function categoryName(a: { categoryId: string; customCategory?: string }): string {
  if (a.customCategory && a.customCategory.trim()) return a.customCategory.trim();
  return CATEGORIES.find((c) => c.id === a.categoryId)?.name ?? "General";
}

/* --------------------------------- articles --------------------------------- */

export interface Block { type: string; [k: string]: unknown }
export interface CaseMeta { age: string; sex: string; prakriti: string; presenting: string; duration: string }
export interface ResearchMeta { question: string; design: string; n: string; finding: string; grade: string }
export type Kind = "blog" | "case" | "research";
export const KIND_META: Record<Kind, { label: string; short: string; color: string }> = {
  blog: { label: "Essay", short: "Essay", color: "#d6b45f" },
  case: { label: "Case Paper", short: "Case", color: "#e07f49" },
  research: { label: "Research Review", short: "Research", color: "#93b1cf" },
};

export interface Article {
  id: string; slug: string; title: string; subtitle: string; summary: string;
  cover: string; categoryId: string; customCategory?: string;
  doshas: Dosha[]; authorId: string; date: string; views: number; symptoms: string[];
  kind: Kind; blocks: Block[]; html: string;
  status: "draft" | "published" | "scheduled" | "review";
  pdfUrl?: string; pdfName?: string; caseMeta?: CaseMeta; researchMeta?: ResearchMeta;
}

export function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}
export function kindOf(a: Article): Kind { return a.kind ?? "blog"; }
export function readingTime(a: Article): number {
  const words = articlePlainText(a).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 210));
}

const shloka = (sa: string, tr: string, cite: string) =>
  `<blockquote class="shloka"><p class="sa">${sa}</p><p class="tr">${tr}</p><cite>${cite}</cite></blockquote>`;
const callout = (tone: "gold" | "pitta", title: string, body: string) =>
  `<div class="callout callout-${tone}"><p class="callout-title">${title}</p><p>${body}</p></div>`;

export const ARTICLES: Article[] = [
  {
    id: "seed-ashwagandha", slug: "ashwagandha-cortisol-sleep", title: "Ashwagandha: What the OPD Actually Teaches Us",
    subtitle: "An adaptogen's honest résumé — where it shines, and where it doesn't",
    summary: "Ashwagandha is not a sleeping pill. Used with classical discipline — right dose, right anupana, right patient — it steadies the vata–pitta axis that modern life frays.",
    cover: "", categoryId: "dravyaguna", doshas: ["vata"], authorId: "shruti", date: "2026-03-14", views: 12840,
    symptoms: ["stress", "sleep", "anxiety", "fatigue"], kind: "blog", blocks: [], status: "published",
    html:
      `<p>Walk into any pharmacy and ashwagandha stares back from a dozen labels. Walk into our OPD and the picture is more interesting: the patients who improve dramatically are rarely the ones who simply "took ashwagandha". They are the ones who took it <em>classically</em>.</p>` +
      shloka("अश्वगन्धा बलकरी वृष्या वाजी तथैव च।", "Ashwagandha grants strength, vitality and steadiness — Charaka counts it among the best of the balya herbs.", "Charaka Samhita, Sutra 13") +
      `<h2>The patient it actually fits</h2><p>The classic responder is <strong>vata-predominant</strong>: dry skin, racing 3 a.m. thoughts, fatigue that sleep doesn't fix, a pulse that is quick and thin. Dosage in our desk protocol runs 3–6 g of root churna with warm milk at night, or 500 mg of a root-only extract twice daily after meals.</p>` +
      `<h2>What the trials say</h2><p>Randomised trials using root extract standardised to withanolides report reductions in perceived stress scores and evening cortisol over 8 weeks, and improved sleep efficiency. The effect is modest, real, and dose-dependent — exactly what the tradition claimed, minus the miracle language.</p>` +
      callout("pitta", "Who should be cautious", "Pregnant women, anyone on thyroid medication or sedatives, and pitta-dominant patients with active inflammation should consult a vaidya first. Ashwagandha is warm and sharp — it can aggravate an already hot system.") +
      `<h2>The anupana is half the medicine</h2><p>Warm milk at night for vata insomnia; with a little ghee and rock sugar for convalescence; avoid it on an empty stomach in pitta constitutions. The carrier is not decoration — it is the classical targeting system.</p>`,
  },
  {
    id: "seed-amla-pitta", slug: "amla-pitta-acidity", title: "Amla: The Quiet Answer to a Pitta Lifestyle",
    subtitle: "Sour fruit, cooling effect — how vipaka turns the paradox into medicine",
    summary: "Amla tastes sour yet cools the body after digestion. That single fact explains why it anchors almost every pitta protocol we write — from acidity to skin.",
    cover: "", categoryId: "ahara", doshas: ["pitta"], authorId: "monesh", date: "2026-03-02", views: 9310,
    symptoms: ["acidity", "skin", "hair", "eyes"], kind: "blog", blocks: [], status: "published",
    html:
      `<p>Every student of Ayurveda eventually meets the amla paradox: a fruit that is unmistakably sour, yet classified as cooling. The resolution sits in <strong>vipaka</strong> — the post-digestive effect. Amla's vipaka is madhura, sweet, and that is the effect your pitta actually receives.</p>` +
      `<h2>Where we reach for it</h2><ul><li><strong>Amlapitta (acidity)</strong> — 3–6 g of dried amla churna before meals, or fresh fruit with rock salt.</li><li><strong>Skin & hair</strong> — the classical chyavana base; vitamin-C density matters, but so does the tannin matrix that slows oxidation.</li><li><strong>Eyes</strong> — triphala's pitta-calming partner; used internally and as a wash under guidance.</li></ul>` +
      shloka("सर्वाणां रसदोषाणां शमनं तु विशेषतः।", "Among all sour substances, amla alone pacifies rather than provokes.", "Bhavaprakasha, Amalaki varga") +
      callout("gold", "Desk tip", "One fresh amla with lunch beats a supplement for most desk-bound pitta patients. If you must supplement, choose whole-fruit powder over isolated extracts.") +
      `<h2>A note on honey</h2><p>Amla and honey are the classical pairing — but never heat the honey. The texts are firm on this, and so are we.</p>`,
  },
  {
    id: "seed-shirodhara", slug: "shirodhara-protocol", title: "Shirodhara, Done Properly: A Panchakarma Protocol",
    subtitle: "Temperature, duration, oil, and the contraindications nobody posts about",
    summary: "Shirodhara is a precise medical procedure, not a spa flourish. This is the desk protocol — dosing the stream, choosing the taila, and knowing who must never receive it.",
    cover: "", categoryId: "panchakarma", doshas: ["vata", "pitta"], authorId: "bhagyesh", date: "2026-01-28", views: 15420,
    symptoms: ["insomnia", "migraine", "anxiety", "blood pressure"], kind: "blog", blocks: [], status: "published",
    html:
      `<p>The most dangerous sentence in modern wellness is "book a shirodhara". In the classical frame, shirodhara is a <strong>procedure with indications, dosing and contraindications</strong> — and the stream of oil is calibrated the way a surgeon calibrates an instrument.</p>` +
      `<h2>The parameters that matter</h2><table><tr><th>Parameter</th><th>Desk standard</th></tr><tr><td>Oil temperature</td><td>37–40 °C at the forehead</td></tr><tr><td>Duration</td><td>30–45 minutes, 7 days for a course</td></tr><tr><td>Stream height</td><td>4–6 aṅgula above the forehead</td></tr><tr><td>Base taila</td><td>Ksheerabala for vata; Chandanabala for pitta</td></tr></table>` +
      `<h2>Who must not receive it</h2><p>Active fever, severe kapha congestion, recent head injury, uncontrolled hypertension in crisis, and full stomach within two hours. Snehana (internal oleation) should precede the course in classical sequencing — the scalp is not the starting point, the gut is.</p>` +
      callout("pitta", "Why sequencing matters", "Pouring oil on an unprepared system is decoration. Oleation from within first, then the stream — this order is what converts a pleasant hour into a measurable reduction in resting arousal.") +
      `<h2>What patients can expect</h2><p>Sleep latency shortens first, usually by day three. Headache frequency follows across the course. We track both on a simple diary card — because Panchakarma, like all good medicine, should be measurable.</p>`,
  },
  {
    id: "seed-triphala", slug: "triphala-three-fruits", title: "Triphala Is Not a Laxative. It's a Reset.",
    subtitle: "Three fruits, one ratio, and why the colon is only the beginning",
    summary: "Reducing triphala to a bowel remedy misses its classical role: a tridoshic rasayana that tones digestion itself. Here's how the ratio and timing change the outcome.",
    cover: "", categoryId: "dravyaguna", doshas: ["vata", "pitta", "kapha"], authorId: "shruti", date: "2026-02-06", views: 11080,
    symptoms: ["constipation", "digestion", "detox", "eyes"], kind: "blog", blocks: [], status: "published",
    html:
      `<p>Ask a vaidya and a wellness influencer about triphala and you'll get two different medicines. The influencer describes a gentle laxative. The vaidya describes <strong>a tridoshic formulation whose bowel effect is a side benefit</strong>, not the point.</p>` +
      `<h2>The ratio is the recipe</h2><p>Haritaki, bibhitaki and amalaki in equal parts is the classical standard, but the texts themselves vary it: haritaki-heavy for vata constipation, amalaki-heavy for pitta acidity, bibhitaki-heavy for kapha sluggishness. The fruit ratio is the dosing dial.</p>` +
      shloka("त्रिदोषशमनी तसमात् त्रिफलोच्यते।", "It pacifies the three doshas, and is therefore called Triphala.", "Ashtanga Hridaya") +
      `<h2>Timing changes the medicine</h2><ul><li><strong>Bedtime, warm water</strong> — the bowel-regulating direction.</li><li><strong>Before meals, honey</strong> — the agni-kindling direction.</li><li><strong>As an eye wash (under supervision)</strong> — the classical ophthalmic use.</li></ul>` +
      callout("gold", "Stone-milled matters", "Heat from high-speed milling degrades the volatile fractions. We specify stone-milling for our churna for the same reason the classics specified hand-pounding.") +
      `<h2>Who should pause</h2><p>Pregnancy, acute diarrhoea, and anyone on anticoagulants should check with a practitioner first. Even gentle medicines deserve respect.</p>`,
  },
  {
    id: "seed-dinacharya", slug: "dinacharya-modern-desk", title: "Dinacharya for a Desk-Bound Vata: The 40-Minute Version",
    subtitle: "Classical morning routine, compressed without being caricatured",
    summary: "You don't need two hours and a copper bathtub to run dinacharya. Forty disciplined minutes — tongue scrape, oil, warmth, light — is enough to anchor a scattered vata day.",
    cover: "", categoryId: "dinacharya", doshas: ["vata"], authorId: "monesh", date: "2025-12-12", views: 18760,
    symptoms: ["routine", "energy", "focus", "constipation"], kind: "blog", blocks: [], status: "published",
    html:
      `<p>Dinacharya has a branding problem: it is usually presented as a two-hour sunrise ritual that no working person will sustain past week one. The classical intent is simpler — <strong>anchor the vata day with rhythm, oil and warmth</strong> — and it survives compression remarkably well.</p>` +
      `<h2>The 40-minute desk-bound sequence</h2><ul><li><strong>0–5 min:</strong> Wake before the phone. Tongue scrape, warm water.</li><li><strong>5–15 min:</strong> Warm sesame oil massage — scalp and soles earn their minutes first.</li><li><strong>15–30 min:</strong> Warm bath or shower, then a cooked breakfast (never cold cereal for a vata).</li><li><strong>30–40 min:</strong> Ten minutes of daylight and ten of slow breathing before the first screen.</li></ul>` +
      shloka("स्वस्थस्य स्वास्थ्यरक्षणं, आतुरस्य विकारप्रशमनं च।", "Protect the health of the healthy; pacify the disorder of the unwell.", "Charaka Samhita, Sutra 30") +
      callout("gold", "The one rule that carries the rest", "Same wake time, seven days a week. Vata disorders are, at root, rhythm disorders — everything else in dinacharya is ornament on this pillar.") +
      `<h2>Evening counterweight</h2><p>The morning anchor needs an evening one: screens off an hour before bed, warm milk with nutmeg for the racing mind. Sleep is where the day's vata is settled — or not.</p>`,
  },
  {
    id: "seed-insomnia-case", slug: "case-nidra-vata", title: "Case Paper: Chronic Nidranasha (Insomnia) in a Vata-Prakriti Engineer",
    subtitle: "A 6-month, single-patient protocol with diary-tracked outcomes",
    summary: "A 34-year-old software engineer with 14 months of sleep-onset insomnia. Shirodhara course, Ashwagandha–Jatamansi protocol, and a hard sleep window — tracked nightly.",
    cover: "", categoryId: "chikitsa", doshas: ["vata"], authorId: "shivani", date: "2026-02-20", views: 7340,
    symptoms: ["insomnia", "anxiety", "stress"], kind: "case", status: "published", blocks: [],
    caseMeta: { age: "34", sex: "Male", prakriti: "Vata-prakriti", presenting: "Sleep-onset insomnia, 14 months", duration: "6-month protocol" },
    html:
      `<h2>Presenting complaint</h2><p>A 34-year-old software engineer presented with 14 months of sleep-onset insomnia (latency 90–150 minutes on diary), 3 a.m. awakenings, daytime fatigue and constipation. Screen time exceeded 11 hours daily; dinner averaged 10:30 p.m.</p>` +
      `<h2>Examination & prakriti</h2><p>Vata-prakriti, vikriti vata-predominant. Quick, variable pulse; dry skin; variable appetite; light, interrupted sleep pattern. No red flags on screening for sleep apnoea or mood disorder.</p>` +
      `<h2>Protocol</h2><ul><li>7-day Shirodhara course (Ksheerabala taila, 35 min) following 3 days of internal snehana.</li><li>Ashwagandha 500 mg + Jatamansi 250 mg, warm milk, 30 minutes before the sleep window.</li><li>Hard sleep window 23:00–06:30, screens off 22:00, warm foot soak on non-shirodhara nights.</li></ul>` +
      `<h2>Outcome (diary-tracked)</h2><table><tr><th>Week</th><th>Sleep latency</th><th>Awakenings/night</th></tr><tr><td>Baseline</td><td>110 min</td><td>2–3</td></tr><tr><td>Week 2</td><td>55 min</td><td>1–2</td></tr><tr><td>Week 6</td><td>25 min</td><td>0–1</td></tr></table>` +
      callout("gold", "What did the lifting", "The shirodhara course compressed the first fortnight; the sleep window and the evening routine sustained the result. Herbs alone, without the window, have historically relapsed within weeks.") +
      `<h2>Discussion</h2><p>Single-patient evidence, offered as pattern rather than proof. The teaching: nidranasha of this type is a rhythm disorder first and a chemical one second — the protocol must treat both.</p>`,
  },
  {
    id: "seed-brahmi-review", slug: "research-brahmi-memory", title: "Research Review: Bacopa monnieri and Working Memory",
    subtitle: "What nine RCTs actually show — and what the labels oversell",
    summary: "Across nine randomised trials (n ≈ 550), Bacopa shows a small, consistent benefit on memory acquisition after 8–12 weeks — with GI tolerance as the limiting factor.",
    cover: "", categoryId: "dravyaguna", doshas: ["pitta", "kapha"], authorId: "shruti", date: "2026-01-10", views: 10290,
    symptoms: ["memory", "focus", "cognition"], kind: "research", status: "published", blocks: [],
    researchMeta: { question: "Does standardised Bacopa improve memory in healthy adults?", design: "Systematic review of 9 RCTs", n: "≈ 550 participants", finding: "Small, consistent gain in memory acquisition after 8–12 weeks", grade: "Moderate" },
    html:
      `<h2>The question</h2><p>Bacopa monnieri (Brahmi) is marketed as a fast-acting "brain booster". The clinical question is narrower: does standardised extract, taken for weeks, measurably improve memory in healthy adults?</p>` +
      `<h2>What the evidence shows</h2><p>Across nine randomised, placebo-controlled trials totalling roughly 550 participants, the consistent signal is on <strong>memory acquisition and retention</strong>, appearing only after 8–12 weeks of daily dosing (typically 300 mg of extract standardised to ~50% bacosides). Reaction-time gains are small and inconsistent.</p>` +
      `<h2>Tolerability</h2><p>Gastrointestinal upset — nausea, cramping — is the most common limiter, reduced substantially by taking the dose with food. This matters clinically: the classical anupana of ghee is doing real pharmacokinetic work.</p>` +
      shloka("ब्राह्मी मेधाकरी ज्ञेया स्मृतिपुष्टिविवर्धनी।", "Brahmi is known to nourish medha — the intellect that holds and retrieves.", "Bhavaprakasha") +
      callout("pitta", "Evidence grade: moderate", "Effect sizes are small-to-moderate and trials are heterogeneous. Honest framing: a genuine, slow cognitive support — not a stimulant, not a shortcut.") +
      `<h2>Desk position</h2><p>We reserve Bacopa for sustained study periods and convalescent brain-fog, prescribe it with meals, and set expectations at eight weeks. Patients who expect espresso get disappointment; patients who expect training get results.</p>`,
  },
  {
    id: "seed-ghee", slug: "ghee-agni-deepana", title: "Ghee Is Not the Villain: Agni, Lipids and a Very Old Debate",
    subtitle: "Why the classical texts insist on fat — and what modern lipid science concedes",
    summary: "Ayurveda never treated ghee as a condiment. It is a deepana-dravya, a carrier and a substrate. The lipid literature is closer to this view than the diet wars admit.",
    cover: "", categoryId: "ahara", doshas: ["vata", "pitta"], authorId: "monesh", date: "2025-11-25", views: 8820,
    symptoms: ["digestion", "vata", "skin", "joints"], kind: "blog", blocks: [], status: "published",
    html:
      `<p>Few foods carry as much modern anxiety as ghee — and few are as misread. The classical texts do not serve ghee for flavour. They deploy it: as <strong>agni-kindler, drug carrier, and tissue substrate</strong>, each role precise.</p>` +
      `<h2>The three classical roles</h2><ul><li><strong>Deepana</strong> — a warm teaspoon before meals to wake a sluggish agni.</li><li><strong>Anupana & samskara</strong> — fat-soluble actives ride ghee across the gut wall; herbs fried in ghee (ghrita samskara) are a delivery technology.</li><li><strong>Rasayana substrate</strong> — the building material for majja and shukra dhatu in the vata patient.</li></ul>` +
      shloka("घृतं दीपनमग्नस्य मेधायुष्यकरं परम्।", "Ghee kindles agni and, used rightly, supports intellect and longevity.", "Charaka Samhita") +
      `<h2>What the lipid science concedes</h2><p>Ghee is roughly two-thirds saturated fat — and saturated fat is no longer the monolithic villain the 1990s imagined. Within a whole-food, fibre-rich diet, moderate ghee intake shows neutral-to-favourable markers in several cohorts, particularly against refined-seed-oil displacement.</p>` +
      callout("pitta", "Dose is the doctrine", "One to three teaspoons daily, matched to agni and activity. A sedentary kapha constitution and a manual vata labourer cannot share a dose — the texts always tied fat to fire.") +
      `<h2>When we still say no</h2><p>Active pancreatitis, severe dyslipidaemia under care, and ama-laden sluggish digestion come before fat, not with it. Clear the channel, then build the substrate.</p>`,
  },
];

/* unified body: desk posts carry html; classics carry structured blocks → convert once */
export function articleHtml(a: Article): string {
  if (a.html && a.html.trim()) return a.html;
  return (a.blocks ?? []).map((b) => {
    const v = (b.value ?? "") as string;
    switch (b.type) {
      case "h2": return `<h2>${v}</h2>`;
      case "h3": return `<h3>${v}</h3>`;
      case "quote": return shloka(v, (b.translation ?? "") as string, (b.source ?? "") as string);
      case "list": return `<ul>${((b.items ?? []) as string[]).map((i) => `<li>${i}</li>`).join("")}</ul>`;
      default: return `<p>${v}</p>`;
    }
  }).join("");
}

export function articlePlainText(a: Article): string {
  return articleHtml(a).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "h";

/** Anchor ids for TOC scroll-spy — must match withHeadingIds exactly. */
export function articleToc(a: Article): { level: 2 | 3; text: string; id: string }[] {
  try {
    const doc = new DOMParser().parseFromString(articleHtml(a), "text/html");
    return Array.from(doc.querySelectorAll("h2, h3")).map((el, i) => ({
      level: el.tagName === "H2" ? 2 as const : 3 as const,
      text: el.textContent ?? "",
      id: `h-${i}-${slug(el.textContent ?? "")}`,
    }));
  } catch { return []; }
}

export function withHeadingIds(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("h2, h3").forEach((el, i) => { el.id = `h-${i}-${slug(el.textContent ?? "")}`; });
    return doc.body.innerHTML;
  } catch { return html; }
}

/* ------------------------------ symptom index -------------------------------- */

export function buildSymptomIndex(
  articles: Article[],
  herbs: { id: string; term: string; label: string }[] = [],
): { term: string; context: string; target: { kind: "article" | "herb"; id: string } }[] {
  const out: { term: string; context: string; target: { kind: "article" | "herb"; id: string } }[] = [];
  for (const a of articles) {
    a.symptoms.forEach((s) => out.push({ term: s, context: a.title, target: { kind: "article", id: a.id } }));
  }
  for (const h of herbs) {
    out.push({ term: h.term, context: h.label, target: { kind: "herb", id: h.id } });
  }
  return out;
}

/* ---------------------------------- herbs ------------------------------------ */

export interface Herb {
  id: string; sanskrit: string; common: string; botanical: string; part: string;
  rasa: string[]; virya: "Hot" | "Cold"; vipaka: string; doshas: Dosha[];
  benefits: string[]; classical: string; caution: string; treats: string[];
  image: string; duotone?: string; accent: string;
}

export const HERBS: Herb[] = [
  { id: "ashwagandha", sanskrit: "अश्वगन्धा", common: "Ashwagandha", botanical: "Withania somnifera", part: "Root", rasa: ["Tikta", "Kashaya"], virya: "Hot", vipaka: "Madhura", doshas: ["vata", "kapha"], benefits: ["Adaptogenic — steadies the stress axis and evening cortisol", "Improves sleep onset when taken with warm milk", "Balya — builds strength in convalescence"], classical: "Grants the steadiness of a horse — the classic balya herb of the Charaka school.", caution: "Avoid in pregnancy, hyperthyroidism and with sedatives. Pitta types: take with cooling carriers.", treats: ["stress", "sleep", "anxiety", "fatigue", "strength"], image: "", accent: "#d6b45f" },
  { id: "brahmi", sanskrit: "ब्राह्मी", common: "Brahmi", botanical: "Bacopa monnieri", part: "Whole plant", rasa: ["Tikta", "Madhura"], virya: "Cold", vipaka: "Madhura", doshas: ["pitta", "kapha"], benefits: ["Medhya — supports memory acquisition over 8–12 weeks", "Calms pitta-driven mental heat and irritability", "Classical base of the medhya ghritas"], classical: "The intellect's favourite herb — feeds medha, the holding power of memory.", caution: "Take with food to avoid GI upset. Effects are slow; expect weeks, not days.", treats: ["memory", "focus", "cognition"], image: "", accent: "#82b39e" },
  { id: "triphala", sanskrit: "त्रिफला", common: "Triphala", botanical: "Emblica + Terminalia spp.", part: "Three fruits", rasa: ["All five (dominant)"], virya: "Hot", vipaka: "Madhura", doshas: ["vata", "pitta", "kapha"], benefits: ["Tridoshic bowel regulator — gentle, non-habit forming", "Kindles agni when taken before meals", "Classical rasayana base for eyes and colon"], classical: "Pacifies the three doshas together — hence the name Tri-phala.", caution: "Avoid in pregnancy and acute diarrhoea. Check with a doctor if on anticoagulants.", treats: ["constipation", "digestion", "detox", "eyes"], image: "", accent: "#e07f49" },
  { id: "shatavari", sanskrit: "शतावरी", common: "Shatavari", botanical: "Asparagus racemosus", part: "Root", rasa: ["Madhura", "Tikta"], virya: "Cold", vipaka: "Madhura", doshas: ["pitta", "vata"], benefits: ["The classical women's tonic across the life cycle", "Cooling and moistening — soothes pitta acidity", "Galactagogue in the postpartum period"], classical: "She of a hundred roots — nourishing, cooling, and steadying.", caution: "Consult a practitioner with hormone-sensitive conditions.", treats: ["women's health", "acidity", "dryness", "postpartum"], image: "", accent: "#93b1cf" },
  { id: "tulsi", sanskrit: "तुलसी", common: "Tulsi", botanical: "Ocimum sanctum", part: "Leaves", rasa: ["Katu", "Tikta"], virya: "Hot", vipaka: "Katu", doshas: ["vata", "kapha"], benefits: ["Daily immunity tonic of the Indian household", "Warms the respiratory tract and eases kapha congestion", "Gentle adaptogen for desk-bound stress"], classical: "The incomparable one — planted at every doorstep for a reason.", caution: "Mildly anticoagulant — use care before surgery.", treats: ["immunity", "cough", "cold", "stress"], image: "", accent: "#7fa07f" },
  { id: "amla", sanskrit: "आमलकी", common: "Amla", botanical: "Emblica officinalis", part: "Fruit", rasa: ["Amla (sour)"], virya: "Cold", vipaka: "Madhura", doshas: ["pitta"], benefits: ["The sour fruit that cools — vipaka resolves the paradox", "Anchors pitta protocols: acidity, skin, hair, eyes", "Vitamin-C density with a protective tannin matrix"], classical: "Among sour things, amla alone pacifies instead of provoking.", caution: "Safe broadly; avoid excess on an empty stomach in vata types.", treats: ["acidity", "skin", "hair", "eyes", "immunity"], image: "", accent: "#d6b45f" },
  { id: "guduchi", sanskrit: "गुडूची", common: "Guduchi (Giloy)", botanical: "Tinospora cordifolia", part: "Stem", rasa: ["Tikta", "Kashaya"], virya: "Hot", vipaka: "Madhura", doshas: ["vata", "pitta", "kapha"], benefits: ["The classical fever herb — jvara-ghna across patterns", "Modulates immune response without over-stimulating", "Supports liver function in sluggish digestion"], classical: "The root of immortality — the amrita of the household pharmacopoeia.", caution: "Avoid in autoimmune flares unless supervised.", treats: ["fever", "immunity", "liver", "digestion"], image: "", accent: "#82b39e" },
  { id: "arjuna", sanskrit: "अर्जुन", common: "Arjuna", botanical: "Terminalia arjuna", part: "Bark", rasa: ["Kashaya", "Madhura"], virya: "Cold", vipaka: "Katu", doshas: ["pitta", "kapha"], benefits: ["The classical hridya — heart-tonic of the texts", "Supports blood pressure and lipid balance", "Used in milk decoction (ksheera-paka) classically"], classical: "The charioteer's bark — steadying the heart as he steadied the reins.", caution: "Coordinate with a cardiologist alongside any cardiac medication.", treats: ["heart", "blood pressure", "cholesterol"], image: "", accent: "#e07f49" },
];

/* --------------------------------- products ---------------------------------- */

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
  {
    id: "mahanarayana-oil", name: "Mahanarayana Abhyanga Oil", sanskrit: "महानारायण तैल", price: 899, mrp: 1099,
    image: "", badge: "Classical · Sahasrayoga", category: "Oils", stock: 24, rating: 4.8,
    dosage: "10 ml warmed; massage 15 min before bath, 4–5 days a week",
    ingredients: ["Sesame taila base", "60+ classical herbs", "Shatavari", "Ashwagandha", "Bala", "Dashamoola"],
    desc: "The great vata-pacifying oil of the Sahasrayoga, slow-infused over a wood fire for 21 days. For joints, deep-tissue abhyanga and the tired nervous system.",
    highlights: ["Slow-infused for 21 days over wood fire", "60+ herbs in the classical ratio", "First choice for joint stiffness and vata fatigue"],
    source: "Sahasrayoga, Taila prakarana", directions: "Warm 10 ml in a bowl of hot water. Massage along the direction of hair and along joints for 15 minutes, rest 10 minutes, then bathe with warm water.",
    safety: "For external use only. Patch-test on the inner forearm. Avoid over broken skin, in fever, or immediately after meals.",
    reviews: [
      { name: "Rohini D.", rating: 5, text: "My mother's knee stiffness eased within three weeks of daily abhyanga. The oil is dark and rich — you can smell the infusion.", at: "2026-02-11" },
      { name: "Kunal M.", rating: 5, text: "Post-gym recovery has never been better. I warm it every evening.", at: "2026-01-29" },
    ],
  },
  {
    id: "triphala-churna", name: "Triphala Churna, Stone-milled", sanskrit: "त्रिफला चूर्ण", price: 449, mrp: 549,
    image: "", badge: "Bestseller", category: "Churnas", stock: 61, rating: 4.9,
    dosage: "3–6 g at bedtime with warm water",
    ingredients: ["Amla (Emblica officinalis)", "Bibhitaki", "Haritaki", "Equal classical ratio"],
    desc: "Three fruits in the exact Charaka ratio, stone-milled at low speed to preserve the volatile fractions. Gentle, non-habit-forming bowel regulation.",
    highlights: ["Exact classical equal ratio", "Stone-milled at low speed", "Non-habit-forming, tridoshic"],
    source: "Charaka Samhita, Ashtanga Hridaya", directions: "3–6 g with warm water at bedtime for regulation; half a teaspoon with honey before meals to kindle agni.",
    safety: "Avoid in pregnancy and acute diarrhoea. Consult your doctor if you take anticoagulants.",
    reviews: [
      { name: "Meera S.", rating: 5, text: "Stone-milled makes a real difference — the aroma alone tells you. Regularity returned in a week.", at: "2026-02-18" },
      { name: "A. Kulkarni", rating: 4, text: "Taste is honest and strong, exactly as it should be. Works gently.", at: "2026-02-02" },
    ],
  },
  {
    id: "ashwagandha-caps", name: "Ashwagandha Root Capsules", sanskrit: "अश्वगन्धा वटिका", price: 699, mrp: 799,
    image: "", badge: "2.5% withanolides", category: "Capsules", stock: 42, rating: 4.7,
    dosage: "1 capsule (500 mg) twice daily after meals",
    ingredients: ["Withania somnifera root extract", "Standardised 2.5% withanolides", "Vegetable capsule"],
    desc: "Root-only extract — no leaf filler — standardised to the markers studied in trials. A 60-day supply for the stressed, sleepless desk worker.",
    highlights: ["Root-only extract, no leaf filler", "Standardised to trial-studied markers", "60-day supply"],
    source: "Dravyaguna classical + modern RCTs", directions: "One 500 mg capsule after lunch and one after dinner, ideally with warm milk.",
    safety: "Avoid in pregnancy, with thyroid medication or sedatives. Consult a vaidya if pitta-dominant with active inflammation.",
  },
  {
    id: "brahmi-ghrita", name: "Brahmi Ghrita", sanskrit: "ब्राह्मी घृत", price: 1099, mrp: 1299,
    image: "", badge: "A2 Gir cow ghee", category: "Ghritas", stock: 15, rating: 4.6,
    dosage: "1 tsp in warm milk at night",
    ingredients: ["A2 Gir cow ghee", "Fresh Bacopa monnieri juice", "Vacha", "Shankhapushpi"],
    desc: "The classical medhya ghrita — fresh brahmi juice simmered into A2 ghee in the traditional ratio. The memory formulation of the paediatric texts.",
    highlights: ["Fresh herb juice, not powder", "A2 Gir cow ghee base", "Traditional 100:12.5 ratio"],
    source: "Ashtanga Hridaya, Medhya chapter", directions: "One teaspoon in warm milk at night. For children above five, half a teaspoon under guidance.",
    safety: "Store refrigerated after opening. Not for acute indigestion or ama-laden states.",
  },
  {
    id: "kadha-concentrate", name: "Immunity Kadha Concentrate", sanskrit: "काढ़ा", price: 549, mrp: 649,
    image: "", badge: "30 servings", category: "Kadhas", stock: 50, rating: 4.8,
    dosage: "10 ml in 100 ml hot water, morning & evening",
    ingredients: ["Tulsi", "Sunthi (dry ginger)", "Maricha", "Pippali", "Dalchini", "Mulethi"],
    desc: "The household defence decoction, reduced to a sugar-free concentrate. Warming kapha–vata pacification for throat, chest and season change.",
    highlights: ["Sugar-free concentrate", "Six classical warming herbs", "30 servings per bottle"],
    source: "Household tradition + Charaka jvara context", directions: "10 ml in 100 ml hot water, morning and evening during season change. Not a substitute for fever medication.",
    safety: "Mildly warming — reduce frequency in high pitta states. Not for children under five without guidance.",
  },
  {
    id: "shatavari-kalpa", name: "Shatavari Kalpa Powder", sanskrit: "शतावरी कल्प", price: 649, mrp: 749,
    image: "", badge: "Wild-harvest certified", category: "Churnas", stock: 33, rating: 4.7,
    dosage: "3–6 g with warm milk, twice daily",
    ingredients: ["Asparagus racemosus root", "Milk-processed (kshira samskara)", "Mishri (rock sugar)"],
    desc: "Milk-processed shatavari root in the classical kalpa form — cooling, unctuous, and the pitta type's best friend through heat, acidity and dryness.",
    highlights: ["Kshira samskara — milk-processed", "Wild-harvest certified root", "Classical kalpa, not crude powder"],
    source: "Bhavaprakasha, Shatavari varga", directions: "3–6 g with warm milk. Before meals for pitta acidity; after meals for nourishment.",
    safety: "Consult a practitioner with hormone-sensitive conditions.",
  },
];

export const FREE_SHIP_AT = 999;

/* ---------------------------------- orders ----------------------------------- */

export type OrderStatus = "new" | "processing" | "shipped" | "out" | "delivered" | "cancelled";
export const ORDER_META: Record<OrderStatus, { label: string; color: string; cls: string }> = {
  new: { label: "New", color: "#d6b45f", cls: "bg-gold-400/15 text-gold-300 border-gold-400/40" },
  processing: { label: "Processing", color: "#93b1cf", cls: "bg-steel-400/15 text-steel-300 border-steel-400/40" },
  shipped: { label: "Shipped", color: "#e8cf8b", cls: "bg-gold-300/15 text-gold-300 border-gold-300/40" },
  out: { label: "Out for delivery", color: "#e07f49", cls: "bg-ember-400/15 text-ember-300 border-ember-400/40" },
  delivered: { label: "Delivered", color: "#82b39e", cls: "bg-kapha-400/15 text-kapha-300 border-kapha-400/40" },
  cancelled: { label: "Cancelled", color: "#c96430", cls: "bg-ember-500/10 text-ember-300 border-ember-500/40" },
};
export const ORDER_FLOW: OrderStatus[] = ["new", "processing", "shipped", "out", "delivered"];

export interface OrderCustomer { name: string; phone: string; address: string; city: string; pin: string }
export interface Order {
  id: string; customer: OrderCustomer;
  items: { name: string; qty: number; price: number; productId?: string; image?: string }[];
  total: number; status: OrderStatus; placedAt: string; customerId?: string;
  paymentMethod?: string; discountCode?: string; discountAmount?: number; shippingFee?: number;
}

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400e3).toISOString();
export const SEED_ORDERS: Order[] = [
  { id: "VG-2481", customer: { name: "Rohini Deshpande", phone: "+91 98220 11223", address: "14, Sadashiv Peth", city: "Pune", pin: "411030" }, items: [{ name: "Triphala Churna, Stone-milled", qty: 2, price: 449, productId: "triphala-churna" }], total: 898, status: "new", placedAt: d(0), customerId: "c-1", paymentMethod: "UPI" },
  { id: "VG-2474", customer: { name: "Kunal Mehta", phone: "+91 99870 44556", address: "B-702, Green Acres, Baner", city: "Pune", pin: "411045" }, items: [{ name: "Mahanarayana Abhyanga Oil", qty: 1, price: 899, productId: "mahanarayana-oil" }, { name: "Immunity Kadha Concentrate", qty: 1, price: 549, productId: "kadha-concentrate" }], total: 1448, status: "processing", placedAt: d(1), customerId: "c-2", paymentMethod: "Card" },
  { id: "VG-2466", customer: { name: "Meera Iyer", phone: "+91 90040 77889", address: "22, Lakeview Road", city: "Mumbai", pin: "400071" }, items: [{ name: "Brahmi Ghrita", qty: 1, price: 1099, productId: "brahmi-ghrita" }], total: 1099, status: "shipped", placedAt: d(3), customerId: "c-3", paymentMethod: "UPI" },
  { id: "VG-2450", customer: { name: "Arvind Kulkarni", phone: "+91 97650 33445", address: "5, Shivaji Nagar", city: "Nashik", pin: "422001" }, items: [{ name: "Ashwagandha Root Capsules", qty: 2, price: 699, productId: "ashwagandha-caps" }, { name: "Shatavari Kalpa Powder", qty: 1, price: 649, productId: "shatavari-kalpa" }], total: 2047, status: "delivered", placedAt: d(9), customerId: "c-4", paymentMethod: "COD" },
];

/* ---------------------------------- images ----------------------------------- */

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

/* ----------------------------------- quiz ------------------------------------ */

export interface QuizOption { text: string; dosha: Dosha }
export interface QuizQuestion { area: string; q: string; options: QuizOption[] }
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { area: "Frame", q: "How would you describe your natural body frame?", options: [{ text: "Lean, slender — hard to gain weight", dosha: "vata" }, { text: "Medium, athletic — muscle comes easily", dosha: "pitta" }, { text: "Broad, solid — gain easily, lose slowly", dosha: "kapha" }] },
  { area: "Skin", q: "Your skin typically feels…", options: [{ text: "Dry, thin, cool — cracks in winter", dosha: "vata" }, { text: "Warm, oily patches — flushes easily", dosha: "pitta" }, { text: "Smooth, thick, naturally moisturised", dosha: "kapha" }] },
  { area: "Sleep", q: "Which sleep pattern is most you?", options: [{ text: "Light, interrupted — mind races at 3 a.m.", dosha: "vata" }, { text: "Short but deep — I function on less", dosha: "pitta" }, { text: "Long, heavy — waking is the hard part", dosha: "kapha" }] },
  { area: "Appetite", q: "Your appetite and digestion…", options: [{ text: "Irregular — forget meals, then bloat", dosha: "vata" }, { text: "Sharp — I get hangry, need to eat on time", dosha: "pitta" }, { text: "Steady but slow — could skip a meal", dosha: "kapha" }] },
  { area: "Temperature", q: "In extreme weather you prefer…", options: [{ text: "Warmth, always — cold hands, cold feet", dosha: "vata" }, { text: "Coolness — I overheat and sweat quickly", dosha: "pitta" }, { text: "Warm dry days — damp cold settles in my chest", dosha: "kapha" }] },
  { area: "Mind", q: "Under pressure, your mind tends to…", options: [{ text: "Scatter — anxiety, overthinking, spiralling lists", dosha: "vata" }, { text: "Sharpen into irritation — critical, impatient", dosha: "pitta" }, { text: "Withdraw — inertia, resistance, comfort-seeking", dosha: "kapha" }] },
  { area: "Speech", q: "Friends would describe your speech as…", options: [{ text: "Fast — tangents, finishing others' sentences", dosha: "vata" }, { text: "Precise — persuasive, sometimes blunt", dosha: "pitta" }, { text: "Measured — slow, melodic, careful", dosha: "kapha" }] },
  { area: "Memory", q: "Your memory works like…", options: [{ text: "Quick to learn, quick to forget", dosha: "vata" }, { text: "Sharp — I rarely forget a fact or a slight", dosha: "pitta" }, { text: "Slow to learn, near-permanent retention", dosha: "kapha" }] },
  { area: "Energy", q: "Your energy through the day…", options: [{ text: "Bursts — sprint, then crash", dosha: "vata" }, { text: "Consistent, competitive — paced to win", dosha: "pitta" }, { text: "Slow-burning reserve — steady endurance", dosha: "kapha" }] },
  { area: "Joints", q: "Your joints and muscles…", options: [{ text: "Crack and creak — stiff after sitting", dosha: "vata" }, { text: "Tolerant of strain — but inflame and overheat", dosha: "pitta" }, { text: "Well-padded, stable — heavy rather than stiff", dosha: "kapha" }] },
  { area: "Elimination", q: "Elimination is usually…", options: [{ text: "Irregular — dry, constipation under stress", dosha: "vata" }, { text: "Regular — loose or urgent when stressed", dosha: "pitta" }, { text: "Slow, smooth — sometimes sluggish for days", dosha: "kapha" }] },
  { area: "Money", q: "With money and plans you are…", options: [{ text: "Impulsive — earn in flashes, spend in gusts", dosha: "vata" }, { text: "Strategic — spreadsheets and opinions", dosha: "pitta" }, { text: "A saver — steady, reluctant to part with it", dosha: "kapha" }] },
];

export interface DoshaResult { dosha: Dosha; headline: string; body: string; diet: string[]; lifestyle: string[]; herbs: string[] }
export const DOSHA_RESULTS: Record<Dosha, DoshaResult> = {
  vata: { dosha: "vata", headline: "Vata leads your constitution", body: "Air and ether govern your movement — quick mind, quick body, quick to exhaust. Your gift is creativity and speed; your tax is dryness, anxiety and irregularity. Everything warm, oily, rhythmic and grounded is medicine for you.", diet: ["Warm, moist, well-cooked meals; minimise raw and cold", "Ghee and sesame oil daily — inside and outside", "Sweet-sour-salty balance; bitter and astringent in moderation", "Regular meal times matter more than the menu"], lifestyle: ["Fixed wake and sleep times — vata heals inside routine", "Daily warm sesame abhyanga, even five minutes", "Slow exercise: walking, yin yoga, tai chi over HIIT", "Digital sunset one hour before bed"], herbs: ["Ashwagandha", "Jatamansi", "Brahmi (with ghee)", "Dashamoola"] },
  pitta: { dosha: "pitta", headline: "Pitta leads your constitution", body: "Fire and water run your metabolism — sharp digestion, sharper mind, a body that overheats easily. Your gift is focus and leadership; your tax is inflammation, acidity and impatience. Coolness, sweetness and unscheduled time are your prescription.", diet: ["Sweet, bitter, astringent as the base of the plate", "Cool, not iced; coconut, coriander, fennel, amla daily", "Limit fermented foods, chilli, excess coffee and alcohol", "Never skip meals — an empty pitta gut turns on itself"], lifestyle: ["Exercise in the cool hours; swimming is your ideal sport", "Ten minutes of non-doing daily — moonlit walks, not more lists", "Protect midday heat; skin and temper both thank you", "Sleep before 11 p.m. — the pitta hour amplifies what it touches"], herbs: ["Shatavari", "Brahmi", "Amla", "Mulethi (licorice)"] },
  kapha: { dosha: "kapha", headline: "Kapha leads your constitution", body: "Earth and water give you structure — steady strength, deep sleep, legendary patience. Your gift is endurance and calm; your tax is heaviness, congestion and inertia. Warmth, lightness, spice and motion keep your earth from settling.", diet: ["Light, warm, dry preparations; roasted over fried", "Pungent, bitter, astringent lead — ginger, pepper, honey", "Reduce dairy, heavy sweets and daytime napping", "Smaller dinners; agni is weakest after sunset"], lifestyle: ["Early rising before 6 a.m. is your single best intervention", "Vigorous daily exercise — you are the dosha built for intensity", "Dry brushing and stimulating massage over heavy oil", "Novelty on a schedule — new routes, new skills, cold exposure"], herbs: ["Trikatu", "Guduchi", "Tulsi", "Triphala"] },
};
