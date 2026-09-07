// src/hooks/useJobs.ts
// Écoute en temps réel de la collection Firestore "emplois".
// NB : pas de orderBy() — Firestore exclurait silencieusement toute offre
// sans champ "timestamp" au lieu de simplement la trier en dernier. Le tri se
// fait donc côté client, en tolérant les offres sans timestamp.

"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job, JobDoc } from "@/types/job";

interface UseJobsResult {
  jobs: Job[];
  loading: boolean;
  error: string | null;
}

/** Offres actives (visibles et non expirées), triées de la plus récente à la plus ancienne. */
export function useActiveJobs(): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "emplois"),
      (snapshot) => {
        const now = new Date();
        const eligible: Job[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as JobDoc;
          const deadlineDate = data.deadline?.toDate ? data.deadline.toDate() : null;
          if (data.visibility !== false && (!deadlineDate || deadlineDate > now)) {
            eligible.push({ id: docSnap.id, ...data, deadlineDate });
          }
        });

        eligible.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));

        setJobs(eligible);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Erreur chargement offres :", err);
        setError("Impossible de charger les offres pour le moment.");
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { jobs, loading, error };
}

interface UseJobResult {
  job: Job | null;
  loading: boolean;
  notFound: boolean;
}

/** Récupère une offre unique par son id (page de détail). */
export function useJob(jobId: string | null): UseJobResult {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    getDoc(doc(db, "emplois", jobId))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = snap.data() as JobDoc;
        const deadlineDate = data.deadline?.toDate ? data.deadline.toDate() : null;
        setJob({ id: snap.id, ...data, deadlineDate });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur en récupérant l'offre :", err);
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  return { job, loading, notFound };
}
