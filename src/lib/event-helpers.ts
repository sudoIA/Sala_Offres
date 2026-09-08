// src/lib/event-helpers.ts
// Tri des événements par date de début (deadlineDate), les événements sans
// date exploitable étant affichés en dernier plutôt qu'exclus.

import { STORAGE_BUCKET } from "@/lib/firebase";
import type { EventDoc, SalaEvent } from "@/types/event";

/**
 * Résout le champ "image" d'un événement (souvent un simple nom de fichier
 * du dossier "events/" sur Firebase Storage, ex : "CED.jpg") en URL
 * publique affichable. Accepte aussi une URL déjà complète.
 */
export function getEventImageUrl(image?: string | null): string | null {
  const trimmed = (image || "").trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const path = `events/${trimmed}`;
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(path)}?alt=media`;
}

export function sortEventsByDate(events: SalaEvent[]): SalaEvent[] {
  return [...events].sort((a, b) => {
    const ta = a.deadlineDate ? a.deadlineDate.getTime() : Number.MAX_SAFE_INTEGER;
    const tb = b.deadlineDate ? b.deadlineDate.getTime() : Number.MAX_SAFE_INTEGER;
    return ta - tb;
  });
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
