// src/lib/legislation-mobile.ts
// Champs de la collection "legislation" destinés à l'application mobile.
// L'app lisait "droit_du_travail" avec trois champs : title, description
// (HTML complet) et readingTime (minutes, en texte). On les maintient aussi
// dans "legislation" à chaque enregistrement depuis l'admin : l'app peut ainsi
// basculer en changeant seulement le nom de la collection.

import type { LegislationDoc } from "@/types/legislation";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** HTML complet d'une fiche (introduction, contenu, FAQ, source) pour l'app. */
export function buildMobileDescription(fiche: LegislationDoc): string {
  const parts: string[] = [];
  if (fiche.intro?.trim()) parts.push(`<p><strong>${escapeHtml(fiche.intro.trim())}</strong></p>`);
  if (fiche.bodyHtml?.trim()) parts.push(fiche.bodyHtml.trim());
  if (fiche.faqQuestion?.trim()) {
    parts.push(`<p><strong>${escapeHtml(fiche.faqQuestion.trim())}</strong></p>`);
    if (fiche.faqAnswer?.trim()) parts.push(`<p>${escapeHtml(fiche.faqAnswer.trim())}</p>`);
  }
  if (fiche.sourceUrl?.trim()) {
    const label = escapeHtml(fiche.sourceLabel?.trim() || "Source");
    parts.push(`<p>Source : <a href="${fiche.sourceUrl.trim().replace(/"/g, "%22")}">${label}</a></p>`);
  }
  return parts.join("\n");
}

/** Temps de lecture estimé (200 mots/minute, au moins 1), en texte comme dans l'app. */
export function estimateReadingTime(html: string): string {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return String(Math.max(1, Math.round(words / 200)));
}

/** Ajoute description et readingTime à une fiche avant écriture dans Firestore. */
export function withMobileFields<T extends LegislationDoc>(fiche: T): T & { description: string; readingTime: string } {
  const description = buildMobileDescription(fiche);
  return { ...fiche, description, readingTime: estimateReadingTime(description) };
}
