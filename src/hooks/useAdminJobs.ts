// src/hooks/useAdminJobs.ts
// Toutes les offres (visibles ou non), pour le back-office. Voir useJobs.ts
// pour l'équivalent public (filtré + trié pour l'affichage).

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot, query, Timestamp, where } from "firebase/firestore";
import { DEDUPE_WINDOW_DAYS } from "@/lib/job-import-helpers";
import { db } from "@/lib/firebase";
import type { Job, JobDoc } from "@/types/job";

function toJob(id: string, data: JobDoc): Job {
  return { id, ...data, deadlineDate: data.deadline?.toDate ? data.deadline.toDate() : null };
}

/**
 * Lecture ponctuelle (pas d'abonnement temps réel) des offres publiées
 * récemment — sert au dédoublonnage au moment de lancer une collecte (voir
 * admin/imports). Limitée aux DEDUPE_WINDOW_DAYS derniers jours : une offre
 * importée aujourd'hui ne peut pas doublonner une annonce vieille d'un an, et
 * relire tout l'historique (plus de 2 600 offres) à chaque collecte coûtait
 * autant de lectures facturées.
 */
export async function fetchRecentJobsOnce(): Promise<Job[]> {
  const since = Timestamp.fromMillis(Date.now() - DEDUPE_WINDOW_DAYS * 24 * 3600 * 1000);
  const snapshot = await getDocs(query(collection(db, "emplois"), where("timestamp", ">", since)));
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
