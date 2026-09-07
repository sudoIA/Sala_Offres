// src/hooks/useAdminJobs.ts
// Toutes les offres (visibles ou non), pour le back-office. Voir useJobs.ts
// pour l'équivalent public (filtré + trié pour l'affichage).

"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job, JobDoc } from "@/types/job";

export function useAdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "emplois"),
      (snapshot) => {
        const list: Job[] = snapshot.docs.map((d) => {
          const data = d.data() as JobDoc;
          return { id: d.id, ...data, deadlineDate: data.deadline?.toDate ? data.deadline.toDate() : null };
        });
        list.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
        setJobs(list);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur chargement offres (admin) :", err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { jobs, loading };
}
