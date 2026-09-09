// src/hooks/useJobs.ts
// Écoute en temps réel de la collection Firestore "emplois".
// NB : pas de orderBy() — Firestore exclurait silencieusement toute offre
// sans champ "timestamp" au lieu de simplement la trier en dernier. Le tri se
// fait donc côté client, en tolérant les offres sans timestamp.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { collection, doc, getDoc, getDocsFromServer, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { loadJobsSnapshot, saveJobsSnapshot } from "@/lib/offline-cache";
import type { Job, JobDoc } from "@/types/job";

interface UseJobsResult {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  offline: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

function docsToJobs(docs: { id: string; data: () => JobDoc }[]): Job[] {
  const now = new Date();
  const eligible: Job[] = [];
  docs.forEach((docSnap) => {
    const data = docSnap.data();
    const deadlineDate = data.deadline?.toDate ? data.deadline.toDate() : null;
    if (data.visibility !== false && (!deadlineDate || deadlineDate > now)) {
      eligible.push({ id: docSnap.id, ...data, deadlineDate });
    }
  });
  eligible.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
  return eligible;
}

/** Offres actives (visibles et non expirées), triées de la plus récente à la plus ancienne. */
export function useActiveJobs(): UseJobsResult {
  // Pré-remplissage depuis la dernière copie locale (mode hors-ligne) pour
  // éviter un écran vide le temps que Firestore réponde, et pour rester
  // consultable si l'appareil est réellement hors-ligne. Initialiseurs
  // paresseux : ne lisent le localStorage qu'une seule fois, au montage.
  const [jobs, setJobs] = useState<Job[]>(() => loadJobsSnapshot()?.jobs || []);
  const [loading, setLoading] = useState(() => !loadJobsSnapshot());
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => loadJobsSnapshot()?.savedAt || null);
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const jobsRef = useRef(jobs);
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "emplois"),
      (snapshot) => {
        const eligible = docsToJobs(snapshot.docs);
        setJobs(eligible);
        setLoading(false);
        setError(null);
        setOffline(false);
        const now = new Date();
        setLastUpdated(now);
        saveJobsSnapshot(eligible);
      },
      (err) => {
        console.error("Erreur chargement offres :", err);
        setLoading(false);
        if (jobsRef.current.length > 0) {
          // On a une copie locale à afficher malgré l'absence de réseau.
          setOffline(true);
        } else {
          setError("Impossible de charger les offres pour le moment.");
        }
      }
    );
    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const snapshot = await getDocsFromServer(collection(db, "emplois"));
      const eligible = docsToJobs(snapshot.docs);
      setJobs(eligible);
      setError(null);
      setOffline(false);
      setLastUpdated(new Date());
      saveJobsSnapshot(eligible);
    } catch (err) {
      console.warn("Actualisation impossible (hors-ligne ?) :", err);
      setOffline(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { jobs, loading, error, lastUpdated, offline, refreshing, refresh };
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
