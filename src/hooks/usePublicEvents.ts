// src/hooks/usePublicEvents.ts
// Événements pour la page publique : Firestore en priorité, repli résilient
// sur les événements de base Sala si la collection est vide/inaccessible.

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { baselineEvenements } from "@/lib/evenements-content";
import { sortEventsByDate } from "@/lib/event-helpers";
import type { EventDoc, SalaEvent } from "@/types/event";

export function usePublicEvents() {
  const [events, setEvents] = useState<SalaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Pas d'orderBy() ici : Firestore exclurait silencieusement tout
        // événement sans champ "date" (ex : créé avant la migration), ce qui
        // ferait passer une collection non vide pour vide et basculerait à
        // tort sur les événements de secours ci-dessous.
        const snap = await getDocs(collection(db, "evenements"));
        if (!cancelled) {
          setEvents(
            snap.empty
              ? baselineEvenements
              : sortEventsByDate(snap.docs.map((d) => ({ id: d.id, ...(d.data() as EventDoc) })))
          );
        }
      } catch (err) {
        console.warn("Firestore collection 'evenements' non disponible, utilisation des événements de base Sala :", err);
        if (!cancelled) setEvents(baselineEvenements);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { events, loading };
}
