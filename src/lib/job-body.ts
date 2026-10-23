// src/lib/job-body.ts
// Mise en forme du corps ("body") d'une offre pour l'affichage.
//
// Les offres saisies à la main contiennent déjà du HTML (<b>, <br>, ...) et
// les collecteurs conservent désormais le HTML de la source : ces corps sont
// rendus tels quels. Les offres importées avant ça sont stockées en un seul
// bloc de texte où rubriques et listes sont collées ("Lieu : BrazzavilleType
// de contrat : CDIMissions principales :Élaborer... ;Assurer..."). On en
// reconstruit ici une structure lisible à partir des intitulés de rubriques
// connus, à l'affichage seulement : la donnée en base n'est jamais modifiée.

const HTML_TAG_RE = /<\/?(?:p|br|b|strong|ul|ol|li|em|i|div|span|h[1-6])\b/i;

/** Rubriques courtes "Libellé : valeur", affichées une par ligne. */
const FIELD_LABELS = [
  "Intitulé du poste",
  "Entreprise",
  "Lieu d'affectation",
  "Lieu de travail",
  "Lieu",
  "Type de contrat",
  "Durée",
  "Début",
  "Gratification",
  "Rémunération",
  "Salaire",
  "Département",
  "Catégorie/Classe",
  "Date limite de candidature",
  "Date limite",
];

/** Rubriques de texte libre, affichées en paragraphes. */
const PROSE_LABELS = ["Description du poste", "Contexte", "Présentation", "Comment postuler"];

/** Rubriques qui énumèrent des éléments, affichées en liste à puces. */
const LIST_LABELS = [
  "Missions principales",
  "Missions",
  "Responsabilités",
  "Tâches",
  "Profil recherché",
  "Profil",
  "Compétences requises",
  "Compétences",
  "Qualifications",
  "Conditions",
  "Avantages",
  "Dossier de candidature",
  "Documents à fournir",
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

// Libellés les plus longs d'abord, pour que "Lieu d'affectation" l'emporte
// sur "Lieu". Sensible à la casse et suivi de ":" (ou "?") : "missions
// principales" au milieu d'une phrase n'est pas une rubrique.
const LABEL_RE = new RegExp(
  `(${[...FIELD_LABELS, ...PROSE_LABELS, ...LIST_LABELS]
    .sort((a, b) => b.length - a.length)
    .map(escapeRe)
    .join("|")})\\s*[:?]`,
  "g",
);

/** Mots à majuscule interne qu'il ne faut pas couper en deux éléments. */
const CAMEL_CASE_WORDS = new Set([
  "totalenergies",
  "powerpoint",
  "sharepoint",
  "linkedin",
  "whatsapp",
  "youtube",
  "javascript",
  "typescript",
  "quickbooks",
  "onedrive",
  "powerbi",
  "autocad",
]);

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Coupe un texte là où deux éléments ont été collés sans séparateur
 * ("...industrielsRéaliser les opérations"), en épargnant les mots qui ont
 * légitimement une majuscule interne (PowerPoint, iPhone, McKinsey...).
 */
function splitGlued(text: string): string[] {
  const marked = text.replace(/([a-zà-ÿ0-9).])(?=[A-ZÀ-Ý][a-zà-ÿ])/g, (match, prev: string, offset: number) => {
    const start = text.lastIndexOf(" ", offset) + 1;
    const end = text.indexOf(" ", offset);
    const word = text.slice(start, end === -1 ? undefined : end).replace(/[^\p{L}]/gu, "").toLowerCase();
    const before = text.slice(start, offset + 1).replace(/[^\p{L}]/gu, "");
    if (CAMEL_CASE_WORDS.has(word) || before.length <= 2) return match;
    return `${prev}\u0000`;
  });
  return marked.split("\u0000");
}

function toParagraphs(text: string): string {
  return text
    .split(/\n+|(?<=[.!?])(?=[A-ZÀ-Ý])/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");
}

function toList(text: string): string {
  const items: string[] = [];
  for (const chunk of text.split(/;|\n+|(?<=[a-zà-ÿ)]\.)\s+(?=[A-ZÀ-Ý])/)) {
    for (const piece of splitGlued(chunk)) {
      const item = piece.trim();
      if (!item) continue;
      // Une numérotation isolée ("A.", "3.") va avec l'élément qui la suit.
      if (items.length && items[items.length - 1].length <= 3) items[items.length - 1] += ` ${item}`;
      else items.push(item);
    }
  }
  if (items.length <= 1) return toParagraphs(text);
  return `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
}

function formatPlainBody(text: string): string {
  const sections: { label: string | null; content: string }[] = [];
  let label: string | null = null;
  let last = 0;
  for (const m of text.matchAll(LABEL_RE)) {
    sections.push({ label, content: text.slice(last, m.index) });
    label = m[1];
    last = m.index + m[0].length;
  }
  sections.push({ label, content: text.slice(last) });

  if (sections.length === 1) return toParagraphs(text);

  let html = "";
  let fieldLines: string[] = [];
  const flushFields = () => {
    if (fieldLines.length) html += `<p>${fieldLines.join("<br>")}</p>`;
    fieldLines = [];
  };

  for (const { label: l, content } of sections) {
    const value = content.trim();
    if (l && FIELD_LABELS.includes(l)) {
      if (value) fieldLines.push(`<strong>${escapeHtml(l)} :</strong> ${escapeHtml(value)}`);
      continue;
    }
    flushFields();
    if (!l) {
      // Texte avant la première rubrique : souvent l'intitulé du poste.
      if (value) html += value.length <= 150 ? `<p><strong>${escapeHtml(value)}</strong></p>` : toParagraphs(value);
      continue;
    }
    html += `<p class="sala-job-body-heading"><strong>${escapeHtml(l)}${l === "Comment postuler" ? " ?" : ""}</strong></p>`;
    if (value) html += LIST_LABELS.includes(l) ? toList(value) : toParagraphs(value);
  }
  flushFields();
  return html;
}

/** Corps d'offre prêt à être assaini (DOMPurify) puis injecté dans la page. */
export function formatJobBody(body: string): string {
  const text = body.trim();
  if (!text || HTML_TAG_RE.test(text)) return text;
  return formatPlainBody(text);
}
