// src/types/event.ts
// Forme d'un document de la collection Firestore "events" — alimentée par
// l'app mobile Sala et le back-office web. Les noms de champs (body, host,
// site, deadline...) reprennent exactement ceux déjà utilisés par l'app
// mobile pour rester compatibles avec ses données existantes.

import type { Timestamp } from "firebase/firestore";

export interface EventDoc {
  title?: string;
  resume?: string; // court résumé en texte brut, affiché sur la carte de la liste
  body?: string; // description complète (peut contenir des balises HTML simples : <b>, <br>...), affichée au clic
  host?: string; // organisateur
  city?: string;
  site?: string; // lien externe pour en savoir plus / s'inscrire (ex : groupe WhatsApp)
  image?: string; // optionnel — pas toujours une URL exploitable
  deadline?: Timestamp; // date et heure de l'événement
  deadline2?: Timestamp; // date et heure de fin (optionnel)
  timestamp?: Timestamp; // date de publication
  visibility?: boolean;
}

/** Événement enrichi côté client avec ses dates déjà converties en `Date`. */
export interface SalaEvent extends EventDoc {
  id: string;
  deadlineDate: Date | null;
  deadline2Date: Date | null;
}

export interface Registration {
  name?: string;
  email?: string;
  phone?: string;
  eventId?: string;
}
