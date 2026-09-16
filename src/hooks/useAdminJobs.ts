// src/hooks/useAdminJobs.ts
// Toutes les offres (visibles ou non), pour le back-office. Voir useJobs.ts
// pour l'équivalent public (filtré + trié pour l'affichage).

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job, JobDoc } from "@/types/job";

function toJob(id: string, data: JobDoc): Job {
  return { id, ...data, deadlineDate: data.deadline?.toDate ? data.deadline.toDate() : null };
}

/**
 * Lecture ponctuelle (pas d'abonnement temps réel) de toutes les offres —
 * utile pour un besoin ciblé et rare (ex: dédoublonnage au moment de lancer
 * une collecte, voir admin/imports) sans maintenir en permanence un flux
 * temps réel sur des milliers de documents juste "au cas où".
 */
export async function fetchAllJobsOnce(): Promise<Job[]> {
  const snapshot = await getDocs(collection(db, "emplois"));
  return snapshot.docs.map((d) => toJob(d.id, d.data() as JobDoc));
}

export function useAdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "emplois"),
      (snapshot) => {
        const list: Job[] = snapshot.docs.map((d) => toJob(d.id, d.data() as JobDoc));
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
