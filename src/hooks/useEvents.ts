// src/hooks/useEvents.ts
// Événements Sala (collection "evenements"), triés par date de début.

"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sortEventsByDate } from "@/lib/event-helpers";
import type { EventDoc, SalaEvent } from "@/types/event";

export function useEvents() {
  const [events, setEvents] = useState<SalaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pas d'orderBy() ici : Firestore exclurait silencieusement tout
    // événement sans champ "isoDate" (ex : créé avant la migration). Le tri
    // se fait donc côté client, en tolérant les événements sans date.
    const unsubscribe = onSnapshot(
      collection(db, "evenements"),
      (snapshot) => {
        const events = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as EventDoc) }));
        setEvents(sortEventsByDate(events));
        setLoading(false);
      },
      (err) => {
        console.error("Erreur chargement événements :", err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { events, loading };
}
