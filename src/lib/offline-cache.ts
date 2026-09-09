// src/lib/offline-cache.ts
// Sauvegarde locale (localStorage) des dernières offres chargées, pour
// qu'elles restent consultables même sans connexion internet. Le "mode
// hors-ligne" (interrupteur dans la sidebar) active ou désactive cette
// sauvegarde ; par défaut il est actif.

import type { Job } from "@/types/job";

const ENABLED_KEY = "sala_offline_mode";
const JOBS_CACHE_KEY = "sala_offline_jobs";

export function isOfflineModeEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(ENABLED_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function setOfflineModeEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
    if (!enabled) window.localStorage.removeItem(JOBS_CACHE_KEY);
  } catch {
    // Stockage indisponible (navigation privée, quota...) : on ignore.
  }
}

interface CacheableJob extends Omit<Job, "deadlineDate" | "deadline" | "timestamp"> {
  deadlineDate: string | null;
}

interface JobsSnapshot {
  savedAt: string;
  jobs: CacheableJob[];
}

/** Enregistre une copie locale des offres actives (si le mode hors-ligne est actif). */
export function saveJobsSnapshot(jobs: Job[]): void {
  if (typeof window === "undefined" || !isOfflineModeEnabled()) return;
  try {
    const cacheable: CacheableJob[] = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      city: job.city,
      contract: job.contract,
      body: job.body,
      languages: job.languages,
      email: job.email,
      site: job.site,
      tel: job.tel,
      competences: job.competences,
      visibility: job.visibility,
      deadlineDate: job.deadlineDate ? job.deadlineDate.toISOString() : null,
    }));
    const payload: JobsSnapshot = { savedAt: new Date().toISOString(), jobs: cacheable };
    window.localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Quota dépassé ou stockage indisponible : on ignore silencieusement.
  }
}

/** Relit la dernière copie locale des offres, si elle existe. */
export function loadJobsSnapshot(): { savedAt: Date; jobs: Job[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(JOBS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JobsSnapshot;
    return {
      savedAt: new Date(parsed.savedAt),
      jobs: parsed.jobs.map((j) => ({ ...j, deadlineDate: j.deadlineDate ? new Date(j.deadlineDate) : null })),
    };
  } catch {
    return null;
  }
}
