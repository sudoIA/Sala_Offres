// src/hooks/useEvents.ts
// Événements Sala (collection "evenements"), triés par date de début.

"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EventDoc, SalaEvent } from "@/types/event";

export function useEvents() {
  const [events, setEvents] = useState<SalaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "evenements"), orderBy("isoDate", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setEvents(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as EventDoc) })));
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
