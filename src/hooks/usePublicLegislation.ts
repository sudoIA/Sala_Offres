// src/hooks/usePublicLegislation.ts
// Fiches Droit du Travail pour la page publique : Firestore en priorité,
// repli sur le guide intégré si la collection est vide/inaccessible.

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { initialLegislationTopics } from "@/lib/legislation-content";
import type { LegislationDoc, LegislationFiche } from "@/types/legislation";

export function usePublicLegislation() {
  const [topics, setTopics] = useState<LegislationFiche[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "legislation"), orderBy("order", "asc")));
        if (!cancelled) {
          setTopics(snap.empty ? initialLegislationTopics : snap.docs.map((d) => ({ id: d.id, ...(d.data() as LegislationDoc) })));
        }
      } catch (e) {
        console.warn("Firestore 'legislation' vide ou inaccessible, utilisation du contenu intégré.", e);
        if (!cancelled) setTopics(initialLegislationTopics);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { topics, loading };
}
