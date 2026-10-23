// src/lib/collectors/shared.ts
// Petits utilitaires réutilisés par tous les collecteurs de sources externes.

import DOMPurify from "isomorphic-dompurify";

/** Balises de mise en forme conservées dans la description importée. */
const KEPT_TAGS = ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li"];

/**
 * Nettoie le HTML d'une description source : ne garde que la mise en forme
 * simple (paragraphes, gras, listes), sans attributs ni liens, images ou
 * scripts. Remplace l'ancien `.text()` qui collait toutes les rubriques et
 * les éléments de liste en un seul bloc illisible.
 */
export function cleanSourceHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: KEPT_TAGS, ALLOWED_ATTR: [] })
    .replace(/&nbsp;| /g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*(?:<br>\s*)*(?=<\/(?:p|li)>)/g, "")
    .replace(/<(p|li|strong|b)>\s*<\/\1>/g, "")
    .replace(/>\s+</g, "><")
    .trim();
}

export const IMPORT_USER_AGENT ="Mozilla/5.0 (compatible; SalaBot/1.0; +https://www.ongsala.com)";

// TLD limité à une liste connue : évite d'avaler le mot suivant quand le texte
// source colle une adresse e-mail au mot d'après sans espace (ex: le HTML
// concatène "...@ubagroup.comExclusif" sans séparateur).
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.(?:com|org|net|int|edu|gov|africa|info|eu|cg)/i;

export function extractEmail(text: string): string | undefined {
  const match = text.match(EMAIL_RE);
  return match ? match[0] : undefined;
}

/** Beaucoup de titres d'offres suivent le patron "Entreprise recrute/recherche
 * un(e) Poste" — fiable à extraire même quand aucun champ "Entreprise :"
 * explicite n'est présent dans le résumé/la description. */
export function extractCompanyFromTitle(title: string): string | undefined {
  const match = title.match(/^(.*?)\s+(?:recrute|recherche)\b/i);
  return match ? match[1].trim() : undefined;
}

/** Convertit "JJ/MM/AAAA" ou "JJ-MM-AAAA" en "AAAA-MM-JJ" (ISO). */
export function parseFrDate(text: string | undefined | null): string | undefined {
  if (!text) return undefined;
  const match = text.trim().match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!match) return undefined;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
