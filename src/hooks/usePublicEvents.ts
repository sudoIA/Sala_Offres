// src/hooks/usePublicEvents.ts
// Événements à venir pour la page publique : Firestore en priorité, repli
// résilient sur la dernière copie locale (mode hors-ligne) puis sur les
// événements de base Sala si rien n'est disponible.

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { baselineEvenements } from "@/lib/evenements-content";
import { sortEventsByDate, toSalaEvent } from "@/lib/event-helpers";
import { loadSnapshot, saveSnapshot } from "@/lib/offline-cache";
import type { EventDoc, SalaEvent } from "@/types/event";

const CACHE_KEY = "events";
const FETCH_TIMEOUT_MS = 8000;

interface CacheableEvent extends Omit<SalaEvent, "deadlineDate" | "deadline2Date" | "deadline" | "deadline2" | "timestamp"> {
  deadlineDate: string | null;
  deadline2Date: string | null;
}

function toCacheable(evt: SalaEvent): CacheableEvent {
  return {
    id: evt.id,
    title: evt.title,
    resume: evt.resume,
    body: evt.body,
    host: evt.host,
    city: evt.city,
    site: evt.site,
    image: evt.image,
    visibility: evt.visibility,
    deadlineDate: evt.deadlineDate ? evt.deadlineDate.toISOString() : null,
    deadline2Date: evt.deadline2Date ? evt.deadline2Date.toISOString() : null,
  };
}

function fromCacheable(evt: CacheableEvent): SalaEvent {
  return {
    ...evt,
    deadlineDate: evt.deadlineDate ? new Date(evt.deadlineDate) : null,
    deadline2Date: evt.deadline2Date ? new Date(evt.deadline2Date) : null,
  };
}

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

export function usePublicEvents() {
  const cached = typeof window !== "undefined" ? loadSnapshot<CacheableEvent[]>(CACHE_KEY) : null;
  const cachedEvents = cached && Array.isArray(cached.data) ? cached.data.map(fromCacheable) : null;
  const [events, setEvents] = useState<SalaEvent[]>(() => cachedEvents || []);
  const [loading, setLoading] = useState(!cachedEvents);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Pas d'orderBy() ni de where() ici : Firestore exclurait
        // silencieusement tout événement sans champ "deadline", ce qui
        // ferait passer une collection non vide pour vide. On filtre donc
        // côté client (visibilité + événements à venir uniquement).
        const snap = await Promise.race([getDocs(collection(db, "events")), timeout(FETCH_TIMEOUT_MS)]);
        if (cancelled) return;

        if (snap.empty) {
          setEvents(cachedEvents || baselineEvenements);
          return;
        }

        const now = new Date();
        const upcoming = snap.docs
          .map((d) => toSalaEvent(d.id, d.data() as EventDoc))
          .filter((evt) => evt.visibility !== false && (!evt.deadlineDate || evt.deadlineDate > now));

        const sorted = sortEventsByDate(upcoming);
        setEvents(sorted);
        saveSnapshot(CACHE_KEY, sorted.map(toCacheable));
      } catch (err) {
        console.warn("Firestore collection 'events' indisponible, utilisation du repli :", err);
        if (!cancelled) setEvents(cachedEvents || baselineEvenements);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events, loading };
}
