// src/lib/event-helpers.ts
// Tri des événements par date de début (deadlineDate), les événements sans
// date exploitable étant affichés en dernier plutôt qu'exclus.

import { getDownloadURL, listAll, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";
import type { EventDoc, SalaEvent } from "@/types/event";

// Le champ "image" d'un événement n'est pas un nom de fichier exact : c'est
// un mot-clé partiel (ex : "eco" pour un fichier nommé quelque chose comme
// "ecobank-fintech.jpg") que l'app mobile retrouve en cherchant, dans le
// dossier Storage "events/", un fichier dont le nom le contient. On liste ce
// dossier une seule fois (mis en cache pour la session) puis on reproduit la
// même recherche côté web.
let eventFilesPromise: Promise<string[]> | null = null;

function listEventStorageFiles(): Promise<string[]> {
  if (!eventFilesPromise) {
    eventFilesPromise = listAll(ref(storage, "events"))
      .then((res) => res.items.map((item) => item.name))
      .catch((err) => {
        console.error("Erreur listage des images d'événements (Storage) :", err);
        eventFilesPromise = null; // permet de réessayer au prochain appel
        return [];
      });
  }
  return eventFilesPromise;
}

/**
 * Résout le champ "image" d'un événement en URL publique affichable.
 * Accepte une URL déjà complète, ou un mot-clé à retrouver parmi les
 * fichiers du dossier Storage "events/".
 */
export async function resolveEventImageUrl(image?: string | null): Promise<string | null> {
  const trimmed = (image || "").trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const files = await listEventStorageFiles();
  const needle = trimmed.toLowerCase();
  const match = files.find((name) => name.toLowerCase().includes(needle));
  if (!match) return null;

  try {
    return await getDownloadURL(ref(storage, `events/${match}`));
  } catch (err) {
    console.error("Erreur récupération de l'URL d'image d'événement :", err);
    return null;
  }
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
