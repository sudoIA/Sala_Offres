// src/types/news.ts
// Article "News Sala" (collection Firestore "news"), publié depuis
// Admin > Actualités et affiché sur la page publique /actualites.

import type { Timestamp } from "firebase/firestore";

export interface NewsDoc {
  title?: string;
  /** Résumé court affiché sur la carte de la liste. */
  summary?: string;
  /** Contenu complet (HTML simple autorisé, assaini à l'affichage). */
  body?: string;
  /** URL d'une image d'illustration (optionnelle). */
  image?: string | null;
  publishedAt?: Timestamp;
  visibility?: boolean;
}

export interface NewsArticle extends NewsDoc {
  id: string;
  publishedDate: Date | null;
}
