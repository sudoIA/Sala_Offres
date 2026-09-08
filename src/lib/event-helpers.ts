// src/lib/event-helpers.ts
// Tri résilient des événements par date de début. On essaie d'abord isoDate
// (format ISO fiable, saisi via un champ datetime-local), puis la date
// affichée en repli — sans jamais exclure un événement qui n'aurait ni l'un
// ni l'autre. C'est le même choix que pour les offres dans useJobs.ts : un
// orderBy() Firestore exclurait silencieusement de la liste tout document où
// le champ trié est absent (ex : événements créés avant la migration).

import type { SalaEvent } from "@/types/event";

function eventSortValue(evt: SalaEvent): number {
  if (evt.isoDate) {
    const t = new Date(evt.isoDate).getTime();
    if (!Number.isNaN(t)) return t;
  }
  if (evt.date) {
    const t = new Date(evt.date).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return Number.MAX_SAFE_INTEGER; // pas de date exploitable : affiché en dernier, jamais masqué
}

export function sortEventsByDate(events: SalaEvent[]): SalaEvent[] {
  return [...events].sort((a, b) => eventSortValue(a) - eventSortValue(b));
}
