// src/hooks/usePublicEvents.ts
// Événements à venir pour la page publique : Firestore en priorité, repli
// résilient sur les événements de base Sala si la collection est vide.

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { baselineEvenements } from "@/lib/evenements-content";
import { sortEventsByDate, toSalaEvent } from "@/lib/event-helpers";
import type { EventDoc, SalaEvent } from "@/types/event";

export function usePublicEvents() {
  const [events, setEvents] = useState<SalaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Pas d'orderBy() ni de where() ici : Firestore exclurait
        // silencieusement tout événement sans champ "deadline", ce qui
        // ferait passer une collection non vide pour vide. On filtre donc
        // côté client (visibilité + événements à venir uniquement).
        const snap = await getDocs(collection(db, "events"));
        if (cancelled) return;

        if (snap.empty) {
          setEvents(baselineEvenements);
          return;
        }

        const now = new Date();
        const upcoming = snap.docs
          .map((d) => toSalaEvent(d.id, d.data() as EventDoc))
          .filter((evt) => evt.visibility !== false && (!evt.deadlineDate || evt.deadlineDate > now));

        setEvents(sortEventsByDate(upcoming));
      } catch (err) {
        console.warn("Firestore collection 'events' non disponible, utilisation des événements de base Sala :", err);
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
