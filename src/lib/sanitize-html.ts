// src/lib/sanitize-html.ts
// Nettoyage du HTML affiché par les composants du site (navigateur), avec
// DOMPurify.
//
// Pourquoi pas isomorphic-dompurify : il charge jsdom côté serveur, et jsdom
// ne se charge pas sur les serveurs Vercel (bibliothèque au format ES module
// appelée par require()) - la page de détail d'offre, rendue côté serveur,
// répondait 500. Côté serveur, sans navigateur, DOMPurify renverrait le HTML
// tel quel : on n'y renvoie donc rien. Les contenus du site sont chargés
// dans le navigateur (Firestore), donc il n'y a rien à afficher à cette étape.
// Pour le HTML traité côté serveur (collecteurs, API), voir server-sanitize.ts.

import DOMPurify, { type Config } from "dompurify";

export function sanitizeHtml(html: string, config?: Config): string {
  if (typeof window === "undefined") return "";
  return DOMPurify.sanitize(html, { ...config, RETURN_TRUSTED_TYPE: false }) as string;
}
