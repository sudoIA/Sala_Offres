// src/lib/event-helpers.ts
// Tri des événements par date de début (deadlineDate), les événements sans
// date exploitable étant affichés en dernier plutôt qu'exclus.

import { findStorageFileUrl } from "@/lib/storage-lookup";
import type { EventDoc, SalaEvent } from "@/types/event";

/**
 * Résout le champ "image" d'un événement en URL publique affichable.
 * Accepte une URL déjà complète, ou un mot-clé à retrouver parmi les
 * fichiers du dossier Storage "events/" (voir findStorageFileUrl).
 */
export async function resolveEventImageUrl(image?: string | null): Promise<string | null> {
  const trimmed = (image || "").trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return findStorageFileUrl("events", trimmed);
}

export function sortEventsByDate(events: SalaEvent[]): SalaEvent[] {
  return [...events].sort((a, b) => {
    const ta = a.deadlineDate ? a.deadlineDate.getTime() : Number.MAX_SAFE_INTEGER;
    const tb = b.deadlineDate ? b.deadlineDate.getTime() : Number.MAX_SAFE_INTEGER;
    return ta - tb;
  });
}

/**
 * Résumé à afficher sur la carte de la liste : le champ "resume" s'il a été
 * renseigné, sinon un repli en texte brut (balises HTML retirées) tronqué
 * proprement — jamais le HTML de "body" coupé à mi-balise, qui rendait
 * l'affichage sale.
 */
export function eventCardSummary(evt: Pick<SalaEvent, "resume" | "body">, max = 160): string {
  const resume = (evt.resume || "").trim();
  if (resume) return resume;

  const plain = (evt.body || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "";
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}…` : plain;
}

/** Construit un objet SalaEvent à partir d'un document Firestore brut. */
export function toSalaEvent(id: string, data: EventDoc): SalaEvent {
  return {
    id,
    ...data,
    deadlineDate: data.deadline?.toDate ? data.deadline.toDate() : null,
    deadline2Date: data.deadline2?.toDate ? data.deadline2.toDate() : null,
  };
}
