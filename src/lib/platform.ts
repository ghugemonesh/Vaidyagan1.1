/* =============================================================================
   Vaidyagan — public platform layer
   -----------------------------------------------------------------------------
   Sits on top of lib/data.ts (the console's demo store). Everything here also
   persists to localStorage and re-renders through the same pub/sub, so the
   public site, the Doctor Studio and the Admin Console never disagree.
   ========================================================================== */

import { useSyncExternalStore } from "react";
import {
  getProduct, listProducts, setProductStock, logAudit, pushNotif, getSettings, listDiscounts,
  type Order, type OrderItem, type Product,
} from "./data";

/* -------------------------------- reactivity -------------------------------- */

let version = 0;
const listeners = new Set<() => void>();
function emit(): void {
  version += 1;
  listeners.forEach((l) => l());
}
export function subscribePlatform(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
/** Re-render on any platform-store change. */
export function usePlatform(): number {
  return useSyncExternalStore(subscribePlatform, () => version);
}

/* --------------------------------- helpers ---------------------------------- */

const NS = "vg_";
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function persist(key: string, value: unknown): void {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch { /* ignore */ }
}
const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const today = () => new Date().toISOString().slice(0, 10);
export const todayStr = today;

/* ---------------------------------- images ---------------------------------- */

export const IMG = {
  oil: "https://image.qwenlm.ai/generated-images/03c63f71-ddce-402e-8f10-a7e347a52c94/_result.png",
  triphala: "https://image.qwenlm.ai/generated-images/4cb32572-62b8-4ad4-8548-2fda92b36f8b/_result.png",
  kadha: "https://image.qwenlm.ai/generated-images/eceac568-3271-4489-b31b-23c0b1bde259/_result.png",
  ghee: "https://image.qwenlm.ai/generated-images/2a354ccd-aaed-4812-b45e-deabd6b50ca0/_result.png",
  capsules: "https://image.qwenlm.ai/generated-images/f59fcf5f-cdef-40f1-a0e7-ed8f7351c55e/_result.png",
  chyawan: "https://image.qwenlm.ai/generated-images/6f519585-dbaf-42fa-a50f-e75cb8f50a33/_result.png",
  ritual: "https://image.qwenlm.ai/generated-images/c4f73f8f-5be8-4fcd-8b0a-de4f843b3fc0/_result.png",
};

const IMAGE_CYCLE = [IMG.oil, IMG.triphala, IMG.kadha, IMG.ghee, IMG.capsules, IMG.chyawan];

/** Deterministic product photo — PDP overrides first, then a stable cycle. */
export function productImage(p: Product, index: number): string {
  return PDP_EXTRA[p.id]?.image ?? IMAGE_CYCLE[Math.abs(index) % IMAGE_CYCLE.length];
}

/* ------------------------------- PDP metadata ------------------------------- */

export interface ProductReview {
  id: string; name: string; rating: number; text: string; date: string; verified: boolean; approved?: boolean;
}
export interface PdpExtra {
  image: string;
  classicalSource: string;
  detail: string[];
  ingredientDetails: { name: string; note: string }[];
  steps: string[];
  reviews: ProductReview[];
}

const PDP_EXTRA: Record<string, PdpExtra> = {
  prod_4: {
    image: IMG.oil,
    classicalSource: "Sahasrayoga — the thousand-formulation compendium of Kerala",
    detail: [
      "Mahanarayana taila is the great vata-pacifying oil of the Kerala tradition — a slow infusion of sixty-plus herbs into cold-pressed sesame, warmed over a wood fire for twenty-one days until the herbs surrender their fractions to the oil.",
      "Classically it is the first-line abhyanga oil for joints, deep tissue and the tired nervous system. In our batches the infusion is never rushed: temperature is held below 90°C so the volatile principles survive.",
    ],
    ingredientDetails: [
      { name: "Sesame taila base", note: "The anupana that carries every herb through the skin." },
      { name: "Ashwagandha", note: "Grounds vata; eases stiffness after long days." },
      { name: "Shatavari", note: "Cooling unctuousness for fatigued tissue." },
      { name: "Bala", note: "The 'strength-giver' — supports muscles and recovery." },
      { name: "Dashamoola", note: "Ten roots for deep, stubborn vata in the joints." },
    ],
    steps: [
      "Warm 10 ml in a bowl of hot water — never microwave.",
      "Massage in slow, long strokes for 15 minutes before bathing.",
      "Use 4–5 days a week; evening application settles vata insomnia.",
      "Rest 20 minutes, then bathe in warm water.",
    ],
    reviews: [
      { id: "r1", name: "Kavita R.", rating: 5, text: "Three weeks of evening abhyanga and my knees stopped complaining on stairs. The oil smells of the old vaidya shops — in the best way.", date: "2026-01-12", verified: true, approved: true },
      { id: "r2", name: "Arjun M.", rating: 4, text: "Heavy in the good sense. Absorbs if you actually massage for 15 minutes instead of slapping it on.", date: "2026-02-02", verified: true, approved: true },
      { id: "r3", name: "Sneha P.", rating: 5, text: "My physiotherapist asked what I changed. This was the only change.", date: "2026-02-20", verified: false, approved: true },
    ],
  },
  prod_2: {
    image: IMG.triphala,
    classicalSource: "Charaka Samhita, Chikitsa Sthana — the tridoshic triad",
    detail: [
      "Triphala is three fruits — amla, bibhitaki and haritaki — in the exact ratio the classics prescribe, stone-milled at low speed so the volatile fractions are never scorced away.",
      "It is the gentlest bowel regulator Ayurveda has: non-habit-forming, mildly rasayana, and the single formulation most vaidyas reach for when agni has gone quiet.",
    ],
    ingredientDetails: [
      { name: "Amla (Emblica officinalis)", note: "Sour, cooling, the richest natural vitamin C in the materia medica." },
      { name: "Bibhitaki", note: "The 'fearless one' — clears kapha congestion from the channels." },
      { name: "Haritaki", note: "The 'king of medicines' — moves vata downward, gently." },
    ],
    steps: [
      "Take 3–6 g at bedtime with warm water for regularity.",
      "Or ½ tsp with honey before meals to kindle agni.",
      "Give it 5–7 days of consistent use before judging.",
    ],
    reviews: [
      { id: "r1", name: "Rohit S.", rating: 5, text: "The stone-milled difference is real — no gritty aftertaste, and it works within a week.", date: "2026-01-25", verified: true, approved: true },
      { id: "r2", name: "Meera J.", rating: 5, text: "Finally a triphala that doesn't taste like punishment.", date: "2026-02-14", verified: true, approved: true },
    ],
  },
  prod_5: {
    image: IMG.kadha,
    classicalSource: "Household kaviraja tradition of the Deccan",
    detail: [
      "The kadha is the household defence decoction — tulsi, dry ginger, three peppers, cinnamon and mulethi reduced slowly to a sugar-free concentrate.",
      "Warming without being sharp, it is the classic answer to damp cold, scratchy throats and the seasonal wobble of kapha-vata.",
    ],
    ingredientDetails: [
      { name: "Tulsi", note: "The sacred basil — opens the chest and clears the head." },
      { name: "Sunthi (dry ginger)", note: "Kindles agni; the classical first mover of any kadha." },
      { name: "Trikatu", note: "Ginger, maricha and pippali — warmth in three speeds." },
      { name: "Mulethi", note: "Licorice — soothes the throat the peppers open." },
    ],
    steps: [
      "Dilute 10 ml in 100 ml hot water.",
      "Take morning and evening during seasonal change.",
      "Sip slowly while warm — the throat is the target.",
    ],
    reviews: [
      { id: "r1", name: "Devika N.", rating: 5, text: "Kept the whole office going through the February cold wave. Strong, honest taste.", date: "2026-02-08", verified: true, approved: true },
    ],
  },
  prod_3: {
    image: IMG.ghee,
    classicalSource: "Ashtanga Hridaya — the medhya (intellect) ghritas",
    detail: [
      "Brahmi ghrita is fresh bacopa juice simmered into A2 Gir cow ghee in the classical 100 : 12.5 : 12.5 ratio — kalka, drava and sneha in balance.",
      "This is the memory formulation of the paediatric texts, equally suited to the over-clocked adult mind: cooling, unctuous, settling pitta in the nervous system.",
    ],
    ingredientDetails: [
      { name: "A2 Gir cow ghee", note: "The carrier that crosses into the majja dhatu." },
      { name: "Fresh Brahmi juice", note: "Bacopa — the classical medhya rasayana for recall." },
      { name: "Vacha", note: "Sweet flag — sharpens the edge of attention." },
      { name: "Shankhapushpi", note: "The conch-flower — calms the racing evening mind." },
    ],
    steps: [
      "Take 1 tsp (5 g) in warm milk at night.",
      "Or as directed by your vaidya for nasya.",
      "Best taken on a settled stomach, 90 minutes after dinner.",
    ],
    reviews: [
      { id: "r1", name: "Anand T.", rating: 5, text: "Two months in — my 3 a.m. mind has quieted. The ghee tastes faintly of green herbs, which tells you it's real.", date: "2026-01-30", verified: true, approved: true },
      { id: "r2", name: "Dr. Nisha K.", rating: 4, text: "Prescribe it often; patients report better recall in 6–8 weeks when taken with milk.", date: "2026-02-18", verified: true, approved: true },
    ],
  },
  prod_1: {
    image: IMG.capsules,
    classicalSource: "Bhavaprakasha Nighantu — the balya (strength) group",
    detail: [
      "Our ashwagandha is a root-only extract — no leaf filler — standardised to 2.5% withanolides for the cortisol and sleep endpoints that modern trials actually measure.",
      "Classically it is the great balya herb: strength, steadiness and sleep for the depleted. The root is milk-processed (kshira samskara) to temper its heat.",
    ],
    ingredientDetails: [
      { name: "Withania somnifera root", note: "The 'smell of the horse' — virility and calm in one root." },
      { name: "Standardised withanolides", note: "2.5% — the marker compound of genuine root extract." },
    ],
    steps: [
      "Take 1 capsule (500 mg) twice daily after meals.",
      "With warm milk at night for the sleep benefit.",
      "Allow 4–6 weeks of consistent use.",
    ],
    reviews: [
      { id: "r1", name: "Vikram D.", rating: 5, text: "First adaptogen that didn't make me foggy. Sleep latency genuinely improved by week three.", date: "2026-02-05", verified: true, approved: true },
      { id: "r2", name: "Priya L.", rating: 4, text: "Subtle but cumulative — it's the 6 p.m. crash that disappeared.", date: "2026-02-22", verified: true, approved: true },
    ],
  },
  prod_6: {
    image: IMG.chyawan,
    classicalSource: "Charaka Samhita — the brimhana (nourishing) classics",
    detail: [
      "Shatavari kalpa is the classical preparation of Asparagus racemosus root — milk-processed (kshira samskara) to temper its subtle bitterness and deepen its nourishing quality.",
      "Cooling and unctuous, it is the pitta-type's steady companion: for acidity, dryness, and the particular depletions of the female system across every season of life.",
    ],
    ingredientDetails: [
      { name: "Asparagus racemosus root", note: "'She of a hundred husbands' — the classical rejuvenator for women." },
      { name: "Milk processing (kshira samskara)", note: "The traditional purification that makes the root gently building." },
      { name: "Mishri (rock sugar)", note: "The cooling sweetener of classical kalpas." },
    ],
    steps: [
      "Take 3–6 g with warm milk, twice daily.",
      "For acidity: before meals. For nourishment: after meals.",
      "Consistent use over 6–8 weeks gives the classical result.",
    ],
    reviews: [
      { id: "r1", name: "Shalini G.", rating: 5, text: "The milk-processing makes all the difference — no bitterness, and my acidity has genuinely settled.", date: "2026-01-18", verified: true, approved: true },
      { id: "r2", name: "Ritu M.", rating: 5, text: "My gynaecologist and my vaidya both approved the label. That almost never happens.", date: "2026-02-11", verified: true, approved: true },
    ],
  },
};

export function pdpFor(p: Product, index: number): PdpExtra {
  const extra = PDP_EXTRA[p.id];
  if (extra) return extra;
  /* graceful fallback so console-added products still get a complete PDP */
  return {
    image: productImage(p, index),
    classicalSource: "Formulated to classical ratio by the Vaidyagan desk",
    detail: [p.description],
    ingredientDetails: p.ingredients.map((name) => ({ name, note: "Classical ingredient of this formulation." })),
    steps: p.directions ? p.directions.split(/(?<=[.।])\s+/).filter(Boolean) : [p.dosage],
    reviews: [],
  };
}

/* --------------------------------- articles --------------------------------- */

export type ArticleStatus = "draft" | "review" | "scheduled" | "published";
export interface Author { name: string; initials: string; hue: string; qualification: string; }
export interface Article {
  id: string; slug: string; title: string; subtitle: string; summary: string;
  cover: string; category: string; categorySanskrit: string;
  doshas: ("vata" | "pitta" | "kapha")[];
  author: Author; authorId: string;
  date: string; views: number; symptoms: string[];
  kind: "blog" | "case" | "research";
  html: string;
  status: ArticleStatus;
  scheduledFor?: string;
}

const AUTHORS: Record<string, Author> = {
  monesh: { name: "Dr. Monesh L Ghuge", initials: "MG", hue: "#d6b45f", qualification: "BAMS · Kayachikitsa" },
  bhagyesh: { name: "Dr. Bhagyesh Karale", initials: "BK", hue: "#e07f49", qualification: "BAMS · Panchakarma" },
  shruti: { name: "Dr. Shruti Choudhary", initials: "SC", hue: "#82b39e", qualification: "BAMS · Dravyaguna" },
  shivani: { name: "Dr. Shivani Kadam", initials: "SK", hue: "#93b1cf", qualification: "BAMS · Stri Roga" },
};
export { AUTHORS };

const SEED_ARTICLES: Article[] = [
  {
    id: "a_ashwagandha", slug: "ashwagandha-clinical-monograph",
    title: "Ashwagandha, read clinically: what the root actually does",
    subtitle: "A Dravyaguna monograph separating the marketing from the materia medica",
    summary: "Ashwagandha is everywhere — and mostly misunderstood. This monograph reads the root through rasa, virya and the modern cortisol trials, and lands on who should (and shouldn't) take it.",
    cover: IMG.capsules, category: "Dravyaguna", categorySanskrit: "द्रव्यगुण",
    doshas: ["vata", "kapha"], author: AUTHORS.monesh, authorId: "monesh",
    date: "2026-02-18", views: 12480, symptoms: ["stress", "sleep", "fatigue", "anxiety"], kind: "blog", status: "published",
    html: `<p>Every supplement shelf in the country now carries ashwagandha, and most of what is written about it is either folklore or marketing. The classical picture is more precise — and more useful.</p>
<h2 id="energetics">The energetics, plainly</h2>
<p>Ashwagandha is <em>tikta-kashaya</em> in rasa, <em>ushna</em> in virya and <em>madhura</em> in vipaka. That single line does most of the clinical work: it warms and grounds without inflaming, which is why it sits so well with vata depletion.</p>
<blockquote class="shloka"><p class="sa">अश्वगन्धा बृंहणी वृष्या स्थैर्यकारी रसायनी।</p><p class="tr">"Ashwagandha is brimhana (building), vrishya (vitalising), gives steadiness, and is a rasayana."</p><cite>Bhavaprakasha Nighantu · Balyadi Varga</cite></blockquote>
<h2 id="evidence">What the trials actually measured</h2>
<p>The modern literature converges on three endpoints worth believing: <strong>serum cortisol reduction</strong> (typically 23–30% over 60 days at 300 mg root extract twice daily), <strong>sleep-onset latency</strong>, and <strong>strength recovery</strong>. Almost every positive trial used root extract standardised to withanolides — not leaf, not raw powder.</p>
<ul>
<li>Choose root-only extract, 2.5–5% withanolides.</li>
<li>Dose 300–600 mg, twice daily after food.</li>
<li>Give it six weeks; it is cumulative, not acute.</li>
</ul>
<h2 id="cautions">Who should pause</h2>
<p>Pitta-dominant patients running hot — rashes, acidity, irritability — often do better with shatavari or brahmi first. In hyperthyroid states the root's warming push needs a physician's eye. And pregnancy remains an absolute pause: the classical texts flag it as a mover.</p>
<div class="callout callout-gold"><p class="callout-title">Desk rule</p><p>If the patient's chief complaint is <em>wired and tired</em>, ashwagandha at night with warm milk is the prescription. If it is <em>hot and hurried</em>, cool them first.</p></div>`,
  },
  {
    id: "a_panchakarma", slug: "panchakarma-protocol-winter",
    title: "A classical Panchakarma protocol for the modern winter",
    subtitle: "How the snehana–swedana sequence adapts to heating, deadlines and 40-minute commutes",
    summary: "Winter is vata season, and the classics answer it with oil and heat. This is how a full snehana–swedana sequence adapts to a life that cannot pause for seven days.",
    cover: IMG.ritual, category: "Panchakarma", categorySanskrit: "पञ्चकर्म",
    doshas: ["vata"], author: AUTHORS.bhagyesh, authorId: "bhagyesh",
    date: "2026-01-28", views: 8930, symptoms: ["joint pain", "dryness", "stiffness", "insomnia"], kind: "blog", status: "published",
    html: `<p>The texts are unambiguous: cold, dry, windy weather is vata weather, and vata is answered with unctuousness and warmth. What is rarely discussed is how a complete sequence bends around a working life.</p>
<h2 id="sequence">The sequence, in order</h2>
<p>Panchakarma is not one therapy — it is a ladder. <strong>Snehana</strong> (oleation) comes first: internal ghee in escalating doses for three to five days, alongside daily abhyanga. Only once the tissues are saturated does <strong>swedana</strong> (sudation) make sense.</p>
<ol>
<li>Days 1–3: abhyanga with Mahanarayana or Dhanwantharam taila, 20 minutes.</li>
<li>Days 3–5: add internal ghee, 1 tsp rising to 3 tsp with warm milk.</li>
<li>Days 5–7: steam (nadi swedana) after each massage.</li>
</ol>
<h2 id="adapt">The working-week adaptation</h2>
<p>For the patient who cannot disappear for a week, the honest adaptation is a <em>three-weekend</em> protocol: full snehana–swedana on Saturdays, home abhyanga on weekday evenings, and ghee only on Friday nights. Results arrive slower — six weeks instead of one — but they arrive.</p>
<blockquote class="shloka"><p class="sa">स्नेहनात् स्निग्धता देहे मृदुत्वम् उपजायते।</p><p class="tr">"From oleation the body gains unctuousness and softness."</p><cite>Sushruta Samhita · Sutra Sthana 15</cite></blockquote>
<h2 id="contra">When not to start</h2>
<p>Active fever, acute infection, profound weakness, or undiagnosed bleeding — the ladder waits. Panchakarma moves things; nothing should be moved that is not ready to move.</p>
<div class="callout callout-ember"><p class="callout-title">Safety</p><p>Internal ghee escalation must be supervised. A fixed dose from an article is not a prescription.</p></div>`,
  },
  {
    id: "a_goldenmilk", slug: "turmeric-golden-milk-ahara",
    title: "Golden milk, done by the book: the ahara of turmeric",
    subtitle: "Why the fat, the pepper and the timing matter more than the teaspoon",
    summary: "Haldi doodh is not a trend — it is classical ahara. But most cups are built wrong: no fat, no pepper, wrong hour. Here is the formulation as the kitchen texts intend it.",
    cover: IMG.kadha, category: "Ahara", categorySanskrit: "आहार",
    doshas: ["kapha", "vata"], author: AUTHORS.shivani, authorId: "shivani",
    date: "2026-02-06", views: 15240, symptoms: ["immunity", "inflammation", "throat"], kind: "blog", status: "published",
    html: `<p>Turmeric needs three things to become medicine: <strong>fat</strong>, <strong>black pepper</strong>, and the <strong>right hour</strong>. Omit any of the three and you have coloured milk.</p>
<h2 id="why-fat">Why the fat is non-negotiable</h2>
<p>Curcuminoids are fat-soluble. A teaspoon of haldi in skim milk is mostly decoration — simmered into ghee or full-fat milk, the fractions actually become available. This is not modern pharmacology discovering tradition; it is the tradition stating the pharmacology first.</p>
<h2 id="recipe">The desk recipe</h2>
<ul>
<li>1 cup whole milk (or almond milk with 1 tsp ghee restored)</li>
<li>½ tsp turmeric, freshly ground if you can find it</li>
<li>A crack of black pepper — piperine multiplies absorption manifold</li>
<li>¼ tsp dry ginger in winter, cardamom in summer</li>
<li>Simmer 5 minutes; sweeten with jaggery off the flame</li>
</ul>
<h2 id="timing">The hour matters</h2>
<p>Take it warm, ninety minutes after dinner. Night is kapha's domain, and this cup answers the evening's residual congestion while settling vata before sleep. Morning turmeric is fine; night turmeric is classical.</p>
<blockquote class="shloka"><p class="sa">हरिद्रा कटुका तिक्ता लघुः कण्डूतिनाशिनी।</p><p class="tr">"Turmeric is pungent, bitter, light — it destroys itching and purifies."</p><cite>Bhavaprakasha Nighantu</cite></blockquote>`,
  },
  {
    id: "a_dinacharya", slug: "dinacharya-modern-workday",
    title: "Dinacharya for the modern workday",
    subtitle: "The morning sequence, compressed to what a 9 a.m. meeting allows",
    summary: "The classical morning is eighteen steps long. Almost nobody has it. This is the honest compression — the four moves that carry ninety percent of the benefit.",
    cover: IMG.ritual, category: "Dinacharya", categorySanskrit: "दिनचर्या",
    doshas: ["vata", "kapha"], author: AUTHORS.shruti, authorId: "shruti",
    date: today(), views: 0, symptoms: ["routine", "sleep", "digestion"], kind: "blog", status: "review",
    html: `<p>Dinacharya is often presented as all or nothing: tongue scraping, oil pulling, abhyanga, pranayama, sunrise — or failure. The texts themselves are kinder. They describe an ideal and assume adaptation.</p>
<h2 id="core">The irreducible four</h2>
<ol>
<li><strong>Wake before the phone.</strong> The first fifteen minutes set vata's tone. Fifteen minutes of anything but a feed.</li>
<li><strong>Warm water, slowly.</strong> Ushnodaka — a glass sipped warm, before anything else, wakes the gut without shocking it.</li>
<li><strong>Ten minutes of movement.</strong> Not a workout — surya namaskar at half pace, or a walk. Movement before food is the actual rule.</li>
<li><strong>Eat within two hours of waking.</strong> Late breakfast is the single most common agni mistake in working patients.</li>
</ol>
<h2 id="evening">The evening half</h2>
<p>Dinacharya is a loop, not a start line. Dinner by eight, screens off by ten, in bed before the vata hour (2 a.m. arrivals are a symptom, not a personality). The morning routine fails most often because the night routine doesn't exist.</p>
<div class="callout callout-gold"><p class="callout-title">Desk rule</p><p>One routine kept for thirty days beats eleven routines kept for two. Start with the warm water.</p></div>`,
  },
  {
    id: "a_brahmi_case", slug: "brahmi-memory-case",
    title: "Brahmi and the forgetting mind: a 12-week desk case",
    subtitle: "A 58-year teacher, subjective memory decline, and what the ghrita actually changed",
    summary: "A documented desk case: subjective memory decline in a 58-year-old teacher, managed with Brahmi ghrita and sleep discipline. What moved, what didn't, and what we'd repeat.",
    cover: IMG.ghee, category: "Chikitsa", categorySanskrit: "चिकित्सा",
    doshas: ["vata", "pitta"], author: AUTHORS.monesh, authorId: "monesh",
    date: "2026-01-10", views: 6120, symptoms: ["memory", "focus", "sleep"], kind: "case", status: "published",
    html: `<p><strong>Presenting:</strong> 58-year-old retired teacher, six-month history of word-finding difficulty and evening restlessness. Sleep onset 90+ minutes. No red flags on examination; MRI declined, no focal signs.</p>
<h2 id="reading">The classical reading</h2>
<p>Vata-pitta in the majja dhatu — the forgetting is dry and hot: names evaporate, the evening mind races. The medhya ghritas are the classical answer, and Brahmi ghrita leads them.</p>
<h2 id="protocol">Protocol</h2>
<ul>
<li>Brahmi ghrita 1 tsp in warm milk at night — 12 weeks</li>
<li>Shankhapushpi churna 1 g with the same milk</li>
<li>Screens off 10 p.m.; a 20-minute post-dinner walk</li>
<li>No daytime naps longer than 20 minutes</li>
</ul>
<h2 id="course">Course and outcome</h2>
<p>Weeks 1–4: sleep onset fell to 40 minutes; memory unchanged — expected, medhya work is slow. Weeks 5–8: word-finding eased in conversation, patient's own words: "the pause is shorter." Week 12: stable, mild residual evening restlessness. Ghrita continued; walk became the patient's own habit, which is the real outcome.</p>
<div class="callout callout-gold"><p class="callout-title">Teaching point</p><p>Memory cases fail when expectations are set in weeks instead of months. Set the calendar at the first visit.</p></div>`,
  },
  {
    id: "a_triphala_review", slug: "triphala-research-review",
    title: "Triphala beyond the bowel: a research review",
    subtitle: "Reading the modern trial stack against the classical claim",
    summary: "Triphala's reputation rests on gentle bowel regulation, but the trial stack has quietly widened — metabolic markers, oral health, wound healing. This review maps what holds.",
    cover: IMG.triphala, category: "Dravyaguna", categorySanskrit: "द्रव्यगुण",
    doshas: ["vata", "pitta", "kapha"], author: AUTHORS.shivani, authorId: "shivani",
    date: "2026-02-24", views: 4310, symptoms: ["digestion", "constipation", "metabolism"], kind: "research", status: "published",
    html: `<p>The honest summary: triphala's strongest modern evidence is still the oldest claim — <strong>gentle, non-habit-forming bowel regulation</strong> — but three adjacent areas have quietly accumulated credible data.</p>
<h2 id="strongest">Where the evidence is strongest</h2>
<p>Randomised data in functional constipation show increased stool frequency and improved consistency versus placebo at 5–10 g daily, without the cramping of stimulant laxatives. Mechanistically this fits the classical reading: haritaki moves, amla cools, bibhitaki clears.</p>
<h2 id="adjacent">The adjacent findings</h2>
<ul>
<li><strong>Metabolic markers:</strong> small RCTs show modest improvements in lipid profiles over 8–12 weeks.</li>
<li><strong>Oral health:</strong> triphala mouthwash performs comparably to chlorhexidine on plaque indices in several trials — without staining.</li>
<li><strong>Antioxidant status:</strong> consistent but small effects on oxidative markers; promising, not prescribable.</li>
</ul>
<h2 id="limits">Where it is weakest</h2>
<p>Oncology-adjacent claims remain in vitro. Any practitioner citing triphala for cancer is citing petri dishes. The desk position: prescribe it for the gut, mention the rest as interesting, and never more.</p>
<blockquote class="shloka"><p class="sa">त्रिफला त्रिदोषघ्नी रसायनी मलशोधनी।</p><p class="tr">"Triphala pacifies the three doshas, rejuvenates, and cleanses the wastes."</p><cite>Classical summary verse</cite></blockquote>`,
  },
];

const ARTICLES_KEY = "articles";

export function listUserArticles(): Article[] {
  return load<Article[]>(ARTICLES_KEY, []);
}
/** Merged journal: desk articles override seeds by id; everything else appends. */
export function allArticles(): Article[] {
  const user = listUserArticles();
  const ids = new Set(user.map((a) => a.id));
  return [...user, ...SEED_ARTICLES.filter((a) => !ids.has(a.id))].sort((a, b) => b.date.localeCompare(a.date));
}
export function publishedArticles(): Article[] {
  return allArticles().filter((a) => a.status === "published");
}
export function getArticle(slug: string): Article | undefined {
  return allArticles().find((a) => a.slug === slug || a.id === slug);
}
export function saveArticle(a: Article): void {
  const list = listUserArticles();
  const next = list.some((x) => x.id === a.id) ? list.map((x) => (x.id === a.id ? a : x)) : [a, ...list];
  persist(ARTICLES_KEY, next);
  emit();
}
export function deleteArticle(id: string): void {
  persist(ARTICLES_KEY, listUserArticles().filter((a) => a.id !== id));
  emit();
}
export function publishArticle(a: Article): void {
  const published = { ...a, status: "published" as const, date: a.status === "published" ? a.date : today() };
  saveArticle(published);
  logAudit(a.author.name, `published "${a.title}" to the journal`);
  pushNotif("Article published", `${a.title} — by ${a.author.name}`, "review");
}

/** Extract the H2/H3 outline for "On this page". */
export function articleToc(a: Article): { id: string; level: 2 | 3; text: string }[] {
  try {
    const doc = new DOMParser().parseFromString(a.html || "", "text/html");
    return Array.from(doc.querySelectorAll("h2, h3"))
      .map((n, i) => ({
        id: n.id || `sec-${i}`,
        level: (n.tagName === "H2" ? 2 : 3) as 2 | 3,
        text: (n.textContent || "").trim(),
      }))
      .filter((t) => t.text.length > 0);
  } catch {
    return [];
  }
}
/** Ensure every heading has an id matching articleToc. */
export function withHeadingIds(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(html || "", "text/html");
    doc.querySelectorAll("h2, h3").forEach((n, i) => {
      if (!n.id) n.id = `sec-${i}`;
    });
    return doc.body.innerHTML;
  } catch {
    return html || "";
  }
}
export function readingMinutes(a: Article): number {
  const text = (a.html || "").replace(/<[^>]*>/g, " ");
  return Math.max(2, Math.round(text.split(/\s+/).filter(Boolean).length / 210));
}

/* ----------------------------------- herbs ---------------------------------- */

export interface Herb {
  id: string; sanskrit: string; common: string; botanical: string; part: string;
  rasa: string[]; virya: "Hot" | "Cold"; vipaka: string;
  doshas: ("vata" | "pitta" | "kapha")[];
  benefits: string[]; classical: string; caution: string; treats: string[];
  accent: string;
}

const SEED_HERBS: Herb[] = [
  { id: "h_ashwagandha", sanskrit: "अश्वगन्धा", common: "Ashwagandha", botanical: "Withania somnifera", part: "Root", rasa: ["Tikta", "Kashaya"], virya: "Hot", vipaka: "Madhura", doshas: ["vata", "kapha"], benefits: ["Adaptogenic — steadies cortisol and the stress response", "Builds strength and recovery (balya)", "Deepens sleep when taken at night with milk"], classical: "The smell-of-the-horse herb: virility, steadiness and calm in one root.", caution: "Pause in hyperthyroid states and pregnancy; heavy pitta types start low.", treats: ["stress", "sleep", "fatigue", "anxiety"], accent: "#d6b45f" },
  { id: "h_brahmi", sanskrit: "ब्राह्मी", common: "Brahmi", botanical: "Bacopa monnieri", part: "Whole plant", rasa: ["Tikta", "Madhura"], virya: "Cold", vipaka: "Madhura", doshas: ["pitta", "vata"], benefits: ["Medhya rasayana — supports memory and recall", "Cools the racing evening mind", "Calms pitta-driven skin heat"], classical: "The intellect-herb of the paediatric texts, equally kind to adult minds.", caution: "May slow the gut in sensitive kapha types; take with ghee.", treats: ["memory", "focus", "anxiety", "skin"], accent: "#82b39e" },
  { id: "h_triphala", sanskrit: "त्रिफला", common: "Triphala", botanical: "Three fruits", part: "Fruits", rasa: ["All five except Lavana"], virya: "Hot", vipaka: "Madhura", doshas: ["vata", "pitta", "kapha"], benefits: ["Gentle, non-habit-forming bowel regulation", "Mild rasayana and antioxidant support", "Kindles agni before meals"], classical: "The triad that cleanses the wastes and rebuilds — the householder's rasayana.", caution: "Avoid in active diarrhoea and during pregnancy.", treats: ["digestion", "constipation", "metabolism"], accent: "#e07f49" },
  { id: "h_tulsi", sanskrit: "तुलसी", common: "Tulsi", botanical: "Ocimum tenuiflorum", part: "Leaves", rasa: ["Katu", "Tikta"], virya: "Hot", vipaka: "Katu", doshas: ["kapha", "vata"], benefits: ["Opens the chest and clears the head", "The classical daily immune tonic", "Settles damp-cold throat complaints"], classical: "The sacred basil — the courtyard pharmacy of every Indian home.", caution: "Warming — go easy in high-pitta summer months.", treats: ["immunity", "throat", "cough"], accent: "#7fa07f" },
  { id: "h_shatavari", sanskrit: "शतावरी", common: "Shatavari", botanical: "Asparagus racemosus", part: "Root", rasa: ["Madhura", "Tikta"], virya: "Cold", vipaka: "Madhura", doshas: ["pitta", "vata"], benefits: ["Cooling, nourishing tonic for the female system", "Soothes acidity and dry heat", "Builds tissue and stamina (brimhana)"], classical: "She of a hundred husbands — the classical rejuvenator for women.", caution: "Damp-heavy kapha presentations use it sparingly.", treats: ["women's health", "acidity", "dryness"], accent: "#b7cbde" },
  { id: "h_arjuna", sanskrit: "अर्जुन", common: "Arjuna", botanical: "Terminalia arjuna", part: "Bark", rasa: ["Kashaya", "Madhura"], virya: "Cold", vipaka: "Katu", doshas: ["pitta", "kapha"], benefits: ["The classical cardio-tonic bark", "Astringent support for the heart muscle", "Traditionally taken as ksheera-paka (milk decoction)"], classical: "The bark the Mahabharata's charioteer shares a name with — strength under load.", caution: "Cardiac patients stay under physician supervision.", treats: ["heart", "blood pressure"], accent: "#f0a377" },
  { id: "h_guduchi", sanskrit: "गुडूची", common: "Guduchi (Giloy)", botanical: "Tinospora cordifolia", part: "Stem", rasa: ["Tikta", "Kashaya", "Madhura"], virya: "Hot", vipaka: "Madhura", doshas: ["vata", "pitta", "kapha"], benefits: ["The tridoshic immune modulator", "Classical support in recurrent fevers", "Gentle metabolic balance"], classical: "The divine elixir stem — amrita, the nectar-vine.", caution: "Autoimmune conditions need a physician's judgement.", treats: ["immunity", "fever", "metabolism"], accent: "#a9cfbf" },
  { id: "h_jatamansi", sanskrit: "जटामांसी", common: "Jatamansi", botanical: "Nardostachys jatamansi", part: "Rhizome", rasa: ["Tikta", "Madhura", "Kashaya"], virya: "Cold", vipaka: "Madhura", doshas: ["vata", "pitta"], benefits: ["The deep-sleep rhizome of the Himalaya", "Calms palpitation and nervous hurry", "Grounds without dulling"], classical: "The musk-scented root that quiets the vata mind at 3 a.m.", caution: "Harvest pressure makes sourcing ethics matter — buy verified.", treats: ["sleep", "anxiety", "palpitation"], accent: "#93b1cf" },
];

const HERBS_KEY = "herbs";
export function listHerbs(): Herb[] {
  const stored = load<Herb[] | null>(HERBS_KEY, null);
  return stored && stored.length > 0 ? stored : SEED_HERBS;
}
export function saveHerb(h: Herb): void {
  const list = listHerbs();
  const next = list.some((x) => x.id === h.id) ? list.map((x) => (x.id === h.id ? h : x)) : [...list, h];
  persist(HERBS_KEY, next);
  emit();
}
export function deleteHerb(id: string): void {
  persist(HERBS_KEY, listHerbs().filter((h) => h.id !== id));
  emit();
}
export function resetHerbs(): void {
  persist(HERBS_KEY, SEED_HERBS);
  emit();
}

/* ----------------------------------- quiz ----------------------------------- */

export interface QuizOption { text: string; dosha: "vata" | "pitta" | "kapha"; }
export interface QuizQuestion { area: string; q: string; options: QuizOption[]; }

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { area: "Frame", q: "How would you describe your natural body frame?", options: [ { text: "Lean and slender — I find it hard to gain weight", dosha: "vata" }, { text: "Medium, athletic — muscle comes fairly easily", dosha: "pitta" }, { text: "Broad and solid — I gain weight easily and lose it slowly", dosha: "kapha" } ] },
  { area: "Skin", q: "Your skin typically feels…", options: [ { text: "Dry, thin, cool — it cracks in winter", dosha: "vata" }, { text: "Warm, oily in patches — flushes easily", dosha: "pitta" }, { text: "Smooth, thick, naturally moisturised", dosha: "kapha" } ] },
  { area: "Sleep", q: "Which sleep pattern is most you?", options: [ { text: "Light and interrupted — my mind races at 3 a.m.", dosha: "vata" }, { text: "Short but deep — I function on less than most", dosha: "pitta" }, { text: "Long and heavy — waking up is the hardest part", dosha: "kapha" } ] },
  { area: "Appetite", q: "Your appetite and digestion…", options: [ { text: "Irregular — I forget meals, then bloat", dosha: "vata" }, { text: "Sharp — I get hangry and must eat on time", dosha: "pitta" }, { text: "Steady but slow — I could skip a meal easily", dosha: "kapha" } ] },
  { area: "Temperature", q: "In extreme weather you prefer…", options: [ { text: "Warmth, always — cold hands, cold feet", dosha: "vata" }, { text: "Coolness — I overheat and sweat quickly", dosha: "pitta" }, { text: "Warm, dry days — damp cold settles in my chest", dosha: "kapha" } ] },
  { area: "Mind", q: "Under pressure, your mind tends to…", options: [ { text: "Scatter — anxiety, overthinking, spiralling lists", dosha: "vata" }, { text: "Sharpen into irritation — critical, driven", dosha: "pitta" }, { text: "Withdraw — inertia, resistance, comfort-seeking", dosha: "kapha" } ] },
  { area: "Speech", q: "Friends would describe your speech as…", options: [ { text: "Fast — I talk in tangents and finish others' sentences", dosha: "vata" }, { text: "Precise — persuasive, sometimes blunt", dosha: "pitta" }, { text: "Measured — slow, melodic, careful with words", dosha: "kapha" } ] },
  { area: "Memory", q: "Your memory works like…", options: [ { text: "Quick to learn, quick to forget", dosha: "vata" }, { text: "Sharp and focused — I rarely forget a fact or a slight", dosha: "pitta" }, { text: "Slow to learn, near-permanent retention", dosha: "kapha" } ] },
  { area: "Energy", q: "Your energy through the day…", options: [ { text: "Comes in bursts — I sprint, then crash", dosha: "vata" }, { text: "Consistent and competitive — I pace to win", dosha: "pitta" }, { text: "A slow-burning reserve — strong endurance", dosha: "kapha" } ] },
  { area: "Joints", q: "Your joints and muscles…", options: [ { text: "Crack and creak — stiffness after sitting", dosha: "vata" }, { text: "Tolerant of strain — but I inflame and overheat", dosha: "pitta" }, { text: "Well-padded and stable — heavy rather than stiff", dosha: "kapha" } ] },
  { area: "Elimination", q: "Elimination is usually…", options: [ { text: "Irregular — dry, constipation when stressed", dosha: "vata" }, { text: "Regular — but loose when stressed or overheated", dosha: "pitta" }, { text: "Slow, smooth — sometimes sluggish for days", dosha: "kapha" } ] },
  { area: "Habits", q: "With money and plans you are…", options: [ { text: "Impulsive — I earn in flashes and spend in gusts", dosha: "vata" }, { text: "Strategic — I invest with a spreadsheet and opinions", dosha: "pitta" }, { text: "A saver — steady accumulation, reluctant to part", dosha: "kapha" } ] },
];

export interface DoshaResult {
  dosha: "vata" | "pitta" | "kapha";
  headline: string; body: string;
  diet: string[]; lifestyle: string[]; herbs: string[];
}
export const DOSHA_RESULTS: Record<"vata" | "pitta" | "kapha", DoshaResult> = {
  vata: { dosha: "vata", headline: "Vata leads your constitution", body: "Air and ether govern your movement — quick mind, quick body, quick to exhaust. Your gift is creativity and speed; your tax is dryness, anxiety and irregularity. Everything warm, oily, rhythmic and grounded is medicine for you.", diet: ["Favour warm, moist, well-cooked meals; minimise raw and cold", "Ghee and sesame oil daily — inside and outside", "Sweet, sour and salty lead; bitter and astringent in moderation", "Regular meal times matter more than the menu itself"], lifestyle: ["Fixed wake and sleep times — vata heals inside routine", "Daily abhyanga with warm sesame oil, even five minutes", "Slow exercise: walking, yin yoga — over HIIT", "Digital sunset one hour before bed"], herbs: ["Ashwagandha", "Jatamansi", "Brahmi (with ghee)", "Dashamoola"] },
  pitta: { dosha: "pitta", headline: "Pitta leads your constitution", body: "Fire and water run your metabolism — sharp digestion, sharper mind, a body that overheats easily. Your gift is focus and leadership; your tax is inflammation, acidity and impatience. Coolness, sweetness and un-scheduled time are your prescription.", diet: ["Sweet, bitter and astringent as the base of your plate", "Cool, not iced; coconut, coriander, fennel, amla daily", "Limit fermented foods, chilli, excess coffee and alcohol", "Never skip meals — an empty pitta gut turns on itself"], lifestyle: ["Exercise in the cool hours; swimming is your ideal sport", "Ten minutes of non-doing daily — moonlit walks, not more lists", "Protect midday heat; skin and temper both thank you", "Sleep before 11 p.m. — the pitta hour amplifies what it touches"], herbs: ["Shatavari", "Brahmi", "Amla", "Mulethi (licorice)"] },
  kapha: { dosha: "kapha", headline: "Kapha leads your constitution", body: "Earth and water give you structure — steady strength, deep sleep, legendary patience. Your gift is endurance and calm; your tax is heaviness, congestion and inertia. Warmth, lightness, spice and motion keep your earth from settling.", diet: ["Light, warm, dry preparations; roasted over fried", "Pungent, bitter, astringent lead — ginger, pepper, honey", "Reduce dairy, heavy sweets and daytime napping", "Smaller dinners; your agni is weakest after sunset"], lifestyle: ["Early rising is your single best intervention — before 6 a.m.", "Vigorous daily exercise; you are the dosha built for intensity", "Dry brushing and stimulating massage over heavy oil", "Novelty on a schedule — new routes, new skills, cold exposure"], herbs: ["Trikatu", "Guduchi", "Tulsi", "Triphala"] },
};

/* -------------------------------- studio auth ------------------------------- */

export interface StudioUser {
  id: string; name: string; role: "superadmin" | "doctor";
  username: string; password: string; specialty: string; hue: string;
}
const STUDIO_USERS: StudioUser[] = [
  { id: "monesh", name: "Dr. Monesh L Ghuge", role: "superadmin", username: "monesh", password: "admin91466", specialty: "Kayachikitsa · Founder", hue: "#d6b45f" },
  { id: "bhagyesh", name: "Dr. Bhagyesh Karale", role: "doctor", username: "bhagyesh", password: "bhagyesh123", specialty: "Panchakarma · Detox protocols", hue: "#e07f49" },
  { id: "shruti", name: "Dr. Shruti Choudhary", role: "doctor", username: "shruti", password: "shruti123", specialty: "Dravyaguna · Clinical herbology", hue: "#82b39e" },
  { id: "shivani", name: "Dr. Shivani Kadam", role: "doctor", username: "shivani", password: "shivani123", specialty: "Stri Roga · Women's health", hue: "#93b1cf" },
];
const STUDIO_SESSION_KEY = "studio_session";

export function studioLogin(username: string, password: string): { ok: boolean; user?: StudioUser; error?: string } {
  const u = STUDIO_USERS.find((x) => x.username.toLowerCase() === username.trim().toLowerCase());
  if (!u) return { ok: false, error: "No account found with that username." };
  if (u.password !== password) return { ok: false, error: "Incorrect password — please try again." };
  persist(STUDIO_SESSION_KEY, u.id);
  emit();
  return { ok: true, user: u };
}
export function studioSession(): StudioUser | null {
  const id = load<string | null>(STUDIO_SESSION_KEY, null);
  return STUDIO_USERS.find((u) => u.id === id) ?? null;
}
export function studioLogout(): void {
  try { localStorage.removeItem(NS + STUDIO_SESSION_KEY); } catch { /* ignore */ }
  emit();
}

/* ------------------------------ doctor profile ------------------------------ */

export interface DoctorProfile {
  userId: string; prefix: string; fullName: string; mobile: string; whatsappSame: boolean;
  whatsapp: string; languages: string[]; registrationNumber: string; council: string;
  degrees: { id: string; degree: string; university: string; year: string }[];
  specialty: string; subSpecialties: string[]; experienceYears: string;
  clinicName: string; city: string; bioHtml: string; updatedAt: string;
}
const PROFILE_KEY = "doctor_profiles";

export function blankProfile(u: StudioUser): DoctorProfile {
  return {
    userId: u.id, prefix: "Dr.", fullName: u.name, mobile: "", whatsappSame: true, whatsapp: "",
    languages: ["Hindi", "English"], registrationNumber: "", council: "",
    degrees: [], specialty: u.specialty.split("·")[0]?.trim() ?? "", subSpecialties: [], experienceYears: "",
    clinicName: "", city: "", bioHtml: "", updatedAt: today(),
  };
}
export function getProfile(userId: string): DoctorProfile {
  const map = load<Record<string, DoctorProfile>>(PROFILE_KEY, {});
  return map[userId] ?? blankProfile(STUDIO_USERS.find((u) => u.id === userId) ?? STUDIO_USERS[0]);
}
export function saveProfile(p: DoctorProfile): void {
  const map = load<Record<string, DoctorProfile>>(PROFILE_KEY, {});
  map[p.userId] = { ...p, updatedAt: today() };
  persist(PROFILE_KEY, map);
  emit();
}

/* ---------------------------- customer accounts ------------------------------ */

export interface AccountAddress { id: string; label: string; line: string; city: string; pin: string; isDefault: boolean; }
export interface Account {
  id: string; name: string; email: string; phone: string; password?: string;
  provider: "otp" | "google" | "email"; addresses: AccountAddress[]; createdAt: string;
}
const ACCOUNTS_KEY = "customer_accounts";
const ACCOUNT_SESSION_KEY = "customer_session";

function loadAccounts(): Account[] {
  return load<Account[]>(ACCOUNTS_KEY, []);
}
export function accountSession(): Account | null {
  const id = load<string | null>(ACCOUNT_SESSION_KEY, null);
  return loadAccounts().find((a) => a.id === id) ?? null;
}
export function loginOtp(phone: string, name?: string): Account {
  const list = loadAccounts();
  const clean = phone.replace(/\D/g, "");
  let acct = list.find((a) => a.phone.replace(/\D/g, "") === clean);
  if (!acct) {
    acct = { id: uid("acc"), name: name || "Ayurveda friend", email: "", phone, provider: "otp", addresses: [], createdAt: today() };
    persist(ACCOUNTS_KEY, [...list, acct]);
  }
  persist(ACCOUNT_SESSION_KEY, acct.id);
  emit();
  return acct;
}
export function loginGoogle(email: string, name: string): Account {
  const list = loadAccounts();
  let acct = list.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (!acct) {
    acct = { id: uid("acc"), name, email, phone: "", provider: "google", addresses: [], createdAt: today() };
    persist(ACCOUNTS_KEY, [...list, acct]);
  }
  persist(ACCOUNT_SESSION_KEY, acct.id);
  emit();
  return acct;
}
export function loginEmail(email: string, password: string): Account | null {
  const acct = loadAccounts().find((a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
  if (!acct) return null;
  persist(ACCOUNT_SESSION_KEY, acct.id);
  emit();
  return acct;
}
export function registerEmail(name: string, email: string, password: string): { ok: boolean; error?: string; account?: Account } {
  const list = loadAccounts();
  if (list.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "An account with that email already exists — sign in instead." };
  }
  const acct: Account = { id: uid("acc"), name, email, phone: "", password, provider: "email", addresses: [], createdAt: today() };
  persist(ACCOUNTS_KEY, [...list, acct]);
  persist(ACCOUNT_SESSION_KEY, acct.id);
  emit();
  return { ok: true, account: acct };
}
export function logoutAccount(): void {
  try { localStorage.removeItem(NS + ACCOUNT_SESSION_KEY); } catch { /* ignore */ }
  emit();
}
export function updateAccount(id: string, patch: Partial<Account>): void {
  persist(ACCOUNTS_KEY, loadAccounts().map((a) => (a.id === id ? { ...a, ...patch } : a)));
  emit();
}

/* ------------------------------------ cart ----------------------------------- */

export interface CartLine { productId: string; qty: number; }
const CART_KEY = "cart";

export function loadCart(): CartLine[] {
  return load<CartLine[]>(CART_KEY, []);
}
export function persistCart(lines: CartLine[]): void {
  persist(CART_KEY, lines);
  emit();
}

export interface DiscountResult { ok: boolean; amount: number; message: string; code?: string; }
/** Validates a discount code against the console's marketing collection. */
export function validateDiscountCode(code: string, subtotal: number): DiscountResult {
  try {
    const clean = code.trim().toUpperCase();
    if (!clean) return { ok: false, amount: 0, message: "Enter a code first." };
    const d = listDiscounts().find((x) => x.code.toUpperCase() === clean);
    if (!d) return { ok: false, amount: 0, message: `"${clean}" isn't a valid code.` };
    if (!d.active) return { ok: false, amount: 0, message: `"${d.code}" is switched off right now.` };
    if (d.expires && new Date(d.expires + "T23:59:59").getTime() < Date.now()) {
      return { ok: false, amount: 0, message: `"${d.code}" expired on ${d.expires}.` };
    }
    if (subtotal < d.minOrder) return { ok: false, amount: 0, message: `"${d.code}" needs a minimum order of ₹${d.minOrder.toLocaleString("en-IN")}.` };
    const amount = d.type === "percent" ? Math.round((subtotal * d.value) / 100) : Math.min(d.value, subtotal);
    return { ok: true, amount, message: `${d.code} applied — you save ₹${amount.toLocaleString("en-IN")}.`, code: d.code };
  } catch {
    return { ok: false, amount: 0, message: "Codes are unavailable right now — try again at payment." };
  }
}

/* --------------------------------- checkout --------------------------------- */

export interface CheckoutInput {
  name: string; email: string; phone: string; address: string; paymentMethod: string;
  discount?: { code: string; amount: number };
}

/**
 * Places the order INTO THE CONSOLE'S ORDER STORE: builds the Order, deducts
 * stock via setProductStock (which bumps the console's store), writes audit +
 * notification, and returns the created order.
 */
export function placeOrder(input: CheckoutInput, lines: CartLine[]): Order | null {
  try {
    const products = listProducts();
    const items: OrderItem[] = [];
    for (const line of lines) {
      const p = getProduct(line.productId);
      if (!p) continue;
      const price = p.price;
      items.push({ productId: p.id, name: p.name, accent: p.accent, qty: line.qty, price, total: price * line.qty });
    }
    if (items.length === 0) return null;
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const settings = getSettings();
    const discount = input.discount ? Math.min(input.discount.amount, subtotal) : 0;
    const shipping = subtotal - discount >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
    const total = subtotal - discount + shipping;

    const order: Order = {
      id: `VG-${1000 + Math.floor(Math.random() * 9000)}`,
      customerName: input.name, customerEmail: input.email, customerPhone: input.phone,
      items, subtotal, shipping, discount, total,
      status: "new", paymentMethod: input.paymentMethod,
      address: input.address, createdAt: new Date().toISOString(),
    };

    /* write straight into the console's namespaced orders key, newest first */
    const ordersKey = "vaidyagan_orders";
    let existing: Order[] = [];
    try {
      const raw = localStorage.getItem(ordersKey);
      if (raw) existing = JSON.parse(raw) as Order[];
    } catch { existing = []; }
    localStorage.setItem(ordersKey, JSON.stringify([order, ...existing]));

    /* deduct stock through the console's own mutator (re-renders its pages) */
    items.forEach((i) => {
      const p = getProduct(i.productId);
      if (p) setProductStock(p.id, Math.max(0, p.stock - i.qty));
    });

    logAudit(input.name || "Customer", `placed order ${order.id} (₹${total.toLocaleString("en-IN")})`);
    pushNotif("New order received", `${order.id} · ${input.name} · ₹${total.toLocaleString("en-IN")}`, "order");
    items.forEach((i) => {
      const p = getProduct(i.productId);
      if (p && p.stock > 0 && p.stock < 5) pushNotif("Low stock alert", `${p.name} is down to ${p.stock} units.`, "stock");
    });

    /* clear the basket */
    persistCart([]);
    return order;
  } catch {
    return null;
  }
}

/* ------------------------------ small formatters ----------------------------- */

export const inr = (n: number): string => `₹${n.toLocaleString("en-IN")}`;
export function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}
