// src/hooks/useImportRuns.ts
// Historique des exécutions de la tâche planifiée de collecte (voir
// src/app/api/cron/collect-jobs/route.ts) — écrit par le SDK Admin côté
// serveur, seulement lu ici pour suivi dans l'écran admin "Imports".

"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ImportSourceKey } from "@/lib/import-sources";

export interface ImportRunSourceResult {
  source: ImportSourceKey;
  created: number;
  updated: number;
  total: number;
  error: string | null;
}

export interface ImportRun {
  id: string;
  ranAt: Date | null;
  results: ImportRunSourceResult[];
}

export function useImportRuns(max = 10) {
  const [runs, setRuns] = useState<ImportRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "import_runs"), orderBy("ranAt", "desc"), limit(max));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setRuns(
          snapshot.docs.map((d) => {
            const data = d.data();
            const ranAt = data.ranAt instanceof Timestamp ? data.ranAt.toDate() : null;
            return { id: d.id, ranAt, results: (data.results as ImportRunSourceResult[]) || [] };
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error("Erreur chargement de l'historique des collectes :", err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [max]);

  return { runs, loading };
}
